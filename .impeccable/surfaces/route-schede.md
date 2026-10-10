---
version: 1
slug: "route-schede"
primary_target: "route:/schede"
related_targets: ["route:/scheda"]
---

## Scope

Operate mode. Schede: elenco (`/schede`) ed editor di una scheda (`/scheda?id=…`). Sono i template da cui partono le sessioni: modificarne una non riscrive le sessioni passate. Flusso 5 (cambio programma: duplicare la scheda A, modificarla, assegnarla al lunedì).

Storie: US-07, US-08, US-09, US-10. Principi: P2, P4, P8, P10.

## Job and audience

L'utente cambia programma ogni qualche settimana, di solito a casa o in panchina, con calma ma ancora spesso da telefono. Deve tradurre in app un programma scritto (es. "2a Panca piana 6–8, 40 kg, rec. 60–75″").

## Outcome and proof

- Elenco: schede attive (nome, numero di esercizi, giorni a cui è assegnata, ultima volta usata) e archiviate a parte. Azioni: crea, duplica, rinomina, riordina, archivia; elimina solo se non ha sessioni (altrimenti si archivia), con conferma.
- Editor: voci in ordine; per ogni voce esercizio dal catalogo (ricerca) o nome libero, serie, ripetizioni (anche intervallo), carico (anche intervallo, nell'unità scelta, con nota tipo "da tarare" o "Bilanciere + 5 kg" e unità "per manubrio"), recupero e recupero di riscaldamento in min:s, alternative.
- Superserie: raggruppare due o più voci consecutive (2a/2b); il gruppo si vede come tale anche in sessione.
- Prova: le schede A/B del PoC si possono ricreare identiche nell'editor.

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi di interazione:** l'editor si legge come la scheda di carta: una riga per voce con i target in forma compatta ("6–8 · 40 kg · 1:15"), che si espande per la modifica in linea. Nessuna modale per modificare una voce (P8); la ricerca nel catalogo è un foglio dal basso.

## Scope and boundaries

- Dentro: elenco, editor, ricerca nel catalogo con creazione di un esercizio personalizzato, riordino con frecce accessibili (trascinamento facoltativo), raggruppamento in superserie, archivio.
- **Anti-obiettivi:** wizard a più passi; campi obbligatori oltre all'esercizio; riordino solo con trascinamento; perdita di modifiche se si esce (salvataggio a ogni modifica, P4).

## States and ranges

- Schede: tipico 2–4 attive, massimo qualche decina con le archiviate. Voci per scheda: tipico 6–10. Alternative per voce: 0–3.
- Stati: nessuna scheda (stato vuoto che propone le schede di esempio o "Crea scheda"); scheda vuota appena creata; voce con esercizio personalizzato; carico non numerico; recupero 0 (nessun timer); scheda archiviata (sola lettura, "Ripristina"); scheda con sessioni (eliminazione non possibile, spiegato).
- Ricerca nel catalogo: 43 esercizi oggi, nomi fino a ~45 caratteri; nessun risultato → "Crea «testo cercato»".

## Interaction and layout

- Una colonna; azioni frequenti dell'editor ("Aggiungi esercizio") in basso.
- Valori numerici con tastiera numerica; recupero con min:s, non solo secondi.
- Modificare una scheda con una sessione in corso non cambia la sessione in corso.

## Constraints and open decisions

- Il builder non deve cambiare gli ID del catalogo del PoC né inventare esercizi o descrizioni.
- **Deciso:** la superserie è indispensabile (US-09 è M): con le schede reali 6 voci su 8 sono in superserie. Il riordino con trascinamento resta facoltativo e rimandabile; le frecce accessibili sono obbligatorie.
