---
name: BodyTracker
description: Diario operativo di allenamento con identità verde scuro.
colors:
  fondo: '#142321'
  superficie: '#1e302d'
  campo: '#142321'
  testo: '#f0f5ee'
  secondario: '#b8c9bf'
  linea: '#455d52'
  accento: '#c7e69c'
  inchiostro: '#19301e'
  pericolo: '#ffb6a6'
typography:
  headline:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: clamp(26px, 5vw, 34px)
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -.03em
  title:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -.02em
  body:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 14px
    fontWeight: 500
  numero-serie:
    fontFamily: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
    fontSize: 22px
    fontFeature: tnum
rounded:
  campo: 8px
  pannello: 12px
  finestra: 16px
spacing:
  compatto: 8px
  controlli: 12px
  mobile: 16px
  pannello: 24px
  sezione: 32px
components:
  button-primary:
    backgroundColor: '{colors.accento}'
    textColor: '{colors.inchiostro}'
    rounded: '{rounded.campo}'
    padding: 12px 20px
  button-secondary:
    backgroundColor: '{colors.superficie}'
    textColor: '{colors.testo}'
    rounded: '{rounded.campo}'
    padding: 12px 20px
  input:
    backgroundColor: '{colors.campo}'
    textColor: '{colors.testo}'
    rounded: '{rounded.campo}'
    padding: 10px 12px
  card:
    backgroundColor: '{colors.superficie}'
    textColor: '{colors.testo}'
    rounded: '{rounded.pannello}'
    padding: 24px
  dialog:
    backgroundColor: '{colors.superficie}'
    textColor: '{colors.testo}'
    rounded: '{rounded.finestra}'
    padding: 24px
---

# Design System: BodyTracker

## Overview

Estensione del tracker esistente: fondo verde scuro, pannelli sobri e verde chiaro per azioni e stato selezionato. Il carattere è operativo, compatto e leggibile durante la registrazione in palestra.

La superficie privilegia variante, serie e carico. La modifica dei nomi è raccolta in dettagli espandibili; lo stato del salvataggio locale rimane nella barra inferiore. Non è stata introdotta una nuova identità visiva.

**Key Characteristics:**
- Una colonna operativa su desktop e telefono.
- Numeri tabulari per carichi, ripetizioni e date dello storico.
- Accento condiviso da azioni, selezione e completamento.

## Colors

La palette conserva i verdi scuri del diario e un accento chiaro; i token del frontmatter sono normativi.

### Primary

- **Accento verde chiaro:** azioni primarie, sezione corrente, completamento e riferimento all’ultimo allenamento.
- **Inchiostro verde:** testo sulle superfici di accento.

### Neutral

- **Fondo e campo:** pagina, barra fissa e campi di inserimento.
- **Superficie:** esercizi, scelta delle schede, pulsanti secondari e finestre.
- **Testo:** contenuti principali; **secondario:** etichette, istruzioni e metadati.
- **Linea:** bordi dei campi e separatori funzionali.

Il colore **pericolo** distingue azioni distruttive e input non validi. Gli stati hover e l’avviso di salvataggio hanno valori locali in CSS; non costituiscono nuove famiglie cromatiche.

**The Accento operativo Rule.** Il verde chiaro indica azione o stato utile alla registrazione.

## Typography

La famiglia di sistema del frontmatter è condivisa da testo e controlli. Non esiste un font display distinto.

### Hierarchy

- **Headline:** titolo di pagina o sessione, dimensione fluida.
- **Title:** titoli delle sezioni e delle finestre.
- **Body:** testo corrente, paragrafi limitati a 72ch.
- **Label:** etichette e metadati dei campi.
- **Numero serie:** valori peso e ripetizioni; dimensione ridotta a 20px su mobile, con numeri tabulari.

Il marchio usa peso 750 e dimensione 24px, ridotta a 22px su mobile. Il nome esercizio usa 20px, peso 650 e interlinea 1.35; diventa 18px su mobile. È un pulsante che apre l’approfondimento, non un titolo promozionale.

## Layout

Contenitore centrato con larghezza massima di 860px, padding laterale di 24px e spazio inferiore di 112px. A larghezze fino a 600px il padding laterale diventa 16px e quello superiore 20px. La sessione rimane una colonna di esercizi; la scelta A/B conserva due colonne.

Le righe serie hanno quattro colonne: indice, peso, ripetizioni, rimozione. Su desktop le colonne esterne sono 44px; su mobile l’indice scende a 28px e la rimozione resta 44px. I campi centrali usano minmax(0,1fr), i nomi lunghi possono andare a capo. I nomi modificabili restano in dettagli espandibili. La griglia data e modifica nome passa da due colonne a una.

La barra di salvataggio è fissa in basso e rispetta safe-area-inset-bottom. I pulsanti ordinari hanno altezza minima 48px; le azioni a icona 44px; i campi serie 52px. Le azioni finali della sessione diventano verticali su mobile.

## Elevation & Depth

Non sono presenti ombre. La profondità deriva da superfici verdi distinte e separatori. La finestra modale usa un fondale scuro semitrasparente (#091713c9), z-index della barra pari a 5 e scorrimento interno con altezza massima 85dvh.

**The Profondità tonale Rule.** Usare superficie, bordo e fondale per distinguere i livelli già presenti nel diario.

## Shapes

Campi e pulsanti condividono angoli da 8px; pannelli esercizio e scelta scheda da 12px; finestre da 16px. I bordi sono sottili, di 1px. Le icone sono SVG a tratto, generalmente 20px, con variante informativa da 18px.

## Components

### Buttons

Primario pieno con accento e inchiostro; secondario con superficie e bordo linea; pericolo con testo dedicato e bordo caldo. Peso 650 e padding del frontmatter. Gli hover cambiano la superficie senza spostamenti. Il focus visibile usa contorno di 3px e offset di 3px. I pulsanti disabilitati hanno opacità .4. Le azioni testuali usano accento e padding verticale di 8px.

### Cards / Containers

Pannelli esercizio senza ombra e senza bordo; padding del frontmatter, ridotto a 16px su mobile. Le schede A/B hanno anche un bordo linea e una transizione di background-color .15s ease. La spunta completata assume accento e inchiostro.

### Inputs / Fields

Campi scuri, bordo linea e focus comune. Il colore pericolo evidenzia input non validi non vuoti; placeholder secondario. Peso e ripetizioni usano input numerici e tastiere mobile appropriate. Variante sempre visibile; modifica nome in details/summary con area interattiva minima 44px.

### Navigation

Tre pulsanti orizzontali, testo secondario a riposo. La pagina corrente usa accento e sottolineatura di 1px, indicata da aria-current. Spazio tra pulsanti 28px, ridotto a 20px su mobile; testo da 16px a 14px.

### Finestra di approfondimento

Dialog nativo con larghezza massima 600px, larghezza disponibile meno 32px e scorrimento interno. Nome esercizio e icona informazioni aprono la scheda della variante; la chiusura restituisce il focus senza eliminare gli input. Il catalogo può contenere spiegazioni e immagini, ma non è presente una regola illustrativa da estendere.

### Barra di salvataggio

Fondo pagina, bordo superiore e stato testuale annunciato con role=status e aria-live=polite. Un pulsante secondario permette il salvataggio manuale.

Il sistema rispetta prefers-reduced-motion disattivando le transizioni. Non sono presenti animazioni decorative.

## Do's and Don'ts

### Do:
- **Do** mantenere l’identità verde scuro e il contrasto tra superficie e campi.
- **Do** mantenere i nomi modificabili nei dettagli espandibili e variante e serie direttamente accessibili.
- **Do** conservare il focus visibile e lo spazio inferiore che evita la sovrapposizione della barra fissa.

### Don't:
- **Don't** introdurre un nuovo mondo visivo nell’estensione del diario.
- **Don't** anteporre un titolo promozionale ai controlli operativi.
- **Don't** trasformare la sessione desktop in un cruscotto decorativo.
