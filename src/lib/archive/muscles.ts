// Volume per gruppo muscolare (muscle-volume, ADR-012): regole di conteggio qui, quote di una serie in types.ts (ADR-014).
// Funzioni pure: `today` è un parametro, nessuna lettura dell'orologio.
//
// Cosa conta: le serie di sessioni concluse con countsForProgress() (spuntate, non di riscaldamento);
// normali, drop e cedimento valgono 1 (D16). Limite noto: ogni drop è una riga a sé (SET_TYPES), quindi una
// drop set con due scalate vale 3 serie e probabilmente sovrastima; Havers et al. 2026 non dà un peso diverso.
import { BASE_CATALOG } from '../../data/catalog';
import { addDays, weekStart } from './calendar';
import { availableExercises } from './catalog';
import { countsForProgress } from './progress';
import { MUSCLE_GROUPS, type Archive, type MuscleGroup, type Muscles } from './types';

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Petto',
  lats: 'Dorsali',
  traps: 'Trapezio',
  'front-delts': 'Deltoidi anteriori',
  'side-delts': 'Deltoidi laterali',
  'rear-delts': 'Deltoidi posteriori',
  biceps: 'Bicipiti',
  brachialis: 'Brachiale',
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  abs: 'Addominali',
  'lower-back': 'Lombari',
  glutes: 'Glutei',
  'hip-flexors': "Flessori dell'anca",
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  popliteus: 'Popliteo',
  adductors: 'Adduttori',
  calves: 'Polpacci',
};

/** null = senza muscoli: esercizio sconosciuto, o personalizzato con la mappa vuota */
export function exerciseMuscles(archive: Pick<Archive, 'catalog'>, exerciseId: string): Muscles | null {
  const muscles = BASE_CATALOG[exerciseId]?.muscles ?? archive.catalog[exerciseId]?.muscles;
  if (!muscles || Object.keys(muscles).length === 0) return null;
  return muscles;
}

/** Gruppi di una mappa con la quota: valore decrescente, a pari valore nell'ordine di MUSCLE_GROUPS */
export function sortedMuscles(muscles: Muscles): { group: MuscleGroup; value: number }[] {
  return MUSCLE_GROUPS.filter((g) => muscles[g] !== undefined)
    .map((group) => ({ group, value: muscles[group]! }))
    .sort((a, b) => b.value - a.value);
}

/** «1 serie», «0,5 serie»: quanto conta una serie per un gruppo */
export function formatShare(value: number): string {
  return `${value.toLocaleString('it-IT')} serie`;
}

export interface WeekVolume {
  /** lunedì della settimana, YYYY-MM-DD */
  week: string;
  groups: Partial<Record<MuscleGroup, number>>;
  /** serie degli esercizi senza muscoli, per exerciseId */
  unclassified: Record<string, number>;
}

/** Le voci che contano, una per esercizio fatto in una sessione conclusa: settimana (lunedì), esercizio, serie contate */
function* countedEntries(archive: Pick<Archive, 'sessions'>): Generator<{ week: string; exerciseId: string; n: number }> {
  for (const session of archive.sessions) {
    if (session.end === null) continue;
    for (const entry of session.exercises) {
      // conta l'esercizio fatto davvero, non alternativeOf
      const n = entry.sets.filter(countsForProgress).length;
      if (n > 0) yield { week: weekStart(session.date), exerciseId: entry.exerciseId, n };
    }
  }
}

/** Una voce per settimana (lunedì, ora locale) con almeno una serie contata, in ordine di data */
export function weeklyVolume(archive: Pick<Archive, 'sessions' | 'catalog'>): WeekVolume[] {
  const byWeek = new Map<string, WeekVolume>();
  for (const { week, exerciseId, n } of countedEntries(archive)) {
    let volume = byWeek.get(week);
    if (!volume) byWeek.set(week, (volume = { week, groups: {}, unclassified: {} }));
    const muscles = exerciseMuscles(archive, exerciseId);
    if (!muscles) {
      volume.unclassified[exerciseId] = (volume.unclassified[exerciseId] ?? 0) + n;
      continue;
    }
    for (const [g, value] of Object.entries(muscles) as [MuscleGroup, number][]) volume.groups[g] = (volume.groups[g] ?? 0) + n * value;
  }
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week));
}

export interface GroupExercise {
  exerciseId: string;
  /** serie già pesate: serie contate × value */
  sets: number;
  /** quota di una serie per il gruppo */
  value: number;
}

/**
 * Esercizi che hanno dato serie a un gruppo nelle settimane indicate (lunedì), con le stesse regole di weeklyVolume
 * (US-49): serie decrescenti, a pari serie per nome dell'id. La somma delle serie è il valore del gruppo in quelle
 * settimane.
 */
export function groupExercises(archive: Pick<Archive, 'sessions' | 'catalog'>, group: MuscleGroup, weeks: readonly string[]): GroupExercise[] {
  const wanted = new Set(weeks);
  const byExercise = new Map<string, GroupExercise>();
  for (const { week, exerciseId, n } of countedEntries(archive)) {
    if (!wanted.has(week)) continue;
    const value = exerciseMuscles(archive, exerciseId)?.[group];
    if (value === undefined) continue;
    const current = byExercise.get(exerciseId) ?? { exerciseId, sets: 0, value };
    byExercise.set(exerciseId, { ...current, sets: current.sets + n * value });
  }
  return [...byExercise.values()].sort((a, b) => b.sets - a.sets || a.exerciseId.localeCompare(b.exerciseId));
}

/**
 * Esercizi del catalogo (base e personalizzati) che danno serie a un gruppo, fatti o no (foglio del gruppo in
 * Progressi): quota decrescente, a pari quota per nome.
 */
export function groupCatalog(archive: Pick<Archive, 'catalog'>, group: MuscleGroup): { exerciseId: string; name: string; value: number }[] {
  return availableExercises(archive)
    .flatMap((e) => {
      const value = exerciseMuscles(archive, e.id)?.[group];
      return value === undefined ? [] : [{ exerciseId: e.id, name: e.name, value }];
    })
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'it'));
}

export type VolumePeriod = 'week' | '4w' | '12w';

export interface PeriodVolume {
  /** solo > 0, decrescenti, a pari valore nell'ordine di MUSCLE_GROUPS */
  groups: { group: MuscleGroup; sets: number }[];
  /** decrescenti */
  unclassified: { exerciseId: string; sets: number }[];
  /** divisore; 0 = nessuna settimana conclusa nel periodo */
  weeks: number;
  /** true solo con 'week' */
  partial: boolean;
}

const PERIOD_WEEKS: Record<Exclude<VolumePeriod, 'week'>, number> = { '4w': 4, '12w': 12 };

/**
 * 'week': totali della settimana di today. '4w' e '12w': media per settimana delle 4 o 12 settimane concluse
 * prima di quella in corso, contando solo quelle dalla prima settimana di `weeks` in poi; le settimane vuote
 * nel mezzo valgono zero. Nessun arrotondamento.
 */
export function periodVolume(weeks: readonly WeekVolume[], period: VolumePeriod, today: string): PeriodVolume {
  const current = weekStart(today);
  let included: string[] = [];
  if (period === 'week') included = [current];
  else if (weeks.length > 0) {
    for (let i = PERIOD_WEEKS[period]; i >= 1; i--) {
      const week = addDays(current, -7 * i);
      if (week >= weeks[0].week) included.push(week);
    }
  }
  const divisor = period === 'week' ? 1 : included.length;
  const groups: Partial<Record<MuscleGroup, number>> = {};
  const unclassified: Record<string, number> = {};
  for (const w of weeks) {
    if (!included.includes(w.week)) continue;
    for (const [g, sets] of Object.entries(w.groups) as [MuscleGroup, number][]) groups[g] = (groups[g] ?? 0) + sets;
    for (const [id, sets] of Object.entries(w.unclassified)) unclassified[id] = (unclassified[id] ?? 0) + sets;
  }
  return {
    groups: MUSCLE_GROUPS.filter((g) => (groups[g] ?? 0) > 0)
      .map((group) => ({ group, sets: groups[group]! / divisor }))
      .sort((a, b) => b.sets - a.sets),
    unclassified: Object.entries(unclassified)
      .map(([exerciseId, sets]) => ({ exerciseId, sets: sets / divisor }))
      .sort((a, b) => b.sets - a.sets),
    weeks: divisor,
    partial: period === 'week',
  };
}

/** Settimane della linea di un gruppo (US-46): le concluse prima di quella in corso */
export const TREND_WEEKS = 12;

export interface GroupWeek {
  /** lunedì della settimana, YYYY-MM-DD */
  week: string;
  sets: number;
  /** true solo per la settimana in corso */
  partial: boolean;
}

/**
 * Serie di un gruppo settimana per settimana: le TREND_WEEKS concluse più quella in corso, zero dove il gruppo non
 * ha serie, nessuna settimana prima della prima di `weeks` (stesso inizio delle medie di periodVolume).
 */
export function groupWeeks(weeks: readonly WeekVolume[], group: MuscleGroup, today: string): GroupWeek[] {
  if (weeks.length === 0) return [];
  const current = weekStart(today);
  const points: GroupWeek[] = [];
  for (let i = TREND_WEEKS; i >= 0; i--) {
    const week = addDays(current, -7 * i);
    if (week < weeks[0].week) continue;
    points.push({ week, sets: weeks.find((w) => w.week === week)?.groups[group] ?? 0, partial: i === 0 });
  }
  return points;
}
