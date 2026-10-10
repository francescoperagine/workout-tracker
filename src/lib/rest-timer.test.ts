import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { starterRoutines } from './archive/routines';
import { startSession } from './archive/sessions';
import { emptyArchive, type Archive, type Session, type SessionExercise, type SessionSet } from './archive/types';
import { localRestNotifier } from './rest-notifier';
import {
  crossedThreshold,
  isRestOver,
  nextSetText,
  parseRestTimer,
  restAfterCheck,
  restFraction,
  restIsStale,
  restOverFor,
  restRemaining,
  shiftRest,
  startRest,
  type RestTimerState,
} from './rest-timer';

// Timer di recupero (step 7): il motore si basa sull'istante di fine, quindi i test usano un orologio
// finto (vi.useFakeTimers) e spostano il tempo come farebbe lo schermo bloccato.

const T0 = new Date(2026, 9, 10, 18, 0).getTime();
const TARGET = { sessionId: 's1', exerciseId: 'e1', setId: 'set1' };

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
});
afterEach(() => vi.useRealTimers());

function set(id: string, done: boolean, extra: Partial<SessionSet> = {}): SessionSet {
  return { id, type: 'normal', kg: 40, reps: 8, completedAt: done ? T0 : null, ...extra };
}

function exercise(id: string, sets: SessionSet[], extra: Partial<SessionExercise> = {}): SessionExercise {
  return { id, exerciseId: 'squat-bilanciere', variantOf: null, group: null, rest: 90, warmupRest: 45, notes: '', sets, ...extra };
}

describe('conteggio dall’istante di fine (US-21, US-26)', () => {
  it('US-21 parte con la durata intera e scende a scatti di un secondo', () => {
    const timer = startRest(TARGET, { seconds: 120, warmup: false }, Date.now())!;
    expect(restRemaining(timer, Date.now())).toBe(120);
    expect(restFraction(timer, Date.now())).toBe(1);
    vi.advanceTimersByTime(400);
    // arrotondato per eccesso: per tutto il primo secondo resta 2:00
    expect(restRemaining(timer, Date.now())).toBe(120);
    vi.advanceTimersByTime(600);
    expect(restRemaining(timer, Date.now())).toBe(119);
    vi.advanceTimersByTime(59_000);
    expect(restRemaining(timer, Date.now())).toBe(60);
    expect(restFraction(timer, Date.now())).toBe(0.5);
  });

  it('US-21 durata 0 = nessun timer', () => {
    expect(startRest(TARGET, { seconds: 0, warmup: false }, T0)).toBeNull();
  });

  it('US-26 dopo lo schermo bloccato il tempo è giusto, o il recupero è finito da tanto', () => {
    const timer = startRest(TARGET, { seconds: 90, warmup: false }, Date.now())!;
    // nessuno scatto mentre il telefono è bloccato: il tempo si ricalcola dalla fine
    vi.setSystemTime(T0 + 61_500);
    expect(restRemaining(timer, Date.now())).toBe(29);
    expect(isRestOver(timer, Date.now())).toBe(false);
    vi.setSystemTime(T0 + 90_000 + 83_000);
    expect(restRemaining(timer, Date.now())).toBe(0);
    expect(isRestOver(timer, Date.now())).toBe(true);
    expect(restOverFor(timer, Date.now())).toBe(83);
  });

  it('US-26 lo stato salvato si rilegge identico; un contenuto rovinato vale come nessun timer', () => {
    const timer = startRest(TARGET, { seconds: 90, warmup: true }, T0)!;
    expect(parseRestTimer(JSON.stringify(timer))).toEqual(timer);
    expect(parseRestTimer('{rotto')).toBeNull();
    expect(parseRestTimer(JSON.stringify({ ...timer, end: 'domani' }))).toBeNull();
    expect(parseRestTimer(null)).toBeNull();
  });
});

describe('−15 s, +15 s (US-22)', () => {
  it('US-22 +15 s allunga la fine e la durata; −15 s accorcia', () => {
    let timer = startRest(TARGET, { seconds: 120, warmup: false }, Date.now())!;
    vi.advanceTimersByTime(10_000);
    timer = shiftRest(timer, 15, Date.now());
    expect(restRemaining(timer, Date.now())).toBe(125);
    expect(timer.duration).toBe(135);
    timer = shiftRest(timer, -15, Date.now());
    timer = shiftRest(timer, -15, Date.now());
    expect(restRemaining(timer, Date.now())).toBe(95);
    expect(timer.duration).toBe(105);
  });

  it('US-22 −15 s con meno di 15 s chiude il recupero, mai una fine nel passato', () => {
    let timer = startRest(TARGET, { seconds: 60, warmup: false }, Date.now())!;
    vi.advanceTimersByTime(50_000);
    timer = shiftRest(timer, -15, Date.now());
    expect(timer.end).toBe(Date.now());
    expect(isRestOver(timer, Date.now())).toBe(true);
    // a recupero finito non cambia più
    expect(shiftRest(timer, 15, Date.now())).toBe(timer);
  });
});

describe('quale recupero parte alla spunta (US-21, US-25)', () => {
  it('US-21 recupero dell’esercizio, o di riscaldamento per una serie di riscaldamento', () => {
    const session = { exercises: [exercise('e1', [set('w', true, { type: 'warmup' }), set('a', true), set('b', false)])] };
    expect(restAfterCheck(session, 'e1', 'a')).toEqual({ seconds: 90, warmup: false });
    expect(restAfterCheck(session, 'e1', 'w')).toEqual({ seconds: 45, warmup: true });
    // una serie non spuntata (o sparita) non avvia nulla
    expect(restAfterCheck(session, 'e1', 'b')).toBeNull();
    expect(restAfterCheck(session, 'e1', 'x')).toBeNull();
  });

  it('US-21 recupero 0 = nessun timer, anche solo per il riscaldamento', () => {
    const session = { exercises: [exercise('e1', [set('w', true, { type: 'warmup' }), set('a', true)], { rest: 0, warmupRest: 0 })] };
    expect(restAfterCheck(session, 'e1', 'a')).toBeNull();
    expect(restAfterCheck(session, 'e1', 'w')).toBeNull();
  });

  it('US-25 in superserie il recupero parte solo a fine giro (2a → 2b → recupero)', () => {
    const a = (doneA: number, doneB: number) => ({
      exercises: [
        exercise('2a', [0, 1, 2].map((i) => set(`a${i}`, i < doneA)), { group: '2', rest: 60 }),
        exercise('2b', [0, 1, 2].map((i) => set(`b${i}`, i < doneB)), { group: '2', rest: 75 }),
      ],
    });
    // dopo 2a il giro continua con 2b
    expect(restAfterCheck(a(1, 0), '2a', 'a0')).toBeNull();
    // dopo 2b il giro è chiuso: recupero di 2b
    expect(restAfterCheck(a(1, 1), '2b', 'b0')).toEqual({ seconds: 75, warmup: false });
    // iniziare da 2b: il giro si chiude con 2a
    expect(restAfterCheck(a(0, 1), '2b', 'b0')).toBeNull();
    expect(restAfterCheck(a(1, 1), '2a', 'a0')).toEqual({ seconds: 60, warmup: false });
  });

  it('US-25 se 2b ha finito le sue serie, ogni serie di 2a chiude il giro', () => {
    const session = {
      exercises: [
        exercise('2a', [set('a0', true), set('a1', true), set('a2', true), set('a3', true)], { group: '2', rest: 60 }),
        exercise('2b', [set('b0', true), set('b1', true), set('b2', true)], { group: '2' }),
      ],
    };
    expect(restAfterCheck(session, '2a', 'a3')).toEqual({ seconds: 60, warmup: false });
  });
});

describe('timer che non vale più (US-22)', () => {
  const session: Session = {
    id: 's1',
    date: '2026-10-10',
    routineId: null,
    name: 'Libero',
    start: T0,
    end: null,
    exercises: [exercise('e1', [set('set1', true)])],
  };
  const timer = startRest(TARGET, { seconds: 90, warmup: false }, T0)!;
  const archive = (s: Session) => ({ sessions: [s] });

  it('US-22 resta valido finché la serie è spuntata nella sessione in corso', () => {
    expect(restIsStale(timer, archive(session))).toBe(false);
  });

  it('US-22 togliere la spunta, togliere la serie o concludere annulla il timer', () => {
    const unchecked = { ...session, exercises: [exercise('e1', [set('set1', false)])] };
    expect(restIsStale(timer, archive(unchecked))).toBe(true);
    expect(restIsStale(timer, archive({ ...session, exercises: [exercise('e1', [])] }))).toBe(true);
    expect(restIsStale(timer, archive({ ...session, end: T0 + 1 }))).toBe(true);
    expect(restIsStale(timer, { sessions: [] })).toBe(true);
  });
});

describe('annunci solo alle soglie (P9)', () => {
  it('P9 30 s, 10 s e fine; nessun annuncio negli altri secondi', () => {
    expect(crossedThreshold(31, 30)).toBe(30);
    expect(crossedThreshold(30, 29)).toBeNull();
    expect(crossedThreshold(11, 10)).toBe(10);
    expect(crossedThreshold(1, 0)).toBe(0);
    expect(crossedThreshold(0, 0)).toBeNull();
  });

  it('P9 dopo un salto si annuncia solo l’ultima soglia superata', () => {
    expect(crossedThreshold(45, 5)).toBe(10);
    expect(crossedThreshold(45, 0)).toBe(0);
  });
});

describe('prossima serie (US-21)', () => {
  function withSession(change: (a: Archive, s: Session) => void = () => {}) {
    const base: Archive = { ...emptyArchive(), routines: starterRoutines() };
    const { archive, session } = startSession(base, 'routine-a', T0);
    change(archive, session);
    return { archive: { ...archive, sessions: archive.sessions.map((s) => (s.id === session.id ? session : s)) }, session };
  }

  it('US-21 esercizio, serie e target della scheda', () => {
    const { archive, session } = withSession();
    const bench = session.exercises[1];
    expect(nextSetText(archive, session, { exercise: bench, set: bench.sets[1] })).toBe('Panca piana bilanciere ·\u00a0serie\u00a02 ·\u00a040\u00a0kg\u00a0×\u00a06–8');
  });

  it('US-21 i valori già scritti vincono sui target; senza peso restano le ripetizioni', () => {
    const { archive, session } = withSession((_, s) => Object.assign(s.exercises[1].sets[0], { kg: 42.5, reps: 7 }));
    const bench = session.exercises[1];
    expect(nextSetText(archive, session, { exercise: bench, set: bench.sets[0] })).toBe('Panca piana bilanciere ·\u00a0serie\u00a01 ·\u00a042,5\u00a0kg\u00a0×\u00a07');
    const free = exercise('x', [set('x1', false, { kg: null, reps: 12 })]);
    expect(nextSetText(archive, { ...session, routineId: null, exercises: [free] }, { exercise: free, set: free.sets[0] })).toBe('Squat bilanciere ·\u00a0serie\u00a01 ·\u00a012\u00a0rip');
  });

  it('US-21 all’ultima serie non c’è una prossima', () => {
    const { archive, session } = withSession();
    expect(nextSetText(archive, session, null)).toBeNull();
  });
});

describe('avviso locale (predisposizione Web Push)', () => {
  it('US-24 avvisa alla fine, una volta; riprogrammare o annullare sostituisce l’avviso', async () => {
    const ended: string[] = [];
    const notifier = localRestNotifier((t) => ended.push(t.setId));
    const timer: RestTimerState = startRest(TARGET, { seconds: 30, warmup: false }, Date.now())!;
    await notifier.schedule(timer);
    vi.advanceTimersByTime(20_000);
    await notifier.schedule(shiftRest(timer, 15, Date.now()));
    vi.advanceTimersByTime(15_000);
    expect(ended).toEqual([]);
    vi.advanceTimersByTime(10_000);
    expect(ended).toEqual(['set1']);

    await notifier.schedule(startRest({ ...TARGET, setId: 'set2' }, { seconds: 30, warmup: false }, Date.now())!);
    await notifier.cancel('set2');
    vi.advanceTimersByTime(60_000);
    expect(ended).toEqual(['set1']);
  });
});
