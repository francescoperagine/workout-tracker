// Calendario (step 5: US-04, US-05, US-06): settimane e mesi in date YYYY-MM-DD locali, stato di ogni
// giorno (fatto, saltato, pianificato, oggi, riposo), pianificazione settimanale ed eccezioni per data.
// Funzioni pure: ricevono l'archivio e ne restituiscono uno nuovo, come vuole repo.update().
import { fromDateKey, isValidDateKey, toDateKey, weekdayOf } from './dates';
import { planFor, type DayPlan } from './routines';
import { ArchiveError, WEEKDAYS, type Archive, type Routine, type Session, type Weekday } from './types';

/** Data spostata di n giorni (anche negativi), in ora locale */
export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Lunedì della settimana della data */
export function weekStart(key: string): string {
  return addDays(key, -WEEKDAYS.indexOf(weekdayOf(key)));
}

/** I sette giorni della settimana della data, da lunedì */
export function weekDates(key: string): string[] {
  const monday = weekStart(key);
  return WEEKDAYS.map((_, i) => addDays(monday, i));
}

/** I 7 giorni di una finestra che parte da `start` (vista settimana del calendario: oggi e i 6 giorni dopo) */
export function windowDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inizio della finestra al caricamento: oggi, a meno che la data richiesta cada fuori da oggi + 6 giorni */
export function windowStartFor(requested: string | null, today: string): string {
  if (!requested || !isValidDateKey(requested) || (requested >= today && requested <= addDays(today, 6))) return today;
  return requested;
}

/** Primo giorno del mese della data */
export function monthStart(key: string): string {
  return `${key.slice(0, 7)}-01`;
}

/** Primo giorno del mese spostato di n mesi */
export function addMonths(key: string, months: number): string {
  const date = fromDateKey(monthStart(key));
  date.setMonth(date.getMonth() + months);
  return monthStart(toDateKey(date));
}

/** Le settimane (da lunedì) che coprono il mese della data: 4–6 righe da 7 giorni, con i giorni dei mesi vicini */
export function monthWeeks(key: string): string[][] {
  const first = monthStart(key);
  const month = first.slice(0, 7);
  const weeks: string[][] = [];
  for (let monday = weekStart(first); monday.slice(0, 7) <= month; monday = addDays(monday, 7)) weeks.push(weekDates(monday));
  return weeks;
}

/** Sessioni di una data, dalla prima iniziata */
export function sessionsOn(archive: Pick<Archive, 'sessions'>, date: string): Session[] {
  return archive.sessions.filter((s) => s.date === date).sort((a, b) => a.start - b.start);
}

/** Data della prima sessione dello storico, null se non ce ne sono */
export function firstSessionDate(archive: Pick<Archive, 'sessions'>): string | null {
  let first: string | null = null;
  for (const s of archive.sessions) if (first === null || s.date < first) first = s.date;
  return first;
}

/**
 * Stato di un giorno, sempre con un testo (mai il solo colore):
 * - `done`: almeno una sessione conclusa (anche in un giorno di riposo o senza pianificazione);
 * - `in-progress`: c'è la sessione in corso e nessuna conclusa;
 * - `skipped`: giorno passato con una scheda pianificata e nessuna sessione;
 * - `planned`: oggi o un giorno futuro con una scheda pianificata;
 * - `rest`: riposo, senza sessioni;
 * - `empty`: niente di pianificato né di fatto.
 */
export type DayStatus = 'done' | 'in-progress' | 'skipped' | 'planned' | 'rest' | 'empty';

export interface DayInfo {
  date: string;
  weekday: Weekday;
  isToday: boolean;
  isPast: boolean;
  plan: DayPlan;
  sessions: Session[];
  status: DayStatus;
}

export function dayInfo(archive: Pick<Archive, 'routines' | 'schedule' | 'overrides' | 'sessions'>, date: string, today: string): DayInfo {
  const plan = planFor(archive, date);
  const sessions = sessionsOn(archive, date);
  const isPast = date < today;
  let status: DayStatus;
  if (sessions.some((s) => s.end !== null)) status = 'done';
  else if (sessions.length) status = 'in-progress';
  else if (plan.kind === 'routine') status = isPast ? 'skipped' : 'planned';
  else status = plan.kind === 'rest' ? 'rest' : 'empty';
  return { date, weekday: weekdayOf(date), isToday: date === today, isPast, plan, sessions, status };
}

/** Valore della pianificazione settimanale per un giorno: id, null = riposo, undefined = niente */
export function weeklyValue(archive: Pick<Archive, 'schedule'>, weekday: Weekday): string | null | undefined {
  return Object.hasOwn(archive.schedule, weekday) ? archive.schedule[weekday] : undefined;
}

/** Valore dell'eccezione di una data: id, null = riposo, undefined = nessuna eccezione */
export function overrideValue(archive: Pick<Archive, 'overrides'>, date: string): string | null | undefined {
  return Object.hasOwn(archive.overrides, date) ? archive.overrides[date] : undefined;
}

function checkRoutine(archive: Pick<Archive, 'routines'>, value: string | null | undefined) {
  if (typeof value !== 'string') return;
  const routine = archive.routines.find((r) => r.id === value);
  if (!routine) throw new ArchiveError('Questa scheda non esiste più.');
  if (routine.archived) throw new ArchiveError(`«${routine.name}» è archiviata: ripristinala per assegnarla a un giorno.`);
}

/** US-04: assegna a un giorno della settimana una scheda, il riposo (null) o niente (undefined). Vale per tutte le settimane. */
export function setWeeklyDay(archive: Archive, weekday: Weekday, value: string | null | undefined): Archive {
  if (weeklyValue(archive, weekday) === value) return archive;
  checkRoutine(archive, value);
  const schedule = { ...archive.schedule };
  if (value === undefined) delete schedule[weekday];
  else schedule[weekday] = value;
  return { ...archive, schedule };
}

/**
 * US-06: eccezione per una sola data (una scheda o il riposo). `undefined` toglie l'eccezione e la data
 * torna alla settimana tipo; un'eccezione uguale alla settimana tipo non serve e viene tolta.
 */
export function setDateOverride(archive: Archive, date: string, value: string | null | undefined): Archive {
  if (!isValidDateKey(date)) throw new ArchiveError('Data non valida.');
  checkRoutine(archive, value);
  const next = value === weeklyValue(archive, weekdayOf(date)) ? undefined : value;
  if (overrideValue(archive, date) === next) return archive;
  const overrides = { ...archive.overrides };
  if (next === undefined) delete overrides[date];
  else overrides[date] = next;
  return { ...archive, overrides };
}

/** Giorni della settimana tipo assegnati a una scheda archiviata (o sparita): non propongono nulla, la pagina avvisa. */
export function staleWeeklyDays(archive: Pick<Archive, 'routines' | 'schedule'>): { weekday: Weekday; routine: Routine | null }[] {
  const result: { weekday: Weekday; routine: Routine | null }[] = [];
  for (const weekday of WEEKDAYS) {
    const value = archive.schedule[weekday];
    if (typeof value !== 'string') continue;
    const routine = archive.routines.find((r) => r.id === value) ?? null;
    if (!routine || routine.archived) result.push({ weekday, routine });
  }
  return result;
}

/** true se almeno un giorno della settimana ha una scheda o il riposo */
export function hasWeeklyPlan(archive: Pick<Archive, 'schedule'>): boolean {
  return WEEKDAYS.some((d) => Object.hasOwn(archive.schedule, d));
}
