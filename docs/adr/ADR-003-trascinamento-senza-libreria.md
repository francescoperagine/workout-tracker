# ADR-003 — Trascinamento senza libreria

Status: Accepted
Increment: INC-006

## Context

Francesco vuole riordinare gli esercizi trascinandoli (US-38), nell'allenamento e nell'editor della scheda,
dove fino a INC-005 c'erano solo le frecce della modalità «Riordina». Il rischio è il telefono: la card di un
esercizio è alta (serie, campi, note), la lista non sta nello schermo e il dito deve poter scorrere la pagina
dal resto della card. Le superserie hanno già la loro regola (`moveKind`, `moveInList`): una voce si sposta
dentro il gruppo, un blocco non entra in un altro gruppo.

## Decision

- **Pointer Events, nessuna libreria.** Una maniglia (`src/components/ui/ReorderHandle.svelte`) con
  `touch-action: none`; il gesto è in `src/lib/reorder.ts` (`startDrag`) con le parti pure accanto
  (`dropIndex`, `shiftFor`, `edgeSpeed`, `unitStyle`). La regola è `moveToIndex`/`reorderUnit` in
  `routine-edit.ts`, accanto a `moveInList`.
- **La maniglia è il numero dell'esercizio**, con l'icona a sei punti sotto: la colonna c'è già e
  l'intestazione della card, che ha già «Completa» e ⋯, non perde spazio. Sull'intestazione «Superserie» c'è la
  maniglia del gruppo intero.
- **Al primo movimento la lista passa alle righe del riordino** (quelle delle frecce) e la pagina scorre finché
  la riga trascinata è sotto il dito; le altre righe si spostano con `transform` per farle posto e l'ordine si
  salva solo al rilascio. Niente riordino dal vivo del DOM: i centri si misurano una volta e il posto di
  rilascio non oscilla. Gli ascoltatori sono su `window`, perché la maniglia premuta sparisce con la card.
- Tastiera: Su e Giù sulla maniglia spostano di un posto con annuncio «{nome}: posizione N di M»; restano le
  frecce di «Riordina» e si aggiungono «Sposta su» e «Sposta giù» nel foglio ⋯ della sessione.

## Consequences

- Zero dipendenze nuove; il gesto è circa 150 righe tra `reorder.ts` e la maniglia, usate da `Workout.svelte`,
  `RoutineEditor.svelte` e `/kit`.
- Il passaggio alle righe compatte cambia il layout sotto il dito: provato con tocchi veri via CDP
  (`Input.dispatchTouchEvent`) a 390×844 e 320×568. La prova sul telefono non è stata possibile a INC-006
  (nessun dispositivo collegato): resta da fare.
- Le righe che fanno posto si spostano dell'altezza della riga trascinata: con righe di altezza molto diversa
  (nome su tre righe accanto a una su una) lo spazio vuoto è approssimato, il posto di rilascio no.

## Alternatives Considered

- **Una libreria** (SortableJS, `svelte-dnd-action`): tocco e tastiera già fatti, ma una dipendenza per un gesto
  solo, da adattare alla regola delle superserie e al passaggio alle righe compatte. Scartata (AGENTS.md, regola 8).
- **Drag and drop HTML5**: non funziona con il tocco su Android e iOS.
- **Riordino dal vivo del DOM** durante il gesto: più semplice da disegnare, ma con le card ricreate a ogni
  scambio il posto oscilla vicino ai bordi e il focus si perde.
- **Maniglia come terza icona nell'intestazione**: a 320px toglie altri 48px a un titolo che va già a capo.
