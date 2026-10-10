# AGENTS.md

Guida per agenti di codice che lavorano su questo repository.

## Panoramica

BodyTracker è un diario di allenamento in palestra, con interfaccia in **italiano**.
Il repository contiene due cose distinte:

| Percorso | Cosa è | Stato |
| --- | --- | --- |
| `src/`, `public/`, config in radice | App **Astro 7 + Svelte 5 + Tailwind CSS 4** (package `astro-bodytracker-starter`) | In sviluppo attivo, è il target principale |
| `BodyTracker/` | PoC: pacchetto statico HTML/CSS/JS senza build (`palestra/`) e `LEGGIMI.md` | Da assorbire nell'app radice e **da eliminare** a fine restyling. Non viene importato né compilato da Astro |

Tutti i dati dell'utente restano nel browser (`localStorage`): nessun backend, database, account o chiamata API. Mantieni questo vincolo, a meno che non venga chiesto esplicitamente di cambiarlo.

## Comandi

```sh
npm install        # oppure npm ci
npm run dev        # dev server su http://localhost:4321
npm run build      # sito statico in dist/
npm run preview
npm run check      # astro check (type-check di .astro, .ts e .svelte)
npm test           # Vitest: file src/**/*.test.ts (logica pura)
npm run test:e2e   # Playwright: tests/e2e/, sulla build servita da astro preview (porta 4322)
npm run astro -- <comando>
npx impeccable detect src/   # detector di anti-pattern di Impeccable sui sorgenti
```

Non ci sono linter né formatter configurati. Per verificare una modifica: `npm run build`, `npm run check`, `npm test`, `npm run test:e2e`, poi controlla le pagine nel browser con `npm run dev` o `npm run preview`. Verifica anche il layout a larghezza telefono (390×844 e 320×568), perché l'uso principale è da mobile in palestra.

- **Playwright:** il progetto `mobile` (390×844) e `desktop`. Serve una Chromium compatibile con `@playwright/test`: in locale `npx playwright install chromium`; dove c'è già una Chromium (es. `/opt/pw-browsers/chromium` nel container cloud) passa `PW_CHROMIUM_PATH=/percorso/chromium npm run test:e2e`.
- **Nomi dei test:** i test e2e di una storia cominciano con il suo ID (`US-12 registra una serie copiando il precedente`).
- **`astro preview` in Astro 7:** quando gira sotto un agente parte in background e restituisce subito il controllo (`npx astro preview stop` per fermarlo, `status` e `logs` per controllarlo). Con `--ignore-lock` resta in primo piano: lo usa la config di Playwright.
- **Pagine con `_`:** Astro ignora i file in `src/pages/` il cui nome comincia con `_` (non generano una route).

## Struttura dell'app Astro

```
astro.config.mjs        site francescoperagine.com, output statico (default), integrazione Svelte, plugin Vite di Tailwind
svelte.config.js        vitePreprocess (TypeScript nei componenti .svelte)
vitest.config.ts        test unitari in src/**/*.test.ts
playwright.config.ts    test e2e in tests/e2e/, server astro preview sulla porta 4322
tailwind.config.mjs     palette "brand-*" e animazioni (fade-in, slide-up, float), caricato da global.css con @config
src/styles/global.css   @import "tailwindcss", @config, regole globali e classe .input
src/layouts/Layout.astro  <html lang="it">, meta robots noindex (app privata), Header + <main class="container"> + Footer. Props: title, description, showBackButton
src/scripts/
  bodytracker.ts        Archivio localStorage, tipi, validazione, date locali, escapeHtml, downloadJson
  exercise-list.ts      Editor condiviso della lista esercizi/serie (mountExerciseList, promptNewExercise)
src/pages/
  index.astro           Home: WeeklyCalendar, CalendarConfig, WorkoutEditor, HistoryView
  about.astro           Pagina informativa statica (sezione #privacy)
  workout.astro         Editor dell'allenamento di un giorno: /workout?date=YYYY-MM-DD (data letta lato client)
src/components/
  Header.astro          Navigazione sticky + menu mobile (script bundlato da Astro)
  Footer.astro
  WeeklyCalendar.astro  Settimana corrente/precedente/successiva; ogni giorno linka a /workout/<data>
  CalendarConfig.astro  Assegna un nome di scheda a ciascun giorno della settimana
  WorkoutEditor.astro   Editor "allenamento del giorno" in home
  HistoryView.astro     Elenco storico, esporta/importa JSON, cancella tutto
```

### Modello di rendering

- Il sito è **completamente statico** (nessun adapter, nessun rendering lato server). Non introdurre route dinamiche lato server: un parametro variabile va passato in query string e letto nel client, come fa `workout.astro`.
- **Svelte 5** è installato (`@astrojs/svelte`) ma non ancora usato: dal restyling le parti con stato (allenamento attivo, timer, editor delle schede, grafici) diventano isole Svelte (`client:load`), il resto resta `.astro`. Le regole qui sotto valgono per il codice attuale, pre-restyling.
- I file `.astro` producono solo markup; **tutta la logica è lato client** in tag `<script>` semplici (TypeScript, elaborati e bundlati da Astro), che importano da `src/scripts/`. Non usare `<script type="module">` o `define:vars`: diventerebbero script inline non elaborati, senza import e senza tipi.
- Accedi al `localStorage` **solo tramite `src/scripts/bodytracker.ts`** (`loadWorkouts`, `getWorkout`, `putWorkout`, `mergeWorkouts`, `clearWorkouts`, `loadCalendar`, `saveCalendar`, …), che si occupa di validazione, ordinamento e notifica.
- Il rendering avviene costruendo stringhe HTML e assegnandole a `innerHTML`, con delegazione degli eventi tramite attributi `data-*` (`data-addset`, `data-deleteset="i-j"`, `data-reps`, `data-weight`, `data-deleteex`, …). **Ogni testo dell'utente inserito in un template HTML deve passare da `escapeHtml`**; altrimenti usa `textContent`.
- I componenti comunicano tramite l'evento `window` `bb:updated` (`UPDATED_EVENT`) e l'evento `storage` per altre schede. `putWorkout`, `mergeWorkouts` e `clearWorkouts` lo emettono già; dopo `saveCalendar` va emesso a mano. Un editor che salva a ogni modifica deve ignorare l'evento generato dal proprio salvataggio, altrimenti il re-render fa perdere il focus (vedi il flag `saving` in `WorkoutEditor`).
- Ogni componente cerca la propria radice con un attributo (`[data-weekly-calendar]`, `[data-calendar-config]`, `[data-workout-editor]`, `[data-history-view]`, `[data-workout-page]`) e poi usa `root.querySelector('#id')`. Gli ID sono duplicati tra componenti e pagine (`#exercise-list`, `#add-exercise`, `#list`), quindi limita sempre le query alla radice del componente.

### Chiavi di localStorage

| Chiave | Forma | Note |
| --- | --- | --- |
| `bb-calendar` | `{ "Lunedì": "Petto", ... }`: nomi completi dei giorni in italiano, con accento | Scritta da CalendarConfig, letta da WeeklyCalendar e `workout.astro` |
| `bb-workouts` | `[{ date: "YYYY-MM-DD", exercises: [{ name, sets: [{ reps, weight }] }] }]` | Un solo elemento per data, ordinato per data crescente. Un allenamento senza esercizi viene rimosso. Usata da tutti gli editor, dal calendario e dallo storico |
| `workout` | Legacy | Vecchia chiave di WorkoutEditor: alla prima lettura viene migrata in `bb-workouts` e poi cancellata |

- I tipi (`Workout`, `Exercise`, `WorkoutSet`, `CalendarConfig`) sono in `bodytracker.ts`. Se cambi la forma dei dati, aggiorna anche `isWorkout`/`parseWorkouts` e prevedi una migrazione dei dati esistenti.
- Le date sono stringhe `YYYY-MM-DD` in **ora locale**: usa `toDateKey(date)` e `parseDateKey(key)`, mai `toISOString()` o `new Date('YYYY-MM-DD')` (che usano UTC).
- I nomi dei giorni vengono da `DAY_NAMES` (indicizzato da `getDay()`), `DAY_NAMES_SHORT` e `WEEK_DAYS` (ordine lunedì–domenica) di `bodytracker.ts`. Non riscriverli altrove.
- Formato di import/export: un array di `Workout`. "Esporta JSON" in home produce un array di un solo elemento, quindi è reimportabile. L'importazione valida l'intero file e lo unisce allo storico: le date già presenti vengono sostituite.

## Convenzioni

- Testo dell'interfaccia, `title`/`description` e messaggi utente in **italiano**; date formattate con `toLocaleDateString('it-IT', …)`.
- Ogni pagina usa `Layout`; le sottopagine passano `showBackButton={true}`.
- Lo stile è fatto con classi di utilità Tailwind direttamente nel markup: card `bg-white rounded-2xl shadow-lg p-6/p-8`, azioni primarie `bg-blue-600 … hover:bg-blue-700`, azioni di salvataggio `bg-green-600`, azioni distruttive in rosso. Tailwind 4 usa la sintassi `bg-linear-to-r`/`bg-linear-to-br` (non `bg-gradient-to-*`).
- Le azioni distruttive chiedono conferma con `confirm(...)`; il feedback oggi usa `alert(...)`.
- I colori personalizzati (`bg-brand-primary`, …) e le animazioni (`animate-fade-in`, …) si definiscono in `tailwind.config.mjs`. Per gli input di form semplici usa la classe `.input` di `global.css`.
- Link alle sezioni della home sempre assoluti (`/#allenamenti`, `/#storico`), perché Header e Footer compaiono su tutte le pagine; link alla pagina di un giorno tramite `workoutUrl(dateKey)`.
- Il codice segue lo stile dei file vicini: alcuni file usano punto e virgola, altri no. Non riformattare interi file.
- I commenti nel codice sono un misto di italiano e inglese; preferisci l'italiano per i testi rivolti all'utente.

## Limiti noti

- Test appena introdotti: oggi c'è solo uno smoke test e2e (`tests/e2e/smoke.spec.ts`). Ogni nuova storia porta il suo test.
- `alert`/`confirm`/`prompt` nativi sono usati per feedback e input; se li sostituisci, fallo in modo coerente su tutti i componenti.
- Il pulsante "Salva allenamento" della pagina del giorno salva solo quando premuto; l'editor in home salva invece a ogni modifica.

## Riferimento: `BodyTracker/`

- `BodyTracker/LEGGIMI.md`: funzionalità e vincoli di privacy della versione statica (salvataggio a ogni modifica con stato visibile, esportazione e importazione con unione e deduplicazione, protezione da sovrascritture tra schede, gestione dell'errore di quota, schede A/B, varianti, catalogo esercizi con ID stabili).
- `BodyTracker/palestra/esercizi.js`: catalogo esercizi (`window.catalogoEsercizi`) e schede iniziali (`window.schedeIniziali`).

Il PoC è la specifica delle funzioni da portare nell'app Astro: alla fine del restyling deve restare solo l'app nella radice, con le funzioni di entrambi. La tabella "Assorbimento del PoC" in `docs/restyling/PIANO.md` elenca cosa portare. Non sviluppare nuove funzioni in `BodyTracker/`. Il suo formato dati (`bodytracker.archivio.v1`, campi in italiano, `versione: 1`) resta supportato dall'app radice solo come formato di importazione.

## Restyling in corso

È previsto un restyling completo dell'app Astro, mobile first e basato su [Impeccable](https://github.com/pbakaus/impeccable), che porta nell'app il mondo visivo del PoC e aggiunge schede vere e un timer di recupero. Analisi e ricerche sono in `docs/restyling/ANALISI.md`, il piano a step con le decisioni prese in `docs/restyling/PIANO.md`, scena d'uso, principi UX e user story in `docs/restyling/USER-STORIES.md`, il punto di ripartenza in `docs/restyling/HANDOFF.md`: leggili prima di toccare la UI. I brief delle superfici sono indicizzati in `docs/restyling/BRIEF.md`.

### Impeccable nel repository

| Percorso | Cosa è |
| --- | --- |
| `PRODUCT.md` | Verità di prodotto (utenti, scena d'uso, vincoli, principi). Spostato dal PoC e aggiornato con le decisioni del piano |
| `DESIGN.md` | Design system. Oggi è ancora quello del PoC (verde scuro, solo tema scuro): lo step 1 lo riscrive |
| `.impeccable/design.json` | Sidecar di `DESIGN.md` (rampe tonali, componenti), spostato dal PoC |
| `.impeccable/config.json` | Configurazione condivisa del detector e dell'hook |
| `.impeccable/surfaces/*.md` | Brief per superficie (scritti con `shape`), riletti da Impeccable a ogni modifica della superficie |
| `.claude/skills/impeccable/` | Skill Impeccable 4.5.2 (copia di `plugin/skills/impeccable` del repository ufficiale, commit `d631a88`) |

- Tutte le superfici sono in modalità **Operate**. Prima di modificare la UI leggi `PRODUCT.md`, `DESIGN.md`, il brief della superficie e `.claude/skills/impeccable/reference/craft-floor.md`.
- I file effimeri di `.impeccable/` sono nel `.gitignore` (blocco `impeccable-ignore-start`/`end`); `.claude/settings.local.json` è locale e non versionato.
- L'**hook del detector** è in `.claude/settings.json` (condiviso, vale anche per le sessioni cloud): dopo ogni Edit/Write su un file di UI esegue `.claude/skills/impeccable/scripts/impeccable hook`, che al primo uso scarica il motore da GitHub. Si spegne con `impeccable hooks off` (scrive `hook.enabled: false` in `.impeccable/config.json`).
- `npx impeccable detect src/` funziona senza browser. Per le pagine renderizzate in un container come root serve Chromium con `--no-sandbox` (vedi `docs/restyling/HANDOFF.md`).

## Note varie

- `.vscode/settings.json` contiene un percorso specifico di Windows: non dipenderne.
- `dist/`, `.astro/` e `node_modules/` sono ignorati da git.
- `README.md` è ancora quello del template minimo di Astro.
