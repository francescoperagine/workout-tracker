# Handoff: restyling Workout Tracker, step 9

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 9 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

**Step 9**, dopo la conferma delle decisioni dello step 8:

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e i brief in `.impeccable/surfaces/`. L'app si chiama **Workout Tracker** ed è pubblicata a ogni push su `main` su `https://workout-tracker.francescoperagine.workers.dev`. Prima di cominciare, chiedimi l'esito delle prove sull'app installata dello storico e dei progressi (step 8) e del suono di fine recupero corretto, e le risposte alle decisioni aperte dello step 8 elencate in HANDOFF.md, e applica le correzioni. Poi esegui lo **step 9** del piano (rifinitura, eliminazione del PoC e rilascio): `critique`, `audit`, `harden` e `polish` di Impeccable sui flussi di USER-STORIES.md §4; verifica della tabella "Assorbimento del PoC" (ogni riga con un e2e verde); eliminazione di `BodyTracker/` con le parti utili di `LEGGIMI.md` nel `README.md`; `/kit` fuori dalla build pubblicata ma disponibile ai test; decisione sulla lettura diretta della chiave del PoC (`readPocKey`); verifica che non resti «BodyTracker» tranne il formato d'import `bodytracker.archivio.v1`; aggiornamento di `AGENTS.md` e `README.md`. Il codice è in inglese (file, route, identificatori, token CSS), i testi per l'utente in italiano: vedi "Lingua" in `AGENTS.md`. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Un push su `main` è un deploy in produzione: pusha solo con `npm run check`, `npm test`, `npm run build` e le suite e2e verdi (anche con `WT_BASE=/workout-tracker/`). Fermati alla fine dello step per mostrarmi le schermate e le decisioni prese, con raccomandazioni per le decisioni aperte; poi i passi del «Rilascio» in PIANO.md.

## Stato a fine step 8 (12 ottobre 2026)

Tutto è su `main`. Decisioni dello step nello «Stato» dello step 8 in PIANO.md; struttura e route in `AGENTS.md`.

- **Prove in palestra (risposte del 12 ottobre 2026):** variante con la macchina occupata a posto; superserie non provate (l'utente fa al massimo le serie di avvicinamento); timer al sole e in penombra non provabili; solo Android (telefono di cinque anni), niente iPhone; suono udibile ma basso → onda quadra e volume più alto in `src/lib/rest-alert.ts`. Decisioni aperte dello step 7: confermate tutte le raccomandazioni.
- **Storico e progressi:** `/history` (Allenamenti per mese e vista Esercizi), `/session?id=` (dettaglio modificabile: `Workout` con `detail`, nessun recupero, «Riapri», «Elimina» con conferma e «Annulla»), `/exercise?id=` (record, grafico `ProgressChart` in SVG, cronologia), calcoli in `src/lib/archive/progress.ts`, record di carico, 1RM e volume nel riepilogo (`sessionRecords`). Il foglio del giorno del calendario apre il dettaglio.
- **Verifiche:** `npm run check` 0 errori, `npm test` 252 Vitest (18 nuovi in `progress.test.ts`), `npm run build` ok, `npm run test:e2e` 278 verdi e `WT_BASE=/workout-tracker/ npm run test:e2e` 278 verdi (28 nuovi in `us-27-us-29-history.spec.ts`, più il riepilogo di US-18 aggiornato ai record di 1RM), detector a 0 sui file toccati. Schermate a 390×844 e 320×568 nei due temi (Storico, Esercizi, dettaglio, pagina esercizio con grafico) mostrate all’utente.

## Decisioni aperte dello step 8 (da chiedere all'utente)

1. **Periodo predefinito «3 mesi»** sul grafico. Raccomandazione: tenerlo (l'andamento recente è quello che conta in palestra); se lo storico è più corto, «Tutto» mostra lo stesso.
2. **Un grafico con «Misura» invece di tre grafici uno sotto l'altro**, per non fare un cruscotto (anti-obiettivo del brief). Raccomandazione: tenerlo.
3. **Dettaglio con gli esercizi compattati** («Mostra serie» per vedere e correggere le righe), come un esercizio fatto nell'allenamento. Raccomandazione: tenerlo: si legge tutta la sessione a colpo d'occhio e la correzione costa un tocco.
4. **Record nella riga serie solo per il carico**; 1RM e volume solo nel riepilogo e nello Storico. Raccomandazione: tenerlo, perché un trofeo di volume a metà esercizio cambierebbe a ogni spunta.
5. **Storico con la vista Esercizi** (non prevista dal brief, che entrava ai progressi solo dalla riga dell'esercizio e dal calendario). Raccomandazione: tenerla, risponde a «sto progredendo sulla panca?» senza cercare una sessione.
6. **Esercizi a corpo libero:** nessun grafico (manca il carico) e il motivo al suo posto; ripetizioni nella cronologia. Raccomandazione: rimandare un grafico delle ripetizioni a quando servirà.

## Stato dopo la correzione del calendario (12 ottobre 2026)

Specifica approvata il 12 ottobre 2026 (problema segnalato da Francesco sul telefono: la domenica la settimana lunedì–domenica era quasi tutta nel passato, il foglio del giorno non creava schede né avviava allenamenti, nessuna guida). Riassunto in PIANO.md, «Stato» dello step 5; brief `route-calendar.md` aggiornato.

- **Vista settimana:** finestra di 7 giorni da oggi (`windowDates`, `windowStartFor` in `calendar.ts`, con Vitest), etichetta «Prossimi 7 giorni», frecce di 7 giorni, «Torna a oggi»; `?date=` sposta la finestra solo se la data cade fuori da quella di partenza. Vista mese e `WeekStrip` invariate; la vista mese ha la sua ancora, non più condivisa con la settimana.
- **Foglio del giorno (`DaySheet`):** oggi «Inizia «Scheda X»» o «Inizia allenamento libero»; giorni passati «Registra un allenamento fatto» (`startSession` + `setSessionDate` in un solo `edit`); con un allenamento in corso solo «Riprendi l’allenamento in corso»; da oggi in poi «+ Nuova scheda» crea la scheda, la assegna alla data e apre `/routine?id=…&date=…`, dove il link di ritorno è «Torna al calendario».
- **Senza schede:** pannello «Per pianificare serve una scheda.» con «Crea scheda» al posto dell'avviso sulla settimana tipo. **Suggerimento** sopra le righe fino al primo foglio aperto (chiave `workout-tracker.calendarHint`, in AGENTS.md).
- **Impostazioni:** sezione «Come funziona» (`#s-guide`) prima di Dati e privacy. Etichette allineate all'interfaccia: il punto 4 dice «il precedente» (intestazione della colonna), il punto 5 «Cambia esercizio» (il pulsante vero) invece di «scegli una variante».
- **Test:** `us-04-us-06-calendar` aggiornato alla finestra (i casi del 5–7 ottobre passano da «Settimana precedente») più 7 e2e nuovi (US-04, US-05 ×2, US-06, US-11 ×2, US-20) e uno della guida in `us-21-us-24-training-settings`. In `kit.spec.ts` i due test con un clic su un'isola ora aspettano l'idratazione (`hydrated()`): fallivano già prima della correzione con più worker, perché il clic cadeva sull'HTML statico.
- **Verifiche:** `npm run check` exit 0 (0 errori), `npm test` exit 0 (234 Vitest), `npm run build` exit 0, `npm run test:e2e` exit 0 (250), `WT_BASE=/workout-tracker/ npm run test:e2e` exit 0 (250), `npx impeccable detect` sui file toccati exit 0. Schermate a 390×844 e 320×568 nei due temi (settimana, oggi, giorno futuro, giorno passato) mostrate all'utente.

## Stato dopo la rinomina (11 ottobre 2026)

- **Nome:** l'app si chiama **Workout Tracker** (breve «Workout» sotto l'icona), non più BodyTracker: decisione 12 di PIANO.md. Rinominati testi, manifest, titoli, chiavi di `localStorage` (`workout-tracker.archive.v2`, `.theme`, `.lastBackup`, `.restTimer`), nomi dei file di backup (`workout-tracker-AAAA-MM-GG.json`), variabili `WT_BASE`/`WT_SITE`, nome del pacchetto, sito predefinito `https://workout-tracker.francescoperagine.com`. Restano apposta il formato d'import del PoC `bodytracker.archivio.v1` e i percorsi della cartella `BodyTracker/`, che lo step 9 elimina.
- **Pubblicazione** (decisioni 7, 10, 13 e sezione «Rilascio» di PIANO.md): Worker Cloudflare `workout-tracker` collegato al repository, ramo di produzione `main`, build dei rami diversi da `main` disattivate. Creato da Francesco dalla dashboard il 12 ottobre 2026 (un Worker con Workers Builds, non un progetto Pages; nessun file `wrangler` nel repository). Fino al rilascio l'app vive solo su `https://workout-tracker.francescoperagine.workers.dev`; il dominio e la voce nella pagina Projects del sito personale arrivano alla fine dello step 9.
- **`/kit`** esce dalla build pubblicata allo step 9 (decisione 14), restando disponibile ai test.
- Verifica dopo la rinomina: `npm run check` 0 errori, 232 Vitest, `npm run build` ok, 234 e2e verdi nella radice e con `WT_BASE=/workout-tracker/`.
- **Rami:** Francesco ha approvato la cancellazione dei rami `claude/*` vecchi (già contenuti in `main`). Dal container cloud il proxy git rifiuta le cancellazioni: restano `claude/jolly-hawking-9tb1t4` e `claude/stoic-knuth-xd0bx6`, da cancellare in locale (`git push origin --delete …`) o da GitHub.

## Stato a fine step 7 (10 ottobre 2026)

Tutto è su `main`. Decisioni dello step 7 (e risposte dell'utente sulle decisioni dello step 6) nello "Stato" dello step 7 in PIANO.md; struttura, chiavi e convenzioni in `AGENTS.md`.

- **Timer di recupero:** motore puro in `src/lib/rest-timer.ts` (istante di fine, ±15 s, quale recupero parte, superserie a fine giro, timer non più valido, soglie degli annunci, prossima serie), store in `src/lib/rest-timer.svelte.ts` (chiave `workout-tracker.restTimer`, scatti di 250 ms, `visibilitychange`, evento `storage`, avviso una volta sola, "Vai" chiuso dopo 6 s in vista), avvisi in `rest-alert.ts`, schermo acceso in `wake-lock.ts`, `RestNotifier` in `rest-notifier.ts`, handler `push`/`notificationclick` in `public/sw-push.js`.
- **Componenti:** `RestTimer` (vista a tutto schermo, anche anteprima di `/kit`), `RestTimerBar` (ridotto, sopra la barra dell'allenamento e nella mini-barra con la freccia verso l'allenamento), `RestTimerHost` nel guscio (`transition:persist`). La mini-barra compare su Oggi solo con un recupero.
- **Correzione dello step 6 (decisione 1 dell'utente):** il tocco sul numero della serie apre il foglio della serie (tipo e "Togli serie" per qualsiasi riga); il pulsante "Togli serie" sotto le righe non c'è più.
- **Recupero predefinito:** una voce del PoC con recupero mancante o illeggibile prende il predefinito (prima 0 = nessun timer).
- Verifica: 234 e2e verdi nella radice e con `WT_BASE=/workout-tracker/`, 232 Vitest, `astro check` pulito, detector a 0 su `src/`. Revisione finale di Impeccable fatta in linea (nessun agente): nessun elemento del Refuse list.

## Step 9 in dettaglio

Vedi «Step 9» e «Rilascio» in PIANO.md. Da ricordare: la prova sull'app installata è su Android (nessun iPhone disponibile), quindi i punti iOS della checklist di `docs/restyling/WEB-PUSH.md` restano non verificati; `readPocKey` (lettura diretta del PoC) è da togliere secondo la raccomandazione in «Da non dimenticare».

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
- **Avviso noto di `astro check`:** un hint su `BodyTracker/palestra/app.js` (`returnValue` deprecato). Va ignorato: il file sparirà allo step 9.
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

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
- **Lettura diretta del PoC (`readPocKey`):** serviva se la nuova app fosse stata pubblicata sulla stessa origine del PoC, ma il PoC non è mai stato pubblicato. Allo step 9 decidere se toglierla con i testi che la citano (PIANO.md «Assorbimento del PoC», AGENTS.md, brief `route-welcome`); raccomandazione: toglierla, l'import da file resta.
