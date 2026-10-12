---
name: Workout Tracker
description: Diario di allenamento privato e offline, con un guscio verde scuro attorno a un contenuto chiaro o scuro.
colors:
  background: "light-dark(#eef2ec, #142321)"
  surface: "light-dark(#ffffff, #1e302d)"
  field: "light-dark(#f7f9f5, #142321)"
  foreground: "light-dark(#142321, #f0f5ee)"
  muted: "light-dark(#4b5f55, #b8c9bf)"
  line: "light-dark(#c3d0c6, #344a41)"
  line-strong: "light-dark(#788f80, #6b8577)"
  accent: "light-dark(#2f5d34, #c7e69c)"
  on-accent: "light-dark(#f2f9e8, #19301e)"
  accent-text: "light-dark(#2f5d34, #c7e69c)"
  done: "light-dark(#ddebd0, #28432f)"
  danger: "light-dark(#a8321f, #ffb6a6)"
  danger-bg: "light-dark(#fbe9e5, #3d2621)"
  warning: "light-dark(#6b3d0f, #ffe0bd)"
  warning-bg: "light-dark(#fbecd9, #3e2f23)"
  warning-line: "light-dark(#c28a4a, #846b4e)"
  shell: "#142321"
  shell-panel: "#1e302d"
  shell-panel-hover: "#2a4238"
  shell-foreground: "#f0f5ee"
  shell-muted: "#b8c9bf"
  shell-line: "#344a41"
  shell-line-strong: "#6b8577"
  shell-accent: "#c7e69c"
  shell-accent-hover: "#dbf4b8"
  shell-on-accent: "#19301e"
  shell-warning: "#ffe0bd"
  shell-warning-icon: "#ffc98f"
  shell-warning-line: "#846b4e"
  level: "#3d6b47"
  backdrop: "rgb(9 23 19 / 0.6)"
  shadow: "rgb(9 23 19 / 0.28)"
typography:
  page-title:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  title-compact:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  button:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.2
  digits:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  set-digits:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 5.6vw, 1.375rem)"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  timer-digits:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "min(44cqw, 30cqh, 16rem)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  field: "8px"
  panel: "12px"
  dialog: "16px"
spacing:
  xxs: "4px"
  xs: "8px"
  controls: "12px"
  gutter: "16px"
  dialog: "24px"
  section: "48px"
  panel: "clamp(0.75rem, 4vw, 1rem)"
  row: "clamp(0.25rem, 1.6vw, 0.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-primary-shell:
    backgroundColor: "{colors.shell-accent}"
    textColor: "{colors.shell-on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-primary-shell-hover:
    backgroundColor: "{colors.shell-accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-secondary-shell:
    backgroundColor: "{colors.shell-panel}"
    textColor: "{colors.shell-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-secondary-shell-hover:
    backgroundColor: "{colors.shell-panel-hover}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.danger-bg}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent-text}"
    typography: "{typography.button}"
    padding: "0 4px"
    height: "48px"
  button-text-shell:
    backgroundColor: "transparent"
    textColor: "{colors.shell-accent}"
    typography: "{typography.button}"
    padding: "0 4px"
    height: "48px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.field}"
    size: "48px"
  button-icon-shell:
    backgroundColor: "transparent"
    textColor: "{colors.shell-muted}"
    rounded: "{rounded.field}"
    size: "48px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "48px"
  input-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  input-error:
    textColor: "{colors.danger}"
    typography: "{typography.label}"
  choice-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
    height: "48px"
  choice-row-selected:
    backgroundColor: "{colors.done}"
  set-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.foreground}"
    typography: "{typography.set-digits}"
    rounded: "{rounded.field}"
    padding: "0 2px"
    height: "48px"
  set-field-done:
    backgroundColor: "transparent"
  set-row:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.field}"
    padding: "0 6px"
    height: "56px"
  set-row-done:
    backgroundColor: "{colors.done}"
  set-previous:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    height: "48px"
  set-check:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.field}"
    size: "48px"
  set-check-done:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  switch:
    backgroundColor: "{colors.field}"
    textColor: "{colors.line-strong}"
    rounded: "16px"
    width: "52px"
    height: "32px"
  switch-checked:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  stepper-value:
    textColor: "{colors.foreground}"
    typography: "{typography.digits}"
    height: "48px"
  segmented:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.panel}"
    padding: "4px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.field}"
    padding: "0 8px"
    height: "48px"
  segmented-option-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.dialog}"
    padding: "0 16px 16px"
    width: "min(100%, 40rem)"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.dialog}"
    padding: "24px"
    width: "min(calc(100% - 2rem), 28rem)"
  toast:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-foreground}"
    rounded: "{rounded.panel}"
    padding: "4px 4px 4px 16px"
    height: "56px"
    width: "min(100%, 32rem)"
  header:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-foreground}"
    typography: "{typography.title-compact}"
    padding: "0 16px"
    height: "64px"
  save-bar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-muted}"
    typography: "{typography.label}"
    padding: "10px 16px"
    height: "68px"
  save-bar-problem:
    textColor: "{colors.shell-warning}"
  tab-bar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-muted}"
    height: "56px"
  tab-bar-active:
    textColor: "{colors.shell-accent}"
  timer:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-foreground}"
    typography: "{typography.timer-digits}"
    padding: "8px 16px 16px"
    height: "100dvh"
    width: "100%"
  timer-level:
    backgroundColor: "{colors.level}"
    width: "100%"
  timer-final:
    textColor: "{colors.shell-accent}"
  timer-go:
    backgroundColor: "{colors.shell-accent}"
    textColor: "{colors.shell-on-accent}"
  timer-plate:
    backgroundColor: "{colors.shell-panel}"
    textColor: "{colors.shell-foreground}"
    typography: "{typography.title}"
    rounded: "{rounded.panel}"
    height: "64px"
  timer-plate-go:
    backgroundColor: "{colors.shell-on-accent}"
    textColor: "{colors.shell-accent}"
  timer-reduced:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-foreground}"
    typography: "{typography.digits}"
    padding: "0 16px"
    height: "56px"
    width: "100%"
  timer-reduced-go:
    backgroundColor: "{colors.shell-accent}"
    textColor: "{colors.shell-on-accent}"
---

# Design System: Workout Tracker

## Overview

**Creative North Star: "Il guscio verde"**

Workout Tracker è uno strumento da sala pesi, non una vetrina. Un guscio verde scuro, lo stesso nei due temi, tiene insieme le parti che il pollice tocca sempre: intestazione, barra di salvataggio, tab bar, avvisi e timer. Dentro il guscio scorre il contenuto (schede, righe serie, campi), che segue il tema scelto: chiaro con fondo verde salvia pallido e pannelli bianchi, oppure scuro nello stesso verde del guscio. L'utente sceglie Sistema, Chiaro o Scuro; il guscio non cambia mai, quindi l'app resta riconoscibile in penombra e al sole.

La densità è quella di un registro operativo: pochi passi tipografici, cifre tabulari ovunque, controlli alti almeno 48px, un solo livello di pannelli, nessuna ombra se non sotto l'avviso sospeso. La profondità si legge per tono (fondo, superficie, campo) e per bordo, mai per elevazione. Il carattere viene da due materiali: il verde (foresta nel contenuto chiaro, lime sul guscio e nel contenuto scuro) e Atkinson Hyperlegible Next, un carattere progettato per distinguere ogni lettera e ogni cifra a colpo d'occhio.

Il gesto distintivo è il timer di recupero: lo schermo intero diventa una clessidra. Un livello verde intermedio con un filo lime in cima riempie lo schermo dal basso e scende a scatti di un secondo, così il tempo che resta si legge con la coda dell'occhio da un metro di distanza. Negli ultimi dieci secondi le cifre diventano lime; alla fine tutto lo schermo diventa lime e dice "Vai". L'anello attorno alle cifre, lo standard della categoria, è stato scartato.

**Key Characteristics:**
- Guscio verde scuro fisso, contenuto chiaro o scuro con scelta Sistema/Chiaro/Scuro.
- Ogni colore del contenuto è una coppia `light-dark()`; dentro il guscio il contenuto risolve sempre al valore scuro.
- Atkinson Hyperlegible Next ospitato in locale, cifre tabulari su tutta la pagina, zero barrato del carattere stesso.
- Piatto e tonale: l'unica ombra è quella dell'avviso.
- Tre raggi (8, 12, 16px) assegnati per ruolo, non per gusto.
- Bersagli da 48px, righe e voci di navigazione da 56px, lastre del timer da 64px.
- Timer a livello che scende a scatti; schermo lime a fine recupero.

## Colors

Una famiglia sola di verdi, dal quasi nero del guscio al salvia pallido del fondo chiaro, con un accento che è foresta sul chiaro e lime sullo scuro, e due colori di stato caldi (pericolo e avviso) usati con parsimonia.

Il meccanismo dei temi: nessun attributo su `<html>` significa "segui il sistema" (`color-scheme: light dark`); `data-theme="light"` o `data-theme="dark"` forza il tema. La preferenza vive nella chiave `workout-tracker.theme` ed è applicata da uno script in linea prima del primo disegno, per evitare il lampo del tema sbagliato. Ogni superficie del guscio dichiara `color-scheme: dark`, quindi un token di contenuto usato dentro il guscio prende il suo valore scuro anche nel tema chiaro.

### Aggiungere un tema

I temi sono un registro, non un elenco cablato: `THEME_REGISTRY` in `src/lib/theme.ts` è l'unica fonte, e da lì leggono lo script in linea di `Base.astro`, il selettore delle Impostazioni e i test. Un tema aggiuntivo (per esempio arancione su nero) è una **palette**: ridefinisce i token, non i componenti.

1. Una voce nel registro: `orange: { label: 'Arancione', scheme: 'dark' }`. `scheme` è `light` o `dark` per un tema con un solo aspetto, `auto` se segue il sistema (allora i valori sono coppie `light-dark()`).
2. Un file `src/styles/themes/orange.css`, importato in testa a `global.css`, con una sola regola `:root[data-theme="orange"] { color-scheme: dark; … }` che sovrascrive **tutti** i token di contenuto e del guscio (`shell-*`, `level`, `backdrop`, `shadow`). Il file resta fuori dai layer, così vince sui valori di `@theme`.
3. Le stesse soglie del sistema verde: testo ≥ 4,5:1 su fondo, superficie, campo e fatto; `line-strong` ≥ 3:1; testo su accento ≥ 4,5:1; cifre del timer leggibili sul guscio e sul livello. Il test del registro (`src/lib/theme.test.ts`) fallisce se un tema non ha la sua regola CSS o il suo `color-scheme`.
4. I colori del tema vanno nel frontmatter di questo file e in `.impeccable/design.json`; `/kit` lo mostra da solo nel selettore.

Il verde resta il tema predefinito. Il guscio di un tema aggiuntivo può avere un colore diverso, ma resta fisso in tutte le schermate di quel tema. Unico valore oggi non sovrascrivibile: la freccia dei `select`, un SVG con il grigio `#788f80`, leggibile su fondi chiari e scuri.

### Primary
- **Verde foresta / Lime** (`accent`): l'azione primaria e la selezione nel contenuto: pulsante primario, segmento scelto, spunta della serie fatta, pallino del radio, selezione del testo. Foresta profondo nel tema chiaro, lime nel tema scuro. Il testo sopra l'accento usa sempre **Inchiostro su accento** (`on-accent`), salvia quasi bianco sul foresta e verde inchiostro sul lime.
- **Accento per testo** (`accent-text`): link, cursore di inserimento, anello di focus nel contenuto, bordo del campo a fuoco, sigla del tipo di serie speciale. Oggi ha gli stessi valori di `accent` in entrambi i temi: resta un token separato perché nasce per il testo su fondo, non per il riempimento.
- **Lime del guscio** (`shell-accent`): l'unico accento sul verde scuro: voce attiva della tab bar, primario sul guscio, link e pulsanti testuali sul guscio, icona "salvato", anello di focus sul guscio, filo superiore del livello, cifre negli ultimi dieci secondi, schermo "Vai". Al passaggio diventa **Lime chiaro** (`shell-accent-hover`).

### Secondary
- **Verde livello** (`level`): solo per il livello del timer (a tutto schermo e nella barra ridotta). Un verde più chiaro del pannello, 2,6:1 sul guscio (step 9: prima 1,65:1, sparito alla luce del sole), così "pieno" si legge anche in palestra; il testo sul livello è `shell-foreground` (5,6:1), mai `shell-muted` (3,6:1).

### Tertiary
- **Rosso mattone / Corallo** (`danger`): azioni distruttive e campi non validi; testo e bordo, mai riempimento pieno. Al passaggio, il pulsante distruttivo prende il **Rosato pericolo** (`danger-bg`).
- **Ambra** (`warning`, `warning-bg`, `warning-line`): avvisi nel contenuto. Sul guscio la barra di salvataggio usa la variante fissa (`shell-warning` per il testo, `shell-warning-icon` per l'icona, `shell-warning-line` per il filo superiore) quando lo spazio è esaurito o il diario è cambiato in un'altra scheda.

### Neutral
- **Salvia pallido / Verde notte** (`background`): il fondo della pagina e la barra di scorrimento.
- **Bianco / Verde pannello** (`surface`): pannelli, fogli, conferme, pulsante secondario.
- **Campo** (`field`): l'interno di campi, campi serie, controllo segmentato e radio; quasi bianco sul chiaro, verde notte sullo scuro.
- **Verde inchiostro / Salvia chiaro** (`foreground`): il testo principale.
- **Grigio salvia** (`muted`): etichette, metadati, segnaposto, colonna "precedente", icone a riposo.
- **Linea** (`line`): separatori e bordi decorativi di fogli e conferme. Non delimita mai un controllo.
- **Linea forte** (`line-strong`): il bordo di ogni controllo (campi, pulsante secondario, spunta, radio, segmentato, righe di scelta) e la maniglia del foglio.
- **Serie fatta** (`done`): il fondo di una riga serie completata e della riga di scelta selezionata.
- **Guscio** (`shell`, `shell-panel`, `shell-panel-hover`, `shell-foreground`, `shell-muted`, `shell-line`, `shell-line-strong`): la versione fissa delle stesse rampe per le superfici verde scuro. È anche il `theme-color` del browser.
- **Fondale** (`backdrop`) e **Ombra** (`shadow`): lo stesso verde quasi nero a due opacità, per il velo dietro fogli e conferme e per l'unica ombra.

### Named Rules
**La regola del guscio fisso.** Intestazione, barra di salvataggio, tab bar, avvisi e timer usano solo i token `shell-*` e `level`, uguali nei due temi. Nel tema chiaro il guscio non diventa chiaro.

**La regola della coppia.** Ogni colore del contenuto è scritto come `light-dark(chiaro, scuro)` in `@theme`. Un colore di contenuto con un solo valore è un errore: rompe uno dei due temi.

**La regola della linea forte.** Il bordo che fa riconoscere un controllo usa `line-strong` (almeno 3:1 sul fondo in entrambi i temi). `line` (circa 1,5:1) è solo per separatori e bordi decorativi.

**La regola del 4,5.** Tutto il testo, compreso il secondario e i segnaposto, supera 4,5:1 sul suo fondo in entrambi i temi; i rapporti misurati sono nel sidecar.

## Typography

**Display Font:** Atkinson Hyperlegible Next (con ui-sans-serif, system-ui, sans-serif)
**Body Font:** Atkinson Hyperlegible Next (stesso stack)

**Character:** un carattere unico, variabile da 200 a 800, ospitato in locale in un file woff2 latino (`public/fonts`), con `font-display: swap` e precaricato. Progettato per la leggibilità a bassa visione: Il1, O0 e rn/m non si confondono, e lo zero barrato appartiene al disegno del carattere stesso, senza feature aggiunte. Le cifre sono tabulari su tutta la radice, così pesi, ripetizioni e tempi restano allineati in colonna e non saltano mentre il timer scende.

### Hierarchy
- **Titolo pagina** (700, 1.75rem, 1.15): titoli di sezione e di schermata nel contenuto.
- **Titolo** (700, 1.25rem, 1.3): titolo di fogli, conferme e stati vuoti; anche il testo delle lastre del timer.
- **Titolo compatto** (700, 1.125rem, 1.25): titolo nell'intestazione del guscio e nome dell'esercizio nel pannello. La riga "Prossima" del timer usa la stessa misura a peso normale.
- **Corpo** (400, 1rem, 1.5): testo corrente e colonna "precedente" (16px: la soglia dei 20px vale per i campi di inserimento). Paragrafi limitati a circa 60ch, con `text-wrap: pretty`; titoli con `text-wrap: balance`.
- **Etichetta** (500, 0.875rem): etichette dei campi, aiuti, errori, stato della barra di salvataggio, intestazioni delle colonne serie. Le voci della tab bar scendono a 0.75rem.
- **Pulsante** (650, 1rem, 1.2): testo di tutti i pulsanti.
- **Cifre** (600, 1.375rem, 1.2, tabulari): numeri in evidenza, tempo nella barra del timer ridotto (lì a 700).
- **Cifre serie** (600, da 1.25rem a 1.375rem, tabulari): peso e ripetizioni nei campi della riga serie. Non scendono mai sotto 20px, nemmeno a 320px di larghezza; il segnaposto (il valore della volta scorsa) è a peso 400.
- **Cifre timer** (650, `min(44cqw, 30cqh, 16rem)`, interlinea 1, -0.02em): il conto alla rovescia, largo circa l'80% dello schermo; con dieci minuti o più ("mm:ss") scende a `min(35cqw, 30cqh, 13rem)`.

### Named Rules
**La regola delle cifre tabulari.** `font-variant-numeric: tabular-nums` è impostato sulla radice e ripetuto sui componenti numerici. Nessuna cifra proporzionale, nessuna feature `zero` aggiunta: lo zero barrato è già del carattere.

**La regola dei 20px.** I campi in cui si scrivono peso e ripetizioni hanno cifre di almeno 20px (fino a 22px); tutto il resto della riga serie può stare a 16px.

**La regola del carattere locale.** Un solo carattere, servito dal sito stesso. Nessun font remoto e nessun carattere di sistema come voce dell'interfaccia.

## Layout

Mobile first, una colonna. Il riferimento è 390×844, il minimo 320×568; su schermi larghi il contenuto si ferma a una colonna centrata di 42rem (672px) con margini laterali di 16px (`gutter`). I fogli arrivano a 40rem, gli avvisi a 32rem, le conferme a 28rem.

La struttura della schermata è fissa: intestazione del guscio in alto (64px, appiccicata, con l'area sicura superiore), contenuto che scorre, e in basso uno stack di barre del guscio nella zona del pollice: tab bar (56px), barra di salvataggio (68px), timer ridotto (56px). La pagina dichiara l'altezza dello stack in `--bottom-bars-height`, e gli avvisi si posano 12px sopra. Le aree sicure del telefono (`env(safe-area-inset-*)`) sono rispettate da intestazione, tab bar, fogli e timer.

Il ritmo usa pochi passi: 4px dentro i controlli composti (segmentato), 8px tra elementi stretti, 12px tra controlli e tra pulsanti affiancati, 16px di margine e di stacco tra gruppi, 24px dentro le conferme, 48px tra le sezioni di una pagina lunga. Il pannello ha un'imbottitura fluida da 12px a 16px; la riga serie uno spazio fluido tra le colonne da 4px a 8px, così le cinque colonne entrano anche a 320px.

### Named Rules
**La regola del pollice.** Le azioni frequenti stanno in basso: navigazione, azione principale della schermata (a destra nella barra di salvataggio), comandi del timer. In alto restano solo il titolo e l'accesso alle Impostazioni.

**La regola dei 48.** Ogni controllo toccabile è alto almeno 48px; righe serie e voci della tab bar 56px; lastre del timer 64px.

## Elevation & Depth

Il sistema è piatto. La profondità viene dal tono: fondo, superficie e campo sono tre gradini della stessa rampa verde, e il guscio scuro incornicia il contenuto senza bisogno di sollevarlo. I pannelli non hanno bordo né ombra e non si annidano mai. Fogli e conferme si staccano con il fondale verde quasi nero al 60% e un bordo decorativo `line`. Il timer a tutto schermo copre la pagina con il colore pieno del guscio.

### Shadow Vocabulary
- **Sospensione dell'avviso** (`box-shadow: 0 8px 24px var(--color-shadow)`): solo sotto l'avviso breve, l'unico elemento che galleggia sopra il contenuto senza velo.

### Named Rules
**La regola dell'unica ombra.** Una sola ombra in tutto il sistema, quella dell'avviso. Pannelli, pulsanti, fogli, barre e timer non ne hanno.

## Shapes

Angoli morbidi ma tesi, in tre misure assegnate per ruolo. **Campo** (8px): tutto ciò che si tocca da solo, cioè pulsanti, campi, spunta, segmenti, righe serie, righe di scelta, maniglia del foglio. **Pannello** (12px): contenitori e controlli composti, cioè pannelli, binario del segmentato, avvisi, lastre del timer, anteprima del timer ridotto. **Finestra** (16px): ciò che si apre sopra la pagina, cioè conferme e anteprima del timer; il foglio dal basso arrotonda solo i due angoli superiori.

I bordi sono sottili (1px), salvo spunta e radio a 1.5px; il livello del timer ha un filo superiore lime di 4px (3px nella barra ridotta). Il radio e il suo pallino sono gli unici cerchi; non ci sono forme decorative.

## Components

### Buttons
Diretti e pieni di peso, con il verbo dell'azione nel testo.
- **Shape:** angoli da campo (8px), altezza minima 48px, imbottitura orizzontale 20px, icona da 20px con 8px di stacco.
- **Primary:** riempimento `accent`, testo `on-accent`, peso 650. Sul guscio diventa lime con inchiostro verde.
- **Hover / Focus:** al passaggio il primario si mescola al 14% verso il colore del testo (più scuro sul chiaro, più chiaro sullo scuro); il secondario prende un velo di accento al 10%. Transizione di colore di 0.15s con la curva di uscita. Il focus da tastiera è un anello pieno di 3px a 3px di distanza, in `accent-text` nel contenuto e lime sul guscio.
- **Secondary:** fondo `surface`, bordo `line-strong`, testo `foreground`; sul guscio fondo `shell-panel` con bordo `shell-line-strong`.
- **Danger:** trasparente, testo e bordo in `danger`; al passaggio fondo `danger-bg`.
- **Text:** trasparente, testo `accent-text` (lime sul guscio), imbottitura 4px, sottolineato al passaggio.
- **Icon:** quadrato da 48px trasparente, icona `muted` da 22px; al passaggio un velo del colore corrente al 12%.
- **Disabled:** opacità 0.45 e cursore di divieto.

### Inputs / Fields
- **Style:** fondo `field`, bordo 1px `line-strong`, angoli da 8px, altezza 48px, imbottitura 10px × 12px, corpo a 16px. L'etichetta sta sopra (etichetta, `muted`, 6px di stacco); aiuto ed errore sotto, a 14px. I menu a tendina hanno una freccia propria a destra.
- **Focus:** il bordo passa a `accent-text` e l'anello di 3px si stringe a 1px di distanza.
- **Error:** bordo `danger` con `aria-invalid`, messaggio in `danger` che dice come correggere.
- **Righe di scelta:** riga intera toccabile da 48px con bordo `line-strong` e radio del tema da 22px; selezionata, bordo `accent-text` e fondo `done`.
- **Controllo segmentato:** binario `field` con bordo `line-strong`, angoli da 12px e 4px di imbottitura; segmenti da 48px, testo `muted` peso 600; il segmento scelto è pieno di `accent` con testo `on-accent`. Per poche opzioni sempre visibili (tema, unità). Sta direttamente sul fondo, mai dentro un pannello: il binario è già un contenitore.
- **Interruttore:** per le preferenze sì/no (suono, vibrazione). Riga intera toccabile da 48px con etichetta (peso 600) ed eventuale spiegazione `muted` a 14px a sinistra; a destra un binario da 52×32px con bordo 1.5px `line-strong` su `field` e un pomello `line-strong` da 23px. Acceso: binario e bordo `accent`, pomello `on-accent` spostato a destra (0.2s, curva di uscita). Disattivato: opacità 0.45, con la spiegazione del perché nella riga. È una checkbox nativa con `role="switch"`.
- **Valore a passi:** per valori che si regolano a passi fissi e che il tastierino numerico non sa scrivere (il recupero "1:30" ha i due punti). Etichetta sopra, poi tre colonne: pulsante secondario "−15 s", il valore in cifre (600, 1.375rem) centrato, pulsante secondario "+15 s". Ai limiti il pulsante si disattiva. Il valore è annunciato con cortesia, a parole per gli screen reader ("1 minuto e 30 secondi").

- **Campo che salva a ogni battuta** (`LiveField`): lo stesso campo, per i testi delle schede (nome, ripetizioni, carico, note). Salva a ogni carattere; finché ha il focus il testo resta com'è, poi torna al valore salvato. Un testo non valido resta visibile con l'errore sotto e non si salva.

### Voce della scheda
L'editor delle schede si legge come la scheda di carta. Ogni voce è una riga da almeno 56px senza pannello, separata da un filo `line`: a sinistra il numero d'ordine (1, 2a, 2b) a 18px in `accent-text`, poi il nome dell'esercizio (650, 18px) e sotto i target compatti in `muted` a 14px ("3 × 6–8 · 40 kg · rec. 1:15", poi unità, nota e alternative), a destra la freccia da 48px che apre la voce. Aperta, i campi stanno in linea sotto il nome, allineati al nome (a filo sotto i 360px): esercizio con "Cambia", serie e recuperi come valori a passi, ripetizioni e carico come campi, alternative come elenco con la crocetta da 48px, interruttore della superserie, "Togli dalla scheda" in pericolo.
- **Superserie:** una riga "Superserie · 2 esercizi" in `accent-text` con l'icona del collegamento, e un filo `line-strong` di 1px nella colonna dei numeri che unisce ogni voce alla successiva.
- **Riordino:** modalità "Riordina"/"Fine" (pulsante testuale): le righe si chiudono e mostrano due frecce da 48px. Nessun trascinamento come unico modo.

### Foglio del catalogo
Foglio dal basso per scegliere un esercizio: campo di ricerca con l'icona a sinistra, fisso in testa mentre l'elenco scorre; risultati come righe da 48px separate da `line`, con "personalizzato" in `muted`; in fondo "Crea «…»" in `accent-text` con l'icona più, quando il nome scritto non c'è.

### Giorni del calendario
Lo stato di un giorno ha sempre un'icona Lucide più un testo (nell'etichetta accessibile quando lo spazio non basta), mai il solo colore: **Fatto** (`circle-check`, `accent-text`), **In corso** (`circle-play`, `accent-text`), **Saltato** (`circle-x`, `warning`), **In programma** (`circle-dashed`, `muted`; oggi "Da fare"), **Riposo** (`moon`, `muted`, solo nella striscia: nelle righe lo dice il titolo). Oggi ha il bordo `accent-text` e il fondo `surface`.
- **Striscia della settimana** (Oggi): sette colonne alte 76px, giorno abbreviato a 12px `muted`, numero a 18px, icona da 18px; ogni giorno è un link al suo foglio nel Calendario.
- **Riga del giorno** (Calendario): pulsante a tutta larghezza alto almeno 64px, separato da un filo `line`; a sinistra giorno e numero (20px), al centro la scheda (o ciò che si è fatto) in grassetto con una nota `muted` a 14px ("solo per questa data", "in programma: Scheda B"), a destra icona e stato a 14px. Riposo e "Niente in programma" a peso normale `muted`.
- **Mese compatto:** tabella di sette colonne con celle alte 56px, numero (650) e icona da 16px sotto; i giorni degli altri mesi restano vuoti; legenda sotto la tabella. Il riposo non ha segno.
- **Settimana tipo:** una riga per giorno con il nome a sinistra e un `select` nativo (Niente, Riposo, le schede attive) a destra; l'avviso di una scheda archiviata ancora assegnata è in `warning` sotto la riga.

### Righe della scheda in Oggi
Le righe di scelta (`.choice`) alte 64px con il radio, il nome della scheda a 18px e sotto esercizi e ultima volta a 14px `muted`; la pianificata ha a destra "Oggi" con l'icona del calendario in `accent-text`. "Inizia allenamento" (primario alto 56px a 18px) è appiccicato sopra la tab bar con il fondo della pagina, così resta nella zona del pollice anche a 320×568.

### Riga serie
L'unità di lavoro dell'allenamento: cinque colonne in griglia, tipo/numero · precedente · kg · rip · spunta, alta 56px.
- **Tipo/numero:** pulsante da 48px, peso 650 a 18px; il numero è `muted`, le sigle dei tipi speciali (R, D, C) sono `accent-text`. Nell'allenamento un tocco apre il foglio della serie (tipo: Normale, Riscaldamento, Drop, Cedimento, con la sigla e la spunta sulla scelta attuale; poi "Togli serie" in `danger`, spento se resta una serie sola).
- **Precedente:** "40 × 8" in corpo `muted`, allineato a sinistra e troncato; un tocco copia i valori nei campi. Senza precedente, un trattino.
- **Campi kg e rip:** campi serie da 48px, cifre serie centrate, tastiera numerica (decimale per il peso), il valore precedente come segnaposto.
- **Spunta:** quadrato da 48px con bordo 1.5px `line-strong` e icona `muted`. Su una riga vuota conferma il precedente in un solo tocco; senza precedente porta al primo campo vuoto. Fatta, la spunta si riempie di `accent` con icona `on-accent` più spessa, la riga prende il fondo `done` e i campi perdono bordo e fondo.

### Allenamento attivo
La schermata dove si passa più tempo: una colonna di pannelli, uno per blocco (un esercizio, o una superserie intera con la riga "Superserie · 2 esercizi" in `accent-text` e un filo `line` tra 2a e 2b). Niente pannelli annidati: le righe serie stanno direttamente nel pannello.
- **Testa dell'esercizio:** numero d'ordine (1, 2a) a 18px in `accent-text`, nome (700, 18px) come pulsante che apre l'approfondimento con l'icona `info` `muted`, a destra "⋯" da 48px (nota sul carico, come si esegue, cambia esercizio, togli). Sotto, in `muted` a 14px, i target della scheda ("3 × 6–8 · 40 kg per manubrio · rec. 1:00"), "Al posto di …" con una variante, "Nota del 6 ottobre: «…»" con la nota della volta scorsa; poi "Cambia esercizio" (testuale, icona `arrow-left-right`).
- **Adesso:** l'esercizio della serie da fare ha il numero in una pastiglia piena `accent` con testo `on-accent` (raggio da campo). In superserie la pastiglia passa da 2a a 2b a ogni spunta.
- **Fatto:** con tutte le serie spuntate l'esercizio si compatta in una riga (`circle-check` in `accent-text` e le serie fatte, "42,5 × 8 · 40 × 8") con "Mostra serie"; l'ultimo esercizio toccato resta aperto, per correggere l'ultima serie.
- **Sotto le righe:** "Aggiungi serie" (testuale), poi il campo "Nota sul carico" quando c'è una nota. Una serie qualsiasi si toglie dal suo foglio (tocco sul numero), con "Annulla" se aveva valori.
- **Record:** una serie spuntata che batte il carico massimo ha l'icona `trophy` da 16px in `accent-text` nella colonna "precedente".
- **Barra dell'allenamento:** la barra di salvataggio, sempre visibile sopra la tab bar: a sinistra la durata (700, 18px, `shell-foreground`) e sotto lo stato breve ("Salvato"), a destra "Termina" (primario lime).
- **Riepilogo:** icona `circle-check`, titolo pagina "Allenamento concluso", poi righe termine/valore separate da `line` (Durata, Esercizi, Serie, Volume; valori in cifre 600 a 1.375rem allineati a destra), "Record battuto" con `trophy`, "Cosa hai fatto" per esercizio, l'eventuale invito all'installazione in un pannello, "Fatto" (primario) e "Riapri allenamento" (secondario). Nessuna tessera di statistiche.

### Cards / Containers
- **Corner Style:** pannello (12px).
- **Background:** `surface`.
- **Shadow Strategy:** nessuna (vedi Elevation & Depth).
- **Border:** nessuno.
- **Internal Padding:** fluida da 12px a 16px. Un solo livello: un pannello non contiene altri pannelli.

### Navigation
- **Intestazione:** guscio appiccicato in alto, alta 64px, filo inferiore `shell-line`; titolo compatto troncato su una riga, riga di stato in `shell-muted` a 14px, a destra azioni facoltative e l'icona delle Impostazioni da 48px.
- **Mini-barra dell'allenamento:** sulle altre pagine (non sull'allenamento; su Oggi solo con un recupero in corso), sopra la tab bar: guscio alto 56px con filo `shell-line`, icona `circle-play` lime, nome della sessione (650) e "da 25 min · esercizio" in `shell-muted`, "Riprendi" lime con la freccia. Tutta la barra è un link all'allenamento; resta ferma tra le pagine (`transition:persist`). Con un recupero in corso diventa il timer ridotto, con a destra una freccia da 56px (separata da un filo `shell-line`) che torna all'allenamento.
- **Tab bar:** guscio in basso con filo superiore `shell-line`, quattro voci uguali (Oggi, Calendario, Schede, Storico) alte 56px, icona da 22px sopra l'etichetta a 12px. A riposo `shell-muted`, al passaggio `shell-foreground`; la voce attiva è lime e in grassetto, con `aria-current="page"`.

### Barra di salvataggio
Guscio in basso, alta 68px, filo superiore `shell-line`. A sinistra lo stato, annunciato con cortesia: "Salvato su questo dispositivo" con spunta lime, "Salvataggio…" con icona che gira; a destra l'azione principale della schermata. In errore (spazio esaurito) o conflitto (diario cambiato in un'altra scheda) testo e filo passano all'ambra del guscio e l'azione diventa "Salva ora" o "Ricarica".

### Fogli, conferme e avvisi
- **Foglio:** sale dal basso su un `<dialog>` nativo (0.32s, curva di uscita), largo fino a 40rem e alto fino all'85% dello schermo, maniglia da 40×4px, titolo e chiusura da 48px in testa, piede facoltativo con le azioni. Per scelte e consultazioni (variante, catalogo, approfondimento), non per inserire dati.
- **Conferma:** finestra centrata fino a 28rem, imbottitura 24px, titolo, testo `muted`, due pulsanti affiancati a tutta larghezza: "Annulla" secondario e il verbo distruttivo in pericolo. Solo per azioni distruttive; Esc annulla.
- **Avviso breve:** pillola del guscio alta 56px con l'unica ombra, entra dal basso in 0.24s sopra lo stack delle barre, si chiude da solo dopo 5 secondi, con azione testuale lime facoltativa ("Annulla") e chiusura da 48px.

### Stato vuoto
Allineato a sinistra: icona `muted` da 28px, titolo, una frase che dice cosa comparirà e come farlo comparire, al massimo un'azione primaria.

### Timer di recupero (componente distintivo)
Lo schermo è la clessidra.
- **Schermo intero:** finestra modale a tutta altezza sul colore del guscio. Dietro a tutto, il livello `level` con filo superiore lime di 6px parte dal 100% dell'altezza (sotto l'intestazione) e scende a scatti di un secondo, senza animazione continua, fino al bordo superiore delle lastre: vuoto, il filo sta sopra i comandi, che restano sempre sul livello, e negli ultimi secondi non sparisce dietro di loro. In testa "Recupero · 2:00" in `shell-muted` e l'icona Riduci da 48px; al centro le cifre timer in `shell-foreground` e sotto "Prossima" (etichetta a 14px in `shell-foreground`) con esercizio, serie, peso × ripetizioni; in basso, nella zona del pollice, tre lastre da 64px (−15 s, +15 s, Salta) con 10px di stacco, e "Riduci" come pulsante testuale sotto. Esc riduce invece di chiudere.
- **Ultimi 10 secondi:** le cifre diventano lime.
- **Vai:** tutto lo schermo diventa lime, testo e icone in `shell-on-accent`, le cifre lasciano il posto alla parola "Vai", "Prossima" diventa "Adesso" e le lastre si fondono in un unico "Chiudi" verde inchiostro con testo lime. Si chiude da solo dopo 6 secondi.
- **Ridotto:** barra del guscio alta 56px, sull'allenamento sopra la barra dell'allenamento, sulle altre pagine al posto della mini-barra; il livello qui si accorcia da destra verso sinistra (filo superiore lime di 3px), con icona timer, tempo in cifre e la prossima serie troncata in `shell-muted`. Un tocco riapre lo schermo intero; a fine recupero la barra diventa lime con "Vai".
- **Riscaldamento e rientro:** l'intestazione dice "Recupero di riscaldamento · 1:00" per una serie di riscaldamento; al rientro dopo lo schermo bloccato, a recupero già finito, dice "Recupero finito da 1:20". Tempo e "40 kg × 8" sono legati da spazi unificatori, così vanno a capo interi.
- **Annunci:** solo a 30 s, 10 s e alla fine (anche con il timer ridotto); con `prefers-reduced-motion` nessuna transizione.
- **Avvisi:** alla fine tre toni brevi generati in locale (`AudioContext`, 880 Hz e 1320 Hz) e una vibrazione, secondo le Impostazioni, una volta sola; oltre un minuto di ritardo (schermo bloccato) non suonano. Schermo acceso (wake lock) per tutto l'allenamento.

## Do's and Don'ts

### Do:
- **Do** usare solo i token del sistema (`surface`, `muted`, `line-strong`, …) e scrivere ogni nuovo colore di contenuto come coppia `light-dark()` in `@theme`.
- **Do** mettere la classe del guscio su ogni superficie verde scuro fissa (intestazione, barre in basso, avvisi, timer), così il contenuto al suo interno risolve al valore scuro e il focus diventa lime.
- **Do** dare il bordo `line-strong` a ogni controllo e riservare `line` ai separatori.
- **Do** tenere ogni controllo toccabile ad almeno 48px, le righe serie e le voci della tab bar a 56px, le lastre del timer a 64px.
- **Do** lasciare le cifre tabulari e tenere peso e ripetizioni da inserire ad almeno 20px.
- **Do** usare l'anello di focus di 3px a 3px di distanza (1px su campi e riga serie), in `accent-text` nel contenuto e lime sul guscio.
- **Do** usare la curva di uscita `cubic-bezier(0.16, 1, 0.3, 1)` per le transizioni di stato e rispettare `prefers-reduced-motion`.
- **Do** far avanzare il livello del timer a scatti di un secondo.

### Don't:
- **Don't** usare la palette predefinita di Tailwind (`gray-*`, `blue-*`, `green-*`, `red-*`). La grafica vecchia che la usava è stata rimossa allo step 3.
- **Don't** schiarire il guscio nel tema chiaro né usare token di contenuto per intestazione, barre, avvisi o timer.
- **Don't** aggiungere ombre: l'unica è quella dell'avviso.
- **Don't** annidare pannelli dentro pannelli.
- **Don't** disegnare un anello di avanzamento attorno alle cifre del timer né animare il livello in modo continuo.
- **Don't** caricare font remoti, usare il carattere di sistema come voce dell'interfaccia o aggiungere la feature `zero`.
- **Don't** usare `line` come unico bordo di un controllo: è sotto 3:1.
- **Don't** aprire una finestra modale per inserire dati: il foglio serve per scegliere e consultare, la conferma solo per le azioni distruttive.
