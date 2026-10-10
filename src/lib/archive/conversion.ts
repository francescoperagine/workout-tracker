// Conversione dei testi delle schede del PoC (BodyTracker/palestra/esercizi.js) nel modello v2.
// Recuperi: "2′" → 120, "60–75″" → 60 (per un intervallo il valore minimo).
// Carichi: "45–50 kg" → 45..50; "40 kg, da tarare" → 40 con nota; "Da tarare" → solo nota.
import type { Routine, RoutineExercise } from './types';

/**
 * Voce di una scheda del PoC, come in `window.schedeIniziali`. I nomi dei campi sono quelli del
 * formato del PoC e restano in italiano.
 */
export interface PocRoutineItem {
  id: string;
  ordine: string;
  nome: string;
  ripetizioni: string;
  partenza: string;
  recupero: string;
  unita: string;
  alternative: { id: string; nome: string }[];
}

/** Il PoC non ha questi valori: sono i predefiniti della conversione, modificabili nella scheda. */
export const DEFAULT_SETS = 3;
export const DEFAULT_WARMUP_REST = 60;

const DASHES = /\s*[-–—]\s*/;
const NUMBER = String.raw`\d+(?:[.,]\d+)?`;

function toNumber(text: string): number {
  return Number(text.replace(',', '.'));
}

/**
 * Recupero testuale → secondi. Accetta ′ (o ') per i minuti, ″ (o ") per i secondi, "1′30″",
 * "1:30" e un numero semplice (secondi). Per un intervallo usa il valore minimo.
 * Restituisce null se il testo non è riconosciuto.
 */
export function restSeconds(text: string): number | null {
  const clean = text.trim().replace(/[’']/g, '′').replace(/["”]/g, '″').replace(/\s+/g, '');
  if (clean === '') return null;
  const first = clean.split(/[-–—]/)[0];
  // Nell'intervallo l'unità può stare solo in fondo: "60–75″"
  const trailingUnit = /″$/.test(clean) ? '″' : /′$/.test(clean) ? '′' : '';
  const withUnit = /[′″:]/.test(first) ? first : first + trailingUnit;
  let m: RegExpMatchArray | null;
  if ((m = withUnit.match(/^(\d+):(\d{1,2})$/))) return Number(m[1]) * 60 + Number(m[2]);
  if ((m = withUnit.match(new RegExp(`^(${NUMBER})′(?:(\\d+)″?)?$`)))) return Math.round(toNumber(m[1]) * 60) + Number(m[2] ?? 0);
  if ((m = withUnit.match(new RegExp(`^(${NUMBER})″?$`)))) return Math.round(toNumber(m[1]));
  return null;
}

export interface LoadSplit {
  loadMin: number | null;
  loadMax: number | null;
  loadNote: string;
}

/**
 * Carico di partenza testuale → kg minimo e massimo, più una nota.
 * Riconosce "40 kg", "45–50 kg", "12,5 kg" con un'eventuale nota dopo la virgola ("40 kg, da tarare").
 * Un testo diverso ("Da tarare", "Bilanciere + 5 kg") resta intero nella nota.
 */
export function splitLoad(text: string): LoadSplit {
  const clean = text.trim();
  const m = clean.match(new RegExp(`^(${NUMBER})(?:${DASHES.source}(${NUMBER}))?\\s*kg\\b\\s*(?:[,;]\\s*(.*))?$`, 'i'));
  if (!m) return { loadMin: null, loadMax: null, loadNote: clean };
  const min = toNumber(m[1]);
  const max = m[2] === undefined ? min : toNumber(m[2]);
  return { loadMin: Math.min(min, max), loadMax: Math.max(min, max), loadNote: (m[3] ?? '').trim() };
}

/** "2a" → "2", "1" → null: le voci con lo stesso numero e una lettera sono una superserie. */
export function groupFromOrder(order: string): string | null {
  const m = order.trim().match(/^(\d+)[a-z]$/i);
  return m ? m[1] : null;
}

export function routineExerciseFromPoc(item: PocRoutineItem, idPrefix: string): RoutineExercise {
  const rest = restSeconds(item.recupero);
  return {
    id: `${idPrefix}-${item.ordine.trim().toLowerCase()}`,
    exerciseId: item.id,
    alternatives: item.alternative.map((a) => a.id),
    group: groupFromOrder(item.ordine),
    sets: DEFAULT_SETS,
    reps: item.ripetizioni.trim(),
    ...splitLoad(item.partenza),
    unit: item.unita.trim(),
    rest: rest ?? 0,
    warmupRest: DEFAULT_WARMUP_REST,
  };
}

/** Scheda "A" del PoC → { id: 'routine-a', name: 'Scheda A', voci con id 'a-1', 'a-2a', … } */
export function routineFromPoc(letter: string, items: PocRoutineItem[]): Routine {
  const prefix = letter.toLowerCase();
  return {
    id: `routine-${prefix}`,
    name: `Scheda ${letter}`,
    notes: '',
    archived: false,
    exercises: items.map((item) => routineExerciseFromPoc(item, prefix)),
  };
}
