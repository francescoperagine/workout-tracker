// Altezza dello stack fisso in basso, dichiarata in --bottom-bars-height sul <body> (main, avvisi e
// pulsanti appiccicati la usano). È la base della pagina (la tab bar, che AppLayout scrive in
// --bottom-bars-base) più le barre che compaiono e spariscono: barra di salvataggio, barra
// dell'allenamento, mini-barra. Ogni barra dichiara la sua altezza con un nome.
// Con il ClientRouter il <body> cambia a ogni pagina: le isole ricreate si dichiarano di nuovo, mentre
// quelle persistenti (transition:persist) restano registrate da una pagina all'altra.

interface Bar {
  height: number;
  persist: boolean;
}

const bars = new Map<string, Bar>();
let listening = false;

function apply() {
  const body = document.body;
  let total = parseFloat(body.style.getPropertyValue('--bottom-bars-base')) || 0;
  for (const bar of bars.values()) total += bar.height;
  body.style.setProperty('--bottom-bars-height', `${total}px`);
}

/** Dichiara l'altezza (px, senza l'area sicura) di una barra in basso; 0 quando è nascosta. */
export function setBottomBar(id: string, height: number, persist = false): void {
  if (!listening) {
    listening = true;
    document.addEventListener('astro:after-swap', () => {
      for (const [key, bar] of bars) if (!bar.persist) bars.delete(key);
      apply();
    });
  }
  bars.set(id, { height, persist });
  apply();
}
