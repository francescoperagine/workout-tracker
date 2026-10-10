// Repository dell'archivio v2 nel localStorage (US-33, P4). Comportamenti e messaggi del PoC:
// - salvataggio a ogni modifica, con stato visibile; se il browser rifiuta (quota o permessi) i dati
//   restano in memoria e "Salva ora" riprova;
// - archivio illeggibile: nessuna sovrascrittura, il contenuto originale resta scaricabile;
// - un'altra scheda del browser che modifica il diario non viene mai sovrascritta in silenzio.
// Con la revisione si distingue meglio del PoC: se questa scheda non ha modifiche in sospeso, adotta
// il diario più recente (e lo notifica); il blocco con richiesta di ricaricare scatta solo quando
// entrambe le schede hanno modifiche (conflitto vero).
import { validaArchivio } from './validazione';
import { CHIAVE_ARCHIVIO, ErroreArchivio, archivioVuoto, type Archivio } from './tipi';

export const MESSAGGI = {
  salvato: 'Salvato su questo dispositivo',
  nonSalvato: 'Salvataggio non riuscito',
  quota:
    'Il browser non consente il salvataggio o lo spazio è esaurito. Esporta subito un backup da Dati e privacy; le modifiche restano aperte in questa pagina.',
  illeggibile:
    'Non riesco a leggere l’archivio locale. Il contenuto originale non è stato sovrascritto: puoi scaricarlo da Dati e privacy e importare un backup valido.',
  conflitto:
    'Il diario è stato modificato in un’altra scheda. Esporta eventuali modifiche aperte e ricarica questa pagina prima di continuare.',
  bloccato: 'L’archivio non è disponibile. Esporta il contenuto originale o importa un backup dalla sezione Dati e privacy.',
} as const;

/**
 * - `salvato`: tutto è nel localStorage;
 * - `non-salvato`: l'ultimo salvataggio è fallito, le modifiche sono solo in memoria;
 * - `illeggibile`: il contenuto salvato non è valido, nessuna scrittura finché non si importa un backup;
 * - `conflitto`: un'altra scheda ha cambiato il diario mentre qui c'erano modifiche, serve ricaricare.
 */
export type StatoSalvataggio = 'salvato' | 'non-salvato' | 'illeggibile' | 'conflitto';

export type OrigineAggiornamento = 'modifica' | 'esterna' | 'ricarica' | 'importazione';

export interface EventoArchivio {
  archivio: Archivio;
  stato: StatoSalvataggio;
  origine: OrigineAggiornamento;
}

export type MemoriaLocale = Pick<Storage, 'getItem' | 'setItem'>;

export interface EsitoSalvataggio {
  ok: boolean;
  stato: StatoSalvataggio;
  /** messaggio per l'utente quando ok è false */
  messaggio?: string;
}

function revisioneSalvata(grezzo: string | null): number | null {
  if (grezzo === null) return null;
  try {
    const r = (JSON.parse(grezzo) as { revisione?: unknown })?.revisione;
    return typeof r === 'number' ? r : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

export class RepositoryArchivio {
  #memoria: MemoriaLocale;
  #chiave: string;
  #archivio: Archivio = archivioVuoto();
  /** revisione letta o scritta per ultima nel localStorage; null se la chiave non esiste */
  #revisioneBase: number | null = null;
  #stato: StatoSalvataggio = 'salvato';
  #inSospeso = false;
  #contenutoOriginale: string | null = null;
  #ascoltatori = new Set<(evento: EventoArchivio) => void>();

  constructor(memoria: MemoriaLocale, chiave = CHIAVE_ARCHIVIO) {
    this.#memoria = memoria;
    this.#chiave = chiave;
    this.#carica();
  }

  get archivio(): Archivio {
    return this.#archivio;
  }
  get stato(): StatoSalvataggio {
    return this.#stato;
  }
  /** true se ci sono modifiche solo in memoria */
  get inSospeso(): boolean {
    return this.#inSospeso;
  }
  /** true se nel localStorage non c'è ancora un archivio (primo avvio) */
  get nuovo(): boolean {
    return this.#revisioneBase === null && this.#stato !== 'illeggibile';
  }
  /** testo salvato non leggibile, da offrire come download ("contenuto originale") */
  get contenutoOriginale(): string | null {
    return this.#contenutoOriginale;
  }
  get messaggio(): string {
    switch (this.#stato) {
      case 'salvato':
        return MESSAGGI.salvato;
      case 'non-salvato':
        return MESSAGGI.quota;
      case 'illeggibile':
        return MESSAGGI.illeggibile;
      case 'conflitto':
        return MESSAGGI.conflitto;
    }
  }

  ascolta(ascoltatore: (evento: EventoArchivio) => void): () => void {
    this.#ascoltatori.add(ascoltatore);
    return () => this.#ascoltatori.delete(ascoltatore);
  }

  #notifica(origine: OrigineAggiornamento) {
    const evento = { archivio: this.#archivio, stato: this.#stato, origine };
    for (const a of this.#ascoltatori) a(evento);
  }

  #carica(): void {
    let grezzo: string | null;
    try {
      grezzo = this.#memoria.getItem(this.#chiave);
    } catch {
      // localStorage non accessibile (es. bloccato dalle impostazioni): si lavora in memoria
      grezzo = null;
    }
    this.#contenutoOriginale = null;
    this.#inSospeso = false;
    if (grezzo === null) {
      this.#archivio = archivioVuoto();
      this.#revisioneBase = null;
      this.#stato = 'salvato';
      return;
    }
    try {
      this.#archivio = validaArchivio(JSON.parse(grezzo));
      this.#revisioneBase = this.#archivio.revisione;
      this.#stato = 'salvato';
    } catch {
      this.#archivio = archivioVuoto();
      this.#revisioneBase = null;
      this.#contenutoOriginale = grezzo;
      this.#stato = 'illeggibile';
    }
  }

  /** Rilegge il localStorage (es. "Ricarica" dopo un conflitto). Le modifiche in memoria si perdono. */
  ricarica(): void {
    this.#carica();
    this.#notifica('ricarica');
  }

  /**
   * Applica una modifica e salva subito. `modifica` riceve l'archivio corrente e ne restituisce uno
   * nuovo (non deve mutare quello ricevuto). Bloccato se l'archivio è illeggibile o in conflitto.
   */
  aggiorna(modifica: (archivio: Archivio) => Archivio): EsitoSalvataggio {
    if (this.#stato === 'illeggibile' || this.#stato === 'conflitto') {
      return { ok: false, stato: this.#stato, messaggio: this.#stato === 'conflitto' ? MESSAGGI.conflitto : MESSAGGI.bloccato };
    }
    this.#archivio = modifica(this.#archivio);
    this.#inSospeso = true;
    const esito = this.#scrivi();
    this.#notifica('modifica');
    return esito;
  }

  /** "Salva ora": riprova a scrivere le modifiche rimaste in memoria. */
  salvaOra(): EsitoSalvataggio {
    if (this.#stato === 'illeggibile' || this.#stato === 'conflitto') {
      return { ok: false, stato: this.#stato, messaggio: this.#stato === 'conflitto' ? MESSAGGI.conflitto : MESSAGGI.bloccato };
    }
    if (!this.#inSospeso) return { ok: true, stato: this.#stato };
    const esito = this.#scrivi();
    this.#notifica('modifica');
    return esito;
  }

  /**
   * Sostituisce l'intero archivio (importazione di un backup già unito e confermato). È l'unica
   * operazione ammessa con un archivio illeggibile, come nel PoC; in conflitto serve prima ricaricare.
   */
  sostituisci(archivio: Archivio): EsitoSalvataggio {
    if (this.#stato === 'conflitto') return { ok: false, stato: this.#stato, messaggio: MESSAGGI.conflitto };
    const validato = validaArchivio(archivio);
    if (this.#stato === 'illeggibile') {
      // Il contenuto illeggibile viene sostituito solo per scelta esplicita: da qui in poi si scrive
      this.#revisioneBase = revisioneSalvata(this.#leggiGrezzo());
      this.#contenutoOriginale = null;
      this.#stato = 'salvato';
    }
    this.#archivio = validato;
    this.#inSospeso = true;
    const esito = this.#scrivi(true);
    this.#notifica('importazione');
    return esito;
  }

  #leggiGrezzo(): string | null {
    try {
      return this.#memoria.getItem(this.#chiave);
    } catch {
      return null;
    }
  }

  #scrivi(ignoraIlleggibile = false): EsitoSalvataggio {
    // Controllo del conflitto: la revisione salvata deve essere quella da cui siamo partiti
    const salvata = revisioneSalvata(this.#leggiGrezzo());
    const diversa = salvata !== this.#revisioneBase && !(ignoraIlleggibile && Number.isNaN(salvata));
    if (diversa) {
      this.#stato = 'conflitto';
      return { ok: false, stato: 'conflitto', messaggio: MESSAGGI.conflitto };
    }
    const prossima = { ...this.#archivio, revisione: Math.max(this.#archivio.revisione, salvata && !Number.isNaN(salvata) ? salvata : 0) + 1 };
    try {
      this.#memoria.setItem(this.#chiave, JSON.stringify(prossima));
    } catch {
      this.#stato = 'non-salvato';
      return { ok: false, stato: 'non-salvato', messaggio: MESSAGGI.quota };
    }
    this.#archivio = prossima;
    this.#revisioneBase = prossima.revisione;
    this.#inSospeso = false;
    this.#stato = 'salvato';
    return { ok: true, stato: 'salvato' };
  }

  /**
   * Da collegare all'evento `storage` di window: un'altra scheda ha scritto la chiave.
   * Senza modifiche in sospeso si adotta il diario nuovo; con modifiche in sospeso si blocca.
   */
  modificaEsterna(nuovoValore: string | null): void {
    if (this.#stato === 'illeggibile') {
      // L'altra scheda potrebbe aver importato un backup valido: si riprova a leggere
      this.#carica();
      this.#notifica('esterna');
      return;
    }
    const revisione = revisioneSalvata(nuovoValore);
    if (revisione === this.#revisioneBase) return;
    if (this.#inSospeso || this.#stato === 'conflitto') {
      this.#stato = 'conflitto';
      this.#notifica('esterna');
      return;
    }
    this.#carica();
    this.#notifica('esterna');
  }
}

let condiviso: RepositoryArchivio | null = null;

/**
 * Repository unico della pagina, sul localStorage, collegato all'evento `storage`.
 * Le isole della stessa pagina condividono il modulo, quindi anche l'istanza.
 */
export function archivioCondiviso(): RepositoryArchivio {
  if (condiviso) return condiviso;
  if (typeof window === 'undefined') throw new ErroreArchivio('L’archivio è disponibile solo nel browser.');
  let memoria: MemoriaLocale;
  try {
    memoria = window.localStorage;
  } catch {
    // Accesso negato al localStorage: un archivio solo in memoria; il primo salvataggio fallirà con il messaggio di quota
    memoria = {
      getItem: () => null,
      setItem: () => {
        throw new Error('localStorage non disponibile');
      },
    };
  }
  const repo = new RepositoryArchivio(memoria);
  window.addEventListener('storage', (evento) => {
    if (evento.key === CHIAVE_ARCHIVIO || evento.key === null) repo.modificaEsterna(evento.key === null ? null : evento.newValue);
  });
  condiviso = repo;
  return repo;
}

/** Chiede al browser di non cancellare i dati sotto pressione di spazio. Restituisce l'esito, o null se non supportato. */
export async function richiediPersistenza(storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined = globalThis.navigator?.storage): Promise<boolean | null> {
  if (!storage?.persist) return null;
  try {
    if (await storage.persisted?.()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}
