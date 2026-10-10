import { describe, expect, it } from 'vitest';
import {
  availableExercises,
  ensureExercise,
  exerciseName,
  findByName,
  findExercise,
  nameKey,
  suggestExercises,
} from './catalog';
import { ArchiveError, emptyArchive } from './types';

describe('US-14 nome scritto a mano', () => {
  it('il confronto ignora maiuscole, spazi, punteggiatura e accenti', () => {
    expect(nameKey('Leg press, piedi a metà pedana')).toBe(nameKey('  leg PRESS piedi a meta  pedana '));
    expect(nameKey('Hyperextension 45° con disco')).toBe('hyperextension45condisco');
    expect(nameKey('Pull-through al cavo')).toBe(nameKey('pullthrough al cavo'));
    expect(nameKey('?!')).toBe('');
  });

  it('un nome che corrisponde a un esercizio del catalogo usa quello, senza creare nulla', () => {
    const archive = emptyArchive();
    const result = ensureExercise(archive, 'hack  SQUAT');
    expect(result.created).toBe(false);
    expect(result.exercise).toEqual({ id: 'hack-squat', name: 'Hack squat', custom: false });
    expect(result.archive).toBe(archive);
  });

  it('un nome nuovo diventa un esercizio personalizzato, riusato la volta dopo', () => {
    const empty = emptyArchive();
    const first = ensureExercise(empty, '  Crunch   ai cavi ');
    expect(first.created).toBe(true);
    expect(first.exercise).toEqual({ id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi', custom: true });
    expect(first.archive.catalog['custom-crunch-ai-cavi']).toEqual({ id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi' });
    // l'archivio di partenza non viene modificato
    expect(empty.catalog).toEqual({});

    const second = ensureExercise(first.archive, 'crunch AI cavì');
    expect(second.created).toBe(false);
    expect(second.exercise.id).toBe('custom-crunch-ai-cavi');
    expect(second.archive).toBe(first.archive);
  });

  it('lo stesso nome crea lo stesso id su dispositivi diversi', () => {
    const a = ensureExercise(emptyArchive(), 'Pàlla medica').exercise.id;
    const b = ensureExercise(emptyArchive(), 'palla MEDICA').exercise.id;
    expect(a).toBe(b);
    expect(a).toBe('custom-palla-medica');
  });

  it('rifiuta un nome vuoto, senza lettere o troppo lungo', () => {
    expect(() => ensureExercise(emptyArchive(), '   ')).toThrow(ArchiveError);
    expect(() => ensureExercise(emptyArchive(), '—')).toThrow(ArchiveError);
    expect(() => ensureExercise(emptyArchive(), 'x'.repeat(201))).toThrow(ArchiveError);
  });

  it('suggerisce i nomi simili mentre si scrive: prima chi comincia con il testo', () => {
    const archive = ensureExercise(emptyArchive(), 'Panca declinata').archive;
    const names = (text: string) => suggestExercises(archive, text).map((e) => e.name);
    expect(names('panca')).toEqual([
      'Panca piana bilanciere',
      'Panca piana manubri',
      'Panca inclinata al Smith',
      'Panca declinata',
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
      'Distensioni manubri panca inclinata',
    ]);
    expect(names('pan inc')).toEqual([
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
      'Distensioni manubri panca inclinata',
      'Panca inclinata al Smith',
    ]);
    expect(names('HACK')).toEqual(['Hack squat']);
    expect(names('')).toEqual([]);
    expect(suggestExercises(archive, 'a', 3)).toHaveLength(3);
  });

  it('elenco, ricerca per id e nome di un id sconosciuto', () => {
    const archive = ensureExercise(emptyArchive(), 'Zercher squat').archive;
    const all = availableExercises(archive);
    expect(all[0].id).toBe('squat-bilanciere');
    expect(all.at(-1)).toEqual({ id: 'custom-zercher-squat', name: 'Zercher squat', custom: true });
    expect(findExercise(archive, 'curl-ez')?.name).toBe('Curl EZ');
    expect(exerciseName(archive, 'esercizio-futuro')).toBe('esercizio-futuro');
    expect(findByName(archive, 'zercher-squat')?.id).toBe('custom-zercher-squat');
    expect(findByName(archive, '   ')).toBeNull();
  });
});
