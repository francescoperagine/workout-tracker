# Handoff: Workout Tracker dopo lo step 9 (rilascio)

Questo documento serve a riprendere il lavoro in una nuova conversazione. Il restyling è finito (step 0–9); restano il rilascio, che fa Francesco, e le correzioni dopo le prove sull'app installata.

## Prompt da incollare nella nuova conversazione

**Dopo il rilascio**, quando Francesco ha provato l'app installata:

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md` (step 9 e «Rilascio»), `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e i brief in `.impeccable/surfaces/`. L'app si chiama **Workout Tracker**: è pubblicata a ogni push su `main` sul Worker Cloudflare `workout-tracker` (`https://workout-tracker.francescoperagine.workers.dev` e, dopo il rilascio, `https://workout-tracker.francescoperagine.com`). Prima di cominciare, chiedimi a che punto sono i passi del «Rilascio» in PIANO.md, l'esito delle prove sull'app installata (storico e progressi dello step 8, suono di fine recupero, e le correzioni dello step 9: variante a metà esercizio che tiene le serie fatte, «Termina» con conferma, allenamento senza tab bar, livello del timer, «Ogni martedì» nel foglio del giorno, peso suggerito dalla serie sopra) e le risposte alle decisioni aperte dello step 9 elencate in HANDOFF.md; poi applica le correzioni. Il codice è in inglese (file, route, identificatori, token CSS), i testi per l'utente in italiano: vedi "Lingua" in `AGENTS.md`. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Un push su `main` è un deploy in produzione: pusha solo con `npm run check`, `npm test`, `npm run build` e le suite e2e verdi (anche con `WT_BASE=/workout-tracker/`). Fermati alla fine per mostrarmi le schermate e le decisioni prese, con raccomandazioni per quelle aperte.

## Stato a fine step 9 (12 ottobre 2026)

Tutto è su `main`. Dettagli nello «Stato» dello step 9 in PIANO.md; struttura, comandi e convenzioni in `AGENTS.md`.

- **Prima dello step (risposte del 12 ottobre 2026):** storico, progressi e suono corretto non ancora provati sull'app installata; decisioni aperte dello step 8 tutte confermate; `readPocKey` da togliere.
- **PoC eliminato** (`BodyTracker/`, `readPocKey`, `conversion.ts`, confronto con il file del PoC in `seed-data.test.ts`); `README.md` riscritto (privacy, limiti, sviluppo, pubblicazione, catalogo e approfondimenti). Il formato d'import `bodytracker.archivio.v1` resta.
- **`/kit`** solo in dev o con `WT_KIT=1` (integrazione `kitPage` in `astro.config.mjs`, `webServer.env` in `playwright.config.ts`).
- **Critique, audit, harden e polish** sui flussi di USER-STORIES.md §4, con le correzioni scelte dall'utente (variante che tiene le serie fatte con «Annulla», «Termina» con conferma e secondario finché resta una serie, niente tab bar sull'allenamento, livello del timer più visibile e sopra le lastre, «Ogni martedì» prima dell'eccezione, peso suggerito dalla serie sopra, record per esercizio, 1RM al mezzo chilo, un solo «Riprendi» nello Storico, bersagli ≥ 44px, link sottolineati nelle frasi).
- **Verifiche:** `npm run check` 0 errori, `npm test` 226 Vitest, `npm run build` ok (senza `/kit`), `npm run test:e2e` 292 verdi e `WT_BASE=/workout-tracker/ npm run test:e2e` 292 verdi, detector a 0 su `src/`, Lighthouse (telefono) prestazioni 99–100, accessibilità 100 (Calendario 96), buone pratiche 100. Schermate dei flussi a 390×844 nei due temi e a 320×568 mostrate all'utente.

## Decisioni aperte dello step 9 (da chiedere all'utente)

1. **Numerazione dopo una variante a metà esercizio:** la variante è una voce nuova con il suo numero (lo squat fatto resta «1», la variante diventa «2», le voci dopo scalano) e il conteggio dice «1 di 9 esercizi fatti». Raccomandazione: tenerla, è quello che è successo davvero.
2. **Nome accessibile dei giorni del calendario** più lungo del testo visibile («mar 13» → «martedì 13 ottobre: …», Lighthouse 96). Raccomandazione: tenerlo.
3. **Deploy con l'app aperta in allenamento:** non riprodotto; un chunk vecchio tolto dalla cache darebbe errore solo offline. Raccomandazione: non pushare mentre ci si allena; intervenire solo se capita.
4. **Proposte della critique non fatte:** segno sulla riga della serie da fare adesso, pulsanti ± per il peso, impostazione «Distanza» che oggi non ha effetto (decisione 9 del piano). Raccomandazione: aspettare le prove in palestra.

## Rilascio (da PIANO.md)

1. ~~Francesco collega il dominio `workout-tracker.francescoperagine.com` al Worker `workout-tracker`.~~ Fatto il 12 ottobre 2026 (`wrangler.jsonc`), con il deploy manuale degli step 8 e 9.
2. Esporta il backup su `workout-tracker.francescoperagine.workers.dev` e lo importa sul dominio nuovo (i dati del browser sono per origine).
3. Una sessione sul repo personal-website aggiunge la voce in Projects subito sotto Ordiria (azione che apre l'app, `order: 1` con le altre voci spostate di uno, stato `testing`, gruppo App, figura ad acquerello generata da Francesco), seguendo le regole di quel repo.
4. Da lì in poi ogni push su `main` è online, **dopo aver collegato Workers Builds al repository** dalla dashboard (vedi «Pubblicazione» in `AGENTS.md`); fino ad allora `npm run build && npx wrangler deploy`.

Dopo il rilascio le pagine sono ancora `noindex` (decisione 12: la reperibilità viene dalla pagina Projects). I rami `claude/jolly-hawking-9tb1t4` e `claude/stoic-knuth-xd0bx6`, se esistono ancora, si cancellano in locale (`git push origin --delete …`) o da GitHub.

## Insidie dell'ambiente (container cloud)

- **Rete:** la policy blocca molti siti, tra cui `hevyapp.com`, `strongapp.io`, `docs.astro.build`, `impeccable.style` e `raw.githubusercontent.com` (403 dal proxy). Funzionano `npm`, `git clone` da GitHub e la ricerca web. Per leggere un repository pubblico: `add_repo` (accesso in lettura), poi `git clone --depth 1` in `/home/user/<owner>/<repo>`. Il repository di Impeccable si clona così in `/home/user/pbakaus/impeccable`.
- **Installazione di Impeccable:** `npx impeccable install` fallisce, perché scarica da `impeccable.style`. La skill in `.claude/skills/impeccable/` è la copia di `plugin/skills/impeccable` del repository ufficiale (commit `d631a88`, versione 4.5.2). Per aggiornarla, ripetere la copia da una versione nuova.
- **Launcher di Impeccable e hook:** dallo step 1 il launcher (`.claude/skills/impeccable/scripts/impeccable`) parte senza blocchi; al primo uso scarica il binario in `~/.impeccable/bin`. L'hook è in `.claude/settings.json`. `npx impeccable detect src/` (motore da npm) funziona senza permessi speciali.
- **Agenti di Impeccable:** gli agenti "shipped" (finish reviewer, documenter) non sono installati: si lanciano come agenti generici che seguono `reference/degraded/finish-reviewer.md` e `reference/degraded/documenter.md`.
- **Formato dei brief:** se il launcher non è disponibile, i brief si scrivono a mano in `.impeccable/surfaces/<slug>.md`. Il frontmatter è `version: 1`, `slug`, `primary_target` (`route:/percorso` o un file) e `related_targets`. Lo slug è il target in kebab-case: `route:/routines` → `route-routines`, `route:/` → `route`.
- **Upgrade di Astro:** `npx @astrojs/upgrade` non risolve le versioni da qui: usare `npm install pacchetto@^versione`.
- **`astro preview` in Astro 7:** sotto un agente parte in background e restituisce subito il controllo. Fermarlo con `npx astro preview stop` (`status` e `logs` per controllarlo); `--ignore-lock` lo tiene in primo piano.
- **Pagine con `_`:** Astro non genera `src/pages/_qualcosa.astro`.
- **TypeScript:** `@astrojs/svelte` e `@astrojs/check` accettano TypeScript 5 o 6, non il 7.
- **Detector di Impeccable sulle pagine renderizzate:** Puppeteer non parte come root senza `--no-sandbox`. Soluzione:
  ```sh
  printf '#!/bin/sh\nexec /opt/pw-browsers/chromium --no-sandbox "$@"\n' > /tmp/chromium-nosandbox && chmod +x /tmp/chromium-nosandbox
  npx astro preview --background
  PUPPETEER_EXECUTABLE_PATH=/tmp/chromium-nosandbox npx impeccable detect http://localhost:4321/kit
  ```
  Per il tema chiaro e scuro, ripetere con `/kit?theme=light` e `/kit?theme=dark`.
- **Playwright:** installato anche globalmente (`$(npm root -g)/playwright`, 1.56), con Chromium in `/opt/pw-browsers`. Il progetto usa `@playwright/test` 1.64: lanciare gli e2e con `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e` (e di nuovo con `WT_BASE=/workout-tracker/` davanti). Non eseguire `playwright install`. Per script di screenshot fuori dal repository: `NODE_PATH=$PWD/node_modules node script.cjs` (CommonJS, perché `NODE_PATH` non vale per gli ESM).
- **Chiusura dei server:** se serve `pkill`, non usare `pkill -f "astro preview"`: il pattern corrisponde anche alla shell che esegue il comando e la termina. Usare `pkill -f "[a]stro preview"`, **da solo** nel comando: se nella stessa riga compare anche il testo `astro preview` (es. `npx astro preview stop; pkill …`), la shell viene terminata lo stesso.
- **`/kit` e `dist/`:** `/kit` esiste solo con `npm run dev` o `WT_KIT=1` (la build degli e2e). Dopo una suite con `WT_BASE` in `dist/` resta la build nel sotto-percorso: per misure sulla build di produzione (Lighthouse, schermate) rifare `npm run build` e riavviare `astro preview`.
- **Detector:** a 0 su `src/` e sulle pagine renderizzate (`/welcome`, `/settings`, `/calendar`, `/kit` nei due temi). Sulle pagine senza archivio `/` porta a `/welcome`: per controllare Oggi serve un archivio nel browser. Lo stesso vale per `/routines` e `/routine?id=`: il detector apre un browser senza archivio e vede solo lo stato vuoto; le schermate con dati si controllano con uno script Playwright che mette un archivio nel `localStorage` (`addInitScript`) e fotografa a 390×844 e 320×568 nei due temi. Le note consultive (`flat-type-hierarchy`) non sono errori.
- **Isole e build:** il rendering alla build esegue anche le isole `client:load`; se leggono l'archivio all'avvio la build fallisce ("L’archivio è disponibile solo nel browser"). Usare `client:only="svelte"` o leggere l'archivio in `onMount`.
- **Detector e larghezza:** il detector misura le pagine a larghezza desktop: righe oltre 80 caratteri e controlli con bordo dentro un `.panel` (nested cards) compaiono lì e non a 390px.
- **Rumore del proxy:** durante i test Chromium prova a contattare `accounts.google.com` e `android.clients.google.com` (servizi del browser, non dell'app): il proxy li rifiuta, non c'entra con il controllo "nessuna richiesta esterna" di US-03, che guarda solo le richieste della pagina.
- **Lucide 1.x:** alcune icone hanno cambiato nome; il pacchetto Astro non ha gli alias. Esempi: `trash-2` → `trash`, `history` → `rotate-ccw-clock`. Controllare in `node_modules/@lucide/astro/src/icons/`.
- **`light-dark()` nei token:** il valore si risolve dove il token viene usato, secondo il `color-scheme` di quell'elemento. Per questo dentro `.shell` (che dichiara `color-scheme: dark`) i token di contenuto danno la variante scura. Tailwind lascia `light-dark()` nativo nel CSS generato.
- **Orologio finto e timer:** `page.clock.install()` da solo lascia scorrere il tempo: nei test del timer segue `page.clock.pauseAt(NOW)`, poi `runFor`/`fastForward`. Con `setFixedTime` (test dello step 6) il timer non scende mai e la finestra coprirebbe le righe: quei test usano schede con `rest: 0`.
- **Spazi unificatori:** `toContainText` e `toHaveText` di Playwright normalizzano anche lo spazio unificatore; in Vitest invece i testi con `\u00a0` (es. "40\u00a0kg\u00a0×\u00a08") vanno scritti uguali.
- **Fuso orario nei test:** il browser di Playwright è in `Europe/Rome`, il container in UTC. Per `page.clock.setFixedTime` usare istanti con il fuso esplicito (`'2026-10-08T18:30:00+02:00'`); l'aiuto `session()` di `tests/e2e/helpers.ts` crea sessioni alle 18:00 UTC, cioè le 20:00 nel browser.
- **Spazi in Svelte:** uno spazio tra `}` e `{#if}` può sparire ("da 25 min· Panca"): le righe di metadati si compongono nello script con `[…].filter(Boolean).join(' · ')`.
- **Testo nascosto e `getByText`:** un `<span class="sr-only">Durata: </span>` perde lo spazio finale; scrivere lo spazio fuori dallo span. Per i testi composti meglio `getByRole('paragraph').filter({ hasText })`.
- **Stack in basso:** non scrivere `--bottom-bars-height` a mano nelle pagine dell'app: usare `setBottomBar` (le isole ricreate si ridichiarano a ogni pagina, quelle persistenti restano).
- **Playwright e anteprime:** un elemento `inert` viene comunque trovato da `getByRole`; nelle anteprime di `/kit` i controlli finti sono `div`, non `button`. Per l'overlay del timer usare `page.locator('dialog[open]')`.

- **Clic prima dell'idratazione:** sotto carico (suite intera, desktop) un clic su un'isola appena caricata può cadere sull'HTML statico e perdersi. Nei test, per i controlli di isole `client:load` (tema di `/kit`, primo avvio) usare `hydrated()` di `tests/e2e/helpers.ts`.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10, sui componenti reali dei flussi.
- I test e2e portano l'ID della storia; ogni nuova storia porta il suo test.
- Gli ID del catalogo esercizi (`src/data/catalog.ts`, `POC_IDS` in `seed-data.test.ts`) **non vanno cambiati**: lo storico e i backup del PoC li usano.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito.
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
- I punti iOS della checklist di `docs/restyling/WEB-PUSH.md` restano non verificati (nessun iPhone disponibile).
