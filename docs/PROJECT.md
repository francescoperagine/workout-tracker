# Progetto

Chi è il prodotto, per chi, con quali vincoli e principi: `PRODUCT.md` (nella radice, lo legge Impeccable).
Qui c'è solo dove siamo e dove si va.

## Stato (5 novembre 2026)

- **Restyling chiuso** (step 0–9, 12 ottobre 2026): storia, decisioni e user story in `docs/archive/restyling/`.
- **Rilascio fatto:** dominio `workout-tracker.francescoperagine.com` collegato al Worker (12 ottobre), backup
  spostato da `workers.dev` al dominio, voce nei Projects di personal-website (INC-119 di quel repo, stato
  `production`), Workers Builds collegato al repository: ogni push su `main` va online da solo.
- **Governance:** adottata con INC-001 (`ai-governance-template` v6).
- **Indicizzazione:** pagine indicizzabili da INC-002 (ADR-002), canonico sul dominio.
- **Pagina Info:** da INC-003, con i contatti dell'autore; la «?» dell'intestazione la apre, l'ingranaggio porta alle Impostazioni.
- **Catalogo e allenamento** (`dedup-catalog-and-workout-ux`, chiusa con INC-008): catalogo senza doppioni e valori dell'ultima volta (INC-004), completa esercizio (INC-005), trascinamento (INC-006, ADR-003), selezione delle celle (INC-007), icona dal bilanciere a pennello (INC-008, ADR-004); SPEC in `docs/archive/features/INC-008_dedup-catalog-and-workout-ux.md`.
- **Card esercizio sfoltita** (`exercise-card-layout`, chiusa con INC-009): in testa solo maniglia, nome e ⋯, niente numero né obiettivo della scheda, «Completa» nell'intestazione delle righe, bordo accento sull'esercizio corrente, recupero dal menu ⋯ (US-40); SPEC in `docs/archive/features/INC-009_exercise-card-layout.md`.
- **Feature attive:** nessuna.

## Focus attuale

Correzioni dopo le prove sull'app installata. Da provare in palestra: storico e progressi (step 8), suono di
fine recupero, e le correzioni dello step 9 (variante a metà esercizio che tiene le serie fatte, «Termina» con
conferma, allenamento senza tab bar, livello del timer, «Ogni martedì» nel foglio del giorno, peso suggerito
dalla serie sopra).

Le decisioni aperte dello step 9 sono chiuse come raccomandato (INC-002): la variante a metà esercizio resta
una voce nuova con il suo numero, il nome accessibile dei giorni del calendario resta più lungo del testo
visibile, nessun intervento sul deploy con l'app aperta (vedi limiti), le proposte della critique aspettano le
prove in palestra (vedi direzione).

## Limiti noti

- Gli avvisi di fine recupero arrivano solo con l'app aperta: il Web Push è solo predisposto (handler in
  `public/sw-push.js`, contratto in `docs/archive/restyling/WEB-PUSH.md`), senza server né permessi.
- Offline si aprono solo gli URL delle pagine con la barra finale (`/settings/`): i link dell'app la hanno sempre.
- I punti iOS della checklist di `WEB-PUSH.md` (wake lock, sblocco dell'audio, vibrazione) non sono verificati:
  nessun iPhone disponibile.
- Gli approfondimenti del catalogo sono vuoti: niente testi tecnici o consigli medici inventati.
- Un push mentre ci si allena con l'app aperta e offline potrebbe chiedere un chunk vecchio non più in cache
  (non riprodotto): non pushare durante un allenamento, intervenire solo se capita.

## Direzione

Nessuna milestone fissata. **Prossima candidata: la palette nuova** (Francesco, 5 novembre 2026), al posto del verde: neutri inchiostro `#111111` / carta `#FAFAF7` / sfondo scuro `#1C1C1E`, card `#2A2A2D`; bordi decorativi `#E4E4E7` e `#3F3F46`, bordi degli input `#6B6B70` e `#A1A1AA` (min 3:1). Accento rosso: `#D0202E` pulsanti pieni con testo bianco e testo in tema chiaro, `#FF5C5C` testo e icone in tema scuro, `#EF3340` timer e indicatori, `#A8141F` premuto e distruttivo. Niente verde: serie completata = riempimento pieno neutro + spunta. Errori con lo stesso rosso + icona + testo. Grafici: rosso serie principale, grigio confronto. È una Feature (token di `DESIGN.md`, `global.css`, meta `theme-color`, `/kit`).

Altri candidati, solo se le prove li chiedono: server Web Push per gli avvisi ad app chiusa, le proposte della critique (segno sulla riga della serie da fare adesso, pulsanti ± per il peso, impostazione «Distanza» che oggi non ha effetto).
