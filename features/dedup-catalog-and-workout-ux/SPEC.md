# SPEC — dedup-catalog-and-workout-ux

**Livello:** Feature · **Stato:** incrementi 1 (INC-004) e 2 (INC-005) fatti, poi 3–5 · **Base:** `main` a `c28692e` (INC-003)
**Data del piano:** 5 novembre 2026 · **Origine:** `docs/todo.md` punti 1–4 + sessione con Francesco

Chi ragiona ha scritto questa SPEC; una sessione nuova la esegue con `HANDOFF.md`. Le letture di codice qui
sotto sono verificate al 5 novembre 2026; dove scrivo **da verificare** l'esecutore controlla con un comando
prima di modificare.

## 1. Obiettivo

1. Il catalogo è un insieme: un esercizio esiste una volta sola, e i default delle serie vengono dall'ultima
   volta che quell'esercizio è stato fatto davvero.
2. Un pulsante per completare un esercizio in un tocco.
3. Riordino degli esercizi con il trascinamento.
4. Selezione automatica del contenuto delle celle kg/reps al tocco.
5. Nuova icona dall'illustrazione a pennello, in bianco e nero.

## 2. Decisioni già prese (Francesco, 5 novembre 2026)

- **Valori veri, non segnaposto:** kg e reps precompilati sono scritti nei campi della sessione (con
  `completedAt: null`) quando l'esercizio entra in sessione.
- **Alias:** lista `aliases` per ogni esercizio del `BASE_CATALOG` (nome inglese incluso, varianti italiane),
  nel codice. **Nessun campo nuovo sui custom**: l'unione custom-con-custom perde il nome assorbito, accettato.
- **Completa esercizio:** valido con le sole reps (kg può mancare, es. corpo libero).
- **Superserie:** la regola dell’incremento 3 è approvata. Nelle sue schede nessun esercizio è in superserie: non
  spendere lavoro sulla loro interfaccia oltre al comportamento corretto.
- **Celle numeriche:** solo selezione automatica del contenuto al tocco. Niente pulsanti ± né ruota, niente
  scorrimento verticale sulla cella.
- **Stack:** resta Astro + Svelte (niente Flutter). Se servissero notifiche native, Capacitor, non ora.
- **Palette e icona:** bianco, nero e bordi grigi chiari. I colori accesi li definisce Francesco più avanti.
  `background_color` e `theme_color` del manifest passano dal verde a un grigio molto scuro. Il cambio del
  tema dell'app a bianco e nero **non** è in questa feature.
- **Chiusura Strong:** Francesco ha chiuso l'allenamento di prova sul telefono.

## 3. Vincoli

- Schema persistito invariato, `version: 2`, nessun campo nuovo in `Archive`, `Session`, `Routine`,
  `CustomExercise`. Solo riscritture di dati esistenti.
- ID del catalogo base (`POC_IDS`) mai cambiati né rimossi; nessuna mappatura cablata sugli ID di Francesco.
- Archivio solo tramite `src/lib/archive/`, funzioni pure che non mutano l'argomento, testo solo dal templating.
- UI solo con i token di `DESIGN.md` e i componenti base; prima di toccarla leggere `PRODUCT.md`, `DESIGN.md`,
  il brief in `.impeccable/surfaces/` e `.claude/skills/impeccable/reference/craft-floor.md`.
- Un componente nuovo va anche in `/kit`. Date in ora locale. Testi in italiano, codice in inglese.
- Dati sporchi del 2026-10-05 (set di altri esercizi negli slot, vedi `notes`): **non correggerli**.

## 4. Fixture e storie

- Copiare `workout-tracker-2026-11-05.json` (radice del repo, non tracciato; lasciarlo dov'è) in
  tests/fixtures/workout-tracker-2026-11-05.json: sola lettura, usata da Vitest e dagli e2e. Contiene dati
  reali di Francesco: committare è ok (repo suo), ma niente nei messaggi di commit oltre al nome del file.
- Nuove storie (l'ultima esistente è US-34, pagina Info di `c28692e`, registrata in
  `docs/archive/restyling/USER-STORIES.md`): **US-35** unione di
  esercizi duplicati, **US-36** default dall'ultima esecuzione, **US-37** completa esercizio, **US-38**
  riordino con trascinamento, **US-39** selezione automatica della cella. Ogni e2e comincia con l'ID.
  Le storie si scrivono in coda al CHANGELOG/alla SPEC di chiusura, non nel file archiviato.

## 5. Stato del codice (letto il 5 novembre 2026)

- `previousExercise` in `src/lib/archive/workout.ts` cerca per `exerciseId` (qualunque scheda, slot, `variantOf`)
  la sessione conclusa più recente con almeno un set con **un valore**; i valori oggi sono **segnaposto**
  (`suggestedSets`, `SetRow.svelte`), la spunta su riga vuota li conferma (`completedSet`).
- Il riordino con le frecce esiste in `Workout.svelte` (modalità `reordering`, `move`, `moveLabel`) e in
  `RoutineEditor.svelte`, con due copie separate dell'interfaccia. La regola delle superserie è in
  `routine-edit.ts` (`blocksOf`, `moveKind`, `moveInList`, `moveSessionExercise` in `workout.ts`).
- Creazione custom: `ensureExercise`/`findByName` in `catalog.ts` (confronto esatto su `nameKey`);
  `src/components/exercises/ExercisePicker.svelte` mostra «Crea «…»» se `findByName` non trova nulla.
- `BASE_CATALOG`: 43 esercizi in `src/data/catalog.ts`, tipo `CatalogExercise` in `types.ts`.
- Header della card: `WorkoutExercise.svelte` righe ~173–201: numero, titolo (pulsante dettagli), ⋯ a destra.
  Il foglio ⋯ in `Workout.svelte` (`option()`) ha note, dettagli, variante, rimuovi.
- Nella fixture, dopo l'unione di `custom-romanian-deadlift` in `stacco-rumeno-bilanciere`, il default viene
  dal 2026-11-04. Sulla panca il 2026-11-04 è presente ma vuota (3 set senza valori): il default viene dal
  2026-10-05. Il rematore al cavo basso aggiunto a mano il 2026-11-04 prende dal 2026-10-12.

---

## 6. Incrementi

Un commit per incremento, nell'ordine. Ciascuno: controlli mirati subito, gate completo a fine incremento,
voce di `CHANGELOG.md` con `INC-XXX` letto dalla testa (`grep -m1 '^## INC-' CHANGELOG.md`), mai a mano.

### Incremento 1 — Catalogo senza duplicati e default dall'ultima volta (US-35, US-36)

**1a. Alias**
- `CatalogExercise` (`types.ts`): campo `aliases: string[]`, riempito per tutti e 43 (anche `[]`). Tabella in
  Appendice A, chiavi per **nome** (l'esecutore ricava l'id dal nome nel file, non lo indovina).
- `catalog.ts`: `availableExercises` espone gli alias; `findByName` e `suggestExercises` confrontano `nameKey`
  su nome **e** alias; le chiavi si calcolano una volta (memo a livello di modulo per il `BASE_CATALOG`).
  `ensureExercise`: un nome che corrisponde a un alias restituisce l'esercizio esistente, `created: false`.
- Controllo eseguibile (test): nessuna chiave `nameKey` si ripete tra nomi e alias di esercizi diversi; nessun
  alias è vuoto o uguale al nome dello stesso esercizio.
- `src/components/exercises/ExercisePicker.svelte`: con una corrispondenza (anche su alias) «Crea «…»» sparisce e compare
  «Esiste già «X»: usa questo» (stessa azione di scelta). Nessun secondo dialogo.

**1b. Unione**
- `mergeExercise(archive, absorbedId, intoId): Archive` in `catalog.ts`, pura. Regole:
  - rifiuta `absorbedId === intoId`, un assorbito che non sia custom, un `intoId` inesistente;
  - il predefinito sopravvive sempre; tra due custom sceglie l'utente (`intoId`);
  - riscrive `exerciseId` e `variantOf` in **tutte** le sessioni (anche quella in corso) e `exerciseId` e
    `alternatives` in **tutte** le schede (anche archiviate);
  - se dopo la riscrittura `variantOf === exerciseId` → `variantOf = null`;
  - nelle alternative toglie doppioni e un'alternativa uguale all'esercizio principale della voce;
  - elimina l'assorbito da `archive.catalog`;
  - non tocca `notes`, date, set, né i dati sporchi del 2026-10-05.
- Funzione di sola lettura `mergeImpact(archive, absorbedId): { sessions: number; routines: number }` per il testo
  della conferma.
- Interfaccia: azione «Unisci in…» sugli esercizi personalizzati, nel punto dove si gestisce il catalogo
  (**da verificare** dove l'interfaccia mostra oggi i custom; se non c'è una schermata, il foglio
  dell'`ExercisePicker` con un menu per riga, altrimenti la riga stessa). Un foglio sceglie la destinazione
  (preselezionato il predefinito con lo stesso nome o alias, se c'è), poi `ConfirmDialog` che dice quante
  sessioni e schede cambiano e che **non si può annullare**. Niente «Annulla» nel Toast per questa azione.

**1c. Default dall'ultima volta**
- `previousExercise`: il criterio diventa «almeno un set con `completedAt !== null`»; resta l'esclusione della
  sessione corrente e delle sessioni non concluse. **Unica funzione di lookup**: nessun altro codice cerca
  nello storico per `exerciseId`.
- Nuova funzione pura `defaultSets(count, previous)`: il set `i` prende kg e reps del set `i` dell'ultima
  esecuzione, se ce ne sono meno ripete l'ultimo; mantiene la distinzione riscaldamento/lavoro già usata da
  `previousSets`. Senza storico restituisce set vuoti.
- Applicata quando un esercizio entra in sessione, scrivendo `kg` e `reps` con `completedAt: null`:
  `startSession` (slot della scheda, set = numero del piano), `addSessionExercise` (esercizio a mano: numero e
  tipo di set dell'ultima volta, come oggi), `switchExercise` (set rimasti vuoti dell'esercizio nuovo, e voce
  aggiunta a metà esercizio). I kg sono quelli salvati (kg); la conversione lb resta solo in visualizzazione.
- La colonna «Precedente» in sola lettura resta (`SetRow.svelte`): mostra l'ultima esecuzione completata,
  indipendente dai valori precompilati.
- **Impatto da controllare e coprire con test** (da verificare con `grep`): una serie precompilata e **non
  spuntata** non deve contare come fatta in nessun posto. Verificare almeno `setHasValues`,
  `exerciseHasValues`, `finishSession` («almeno un esercizio e un valore»), `workoutSummary`,
  `loadRecords`, `exerciseHistory`/`personalRecords` in `progress.ts`, la rimozione di esercizi vuoti.
  Dove oggi basta «ha un valore», la regola diventa «ha un set spuntato» o resta com'è con un test che dimostri
  che i precompilati non finiscono nello storico né nei record. Se `finishSession` accetta oggi un allenamento
  con soli valori precompilati, deve richiedere almeno un set spuntato.
- `suggestedSets` (peso della serie sopra come segnaposto) resta solo per le righe **senza** valori (esercizi
  senza storico); non cancellarlo, non estenderlo.

**Casi limite**
- Storico con meno set del piano → ripete l'ultimo; con più set del piano → i set in più si ignorano.
- Sessione precedente con set di riscaldamento e di lavoro mescolati → per genere, come `previousSets`.
- Esercizio con più voci nella stessa sessione → ogni voce prende dalla sessione **precedente**, mai dalla stessa.
- Unione dove l'assorbito è l'unico esercizio di una scheda; compare due volte nella stessa sessione; è
  alternativa di sé stesso dopo la riscrittura; l'assorbito non esiste (id sconosciuto) → errore chiaro.
- Archivio dopo l'unione → deve passare `validateArchive`.
- Un backup vecchio importato dopo l'unione riporta i doppioni: non risolverlo, scriverlo nel CHANGELOG.

**Test (Vitest, fixture)**
- Unendo `custom-romanian-deadlift` in `stacco-rumeno-bilanciere`: `previousExercise` per
  `stacco-rumeno-bilanciere` dà la sessione 2026-11-04 e `defaultSets(4, …)` dà 20×15, 25×12, 30×10, 35×10.
- Unendo `custom-deadlift` in `custom-stacco-da-terra`: schede e sessioni riscritte, assorbito eliminato.
- 2026-11-04 `rematore-al-cavo-basso` aggiunto fuori scheda → default dal 2026-10-12: 32×15, 45×10, 52×6, 39×6.
- `panca-piana-bilanciere`: il 2026-11-04 (tutti i set vuoti) è saltato → 2026-10-05.
- Il 2026-10-05 resta byte per byte com'era dopo ogni unione.
- Alias: «romanian deadlift», «Stacco Rumeno», «RÓMANIAN deadlift» trovano `stacco-rumeno-bilanciere`.
- E2E `US-35 …` (unione dal catalogo con conferma) e `US-36 …` (esercizio aggiunto con default precompilati).

**Esito (INC-004, 5 novembre 2026)**
- Alias dell'Appendice A applicati così come proposti: il test di unicità non trova collisioni, nessuno tolto.
- `defaultSets(types, previous)`: `types` è un numero (serie normali, come nella firma prevista) oppure il genere
  di ogni serie, perché `addSessionExercise` e `switchExercise` hanno anche riscaldamenti. `prefillSets` lo
  applica alle serie di una voce (id e genere invariati) e lo usano `startSession`, `addSessionExercise`, `switchExercise`.
- «Solo serie spuntate» vale anche per `previousSets` (colonna «Precedente»), per «L'ultima volta» del foglio
  dell'approfondimento e per `sessionHasData`: concludere chiede una serie spuntata, e l'annullamento chiede
  conferma solo con una serie spuntata (con soli valori scritti resta il Toast con «Annulla»).
- Interfaccia dell'unione: non c'è una schermata del catalogo, quindi sta nel foglio di `ExercisePicker`
  (aggiungi esercizio in sessione ed editor della scheda), non in «Altro esercizio…» della variante.
- Cambio di esercizio sul posto con storico: il toast dice «valori dell'ultima volta con …» invece di «si sono svuotati».
- Il peso della serie sopra (step 9) resta solo per le righe vuote: aggiornati 5 e2e che davano per scontati i
  campi vuoti e il brief `.impeccable/surfaces/route-workout.md`.

### Incremento 2 — Pulsante «completa esercizio» (US-37)

- **Posizione:** icona (Lucide `CheckCheck`) nell'header di `WorkoutExercise.svelte`, accanto al ⋯, area da
  44 px, `aria-label` «Completa {nome}». Il titolo ha già `min-width: 0` e va a capo: verificare a 320×568 che
  non lo schiacci e che i due tocchi non si sovrappongano. Non compare quando tutti i set sono già completati
  né quando la card è compatta.
- **Funzione** `completeExercise(archive, sessionId, exerciseId, now): { archive; completed: string[] }`:
  segna completati i set con `reps !== null` e `completedAt === null` (kg può mancare), tutti con lo stesso
  `completedAt = now`. I set già completati non cambiano. I set senza reps restano non completati; **non si
  inventano valori**. Restituisce gli id dei set appena completati.
- **Timer:** al massimo un recupero, alla fine, con la logica di `restAfterCheck` sull'ultimo set appena
  completato (un solo `restTimer().afterCheck(...)` dentro il gesto, per lo sblocco dell'audio).
- **Annulla:** `Toast` «Annulla» che ripristina `completedAt: null` sui soli set appena completati e ferma il
  timer. Con i set vuoti rimasti, il toast dice quanti («2 serie senza ripetizioni»).
- **Set vuoti evidenziati** dopo il tocco, con i token di `DESIGN.md` (non il colore da solo: anche un testo o
  un'icona), e annuncio `role="status"`. L'evidenziazione si spegne appena il set viene modificato o spuntato.
- **Caso limite:** nessun set completabile → il pulsante non fa nulla di silenzioso: il toast spiega
  «Nessuna serie con ripetizioni». Più esercizi in superserie: completa **solo** quello della card.
- **Test:** completamento parziale, nessun set valido, tutto già completato, annulla (anche dopo una modifica
  nel frattempo: ripristina solo i set toccati), stesso `completedAt`, kg nullo. Caso dalla fixture: 2026-10-26
  leg press, 5 set completati in un colpo. E2E `US-37 …`.

**Esito (INC-005, 5 novembre 2026)**
- `completeExercise` e `undoCompleteExercise(archive, sessionId, exerciseId, setIds, at)` in `workout.ts`:
  «Annulla» toglie la spunta solo alle serie con `completedAt === at`, quindi non a una rispuntata a mano.
- **Recupero già ridotto** dopo «Completa» (`restTimer().afterCheck(…, minimized)`): il timer a tutto schermo è
  un `showModal()` e copriva l'avviso con «Annulla» e le righe evidenziate. La durata resta quella di
  `restAfterCheck` sull'ultima serie spuntata. Scelta di interazione da rivedere con Francesco sul telefono.
- Evidenziazione: `SetRow` con `flagged` (`warning-bg`, `warning-line`) più il testo «Mancano le ripetizioni:
  serie N» con `CircleAlert` e `role="status"` sotto le righe. Si spegne a ogni modifica o spunta della serie.
- Avviso: «{nome}: K serie spuntate[, M senza ripetizioni].» con «Annulla»; senza serie valide «{nome}:
  nessuna serie con ripetizioni.» senza azione.
- Header: target e note sotto il titolo occupano anche la colonna dei pulsanti (`display: contents` sul
  contenitore del titolo); a 320×568 il nome lungo va su una riga in più, il target no.
- Storie chiuse registrate in `docs/archive/restyling/USER-STORIES.md` (US-35, US-36, US-37), su richiesta di
  Francesco del 5 novembre: vale al posto della regola della §4 «non nel file archiviato».

### Incremento 3 — Riordino con il trascinamento (US-38)

- **Nessuna libreria:** Pointer Events, maniglia dedicata con `touch-action: none` (lo scroll della lista non
  parte dalla maniglia, ma dal resto della card). Un solo componente condiviso
  src/components/ui/ReorderHandle.svelte (+ logica in src/lib/reorder.ts, pura dove possibile) usato da
  `Workout.svelte` e `RoutineEditor.svelte`: non aggiungere una terza copia.
- **Gesto:** premere e trascinare la maniglia; appena parte il trascinamento tutte le card passano alle righe
  compatte già esistenti (la modalità `reordering`), così la lista si accorcia e l'intera lista sta nello
  schermo. La riga trascinata resta ancorata al dito: dopo la compressione si ricalcola il suo offset dalla
  posizione del puntatore. Ai bordi il contenitore scorre da solo. Rilascio → ordine nuovo salvato con
  `repo.update`; `Esc`/`pointercancel` → nessuna modifica.
- **Tastiera e lettore di schermo:** la maniglia è un pulsante con focus; Su/Giù spostano di una posizione con
  annuncio `role="status"` («{nome}: posizione 3 di 7»). Restano le frecce della modalità «Riordina».
  Nel foglio ⋯ della sessione si aggiungono «Sposta su» e «Sposta giù» (usano `move()`).
- **Funzione pura** `moveToIndex(list, id, targetIndex)` accanto a `moveInList`, con la regola delle
  superserie: la maniglia dell'intestazione «Superserie» sposta l'intero gruppo; la maniglia di un esercizio
  dentro un gruppo lo sposta solo **dentro** il gruppo; per uscirne si usa lo scollega esistente. Esercizi non
  in gruppo si muovono tra i blocchi. Non cambia nessun `group`.
- **Casi limite:** un solo esercizio (maniglia assente o disabilitata); lista a 100 voci; trascinare fuori
  dalla lista e rilasciare; scorrimento durante il trascinamento; sessione con serie già completate (non
  cambiano); `nextSet`/`plannedEntry` dopo il riordino (stesso esercizio due volte: verificare che la
  k-esima voce resti coerente con la scheda, test già coperti in `workout.test.ts`, estendere).
- **Test:** unitari su `moveToIndex` (singoli, gruppo intero, dentro il gruppo, bordi, id sconosciuto, stesso
  indice = stessa lista). E2E `US-38 …` con tastiera e con puntatore simulato (Playwright mouse con maniglia).
  Prova obbligatoria sul telefono (è il rischio: layout che cambia sotto il dito).

### Incremento 4 — Selezione automatica della cella (US-39)

- Al focus (tocco o tastiera) di un campo kg o reps (`SetRow.svelte`, `LiveField.svelte`) si seleziona tutto il
  contenuto, così scrivere sostituisce. Niente ± né ruota, niente scorrimento sulla cella.
- Attenzione: su Android/iOS `select()` nel gestore `focus` può essere annullato dal tocco; usare
  `onfocus` + `requestAnimationFrame`/`setSelectionRange` e provarlo sul telefono. Non rompere la tastiera
  numerica (`inputmode`) né la gestione del decimale con la virgola.
- **Test:** e2e `US-39 …` (focus → il valore digitato sostituisce quello vecchio, kg e reps). Prova sul telefono.

### Incremento 5 — Icona (nessuna storia: asset)

Dopo l'incremento 3 e 4 (cambia solo asset e manifest).
- **Partenza:** `/Users/thuls/Repository/personal-website/src/assets/projects/workout-tracker-hero.webp`
  (1120×630, nero su carta). Così com'è non regge: tratti sottili, proporzioni, dischi fuori zona sicura.
- **Varianti da produrre, tutte e due:** **A** solo bilanciere con dischi a pennellata e tratti ispessiti;
  **B** figura semplificata a poche pennellate piene, bilanciere dentro la zona sicura maskable.
  Palette: nero e bianco, bordi grigi chiari. Nessun colore acceso.
- **Foglio di confronto** in `screenshots/icon-compare.png`: ogni variante a 16, 32, 48, 192, 512 px, più la
  versione maskable con il cerchio della zona sicura (80%) sovrapposto. **Fermarsi qui** e far scegliere a
  Francesco: non applicare nessuna variante prima della scelta.
- **Dopo la scelta:** `scripts/make-icons.mjs` rigenerato da una sorgente versionata (es. SVG in
  scripts/icon-source/), `public/icons/*`, `public/favicon.svg`, apple-touch-icon, manifest
  (`src/pages/manifest.webmanifest.ts`): `background_color` e `theme_color` da verde a grigio molto scuro
  (**da verificare** se la costante `SHELL` è usata altrove, es. `<meta name="theme-color">` in `Base.astro`:
  coerenza, ma nessun altro cambio di palette).
- **Telefono:** `adb reverse tcp:4321 tcp:4321` e la build in preview (il service worker esiste solo nella
  build); `localhost` è un contesto sicuro, quindi si può installare la PWA. Screenshot del launcher con la
  nuova icona accanto a Strong: `adb exec-out screencap -p > screenshots/4-icona-dopo.png`.

---

## 7. Verifica (ogni incremento con codice)

- Controlli mirati subito; gate completo a fine incremento, con codici d'uscita registrati: `npm run check`,
  `npm test`, `npm run build`, `npm run test:e2e` e `WT_BASE=/workout-tracker/ npm run test:e2e`; con documenti
  toccati `npm run docs:check`. Con UI toccata guardare anche 390×844 e 320×568.
- **Dispositivo:** `adb` sta in `~/Library/Android/sdk/platform-tools` (non nel PATH). Telefono collegato in
  debug wifi (`adb devices`). Origine diversa dalla produzione: lo storage è vuoto, importare la fixture sul
  telefono (Impostazioni → Dati) e **non toccare i dati dell'app in produzione**. Attenzione al service worker
  che può servire una build vecchia (svuotare i dati del sito o disinstallare tra una build e l'altra).
- **Screenshot** prima/dopo per ogni punto, nel riepilogo finale: con l'agente Hermes
  (`/Users/thuls/.local/bin/hermes --yolo -z "<prompt autosufficiente>"` dalla radice del repo), fallback
  `adb exec-out screencap -p > screenshots/<punto>-<prima|dopo>.png`. Nei file `screenshots/strong-*.png`
  ci sono le schermate di riferimento di Strong: non committarle.
- Non salvare né completare allenamenti in Strong; se serve rifare un riferimento, avviare e scartare.

## 8. Chiusura della feature (ultimo incremento)

`SPEC.md` → `docs/archive/features/INC-<chiusura>_dedup-catalog-and-workout-ux.md`; cancellare
`features/dedup-catalog-and-workout-ux/`; aggiornare `docs/PROJECT.md` (stato, «Feature attive», e togliere il
limite noto «Riordino … solo con le frecce»); `docs/ARCHITECTURE.md` (nuove funzioni di `catalog.ts`,
`workout.ts`, `reorder.ts`, `ReorderHandle.svelte`); in `docs/todo.md` spuntare i punti chiusi e sostituire il
punto sulla palette verde con: «palette bianco e nero in chiaro e scuro, bordi grigi chiari; colori accesi e
vividi solo per dettagli e grafiche (definiti da Francesco); stile a pennello solo per illustrazioni e
onboarding; controlli e numeri in font pulito con cifre tabulari». `docs/todo.md` è di Francesco: modificarlo
solo per questi due interventi, rileggendolo prima (risulta già modificato fuori da questa feature).
ADR solo se si sceglie tra alternative vere: probabile una, sul trascinamento senza libreria
(alternative: libreria con tocco e tastiera). Altrimenti `ADR: nessuna (meccanico)`.

## 9. Attacco al piano (buchi cercati, regola 9)

| Buco | Esito |
| --- | --- |
| Valori veri precompilati finiscono nello storico se non spuntati | Coperto da §1c: «completato» è il criterio dello storico; elenco dei punti da controllare e test |
| Si perde il peso-dalla-serie-sopra (step 9) | Accettato da Francesco con «valori veri»; resta solo per esercizi senza storico |
| `finishSession` accetta un allenamento di soli precompilati | Da verificare; se sì, richiede ≥1 set spuntato (§1c) |
| Alias che collidono con un altro nome | Test di unicità delle chiavi (§1a) |
| Traduzioni inglesi sbagliate | Appendice A è una proposta: Francesco la rivede in revisione del diff |
| Catalogo base con quasi-duplicati («Rematore al cavo basso» vs «Rematore seduto al cavo basso», «Leg press» vs «Leg press, piedi a metà pedana») | **Aperto, non risolto qui.** Non unire esercizi base: ID immutabili. Segnalare nel resoconto |
| Un backup vecchio reimporta i duplicati | Non risolto, scritto nel CHANGELOG |
| Drag: layout che cambia sotto il dito | Ancoraggio al puntatore + prova obbligatoria sul telefono |
| `select()` al focus inaffidabile su mobile | Prova sul telefono, alternativa `setSelectionRange` (incremento 4) |
| Icona monocroma su sfondo di avvio verde | Risolto: `background_color` grigio molto scuro (incremento 5) |
| ID delle storie in collisione con US-34 (pagina Info, `c28692e`) | Risolto (Francesco, 5 novembre): storie della feature scalate di uno, US-35…US-39; `tests/e2e/us-34-info.spec.ts` non si tocca |
| Due schede aperte nel browser durante l'unione | Gestito dal repository (revisione/conflitto): non aggiungere codice |

## 10. Fuori ambito

Tema bianco e nero dell'app, colori accenti, tutorial di primo avvio, hamburger, grafici raggiungibili, suono
del timer, «la lista degli esercizi non è grande»: restano in `docs/todo.md`. Nessun ± sulle celle, nessun
selettore a ruota, nessun Flutter/Capacitor, nessuna libreria di trascinamento, nessuna modifica agli esercizi
base oltre ad `aliases`.

## Appendice A — Alias proposti per il BASE_CATALOG (chiave: nome nel file)

Solo varianti **diverse** dal nome. L'esecutore verifica l'unicità con il test della §1a e può togliere un alias
in collisione, segnalandolo. Proposta da rivedere.

| Nome | Alias |
| --- | --- |
| Squat bilanciere | Squat, Back squat, Barbell squat |
| Leg press | Pressa, Pressa orizzontale |
| Squat al Smith | Smith machine squat, Squat Smith |
| Goblet squat | Squat goblet |
| Panca piana bilanciere | Panca piana, Bench press, Barbell bench press |
| Chest press | Macchina pettorali, Chest press machine |
| Panca piana manubri | Dumbbell bench press, Panca manubri |
| Rematore manubri, petto su panca inclinata | Chest supported dumbbell row, Rematore manubri panca inclinata |
| Rematore al cavo basso | Low cable row, Pulley basso |
| Row machine con appoggio | Chest supported row machine |
| Hip thrust bilanciere | Barbell hip thrust, Spinta d'anca bilanciere |
| Hip thrust machine | Spinta d'anca macchina |
| Glute bridge con manubrio | Dumbbell glute bridge, Ponte glutei manubrio |
| Pull-through al cavo | Cable pull through |
| Distensioni manubri seduto, schienale alto | Seated dumbbell shoulder press, Shoulder press manubri |
| Shoulder press machine | Macchina spalle, Lento avanti macchina |
| Curl manubri su panca inclinata | Incline dumbbell curl |
| Curl al cavo basso | Low cable curl, Cable curl |
| Curl EZ | EZ bar curl, Curl bilanciere EZ |
| Alzate laterali | Lateral raise, Dumbbell lateral raise |
| Alzate al cavo | Cable lateral raise |
| Macchina laterali | Lateral raise machine |
| Standing calf | Standing calf raise, Calf in piedi |
| Calf alla leg press | Leg press calf raise |
| Calf monopodalico con manubrio | Single leg dumbbell calf raise |
| Stacco rumeno bilanciere | Stacco rumeno, Romanian deadlift, RDL, Barbell romanian deadlift |
| Stacco rumeno manubri | Dumbbell romanian deadlift |
| Hyperextension 45° con disco | Back extension, Iperestensioni |
| Distensioni manubri panca inclinata | Incline dumbbell press, Panca inclinata manubri |
| Incline chest press | Macchina pettorali inclinata |
| Panca inclinata al Smith | Smith incline bench press |
| Lat machine presa prona | Lat pulldown, Lat machine |
| Trazioni assistite o negative | Assisted pull up, Trazioni assistite |
| Lat monobraccio al cavo | Single arm lat pulldown |
| Leg press, piedi a metà pedana | Leg press mid platform |
| Hack squat | Hack squat machine |
| Leg extension | Estensioni gambe, Leg extension machine |
| Rematore seduto al cavo basso | Seated cable row |
| Rematore manubrio monobraccio con appoggio | One arm dumbbell row, Single arm dumbbell row |
| Row machine | Macchina rematore, Machine row |
| French press EZ | EZ bar skull crusher, Skull crusher EZ |
| Pushdown ai cavi | Triceps pushdown, Pushdown |
| French press con manubrio | Dumbbell skull crusher, Overhead dumbbell triceps extension |
