// Percorsi dell'app rispetto al percorso base (WT_BASE, decisione 7 del piano). Ogni link, risorsa
// e redirect del codice nuovo passa da qui, mai da un percorso assoluto scritto a mano.
// Le pagine sono cartelle (dist/settings/index.html): i link finiscono con "/", così il server
// statico non deve reindirizzare e il service worker trova la pagina nel precache.

/** Unisce base e percorso: joinBase('/workout-tracker/', '/settings?x=1') → '/workout-tracker/settings/?x=1' */
export function joinBase(base: string, path: string): string {
  const root = base.endsWith('/') ? base : `${base}/`;
  const match = /^([^?#]*)(.*)$/.exec(path)!;
  let pathname = match[1].replace(/^\/+/, '');
  const rest = match[2];
  // i file (con estensione) restano come sono; le pagine prendono la barra finale
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  if (pathname && !isFile && !pathname.endsWith('/')) pathname += '/';
  return `${root}${pathname}${rest}`;
}

/** Percorso base dell'app, con la barra finale ('/' o '/workout-tracker/') */
export const BASE = joinBase(import.meta.env.BASE_URL ?? '/', '');

/** Link a una pagina o a un file dell'app: appUrl('/settings') → '/workout-tracker/settings/' */
export function appUrl(path: string): string {
  return joinBase(BASE, path);
}

/** true se il percorso corrente è la pagina indicata (con o senza barra finale) */
export function isCurrentPath(pathname: string, path: string): boolean {
  const normalize = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  return normalize(pathname) === normalize(appUrl(path).split(/[?#]/)[0]);
}
