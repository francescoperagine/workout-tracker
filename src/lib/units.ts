// Unità di misura (US-31). I dati si salvano sempre in kg e metri: qui si converte solo in
// ingresso e in uscita. Il valore digitato diventa kg senza arrotondare; l'arrotondamento
// è solo in visualizzazione (0,25 kg / 0,5 lb). Cambiare unità non modifica nessun dato.
import type { DistanceUnit, Settings, WeightUnit } from './archive/types';

/** Definizioni esatte (libbra e piede internazionali, 1959) */
export const KG_PER_LB = 0.45359237;
export const M_PER_FT = 0.3048;

/** Passo di arrotondamento in visualizzazione */
export const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 0.25, lb: 0.5 };
export const DISTANCE_STEP: Record<DistanceUnit, number> = { m: 0.1, ft: 0.5 };

/** Spazio unificatore tra numero e unità, perché non vadano a capo separati */
const NBSP = ' ';

export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

export function fromMeters(meters: number, unit: DistanceUnit): number {
  return unit === 'm' ? meters : meters / M_PER_FT;
}

export function toMeters(value: number, unit: DistanceUnit): number {
  return unit === 'm' ? value : value * M_PER_FT;
}

export function roundToStep(value: number, step: number): number {
  // Il secondo arrotondamento toglie il rumore dei float (es. 0.1 * 3)
  return Number((Math.round(value / step) * step).toFixed(6));
}

/**
 * Valore da mostrare in un campo di modifica: quello che l'utente aveva digitato.
 * Toglie solo il rumore della conversione (al centesimo), senza il passo di visualizzazione:
 * 135,3 lb salvati e riletti in lb restano 135,3.
 */
export function weightFieldValue(kg: number | null, unit: WeightUnit): number | null {
  return kg === null ? null : Number(fromKg(kg, unit).toFixed(2));
}

const numberFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2, useGrouping: false });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** "62,5 kg", "135 lb". Con `null` restituisce "—". */
export function formatWeight(kg: number | null, settings: Pick<Settings, 'weightUnit'>, withUnit = true): string {
  if (kg === null) return '—';
  const unit = settings.weightUnit;
  const value = formatNumber(roundToStep(fromKg(kg, unit), WEIGHT_STEP[unit]));
  return withUnit ? `${value}${NBSP}${unit}` : value;
}

export function formatDistance(meters: number | null, settings: Pick<Settings, 'distanceUnit'>, withUnit = true): string {
  if (meters === null) return '—';
  const unit = settings.distanceUnit;
  const value = formatNumber(roundToStep(fromMeters(meters, unit), DISTANCE_STEP[unit]));
  return withUnit ? `${value}${NBSP}${unit}` : value;
}

/**
 * Legge un numero digitato in italiano o in inglese ("62,5" o "62.5").
 * Restituisce null per un campo vuoto e NaN per un testo che non è un numero non negativo.
 */
export function parseDecimal(text: string): number | null {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(clean)) return Number.NaN;
  return Number(clean);
}

/** Peso digitato nell'unità scelta → kg, senza arrotondare. */
export function parseWeight(text: string, unit: WeightUnit): number | null {
  const value = parseDecimal(text);
  return value === null || Number.isNaN(value) ? value : toKg(value, unit);
}
