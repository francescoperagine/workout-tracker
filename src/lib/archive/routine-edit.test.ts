import { describe, expect, it } from 'vitest';
import {
  addAlternative,
  addEntry,
  blocksOf,
  createRoutine,
  deleteRoutine,
  duplicateRoutine,
  linkWithPrevious,
  linkedToPrevious,
  moveEntry,
  moveKind,
  moveRoutine,
  normalizeGroups,
  normalizeReps,
  orderLabels,
  removeAlternative,
  removeEntry,
  renameRoutine,
  restoreEntry,
  restoreRoutine,
  routineLastDone,
  scheduledDays,
  setRoutineArchived,
  suggestRoutineName,
  updateEntry,
} from './routine-edit';
import { starterRoutines } from './routines';
import { validateArchive } from './validation';
import { emptyArchive, type Archive, type Routine, type RoutineExercise, type Session } from './types';

function entry(id: string, group: string | null = null): RoutineExercise {
  return {
    id,
    exerciseId: `ex-${id}`,
    alternatives: [],
    group,
    sets: 3,
    reps: '8',
    loadMin: null,
    loadMax: null,
    loadNote: '',
    unit: '',
    rest: 90,
    warmupRest: 60,
  };
}

function routine(id: string, exercises: RoutineExercise[] = [], archived = false): Routine {
  return { id, name: `Scheda ${id.toUpperCase()}`, notes: '', archived, exercises };
}

function archive(partial: Partial<Archive> = {}): Archive {
  return { ...emptyArchive(), ...partial };
}

function session(routineId: string, date: string, finished = true): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  return { id: `s-${routineId}-${date}`, date, routineId, name: '', start, end: finished ? start + 1 : null, exercises: [] };
}

const ids = (list: { id: string }[]) => list.map((x) => x.id);
const groups = (list: RoutineExercise[]) => list.map((e) => e.group);
const exercisesOf = (a: Archive, id = 'r') => a.routines.find((r) => r.id === id)!.exercises;

describe('US-10 elenco delle schede', () => {
  it('propone il nome con la prima lettera libera', () => {
    expect(suggestRoutineName(archive())).toBe('Scheda A');
    expect(suggestRoutineName(archive({ routines: starterRoutines() }))).toBe('Scheda C');
  });

  it('crea una scheda vuota in fondo, senza modificare l’archivio ricevuto', () => {
    const before = archive({ routines: starterRoutines() });
    const { archive: after, routine: created } = createRoutine(before);
    expect(created).toMatchObject({ name: 'Scheda C', archived: false, exercises: [] });
    expect(after.routines.at(-1)).toBe(created);
    expect(before.routines).toHaveLength(2);
    expect(() => validateArchive(after)).not.toThrow();
  });

  it('rifiuta un nome vuoto e pulisce gli spazi', () => {
    const a = archive({ routines: [routine('r')] });
    expect(() => renameRoutine(a, 'r', '   ')).toThrow('Scrivi il nome');
    expect(renameRoutine(a, 'r', '  Spinta   lunedì ').routines[0].name).toBe('Spinta lunedì');
  });

  it('duplica con id nuovi, subito dopo l’originale, superserie comprese', () => {
    const a = archive({ routines: [...starterRoutines(), routine('z')] });
    const { archive: after, routine: copy } = duplicateRoutine(a, 'routine-a');
    expect(after.routines.map((r) => r.name)).toEqual(['Scheda A', 'Scheda A (copia)', 'Scheda B', 'Scheda Z']);
    const source = a.routines[0];
    expect(copy.exercises.map((e) => e.exerciseId)).toEqual(source.exercises.map((e) => e.exerciseId));
    expect(groups(copy.exercises)).toEqual(groups(source.exercises));
    expect(copy.exercises.every((e, i) => e.id !== source.exercises[i].id)).toBe(true);
    // la seconda copia ha un nome diverso
    expect(duplicateRoutine(after, 'routine-a').routine.name).toBe('Scheda A (copia 2)');
    expect(() => validateArchive(after)).not.toThrow();
  });

  it('riordina solo tra le schede dello stesso elenco', () => {
    const a = archive({ routines: [routine('a'), routine('x', [], true), routine('b'), routine('c')] });
    expect(ids(moveRoutine(a, 'b', -1).routines)).toEqual(['b', 'x', 'a', 'c']);
    expect(ids(moveRoutine(a, 'b', 1).routines)).toEqual(['a', 'x', 'c', 'b']);
    expect(moveRoutine(a, 'a', -1)).toBe(a);
    expect(moveRoutine(a, 'x', 1)).toBe(a);
  });

  it('archiviare e ripristinare non toccano sessioni e pianificazione', () => {
    const a = archive({ routines: [routine('a')], schedule: { mon: 'a' }, sessions: [session('a', '2026-10-01')] });
    const archived = setRoutineArchived(a, 'a', true);
    expect(archived.routines[0].archived).toBe(true);
    expect(archived.sessions).toBe(a.sessions);
    expect(archived.schedule).toEqual({ mon: 'a' });
    expect(setRoutineArchived(archived, 'a', false).routines[0].archived).toBe(false);
  });

  it('non elimina una scheda con sessioni', () => {
    const a = archive({ routines: [routine('a')], sessions: [session('a', '2026-10-01', false)] });
    expect(() => deleteRoutine(a, 'a')).toThrow('si può solo archiviare');
  });

  it('elimina togliendo giorni ed eccezioni; "Annulla" rimette tutto al suo posto', () => {
    const a = archive({
      routines: [routine('a'), routine('b'), routine('c')],
      schedule: { mon: 'b', thu: 'b', fri: 'a' },
      overrides: { '2026-10-12': 'b', '2026-10-13': null },
    });
    const { archive: after, removed } = deleteRoutine(a, 'b');
    expect(ids(after.routines)).toEqual(['a', 'c']);
    expect(after.schedule).toEqual({ fri: 'a' });
    expect(after.overrides).toEqual({ '2026-10-13': null });
    const restored = restoreRoutine(after, removed);
    expect(ids(restored.routines)).toEqual(['a', 'b', 'c']);
    expect(restored.schedule).toEqual(a.schedule);
    expect(restored.overrides).toEqual(a.overrides);
    expect(restoreRoutine(restored, removed)).toBe(restored);
  });

  it('giorni assegnati e ultima volta fatta', () => {
    const a = archive({
      schedule: { thu: 'a', mon: 'a', tue: 'b', sun: null },
      sessions: [session('a', '2026-09-01'), session('a', '2026-10-01'), session('a', '2026-10-05', false), session('b', '2026-10-09')],
    });
    expect(scheduledDays(a, 'a')).toEqual(['mon', 'thu']);
    expect(routineLastDone(a, 'a')).toBe('2026-10-01');
    expect(routineLastDone(a, 'c')).toBeNull();
  });
});

describe('US-07 voci della scheda', () => {
  it('aggiunge una voce con 3 serie e il recupero predefinito', () => {
    const a = archive({ routines: [routine('r')], settings: { ...emptyArchive().settings, defaultRest: 105 } });
    const { archive: after, entry: added } = addEntry(a, 'r', 'squat-bilanciere');
    expect(added).toMatchObject({ exerciseId: 'squat-bilanciere', sets: 3, reps: '', rest: 105, warmupRest: 60, group: null, alternatives: [] });
    expect(exercisesOf(after)).toEqual([added]);
    expect(() => validateArchive(after)).not.toThrow();
  });

  it('modifica i campi di una voce', () => {
    const a = archive({ routines: [routine('r', [entry('1'), entry('2')])] });
    const after = updateEntry(a, 'r', '2', { reps: '6–8', loadMin: 40, loadMax: 45, unit: 'per manubrio', rest: 75 });
    expect(exercisesOf(after)[1]).toMatchObject({ reps: '6–8', loadMin: 40, loadMax: 45, unit: 'per manubrio', rest: 75 });
    expect(exercisesOf(after)[0]).toBe(exercisesOf(a)[0]);
  });

  it('ripetizioni: il trattino dell’intervallo diventa quello tipografico', () => {
    expect(normalizeReps(' 6-8 ')).toBe('6–8');
    expect(normalizeReps('8 — 10')).toBe('8–10');
    expect(normalizeReps('max')).toBe('max');
  });

  it('rimuove una voce e la rimette con "Annulla", superserie compresa', () => {
    const a = archive({ routines: [routine('r', [entry('1'), entry('2', 'g'), entry('3', 'g')])] });
    const { archive: after, removed } = removeEntry(a, 'r', '3');
    // la superserie di una sola voce non esiste
    expect(groups(exercisesOf(after))).toEqual([null, null]);
    const restored = restoreEntry(after, 'r', removed);
    expect(ids(exercisesOf(restored))).toEqual(['1', '2', '3']);
    expect(groups(exercisesOf(restored))).toEqual([null, 'g', 'g']);
  });
});

describe('US-08 alternative', () => {
  it('aggiunge e toglie alternative senza doppioni né l’esercizio stesso', () => {
    const a = archive({ routines: [routine('r', [entry('1')])] });
    let after = addAlternative(a, 'r', '1', 'leg-press');
    after = addAlternative(after, 'r', '1', 'leg-press');
    after = addAlternative(after, 'r', '1', 'ex-1');
    after = addAlternative(after, 'r', '1', 'goblet-squat');
    expect(exercisesOf(after)[0].alternatives).toEqual(['leg-press', 'goblet-squat']);
    expect(exercisesOf(removeAlternative(after, 'r', '1', 'leg-press'))[0].alternatives).toEqual(['goblet-squat']);
  });
});

describe('US-09 superserie', () => {
  it('numera come sulla carta: 1, 2a, 2b, 3', () => {
    expect(orderLabels([entry('1'), entry('2', 'x'), entry('3', 'x'), entry('4')])).toEqual(['1', '2a', '2b', '3']);
    expect(orderLabels(starterRoutines()[0].exercises)).toEqual(['1', '2a', '2b', '3', '4a', '4b', '5a', '5b']);
  });

  it('normalizza i gruppi: separati diventano distinti, di una voce tornano singoli', () => {
    const list = [entry('1', 'x'), entry('2', 'x'), entry('3'), entry('4', 'x'), entry('5', 'x'), entry('6', 'y')];
    const result = normalizeGroups(list);
    expect(groups(result)).toEqual(['x', 'x', null, '1', '1', null]);
    const stable = [entry('1', '2'), entry('2', '2')];
    expect(normalizeGroups(stable)).toBe(stable);
  });

  it('unisce alla precedente e separa', () => {
    const a = archive({ routines: [routine('r', [entry('1'), entry('2'), entry('3'), entry('4')])] });
    let after = linkWithPrevious(a, 'r', '2', true);
    after = linkWithPrevious(after, 'r', '3', true);
    expect(blocksOf(exercisesOf(after)).map((b) => ids(b.entries))).toEqual([['1', '2', '3'], ['4']]);
    expect(linkedToPrevious(exercisesOf(after), 1)).toBe(true);
    // separare la seconda voce: 2 e 3 restano insieme, la 1 da sola
    after = linkWithPrevious(after, 'r', '2', false);
    expect(blocksOf(exercisesOf(after)).map((b) => ids(b.entries))).toEqual([['1'], ['2', '3'], ['4']]);
    expect(orderLabels(exercisesOf(after))).toEqual(['1', '2a', '2b', '3']);
    // la prima voce non ha una precedente
    expect(linkWithPrevious(after, 'r', '1', true)).toEqual(after);
  });

  it('unire una voce che apre una superserie fonde i due blocchi', () => {
    const a = archive({ routines: [routine('r', [entry('1'), entry('2', 'g'), entry('3', 'g')])] });
    const after = linkWithPrevious(a, 'r', '2', true);
    expect(blocksOf(exercisesOf(after)).map((b) => ids(b.entries))).toEqual([['1', '2', '3']]);
  });
});

describe('US-07 riordino con le frecce', () => {
  const list = () => [entry('1'), entry('2', 'g'), entry('3', 'g'), entry('4')];
  const order = (a: Archive) => ids(exercisesOf(a));

  it('una voce singola scavalca il blocco vicino senza entrare nella superserie', () => {
    const a = archive({ routines: [routine('r', list())] });
    expect(moveKind(list(), '1', 1)).toBe('block');
    const after = moveEntry(a, 'r', '1', 1);
    expect(order(after)).toEqual(['2', '3', '1', '4']);
    expect(groups(exercisesOf(after))).toEqual(['g', 'g', null, null]);
  });

  it('dentro una superserie la voce scambia il posto con la vicina', () => {
    const a = archive({ routines: [routine('r', list())] });
    expect(moveKind(list(), '2', 1)).toBe('within');
    expect(order(moveEntry(a, 'r', '2', 1))).toEqual(['1', '3', '2', '4']);
  });

  it('dal bordo della superserie si sposta tutta la superserie', () => {
    const a = archive({ routines: [routine('r', list())] });
    expect(moveKind(list(), '2', -1)).toBe('block');
    const after = moveEntry(a, 'r', '2', -1);
    expect(order(after)).toEqual(['2', '3', '1', '4']);
    expect(orderLabels(exercisesOf(after))).toEqual(['1a', '1b', '2', '3']);
  });

  it('ai bordi della scheda non si sposta nulla', () => {
    const a = archive({ routines: [routine('r', list())] });
    expect(moveKind(list(), '1', -1)).toBeNull();
    expect(moveKind(list(), '4', 1)).toBeNull();
    expect(moveEntry(a, 'r', '4', 1)).toBe(a);
  });
});
