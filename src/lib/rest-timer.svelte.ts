// Timer di recupero per le isole Svelte (step 7): uno solo per visita, come l'archivio (con il
// ClientRouter i moduli restano caricati tra le pagine). Lo stato è persistito nella sua chiave a ogni
// cambiamento, così il conteggio sopravvive a ricarica, chiusura e schermo bloccato (US-26) ed è lo
// stesso nelle altre schede del browser (evento `storage`). Il tempo si ricalcola dall'istante di fine
// a ogni scatto e a ogni `visibilitychange`, mai contando i secondi.
import { archiveStore } from './archive-store.svelte';
import { alertRestEnd, unlockAudio } from './rest-alert';
import { localRestNotifier, type RestNotifier } from './rest-notifier';
import {
  GO_VISIBLE_MS,
  LATE_ALERT_MS,
  REST_TIMER_KEY,
  isRestOver,
  parseRestTimer,
  restAfterCheck,
  restFraction,
  restIsStale,
  restOverFor,
  restRemaining,
  shiftRest,
  startRest,
  type RestTimerState,
} from './rest-timer';

const TICK_MS = 250;

class RestTimerStore {
  state: RestTimerState | null = $state(null);
  now = $state(Date.now());
  readonly #archive = archiveStore();
  readonly #notifier: RestNotifier = localRestNotifier(() => this.#tick());
  #interval: ReturnType<typeof setInterval> | undefined;
  /** quando lo schermo "Vai" è stato visto per la prima volta (non persistito: dopo una ricarica si rivede) */
  #goSeenAt: number | null = null;

  constructor() {
    this.state = this.#read();
    window.addEventListener('storage', (event) => {
      if (event.key !== REST_TIMER_KEY) return;
      this.state = parseRestTimer(event.newValue);
      this.#goSeenAt = null;
      this.#run();
    });
    // rientro da schermo bloccato o da un'altra app: tempo ricalcolato subito (US-26)
    document.addEventListener('visibilitychange', () => this.#tick());
    // spunta tolta, serie o sessione tolte, allenamento concluso: il timer non vale più (US-22)
    this.#archive.repo.subscribe(() => this.#validate());
    this.#validate();
    this.#run();
  }

  get remaining(): number {
    return this.state ? restRemaining(this.state, this.now) : 0;
  }
  get over(): boolean {
    return !!this.state && isRestOver(this.state, this.now);
  }
  get fraction(): number {
    return this.state ? restFraction(this.state, this.now) : 0;
  }
  /** secondi dalla fine (0 se non è finito) */
  get overFor(): number {
    return this.state ? restOverFor(this.state, this.now) : 0;
  }
  get open(): boolean {
    return !!this.state && !this.state.minimized;
  }

  /**
   * Dopo una spunta riuscita (US-21): parte il recupero della serie, oppure nessuno (0, giro di
   * superserie non finito). Una spunta senza recupero chiude quello in corso: si è ripreso a lavorare.
   * Va chiamata dentro il gesto, perché sblocca l'audio del suono di fine.
   */
  afterCheck(sessionId: string, exerciseId: string, setId: string): void {
    unlockAudio();
    const session = this.#archive.repo.archive.sessions.find((s) => s.id === sessionId);
    const rest = session ? restAfterCheck(session, exerciseId, setId) : null;
    const now = Date.now();
    const next = rest ? startRest({ sessionId, exerciseId, setId }, rest, now) : null;
    if (this.state && this.state.setId !== next?.setId) void this.#notifier.cancel(this.state.setId);
    this.now = now;
    this.#set(next);
    if (next) void this.#notifier.schedule(next);
  }

  /** −15 s / +15 s (US-22) */
  shift(seconds: number): void {
    if (!this.state) return;
    const now = Date.now();
    this.now = now;
    const next = shiftRest(this.state, seconds, now);
    this.#set(next);
    if (isRestOver(next, now)) this.#tick();
    else void this.#notifier.schedule(next);
  }

  /** Salta, Chiudi: il recupero finisce qui */
  stop(): void {
    if (this.state) void this.#notifier.cancel(this.state.setId);
    this.#set(null);
  }

  minimize(): void {
    if (this.state && !this.state.minimized) this.#set({ ...this.state, minimized: true });
  }

  expand(): void {
    if (this.state?.minimized) this.#set({ ...this.state, minimized: false });
  }

  #set(state: RestTimerState | null) {
    if (state?.setId !== this.state?.setId || (state && !isRestOver(state, Date.now()))) this.#goSeenAt = null;
    this.state = state;
    try {
      if (state) localStorage.setItem(REST_TIMER_KEY, JSON.stringify(state));
      else localStorage.removeItem(REST_TIMER_KEY);
    } catch {
      // senza storage il timer funziona lo stesso, solo non sopravvive alla ricarica
    }
    this.#run();
  }

  #read(): RestTimerState | null {
    try {
      return parseRestTimer(localStorage.getItem(REST_TIMER_KEY));
    } catch {
      return null;
    }
  }

  #validate() {
    const repo = this.#archive.repo;
    if (!this.state || repo.state === 'unreadable') return;
    if (restIsStale(this.state, repo.archive)) this.stop();
  }

  /** Lo scatto: tempo ricalcolato, avviso di fine una volta sola, "Vai" chiuso dopo 6 s in vista */
  #tick() {
    const now = Date.now();
    this.now = now;
    const state = this.state;
    if (!state || !isRestOver(state, now)) return;
    if (!state.alerted) {
      // in ritardo di oltre un minuto (schermo bloccato) non suona più: lo si vede al rientro
      if (now - state.end <= LATE_ALERT_MS) alertRestEnd(this.#archive.repo.archive.settings);
      this.#set({ ...state, alerted: true });
    }
    if (document.visibilityState !== 'visible') return;
    this.#goSeenAt ??= now;
    if (now - this.#goSeenAt >= GO_VISIBLE_MS) this.stop();
  }

  #run() {
    if (this.state && this.#interval === undefined) this.#interval = setInterval(() => this.#tick(), TICK_MS);
    else if (!this.state && this.#interval !== undefined) {
      clearInterval(this.#interval);
      this.#interval = undefined;
    }
  }
}

let store: RestTimerStore | null = null;

/** Da chiamare solo nel browser (onMount o isole client:only). */
export function restTimer(): RestTimerStore {
  store ??= new RestTimerStore();
  return store;
}
