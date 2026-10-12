import { describe, expect, it } from 'vitest';
import { starterRoutines } from './routines';
import { currentExercise, finishSession, startSession } from './sessions';
import { safeImagePath } from './catalog';
import { emptyArchive, type Archive, type Session, type SessionExercise, type SessionSet, type SetType } from './types';
import {
  addSessionExercise,
  addSet,
  completedSet,
  finishedCount,
  loadRecords,
  moveSessionExercise,
  nextSet,
  nextSetType,
  suggestedSets,
  plannedEntry,
  previousExercise,
  previousSets,
  removeSessionExercise,
  removeSet,
  renameSession,
  replaceSet,
  restoreSessionExercise,
  restoreSet,
  setNumbers,
  setSessionDate,
  switchExercise,
  undoSwitch,
  updateSet,
  workoutSummary,
} from './workout';

// sabato 10 ottobre 2026, 18:00 ora locale
const NOW = new Date(2026, 9, 10, 18, 0).getTime();
const DAY = 86_400_000;

function set(id: string, kg: number | null, reps: number | null, done = true, type: SetType = 'normal'): SessionSet {
  return { id, type, kg, reps, completedAt: done ? NOW - DAY : null };
}

function exercise(id: string, exerciseId: string, sets: SessionSet[], extra: Partial<SessionExercise> = {}): SessionExercise {
  return { id, exerciseId, variantOf: null, group: null, rest: 90, warmupRest: 60, notes: '', sets, ...extra };
}

function finished(id: string, date: string, exercises: SessionExercise[], start = new Date(`${date}T18:00:00`).getTime()): Session {
  return { id, date, routineId: null, name: 'Allenamento libero', start, end: start + 3_600_000, exercises };
}

const withAB = (sessions: Session[] = []): Archive => ({ ...emptyArchive(), routines: starterRoutines(), sessions });

/** La sessione in corso dopo una modifica */
const running = (archive: Archive) => archive.sessions.find((s) => s.end === null)!;

describe('US-12 precedente e spunta', () => {
  it('il precedente è l’ultima sessione conclusa prima di questa con lo stesso esercizio e dei valori', () => {
    const old = finished('old', '2026-10-01', [exercise('o1', 'squat-bilanciere', [set('a', 50, 8)])]);
    const last = finished('last', '2026-10-06', [exercise('l1', 'squat-bilanciere', [set('b', 55, 8), set('c', 55, 7)])]);
    const empty = finished('empty', '2026-10-08', [exercise('e1', 'squat-bilanciere', [set('d', null, null, false)])]);
    const future = finished('future', '2026-10-20', [exercise('f1', 'squat-bilanciere', [set('e', 90, 8)])]);
    const { archive, session } = startSession(withAB([old, last, empty, future]), 'routine-a', NOW);
    const found = previousExercise(archive, session, 'squat-bilanciere');
    expect(found?.session.id).toBe('last');
    expect(previousSets(session.exercises[0], found!.exercise)).toEqual([{ kg: 55, reps: 8 }, { kg: 55, reps: 7 }, null]);
    expect(previousExercise(archive, session, 'leg-press')).toBeNull();
  });

  it('le serie di riscaldamento si confrontano tra loro: aggiungerne una non sposta le altre', () => {
    const previous = exercise('p', 'x', [set('w', 20, 10, true, 'warmup'), set('1', 60, 8), set('2', 60, 6)]);
    const current = exercise('c', 'x', [set('a', null, null, false), set('b', null, null, false, 'warmup'), set('c', null, null, false, 'warmup'), set('d', null, null, false)]);
    expect(previousSets(current, previous)).toEqual([{ kg: 60, reps: 8 }, { kg: 20, reps: 10 }, null, { kg: 60, reps: 6 }]);
    expect(setNumbers(current.sets)).toEqual([1, 0, 0, 2]);
  });

  it('la spunta su una riga vuota conferma il precedente; senza ripetizioni non si spunta', () => {
    const empty = set('s', null, null, false);
    expect(completedSet(empty, { kg: 40, reps: 8 }, NOW)).toEqual({ ...empty, kg: 40, reps: 8, completedAt: NOW });
    // un campo scritto vince sul precedente, l'altro lo prende dal precedente
    expect(completedSet({ ...empty, reps: 10 }, { kg: 40, reps: 8 }, NOW)).toMatchObject({ kg: 40, reps: 10 });
    expect(completedSet(empty, null, NOW)).toBeNull();
    expect(completedSet({ ...empty, kg: 40 }, null, NOW)).toBeNull();
    // a corpo libero il peso può mancare
    expect(completedSet({ ...empty, reps: 12 }, null, NOW)).toMatchObject({ kg: null, reps: 12, completedAt: NOW });
  });

  it('spuntare e togliere la spunta salvano la serie', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const [first] = session.exercises;
    const done = replaceSet(archive, session.id, first.id, completedSet({ ...first.sets[0], reps: 8, kg: 40 }, null, NOW + 1)!);
    expect(running(done).exercises[0].sets[0]).toMatchObject({ kg: 40, reps: 8, completedAt: NOW + 1 });
    const undone = updateSet(done, session.id, first.id, first.sets[0].id, { completedAt: null });
    expect(running(undone).exercises[0].sets[0]).toMatchObject({ kg: 40, reps: 8, completedAt: null });
    // l'archivio ricevuto non cambia
    expect(running(archive).exercises[0].sets[0].completedAt).toBeNull();
  });
});

describe('US-13 tipi di serie', () => {
  it('il tocco sull’indice passa al tipo successivo: 1 → R → D → C → 1', () => {
    expect(['normal', 'warmup', 'drop', 'failure'].map((t) => nextSetType(t as SetType))).toEqual(['warmup', 'drop', 'failure', 'normal']);
  });

  it('il riscaldamento non conta per volume e record', () => {
    const before = finished('b', '2026-10-01', [exercise('b1', 'x', [set('1', 60, 5)])]);
    const today = finished('t', '2026-10-10', [exercise('t1', 'x', [set('w', 80, 5, true, 'warmup'), set('1', 60, 5), set('2', 50, 10)])]);
    expect(workoutSummary(today, NOW)).toMatchObject({ exercises: 1, sets: 2, warmupSets: 1, volume: 60 * 5 + 50 * 10 });
    expect(loadRecords(withAB([before, today]), today)).toEqual([]);
  });
});

describe('US-14 varianti', () => {
  it('senza serie spuntate la variante cambia sul posto: le serie si svuotano e si ricorda l’esercizio previsto', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const first = session.exercises[0];
    const typed = updateSet(archive, session.id, first.id, first.sets[0].id, { kg: 40, reps: 8 });
    const { archive: switchedArchive, added } = switchExercise(typed, session.id, first.id, 'leg-press');
    expect(added).toBeNull();
    const switched = running(switchedArchive).exercises[0];
    expect(switched).toMatchObject({ id: first.id, exerciseId: 'leg-press', variantOf: first.exerciseId });
    expect(switched.sets).toHaveLength(first.sets.length);
    expect(switched.sets.every((s) => s.kg === null && s.reps === null && s.completedAt === null)).toBe(true);

    const again = switchExercise(switchedArchive, session.id, first.id, 'goblet-squat').archive;
    expect(running(again).exercises[0]).toMatchObject({ exerciseId: 'goblet-squat', variantOf: first.exerciseId });
    const back = switchExercise(again, session.id, first.id, first.exerciseId).archive;
    expect(running(back).exercises[0]).toMatchObject({ exerciseId: first.exerciseId, variantOf: null });
  });

  it('con serie già spuntate quelle restano all’esercizio fatto e la variante continua sotto; Annulla rimette tutto', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const first = session.exercises[0];
    const done = updateSet(archive, session.id, first.id, first.sets[0].id, { kg: 40, reps: 8, completedAt: NOW });
    const typed = updateSet(done, session.id, first.id, first.sets[1].id, { kg: 45 });
    const { archive: split, added } = switchExercise(typed, session.id, first.id, 'leg-press');
    const [kept, variant, third] = running(split).exercises;
    expect(kept).toMatchObject({ id: first.id, exerciseId: first.exerciseId, variantOf: null });
    expect(kept.sets.map((s) => [s.kg, s.reps])).toEqual([[40, 8]]);
    expect(variant).toMatchObject({ id: added, exerciseId: 'leg-press', variantOf: first.exerciseId, notes: '' });
    expect(variant.sets.map((s) => s.id)).toEqual(first.sets.slice(1).map((s) => s.id));
    expect(variant.sets.every((s) => s.kg === null && s.completedAt === null)).toBe(true);
    expect(third.id).toBe(session.exercises[1].id);
    // la voce nuova ha gli stessi target della voce prevista, e le voci dopo restano le loro
    const s = running(split);
    expect(plannedEntry(split, s, variant)?.id).toBe(archive.routines[0].exercises[0].id);
    expect(plannedEntry(split, s, third)?.id).toBe(archive.routines[0].exercises[1].id);

    const undone = running(undoSwitch(split, session.id, running(typed).exercises[0], added));
    expect(undone.exercises).toEqual(running(typed).exercises);
  });

  it('con tutte le serie spuntate la variante parte con una serie', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const first = session.exercises[0];
    let a = archive;
    for (const set of first.sets) a = updateSet(a, session.id, first.id, set.id, { kg: 40, reps: 8, completedAt: NOW });
    const { archive: split } = switchExercise(a, session.id, first.id, 'leg-press');
    expect(running(split).exercises[1].sets).toHaveLength(1);
  });

  it('i target restano quelli della voce prevista, anche dopo variante e riordino', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const [routineA] = archive.routines;
    const switched = switchExercise(archive, session.id, session.exercises[0].id, 'leg-press').archive;
    const moved = moveSessionExercise(switched, session.id, session.exercises[0].id, 1);
    const s = running(moved);
    const variant = s.exercises.find((e) => e.exerciseId === 'leg-press')!;
    expect(plannedEntry(moved, s, variant)?.id).toBe(routineA.exercises[0].id);
    for (const e of s.exercises.filter((x) => x !== variant)) expect(plannedEntry(moved, s, e)?.exerciseId).toBe(e.exerciseId);
    // allenamento libero: nessuna voce
    const free = startSession(withAB(), null, NOW);
    const added = addSessionExercise(free.archive, free.session.id, 'leg-press');
    expect(plannedEntry(added.archive, running(added.archive), added.exercise)).toBeNull();
  });
});

describe('US-15 serie ed esercizi durante la sessione', () => {
  it('"Aggiungi serie" riprende il peso dell’ultima serie con ripetizioni vuote; togliere si annulla', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const first = session.exercises[0];
    const last = first.sets.at(-1)!;
    const logged = updateSet(archive, session.id, first.id, last.id, { kg: 42.5, reps: 6 });
    const added = addSet(logged, session.id, first.id);
    expect(added.set).toMatchObject({ type: 'normal', kg: 42.5, reps: null, completedAt: null });
    expect(running(added.archive).exercises[0].sets).toHaveLength(first.sets.length + 1);

    const removed = removeSet(added.archive, session.id, first.id, last.id);
    expect(running(removed.archive).exercises[0].sets.map((s) => s.id)).not.toContain(last.id);
    const restored = restoreSet(removed.archive, session.id, removed.removed);
    expect(running(restored).exercises[0].sets.map((s) => s.id)).toEqual(running(added.archive).exercises[0].sets.map((s) => s.id));
  });

  it('un esercizio aggiunto ha tante serie (e dello stesso tipo) quante l’ultima volta, altrimenti 3', () => {
    const before = finished('b', '2026-10-01', [exercise('b1', 'leg-press', [set('w', 40, 10, true, 'warmup'), set('1', 80, 10), set('2', 80, 10), set('3', 80, 9)], { rest: 120 })]);
    const free = startSession(withAB([before]), null, NOW);
    const known = addSessionExercise(free.archive, free.session.id, 'leg-press');
    expect(known.exercise.sets.map((s) => s.type)).toEqual(['warmup', 'normal', 'normal', 'normal']);
    expect(known.exercise.rest).toBe(120);
    const fresh = addSessionExercise(known.archive, free.session.id, 'goblet-squat');
    expect(fresh.exercise.sets).toHaveLength(3);
    expect(fresh.exercise.rest).toBe(fresh.archive.settings.defaultRest);
    expect(running(fresh.archive).exercises.map((e) => e.exerciseId)).toEqual(['leg-press', 'goblet-squat']);
  });

  it('togliere un esercizio da una superserie si annulla e ricompone il gruppo', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const grouped = session.exercises.find((e) => e.group !== null)!;
    const { archive: without, removed } = removeSessionExercise(archive, session.id, grouped.id);
    expect(running(without).exercises).toHaveLength(session.exercises.length - 1);
    const back = restoreSessionExercise(without, session.id, removed);
    expect(running(back).exercises.map((e) => [e.id, e.group])).toEqual(session.exercises.map((e) => [e.id, e.group]));
  });

  it('il riordino sposta l’intera superserie dal suo bordo', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const [single, firstOfPair, secondOfPair] = session.exercises;
    expect(firstOfPair.group).not.toBeNull();
    expect(secondOfPair.group).toBe(firstOfPair.group);
    const moved = running(moveSessionExercise(archive, session.id, single.id, 1)).exercises;
    expect(moved.slice(0, 3).map((e) => e.id)).toEqual([firstOfPair.id, secondOfPair.id, single.id]);
    expect(moveSessionExercise(archive, session.id, single.id, -1)).toBe(archive);
  });
});

describe('US-17 serie da fare adesso', () => {
  it('in superserie si alternano gli esercizi; poi si passa al blocco successivo', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const [single, a, b] = session.exercises;
    expect(nextSet(session)?.exercise.id).toBe(single.id);
    let current = archive;
    for (const s of single.sets) current = updateSet(current, session.id, single.id, s.id, { reps: 8, completedAt: NOW + 1 });
    expect(nextSet(running(current))?.exercise.id).toBe(a.id);
    current = updateSet(current, session.id, a.id, a.sets[0].id, { reps: 8, completedAt: NOW + 2 });
    // dopo 2a tocca a 2b, poi di nuovo a 2a
    expect(nextSet(running(current))?.exercise.id).toBe(b.id);
    current = updateSet(current, session.id, b.id, b.sets[0].id, { reps: 8, completedAt: NOW + 3 });
    expect(nextSet(running(current))).toMatchObject({ exercise: { id: a.id }, set: { id: a.sets[1].id } });
    expect(currentExercise(running(current))?.id).toBe(a.id);
  });

  it('un esercizio saltato si ritrova dopo gli altri', () => {
    const s: Session = finished('s', '2026-10-10', [
      exercise('1', 'x', [set('1a', 50, 8, false)]),
      exercise('2', 'y', [set('2a', 50, 8, true), set('2b', 50, 8, false)]),
      exercise('3', 'z', [set('3a', 50, 8, false)]),
    ]);
    expect(nextSet(s)?.set.id).toBe('2b');
    const after = { ...s, exercises: s.exercises.map((e) => (e.id === '2' ? { ...e, sets: e.sets.map((x) => ({ ...x, completedAt: NOW })) } : e)) };
    expect(nextSet(after)?.set.id).toBe('3a');
    const allButFirst = { ...after, exercises: after.exercises.map((e) => (e.id === '3' ? { ...e, sets: e.sets.map((x) => ({ ...x, completedAt: NOW + 1 })) } : e)) };
    expect(nextSet(allButFirst)?.set.id).toBe('1a');
  });
});

describe('US-18 riepilogo e US-29 record', () => {
  it('durata, esercizi, serie, volume e record di carico rispetto alle sessioni precedenti', () => {
    const before = finished('b', '2026-10-01', [exercise('b1', 'x', [set('1', 60, 5)]), exercise('b2', 'y', [set('2', 30, 10)])]);
    const today = finished('t', '2026-10-10', [
      exercise('t1', 'x', [set('1', 62.5, 5), set('2', 65, 3), set('3', 65, 3)]),
      exercise('t2', 'y', [set('4', 30, 10), set('5', null, null, false)]),
      exercise('t3', 'nuovo', [set('6', 100, 1)]),
    ]);
    const archive = withAB([before, today]);
    expect(loadRecords(archive, today)).toEqual([{ exerciseId: 'x', kg: 65, previousBest: 60, setId: '2' }]);
    const summary = workoutSummary(today, NOW);
    expect(summary).toMatchObject({ duration: 3_600_000, exercises: 3, sets: 5, warmupSets: 0 });
    expect(summary.volume).toBe(62.5 * 5 + 65 * 3 * 2 + 30 * 10 + 100);
    expect(finishedCount(archive)).toBe(2);
  });

  it('nome e data dell’allenamento si cambiano anche in corso', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    expect(running(renameSession(archive, session.id, '  Scheda A  mattina ')).name).toBe('Scheda A mattina');
    expect(() => renameSession(archive, session.id, '   ')).toThrow(/nome/);
    expect(running(setSessionDate(archive, session.id, '2026-10-09')).date).toBe('2026-10-09');
    expect(() => setSessionDate(archive, session.id, '2026-02-30')).toThrow(/data/);
  });

  it('una sessione con una serie registrata si conclude', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const first = session.exercises[0];
    const logged = updateSet(archive, session.id, first.id, first.sets[0].id, { kg: 40, reps: 8, completedAt: NOW + 1 });
    expect(finishSession(logged, session.id, NOW + 60_000).sessions[0].end).toBe(NOW + 60_000);
  });
});

describe('US-19 approfondimento', () => {
  it('immagini solo locali o raster incorporate, come nel PoC', () => {
    expect(safeImagePath('panca.webp')).toBe('panca.webp');
    expect(safeImagePath('./petto/panca-piana.jpg')).toBe('petto/panca-piana.jpg');
    expect(safeImagePath('data:image/png;base64,iVBORw0KGgo=')).not.toBeNull();
    for (const bad of ['https://example.com/a.png', '//example.com/a.png', '../segreto.png', 'a.svg', 'data:image/svg+xml;base64,PHN2Zz4=', '/assoluto.png', 'javascript:alert(1)'])
      expect(safeImagePath(bad), bad).toBeNull();
  });
});

describe('US-12 suggerimento della serie sopra', () => {
  const s = (id: string, kg: number | null, reps: number | null, type: SetType = 'normal'): SessionSet => ({ id, type, kg, reps, completedAt: null });
  it('il peso scritto sopra vale per le serie sotto dello stesso genere; le ripetizioni restano la volta scorsa', () => {
    const previous = [{ kg: 20, reps: 10 }, { kg: 40, reps: 8 }, { kg: 40, reps: 7 }, null];
    const sets = [s('w', null, null, 'warmup'), s('1', 42.5, null), s('2', null, null), s('3', null, null)];
    expect(suggestedSets({ sets }, previous)).toEqual([{ kg: 20, reps: 10 }, { kg: 40, reps: 8 }, { kg: 42.5, reps: 7 }, { kg: 42.5, reps: null }]);
    // senza niente scritto il suggerimento è il precedente
    expect(suggestedSets({ sets: sets.map((x) => ({ ...x, kg: null })) }, previous)).toEqual(previous);
    // il riscaldamento non presta il peso alle serie di lavoro
    expect(suggestedSets({ sets: [s('w', 20, 10, 'warmup'), s('1', null, null)] }, [null, { kg: 40, reps: 8 }])[1]).toEqual({ kg: 40, reps: 8 });
  });
});
