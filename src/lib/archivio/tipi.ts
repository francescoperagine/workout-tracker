// Modello dati v2 dell'archivio (step 2). Vedi docs/restyling/PIANO.md, "Modello dati v2".
// Regola delle unità: pesi sempre in kg e distanze in metri; la conversione avviene solo
// in ingresso e in uscita (src/lib/unita.ts).

export const CHIAVE_ARCHIVIO = 'bodytracker.archivio.v2';
/** Chiave del PoC: si legge soltanto, per l'import diretto sulla stessa origine */
export const CHIAVE_ARCHIVIO_POC = 'bodytracker.archivio.v1';

export const GIORNI_SETTIMANA = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'] as const;
export type GiornoSettimana = (typeof GIORNI_SETTIMANA)[number];

export const TIPI_SERIE = ['normale', 'riscaldamento', 'drop', 'cedimento'] as const;
export type TipoSerie = (typeof TIPI_SERIE)[number];

export type UnitaPeso = 'kg' | 'lb';
export type UnitaDistanza = 'm' | 'ft';

/** Esercizio di base del catalogo (src/data/catalogo.ts). Gli approfondimenti possono essere vuoti. */
export interface Esercizio {
  id: string;
  nome: string;
  descrizione: string;
  immagine: string;
  testoAlternativo: string;
  passaggi: string[];
  attenzione: string;
  fonti: { titolo: string; url: string }[];
}

/** Esercizio creato dall'utente scrivendo un nome a mano (US-14). Vive in `archivio.catalogo`. */
export interface EsercizioPersonalizzato {
  id: string;
  nome: string;
}

export interface VoceScheda {
  id: string;
  esercizioId: string;
  /** id di esercizi alternativi, per quando la macchina è occupata */
  alternative: string[];
  /** stessa stringa = superserie */
  gruppo: string | null;
  /** serie target */
  serie: number;
  /** testo libero, anche un intervallo: "6–8" */
  ripetizioni: string;
  /** kg */
  caricoMin: number | null;
  /** kg; uguale a caricoMin se non è un intervallo */
  caricoMax: number | null;
  notaCarico: string;
  /** "per manubrio" */
  unita: string;
  /** secondi */
  recupero: number;
  /** secondi */
  recuperoRiscaldamento: number;
}

export interface Scheda {
  id: string;
  nome: string;
  note: string;
  archiviata: boolean;
  voci: VoceScheda[];
}

export interface Serie {
  id: string;
  tipo: TipoSerie;
  /** sempre in kg, anche se l'utente usa lb */
  kg: number | null;
  ripetizioni: number | null;
  /** timestamp della spunta; null = non completata */
  completata: number | null;
}

export interface VoceSessione {
  id: string;
  /** esercizio fatto davvero (la variante, se c'è) */
  esercizioId: string;
  /** esercizio previsto dalla scheda, quando si è passati a una variante */
  varianteDi: string | null;
  gruppo: string | null;
  recupero: number;
  recuperoRiscaldamento: number;
  note: string;
  serie: Serie[];
}

export interface Sessione {
  id: string;
  /** YYYY-MM-DD in ora locale */
  data: string;
  schedaId: string | null;
  nome: string;
  inizio: number;
  /** null = in corso (al massimo una sessione alla volta) */
  fine: number | null;
  voci: VoceSessione[];
}

export interface Impostazioni {
  unitaPeso: UnitaPeso;
  unitaDistanza: UnitaDistanza;
  /** secondi, usato quando la voce non ha un recupero */
  recuperoPredefinito: number;
  suono: boolean;
  vibrazione: boolean;
}

/**
 * Pianificazione ed eccezioni: un id di scheda, `null` = riposo, chiave assente = nulla di pianificato.
 */
export type Pianificazione = Partial<Record<GiornoSettimana, string | null>>;

export interface Archivio {
  versione: 2;
  /** incrementata a ogni salvataggio, per i conflitti tra schede del browser */
  revisione: number;
  /** solo gli esercizi personalizzati; quelli di base arrivano dal codice */
  catalogo: Record<string, EsercizioPersonalizzato>;
  schede: Scheda[];
  pianificazione: Pianificazione;
  /** YYYY-MM-DD -> id scheda, o null per riposo */
  eccezioni: Record<string, string | null>;
  sessioni: Sessione[];
  impostazioni: Impostazioni;
}

export const IMPOSTAZIONI_PREDEFINITE: Impostazioni = {
  unitaPeso: 'kg',
  unitaDistanza: 'm',
  recuperoPredefinito: 90,
  suono: true,
  vibrazione: true,
};

/** Limiti del PoC, più quelli delle parti nuove (schede, catalogo personale). */
export const LIMITI = {
  byteImport: 10 * 1024 * 1024,
  sessioni: 10_000,
  vociPerSessione: 100,
  seriePerVoce: 100,
  schede: 200,
  vociPerScheda: 100,
  alternativePerVoce: 20,
  eserciziPersonalizzati: 5_000,
  lunghezzaId: 200,
  lunghezzaNomeSessione: 120,
  lunghezzaNomeScheda: 120,
  lunghezzaNomeEsercizio: 200,
  lunghezzaNote: 1000,
  lunghezzaTestoBreve: 100,
  /** kg, ripetizioni (come nel PoC) */
  valoreMassimo: 10_000,
  /** secondi */
  recuperoMassimo: 3600,
} as const;

export function archivioVuoto(): Archivio {
  return {
    versione: 2,
    revisione: 0,
    catalogo: {},
    schede: [],
    pianificazione: {},
    eccezioni: {},
    sessioni: [],
    impostazioni: { ...IMPOSTAZIONI_PREDEFINITE },
  };
}

export class ErroreArchivio extends Error {
  override name = 'ErroreArchivio';
}
