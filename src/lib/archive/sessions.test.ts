import { describe, expect, it } from 'vitest';
import { starterRoutines, quickStart, sessionInProgress } from './routines';
import {
  FREE_SESSION_NAME,
  currentExercise,
  finishSession,
  lastFinishedSession,
  removeSession,
  reopenSession,
  restoreSession,
  sessionHasData,
  startSession,
  summarizeSession,
} from './sessions';
import { validateArchive } from './validation';
import { ArchiveError, emptyArchive, type Archive } from './types';

// sabato 10 ottobre 2026, 18:00 ora locale
const NOW = new Date(2026, 9, 10, 18, 0).getTime();
const withAB = (): Archive => ({ ...emptyArchive(), routines: starterRoutines() });

describe('US-11 avvio dell’allenamento', () => {
  it('da una scheda: una voce per esercizio con superserie, recuperi e serie vuote', () => {
    const a = withAB();
    const [routineA] = a.routines;
    const { archive, session } = startSession(a, 'routine-a', NOW);
    expect(session).toMatchObject({ date: '2026-10-10', routineId: 'routine-a', name: 'Scheda A', start: NOW, end: null });
    expect(session.exercises.map((e) => e.exerciseId)).toEqual(routineA.exercises.map((e) => e.exerciseId));
    expect(session.exercises.map((e) => e.group)).toEqual(routineA.exercises.map((e) => e.group));
    expect(session.exercises[0]).toMatchObject({ rest: routineA.exercises[0].rest, warmupRest: routineA.exercises[0].warmupRest, variantOf: null });
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
  it('concludere chiede almeno un esercizio; riaprire rimette la sessione in corso', () => {
    const free = startSession(withAB(), null, NOW);
    expect(() => finishSession(free.archive, free.session.id, NOW + 60_000)).toThrow(/almeno un esercizio/);

    const started = startSession(withAB(), 'routine-a', NOW);
    const done = finishSession(started.archive, started.session.id, NOW + 3_600_000);
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
    const done = finishSession(started.archive, started.session.id, NOW + 3_600_000);
    const start = quickStart(done, '2026-10-10');
    expect(start.rows.find((r) => r.planned)?.lastDone).toBe('2026-10-10');
    expect(start.suggested).toBe('routine-b');
  });
});
