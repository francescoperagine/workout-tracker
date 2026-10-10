---
version: 1
slug: "route-allenamento"
primary_target: "route:/allenamento"
related_targets: []
---

## Scope

Operate mode. Allenamento attivo: la sessione in corso, dall'avvio a "Termina" e al riepilogo. È la superficie dove si passa più tempo e quella che decide il prodotto. Flussi: 1 (allenamento del giorno), 2 (interruzione), 3 (macchina occupata).

Storie: US-12, US-13, US-14, US-15, US-16, US-17, US-18, US-19, US-20, US-29 (indicazione del record), US-08 (uso delle alternative), US-33 (stato del salvataggio). Principi: P1, P2, P3, P4, P5, P7, P8, P10.

## Job and audience

L'utente in palestra, in piedi, telefono in una mano, 60–120 s tra una serie e l'altra, spesso interrotto. Non legge: guarda. Deve capire in un colpo d'occhio quale esercizio e quale serie viene ora, quanto caricare e quante ripetizioni fare, e cosa ha fatto la volta scorsa.

## Outcome and proof

- Una serie registrata in **1 tocco** se ripete la volta scorsa (la spunta su una riga vuota conferma i valori "precedente"), al massimo 2 campi più la spunta altrimenti (P1). Togliere la spunta annulla.
- La spunta della serie avvia il recupero (vedi brief del timer).
- Alla fine, "Termina" porta a un riepilogo: durata, esercizi, serie, volume, record battuti.
- Contenuto reale: schede A/B del PoC. Esempio: "2a Panca piana bilanciere · 6–8 · 40 kg · recupero 60–75″" in superserie con "2b Rematore manubri, petto su panca inclinata · 8–10 · 12–14 kg per manubrio".

## Selected direction

- **Autorità visiva:** il mondo del PoC (verde, operativo), esteso a chiaro e scuro nello step 1. Questo brief non sceglie colori né font.
- **Tesi di interazione:** la **riga serie è l'unità di lavoro**. `tipo/n · precedente · peso · rip · ✓`, con la spunta a destra nella zona del pollice. Tutto il resto (nomi, target, note) è contesto attorno alla riga.
- **Esercizio corrente in evidenza:** il primo esercizio con serie non spuntate è quello "attivo": target, variante e precedente visibili senza aprire nulla (P7). Gli esercizi completati si compattano ma restano modificabili.
- **Superserie:** gli esercizi del gruppo (2a/2b) sono visivamente legati; dopo la spunta di una serie di 2a il focus passa a 2b, e il recupero parte solo dopo l'ultimo del giro.

## Scope and boundaries

- Fidelity: schermata di produzione, flusso completo, interattiva.
- Dentro: elenco esercizi con target della scheda; selettore variante; righe serie; cambio tipo di serie toccando l'indice (1 → R → D → C → 1); aggiungi/togli serie con annulla; aggiungi esercizio (catalogo o nome libero); riordino; note sul carico; data e nome della sessione modificabili; barra fissa con durata, stato del salvataggio e "Termina"; riepilogo; approfondimento dell'esercizio in un foglio dal basso.
- Mini-barra persistente "allenamento in corso" sulle altre schermate (con il timer ridotto se attivo), che riporta qui con un tocco.
- **Anti-obiettivi:** cruscotto decorativo; card annidate; gesti come unico modo (lo swipe è solo scorciatoia); modali per inserire dati; tastiera che copre la riga che si sta compilando; animazioni sulla spunta che rallentano il tocco successivo.

## States and ranges

- Esercizi per sessione: tipico 6–8, massimo 100. Serie per esercizio: tipico 2–5, massimo 100.
- Nomi lunghi fino a ~45 caratteri ("Rematore manubri, petto su panca inclinata"): vanno a capo, mai troncati nella riga attiva.
- Peso: 0–300 kg con decimali (0,25 kg / 0,5 lb in visualizzazione), oppure carico non numerico nella scheda ("Bilanciere + 5 kg", "da tarare"). Ripetizioni: 1–30 o intervallo target ("6–8").
- Stati: sessione da scheda (serie precompilate vuote con precedente come suggerimento); allenamento libero (nessun esercizio: stato vuoto che insegna ad aggiungerne uno); esercizio senza storico ("precedente" vuoto, "—"); variante senza storico; serie spuntata; record battuto alla spunta; sessione conclusa riaperta; salvataggio riuscito / in corso / fallito (quota) / conflitto con un'altra scheda; "aggiungi almeno un esercizio prima di concludere".

## Interaction and layout

- Una colonna a 320–430 px; su desktop resta una colonna centrata (nessun layout a cruscotto).
- Gerarchia: nome esercizio (tocco = approfondimento) → variante → target (ripetizioni, carico, recupero) → righe serie → "Aggiungi serie".
- Campi: tastiera numerica, decimale per il peso; ≥ 48px; cifre ≥ 20px tabulari (P3). Toccare "precedente" copia peso e ripetizioni nella riga.
- "Aggiungi serie" riprende il peso dell'ultima serie con ripetizioni vuote. Rimuovere una serie con valori mostra "Annulla" per qualche secondo (P4).
- Cambio variante con valori già inseriti: conferma, poi le serie si svuotano (comportamento del PoC); "precedente" si riferisce alla variante scelta.
- Il selettore variante (foglio dal basso) ha le alternative della scheda più "Altro esercizio…": un campo di testo per scrivere l'esercizio fatto al posto di quello previsto, con i nomi simili del catalogo come suggerimento. Un nome nuovo diventa un esercizio personalizzato; la scheda non cambia. Il modello è già su `/kit`.
- Barra fissa in basso con safe area: durata, stato del salvataggio (`role=status`), "Termina". Le azioni frequenti restano nella metà inferiore (P2).
- Ricaricare, chiudere o bloccare riporta esattamente qui, alla stessa posizione (P5). Avviso `beforeunload` solo con modifiche non salvate.

## Constraints and open decisions

- Isola Svelte persistente tra le pagine (`transition:persist`), dati in kg anche se l'utente usa lb.
- **Deciso:** la spunta su una riga vuota conferma i valori precedenti (1 tocco, come Strong); senza precedente una riga vuota non si spunta.
- **Deciso:** il riepilogo è una schermata a sé dopo "Termina".
- Superserie (US-09, US-25), note sul carico (US-16), approfondimento (US-19) e più sessioni nello stesso giorno (US-20) sono M. Riordino degli esercizi in sessione (US-15) e data e nome modificabili anche in corso (US-27) sono criteri confermati.
- Fuori ambito v1: calcolatore dei dischi, calcolatore di riscaldamento, note per singola serie.
- Il builder non deve inventare: testi degli approfondimenti (oggi vuoti), regole di calcolo dei record oltre a quelle del piano.
