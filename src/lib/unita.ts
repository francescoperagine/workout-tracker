// Unità di misura (US-31). I dati si salvano sempre in kg e metri: qui si converte solo in
// ingresso e in uscita. Il valore digitato diventa kg senza arrotondare; l'arrotondamento
// è solo in visualizzazione (0,25 kg / 0,5 lb). Cambiare unità non modifica nessun dato.
import type { Impostazioni, UnitaDistanza, UnitaPeso } from './archivio/tipi';

/** Definizioni esatte (libbra e piede internazionali, 1959) */
export const KG_PER_LB = 0.45359237;
export const M_PER_FT = 0.3048;

/** Passo di arrotondamento in visualizzazione */
export const PASSO_PESO: Record<UnitaPeso, number> = { kg: 0.25, lb: 0.5 };
export const PASSO_DISTANZA: Record<UnitaDistanza, number> = { m: 0.1, ft: 0.5 };

/** Spazio unificatore tra numero e unità, perché non vadano a capo separati */
const SPAZIO = ' ';

export function daKg(kg: number, unita: UnitaPeso): number {
  return unita === 'kg' ? kg : kg / KG_PER_LB;
}

export function aKg(valore: number, unita: UnitaPeso): number {
  return unita === 'kg' ? valore : valore * KG_PER_LB;
}

export function daMetri(metri: number, unita: UnitaDistanza): number {
  return unita === 'm' ? metri : metri / M_PER_FT;
}

export function aMetri(valore: number, unita: UnitaDistanza): number {
  return unita === 'm' ? valore : valore * M_PER_FT;
}

export function arrotondaAlPasso(valore: number, passo: number): number {
  // Il secondo arrotondamento toglie il rumore dei float (es. 0.1 * 3)
  return Number((Math.round(valore / passo) * passo).toFixed(6));
}

/**
 * Valore da mostrare in un campo di modifica: quello che l'utente aveva digitato.
 * Toglie solo il rumore della conversione (al centesimo), senza il passo di visualizzazione:
 * 135,3 lb salvati e riletti in lb restano 135,3.
 */
export function valoreCampoPeso(kg: number | null, unita: UnitaPeso): number | null {
  return kg === null ? null : Number(daKg(kg, unita).toFixed(2));
}

const formatoNumero = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2, useGrouping: false });

export function formattaNumero(valore: number): string {
  return formatoNumero.format(valore);
}

/** "62,5 kg", "135 lb". Con `null` restituisce "—". */
export function formattaPeso(kg: number | null, impostazioni: Pick<Impostazioni, 'unitaPeso'>, conUnita = true): string {
  if (kg === null) return '—';
  const unita = impostazioni.unitaPeso;
  const valore = formattaNumero(arrotondaAlPasso(daKg(kg, unita), PASSO_PESO[unita]));
  return conUnita ? `${valore}${SPAZIO}${unita}` : valore;
}

export function formattaDistanza(metri: number | null, impostazioni: Pick<Impostazioni, 'unitaDistanza'>, conUnita = true): string {
  if (metri === null) return '—';
  const unita = impostazioni.unitaDistanza;
  const valore = formattaNumero(arrotondaAlPasso(daMetri(metri, unita), PASSO_DISTANZA[unita]));
  return conUnita ? `${valore}${SPAZIO}${unita}` : valore;
}

/**
 * Legge un numero digitato in italiano o in inglese ("62,5" o "62.5").
 * Restituisce null per un campo vuoto e NaN per un testo che non è un numero non negativo.
 */
export function leggiDecimale(testo: string): number | null {
  const pulito = testo.trim().replace(',', '.');
  if (pulito === '') return null;
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(pulito)) return Number.NaN;
  return Number(pulito);
}

/** Peso digitato nell'unità scelta → kg, senza arrotondare. */
export function leggiPeso(testo: string, unita: UnitaPeso): number | null {
  const valore = leggiDecimale(testo);
  return valore === null || Number.isNaN(valore) ? valore : aKg(valore, unita);
}
