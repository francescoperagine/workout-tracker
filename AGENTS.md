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
npm run build      # sito statico in dist/, con il service worker (dist/sw.js)
BT_BASE=/bodytracker/ npm run build   # build pubblicata in un percorso del sito (BT_SITE cambia il dominio)
npm run preview
npm run check      # astro check (type-check di .astro, .ts e .svelte)
npm test           # Vitest: file src/**/*.test.ts (logica pura)
npm run test:e2e   # Playwright: tests/e2e/, sulla build servita da astro preview (porta 4322)
BT_BASE=/bodytracker/ npm run test:e2e   # la stessa suite sulla build nel percorso /bodytracker/
node scripts/make-icons.mjs   # rigenera le icone della PWA in public/icons/ (sharp arriva con Astro)
npm run astro -- <comando>
npx impeccable detect src/   # detector di anti-pattern di Impeccable sui sorgenti
```

Non ci sono linter né formatter configurati. Per verificare una modifica: `npm run build`, `npm run check`, `npm test`, `npm run test:e2e`, poi controlla le pagine nel browser con `npm run dev` o `npm run preview`. Verifica anche il layout a larghezza telefono (390×844 e 320×568), perché l'uso principale è da mobile in palestra.

- **Playwright:** il progetto `mobile` (390×844) e `desktop`. Serve una Chromium compatibile con `@playwright/test`: in locale `npx playwright install chromium`; dove c'è già una Chromium (es. `/opt/pw-browsers/chromium` nel container cloud) passa `PW_CHROMIUM_PATH=/percorso/chromium npm run test:e2e`.
- **Nomi dei test:** i test e2e di una storia cominciano con il suo ID (`US-12 registra una serie copiando il precedente`).
- **Percorsi nei test:** sempre relativi (`page.goto('settings/')`, `''` per Oggi), mai assoluti (`'/settings'`): sono risolti rispetto a `baseURL`, che include `BT_BASE`. Aiuti comuni (archivio di prova, scelta di un file, foglio aperto) in `tests/e2e/helpers.ts`.
- **Service worker nei test:** bloccato nella config (`serviceWorkers: 'block'`), riattivato solo nei test della PWA (`us-03-pwa.spec.ts`).
- **Server dei test:** con `reuseExistingServer` un `astro preview` già attivo sulla porta 4322 viene riusato così com'è: se passi da una build con `BT_BASE` a una senza, fermalo prima.
- **`astro preview` in Astro 7:** quando gira sotto un agente parte in background e restituisce subito il controllo (`npx astro preview stop` per fermarlo, `status` e `logs` per controllarlo). Con `--ignore-lock` resta in primo piano: lo usa la config di Playwright.
- **Pagine con `_`:** Astro ignora i file in `src/pages/` il cui nome comincia con `_` (non generano una route).

## Struttura dell'app Astro

```
astro.config.mjs        site e base da BT_SITE e BT_BASE (default: francescoperagine.com, /), output statico, Svelte, Tailwind, integrazione del service worker
svelte.config.js        vitePreprocess (TypeScript nei componenti .svelte)
vitest.config.ts        test unitari in src/**/*.test.ts
playwright.config.ts    test e2e in tests/e2e/, server astro preview sulla porta 4322, baseURL con BT_BASE
scripts/make-icons.mjs  icone della PWA (public/icons/) dal disegno del favicon
src/integrations/service-worker.ts  workbox-build in astro:build:done: precache di tutto dist/ (tranne /kit) in dist/sw.js, con importScripts di public/sw-push.js (handler push e notificationclick, predisposizione Web Push)
src/styles/global.css   design system: @font-face, token in @theme (colori light-dark(), scala tipografica, raggi), base (superfici del browser), classi componente (.shell, .btn-*, .field, .panel, .digits)
src/layouts/Base.astro  documento di ogni pagina: <html lang="it">, noindex, favicon, manifest, icona iOS, preload del font, script inline del tema, slot "head". Props: title, description, bodyClass, bodyStyle
src/layouts/AppLayout.astro  guscio dell'app: ClientRouter, AppHeader, <main>, stack in basso (WorkoutMiniBar persistente + ArchiveStatus + TabBar), RestTimerHost persistente (timer di recupero), registrazione del service worker. Props: title, heading, subtitle, description, tab, showTabs, showHeader, showSettings, showArchiveStatus
src/lib/paths.ts        appUrl(path) e BASE: ogni link e risorsa passa da qui (percorso base, barra finale delle pagine); joinBase, isCurrentPath (con test)
src/lib/theme.ts        temi: THEME_REGISTRY (unico elenco: system, light, dark, con etichette Sistema/Chiaro/Scuro; i temi futuri si aggiungono qui e in src/styles/themes/<id>.css, vedi DESIGN.md "Aggiungere un tema"), chiave bodytracker.theme, readTheme, applyTheme, saveTheme, themeBootScript (riapplica il tema anche a ogni navigazione del ClientRouter; con test)
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
  workout.ts            allenamento attivo (step 6): previousExercise/previousSets (precedente per variante e per posizione tra riscaldamento e serie di lavoro), completedSet (spunta che conferma il precedente), nextSet (serie da fare, alternanza in superserie), plannedEntry (voce della scheda), serie ed esercizi in sessione con "Annulla", switchExercise (variante), note, nome e data, loadRecords, workoutSummary
  conversion.ts         testi del PoC → v2: restSeconds, splitLoad, routineFromPoc
  poc-import.ts         convertPocArchive (backup del PoC, con scarti e avvisi), readPocKey
  backup.ts             exportArchive, readBackup (v2 o PoC), previewImport, mergeImport (keep/replace)
src/lib/rest-timer.ts   timer di recupero (step 7), logica pura: REST_TIMER_KEY, RestTimerState, startRest, shiftRest (±15 s), restRemaining/restFraction/restOverFor, restAfterCheck (quale recupero parte: riscaldamento, 0, superserie a fine giro), restIsStale (spunta tolta, sessione conclusa), crossedThreshold (annunci a 30, 10, 0), nextSetText, parseRestTimer (con test a orologio finto)
src/lib/rest-timer.svelte.ts  restTimer(): store unico del timer (stato salvato a ogni cambiamento, scatti di 250 ms, visibilitychange, evento storage, avviso di fine una volta sola, "Vai" chiuso dopo 6 s in vista); afterCheck, shift, stop, minimize, expand
src/lib/rest-alert.ts   unlockAudio (dentro la spunta), suono di fine con AudioContext, vibrazione, alertRestEnd(settings)
src/lib/rest-notifier.ts  RestNotifier (schedule/cancel) e localRestNotifier: predisposizione Web Push (contratto in docs/restyling/WEB-PUSH.md)
src/lib/wake-lock.ts    keepScreenOn(on): schermo acceso durante l'allenamento in corso
src/lib/archive-store.svelte.ts  archiveStore(): vista reattiva (rune) del repository condiviso, per le isole Svelte; askPersistenceOnce(); avviso beforeunload con modifiche solo in memoria
src/lib/bottom-bars.ts  setBottomBar(id, altezza, persistente): somma le barre in basso in --bottom-bars-height (base della pagina in --bottom-bars-base)
src/lib/units.ts        kg/lb e m/ft: fromKg/toKg, fromMeters/toMeters, parseWeight, weightFieldValue, formatWeight, formatWeightRange, formatDistance
src/lib/format.ts       testi per l'utente: plural, formatDateKey, formatTimestamp, formatPeriod e withPreposition ("all’8 settembre"), formatDuration ("1:30"), speakDuration, formatWeekdays ("lun, gio"), formatDayMonth; dallo step 5 formatRelativeDay ("giovedì", "12 giorni fa"), formatOnDay ("l’8 settembre"), formatElapsed ("1 h 05 min"), formatClock, formatWeekRange, formatMonth, formatLongDay (con test)
src/lib/device.ts       isIos, isStandalone, canVibrate, ultimo backup (bodytracker.lastBackup), downloadText
src/lib/pwa.ts          registerServiceWorker (scope = percorso base, solo in produzione), invito all'installazione trattenuto (listenForInstallPrompt, canPromptInstall, promptInstall, evento bt:installable)
src/data/               catalog.ts (BASE_CATALOG, ID del PoC invariati) e starter-routines.ts (A/B convertite); test di parità con il PoC in seed-data.test.ts
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
  workout.astro         allenamento in corso (/workout, step 6); ?summary=<id> mostra il riepilogo di una sessione appena conclusa
  history.astro         segnaposto con stato vuoto, sostituito dallo step 8
  manifest.webmanifest.ts  manifest della PWA generato alla build (start_url, scope e icone nel percorso base)
  kit.astro             /kit: pagina interna del design system (?theme=light|dark forza il tema); fuori dalla navigazione e dal precache
src/components/ui/      componenti base: AppHeader, TabBar, EmptyState (.astro); SetInput, SetRow, SegmentedControl, Switch, Stepper,
                        LiveField (campo che salva a ogni battuta), SaveBar, Toast, BottomSheet, ConfirmDialog (.svelte)
src/components/shell/ArchiveStatus.svelte  barra di salvataggio nel guscio, solo con un problema (unsaved, conflict, unreadable); aggiorna --bottom-bars-height
src/components/shell/WorkoutMiniBar.svelte  mini-barra "allenamento in corso" sulle altre pagine (non su /workout; su Oggi solo con un recupero), transition:persist; con un recupero è il timer ridotto, con la freccia verso l'allenamento
src/components/shell/RestTimerHost.svelte  timer di recupero nel guscio (transition:persist): finestra a tutto schermo su ogni pagina, annunci alle soglie, wake lock
src/components/data/ImportFlow.svelte      importazione (file v2/PoC o chiave del PoC): anteprima, mantieni/sostituisci, riepilogo con gli scartati
src/components/settings/  SettingsPage (tema, unità, allenamento), DataSection (Dati e privacy), InstallSection (app sul telefono)
src/components/welcome/WelcomeActions.svelte, src/components/today/Today.svelte (Oggi)
src/components/calendar/  Calendar (pagina), DaySheet (foglio del giorno con l'eccezione), WeekStrip (striscia di Oggi), day-status.ts (icona e testo di ogni stato)
src/components/workout/  Workout (pagina: esercizi per blocco, riordino, barra fissa con durata, salvataggio e Termina), WorkoutExercise (esercizio con righe serie e nota), VariantSheet ("Cambia esercizio" e "Altro esercizio…"), ExerciseDetailsSheet (approfondimento), SessionSummary (riepilogo e invito all'installazione)
src/components/routines/  RoutineList (elenco), RoutineEditor (editor), EntryEditor (voce chiusa/aperta)
src/components/exercises/ExercisePicker.svelte  foglio del catalogo con ricerca e "Crea «…»" (esercizio personalizzato)
src/components/workout/RestTimer.svelte  vista del timer a tutto schermo (livello che si svuota, "Vai", "finito da"), finestra modale o anteprima per /kit
src/components/workout/RestTimerBar.svelte  vista del timer ridotto (sopra la barra dell'allenamento e nella mini-barra)
src/components/kit/     isole dimostrative usate solo da /kit
```

### Modello di rendering

- Il sito è **completamente statico** (nessun adapter, nessun rendering lato server). Non introdurre route dinamiche lato server: un parametro variabile va passato in query string e letto nel client (`/session?id=`).
- **Percorso base:** ogni link, redirect e risorsa del codice passa da `appUrl()` di `src/lib/paths.ts` (`appUrl('/settings')` → `/bodytracker/settings/`), mai da un percorso assoluto scritto a mano. Le pagine sono cartelle (`dist/settings/index.html`): i link finiscono con la barra, così il server non reindirizza e il service worker trova la pagina nel precache. Nel CSS gli `url(/…)` di `public/` vengono riscritti da Vite con la base.
- **Navigazione:** le pagine dell'app usano `AppLayout`, che include il `ClientRouter`. I moduli (archivio compreso) restano caricati tra una pagina e l'altra; le isole vengono ricreate a ogni pagina. Per i redirect usa `navigate()` di `astro:transitions/client`. Lo scambio di pagina sostituisce gli attributi di `<html>`: per questo lo script del tema ascolta `astro:before-swap`.
- **Svelte 5:** le parti con stato sono isole Svelte, il resto resta `.astro`. Le isole che leggono l'archivio sono `client:only="svelte"` (i dati sono solo nel browser, il rendering alla build non li vedrebbe); un'isola `client:load` deve leggere l'archivio solo in `onMount` o nei gestori (vedi `WelcomeActions` e lo store pigro di `ImportFlow`). Il testo passa dal templating di Svelte, che fa l'escape da solo: niente `innerHTML`.
- `<script>` nei `.astro` solo semplici (TypeScript, elaborati e bundlati da Astro), mai `type="module"` o `define:vars`. Unica eccezione: lo script `is:inline` del tema in `Base.astro`, che deve girare prima del primo disegno.
- Il codice accede al diario **solo tramite `src/lib/archive/`**: nelle isole con `archiveStore()` (`src/lib/archive-store.svelte.ts`), che espone `archive`, `state`, `isNew` reattivi e `repo` per `saveNow`, `reload`, `replace`.
- **Guscio:** lo stack fisso in basso dichiara la sua altezza in `--bottom-bars-height` sul `<body>`: `AppLayout` scrive la base (tab bar) in `--bottom-bars-base`, le barre che compaiono (barra di salvataggio, barra dell'allenamento, mini-barra) si dichiarano con `setBottomBar` di `src/lib/bottom-bars.ts`; il `<main>`, gli avvisi brevi e i pulsanti appiccicati la usano.
- **Timer di recupero:** una sola istanza nel guscio (`RestTimerHost`), stato in `restTimer()`; la spunta lo avvia con `restTimer().afterCheck(...)` dentro il gesto (sblocca l'audio), tutto il resto (spunta tolta, serie tolta, sessione conclusa) lo annulla da sé guardando l'archivio. Le viste `RestTimer` e `RestTimerBar` non leggono nulla: ricevono i valori.
- **PWA:** il service worker esiste solo nella build (`npm run build`), non con `npm run dev`. Si aggiorna da solo (`skipWaiting` + `clientsClaim`); le copie vecchie si cancellano. `/kit` e i suoi chunk sono fuori dal precache.

### Chiavi di localStorage

| Chiave | Forma | Note |
| --- | --- | --- |
| `bodytracker.archive.v2` | `Archive` di `src/lib/archive/types.ts` (`version: 2`, `revision`, `catalog`, `routines`, `schedule`, `overrides`, `sessions`, `settings`) | Il diario. Si legge e si scrive **solo** con `ArchiveRepository` (`archiveStore()` nelle isole). Pesi in kg, distanze in metri. Assente = primo avvio (`isNew`) |
| `bodytracker.archivio.v1` | Archivio del PoC (campi in italiano) | Solo lettura, per l'import diretto sulla stessa origine (`readPocKey`). Nome e formato sono del PoC e non cambiano |
| `bodytracker.theme` | `light` \| `dark` (assente = sistema) | Preferenza del dispositivo, fuori dall'archivio (`src/lib/theme.ts`) |
| `bodytracker.lastBackup` | timestamp in ms | Ultimo backup esportato da questo browser (`src/lib/device.ts`), mostrato in Dati e privacy |
| `bodytracker.restTimer` | `RestTimerState` di `src/lib/rest-timer.ts` (sessione, voce, serie, `start`, `end`, `duration`, `warmup`, `minimized`, `alerted`) | Il recupero in corso, fuori dall'archivio perché cambia spesso. Assente = nessun recupero. Si legge e si scrive solo con `restTimer()` |

- **Archivio v2:**
  - le modifiche passano da `repo.update(a => newArchive)` (o `archiveStore().update`) con funzioni pure che non mutano l'argomento; il repository incrementa `revision`, salva e notifica (`subscribe`, con `origin`: `edit`, `external`, `reload`, `import`). Con stato `unreadable` o `conflict` non scrive nulla;
  - `repo.replace(archive)` sostituisce tutto (import confermato, cancellazione e il suo "Annulla"); è l'unica scrittura ammessa con un archivio illeggibile;
  - primo avvio: `isNew` finché la chiave non esiste. "Parti da zero" salva l'archivio vuoto, "Inizia con le schede di esempio" usa `withStarterRoutines`. `navigator.storage.persist()` si chiede solo quando l'archivio esiste (`askPersistenceOnce`), mai prima della scelta sul primo avvio;
  - pianificazione ed eccezioni: id di scheda, `null` = riposo, chiave assente = nulla di pianificato;
  - una sola sessione con `end: null` (in corso) alla volta; `mergeImport` lo garantisce anche negli import;
  - esercizi: quelli di base sono in `src/data/catalog.ts` (ID del PoC, in italiano perché sono dati dello storico: mai cambiati né rimossi), quelli personalizzati in `archive.catalog` con id `custom-<nome>`; un nome scritto a mano passa sempre da `ensureExercise`;
  - i riferimenti (scheda, esercizio) non sono vincolati dalla validazione: un id sconosciuto si mostra con `exerciseName`, che ricade sull'id.
- Le date sono stringhe `YYYY-MM-DD` in **ora locale**: usa `toDateKey(date)` e `fromDateKey(key)`, mai `toISOString()` o `new Date('YYYY-MM-DD')` (che usano UTC). Per i testi: `formatDateKey`, `formatPeriod` di `src/lib/format.ts`.
- Formato di import/export: l'archivio v2 in JSON (più `exportedAt`), nome `bodytracker-YYYY-MM-DD.json`; si importano anche i backup del PoC.

## Convenzioni

- **Si lavora sempre su `main`:** niente branch né pull request, anche se la sessione propone un branch di lavoro. Commit e push direttamente su `main` (`git push origin main`).
- **Fine di uno step:** aggiorna `docs/restyling/HANDOFF.md` per lo step successivo e chiudi **sempre** il messaggio finale all'utente con il prompt di handoff completo, copiato da HANDOFF.md, pronto da incollare nella nuova conversazione.
- **Lingua:** il codice è in **inglese** (nomi di file e cartelle, route, identificatori, tipi, campi del modello dati, chiavi di storage, token e classi CSS, id degli elementi). È in **italiano** tutto ciò che vede l'utente: testo dell'interfaccia, `title`/`description`, etichette accessibili, messaggi di errore e di stato; date formattate con `toLocaleDateString('it-IT', …)`. Restano in italiano anche commenti, documentazione e nomi dei test (cominciano con l'ID della storia), e i dati esterni: gli ID degli esercizi del PoC e i campi del suo formato di backup.
- **Date nei test e2e:** il browser dei test è in `Europe/Rome` (`timezoneId`), Node no: per fissare "oggi" con `page.clock.setFixedTime` usa un istante con il fuso esplicito (`new Date('2026-10-08T18:30:00+02:00')`).
- Le route seguono i nomi dei file: `/settings`, `/calendar`, `/routines`, `/routine?id=`, `/history`, `/workout`, `/welcome` (vedi BRIEF.md).
- Ogni pagina dell'app usa `AppLayout` (con `tab` per la voce attiva della tab bar; `showTabs={false}` e `showHeader={false}` solo sul primo avvio). `/kit` usa `Base`.
- **Design system (step 1):** il codice nuovo usa solo i token di `DESIGN.md`, definiti in `@theme` in `global.css`, e i componenti base. Mai colori della palette di default di Tailwind (`bg-blue-600`, `text-gray-500`, …) né valori letterali.
  - Colori di contenuto, che cambiano col tema: `bg-background`, `bg-surface`, `bg-field`, `text-foreground`, `text-muted`, `border-line`, `border-line-strong`, `bg-accent`/`text-on-accent`, `text-accent-text`, `bg-done`, `text-danger`, `bg-warning-bg`. Sono `light-dark()`: niente varianti `dark:`.
  - Guscio, uguale nei due temi (intestazione, barra di salvataggio, tab bar, timer): classe `.shell` più i token `shell-*` e `level`. Dentro `.shell` i token di contenuto si risolvono nella variante scura.
  - Classi componente: `.btn` con `.btn-primary`, `-secondary`, `-danger`, `-text`, `-icon`, `-block`; `.label`, `.field`, `.hint`, `.field-error`; `.choice` e `.radio`; `.panel` (un solo livello, mai annidato); `.digits` per pesi e ripetizioni.
  - Scala tipografica: `text-xs` … `text-xl`, `text-page-title`, `text-digits`; raggi `--radius-field`/`-panel`/`-dialog`; curva `--ease-out-expo`; altezza dello stack in basso `--bottom-bars-height`. Tutti i numeri sono tabulari (`font-variant-numeric` sulla radice).
  - Icone: Lucide da `@lucide/astro/icons/<nome>` e `@lucide/svelte/icons/<nome>`, tratto 2, 20–22px, `aria-hidden` con un'etichetta sul controllo. Nessuna emoji.
  - Prima di aggiungere un componente guarda `/kit`; un componente nuovo del design system va mostrato anche lì.
- Conferme e feedback: `ConfirmDialog` (azioni distruttive, con un testo che dice cosa si perde), `Toast` (esito, con "Annulla" dove possibile), `SaveBar` (nel guscio con `ArchiveStatus`), `BottomSheet` per anteprime e scelte. Mai `alert`/`confirm`/`prompt`.
- Link: sempre `appUrl('/percorso')`, anche per le ancore (`appUrl('/settings#data')`).
- Il codice segue lo stile dei file vicini: alcuni file usano punto e virgola, altri no. Non riformattare interi file.
- I commenti nel codice sono in italiano.

## Limiti noti

- Lo Storico è un segnaposto (stato vuoto) fino allo step 8. L'allenamento attivo è completo dallo step 6, il timer di recupero dallo step 7. Le Schede sono complete dallo step 4 (riordino solo con frecce: il trascinamento è rimandato).
- Gli avvisi di fine recupero arrivano solo con l'app aperta: il Web Push è solo predisposto (handler in `public/sw-push.js`, importato da `sw.js`), senza server né permessi (`docs/restyling/WEB-PUSH.md`).
- Test dello step 6 (`us-12-us-20-workout`): le schede non hanno recupero (`rest: 0`), perché spuntano più serie di fila e il timer le coprirebbe. Nei test del timer l'orologio è fermo (`page.clock.install` più `pauseAt`) e scorre con `runFor`/`fastForward`.
- La vecchia app (`bb-*`: home, pagina del giorno, `/about`, `src/scripts/`) è stata rimossa allo step 3, senza migrazione (decisione 6 del piano).
- Il service worker trova nel precache solo gli URL delle pagine con la barra finale (`/settings/`); un indirizzo scritto a mano senza barra, offline, non si apre. I link dell'app hanno sempre la barra.
- Test e2e: uno per storia (`us-01-welcome`, `us-02-import-poc`, `us-03-pwa`, `us-04-us-06-calendar`, `us-07-us-10-routines`, `us-11-us-17-today`, `us-12-us-20-workout`, `us-21-us-24-training-settings`, `us-21-us-26-rest-timer`, `us-30-themes`, `us-31-units`, `us-32-backup`, `us-33-save-status`), più lo smoke test del guscio (`smoke.spec.ts`) e i componenti di `/kit` (`kit.spec.ts`). Ogni nuova storia porta il suo test.

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
