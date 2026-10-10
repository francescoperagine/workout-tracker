# Handoff: restyling BodyTracker, partenza dallo step 4

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 4 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e il brief `.impeccable/surfaces/route-routines.md`. Esegui lo **step 4** del piano (Schede: elenco con crea, duplica, rinomina, riordina, archivia, elimina con conferma; editor con esercizi dal catalogo o personalizzati, serie, ripetizioni, carico nell'unità scelta, recupero e recupero di riscaldamento, alternative, superserie, riordino accessibile), usando l'archivio v2 e il guscio dello step 3, con test e2e nominati con l'ID della storia. Il codice è in inglese (file, route, identificatori, token CSS), i testi per l'utente in italiano: vedi "Lingua" in `AGENTS.md`. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Fermati alla fine dello step per mostrarmi le schermate e le decisioni prese.

## Stato a fine step 3 (10 ottobre 2026)

Tutto è su `main`. Decisioni dello step 3 nello "Stato" dello step 3 in PIANO.md; struttura, chiavi e convenzioni in `AGENTS.md`.

- **Guscio:** `src/layouts/AppLayout.astro` (ClientRouter, `AppHeader`, `TabBar`, `ArchiveStatus` che mostra la barra di salvataggio solo con un problema). Ogni pagina nuova usa `AppLayout` con `tab="routines"` ecc.
- **Percorso base:** ogni link passa da `appUrl()` (`src/lib/paths.ts`), con la barra finale per le pagine. I test usano percorsi relativi.
- **Archivio nelle isole:** `archiveStore()` di `src/lib/archive-store.svelte.ts` (`archive`, `state`, `isNew` reattivi; `update`; `repo`). Isole che leggono l'archivio: `client:only="svelte"`.
- **PWA:** service worker generato alla build (`src/integrations/service-worker.ts`), manifest in `src/pages/manifest.webmanifest.ts`, icone in `public/icons/` (`node scripts/make-icons.mjs`).
- **Componenti nuovi:** `Switch`, `Stepper` (valore a passi, da riusare per i recuperi della scheda), `SaveBar` con lo stato `unreadable`, `ImportFlow`. Formattazione dei testi in `src/lib/format.ts` (`formatDuration` "1:30", `plural`, `formatPeriod`).
- **Segnaposto:** `/routines` (step 4), `/calendar` (step 5), `/history` (step 8) sono stati vuoti; Oggi (`/`) fa solo il rimando a `/welcome` e conferma il diario (step 5).
- **App vecchia `bb-*` rimossa.**
- Verifica: 82 e2e verdi nella radice e con `BT_BASE=/bodytracker/`, 147 Vitest, `astro check` pulito, detector a 0.

## Step 4 in dettaglio: Schede

- Storie: US-07, US-08, US-09, US-10. Brief: `route-routines` (elenco `/routines`, editor `/routine?id=`; route in query string perché il sito è statico).
- **Dati:** schede in `archive.routines` (`Routine`, `RoutineExercise` in `src/lib/archive/types.ts`); carichi in kg (`loadMin`, `loadMax`, `loadNote`, `unit`), mostrati e accettati nell'unità scelta con `src/lib/units.ts`; recuperi in secondi (`Stepper` + `formatDuration`). Superserie: stessa stringa in `group`. Alternative: id di esercizi.
- **Catalogo:** `suggestExercises` per la ricerca (foglio dal basso), `ensureExercise` per un nome libero (US-14).
- **Vincoli:** eliminare una scheda con sessioni non si può (si archivia, US-10); limiti in `LIMITS` (200 schede, 100 voci, 20 alternative).
- **Verifica del piano:** e2e "crea scheda C con superserie e la ritrovi dopo il ricaricamento"; le schede A/B del PoC si devono poter ricreare identiche nell'editor.
- **Invito all'installazione dopo il primo allenamento concluso (US-03):** non è dello step 4: va nel riepilogo dello step 6.

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
- **Playwright:** installato anche globalmente (`$(npm root -g)/playwright`, 1.56), con Chromium in `/opt/pw-browsers`. Il progetto usa `@playwright/test` 1.64: lanciare gli e2e con `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e` (e di nuovo con `BT_BASE=/bodytracker/` davanti). Non eseguire `playwright install`. Per script di screenshot fuori dal repository: `NODE_PATH=$PWD/node_modules node script.cjs` (CommonJS, perché `NODE_PATH` non vale per gli ESM).
- **Chiusura dei server:** se serve `pkill`, non usare `pkill -f "astro preview"`: il pattern corrisponde anche alla shell che esegue il comando e la termina. Usare `pkill -f "[a]stro preview"`, **da solo** nel comando: se nella stessa riga compare anche il testo `astro preview` (es. `npx astro preview stop; pkill …`), la shell viene terminata lo stesso.
- **Avviso noto di `astro check`:** un hint su `BodyTracker/palestra/app.js` (`returnValue` deprecato). Va ignorato: il file sparirà allo step 9.
- **Detector:** a 0 su `src/` e sulle pagine renderizzate (`/welcome`, `/settings`, `/calendar`, `/kit` nei due temi). Sulle pagine senza archivio `/` porta a `/welcome`: per controllare Oggi serve un archivio nel browser.
- **Isole e build:** il rendering alla build esegue anche le isole `client:load`; se leggono l'archivio all'avvio la build fallisce ("L’archivio è disponibile solo nel browser"). Usare `client:only="svelte"` o leggere l'archivio in `onMount`.
- **Detector e larghezza:** il detector misura le pagine a larghezza desktop: righe oltre 80 caratteri e controlli con bordo dentro un `.panel` (nested cards) compaiono lì e non a 390px.
- **Rumore del proxy:** durante i test Chromium prova a contattare `accounts.google.com` e `android.clients.google.com` (servizi del browser, non dell'app): il proxy li rifiuta, non c'entra con il controllo "nessuna richiesta esterna" di US-03, che guarda solo le richieste della pagina.
- **Lucide 1.x:** alcune icone hanno cambiato nome; il pacchetto Astro non ha gli alias. Esempi: `trash-2` → `trash`, `history` → `rotate-ccw-clock`. Controllare in `node_modules/@lucide/astro/src/icons/`.
- **`light-dark()` nei token:** il valore si risolve dove il token viene usato, secondo il `color-scheme` di quell'elemento. Per questo dentro `.shell` (che dichiara `color-scheme: dark`) i token di contenuto danno la variante scura. Tailwind lascia `light-dark()` nativo nel CSS generato.
- **Playwright e anteprime:** un elemento `inert` viene comunque trovato da `getByRole`; nelle anteprime di `/kit` i controlli finti sono `div`, non `button`. Per l'overlay del timer usare `page.locator('dialog[open]')`.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
