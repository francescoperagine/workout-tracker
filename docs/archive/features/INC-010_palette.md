# SPEC — Palette a ruoli (vermiglio, rosso per gli errori, indaco per i record)

Livello Feature. Cambia **solo il colore**: niente layout, spaziature, tipografia né icone ridisegnate.
Fonte dei valori: il blocco `@theme` di `src/styles/global.css` (unico punto con i valori).

## Ruoli

| Ruolo | Chiaro | Scuro |
|---|---|---|
| `bg` | #FAFAF7 | #1C1C1E |
| `surface` | #FFFFFF | #2A2A2D |
| `text` | #111111 | #FAFAF7 |
| `text-muted` | #6B6B70 | #A1A1AA |
| `border` | #E4E4E7 | #3F3F46 |
| `border-control` | #6B6B70 | #A1A1AA |
| `accent`, `accent-indicator` | #E85A2A | #FF7A45 |
| `on-accent` | #111111 | #111111 |
| `accent-pressed` | #F97316 | #FF7A1A |
| `accent-text` | #B8401F | #FF7A45 |
| `accent-tint` | `accent-text` 8% su `surface` | `accent` 10% su `surface` |
| `done` / `on-done` | #111111 / #FAFAF7 | #FAFAF7 / #111111 |
| `danger` | #BE123C | #FF7A8A |
| `on-danger` (testo su `btn-danger`, che ora è pieno) | #FFFFFF | #111111 |
| `highlight` | #165E83 | #8AB4E8 |
| `backdrop` / `shadow` | nero 60% / nero 28% | uguali |

Eliminati: `field` (→ `bg`), `warning-*`, `danger-bg`, i 13 `shell-*`, `level`, i rossi #D0202E, #DC2A36,
#FF6363, #FF6B6B, #A8141F, #EF3340.

## Regole d'uso

- Nessun verde, nemmeno per i successi. Accento solo per ciò che chiede azione o è in corso.
- Un solo `btn-primary` visibile per schermata; azioni secondarie neutre (`border-control` + `text`).
- `danger` solo per errori e azioni distruttive, sempre icona + testo (serve anche a chi distingue male
  arancione e rosso); le distruttive hanno la conferma.
- `highlight` solo per trofei/record (`.record` in `SetRow`) e per la seconda serie quando un grafico
  confronta due esercizi (oggi nessun grafico lo fa). Mai pulsanti, link o stati.
- Grafici: serie principale `accent-indicator`, confronto `text-muted` (o `highlight` se è un secondo
  esercizio), griglia `border`. Focus: 2px `accent-indicator`. Disabilitato: `text-muted` su `surface`,
  mai accento sbiadito. `::selection`: `accent-tint` con `text`. `accent-indicator` solo bordi e barre,
  mai fondo di testo. Campi: fondo `bg`, bordo `border-control`.
- Guscio (intestazione, tab bar, barre, timer) segue il tema su `surface` (ADR-005, opzione A). Tab attiva:
  `text` + grassetto + icona piena + indicatore 2px in `text`; inattive `text-muted`.
- Serie completata: nessun fondo, lo stato è la spunta piena `done` + `on-done`.
- Avvisi ex ambra: errori veri → `danger`; informativi → `text-muted` + icona Info + riquadro `border`;
  serie vuote segnalate → bordo `accent-indicator` + testo `accent-text`.
- `theme-color`: due meta con `media`, valore `bg` del tema (`THEME_COLORS` in `src/lib/theme.ts`,
  riallineati dallo script inline quando il tema è forzato); manifest `#1C1C1E`. Barra di stato iOS:
  `default` nel chiaro, `black-translucent` nello scuro.

## Verifica

- `src/styles/contrast.test.ts` è l'arbitro: testi (`text`, `text-muted`, `accent-text`, `danger`,
  `highlight`) su `bg`/`surface`/`accent-tint` ≥ 4,5; `on-accent` su `accent`/`accent-pressed`,
  `on-danger` su `danger`, `on-done` su `done` ≥ 4,5; `border-control`, `accent-indicator`, `accent` su
  `bg`/`surface` ≥ 3; nessun valore di colore fuori dai token. **Se una coppia fallisce: fermarsi e
  proporre la correzione a Francesco, mai aggirarla.** Stato al passaggio di consegne: 61/61 verdi.
- Eccezioni motivate: `src/lib/theme.ts` (copia dei due `bg`, verificata dal test), `public/favicon.svg`
  (immagine), `SetInput` in una serie completata resta senza bordo (è testo letto, non un campo da
  compilare: va riferita a Francesco).

## ADR

ADR-005: il guscio segue il tema (opzione A contro B: guscio scuro fisso) e la barra di stato iOS `default`
nel chiaro; inoltre il passaggio dal rosso al vermiglio, perché accento e `danger` coincidevano e un errore
non si distingueva da un'azione; `highlight` indaco per i record.
