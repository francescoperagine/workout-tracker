# Progetto

Chi è il prodotto, per chi, con quali vincoli e principi: `PRODUCT.md` (nella radice, lo legge Impeccable).
Qui c'è solo dove siamo e dove si va.

## Stato (6 novembre 2026)

- **Restyling chiuso** (step 0–9, 12 ottobre 2026): storia, decisioni e user story in `docs/archive/restyling/`.
- **Rilascio fatto:** dominio `workout-tracker.francescoperagine.com` collegato al Worker (12 ottobre), backup
  spostato da `workers.dev` al dominio, voce nei Projects di personal-website (INC-119 di quel repo, stato
  `production`), Workers Builds collegato al repository: ogni push su `main` va online da solo.
- **Governance:** adottata con INC-001 (`ai-governance-template` v6).
- **Indicizzazione:** pagine indicizzabili da INC-002 (ADR-002), canonico sul dominio.
- **Pagina Info:** da INC-003, con i contatti dell'autore; la «?» dell'intestazione la apre, l'ingranaggio porta alle Impostazioni.
- **Catalogo e allenamento** (`dedup-catalog-and-workout-ux`, chiusa con INC-008): catalogo senza doppioni e valori dell'ultima volta (INC-004), completa esercizio (INC-005), trascinamento (INC-006, ADR-003), selezione delle celle (INC-007), icona dal bilanciere a pennello (INC-008, ADR-004); SPEC in `docs/archive/features/INC-008_dedup-catalog-and-workout-ux.md`.
- **Card esercizio sfoltita** (`exercise-card-layout`, chiusa con INC-009): in testa solo maniglia, nome e ⋯, niente numero né obiettivo della scheda, «Completa» nell'intestazione delle righe, bordo accento sull'esercizio corrente, recupero dal menu ⋯ (US-40); SPEC in `docs/archive/features/INC-009_exercise-card-layout.md`.
- **Palette a ruoli** (`palette`, chiusa con INC-010, ADR-005): inchiostro e carta in chiaro e scuro, un solo accento vermiglio, rosso solo per errori e distruttive (pulsante pieno con icona), indaco per i record, nessun verde; il guscio segue il tema su `surface`; `src/styles/contrast.test.ts` controlla le coppie. SPEC in `docs/archive/features/INC-010_palette.md`.
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

Nessuna milestone fissata. La palette nuova è fatta (INC-010); da provare in palestra alla luce del sole, chiaro e scuro.

Altri candidati, solo se le prove li chiedono: server Web Push per gli avvisi ad app chiusa, le proposte della critique (segno sulla riga della serie da fare adesso, pulsanti ± per il peso, impostazione «Distanza» che oggi non ha effetto).
