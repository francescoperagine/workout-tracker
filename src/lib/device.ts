// Informazioni e preferenze del dispositivo, fuori dall'archivio (come il tema): piattaforma,
// app installata, vibrazione, data dell'ultimo backup esportato da questo browser.

export const LAST_BACKUP_KEY = 'workout-tracker.lastBackup';

/** iPhone, iPad o iPod (anche iPadOS, che si presenta come Mac con il touch) */
export function isIos(nav: Pick<Navigator, 'userAgent' | 'maxTouchPoints'> = navigator): boolean {
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
}

/** Aperta come app installata (dalla schermata Home), non in una scheda del browser */
export function isStandalone(): boolean {
  return matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Timestamp dell'ultimo backup esportato da qui, o null */
export function readLastBackup(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): number | null {
  try {
    const value = Number(storage?.getItem(LAST_BACKUP_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveLastBackup(timestamp: number, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(LAST_BACKUP_KEY, String(timestamp));
  } catch {
    // non essenziale: il backup è comunque scaricato
  }
}

/** Scarica un testo come file (backup, contenuto originale di un archivio illeggibile) */
export function downloadText(text: string, fileName: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
