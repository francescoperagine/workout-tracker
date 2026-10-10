// Schermo acceso durante l'allenamento (US-24, PIANO step 7): Screen Wake Lock dove c'è. Il browser
// rilascia il blocco quando la pagina va in background; al rientro lo si chiede di nuovo. Su alcune
// PWA iOS più vecchie non funziona: le Impostazioni dicono che gli avvisi non sono garantiti.

let wanted = false;
let sentinel: WakeLockSentinel | null = null;
let listening = false;

async function acquire() {
  if (!wanted || sentinel || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => (sentinel = null));
    // richiesta superata mentre si aspettava: si rilascia subito
    if (!wanted) void release();
  } catch {
    sentinel = null;
  }
}

async function release() {
  const current = sentinel;
  sentinel = null;
  await current?.release().catch(() => {});
}

/** true finché c'è un allenamento in corso */
export function keepScreenOn(on: boolean): void {
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => void acquire());
  }
  if (on === wanted) return;
  wanted = on;
  void (on ? acquire() : release());
}

/** Per i test e2e: il blocco è attivo */
export function screenKeptOn(): boolean {
  return sentinel !== null;
}
