// PWA (US-03): registrazione del service worker con scope pari al percorso base e invito
// all'installazione gestito dall'app (mai al primo avvio, P8): l'evento del browser viene trattenuto
// e usato solo quando l'utente tocca "Installa l'app".
import { BASE, appUrl } from './paths';

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const INSTALL_EVENT = 'bt:installable';

let deferred: InstallPromptEvent | null = null;

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register(appUrl('/sw.js'), { scope: BASE }).catch(() => {
    // senza service worker l'app funziona lo stesso, solo non offline
  });
}

export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    window.dispatchEvent(new Event(INSTALL_EVENT));
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    window.dispatchEvent(new Event(INSTALL_EVENT));
  });
}

/** true se il browser permette di mostrare ora la richiesta di installazione */
export function canPromptInstall(): boolean {
  return deferred !== null;
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const event = deferred;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  window.dispatchEvent(new Event(INSTALL_EVENT));
  return outcome;
}
