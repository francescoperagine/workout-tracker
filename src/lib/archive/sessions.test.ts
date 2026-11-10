import { describe, expect, it } from 'vitest';
import { starterRoutines, quickStart, sessionInProgress } from './routines';
import {
  FREE_SESSION_NAME,
  currentExercise,
  FORGOTTEN_AFTER,
  finishSession,
  forgottenSession,
  lastFinishedSession,
  reassignExercise,
  removeSession,
  reopenSession,
  restoreSession,
  sessionHasData,
  startSession,
  summarizeSession,
  undoReassign,
} from './sessions';
import { validateArchive } from './validation';
import { ArchiveError, emptyArchive, type Archive } from './types';

// sabato 10 ottobre 2026, 18:00 ora locale
const NOW = new Date(2026, 9, 10, 18, 0).getTime();
const withAB = (): Archive => ({ ...emptyArchive(), routines: starterRoutines() });

/** La prima serie della sessione fatta: 40 kg × 8 */
function logFirstSet(archive: Archive, id: string): Archive {
  return {
    ...archive,
    sessions: archive.sessions.map((s) =>
      s.id !== id
        ? s
        : { ...s, exercises: s.exercises.map((e, i) => (i ? e : { ...e, sets: e.sets.map((set, j) => (j ? set : { ...set, kg: 40, reps: 8, completedAt: NOW + 1 })) })) },
    ),
  };
}

describe('US-11 avvio dell’allenamento', () => {
  it('da una scheda: una voce per esercizio con superserie, recuperi e serie vuote', () => {
    const a = withAB();
    const [routineA] = a.routines;
    const { archive, session } = startSession(a, 'routine-a', NOW);
    expect(session).toMatchObject({ date: '2026-10-10', routineId: 'routine-a', name: 'Scheda A', start: NOW, end: null });
    expect(session.exercises.map((e) => e.exerciseId)).toEqual(routineA.exercises.map((e) => e.exerciseId));
    expect(session.exercises.map((e) => e.group)).toEqual(routineA.exercises.map((e) => e.group));
    expect(session.exercises[0]).toMatchObject({ rest: routineA.exercises[0].rest, warmupRest: routineA.exercises[0].warmupRest, alternativeOf: null });
    expect(session.exercises[0].sets).toHaveLength(routineA.exercises[0].sets);
    expect(session.exercises[0].sets.every((s) => s.type === 'normal' && s.kg === null && s.reps === null && s.completedAt === null)).toBe(true);
    expect(new Set(session.exercises.flatMap((e) => [e.id, ...e.sets.map((s) => s.id)])).size).toBe(
      session.exercises.length + session.exercises.reduce((n, e) => n + e.sets.length, 0),
    );
    expect(sessionInProgress(archive)?.id).toBe(session.id);
    expect(a.sessions).toEqual([]); // non muta l'argomento
    expect(() => validateArchive(archive)).not.toThrow();
  });

  it('allenamento libero: nessuna scheda, nessun esercizio', () => {
    const { session } = startSession(withAB(), null, NOW);
    expect(session).toMatchObject({ routineId: null, name: FREE_SESSION_NAME, exercises: [] });
  });

  it('una sola sessione in corso alla volta (US-20)', () => {
    const { archive } = startSession(withAB(), 'routine-a', NOW);
    expect(() => startSession(archive, 'routine-b', NOW)).toThrow(ArchiveError);
    expect(() => startSession(archive, null, NOW)).toThrow(/già un allenamento in corso/);
  });

  it('non parte da una scheda archiviata o sparita', () => {
    const a = withAB();
    a.routines[1].archived = true;
    expect(() => startSession(a, 'routine-b', NOW)).toThrow(ArchiveError);
    expect(() => startSession(a, 'nessuna', NOW)).toThrow(ArchiveError);
  });
});

describe('riapri, concludi, annulla', () => {
  it('concludere chiede almeno un esercizio e una serie; riaprire rimette la sessione in corso', () => {
    const free = startSession(withAB(), null, NOW);
    expect(() => finishSession(free.archive, free.session.id, NOW + 60_000)).toThrow(/almeno un esercizio/);

    const started = startSession(withAB(), 'routine-a', NOW);
    expect(() => finishSession(started.archive, started.session.id, NOW + 60_000)).toThrow(/almeno una serie/);
    const done = finishSession(logFirstSet(started.archive, started.session.id), started.session.id, NOW + 3_600_000);
    expect(sessionInProgress(done)).toBeNull();
    expect(lastFinishedSession(done)?.end).toBe(NOW + 3_600_000);
    const reopened = reopenSession(done, started.session.id);
    expect(sessionInProgress(reopened)?.id).toBe(started.session.id);
    // non si riapre se un'altra è in corso
    const other = startSession(done, null, NOW + 4_000_000);
    expect(() => reopenSession(other.archive, started.session.id)).toThrow(ArchiveError);
  });

  it('annullare toglie la sessione e "Annulla" la rimette al suo posto', () => {
    const started = startSession(withAB(), 'routine-a', NOW);
    const { archive, removed } = removeSession(started.archive, started.session.id);
    expect(archive.sessions).toEqual([]);
    expect(restoreSession(archive, removed).sessions).toEqual(started.archive.sessions);
    // se nel frattempo ne è partita un'altra, non si rimette una seconda sessione in corso
    const again = startSession(archive, null, NOW);
    expect(() => restoreSession(again.archive, removed)).toThrow(ArchiveError);
  });

  it('dati della sessione: valori, riepilogo, esercizio corrente', () => {
    const { session } = startSession(withAB(), 'routine-a', NOW);
    expect(sessionHasData(session)).toBe(false);
    expect(currentExercise(session)?.id).toBe(session.exercises[0].id);
    const first = session.exercises[0];
    const progressed = {
      ...session,
      exercises: [{ ...first, sets: first.sets.map((s) => ({ ...s, kg: 40, reps: 8, completedAt: NOW + 1 })) }, ...session.exercises.slice(1)],
    };
    expect(sessionHasData(progressed)).toBe(true);
    expect(currentExercise(progressed)?.id).toBe(session.exercises[1].id);
    expect(summarizeSession(progressed, NOW + 25 * 60_000)).toEqual({ exercises: session.exercises.length, completedSets: first.sets.length, duration: 25 * 60_000 });
  });
});

describe('US-20 seconda sessione nello stesso giorno', () => {
  it('la scheda già fatta oggi non è più la suggerita', () => {
    const started = startSession({ ...withAB(), schedule: { sat: 'routine-a' } }, 'routine-a', NOW);
    const done = finishSession(logFirstSet(started.archive, started.session.id), started.session.id, NOW + 3_600_000);
    const start = quickStart(done, '2026-10-10');
    expect(start.rows.find((r) => r.planned)?.lastDone).toBe('2026-10-10');
    expect(start.suggested).toBe('routine-b');
  });
});

describe('US-41 allenamento dimenticato', () => {
  const HOUR = 3_600_000;

  it('senza serie spuntate conta l’inizio; oltre 3 ore è dimenticato', () => {
    const { session } = startSession(withAB(), 'routine-a', NOW);
    expect(forgottenSession(session, NOW + FORGOTTEN_AFTER)).toBeNull();
    expect(forgottenSession(session, NOW + FORGOTTEN_AFTER + 1)).toEqual({ at: NOW, lastSet: false });
  });

  it('con serie spuntate conta l’ultima, in qualunque esercizio', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const logged = logFirstSet(archive, session.id).sessions[0];
    const later = { ...logged, exercises: logged.exercises.map((e, i) => (i === 2 ? { ...e, sets: e.sets.map((x, j) => (j ? x : { ...x, reps: 8, completedAt: NOW + HOUR })) } : e)) };
    expect(forgottenSession(later, NOW + 3.5 * HOUR)).toBeNull();
    expect(forgottenSession(later, NOW + 4.5 * HOUR)).toEqual({ at: NOW + HOUR, lastSet: true });
  });

  it('un allenamento concluso non è mai dimenticato; «Termina alle …» chiude all’ultima serie', () => {
    const { archive, session } = startSession(withAB(), 'routine-a', NOW);
    const logged = logFirstSet(archive, session.id);
    const forgotten = forgottenSession(logged.sessions[0], NOW + 14 * HOUR)!;
    const ended = finishSession(logged, session.id, forgotten.at).sessions[0];
    expect(ended.end).toBe(NOW + 1);
    expect(forgottenSession(ended, NOW + 14 * HOUR)).toBeNull();
  });
});

describe('US-42 correggere l’esercizio di un allenamento concluso', () => {
  /** voce di sessione con una serie fatta */
  const entry = (id: string, exerciseId: string, alternativeOf: string | null = null) => ({
    id,
    exerciseId,
    alternativeOf,
    group: null,
    rest: 90,
    warmupRest: 60,
    notes: '',
    sets: [{ id: `${id}-s1`, type: 'normal' as const, kg: 60, reps: 8, completedAt: NOW - 3_600_000 }],
  });
  const done = (id: string, exercises: ReturnType<typeof entry>[], end: number | null = NOW - 1_800_000): Archive['sessions'][number] => ({
    id,
    date: '2026-10-08',
    routineId: 'routine-a',
    name: 'Scheda A',
    start: NOW - 7_200_000,
    end,
    exercises,
  });
  const base = (): Archive => ({
    ...withAB(),
    sessions: [
      done('sbagliata', [entry('e1', 'leg-press'), entry('e2', 'panca-piana-bilanciere'), entry('e3', 'leg-press')]),
      done('altra', [entry('e4', 'leg-press')]),
    ],
  });

  it('sposta le voci con le serie com’erano, solo in quell’allenamento', () => {
    const a = base();
    const { archive, before } = reassignExercise(a, 'sbagliata', 'leg-press', 'leg-press-piedi-a-meta-pedana');
    const fixed = archive.sessions.find((s) => s.id === 'sbagliata')!;
    expect(fixed.exercises.map((e) => e.exerciseId)).toEqual(['leg-press-piedi-a-meta-pedana', 'panca-piana-bilanciere', 'leg-press-piedi-a-meta-pedana']);
    expect(fixed.exercises[0].sets).toEqual(a.sessions[0].exercises[0].sets);
    expect(archive.sessions.find((s) => s.id === 'altra')).toBe(a.sessions[1]);
    expect(archive.routines).toBe(a.routines);
    expect(archive.catalog).toBe(a.catalog);
    expect(before.map((e) => e.id)).toEqual(['e1', 'e3']);
  });

  it('un’alternativa all’esercizio scelto non è più un’alternativa; le altre restano', () => {
    const a: Archive = { ...withAB(), sessions: [done('v', [entry('e1', 'leg-press', 'squat-bilanciere'), entry('e2', 'hack-squat', 'squat-bilanciere')])] };
    const one = reassignExercise(a, 'v', 'leg-press', 'squat-bilanciere').archive.sessions[0].exercises[0];
    expect(one).toMatchObject({ exerciseId: 'squat-bilanciere', alternativeOf: null });
    const two = reassignExercise(a, 'v', 'hack-squat', 'leg-press-piedi-a-meta-pedana').archive.sessions[0].exercises[1];
    expect(two).toMatchObject({ exerciseId: 'leg-press-piedi-a-meta-pedana', alternativeOf: 'squat-bilanciere' });
  });

  it('"Annulla" rimette le voci com’erano', () => {
    const a = base();
    const { archive, before } = reassignExercise(a, 'sbagliata', 'leg-press', 'hack-squat');
    expect(undoReassign(archive, 'sbagliata', before)).toEqual(a);
    // allenamento eliminato nel frattempo: niente da rimettere
    expect(undoReassign({ ...archive, sessions: [] }, 'sbagliata', before).sessions).toEqual([]);
  });

  it('rifiuta l’allenamento in corso, lo stesso esercizio e un esercizio assente', () => {
    const a = base();
    const running: Archive = { ...a, sessions: [done('corso', [entry('e1', 'leg-press')], null)] };
    expect(() => reassignExercise(running, 'corso', 'leg-press', 'hack-squat')).toThrow(ArchiveError);
    expect(() => reassignExercise(a, 'sbagliata', 'leg-press', 'leg-press')).toThrow(ArchiveError);
    expect(() => reassignExercise(a, 'sbagliata', 'squat-bilanciere', 'hack-squat')).toThrow(ArchiveError);
    expect(() => reassignExercise(a, 'nessuna', 'leg-press', 'hack-squat')).toThrow(ArchiveError);
  });
});
