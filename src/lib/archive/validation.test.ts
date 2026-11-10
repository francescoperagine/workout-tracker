import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exerciseHistory } from './progress';
import { withStarterRoutines } from './routines';
import { ArchiveError, emptyArchive, type Archive } from './types';
import { validateArchive } from './validation';

function sample(): Archive {
  const a = withStarterRoutines(emptyArchive());
  return {
    ...a,
    revision: 7,
    catalog: {
      'custom-crunch-ai-cavi': { id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi', muscles: { primary: ['abs'], secondary: [] }, variantOf: null },
      'custom-squat-largo': { id: 'custom-squat-largo', name: 'Squat largo', muscles: { primary: ['quads', 'glutes'], secondary: ['adductors'] }, variantOf: 'squat-bilanciere' },
    },
    schedule: { mon: 'routine-a', thu: 'routine-b', sun: null },
    overrides: { '2026-10-08': null },
    sessions: [
      {
        id: 's1',
        date: '2026-10-05',
        routineId: 'routine-a',
        name: 'Scheda A',
        start: 1_790_000_000_000,
        end: 1_790_003_600_000,
        exercises: [
          {
            id: 'v1',
            exerciseId: 'leg-press',
            alternativeOf: 'squat-bilanciere',
            group: null,
            rest: 120,
            warmupRest: 60,
            notes: 'sedile 4',
            sets: [
              { id: 'r1', type: 'warmup', kg: 60, reps: 10, completedAt: 1_790_000_100_000 },
              { id: 'r2', type: 'normal', kg: 61.23496995, reps: 8, completedAt: 1_790_000_300_000 },
              { id: 'r3', type: 'normal', kg: null, reps: null, completedAt: null },
            ],
          },
        ],
      },
    ],
    settings: { weightUnit: 'lb', distanceUnit: 'ft', defaultRest: 75, sound: false, vibration: true },
  };
}

function withChange(change: (a: any) => void): unknown {
  const a = structuredClone(sample());
  change(a);
  return a;
}

describe('US-33 validazione dell’archivio v3', () => {
  it('un archivio valido passa identico, anche dopo JSON', () => {
    const a = sample();
    expect(validateArchive(JSON.parse(JSON.stringify(a)))).toEqual(a);
    expect(validateArchive(emptyArchive())).toEqual(emptyArchive());
  });

  it('le proprietà estranee vengono scartate (ricostruzione esplicita, come nel PoC)', () => {
    const v = validateArchive(withChange((a) => {
      a.exportedAt = '2026-10-10T10:00:00Z';
      a.sessions[0].exercises[0].sets[0].html = 'proprietà estranea';
      a.settings.theme = 'dark';
    }));
    expect(v).not.toHaveProperty('exportedAt');
    expect(v.sessions[0].exercises[0].sets[0]).not.toHaveProperty('html');
    expect(v.settings).not.toHaveProperty('theme');
  });

  it.each([
    ['versione diversa', (a: any) => (a.version = 1)],
    ['revisione mancante', (a: any) => delete a.revision],
    ['data impossibile', (a: any) => (a.sessions[0].date = '2026-02-30')],
    ['data in altro formato', (a: any) => (a.sessions[0].date = '05/10/2026')],
    ['id di sessione duplicato', (a: any) => a.sessions.push(structuredClone(a.sessions[0]))],
    ['id di serie duplicato', (a: any) => (a.sessions[0].exercises[0].sets[1].id = 'r1')],
    ['peso negativo', (a: any) => (a.sessions[0].exercises[0].sets[0].kg = -5)],
    ['peso oltre 10000', (a: any) => (a.sessions[0].exercises[0].sets[0].kg = 10001)],
    ['peso come testo', (a: any) => (a.sessions[0].exercises[0].sets[0].kg = '60')],
    ['ripetizioni decimali', (a: any) => (a.sessions[0].exercises[0].sets[0].reps = 8.5)],
    ['tipo di serie sconosciuto', (a: any) => (a.sessions[0].exercises[0].sets[0].type = 'super')],
    ['fine prima dell’inizio', (a: any) => (a.sessions[0].end = a.sessions[0].start - 1)],
    ['nota oltre 1000 caratteri', (a: any) => (a.sessions[0].exercises[0].notes = 'x'.repeat(1001))],
    ['nome sessione oltre 120 caratteri', (a: any) => (a.sessions[0].name = 'x'.repeat(121))],
    ['più di 100 serie', (a: any) => (a.sessions[0].exercises[0].sets = Array.from({ length: 101 }, (_, i) => ({ id: `r${i}`, type: 'normal', kg: null, reps: null, completedAt: null })))],
    ['più di 100 esercizi', (a: any) => (a.sessions[0].exercises = Array.from({ length: 101 }, (_, i) => ({ ...a.sessions[0].exercises[0], id: `v${i}` })))],
    ['recupero oltre un’ora', (a: any) => (a.routines[0].exercises[0].rest = 3601)],
    ['intervallo di carico rovesciato', (a: any) => Object.assign(a.routines[0].exercises[0], { loadMin: 50, loadMax: 45 })],
    ['scheda senza nome', (a: any) => (a.routines[0].name = '  ')],
    ['giorno inesistente', (a: any) => (a.schedule.monday = 'routine-a')],
    ['eccezione con data non valida', (a: any) => (a.overrides['2026-13-01'] = null)],
    ['unità di peso sconosciuta', (a: any) => (a.settings.weightUnit = 'stone')],
    ['catalogo con chiave incoerente', (a: any) => (a.catalog['altro-id'] = { id: 'custom-x', name: 'X' })],
    ['muscolo sconosciuto', (a: any) => (a.catalog['custom-crunch-ai-cavi'].muscles.primary = ['core'])],
    ['muscolo ripetuto', (a: any) => (a.catalog['custom-crunch-ai-cavi'].muscles.secondary = ['chest', 'chest'])],
    ['muscolo sia principale sia secondario', (a: any) => (a.catalog['custom-crunch-ai-cavi'].muscles.secondary = ['abs'])],
    ['muscoli non in un elenco', (a: any) => (a.catalog['custom-crunch-ai-cavi'].muscles.primary = 'abs')],
    ['esercizio di sessione v3 senza alternativeOf', (a: any) => delete a.sessions[0].exercises[0].alternativeOf],
    ['sessioni non in un elenco', (a: any) => (a.sessions = {})],
  ])('rifiuta: %s', (_, change) => {
    expect(() => validateArchive(withChange(change))).toThrow(ArchiveError);
  });

  it('rifiuta valori che non sono un archivio', () => {
    for (const value of [null, 42, 'testo', [], { version: 2 }]) expect(() => validateArchive(value)).toThrow(ArchiveError);
  });

  it('i riferimenti sconosciuti non rendono illeggibile il diario', () => {
    const v = validateArchive(withChange((a) => {
      a.sessions[0].routineId = 'scheda-eliminata';
      a.sessions[0].exercises[0].exerciseId = 'esercizio-futuro';
      a.schedule.tue = 'scheda-eliminata';
    }));
    expect(v.sessions[0].routineId).toBe('scheda-eliminata');
  });
});

/** Lo stesso archivio scritto da una scheda con il codice v2 */
function asV2(a: Archive): any {
  const v2: any = structuredClone(a);
  v2.version = 2;
  for (const e of Object.values<any>(v2.catalog)) {
    delete e.muscles;
    delete e.variantOf;
  }
  for (const s of v2.sessions) for (const e of s.exercises) {
    e.variantOf = e.alternativeOf;
    delete e.alternativeOf;
  }
  return v2;
}

const fixture = JSON.parse(readFileSync(new URL('../../../tests/fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8'));

describe('muscle-volume, archivio v3 (ADR-009)', () => {
  it('un v2 diventa v3: alternativeOf da variantOf, personalizzati senza muscoli né esercizio di partenza', () => {
    const v = validateArchive(asV2(sample()));
    expect(v.version).toBe(3);
    expect(v.sessions[0].exercises[0].alternativeOf).toBe('squat-bilanciere');
    expect(v.sessions[0].exercises[0]).not.toHaveProperty('variantOf');
    expect(Object.values(v.catalog).map((e) => [e.muscles, e.variantOf])).toEqual([
      [{ primary: [], secondary: [] }, null],
      [{ primary: [], secondary: [] }, null],
    ]);
  });

  it.each([1, 4, undefined])('versione %s: formato non riconosciuto', (version) => {
    expect(() => validateArchive({ ...sample(), version })).toThrow('Formato dell’archivio non riconosciuto.');
  });

  it('il rematore al cavo basso tolto diventa il rematore seduto, con tutto il suo storico', () => {
    const v = validateArchive(fixture);
    expect(JSON.stringify(v)).not.toContain('rematore-al-cavo-basso');
    expect(exerciseHistory(v, 'rematore-seduto-al-cavo-basso')).toHaveLength(5);
    const a2b = v.routines.find((r) => r.name === 'Scheda A')!.exercises.find((e) => e.exerciseId === 'rematore-manubri-petto-su-panca-inclinata')!;
    expect(a2b.alternatives).toEqual(['rematore-seduto-al-cavo-basso']);
  });

  it('dopo il reindirizzamento niente doppioni né alternative di sé stesso; il personalizzato derivato segue', () => {
    const v = validateArchive(withChange((a) => {
      Object.assign(a.routines[0].exercises[0], { exerciseId: 'rematore-seduto-al-cavo-basso', alternatives: ['rematore-al-cavo-basso', 'rematore-seduto-al-cavo-basso'] });
      Object.assign(a.sessions[0].exercises[0], { exerciseId: 'rematore-al-cavo-basso', alternativeOf: 'rematore-seduto-al-cavo-basso' });
      a.catalog['custom-squat-largo'].variantOf = 'rematore-al-cavo-basso';
    }));
    expect(v.routines[0].exercises[0].alternatives).toEqual([]);
    expect(v.sessions[0].exercises[0]).toMatchObject({ exerciseId: 'rematore-seduto-al-cavo-basso', alternativeOf: null });
    expect(v.catalog['custom-squat-largo'].variantOf).toBe('rematore-seduto-al-cavo-basso');
  });

  it('idempotente: validare due volte non cambia nulla', () => {
    for (const x of [fixture, asV2(sample()), sample()]) expect(validateArchive(validateArchive(x))).toEqual(validateArchive(x));
  });
});
