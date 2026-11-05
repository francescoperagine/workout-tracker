# SPEC — exercise-card-layout

**Livello:** Feature · **Stato:** chiusa con INC-009 (6 novembre 2026) · **Base:** `main` a `458ea5b` (INC-008)
**Data del piano:** 5 novembre 2026 · **Origine:** revisione di Francesco della card esercizio sull'allenamento
attivo (`screenshots/2-completa-dopo-320.png`, `2-completa-dopo-390.png`; riferimento
`screenshots/strong-4-exercise-menu.png`, non tracciati)

Chi ragiona ha scritto questa SPEC; una sessione nuova la esegue con `HANDOFF.md`. Le letture di codice sono
verificate al 5 novembre 2026; dove scrivo **da verificare** l'esecutore controlla con un comando prima di
modificare.

## 1. Obiettivo

La card dell'esercizio in `/workout` si sfoltisce: il nome si legge (al massimo due righe anche a 320 px), restano
in testa solo maniglia, nome e menu; tutto ciò che si configura sta nel menu ⋯, come in Strong.

## 2. Decisioni già prese (Francesco, 5 novembre 2026)

1. **Numero dell'esercizio tolto** dalla card («1», «2a»…): non è un'informazione importante. Le superserie si
   riconoscono già dall'intestazione «Superserie · N esercizi» sopra il gruppo.
2. **Esercizio corrente (P7):** la pastiglia verde sul numero diventa il **bordo accent della card**
   dell'esercizio che contiene la serie da fare adesso; le altre card restano neutre.
3. **Riga obiettivo tolta del tutto** («3 × 8–12 · 20–24 kg · per manubrio · rec. 1:30»): Francesco la
   giudica ridondante con le righe serie sotto. Nota di chi ha pianificato, da non implementare: l'intervallo
   «8–12» e il carico della scheda non compaiono più durante l'allenamento (sotto ci sono i valori
   dell'ultima volta, non l'obiettivo). Se Francesco lo rivuole, è una riga.
4. **Recupero nel menu ⋯:** nuova voce «Recupero · 1:30» (valore attuale; «Recupero · nessuno» con 0) che apre
   un `BottomSheet` con lo `Stepper` già usato in Impostazioni (passo 15 s, da 0 a `LIMITS.maxRest`, 0 =
   nessun recupero). Il valore cambia **nella sessione e, se l'esercizio viene da una scheda, nella voce della
   scheda** (`plannedEntry`), così la volta dopo parte già da lì. Un esercizio aggiunto a mano lo eredita già
   dall'ultima sessione (`workout.ts:318`). Un recupero per esercizio, non per serie.
5. **«Cambia esercizio» tolto dal corpo della card:** resta nel menu ⋯ (c'è già).
6. **«Completa esercizio» (US-37)** passa dalla testa alla riga delle intestazioni Serie · Precedente · kg · Rip,
   nella colonna della spunta, sopra le spunte delle righe. Icona e bordo in colore accent: deve leggersi come
   un pulsante.
7. **«—» senza precedente** centrato nella sua cella.
8. **Maniglia del trascinamento** (US-38) a sinistra del nome, nella stessa riga.

## 3. Vincoli

- Schema persistito invariato (`version: 2`), nessun campo nuovo: `SessionExercise.rest` e `RoutineExercise.rest`
  esistono già. `warmupRest` non si tocca.
- Archivio solo tramite `src/lib/archive/`, funzioni pure che non mutano l'argomento; testo solo dal templating.
- UI solo con i token di `DESIGN.md` e i componenti base; prima di toccarla leggere `PRODUCT.md`, `DESIGN.md`,
  `.impeccable/surfaces/route-workout.md` e `.claude/skills/impeccable/reference/craft-floor.md`.
  Bersagli ≥ 44 px (la maniglia senza numero resta un bersaglio pieno).
- Nessun componente nuovo previsto (foglio = `BottomSheet` + `Stepper` dentro `Workout.svelte`). Se ne nasce
  uno, va in `/kit`.
- Fuori ambito: la modalità «righe» del riordino in `Workout.svelte` (le righe compatte con frecce e
  `.order`, intorno alla riga 585), l'editor della scheda, `KitReorder`/`KitSetRows` salvo ciò che si rompe.

## 4. Stato del codice (letto il 5 novembre 2026)

- `src/components/workout/WorkoutExercise.svelte`: `.head` è una griglia `2rem | 1fr | auto` con `.lead`
  (numero, dentro `ReorderHandle` se c'è `handle`), `.title` (h3 con il pulsante nome + icona Info, poi
  `.meta` con `target`, «Al posto di…», nota precedente) e `.actions` (`CheckCheck` «Completa {nome}» se
  `!compact && !done`, `Ellipsis` «Altre azioni: {nome}»). `.current .order` è la pastiglia. Nel corpo:
  pulsante `.variant` «Cambia esercizio/Cambia variante», poi `.column-heads` (5 colonne, l'ultima vuota,
  `aria-hidden="true"`) e le `SetRow`. `target` è un `$derived` (righe ~117–125).
- `src/components/ui/ReorderHandle.svelte`: pulsante in colonna con `children` (il numero) sopra
  `GripVertical`; `::before` allarga il bersaglio di 0,375 rem per lato. Usato anche dall'intestazione
  superserie e dall'editor della scheda: **non cambiarne il comportamento**; per la card basta non passare
  `children` e regolare il bersaglio dal CSS della card.
- `src/components/workout/Workout.svelte`: `labels = orderLabels(exercises)` (riga 128) passato come `label`;
  `current={next?.exercise.id === exercise.id}` (619); foglio ⋯ righe ~761–785 con `option(action)` (301–315);
  `detail` è vero sulla sessione conclusa (lì il recupero non parte, `afterCheck` riga ~195).
- `src/components/ui/SetRow.svelte`: `.previous.empty` (riga ~124) è flex allineato a sinistra.
- `src/lib/archive/workout.ts`: `plannedEntry(archive, session, exercise)` (143) trova la voce della scheda;
  `updateSet`/`setExerciseNotes` come modello per una funzione sulla `SessionExercise`.
- `src/lib/archive/routine-edit.ts`: `updateEntry(archive, routineId, entryId, patch)` (264).
- `src/components/settings/SettingsPage.svelte:95–107`: lo `Stepper` del recupero predefinito (min 15; qui
  min 0).
- e2e da aggiornare: `tests/e2e/us-12-us-20-workout.spec.ts:176, 208, 225` (clic su «Cambia esercizio» nella
  card → dal menu ⋯), `:564` (testo obiettivo `3 × 6–8 · 45–50 kg · rec. 2:00` → togliere o verificare
  l'assenza). `us-07-us-10-routines.spec.ts:110,150` riguardano l'editor della scheda: non si toccano.
  `us-37-complete-exercise.spec.ts` cerca `Completa {nome}` dentro la card: l'etichetta resta uguale.
  **Da verificare** con `grep -rn "order\|Cambia esercizio\|rec\. " tests/e2e` che non ce ne siano altri.

## 5. Incremento unico — card esercizio sfoltita e recupero dal menu (US-40)

**Storia nuova**, da aggiungere a `docs/archive/restyling/USER-STORIES.md` dopo US-39:
**US-40 (S, INC-…).** Come utente, voglio cambiare il recupero di un esercizio dal suo menu, una volta per
esercizio, perché valga per tutte le sue serie e anche la volta dopo.

### 5.1 Archivio

- `setExerciseRest(archive, sessionId, exerciseId, rest): Archive` in `src/lib/archive/workout.ts` (esportata da
  `index.ts`): imposta `rest` sulla `SessionExercise`; se `plannedEntry` trova la voce della scheda (sessione
  con `routineId` e scheda esistente), la aggiorna con `updateEntry(…, { rest })`. Valida `0 ≤ rest ≤
  LIMITS.maxRest`, intero, altrimenti `ArchiveError`. Con una variante si aggiorna la voce del posto previsto
  (è ciò che `plannedEntry` restituisce): accettato.
- Vitest in `workout.test.ts`: sessione da scheda → cambiano sessione e voce; sessione libera → solo sessione;
  l'argomento non è mutato; valore fuori limiti → errore.

### 5.2 Card (`WorkoutExercise.svelte`)

- Testa: `[maniglia] [nome + Info] [⋯]` su una riga. Niente numero, niente `.order`, niente `target`; la prop
  `label` sparisce (e il suo calcolo in `Workout.svelte` se non serve altrove: **da verificare**, `labels`
  serve anche agli annunci del riordino, riga 378, e alla modalità righe → lì resta).
- Maniglia: `ReorderHandle` senza `children`, a sinistra del nome, centrata sulla prima riga del nome;
  bersaglio ≥ 44 px senza rubare larghezza al nome (può sporgere nel padding della card). Senza `handle`
  (esercizio solo) il nome parte dal bordo.
- Nome: va a capo a parola (via `overflow-wrap: anywhere` se rompe le parole a metà; tenere solo come rete per
  parole più lunghe della riga). **Criterio:** «Distensioni manubri panca inclinata» sta in ≤ 2 righe a
  320×568 e a 390×844. Leve ammesse, in quest'ordine: spazio liberato da numero e `CheckCheck`, maniglia nel
  padding, `⋯` che sporge nel padding destro, corpo del nome a `--text-base` sotto i 360 px. Mai troncato.
- Righe sotto il nome che restano: «Al posto di {X}» con una variante, la nota della volta prima. In compatto la
  riga «✓ N serie · …» resta com'è.
- Corrente: `class:current` sulla `section` resta; il bordo accent va sulla card. **Da verificare** dove sta il
  bordo della card (classe sul contenitore in `Workout.svelte` o `.exercise`): il bordo accent sostituisce il
  bordo neutro, stessa larghezza se possibile (niente salto di layout quando l'esercizio corrente cambia).
- Corpo: tolto il pulsante `.variant`. In `.column-heads` l'ultima colonna ospita il pulsante «Completa {nome}»
  (`CheckCheck`, 48 px, icona e bordo `--color-accent-text`, stesso raggio della spunta di riga) se
  `!compact && !done`, altrimenti cella vuota. Le intestazioni restano `aria-hidden`, il pulsante no: spostare
  `aria-hidden` sulle singole etichette di testo. Allineato in colonna con le spunte delle `SetRow` (stesse
  `grid-template-columns`, oggi `.column-heads` ha `2rem` e `SetRow` `2.25rem` nella prima colonna: allinearle).

### 5.3 Menu ⋯ e foglio del recupero (`Workout.svelte`)

- Voce «Recupero · {formatDuration(rest)}» (icona Lucide `Timer`), «Recupero · nessuno» con 0, dopo «Cambia
  esercizio». Nascosta sulla sessione conclusa (`detail`).
- Apre un `BottomSheet` titolato col nome dell'esercizio: `Stepper` «Recupero» (min 0, max `LIMITS.maxRest`,
  passo 15, `format`/`speak` come in Impostazioni; con 0 il testo mostrato è «Nessuno»), e un `hint`: «Vale per
  tutte le serie di questo esercizio, anche nella scheda {nome scheda}.» se c'è la voce della scheda,
  altrimenti «Vale per tutte le serie di questo esercizio.». Ogni `onchange` salva con `setExerciseRest` (P4),
  nessun pulsante «Salva», nessun toast. Un recupero già in corso non cambia; vale dalla prossima spunta.

### 5.4 SetRow

- `.previous.empty`: il «—» centrato nella cella (solo il trattino; il testo del precedente resta a sinistra).

### 5.5 Test

- e2e nuovo tests/e2e/us-40-exercise-rest.spec.ts (da creare), con nomi che cominciano con `US-40`:
  1. dal menu ⋯ «Recupero · 2:00» → +15 s → la voce dice «2:15»; dopo la spunta di una serie il timer parte
     da 2:15; aprendo l'editor della scheda la voce ha 2:15.
  2. allenamento libero: il foglio non nomina la scheda e il valore resta alla sessione.
  3. sessione conclusa: la voce «Recupero» non c'è.
- Nello stesso file o in `us-12-us-20-workout.spec.ts`: a 320×568 il nome più lungo della scheda di prova occupa
  ≤ 2 righe (altezza del pulsante nome ≤ 2 × line-height + padding); niente testo «rec.» né «3 ×» nella card;
  «Cambia esercizio» non è un pulsante della card ma del menu; solo la card corrente ha la classe `current`.
- Aggiornare gli e2e elencati in §4.

## 6. Verifica

- Gate (AGENTS.md): `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`,
  `WT_BASE=/workout-tracker/ npm run test:e2e`, `npm run docs:check`; comando e codice d'uscita nel resoconto.
- Screenshot a 390×844 e 320×568 di `/workout` con la scheda di prova (sessione con un esercizio dal nome lungo,
  uno corrente, uno senza precedente, un foglio del recupero aperto) in `screenshots/` (non tracciata), da
  confrontare con `2-completa-dopo-*.png`.

## 7. Chiusura (in questo incremento)

- Voce `CHANGELOG.md` con l'`INC-` letto da `grep -m1 '^## INC-' CHANGELOG.md` (+1); `ADR: nessuna` (le
  scelte sono di prodotto, prese da Francesco e scritte qui).
- `docs/archive/restyling/USER-STORIES.md`: US-40 con il numero dell'incremento.
- `.impeccable/surfaces/route-workout.md`: la riga «Gerarchia» diventa «maniglia e nome esercizio (tocco =
  approfondimento) → variante → righe serie con "Completa" nell'intestazione → "Aggiungi serie"; recupero,
  nota, cambio esercizio nel menu ⋯; l'esercizio corrente ha il bordo accent».
- `docs/ARCHITECTURE.md` solo se cita la struttura della card (**da verificare** con `grep -n "WorkoutExercise"`).
- SPEC → `docs/archive/features/INC-<n>_exercise-card-layout.md`, cancellare `features/exercise-card-layout/`,
  aggiornare `docs/PROJECT.md`.

## 8. Attacco al piano (regola 9)

- **Recupero nella scheda con una variante:** si aggiorna la voce del posto previsto, non la variante.
  Accettato per semplicità; il caso è raro.
- **Superserie:** il recupero parte alla fine del giro (US-25) con il valore di un esercizio del gruppo; cambiare
  quello dell'altro può non avere effetto visibile. Fuori ambito; nessun lavoro sull'interfaccia delle
  superserie (decisione di INC-004…008).
- **Obiettivo della scheda non più visibile** in allenamento: deciso da Francesco (§2.3), annotato.
- **Nome a 320 px:** se le leve di §5.2 non bastano per «Distensioni manubri panca inclinata» in 2 righe,
  fermarsi e riferire con lo screenshot invece di ridurre ancora il corpo o troncare.
- **Bordo accent:** se la card non ha un bordo proprio e aggiungerlo sposta il layout, usare un `box-shadow`
  inset della stessa larghezza; niente colori fuori dai token.
