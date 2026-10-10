import { describe, expect, it } from 'vitest';
import { withStarterRoutines } from './routines';
import { ArchiveError, emptyArchive, type Archive } from './types';
import { validateArchive } from './validation';

function sample(): Archive {
  const a = withStarterRoutines(emptyArchive());
  return {
    ...a,
    revision: 7,
    catalog: { 'custom-crunch-ai-cavi': { id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi' } },
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
            variantOf: 'squat-bilanciere',
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

describe('US-33 validazione dell’archivio v2', () => {
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
