// Tema dell'interfaccia (US-30). È una preferenza del dispositivo, non un dato del diario:
// vive in una chiave a parte, così lo script inline di Base.astro la applica prima del primo disegno.
//
// Il registro qui sotto è l'unico elenco dei temi: da qui leggono lo script inline, il selettore
// e i test. Per aggiungere un tema (es. "arancione" su nero) vedi DESIGN.md, "Aggiungere un tema":
// una voce qui e un file src/styles/themes/<id>.css con i token sovrascritti sotto :root[data-theme="<id>"].
// Le etichette sono testo per l'utente, quindi in italiano.

export interface ThemeDefinition {
  label: string;
  /** 'auto' segue chiaro/scuro del sistema (valori light-dark()); 'light' o 'dark' fissano il color-scheme */
  scheme: 'auto' | 'light' | 'dark';
}

export const THEME_REGISTRY = {
  system: { label: 'Sistema', scheme: 'auto' },
  light: { label: 'Chiaro', scheme: 'light' },
  dark: { label: 'Scuro', scheme: 'dark' },
} as const satisfies Record<string, ThemeDefinition>;

export type Theme = keyof typeof THEME_REGISTRY;

export const THEME_KEY = 'bodytracker.theme';
/** Il tema predefinito non scrive nulla: nessun data-theme e nessuna chiave salvata */
export const DEFAULT_THEME: Theme = 'system';
export const THEMES = Object.keys(THEME_REGISTRY) as Theme[];
export const THEME_LABELS = Object.fromEntries(THEMES.map((t) => [t, THEME_REGISTRY[t].label])) as Record<Theme, string>;

/**
 * Script inline di Base.astro: applica il tema salvato prima del primo disegno, solo se è nel registro.
 * Con il ClientRouter lo script in <head> gira una volta sola e la navigazione sostituisce gli attributi
 * di <html>: per questo il tema viene applicato anche al documento nuovo prima dello scambio.
 */
export function themeBootScript(): string {
  const allowed = THEMES.filter((t) => t !== DEFAULT_THEME);
  return `(function(){function a(d){try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(${JSON.stringify(allowed)}.indexOf(t)>-1)d.documentElement.dataset.theme=t}catch(e){}}a(document);document.addEventListener('astro:before-swap',function(e){a(e.newDocument)})})()`;
}

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export function readTheme(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Theme {
  try {
    const value = storage?.getItem(THEME_KEY);
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Imposta data-theme su <html>; con il tema predefinito lo toglie e decide prefers-color-scheme. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  if (theme === DEFAULT_THEME) delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Salva e applica. Restituisce false se il salvataggio non riesce (il tema vale comunque per questa pagina). */
export function saveTheme(theme: Theme, storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = globalThis.localStorage): boolean {
  applyTheme(theme);
  try {
    if (theme === DEFAULT_THEME) storage?.removeItem(THEME_KEY);
    else storage?.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
