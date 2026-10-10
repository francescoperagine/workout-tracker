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
src/styles/global.css   design system: @font-face, token in @theme (colori light-dark(), scala tipografica, raggi), base (superfici del browser), classi componente (.shell, .btn-*, .field, .panel, .digits); in fondo la grafica vecchia (.container, .input) delle pagine pre-restyling
src/layouts/Base.astro  documento di ogni pagina: <html lang="it">, noindex, favicon, preload del font, script inline del tema. Props: title, description, bodyClass
src/layouts/Layout.astro  grafica vecchia: Base + Header + <main class="container"> + Footer. Props: title, description, showBackButton
src/lib/theme.ts        temi: THEME_REGISTRY (unico elenco: system, light, dark, con etichette Sistema/Chiaro/Scuro; i temi futuri si aggiungono qui e in src/styles/themes/<id>.css, vedi DESIGN.md "Aggiungere un tema"), chiave bodytracker.theme, readTheme, applyTheme, saveTheme, themeBootScript (con test)
src/lib/archive/        archivio v2 (step 2), un modulo per argomento, tutto esportato da index.ts:
  types.ts              modello dati v2, chiavi, LIMITS, DEFAULT_SETTINGS, emptyArchive, ArchiveError
  dates.ts              toDateKey, fromDateKey, isValidDateKey, weekdayOf (ora locale)
  validation.ts         validateArchive: ricostruzione campo per campo, messaggi in italiano
  repository.ts         ArchiveRepository (revisione, quota, illeggibile, conflitto tra schede, subscribe), sharedArchive, requestPersistence
  catalog.ts            catalogo base + personalizzati: nameKey, findByName, suggestExercises, ensureExercise (US-14)
  routines.ts           withStarterRoutines, planFor, sessionInProgress, quickStart (US-11: ultime 4 schede e suggerita)
  conversion.ts         testi del PoC → v2: restSeconds, splitLoad, routineFromPoc
  poc-import.ts         convertPocArchive (backup del PoC, con scarti e avvisi), readPocKey
  backup.ts             exportArchive, readBackup (v2 o PoC), previewImport, mergeImport (keep/replace)
src/lib/units.ts        kg/lb e m/ft: fromKg/toKg, fromMeters/toMeters, parseWeight, weightFieldValue, formatWeight, formatDistance
src/data/               catalog.ts (BASE_CATALOG, ID del PoC invariati) e starter-routines.ts (A/B convertite); test di parità con il PoC in seed-data.test.ts
tests/fixtures/         synthetic-poc-backup.json (formato "Esporta" del PoC), usato da Vitest e utilizzabile negli e2e
public/fonts/           Atkinson Hyperlegible Next, woff2 variabile del sottoinsieme latino (da @fontsource-variable 5.3.0) e licenza OFL
src/scripts/
  bodytracker.ts        Archivio localStorage, tipi, validazione, date locali, escapeHtml, downloadJson
  exercise-list.ts      Editor condiviso della lista esercizi/serie (mountExerciseList, promptNewExercise)
src/pages/
  index.astro           Home: WeeklyCalendar, CalendarConfig, WorkoutEditor, HistoryView
  about.astro           Pagina informativa statica (sezione #privacy)
  workout.astro         Editor dell'allenamento di un giorno: /workout?date=YYYY-MM-DD (data letta lato client); allo step 6 lo sostituisce l'allenamento attivo nella stessa route
src/pages/kit.astro     /kit: pagina interna del design system (?theme=light|dark forza il tema); fuori dalla navigazione
src/components/ui/      componenti base: AppHeader, TabBar, EmptyState (.astro); SetInput, SetRow, SegmentedControl,
                        SaveBar, Toast, BottomSheet, ConfirmDialog (.svelte)
src/components/workout/RestTimer.svelte  timer di recupero a tutto schermo (livello che si svuota) e barra ridotta
src/components/kit/     isole dimostrative usate solo da /kit
src/components/  (grafica vecchia)
  Header.astro          Navigazione sticky + menu mobile (script bundlato da Astro)
  Footer.astro
  WeeklyCalendar.astro  Settimana corrente/precedente/successiva; ogni giorno linka a /workout/<data>
  CalendarConfig.astro  Assegna un nome di scheda a ciascun giorno della settimana
  WorkoutEditor.astro   Editor "allenamento del giorno" in home
  HistoryView.astro     Elenco storico, esporta/importa JSON, cancella tutto
```

### Modello di rendering

- Il sito è **completamente statico** (nessun adapter, nessun rendering lato server). Non introdurre route dinamiche lato server: un parametro variabile va passato in query string e letto nel client, come fa `workout.astro`.
- **Svelte 5** (`@astrojs/svelte`): i componenti con stato del design system sono già Svelte (`src/components/ui/`, `RestTimer`); dal restyling le parti con stato (allenamento attivo, timer, editor delle schede, grafici) diventano isole Svelte (`client:load`), il resto resta `.astro`. Le regole qui sotto su `<script>`, `innerHTML` e `escapeHtml` valgono per il codice pre-restyling; nelle isole Svelte il testo passa dal templating di Svelte, che fa l'escape da solo.
- I file `.astro` producono solo markup; **tutta la logica è lato client** in tag `<script>` semplici (TypeScript, elaborati e bundlati da Astro), che importano da `src/scripts/`. Non usare `<script type="module">` o `define:vars`: diventerebbero script inline non elaborati, senza import e senza tipi. Unica eccezione: lo script `is:inline` del tema in `Base.astro`, che deve girare prima del primo disegno.
- Il codice nuovo accede al diario **solo tramite `src/lib/archive/`** (`ArchiveRepository`). Il codice vecchio accede al `localStorage` **solo tramite `src/scripts/bodytracker.ts`** (`loadWorkouts`, `getWorkout`, `putWorkout`, `mergeWorkouts`, `clearWorkouts`, `loadCalendar`, `saveCalendar`, …), che si occupa di validazione, ordinamento e notifica.
- Il rendering avviene costruendo stringhe HTML e assegnandole a `innerHTML`, con delegazione degli eventi tramite attributi `data-*` (`data-addset`, `data-deleteset="i-j"`, `data-reps`, `data-weight`, `data-deleteex`, …). **Ogni testo dell'utente inserito in un template HTML deve passare da `escapeHtml`**; altrimenti usa `textContent`.
- I componenti comunicano tramite l'evento `window` `bb:updated` (`UPDATED_EVENT`) e l'evento `storage` per altre schede. `putWorkout`, `mergeWorkouts` e `clearWorkouts` lo emettono già; dopo `saveCalendar` va emesso a mano. Un editor che salva a ogni modifica deve ignorare l'evento generato dal proprio salvataggio, altrimenti il re-render fa perdere il focus (vedi il flag `saving` in `WorkoutEditor`).
- Ogni componente cerca la propria radice con un attributo (`[data-weekly-calendar]`, `[data-calendar-config]`, `[data-workout-editor]`, `[data-history-view]`, `[data-workout-page]`) e poi usa `root.querySelector('#id')`. Gli ID sono duplicati tra componenti e pagine (`#exercise-list`, `#add-exercise`, `#list`), quindi limita sempre le query alla radice del componente.

### Chiavi di localStorage

| Chiave | Forma | Note |
| --- | --- | --- |
| `bb-calendar` | `{ "Lunedì": "Petto", ... }`: nomi completi dei giorni in italiano, con accento | Scritta da CalendarConfig, letta da WeeklyCalendar e `workout.astro` |
| `bb-workouts` | `[{ date: "YYYY-MM-DD", exercises: [{ name, sets: [{ reps, weight }] }] }]` | Un solo elemento per data, ordinato per data crescente. Un allenamento senza esercizi viene rimosso. Usata da tutti gli editor, dal calendario e dallo storico |
| `workout` | Legacy | Vecchia chiave di WorkoutEditor: alla prima lettura viene migrata in `bb-workouts` e poi cancellata |
| `bodytracker.archive.v2` | `Archive` di `src/lib/archive/types.ts` (`version: 2`, `revision`, `catalog`, `routines`, `schedule`, `overrides`, `sessions`, `settings`) | Archivio nuovo (step 2). Si legge e si scrive **solo** con `ArchiveRepository` (`sharedArchive()` nel browser). Pesi in kg, distanze in metri |
| `bodytracker.archivio.v1` | Archivio del PoC (campi in italiano) | Solo lettura, per l'import diretto sulla stessa origine (`readPocKey`). Nome e formato sono del PoC e non cambiano |
| `bodytracker.theme` | `light` \| `dark` (assente = sistema) | Preferenza del dispositivo, fuori dall'archivio (`src/lib/theme.ts`) |

- **Archivio v2 (codice nuovo):**
  - le modifiche passano da `repo.update(a => newArchive)` con funzioni pure che non mutano l'argomento; il repository incrementa `revision`, salva e notifica (`subscribe`, con `origin`: `edit`, `external`, `reload`, `import`). Con stato `unreadable` o `conflict` non scrive nulla;
  - pianificazione ed eccezioni: id di scheda, `null` = riposo, chiave assente = nulla di pianificato;
  - una sola sessione con `end: null` (in corso) alla volta; `mergeImport` lo garantisce anche negli import;
  - esercizi: quelli di base sono in `src/data/catalog.ts` (ID del PoC, in italiano perché sono dati dello storico: mai cambiati né rimossi), quelli personalizzati in `archive.catalog` con id `custom-<nome>`; un nome scritto a mano passa sempre da `ensureExercise`;
  - i riferimenti (scheda, esercizio) non sono vincolati dalla validazione: un id sconosciuto si mostra con `exerciseName`, che ricade sull'id.
- I tipi vecchi (`Workout`, `Exercise`, `WorkoutSet`, `CalendarConfig`) sono in `bodytracker.ts`. Se cambi la forma dei dati, aggiorna anche `isWorkout`/`parseWorkouts` e prevedi una migrazione dei dati esistenti.
- Le date sono stringhe `YYYY-MM-DD` in **ora locale**: usa `toDateKey(date)` e `parseDateKey(key)`, mai `toISOString()` o `new Date('YYYY-MM-DD')` (che usano UTC).
- I nomi dei giorni vengono da `DAY_NAMES` (indicizzato da `getDay()`), `DAY_NAMES_SHORT` e `WEEK_DAYS` (ordine lunedì–domenica) di `bodytracker.ts`. Non riscriverli altrove.
- Formato di import/export: un array di `Workout`. "Esporta JSON" in home produce un array di un solo elemento, quindi è reimportabile. L'importazione valida l'intero file e lo unisce allo storico: le date già presenti vengono sostituite.

## Convenzioni

- **Si lavora sempre su `main`:** niente branch né pull request, anche se la sessione propone un branch di lavoro. Commit e push direttamente su `main` (`git push origin main`).
- **Lingua:** il codice è in **inglese** (nomi di file e cartelle, route, identificatori, tipi, campi del modello dati, chiavi di storage, token e classi CSS, id degli elementi). È in **italiano** tutto ciò che vede l'utente: testo dell'interfaccia, `title`/`description`, etichette accessibili, messaggi di errore e di stato; date formattate con `toLocaleDateString('it-IT', …)`. Restano in italiano anche commenti, documentazione e nomi dei test (cominciano con l'ID della storia), e i dati esterni: gli ID degli esercizi del PoC e i campi del suo formato di backup.
- Le route seguono i nomi dei file: `/settings`, `/calendar`, `/routines`, `/history`, `/workout`, `/welcome` (vedi BRIEF.md).
- Ogni pagina usa `Layout`; le sottopagine passano `showBackButton={true}`.
- **Design system (step 1):** il codice nuovo usa solo i token di `DESIGN.md`, definiti in `@theme` in `global.css`, e i componenti base. Mai colori della palette di default di Tailwind (`bg-blue-600`, `text-gray-500`, …) né valori letterali.
  - Colori di contenuto, che cambiano col tema: `bg-background`, `bg-surface`, `bg-field`, `text-foreground`, `text-muted`, `border-line`, `border-line-strong`, `bg-accent`/`text-on-accent`, `text-accent-text`, `bg-done`, `text-danger`, `bg-warning-bg`. Sono `light-dark()`: niente varianti `dark:`.
  - Guscio, uguale nei due temi (intestazione, barra di salvataggio, tab bar, timer): classe `.shell` più i token `shell-*` e `level`. Dentro `.shell` i token di contenuto si risolvono nella variante scura.
  - Classi componente: `.btn` con `.btn-primary`, `-secondary`, `-danger`, `-text`, `-icon`, `-block`; `.label`, `.field`, `.hint`, `.field-error`; `.choice` e `.radio`; `.panel` (un solo livello, mai annidato); `.digits` per pesi e ripetizioni.
  - Scala tipografica: `text-xs` … `text-xl`, `text-page-title`, `text-digits`; raggi `--radius-field`/`-panel`/`-dialog`; curva `--ease-out-expo`; altezza dello stack in basso `--bottom-bars-height`. Tutti i numeri sono tabulari (`font-variant-numeric` sulla radice).
  - Icone: Lucide da `@lucide/astro/icons/<nome>` e `@lucide/svelte/icons/<nome>`, tratto 2, 20–22px, `aria-hidden` con un'etichetta sul controllo. Nessuna emoji.
  - Prima di aggiungere un componente guarda `/kit`; un componente nuovo del design system va mostrato anche lì.
- Le pagine vecchie (index, workout, about) usano ancora `Layout.astro`, la palette di default di Tailwind e `.input`: restano così finché gli step 3–6 non le sostituiscono.
- Conferme e feedback: il codice nuovo usa `ConfirmDialog` (azioni distruttive), `Toast` (esito, con "Annulla" dove possibile) e `SaveBar`, non `alert`/`confirm`. Il codice vecchio usa ancora quelli nativi.
- Link alle sezioni della home sempre assoluti (`/#allenamenti`, `/#storico`), perché Header e Footer compaiono su tutte le pagine; link alla pagina di un giorno tramite `workoutUrl(dateKey)`.
- Il codice segue lo stile dei file vicini: alcuni file usano punto e virgola, altri no. Non riformattare interi file.
- I commenti nel codice sono in italiano (nel codice vecchio anche in inglese).

## Limiti noti

- Il codice `bb-*` (`src/scripts/bodytracker.ts`, `exercise-list.ts` e le pagine vecchie) resta finché gli step 3–6 non sostituiscono le pagine: niente migrazione da `bb-*` (decisione 6 del piano).
- Test e2e: lo smoke test (`tests/e2e/smoke.spec.ts`), US-30 sui temi (`tests/e2e/us-30-themes.spec.ts`) e i componenti di `/kit` (`tests/e2e/kit.spec.ts`). Ogni nuova storia porta il suo test.
- Nelle pagine vecchie `alert`/`confirm`/`prompt` nativi sono usati per feedback e input; spariscono con la riscrittura delle pagine (step 3–6).
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
| `DESIGN.md` | Design system chiaro e scuro (step 1): token normativi nel frontmatter, regole nel testo. `/kit` lo mostra |
| `.impeccable/design.json` | Sidecar di `DESIGN.md` (rampe tonali, componenti) |
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
