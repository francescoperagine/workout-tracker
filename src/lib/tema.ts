// Tema dell'interfaccia (US-30). È una preferenza del dispositivo, non un dato del diario:
// vive in una chiave a parte, così lo script inline di Base.astro la applica prima del primo disegno.
//
// Il registro qui sotto è l'unico elenco dei temi: da qui leggono lo script inline, il selettore
// e i test. Per aggiungere un tema (es. "arancione" su nero) vedi DESIGN.md, "Aggiungere un tema":
// una voce qui e un file src/styles/temi/<id>.css con i token sovrascritti sotto :root[data-theme="<id>"].

export interface DefinizioneTema {
  etichetta: string;
  /** 'auto' segue chiaro/scuro del sistema (valori light-dark()); 'light' o 'dark' fissano il color-scheme */
  schema: 'auto' | 'light' | 'dark';
}

export const REGISTRO_TEMI = {
  sistema: { etichetta: 'Sistema', schema: 'auto' },
  chiaro: { etichetta: 'Chiaro', schema: 'light' },
  scuro: { etichetta: 'Scuro', schema: 'dark' },
} as const satisfies Record<string, DefinizioneTema>;

export type Tema = keyof typeof REGISTRO_TEMI;

export const CHIAVE_TEMA = 'bodytracker.tema';
/** Il tema predefinito non scrive nulla: nessun data-theme e nessuna chiave salvata */
export const TEMA_PREDEFINITO: Tema = 'sistema';
export const TEMI = Object.keys(REGISTRO_TEMI) as Tema[];
export const ETICHETTE_TEMA = Object.fromEntries(TEMI.map((t) => [t, REGISTRO_TEMI[t].etichetta])) as Record<Tema, string>;

/** Script inline di Base.astro: applica il tema salvato prima del primo disegno, solo se è nel registro. */
export function scriptTemaPrimaDelDisegno(): string {
  const ammessi = TEMI.filter((t) => t !== TEMA_PREDEFINITO);
  return `try{var t=localStorage.getItem(${JSON.stringify(CHIAVE_TEMA)});if(${JSON.stringify(ammessi)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;
}

export function isTema(valore: unknown): valore is Tema {
  return typeof valore === 'string' && (TEMI as readonly string[]).includes(valore);
}

export function leggiTema(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Tema {
  try {
    const valore = storage?.getItem(CHIAVE_TEMA);
    return isTema(valore) ? valore : TEMA_PREDEFINITO;
  } catch {
    return TEMA_PREDEFINITO;
  }
}

/** Imposta data-theme su <html>; con il tema predefinito lo toglie e decide prefers-color-scheme. */
export function applicaTema(tema: Tema, radice: HTMLElement = document.documentElement): void {
  if (tema === TEMA_PREDEFINITO) delete radice.dataset.theme;
  else radice.dataset.theme = tema;
}

/** Salva e applica. Restituisce false se il salvataggio non riesce (il tema vale comunque per questa pagina). */
export function salvaTema(tema: Tema, storage: Pick<Storage, 'setItem' | 'removeItem'> | undefined = globalThis.localStorage): boolean {
  applicaTema(tema);
  try {
    if (tema === TEMA_PREDEFINITO) storage?.removeItem(CHIAVE_TEMA);
    else storage?.setItem(CHIAVE_TEMA, tema);
    return true;
  } catch {
    return false;
  }
}
