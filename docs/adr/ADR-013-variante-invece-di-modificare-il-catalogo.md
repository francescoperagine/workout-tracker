# ADR-013 — Variante invece di modificare il catalogo

Status: Accepted
Increment: INC-024

## Context

Ogni esercizio di catalogo ha muscoli fissati in `src/data/catalog.ts` (ADR-010, ADR-011). Un utente può non essere
d'accordo con la mappa, o fare l'esercizio in un modo che sposta il lavoro. Serve un modo di cambiare i muscoli senza
rompere la mappa comune né lo storico. Fonti: SPEC di muscle-volume, D6, D7, D17 e risposte 7 e C di Francesco;
`docs/archive/features/INC-027_muscle-volume-research/opzioni-domande.md`, domanda 6 (Hevy non documenta la modifica degli esercizi di
libreria; MacroFactor gira nessuno → principale → secondario al tocco).

## Decision

1. **Il catalogo non cambia mai.** Cambiare i muscoli di un esercizio di catalogo crea una **variante**: un
   personalizzato con i muscoli copiati e `variantOf` = l'originale (`createVariant` in `src/lib/archive/catalog.ts`).
   Nome proposto «<nome> (personalizzato)», poi «(personalizzato 2)», … (`proposeVariantName`).
2. **La variante sostituisce l'originale nelle schede attive** (esercizio e alternative). Sessioni, anche quella in
   corso, e schede archiviate restano sull'originale.
3. **Conferma = il foglio** che dice le conseguenze (schede che cambiano, storico che resta, record da zero), senza un
   `ConfirmDialog` in più: l'azione si annulla (domanda C, predefinito C1).
4. **«Annulla» = `mergeExercise(archivio, variante, originale)`:** la variante appena creata compare solo nelle schede
   appena cambiate, quindi l'unione è l'inverso esatto (test in `catalog.test.ts`). Nessuna funzione nuova.
5. **I muscoli di un personalizzato si cambiano in linea** (`setCustomMuscles`, un tocco = un salvataggio); un muscolo
   non sta in entrambe le liste.
- Alternative scartate: modificare la mappa per utente sopra il catalogo (conflitti con gli aggiornamenti della mappa
  e un «Ripristina predefinito» da gestire); riscrivere lo storico dell'originale sulla variante (opzione D,
  `opzioni-domande.md`: cancellerebbe i progressi dell'originale); foglio più `ConfirmDialog` (due conferme per
  un'azione che si annulla).

## Consequences

- La variante non riceve le correzioni successive della mappa del catalogo.
- Record e grafico della variante partono da zero: lo storico resta sull'originale (accettato da Francesco).
- Cambiare i muscoli di un personalizzato cambia anche le settimane passate del volume (ADR-012): voluto, serve a
  sistemare gli esercizi «Senza muscoli».
- L'avviso con «Annulla» vive nella pagina della variante (`&created=1`, tolto con `history.replaceState`): dopo un
  ricaricamento non torna, e la variante si toglie con l'unione di US-35.
