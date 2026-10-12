// Progressi per esercizio (step 8: US-28, US-29). Funzioni pure sullo storico: ogni esercizio fatto è
// una serie a sé (le varianti hanno i loro carichi), le serie di riscaldamento non contano e valgono
// solo le serie spuntate delle sessioni concluse. Pesi in kg: la conversione è solo in visualizzazione.
import { fromDateKey, toDateKey } from './dates';
import type { Archive, Session, SessionSet } from './types';

export const EPLEY_MAX_REPS = 12;

/**
 * 1RM stimato con la formula di Epley: kg × (1 + rip / 30); con 1 ripetizione è il carico stesso.
 * È una stima: arrotondata al mezzo chilo, perché "53,75 kg" promette una precisione che non ha.
 */
export function epley(kg: number, reps: number): number {
  return reps === 1 ? kg : Math.round(kg * (1 + reps / 30) * 2) / 2;
}

/**
 * true se la serie conta per l'1RM stimato: spuntata, di tipo normale (non riscaldamento, non drop,
 * non cedimento), con un carico e delle ripetizioni su cui la formula di Epley ha senso.
 */
export function countsForEpley(set: SessionSet): boolean {
  return (
    set.completedAt !== null &&
    set.type === 'normal' &&
    set.kg !== null &&
    set.kg > 0 &&
    set.reps !== null &&
    set.reps >= 1 &&
    set.reps <= EPLEY_MAX_REPS
  );
}

/** true se la serie conta per il carico massimo e il volume: spuntata e non di riscaldamento. */
export function countsForProgress(set: SessionSet): boolean {
  return set.completedAt !== null && set.type !== 'warmup';
}

export interface ExercisePoint {
  sessionId: string;
  /** YYYY-MM-DD */
  date: string;
  /** inizio della sessione */
  start: number;
  /** carico massimo (kg) tra le serie che contano; null se non c'è */
  maxLoad: number | null;
  /** ripetizioni della prima serie (in ordine) che ha raggiunto il carico massimo; null se non c'è */
  maxLoadReps: number | null;
  /** 1RM stimato più alto (epley) tra le serie che contano per l'1RM; null se non c'è */
  e1rm: number | null;
  /** somma di kg × ripetizioni delle serie che contano, in kg; 0 se non c'è */
  volume: number;
  /** le serie spuntate di questo esercizio in questa sessione (di ogni tipo), in ordine, per la cronologia */
  sets: SessionSet[];
}

/** Un punto di una sessione conclusa: carico massimo, 1RM stimato e volume delle serie che contano. */
function point(session: Session, sets: SessionSet[]): ExercisePoint {
  let maxLoad: number | null = null;
  let maxLoadReps: number | null = null;
  let e1rm: number | null = null;
  let volume = 0;
  for (const set of sets) {
    if (countsForProgress(set) && set.kg !== null) {
      if (maxLoad === null || set.kg > maxLoad) {
        maxLoad = set.kg;
        maxLoadReps = set.reps;
      }
      if (set.reps !== null) volume += set.kg * set.reps;
    }
    if (countsForEpley(set)) {
      const value = epley(set.kg!, set.reps!);
      if (e1rm === null || value > e1rm) e1rm = value;
    }
  }
  return { sessionId: session.id, date: session.date, start: session.start, maxLoad, maxLoadReps, e1rm, volume, sets };
}

/**
 * Storico di un esercizio: un punto per sessione conclusa (end !== null) in cui quell'esercizio
 * (stesso exerciseId: la variante fatta, non variantOf) ha almeno una serie spuntata (di qualsiasi
 * tipo). Se lo stesso exerciseId compare in più voci della stessa sessione, le serie si uniscono
 * nell'ordine di session.exercises. Ordinato dalla sessione più vecchia: prima la data, poi l'inizio.
 */
export function exerciseHistory(archive: Pick<Archive, 'sessions'>, exerciseId: string): ExercisePoint[] {
  const entries: { session: Session; sets: SessionSet[] }[] = [];
  for (const session of archive.sessions) {
    if (session.end === null) continue;
    const done = session.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets.filter((s) => s.completedAt !== null));
    if (done.length) entries.push({ session, sets: done });
  }
  const sorted = entries.sort((a, b) => a.session.date.localeCompare(b.session.date) || a.session.start - b.session.start);
  return sorted.map(({ session, sets }) => point(session, sets));
}

export interface Best {
  value: number;
  sessionId: string;
  date: string;
}

export interface PersonalRecords {
  /** value in kg, con le ripetizioni della serie che ha fatto il carico */
  maxLoad: (Best & { reps: number | null }) | null;
  e1rm: Best | null;
  volume: Best | null;
}

/**
 * Record personali sui punti dati (già ordinati dal più vecchio): a parità di valore vince il punto
 * più vecchio. Il record di volume esiste solo se è maggiore di zero.
 */
export function personalRecords(points: readonly ExercisePoint[]): PersonalRecords {
  const records: PersonalRecords = { maxLoad: null, e1rm: null, volume: null };
  for (const p of points) {
    if (p.maxLoad !== null && (records.maxLoad === null || p.maxLoad > records.maxLoad.value)) {
      records.maxLoad = { value: p.maxLoad, reps: p.maxLoadReps, sessionId: p.sessionId, date: p.date };
    }
    if (p.e1rm !== null && (records.e1rm === null || p.e1rm > records.e1rm.value)) {
      records.e1rm = { value: p.e1rm, sessionId: p.sessionId, date: p.date };
    }
    if (p.volume > 0 && (records.volume === null || p.volume > records.volume.value)) {
      records.volume = { value: p.volume, sessionId: p.sessionId, date: p.date };
    }
  }
  return records;
}

export type Period = '3m' | '1y' | 'all';

/**
 * I punti dell'intervallo scelto, calcolato a partire da `today` (YYYY-MM-DD, ora locale): '3m' =
 * stesso giorno tre mesi prima, '1y' = stesso giorno un anno prima, 'all' = tutti.
 */
export function pointsInPeriod(points: readonly ExercisePoint[], period: Period, today: string): ExercisePoint[] {
  if (period === 'all') return [...points];
  const start = fromDateKey(today);
  if (period === '3m') start.setMonth(start.getMonth() - 3);
  else start.setFullYear(start.getFullYear() - 1);
  const from = toDateKey(start);
  return points.filter((p) => p.date >= from);
}

export interface ExerciseDone {
  exerciseId: string;
  sessions: number;
  lastDate: string;
}

/**
 * Esercizi fatti almeno una volta (sessioni concluse, almeno una serie spuntata), dal più recente:
 * prima l'ultima data (discendente), poi l'id. `sessions` è il numero di sessioni in cui compaiono.
 */
export function exercisesDone(archive: Pick<Archive, 'sessions'>): ExerciseDone[] {
  const done = new Map<string, { sessions: number; lastDate: string }>();
  for (const session of archive.sessions) {
    if (session.end === null) continue;
    const ids = new Set(session.exercises.filter((e) => e.sets.some((s) => s.completedAt !== null)).map((e) => e.exerciseId));
    for (const id of ids) {
      const current = done.get(id);
      done.set(id, { sessions: (current?.sessions ?? 0) + 1, lastDate: current && current.lastDate > session.date ? current.lastDate : session.date });
    }
  }
  return [...done]
    .map(([exerciseId, value]) => ({ exerciseId, ...value }))
    .sort((a, b) => b.lastDate.localeCompare(a.lastDate) || a.exerciseId.localeCompare(b.exerciseId));
}

export type RecordKind = 'load' | 'e1rm' | 'volume';

export interface SessionRecord {
  exerciseId: string;
  kind: RecordKind;
  /** kg */
  value: number;
  /** il record precedente, in kg */
  previous: number;
}

/**
 * Record battuti in una sessione conclusa (US-29): per ogni esercizio, carico massimo, 1RM stimato e
 * volume oltre il meglio delle sessioni concluse prima (stessa variante). Senza storico non c'è record,
 * come per il carico nella riga serie (`loadRecords`).
 */
export function sessionRecords(archive: Pick<Archive, 'sessions'>, session: Session): SessionRecord[] {
  const records: SessionRecord[] = [];
  const ids = new Set(session.exercises.map((e) => e.exerciseId));
  for (const exerciseId of ids) {
    const history = exerciseHistory(archive, exerciseId);
    const index = history.findIndex((p) => p.sessionId === session.id);
    if (index < 1) continue;
    const best = personalRecords(history.slice(0, index));
    const point = history[index];
    const check = (kind: RecordKind, value: number | null, previous: number | undefined) => {
      if (value !== null && previous !== undefined && value > previous) records.push({ exerciseId, kind, value, previous });
    };
    check('load', point.maxLoad, best.maxLoad?.value);
    check('e1rm', point.e1rm, best.e1rm?.value);
    check('volume', point.volume > 0 ? point.volume : null, best.volume?.value);
  }
  return records;
}
