import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { backupFileName, checkSize, exportArchive, mergeImport, previewImport, readBackup } from './backup';
import { ensureExercise } from './catalog';
import { ArchiveRepository } from './repository';
import { withStarterRoutines } from './routines';
import { ArchiveError, emptyArchive, type Archive, type Session } from './types';

const pocText = readFileSync(new URL('../../../tests/fixtures/synthetic-poc-backup.json', import.meta.url), 'utf8');

function session(id: string, date: string, extra: Partial<Session> = {}): Session {
  return { id, date, routineId: null, name: id, start: Date.parse(`${date}T10:00:00`), end: Date.parse(`${date}T11:00:00`), exercises: [], ...extra };
}

function local(): Archive {
  return {
    ...withStarterRoutines(emptyArchive()),
    revision: 12,
    schedule: { mon: 'routine-a' },
    overrides: { '2026-10-01': null },
    sessions: [session('s1', '2026-10-01', { name: 'locale' }), session('s2', '2026-10-03')],
  };
}

describe('US-32 esportazione v2', () => {
  it('produce un JSON reimportabile identico, con la data di esportazione', () => {
    const a = { ...local(), settings: { ...local().settings, weightUnit: 'lb' as const } };
    const text = exportArchive(a, new Date('2026-10-10T08:00:00Z'));
    expect(JSON.parse(text).exportedAt).toBe('2026-10-10T08:00:00.000Z');
    const read = readBackup(text, emptyArchive());
    expect(read).toEqual({ format: 'v2', archive: a, discarded: [], warnings: [] });
  });

  it('nome del file con la data locale', () => {
    expect(backupFileName(new Date(2026, 0, 5, 23, 59))).toBe('workout-tracker-2026-01-05.json');
  });
});

describe('US-32 lettura di un backup', () => {
  it('riconosce il formato del PoC', () => {
    expect(readBackup(pocText, emptyArchive()).format).toBe('poc');
  });

  it('il formato v2 si valida per intero: un errore rifiuta il file', () => {
    const broken = JSON.parse(exportArchive(local()));
    broken.sessions[1].date = '2026-02-31';
    expect(() => readBackup(JSON.stringify(broken), emptyArchive())).toThrow(/^Il backup non è valido: Allenamento 2: data non valida\.$/);
  });

  it.each([
    ['JSON non valido', '{', 'Il file non è un backup leggibile (JSON non valido).'],
    ['formato sconosciuto', '{"version":3}', 'Formato di backup non riconosciuto.'],
    ['vecchio formato bb-*', '[{"date":"2026-10-01","exercises":[]}]', 'Formato di backup non riconosciuto.'],
  ])('rifiuta: %s', (_, text, message) => {
    expect(() => readBackup(text, emptyArchive())).toThrow(message);
  });

  it('limite di 10 MB', () => {
    expect(() => checkSize(10 * 1024 * 1024)).not.toThrow();
    expect(() => checkSize(10 * 1024 * 1024 + 1)).toThrow('Il file supera il limite di 10 MB.');
    expect(() => readBackup(' '.repeat(10 * 1024 * 1024 + 1), emptyArchive())).toThrow(ArchiveError);
  });
});

describe('US-02 / US-32 anteprima e unione', () => {
  it('anteprima del backup del PoC: allenamenti, periodo, nuovi e scartati', () => {
    const current = { ...emptyArchive(), sessions: [session('poc-1', '2026-09-01')] };
    const preview = previewImport(current, readBackup(pocText, current));
    expect(preview).toMatchObject({
      format: 'poc',
      sessions: 4,
      newSessions: 3,
      existingSessions: 1,
      period: { from: '2026-09-01', to: '2026-09-08' },
      newRoutines: 2,
      newExercises: 2,
    });
    expect(preview.discarded).toHaveLength(3);
  });

  it('"mantieni" conserva gli allenamenti del dispositivo, "sostituisci" prende quelli del backup', () => {
    const backup = { ...local(), sessions: [session('s1', '2026-10-01', { name: 'dal backup' }), session('s9', '2026-09-20')] };
    const data = readBackup(exportArchive(backup), emptyArchive());

    const keep = mergeImport(local(), data, 'keep').archive;
    expect(keep.sessions.map((s) => [s.id, s.name])).toEqual([['s9', 's9'], ['s1', 'locale'], ['s2', 's2']]);

    const replace = mergeImport(local(), data, 'replace').archive;
    expect(replace.sessions.map((s) => [s.id, s.name])).toEqual([['s9', 's9'], ['s1', 'dal backup'], ['s2', 's2']]);
    // la revisione resta quella locale: la incrementa il repository al salvataggio
    expect(replace.revision).toBe(12);
  });

  it('pianificazione, eccezioni e impostazioni: "mantieni" completa, "sostituisci" sovrascrive', () => {
    const backup = {
      ...local(),
      schedule: { mon: 'routine-b', thu: 'routine-b' },
      overrides: { '2026-10-01': 'routine-a', '2026-10-02': null },
      settings: { ...local().settings, weightUnit: 'lb' as const },
    };
    const data = readBackup(exportArchive(backup), emptyArchive());
    const k = mergeImport(local(), data, 'keep').archive;
    expect(k.schedule).toEqual({ mon: 'routine-a', thu: 'routine-b' });
    expect(k.overrides).toEqual({ '2026-10-01': null, '2026-10-02': null });
    expect(k.settings.weightUnit).toBe('kg');
    const r = mergeImport(local(), data, 'replace').archive;
    expect(r.schedule).toEqual({ mon: 'routine-b', thu: 'routine-b' });
    expect(r.overrides['2026-10-01']).toBe('routine-a');
    expect(r.settings.weightUnit).toBe('lb');
  });

  it('il PoC non tocca mai le schede dell’utente, anche con "sostituisci"', () => {
    const current = local();
    current.routines[0] = { ...current.routines[0], name: 'La mia A' };
    const merged = mergeImport(current, readBackup(pocText, current), 'replace').archive;
    expect(merged.routines.map((r) => r.name)).toEqual(['La mia A', 'Scheda B']);
    expect(merged.settings).toEqual(current.settings);
  });

  it('esercizi personalizzati uniti senza duplicati', () => {
    const current = ensureExercise(emptyArchive(), 'crunch ai cavi').archive;
    const merged = mergeImport(current, readBackup(pocText, current), 'keep').archive;
    expect(Object.keys(merged.catalog).sort()).toEqual(['custom-crunch-ai-cavi', 'custom-palla-medica']);
    expect(merged.catalog['custom-crunch-ai-cavi'].name).toBe('crunch ai cavi');
  });

  it('una sola sessione in corso: resta aperta la più recente, le altre si chiudono', () => {
    const current = { ...emptyArchive(), sessions: [session('open', '2026-10-05', { end: null })] };
    const result = mergeImport(current, readBackup(pocText, current), 'keep');
    expect(result.closedSessions).toBe(1);
    expect(result.archive.sessions.filter((s) => s.end === null).map((s) => s.id)).toEqual(['open']);
    expect(result.archive.sessions.find((s) => s.id === 'poc-5')!.end).not.toBeNull();
  });

  it('oltre 10.000 allenamenti l’importazione viene annullata', () => {
    const current = { ...emptyArchive(), sessions: Array.from({ length: 9_999 }, (_, i) => session(`l${i}`, '2026-01-01')) };
    expect(() => mergeImport(current, readBackup(pocText, emptyArchive()), 'keep')).toThrow(
      'Il diario risultante supera il limite di 10.000 allenamenti. Importazione annullata.',
    );
  });

  it('dal file al repository: il diario importato si salva e si rilegge', () => {
    const data = new Map<string, string>();
    const store = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const repo = new ArchiveRepository(store);
    const { archive } = mergeImport(repo.archive, readBackup(pocText, repo.archive), 'keep');
    expect(repo.replace(archive).ok).toBe(true);
    expect(new ArchiveRepository(store).archive.sessions).toHaveLength(4);
  });
});
