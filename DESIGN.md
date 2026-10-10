---
name: BodyTracker
description: Diario di allenamento privato e offline, con un guscio verde scuro attorno a un contenuto chiaro o scuro.
colors:
  fondo: "light-dark(#eef2ec, #142321)"
  superficie: "light-dark(#ffffff, #1e302d)"
  campo: "light-dark(#f7f9f5, #142321)"
  testo: "light-dark(#142321, #f0f5ee)"
  secondario: "light-dark(#4b5f55, #b8c9bf)"
  linea: "light-dark(#c3d0c6, #344a41)"
  linea-forte: "light-dark(#788f80, #6b8577)"
  accento: "light-dark(#2f5d34, #c7e69c)"
  su-accento: "light-dark(#f2f9e8, #19301e)"
  accento-testo: "light-dark(#2f5d34, #c7e69c)"
  fatto: "light-dark(#ddebd0, #28432f)"
  pericolo: "light-dark(#a8321f, #ffb6a6)"
  pericolo-fondo: "light-dark(#fbe9e5, #3d2621)"
  avviso: "light-dark(#6b3d0f, #ffe0bd)"
  avviso-fondo: "light-dark(#fbecd9, #3e2f23)"
  avviso-linea: "light-dark(#c28a4a, #846b4e)"
  guscio: "#142321"
  guscio-pannello: "#1e302d"
  guscio-pannello-hover: "#2a4238"
  guscio-testo: "#f0f5ee"
  guscio-secondario: "#b8c9bf"
  guscio-linea: "#344a41"
  guscio-linea-forte: "#6b8577"
  guscio-accento: "#c7e69c"
  guscio-accento-hover: "#dbf4b8"
  guscio-su-accento: "#19301e"
  guscio-avviso: "#ffe0bd"
  guscio-avviso-icona: "#ffc98f"
  guscio-avviso-linea: "#846b4e"
  livello: "#2b4a36"
  fondale: "rgb(9 23 19 / 0.6)"
  ombra: "rgb(9 23 19 / 0.28)"
typography:
  titolo-pagina:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
  titolo:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  titolo-compatto:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  corpo:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  etichetta:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  pulsante:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.2
  cifre:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  cifre-serie:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 5.6vw, 1.375rem)"
    fontWeight: 600
    lineHeight: 1.2
    fontFeature: "tnum"
  cifre-timer:
    fontFamily: "'Atkinson Hyperlegible Next', ui-sans-serif, system-ui, sans-serif"
    fontSize: "min(44cqw, 30cqh, 16rem)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
rounded:
  campo: "8px"
  pannello: "12px"
  finestra: "16px"
spacing:
  minimo: "4px"
  stretto: "8px"
  controlli: "12px"
  margine: "16px"
  finestra: "24px"
  sezione: "48px"
  pannello: "clamp(0.75rem, 4vw, 1rem)"
  riga: "clamp(0.25rem, 1.6vw, 0.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
    typography: "{typography.pulsante}"
    rounded: "{rounded.campo}"
    padding: "0 20px"
    height: "48px"
  button-primary-guscio:
    backgroundColor: "{colors.guscio-accento}"
    textColor: "{colors.guscio-su-accento}"
    typography: "{typography.pulsante}"
    rounded: "{rounded.campo}"
    padding: "0 20px"
    height: "48px"
  button-primary-guscio-hover:
    backgroundColor: "{colors.guscio-accento-hover}"
  button-secondary:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.testo}"
    typography: "{typography.pulsante}"
    rounded: "{rounded.campo}"
    padding: "0 20px"
    height: "48px"
  button-secondary-guscio:
    backgroundColor: "{colors.guscio-pannello}"
    textColor: "{colors.guscio-testo}"
    typography: "{typography.pulsante}"
    rounded: "{rounded.campo}"
    padding: "0 20px"
    height: "48px"
  button-secondary-guscio-hover:
    backgroundColor: "{colors.guscio-pannello-hover}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.pericolo}"
    typography: "{typography.pulsante}"
    rounded: "{rounded.campo}"
    padding: "0 20px"
    height: "48px"
  button-danger-hover:
    backgroundColor: "{colors.pericolo-fondo}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accento-testo}"
    typography: "{typography.pulsante}"
    padding: "0 4px"
    height: "48px"
  button-text-guscio:
    backgroundColor: "transparent"
    textColor: "{colors.guscio-accento}"
    typography: "{typography.pulsante}"
    padding: "0 4px"
    height: "48px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.secondario}"
    rounded: "{rounded.campo}"
    size: "48px"
  button-icon-guscio:
    backgroundColor: "transparent"
    textColor: "{colors.guscio-secondario}"
    rounded: "{rounded.campo}"
    size: "48px"
  input:
    backgroundColor: "{colors.campo}"
    textColor: "{colors.testo}"
    typography: "{typography.corpo}"
    rounded: "{rounded.campo}"
    padding: "10px 12px"
    height: "48px"
  input-label:
    textColor: "{colors.secondario}"
    typography: "{typography.etichetta}"
  input-error:
    textColor: "{colors.pericolo}"
    typography: "{typography.etichetta}"
  choice-row:
    backgroundColor: "transparent"
    textColor: "{colors.testo}"
    rounded: "{rounded.campo}"
    padding: "8px 12px"
    height: "48px"
  choice-row-selected:
    backgroundColor: "{colors.fatto}"
  set-field:
    backgroundColor: "{colors.campo}"
    textColor: "{colors.testo}"
    typography: "{typography.cifre-serie}"
    rounded: "{rounded.campo}"
    padding: "0 2px"
    height: "48px"
  set-field-done:
    backgroundColor: "transparent"
  set-row:
    backgroundColor: "transparent"
    textColor: "{colors.testo}"
    rounded: "{rounded.campo}"
    padding: "0 6px"
    height: "56px"
  set-row-done:
    backgroundColor: "{colors.fatto}"
  set-previous:
    textColor: "{colors.secondario}"
    typography: "{typography.corpo}"
    height: "48px"
  set-check:
    backgroundColor: "transparent"
    textColor: "{colors.secondario}"
    rounded: "{rounded.campo}"
    size: "48px"
  set-check-done:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
  segmented:
    backgroundColor: "{colors.campo}"
    rounded: "{rounded.pannello}"
    padding: "4px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.secondario}"
    rounded: "{rounded.campo}"
    padding: "0 8px"
    height: "48px"
  segmented-option-selected:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
  panel:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.testo}"
    rounded: "{rounded.pannello}"
    padding: "{spacing.pannello}"
  sheet:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.testo}"
    rounded: "{rounded.finestra}"
    padding: "0 16px 16px"
    width: "min(100%, 40rem)"
  dialog:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.testo}"
    rounded: "{rounded.finestra}"
    padding: "24px"
    width: "min(calc(100% - 2rem), 28rem)"
  toast:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-testo}"
    rounded: "{rounded.pannello}"
    padding: "4px 4px 4px 16px"
    height: "56px"
    width: "min(100%, 32rem)"
  header:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-testo}"
    typography: "{typography.titolo-compatto}"
    padding: "0 16px"
    height: "64px"
  save-bar:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-secondario}"
    typography: "{typography.etichetta}"
    padding: "10px 16px"
    height: "68px"
  save-bar-problem:
    textColor: "{colors.guscio-avviso}"
  tab-bar:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-secondario}"
    height: "56px"
  tab-bar-active:
    textColor: "{colors.guscio-accento}"
  timer:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-testo}"
    typography: "{typography.cifre-timer}"
    padding: "8px 16px 16px"
    height: "100dvh"
    width: "100%"
  timer-level:
    backgroundColor: "{colors.livello}"
    width: "100%"
  timer-final:
    textColor: "{colors.guscio-accento}"
  timer-go:
    backgroundColor: "{colors.guscio-accento}"
    textColor: "{colors.guscio-su-accento}"
  timer-plate:
    backgroundColor: "{colors.guscio-pannello}"
    textColor: "{colors.guscio-testo}"
    typography: "{typography.titolo}"
    rounded: "{rounded.pannello}"
    height: "64px"
  timer-plate-go:
    backgroundColor: "{colors.guscio-su-accento}"
    textColor: "{colors.guscio-accento}"
  timer-reduced:
    backgroundColor: "{colors.guscio}"
    textColor: "{colors.guscio-testo}"
    typography: "{typography.cifre}"
    padding: "0 16px"
    height: "56px"
    width: "100%"
  timer-reduced-go:
    backgroundColor: "{colors.guscio-accento}"
    textColor: "{colors.guscio-su-accento}"
---

# Design System: BodyTracker

## Overview

**Creative North Star: "Il guscio verde"**

BodyTracker è uno strumento da sala pesi, non una vetrina. Un guscio verde scuro, lo stesso nei due temi, tiene insieme le parti che il pollice tocca sempre: intestazione, barra di salvataggio, tab bar, avvisi e timer. Dentro il guscio scorre il contenuto (schede, righe serie, campi), che segue il tema scelto: chiaro con fondo verde salvia pallido e pannelli bianchi, oppure scuro nello stesso verde del guscio. L'utente sceglie Sistema, Chiaro o Scuro; il guscio non cambia mai, quindi l'app resta riconoscibile in penombra e al sole.

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

Il meccanismo dei temi: nessun attributo su `<html>` significa "segui il sistema" (`color-scheme: light dark`); `data-theme="chiaro"` o `data-theme="scuro"` forza il tema. La preferenza vive nella chiave `bodytracker.tema` ed è applicata da uno script in linea prima del primo disegno, per evitare il lampo del tema sbagliato. Ogni superficie del guscio dichiara `color-scheme: dark`, quindi un token di contenuto usato dentro il guscio prende il suo valore scuro anche nel tema chiaro.

### Primary
- **Verde foresta / Lime** (`accento`): l'azione primaria e la selezione nel contenuto: pulsante primario, segmento scelto, spunta della serie fatta, pallino del radio, selezione del testo. Foresta profondo nel tema chiaro, lime nel tema scuro. Il testo sopra l'accento usa sempre **Inchiostro su accento** (`su-accento`), salvia quasi bianco sul foresta e verde inchiostro sul lime.
- **Accento per testo** (`accento-testo`): link, cursore di inserimento, anello di focus nel contenuto, bordo del campo a fuoco, sigla del tipo di serie speciale. Oggi ha gli stessi valori di `accento` in entrambi i temi: resta un token separato perché nasce per il testo su fondo, non per il riempimento.
- **Lime del guscio** (`guscio-accento`): l'unico accento sul verde scuro: voce attiva della tab bar, primario sul guscio, link e pulsanti testuali sul guscio, icona "salvato", anello di focus sul guscio, filo superiore del livello, cifre negli ultimi dieci secondi, schermo "Vai". Al passaggio diventa **Lime chiaro** (`guscio-accento-hover`).

### Secondary
- **Verde livello** (`livello`): solo per il livello del timer (a tutto schermo e nella barra ridotta). Un verde intermedio tra guscio e pannello, abbastanza diverso dal guscio da leggersi come "pieno" senza competere con le cifre.

### Tertiary
- **Rosso mattone / Corallo** (`pericolo`): azioni distruttive e campi non validi; testo e bordo, mai riempimento pieno. Al passaggio, il pulsante distruttivo prende il **Rosato pericolo** (`pericolo-fondo`).
- **Ambra** (`avviso`, `avviso-fondo`, `avviso-linea`): avvisi nel contenuto. Sul guscio la barra di salvataggio usa la variante fissa (`guscio-avviso` per il testo, `guscio-avviso-icona` per l'icona, `guscio-avviso-linea` per il filo superiore) quando lo spazio è esaurito o il diario è cambiato in un'altra scheda.

### Neutral
- **Salvia pallido / Verde notte** (`fondo`): il fondo della pagina e la barra di scorrimento.
- **Bianco / Verde pannello** (`superficie`): pannelli, fogli, conferme, pulsante secondario.
- **Campo** (`campo`): l'interno di campi, campi serie, controllo segmentato e radio; quasi bianco sul chiaro, verde notte sullo scuro.
- **Verde inchiostro / Salvia chiaro** (`testo`): il testo principale.
- **Grigio salvia** (`secondario`): etichette, metadati, segnaposto, colonna "precedente", icone a riposo.
- **Linea** (`linea`): separatori e bordi decorativi di fogli e conferme. Non delimita mai un controllo.
- **Linea forte** (`linea-forte`): il bordo di ogni controllo (campi, pulsante secondario, spunta, radio, segmentato, righe di scelta) e la maniglia del foglio.
- **Serie fatta** (`fatto`): il fondo di una riga serie completata e della riga di scelta selezionata.
- **Guscio** (`guscio`, `guscio-pannello`, `guscio-pannello-hover`, `guscio-testo`, `guscio-secondario`, `guscio-linea`, `guscio-linea-forte`): la versione fissa delle stesse rampe per le superfici verde scuro. È anche il `theme-color` del browser.
- **Fondale** (`fondale`) e **Ombra** (`ombra`): lo stesso verde quasi nero a due opacità, per il velo dietro fogli e conferme e per l'unica ombra.

### Named Rules
**La regola del guscio fisso.** Intestazione, barra di salvataggio, tab bar, avvisi e timer usano solo i token `guscio-*` e `livello`, uguali nei due temi. Nel tema chiaro il guscio non diventa chiaro.

**La regola della coppia.** Ogni colore del contenuto è scritto come `light-dark(chiaro, scuro)` in `@theme`. Un colore di contenuto con un solo valore è un errore: rompe uno dei due temi.

**La regola della linea forte.** Il bordo che fa riconoscere un controllo usa `linea-forte` (almeno 3:1 sul fondo in entrambi i temi). `linea` (circa 1,5:1) è solo per separatori e bordi decorativi.

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

Mobile first, una colonna. Il riferimento è 390×844, il minimo 320×568; su schermi larghi il contenuto si ferma a una colonna centrata di 42rem (672px) con margini laterali di 16px (`margine`). I fogli arrivano a 40rem, gli avvisi a 32rem, le conferme a 28rem.

La struttura della schermata è fissa: intestazione del guscio in alto (64px, appiccicata, con l'area sicura superiore), contenuto che scorre, e in basso uno stack di barre del guscio nella zona del pollice: tab bar (56px), barra di salvataggio (68px), timer ridotto (56px). La pagina dichiara l'altezza dello stack in `--altezza-barre-basse`, e gli avvisi si posano 12px sopra. Le aree sicure del telefono (`env(safe-area-inset-*)`) sono rispettate da intestazione, tab bar, fogli e timer.

Il ritmo usa pochi passi: 4px dentro i controlli composti (segmentato), 8px tra elementi stretti, 12px tra controlli e tra pulsanti affiancati, 16px di margine e di stacco tra gruppi, 24px dentro le conferme, 48px tra le sezioni di una pagina lunga. Il pannello ha un'imbottitura fluida da 12px a 16px; la riga serie uno spazio fluido tra le colonne da 4px a 8px, così le cinque colonne entrano anche a 320px.

### Named Rules
**La regola del pollice.** Le azioni frequenti stanno in basso: navigazione, azione principale della schermata (a destra nella barra di salvataggio), comandi del timer. In alto restano solo il titolo e l'accesso alle Impostazioni.

**La regola dei 48.** Ogni controllo toccabile è alto almeno 48px; righe serie e voci della tab bar 56px; lastre del timer 64px.

## Elevation & Depth

Il sistema è piatto. La profondità viene dal tono: fondo, superficie e campo sono tre gradini della stessa rampa verde, e il guscio scuro incornicia il contenuto senza bisogno di sollevarlo. I pannelli non hanno bordo né ombra e non si annidano mai. Fogli e conferme si staccano con il fondale verde quasi nero al 60% e un bordo decorativo `linea`. Il timer a tutto schermo copre la pagina con il colore pieno del guscio.

### Shadow Vocabulary
- **Sospensione dell'avviso** (`box-shadow: 0 8px 24px var(--color-ombra)`): solo sotto l'avviso breve, l'unico elemento che galleggia sopra il contenuto senza velo.

### Named Rules
**La regola dell'unica ombra.** Una sola ombra in tutto il sistema, quella dell'avviso. Pannelli, pulsanti, fogli, barre e timer non ne hanno.

## Shapes

Angoli morbidi ma tesi, in tre misure assegnate per ruolo. **Campo** (8px): tutto ciò che si tocca da solo, cioè pulsanti, campi, spunta, segmenti, righe serie, righe di scelta, maniglia del foglio. **Pannello** (12px): contenitori e controlli composti, cioè pannelli, binario del segmentato, avvisi, lastre del timer, anteprima del timer ridotto. **Finestra** (16px): ciò che si apre sopra la pagina, cioè conferme e anteprima del timer; il foglio dal basso arrotonda solo i due angoli superiori.

I bordi sono sottili (1px), salvo spunta e radio a 1.5px; il livello del timer ha un filo superiore lime di 4px (3px nella barra ridotta). Il radio e il suo pallino sono gli unici cerchi; non ci sono forme decorative.

## Components

### Buttons
Diretti e pieni di peso, con il verbo dell'azione nel testo.
- **Shape:** angoli da campo (8px), altezza minima 48px, imbottitura orizzontale 20px, icona da 20px con 8px di stacco.
- **Primary:** riempimento `accento`, testo `su-accento`, peso 650. Sul guscio diventa lime con inchiostro verde.
- **Hover / Focus:** al passaggio il primario si mescola al 14% verso il colore del testo (più scuro sul chiaro, più chiaro sullo scuro); il secondario prende un velo di accento al 10%. Transizione di colore di 0.15s con la curva di uscita. Il focus da tastiera è un anello pieno di 3px a 3px di distanza, in `accento-testo` nel contenuto e lime sul guscio.
- **Secondary:** fondo `superficie`, bordo `linea-forte`, testo `testo`; sul guscio fondo `guscio-pannello` con bordo `guscio-linea-forte`.
- **Danger:** trasparente, testo e bordo in `pericolo`; al passaggio fondo `pericolo-fondo`.
- **Text:** trasparente, testo `accento-testo` (lime sul guscio), imbottitura 4px, sottolineato al passaggio.
- **Icon:** quadrato da 48px trasparente, icona `secondario` da 22px; al passaggio un velo del colore corrente al 12%.
- **Disabled:** opacità 0.45 e cursore di divieto.

### Inputs / Fields
- **Style:** fondo `campo`, bordo 1px `linea-forte`, angoli da 8px, altezza 48px, imbottitura 10px × 12px, corpo a 16px. L'etichetta sta sopra (etichetta, `secondario`, 6px di stacco); aiuto ed errore sotto, a 14px. I menu a tendina hanno una freccia propria a destra.
- **Focus:** il bordo passa a `accento-testo` e l'anello di 3px si stringe a 1px di distanza.
- **Error:** bordo `pericolo` con `aria-invalid`, messaggio in `pericolo` che dice come correggere.
- **Righe di scelta:** riga intera toccabile da 48px con bordo `linea-forte` e radio del tema da 22px; selezionata, bordo `accento-testo` e fondo `fatto`.
- **Controllo segmentato:** binario `campo` con bordo `linea-forte`, angoli da 12px e 4px di imbottitura; segmenti da 48px, testo `secondario` peso 600; il segmento scelto è pieno di `accento` con testo `su-accento`. Per poche opzioni sempre visibili (tema, unità).

### Riga serie
L'unità di lavoro dell'allenamento: cinque colonne in griglia, tipo/numero · precedente · kg · rip · spunta, alta 56px.
- **Tipo/numero:** pulsante da 48px, peso 650 a 18px; il numero è `secondario`, le sigle dei tipi speciali (R, D, C) sono `accento-testo`. Un tocco passa al tipo successivo.
- **Precedente:** "40 × 8" in corpo `secondario`, allineato a sinistra e troncato; un tocco copia i valori nei campi. Senza precedente, un trattino.
- **Campi kg e rip:** campi serie da 48px, cifre serie centrate, tastiera numerica (decimale per il peso), il valore precedente come segnaposto.
- **Spunta:** quadrato da 48px con bordo 1.5px `linea-forte` e icona `secondario`. Su una riga vuota conferma il precedente in un solo tocco; senza precedente porta al primo campo vuoto. Fatta, la spunta si riempie di `accento` con icona `su-accento` più spessa, la riga prende il fondo `fatto` e i campi perdono bordo e fondo.

### Cards / Containers
- **Corner Style:** pannello (12px).
- **Background:** `superficie`.
- **Shadow Strategy:** nessuna (vedi Elevation & Depth).
- **Border:** nessuno.
- **Internal Padding:** fluida da 12px a 16px. Un solo livello: un pannello non contiene altri pannelli.

### Navigation
- **Intestazione:** guscio appiccicato in alto, alta 64px, filo inferiore `guscio-linea`; titolo compatto troncato su una riga, riga di stato in `guscio-secondario` a 14px, a destra azioni facoltative e l'icona delle Impostazioni da 48px.
- **Tab bar:** guscio in basso con filo superiore `guscio-linea`, quattro voci uguali (Oggi, Calendario, Schede, Storico) alte 56px, icona da 22px sopra l'etichetta a 12px. A riposo `guscio-secondario`, al passaggio `guscio-testo`; la voce attiva è lime e in grassetto, con `aria-current="page"`.

### Barra di salvataggio
Guscio in basso, alta 68px, filo superiore `guscio-linea`. A sinistra lo stato, annunciato con cortesia: "Salvato su questo dispositivo" con spunta lime, "Salvataggio…" con icona che gira; a destra l'azione principale della schermata. In errore (spazio esaurito) o conflitto (diario cambiato in un'altra scheda) testo e filo passano all'ambra del guscio e l'azione diventa "Salva ora" o "Ricarica".

### Fogli, conferme e avvisi
- **Foglio:** sale dal basso su un `<dialog>` nativo (0.32s, curva di uscita), largo fino a 40rem e alto fino all'85% dello schermo, maniglia da 40×4px, titolo e chiusura da 48px in testa, piede facoltativo con le azioni. Per scelte e consultazioni (variante, catalogo, approfondimento), non per inserire dati.
- **Conferma:** finestra centrata fino a 28rem, imbottitura 24px, titolo, testo `secondario`, due pulsanti affiancati a tutta larghezza: "Annulla" secondario e il verbo distruttivo in pericolo. Solo per azioni distruttive; Esc annulla.
- **Avviso breve:** pillola del guscio alta 56px con l'unica ombra, entra dal basso in 0.24s sopra lo stack delle barre, si chiude da solo dopo 5 secondi, con azione testuale lime facoltativa ("Annulla") e chiusura da 48px.

### Stato vuoto
Allineato a sinistra: icona `secondario` da 28px, titolo, una frase che dice cosa comparirà e come farlo comparire, al massimo un'azione primaria.

### Timer di recupero (componente distintivo)
Lo schermo è la clessidra.
- **Schermo intero:** finestra modale a tutta altezza sul colore del guscio. Dietro a tutto, il livello `livello` con filo superiore lime di 4px parte dal 100% dell'altezza e scende a scatti di un secondo, senza animazione continua. In testa "Recupero · 2:00" in `guscio-secondario` e l'icona Riduci da 48px; al centro le cifre timer in `guscio-testo` e sotto "Prossima" (etichetta a 14px) con esercizio, serie, peso × ripetizioni; in basso, nella zona del pollice, tre lastre da 64px (−15 s, +15 s, Salta) con 10px di stacco, e "Riduci" come pulsante testuale sotto. Esc riduce invece di chiudere.
- **Ultimi 10 secondi:** le cifre diventano lime.
- **Vai:** tutto lo schermo diventa lime, testo e icone in `guscio-su-accento`, le cifre lasciano il posto alla parola "Vai", "Prossima" diventa "Adesso" e le lastre si fondono in un unico "Chiudi" verde inchiostro con testo lime. Si chiude da solo dopo 6 secondi.
- **Ridotto:** barra del guscio alta 56px sopra la tab bar; il livello qui avanza in larghezza da sinistra (filo superiore lime di 3px), con icona timer, tempo in cifre e la prossima serie troncata in `guscio-secondario`. Un tocco riapre lo schermo intero; a fine recupero la barra diventa lime con "Vai".
- **Annunci:** solo a 30 s, 10 s e alla fine; con `prefers-reduced-motion` nessuna transizione.

## Do's and Don'ts

### Do:
- **Do** usare solo i token del sistema (`superficie`, `secondario`, `linea-forte`, …) e scrivere ogni nuovo colore di contenuto come coppia `light-dark()` in `@theme`.
- **Do** mettere la classe del guscio su ogni superficie verde scuro fissa (intestazione, barre in basso, avvisi, timer), così il contenuto al suo interno risolve al valore scuro e il focus diventa lime.
- **Do** dare il bordo `linea-forte` a ogni controllo e riservare `linea` ai separatori.
- **Do** tenere ogni controllo toccabile ad almeno 48px, le righe serie e le voci della tab bar a 56px, le lastre del timer a 64px.
- **Do** lasciare le cifre tabulari e tenere peso e ripetizioni da inserire ad almeno 20px.
- **Do** usare l'anello di focus di 3px a 3px di distanza (1px su campi e riga serie), in `accento-testo` nel contenuto e lime sul guscio.
- **Do** usare la curva di uscita `cubic-bezier(0.16, 1, 0.3, 1)` per le transizioni di stato e rispettare `prefers-reduced-motion`.
- **Do** far avanzare il livello del timer a scatti di un secondo.

### Don't:
- **Don't** usare la palette predefinita di Tailwind (`gray-*`, `blue-*`, `green-*`, `red-*`) nel codice nuovo. La grafica vecchia (pagine `index`, `workout`, `about`, `Layout.astro`, le classi `.container` e `.input` in `global.css`) la usa ancora ed è fuori ambito finché non viene sostituita.
- **Don't** schiarire il guscio nel tema chiaro né usare token di contenuto per intestazione, barre, avvisi o timer.
- **Don't** aggiungere ombre: l'unica è quella dell'avviso.
- **Don't** annidare pannelli dentro pannelli.
- **Don't** disegnare un anello di avanzamento attorno alle cifre del timer né animare il livello in modo continuo.
- **Don't** caricare font remoti, usare il carattere di sistema come voce dell'interfaccia o aggiungere la feature `zero`.
- **Don't** usare `linea` come unico bordo di un controllo: è sotto 3:1.
- **Don't** aprire una finestra modale per inserire dati: il foglio serve per scegliere e consultare, la conferma solo per le azioni distruttive.
