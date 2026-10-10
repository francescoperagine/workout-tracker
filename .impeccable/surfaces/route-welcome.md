---
version: 1
slug: "route-welcome"
primary_target: "route:/welcome"
related_targets: ["route:/"]
---

## Scope

Operate mode (onboarding di un'app, non una landing). Primo avvio: una schermata breve che appare una sola volta con l'archivio vuoto. Flusso 4 (primo avvio → schede di esempio → primo allenamento).

Storie: US-01, US-02 (ingresso all'import del PoC), US-11 (passaggio a Oggi). Principi: P4, P6, P8, P10.

## Job and audience

- Il visitatore del sito che prova l'app: curioso, nessun dato, nessun account. Deve capire in pochi secondi cosa fa l'app e che **i dati restano sul suo telefono**.
- L'utente del PoC che arriva con il proprio backup: deve trovare subito "Importa il diario".

## Outcome and proof

- Tre informazioni: cosa fa (schede, serie, recupero, progressi), dove sono i dati (solo su questo dispositivo, nessun account, funziona offline), come iniziare.
- Azioni: "Inizia con le schede di esempio" (primaria, carica le schede A/B del PoC), "Parti da zero", "Importa un backup".
- Dopo la scelta si arriva a Oggi, già pronta a "Inizia allenamento".

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi:** una schermata, non un carosello. Il messaggio sulla privacy è un fatto detto in una riga, non una promessa di marketing.

## Scope and boundaries

- Dentro: testo breve, tre azioni, link a "Dati e privacy" per i dettagli (backup, limiti del browser, iOS).
- **Anti-obiettivi:** richiesta di permessi (notifiche, installazione) all'avvio; slide multiple; illustrazioni decorative; frasi promozionali.

## States and ranges

- Primo avvio; ritorno dopo "Parti da zero" (non viene più mostrata); import riuscito (anteprima e conferma nel flusso di import, poi Oggi); import fallito (errore leggibile, nessun dato toccato).
- Se l'app è pubblicata sulla stessa origine del PoC e la chiave `bodytracker.archivio.v1` esiste: proposta in evidenza "Ho trovato il diario della versione precedente: importalo".

## Interaction and layout

- Una colonna, azioni in basso nella zona del pollice; leggibile a 320×568 senza scorrere, o con lo scorrimento solo del testo.

## Constraints and open decisions

- **Deciso:** schermata dedicata `/welcome`, mostrata una sola volta con l'archivio vuoto.
- Il builder non deve inventare affermazioni su sicurezza o cifratura: l'app non cifra i dati.
