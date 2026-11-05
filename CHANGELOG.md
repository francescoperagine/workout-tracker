# Changelog

Incrementi, dal più recente. Prima di INC-001: il restyling, step 0–9, in `docs/archive/restyling/PIANO.md`
e nella cronologia git.

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
