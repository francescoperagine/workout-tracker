# SPEC — workout-gym-ux

**Livello:** Feature · **Stato:** pronta per l'esecuzione · **Base:** `main` a `de2f0bb` (INC-010)
**Data del piano:** 6 novembre 2026 · **Origine:** revisione di Francesco sul telefono e confronto con Strong
(`screenshots/ux-2026-11-06/wt-*.png`, `strong-*.png`; `screenshots/strong-*.png`; non tracciati)

Chi ragiona ha scritto questa SPEC; una sessione nuova la esegue con `HANDOFF.md`. Le letture di codice sono
verificate al 6 novembre 2026; dove scrivo **da verificare** l'esecutore controlla con un comando prima di
modificare.

## 1. Obiettivo

L'allenamento attivo in palestra deve dire a colpo d'occhio cosa è suggerito e cosa è confermato, far chiudere un
esercizio e passare al successivo con un tocco, e non distrarre: niente colori che competono, niente controlli
inutili mentre si trascina. In più: i progressi nella tab bar e alcune incoerenze di interfaccia.

## 2. Evidenze (cause verificate nel codice)

| # | Problema | Causa |
| --- | --- | --- |
| E1 | Senza storico le serie sono vuote anche se la scheda ha i target (Squat 6–8, 45 kg); con lo storico i campi hanno valori veri, bianchi come quelli scritti | Segnaposto solo da `suggestedSets` (`workout.ts:122`: precedente o serie sopra); i target della scheda (`RoutineExercise.reps`, `loadMin`) mai usati. Valori veri scritti all'ingresso da `prefillSets`/`defaultSets` (`workout.ts:89-112`, US-36, INC-004) |
| E2 | «Precedente» sfasato: riga 1 «—» accanto a 30/10 presi da 30×10 | `previousSets` (`workout.ts:71`) abbina per posizione anche le serie non spuntate; `defaultSets` solo le spuntate. Fixture: Squat del 26 ottobre con la serie 1 non spuntata |
| E3 | Intestazione «Superserie» spostata di ~12 px a destra | `.superset-caption :global(.reorder-handle)` ha solo `width: 2rem` (`Workout.svelte:948`); la maniglia dell'esercizio ha anche `margin: -0.25rem 0 0 -0.75rem` (`WorkoutExercise.svelte:339-344`). Stessa intestazione nell'editor della scheda (`RoutineEditor.svelte:310`): **da verificare** |
| E4 | Settimana tipo con `<select>` nativo per giorno | `Calendar.svelte:317-326` (`weeklySelectValue`, `setWeekly`; il link «Assegna» fa `focus()` sul select, righe 141-143) |
| E5 | I fogli aperti dal menu ⋯ non tornano al menu | `option()` chiude il menu e apre un altro foglio (`Workout.svelte:326-341`); `BottomSheet` ha solo ✕ |
| E6 | Anello di focus su ✕ all'apertura di ogni foglio e sul pulsante del timer | `dialog.showModal()` (`BottomSheet.svelte:20`) mette il focus sul primo pulsante anche aprendo con un tocco; timer: **da verificare** in `RestTimer.svelte` |
| E7 | «Annulla allenamento» corallo/rosa pieno, stona con il vermiglio | `.btn-danger` usa come fondo `--color-danger: light-dark(#BE123C, #FF7A8A)` (`global.css:49`, `216-222`), colore pensato per il testo: in scuro chiaro, quindi rosa |
| E8 | Trascinando, le frecce su/giù sono inutili e il numero a sinistra sta sotto il dito | Modalità righe `rows = reordering \|\| drag !== null` in `Workout.svelte:416` (righe `618-648`) e `RoutineEditor.svelte:179` (righe ~`300-345`), con il pulsante «Riordina esercizi» / «Riordina» |
| E9 | «Completa esercizio» (✓✓) lascia l'esercizio aperto | `isCompact` (`Workout.svelte:164`) esclude l'esercizio `touched`, che è proprio quello appena completato |
| E10 | Un esercizio si chiude/apre solo quando è finito | «Mostra/Nascondi serie» solo con `compact \|\| done` (`WorkoutExercise.svelte:227-229`) |
| E11 | Suono di fine recupero aspro | Tre bip a onda quadra 880/880/1320 Hz, guadagno 0.9 (`rest-alert.ts:31-50`); scelti dopo la prova del 12 ottobre perché la sinusoide pura si sentiva poco |
| E12 | I grafici non sono nella tab bar | Quattro tab (`TabBar.astro:18-21`); grafici per esercizio in Storico → Esercizi (`HistoryPage.svelte`, `ExerciseProgress.svelte`, `/exercise/?id=`) |
| E13 | Allenamenti dimenticati aperti: «14 h 06 min», nello storico «136 h 47 min» | Nessun controllo: la fine è quando si preme Termina (`finishSession(archive, id, now)`, `sessions.ts:79`) |

## 3. Decisioni (Francesco, 6 novembre 2026)

### 3.1 Valori nei campi: segnaposto, non valori veri (E1, E2) — rovescia US-36

1. **Le serie entrano vuote:** un esercizio che entra in sessione (avvio da scheda, aggiunta, variante) ha
   `kg` e `reps` a `null`. Niente più valori veri scritti all'ingresso: `prefillSets` smette di copiare i valori
   (o sparisce; **da verificare** i chiamanti, tra cui `workout.ts:312`). Le sessioni già in corso con valori
   precompilati restano come sono, nessuna migrazione.
2. **Segnaposto della serie i**, in quest'ordine, per serie dello stesso genere (riscaldamento o di lavoro):
   1. la serie i **spuntata** l'ultima volta che si è fatto l'esercizio: kg e ripetizioni di quella serie (kg
      vuoto se era a corpo libero);
   2. altrimenti, se l'esercizio viene da una scheda (`plannedEntry`), il target della scheda: ripetizioni da
      `RoutineExercise.reps`, kg da `loadMin`;
   3. altrimenti vuoto.
   Sparisce la regola «peso della serie sopra come segnaposto» (`suggestedSets`): Francesco vuole «altrimenti
   vuoto».
3. **Ripetizioni della scheda come testo libero:** `reps` è una stringa; le schede di Francesco hanno intervalli
   («6–8», «8–12»). Regola: un numero intero → quel numero; un intervallo `a–b` (anche con `-`) → `a`, il limite
   basso; altro testo → nessun segnaposto. *Scelta di chi pianifica dopo la domanda di Francesco («nella scheda
   ci sono già le ripetizioni»): se la vuole diversa, cambia solo questa regola.*
4. **«Precedente» coerente (E2):** la colonna mostra la stessa fonte del punto 2.1: `previousSets` abbina solo
   le serie spuntate, come faceva `defaultSets`. Il target della scheda **non** va nella colonna «Precedente».
5. **Spunta:** su una riga i campi vuoti prendono il segnaposto (`completedSet`). I **kg possono restare vuoti**
   (esercizi senza pesi); le **ripetizioni sono obbligatorie**: senza ripetizioni scritte né segnaposto la serie
   non si spunta e il focus va al campo Rip (mai al campo kg: **da verificare** il ramo `missing === 'kg'` di
   `SetRow.svelte`). Chi non l'ha fatta toglie la serie («Togli serie», c'è già). «Completa esercizio» (US-37)
   resta com'è: le serie senza ripetizioni restano evidenziate.
6. **Aspetto:** segnaposto in `--color-text-muted` (già `::placeholder`, `global.css:135`), valori scritti a
   colore pieno. Il contrasto del segnaposto sul fondo del campo deve reggere AA in entrambi i temi: coppia nel
   test di contrasto, **da verificare** se c'è già.
7. **Chi legge i valori delle serie non fatte** (testo «Prossima: … 50 kg × 10» del timer, `nextSetText`;
   riassunti in Oggi; altro: **da verificare** con `grep`) usa il segnaposto quando il campo è vuoto.
8. US-36 riscritta in `docs/archive/restyling/USER-STORIES.md` (riga ~126) e il suo e2e aggiornato. ADR nuovo:
   segnaposto contro valori veri (rovescia la scelta di INC-004).

### 3.2 Superserie allineata (E3)

Maniglia e icona della catena dell'intestazione «Superserie» allineate a maniglia e nome degli esercizi sotto,
nell'allenamento e (se ha lo stesso difetto) nell'editor della scheda.

### 3.3 Settimana tipo in un foglio (E4)

Ogni giorno è una riga-pulsante (giorno a sinistra, valore a destra, ≥ 48 px) che apre un `BottomSheet` con
Niente / Riposo / le schede attive, spunta sul valore attuale (come il foglio del tipo di serie). Il link
«Assegna le schede ai giorni» porta il focus alla prima riga.

### 3.4 Indietro nei fogli (E5) e focus iniziale (E6)

- I fogli aperti dal menu ⋯ dell'esercizio (Recupero, Come si esegue, Cambia esercizio) hanno a sinistra del
  titolo un pulsante con `ChevronLeft`, etichetta accessibile «Torna al menu», che riapre il menu dello stesso
  esercizio; ✕ chiude tutto. `BottomSheet` riceve una prop opzionale `onback`; senza, nessun pulsante.
- La pagina di un esercizio aperta da «Progressi» del menu ha il ritorno «‹ Allenamento» verso `/workout/`
  (parametro in query string, es. `?id=…&from=workout`), invece di «‹ Esercizi».
- All'apertura il focus va al foglio (o al titolo con `tabindex="-1"`), non a ✕; idem per il timer a tutto
  schermo. Tastiera e lettore di schermo restano dentro il dialogo; alla chiusura il focus torna a chi l'ha
  aperto (già così).
- Il foglio modale copre la tab bar: **resta così** (Material 3, Apple HIG: finché è aperto il resto non si usa).

### 3.5 Rosso per il distruttivo pieno (E7)

Nuovo token di riempimento separato dal testo: `--color-danger-fill: light-dark(#C81E1E, #DF3124)`,
`--color-on-danger: #FFFFFF` in entrambi i temi (bianco su #C81E1E 5.74, su #DF3124 4.56; #DF3124 sul fondo
scuro #1C1C1E 3.73 e sulla superficie scura #2A2A2D 3.14 ≥ 3). *Il piano diceva #D92D20, che sulla superficie
scura fa 2.96: Francesco ha scelto #DF3124 il 6 novembre 2026 (ADR-006). Al passaggio il rosso si scurisce
con il 12% di nero, perché un velo di `text` in scuro abbassava il contrasto del bianco.* `.btn-danger` e il suo hover usano `danger-fill`; `--color-danger` resta il colore del
testo d'errore. Coppie in `src/styles/contrast.test.ts` (on-danger su danger-fill ≥ 4.5; danger-fill su bg e
surface ≥ 3), campione in `/kit`, `DESIGN.md` aggiornato; ADR-005 citato dall'ADR nuovo o aggiornato.

### 3.6 Riordino solo trascinando (E8)

- **Via la modalità «Riordina»** e le frecce su/giù, nell'allenamento («Riordina esercizi» in fondo) e
  nell'editor della scheda («Riordina» accanto a «Esercizi»). Il riordino è il trascinamento dalla maniglia.
- Durante il trascinamento le card diventano righe come oggi, ma il **numero d'ordine sta a destra** del nome,
  dove c'erano le frecce; a sinistra solo la maniglia.
- **Nessun gesto come unico modo** (PRODUCT.md): nell'allenamento resta «Sposta su / Sposta giù» nel menu ⋯ (c'è
  già); nell'editor della scheda si aggiungono «Sposta su» e «Sposta giù» dentro la voce aperta (`EntryEditor`,
  vicino alle altre azioni della voce: **da verificare** dove). Le frecce da tastiera sulla maniglia restano.
- Fuori ambito: il riordino delle schede in `/routines/` (`RoutineList.svelte`, solo frecce, nessun
  trascinamento) resta com'è.

### 3.7 Fisarmonica e ✓✓ (E9, E10)

- All'avvio dell'allenamento **tutti gli esercizi aperti**. Ogni esercizio si apre e si chiude toccando la sua
  intestazione (riga del nome, escluse maniglia, ⓘ e ⋯), in qualunque momento; `aria-expanded` e
  `aria-controls` sul pulsante dell'intestazione. Chiuso, mostra il riassunto compatto di oggi
  (`compactSummary`). Sparisce il pulsante «Mostra/Nascondi serie».
- Un esercizio con tutte le serie spuntate si chiude da solo come oggi.
- **✓✓ riuscito** → l'esercizio si chiude e l'attenzione passa al successivo con serie da fare: scorre in vista
  (`block: 'start'`, `prefers-reduced-motion` rispettato) e il focus va alla sua intestazione, non a un campo (la
  tastiera coprirebbe la pagina). Se il successivo era chiuso, si apre. «Annulla» nel toast riapre l'esercizio.

### 3.8 Suono a tre campane (E11)

Tre note brevi a campana, ascendenti, al posto dei bip quadri: per ogni nota una sinusoide più un'armonica
leggera, attacco morbido (~10 ms), coda esponenziale di ~0,8 s, note distanziate di ~0,18 s, tra 1 e 2 kHz (dove
l'altoparlante del telefono rende). Valori di partenza: 1047, 1319, 1568 Hz (Do6, Mi6, Sol6); un
`DynamicsCompressorNode` prima della destinazione per tenere alto il volume senza distorcere. Niente scelta del
suono nelle impostazioni; la vibrazione resta com'è. Rischio noto: la sinusoide pura si sentiva poco in
palestra → Francesco la prova in palestra; l'esito va nel CHANGELOG come limite finché non è provata.

### 3.9 Allenamento dimenticato (E13)

- Funzione pura in `src/lib/archive/` (Vitest): un allenamento in corso è «dimenticato» se l'ultima serie
  spuntata, o l'inizio se nessuna, è di **più di 3 ore** fa.
- Aprendo `/workout/` o Oggi con un allenamento dimenticato compare un `BottomSheet` «Allenamento ancora aperto»:
  «Ultima serie alle 17:42 di ieri» (o «Iniziato alle …»). Con serie spuntate: «Termina alle 17:42»
  (primario: `finishSession` con l'ora dell'ultima serie come fine, poi il riepilogo come oggi) e «Continua».
  Senza serie spuntate: «Annulla allenamento» (flusso esistente, con «Annulla» nel toast) e «Continua».
- «Continua» non richiede di nuovo nella stessa visita della pagina; nessun dato nuovo salvato.
- Storia nuova **US-41** con il suo e2e (orologio controllato).

### 3.10 Tab «Progressi» (E12)

- Quinta tab **«Progressi»** (icona `ChartLine`), ultima a destra: nuova pagina `/progress/` con l'elenco degli
  esercizi fatti, record e tendenza (quello che oggi mostra Storico → Esercizi), ciascuno verso
  `/exercise/?id=`. La pagina dell'esercizio passa sotto la tab Progressi (titolo «Progressi», ritorno
  «‹ Progressi», salvo `from=workout` di §3.4).
- Storico tiene solo gli allenamenti: sparisce l'interruttore Allenamenti / Esercizi.
- **Misure del corpo** (peso, circonferenze) andranno in questa tab **in futuro**, con una feature a sé (modello
  dati, validazione, backup, import). Ora nessun segnaposto «Misure» nell'interfaccia; la direzione va in
  `docs/PROJECT.md`.
- Tab bar a cinque voci leggibile a 320 px (etichette intere, target ≥ 48 px): **da verificare** con le viste.

## 4. Fuori ambito (annotati, non fare)

Intestazione dell'allenamento più compatta; ✓✓ come icona nell'intestazione della colonna; recupero visibile tra
le serie come in Strong; superserie creabile durante l'allenamento; riordino delle schede in `/routines/`; misure
del corpo.

## 5. Incrementi (un commit ciascuno, in quest'ordine)

1. **Correzioni:** §3.2 superserie, §3.1.4 precedente coerente, §3.4 indietro e focus, §3.5 rosso, §3.3
   settimana tipo.
2. **Card e riordino:** §3.7 fisarmonica e ✓✓, §3.6 riordino solo trascinando (allenamento ed editor).
3. **Segnaposto:** §3.1 (tranne il punto 4, già fatto), US-36 riscritta, ADR.
4. **Suono e allenamento dimenticato:** §3.8, §3.9 (US-41).
5. **Tab Progressi:** §3.10, poi la chiusura della feature (§8).

## 6. Vincoli

- Invarianti di `AGENTS.md`: solo token di `DESIGN.md` e componenti base, archivio solo tramite
  `src/lib/archive/` con funzioni pure che non mutano l'argomento, date con `toDateKey`/`fromDateKey`, ID del
  catalogo intoccati, testo solo dal templating, link con `appUrl()`.
- UI: prima leggere `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/route-workout.md` (e i brief di calendario,
  schede, storico se esistono), `.claude/skills/impeccable/reference/craft-floor.md`; componenti nuovi o cambiati
  anche in `/kit`.
- Target ≥ 48 px; nessun gesto come unico modo; `prefers-reduced-motion` per scorrimenti e chiusure.
- Ogni storia nuova o cambiata ha il suo e2e con l'ID in testa (`US-41 …`); logica pura in Vitest. Gli e2e che
  usano «Riordina esercizi» / «Riordina» dell'editor (`tests/e2e/us-12-us-20-workout.spec.ts:303`,
  `us-07-us-10-routines.spec.ts:195`, `:264`: **da verificare** quali riguardano l'editor e quali `/routines/`)
  passano al trascinamento o a «Sposta su/giù».

## 7. Verifica

- Controlli mirati subito; gate completo a fine incremento, codici d'uscita registrati: `npm run check`,
  `npm test`, `npm run build`, `npm run test:e2e`, `WT_BASE=/workout-tracker/ npm run test:e2e`; con documenti
  `npm run docs:check`. Viste a 390×844 e 320×568, chiaro e scuro.
- **Telefono** (screenshot prima/dopo in `screenshots/`, non committati): `~/Library/Android/sdk/platform-tools/adb`
  (fuori dal PATH), `adb reverse tcp:4321 tcp:4321`. Sull'origine `localhost:4321` del telefono può restare un
  service worker con una build vecchia (palette verde): prima degli screenshot rimuoverlo e svuotare le cache via
  `adb forward tcp:9222 localabstract:chrome_devtools_remote` e CDP grezzo sul `webSocketDebuggerUrl` della scheda
  (`connectOverCDP` di Playwright si blocca); controllare che l'accento sia vermiglio. Se si carica la fixture
  `workout-tracker-2026-11-05.json` (6 allenamenti conclusi, nessuna superserie), salvare prima e ripristinare
  dopo `workout-tracker.archive.v2`. Strong (`io.strongapp.strong`) solo da guardare: mai salvare o terminare.
- Suono (§3.8): ascolto sul telefono; prova in palestra di Francesco dopo la consegna.

## 8. Chiusura (ultimo incremento)

`SPEC.md` → `docs/archive/features/INC-<chiusura>_workout-gym-ux.md`; cancellare `features/workout-gym-ux/`;
`docs/PROJECT.md` (stato, «Feature attive», direzione: misure del corpo nella tab Progressi);
`docs/ARCHITECTURE.md` (pagina `/progress/`, tab bar, funzioni nuove in `src/lib/archive/`, `BottomSheet` con
`onback`). ADR per le scelte vere: segnaposto contro valori veri (§3.1), rosso di riempimento (§3.5), riordino
senza modalità (§3.6). `docs/todo.md` è di Francesco: non toccarlo.

## 9. Esecuzione

- **INC-011 (incremento 1, 6 novembre 2026).** Verifiche: l'editor della scheda aveva la maniglia della
  superserie già allineata e la catena 4 px a sinistra del nome, allineata anche lei (E3); il timer a tutto
  schermo apriva con il focus su «Riduci il timer», ora sulla finestra (E6). Il link «Assegna le schede ai
  giorni» era un'ancora `#week-plan`; il `focus()` delle righe 141-143 è quello di «Cambia la settimana tipo»
  nel foglio del giorno, che ora porta il focus alla riga del giorno. Il «Ogni martedì» dentro il foglio del
  giorno resta un `select` (fuori da E4). «Progressi» aggiunge `from=workout` solo nell'allenamento in corso,
  non nel dettaglio di una sessione conclusa.

