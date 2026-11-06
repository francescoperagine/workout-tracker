# ADR-005 — Palette a ruoli: il guscio segue il tema, vermiglio, rosso per gli errori, indaco per i record

Status: Accepted
Increment: INC-010

## Context

L'app era nel mondo verde del PoC: un guscio verde scuro fisso nei due temi (intestazione, barre, tab bar,
avvisi, timer) con i suoi 13 token `shell-*` e `level`, attorno a un contenuto chiaro o scuro. Francesco ha
chiesto una palette in bianco e nero in chiaro e scuro, con bordi grigi chiari e senza verde (ADR-004 l'aveva
annunciata). La prima proposta usava un accento rosso (`#D0202E`, `#EF3340`, `#A8141F`) che era anche il colore
degli errori e delle azioni distruttive: un errore non si distingueva da un'azione, e il bianco sul rosso pieno
non dava margine in entrambi i temi.

## Decision

- **Il guscio segue il tema (opzione A), su `surface` come le card.** Scartata l'opzione B, guscio scuro fisso
  nei due temi: avrebbe tenuto in vita una seconda rampa di token (`shell-*`) e, nel tema chiaro, una banda nera
  in alto e in basso attorno a un contenuto quasi bianco. Con A ogni componente usa gli stessi ruoli ovunque, e
  `.shell` dice solo `surface` + `text`.
- **Barra di stato iOS `default` nel chiaro** (`black-translucent` nello scuro); `theme-color` con due meta per
  `media`, sul `bg` di ciascun tema (`THEME_COLORS` in `src/lib/theme.ts`), riallineati dallo script inline
  quando il tema è forzato.
- **Accento vermiglio** (`#E85A2A` / `#FF7A45`, con `on-accent` nero nei due temi) al posto del rosso: resta
  caldo e visibile, ma non coincide più con `danger`.
- **`danger` rosso lampone** (`#BE123C` / `#FF7A8A`) solo per errori e azioni distruttive, sempre con icona e
  testo; il pulsante distruttivo diventa pieno con `on-danger`. Eliminati `warning-*` e `danger-bg`: gli avvisi
  informativi sono neutri con l'icona `info`.
- **`highlight` indaco** (`#165E83` / `#8AB4E8`) solo per trofei e record, e per la seconda serie di un grafico
  che confronta due esercizi; mai pulsanti, link o stati.
- **`src/styles/contrast.test.ts` è l'arbitro** delle coppie (testo ≥ 4,5:1, bordi e indicatori ≥ 3:1) e
  controlla che nessun colore stia fuori dai token.

## Consequences

- Un solo insieme di ruoli in `@theme`; il guscio non ha più token propri e un tema aggiuntivo ridefinisce meno valori.
- Nel tema chiaro intestazione e barre sono bianche: la separazione dal contenuto la fanno il filo `border` e il
  fondo `bg` della pagina, non il contrasto del guscio.
- Chi distingue male arancione e rosso riconosce errori e distruttive dall'icona e dal testo, non dal colore.
- Il successo non ha colore: serie ed esercizi fatti si leggono dalla spunta piena `done`.
