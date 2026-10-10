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

- **Percorso felice (US-11):** le ultime 4 schede fatte (distinte, dalla più recente), più la pianificata per oggi se manca, come righe grandi da toccare; una è già selezionata come suggerimento (la pianificata, altrimenti la recente fatta da più tempo, così A/B si alternano). Sotto, nella zona del pollice, un grande "Inizia allenamento". 1 tocco se il suggerimento è giusto, 2 altrimenti; nessuna conferma.
- Ogni riga: nome della scheda, numero di esercizi, ultima volta ("giovedì", "12 giorni fa"), segno "Oggi" se pianificata.
- Alternative: "Altra scheda" (elenco completo in un foglio dal basso) e "Allenamento libero".
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
- Le righe delle schede sono un gruppo a scelta singola (le righe di scelta del design system, `.scelta`), non pulsanti primari: l'unica azione primaria resta "Inizia allenamento". Le 4 righe e "Inizia" entrano senza scorrere a 390×844; a 320×568 "Inizia" resta fisso sopra la tab bar.
- La striscia della settimana è leggibile senza colore (icona o testo per lo stato), toccabile per giorno.

## Constraints and open decisions

- **Deciso (US-11, 10 ottobre 2026):** la scheda suggerita è **già selezionata** e "Inizia allenamento" parte con 1 tocco; toccare un'altra riga la seleziona (2 tocchi), non avvia. Scartate dall'utente: nessuna preselezione (sempre 2 tocchi) e riga che avvia subito (rischio di avvio involontario, più azioni primarie in competizione).
- **Deciso:** accesso alle Impostazioni con un'icona nell'intestazione delle schermate principali, non come quinta voce della tab bar.
- Il builder non deve inventare: metriche motivazionali, streak, obiettivi non richiesti.
