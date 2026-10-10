// Conversione dei testi delle schede del PoC (BodyTracker/palestra/esercizi.js) nel modello v2.
// Recuperi: "2′" → 120, "60–75″" → 60 (per un intervallo il valore minimo).
// Carichi: "45–50 kg" → 45..50; "40 kg, da tarare" → 40 con nota; "Da tarare" → solo nota.
import type { Scheda, VoceScheda } from './tipi';

/** Voce di una scheda del PoC, come in `window.schedeIniziali` */
export interface VoceSchedaPoc {
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
export const SERIE_PREDEFINITE = 3;
export const RECUPERO_RISCALDAMENTO_PREDEFINITO = 60;

const TRATTINI = /\s*[-–—]\s*/;
const NUMERO = String.raw`\d+(?:[.,]\d+)?`;

function numero(testo: string): number {
  return Number(testo.replace(',', '.'));
}

/**
 * Recupero testuale → secondi. Accetta ′ (o ') per i minuti, ″ (o ") per i secondi, "1′30″",
 * "1:30" e un numero semplice (secondi). Per un intervallo usa il valore minimo.
 * Restituisce null se il testo non è riconosciuto.
 */
export function recuperoInSecondi(testo: string): number | null {
  const pulito = testo.trim().replace(/[’']/g, '′').replace(/["”]/g, '″').replace(/\s+/g, '');
  if (pulito === '') return null;
  const primo = pulito.split(/[-–—]/)[0];
  // Nell'intervallo l'unità può stare solo in fondo: "60–75″"
  const unitaFinale = /″$/.test(pulito) ? '″' : /′$/.test(pulito) ? '′' : '';
  const conUnita = /[′″:]/.test(primo) ? primo : primo + unitaFinale;
  let m: RegExpMatchArray | null;
  if ((m = conUnita.match(/^(\d+):(\d{1,2})$/))) return Number(m[1]) * 60 + Number(m[2]);
  if ((m = conUnita.match(new RegExp(`^(${NUMERO})′(?:(\\d+)″?)?$`)))) return Math.round(numero(m[1]) * 60) + Number(m[2] ?? 0);
  if ((m = conUnita.match(new RegExp(`^(${NUMERO})″?$`)))) return Math.round(numero(m[1]));
  return null;
}

export interface CaricoDiviso {
  caricoMin: number | null;
  caricoMax: number | null;
  notaCarico: string;
}

/**
 * Carico di partenza testuale → kg minimo e massimo, più una nota.
 * Riconosce "40 kg", "45–50 kg", "12,5 kg" con un'eventuale nota dopo la virgola ("40 kg, da tarare").
 * Un testo diverso ("Da tarare", "Bilanciere + 5 kg") resta intero nella nota.
 */
export function dividiCarico(testo: string): CaricoDiviso {
  const pulito = testo.trim();
  const m = pulito.match(new RegExp(`^(${NUMERO})(?:${TRATTINI.source}(${NUMERO}))?\\s*kg\\b\\s*(?:[,;]\\s*(.*))?$`, 'i'));
  if (!m) return { caricoMin: null, caricoMax: null, notaCarico: pulito };
  const min = numero(m[1]);
  const max = m[2] === undefined ? min : numero(m[2]);
  return { caricoMin: Math.min(min, max), caricoMax: Math.max(min, max), notaCarico: (m[3] ?? '').trim() };
}

/** "2a" → "2", "1" → null: le voci con lo stesso numero e una lettera sono una superserie. */
export function gruppoDaOrdine(ordine: string): string | null {
  const m = ordine.trim().match(/^(\d+)[a-z]$/i);
  return m ? m[1] : null;
}

export function voceDaPoc(voce: VoceSchedaPoc, prefissoId: string): VoceScheda {
  const recupero = recuperoInSecondi(voce.recupero);
  return {
    id: `${prefissoId}-${voce.ordine.trim().toLowerCase()}`,
    esercizioId: voce.id,
    alternative: voce.alternative.map((a) => a.id),
    gruppo: gruppoDaOrdine(voce.ordine),
    serie: SERIE_PREDEFINITE,
    ripetizioni: voce.ripetizioni.trim(),
    ...dividiCarico(voce.partenza),
    unita: voce.unita.trim(),
    recupero: recupero ?? 0,
    recuperoRiscaldamento: RECUPERO_RISCALDAMENTO_PREDEFINITO,
  };
}

/** Scheda "A" del PoC → { id: 'scheda-a', nome: 'Scheda A', voci con id 'a-1', 'a-2a', … } */
export function schedaDaPoc(lettera: string, voci: VoceSchedaPoc[]): Scheda {
  const prefisso = lettera.toLowerCase();
  return {
    id: `scheda-${prefisso}`,
    nome: `Scheda ${lettera}`,
    note: '',
    archiviata: false,
    voci: voci.map((v) => voceDaPoc(v, prefisso)),
  };
}
