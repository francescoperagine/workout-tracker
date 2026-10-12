import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ensureExercise } from './catalog';
import { fromDateKey } from './dates';
import { convertPocArchive } from './poc-import';
import { ArchiveError, emptyArchive } from './types';
import { validateArchive } from './validation';

// Backup sintetico nel formato di "Esporta" del PoC (finché non c'è un backup reale dell'utente).
const backupText = readFileSync(new URL('../../../tests/fixtures/synthetic-poc-backup.json', import.meta.url), 'utf8');
const backup = () => JSON.parse(backupText);

describe('US-02 import del backup del PoC', () => {
  const { archive, discarded, warnings } = convertPocArchive(backup());
  const session = (id: string) => archive.sessions.find((s) => s.id === id)!;

  it('il risultato è un archivio v2 valido', () => {
    expect(validateArchive(JSON.parse(JSON.stringify(archive)))).toEqual(archive);
  });

  it('allenamenti validi importati con id, data, nome e scheda; quelli non validi scartati con il motivo', () => {
    expect(archive.sessions.map((s) => [s.id, s.date, s.routineId, s.name])).toEqual([
      ['poc-1', '2026-09-01', 'routine-a', 'Scheda A'],
      ['poc-2', '2026-09-03', 'routine-b', 'Scheda B'],
      ['poc-3', '2026-09-05', null, 'Allenamento libero'],
      ['poc-5', '2026-09-08', 'routine-a', 'Scheda A'],
    ]);
    expect(discarded).toEqual([
      { item: 'Allenamento del 3 settembre 2026, esercizio 3', reason: 'serie con peso o ripetizioni non validi' },
      { item: 'Allenamento 4 del file', reason: 'data non valida' },
      { item: 'Allenamento del 6 settembre 2026', reason: 'identificativo duplicato nel file' },
    ]);
  });

  it('le schede A/B usate arrivano come schede iniziali, con gli stessi id', () => {
    expect(archive.routines.map((r) => r.id)).toEqual(['routine-a', 'routine-b']);
  });

  it('varianti riconosciute dagli id: esercizio fatto e previsto', () => {
    const [squat, bench] = session('poc-1').exercises;
    expect(squat).toMatchObject({ exerciseId: 'squat-bilanciere', variantOf: null, group: null, rest: 120 });
    // Chest press al posto della panca piana: superserie e recupero dalla voce 2a della scheda A
    expect(bench).toMatchObject({ exerciseId: 'chest-press', variantOf: 'panca-piana-bilanciere', group: '2', rest: 60, notes: 'macchina 2, sedile 4' });
    expect(session('poc-5').exercises[0]).toMatchObject({ exerciseId: 'leg-press', variantOf: 'squat-bilanciere' });
  });

  it('pesi e ripetizioni in numeri (kg), serie vuote conservate come non completate', () => {
    const [squat, bench] = session('poc-1').exercises;
    const start = fromDateKey('2026-09-01').getTime();
    expect(squat.sets).toEqual([
      { id: 'e1-s1', type: 'normal', kg: 50, reps: 8, completedAt: start },
      { id: 'e1-s2', type: 'normal', kg: 50, reps: 7, completedAt: start },
      { id: 'e1-s3', type: 'normal', kg: null, reps: null, completedAt: null },
    ]);
    expect(bench.sets[0].kg).toBe(42.5);
  });

  it('allenamento concluso: fine registrata; non concluso: resta in corso, serie non spuntate', () => {
    expect(session('poc-1').end).toBe(session('poc-1').start);
    const inProgress = session('poc-5');
    expect(inProgress.end).toBeNull();
    expect(inProgress.exercises[0].sets.map((s) => s.completedAt)).toEqual([null, null]);
  });

  it('US-14: i nomi liberi diventano esercizi personalizzati, riconosciuti senza maiuscole e spazi', () => {
    expect(archive.catalog).toEqual({
      'custom-crunch-ai-cavi': { id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi' },
      'custom-palla-medica': { id: 'custom-palla-medica', name: 'Pàlla medica' },
    });
    expect(session('poc-2').exercises[1].exerciseId).toBe('custom-crunch-ai-cavi');
    // "crunch  ai CAVI" nell'allenamento libero è lo stesso esercizio
    expect(session('poc-3').exercises[0].exerciseId).toBe('custom-crunch-ai-cavi');
  });

  it('un nome libero uguale a un esercizio personalizzato già presente lo riusa', () => {
    const current = ensureExercise(emptyArchive(), 'Crunch ai cavi').archive;
    const conv = convertPocArchive(backup(), current);
    expect(conv.archive.catalog).not.toHaveProperty('custom-crunch-ai-cavi');
    expect(conv.archive.sessions[1].exercises[1].exerciseId).toBe('custom-crunch-ai-cavi');
  });

  it('un nome cambiato a mano nel PoC resta nelle note, con un avviso', () => {
    expect(session('poc-2').exercises[0].notes).toBe('per manubrio · Nome registrato: Rematore pesante');
    expect(warnings).toContain('Allenamento del 3 settembre 2026, esercizio 1: il nome "Rematore pesante" è stato conservato nelle note.');
  });

  it('un id che non è nel catalogo resta lo stesso, come esercizio personalizzato', () => {
    const data = backup();
    Object.assign(data.allenamenti[0].esercizi[0], { catalogoId: 'stacco-sumo', varianteId: 'stacco-sumo', variante: 'Stacco sumo', nome: 'Stacco sumo' });
    const conv = convertPocArchive(data);
    expect(conv.archive.catalog['stacco-sumo']).toEqual({ id: 'stacco-sumo', name: 'Stacco sumo' });
    expect(conv.archive.sessions[0].exercises[0].exerciseId).toBe('stacco-sumo');
  });

  it('rifiuta un file che non è un backup del PoC o supera 10.000 allenamenti', () => {
    expect(() => convertPocArchive({ versione: 2, allenamenti: [] })).toThrow(ArchiveError);
    expect(() => convertPocArchive({ versione: 1 })).toThrow('Formato di backup non riconosciuto.');
    expect(() => convertPocArchive([])).toThrow(ArchiveError);
    expect(() => convertPocArchive({ versione: 1, allenamenti: new Array(10_001).fill(null) })).toThrow('10.000');
  });
});
