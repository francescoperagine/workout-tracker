// Volume per gruppo muscolare (muscle-volume, ADR-012): pesi e regole di conteggio stanno solo qui (D9).
// Funzioni pure: `today` è un parametro, nessuna lettura dell'orologio.
//
// Cosa conta: le serie di sessioni concluse con countsForProgress() (spuntate, non di riscaldamento);
// normali, drop e cedimento valgono 1 (D16). Limite noto: ogni drop è una riga a sé (SET_TYPES), quindi una
// drop set con due scalate vale 3 serie e probabilmente sovrastima; Havers et al. 2026 non dà un peso diverso.
import { BASE_CATALOG } from '../../data/catalog';
import { addDays, weekStart } from './calendar';
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
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  abs: 'Addominali',
  'lower-back': 'Lombari',
  glutes: 'Glutei',
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  adductors: 'Adduttori',
  calves: 'Polpacci',
};

// Conteggio frazionario: Pelland et al. 2026, Sports Medicine, DOI 10.1007/s40279-025-02344-w (D2).
export const PRIMARY_SETS = 1;
export const SECONDARY_SETS = 0.5;

/** null = senza muscoli: esercizio sconosciuto, o personalizzato con entrambe le liste vuote */
export function exerciseMuscles(archive: Pick<Archive, 'catalog'>, exerciseId: string): Muscles | null {
  const muscles = BASE_CATALOG[exerciseId]?.muscles ?? archive.catalog[exerciseId]?.muscles;
  if (!muscles || (muscles.primary.length === 0 && muscles.secondary.length === 0)) return null;
  return muscles;
}

export interface WeekVolume {
  /** lunedì della settimana, YYYY-MM-DD */
  week: string;
  groups: Partial<Record<MuscleGroup, number>>;
  /** serie degli esercizi senza muscoli, per exerciseId */
  unclassified: Record<string, number>;
}

/** Una voce per settimana (lunedì, ora locale) con almeno una serie contata, in ordine di data */
export function weeklyVolume(archive: Pick<Archive, 'sessions' | 'catalog'>): WeekVolume[] {
  const byWeek = new Map<string, WeekVolume>();
  for (const session of archive.sessions) {
    if (session.end === null) continue;
    for (const entry of session.exercises) {
      // conta l'esercizio fatto davvero, non alternativeOf
      const n = entry.sets.filter(countsForProgress).length;
      if (n === 0) continue;
      const week = weekStart(session.date);
      let volume = byWeek.get(week);
      if (!volume) byWeek.set(week, (volume = { week, groups: {}, unclassified: {} }));
      const muscles = exerciseMuscles(archive, entry.exerciseId);
      if (!muscles) {
        volume.unclassified[entry.exerciseId] = (volume.unclassified[entry.exerciseId] ?? 0) + n;
        continue;
      }
      for (const g of muscles.primary) volume.groups[g] = (volume.groups[g] ?? 0) + n * PRIMARY_SETS;
      for (const g of muscles.secondary) volume.groups[g] = (volume.groups[g] ?? 0) + n * SECONDARY_SETS;
    }
  }
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week));
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
