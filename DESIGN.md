---
name: Workout Tracker
description: Diario di allenamento privato e offline, inchiostro e carta con un solo accento vermiglio, in tema chiaro o scuro.
colors:
  bg: "light-dark(#FAFAF7, #1C1C1E)"
  surface: "light-dark(#FFFFFF, #2A2A2D)"
  text: "light-dark(#111111, #FAFAF7)"
  text-muted: "light-dark(#6B6B70, #A1A1AA)"
  border: "light-dark(#E4E4E7, #3F3F46)"
  border-control: "light-dark(#6B6B70, #A1A1AA)"
  accent: "light-dark(#E85A2A, #FF7A45)"
  on-accent: "light-dark(#111111, #111111)"
  accent-pressed: "light-dark(#F97316, #FF7A1A)"
  accent-text: "light-dark(#B8401F, #FF7A45)"
  accent-indicator: "light-dark(#E85A2A, #FF7A45)"
  accent-tint: "light-dark(color-mix(in srgb, #B8401F 8%, #FFFFFF), color-mix(in srgb, #FF7A45 10%, #2A2A2D))"
  done: "light-dark(#111111, #FAFAF7)"
  on-done: "light-dark(#FAFAF7, #111111)"
  danger: "light-dark(#BE123C, #FF7A8A)"
  danger-fill: "light-dark(#C81E1E, #DF3124)"
  on-danger: "light-dark(#FFFFFF, #FFFFFF)"
  highlight: "light-dark(#165E83, #8AB4E8)"
  backdrop: "rgb(0 0 0 / 0.6)"
  shadow: "rgb(0 0 0 / 0.28)"
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
  button-primary-hover:
    backgroundColor: "{colors.accent-pressed}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.danger-fill}"
    textColor: "{colors.on-danger}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "color-mix(in oklab, {colors.danger-fill} 88%, black)"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent-text}"
    typography: "{typography.button}"
    padding: "0 4px"
    height: "48px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.field}"
    size: "48px"
  input:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "10px 12px"
    height: "48px"
  input-label:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
  input-error:
    textColor: "{colors.danger}"
    typography: "{typography.label}"
  choice-row:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "8px 12px"
    height: "48px"
  choice-row-selected:
    textColor: "{colors.text}"
  set-field:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.set-digits}"
    rounded: "{rounded.field}"
    padding: "0 2px"
    height: "48px"
  set-field-done:
    backgroundColor: "transparent"
  set-row:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "0 6px"
    height: "56px"
  set-row-done:
    backgroundColor: "transparent"
  set-previous:
    textColor: "{colors.text-muted}"
    typography: "{typography.body}"
    height: "48px"
  set-check:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.field}"
    size: "48px"
  set-check-done:
    backgroundColor: "{colors.done}"
    textColor: "{colors.on-done}"
  switch:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.border-control}"
    rounded: "16px"
    width: "52px"
    height: "32px"
  switch-checked:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  stepper-value:
    textColor: "{colors.text}"
    typography: "{typography.digits}"
    height: "48px"
  segmented:
    backgroundColor: "{colors.bg}"
    rounded: "{rounded.panel}"
    padding: "4px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.field}"
    padding: "0 8px"
    height: "48px"
  segmented-option-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "0 16px 16px"
    width: "min(100%, 40rem)"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.dialog}"
    padding: "24px"
    width: "min(calc(100% - 2rem), 28rem)"
  toast:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "4px 4px 4px 16px"
    height: "56px"
    width: "min(100%, 32rem)"
  header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.title-compact}"
    padding: "0 16px"
    height: "64px"
  save-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    padding: "10px 16px"
    height: "68px"
  save-bar-problem:
    textColor: "{colors.danger}"
  tab-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-muted}"
    height: "56px"
  tab-bar-active:
    textColor: "{colors.text}"
  timer:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.timer-digits}"
    padding: "8px 16px 16px"
    height: "100dvh"
    width: "100%"
  timer-level:
    backgroundColor: "{colors.accent-tint}"
    width: "100%"
  timer-final:
    textColor: "{colors.accent-text}"
  timer-go:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  timer-plate:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    rounded: "{rounded.panel}"
    height: "64px"
  timer-plate-go:
    backgroundColor: "{colors.on-accent}"
    textColor: "{colors.accent}"
  timer-reduced:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.digits}"
    padding: "0 16px"
    height: "56px"
    width: "100%"
  timer-reduced-go:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
---

# Design System: Workout Tracker

## Overview

**Creative North Star: "Inchiostro e carta"**

Workout Tracker è uno strumento da sala pesi, non una vetrina. L'interfaccia è inchiostro su carta: fondo quasi bianco o grafite, testo nero o bianco, bordi grigi chiari, e un solo accento vermiglio per ciò che chiede un'azione o è in corso. Intestazione, barra di salvataggio, tab bar, avvisi e timer (il guscio) seguono il tema come il contenuto, su `surface` come le card (ADR-005). L'utente sceglie Sistema, Chiaro o Scuro.

La densità è quella di un registro operativo: pochi passi tipografici, cifre tabulari ovunque, controlli alti almeno 48px, un solo livello di pannelli, nessuna ombra se non sotto l'avviso sospeso. La profondità si legge per tono (fondo e superficie) e per bordo, mai per elevazione. Il carattere viene da due materiali: il vermiglio, usato con parsimonia, e Atkinson Hyperlegible Next, un carattere progettato per distinguere ogni lettera e ogni cifra a colpo d'occhio.

Il gesto distintivo è il timer di recupero: lo schermo intero diventa una clessidra. Un livello velato di vermiglio con un filo pieno in cima riempie lo schermo dal basso e scende a scatti di un secondo, così il tempo che resta si legge con la coda dell'occhio da un metro di distanza. Negli ultimi dieci secondi le cifre passano all'accento; alla fine tutto lo schermo diventa vermiglio e dice "Vai". L'anello attorno alle cifre, lo standard della categoria, è stato scartato.

**Key Characteristics:**
- Inchiostro e carta in chiaro e scuro, un solo accento vermiglio; scelta Sistema/Chiaro/Scuro, guscio compreso.
- Ogni colore è una coppia `light-dark()` in `@theme`, l'unico punto con i valori.
- Rosso solo per errori e azioni distruttive, indaco solo per i record; nessun verde.
- Atkinson Hyperlegible Next ospitato in locale, cifre tabulari su tutta la pagina, zero barrato del carattere stesso.
- Piatto e tonale: l'unica ombra è quella dell'avviso.
- Tre raggi (8, 12, 16px) assegnati per ruolo, non per gusto.
- Bersagli da 48px, righe e voci di navigazione da 56px, lastre del timer da 64px.
- Timer a livello che scende a scatti; schermo vermiglio a fine recupero.

## Colors

Neutri senza tinta, dal quasi bianco carta al grafite, con un accento vermiglio (più profondo nel chiaro, più acceso nello scuro), un rosso lampone per gli errori e un indaco per i record. I valori sono nel front-matter e, normativi, nel blocco `@theme` di `src/styles/global.css`; `src/styles/contrast.test.ts` controlla ogni coppia usata.

Il meccanismo dei temi: nessun attributo su `<html>` significa "segui il sistema" (`color-scheme: light dark`); `data-theme="light"` o `data-theme="dark"` forza il tema. La preferenza vive nella chiave `workout-tracker.theme` ed è applicata da uno script in linea prima del primo disegno, per evitare il lampo del tema sbagliato. Il `theme-color` del browser sono due meta con `media`, con il `bg` di ciascun tema (`THEME_COLORS` in `src/lib/theme.ts`, una copia verificata dal test), riallineati dallo script quando il tema è forzato; il manifest usa `#1C1C1E`. La barra di stato di iOS è `default` nel chiaro e `black-translucent` nello scuro.

### Aggiungere un tema

I temi sono un registro, non un elenco cablato: `THEME_REGISTRY` in `src/lib/theme.ts` è l'unica fonte, e da lì leggono lo script in linea di `Base.astro`, il selettore delle Impostazioni e i test. Un tema aggiuntivo (per esempio arancione su nero) è una **palette**: ridefinisce i token, non i componenti.

1. Una voce nel registro: `orange: { label: 'Arancione', scheme: 'dark' }`. `scheme` è `light` o `dark` per un tema con un solo aspetto, `auto` se segue il sistema (allora i valori sono coppie `light-dark()`).
2. Un file `orange.css` in `styles/themes/` (cartella nuova sotto `src/`), importato in testa a `global.css`, con una sola regola `:root[data-theme="orange"] { color-scheme: dark; … }` che sovrascrive **tutti** i ruoli (compresi `backdrop` e `shadow`). Il file resta fuori dai layer, così vince sui valori di `@theme`.
3. Le stesse soglie del sistema, quelle di `src/styles/contrast.test.ts`: testo ≥ 4,5:1 su fondo, superficie e `accent-tint`; testo su accento, su `danger-fill` e su `done` ≥ 4,5:1; bordi dei controlli, indicatori e `danger-fill` ≥ 3:1. Il test del registro (`src/lib/theme.test.ts`) fallisce se un tema non ha la sua regola CSS o il suo `color-scheme`.
4. I colori del tema vanno nel frontmatter di questo file e in `.impeccable/design.json`; `/kit` lo mostra da solo nel selettore.

### Primary
- **Vermiglio** (`accent`): l'azione primaria e la selezione: pulsante primario, segmento scelto, interruttore acceso, pallino del radio, schermo "Vai". Il testo sopra è sempre **Inchiostro su accento** (`on-accent`), nero nei due temi: il bianco sull'arancione non arriva a 3:1. Premuto o al passaggio diventa `accent-pressed`, più chiaro nel tema chiaro (scurendolo, il nero sopra scende sotto 4,5:1).
- **Accento per testo** (`accent-text`): link, pulsanti testuali, cursore di inserimento, cifre degli ultimi dieci secondi, avviso delle serie vuote, stati "In corso" del calendario. Più scuro di `accent` nel chiaro, perché nasce per il testo su fondo.
- **Indicatore** (`accent-indicator`): solo bordi e barre, mai fondo di testo: anello di focus, bordo del campo a fuoco, filo del livello del timer, linea dei grafici, bordo dell'esercizio corrente e di oggi nel calendario, bordo delle serie vuote segnalate.
- **Velo d'accento** (`accent-tint`): il fondo dell'esercizio corrente, il livello del timer e la selezione del testo (con `text` sopra).

### Secondary
- **Indaco** (`highlight`): solo trofei e record (`.record` nella riga serie) e la seconda serie quando un grafico confronta due esercizi (oggi nessun grafico lo fa). Mai pulsanti, link o stati.

### Tertiary
- **Rosso lampone** (`danger`): solo errori e azioni distruttive, sempre con icona e testo, così si distingue dall'accento anche per chi confonde arancione e rosso. Il pulsante distruttivo è pieno su un rosso a sé, `danger-fill` (#C81E1E in chiaro, #DF3124 in scuro), con testo `on-danger` bianco nei due temi, e al passaggio si scurisce: `danger` in scuro è chiaro, pensato per il testo, e come fondo diventava rosa (INC-011, ADR-006). Le distruttive passano dalla conferma. Campi non validi, errori di campo e barra di salvataggio in errore usano `danger` come testo e bordo.
- **Avvisi informativi** (ex ambra): `text-muted` con l'icona `info` in un riquadro `border`. Non c'è un colore di avviso.

### Neutral
- **Carta / Grafite** (`bg`): il fondo della pagina, l'interno di campi, campi serie, controllo segmentato, radio e interruttore, e lo schermo del timer.
- **Bianco / Grafite chiaro** (`surface`): pannelli, fogli, conferme, guscio (intestazione, barre, tab bar, avviso breve), pulsante secondario e pulsanti disabilitati.
- **Inchiostro** (`text`): il testo principale, la tab attiva con il suo indicatore, il bordo della riga di scelta selezionata.
- **Grigio** (`text-muted`): etichette, metadati, segnaposto, colonna "precedente", icone a riposo, tab inattive, testo disabilitato.
- **Bordo** (`border`): separatori, bordi decorativi di fogli e conferme, griglia dei grafici. Non delimita mai un controllo.
- **Bordo dei controlli** (`border-control`): il bordo di ogni controllo (campi, pulsante secondario, spunta, radio, segmentato, righe di scelta, lastre del timer) e la maniglia del foglio.
- **Fatto** (`done`, `on-done`): la spunta piena di una serie completata, inchiostro con il segno in negativo. La riga fatta non ha fondo.
- **Fondale** (`backdrop`) e **Ombra** (`shadow`): nero neutro a due opacità, uguali nei due temi, per il velo dietro fogli e conferme e per l'unica ombra.

### Named Rules
**La regola dell'accento unico.** L'accento è solo per ciò che chiede azione o è in corso, mai decorazione né stati conclusi. Un solo `btn-primary` visibile per schermata; le azioni secondarie sono neutre (`border-control` e `text`).

**La regola del rosso.** `danger` vale solo per errori e azioni distruttive, sempre con icona e testo. Nessun verde, nemmeno per i successi.

**La regola della coppia.** Ogni colore è scritto come `light-dark(chiaro, scuro)` in `@theme`. Un colore con un solo valore è un errore: rompe uno dei due temi (fanno eccezione `backdrop` e `shadow`, uguali per scelta).

**La regola del bordo dei controlli.** Il bordo che fa riconoscere un controllo usa `border-control` (almeno 3:1 sul fondo in entrambi i temi). `border` è solo per separatori e bordi decorativi.

**La regola del 4,5.** Tutto il testo, compreso il secondario e i segnaposto, supera 4,5:1 sul suo fondo in entrambi i temi; lo controlla `src/styles/contrast.test.ts`.

**Il disabilitato.** `text-muted` su `surface` con bordo `border`, mai l'accento sbiadito.

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

Il sistema è piatto. La profondità viene dal tono: fondo e superficie sono due gradini della stessa rampa neutra, e il guscio sta su `surface` come le card, staccato dal contenuto da un filo `border`. I pannelli non hanno bordo né ombra e non si annidano mai. Fogli e conferme si staccano con il fondale nero al 60% e un bordo decorativo `border`. Il timer a tutto schermo copre la pagina con `bg`.

### Shadow Vocabulary
- **Sospensione dell'avviso** (`box-shadow: 0 8px 24px var(--color-shadow)`): solo sotto l'avviso breve, l'unico elemento che galleggia sopra il contenuto senza velo.

### Named Rules
**La regola dell'unica ombra.** Una sola ombra in tutto il sistema, quella dell'avviso. Pannelli, pulsanti, fogli, barre e timer non ne hanno.

## Shapes

Angoli morbidi ma tesi, in tre misure assegnate per ruolo. **Campo** (8px): tutto ciò che si tocca da solo, cioè pulsanti, campi, spunta, segmenti, righe serie, righe di scelta, maniglia del foglio. **Pannello** (12px): contenitori e controlli composti, cioè pannelli, binario del segmentato, avvisi, lastre del timer, anteprima del timer ridotto. **Finestra** (16px): ciò che si apre sopra la pagina, cioè conferme e anteprima del timer; il foglio dal basso arrotonda solo i due angoli superiori.

I bordi sono sottili (1px), salvo spunta e radio a 1.5px; il livello del timer ha un filo superiore `accent-indicator` di 6px (3px nella barra ridotta). Il radio e il suo pallino sono gli unici cerchi; non ci sono forme decorative.

## Components

### Buttons
Diretti e pieni di peso, con il verbo dell'azione nel testo.
- **Shape:** angoli da campo (8px), altezza minima 48px, imbottitura orizzontale 20px, icona da 20px con 8px di stacco.
- **Primary:** riempimento `accent`, testo `on-accent`, peso 650. Uno solo visibile per schermata.
- **Hover / Focus:** al passaggio il primario passa a `accent-pressed`; il secondario prende un velo neutro di `text` all'8% sulla superficie, senza colore. Transizione di colore di 0.15s con la curva di uscita. Il focus da tastiera è un anello pieno di 2px `accent-indicator` a 3px di distanza, ovunque.
- **Secondary:** fondo `surface`, bordo `border-control`, testo `text`. Tutte le azioni secondarie sono neutre.
- **Danger:** pieno, fondo `danger-fill` e testo `on-danger`, sempre con l'icona `trash` e il verbo; al passaggio il rosso si mescola al 12% di nero. Solo per azioni distruttive, che passano dalla conferma.
- **Text:** trasparente, testo `accent-text`, imbottitura 4px, sottolineato al passaggio.
- **Icon:** quadrato da 48px trasparente, icona `text-muted` da 22px; al passaggio un velo del colore corrente al 12%.
- **Disabled:** testo `text-muted` su `surface` con bordo `border` e cursore di divieto, mai l'accento sbiadito.

### Inputs / Fields
- **Style:** fondo `bg`, bordo 1px `border-control`, angoli da 8px, altezza 48px, imbottitura 10px × 12px, corpo a 16px. L'etichetta sta sopra (etichetta, `text-muted`, 6px di stacco); aiuto ed errore sotto, a 14px. I menu a tendina hanno una freccia propria a destra.
- **Focus:** il bordo passa a `accent-indicator` e l'anello di 2px si stringe a 1px di distanza.
- **Error:** bordo `danger` con `aria-invalid`, messaggio in `danger` che dice come correggere.
- **Righe di scelta:** riga intera toccabile da 48px con bordo `border-control` e radio del tema da 22px; selezionata, bordo `text` raddoppiato da un filo interno di 1px, senza fondo.
- **Controllo segmentato:** binario `bg` con bordo `border-control`, angoli da 12px e 4px di imbottitura; segmenti da 48px, testo `text-muted` peso 600; il segmento scelto è pieno di `accent` con testo `on-accent`. Per poche opzioni sempre visibili (tema, unità). Sta direttamente sul fondo, mai dentro un pannello: il binario è già un contenitore.
- **Interruttore:** per le preferenze sì/no (suono, vibrazione). Riga intera toccabile da 48px con etichetta (peso 600) ed eventuale spiegazione `text-muted` a 14px a sinistra; a destra un binario da 52×32px con bordo 1.5px `border-control` su `bg` e un pomello `border-control` da 23px. Acceso: binario e bordo `accent`, pomello `on-accent` spostato a destra (0.2s, curva di uscita). Disattivato: opacità 0.45, con la spiegazione del perché nella riga. È una checkbox nativa con `role="switch"`.
- **Valore a passi:** per valori che si regolano a passi fissi e che il tastierino numerico non sa scrivere (il recupero "1:30" ha i due punti). Etichetta sopra, poi tre colonne: pulsante secondario "−15 s", il valore in cifre (600, 1.375rem) centrato, pulsante secondario "+15 s". Ai limiti il pulsante si disattiva. Il valore è annunciato con cortesia, a parole per gli screen reader ("1 minuto e 30 secondi").

- **Campo che salva a ogni battuta** (`LiveField`): lo stesso campo, per i testi delle schede (nome, ripetizioni, carico, note). Salva a ogni carattere; finché ha il focus il testo resta com'è, poi torna al valore salvato. Un testo non valido resta visibile con l'errore sotto e non si salva.

### Voce della scheda
L'editor delle schede si legge come la scheda di carta. Ogni voce è una riga da almeno 56px senza pannello, separata da un filo `border`: a sinistra il numero d'ordine (1, 2a, 2b) a 18px in `text`, poi il nome dell'esercizio (650, 18px) e sotto i target compatti in `text-muted` a 14px ("3 × 6–8 · 40 kg · rec. 1:15", poi unità, nota e alternative), a destra la freccia da 48px che apre la voce. Aperta, i campi stanno in linea sotto il nome, allineati al nome (a filo sotto i 360px): esercizio con "Cambia", serie e recuperi come valori a passi, ripetizioni e carico come campi, alternative come elenco con la crocetta da 48px, interruttore della superserie, "Togli dalla scheda" nel pulsante pieno `danger-fill`.
- **Superserie:** una riga "Superserie · 2 esercizi" in `text` con l'icona del collegamento, e un filo `border-control` di 1px nella colonna dei numeri che unisce ogni voce alla successiva.
- **Riordino:** solo dalla maniglia, senza modalità (ADR-007): premuta, le voci diventano righe con a sinistra la maniglia e a destra il numero d'ordine. Il trascinamento non è l'unico modo: "Sposta su" e "Sposta giù" (secondari, con le frecce) stanno nella voce aperta, sopra "Togli dalla scheda", e da tastiera le frecce sulla maniglia.

### Foglio del catalogo
Foglio dal basso per scegliere un esercizio: campo di ricerca con l'icona a sinistra, fisso in testa mentre l'elenco scorre; risultati come righe da 48px separate da `border`, con "personalizzato" in `text-muted`; in fondo "Crea «…»" in `accent-text` con l'icona più, quando il nome scritto non c'è.

### Giorni del calendario
Lo stato di un giorno ha sempre un'icona Lucide più un testo (nell'etichetta accessibile quando lo spazio non basta), mai il solo colore: **Fatto** (`circle-check`, `text`), **In corso** (`circle-play`, `accent-text`), **Saltato** (`circle-x`, `text-muted`), **In programma** (`circle-dashed`, `text-muted`; oggi "Da fare"), **Riposo** (`moon`, `text-muted`, solo nella striscia: nelle righe lo dice il titolo). Oggi ha il bordo `accent-indicator` e il fondo `surface`.
- **Striscia della settimana** (Oggi): sette colonne alte 76px, giorno abbreviato a 12px `text-muted`, numero a 18px, icona da 18px; ogni giorno è un link al suo foglio nel Calendario.
- **Riga del giorno** (Calendario): pulsante a tutta larghezza alto almeno 64px, separato da un filo `border`; a sinistra giorno e numero (20px), al centro la scheda (o ciò che si è fatto) in grassetto con una nota `text-muted` a 14px ("solo per questa data", "in programma: Scheda B"), a destra icona e stato a 14px. Riposo e "Niente in programma" a peso normale `text-muted`.
- **Mese compatto:** tabella di sette colonne con celle alte 56px, numero (650) e icona da 16px sotto; i giorni degli altri mesi restano vuoti; legenda sotto la tabella. Il riposo non ha segno.
- **Settimana tipo:** una riga-pulsante da almeno 48px per giorno, separata da un filo `border`, con il nome a sinistra (650) e la scelta a destra seguita da una freccia `text-muted`; il tocco apre il foglio «Ogni lunedì» con Niente, Riposo e le schede attive, la spunta sulla scelta attuale (come il foglio della serie). Il link «Assegna le schede ai giorni» porta il focus alla prima riga. L'avviso di una scheda archiviata ancora assegnata sta sotto la riga, informativo (`text-muted` con l'icona `info`).

### Righe della scheda in Oggi
Le righe di scelta (`.choice`) alte 64px con il radio, il nome della scheda a 18px e sotto esercizi e ultima volta a 14px `text-muted`; la pianificata ha a destra "Oggi" con l'icona del calendario in `accent-text`. "Inizia allenamento" (primario alto 56px a 18px) è appiccicato sopra la tab bar con il fondo della pagina, così resta nella zona del pollice anche a 320×568.

### Riga serie
L'unità di lavoro dell'allenamento: cinque colonne in griglia, tipo/numero · precedente · kg · rip · spunta, alta 56px.
- **Tipo/numero:** pulsante da 48px, peso 650 a 18px; il numero è `text-muted`, le sigle dei tipi speciali (R, D, C) sono `text`. Nell'allenamento un tocco apre il foglio della serie (tipo: Normale, Riscaldamento, Drop, Cedimento, con la sigla e la spunta sulla scelta attuale; poi "Togli serie" in `danger`, spento se resta una serie sola).
- **Precedente:** "40 × 8" in corpo `text-muted`, allineato a sinistra e troncato; un tocco copia i valori nei campi. Senza precedente, un trattino.
- **Campi kg e rip:** campi serie da 48px, cifre serie centrate, tastiera numerica (decimale per il peso), il valore precedente come segnaposto.
- **Spunta:** quadrato da 48px con bordo 1.5px `border-control` e icona `text-muted`. Su una riga vuota conferma il precedente in un solo tocco; senza precedente porta al primo campo vuoto. Fatta, la spunta si riempie di `done` con icona `on-done` più spessa; la riga non ha fondo e i campi perdono bordo e fondo (sono testo letto, non da compilare). Una serie vuota segnalata ha il bordo interno `accent-indicator` di 2px e l'avviso in `accent-text`.

### Allenamento attivo
La schermata dove si passa più tempo: una colonna di pannelli, uno per blocco (un esercizio, o una superserie intera con la riga "Superserie · 2 esercizi" in `text` e un filo `border` tra 2a e 2b). Niente pannelli annidati: le righe serie stanno direttamente nel pannello.
- **Testa dell'esercizio:** su una riga la maniglia del riordino (`grip-vertical` `text-muted`, il bersaglio sporge nell'imbottitura del pannello; assente con un esercizio solo), il nome (700, 18px, a capo a parola, mai troncato) come pulsante che apre e chiude l'esercizio (`aria-expanded`; anche il tocco sul resto della riga), subito dopo l'icona `info` `text-muted` che apre l'approfondimento (in basso, all'altezza dell'ultima riga del nome), a destra "⋯" da 48px (nota sul carico, come si esegue, progressi, cambia esercizio, "Recupero · 1:30" con il foglio a passi di 15 s, sposta, togli). Sotto, in `text-muted` a 14px, "Al posto di …" con una variante e "Nota del 6 ottobre: «…»" con la nota della volta scorsa. Nessun numero d'ordine né target della scheda nella card (INC-009).
- **Intestazioni delle righe:** Serie · Precedente · kg · Rip sulle stesse colonne della riga serie; nella colonna della spunta "Completa esercizio" (`check-check`, 48px, icona `text` e bordo `border-control` come la spunta, raggio da campo).
- **Adesso:** il pannello con la serie da fare ha il fondo `accent-tint` e un bordo `accent-indicator` di 2px disegnato dentro (`box-shadow` inset, nessun salto di layout); in superserie è il pannello del gruppo.
- **Aperto e chiuso:** all'avvio tutti aperti; chiuso, l'esercizio mostra in una riga il riassunto di oggi ("1 di 3 serie fatte · 40 × 8", oppure da fatto `circle-check` in `text`, "3 serie · 42,5 × 8 · 40 × 8"). Con tutte le serie spuntate si chiude da solo, tranne l'ultimo toccato, per correggere l'ultima serie. "Completa esercizio" riuscito lo chiude e porta in vista il successivo con serie da fare, aperto, con il focus sul suo nome. Durante il trascinamento le card diventano righe: maniglia a sinistra, numero d'ordine a destra.
- **Sotto le righe:** "Aggiungi serie" (testuale), poi il campo "Nota sul carico" quando c'è una nota. Una serie qualsiasi si toglie dal suo foglio (tocco sul numero), con "Annulla" se aveva valori.
- **Record:** una serie spuntata che batte il carico massimo ha l'icona `trophy` da 16px in `highlight` nella colonna "precedente". Nel riepilogo il trofeo di "Record battuto" è in `text`.
- **Barra dell'allenamento:** la barra di salvataggio, sempre visibile sopra la tab bar: a sinistra la durata (700, 18px, `text`) e sotto lo stato breve ("Salvato"), a destra "Termina" (primario).
- **Riepilogo:** icona `circle-check`, titolo pagina "Allenamento concluso", poi righe termine/valore separate da `border` (Durata, Esercizi, Serie, Volume; valori in cifre 600 a 1.375rem allineati a destra), "Record battuto" con `trophy`, "Cosa hai fatto" per esercizio, l'eventuale invito all'installazione in un pannello, "Fatto" (primario) e "Riapri allenamento" (secondario). Nessuna tessera di statistiche.

### Cards / Containers
- **Corner Style:** pannello (12px).
- **Background:** `surface`.
- **Shadow Strategy:** nessuna (vedi Elevation & Depth).
- **Border:** nessuno.
- **Internal Padding:** fluida da 12px a 16px. Un solo livello: un pannello non contiene altri pannelli.

### Navigation
- **Intestazione:** guscio appiccicato in alto, alta 64px, filo inferiore `border`; titolo compatto troncato su una riga, riga di stato in `text-muted` a 14px, a destra azioni facoltative, l'icona Informazioni (`circle-question-mark`, verso `/info`) e quella delle Impostazioni (`settings`, l'ingranaggio), da 48px.
- **Mini-barra dell'allenamento:** sulle altre pagine (non sull'allenamento; su Oggi solo con un recupero in corso), sopra la tab bar: guscio alto 56px con filo `border`, icona `circle-play` in `accent-text`, nome della sessione (650) e "da 25 min · esercizio" in `text-muted`, "Riprendi" in `accent-text` con la freccia. Tutta la barra è un link all'allenamento; resta ferma tra le pagine (`transition:persist`). Con un recupero in corso diventa il timer ridotto, con a destra una freccia da 56px (separata da un filo `border`) che torna all'allenamento.
- **Tab bar:** guscio in basso con filo superiore `border`, quattro voci uguali (Oggi, Calendario, Schede, Storico) alte 56px, icona da 22px sopra l'etichetta a 12px. A riposo `text-muted`, al passaggio `text`; la voce attiva è in `text` e in grassetto, con l'icona piena e un indicatore di 2px in `text` sul bordo superiore, e `aria-current="page"`.

### Barra di salvataggio
Guscio in basso, alta 68px, filo superiore `border`. A sinistra lo stato in `text-muted`, annunciato con cortesia: "Salvato su questo dispositivo" con la spunta, "Salvataggio…" con icona che gira; a destra l'azione principale della schermata. In errore (spazio esaurito) o conflitto (diario cambiato in un'altra scheda) testo e filo passano a `danger`, con l'icona, e l'azione diventa "Salva ora" o "Ricarica".

### Fogli, conferme e avvisi
- **Foglio:** sale dal basso su un `<dialog>` nativo (0.32s, curva di uscita), largo fino a 40rem e alto fino all'85% dello schermo, maniglia da 40×4px, titolo e chiusura da 48px in testa, piede facoltativo con le azioni. All'apertura il focus va al titolo (o al campo con `autofocus`), non a ✕. Un foglio aperto dal menu ⋯ di un esercizio ha a sinistra del titolo «Torna al menu» (`chevron-left`, 48px), che riapre il menu; ✕ chiude tutto. Per scelte e consultazioni (variante, catalogo, approfondimento), non per inserire dati.
- **Conferma:** finestra centrata fino a 28rem, imbottitura 24px, titolo, testo `text-muted`, due pulsanti affiancati a tutta larghezza: "Annulla" secondario e il verbo distruttivo nel pulsante pieno `danger-fill` con l'icona. Solo per azioni distruttive; Esc annulla.
- **Avviso breve:** pillola del guscio (`surface`, bordo `border-control`) alta 56px con l'unica ombra, entra dal basso in 0.24s sopra lo stack delle barre, si chiude da solo dopo 5 secondi, con azione testuale facoltativa in `accent-text` ("Annulla") e chiusura da 48px.

### Stato vuoto
Allineato a sinistra: icona `text-muted` da 28px, titolo, una frase che dice cosa comparirà e come farlo comparire, al massimo un'azione primaria.

### Timer di recupero (componente distintivo)
Lo schermo è la clessidra.
- **Schermo intero:** finestra modale a tutta altezza su `bg`. Dietro a tutto, il livello `accent-tint` con filo superiore `accent-indicator` di 6px parte dal 100% dell'altezza (sotto l'intestazione) e scende a scatti di un secondo, senza animazione continua, fino al bordo superiore delle lastre: vuoto, il filo sta sopra i comandi, che restano sempre sul livello, e negli ultimi secondi non sparisce dietro di loro. In testa "Recupero · 2:00" in `text-muted` e l'icona Riduci da 48px; al centro le cifre timer in `text` e sotto "Prossima" (etichetta a 14px in `text`) con esercizio, serie, peso × ripetizioni; in basso, nella zona del pollice, tre lastre da 64px (`surface`, bordo `border-control`, testo `text`: −15 s, +15 s, Salta) con 10px di stacco, e "Riduci" come pulsante testuale sotto. Esc riduce invece di chiudere.
- **Ultimi 10 secondi:** le cifre passano a `accent-text`.
- **Vai:** tutto lo schermo diventa `accent`, testo e icone in `on-accent`, le cifre lasciano il posto alla parola "Vai", "Prossima" diventa "Adesso" e le lastre si fondono in un unico "Chiudi" in `on-accent` con testo `accent`. Si chiude da solo dopo 6 secondi.
- **Ridotto:** barra del guscio alta 56px, sull'allenamento sopra la barra dell'allenamento, sulle altre pagine al posto della mini-barra; il livello qui si accorcia da destra verso sinistra (filo superiore `accent-indicator` di 3px), con icona timer, tempo in cifre e la prossima serie troncata. Un tocco riapre lo schermo intero; a fine recupero la barra diventa `accent` con "Vai".
- **Riscaldamento e rientro:** l'intestazione dice "Recupero di riscaldamento · 1:00" per una serie di riscaldamento; al rientro dopo lo schermo bloccato, a recupero già finito, dice "Recupero finito da 1:20". Tempo e "40 kg × 8" sono legati da spazi unificatori, così vanno a capo interi.
- **Annunci:** solo a 30 s, 10 s e alla fine (anche con il timer ridotto); con `prefers-reduced-motion` nessuna transizione.
- **Avvisi:** alla fine tre toni brevi generati in locale (`AudioContext`, 880 Hz e 1320 Hz) e una vibrazione, secondo le Impostazioni, una volta sola; oltre un minuto di ritardo (schermo bloccato) non suonano. Schermo acceso (wake lock) per tutto l'allenamento.

## Do's and Don'ts

### Do:
- **Do** usare solo i ruoli del sistema (`surface`, `text-muted`, `border-control`, …) e scrivere ogni nuovo colore come coppia `light-dark()` in `@theme`, con la sua coppia in `src/styles/contrast.test.ts`.
- **Do** mettere la classe `.shell` su intestazione, barre in basso e avviso breve: fondo `surface` e testo `text`, nel tema scelto.
- **Do** dare il bordo `border-control` a ogni controllo e riservare `border` ai separatori.
- **Do** tenere ogni controllo toccabile ad almeno 48px, le righe serie e le voci della tab bar a 56px, le lastre del timer a 64px.
- **Do** lasciare le cifre tabulari e tenere peso e ripetizioni da inserire ad almeno 20px.
- **Do** usare l'anello di focus di 2px `accent-indicator` a 3px di distanza (1px su campi e riga serie).
- **Do** usare la curva di uscita `cubic-bezier(0.16, 1, 0.3, 1)` per le transizioni di stato e rispettare `prefers-reduced-motion`.
- **Do** far avanzare il livello del timer a scatti di un secondo.

### Don't:
- **Don't** usare la palette predefinita di Tailwind (`gray-*`, `blue-*`, `green-*`, `red-*`). La grafica vecchia che la usava è stata rimossa allo step 3.
- **Don't** usare l'accento per decorare o per stati conclusi, `danger` senza icona e testo, `highlight` per pulsanti, link o stati, o un verde per i successi.
- **Don't** aggiungere ombre: l'unica è quella dell'avviso.
- **Don't** annidare pannelli dentro pannelli.
- **Don't** disegnare un anello di avanzamento attorno alle cifre del timer né animare il livello in modo continuo.
- **Don't** caricare font remoti, usare il carattere di sistema come voce dell'interfaccia o aggiungere la feature `zero`.
- **Don't** usare `border` come unico bordo di un controllo: è sotto 3:1.
- **Don't** aprire una finestra modale per inserire dati: il foglio serve per scegliere e consultare, la conferma solo per le azioni distruttive.
