# ADR-006 — Rosso di riempimento per il pulsante distruttivo, separato dal rosso del testo

Status: Accepted
Increment: INC-011

## Context

ADR-005 aveva un solo rosso, `danger` (`#BE123C` / `#FF7A8A`), usato sia per il testo degli errori sia come
fondo del pulsante distruttivo, con `on-danger` bianco in chiaro e nero in scuro. In scuro `danger` è chiaro,
perché deve leggersi come testo sul fondo grafite: come fondo pieno diventava rosa e stonava con il vermiglio
dell'accento («Annulla allenamento», revisione di Francesco del 6 novembre 2026, feature `workout-gym-ux`).

## Decision

- **Un token di riempimento a sé, `danger-fill`** (`#C81E1E` in chiaro, `#DF3124` in scuro), con `on-danger`
  bianco nei due temi. `danger` resta il colore del testo d'errore, invariato.
- Il valore scuro è stato scelto nella finestra stretta in cui il rosso regge entrambe le soglie: bianco sopra
  ≥ 4,5:1 (4,56) e il pulsante sulla superficie scura `#2A2A2D` ≥ 3:1 (3,14; sul fondo 3,73). Il primo valore
  proposto, `#D92D20`, sulla superficie faceva 2,96; Francesco ha scelto `#DF3124` il 6 novembre 2026.
  Alternativa scartata: tenere `#D92D20` e togliere la coppia sulla superficie, perché il pulsante rosso vive
  proprio su fogli e conferme.
- Al passaggio il rosso si scurisce (12% di nero) invece di velarsi di `text`: con il bianco sopra, in scuro un
  velo chiaro avrebbe abbassato il contrasto del testo.
- Le coppie stanno in `src/styles/contrast.test.ts`: `on-danger` su `danger-fill` ≥ 4,5:1, `danger-fill` su `bg`
  e `surface` ≥ 3:1.

## Consequences

- Due rossi da tenere d'accordo: un tema nuovo definisce sia `danger` (testo) sia `danger-fill` (fondo).
- Il pulsante distruttivo ha lo stesso aspetto, bianco su rosso pieno, nei due temi; ADR-005 resta valido per
  il resto della palette.
