# Handoff: restyling BodyTracker, partenza dallo step 7

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 7 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e i brief `.impeccable/surfaces/src-components-workout-resttimer-svelte.md` e `route-workout.md`. Prima di cominciare, chiedimi l'esito della prova in palestra dello step 6 (checklist di USER-STORIES.md §5) e le risposte alle decisioni aperte dello step 6 elencate in HANDOFF.md, e applica le correzioni. Poi esegui lo **step 7** del piano (timer di recupero: la spunta della serie avvia il recupero a tutto schermo con il livello che si svuota, −15 s, +15 s, Salta, Riduci in barra sopra la barra dell'allenamento e nella mini-barra delle altre pagine, prossima serie attesa, recupero di riscaldamento, superserie che recuperano solo a fine giro, 0 = nessun timer, recupero predefinito se la voce non ne ha, togliere la spunta annulla il timer; motore basato sull'istante di fine persistito nella sua chiave, ricalcolo a `visibilitychange`, wake lock, suono con `AudioContext` e vibrazione secondo le Impostazioni, annunci a 30 s, 10 s e fine; predisposizione Web Push senza server), usando l'allenamento attivo dello step 6, con test Vitest a orologio finto ed e2e con `page.clock` nominati con l'ID della storia (US-21…US-26). Il codice è in inglese (file, route, identificatori, token CSS), i testi per l'utente in italiano: vedi "Lingua" in `AGENTS.md`. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Fermati alla fine dello step per mostrarmi le schermate e le decisioni prese, con raccomandazioni per le decisioni aperte.

## Stato a fine step 6 (10 ottobre 2026)

Tutto è su `main`. Decisioni dello step 6 nello "Stato" dello step 6 in PIANO.md; struttura, chiavi e convenzioni in `AGENTS.md`.

- **Allenamento attivo** (`src/components/workout/Workout.svelte` e vicini): un pannello per blocco (esercizio o superserie), righe serie con il precedente, spunta che conferma il precedente, tipi di serie, varianti con "Altro esercizio…", note sul carico, approfondimento, riordino, nome e data, barra fissa con durata, "Salvato" e "Termina", riepilogo su `/workout?summary=<id>` con record di carico e invito all'installazione dopo il primo allenamento.
- **Logica:** `src/lib/archive/workout.ts` (precedente, spunta, serie da fare con alternanza in superserie, voce della scheda, modifiche della sessione con "Annulla", varianti, record, riepilogo). `finishSession` chiede ora almeno un valore.
- **Guscio:** mini-barra `WorkoutMiniBar` con `transition:persist` (nascosta su Oggi e `/workout`); lo stack in basso si somma con `setBottomBar` (`src/lib/bottom-bars.ts`); `beforeunload` nello store dell'archivio.
- **Componenti base:** `SetRow` e `SetInput` sono ora controllati (valori dall'archivio, `ontype`, `oncopy`, `onkg`, `onreps`, `oncheck` che restituisce il campo da compilare); `SaveBar` ha `detail` e `compact`.
- Verifica: 198 e2e verdi nella radice e con `BT_BASE=/bodytracker/`, 213 Vitest, `astro check` pulito, detector a 0 su `src/`.

## Decisioni aperte dello step 6 (da chiedere all'utente)

1. **Togliere una serie in mezzo:** oggi "Togli serie" toglie solo l'ultima. Raccomandazione: tenerlo così e, se in palestra serve, aggiungere lo swipe a sinistra sulla riga come scorciatoia allo step 9.
2. **"Termina" senza conferma** anche con serie non spuntate: il riepilogo ha "Riapri". Raccomandazione: tenerlo, salvo tocchi accidentali in palestra.
3. **Tab bar durante l'allenamento:** resta visibile (navigazione e mini-barra). A 320×568 lascia circa 380px al contenuto. Raccomandazione: tenerla; alternativa da provare se lo spazio pesa, nasconderla sull'allenamento.
4. **Mini-barra su Oggi:** nascosta perché Oggi ha "Riprendi allenamento". Allo step 7 deve mostrare il timer ridotto: raccomandazione, su Oggi mostrarla solo con un recupero in corso.
5. **Durata in minuti** nella barra (non un orologio che scorre ogni secondo). Raccomandazione: tenerla.
6. **"Cambia esercizio" sempre visibile** su ogni esercizio aperto (anche senza alternative). Raccomandazione: tenerlo, è il flusso 3 (macchina occupata).
7. **Peso facoltativo** alla spunta (corpo libero): una riga con le sole ripetizioni si spunta. Raccomandazione: tenerlo.

## Prova reale in palestra (dopo lo step 6)

Con la checklist di USER-STORIES.md §5: tocchi per serie (1 se si ripete la volta scorsa), leggibilità di cifre e precedente al sole e in penombra, tastiera che non copre la riga, interruzioni (schermo bloccato, app chiusa e riaperta), variante con la macchina occupata, superserie 2a/2b, "Termina" e riepilogo.

## Step 7 in dettaglio: timer di recupero

- Storie: US-21…US-26. Brief: `src-components-workout-resttimer-svelte` (contratto di direzione: livello che si svuota, schermo lime a fine recupero).
- **Esistente:** `RestTimer.svelte` (schermo intero, barra ridotta, anteprime in `/kit`), basato già sull'istante di fine; `KitSetRows` lo usa come demo. Manca il motore persistito (`RestTimerState` nel modello dati del PIANO, chiave separata).
- **Dove agganciarlo:** `WorkoutExercise` chiama `onchecked()` dopo una spunta riuscita: `Workout.afterCheck` conosce `nextSet` (la prossima serie, per la riga "Prossima") e il blocco (superserie: recupero solo dopo l'ultimo del giro; `nextSet` dice già a chi tocca). Togliere la spunta (`updateSet` con `completedAt: null`) deve annullare il timer di quella serie. Recupero: `exercise.rest` o `warmupRest` per le serie di riscaldamento; 0 = nessun timer; se manca, `settings.defaultRest`.
- **Barre:** la barra ridotta va sopra la barra dell'allenamento (`setBottomBar` con un id suo) e nella mini-barra delle altre pagine (`WorkoutMiniBar`, persistente).
- **Impostazioni:** suono e vibrazione sono già in `settings` (US-21…US-24 della pagina Impostazioni, test `us-21-us-24-training-settings`).

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
- **Detector:** a 0 su `src/` e sulle pagine renderizzate (`/welcome`, `/settings`, `/calendar`, `/kit` nei due temi). Sulle pagine senza archivio `/` porta a `/welcome`: per controllare Oggi serve un archivio nel browser. Lo stesso vale per `/routines` e `/routine?id=`: il detector apre un browser senza archivio e vede solo lo stato vuoto; le schermate con dati si controllano con uno script Playwright che mette un archivio nel `localStorage` (`addInitScript`) e fotografa a 390×844 e 320×568 nei due temi. Le note consultive (`flat-type-hierarchy`) non sono errori.
- **Isole e build:** il rendering alla build esegue anche le isole `client:load`; se leggono l'archivio all'avvio la build fallisce ("L’archivio è disponibile solo nel browser"). Usare `client:only="svelte"` o leggere l'archivio in `onMount`.
- **Detector e larghezza:** il detector misura le pagine a larghezza desktop: righe oltre 80 caratteri e controlli con bordo dentro un `.panel` (nested cards) compaiono lì e non a 390px.
- **Rumore del proxy:** durante i test Chromium prova a contattare `accounts.google.com` e `android.clients.google.com` (servizi del browser, non dell'app): il proxy li rifiuta, non c'entra con il controllo "nessuna richiesta esterna" di US-03, che guarda solo le richieste della pagina.
- **Lucide 1.x:** alcune icone hanno cambiato nome; il pacchetto Astro non ha gli alias. Esempi: `trash-2` → `trash`, `history` → `rotate-ccw-clock`. Controllare in `node_modules/@lucide/astro/src/icons/`.
- **`light-dark()` nei token:** il valore si risolve dove il token viene usato, secondo il `color-scheme` di quell'elemento. Per questo dentro `.shell` (che dichiara `color-scheme: dark`) i token di contenuto danno la variante scura. Tailwind lascia `light-dark()` nativo nel CSS generato.
- **Fuso orario nei test:** il browser di Playwright è in `Europe/Rome`, il container in UTC. Per `page.clock.setFixedTime` usare istanti con il fuso esplicito (`'2026-10-08T18:30:00+02:00'`); l'aiuto `session()` di `tests/e2e/helpers.ts` crea sessioni alle 18:00 UTC, cioè le 20:00 nel browser.
- **Spazi in Svelte:** uno spazio tra `}` e `{#if}` può sparire ("da 25 min· Panca"): le righe di metadati si compongono nello script con `[…].filter(Boolean).join(' · ')`.
- **Testo nascosto e `getByText`:** un `<span class="sr-only">Durata: </span>` perde lo spazio finale; scrivere lo spazio fuori dallo span. Per i testi composti meglio `getByRole('paragraph').filter({ hasText })`.
- **Stack in basso:** non scrivere `--bottom-bars-height` a mano nelle pagine dell'app: usare `setBottomBar` (le isole ricreate si ridichiarano a ogni pagina, quelle persistenti restano).
- **Playwright e anteprime:** un elemento `inert` viene comunque trovato da `getByRole`; nelle anteprime di `/kit` i controlli finti sono `div`, non `button`. Per l'overlay del timer usare `page.locator('dialog[open]')`.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
