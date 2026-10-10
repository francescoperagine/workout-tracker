# Handoff: restyling BodyTracker, partenza dallo step 3

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 3 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md`, `DESIGN.md` e i brief delle superfici dello step 3. Esegui lo **step 3** del piano (guscio dell'app con tab bar e `ClientRouter`, PWA con manifest e service worker, percorso base `BT_BASE`, Impostazioni con tema, unità, recupero, suono e vibrazione, Dati e privacy con export, import v2 e del PoC, primo avvio `/benvenuto`), usando l'archivio v2 dello step 2, con test e2e nominati con l'ID della storia. Lavora sempre e solo su `main`: niente branch né pull request, anche se la sessione ne propone uno; commit e push direttamente su `main`. Fermati alla fine dello step per mostrarmi le schermate e le decisioni prese.

## Stato a fine step 2 (10 ottobre 2026)

Tutto è su `main`.

- **US-11 deciso dall'utente:** su Oggi la scheda suggerita è **già selezionata**; "Inizia allenamento" parte con 1 tocco, toccare un'altra riga la seleziona (2 tocchi), non avvia. Registrato in USER-STORIES.md, nel brief `route.md` e in BRIEF.md §4.
- **Step 1** (design system, `/kit`, temi): invariato, vedi PIANO.md.
- **Step 2 (dati):** fatto. Moduli e chiavi in `AGENTS.md`; decisioni nello "Stato" dello step 2 in PIANO.md. In breve:
  - `src/lib/archivio/`: modello v2, validazione, `RepositoryArchivio` (revisione, quota, archivio illeggibile, conflitto tra schede, `ascolta`), catalogo con esercizi personalizzati (US-14), `avvioRapido` (US-11), conversione del PoC, import del PoC, export/import v2 con anteprima e unione;
  - `src/lib/unita.ts`; `src/data/catalogo.ts` e `schede-iniziali.ts` (ID del PoC invariati, test di parità con `esercizi.js`);
  - 135 test Vitest verdi (anche con fusi orari diversi), `astro check` e build verdi, e2e invariati e verdi.
- **Non ancora usato da nessuna pagina:** l'archivio v2 entra nell'interfaccia dallo step 3. Le pagine vecchie usano ancora `bb-*`.

## Step 3 in dettaglio: guscio e PWA

- Storie: US-01, US-02 (interfaccia), US-03, US-30, US-31, US-32, US-33. Brief: `route-benvenuto`, `route-impostazioni` e il guscio (vedi BRIEF.md).
- **Archivio nell'interfaccia:** `archivioCondiviso()` una volta per pagina; `richiediPersistenza()` all'avvio; barra di salvataggio collegata a `repo.stato`/`repo.messaggio` con "Salva ora" (`repo.salvaOra()`); stato `illeggibile` → download di `repo.contenutoOriginale` e import; stato `conflitto` → messaggio in linea e "Ricarica" (`repo.ricarica()`).
- **Primo avvio:** `repo.nuovo` indica che non c'è ancora un archivio. "Inizia con le schede di esempio" = `repo.aggiorna(conSchedeIniziali)`; "Parti da zero" = salvataggio dell'archivio vuoto. Da qui anche l'import del PoC.
- **Import:** `controllaDimensione(file.size)`, `leggiBackup(testo, repo.archivio)`, `anteprimaImport` (numero di allenamenti, periodo, nuovi e già presenti, scartati con il motivo, avvisi), scelta "mantieni"/"sostituisci", `unisciImport`, `repo.sostituisci`. Lettura diretta del PoC: `leggiChiavePoc()` sulla stessa origine. Per l'e2e c'è `tests/fixtures/backup-poc-sintetico.json`.
- **Export:** `esportaArchivio(repo.archivio)` con `nomeFileBackup()`.
- **Unità e impostazioni:** `repo.aggiorna(a => ({ ...a, impostazioni: { ... } }))`; il tema resta in `src/lib/tema.ts`. La distanza non ha ancora effetti visibili e le Impostazioni lo dicono.
- **Codice `bb-*`:** si rimuove con l'ultima pagina vecchia sostituita (step 3–6), aggiornando lo smoke test.

## Insidie dell'ambiente (container cloud)

- **Rete:** la policy blocca molti siti, tra cui `hevyapp.com`, `strongapp.io`, `docs.astro.build`, `impeccable.style` e `raw.githubusercontent.com` (403 dal proxy). Funzionano `npm`, `git clone` da GitHub e la ricerca web. Per leggere un repository pubblico: `add_repo` (accesso in lettura), poi `git clone --depth 1` in `/home/user/<owner>/<repo>`. Il repository di Impeccable si clona così in `/home/user/pbakaus/impeccable`.
- **Installazione di Impeccable:** `npx impeccable install` fallisce, perché scarica da `impeccable.style`. La skill in `.claude/skills/impeccable/` è la copia di `plugin/skills/impeccable` del repository ufficiale (commit `d631a88`, versione 4.5.2). Per aggiornarla, ripetere la copia da una versione nuova.
- **Launcher di Impeccable e hook:** dallo step 1 il launcher (`.claude/skills/impeccable/scripts/impeccable`) parte senza blocchi; al primo uso scarica il binario in `~/.impeccable/bin`. L'hook è in `.claude/settings.json`. `npx impeccable detect src/` (motore da npm) funziona senza permessi speciali.
- **Agenti di Impeccable:** gli agenti "shipped" (finish reviewer, documenter) non sono installati: si lanciano come agenti generici che seguono `reference/degraded/finish-reviewer.md` e `reference/degraded/documenter.md`.
- **Formato dei brief:** se il launcher non è disponibile, i brief si scrivono a mano in `.impeccable/surfaces/<slug>.md`. Il frontmatter è `version: 1`, `slug`, `primary_target` (`route:/percorso` o un file) e `related_targets`. Lo slug è il target in kebab-case: `route:/schede` → `route-schede`, `route:/` → `route`.
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
  Per il tema chiaro e scuro, ripetere forzando `data-theme` (ad esempio con un parametro di `/kit` che lo imposta).
- **Playwright:** installato anche globalmente (`$(npm root -g)/playwright`, 1.56), con Chromium in `/opt/pw-browsers`. Il progetto usa `@playwright/test` 1.64: lanciare gli e2e con `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`. Non eseguire `playwright install`.
- **Chiusura dei server:** se serve `pkill`, non usare `pkill -f "astro preview"`: il pattern corrisponde anche alla shell che esegue il comando e la termina. Usare `pkill -f "[a]stro preview"`, **da solo** nel comando: se nella stessa riga compare anche il testo `astro preview` (es. `npx astro preview stop; pkill …`), la shell viene terminata lo stesso.
- **Avviso noto di `astro check`:** un hint su `BodyTracker/palestra/app.js` (`returnValue` deprecato). Va ignorato: il file sparirà allo step 9.
- **Detector su `src/`:** segnala un `side-tab` (`border-l-4`) in `src/pages/about.astro`: è la grafica vecchia e sparirà con il restyling. I componenti nuovi e `/kit` sono a 0.
- **Lucide 1.x:** alcune icone hanno cambiato nome; il pacchetto Astro non ha gli alias. Esempi: `trash-2` → `trash`, `history` → `rotate-ccw-clock`. Controllare in `node_modules/@lucide/astro/src/icons/`.
- **`light-dark()` nei token:** il valore si risolve dove il token viene usato, secondo il `color-scheme` di quell'elemento. Per questo dentro `.guscio` (che dichiara `color-scheme: dark`) i token di contenuto danno la variante scura. Tailwind lascia `light-dark()` nativo nel CSS generato.
- **Playwright e anteprime:** un elemento `inert` viene comunque trovato da `getByRole`; nelle anteprime di `/kit` i controlli finti sono `div`, non `button`. Per l'overlay del timer usare `page.locator('dialog[open]')`.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
