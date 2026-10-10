// Formattazione dei testi per l'utente (italiano): plurali, date, durate.
import { fromDateKey } from './archive/dates';
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
