---
version: 1
slug: "route-history"
primary_target: "route:/history"
related_targets: ["route:/session", "route:/exercise"]
---

## Scope

Operate mode. Storico e progressi: elenco delle sessioni (`/history`), dettaglio di sola lettura di una sessione (`/session?id=…`) e pagina esercizio con grafici e record (`/exercise?id=…`).

Storie: US-27, US-28, US-29, US-18 (riapertura di una sessione conclusa), US-20 (più sessioni nello stesso giorno). Principi: P3, P4, P9, P10.

## Job and audience

- A casa o tra una serie e l'altra: "quanto ho fatto di stacco la settimana scorsa?", "sto progredendo sulla panca?".
- Dopo l'allenamento: correggere una serie registrata male.

## Outcome and proof

- Elenco per data (più recente in alto), raggruppato per mese: data, scheda, durata, serie, volume, record.
- Dettaglio: registro di sola lettura, solo gli esercizi con serie fatte e le serie fatte in una riga; icona dei progressi (pagina dell'esercizio), senza ⓘ; per correggere le serie "Riapri"; eliminazione con conferma (o annulla).
- Pagina esercizio: grafici di **carico massimo**, **1RM stimato** (Epley, solo serie normali con ripetizioni ≤ 12) e **volume per sessione**, con selettore di periodo; record personali; cronologia delle serie. Alternative e varianti separate, riscaldamento escluso, unità scelta.
- Record: indicati nella riga serie al momento della spunta e nel riepilogo (US-29).

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1). Grafici in SVG scritto a mano, leggibili in entrambi i temi, secondo la skill dataviz.
- **Tesi:** un numero che conta (il record o l'ultimo valore) prima del grafico; il grafico mostra l'andamento, non decora.

## Scope and boundaries

- Dentro: elenco, dettaglio, pagina esercizio, ingresso dalla riga di un esercizio (nome) e dal calendario.
- **Anti-obiettivi:** cruscotto con molti grafici; librerie di grafici esterne; grafici senza valori leggibili; esercizi diversi (alternative, varianti) mescolati nello stesso andamento.

## States and ranges

- Sessioni: da 0 a qualche centinaio (2–4 a settimana per anni). Punti per grafico: da 1 a qualche centinaio.
- Stati: storico vuoto (spiega dove compariranno le sessioni); esercizio con una sola sessione (niente linea, solo il valore); solo serie di riscaldamento (nessun dato per i grafici, spiegato); sessione in corso (in cima, con "Riprendi"); sessione importata dal PoC.

## Interaction and layout

- Una colonna; misura e periodo come controlli segmentati compatti su una riga sopra il grafico (INC-019); valori dei punti accessibili anche senza grafico (tabella o elenco).

## Constraints and open decisions

- **Deciso (INC-034, delavier-catalog, ADR-005):** sagoma del corpo (`BodyMap`), davanti e dietro affiancati, zone di MuscleMap con un contorno a inchiostro. In Progressi sopra le barre di «Serie per muscolo», un colore solo (`accent-indicator`) con l'intensità relativa al massimo del periodo; ogni gruppo è un pulsante («Sagoma, Petto: 3 serie») che apre il suo foglio. Nella tab Info in testa a «Muscoli», sulla scala dei muscoli (giallo, arancione, rosso mattone) con la legenda scritta. Il popliteo non si disegna.
- **Deciso (INC-033, delavier-catalog):** nel foglio «<Gruppo>: serie per settimana», sotto il grafico e separata da un filo, la sezione «Esercizi, tutte le settimane» con le righe di Progressi (`ExerciseRow`) e una riga in più: serie date al gruppo, già pesate, e «ogni serie conta 0,5». Il tocco su un punto filtra sulla settimana («Esercizi, 5–11 ottobre»), un secondo tocco sullo stesso punto o «Tutte le settimane» (testo, accanto al titolo) toglie il filtro; l'elenco tiene l'altezza di quello intero, così il grafico non salta. Nella pagina dell'esercizio il tocco su un punto evidenzia la riga della cronologia con il bordo `accent-indicator` di 2px (come l'esercizio corrente) e `aria-current`, senza focus né scorrimento.
- **Deciso (INC-032, delavier-catalog):** Progressi è anche il catalogo: sotto «Serie per muscolo», separata da un filo, la sezione «Esercizi» con il campo «Cerca per nome» (nome e alias, come la scelta degli esercizi), l'interruttore «Solo fatti» acceso a ogni apertura e l'elenco alfabetico (anche durante la ricerca) di catalogo e personalizzati; la riga di un esercizio mai fatto ha «–» sotto il nome («mai fatto» per lo screen reader). La pagina dell'esercizio ha due tab sotto il titolo: «Progressi» (grafico, record, cronologia; per prima) e «Info» (muscoli con la quota di una serie, «Personalizza i muscoli» o l'editor e «Unisci in…», approfondimento con gli altri nomi); un esercizio mai fatto ha in Progressi il messaggio e il link «Muscoli e informazioni». Tra le sezioni di una tab un filo `border` (regola del filo, DESIGN.md). I link di «Senza muscoli» aprono Info.
- **Deciso (INC-027):** ogni barra di «Serie per muscolo» è un pulsante a tutta riga (almeno 48px, freccia dopo il valore) che apre un foglio «<Gruppo>: serie per settimana» con `ProgressChart`: un punto per settimana, le ultime 12 concluse più quella in corso, la nota sotto il valore dice la settimana («Settimana 3–9 novembre») o «Settimana in corso, parziale».
- **Deciso (INC-025):** Progressi apre con «Serie per muscolo»: titolo e periodo compatto («Settimana», «4S», «12S») su una riga, barre orizzontali sottili in `accent-indicator` sotto etichetta e valore scritti (un decimale al più), poi la riga di lettura in `text-muted`, «Nessuna serie: …» (tutti i gruppi a zero; fino a INC-030 tranne addominali e avambracci) e «Senza muscoli: N serie» con i link alle pagine degli esercizi. Niente tooltip: ogni valore è già scritto e l'elenco è la vista accessibile.
- **Deciso (INC-024, ADR-013):** la pagina dell'esercizio chiude con «Muscoli», visibile anche senza storico. Catalogo: «Principali» e «Secondari» in sola lettura e «Personalizza i muscoli» (secondario), che apre un foglio con il nome proposto e le conseguenze; «Crea» è la conferma e porta alla pagina della variante, con l'avviso «Annulla». Personalizzato: griglia di pulsanti da 56px, uno per gruppo, nessuno (bordo dei controlli) → principale (pieno d'accento) → secondario (bordo in inchiostro raddoppiato), con lo stato scritto sotto il nome; nella variante «Basata su <originale>».
- **Deciso (INC-020):** la ⓘ esce dal dettaglio dell'allenamento: l'approfondimento ripeteva la pagina dei progressi. Un esercizio scelto per sbaglio si corregge dalla cronologia della pagina dell'esercizio, riga per riga («Era un altro esercizio», US-42), non dal dettaglio e non spostando tutto lo storico: è una correzione occasionale di un allenamento, con «Annulla» nell'avviso.
- **Deciso (INC-019):** nella pagina dell'esercizio il grafico viene prima dei record. Sopra la trama il valore del punto scelto con il confronto con l'allenamento precedente della stessa misura, cercato su tutto lo storico anche fuori dal periodo; sotto la trama le serie di quel punto e «Apri l’allenamento». I record stanno in una riga da tre, con la data scritta una volta se vengono tutti dallo stesso allenamento. Con un punto solo niente trama: valore, confronto e serie.
- **Deciso (INC-015, rovescia la scelta dello step 8):** i progressi hanno la loro tab «Progressi» (`/progress/`, con la pagina dell'esercizio); lo Storico tiene solo gli allenamenti, senza l'interruttore Allenamenti / Esercizi. Le misure del corpo andranno nella tab Progressi con una feature a sé.
- **Deciso (step 9, critique dei flussi):** l'allenamento in corso è una riga «In corso» in cima all'elenco, che porta all'allenamento; «Riprendi» resta solo nella mini-barra, per non averlo due volte. I record della riga si contano per esercizio («Record in 3 esercizi»), non per misura; l'1RM stimato è arrotondato al mezzo chilo.
