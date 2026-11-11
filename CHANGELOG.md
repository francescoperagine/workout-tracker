# Changelog

Incrementi, dal più recente. Prima di INC-001: il restyling, step 0–9, in `docs/archive/restyling/PIANO.md`
e nella cronologia git.

## INC-029

Date: 2026-11-11

Summary:
**Muscoli con il valore di una serie (delavier-catalog, incremento 1 di 6).** I muscoli di un esercizio non sono più
due liste, principali e secondari, ma una mappa gruppo → quota di una serie: `MOST_RECRUITED = 1` e `RECRUITED = 0.5`
(ADR-014). Testi ricavati dal valore: la pagina dell'esercizio dice «Quadricipiti: 1 serie», l'editor dei
personalizzati gira nessuna → 1 serie → 0,5 serie. Gruppi nuovi: Brachiale, Flessori dell'anca, Popliteo. Archivi e
backup con la forma vecchia si leggono convertiti (principali 1, secondari 0,5). Il catalogo tiene i valori di
ADR-011 convertiti finché l'incremento 2 non lo rilegge sul Delavier: il conteggio delle settimane non cambia.

Deliverables:
- `src/lib/archive/types.ts` (`Muscles`, costanti, gruppi), `validation.ts` (mappa e conversione), `muscles.ts`
  (`sortedMuscles`, `formatShare`, conteggio per quota), `catalog.ts` (`createVariant`, `setCustomMuscles`),
  `poc-import.ts`; `src/data/catalog.ts` convertito.
- `MuscleEditor`, `ExerciseProgress` (sezione Muscoli), `/kit`; test unitari ed e2e (US-43, US-45) alla forma nuova.
- ADR-014; ADR-011 «Superseded by ADR-014»; ADR-012 (punto 1); `docs/ARCHITECTURE.md`;
  `features/delavier-catalog/SPEC.md` e `HANDOFF.md`.

ADR: ADR-014. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0). Pagina dell'esercizio guardata a 390×844 e 320×568 con il diario vero.

## INC-028

Date: 2026-11-10

Summary:
**Mappa dei muscoli: trapezio secondario nei rematori; attrezzo di Bourne 2017 verificato (dopo muscle-volume).** Nei
5 rematori del catalogo il trapezio passa da principale a secondario: l'azione principale è l'estensione della spalla
(dorsali), la retrazione della scapola è un'altra azione sotto carico (regola 2 della mappa), come l'abbassamento
della scapola nella lat machine. Il motivo precedente («metà dell'escursione») non aveva fonte. Bourne 2017 usa la
panca a 45° (manoscritto accettato ad accesso libero nell'archivio ACU): tolta la nota «da verificare».

Effetto sul conteggio: ogni serie di rematore dà al trapezio 0,5 invece di 1 (dorsali 1, deltoidi posteriori e
bicipiti 0,5 invariati). Vale anche per le settimane passate, perché il volume si ricalcola dal catalogo: voluto. Le
varianti già create da un rematore tengono i muscoli copiati (ADR-013).

Deliverables:
- `src/data/catalog.ts`: `rematore-manubri-petto-su-panca-inclinata`, `row-machine-con-appoggio`,
  `rematore-seduto-al-cavo-basso`, `rematore-manubrio-monobraccio-con-appoggio`, `row-machine`.
- `docs/archive/features/INC-027_muscle-volume-research/mappa-43.md` (righe 8, 10, 38, 39, 40, punto 1, Bourne 2017
  nella tabella degli studi e nella riga 28), ADR-011 (punto 4).

ADR: ADR-011 aggiornata (punto 4). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-027

Date: 2026-11-10

Summary:
**Linea settimanale di un gruppo muscolare (muscle-volume, incremento 6 di 6; US-46). Chiude la feature.** In
Progressi ogni barra di «Serie per muscolo» è un pulsante («Petto: 7,5 serie, apri l'andamento») che apre il foglio
«<Gruppo>: serie per settimana»: un punto per settimana, le ultime 12 concluse più quella in corso, segnata
«Settimana in corso, parziale»; zero nelle settimane vuote, nessun punto prima della prima settimana con allenamenti.

Deliverables:
- `groupWeeks` e `TREND_WEEKS` in `src/lib/archive/muscles.ts`, con i test in `src/lib/archive/muscles.test.ts`.
- `src/components/history/MuscleBars.svelte`: con `onselect` ogni riga è un pulsante da almeno 48px con la freccia;
  foglio con `ProgressChart` in `src/components/history/ProgressPage.svelte`.
- `tests/e2e/us-46-muscle-trend.spec.ts`; US-46 in `docs/archive/restyling/USER-STORIES.md`.
- `docs/ARCHITECTURE.md`, brief `.impeccable/surfaces/route-history.md`.
- Chiusura: SPEC in `docs/archive/features/INC-027_muscle-volume.md`, mappa e ricerche in
  `docs/archive/features/INC-027_muscle-volume-research/`, `features/muscle-volume/` cancellata, `docs/PROJECT.md`
  aggiornato (stato, feature attive, limiti noti); percorsi della ricerca aggiornati in ADR-011 e ADR-013.

Pagine guardate a 390×844 e 320×568, chiaro e scuro (barre con la freccia nella riga, focus visibile, foglio con il
titolo su due righe a 320).

ADR: nessuna (meccanico: si segue SPEC §7.3). Gate, anche per INC-026: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-026

Date: 2026-11-10

Summary:
**Mappa dei muscoli: chiusi i 7 punti senza studio (muscle-volume).** Non ci sarà una verifica sul Delavier: i punti li
chiude la regola della mappa (studio di crescita, poi azione articolare, stabilizzatori non contati), con il motivo
scritto nella riga di `features/muscle-volume/research/mappa-43.md`. Cambia solo il pull-through al cavo: femorali da
secondari a principali, per analogia con Morin 2025 e Bourne 2017. Rematori, lat machine e trazioni, spinte sopra la
testa, panca inclinata, hyperextension e alzate laterali restano come erano.

Deliverables:
- `src/data/catalog.ts`: `pull-through-al-cavo` con principali glutei e femorali; commento dell'hyperextension senza
  «attrezzo da verificare» (l'abstract di Bourne 2017 non lo dice, il testo completo non è ad accesso libero).
- `mappa-43.md` (motivi nelle righe, sezione «Punti senza studio»), SPEC (D4, §3.2, §4), ADR-011.

ADR: ADR-011 aggiornata (punto 4 e conseguenze). Gate: (`npx vitest run src/data` — exit 0; gate completo con INC-027).

## INC-025

Date: 2026-11-10

Summary:
**Serie per muscolo in Progressi (muscle-volume, incremento 5 di 6; US-45).** In cima a Progressi la sezione «Serie
per muscolo»: periodo «Settimana», «4 settimane» (predefinito) o «12 settimane»; barre orizzontali dei gruppi con
serie, in ordine decrescente e con il valore scritto; la riga di lettura; «Nessuna serie: …» con i gruppi a zero
(esclusi addominali e avambracci, risposta A2 di Francesco); «Senza muscoli: N serie» con i link alle pagine degli
esercizi senza muscoli.

Deliverables:
- `src/components/history/MuscleBars.svelte` (nuovo, anche in `/kit` in `KitControls`); sezione in
  `src/components/history/ProgressPage.svelte`; `formatSets` in `src/lib/format.ts` (al più un decimale).
- `tests/e2e/us-45-muscle-volume.spec.ts` (criteri 1-3); US-45 in `docs/archive/restyling/USER-STORIES.md`.
- `docs/ARCHITECTURE.md`, brief `.impeccable/surfaces/route-history.md`, SPEC (D19, §7.1, risposte di §10.2),
  handoff della feature.

Pagine guardate a 390×844 e 320×568, chiaro e scuro. Risposte di SPEC §10.2: A2; B, C, D il predefinito. Esito
Delavier: non ancora arrivato.

ADR: nessuna (A2 è la risposta di Francesco a una domanda già istruita in SPEC §10.2, registrata lì e in D19). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-024

Date: 2026-11-10

Summary:
**Muscoli nella pagina dell'esercizio e varianti (muscle-volume, incremento 4 di 6; US-43, US-44).** In fondo alla
pagina dell'esercizio, anche senza storico, la sezione «Muscoli»: per il catalogo principali e secondari in sola
lettura e «Personalizza i muscoli», che crea una variante con i muscoli copiati e la mette al posto dell'originale
nelle schede attive, con «Annulla»; per i personalizzati l'editor, un pulsante per gruppo che gira nessuno →
principale → secondario.

Deliverables:
- `src/lib/archive/catalog.ts`: `proposeVariantName`, `variantImpact`, `createVariant`, `setCustomMuscles`;
  test dei criteri 1-4 in `src/lib/archive/catalog.test.ts` («Annulla» = `mergeExercise`, inverso esatto).
- `src/components/history/MuscleEditor.svelte` (nuovo, anche in `/kit` in `KitControls`); sezione «Muscoli», foglio
  della variante e avviso con `&created=1` in `src/components/history/ExerciseProgress.svelte`.
- `tests/e2e/us-43-us-44-muscles.spec.ts`; US-43 e US-44 in `docs/archive/restyling/USER-STORIES.md`.
- `docs/ARCHITECTURE.md`, brief `.impeccable/surfaces/route-history.md`, handoff della feature.

Pagine guardate a 390×844 e 320×568, chiaro e scuro (pagina del catalogo, foglio, pagina della variante). Domande
di SPEC §10.2 senza risposta: valgono i predefiniti (C1: il foglio è la conferma). Esito Delavier: non ancora
arrivato.

ADR: ADR-013. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-023

Date: 2026-11-10

Summary:
**Logica del volume per muscolo (muscle-volume, incremento 3 di 6).** Modulo nuovo `src/lib/archive/muscles.ts`:
serie settimanali per gruppo muscolare con il conteggio frazionario (principale 1, secondario 0,5, Pelland 2026),
settimane da lunedì e periodi «settimana», «4 settimane», «12 settimane». Nessun cambiamento visibile: il grafico
arriva con l'incremento 5.

Deliverables:
- `src/lib/archive/muscles.ts`: `MUSCLE_LABELS`, `PRIMARY_SETS`, `SECONDARY_SETS`, `exerciseMuscles`,
  `weeklyVolume`, `periodVolume`; esportato da `src/lib/archive/index.ts`.
- `src/lib/archive/muscles.test.ts`: i criteri 1-8 di SPEC §9, incremento 3.
- `docs/ARCHITECTURE.md`, handoff della feature.

Limiti noti: una drop set con più scalate conta una serie per riga (commento nel modulo). Domande di SPEC §10.2
senza risposta: valgono i predefiniti (B: periodi come da D21). Esito Delavier: non ancora arrivato.

ADR: ADR-012. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-022

Date: 2026-11-10

Summary:
**Muscoli su ogni esercizio del catalogo (muscle-volume, incremento 2 di 6).** `CatalogExercise.muscles` è
obbligatorio e le 42 voci di `BASE_CATALOG` hanno principali e secondari dalla mappa della feature, con la fonte in un
commento sulla stessa riga (studio di crescita, «analogia» o «azione articolare»). Nessun cambiamento visibile: i
muscoli si vedono dall'incremento 4.

Deliverables:
- `src/lib/archive/types.ts`: `CatalogExercise.muscles: Muscles`.
- `src/data/catalog.ts`: `muscles` sulle 42 voci, commento della regola in testa.
- `src/data/seed-data.test.ts`: almeno un principale e nessun gruppo in entrambe le liste; righe bloccate dagli
  studi (squat, leg press, leg press a metà pedana, hip thrust, leg extension).
- `docs/ARCHITECTURE.md`, SPEC e handoff della feature.

Limiti noti: i 7 punti «Da controllare sul libro» valgono come da tabella finché non arriva l'esito del Delavier.
Domande di SPEC §10.2 senza risposta: valgono i predefiniti (nessuna tocca questo incremento). Criterio 1 provato
togliendo `muscles` da una voce: `npm run check` dà `ts(2741)`.

ADR: ADR-010, ADR-011. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-021

Date: 2026-11-10

Summary:
**Archivio alla versione 3, rematore doppio tolto, «alternativa» al posto di «variante» (muscle-volume, incremento
1 di 6).** I personalizzati hanno `muscles` (vuoti) e `variantOf` (l'esercizio di catalogo da cui deriva una
variante, oggi sempre `null`): lo schema entra tutto ora perché ogni push va in produzione. Un archivio o un backup
v2 si legge e diventa v3; la chiave di `localStorage` resta la stessa. `rematore-al-cavo-basso` esce dal catalogo e
si reindirizza a `rematore-seduto-al-cavo-basso` in diario, backup e import del PoC: lo storico dei due si somma.
Nel codice e nei testi l'esercizio fatto al posto di quello della scheda si chiama «alternativa» («Cambia
esercizio», «Usa questa alternativa» nel kit, «Ogni esercizio ha i suoi progressi, anche alternative e varianti»).

Deliverables:
- `src/lib/archive/types.ts`: `MUSCLE_GROUPS`, `MuscleGroup`, `Muscles`, `CustomExercise.muscles` e `variantOf`,
  `SessionExercise.alternativeOf`, `version: 3`.
- `src/lib/archive/validation.ts`: versioni 2 e 3, muscoli validati, reindirizzamenti a ogni validazione.
- `src/lib/archive/catalog.ts`: `rewriteSessions`, `rewriteRoutines` (usati da `mergeExercise`), `applyRedirects`,
  `redirectedId`; `ensureExercise` crea i personalizzati v3.
- `src/data/catalog.ts`: voce tolta, alias sul rematore seduto, `EXERCISE_REDIRECTS`; `src/data/starter-routines.ts`.
- `src/lib/archive/backup.ts` (formato `app`, v2 e v3), `src/lib/archive/poc-import.ts` (reindirizzamento prima
  dell'id sconosciuto), `src/components/data/ImportFlow.svelte`.
- `src/components/workout/AlternativeSheet.svelte` (era VariantSheet), `Workout.svelte`, testi di
  `src/components/kit/KitOverlays.svelte` e `src/components/history/ProgressPage.svelte`, commenti.
- Test: `validation.test.ts` (migrazione, versioni, muscoli, fixture del 5 novembre, doppioni, idempotenza),
  `backup.test.ts`, `poc-import.test.ts`, `catalog.test.ts`, `src/data/seed-data.test.ts`; e2e aggiornati all'id e
  ai nomi nuovi.
- `AGENTS.md` (invariante degli ID), `docs/ARCHITECTURE.md`, `README.md`, `PRODUCT.md`, `DESIGN.md`,
  `docs/PROJECT.md`, brief `route-workout` e `route-history`.

Limiti noti: una scheda aperta con il codice vecchio mostra «Formato non riconosciuto» fino al ricaricamento, senza
perdere dati; un backup nuovo non si importa in una versione vecchia. Fuori dalla lettera della SPEC: nell'import
del PoC anche gli alias contano come nome noto, altrimenti il vecchio nome «Rematore al cavo basso» finiva nelle note
come nome cambiato a mano. Interfaccia cambiata solo nei testi: Progressi guardata a 390×844 (scuro) e 320×568
(chiaro) con il backup del 5 novembre, testo a capo pulito e «Rematore seduto al cavo basso» con 5 allenamenti.

ADR: ADR-009. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-020

Date: 2026-11-09

Summary:
**Correggere l'esercizio di un allenamento passato (US-42), senza ⓘ nel dettaglio.** Ogni riga della cronologia
della pagina dell'esercizio ha «Era un altro esercizio»: si sceglie dal catalogo quello giusto e le serie di
quell'allenamento passano lì così come sono, con «Annulla» nell'avviso. Cambia solo quell'allenamento (non gli
altri, le schede o il catalogo); grafici, record e «precedente» si ricalcolano. Serve quando nell'allenamento si
è scelto un esercizio sbagliato (es. «Leg press» per «Leg press, piedi a metà pedana»). Il dettaglio
dell'allenamento perde la ⓘ, che ripeteva la pagina dei progressi.

Deliverables:
- `src/lib/archive/sessions.ts`: `reassignExercise`, `undoReassign`; test in `sessions.test.ts`.
- `src/components/history/ExerciseProgress.svelte`: pulsante sulle righe della cronologia, `ExercisePicker`, avviso.
- `src/components/history/SessionLog.svelte`: tolta la ⓘ e `ExerciseDetailsSheet`.
- e2e: `tests/e2e/us-42-reassign-exercise.spec.ts`; `us-27-us-29-history.spec.ts` (dettaglio senza ⓘ).
- `docs/ARCHITECTURE.md`, `docs/archive/restyling/USER-STORIES.md` (US-42), brief `route-history`, `docs/todo.md`.

Limiti noti: un backup vecchio importato con «sostituisci» riporta l'esercizio sbagliato; si rifà la correzione.
`ExercisePicker` si monta solo al primo «Era un altro esercizio»: chiuso terrebbe nella pagina tutto il catalogo
(lo diceva l'e2e della variante di US-28). Provato nel browser a 390×844 (scuro) e 320×568 (chiaro): spostamento,
ricalcolo della pagina e «Annulla».

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-019

Date: 2026-11-09

Summary:
**Pagina dell'esercizio con il grafico in cima.** L'ordine diventa grafico, record, cronologia. Misura e periodo
sono due controlli segmentati compatti su una riga sopra il grafico, senza le intestazioni «Misura» e «Periodo»
(restano allo screen reader; il periodo si legge «3M», «1A», «Tutto», con il nome intero come etichetta
accessibile); dove non c'è posto il periodo va a capo. Sotto il valore del punto scelto c'è il confronto con
l'allenamento precedente della stessa misura («+10 kg rispetto al 20 agosto», «Invariato…», «Primo valore
registrato»), cercato su tutto lo storico anche quando è fuori dal periodo. Sotto la trama, le serie del punto
scelto e «Apri l’allenamento». Con un solo punto niente trama, come dice il brief: valore, confronto e serie. I
record stanno in una riga da tre e, se vengono tutti dallo stesso allenamento, la data si scrive una volta.

Deliverables:
- `src/components/ui/SegmentedControl.svelte`: variante `compact` e testo abbreviato `short`; gli usi esistenti non cambiano.
- `src/components/history/ProgressChart.svelte`: `note` per punto, snippet `details`, niente trama con un punto solo.
- `src/components/history/ExerciseProgress.svelte`: nuovo ordine, confronto con il precedente, dettagli del punto, record in riga.
- `src/pages/_kit.astro`: esempio della variante compatta.
- `tests/e2e/us-27-us-29-history.spec.ts`: confronto (anche fuori periodo), link alla sessione, punto solo.
- `DESIGN.md` (controllo segmentato compatto), `.impeccable/surfaces/route-history.md` (decisione).

Limiti noti: a 320 px il periodo va a capo, allineato a destra. Viste nel browser a 390×844 (scuro) e 320×568
(chiaro) con lo storico reale di alzate laterali e leg press. Dopo il gate, due ritocchi solo di CSS visti a 320
px: il periodo a capo resta a destra (`:global` sul fieldset di `SegmentedControl`) e i valori dei record stanno
alla stessa altezza anche con un'etichetta su due righe (subgrid).

ADR: nessuna (meccanico). Gate, prima dei due ritocchi CSS: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-018

Date: 2026-11-07

Summary:
**Riepilogo di fine allenamento più asciutto.** Tolta l'icona `circle-check` sopra «Allenamento concluso»: il
titolo sale in cima. Le righe delle statistiche (Durata, Esercizi, Serie, Volume), dei record e di «Cosa hai fatto»
rientrano di 0.5rem a sinistra e a destra, mentre i filetti restano a tutta larghezza.

Deliverables:
- `src/components/workout/SessionSummary.svelte`.

Limiti noti: nessuno. Viste con Playwright a 390×844 e 320×568 (scuro).

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-017

Date: 2026-11-07

Summary:
**Invito all'installazione più discreto nel riepilogo.** «Tienila sul telefono» non è più un pannello pieno ma un
riquadro con il bordo `border` (come gli avvisi informativi di `DESIGN.md`), titolo al corpo del testo e una riga
in `text-muted`: «Si apre come un’app e funziona senza rete.» (su iPhone le istruzioni di Safari, accorciate).
«Installa l’app» sta a destra del testo e, quando non c'è posto, va sotto centrato (a destra a 390 px, sotto a 320 px).

Deliverables:
- `src/components/workout/SessionSummary.svelte`: markup e stili dell'invito.

Limiti noti: nessuno. Viste con Playwright a 390×844 (scuro) e 320×568 (chiaro, anche con lo user agent di iPhone).

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-016

Date: 2026-11-07

Summary:
**Il dettaglio di un allenamento concluso diventa un registro di sola lettura.** `/session?id=…` non usa più
`Workout.svelte` in modalità `detail` ma un componente suo, `SessionLog`: solo gli esercizi con almeno una serie
fatta, nell'ordine in cui sono stati fatti, e sotto il nome una riga con le serie fatte («3 serie · 8 × 12 · …»,
riscaldamento con la sigla R). Spariscono maniglie, trascinamento, spunte, campi, «Aggiungi esercizio», «Nome e
data» e il menu ⋯, che lascia il posto all'icona dei progressi verso la pagina dell'esercizio. Restano ⓘ, «Riapri
allenamento» (la via per correggere) ed «Elimina allenamento» con conferma e «Annulla».

Deliverables:
- `src/components/history/SessionLog.svelte` (nuovo); `src/pages/session.astro` lo usa.
- `src/components/workout/Workout.svelte`: tolta la modalità `detail` (worker Hermes, diff riletto).
- e2e: `us-27-us-29-history.spec.ts` («US-27 il dettaglio è un registro di sola lettura delle serie fatte» al posto
  della correzione in pagina); `us-40-exercise-rest.spec.ts` senza il test del menu nella sessione conclusa.
- Documenti: brief `route-history`, `docs/ARCHITECTURE.md`.

Limiti noti: nome e data di un allenamento concluso si cambiano solo riaprendolo, e «Termina» ne riscrive l'ora di
fine. Le note sul carico compaiono come riga «Nota: «…»»; la variante («al posto di») non è più mostrata. Visto sul
telefono con i dati veri (copiati nell'origine locale e poi ripristinati) e con Playwright a 390×844 e 320×568.

ADR: nessuna (meccanico: il comportamento è quello chiesto da Francesco). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-015

Date: 2026-11-06

Summary:
**Allenamento in palestra, incremento 5: tab «Progressi» e chiusura della feature `workout-gym-ux`.** Quinta
voce della tab bar, ultima a destra, con l'icona `chart-line`: la pagina `/progress/` elenca gli esercizi fatti
(ultima volta, quanti allenamenti), ciascuno verso la sua pagina, che ora sta sotto la tab Progressi con il ritorno
«‹ Progressi» (salvo `from=workout`, che torna all'allenamento). Lo Storico tiene solo gli allenamenti: sparisce
l'interruttore Allenamenti / Esercizi. Le misure del corpo andranno in questa tab con una feature a sé.

Deliverables:
- `src/pages/progress.astro` e `src/components/history/ProgressPage.svelte` (nuovi).
- `src/components/ui/TabBar.astro`: cinque voci, Progressi attiva con il tratto più spesso.
- `src/components/history/HistoryPage.svelte` senza la vista Esercizi; `src/pages/exercise.astro` e
  `ExerciseProgress.svelte` sotto la tab Progressi.
- e2e: `smoke.spec.ts` (cinque sezioni), `us-34-info.spec.ts` (cinque voci, «?» anche su Progressi), `us-27-us-29-history.spec.ts` (US-28 dalla tab Progressi, stato vuoto).
- Documenti: `DESIGN.md` (tab bar), brief `route` e `route-history`, US-28, `docs/ARCHITECTURE.md`,
  `docs/PROJECT.md` (stato, focus, direzione: misure del corpo); SPEC archiviata in
  `docs/archive/features/INC-015_workout-gym-ux.md`, cartella `features/workout-gym-ux/` cancellata.

Limiti noti: l'elenco dei Progressi è quello che mostrava Storico → Esercizi, senza record né tendenza per riga.
`/history/?view=exercises` non porta più alla lista (resta lo Storico). Viste con Playwright a 390×844 e 320×568
nei due temi; il telefono non era collegato.

ADR: nessuna (meccanico: la scelta della tab è di Francesco nella SPEC). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-014

Date: 2026-11-06

Summary:
**Allenamento in palestra, incremento 4: suono a tre campane e allenamento dimenticato (feature
`workout-gym-ux`, US-41).** Il recupero finisce con tre note brevi a campana, ascendenti (Do6, Mi6, Sol6:
sinusoide con un'armonica all'ottava, attacco morbido, coda di ~0,8 s, compressore prima dell'uscita) al posto dei
tre bip a onda quadra. Un allenamento in corso la cui ultima serie spuntata, o l'inizio, è di più di 3 ore fa è
«dimenticato»: aprendo l'allenamento o Oggi un foglio «Allenamento ancora aperto» dice l'ora e propone «Termina
alle 17:42» (conclude a quell'ora e mostra il riepilogo) o, senza serie fatte, «Annulla allenamento» con «Annulla»
nell'avviso; «Continua» non lo ripropone nella stessa visita.

Deliverables:
- `src/lib/rest-alert.ts`: `playEndSound` a tre campane con `PeriodicWave` e `DynamicsCompressorNode`.
- `src/lib/archive/sessions.ts`: `FORGOTTEN_AFTER`, `forgottenSession`.
- `src/components/workout/ForgottenSheet.svelte` (nuovo, anche in `/kit`), usato da `Workout.svelte` e
  `src/components/today/Today.svelte` (l'avviso di Oggi ora ha l'azione «Annulla»).
- Test: `sessions.test.ts` (US-41); e2e `us-41-forgotten-workout.spec.ts` (orologio controllato) e il finto
  `AudioContext` di `us-21-us-26-rest-timer.spec.ts`.
- Documenti: US-41 in `docs/archive/restyling/USER-STORIES.md`, brief `route-workout`, `docs/ARCHITECTURE.md`, SPEC.

Limiti noti: «Riapri» su un allenamento di giorni prima lo rende subito «dimenticato» e il foglio compare (come
vuole la regola delle 3 ore; `us-27-us-29-history.spec.ts` lo chiude con «Continua»). Il suono nuovo non è stato ascoltato sul telefono (non collegato) né provato in palestra; la sinusoide
pura il 12 ottobre si sentiva poco, quindi resta da provare lì. Viste del foglio con Playwright a 390×844 e 320×568
nei due temi.

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0). Al primo giro `us-37` su desktop è caduto una volta in `clock.pauseAt` («Cannot fast-forward to the past», orologio finto sotto carico), verde al secondo.

## INC-013

Date: 2026-11-06

Summary:
**Allenamento in palestra, incremento 3: segnaposto al posto dei valori veri (feature `workout-gym-ux`,
ADR-008, rovescia la scelta di INC-004).** Un esercizio che entra in sessione (avvio da scheda, aggiunta, variante)
ha le serie vuote: l'ultima volta è il segnaposto, in grigio, e i valori scritti sono a colore pieno. Senza storico
il segnaposto è il target della scheda (ripetizioni come numero o limite basso di «6–8», kg dal carico minimo ma
non su una variante, niente sul riscaldamento); non più il peso della serie sopra. La spunta e «Completa
esercizio» scrivono il segnaposto nei campi vuoti; senza ripetizioni né segnaposto la serie resta da fare e il
cursore va sempre al campo Rip. «Aggiungi serie» resta com'è. Le sessioni già in corso non cambiano.

Deliverables:
- `src/lib/archive/workout.ts`: `plannedReps`, `placeholderSets`; `completeExercise` con il segnaposto; via
  `defaultSets`, `prefillSets`, `suggestedSets`; `addSessionExercise` e `switchExercise` con serie vuote.
- `src/lib/archive/sessions.ts`: `startSession` con serie vuote.
- `src/lib/rest-timer.ts`: `nextSetText` con la fonte del segnaposto (le ripetizioni della scheda restano «6–8»).
- `src/components/workout/WorkoutExercise.svelte`, `src/components/ui/SetRow.svelte`,
  `src/components/kit/KitSetRows.svelte`: segnaposto da `placeholderSets`, il focus va solo a Rip.
- Test: `workout.test.ts` (segnaposto, ✓✓ con il segnaposto); e2e `us-35-us-36-catalog-defaults.spec.ts` (US-36
  riscritta), `us-37-complete-exercise.spec.ts`, `us-39-select-cell.spec.ts`, `us-12-us-20-workout.spec.ts`.
- Documenti: US-36 e US-37 in `docs/archive/restyling/USER-STORIES.md`, ADR-008, brief `route-workout`,
  `docs/ARCHITECTURE.md`, SPEC.

Limiti noti: togliere una spunta, o «Annulla» dopo ✓✓, lascia nei campi i valori che la spunta aveva scritto dal
segnaposto (come già per la riga singola). Viste con Playwright a 390×844 e 320×568 nei due temi; il telefono non
era collegato.

ADR: ADR-008. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-012

Date: 2026-11-06

Summary:
**Allenamento in palestra, incremento 2: card a fisarmonica e riordino solo trascinando (feature
`workout-gym-ux`, ADR-007).** All'avvio tutti gli esercizi sono aperti; ognuno si apre e si chiude toccando la
sua intestazione (il nome è il pulsante, con `aria-expanded`), ⓘ apre l'approfondimento, e chiuso mostra il
riassunto di oggi. Sparisce «Mostra/Nascondi serie». «Completa esercizio» riuscito chiude l'esercizio e porta in
vista il successivo con serie da fare, aperto, con il focus sul suo nome; «Annulla» lo riapre. Via la modalità
«Riordina» e le frecce, nell'allenamento e nell'editor della scheda: trascinando, a sinistra resta la maniglia e il
numero d'ordine passa a destra; senza gesto, «Sposta su/giù» nel menu ⋯ e nella voce aperta della scheda.

Deliverables:
- `src/components/workout/Workout.svelte`: stato di apertura per esercizio, `moveOn` dopo ✓✓, righe del
  trascinamento con il numero a destra, niente «Riordina esercizi» né frecce.
- `src/components/workout/WorkoutExercise.svelte`: nome come pulsante della fisarmonica, ⓘ a sé, riassunto da
  chiuso anche per un esercizio non finito.
- `src/components/routines/RoutineEditor.svelte` ed `EntryEditor.svelte`: niente «Riordina», «Sposta su/giù»
  nella voce aperta.
- e2e: `us-40-exercise-rest.spec.ts` (fisarmonica), `us-37-complete-exercise.spec.ts` (✓✓ che passa al
  successivo), `us-38-drag-reorder.spec.ts` (righe del trascinamento), `us-07-us-10-routines.spec.ts`,
  `us-12-us-20-workout.spec.ts`, `us-27-us-29-history.spec.ts` adeguati.
- Documenti: `DESIGN.md` (testa dell'esercizio, aperto e chiuso, riordino nell'editor), brief `route-workout` e
  `route-routines`, ADR-007, SPEC aggiornata.

Limiti noti: con un nome su due righe ⓘ sta a destra del nome, all'altezza dell'ultima riga, non subito dopo
l'ultima parola. Viste fatte con Playwright a 390×844 e 320×568 nei due temi; sul telefono no, era bloccato.

ADR: ADR-007. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-011

Date: 2026-11-06

Summary:
**Allenamento in palestra, incremento 1: correzioni (feature `workout-gym-ux`, ADR-006).** «Precedente» abbina
solo le serie spuntate l'ultima volta, così una serie saltata non sfasa le altre. L'intestazione «Superserie»
ha maniglia e catena in colonna con maniglia e nome degli esercizi sotto, nell'allenamento e nell'editor. I
fogli aperti dal menu ⋯ (Recupero, Come si esegue, Cambia esercizio) hanno «Torna al menu»; «Progressi» dal
menu torna all'allenamento («‹ Allenamento», `?from=workout`). All'apertura il focus va al titolo del foglio e
alla finestra del timer, non a ✕ né a «Riduci». Il pulsante distruttivo è pieno su un rosso a sé,
`danger-fill` (`#C81E1E` / `#DF3124`), con il bianco sopra nei due temi. La settimana tipo del Calendario ha una
riga-pulsante per giorno che apre il foglio della scelta al posto del `select` nativo.

Deliverables:
- `src/lib/archive/workout.ts`: `previousSets` solo dalle serie spuntate (con test in `workout.test.ts`).
- `src/components/ui/BottomSheet.svelte`: prop `onback` («Torna al menu»), focus iniziale sul titolo;
  `VariantSheet` e `ExerciseDetailsSheet` la passano; `Workout.svelte` riapre il menu dello stesso esercizio
  (da ⓘ «Come si esegue» resta senza ritorno); `RestTimer.svelte` mette il focus sulla finestra.
- `src/components/history/ExerciseProgress.svelte`: ritorno «‹ Allenamento» con `from=workout`.
- `src/styles/global.css`: `--color-danger-fill`, `--color-on-danger` bianco, `.btn-danger` e hover scurito;
  coppie nuove in `src/styles/contrast.test.ts`; campione in `/kit`, `onback` nel foglio di `/kit`.
- `src/components/calendar/Calendar.svelte`: righe della settimana tipo e foglio «Ogni lunedì»; il link
  «Assegna le schede ai giorni» porta il focus alla prima riga.
- Superserie allineata: `Workout.svelte`, `RoutineEditor.svelte` (solo CSS).
- e2e: `us-04-us-06-calendar.spec.ts` (righe e foglio della settimana tipo), `us-40-exercise-rest.spec.ts`
  (ritorno al menu, focus, «‹ Allenamento»).
- Documenti: `DESIGN.md` (token, pulsante distruttivo, foglio, settimana tipo), ADR-006, SPEC aggiornata.

Limiti noti: il «Ogni martedì» dentro il foglio del giorno resta un `select` nativo (fuori ambito). Viste fatte
con Playwright a 390×844 e 320×568 nei due temi; sul telefono no, era bloccato (schermo spento).

ADR: ADR-006. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-010

Date: 2026-11-06

Summary:
**Palette a ruoli: inchiostro e carta, un accento vermiglio, rosso solo per gli errori e indaco per i record
(feature `palette`, ADR-005).** Il verde del PoC non c'è più: fondo carta `#FAFAF7` o grafite `#1C1C1E`, card
bianche o `#2A2A2D`, bordi grigi chiari, bordi dei controlli `#6B6B70` / `#A1A1AA`. L'accento vermiglio
(`#E85A2A` / `#FF7A45`, testo nero sopra) marca solo ciò che chiede azione o è in corso; `danger` (`#BE123C` /
`#FF7A8A`) vale solo per errori e distruttive, sempre con icona e testo, e il pulsante distruttivo è pieno;
`highlight` indaco marca i trofei dei record. Il guscio (intestazione, barre, tab bar, timer, avviso) segue il
tema su `surface`; la tab attiva è in `text` con icona piena e indicatore di 2px. La serie fatta non ha fondo:
lo dice la spunta piena `done`. Gli avvisi ex ambra sono neutri con l'icona `info`. `theme-color` con due meta
sul `bg` di ciascun tema, barra di stato iOS `default` nel chiaro.

Deliverables:
- `src/styles/global.css`: ruoli in `@theme` (eliminati `field`, `warning-*`, `danger-bg`, i 13 `shell-*`,
  `level`); `.shell` su `surface`; `btn-danger` pieno con `on-danger`; disabilitato `text-muted` su `surface`.
- `src/styles/contrast.test.ts` (nuovo): coppie di testo ≥ 4,5:1, bordi e indicatori ≥ 3:1, nessun colore fuori
  dai token, `THEME_COLORS` uguale ai `bg`.
- `src/lib/theme.ts` e `theme.test.ts`: `THEME_COLORS`, `syncThemeMeta` (theme-color e barra di stato) anche
  nello script inline; `src/layouts/Base.astro` con i due meta per `media`; manifest `#1C1C1E`.
- Componenti (~45 file in `src/components/`, `src/pages/`): solo ruoli; icone su errori e distruttive (`Trash`
  su ogni `btn-danger`); `/kit` con i campioni `on-danger` e `highlight`.
- e2e: `tests/e2e/us-30-themes.spec.ts` con i fondi nuovi e il guscio su `surface` nei due temi.
- Documenti: `DESIGN.md` (front-matter dei colori e dei componenti, sezioni colore, guscio, componenti);
  `PRODUCT.md` e i brief in `.impeccable/surfaces/` (solo le frasi sul colore); ADR-005; `docs/PROJECT.md`;
  voce spuntata in `docs/todo.md`; SPEC in `docs/archive/features/INC-010_palette.md`, cartella cancellata.

Limiti noti: `.impeccable/design.json` (il sidecar di Impeccable) descrive ancora il guscio verde: va
rigenerato con `/impeccable document`. Eccezioni motivate al «solo token»: `src/lib/theme.ts` (copia dei due
`bg`, verificata dal test) e `public/favicon.svg` (immagine). In una serie completata `SetInput` resta senza
bordo: è testo letto, non un campo da compilare (da confermare con Francesco).

ADR: ADR-005. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-009

Date: 2026-11-06

Summary:
**Card dell'esercizio sfoltita e recupero dal menu (US-40), feature `exercise-card-layout` in un incremento.**
In `/workout` la testa della card ha solo maniglia, nome e ⋯: tolti il numero («1», «2a»), la riga
dell'obiettivo della scheda («3 × 8–12 · … · rec. 1:30») e il pulsante «Cambia esercizio» nel corpo (resta nel
menu). «Distensioni manubri panca inclinata» sta in due righe anche a 320 px. L'esercizio corrente ha il bordo
accento sul pannello al posto della pastiglia sul numero. «Completa esercizio» passa nella riga delle
intestazioni, sopra le spunte, in accento. Il «—» senza precedente è centrato. Nuova voce «Recupero · 1:30» nel
menu ⋯ (non sulla sessione conclusa): foglio con lo `Stepper` da 0 a 60 minuti a passi di 15 s, salvato a ogni
passo nella sessione e, se l'esercizio viene da una scheda, nella sua voce.

Deliverables:
- `src/lib/archive/workout.ts`: `setExerciseRest` (sessione più voce della scheda via `plannedEntry` e
  `updateEntry`, limiti validati), con i Vitest in `workout.test.ts`.
- `src/components/workout/WorkoutExercise.svelte`: testa a tre colonne, maniglia senza numero con il bersaglio
  nell'imbottitura, «Completa» nell'intestazione delle righe allineata alle colonne di `SetRow`; tolte le prop
  `label` e `onvariant`.
- `src/components/workout/Workout.svelte`: voce e foglio del recupero, classe `current` sul blocco con la serie
  da fare adesso (`box-shadow` inset di 2px in `accent-text`).
- `src/components/ui/SetRow.svelte`: «—» centrato.
- e2e: nuovo `tests/e2e/us-40-exercise-rest.spec.ts`; `us-12-us-20-workout.spec.ts` cambia esercizio dal menu
  ⋯ (anche la vecchia «Cambia variante») e verifica che l'obiettivo della scheda non compaia.
- Documenti: US-40 in `docs/archive/restyling/USER-STORIES.md`; `.impeccable/surfaces/route-workout.md`
  (gerarchia, maniglia, posto di «Completa», esercizio corrente); `DESIGN.md` (testa dell'esercizio, «Adesso»);
  `docs/PROJECT.md`; SPEC in `docs/archive/features/INC-009_exercise-card-layout.md`, cartella cancellata.

Limiti noti: in superserie il bordo accento è sul pannello del gruppo e non dice più quale tra 2a e 2b viene
adesso (la pastiglia lo diceva); a 320 px i nomi da 42 caratteri della Scheda A («Rematore manubri, petto su
panca inclinata», «Distensioni manubri seduto, schienale alto») vanno su tre righe, senza troncare; con una
variante il recupero cambia la voce del posto previsto (SPEC §8).

ADR: nessuna (scelte di prodotto prese da Francesco, scritte nella SPEC). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-008

Date: 2026-11-05

Summary:
**Nuova icona dal bilanciere a pennello, incremento 5 e chiusura di `dedup-catalog-and-workout-ux`.**
L'icona non è più il manubrio identico a quello di Strong: è il bilanciere dell'illustrazione a pennello del sito
(variante A scelta da Francesco), tratto carta su grigio molto scuro, nelle icone della PWA, nel favicon e
nell'icona iOS. La schermata di avvio della PWA installata non è più verde. Fatte anche le prove sul telefono
rimaste aperte: trascinamento (INC-006) e selezione della cella (INC-007) funzionano su Android.

Deliverables:
- `scripts/icon-source/barbell.svg` e `barbell-bold.svg` (sorgente vettoriale, la seconda per 16–48 px),
  `scripts/make-icons.mjs` riscritto, rigenerati `public/icons/*` e `public/favicon.svg`.
- `src/pages/manifest.webmanifest.ts`: `background_color` e `theme_color` `#1C1C1E`.
- ADR-004; `docs/ARCHITECTURE.md`; `docs/PROJECT.md` (feature chiusa, palette nella direzione); `docs/todo.md`
  (punti chiusi spuntati, punto della palette sostituito come concordato).
- SPEC archiviata in `docs/archive/features/INC-008_dedup-catalog-and-workout-ux.md`, cartella della feature
  cancellata (con lo strumento delle varianti, `icon-variants.cjs`).

Limiti noti: il `<meta name="theme-color">` resta `#142321` (token `shell`, cambia con la palette); iOS non
provato (nessun iPhone); MIUI mette la PWA appena installata nell'ultima pagina del launcher, quindi lo
screenshot `screenshots/4-icona-dopo.png` non la mostra accanto a Strong.

ADR: ADR-004. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-007

Date: 2026-11-05

Summary:
**Selezione automatica della cella (US-39), incremento 4 di `dedup-catalog-and-workout-ux`.**
Toccando kg o ripetizioni di una serie il contenuto è tutto selezionato: scrivere sostituisce il valore
precompilato senza cancellarlo prima. Vale da tocco, mouse e tastiera (anche con Invio da kg a ripetizioni), e
nell'editor della scheda per carico, «Fino a» e ripetizioni; un secondo tocco nel campo già attivo mette il
cursore dove si tocca. Tastiera numerica e virgola decimale come prima; niente ± né selettore a ruota.

Deliverables:
- `src/lib/select-on-focus.ts`: azione `use:selectOnFocus` (selezione al focus, ripetuta al fotogramma dopo
  perché su Android e iOS il tocco la annulla, primo `mouseup` scartato).
- `src/components/ui/SetInput.svelte` (sempre), `src/components/ui/LiveField.svelte` (prop `selectall`), usata
  in `EntryEditor.svelte` e nella demo di `/kit` (`KitControls.svelte`).
- e2e `tests/e2e/us-39-select-cell.spec.ts` (clic, tastiera, secondo tocco, tocco vero via CDP, editor della
  scheda e nome non selezionato).
- `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, brief `route-workout.md`, SPEC (esito), registro delle storie (US-39).

Limiti noti: **la prova sul telefono non è stata fatta** (nessun dispositivo collegato via adb): il tocco è
provato via CDP (`Input.dispatchTouchEvent`) nel Chromium dei test, non su iOS.

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-006

Date: 2026-11-05

Summary:
**Riordino con il trascinamento (US-38), incremento 3 di `dedup-catalog-and-workout-ux`.**
Il numero di ogni esercizio, nell'allenamento e nell'editor della scheda, è una maniglia (icona a sei punti
sotto il numero). Premuta e trascinata, la lista passa alle righe del riordino, la pagina scorre finché la riga
è sotto il dito, le altre fanno posto e ai bordi la pagina scorre da sola; l'ordine si salva al rilascio,
`Esc` annulla. In una superserie la maniglia di una voce la sposta solo dentro il gruppo, quella
sull'intestazione «Superserie» sposta il gruppo intero; nessun gruppo cambia. Con il focus sulla maniglia Su e
Giù spostano di un posto e lo annunciano («{nome}: posizione 3 di 7.»). Nel foglio ⋯ della sessione ci sono
«Sposta su» e «Sposta giù»; restano le frecce di «Riordina». Nessuna libreria (ADR-003).

Deliverables:
- `src/lib/archive/routine-edit.ts`: `reorderUnit`, `moveToIndex`, `moveEntryTo`; `src/lib/archive/workout.ts`:
  `moveSessionExerciseTo`.
- `src/lib/reorder.ts`: `dropIndex`, `shiftFor`, `edgeSpeed`, `unitStyle` e il gesto `startDrag`;
  `src/components/ui/ReorderHandle.svelte`, mostrata in `/kit` (`KitReorder.svelte`).
- `Workout.svelte`, `WorkoutExercise.svelte` (maniglia sul numero), `RoutineEditor.svelte`, `EntryEditor.svelte`
  (maniglia accanto al pulsante che apre la voce, non dentro).
- Test Vitest `src/lib/reorder.test.ts`, `routine-edit.test.ts` (`moveToIndex`: singoli, gruppo intero, dentro
  il gruppo, bordi, id sconosciuto, 100 voci), `workout.test.ts` (serie fatte intatte, `plannedEntry` con lo
  stesso esercizio due volte, `nextSet` dopo il riordino); e2e `tests/e2e/us-38-drag-reorder.spec.ts` (mouse,
  `Esc`, tastiera, superserie, foglio ⋯, editor della scheda).
- `docs/adr/ADR-003-trascinamento-senza-libreria.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT.md` (tolto il limite
  «solo con le frecce»), brief `route-workout.md` e `route-routines.md`, SPEC (esito), registro delle storie (US-38).

Limiti noti: **la prova sul telefono non è stata fatta** (nessun dispositivo collegato via adb): il gesto è
provato con tocchi veri via CDP a 390×844 e 320×568. Con lo stesso esercizio due volte nella scheda, il target
segue la posizione (k-esima voce), anche dopo il riordino. Lo spazio che si apre durante il gesto ha l'altezza
della riga trascinata.

ADR: ADR-003. Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-005

Date: 2026-11-05

Summary:
**Completa esercizio in un tocco (US-37), incremento 2 di `dedup-catalog-and-workout-ux`.**
Nell'intestazione di ogni esercizio non ancora fatto, accanto a ⋯, la doppia spunta «Completa {nome}» spunta
in un colpo tutte le serie con le ripetizioni (il peso può mancare, corpo libero), con lo stesso istante. Le
serie senza ripetizioni restano da fare: la riga diventa ambra e sotto le righe compare «Mancano le
ripetizioni: serie N» (annunciato), finché non si modificano o si spuntano; nessun valore inventato. Parte un
solo recupero, dall'ultima serie spuntata, già ridotto nella barra: il timer a tutto schermo è un dialogo
modale e coprirebbe l'avviso con «Annulla» e le righe evidenziate. «Annulla» toglie la spunta solo alle serie
di quel tocco (non a una rispuntata a mano nel frattempo) e ferma il recupero. Senza serie completabili
l'avviso dice «nessuna serie con ripetizioni».

Deliverables:
- `src/lib/archive/workout.ts`: `completeExercise`, `undoCompleteExercise`.
- `src/components/workout/WorkoutExercise.svelte`: pulsante nell'intestazione, righe evidenziate e messaggio
  `role="status"`; target e note sotto il titolo prendono tutta la larghezza (a 320px non vanno a capo per il
  pulsante in più). `src/components/ui/SetRow.svelte`: stato `flagged`, mostrato in `/kit`
  (`KitSetRows.svelte`).
- `src/components/workout/Workout.svelte`: recupero, avviso e «Annulla»; `src/lib/rest-timer.svelte.ts`:
  `afterCheck(…, minimized)`.
- Test Vitest in `workout.test.ts` (parziale, nessuna serie valida, tutto già fatto, stesso `completedAt`, kg
  nullo, annulla anche dopo una modifica, fixture: leg press del 26 ottobre); e2e
  `tests/e2e/us-37-complete-exercise.spec.ts`.
- `docs/ARCHITECTURE.md`, brief `.impeccable/surfaces/route-workout.md`, SPEC (esito), registro delle storie
  `docs/archive/restyling/USER-STORIES.md` (US-35, US-36, US-37).

Limiti noti: dopo «Completa» il recupero non si apre a tutto schermo; il timer grande si apre dalla barra.
Un esercizio senza storico ha le righe vuote: il pulsante dice soltanto che mancano le ripetizioni.

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-004

Date: 2026-11-05

Summary:
**Catalogo senza doppioni e serie precompilate dall'ultima volta (US-35, US-36), incremento 1 di
`dedup-catalog-and-workout-ux`.**
Ogni esercizio di base ha i suoi alias (nome inglese e varianti italiane): la ricerca li trova, e un nome
scritto che corrisponde a un alias usa l'esercizio esistente invece di crearne uno nuovo («Esiste già «…»:
usa questo»). Un esercizio personalizzato si unisce a un altro dal foglio del catalogo, con una conferma che
dice quanti allenamenti e schede cambiano; l'unione non si annulla. Un esercizio che entra in sessione ha già
kg e ripetizioni dell'ultima volta in cui è stato fatto davvero, da spuntare: contano solo le serie spuntate,
per il precedente, lo storico, i record e per concludere l'allenamento.

Deliverables:
- `src/data/catalog.ts` e `src/lib/archive/types.ts`: campo `aliases` dei 43 esercizi di base (Appendice A
  della SPEC, senza collisioni).
- `src/lib/archive/catalog.ts`: ricerca su nome e alias, `mergeExercise`, `mergeImpact`.
- `src/lib/archive/workout.ts`: `previousExercise` e `previousSets` solo su serie spuntate, `defaultSets`,
  `prefillSets`, usati da `addSessionExercise` e `switchExercise`; `src/lib/archive/sessions.ts`:
  `startSession` precompila, `sessionHasData` (concludere, annullare) vuole una serie spuntata.
- `src/components/exercises/ExercisePicker.svelte`: «Esiste già», «Unisci in…» con `ConfirmDialog`, collegato
  in `Workout.svelte` e `RoutineEditor.svelte` e mostrato in `/kit`; `Workout.svelte`: testo del cambio di
  esercizio con valori ripresi; `ExerciseDetailsSheet.svelte`: «L'ultima volta» solo con serie spuntate.
- Fixture `tests/fixtures/workout-tracker-2026-11-05.json`; test Vitest in `catalog.test.ts` e
  `workout.test.ts`; e2e `tests/e2e/us-35-us-36-catalog-defaults.spec.ts`; aggiornati 5 e2e che davano per
  scontati i campi vuoti o un allenamento concluso senza spunte.
- `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, `features/dedup-catalog-and-workout-ux/SPEC.md` (esito),
  brief `.impeccable/surfaces/route-workout.md`.

Limiti noti: un backup vecchio importato dopo un'unione riporta i doppioni (non risolto). Il peso della serie
sopra (step 9) vale solo per le righe vuote, cioè per gli esercizi senza storico. Restano i quasi-doppioni del
catalogo di base («Rematore al cavo basso» e «Rematore seduto al cavo basso», «Leg press» e «Leg press, piedi a
metà pedana»): gli ID di base non si uniscono.

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-003

Date: 2026-10-19

Summary:
**Pagina Info con i contatti, ingranaggio per le Impostazioni, autore del repo.**
Una pagina statica `/info/` dice cos'è il progetto, dove restano i dati (cosa li cancella, come installare
l'app su iOS e Android, invito al backup) e chi l'ha fatto, con email e LinkedIn. Si apre dalla «?»
nell'intestazione, accanto all'ingranaggio che sostituisce gli slider; la tab bar non cambia. La
persistenza dello storage era già chiesta (`askPersistenceOnce`): nessuna modifica.

Deliverables:
- `src/pages/info.astro` (nuova, senza isole); mailto con solo l'oggetto «Workout Tracker», avvolto in
  `<!--email_off-->` perché Cloudflare non lo riscriva.
- `src/components/ui/AppHeader.astro`: icona `settings` al posto di `sliders-horizontal`, link «Informazioni»
  (`circle-question-mark`) con la prop `showInfo`, passata da `src/layouts/AppLayout.astro`.
- `src/layouts/Base.astro`: `<meta name="author">`; `package.json`: `author` e `homepage`; `README.md`: sezione «Autore».
- `tests/e2e/us-34-info.spec.ts` (nuovo) e `/info/` nello smoke.
- `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PROJECT.md` aggiornati; SPEC chiusa in
  `docs/archive/features/INC-003_info-page.md`.

ADR: nessuna (meccanico). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-002

Date: 2026-10-13

Summary:
**Pagine indicizzabili e decisioni dello step 9 chiuse.**
Le pagine non sono più `noindex`: il progetto deve essere trovabile anche dai motori di ricerca. Il canonico
punta al dominio, così la copia su `workers.dev` non risulta un duplicato. Le quattro decisioni aperte dello
step 9 sono chiuse come raccomandato.

Deliverables:
- `src/layouts/Base.astro`: tolto `<meta name="robots" content="noindex, nofollow">`, aggiunto
  `<link rel="canonical">` da `site`; commento di `src/pages/_kit.astro` allineato.
- `tests/e2e/smoke.spec.ts`: ogni pagina non ha il meta `robots` e ha il canonico.
- `docs/PROJECT.md`: decisioni aperte chiuse (variante con il suo numero, nome accessibile del calendario tenuto,
  niente push durante un allenamento tra i limiti, proposte della critique nella direzione); tolto il limite `noindex`.
- `PRODUCT.md`, `docs/ARCHITECTURE.md` aggiornati.

ADR: ADR-002 (Accepted). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-001

Date: 2026-10-13

Summary:
**Adozione di ai-governance v6 e chiusura del rilascio.**
Il repository adotta `ai-governance-template` v6: `AGENTS.md` torna un file operativo sotto le 120 righe, il
resto va in documenti letti solo quando servono, e c'è un controllo dei percorsi nei documenti. Registra anche
i passi del rilascio fatti da Francesco: backup spostato sul dominio, voce nei Projects di personal-website,
Workers Builds collegato (ogni push su `main` va online).

Deliverables:
- `AGENTS.md` riscritto sul modello del §8 (deviazioni, nove regole, livelli, invarianti, completamento).
- Nuovi `docs/ARCHITECTURE.md` (sezioni spostate da `AGENTS.md`), `docs/SVILUPPO.md` (comandi, note sui test,
  insidie dell'handoff dello step 9), `docs/PROJECT.md` (stato, focus, decisioni aperte, limiti), `docs/todo.md`.
- `docs/restyling/` → `docs/archive/restyling/`; riferimenti aggiornati in `README.md`, `PRODUCT.md` e nei
  commenti di `src/lib/rest-notifier.ts`, `src/lib/archive/types.ts`, `public/sw-push.js`.
- `scripts/docs-check.sh` (copia del template) e `npm run docs:check`; corretti i percorsi d'esempio in
  `README.md`, `DESIGN.md` e `docs/SVILUPPO.md` che il controllo segnalava.
- Pubblicazione aggiornata in `README.md`, `PRODUCT.md`, `docs/ARCHITECTURE.md`: niente più deploy a mano.

ADR: ADR-001 (Accepted). Gate: (`npm run docs:check` — exit 0; nessun codice vivo toccato, solo commenti: niente build né test).
