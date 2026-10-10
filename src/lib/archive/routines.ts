// Schede: dati iniziali, pianificazione del giorno e avvio rapido dalle ultime schede fatte (US-11).
import { STARTER_ROUTINES } from '../../data/starter-routines';
import { weekdayOf } from './dates';
import type { Archive, Routine, Session } from './types';

/** Copia profonda delle schede A/B del PoC, per non condividere oggetti con il modulo dei dati. */
export function starterRoutines(): Routine[] {
  return structuredClone(STARTER_ROUTINES) as Routine[];
}

/** "Inizia con le schede di esempio" (US-01): aggiunge le schede iniziali che mancano, per id. */
export function withStarterRoutines(archive: Archive): Archive {
  const present = new Set(archive.routines.map((r) => r.id));
  const missing = starterRoutines().filter((r) => !present.has(r.id));
  return missing.length ? { ...archive, routines: [...archive.routines, ...missing] } : archive;
}

export function activeRoutines(archive: Pick<Archive, 'routines'>): Routine[] {
  return archive.routines.filter((r) => !r.archived);
}

export type DayPlan =
  | { kind: 'routine'; routine: Routine; override: boolean }
  | { kind: 'rest'; override: boolean }
  | { kind: 'none' };

/**
 * Cosa prevede una data: l'eccezione per quella data vince sulla pianificazione settimanale.
 * Una scheda archiviata o non più esistente vale come "nulla di pianificato".
 */
export function planFor(archive: Pick<Archive, 'routines' | 'schedule' | 'overrides'>, date: string): DayPlan {
  const override = Object.hasOwn(archive.overrides, date);
  const value = override ? archive.overrides[date] : archive.schedule[weekdayOf(date)];
  if (value === undefined) return { kind: 'none' };
  if (value === null) return { kind: 'rest', override };
  const routine = archive.routines.find((r) => r.id === value && !r.archived);
  return routine ? { kind: 'routine', routine, override } : { kind: 'none' };
}

/** Ordine dalla più recente: data, poi inizio. */
function mostRecentFirst(a: Session, b: Session): number {
  return b.date.localeCompare(a.date) || b.start - a.start;
}

export function sessionInProgress(archive: Pick<Archive, 'sessions'>): Session | null {
  return archive.sessions.filter((s) => s.end === null).sort(mostRecentFirst)[0] ?? null;
}

export interface QuickStartRow {
  routine: Routine;
  /** data dell'ultima sessione conclusa con questa scheda, null se mai fatta */
  lastDone: string | null;
  /** pianificata per la data richiesta (settimanale o eccezione) */
  planned: boolean;
}

export interface QuickStart {
  rows: QuickStartRow[];
  /** id della scheda già selezionata come suggerimento, null se non ci sono schede attive */
  suggested: string | null;
  plan: DayPlan;
}

export const RECENT_ROUTINES = 4;

/**
 * US-11, schermata Oggi. Righe: le ultime 4 schede fatte (distinte, dalla più recente), completate
 * con le altre schede attive nel loro ordine se ne sono state fatte meno di 4 (senza storico: le
 * schede attive nel loro ordine), più quella pianificata per la data se non è già tra queste.
 * Suggerita (già selezionata, decisione del 10 ottobre 2026): la pianificata; altrimenti, tra le
 * fatte, quella fatta da più tempo, così A/B si alternano da sole; senza storico la prima riga.
 * Una scheda già conclusa nella data stessa non si suggerisce (si passa alla successiva).
 * Contano solo le sessioni concluse e le schede non archiviate.
 */
export function quickStart(archive: Pick<Archive, 'routines' | 'schedule' | 'overrides' | 'sessions'>, date: string): QuickStart {
  const active = new Map(activeRoutines(archive).map((r) => [r.id, r]));
  const lastDone = new Map<string, string>();
  for (const session of archive.sessions.filter((s) => s.end !== null).sort(mostRecentFirst)) {
    if (session.routineId && active.has(session.routineId) && !lastDone.has(session.routineId)) lastDone.set(session.routineId, session.date);
  }
  const done = [...lastDone.keys()].slice(0, RECENT_ROUTINES);
  const ids = [...done];
  for (const id of active.keys()) if (ids.length < RECENT_ROUTINES && !ids.includes(id)) ids.push(id);

  const plan = planFor(archive, date);
  const plannedId = plan.kind === 'routine' ? plan.routine.id : null;
  if (plannedId && !ids.includes(plannedId)) ids.push(plannedId);

  const rows = ids.map((id) => ({ routine: active.get(id)!, lastDone: lastDone.get(id) ?? null, planned: id === plannedId }));
  // una scheda già fatta in quella data non si suggerisce di nuovo (seconda sessione del giorno, US-20)
  const fresh = (id: string | null | undefined) => (id && lastDone.get(id) !== date ? id : null);
  const suggested =
    fresh(plannedId) ?? [...done].reverse().find(fresh) ?? rows.find((r) => fresh(r.routine.id))?.routine.id ?? rows[0]?.routine.id ?? null;
  return { rows, suggested, plan };
}
