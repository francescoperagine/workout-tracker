# Architettura

Com'è fatto il sistema adesso. Come si lavora: `AGENTS.md`; comandi e insidie di sviluppo e test: `docs/SVILUPPO.md`. Se il documento e il codice non vanno d'accordo, vale il codice.

## Panoramica

Workout Tracker è un diario di allenamento in palestra, con interfaccia in **italiano**.
Il repository contiene una sola app statica **Astro 7 + Svelte 5 + Tailwind CSS 4** (package `workout-tracker`) nella radice. Il PoC statico che la precedeva (`BodyTracker/`) è stato assorbito ed eliminato allo step 9: resta nella cronologia git e, come formato d'import, il suo backup (`bodytracker.archivio.v1`).

Tutti i dati dell'utente restano nel browser (`localStorage`): nessun backend, database, account o chiamata API. Mantieni questo vincolo, a meno che non venga chiesto esplicitamente di cambiarlo.

## Struttura dell'app Astro

```
wrangler.jsonc          Worker Cloudflare: asset di dist/, dominio personalizzato, workers.dev
astro.config.mjs        site e base da WT_SITE e WT_BASE (default: https://workout-tracker.francescoperagine.com, /), output statico, Svelte, Tailwind, integrazione del service worker, /kit solo in dev o con WT_KIT=1
svelte.config.js        vitePreprocess (TypeScript nei componenti .svelte)
vitest.config.ts        test unitari in src/**/*.test.ts
playwright.config.ts    test e2e in tests/e2e/, server astro preview sulla porta 4322 (build con WT_KIT=1), baseURL con WT_BASE
scripts/make-icons.mjs  icone della PWA (public/icons/) dal disegno del favicon
src/integrations/service-worker.ts  workbox-build in astro:build:done: precache di tutto dist/ (tranne /kit) in dist/sw.js, con importScripts di public/sw-push.js (handler push e notificationclick, predisposizione Web Push)
src/styles/global.css   design system: @font-face, token in @theme (colori light-dark(), scala tipografica, raggi), base (superfici del browser), classi componente (.shell, .btn-*, .field, .panel, .digits)
src/layouts/Base.astro  documento di ogni pagina: <html lang="it">, noindex, favicon, manifest, icona iOS, preload del font, script inline del tema, slot "head". Props: title, description, bodyClass, bodyStyle
src/layouts/AppLayout.astro  guscio dell'app: ClientRouter, AppHeader, <main>, stack in basso (WorkoutMiniBar persistente + ArchiveStatus + TabBar), RestTimerHost persistente (timer di recupero), registrazione del service worker. Props: title, heading, subtitle, description, tab, showTabs, showHeader, showSettings, showArchiveStatus, back (ritorno nell'intestazione, per le pagine senza tab bar)
src/lib/paths.ts        appUrl(path) e BASE: ogni link e risorsa passa da qui (percorso base, barra finale delle pagine); joinBase, isCurrentPath (con test)
src/lib/theme.ts        temi: THEME_REGISTRY (unico elenco: system, light, dark, con etichette Sistema/Chiaro/Scuro; i temi futuri si aggiungono qui e in src/styles/themes/<id>.css, vedi DESIGN.md "Aggiungere un tema"), chiave workout-tracker.theme, readTheme, applyTheme, saveTheme, themeBootScript (riapplica il tema anche a ogni navigazione del ClientRouter; con test)
src/lib/archive/        archivio v2 (step 2), un modulo per argomento, tutto esportato da index.ts:
  types.ts              modello dati v2, chiavi, LIMITS, DEFAULT_SETTINGS, emptyArchive, ArchiveError
  dates.ts              toDateKey, fromDateKey, isValidDateKey, weekdayOf (ora locale)
  validation.ts         validateArchive: ricostruzione campo per campo, messaggi in italiano
  repository.ts         ArchiveRepository (revisione, quota, illeggibile, conflitto tra schede, subscribe), sharedArchive, requestPersistence
  catalog.ts            catalogo base + personalizzati: nameKey, findByName, suggestExercises, ensureExercise (US-14); exerciseDetails, safeImagePath, safeSources (approfondimento, US-19)
  routines.ts           withStarterRoutines, planFor, sessionInProgress, quickStart (US-11: ultime 4 schede e suggerita)
  routine-edit.ts       modifica delle schede (step 4): crea, duplica, rinomina, riordina, archivia, elimina con "Annulla"; voci, alternative, superserie (blocksOf, orderLabels, normalizeGroups, linkWithPrevious, moveEntry)
  calendar.ts           calendario (step 5): addDays, weekStart, weekDates, monthWeeks, dayInfo (stato del giorno: done, in-progress, skipped, planned, rest, empty), setWeeklyDay, setDateOverride, staleWeeklyDays
  sessions.ts           sessioni (step 5): startSession (da scheda o libero, una sola in corso), reopenSession, finishSession (almeno un esercizio e un valore), removeSession/restoreSession, summarizeSession, currentExercise, lastFinishedSession
  workout.ts            allenamento attivo (step 6): previousExercise/previousSets (precedente per variante e per posizione tra riscaldamento e serie di lavoro), completedSet (spunta che conferma il precedente), nextSet (serie da fare, alternanza in superserie), plannedEntry (voce della scheda), suggestedSets (segnaposto e spunta: il precedente con il peso della serie sopra), serie ed esercizi in sessione con "Annulla", switchExercise (variante: con serie spuntate quelle restano e la variante continua in una voce sotto) e undoSwitch, note, nome e data, loadRecords, workoutSummary
  poc-import.ts         convertPocArchive (file di backup del PoC, con scarti e avvisi)
  backup.ts             exportArchive, readBackup (v2 o PoC), previewImport, mergeImport (keep/replace)
  progress.ts           progressi (step 8): exerciseHistory (un punto per sessione conclusa: carico massimo, 1RM Epley solo serie normali fino a 12 rip, volume; riscaldamento escluso, varianti separate), personalRecords, pointsInPeriod (3m, 1y, all), exercisesDone, sessionRecords (record di carico, 1RM e volume di una sessione)
src/lib/rest-timer.ts   timer di recupero (step 7), logica pura: REST_TIMER_KEY, RestTimerState, startRest, shiftRest (±15 s), restRemaining/restFraction/restOverFor, restAfterCheck (quale recupero parte: riscaldamento, 0, superserie a fine giro), restIsStale (spunta tolta, sessione conclusa), crossedThreshold (annunci a 30, 10, 0), nextSetText, parseRestTimer (con test a orologio finto)
src/lib/rest-timer.svelte.ts  restTimer(): store unico del timer (stato salvato a ogni cambiamento, scatti di 250 ms, visibilitychange, evento storage, avviso di fine una volta sola, "Vai" chiuso dopo 6 s in vista); afterCheck, shift, stop, minimize, expand
src/lib/rest-alert.ts   unlockAudio (dentro la spunta), suono di fine con AudioContext, vibrazione, alertRestEnd(settings)
src/lib/rest-notifier.ts  RestNotifier (schedule/cancel) e localRestNotifier: predisposizione Web Push (contratto in docs/archive/restyling/WEB-PUSH.md)
src/lib/wake-lock.ts    keepScreenOn(on): schermo acceso durante l'allenamento in corso
src/lib/archive-store.svelte.ts  archiveStore(): vista reattiva (rune) del repository condiviso, per le isole Svelte; askPersistenceOnce(); avviso beforeunload con modifiche solo in memoria
src/lib/bottom-bars.ts  setBottomBar(id, altezza, persistente): somma le barre in basso in --bottom-bars-height (base della pagina in --bottom-bars-base)
src/lib/units.ts        kg/lb e m/ft: fromKg/toKg, fromMeters/toMeters, parseWeight, weightFieldValue, formatWeight, formatWeightRange, formatDistance
src/lib/format.ts       testi per l'utente: plural, formatDateKey, formatTimestamp, formatPeriod e withPreposition ("all’8 settembre"), formatDuration ("1:30"), speakDuration, formatWeekdays ("lun, gio"), formatDayMonth; dallo step 5 formatRelativeDay ("giovedì", "12 giorni fa"), formatOnDay ("l’8 settembre"), formatElapsed ("1 h 05 min"), formatClock, formatWeekRange, formatMonth, formatLongDay (con test)
src/lib/device.ts       isIos, isStandalone, canVibrate, ultimo backup (workout-tracker.lastBackup), downloadText
src/lib/pwa.ts          registerServiceWorker (scope = percorso base, solo in produzione), invito all'installazione trattenuto (listenForInstallPrompt, canPromptInstall, promptInstall, evento bt:installable)
src/data/               catalog.ts (BASE_CATALOG, ID del PoC invariati) e starter-routines.ts (A/B convertite); seed-data.test.ts blocca l'elenco degli ID (POC_IDS)
tests/fixtures/         synthetic-poc-backup.json (formato "Esporta" del PoC), usato da Vitest e dagli e2e
public/fonts/           Atkinson Hyperlegible Next, woff2 variabile del sottoinsieme latino (da @fontsource-variable 5.3.0) e licenza OFL
public/icons/           icone della PWA (192, 512, maskable 512, apple-touch 180)
public/sw-push.js       handler push e notificationclick del service worker (timer di recupero, nessun server)
src/pages/
  index.astro           Oggi (/): primo avvio se non c'è un archivio; settimana, schede da scegliere con la suggerita, Inizia/Riprendi, ultimo allenamento
  welcome.astro         primo avvio (/welcome): cosa fa, dove sono i dati, schede di esempio, da zero, importa
  settings.astro        Impostazioni e Dati e privacy (/settings)
  routines.astro        Schede (/routines): elenco con crea, duplica, rinomina, riordina, archivia, elimina
  routine.astro         editor di una scheda (/routine?id=…)
  calendar.astro        Calendario (/calendar, ?date= apre il foglio del giorno, ?view=month il mese): settimana, mese, settimana tipo, eccezioni
  workout.astro         allenamento in corso (/workout, step 6), senza tab bar (è una modalità: «Torna a Oggi» nell'intestazione); ?summary=<id> mostra il riepilogo di una sessione appena conclusa
  history.astro         Storico (/history, step 8): allenamenti per mese, ?view=exercises l'elenco degli esercizi fatti
  session.astro         dettaglio modificabile di un allenamento concluso (/session?id=…, &date= se si arriva dal calendario): Workout con detail
  exercise.astro        progressi di un esercizio (/exercise?id=…): record, grafico, cronologia
  manifest.webmanifest.ts  manifest della PWA generato alla build (start_url, scope e icone nel percorso base)
  _kit.astro            /kit: pagina interna del design system (?theme=light|dark forza il tema); fuori dalla navigazione, dal precache e dalla build pubblicata (solo dev e WT_KIT=1)
src/components/ui/      componenti base: AppHeader, TabBar, EmptyState (.astro); SetInput, SetRow, SegmentedControl, Switch, Stepper,
                        LiveField (campo che salva a ogni battuta), SaveBar, Toast, BottomSheet, ConfirmDialog (.svelte)
src/components/shell/ArchiveStatus.svelte  barra di salvataggio nel guscio, solo con un problema (unsaved, conflict, unreadable); aggiorna --bottom-bars-height
src/components/shell/WorkoutMiniBar.svelte  mini-barra "allenamento in corso" sulle altre pagine (non su /workout; su Oggi solo con un recupero), transition:persist; con un recupero è il timer ridotto, con la freccia verso l'allenamento
src/components/shell/RestTimerHost.svelte  timer di recupero nel guscio (transition:persist): finestra a tutto schermo su ogni pagina, annunci alle soglie, wake lock
src/components/data/ImportFlow.svelte      importazione (file v2 o backup del PoC): anteprima, mantieni/sostituisci, riepilogo con gli scartati
src/components/settings/  SettingsPage (tema, unità, allenamento, guida «Come funziona»), DataSection (Dati e privacy), InstallSection (app sul telefono)
src/components/welcome/WelcomeActions.svelte, src/components/today/Today.svelte (Oggi)
src/components/calendar/  Calendar (pagina), DaySheet (foglio del giorno con l'eccezione), WeekStrip (striscia di Oggi), day-status.ts (icona e testo di ogni stato)
src/components/history/  HistoryPage (Storico), ExerciseProgress (pagina esercizio), ProgressChart (grafico a linea in SVG scritto a mano, skill dataviz)
src/components/workout/  Workout (pagina: esercizi per blocco, riordino, barra fissa con durata, salvataggio e Termina; con detail il dettaglio di una sessione conclusa, senza recupero, con Riapri ed Elimina), WorkoutExercise (esercizio con righe serie e nota), VariantSheet ("Cambia esercizio" e "Altro esercizio…"), ExerciseDetailsSheet (approfondimento), SessionSummary (riepilogo e invito all'installazione)
src/components/routines/  RoutineList (elenco), RoutineEditor (editor), EntryEditor (voce chiusa/aperta)
src/components/exercises/ExercisePicker.svelte  foglio del catalogo con ricerca e "Crea «…»" (esercizio personalizzato)
src/components/workout/RestTimer.svelte  vista del timer a tutto schermo (livello che si svuota, "Vai", "finito da"), finestra modale o anteprima per /kit
src/components/workout/RestTimerBar.svelte  vista del timer ridotto (sopra la barra dell'allenamento e nella mini-barra)
src/components/kit/     isole dimostrative usate solo da /kit
```

### Modello di rendering

- Il sito è **completamente statico** (nessun adapter, nessun rendering lato server). Non introdurre route dinamiche lato server: un parametro variabile va passato in query string e letto nel client (`/session?id=`).
- **Percorso base:** ogni link, redirect e risorsa del codice passa da `appUrl()` di `src/lib/paths.ts` (`appUrl('/settings')` → `/workout-tracker/settings/`), mai da un percorso assoluto scritto a mano. Le pagine sono cartelle (`dist/settings/index.html`): i link finiscono con la barra, così il server non reindirizza e il service worker trova la pagina nel precache. Nel CSS gli `url(/…)` di `public/` vengono riscritti da Vite con la base.
- **Navigazione:** le pagine dell'app usano `AppLayout`, che include il `ClientRouter`. I moduli (archivio compreso) restano caricati tra una pagina e l'altra; le isole vengono ricreate a ogni pagina. Per i redirect usa `navigate()` di `astro:transitions/client`. Lo scambio di pagina sostituisce gli attributi di `<html>`: per questo lo script del tema ascolta `astro:before-swap`.
- **Svelte 5:** le parti con stato sono isole Svelte, il resto resta `.astro`. Le isole che leggono l'archivio sono `client:only="svelte"` (i dati sono solo nel browser, il rendering alla build non li vedrebbe); un'isola `client:load` deve leggere l'archivio solo in `onMount` o nei gestori (vedi `WelcomeActions` e lo store pigro di `ImportFlow`). Il testo passa dal templating di Svelte, che fa l'escape da solo: niente `innerHTML`.
- Ogni pagina dell'app usa `AppLayout` (con `tab` per la voce attiva della tab bar; `showHeader={false}` solo sul primo avvio, `showTabs={false}` sul primo avvio e sull'allenamento in corso, che ha `back` verso Oggi). `/kit` usa `Base`.
- `<script>` nei `.astro` solo semplici (TypeScript, elaborati e bundlati da Astro), mai `type="module"` o `define:vars`. Unica eccezione: lo script `is:inline` del tema in `Base.astro`, che deve girare prima del primo disegno.
- Il codice accede al diario **solo tramite `src/lib/archive/`**: nelle isole con `archiveStore()` (`src/lib/archive-store.svelte.ts`), che espone `archive`, `state`, `isNew` reattivi e `repo` per `saveNow`, `reload`, `replace`.
- **Guscio:** lo stack fisso in basso dichiara la sua altezza in `--bottom-bars-height` sul `<body>`: `AppLayout` scrive la base (tab bar) in `--bottom-bars-base`, le barre che compaiono (barra di salvataggio, barra dell'allenamento, mini-barra) si dichiarano con `setBottomBar` di `src/lib/bottom-bars.ts`; il `<main>`, gli avvisi brevi e i pulsanti appiccicati la usano.
- **Timer di recupero:** una sola istanza nel guscio (`RestTimerHost`), stato in `restTimer()`; la spunta lo avvia con `restTimer().afterCheck(...)` dentro il gesto (sblocca l'audio), tutto il resto (spunta tolta, serie tolta, sessione conclusa) lo annulla da sé guardando l'archivio. Le viste `RestTimer` e `RestTimerBar` non leggono nulla: ricevono i valori.
- **PWA:** il service worker esiste solo nella build (`npm run build`), non con `npm run dev`. Si aggiorna da solo (`skipWaiting` + `clientsClaim`); le copie vecchie si cancellano. `/kit` e i suoi chunk sono fuori dal precache.

### Chiavi di localStorage

| Chiave | Forma | Note |
| --- | --- | --- |
| `workout-tracker.archive.v2` | `Archive` di `src/lib/archive/types.ts` (`version: 2`, `revision`, `catalog`, `routines`, `schedule`, `overrides`, `sessions`, `settings`) | Il diario. Si legge e si scrive **solo** con `ArchiveRepository` (`archiveStore()` nelle isole). Pesi in kg, distanze in metri. Assente = primo avvio (`isNew`) |
| `workout-tracker.theme` | `light` \| `dark` (assente = sistema) | Preferenza del dispositivo, fuori dall'archivio (`src/lib/theme.ts`) |
| `workout-tracker.lastBackup` | timestamp in ms | Ultimo backup esportato da questo browser (`src/lib/device.ts`), mostrato in Dati e privacy |
| `workout-tracker.restTimer` | `RestTimerState` di `src/lib/rest-timer.ts` (sessione, voce, serie, `start`, `end`, `duration`, `warmup`, `minimized`, `alerted`) | Il recupero in corso, fuori dall'archivio perché cambia spesso. Assente = nessun recupero. Si legge e si scrive solo con `restTimer()` |
| `workout-tracker.calendarHint` | `"seen"` | Suggerimento del calendario già visto su questo dispositivo, fuori dall'archivio. Assente = il suggerimento si vede. Letture e scritture in try/catch: se lo storage non risponde il suggerimento si vede |

- **Archivio v2:**
  - le modifiche passano da `repo.update(a => newArchive)` (o `archiveStore().update`) con funzioni pure che non mutano l'argomento; il repository incrementa `revision`, salva e notifica (`subscribe`, con `origin`: `edit`, `external`, `reload`, `import`). Con stato `unreadable` o `conflict` non scrive nulla;
  - `repo.replace(archive)` sostituisce tutto (import confermato, cancellazione e il suo "Annulla"); è l'unica scrittura ammessa con un archivio illeggibile;
  - primo avvio: `isNew` finché la chiave non esiste. "Parti da zero" salva l'archivio vuoto, "Inizia con le schede di esempio" usa `withStarterRoutines`. `navigator.storage.persist()` si chiede solo quando l'archivio esiste (`askPersistenceOnce`), mai prima della scelta sul primo avvio;
  - pianificazione ed eccezioni: id di scheda, `null` = riposo, chiave assente = nulla di pianificato;
  - una sola sessione con `end: null` (in corso) alla volta; `mergeImport` lo garantisce anche negli import;
  - esercizi: quelli di base sono in `src/data/catalog.ts` (ID del PoC, in italiano perché sono dati dello storico: mai cambiati né rimossi), quelli personalizzati in `archive.catalog` con id `custom-<nome>`; un nome scritto a mano passa sempre da `ensureExercise`;
  - i riferimenti (scheda, esercizio) non sono vincolati dalla validazione: un id sconosciuto si mostra con `exerciseName`, che ricade sull'id.
- Le date sono stringhe `YYYY-MM-DD` in **ora locale**: usa `toDateKey(date)` e `fromDateKey(key)`, mai `toISOString()` o `new Date('YYYY-MM-DD')` (che usano UTC). Per i testi: `formatDateKey`, `formatPeriod` di `src/lib/format.ts`.
- Formato di import/export: l'archivio v2 in JSON (più `exportedAt`), nome `workout-tracker-YYYY-MM-DD.json`; si importano anche i backup del PoC.

## Pubblicazione

- Worker Cloudflare separato `workout-tracker`, solo asset statici, configurato in `wrangler.jsonc` (asset in `dist`, dominio personalizzato, `workers.dev` attivo). Workers Builds è collegato al repository (ramo `main`, build `npm run build`, deploy `npx wrangler deploy`): ogni push su `main` va online da solo. Un deploy a mano resta possibile con `npm run build && npx wrangler deploy` (wrangler è autenticato sul Mac di Francesco).
- **Ogni push su `main` va in produzione.** Si lavora solo su `main`, mai su rami `claude/...`; si pusha solo con i controlli dello step verdi.
- L'app è su `https://workout-tracker.francescoperagine.com` (dominio collegato il 12 ottobre 2026) e su `https://workout-tracker.francescoperagine.workers.dev`; le pagine restano `noindex`, il sito personale la elenca in Projects.
- I dati del browser sono per origine: il backup è già stato spostato da `workers.dev` al dominio (13 ottobre 2026); a ogni cambio di dominio si esporta e si reimporta.
- `/kit` (pagina interna del design system) non è nella build pubblicata: `src/pages/_kit.astro` è ignorata dal routing di Astro e la piccola integrazione `kitPage` di `astro.config.mjs` la inietta come `/kit` solo con `npm run dev` o con `WT_KIT=1` (build dei test e2e).

## Il PoC

Il PoC statico (`BodyTracker/`) è stato eliminato allo step 9, dopo la verifica della tabella "Assorbimento del PoC" in `docs/archive/restyling/PIANO.md` (ogni riga con un e2e). Privacy, limiti e approfondimenti del catalogo del suo `LEGGIMI.md` sono nel `README.md`. Il suo formato di backup (`bodytracker.archivio.v1`, campi in italiano, `versione: 1`) resta supportato **solo come file da importare** (`poc-import.ts`, fixture `tests/fixtures/synthetic-poc-backup.json`): è l'unico posto dove resta il nome `bodytracker`. La lettura diretta della sua chiave nel `localStorage` è stata tolta (il PoC non è mai stato pubblicato).

## Impeccable nel repository

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
- `npx impeccable detect src/` funziona senza browser. Per le pagine renderizzate in un container come root serve Chromium con `--no-sandbox` (vedi `docs/SVILUPPO.md`).
