// Date YYYY-MM-DD in ora locale: mai toISOString() né new Date('YYYY-MM-DD'), che usano UTC.
import { GIORNI_SETTIMANA, type GiornoSettimana } from './tipi';

export function chiaveData(data: Date): string {
  return [data.getFullYear(), String(data.getMonth() + 1).padStart(2, '0'), String(data.getDate()).padStart(2, '0')].join('-');
}

export function dataValida(valore: unknown): valore is string {
  if (typeof valore !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valore)) return false;
  const [a, m, g] = valore.split('-').map(Number);
  const data = new Date(a, m - 1, g);
  return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === g;
}

/** Mezzogiorno locale della data: un istante stabile anche con il cambio dell'ora legale. */
export function daChiaveData(chiave: string): Date {
  if (!dataValida(chiave)) throw new RangeError(`Data non valida: ${chiave}`);
  const [a, m, g] = chiave.split('-').map(Number);
  return new Date(a, m - 1, g, 12);
}

export function giornoSettimana(chiave: string): GiornoSettimana {
  // getDay(): 0 = domenica
  return GIORNI_SETTIMANA[(daChiaveData(chiave).getDay() + 6) % 7];
}
