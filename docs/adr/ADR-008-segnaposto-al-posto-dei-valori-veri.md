# ADR-008 — Segnaposto al posto dei valori veri: le serie entrano vuote, l'ultima volta e la scheda sono un suggerimento

Status: Accepted
Increment: INC-013

## Context

Da INC-004 (US-36) un esercizio che entrava in sessione aveva già scritti, come valori veri, kg e ripetizioni
dell'ultima volta (`prefillSets`, `defaultSets`). In palestra non si distingueva più il suggerito dal confermato:
i campi erano bianchi sia precompilati sia scritti. Senza storico, invece, le righe restavano vuote anche quando la
scheda aveva i target (Squat 6–8, 45 kg), e il segnaposto era il peso della serie sopra (`suggestedSets`). Revisione
di Francesco del 6 novembre 2026, feature `workout-gym-ux` (SPEC §3.1).

## Decision

- **Le serie entrano vuote** (avvio da scheda, esercizio aggiunto, variante). Spariscono `prefillSets`,
  `defaultSets` e `suggestedSets`; le sessioni già in corso con valori precompilati restano come sono.
- **Segnaposto** (`placeholderSets`): la serie dello stesso genere spuntata l'ultima volta (kg vuoto se era a corpo
  libero); altrimenti il target della voce della scheda: ripetizioni da `plannedReps` (intero, o limite basso di
  «a–b»; altro testo nessuno), kg da `loadMin` ma non su una variante; nessun target sul riscaldamento; altrimenti
  vuoto. In grigio (`text-muted`), i valori scritti a colore pieno.
- **La spunta e «Completa esercizio»** scrivono il segnaposto nei campi vuoti (`completedSet`, stessa fonte); senza
  ripetizioni né segnaposto la serie resta da fare e il cursore va al campo Rip, mai al kg.
- Il testo del timer («Prossima: …») usa la stessa fonte, ma le ripetizioni della scheda restano il testo intero
  («6–8»): lì informa, nel campo propone il valore che la spunta conferma.
- «Aggiungi serie» resta com'è: copia come valore vero il kg della serie sopra, ripetizioni vuote.
- Alternative scartate: tenere i valori veri distinguendoli con un colore (un valore precompilato e uno scritto
  restano lo stesso dato, e «Annulla» non saprebbe cosa togliere); tenere il peso della serie sopra come segnaposto
  (Francesco: «altrimenti vuoto»).

## Consequences

- Rovescia la scelta di INC-004: confermare l'ultima volta costa ancora un tocco per serie, ma ora si vede cosa è
  confermato.
- Senza storico, salire di peso va scritto riga per riga: il peso della serie sopra non è più il segnaposto.
- Togliere una spunta, o «Annulla» dopo ✓✓, lascia nei campi i valori che la spunta aveva scritto.
