# Handoff: restyling BodyTracker, partenza dallo step 0

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, i documenti da leggere, lo step 0 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/USER-STORIES.md`, `docs/restyling/PIANO.md` e `docs/restyling/ANALISI.md`, poi esegui lo **step 0** del piano. Lavora su un branch nuovo partendo da `main`. Alla fine dello step fermati e mostrami storie e brief delle superfici da confermare, prima di toccare la grafica.

## Stato a fine step 0 (10 ottobre 2026, branch `claude/stoic-knuth-xd0bx6`)

- **Fatto:**
  - Astro 7.3 (Vite 8) con Svelte 5, Tailwind 4.3; MDX e sitemap rimossi; `noindex` nel layout;
  - Vitest, Playwright, TypeScript 6, `@astrojs/check`; script `check`, `test`, `test:e2e`; smoke test e2e;
  - Impeccable 4.5.2: skill in `.claude/skills/impeccable/`, `.impeccable/config.json`, blocco del `.gitignore`;
  - `PRODUCT.md` e `DESIGN.md` in radice, `design.json` in `.impeccable/`; `PRODUCT.md` aggiornato;
  - brief delle 8 superfici in `.impeccable/surfaces/`, indice con flussi, copertura, proposte sulle storie e domande in [BRIEF.md](BRIEF.md).
- **In attesa:** conferma dell'utente su storie, priorità e brief (domande in BRIEF.md §4). Poi aggiornare USER-STORIES.md e i brief, e passare allo step 1.
- **Non fatto:** hook del detector di Impeccable in Claude Code (vedi insidie).

## Stato a inizio step 0

Tutto è su `main`.

- **App Astro (radice):** Astro 5.15 + Tailwind 4, sito statico, la build passa. Le correzioni di base sono fatte:
  - build statica; pagina del giorno su `/workout?date=YYYY-MM-DD`;
  - archivio unificato `bb-workouts`, date in ora locale, escape dell'HTML;
  - Tailwind config caricata, link corretti.

  La grafica è quella vecchia (blu, card annidate, emoji): verrà rifatta.
- **PoC `BodyTracker/`:** invariato. È la specifica delle funzioni da assorbire e **va eliminato** nello step 9.
- **Documenti:**
  - `AGENTS.md`: guida al codice attuale. Va aggiornato man mano che il restyling cambia struttura e convenzioni.
  - `docs/restyling/ANALISI.md`: stato, concorrenti (Strong, Hevy), vincoli del timer sul web, regole di Impeccable.
  - `docs/restyling/USER-STORIES.md`: **scena d'uso, principi UX verificabili (P1–P10), 33 user story con priorità e criteri di accettazione**, flussi principali, metodo di validazione (test per ID, prova reale in palestra). È una bozza da confermare con l'utente allo step 0.
  - `docs/restyling/PIANO.md`: **decisioni prese**, scelte tecniche, modello dati v2, unità di misura, tabella "Assorbimento del PoC", step 0–9 con storie coperte e criteri di verifica.
- **Nessun dato da migrare** dal formato `bb-*`. L'unico import richiesto è il backup del PoC (`bodytracker.archivio.v1`). Un backup reale dell'utente non è ancora stato fornito: chiederlo allo step 2, oppure usarne uno sintetico.

## Decisioni chiave (riassunto; il dettaglio è nel piano)

- Mondo visivo del PoC (verde, operativo) in **tema chiaro e scuro**, con impostazione Sistema/Chiaro/Scuro.
- **Unità:** peso kg/lb e distanza m/ft come impostazioni. I dati si salvano sempre in kg e metri.
- **Timer come Strong:** la spunta della serie avvia il recupero a tutto schermo (±15 s, Salta, Riduci).
  - Avvisi solo con l'app aperta.
  - Predisposizione Web Push (interfaccia più handler nel service worker), senza server.
- **v1 include** tipi di serie (normale, riscaldamento, drop, cedimento) e grafici dei progressi (SVG scritto a mano).
- **PWA:** offline e privata (nessuna richiesta esterna); pubblicata in `/bodytracker/` sul sito personale, con base configurabile tramite `BT_BASE`/`BT_SITE`.
- **Stack:**
  - Astro 7, isole Svelte 5, `ClientRouter` con `transition:persist` per la sessione e il timer;
  - token Tailwind in `@theme`, icone Lucide, font self-hosted;
  - service worker con `workbox-build` in `astro:build:done`;
  - test con Vitest e Playwright.
- Interfaccia in italiano. Alla fine resta solo l'app nella radice.

## Step 0 in dettaglio

Obiettivo: fondamenta pronte, senza ancora cambiare la grafica.

1. **Branch:** creane uno nuovo da `main`.
2. **Aggiornamento ad Astro 7:**
   - `npx @astrojs/upgrade`, poi `npm run build`;
   - leggere le note di migrazione 5→6→7 per le API usate (`astro:content` non è usato; MDX e sitemap probabilmente da rimuovere).
3. **Dipendenze:**
   - `@astrojs/svelte` e `svelte` (verificare i peer: `@astrojs/svelte@9` richiede `astro@^7`);
   - in sviluppo: `vitest`, `@playwright/test` (non eseguire `playwright install`: usare la Chromium in `/opt/pw-browsers`), `typescript`, `@astrojs/check`;
   - script `test`, `test:e2e`, `check`.
4. **Pulizia:** rimuovere MDX e sitemap, aggiungere `noindex` (app privata).
5. **Impeccable:**
   - `npx impeccable install` nella radice (o il plugin Claude Code);
   - tenere versionati `.impeccable/config.json` e `.impeccable/surfaces/`; aggiungere al `.gitignore` i file effimeri indicati dal README di Impeccable.
6. **Documenti di design in radice:**
   - `git mv BodyTracker/documentazione/PRODUCT.md PRODUCT.md`, idem per `DESIGN.md` e `design.json` (dove Impeccable li vuole);
   - aggiornare `PRODUCT.md` con le decisioni del piano. Il `DESIGN.md` lo riscrive lo step 1.
7. **Storie e brief.**
   - **Prima** rivedere con l'utente `USER-STORIES.md`: priorità M/S/C, storie mancanti o di troppo, principi P1–P10. Le storie confermate sono il contratto del restyling.
   - Poi i **brief con `/impeccable shape`** per: Oggi, Allenamento attivo, Timer di recupero, Schede (elenco ed editor), Calendario, Storico/Progressi, Impostazioni e Dati, più il primo avvio.
   - Modalità **Operate** per tutte. Ogni brief dichiara le storie (ID) e i principi che copre, e descrive la scena d'uso reale (una mano, tra una serie e l'altra, luce variabile, offline).
   - Nessuna storia M deve restare senza superficie.
   - Le risposte a molte domande di scoperta sono già in piano e storie: non ripeterle all'utente, chiedere solo quelle davvero aperte.
   - Progettare per primi i flussi di USER-STORIES.md §4, non le singole pagine.
8. **Verifica:** `npm run build` verde, `npx astro check` senza errori, `npm test` (anche vuoto) che parte.
9. **Consegna:** commit, push, poi presentare storie e brief all'utente e **fermarsi** per la conferma.

## Insidie dell'ambiente (container cloud)

- **Rete:** la policy blocca molti siti (es. `hevyapp.com`, `strongapp.io` → 403 dal proxy). Funzionano `npm`, GitHub e la ricerca web. Le informazioni sui concorrenti sono già in `ANALISI.md`.
- **Installazione di Impeccable:** `npx impeccable install` scarica le skill da `impeccable.style`, bloccato dal proxy. La skill è stata copiata da `plugin/skills/impeccable` del repository GitHub (stesso commit della 4.5.2). Il motore del detector arriva da npm (`npx impeccable`) e funziona.
- **Hook del detector:** non cablato. Va in `.claude/settings.local.json` (locale) o in `.claude/settings.json` (condiviso, vale anche per le sessioni cloud) ed esegue `.claude/skills/impeccable/scripts/impeccable hook`, che scarica il motore da GitHub al primo uso. Serve l'ok dell'utente.
- **Upgrade di Astro:** `npx @astrojs/upgrade` non riesce a risolvere le versioni da questo container; l'aggiornamento è stato fatto con `npm install astro@^7 …`. `docs.astro.build` è bloccato dal proxy.
- **`astro preview` in Astro 7:** sotto un agente parte in background. Fermarlo con `npx astro preview stop` (non serve più `pkill`); `--ignore-lock` lo tiene in primo piano.
- **Pagine con `_`:** Astro non genera `src/pages/_qualcosa.astro`; per la pagina dei componenti usare `/kit`.
- **TypeScript:** `@astrojs/svelte` e `@astrojs/check` accettano TypeScript 5 o 6, non il 7.
- **Detector di Impeccable sulle pagine renderizzate:** Puppeteer non parte come root senza `--no-sandbox`. Soluzione:
  ```sh
  printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' > /tmp/chromium-nosandbox && chmod +x /tmp/chromium-nosandbox
  PUPPETEER_EXECUTABLE_PATH=/tmp/chromium-nosandbox npx impeccable detect http://localhost:4321/
  ```
  `npx impeccable detect src/` sui sorgenti funziona senza browser.
- **Playwright:** è installato globalmente (`$(npm root -g)/playwright`, 1.56), con Chromium in `/opt/pw-browsers`. Il progetto usa `@playwright/test` 1.64: lanciare gli e2e con `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`.
- **Chiusura dei server:** se serve `pkill`, non usare `pkill -f "astro preview"`: il pattern corrisponde anche alla shell che esegue il comando e la termina. Usare `pkill -f "[a]stro preview"`.
- **Type-check:** `npm run check`.
- **Avviso noto di `astro check`:** segnala un warning su `BodyTracker/palestra/app.js` (`returnValue` deprecato). Va ignorato: il file sparirà allo step 9.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. I test e2e portano l'ID della storia, e dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni (oggi descrive l'app pre-restyling).
