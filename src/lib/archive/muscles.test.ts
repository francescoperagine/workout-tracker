import { describe, expect, it } from 'vitest';
import { exerciseMuscles, formatShare, groupExercises, groupWeeks, MUSCLE_LABELS, periodVolume, sortedMuscles, weeklyVolume, type WeekVolume } from './muscles';
import { emptyArchive, MOST_RECRUITED, MUSCLE_GROUPS, RECRUITED, type Muscles, type Archive, type CustomExercise, type Session, type SessionExercise, type SessionSet, type SetType } from './types';

const PANCA = 'panca-piana-manubri'; // petto 1; tricipiti e deltoidi anteriori 0,5 (Delavier p. 77)
const SQUAT = 'squat-manubri'; // quadricipiti e glutei 1 (Delavier p. 123)

let n = 0;
function set(type: SetType = 'normal', done = true): SessionSet {
  return { id: `s${n++}`, type, kg: 50, reps: 8, completedAt: done ? 1 : null };
}

function exercise(exerciseId: string, sets: SessionSet[], alternativeOf: string | null = null): SessionExercise {
  return { id: `e${n++}`, exerciseId, alternativeOf, group: null, rest: 90, warmupRest: 60, notes: '', sets };
}

function session(date: string, exercises: SessionExercise[], ended = true): Session {
  const start = new Date(`${date}T18:00:00`).getTime();
  return { id: `x${n++}`, date, routineId: null, name: 'Allenamento libero', start, end: ended ? start + 3_600_000 : null, exercises };
}

function custom(id: string, muscles: Muscles): CustomExercise {
  return { id, name: id, muscles, variantOf: null };
}

function archive(sessions: Session[], ...customs: CustomExercise[]): Pick<Archive, 'sessions' | 'catalog'> {
  return { ...emptyArchive(), sessions, catalog: Object.fromEntries(customs.map((c) => [c.id, c])) };
}

const sets = (k: number, type: SetType = 'normal') => Array.from({ length: k }, () => set(type));

describe('quote nei testi', () => {
  it('sortedMuscles: valore decrescente, a pari valore nell’ordine di MUSCLE_GROUPS', () => {
    expect(sortedMuscles({ triceps: 0.5, chest: 1, 'front-delts': 0.5, quads: 1 })).toEqual([
      { group: 'chest', value: 1 }, { group: 'quads', value: 1 }, { group: 'front-delts', value: 0.5 }, { group: 'triceps', value: 0.5 },
    ]);
  });

  it('formatShare: «1 serie», «0,5 serie»', () => {
    expect([formatShare(1), formatShare(0.5)]).toEqual(['1 serie', '0,5 serie']);
  });
});

describe('volume per muscolo: conteggio', () => {
  it('etichette e quote: un gruppo per ogni MUSCLE_GROUPS, «most recruited» 1 e «recruited» 0,5', () => {
    expect(Object.keys(MUSCLE_LABELS).sort()).toEqual([...MUSCLE_GROUPS].sort());
    expect([MOST_RECRUITED, RECRUITED]).toEqual([1, 0.5]);
  });

  it('ogni gruppo riceve serie × valore: {chest: 1, triceps: 0,5} con 3 serie dà petto 3 e tricipiti 1,5', () => {
    const a = archive([session('2026-11-03', [exercise('mio', sets(3))])], custom('mio', { chest: 1, triceps: 0.5 }));
    expect(weeklyVolume(a)[0].groups).toEqual({ chest: 3, triceps: 1.5 });
  });

  it('con più gruppi a 1 ciascuno riceve una serie intera', () => {
    const [week] = weeklyVolume(archive([session('2026-11-03', [exercise(PANCA, sets(3)), exercise(SQUAT, sets(2))])]));
    expect(week.groups).toEqual({ chest: 3, triceps: 1.5, 'front-delts': 1.5, quads: 2, glutes: 2 });
  });

  it('riscaldamento e serie non spuntate non contano; drop e cedimento contano 1', () => {
    const s = session('2026-11-03', [exercise(PANCA, [set('warmup'), set('normal', false), set('normal'), set('drop'), set('failure')])]);
    expect(weeklyVolume(archive([s]))[0].groups.chest).toBe(3);
  });

  it('la sessione in corso non conta', () => {
    expect(weeklyVolume(archive([session('2026-11-10', [exercise(PANCA, sets(3))], false)]))).toEqual([]);
  });

  it('personalizzati: con muscoli contati con i loro, senza muscoli o sconosciuti in unclassified, con soli 0,5 contati', () => {
    const a = archive(
      [session('2026-11-03', [exercise('crunch', sets(2)), exercise('vuoto', sets(3)), exercise('ignoto', sets(1)), exercise('solo-sec', sets(2))])],
      custom('crunch', { abs: 1 }), custom('vuoto', {}), custom('solo-sec', { forearms: 0.5 }),
    );
    expect(exerciseMuscles(a, 'vuoto')).toBeNull();
    expect(exerciseMuscles(a, 'ignoto')).toBeNull();
    expect(exerciseMuscles(a, PANCA)?.chest).toBe(1);
    const [week] = weeklyVolume(a);
    expect(week.groups).toEqual({ abs: 2, forearms: 1 });
    expect(week.unclassified).toEqual({ vuoto: 3, ignoto: 1 });
  });

  it('conta exerciseId, non alternativeOf', () => {
    const [week] = weeklyVolume(archive([session('2026-11-03', [exercise(SQUAT, sets(2), PANCA)])]));
    expect(week.groups.chest).toBeUndefined();
    expect(week.groups.quads).toBe(2);
  });

  it('domenica 8 novembre 2026 sta nella settimana del 2, lunedì 9 in quella del 9; in ordine di data', () => {
    const weeks = weeklyVolume(archive([session('2026-11-09', [exercise(PANCA, sets(1))]), session('2026-11-08', [exercise(PANCA, sets(2))])]));
    expect(weeks.map((w) => [w.week, w.groups.chest])).toEqual([['2026-11-02', 2], ['2026-11-09', 1]]);
  });
});

describe('volume per muscolo: periodi', () => {
  const TODAY = '2026-11-10'; // martedì; settimana in corso dal 9
  const week = (w: string, groups: WeekVolume['groups'], unclassified: WeekVolume['unclassified'] = {}): WeekVolume => ({ week: w, groups, unclassified });

  it("'week': totali della settimana in corso, parziale", () => {
    const weeks = [week('2026-11-02', { chest: 10 }), week('2026-11-09', { chest: 4, quads: 2 }, { vuoto: 1 })];
    expect(periodVolume(weeks, 'week', TODAY)).toEqual({
      groups: [{ group: 'chest', sets: 4 }, { group: 'quads', sets: 2 }],
      unclassified: [{ exerciseId: 'vuoto', sets: 1 }],
      weeks: 1,
      partial: true,
    });
  });

  it("'4w': esclude la settimana in corso e con due settimane concluse divide per 2", () => {
    const weeks = [week('2026-10-26', { chest: 6 }, { vuoto: 2 }), week('2026-11-02', { chest: 4 }), week('2026-11-09', { chest: 100 })];
    expect(periodVolume(weeks, '4w', TODAY)).toEqual({
      groups: [{ group: 'chest', sets: 5 }],
      unclassified: [{ exerciseId: 'vuoto', sets: 1 }],
      weeks: 2,
      partial: false,
    });
  });

  it("'4w': una settimana vuota nel mezzo conta zero; fuori dal periodo non conta", () => {
    const weeks = [week('2026-10-05', { chest: 50 }), week('2026-10-12', { chest: 3 }), week('2026-11-02', { chest: 5 })];
    const p = periodVolume(weeks, '4w', TODAY);
    expect(p.weeks).toBe(4);
    expect(p.groups).toEqual([{ group: 'chest', sets: 2 }]);
    expect(periodVolume(weeks, '12w', TODAY)).toMatchObject({ weeks: 5, groups: [{ group: 'chest', sets: 58 / 5 }] });
  });

  it("'4w': nessuna settimana conclusa dà weeks 0 e nessun gruppo", () => {
    expect(periodVolume([week('2026-11-09', { chest: 4 })], '4w', TODAY)).toEqual({ groups: [], unclassified: [], weeks: 0, partial: false });
    expect(periodVolume([], '12w', TODAY).weeks).toBe(0);
  });

  it('gruppi a zero assenti; ordine decrescente, a pari valore quello di MUSCLE_GROUPS', () => {
    const p = periodVolume([week('2026-11-09', { calves: 2, quads: 3, chest: 2, biceps: 0 })], 'week', TODAY);
    expect(p.groups).toEqual([{ group: 'quads', sets: 3 }, { group: 'chest', sets: 2 }, { group: 'calves', sets: 2 }]);
  });
});

describe('volume per muscolo: linea settimanale di un gruppo (US-46)', () => {
  const TODAY = '2026-11-10'; // martedì; settimana in corso dal 9
  const week = (w: string, groups: WeekVolume['groups']): WeekVolume => ({ week: w, groups, unclassified: {} });

  it('13 punti: 12 settimane concluse più quella in corso, parziale; zeri nelle settimane vuote', () => {
    const weeks = [week('2026-06-01', { chest: 9 }), week('2026-09-07', { chest: 3 }), week('2026-10-26', { quads: 5 }), week('2026-11-09', { chest: 2 })];
    const points = groupWeeks(weeks, 'chest', TODAY);
    expect(points).toHaveLength(13);
    expect(points[0]).toEqual({ week: '2026-08-17', sets: 0, partial: false });
    expect(points.find((p) => p.week === '2026-09-07')?.sets).toBe(3);
    expect(points.find((p) => p.week === '2026-10-26')?.sets).toBe(0);
    expect(points.at(-1)).toEqual({ week: '2026-11-09', sets: 2, partial: true });
    expect(points.filter((p) => p.partial)).toHaveLength(1);
  });

  it('nessun punto prima della prima settimana con dati; archivio vuoto, nessun punto', () => {
    const points = groupWeeks([week('2026-10-26', { quads: 5 })], 'chest', TODAY);
    expect(points.map((p) => [p.week, p.sets])).toEqual([['2026-10-26', 0], ['2026-11-02', 0], ['2026-11-09', 0]]);
    expect(groupWeeks([], 'chest', TODAY)).toEqual([]);
  });
});

describe('US-49 esercizi che hanno dato serie a un gruppo', () => {
  const a = archive(
    [
      session('2026-10-27', [exercise(PANCA, sets(2)), exercise('mio', sets(4))]),
      session('2026-11-03', [exercise(PANCA, sets(3)), exercise(SQUAT, sets(5)), exercise(PANCA, [set('warmup')])]),
      session('2026-11-10', [exercise(PANCA, sets(9))], false),
    ],
    custom('mio', { triceps: 1, chest: 0.5 }),
  );

  it('serie pesate per esercizio nelle settimane indicate, decrescenti; la somma è il valore del gruppo', () => {
    expect(groupExercises(a, 'triceps', ['2026-10-26', '2026-11-02'])).toEqual([
      { exerciseId: 'mio', sets: 4, value: 1 },
      { exerciseId: PANCA, sets: 2.5, value: 0.5 },
    ]);
    const weeks = weeklyVolume(a);
    expect(groupExercises(a, 'chest', ['2026-11-02']).reduce((sum, e) => sum + e.sets, 0)).toBe(weeks.find((w) => w.week === '2026-11-02')!.groups.chest);
  });

  it('una settimana sola, un gruppo senza esercizi, la sessione in corso e il riscaldamento non contano', () => {
    // a pari serie, in ordine di id
    expect(groupExercises(a, 'chest', ['2026-10-26'])).toEqual([
      { exerciseId: 'mio', sets: 2, value: 0.5 },
      { exerciseId: PANCA, sets: 2, value: 1 },
    ]);
    expect(groupExercises(a, 'calves', ['2026-10-26', '2026-11-02'])).toEqual([]);
    expect(groupExercises(a, 'chest', ['2026-11-09'])).toEqual([]);
  });
});
