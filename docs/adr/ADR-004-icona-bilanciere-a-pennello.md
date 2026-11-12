# ADR-004 — Icona: il bilanciere a pennello su grigio molto scuro

Status: Accepted
Increment: INC-008

## Context

L'icona della PWA era un manubrio lime su verde scuro, praticamente uguale a quella di Strong, che Francesco
tiene accanto sul telefono. La nuova icona viene dall'illustrazione a pennello del sito
(`personal-website/src/assets/projects/workout-tracker-hero.webp`, nero su carta), che così com'è non regge da
icona: tratti sottili, proporzioni larghe, dischi fuori dalla zona sicura maskable. Nello stesso giro Francesco
ha indicato la palette che verrà (inchiostro `#111111`, carta `#FAFAF7`, sfondo scuro `#1C1C1E`, accento rosso),
ma il passaggio dell'app a quella palette non è in questa feature.

## Decision

- **Variante A, solo il bilanciere** (scelta di Francesco sul foglio di confronto): i due dischi veri
  dell'illustrazione avvicinati, barra piena, tratti ispessiti. Scartata la B (figura con bilanciere): più
  carattere, ma a 16–48 px diventa una macchia.
- **Tratto carta `#FAFAF7` su `#1C1C1E`**, i soli neutri della palette nuova; nessun accento nell'icona.
  Scartata la versione su bianco con bordo grigio.
- **Sorgente vettoriale versionata** in `scripts/icon-source/`: i master raster ricavati dall'illustrazione,
  ripuliti dalle punte del tratto originale nei dischi, vettorializzati una volta con potrace. Due spessori come
  una dimensione ottica: `barbell.svg` per 192/512, `barbell-bold.svg` per il favicon. `scripts/make-icons.mjs`
  genera tutto da lì con sharp, senza dipendere dall'altro repository né da potrace.
- **Manifest a `#1C1C1E`** (avvio e colore del tema); il `<meta name="theme-color">` resta sul token `shell`
  finché non cambia la palette dell'app, perché colora la barra del browser accanto all'intestazione.

## Consequences

- L'icona si distingue da Strong a ogni taglia; il favicon resta leggibile a 16 px.
- Rigenerare i master dall'illustrazione non è più possibile dal repository (lo strumento delle varianti è stato
  cancellato con la feature, resta nella cronologia git): si modificano gli SVG.
- Con la nuova palette andranno riallineati il meta `theme-color` e, se serve, il fondo dell'icona.

## Revisione (INC-042)

Francesco ha chiesto che il favicon sia la stessa immagine dell'icona installata: `make-icons.mjs` lo genera ora da
`barbell.svg`, e `barbell-bold.svg` è stato cancellato. Si rinuncia alla dimensione ottica a 16–48 px.
