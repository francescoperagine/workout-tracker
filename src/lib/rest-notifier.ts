// Avviso di fine recupero dietro un'interfaccia (PIANO step 7, decisione 3): oggi l'implementazione è
// locale, in primo piano (un timeout nella pagina). Domani un Web Push potrà avvisare anche con l'app
// chiusa, con la stessa interfaccia: il contratto del server è in docs/archive/restyling/WEB-PUSH.md, gli
// handler `push` e `notificationclick` sono già nel service worker (public/sw-push.js).
import type { RestTimerState } from './rest-timer';

export interface RestNotifier {
  /** Programma l'avviso per la fine del timer (sostituisce quello già programmato con lo stesso id) */
  schedule(timer: RestTimerState): Promise<void>;
  /** Annulla l'avviso del timer con questo id (`setId`) */
  cancel(id: string): Promise<void>;
}

/**
 * Avviso in primo piano: alla fine chiama `onEnd`. Con la pagina in background il browser può
 * ritardare il timeout; chi lo usa controlla comunque la fine a ogni ricalcolo.
 */
export function localRestNotifier(onEnd: (timer: RestTimerState) => void, clock: () => number = Date.now): RestNotifier {
  const pending = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    async schedule(timer) {
      const old = pending.get(timer.setId);
      if (old !== undefined) clearTimeout(old);
      pending.set(
        timer.setId,
        setTimeout(() => {
          pending.delete(timer.setId);
          onEnd(timer);
        }, Math.max(0, timer.end - clock())),
      );
    },
    async cancel(id) {
      const old = pending.get(id);
      if (old !== undefined) clearTimeout(old);
      pending.delete(id);
    },
  };
}
