// Repository dell'archivio v2 nel localStorage (US-33, P4). Comportamenti e messaggi del PoC:
// - salvataggio a ogni modifica, con stato visibile; se il browser rifiuta (quota o permessi) i dati
//   restano in memoria e "Salva ora" riprova;
// - archivio illeggibile: nessuna sovrascrittura, il contenuto originale resta scaricabile;
// - un'altra scheda del browser che modifica il diario non viene mai sovrascritta in silenzio.
// Con la revisione si distingue meglio del PoC: se questa scheda non ha modifiche in sospeso, adotta
// il diario più recente (e lo notifica); il blocco con richiesta di ricaricare scatta solo quando
// entrambe le schede hanno modifiche (conflitto vero).
import { validateArchive } from './validation';
import { ARCHIVE_KEY, ArchiveError, emptyArchive, type Archive } from './types';

/** Messaggi per l'utente, dal PoC */
export const MESSAGES = {
  saved: 'Salvato su questo dispositivo',
  notSaved: 'Salvataggio non riuscito',
  quota:
    'Il browser non consente il salvataggio o lo spazio è esaurito. Esporta subito un backup da Dati e privacy; le modifiche restano aperte in questa pagina.',
  unreadable:
    'Non riesco a leggere l’archivio locale. Il contenuto originale non è stato sovrascritto: puoi scaricarlo da Dati e privacy e importare un backup valido.',
  conflict:
    'Il diario è stato modificato in un’altra scheda. Esporta eventuali modifiche aperte e ricarica questa pagina prima di continuare.',
  blocked: 'L’archivio non è disponibile. Esporta il contenuto originale o importa un backup dalla sezione Dati e privacy.',
} as const;

/**
 * - `saved`: tutto è nel localStorage;
 * - `unsaved`: l'ultimo salvataggio è fallito, le modifiche sono solo in memoria;
 * - `unreadable`: il contenuto salvato non è valido, nessuna scrittura finché non si importa un backup;
 * - `conflict`: un'altra scheda ha cambiato il diario mentre qui c'erano modifiche, serve ricaricare.
 */
export type SaveState = 'saved' | 'unsaved' | 'unreadable' | 'conflict';

export type UpdateOrigin = 'edit' | 'external' | 'reload' | 'import';

export interface ArchiveEvent {
  archive: Archive;
  state: SaveState;
  origin: UpdateOrigin;
}

export type LocalStore = Pick<Storage, 'getItem' | 'setItem'>;

export interface SaveResult {
  ok: boolean;
  state: SaveState;
  /** messaggio per l'utente quando ok è false */
  message?: string;
}

function storedRevision(raw: string | null): number | null {
  if (raw === null) return null;
  try {
    const r = (JSON.parse(raw) as { revision?: unknown })?.revision;
    return typeof r === 'number' ? r : Number.NaN;
  } catch {
    return Number.NaN;
  }
}

export class ArchiveRepository {
  #store: LocalStore;
  #key: string;
  #archive: Archive = emptyArchive();
  /** revisione letta o scritta per ultima nel localStorage; null se la chiave non esiste */
  #baseRevision: number | null = null;
  #state: SaveState = 'saved';
  #pending = false;
  #originalContent: string | null = null;
  #listeners = new Set<(event: ArchiveEvent) => void>();

  constructor(store: LocalStore, key = ARCHIVE_KEY) {
    this.#store = store;
    this.#key = key;
    this.#load();
  }

  get archive(): Archive {
    return this.#archive;
  }
  get state(): SaveState {
    return this.#state;
  }
  /** true se ci sono modifiche solo in memoria */
  get pending(): boolean {
    return this.#pending;
  }
  /** true se nel localStorage non c'è ancora un archivio (primo avvio) */
  get isNew(): boolean {
    return this.#baseRevision === null && this.#state !== 'unreadable';
  }
  /** testo salvato non leggibile, da offrire come download ("contenuto originale") */
  get originalContent(): string | null {
    return this.#originalContent;
  }
  /** messaggio per l'utente che descrive lo stato */
  get message(): string {
    switch (this.#state) {
      case 'saved':
        return MESSAGES.saved;
      case 'unsaved':
        return MESSAGES.quota;
      case 'unreadable':
        return MESSAGES.unreadable;
      case 'conflict':
        return MESSAGES.conflict;
    }
  }

  subscribe(listener: (event: ArchiveEvent) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify(origin: UpdateOrigin) {
    const event = { archive: this.#archive, state: this.#state, origin };
    for (const listener of this.#listeners) listener(event);
  }

  #readRaw(): string | null {
    try {
      return this.#store.getItem(this.#key);
    } catch {
      // localStorage non accessibile (es. bloccato dalle impostazioni): si lavora in memoria
      return null;
    }
  }

  #load(): void {
    const raw = this.#readRaw();
    this.#originalContent = null;
    this.#pending = false;
    if (raw === null) {
      this.#archive = emptyArchive();
      this.#baseRevision = null;
      this.#state = 'saved';
      return;
    }
    try {
      this.#archive = validateArchive(JSON.parse(raw));
      this.#baseRevision = this.#archive.revision;
      this.#state = 'saved';
    } catch {
      this.#archive = emptyArchive();
      this.#baseRevision = null;
      this.#originalContent = raw;
      this.#state = 'unreadable';
    }
  }

  #blocked(): SaveResult | null {
    if (this.#state === 'conflict') return { ok: false, state: 'conflict', message: MESSAGES.conflict };
    if (this.#state === 'unreadable') return { ok: false, state: 'unreadable', message: MESSAGES.blocked };
    return null;
  }

  /** Rilegge il localStorage (es. "Ricarica" dopo un conflitto). Le modifiche in memoria si perdono. */
  reload(): void {
    this.#load();
    this.#notify('reload');
  }

  /**
   * Applica una modifica e salva subito. `change` riceve l'archivio corrente e ne restituisce uno
   * nuovo (non deve mutare quello ricevuto). Bloccato se l'archivio è illeggibile o in conflitto.
   */
  update(change: (archive: Archive) => Archive): SaveResult {
    const blocked = this.#blocked();
    if (blocked) return blocked;
    this.#archive = change(this.#archive);
    this.#pending = true;
    const result = this.#write();
    this.#notify('edit');
    return result;
  }

  /** "Salva ora": riprova a scrivere le modifiche rimaste in memoria. */
  saveNow(): SaveResult {
    const blocked = this.#blocked();
    if (blocked) return blocked;
    if (!this.#pending) return { ok: true, state: this.#state };
    const result = this.#write();
    this.#notify('edit');
    return result;
  }

  /**
   * Sostituisce l'intero archivio (importazione di un backup già unito e confermato). È l'unica
   * operazione ammessa con un archivio illeggibile, come nel PoC; in conflitto serve prima ricaricare.
   */
  replace(archive: Archive): SaveResult {
    if (this.#state === 'conflict') return { ok: false, state: 'conflict', message: MESSAGES.conflict };
    const validated = validateArchive(archive);
    if (this.#state === 'unreadable') {
      // Il contenuto illeggibile viene sostituito solo per scelta esplicita: da qui in poi si scrive
      this.#baseRevision = storedRevision(this.#readRaw());
      this.#originalContent = null;
      this.#state = 'saved';
    }
    this.#archive = validated;
    this.#pending = true;
    const result = this.#write(true);
    this.#notify('import');
    return result;
  }

  #write(overwriteUnreadable = false): SaveResult {
    // Controllo del conflitto: la revisione salvata deve essere quella da cui siamo partiti
    const stored = storedRevision(this.#readRaw());
    const changed = stored !== this.#baseRevision && !(overwriteUnreadable && Number.isNaN(stored));
    if (changed) {
      this.#state = 'conflict';
      return { ok: false, state: 'conflict', message: MESSAGES.conflict };
    }
    const next = { ...this.#archive, revision: Math.max(this.#archive.revision, stored && !Number.isNaN(stored) ? stored : 0) + 1 };
    try {
      this.#store.setItem(this.#key, JSON.stringify(next));
    } catch {
      this.#state = 'unsaved';
      return { ok: false, state: 'unsaved', message: MESSAGES.quota };
    }
    this.#archive = next;
    this.#baseRevision = next.revision;
    this.#pending = false;
    this.#state = 'saved';
    return { ok: true, state: 'saved' };
  }

  /**
   * Da collegare all'evento `storage` di window: un'altra scheda ha scritto la chiave.
   * Senza modifiche in sospeso si adotta il diario nuovo; con modifiche in sospeso si blocca.
   */
  onExternalChange(newValue: string | null): void {
    if (this.#state === 'unreadable') {
      // L'altra scheda potrebbe aver importato un backup valido: si riprova a leggere
      this.#load();
      this.#notify('external');
      return;
    }
    const revision = storedRevision(newValue);
    if (revision === this.#baseRevision) return;
    if (this.#pending || this.#state === 'conflict') {
      this.#state = 'conflict';
      this.#notify('external');
      return;
    }
    this.#load();
    this.#notify('external');
  }
}

let shared: ArchiveRepository | null = null;

/**
 * Repository unico della pagina, sul localStorage, collegato all'evento `storage`.
 * Le isole della stessa pagina condividono il modulo, quindi anche l'istanza.
 */
export function sharedArchive(): ArchiveRepository {
  if (shared) return shared;
  if (typeof window === 'undefined') throw new ArchiveError('L’archivio è disponibile solo nel browser.');
  let store: LocalStore;
  try {
    store = window.localStorage;
  } catch {
    // Accesso negato al localStorage: un archivio solo in memoria; il primo salvataggio fallirà con il messaggio di quota
    store = {
      getItem: () => null,
      setItem: () => {
        throw new Error('localStorage non disponibile');
      },
    };
  }
  const repo = new ArchiveRepository(store);
  window.addEventListener('storage', (event) => {
    if (event.key === ARCHIVE_KEY || event.key === null) repo.onExternalChange(event.key === null ? null : event.newValue);
  });
  shared = repo;
  return repo;
}

/** Chiede al browser di non cancellare i dati sotto pressione di spazio. Restituisce l'esito, o null se non supportato. */
export async function requestPersistence(storage: Pick<StorageManager, 'persist' | 'persisted'> | undefined = globalThis.navigator?.storage): Promise<boolean | null> {
  if (!storage?.persist) return null;
  try {
    if (await storage.persisted?.()) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}
