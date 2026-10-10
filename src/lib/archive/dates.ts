// Date YYYY-MM-DD in ora locale: mai toISOString() né new Date('YYYY-MM-DD'), che usano UTC.
import { WEEKDAYS, type Weekday } from './types';

export function toDateKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Mezzogiorno locale della data: un istante stabile anche con il cambio dell'ora legale. */
export function fromDateKey(key: string): Date {
  if (!isValidDateKey(key)) throw new RangeError(`Data non valida: ${key}`);
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function weekdayOf(key: string): Weekday {
  // getDay(): 0 = domenica
  return WEEKDAYS[(fromDateKey(key).getDay() + 6) % 7];
}
