---
version: 1
slug: "src-components-allenamento-timerrecupero-svelte"
primary_target: "src/components/allenamento/TimerRecupero.svelte"
related_targets: ["route:/allenamento"]
---

## Scope

Operate mode. Timer di recupero: overlay a tutto schermo che parte alla spunta di una serie, più la sua forma ridotta (barra). È la **mossa distintiva** candidata del mondo visivo (step 1) e l'unica modale "di lavoro" ammessa (P8). Il percorso del componente è provvisorio: se cambia, aggiornare `primary_target`. Flussi: 1 (allenamento del giorno), 2 (interruzione).

Storie: US-21, US-22, US-23, US-24, US-25, US-26. Principi: P2, P3, P5, P8, P9.

## Job and audience

L'utente ha appena finito una serie: respira, beve, magari si sposta. Guarda lo schermo da lontano o con la coda dell'occhio, a braccio teso, in luce variabile. Deve sapere **quanto manca** e **cosa viene dopo**, e poter allungare, accorciare o saltare con il pollice.

## Outcome and proof

- Spunta → overlay con conto alla rovescia leggibile a braccio teso (cifre molto grandi, tabulari) e progresso.
- Controlli: −15 s, +15 s, Salta, Riduci. Togliere la spunta della serie annulla il timer.
- Anteprima della prossima serie: esercizio, peso × ripetizioni attesi (es. "Rematore manubri · 12 kg × 8–10").
- Fine recupero: segnale visivo, suono (se attivo), vibrazione dove supportata; l'overlay passa a "Vai" e si chiude.
- Al rientro dopo blocco o ricarica: tempo corretto o recupero già finito, mai un timer sbagliato (US-26).

## Selected direction

- **Autorità visiva:** mondo del PoC esteso (step 1): guscio verde scuro con accento lime, Atkinson Hyperlegible Next. Il timer è la mossa distintiva: il tempo che resta è la cosa più grande sullo schermo e cambia stato in modo inequivocabile alla fine.
- **Tesi di interazione:** il timer non chiede attenzione, la concede. Un solo numero, un solo progresso, quattro controlli grandi in basso. Ridurlo è sempre possibile e non perde il conteggio.

## Scope and boundaries

- Dentro: overlay a tutto schermo (`position: fixed`, `100dvh`, safe area; non l'API Fullscreen), barra ridotta sopra la barra della sessione e nella mini-barra delle altre pagine, stati di fine.
- Recupero dalla voce di scheda o dalla sessione; recupero di riscaldamento se la serie è di riscaldamento; 0 = nessun timer. In superserie parte solo dopo l'ultimo esercizio del giro (US-25, priorità M). Se la voce non ha un recupero, vale il recupero predefinito delle Impostazioni (US-21).
- **Anti-obiettivi:** animazioni continue o pulsanti che si muovono; cifre che cambiano larghezza; annunci a ogni secondo; controlli piccoli in alto; overlay che blocca la correzione di una serie (si riduce).

## States and ranges

- Durate: 15 s – 5 min (tipico 45 s – 2 min); dopo +15 s ripetuti anche oltre 5 min.
- Stati: in corso; ultimi 10 s; finito ("Vai"); ridotto; ripreso dopo blocco con tempo residuo; ripreso dopo la fine (mostra che il recupero è finito da X); nessuna prossima serie (ultimo esercizio: invita a "Termina").
- Permessi e piattaforme: suono sbloccato dal tocco della spunta; vibrazione assente su iOS; wake lock non garantito sulle PWA iOS più vecchie.

## Interaction and layout

- Gerarchia: tempo restante → progresso → prossima serie → controlli (−15 s, +15 s, Salta) → Riduci.
- Controlli nella metà inferiore, ≥ 48px, utilizzabili con il pollice (P2). Tempo leggibile a 1 m di distanza (P3).
- Focus intrappolato nell'overlay e restituito alla riga della serie alla chiusura; `Esc` riduce. `aria-live` solo a 30 s, 10 s e alla fine (P9). Con `prefers-reduced-motion`, progresso senza animazioni continue.
- Motore basato sull'istante di fine (timestamp) persistito in una chiave separata; ricalcolo a `visibilitychange`.

## Constraints and open decisions

- Avvisi garantiti solo con l'app aperta; le Impostazioni lo spiegano. Predisposizione Web Push senza server.
- **Deciso (step 1):** il progresso è il **livello che si svuota** (scelta dell'utente tra livello, anello e tacche); lo stato "Vai" porta tutto lo schermo sull'accento. Vedi il contratto di direzione.
- Il builder non deve inventare suoni scaricati da fonti esterne: il suono si genera localmente (`AudioContext`) o è un file incluso nel sito.

## Direction contract

THESIS: lo schermo stesso è la clessidra. Un livello verde riempie lo schermo dal basso e scende a ogni secondo: quanto recupero resta si legge con la coda dell'occhio, senza leggere le cifre. Rifiuta l'anello attorno alle cifre, lo standard della categoria (Strong, Hevy).

OWN-WORLD: fondo del guscio verde scuro in entrambi i temi (il timer è un momento del guscio, non del contenuto); livello in verde intermedio con un bordo superiore lime di 4px; cifre Atkinson Hyperlegible Next tabulari, peso 650, alte quanto metà della larghezza; controlli come lastre a tutta larghezza con raggio 12px. Allo stato "Vai" tutto lo schermo diventa lime, testo in inchiostro verde.

STORY: l'utente spunta la serie, appoggia il telefono, beve. Da un metro vede quanto verde resta e la prossima serie; se serve allunga o salta col pollice; alla fine lo schermo diventa lime e capisce "vai" prima di leggere la parola.

FIRST VIEWPORT: in alto "Recupero · 2:00" e Riduci (icona, 48px); cifre al centro dell'altezza ottica, larghe circa l'80% dello schermo; sotto, "Prossima" con esercizio, serie, peso × ripetizioni; in basso, nella zona del pollice, −15 s, +15 s, Salta in tre lastre da 64px, e "Riduci" come testo sotto. Il livello sta dietro a tutto.

FORM: estensione del mondo del PoC (new-work §1, brand incompleto), scelta tra tre forme presentate all'utente (livello, anello, tacche); nessun seed: la gara tra mondi è esclusa da HANDOFF.md. Il livello avanza a scatti di 1 s, senza animazione continua; con `prefers-reduced-motion` nessuna transizione.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
