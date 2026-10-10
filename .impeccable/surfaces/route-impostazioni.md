---
version: 1
slug: "route-impostazioni"
primary_target: "route:/impostazioni"
related_targets: []
---

## Scope

Operate mode. Impostazioni e Dati: preferenze, sezione "Dati e privacy" con backup e import, avvisi sui limiti della piattaforma.

Storie: US-30, US-31, US-32, US-33, US-02 (interfaccia dell'import del PoC), US-03 (avviso iOS e installazione), US-24 (spiegazione dei limiti degli avvisi). Principi: P4, P6, P9, P10.

## Job and audience

L'utente ci viene di rado: per cambiare tema o unità, fare un backup, importare il diario del PoC, o capire perché un avviso non è arrivato. Deve trovare tutto senza leggere istruzioni lunghe.

## Outcome and proof

- Aspetto: tema Sistema/Chiaro/Scuro, applicato prima del primo disegno.
- Unità: peso kg/lb, distanza m/ft (con la nota che oggi nessuna schermata usa distanze).
- Allenamento: recupero predefinito, suono, vibrazione (dove supportata), con la spiegazione che gli avvisi funzionano solo con l'app aperta.
- Dati e privacy: dove sono i dati, ultimo backup, "Esporta backup", "Importa" (anteprima con numero di allenamenti e periodo, scelta "mantieni" o "sostituisci" per gli elementi già presenti, riepilogo con gli scartati e il motivo), import del PoC, cancellazione di tutto con conferma forte, avviso iOS sui 7 giorni, invito all'installazione.

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1).
- **Tesi:** un elenco di impostazioni standard, raggruppato, con controlli nativi (segmentati, interruttori). Le spiegazioni sono una riga sotto il controllo, non pagine a parte.

## Scope and boundaries

- Dentro: tutte le preferenze del modello dati (`impostazioni`), import/export v2 e v1, stato di `storage.persist()`, testi su privacy e limiti aggiornati per la PWA.
- **Anti-obiettivi:** impostazioni nascoste in sottomenu profondi; termini tecnici ("localStorage", "origin") senza una spiegazione in parole semplici; cancellazione con una sola conferma generica.

## States and ranges

- Import: file valido, file non valido (errore leggibile, niente modifiche), file troppo grande (oltre 10 MB o 10.000 allenamenti), conflitti di ID, PoC trovato sulla stessa origine.
- Salvataggio: quota piena (dati tenuti in memoria, invito a esportare subito, "Salva ora"); archivio illeggibile (niente sovrascrittura, download del contenuto originale); conflitto con un'altra scheda (blocco e richiesta di ricaricare).
- Piattaforma: iOS non installata; installata; persistenza concessa o negata; vibrazione non disponibile.

## Interaction and layout

- Una colonna di gruppi; ogni controllo ≥ 48px; l'esito di un'azione (esportato, importato) in linea o in un toast, non con `alert`.

## Constraints and open decisions

- Il builder non deve promettere sincronizzazione, cifratura o recupero dei dati cancellati.
