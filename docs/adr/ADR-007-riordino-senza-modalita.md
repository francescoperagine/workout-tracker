# ADR-007 — Riordino senza modalità: si trascina dalla maniglia, «Sposta su/giù» nel menu o nella voce aperta

Status: Accepted
Increment: INC-012

## Context

Con il trascinamento (US-38, ADR-003) erano rimaste due strade per riordinare: la maniglia e una modalità
«Riordina» (in fondo all'allenamento, «Riordina esercizi»; accanto a «Esercizi» nell'editor della scheda) che
chiudeva le voci in righe con due frecce da 48 px. Trascinando, la lista passava alle stesse righe: le frecce non
servivano e il numero d'ordine stava a sinistra, sotto il dito (revisione di Francesco del 6 novembre 2026,
feature `workout-gym-ux`). PRODUCT.md chiede che nessun gesto sia l'unico modo.

## Decision

- **Via la modalità «Riordina» e le frecce**, nell'allenamento e nell'editor della scheda. Il riordino è il
  trascinamento dalla maniglia.
- Durante il trascinamento le voci diventano righe con la maniglia a sinistra e il **numero d'ordine a destra**.
- **L'alternativa al gesto** resta senza modalità: nell'allenamento «Sposta su/giù» nel menu ⋯ (c'era già);
  nell'editor «Sposta su» e «Sposta giù» dentro la voce aperta, sopra «Togli dalla scheda», con il focus che resta
  sul pulsante. Le frecce da tastiera sulla maniglia restano.
- Alternativa scartata: tenere la modalità come strada accessibile. Era una seconda interfaccia da imparare per la
  stessa azione, mentre i pulsanti nella voce aperta stanno dove si modifica già la voce.
- Fuori ambito: il riordino delle schede in `/routines/` (solo frecce, nessun trascinamento) resta com'è.

## Consequences

- Spostare una voce di molti posti senza il gesto costa un tocco per posto; il trascinamento resta la via veloce.
- Una voce si sposta solo aperta: nell'editor «Sposta su/giù» non si vede a voci chiuse.
