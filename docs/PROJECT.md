# Progetto

Chi è il prodotto, per chi, con quali vincoli e principi: `PRODUCT.md` (nella radice, lo legge Impeccable).
Qui c'è solo dove siamo e dove si va.

## Stato (10 novembre 2026)

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
- **Allenamento in palestra** (`workout-gym-ux`, chiusa con INC-015): correzioni e rosso di riempimento (INC-011, ADR-006), card a fisarmonica e riordino solo trascinando (INC-012, ADR-007), segnaposto dall'ultima volta o dalla scheda al posto dei valori veri (INC-013, ADR-008), suono a tre campane e foglio per l'allenamento dimenticato (INC-014, US-41), tab «Progressi» (INC-015); SPEC in `docs/archive/features/INC-015_workout-gym-ux.md`.
- **Serie per muscolo** (`muscle-volume`, chiusa con INC-027): archivio alla versione 3 con il reindirizzamento del rematore doppio (INC-021, ADR-009), mappa dei muscoli del catalogo da studi di crescita e azione articolare (INC-022, ADR-010, ADR-011; punti senza studio chiusi con INC-026), conteggio frazionario per settimana (INC-023, ADR-012), muscoli e varianti nella pagina dell'esercizio (INC-024, ADR-013), barre per gruppo in Progressi (INC-025) e linea settimanale di un gruppo (INC-027). SPEC in `docs/archive/features/INC-027_muscle-volume.md`, mappa e ricerche in `docs/archive/features/INC-027_muscle-volume-research/`.
- **Feature attive:** nessuna.

## Focus attuale

Correzioni dopo le prove sull'app installata. Da provare in palestra: il suono a tre campane (INC-014: la
sinusoide pura il 12 ottobre si sentiva poco), il segnaposto al posto dei valori dell'ultima volta (INC-013), la
tab Progressi, e le correzioni dello step 9 (alternativa a metà esercizio che tiene le serie fatte, «Termina» con
conferma, allenamento senza tab bar, livello del timer, «Ogni martedì» nel foglio del giorno).

Le decisioni aperte dello step 9 sono chiuse come raccomandato (INC-002): l’alternativa a metà esercizio resta
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
- Serie per muscolo: la mappa del catalogo ha uno studio di crescita solo per 12 esercizi, gli altri seguono l'azione
  articolare (ADR-011); ogni drop su una riga sua conta una serie, probabilmente troppo (ADR-012).
- Un push mentre ci si allena con l'app aperta e offline potrebbe chiedere un chunk vecchio non più in cache
  (non riprodotto): non pushare durante un allenamento, intervenire solo se capita.

## Direzione

Nessuna milestone fissata. La palette nuova è fatta (INC-010); da provare in palestra alla luce del sole, chiaro e scuro.

**Misure del corpo** (peso, circonferenze) nella tab Progressi: una feature a sé, perché toccano modello dati,
validazione, backup e import. Finché non c'è, nessun segnaposto «Misure» nell'interfaccia.

Altri candidati, solo se le prove li chiedono: server Web Push per gli avvisi ad app chiusa, le proposte della critique (segno sulla riga della serie da fare adesso, pulsanti ± per il peso, impostazione «Distanza» che oggi non ha effetto).
