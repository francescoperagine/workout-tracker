# Handoff: restyling BodyTracker, partenza dallo step 6

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 6 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e il brief `.impeccable/surfaces/route-workout.md` (più `src-components-workout-resttimer-svelte.md` per sapere cosa arriva allo step 7). Esegui lo **step 6** del piano (allenamento attivo su `/workout`, al posto del segnaposto dello step 5: elenco esercizi con i target della scheda e la superserie, righe serie `tipo/n · precedente · kg|lb · rip · ✓` con la spunta su una riga vuota che conferma il precedente (1 tocco), tipi di serie, aggiungi e togli serie ed esercizi con "Annulla", riordino con frecce, varianti con "Altro esercizio…", note sul carico, approfondimento dell'esercizio in un foglio, barra fissa con durata e salvataggio, "Termina" con riepilogo e invito all'installazione dopo il primo allenamento concluso, sessione riapribile, mini-barra persistente nelle altre pagine), usando l'archivio v2, Oggi e il Calendario dello step 5, con test e2e nominati con l'ID della storia (US-12…US-20, conteggio dei tocchi per P1). Il codice è in inglese (file, route, identificatori, token CSS), i testi per l'utente in italiano: vedi "Lingua" in `AGENTS.md`. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Fermati alla fine dello step per mostrarmi le schermate e le decisioni prese, con raccomandazioni per le decisioni aperte.

## Stato a fine step 5 (10 ottobre 2026)

Tutto è su `main`. Decisioni dello step 5 nello "Stato" dello step 5 in PIANO.md (alcune da confermare con l'utente); struttura, chiavi e convenzioni in `AGENTS.md`.

- **Oggi** (`src/components/today/Today.svelte`): striscia della settimana, righe a scelta singola da `quickStart` con la suggerita selezionata, "Altra scheda", "Allenamento libero", "Inizia allenamento" appiccicato sopra la tab bar; "Riprendi allenamento" con una sessione in corso; "Fatto oggi · Riapri"; ultimo allenamento.
- **Calendario** (`src/components/calendar/`): settimana e mese, foglio del giorno con l'eccezione per data, settimana tipo con un `select` per giorno. `?date=YYYY-MM-DD` apre il foglio del giorno, `?view=month` il mese, `#week-plan` la settimana tipo.
- **Logica:** `src/lib/archive/calendar.ts` (date, stato del giorno, settimana tipo, eccezioni) e `sessions.ts` (`startSession`, `reopenSession`, `finishSession`, `removeSession`/`restoreSession`, `summarizeSession`, `currentExercise`, `lastFinishedSession`). `blocksOf`/`orderLabels` accettano anche le voci di sessione.
- **`/workout`** è il segnaposto `WorkoutPlaceholder.svelte`: la sessione esiste già (creata da Oggi con le voci della scheda e le serie vuote), lo step 6 la rende registrabile. Sostituire il componente, non la pagina.
- Verifica: 144 e2e verdi nella radice e con `BT_BASE=/bodytracker/`, 195 Vitest, `astro check` pulito, detector a 0 su `src/`, `/calendar`, `/workout` e `/kit` nei due temi (resta la nota consultiva `flat-type-hierarchy`).

## Step 6 in dettaglio: allenamento attivo

- Storie: US-11 (avvio, già fatto), US-12…US-20. Brief: `route-workout`.
- **Sessione:** già creata da `startSession`; le serie hanno `kg`/`reps`/`completedAt` a `null`. "Precedente" = stessa serie (indice e variante) dell'ultima sessione conclusa con quell'esercizio (PIANO, "Regole di comportamento chiave").
- **Fine:** `finishSession` chiede almeno un esercizio (regola del PoC); il riepilogo è dello step 6, l'invito all'installazione (US-03) va lì (`canPromptInstall`/`promptInstall` di `src/lib/pwa.ts`).
- **Mini-barra (US-17):** nelle altre pagine, `transition:persist` nell'`AppLayout`; aggiornare `--bottom-bars-height` come fanno tab bar e `ArchiveStatus`. Oggi mostra già "Riprendi" e il Calendario "In corso".
- **Barra di salvataggio:** sull'allenamento attivo è sempre visibile (decisione dello step 3).
- **Prova reale in palestra** alla fine dello step, con la checklist di USER-STORIES.md §5.

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
- **Playwright e anteprime:** un elemento `inert` viene comunque trovato da `getByRole`; nelle anteprime di `/kit` i controlli finti sono `div`, non `button`. Per l'overlay del timer usare `page.locator('dialog[open]')`.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
