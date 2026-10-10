// Schede: dati iniziali, pianificazione del giorno e avvio rapido dalle ultime schede fatte (US-11).
import { SCHEDE_INIZIALI } from '../../data/schede-iniziali';
import { giornoSettimana } from './date';
import type { Archivio, Scheda, Sessione } from './tipi';

/** Copia profonda delle schede A/B del PoC, per non condividere oggetti con il modulo dei dati. */
export function schedeIniziali(): Scheda[] {
  return structuredClone(SCHEDE_INIZIALI) as Scheda[];
}

/** "Inizia con le schede di esempio" (US-01): aggiunge le schede iniziali che mancano, per id. */
export function conSchedeIniziali(archivio: Archivio): Archivio {
  const presenti = new Set(archivio.schede.map((s) => s.id));
  const mancanti = schedeIniziali().filter((s) => !presenti.has(s.id));
  return mancanti.length ? { ...archivio, schede: [...archivio.schede, ...mancanti] } : archivio;
}

export function schedeAttive(archivio: Pick<Archivio, 'schede'>): Scheda[] {
  return archivio.schede.filter((s) => !s.archiviata);
}

export type PianificazioneGiorno =
  | { tipo: 'scheda'; scheda: Scheda; eccezione: boolean }
  | { tipo: 'riposo'; eccezione: boolean }
  | { tipo: 'nessuna' };

/**
 * Cosa prevede una data: l'eccezione per quella data vince sulla pianificazione settimanale.
 * Una scheda archiviata o non più esistente vale come "nulla di pianificato".
 */
export function pianificazioneDel(archivio: Pick<Archivio, 'schede' | 'pianificazione' | 'eccezioni'>, data: string): PianificazioneGiorno {
  const eccezione = Object.hasOwn(archivio.eccezioni, data);
  const valore = eccezione ? archivio.eccezioni[data] : archivio.pianificazione[giornoSettimana(data)];
  if (valore === undefined) return { tipo: 'nessuna' };
  if (valore === null) return { tipo: 'riposo', eccezione };
  const scheda = archivio.schede.find((s) => s.id === valore && !s.archiviata);
  return scheda ? { tipo: 'scheda', scheda, eccezione } : { tipo: 'nessuna' };
}

/** Ordine dalla più recente: data, poi inizio. */
function piuRecente(a: Sessione, b: Sessione): number {
  return b.data.localeCompare(a.data) || b.inizio - a.inizio;
}

export function sessioneInCorso(archivio: Pick<Archivio, 'sessioni'>): Sessione | null {
  return archivio.sessioni.filter((s) => s.fine === null).sort(piuRecente)[0] ?? null;
}

export interface RigaAvvio {
  scheda: Scheda;
  /** data dell'ultima sessione conclusa con questa scheda, null se mai fatta */
  ultimaVolta: string | null;
  /** pianificata per la data richiesta (settimanale o eccezione) */
  pianificata: boolean;
}

export interface AvvioRapido {
  righe: RigaAvvio[];
  /** id della scheda già selezionata come suggerimento, null se non ci sono schede attive */
  suggerita: string | null;
  pianificazione: PianificazioneGiorno;
}

export const SCHEDE_RECENTI = 4;

/**
 * US-11, schermata Oggi. Righe: le ultime 4 schede fatte (distinte, dalla più recente), completate
 * con le altre schede attive nel loro ordine se ne sono state fatte meno di 4 (senza storico: le
 * schede attive nel loro ordine), più quella pianificata per la data se non è già tra queste.
 * Suggerita (già selezionata, decisione del 10 ottobre 2026): la pianificata; altrimenti, tra le
 * fatte, quella fatta da più tempo, così A/B si alternano da sole; senza storico la prima riga.
 * Contano solo le sessioni concluse e le schede non archiviate.
 */
export function avvioRapido(archivio: Pick<Archivio, 'schede' | 'pianificazione' | 'eccezioni' | 'sessioni'>, data: string): AvvioRapido {
  const attive = new Map(schedeAttive(archivio).map((s) => [s.id, s]));
  const ultimaVolta = new Map<string, string>();
  for (const sessione of archivio.sessioni.filter((s) => s.fine !== null).sort(piuRecente)) {
    if (sessione.schedaId && attive.has(sessione.schedaId) && !ultimaVolta.has(sessione.schedaId)) ultimaVolta.set(sessione.schedaId, sessione.data);
  }
  const fatte = [...ultimaVolta.keys()].slice(0, SCHEDE_RECENTI);
  const ids = [...fatte];
  for (const id of attive.keys()) if (ids.length < SCHEDE_RECENTI && !ids.includes(id)) ids.push(id);

  const pianificazione = pianificazioneDel(archivio, data);
  const pianificataId = pianificazione.tipo === 'scheda' ? pianificazione.scheda.id : null;
  if (pianificataId && !ids.includes(pianificataId)) ids.push(pianificataId);

  const righe = ids.map((id) => ({ scheda: attive.get(id)!, ultimaVolta: ultimaVolta.get(id) ?? null, pianificata: id === pianificataId }));
  const suggerita = pianificataId ?? fatte.at(-1) ?? righe[0]?.scheda.id ?? null;
  return { righe, suggerita, pianificazione };
}
