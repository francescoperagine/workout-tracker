# Handoff: restyling BodyTracker, partenza dallo step 1

Questo documento serve a riprendere il lavoro in una nuova conversazione. Contiene lo stato del repository, le decisioni ancora da chiedere, lo step 1 in dettaglio e le insidie dell'ambiente già incontrate.

## Prompt da incollare nella nuova conversazione

> Leggi `AGENTS.md`, `docs/restyling/HANDOFF.md`, `docs/restyling/BRIEF.md`, `docs/restyling/USER-STORIES.md`, `docs/restyling/PIANO.md`, `PRODUCT.md` e `DESIGN.md`. Prima chiedimi le decisioni ancora aperte elencate nell'handoff e aggiorna storie e brief con le mie risposte; poi esegui lo **step 1** del piano (design system chiaro e scuro) con Impeccable. Lavora su un branch nuovo partendo da `main`. Fermati quando devo scegliere la direzione visiva (tema chiaro, font, mossa distintiva del timer), e di nuovo alla fine dello step per mostrarmi la pagina `/kit` nei due temi.

## Stato a fine step 0 (10 ottobre 2026)

Tutto è su `main`.

- **App Astro (radice):**
  - Astro 7.3 (Vite 8), Svelte 5 con `@astrojs/svelte` (installato, non ancora usato), Tailwind 4.3. MDX e sitemap rimossi, `<meta name="robots" content="noindex, nofollow">` nel layout.
  - Vitest (`npm test`, file `src/**/*.test.ts`), Playwright (`npm run test:e2e`, `tests/e2e/`, progetti `mobile` 390×844 e `desktop`), TypeScript 6, `@astrojs/check` (`npm run check`). C'è uno smoke test e2e.
  - Il codice applicativo e la grafica sono ancora quelli vecchi: blu, card annidate, emoji, archivio `bb-*`. Vengono sostituiti dagli step 1–6.
- **Impeccable 4.5.2:**
  - skill in `.claude/skills/impeccable/`, già vista da Claude Code come skill `impeccable` (`/impeccable …`);
  - `.impeccable/config.json`, blocco dei file effimeri nel `.gitignore`;
  - `PRODUCT.md` e `DESIGN.md` in radice, `.impeccable/design.json` (sidecar).
  - `PRODUCT.md` è aggiornato con le decisioni del piano. **`DESIGN.md` e `design.json` sono ancora quelli del PoC** (solo tema scuro, font di sistema): li riscrive lo step 1.
- **Brief:** 8 superfici in `.impeccable/surfaces/` (Oggi, primo avvio, allenamento attivo, timer, schede, calendario, storico, impostazioni). L'indice è [BRIEF.md](BRIEF.md), con:
  - i flussi di USER-STORIES.md §4 descritti attraverso le superfici;
  - la copertura delle storie (ogni storia M ha una superficie);
  - le proposte di revisione delle storie e le domande aperte.
- **PoC `BodyTracker/`:** invariato tranne `LEGGIMI.md`, che rimanda ai documenti spostati in radice. Va eliminato nello step 9.

## Decisioni ancora aperte (da chiedere all'inizio)

Brief e storie sono stati presentati all'utente, ma **non ancora confermati**. Chiedere solo queste, senza ripetere ciò che piano e storie già decidono:

1. **Spunta su una riga vuota** (BRIEF.md §4, domanda 1): conferma i valori "precedente" (1 tocco, come Strong) oppure servono "precedente" più la spunta (2 tocchi, come dice P1)?
2. **Priorità** (BRIEF.md §3, proposte 1 e 2):
   - US-09 e US-25 (superserie) da S a M: nelle schede reali 6 esercizi su 8 sono in superserie;
   - US-16, US-19 e US-20 da S/C a M: sono funzioni del PoC richieste dalla tabella di assorbimento.

   Confermare anche i criteri aggiunti e le esclusioni (BRIEF.md §3, punti 3 e 4).
3. **Struttura** (BRIEF.md §4, domanda 3):
   - primo avvio come schermata `/benvenuto`;
   - riepilogo come schermata dopo "Termina";
   - Impostazioni da un'icona in alto (non come quinta tab);
   - Progressi dentro Storico;
   - vista mese del Calendario in v1.
4. **Hook del detector di Impeccable:** attivarlo in `.claude/settings.json`, condiviso e valido anche per le sessioni cloud, oppure solo in locale (`.claude/settings.local.json`)? Esegue `.claude/skills/impeccable/scripts/impeccable hook` dopo ogni Edit/Write sui file di UI e scarica il motore da GitHub al primo uso.
5. **Permesso per il launcher di Impeccable:** nello step 0 il classificatore dei permessi ha bloccato l'esecuzione di `.claude/skills/impeccable/scripts/impeccable` ("codice esterno"). Lo step 1 ne ha bisogno (`context`, `concept-seed`, `serve-question`, `surface-brief`). Chiedere all'utente di consentirlo, ad esempio con una regola di permesso per quel comando. Senza permesso, seguire la procedura "Launcher unavailable" di `SKILL.md`: leggere direttamente PRODUCT.md, DESIGN.md e i brief, e presentare le scelte con le domande strutturate invece della pagina di decisione.

Con le risposte: aggiornare USER-STORIES.md (priorità, criteri, P1), i brief interessati e BRIEF.md (stato "confermato"), in un commit a parte prima del design system.

## Step 1 in dettaglio: design system chiaro e scuro

Obiettivo: token, temi e componenti base pronti e visibili su `/kit`, senza ancora rifare le pagine. Principi P2, P3, P9; storia US-30 (temi).

1. **Branch:** crearne uno nuovo da `main`.
2. **Contesto Impeccable:** `".claude/skills/impeccable/scripts/impeccable" context` una volta, se il launcher è consentito. Poi leggere `reference/new-work.md`, `reference/mode-operate.md` e, prima di ogni modifica alla UI, `reference/craft-floor.md`.
3. **Tipo di lavoro:** il mondo del PoC è approvato. Va **ereditato ed esteso** ("established world" / "incomplete brand" in new-work §1), non sostituito: niente gara tra mondi nuovi. Le scelte da far fare all'utente sono tre:
   - **variante chiara** del mondo verde: la scena (luce variabile, sole vicino alla finestra) giustifica entrambi i temi;
   - **font self-hosted**: craft-floor chiede un carattere scelto e incluso nel sito, non quello di sistema. Evitare i font della lista di new-work §4 (Inter, DM Sans, Space Grotesk, IBM Plex…). Cifre tabulari obbligatorie;
   - **mossa distintiva**: il timer di recupero a tutto schermo (forma del progresso, stato "Vai"; vedi il brief del timer).
4. **Token:**
   - `DESIGN.md` riscritto con i token di entrambi i temi, più `.impeccable/design.json` (vedi `reference/document.md`);
   - token in `@theme` in `src/styles/global.css`; temi con `prefers-color-scheme` più attributo `data-theme` su `<html>` (`sistema`/`chiaro`/`scuro`), applicato da uno script inline in `<head>` prima del primo disegno;
   - rimuovere `tailwind.config.mjs`, la riga `@config` e la palette `brand-*` viola.
5. **Componenti base** (Svelte dove hanno stato, `.astro` altrimenti):
   - pulsanti (primario, secondario, pericolo, icona), campo, campo numerico della serie, selettore;
   - foglio dal basso e dialog, tab bar, barra di stato del salvataggio, stato vuoto, toast;
   - superfici del browser tematizzate: selezione, caret, focus, scrollbar, `font-variant-numeric: tabular-nums`.
6. **Icone:** SVG di Lucide incluse a build-time, un solo spessore di tratto (ad esempio `@lucide/svelte`, o file SVG importati da `lucide-static`). Nessuna emoji.
7. **Font:** prenderli da npm (pacchetti `@fontsource/*`, perché la rete del container lascia passare npm), copiare in `public/fonts/` solo i woff2 del sottoinsieme latino e dichiararli con `@font-face` e `font-display: swap`. Nessuna richiesta a Google Fonts.
8. **Pagina `/kit`** (`src/pages/kit.astro`, **non** `_kit`): tutti i componenti, nei due temi affiancati o con un selettore; `noindex`, fuori dalla navigazione, da escludere dal precache allo step 3.
9. **Verifica:**
   - `npm run build`, `npm run check`, `npm test`;
   - un test e2e `US-30` che controlla `data-theme` e i colori calcolati nei due temi;
   - detector a 0 su `/kit` nei due temi (`npx impeccable detect` sull'URL, vedi insidie);
   - contrasti ≥ 4,5:1 (anche placeholder e testo secondario), target ≥ 48px per le azioni frequenti;
   - screenshot a 390×844 e 320×568 nei due temi.
10. **Consegna:** aggiornare `AGENTS.md` (convenzioni di stile: token al posto di `bg-blue-600`, componenti base, `/kit`). Commit, push, merge su `main` se l'utente lo chiede. Mostrare `/kit` all'utente e fermarsi.

## Insidie dell'ambiente (container cloud)

- **Rete:** la policy blocca molti siti, tra cui `hevyapp.com`, `strongapp.io`, `docs.astro.build`, `impeccable.style` e `raw.githubusercontent.com` (403 dal proxy). Funzionano `npm`, `git clone` da GitHub e la ricerca web. Per leggere un repository pubblico: `add_repo` (accesso in lettura), poi `git clone --depth 1` in `/home/user/<owner>/<repo>`. Il repository di Impeccable si clona così in `/home/user/pbakaus/impeccable`.
- **Installazione di Impeccable:** `npx impeccable install` fallisce, perché scarica da `impeccable.style`. La skill in `.claude/skills/impeccable/` è la copia di `plugin/skills/impeccable` del repository ufficiale (commit `d631a88`, versione 4.5.2). Per aggiornarla, ripetere la copia da una versione nuova.
- **Launcher di Impeccable e hook:** vedi le decisioni aperte 4 e 5. `npx impeccable detect src/` (motore da npm) funziona senza permessi speciali.
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
- **Chiusura dei server:** se serve `pkill`, non usare `pkill -f "astro preview"`: il pattern corrisponde anche alla shell che esegue il comando e la termina. Usare `pkill -f "[a]stro preview"`.
- **Avviso noto di `astro check`:** un hint su `BodyTracker/palestra/app.js` (`returnValue` deprecato). Va ignorato: il file sparirà allo step 9.
- **Detector su `src/`:** oggi segnala un `side-tab` (`border-l-4`) in `src/pages/about.astro`. È la grafica vecchia e sparirà con il restyling.

## Da non dimenticare

- **La UX conta più della grafica:** ogni scelta visiva va giudicata sulla scena d'uso (una mano, recuperi brevi, interruzioni, luce variabile) e sui principi P1–P10. Le scelte del design system vanno provate sui componenti reali dei flussi (riga serie, timer, barra di salvataggio), non su campioni astratti.
- I test e2e portano l'ID della storia. Dopo gli step 6 e 7 è prevista una prova reale in palestra con l'utente.
- Gli ID del catalogo esercizi del PoC (`BodyTracker/palestra/esercizi.js`) **non vanno cambiati**: lo storico dell'utente li usa.
- Ogni funzione nella tabella "Assorbimento del PoC" deve avere un test e2e prima di eliminare `BodyTracker/`.
- Il contratto di direzione (`## Direction contract`) va solo nei brief, mai nel codice o nel markup servito (new-work §5).
- Aggiornare `AGENTS.md` quando cambiano struttura, comandi o convenzioni.
