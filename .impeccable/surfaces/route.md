---
version: 1
slug: "route"
primary_target: "route:/"
related_targets: []
---

## Scope

Operate mode. Oggi: la schermata di apertura dell'app (prima voce della tab bar). Risponde a "cosa faccio oggi?" e avvia o riprende l'allenamento. Flussi: 1 (allenamento del giorno, punto di partenza), 4 (primo avvio, arrivo dopo il benvenuto).

Storie: US-11, US-17 (Riprendi), US-05 (settimana in breve), US-03 (invito all'installazione). Principi: P2, P7, P8, P10.

## Job and audience

L'utente apre l'app entrando in palestra o negli spogliatoi, spesso con la rete assente. Vuole iniziare subito: un tocco. Altre volte la apre a casa per vedere quando si è allenato l'ultima volta.

## Outcome and proof

- La scheda pianificata per oggi con un grande "Inizia allenamento" nella zona del pollice. Contenuto: nome della scheda, numero di esercizi, durata stimata se calcolabile dallo storico, primi esercizi.
- Alternative: "Altra scheda" e "Allenamento libero".
- Se c'è una sessione in corso il pulsante principale diventa "Riprendi" (con durata trascorsa ed esercizio corrente).
- Ultimo allenamento: data, scheda, serie, eventuale record.

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi di interazione:** una sola azione primaria per stato. La schermata è un trampolino verso l'allenamento, non un cruscotto: niente statistiche decorative.

## Scope and boundaries

- Dentro: intestazione con data di oggi e accesso alle impostazioni; blocco "oggi" con azione primaria; striscia della settimana (fatto/saltato/pianificato) che porta al Calendario; ultimo allenamento; invito discreto all'installazione dopo il primo allenamento concluso (US-03).
- **Anti-obiettivi:** saluti o titoli promozionali sopra l'azione; grafici; card annidate; più pulsanti primari in competizione.

## States and ranges

- Oggi con scheda pianificata; giorno di riposo (azione primaria diventa "Allenati comunque", con scelta della scheda); nessuna pianificazione (invito a pianificare, più avvio libero); sessione in corso (Riprendi); allenamento di oggi già concluso (riepilogo breve, "Riapri" o "Nuova sessione"); eccezione per oggi (scheda diversa dalla settimanale, segnalata).
- Archivio vuoto: rimanda al primo avvio (`/benvenuto`) se non ancora visto.
- Errore di archivio illeggibile o conflitto tra schede: messaggio in linea, mai un'azione che sovrascrive.

## Interaction and layout

- Una colonna; l'azione primaria cade nella metà inferiore a 390×844 senza scorrere; tab bar in basso (Oggi, Calendario, Schede, Storico).
- La striscia della settimana è leggibile senza colore (icona o testo per lo stato), toccabile per giorno.

## Constraints and open decisions

- **Deciso:** accesso alle Impostazioni con un'icona nell'intestazione delle schermate principali, non come quinta voce della tab bar.
- Il builder non deve inventare: metriche motivazionali, streak, obiettivi non richiesti.
