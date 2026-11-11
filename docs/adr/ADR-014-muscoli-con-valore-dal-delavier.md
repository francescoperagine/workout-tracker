# ADR-014 — Muscoli con il valore di una serie, letti sul Delavier

Status: Accepted
Increment: INC-029, INC-035

## Context

Con ADR-010 e ADR-011 ogni esercizio aveva due liste, principali e secondari, decise da studi di crescita (12
esercizi su 42) e per il resto dall'azione articolare. Il catalogo nuovo (delavier-catalog) prende tutti gli esercizi
di *Strength Training Anatomy*, 3ª ed., e il libro non usa due liste:
- la figura con la legenda «most recruited / recruited» c'è solo a p. 110 (stacco da terra);
- il testo gradua con «mainly / primarily … to a lesser extent» o con «works X … it also works Y», oppure elenca i
  muscoli senza gradazione;
- il libro dà l'ordine tra le due categorie, non un numero: il numero lo dà Pelland et al. 2026 (Sports Medicine,
  DOI 10.1007/s40279-025-02344-w), che con il conteggio frazionario a 0,5 per il lavoro indiretto si adatta meglio
  ai dati (ADR-012).

Due liste con un'etichetta («principale», «livello 1») avrebbero tenuto un concetto in più tra il libro e il conteggio:
il testo, il colore e la sagoma si possono ricavare direttamente dalla quota.

## Decision

1. **Modello:** `Muscles = Partial<Record<MuscleGroup, number>>`, gruppo → quota di una serie. Valori ammessi oggi
   `MOST_RECRUITED = 1` e `RECRUITED = 0.5` (`MUSCLE_VALUES`), costanti con nome in `src/lib/archive/types.ts`
   (in `muscles.ts` sarebbero un import circolare con il catalogo). Niente campo «livello».
2. **Archivi e backup vecchi** si convertono in lettura: `{primary, secondary}` → 1 e 0,5. La versione resta 3: la
   forma nuova sostituisce la vecchia a ogni salvataggio, e il codice vecchio non legge più i personalizzati con
   muscoli (accettato: un solo utente, che aggiorna l'app).
3. **Regole di lettura del Delavier:** legenda della figura («most recruited» 1, «recruited» 0,5); «mainly /
   primarily» contro «to a lesser extent» 1 e 0,5; «works X… it also works Y» X 1, Y 0,5; elenco senza separatori
   tutti 1; grassetti delle tavole e figurine rosse non contano. Più muscoli dello stesso gruppo: vale il valore più
   alto. Nessuna mappatura per deduzione: ciò che le regole non decidono va a Francesco con una proposta.
4. **Gruppi nuovi:** brachiale, flessori dell'anca, popliteo. Muscoli del libro → gruppi: tabella della SPEC
   (delavier-catalog, §4).
5. **Gerarchia delle fonti** (Francesco, 11/11/2026, INC-035), per tutto il catalogo:
   1. *studi verificati e confermati*: verificato = rivista con revisione, letto nel testo, non ritrattato, crescita
      misurata con risonanza, TAC o ecografia dopo un allenamento; confermato = stesso risultato da almeno due gruppi
      indipendenti, o da una revisione sistematica o meta-analisi. Per i muscoli che hanno misurato vincono sul libro;
   2. *il libro*: quali muscoli lavorano, non quanto crescono; cede solo a uno studio confermato più recente; le
      contraddizioni tra sue pagine si segnalano nel commento della riga;
   3. *studi singoli, competitor, logica*: valgono solo dove il libro tace (es. hip thrust), segnati come tali.
   Oggi due righe cambiano per uno studio confermato: tricipiti 0,5 nella panca piana (Ogasawara 2011-2013 e Lanza
   2024) e femorali 0 nello squat (Kubo 2019 e Plotkin 2023). La classificazione di ogni studio è nella mappa
   (`docs/archive/features/INC-027_muscle-volume-research/mappa-43.md`, «Gerarchia delle fonti»).
- Alternative scartate per la gerarchia: il libro sempre (contraddetto sulla crescita da studi replicati); lo studio
  sempre (uno studio singolo su pochi non allenati, come Kinoshita 2026 sulla leg press, cambierebbe il catalogo da solo).
- Alternative scartate: due livelli con un'etichetta (un concetto in più, nessuna informazione in più); restare agli
  studi di crescita (coprono 12 esercizi, il catalogo nuovo ne ha centinaia); EMG (non predice la crescita, Vigotsky
  et al. 2022).

## Consequences

- Sostituisce la regola di ADR-011 (Superseded by ADR-014). ADR-012 resta: il peso di una serie è la quota.
- Cambiare 0,5 è una riga, ma rende non validi i valori 0,5 salvati nei personalizzati: chi lo cambia aggiunge la
  conversione in lettura in `validation.ts`.
- Fino all'incremento 2 di delavier-catalog il catalogo tiene i valori di ADR-011 convertiti (principale 1,
  secondario 0,5); poi ogni voce ha nel commento la pagina del libro o la fonte esterna.
- Le righe decise dagli studi di crescita (squat, leg press, hip thrust, leg extension) possono cambiare con il libro:
  il test che le blocca si riscrive sul Delavier.
