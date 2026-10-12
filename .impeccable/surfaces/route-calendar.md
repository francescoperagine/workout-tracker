---
version: 1
slug: "route-calendar"
primary_target: "route:/calendar"
related_targets: []
---

## Scope

Operate mode. Calendario: la settimana (e un mese compatto) con cosa è pianificato e cosa è stato fatto, più la pianificazione settimanale e le eccezioni per singola data. Flusso 5 (assegnare la scheda modificata al lunedì).

Storie: US-04, US-05, US-06, US-27 (accesso alle sessioni passate). Principi: P2, P3, P7, P10.

## Job and audience

L'utente controlla se è in linea con il programma ("ho saltato giovedì?") e, ogni tanto, cambia la pianificazione o sposta un singolo allenamento. Uso più riflessivo dell'allenamento attivo, ma ancora da telefono.

## Outcome and proof

- Finestra di 7 giorni che parte da oggi (oggi e i 6 giorni dopo), scorrevole avanti e indietro di 7 giorni; sulla finestra di partenza l'etichetta «Prossimi 7 giorni», sulle altre il pulsante «Torna a oggi»; ogni giorno mostra la scheda pianificata e lo stato: fatto, saltato, oggi, futuro, riposo; eccezione segnalata.
- Il foglio del giorno è anche il posto dove si aggiunge: giorno futuro o oggi → scelta della scheda per quella data (eccezione) o modifica della pianificazione, più «+ Nuova scheda» che la crea, la assegna a quella data e apre l'editor (che torna qui con il foglio aperto); oggi → avvio dell'allenamento in programma («Inizia «Scheda A»», o allenamento libero se riposo o niente); giorno passato → la sessione (o le sessioni) di quel giorno e «Registra un allenamento fatto», che la avvia con quella data (compare anche se il giorno ha già allenamenti); con un allenamento in corso, in qualsiasi giorno, «Riprendi l’allenamento in corso» al posto dei pulsanti di avvio.
- Pianificazione settimanale: per ogni giorno da lunedì a domenica una scheda o "Riposo"; vale per le settimane future.
- Prova: "pianifico B il giovedì → giovedì Oggi propone B".

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi di interazione:** la settimana è una tabella oraria a righe (un giorno per riga), non una griglia di caselle minuscole: ogni giorno ha spazio per il nome della scheda e lo stato, e un target pieno da toccare.

## Scope and boundaries

- Dentro: finestra di 7 giorni scorrevole, vista mese compatta (punti o segni per i giorni con sessione), editor della pianificazione settimanale in linea, eccezione per una data in un foglio dal basso, che è anche il posto dove si crea una scheda e si avvia (o si registra a posteriori) un allenamento.
- **Anti-obiettivi:** calendario mensile come vista principale su telefono; colore come unico indicatore di stato; pianificazione a testo libero (si assegna una scheda vera).

## States and ranges

- Finestre: dall'inizio dello storico a circa 26 settimane nel futuro; la finestra può cominciare in qualsiasi giorno, quella di partenza comincia da oggi. Sessioni per giorno: 0–2 (raramente più).
- Stati: nessuna scheda (pannello «Per pianificare serve una scheda.» con «Crea scheda»); schede ma nessuna pianificazione (invito ad assegnare le schede); prima apertura (suggerimento «Tocca un giorno per pianificarlo, iniziare l’allenamento o registrarne uno fatto.», che non torna dopo il primo foglio aperto); scheda archiviata ancora pianificata (avviso); giorno con più sessioni; sessione in un giorno di riposo; eccezione che diventa riposo.

## Interaction and layout

- Una riga per giorno con nome breve del giorno e data, scheda, stato (icona più testo). Oggi evidenziato.
- Nomi dei giorni da `WEEKDAY_SHORT`/`WEEKDAY_LONG` (`src/lib/format.ts`), date in ora locale.

## Constraints and open decisions

- **Deciso:** la vista mese compatta è nella v1, accanto alla settimana scorrevole (che resta la vista principale su telefono).
- **Deciso (step 9, critique dei flussi):** nel foglio di un giorno da oggi in poi viene prima la settimana tipo di quel giorno («Ogni martedì», un menu che salva subito: US-04 è M), poi l'eccezione per la sola data («Solo il 13 ottobre»: «Come ogni martedì», «Riposo», le schede).
