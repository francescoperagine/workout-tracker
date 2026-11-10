# Opzioni per le domande aperte di SPEC §8 (10 novembre 2026)

Per ogni domanda: raccomandazione, cosa chiedono gli utenti, cosa fanno i competitor, opzioni con pro e contro.
Fonti consultate il 10 novembre 2026. **Limite comune:** Reddit è bloccato dagli strumenti web, quindi le richieste
degli utenti si fermano a quelle trovate su bacheche pubbliche. Dove non c'è una richiesta con fonte, lo dico.

Fonti dei competitor:
- [H1] Hevy, «Sets per muscle group per week»: https://www.hevyapp.com/features/sets-per-muscle-group-per-week/
- [H2] Hevy, «Muscle group workout chart»: https://www.hevyapp.com/features/muscle-group-workout-chart/
- [H3] Hevy Help, «How to Create Custom Exercises in Hevy»:
  https://help.hevyapp.com/hc/en-us/articles/35700328894103-How-to-Create-Custom-Exercises-in-Hevy
  (403 al fetch: contenuto letto solo dal riassunto del motore di ricerca)
- [B1] Boostcamp, «Muscle Tracker»: https://www.boostcamp.app/features/muscle-tracker
- [S1] StrengthLog Help, mappa dei muscoli: https://help.strengthlog.com/?p=1312
- [M1] MacroFactor Help, «Muscle Groups»: https://help.macrofactorapp.com/en/articles/280-muscle-groups
- [U1] Strongsplit, richiesta «Exercise muscle improvements»: https://strongsplit.userjot.com/board/p/exercise-muscle-improvements
- [U2] Bacheca Featurebase «Assign one or more muscle groups to each exercise» (app non indicata):
  https://enode.featurebase.app/p/assign-one-or-more-muscle-groups-to-each-exercise-2

## Domanda 3. Cosa mostra il grafico e come si sceglie il gruppo

**Raccomandazione: opzione A per la prima versione.** Barre orizzontali, una per gruppo, con il controllo del periodo.
Il dettaglio per settimana (C) si aggiunge dopo, se serve.

**Utenti:** nessuna richiesta trovata sul tipo di grafico. L'obiettivo di SPEC §1B («chi cambia spesso esercizi»)
chiede una risposta del tipo «cosa sto trascurando», cioè un confronto tra gruppi.

**Competitor:**
- **Hevy:**
  - grafico delle serie per gruppo per settimana, mese o anno; si scelgono uno, alcuni o tutti i muscoli da un elenco
    [H1];
  - a parte, la sagoma del corpo con le serie per muscolo della settimana di calendario [H2].
- **Boostcamp:** mappa di calore, radar e tabella con la variazione rispetto al periodo precedente; nessun grafico nel
  tempo documentato [B1].
- **StrengthLog:** mappa dei muscoli per settimana, rossa piena a 10 serie [S1] (zone colorate: escluse da D5).
- **MacroFactor:** sezione «Muscle Groups» con serie e lavoro totale nel tempo; il tipo di grafico non è documentato [M1].

**Opzioni:**

| | A. Barre per gruppo nel periodo | B. Linea per settimana di un gruppo | C. A, e un tocco su un gruppo apre la sua linea |
| --- | --- | --- | --- |
| Pro | Una vista risponde a «cosa trascuro». 15 righe stanno a 320 px. Nessun selettore di gruppo. Valori leggibili come testo (accessibile) | Riusa `ProgressChart` (linea in SVG già scritta). Mostra l'andamento | Tutte e due le domande; il gruppo si sceglie toccando la barra, senza un menu a 15 voci |
| Contro | Nessun andamento nel tempo | Un gruppo alla volta. 15 voci non stanno in un `SegmentedControl`: serve un `BottomSheet` o un menu, quindi più tocchi. Si perde la panoramica | Più lavoro (un incremento in più), stato della selezione |

Valore delle barre, da fissare nella SPEC:
- per la settimana in corso, le serie fatte;
- per un periodo più lungo, la media per settimana delle settimane concluse, così il numero resta confrontabile
  con gli intervalli di SPEC §4 (12-20 serie, Baz-Valle 2022).

## Domanda 4. Settimana da lunedì o ultimi 7 giorni

**Raccomandazione: A, da lunedì**, con la settimana in corso indicata come parziale.

**Utenti:** nessuna richiesta trovata.

**Competitor:**
- **Hevy:** distribuzione per settimana di calendario, «limited to the current calendar week» [H2]; il giorno
  d'inizio non è documentato.
- **Boostcamp:** finestre mobili di 7, 30, 90 giorni, un anno o tutto, confrontate con la finestra precedente [B1].

**Codice:**
- le schede si pianificano per giorno della settimana da lunedì (`WEEKDAYS`, `src/lib/archive/types.ts:7`);
- `weekStart()` esiste già (`src/lib/archive/calendar.ts:16`).

| | A. Lunedì-domenica | B. Ultimi 7 giorni |
| --- | --- | --- |
| Pro | Coincide con la settimana delle schede. Le settimane passate non cambiano da un giorno all'altro. Funzione già nel repo | Il numero di oggi è sempre su 7 giorni pieni, mai «basso» il lunedì |
| Contro | Il lunedì la settimana in corso sembra vuota: va segnata come parziale | Il valore cambia ogni giorno e non corrisponde a nessuna settimana della scheda; per le medie lunghe serve comunque una divisione in blocchi |

## Domanda 5. Serie drop e a cedimento

**Raccomandazione: A.** Ogni serie spuntata che non è di riscaldamento conta 1: è `countsForProgress()`,
`src/lib/archive/progress.ts:34`, già usato da Progressi. Il limite va dichiarato nella SPEC e in un commento.

**Come le registra l'app:** ogni drop è una riga a sé con tipo `drop` (`SET_TYPES`, `src/lib/archive/types.ts:10`;
etichetta «D» in `src/components/ui/SetRow.svelte:78`). Una drop set con due scalate è quindi tre righe.

**Evidenze:**
- Havers T, Micke F, Geisler S, Held S. 2026, *Sports Med Open* 12:38, DOI 10.1186/s40798-026-01012-1.
  Meta-analisi su 12 studi e 274 partecipanti: drop set e serie tradizionali danno crescita simile (SMD 0,04).
- L'abstract non dice come gli studi contano una drop set rispetto alle serie normali, quindi non c'è un peso da
  prendere.
- Per il cedimento non ho trovato una ragione per pesarlo diversamente: una serie a cedimento è una serie dura come le
  altre.

**Utenti:** nessuna richiesta trovata.

**Competitor:**
- **Boostcamp:** esclude riscaldamento e serie saltate; delle drop non dice nulla [B1].
- **Hevy:** il conteggio per tipo di serie non è documentato [H1].

| | A. Ogni riga conta 1 | B. Le righe drop non contano | C. Le righe drop contano 0,5 |
| --- | --- | --- | --- |
| Pro | Stessa regola del resto di Progressi, zero codice nuovo. Il cedimento conta come serie, senza discussione | Una drop set conta come una serie, come la chiama chi si allena | Via di mezzo |
| Contro | Una drop set da tre righe vale 3 serie: probabilmente sovrastima | Sottostima: le scalate sono lavoro vero. Regola diversa dal resto dell'app | Peso inventato: nessuna fonte. Contraddice D2 («pesi fissi, nessuna percentuale libera») |

## Domanda 6. Dove si apre l'editor dei muscoli e cosa succede alle schede

**Raccomandazione:**
- **dove:** l'editor sta nella pagina dell'esercizio (`/exercise?id=`, `src/components/history/ExerciseProgress.svelte`),
  che ospita già «Era un altro esercizio» (US-42) e l'unione (US-35);
- **per un esercizio di catalogo:** muscoli in sola lettura e un'azione «Personalizza i muscoli» che apre un
  `BottomSheet` con il nome del nuovo esercizio (proposto «Squat bilanciere (mio)», modificabile) e l'editor;
- **schede:** opzione B. Il nuovo esercizio sostituisce l'originale nelle schede, con `ConfirmDialog` che dice quante
  schede cambiano e `Toast` con «Annulla».

**Rischio da conoscere prima di scegliere:**
- D7 crea un esercizio nuovo, e per il principio «distinguere i carichi delle varianti» (`PRODUCT.md`) ogni esercizio
  ha record e grafico suoi.
- Quindi chi personalizza i muscoli dello squat **riparte da zero con record e grafico**; lo storico resta sullo
  squat di catalogo.
- D7 non cambia; è una conseguenza da accettare, o da compensare con l'opzione D.

**Vincolo del codice:**
- l'ID di un personalizzato deriva dal nome (`customExerciseId`, `src/lib/archive/catalog.ts:96-99`) e
  `ensureExercise` riconosce i nomi già esistenti;
- il derivato quindi **deve avere un nome diverso** dall'originale.

**Utenti:**
- [U1]: chiedono più gruppi per esercizio e pesi regolabili;
- [U2]: principali, secondari e terziari per esercizio.

Nessuna delle due tratta il caso «modificare un esercizio predefinito».

**Competitor:**
- **Hevy:** nei personalizzati un principale e più secondari, modificabili dopo [H3]. Se gli esercizi della libreria
  siano modificabili non è documentato nelle pagine lette.
- **MacroFactor:** il tocco per principale e secondario (SPEC §5); la pagina non l'ho ritrovata, quindi senza URL.

| | A. Solo il nuovo esercizio | B. Sostituisce nelle schede | C. Sceglie l'utente scheda per scheda | D. B, e riscrive anche lo storico |
| --- | --- | --- | --- | --- |
| Pro | Nessuna modifica a sorpresa | Fa quello che l'utente vuole («da ora lo squat conta così») in un passo | Massimo controllo | Il grafico dello squat non si spezza |
| Contro | Sembra che non sia successo nulla: le schede usano ancora l'originale, va sostituito a mano | Tocca tutte le schede, anche quelle archiviate, se non si limita alle attive | Una lista di caselle in più per un caso raro | Cambia il passato (il volume delle settimane passate cambia). Toglie storico al catalogo. È un'unione al contrario, codice nuovo, si annulla male |

## Domanda 7. Esercizi senza muscoli

**Raccomandazione: A.**
- Sotto il grafico, una riga «Senza muscoli: N serie», con l'elenco degli esercizi che porta alla loro pagina.
- Nella pagina dell'esercizio, l'editor vuoto con l'invito ad aggiungerli.

**Codice:** un personalizzato nasce anche a metà allenamento, scrivendo un nome (`ensureExercise`,
`src/lib/archive/catalog.ts:118`, usato da `Workout.svelte` e `RoutineEditor.svelte`).

**Utenti:** nessuna richiesta trovata.

**Competitor:** Hevy fa scegliere i muscoli quando si crea il personalizzato [H3]. Se il principale sia obbligatorio
non è scritto nel riassunto letto.

| | A. Riga «Senza muscoli» con link | B. Esclusi in silenzio | C. Muscoli chiesti alla creazione |
| --- | --- | --- | --- |
| Pro | Il totale non mente: si vede quanto lavoro manca dal conto. Si sistema quando c'è tempo | Zero interfaccia | Dati completi da subito |
| Contro | Una riga e un elenco in più | Il conteggio sottostima senza dirlo (contro «anti BS») | Interrompe l'allenamento: contro il principio «usabile tra una serie e l'altra» (`PRODUCT.md`) |

## Domanda 1. Gruppi (§3)

**Raccomandazione:** confermare la lista con lombari e adduttori, e decidere gli addominali con lo stesso criterio
degli avambracci.

**Dalla mappa:**
- gli **adduttori** compaiono in 8 esercizi (squat, leg press, hack squat, stacchi rumeni);
- i **lombari** solo come secondari dell'hyperextension: l'argomento di SPEC §3 («senza lombari l'iperestensione non
  ha un muscolo diretto») è debole, perché glutei e femorali sono già principali lì;
- **nessun esercizio** del catalogo ha gli **addominali**, il motivo per cui SPEC §3 esclude gli avambracci.

Due criteri coerenti:
- **solo i gruppi che il catalogo usa:** niente addominali né avambracci; lombari solo se si tiene l'hyperextension
  così;
- **anche i gruppi utili per i personalizzati** (crunch, curl per i polsi): addominali e avambracci entrambi.

**Raggruppamento superiore** (spalle, braccia, gambe): con l'opzione A della domanda 3 le 15 barre stanno in una
schermata, quindi non serve nella prima versione.

## Domanda 8. Identificatori `variantOf`

**Raccomandazione: B se l'archivio passa alla versione 3** (SPEC §6), altrimenti A.

| | A. Solo testi e commenti | B. Anche `variantOf` → `alternativeOf`, con migrazione |
| --- | --- | --- |
| Pro | Nessuna migrazione | Il codice usa le parole di Francesco. Il riferimento del derivato può chiamarsi `variantOf` senza ambiguità |
| Contro | Il derivato (D7) non può chiamarsi `variantOf` senza confondersi; serve un altro nome (`derivedFrom`) | Tocca validazione, backup, unione (`mergeExercise`, `src/lib/archive/catalog.ts:152`) e circa 100 occorrenze. Da sola non vale una migrazione; insieme alla versione 3 il costo in più è piccolo |
