# Handoff: restyling BodyTracker, partenza dallo step 2

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, lo step 2 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/PIANO.md`, `docs/restyling/USER-STORIES.md`, `PRODUCT.md` e `DESIGN.md`. Esegui lo **step 2** del piano (dati: archivio v2, unità, import del PoC, catalogo e schede iniziali) con test Vitest. Lavora direttamente su `main`, senza branch, e fai push su `main`. Fermati alla fine dello step per mostrarmi i test e le decisioni prese.

## Stato a fine step 1 (10 ottobre 2026)

Tutto è su `main`.

- **Storie e brief confermati** (commit `docs: conferma di storie e brief…`): spunta su riga vuota = conferma del precedente (1 tocco, P1); US-09, US-25, US-16, US-19, US-20 sono M; criteri aggiunti a US-15, US-21, US-27, US-33; esclusioni della v1; struttura confermata (`/benvenuto`, riepilogo dopo Termina, Impostazioni da icona, Progressi in Storico, vista mese). Vedi BRIEF.md §4.
- **Design system (step 1):**
  - scelte dell'utente: tema chiaro "guscio verde" (intestazione, barra di salvataggio, tab bar e timer restano verde scuro con accento lime anche nel tema chiaro), font **Atkinson Hyperlegible Next** self-hosted in `public/fonts/`, timer a **livello che si svuota** con stato "Vai" tutto lime;
  - `DESIGN.md` e `.impeccable/design.json` riscritti dalla build; token in `@theme` in `src/styles/global.css` con `light-dark()`; `tailwind.config.mjs` rimosso;
  - tema: `src/lib/tema.ts`, chiave `bodytracker.tema` (preferenza del dispositivo, non nell'archivio), script inline in `src/layouts/Base.astro`;
  - componenti base in `src/components/ui/`, timer in `src/components/allenamento/TimerRecupero.svelte` (motore provvisorio basato sull'istante di fine; persistenza, wake lock e suono allo step 7);
  - `/kit` (`src/pages/kit.astro`, `?tema=chiaro|scuro`), test e2e US-30, detector a 0 su `/kit` nei due temi.
- **Pagine vecchie** (index, workout, about, `Layout.astro`, archivio `bb-*`): invariate, con la palette di default di Tailwind. Le sostituiscono gli step 2–6.
- **Hook del detector** attivo in `.claude/settings.json`.

## Step 2 in dettaglio: dati

Obiettivo dal piano: `src/lib/archivio/` (tipi, validazione, repository con revisione, quota e conflitto tra schede, evento di aggiornamento), `src/lib/unita.ts`, import ed export v2, import del backup del PoC e lettura diretta della sua chiave, conversione di `BodyTracker/palestra/esercizi.js` in `src/data/` con gli **stessi ID**, rimozione del codice `bb-*` quando le pagine nuove non ne dipendono più. Storie: US-02 (logica), US-31 (logica), US-33.

- Il modello dati v2 è in PIANO.md; `impostazioni.tema` è stato tolto (il tema vive in `bodytracker.tema`).
- Due requisiti aggiunti dopo lo step 1 toccano i dati: la **variante scritta a mano** (US-14: un nome nuovo diventa un esercizio personalizzato in `catalogo`, riconosciuto senza maiuscole, spazi e accenti) e l'**avvio dalle ultime 4 schede** (US-11: serve una funzione che dia le schede distinte più recenti e quella suggerita). Prevederli nel repository e nei test.
- Altri temi in futuro: il registro è in `src/lib/tema.ts`, la procedura in DESIGN.md, "Aggiungere un tema".
- Limiti, messaggi e comportamenti del PoC (quota, archivio illeggibile, conflitto tra schede) sono la specifica: leggere `BodyTracker/palestra/app.js` e `BodyTracker/LEGGIMI.md`.
- Recuperi come "2′" o "60–75″" → secondi, valore minimo dell'intervallo; carichi testuali → `caricoMin`, `caricoMax`, `notaCarico`.
- Verifica: Vitest su validazione, import del PoC (backup sintetico finché l'utente non ne fornisce uno reale), conflitti, quota, conversioni di unità andata e ritorno.
- Le pagine vecchie usano ancora `src/scripts/bodytracker.ts`: se lo step 2 rimuove `bb-*` prima che gli step 3–6 abbiano sostituito le pagine, aggiornare anche lo smoke test.

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
