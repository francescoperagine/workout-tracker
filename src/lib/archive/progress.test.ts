import { describe, expect, it } from 'vitest';
import { EPLEY_MAX_REPS, type ExercisePoint, exerciseHistory, exercisesDone, epley, personalRecords, pointsInPeriod, sessionRecords } from './progress';
import { emptyArchive, type Archive, type Session, type SessionExercise, type SessionSet, type SetType } from './types';

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

function running(id: string, date: string, exercises: SessionExercise[], start = new Date(`${date}T18:00:00`).getTime()): Session {
  return { id, date, routineId: null, name: 'Allenamento libero', start, end: null, exercises };
}

const archive = (...sessions: Session[]): Pick<Archive, 'sessions'> => ({ ...emptyArchive(), sessions });

/** Un punto con la sola data che conta per gli intervalli */
function dayPoint(date: string, value: number): ExercisePoint {
  return { sessionId: date, date, start: 0, maxLoad: value, maxLoadReps: 5, e1rm: value, volume: value, sets: [] };
}

describe('US-28 formula di Epley', () => {
  it('US-28 con una ripetizione l’1RM è il carico, altrimenti è kg × (1 + rip / 30) al mezzo chilo', () => {
    expect(epley(100, 1)).toBe(100);
    expect(epley(100, 10)).toBe(133.5);
    expect(epley(42.5, 8)).toBe(54);
    expect(EPLEY_MAX_REPS).toBe(12);
  });
});

describe('US-28 storico per esercizio', () => {
  it('US-28 il riscaldamento non conta per carico, 1RM e volume, ma resta nella cronologia', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('w', 100, 5, true, 'warmup'), set('1', 60, 5), set('2', 50, 10)])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point).toMatchObject({ maxLoad: 60, maxLoadReps: 5, e1rm: epley(60, 5), volume: 60 * 5 + 50 * 10 });
    expect(point.sets.map((p) => p.id)).toEqual(['w', '1', '2']);
  });

  it('US-28 drop e cedimento contano per carico e volume ma non per l’1RM', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', 60, 5), set('2', 50, 10, true, 'drop'), set('3', 40, 3, true, 'failure')])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point.maxLoad).toBe(60);
    expect(point.maxLoadReps).toBe(5);
    expect(point.volume).toBe(60 * 5 + 50 * 10 + 40 * 3);
    expect(point.e1rm).toBe(epley(60, 5));
  });

  it('US-28 oltre il limite di ripetizioni la serie conta per carico e volume, non per l’1RM', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', 30, EPLEY_MAX_REPS + 8)])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point).toMatchObject({ maxLoad: 30, maxLoadReps: EPLEY_MAX_REPS + 8, e1rm: null, volume: 30 * (EPLEY_MAX_REPS + 8) });
  });

  it('US-28 le serie non spuntate non contano e non entrano nella cronologia', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', 80, 5, false), set('2', 50, 10)])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point).toMatchObject({ maxLoad: 50, maxLoadReps: 10, e1rm: epley(50, 10), volume: 500 });
    expect(point.sets.map((p) => p.id)).toEqual(['2']);
  });

  it('US-28 la variante fatta è un esercizio a sé: compare solo sotto il suo id', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'a', [set('1', 60, 5)], { variantOf: 'b' })]);
    expect(exerciseHistory(archive(s), 'a')).toHaveLength(1);
    expect(exerciseHistory(archive(s), 'b')).toEqual([]);
  });

  it('US-28 una sessione in corso non entra nello storico', () => {
    const s = running('s1', '2026-10-08', [exercise('e1', 'x', [set('1', 60, 5)])]);
    expect(exerciseHistory(archive(s), 'x')).toEqual([]);
  });

  it('US-28 lo stesso esercizio due volte nella stessa sessione dà un solo punto', () => {
    const s = finished('s1', '2026-10-08', [
      exercise('e1', 'x', [set('1', 60, 5)]),
      exercise('e2', 'y', [set('9', 100, 1)]),
      exercise('e3', 'x', [set('2', 70, 5)]),
    ]);
    const points = exerciseHistory(archive(s), 'x');
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ maxLoad: 70, maxLoadReps: 5, volume: 60 * 5 + 70 * 5 });
    expect(points[0].sets.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('US-28 lo storico è ordinato dalla sessione più vecchia: prima la data, poi l’inizio', () => {
    const evening = finished('l', '2026-10-08', [exercise('e1', 'x', [set('1', 60, 5)])], new Date('2026-10-08T19:00:00').getTime());
    const morning = finished('m', '2026-10-08', [exercise('e1', 'x', [set('1', 50, 5)])], new Date('2026-10-08T09:00:00').getTime());
    const old = finished('o', '2026-10-01', [exercise('e1', 'x', [set('1', 40, 5)])]);
    expect(exerciseHistory(archive(evening, morning, old), 'x').map((p) => p.sessionId)).toEqual(['o', 'm', 'l']);
  });

  it('US-28 una sessione di solo riscaldamento dà un punto vuoto ma resta nella cronologia', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', 40, 10, true, 'warmup')])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point).toMatchObject({ maxLoad: null, maxLoadReps: null, e1rm: null, volume: 0 });
    expect(point.sets).toHaveLength(1);
  });

  it('US-28 una serie a corpo libero non dà carico né volume', () => {
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', null, 8)])]);
    const [point] = exerciseHistory(archive(s), 'x');
    expect(point).toMatchObject({ maxLoad: null, maxLoadReps: null, e1rm: null, volume: 0 });
    expect(point.sets).toHaveLength(1);
  });
});

describe('US-29 record personali', () => {
  it('US-29 a parità di valore vince il punto più vecchio', () => {
    const s1 = finished('s1', '2026-10-01', [exercise('e1', 'x', [set('1', 60, 5)])]);
    const s2 = finished('s2', '2026-10-08', [exercise('e2', 'x', [set('2', 60, 5)])]);
    const records = personalRecords(exerciseHistory(archive(s1, s2), 'x'));
    expect(records.maxLoad).toEqual({ value: 60, reps: 5, sessionId: 's1', date: '2026-10-01' });
    expect(records.e1rm).toEqual({ value: epley(60, 5), sessionId: 's1', date: '2026-10-01' });
    expect(records.volume).toEqual({ value: 300, sessionId: 's1', date: '2026-10-01' });
  });

  it('US-29 il record più alto vince anche se è più recente, ma senza superarlo non cambia', () => {
    const s1 = finished('s1', '2026-10-01', [exercise('e1', 'x', [set('1', 60, 5)])]);
    const s2 = finished('s2', '2026-10-08', [exercise('e2', 'x', [set('2', 65, 5)])]);
    expect(personalRecords(exerciseHistory(archive(s1, s2), 'x')).maxLoad).toMatchObject({ value: 65, sessionId: 's2' });
  });

  it('US-29 senza punti i record sono null, e un volume a zero non è un record', () => {
    expect(personalRecords([])).toEqual({ maxLoad: null, e1rm: null, volume: null });
    const s = finished('s1', '2026-10-08', [exercise('e1', 'x', [set('1', null, 8)])]);
    expect(personalRecords(exerciseHistory(archive(s), 'x'))).toEqual({ maxLoad: null, e1rm: null, volume: null });
  });
});

describe('US-28 intervalli dello storico', () => {
  const all = ['2025-09-01', '2025-10-12', '2026-07-11', '2026-07-12', '2026-10-12'].map((date) => dayPoint(date, 50));

  it('US-28 l’intervallo parte da oggi: tre mesi, un anno o tutto', () => {
    expect(pointsInPeriod(all, '3m', '2026-10-12').map((p) => p.date)).toEqual(['2026-07-12', '2026-10-12']);
    expect(pointsInPeriod(all, '1y', '2026-10-12').map((p) => p.date)).toEqual(['2025-10-12', '2026-07-11', '2026-07-12', '2026-10-12']);
    expect(pointsInPeriod(all, 'all', '2026-10-12')).toEqual(all);
  });
});

describe('US-28 esercizi fatti', () => {
  it('US-28 gli esercizi fatti sono elencati dal più recente, con il numero di sessioni', () => {
    const s1 = finished('s1', '2026-10-01', [exercise('e1', 'a', [set('1', 60, 5)]), exercise('e2', 'b', [set('2', null, null, false)])]);
    const s2 = finished('s2', '2026-10-08', [exercise('e3', 'a', [set('3', 65, 5)]), exercise('e4', 'c', [set('4', 20, 10)])]);
    const s3 = finished('s3', '2026-10-08', [exercise('e5', 'c', [set('5', 25, 10)])], new Date('2026-10-08T09:00:00').getTime());
    const s4 = running('s4', '2026-10-12', [exercise('e6', 'd', [set('6', 30, 5)])]);
    expect(exercisesDone(archive(s1, s2, s3, s4))).toEqual([
      { exerciseId: 'a', sessions: 2, lastDate: '2026-10-08' },
      { exerciseId: 'c', sessions: 2, lastDate: '2026-10-08' },
    ]);
  });
});

describe('US-29 record di una sessione', () => {
  it('US-29 carico, 1RM e volume oltre il meglio delle sessioni precedenti, stessa variante', () => {
    const a = finished('a', '2026-10-01', [exercise('a1', 'panca', [set('a1', 60, 8), set('a2', 60, 8)])]);
    // stesso carico, più ripetizioni: 1RM e volume sì, carico no; la variante ha il suo storico
    const b = finished('b', '2026-10-05', [
      exercise('b1', 'panca', [set('b1', 20, 10, true, 'warmup'), set('b2', 60, 10), set('b3', 60, 8)]),
      exercise('b2', 'panca-manubri', [set('b4', 30, 10)], { variantOf: 'panca' }),
    ]);
    const records = sessionRecords(archive(a, b), b);
    expect(records.map((r) => r.kind)).toEqual(['e1rm', 'volume']);
    expect(records[0]).toMatchObject({ exerciseId: 'panca', previous: epley(60, 8) });
    expect(records[1]).toMatchObject({ value: 1080, previous: 960 });
  });

  it('US-29 la prima volta non è un record, e una sessione più vecchia non vede quelle dopo', () => {
    const a = finished('a', '2026-10-01', [exercise('a1', 'panca', [set('a1', 50, 8)])]);
    const b = finished('b', '2026-10-05', [exercise('b1', 'panca', [set('b1', 70, 8)])]);
    expect(sessionRecords(archive(a, b), a)).toEqual([]);
    expect(sessionRecords(archive(a, b), b).map((r) => r.kind)).toEqual(['load', 'e1rm', 'volume']);
  });
});
