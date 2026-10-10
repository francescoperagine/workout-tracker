---
version: 1
slug: "route-calendario"
primary_target: "route:/calendario"
related_targets: []
---

## Scope

Operate mode. Calendario: la settimana (e un mese compatto) con cosa è pianificato e cosa è stato fatto, più la pianificazione settimanale e le eccezioni per singola data. Flusso 5 (assegnare la scheda modificata al lunedì).

Storie: US-04, US-05, US-06, US-27 (accesso alle sessioni passate). Principi: P2, P3, P7, P10.

## Job and audience

L'utente controlla se è in linea con il programma ("ho saltato giovedì?") e, ogni tanto, cambia la pianificazione o sposta un singolo allenamento. Uso più riflessivo dell'allenamento attivo, ma ancora da telefono.

## Outcome and proof

- Settimana corrente in vista, scorrevole avanti e indietro; ogni giorno mostra la scheda pianificata e lo stato: fatto, saltato, oggi, futuro, riposo; eccezione segnalata.
- Giorno passato → la sessione (o le sessioni) di quel giorno; giorno futuro → scelta della scheda per quella data (eccezione) o modifica della pianificazione.
- Pianificazione settimanale: per ogni giorno da lunedì a domenica una scheda o "Riposo"; vale per le settimane future.
- Prova: "pianifico B il giovedì → giovedì Oggi propone B".

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi di interazione:** la settimana è una tabella oraria a righe (un giorno per riga), non una griglia di caselle minuscole: ogni giorno ha spazio per il nome della scheda e lo stato, e un target pieno da toccare.

## Scope and boundaries

- Dentro: settimana scorrevole, vista mese compatta (punti o segni per i giorni con sessione), editor della pianificazione settimanale in linea, eccezione per una data in un foglio dal basso.
- **Anti-obiettivi:** calendario mensile come vista principale su telefono; colore come unico indicatore di stato; pianificazione a testo libero (si assegna una scheda vera).

## States and ranges

- Settimane: dall'inizio dello storico a qualche settimana nel futuro. Sessioni per giorno: 0–2 (raramente più).
- Stati: nessuna pianificazione (invito a assegnare le schede); scheda archiviata ancora pianificata (avviso); giorno con più sessioni; sessione in un giorno di riposo; eccezione che diventa riposo.

## Interaction and layout

- Una riga per giorno con nome breve del giorno e data, scheda, stato (icona più testo). Oggi evidenziato.
- Nomi dei giorni da `WEEK_DAYS`/`DAY_NAMES`, date in ora locale.

## Constraints and open decisions

- **Aperto:** la vista mese serve davvero in v1 o basta la settimana scorrevole con salto rapido a una data?
