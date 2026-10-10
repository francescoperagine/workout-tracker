// Formattazione dei testi per l'utente (italiano): plurali, date, durate.
import { fromDateKey, weekdayOf } from './archive/dates';
import type { Weekday } from './archive/types';

/** plural(1, 'scheda', 'schede') → '1 scheda'; plural(3, …) → '3 schede' */
export function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString('it-IT')} ${count === 1 ? one : many}`;
}

/** '2026-10-10' → '10 ottobre 2026' */
export function formatDateKey(key: string): string {
  return fromDateKey(key).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Timestamp → '10 ottobre 2026' */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Secondi come minuti:secondi (90 → '1:30', 45 → '0:45', 600 → '10:00'), come sul timer */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Durata per un'etichetta accessibile: 90 → '1 minuto e 30 secondi' */
export function speakDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(s / 60);
  const rest = s % 60;
  const parts = [];
  if (minutes) parts.push(plural(minutes, 'minuto', 'minuti'));
  if (rest || !minutes) parts.push(plural(rest, 'secondo', 'secondi'));
  return parts.join(' e ');
}

const ELIDED: Record<'da' | 'a' | 'di', [string, string]> = { da: ['dal', 'dall’'], a: ['al', 'all’'], di: ['del', 'dell’'] };

/** Preposizione articolata davanti a una data: ('a', '8 settembre') → 'all’8 settembre', ('da', '1 marzo') → 'dal 1 marzo' */
export function withPreposition(preposition: 'da' | 'a' | 'di', text: string): string {
  const [plain, elided] = ELIDED[preposition];
  // 8 (otto) e 11 (undici) cominciano con una vocale
  return /^(8|11)(\D|$)/.test(text) ? `${elided}${text}` : `${plain} ${text}`;
}

/** Periodo tra due date YYYY-MM-DD: 'del 3 marzo 2026' o 'dal 1 settembre 2026 all’8 settembre 2026' */
export function formatPeriod(from: string, to: string): string {
  return from === to
    ? withPreposition('di', formatDateKey(from))
    : `${withPreposition('da', formatDateKey(from))} ${withPreposition('a', formatDateKey(to))}`;
}

/** Giorni della settimana abbreviati, da lunedì */
export const WEEKDAY_SHORT: Record<Weekday, string> = { mon: 'lun', tue: 'mar', wed: 'mer', thu: 'gio', fri: 'ven', sat: 'sab', sun: 'dom' };
export const WEEKDAY_LONG: Record<Weekday, string> = {
  mon: 'lunedì',
  tue: 'martedì',
  wed: 'mercoledì',
  thu: 'giovedì',
  fri: 'venerdì',
  sat: 'sabato',
  sun: 'domenica',
};

/** ['mon', 'thu'] → 'lun, gio' */
export function formatWeekdays(days: readonly Weekday[], long = false): string {
  return days.map((d) => (long ? WEEKDAY_LONG : WEEKDAY_SHORT)[d]).join(', ');
}

/** '2026-10-03' → '3 ottobre', con l'anno solo se diverso da quello di `today` (YYYY-MM-DD) */
export function formatDayMonth(key: string, today: string): string {
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return fromDateKey(key).toLocaleDateString('it-IT', sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Ultima volta, rispetto a oggi: 'oggi', 'ieri', il giorno della settimana nell'ultima settimana
 * ('giovedì'), poi '12 giorni fa' fino a otto settimane, oltre la data ('3 agosto').
 */
export function formatRelativeDay(key: string, today: string): string {
  const days = Math.round((fromDateKey(today).getTime() - fromDateKey(key).getTime()) / 86_400_000);
  if (days === 0) return 'oggi';
  if (days === 1) return 'ieri';
  if (days > 1 && days < 7) return WEEKDAY_LONG[weekdayOf(key)];
  if (days >= 7 && days <= 56) return `${days} giorni fa`;
  return formatDayMonth(key, today);
}

/** Durata di un allenamento: 25 min → '25 min', 65 min → '1 h 05 min', meno di un minuto → '0 min' */
export function formatElapsed(milliseconds: number): string {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** Ora locale di un timestamp: '18:05' */
export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/** Settimana da lunedì a domenica: '5–11 ottobre', '29 settembre – 5 ottobre', '29 dicembre 2025 – 4 gennaio 2026' */
export function formatWeekRange(monday: string, sunday: string, today: string): string {
  const from = fromDateKey(monday);
  const sameYear = monday.slice(0, 4) === sunday.slice(0, 4);
  if (sameYear && monday.slice(0, 7) === sunday.slice(0, 7)) return `${from.getDate()}–${formatDayMonth(sunday, today)}`;
  if (sameYear) return `${formatDayMonth(monday, sunday)} – ${formatDayMonth(sunday, today)}`;
  return `${formatDateKey(monday)} – ${formatDateKey(sunday)}`;
}

/** Mese della data: 'ottobre 2026' */
export function formatMonth(key: string): string {
  return fromDateKey(key).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

/** Giorno per esteso: 'giovedì 8 ottobre' (con l'anno se diverso da quello di `today`) */
export function formatLongDay(key: string, today: string): string {
  return `${WEEKDAY_LONG[weekdayOf(key)]} ${formatDayMonth(key, today)}`;
}

/** Data con l'articolo, dopo un verbo: 'ieri', 'l’8 settembre', 'il 3 settembre' ("iniziato l’8 settembre") */
export function formatOnDay(key: string, today: string): string {
  if (formatRelativeDay(key, today) === 'ieri') return 'ieri';
  const text = formatDayMonth(key, today);
  return /^(8|11)(\D|$)/.test(text) ? `l’${text}` : `il ${text}`;
}
