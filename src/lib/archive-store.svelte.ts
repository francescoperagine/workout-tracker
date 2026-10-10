// Archivio v2 per le isole Svelte: una vista reattiva del repository condiviso della pagina.
// Con il ClientRouter i moduli restano caricati tra una pagina e l'altra, quindi anche il repository
// (e il suo ascolto dell'evento `storage`) è uno solo per tutta la visita.
import { requestPersistence, sharedArchive, type Archive, type ArchiveRepository, type SaveResult, type SaveState } from './archive';

class ArchiveStore {
  readonly repo: ArchiveRepository;
  archive: Archive = $state.raw(null!);
  state: SaveState = $state('saved');
  /** true finché nel browser non c'è un archivio (primo avvio) */
  isNew = $state(false);

  constructor() {
    this.repo = sharedArchive();
    this.#sync();
    this.repo.subscribe(() => this.#sync());
    // Come nel PoC: avviso prima di chiudere o ricaricare con modifiche rimaste solo in memoria (P4)
    window.addEventListener('beforeunload', (event) => {
      if (this.repo.pending) event.preventDefault();
    });
  }

  #sync() {
    this.archive = this.repo.archive;
    this.state = this.repo.state;
    this.isNew = this.repo.isNew;
  }

  update(change: (archive: Archive) => Archive): SaveResult {
    return this.repo.update(change);
  }
}

let store: ArchiveStore | null = null;
let persistenceAsked = false;

/** Da chiamare solo nel browser (onMount o isole client:only). */
export function archiveStore(): ArchiveStore {
  store ??= new ArchiveStore();
  return store;
}

/**
 * Chiede la conservazione dei dati (`navigator.storage.persist()`) una volta per visita, solo quando
 * esiste un archivio: mai al primo avvio, prima che l'utente abbia scelto come iniziare (US-01).
 */
export function askPersistenceOnce(): void {
  if (persistenceAsked || !store || store.isNew || store.state === 'unreadable') return;
  persistenceAsked = true;
  void requestPersistence();
}
