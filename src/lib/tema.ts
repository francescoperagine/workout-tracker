// Tema dell'interfaccia: Sistema, Chiaro o Scuro (US-30).
// È una preferenza del dispositivo, non un dato del diario: vive in una chiave a parte,
// così lo script inline di Base.astro la applica prima del primo disegno senza leggere l'archivio.

export type Tema = 'sistema' | 'chiaro' | 'scuro';

export const CHIAVE_TEMA = 'bodytracker.tema';
export const TEMI: readonly Tema[] = ['sistema', 'chiaro', 'scuro'];
export const ETICHETTE_TEMA: Record<Tema, string> = { sistema: 'Sistema', chiaro: 'Chiaro', scuro: 'Scuro' };

export function isTema(valore: unknown): valore is Tema {
  return typeof valore === 'string' && (TEMI as readonly string[]).includes(valore);
}

export function leggiTema(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Tema {
  try {
    const valore = storage?.getItem(CHIAVE_TEMA);
    return isTema(valore) ? valore : 'sistema';
  } catch {
    return 'sistema';
  }
}

/** Imposta data-theme su <html>; con "sistema" lo toglie e decide prefers-color-scheme. */
export function applicaTema(tema: Tema, radice: HTMLElement = document.documentElement): void {
  if (tema === 'sistema') delete radice.dataset.theme;
  else radice.dataset.theme = tema;
}

/** Salva e applica. Restituisce false se il salvataggio non riesce (il tema vale comunque per questa pagina). */
export function salvaTema(tema: Tema, storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = globalThis.localStorage): boolean {
  applicaTema(tema);
  try {
    if (tema === 'sistema') storage?.removeItem(CHIAVE_TEMA);
    else storage?.setItem(CHIAVE_TEMA, tema);
    return true;
  } catch {
    return false;
  }
}
