---
version: 1
slug: "route-storico"
primary_target: "route:/storico"
related_targets: ["route:/sessione", "route:/esercizio"]
---

## Scope

Operate mode. Storico e progressi: elenco delle sessioni (`/storico`), dettaglio modificabile di una sessione (`/sessione?id=…`) e pagina esercizio con grafici e record (`/esercizio?id=…`).

Storie: US-27, US-28, US-29, US-18 (riapertura di una sessione conclusa), US-20 (più sessioni nello stesso giorno). Principi: P3, P4, P9, P10.

## Job and audience

- A casa o tra una serie e l'altra: "quanto ho fatto di stacco la settimana scorsa?", "sto progredendo sulla panca?".
- Dopo l'allenamento: correggere una serie registrata male.

## Outcome and proof

- Elenco per data (più recente in alto), raggruppato per mese: data, scheda, durata, serie, volume, record.
- Dettaglio: stesse righe serie dell'allenamento attivo, modificabili; "Riapri"; eliminazione con conferma (o annulla).
- Pagina esercizio: grafici di **carico massimo**, **1RM stimato** (Epley, solo serie normali con ripetizioni ≤ 12) e **volume per sessione**, con selettore di periodo; record personali; cronologia delle serie. Varianti separate, riscaldamento escluso, unità scelta.
- Record: indicati nella riga serie al momento della spunta e nel riepilogo (US-29).

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1). Grafici in SVG scritto a mano, leggibili in entrambi i temi, secondo la skill dataviz.
- **Tesi:** un numero che conta (il record o l'ultimo valore) prima del grafico; il grafico mostra l'andamento, non decora.

## Scope and boundaries

- Dentro: elenco, dettaglio, pagina esercizio, ingresso dalla riga di un esercizio (nome) e dal calendario.
- **Anti-obiettivi:** cruscotto con molti grafici; librerie di grafici esterne; grafici senza valori leggibili; varianti mescolate nello stesso andamento.

## States and ranges

- Sessioni: da 0 a qualche centinaio (2–4 a settimana per anni). Punti per grafico: da 1 a qualche centinaio.
- Stati: storico vuoto (spiega dove compariranno le sessioni); esercizio con una sola sessione (niente linea, solo il valore); solo serie di riscaldamento (nessun dato per i grafici, spiegato); sessione in corso (in cima, con "Riprendi"); sessione importata dal PoC.

## Interaction and layout

- Una colonna; selettore di periodo come controllo segmentato standard; valori dei punti accessibili anche senza grafico (tabella o elenco).

## Constraints and open decisions

- **Deciso:** Storico è una voce della tab bar e include i progressi (pagina esercizio); nessuna sezione "Progressi" separata.
