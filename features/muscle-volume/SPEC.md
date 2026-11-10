# SPEC: muscle-volume

**Livello:** Feature · **Stato:** in esecuzione, incrementi 1-4 fatti (INC-021, ADR-009; INC-022, ADR-010, ADR-011; INC-023, ADR-012; INC-024, ADR-013), prossimo il 5 (§9) · **Base:** `main` a `c220ee3` (ultimo
incremento INC-020) · **Piano:** 10 novembre 2026 · **Origine:** voce «vista per gruppo muscolare» di `docs/todo.md`
e ricerca del 10 novembre con Francesco (fonti in §4, §5 e in `features/muscle-volume/research/`)

**Conclusione:** ogni esercizio ha muscoli principali e secondari; la tab Progressi mostra le serie per gruppo
muscolare per settimana, a barre. Si arriva in 6 incrementi: archivio alla versione 3 (con `alternativeOf` e il
rematore doppio tolto), mappa del catalogo, logica del volume, editor dei muscoli con le varianti, grafico, linea
settimanale di un gruppo. Le risposte di Francesco sono in §8, l'attacco al piano in §10. Restano 4 domande con un
valore predefinito (§10.2): nessuna blocca l'incremento 1. I 7 punti della mappa da controllare sul Delavier sono in
attesa e non bloccano (§3.2).

**Terminologia (di Francesco, vincolante):** **variante** = esercizio personalizzato derivato da un altro (D7);
**alternativa** = esercizio scelto al posto di quello previsto dalla scheda. Il codice di oggi usa «variante» per
l'alternativa: l'incremento 1 lo corregge (D13).

**Regola per ogni decisione (data da Francesco, non va ripetuta):** cosa chiedono gli utenti, cosa fanno i
competitor, pro e contro di ciascuna opzione. Per le domande 3-8 sono in
`features/muscle-volume/research/opzioni-domande.md`; per le decisioni nuove di questa SPEC sono accanto alla
decisione. **Limite comune:** Reddit è bloccato dagli strumenti web, quindi le richieste degli utenti si fermano alle
bacheche pubbliche citate lì; dove non c'è una richiesta con fonte, è scritto.

## 1. Obiettivo

- **A. Muscoli per esercizio:** ogni esercizio (catalogo e personalizzati) ha muscoli principali e secondari.
- **B. Serie per gruppo muscolare:** nella tab Progressi, in alto, quante serie riceve ogni gruppo per settimana.
  Serve a chi cambia spesso esercizi e a chi usa molte alternative e varianti, perché lo storico per singolo
  esercizio resta rado.

## 2. Decisioni

| # | Decisione | Motivo in breve |
| --- | --- | --- |
| D1 | Deltoidi separati: anteriori, laterali, posteriori | Scelta di Francesco; le spinte lavorano gli anteriori, le alzate i laterali, le tirate i posteriori: con un solo «spalle» il conteggio non dice nulla |
| D2 | Conteggio frazionario: principale = 1 serie, secondario = 0,5 | Pelland et al. 2026: il metodo frazionario con 0,5 per il lavoro indiretto è quello che si adatta meglio ai dati. Pesi fissi, nessuna percentuale libera |
| D3 | Più muscoli principali ammessi per esercizio | Lo squat profondo fa crescere quadricipiti, glutei e adduttori (Kubo 2019, §4); Hevy ne ammette uno solo |
| D4 | La mappa del catalogo è nostra, non importata | wger ha errori gravi e un solo muscolo per le spalle (`features/muscle-volume/research/wger-crosscheck.md`). Dove c'è uno studio di crescita comanda lo studio; altrimenti l'azione articolare principale. Delavier come verifica (Francesco), wger solo come controllo. Mappa e regola in `features/muscle-volume/research/mappa-43.md` |
| D5 | Si parte dalle cose base | Conteggio descrittivo (come Hevy). Niente zone colorate né soglie (§4: MEV/MRV senza base sperimentale) |
| D6 | Esercizi personalizzati: liste libere di principali e secondari; un muscolo non sta in entrambe | Nessuno chiede un limite; MacroFactor fa così (tocco = principale, secondo tocco = secondario) |
| D7 | Cambiare i muscoli di un esercizio di catalogo **crea una variante** (esercizio personalizzato basato su quello); il catalogo non cambia mai | Scelta di Francesco. Niente conflitti tra aggiornamenti e modifiche; niente «Ripristina predefinito». Limiti accettati: la variante non riceve le correzioni successive della mappa, e record e grafico della variante partono da zero |
| D8 | Panoramica in Progressi, grafico in alto, controlli come nella pagina dell'esercizio (SegmentedControl compatti) | Scelta di Francesco |
| D9 | Logica isolata: pesi e regole di conteggio in un solo modulo, con la citazione | Se le evidenze cambiano si cambia un file e i suoi test |
| D10 | Gruppi: 16 (§3), con lombari, adduttori, addominali e avambracci | Risposta 1 di Francesco: addominali e avambracci servono agli esercizi personalizzati (crunch, plank, curl per i polsi), che Hevy e MacroFactor classificano così |
| D11 | Archivio alla versione 3; la mappa del catalogo è un campo obbligatorio di `CatalogExercise` in `src/data/catalog.ts` | Risposta 10. Versione: una scheda con il codice vecchio non cancella in silenzio i campi nuovi (§6.2). Campo: il compilatore impedisce un esercizio di catalogo senza muscoli. Un ADR per ciascuna |
| D12 | `rematore-al-cavo-basso` esce dal catalogo con un reindirizzamento a `rematore-seduto-al-cavo-basso`; la regola sugli ID diventa «mai cambiati né rimossi senza reindirizzamento» | Risposta 3: sono lo stesso esercizio (pulley basso, seduto). Il reindirizzamento vale per archivio, backup v2 e backup del PoC |
| D13 | `SessionExercise.variantOf` diventa `alternativeOf`, con nomi e testi collegati | Risposta 9. Libera «variante» per il senso proprio: il riferimento della variante si chiama `CustomExercise.variantOf` |
| D14 | Grafico: barre orizzontali per gruppo nel periodo; il tocco su una barra apre la linea settimanale del gruppo in un incremento successivo | Risposta 4; opzioni A e C in `opzioni-domande.md`, domanda 3 |
| D15 | Settimana da lunedì; quella in corso segnata come parziale | Risposta 5; `weekStart()` in `src/lib/archive/calendar.ts:16` |
| D16 | Ogni serie spuntata non di riscaldamento conta 1, drop e cedimento compresi (`countsForProgress`); il limite delle drop su più righe sta in un commento del modulo | Risposta 6; Havers et al. 2026 non dà un peso diverso per le drop |
| D17 | Editor nella pagina dell'esercizio. Da un esercizio di catalogo «Personalizza i muscoli» crea la variante, nome proposto «<nome> (personalizzato)»; la variante sostituisce l'originale nelle schede attive, con conferma e «Annulla»; lo storico resta com'è. Nella pagina della variante, il link «Basata su <originale>» | Risposta 7 |
| D18 | Esercizi senza muscoli: riga «Senza muscoli: N serie» sotto il grafico, con i link alle loro pagine | Risposta 8 |
| D19 | Il grafico mostra solo i gruppi con almeno una serie nel periodo | Risposta 1. Attacco e alternativa in §10.2, domanda A |
| D20 | La chiave di `localStorage` resta `workout-tracker.archive.v2` anche con la versione 3 | Decisione del piano, §6.2: cambiarla farebbe leggere e scrivere a una scheda vecchia un diario a parte |
| D21 | Periodi: «Settimana» (in corso, totale), «4 settimane» e «12 settimane» (media per settimana delle settimane concluse); predefinito «4 settimane» | Decisione del piano, §7.1; confermare in §10.2, domanda B |

## 3. Gruppi muscolari e mappa

### 3.1 Gruppi (D10)

Ordine fisso (`MUSCLE_GROUPS`), id in inglese, etichetta in italiano:

| id | Etichetta | | id | Etichetta |
| --- | --- | --- | --- | --- |
| `chest` | Petto | | `forearms` | Avambracci |
| `lats` | Dorsali | | `abs` | Addominali |
| `traps` | Trapezio | | `lower-back` | Lombari |
| `front-delts` | Deltoidi anteriori | | `glutes` | Glutei |
| `side-delts` | Deltoidi laterali | | `quads` | Quadricipiti |
| `rear-delts` | Deltoidi posteriori | | `hamstrings` | Femorali |
| `biceps` | Bicipiti | | `adductors` | Adduttori |
| `triceps` | Tricipiti | | `calves` | Polpacci |

Nessun raggruppamento superiore (spalle, braccia, gambe): con le barre le righe stanno in una schermata a 320 px
(`opzioni-domande.md`, domanda 1).

### 3.2 Mappa dei 42 esercizi

La mappa è `features/muscle-volume/research/mappa-43.md`, aggiornata con le risposte del 10 novembre:
- adduttori **principali** in squat, leg press e leg press a metà pedana (studi: Kubo 2019, Kinoshita 2026) e, per
  analogia segnata come tale, in Smith, goblet e hack squat;
- stabilizzatori isometrici non contati (confermato);
- riga 9 tolta (D12): gli esercizi del catalogo diventano 42.

**In attesa:** i 7 punti «Da controllare sul libro» di `mappa-43.md` (rematori, lat machine, spinte sopra la testa,
panca inclinata, pull-through, hyperextension, alzate). Francesco li verifica sul Delavier e manda l'esito con la
pagina. Finché non arriva vale la riga della tabella. L'esito è una modifica a `src/data/catalog.ts` e a
`mappa-43.md` (livello Small o Trivial), in qualsiasi momento dopo l'incremento 2.

## 4. Evidenze (cosa è scienza e cosa è opinione)

- **Dose-risposta:** più serie settimanali, più crescita, con rendimenti decrescenti. Schoenfeld, Ogborn, Krieger
  2017, *J Sports Sci*: meno di 5 serie +5,4%, 10 o più +9,8%.
- **Conteggio frazionario:** Pelland et al. 2026, *Sports Medicine* 56(2):481-505, DOI 10.1007/s40279-025-02344-w.
  Indiretto = 0,5 è il modello che si adatta meglio; l'incertezza cresce oltre 25-30 serie.
- **Intervalli osservati:** Baz-Valle et al. 2022, *J Hum Kinet*: 12-20 serie per uomini giovani allenati.
  Schoenfeld et al. 2019: fino a 45 serie.
- **Squat:** Kubo, Ikebukuro, Yata 2019, *Eur J Appl Physiol* 119:1933-1942 (risonanza magnetica, 10 settimane):
  squat profondo, grande gluteo +6,7%, adduttori +6,2%, femorali e retto femorale senza variazioni. Quindi:
  quadricipiti, glutei e adduttori principali, femorali non contati (§8, risposta 2). Leg press: Kinoshita et al. 2026,
  *Med Sci Sports Exerc* 58(7):1566-1580, DOI 10.1249/mss.0000000000003957 (grande gluteo +15,4%, grande adduttore
  +6,2%, vasti +4,4-6,2%). Gli altri studi della mappa sono in `features/muscle-volume/research/mappa-43.md`.
- **EMG:** non è un predittore validato della crescita (Vigotsky et al. 2022, *Sports Med*). Non usarla per
  decidere principali e secondari.
- **MEV/MAV/MRV di Renaissance Periodization:** stime da coach, non misure. Minor, Helms, Schepis 2020, *Strength
  & Conditioning Journal* 42(5):121-124, DOI 10.1519/SSC.0000000000000581: nessuna evidenza che l'MRV sia legato al
  volume ottimale; Israetel ha concesso il punto. Sono uno standard di fatto nelle app, non scientifico.
- **Libri:**
  - Delavier, *Guide des mouvements de musculation*, 6ª ed., Vigot 2021, ISBN 9782711424108: valido per
    l'anatomia funzionale (quali muscoli muovono quali articolazioni); le affermazioni su enfasi e isolamento non
    si usano.
  - Neumann, *Kinesiology of the Musculoskeletal System*, 4ª ed., Elsevier 2024, ISBN 9780323718592: il
    riferimento accademico, solo se serve una citazione per ogni azione articolare.
  - Schoenfeld, *Science and Development of Muscle Hypertrophy*, 3ª ed., Human Kinetics, ottobre 2026: per il
    modello di volume; per ora basta Pelland.
- **Aspetto legale (lettura delle norme, non parere legale):**
  - I fatti anatomici non sono protetti (TRIPS art. 9.2: la protezione riguarda le espressioni, non le idee). Lo
    sono testo e illustrazioni (L. 633/1941), e la raccolta: diritto sui generis sulle banche dati, art. 102-bis,
    estrazione della totalità o di una parte sostanziale.
  - La CGUE, BHB c. William Hill, C-203/02, non protegge l'investimento nella creazione dei dati.
  - In pratica: costruire la mappa con la regola e gli studi, usare il libro come controllo; non trascrivere le
    sue liste in blocco, non copiare descrizioni, non scansionare né ridisegnare da vicino le illustrazioni.

## 5. Competitor e richieste degli utenti

- **Hevy:**
  - Descrittivo: sagoma del corpo, serie per muscolo, distribuzione rispetto al mese precedente, nessuna zona.
  - Negli esercizi personalizzati ammette un principale e più secondari; 7 esercizi personalizzati nel piano
    gratuito.
  - In un thread, un commento con 14 voti lamenta che i secondari contano quanto i principali.
- **Zone colorate:**
  - Arvo (giallo/verde/rosso), GymPsycho, Steady, Push.
  - Boostcamp ha mappa di calore, radar e tabella con conteggio frazionario.
- **MacroFactor:** principale o secondario per muscolo con un tocco negli esercizi personalizzati.
- **Strongsplit:** chiedono più gruppi per esercizio e pesi regolabili (7 voti).
- **Strong:** grafici a pagamento.
- **wger:** gratuito e completo, ma pochi utenti (app Android circa 8.500), login obbligatorio, dati muscolari con
  errori.

URL delle pagine prodotto e delle bacheche (sigle [H1], [H2], [H3], [B1], [S1], [M1], [U1], [U2]): in testa a
`features/muscle-volume/research/opzioni-domande.md`. Il thread di Hevy con 14 voti e la pagina di MacroFactor sul
tocco principale e secondario non hanno un URL ritrovato. Nessuna decisione dipende solo da loro: D6 si regge
anche senza MacroFactor (nessuno chiede un limite, [U1] e [U2] chiedono più gruppi per esercizio).

## 6. Modello dati (verificato nel codice a `c220ee3`)

### 6.1 Tipi (`src/lib/archive/types.ts`)

```ts
export const MUSCLE_GROUPS = ['chest', 'lats', 'traps', 'front-delts', 'side-delts', 'rear-delts', 'biceps', 'triceps',
  'forearms', 'abs', 'lower-back', 'glutes', 'quads', 'hamstrings', 'adductors', 'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
export interface Muscles { primary: MuscleGroup[]; secondary: MuscleGroup[] }   // nessun gruppo in entrambe

CatalogExercise.muscles: Muscles             // obbligatorio (incremento 2)
CustomExercise { id; name; muscles: Muscles; variantOf: string | null }   // variantOf = esercizio di catalogo da cui deriva
SessionExercise.alternativeOf: string | null  // era variantOf (D13)
Archive.version: 3
```

- `ARCHIVE_KEY` resta `'workout-tracker.archive.v2'` (D20, §6.2); il commento accanto dice perché.
- Etichette italiane dei gruppi e pesi del conteggio stanno nel modulo del volume (§6.4), non in `types.ts`.
- `LIMITS` non cambia: le liste dei muscoli hanno al massimo `MUSCLE_GROUPS.length` voci.

### 6.2 Versione 3 e migrazione

**Fatti nel codice:**
- la validazione ricostruisce ogni oggetto campo per campo, quindi perde i campi che non conosce: `catalog()` in
  `src/lib/archive/validation.ts:166-178` tiene solo `id` e `name`, `sessionExercise()` in `validation.ts:133-146`
  solo i campi elencati;
- la stessa funzione serve al caricamento (`src/lib/archive/repository.ts:139`) e all'import (`src/lib/archive/backup.ts:48`);
- oggi la validazione rifiuta ogni versione diversa da 2 (`validation.ts:219`) e il backup sceglie il formato da
  `version === 2` (`backup.ts:46`);
- un archivio che non si valida diventa `unreadable`, senza sovrascrivere nulla, e le scritture sono bloccate
  (`repository.ts:139-153`);
- il service worker si aggiorna da solo (`skipWaiting`, `clientsClaim`, `src/integrations/service-worker.ts:32-33`), ma
  una scheda già aperta tiene il codice vecchio fino al ricaricamento.

**Perché la versione 3 (D11):** restando a 2, una scheda con il codice vecchio rilegge l'archivio («Ricarica» dopo un
conflitto, `repository.ts:157`), toglie in silenzio muscoli e `variantOf` dei personalizzati e al salvataggio
successivo li cancella. Con la versione 3 il codice vecchio vede «Formato non riconosciuto» e non scrive: nessuna
perdita, solo un messaggio fino al ricaricamento.

**Chiave invariata (D20):**

| | A. Chiave invariata, `version: 3` dentro | B. Chiave nuova `…archive.v3` |
| --- | --- | --- |
| Pro | Il codice vecchio non legge né scrive (stato `unreadable`); un solo diario | Nome della chiave coerente |
| Contro | Il nome della chiave non dice la versione (lo dice un commento) | Una scheda vecchia continua a leggere e scrivere la chiave v2: due diari che divergono. Il codice nuovo deve leggere due chiavi e decidere quale vince |

Utenti e competitor: non pertinenti (dettaglio interno; nessuna fonte). Scelta: A.

**Regole della migrazione** (in `validateArchive`, che accetta `version` 2 e 3 e restituisce sempre 3):
1. **v2, sessioni:** `alternativeOf` prende il valore di `variantOf`. In v3 si legge `alternativeOf`.
2. **Personalizzati senza `muscles` o senza `variantOf`** (tutti i v2): muscoli vuoti, `variantOf: null`.
3. **Muscoli in v3:** ogni id deve stare in `MUSCLE_GROUPS`, senza doppioni e senza un gruppo in entrambe le liste;
   altrimenti `ArchiveError` con un messaggio in italiano, come il resto della validazione.
4. **Reindirizzamenti (D12)**, dopo la ricostruzione e su ogni archivio, v2 o v3 (l'operazione è idempotente, così
   copre anche una scheda vecchia che riscrive un v2 dopo il deploy). Per ogni coppia di `EXERCISE_REDIRECTS`:
   - voci delle schede: `exerciseId` e `alternatives`; nelle alternative niente doppioni e niente alternativa uguale
     all'esercizio della voce (regola già in `mergeExercise`, `src/lib/archive/catalog.ts:175-176`);
   - esercizi delle sessioni: `exerciseId` e `alternativeOf`; se diventano uguali, `alternativeOf: null` (regola già
     in `catalog.ts:162-164`);
   - `variantOf` dei personalizzati.
5. **Backup:** `readBackup` accetta `version` 2 e 3 (`backup.ts:46`). `BackupFormat` passa da `'v2'` a `'app'`
   (`backup.ts:12`, `backup.ts:48`, `backup.ts:126`, `src/components/data/ImportFlow.svelte:66`, `ImportFlow.svelte:215`):
   con due versioni il nome «v2» direbbe il falso. `exportArchive` scrive la versione 3.
6. **PoC:** il reindirizzamento si applica a `e.varianteId` e `e.catalogoId` appena letti
   (`src/lib/archive/poc-import.ts:106`, `poc-import.ts:121`), **prima** del ramo che crea un personalizzato per un id
   sconosciuto (`poc-import.ts:116`): dopo, l'id tolto diventerebbe un personalizzato. Le schede del PoC vengono da
   `STARTER_ROUTINES`, corrette alla fonte.

**Riuso:** il riscrittore di sessioni e schede di `mergeExercise` (`catalog.ts:155-183`) si estrae in due funzioni
interne a `src/lib/archive/catalog.ts` che ricevono una mappa `id → id`; le usano `mergeExercise`, i
reindirizzamenti e la variante (§6.5). `validation.ts` le importa da `catalog.ts` (nessun ciclo: `catalog.ts` importa
solo `src/data/catalog.ts` e `types.ts`, `catalog.ts:4-5`).

### 6.3 Catalogo (`src/data/catalog.ts`)

- **Mappa (D11, incremento 2):** `muscles` obbligatorio su ognuna delle 42 voci, con un commento sulla stessa voce che
  dice la fonte: lo studio (sigla di `mappa-43.md`, per esempio «Kubo 2019») o «azione articolare», e «analogia» dove
  lo è. Il motivo completo resta in `mappa-43.md`, che si archivia con la SPEC.
- **Rematore (D12, incremento 1):**
  - si toglie la voce `rematore-al-cavo-basso` (`src/data/catalog.ts:98-108`);
  - `rematore-seduto-al-cavo-basso` (`catalog.ts:417-427`) prende gli alias «Pulley basso», «Low cable row» e
    «Rematore al cavo basso» (il vecchio nome: senza, chi lo scrive a mano crea un personalizzato, `ensureExercise`,
    `src/lib/archive/catalog.ts:118-123`; domanda D in §10.2);
  - nuovo `EXERCISE_REDIRECTS: Readonly<Record<string, string>> = { 'rematore-al-cavo-basso': 'rematore-seduto-al-cavo-basso' }`
    accanto a `BASE_CATALOG`, con un commento (data, motivo, «mai rimuovere una voce di qui»);
  - commento in testa a `catalog.ts:2-3`: «mai cambiati né rimossi senza un reindirizzamento in `EXERCISE_REDIRECTS`»;
  - `src/data/starter-routines.ts:54`: l'alternativa diventa `rematore-seduto-al-cavo-basso`.
- **Test degli ID** (`src/data/seed-data.test.ts:5-16`): `POC_IDS` resta l'elenco permanente; il test diventa «ogni id
  di `POC_IDS` è una chiave di `BASE_CATALOG` oppure di `EXERCISE_REDIRECTS`; ogni destinazione è in `BASE_CATALOG`;
  nessuna chiave di `EXERCISE_REDIRECTS` è in `BASE_CATALOG`; nessuna catena (una destinazione non è a sua volta una
  chiave)». Le chiavi di `BASE_CATALOG` sono `POC_IDS` meno le chiavi reindirizzate, nello stesso ordine.

### 6.4 Modulo del volume (D2, D9, D15, D16)

Un modulo nuovo, src/lib/archive/muscles.ts, esportato da `src/lib/archive/index.ts`:

```ts
export const MUSCLE_LABELS: Record<MuscleGroup, string>;     // §3.1
export const PRIMARY_SETS = 1;                               // Pelland et al. 2026, DOI 10.1007/s40279-025-02344-w
export const SECONDARY_SETS = 0.5;                           // idem
/** null = senza muscoli: esercizio sconosciuto, o personalizzato con entrambe le liste vuote */
export function exerciseMuscles(archive: Pick<Archive, 'catalog'>, exerciseId: string): Muscles | null;
export interface WeekVolume { week: string; groups: Partial<Record<MuscleGroup, number>>; unclassified: Record<string, number> }
/** una voce per settimana (lunedì, ora locale) con almeno una serie contata, in ordine di data */
export function weeklyVolume(archive: Pick<Archive, 'sessions' | 'catalog'>): WeekVolume[];
export type VolumePeriod = 'week' | '4w' | '12w';
export interface PeriodVolume {
  groups: { group: MuscleGroup; sets: number }[];             // solo > 0, decrescenti, a pari valore nell'ordine di MUSCLE_GROUPS
  unclassified: { exerciseId: string; sets: number }[];       // decrescenti
  weeks: number;                                              // divisore; 0 = nessuna settimana conclusa nel periodo
  partial: boolean;                                           // true solo con 'week'
}
export function periodVolume(weeks: readonly WeekVolume[], period: VolumePeriod, today: string): PeriodVolume;
```

**Regole:**
- **Cosa conta:** sessioni concluse (`end !== null`, come `progress.ts:87`); serie con `countsForProgress()`
  (`src/lib/archive/progress.ts:34-36`: spuntata e non di riscaldamento). Normali, drop e cedimento valgono 1.
- **Commento obbligatorio nel modulo (D16):** ogni drop è una riga a sé (`SET_TYPES`, `types.ts:10`), quindi una drop
  set con due scalate vale 3 serie: probabilmente sovrastima; Havers et al. 2026 non dà un peso diverso.
- **Esercizio:** quello fatto davvero (`exerciseId`); `alternativeOf` non conta.
- **Pesi:** ogni principale riceve `n × PRIMARY_SETS`, ogni secondario `n × SECONDARY_SETS`, con n serie contate.
  Senza muscoli: n serie in `unclassified[exerciseId]`. Un esercizio con soli secondari non è «senza muscoli».
- **Settimana:** `weekStart(session.date)` (`calendar.ts:16`, lunedì).
- **Periodo:**
  - `'week'`: la settimana di `weekStart(today)`, totali senza media, `weeks: 1`, `partial: true`;
  - `'4w'` e `'12w'`: le 4 o 12 settimane di calendario prima di quella in corso (esclusa); valori = somma / `weeks`;
    `weeks` = quante di quelle settimane cadono dalla prima settimana di `weeks[0]` in poi (chi usa l'app da 2
    settimane divide per 2, non per 12); le settimane senza allenamenti nel mezzo contano come zero; nessun
    arrotondamento nel modulo.
- **Funzioni pure**, nessuna lettura dell'orologio: `today` è un parametro (`YYYY-MM-DD`).

### 6.5 Varianti ed editor (D6, D7, D17), in `src/lib/archive/catalog.ts`

```ts
/** Prima libera tra «<nome> (personalizzato)», «<nome> (personalizzato 2)», … (findByName, nome e alias) */
export function proposeVariantName(archive: Archive, baseId: string): string;
/** Quante schede attive (archived: false) usano baseId come esercizio o alternativa */
export function variantImpact(archive: Pick<Archive, 'routines'>, baseId: string): number;
/** Crea il personalizzato { id: customExerciseId(nome), name, muscles: copia di quelli di baseId, variantOf: baseId }
 *  e sostituisce baseId con il nuovo id nelle schede attive (esercizio e alternative). Sessioni (anche quella in
 *  corso), schede archiviate e catalogo di base non cambiano. Errori: baseId non di catalogo, nome non valido o già
 *  usato, limite dei personalizzati. */
export function createVariant(archive: Archive, baseId: string, name: string): { archive: Archive; id: string; routines: number };
/** Muscoli di un personalizzato; errore su un esercizio di catalogo (D7) */
export function setCustomMuscles(archive: Archive, id: string, muscles: Muscles): Archive;
```

- **Annulla della variante** = `mergeExercise(archive, idVariante, baseId)` (`catalog.ts:152`): la variante appena
  creata compare solo nelle schede appena cambiate, quindi l'unione è l'inverso esatto. Un test lo verifica (§9,
  incremento 4). Nessuna funzione nuova.
- `ensureExercise` (`catalog.ts:118`) crea i personalizzati con `muscles` vuoti e `variantOf: null`.
- **Cambiare i muscoli di un personalizzato cambia anche il conteggio delle settimane passate:** i muscoli sono una
  proprietà dell'esercizio, non della sessione. È voluto: serve a sistemare gli esercizi «Senza muscoli» (D18).

### 6.6 Terminologia nel codice (D13, incremento 1)

- **Si rinomina:** `SessionExercise.variantOf` → `alternativeOf` e i nomi collegati: `VariantSheet.svelte` →
  AlternativeSheet.svelte (`git mv`), `VariantChoice` → `AlternativeChoice`, in `src/components/workout/Workout.svelte`
  `variantFor`, `variantOpen`, `openVariant`, `pickVariant`, `variantExercise`, `variantEntry` e l'azione `'variant'`
  (`Workout.svelte:330`, `Workout.svelte:342`); i commenti e i nomi dei test che dicono «variante» per l'alternativa.
- **Testi visibili:** `src/components/history/ProgressPage.svelte:29` («Le varianti hanno ciascuna i loro progressi»
  → «Ogni esercizio ha i suoi progressi, anche alternative e varianti»); `src/components/kit/KitOverlays.svelte:59`,
  `KitOverlays.svelte:77`, `KitOverlays.svelte:120` («Cambia variante» → «Cambia esercizio», come nell'app,
  `Workout.svelte:757`; «Usa questa variante» → «Usa questa alternativa»).
- **Documenti:** `PRODUCT.md:36` (lessico: «alternativa» e «variante» con i due sensi) e `PRODUCT.md:51` («precedente»,
  record e grafici sono per esercizio: alternative e varianti hanno i loro); `README.md:3`, `README.md:19`,
  `README.md:49`; `docs/ARCHITECTURE.md:38`, `ARCHITECTURE.md:41`, `ARCHITECTURE.md:88` e la riga del catalogo
  («mai cambiati né rimossi»); i brief `.impeccable/surfaces/route-workout.md` (righe 31, 37, 51, 54, 55) e
  `.impeccable/surfaces/route-history.md` (righe 23 e 34), e ogni altra riga che dice «variante» per l'alternativa.
- **Non si tocca:** la prop `variant` dei componenti e i commenti sulla «variante compatta» (`SegmentedControl.svelte:85`,
  `src/pages/_kit.astro:44`), `font-variant-numeric`, i campi del formato del PoC (`varianteId`, `variante` in
  `poc-import.ts`: sono il formato del file), `types.ts:20` (varianti di nome degli alias), i file di
  `tests/fixtures/` (sola lettura: sono dati v2 e servono proprio a provare la migrazione), `docs/archive/` e il
  CHANGELOG.
- **AGENTS.md, Invarianti:** «ID del catalogo base … mai cambiati né rimossi» diventa «mai cambiati né rimossi senza un
  reindirizzamento in `EXERCISE_REDIRECTS`». AGENTS.md è a 120 righe, il massimo di `scripts/docs-check.sh`: la
  modifica resta nella stessa riga.

## 7. Interfaccia

Prima di toccarla: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/route-history.md`,
`.claude/skills/impeccable/reference/craft-floor.md`; per il grafico la skill `dataviz`. Solo token di `DESIGN.md`,
icone Lucide. Componenti nuovi anche in `/kit`.

### 7.1 Progressi (`src/components/history/ProgressPage.svelte`), incremento 5

- **In cima**, sopra l'elenco esercizi (`ProgressPage.svelte:28-44`), una sezione «Serie per muscolo» con un
  `SegmentedControl` compatto del periodo: «Settimana», «4 settimane» (predefinito), «12 settimane».
- **Barre orizzontali** (D14), una per gruppo con almeno una serie (D19), in ordine decrescente: etichetta, valore come
  testo e barra proporzionale al massimo del periodo. HTML e CSS, nessuna libreria. Valore con al più un decimale in
  formato italiano («7,5»; «12» senza decimali).
- **Sotto le barre, una riga di lettura:** con «Settimana» «Settimana in corso, fino a oggi»; con le medie «Media per
  settimana, ultime N settimane concluse» (N = `weeks`). Con `weeks: 0` al posto delle barre «Serve almeno una
  settimana conclusa: intanto guarda la settimana in corso».
- **Senza muscoli (D18):** se `unclassified` non è vuoto, la riga «Senza muscoli: N serie» e sotto i nomi degli
  esercizi, ciascuno un link alla sua pagina (`/exercise?id=`, con `appUrl()`).
- **Nessuna serie nel periodo:** «Nessuna serie in questo periodo».
- **Periodi (D21):**

| | A. Settimana / 4 / 12 settimane, medie | B. Settimana / mese / anno, totali (come Hevy) | C. 7 / 30 / 90 giorni mobili (come Boostcamp) |
| --- | --- | --- | --- |
| Pro | Il numero si confronta con gli intervalli settimanali di §4 (12-20 serie, Baz-Valle 2022); stesse settimane da lunedì delle schede | Totali semplici da capire | Mai «basso» il lunedì |
| Contro | Una media va spiegata (riga di lettura) | Un totale di un mese non si confronta con una soglia settimanale | Non coincide con la settimana delle schede (D15) |

  Utenti: nessuna richiesta trovata. Competitor: Hevy settimana, mese o anno (`opzioni-domande.md`, fonte [H1]);
  Boostcamp 7, 30, 90 giorni, un anno o tutto, confrontati con il periodo precedente ([B1]). Scelta: A.

### 7.2 Pagina dell'esercizio (`src/components/history/ExerciseProgress.svelte`), incremento 4

- **Sezione «Muscoli»**, l'ultima della pagina, visibile anche senza storico (oggi la pagina senza storico mostra solo
  un messaggio, `ExerciseProgress.svelte:220`): la variante appena creata non ha storico.
- **Esercizio di catalogo:** «Principali: …» e «Secondari: …» in sola lettura (con «nessuno» se vuoti) e il pulsante
  «Personalizza i muscoli». Il pulsante apre un `BottomSheet` con:
  - il campo del nome, precompilato con `proposeVariantName`;
  - il testo delle conseguenze: «Crea un esercizio tuo con i muscoli di «<nome>», da modificare. Lo sostituisce in N
    schede attive; gli allenamenti fatti restano su «<nome>», e il nuovo esercizio parte senza record né grafico»
    (senza la frase sulle schede se N = 0);
  - il pulsante «Crea», che è la conferma (D17; domanda C in §10.2).
  Dopo «Crea»: `createVariant`, poi `navigate()` alla pagina della variante con `&created=1`; lì un `Toast` «Creato
  «…»» (più «, sostituito in N schede» se N > 0) con «Annulla» = `mergeExercise(variante → originale)` e ritorno alla
  pagina dell'originale. Il parametro si toglie con `history.replaceState` dopo aver mostrato l'avviso, così un
  ricaricamento non lo ripete. Nome già usato o non valido: errore sotto il campo, il foglio resta aperto.
- **Esercizio personalizzato:** l'editor: un pulsante per ogni gruppo (§3.1, nell'ordine fisso); il tocco gira
  nessuno → principale → secondario → nessuno (D6, come MacroFactor). Lo stato si legge come testo, non solo dal colore
  (craft floor), e il nome accessibile lo dice («Petto, principale»). Ogni tocco salva (`setCustomMuscles`), come
  `LiveField`. Senza muscoli, sopra l'editor: «Scegli i muscoli: finché sono vuoti, le serie finiscono in «Senza
  muscoli» in Progressi».
- **Variante** (`variantOf` non nullo): in testa alla sezione il link «Basata su <originale>» alla pagina
  dell'originale.

### 7.3 Linea settimanale di un gruppo, incremento 6

- Il tocco su una barra (ogni barra diventa un pulsante, con nome accessibile «Petto: 7,5 serie, apri l'andamento»)
  apre un `BottomSheet` «<Gruppo>: serie per settimana» con `ProgressChart` (`src/components/history/ProgressChart.svelte`,
  punti `{ date, value }`, `ProgressChart.svelte:12-33`): un punto per settimana, le ultime 12 più quella in corso, le
  settimane senza serie a zero dalla prima settimana con dati in poi; la settimana in corso ha la nota «parziale».
- Logica: una funzione pura in src/lib/archive/muscles.ts sopra `weeklyVolume`, con test.

## 8. Risposte di Francesco (10 novembre 2026)

1. **Gruppi:** lombari e adduttori sì; anche addominali e avambracci, per i personalizzati (crunch, plank, curl per i
   polsi; Hevy e MacroFactor li hanno). Il grafico mostra solo i gruppi con almeno una serie nel periodo. → D10, D19.
2. **Mappa:** i 7 punti da controllare li verifica lui sul Delavier, con la pagina: intanto in attesa, non bloccano.
   Adduttori principali nello squat profondo e nella leg press, perché comanda lo studio (Kubo 2019: adduttori +6,2%
   contro glutei +6,7%; Kinoshita 2026: grande adduttore +6,2% contro vasti +4,4-6,2%): un muscolo che cresce quanto i
   principali non è secondario. Stessa scelta per analogia su Smith, goblet e hack squat, segnata come analogia.
   Stabilizzatori isometrici non contati: confermato. → §3.2.
3. **Rematori:** `rematore-al-cavo-basso` e `rematore-seduto-al-cavo-basso` sono lo stesso esercizio. Si toglie il
   primo con un reindirizzamento nella migrazione alla versione 3; sessioni e schede passano al secondo, che prende gli
   alias «Pulley basso» e «Low cable row». L'import dei backup vecchi e del PoC applica lo stesso reindirizzamento. La
   regola sugli ID diventa «mai rimossi senza reindirizzamento»: nell'ADR della versione 3 e in AGENTS.md. Sul suo
   telefono i dati sono già uniti. → D12.
4. **Grafico:** barre per gruppo nel periodo adesso; il tocco che apre la linea settimanale in un incremento
   successivo. → D14.
5. **Settimana** da lunedì, quella in corso segnata come parziale. → D15.
6. **Drop e cedimento:** ogni serie spuntata non di riscaldamento conta 1; il limite delle drop su più righe come
   commento nel modulo. → D16.
7. **Editor** nella pagina dell'esercizio; dal catalogo «Personalizza i muscoli» crea la variante con nome proposto
   «… (personalizzato)», che sostituisce l'originale nelle schede attive con conferma e «Annulla»; lo storico resta.
   Record e grafico della variante ripartono da zero: accettato. Nella variante il link «basata su <originale>». → D17.
8. **Senza muscoli:** riga «Senza muscoli: N serie» con i link alle pagine. → D18.
9. **`variantOf` → `alternativeOf`** nella stessa migrazione, con nomi e testi collegati. → D13.
10. **Modello:** archivio alla versione 3, mappa come campo obbligatorio in `src/data/catalog.ts`; un ADR per ciascuna
    decisione. → D11.

## 9. Incrementi

Un incremento per sessione, in quest'ordine. L'`INC-XXX` si legge dalla testa del CHANGELOG all'inizio di ognuno
(`grep -m1 '^## INC-' CHANGELOG.md`), mai assegnato prima. Ogni incremento chiude con il gate completo di AGENTS.md;
i numeri degli ADR sono i prossimi liberi in `docs/adr/` (oggi l'ultimo è ADR-008). Gli e2e nuovi usano percorsi
relativi e il nome comincia con l'ID della storia; le storie nuove vanno in `docs/archive/restyling/USER-STORIES.md`,
come US-42.

**Ordine:** l'editor (4) viene prima del grafico (5), così quando il grafico va online i link di «Senza muscoli»
portano a una pagina dove i muscoli si sistemano.

### Incremento 1: archivio v3, rematore e terminologia (D11 per la versione, D12, D13, D20)

**Fatto in INC-021 (ADR-009).** Una aggiunta: nell'import del PoC anche gli alias contano come nome noto, altrimenti il
vecchio nome «Rematore al cavo basso» finiva nelle note come nome cambiato a mano.

**Ambito:** §6.1 tranne `CatalogExercise.muscles`, §6.2, §6.3 parte «Rematore» e «Test degli ID», §6.6.
`MUSCLE_GROUPS`, `MuscleGroup` e `Muscles` entrano qui perché lo schema v3 dei personalizzati deve essere completo
al primo push: ogni push va in produzione, e un campo aggiunto dopo senza versione nuova riaprirebbe il problema
di §6.2.

**Criteri (ognuno con un test):**
1. `validateArchive` di un v2 restituisce `version: 3`; `alternativeOf` ha il valore di `variantOf`; i personalizzati
   hanno muscoli vuoti e `variantOf: null`.
2. Un archivio v3 passa da `exportArchive` a `readBackup` e torna uguale (`toEqual`).
3. `version` 1, 4 o assente: `ArchiveError` «Formato dell’archivio non riconosciuto.» (il messaggio di `validation.ts:219`).
4. Muscoli v3 non validi (gruppo sconosciuto, doppione, gruppo in entrambe le liste): `ArchiveError`.
5. Con `tests/fixtures/workout-tracker-2026-11-05.json`: dopo la validazione `JSON.stringify(archivio)` non contiene
   `rematore-al-cavo-basso`; `exerciseHistory(archivio, 'rematore-seduto-al-cavo-basso')` ha 5 punti (oggi 2 con
   l'id seduto e 3 con l'altro, verificato sul file il 10 novembre); nella «Scheda A» l'alternativa diventa
   `rematore-seduto-al-cavo-basso`.
6. Doppioni dopo il reindirizzamento: voce con `exerciseId` seduto e alternative `[al-cavo-basso, seduto]` →
   alternative `[]`; esercizio di sessione con `exerciseId` al-cavo-basso e `alternativeOf` seduto → `alternativeOf: null`.
7. Idempotenza: `validateArchive(validateArchive(x))` è uguale a `validateArchive(x)`.
8. PoC con `catalogoId: 'rematore-al-cavo-basso'`: l'esercizio di sessione è `rematore-seduto-al-cavo-basso` e il
   catalogo del risultato non ha personalizzati nuovi.
9. `src/data/seed-data.test.ts` con le regole di §6.3.
10. `findByName(archivio, 'Rematore al cavo basso')` e `findByName(archivio, 'Pulley basso')` danno
    `rematore-seduto-al-cavo-basso`.
11. `grep -rn "variantOf" src tests/e2e` trova solo il campo nuovo `CustomExercise.variantOf` (tipo, `catalog()` di
    `validation.ts`, `ensureExercise`, reindirizzamenti) e la lettura v2 di `sessionExercise()`; i fixture restano v2
    e non si cercano. `tests/e2e/helpers.ts` scrive archivi v3;
    `grep -rniE "varian(te|ti)" src` trova solo i casi «Non si tocca» di §6.6.
12. Gli e2e esistenti passano: oggi usano l'id tolto `src/lib/archive/workout.test.ts:382`, `workout.test.ts:387`,
    `tests/e2e/us-37-complete-exercise.spec.ts:96` e `tests/e2e/us-07-us-10-routines.spec.ts:63`, che passano a
    `rematore-seduto-al-cavo-basso` (o a un altro esercizio, se la prova ne vuole uno senza storico).

**Documenti:** ADR «Archivio v3: versione, chiave invariata, `alternativeOf`, reindirizzamento degli ID» (con la regola
«mai rimossi senza reindirizzamento»); AGENTS.md, Invarianti (§6.6); `docs/ARCHITECTURE.md` (archivio v3, riga della
chiave, `EXERCISE_REDIRECTS`, AlternativeSheet); `README.md:49`.

### Incremento 2: mappa del catalogo (D4, D11 per il campo)

**Fatto in INC-022 (ADR-010, ADR-011).** Valori identici alla tabella di `mappa-43.md` (controllo meccanico, 42 su 42);
esito del Delavier non ancora arrivato.

**Ambito:** `CatalogExercise.muscles` obbligatorio; i 42 valori da `mappa-43.md` con il commento della fonte (§6.3).
Se l'esito del Delavier (§3.2) è arrivato, prima si aggiorna `mappa-43.md`.

**Criteri:**
1. `npm run check` fallisce se una voce di `BASE_CATALOG` non ha `muscles` (lo garantisce il tipo; nessun test).
2. Test in `seed-data.test.ts`: ogni voce ha almeno un principale e nessun gruppo in entrambe le liste.
3. Test che blocca le righe decise dagli studi: squat, leg press, leg press a metà pedana con principali
   quadricipiti, glutei, adduttori e nessun femorale; hip thrust con i soli glutei (Plotkin 2023); leg extension con i
   soli quadricipiti (Kinoshita 2026).

**Documenti:** ADR «Mappa come campo obbligatorio del catalogo» (D11); ADR «Fonte della mappa: studi di crescita, poi
azione articolare» (D4, adduttori, stabilizzatori). `docs/ARCHITECTURE.md`, riga di `src/data/`.

### Incremento 3: logica del volume (D2, D9, D15, D16)

**Ambito:** src/lib/archive/muscles.ts (§6.4) e il suo test, esportati da `src/lib/archive/index.ts`. Nessuna UI.

**Criteri (test in src/lib/archive/muscles.test.ts):**
1. Un principale riceve 1 per serie, un secondario 0,5; con due principali ciascuno riceve 1.
2. Riscaldamento e serie non spuntate non contano; drop e cedimento contano 1.
3. La sessione in corso non conta.
4. Personalizzato con muscoli: contato con i suoi; senza muscoli o id sconosciuto: in `unclassified`; con soli
   secondari: contato, non in `unclassified`.
5. Conta `exerciseId`, non `alternativeOf`.
6. Domenica 8 novembre 2026 sta nella settimana del 2 novembre, lunedì 9 in quella del 9.
7. `'week'`: totali della settimana in corso, `partial: true`. `'4w'`: esclude la settimana in corso; con dati da 2
   settimane concluse divide per 2; una settimana vuota in mezzo conta zero; nessuna settimana conclusa: `weeks: 0`.
8. Gruppi a zero assenti; ordine decrescente, a pari valore quello di `MUSCLE_GROUPS`.

**Documenti:** ADR «Conteggio del volume per muscolo» (D2 con Pelland 2026, D16, D15). `docs/ARCHITECTURE.md`, riga
del modulo.

### Incremento 4: muscoli nella pagina dell'esercizio e varianti (US-43, US-44; D6, D7, D17)

**Storie:**
- **US-43** Vedere i muscoli di un esercizio e scegliere quelli di un esercizio personalizzato.
- **US-44** Personalizzare i muscoli di un esercizio di catalogo creando una variante, che lo sostituisce nelle schede
  attive.

**Ambito:** §6.5 e §7.2. Componente nuovo dell'editor in `src/components/history/` e in `/kit`.

**Criteri:**
1. Test di `catalog.test.ts`: `createVariant` copia i muscoli, imposta `variantOf`, sostituisce l'originale in esercizio
   e alternative delle schede attive, non tocca schede archiviate né sessioni (anche quella in corso), restituisce il
   numero di schede uguale a `variantImpact`; errore su un personalizzato, su un nome già usato e oltre il limite.
2. Test: `mergeExercise(createVariant(a, base, nome).archive, id, base)` è uguale ad `a` (l'«Annulla»).
3. Test: `proposeVariantName` dà «Squat bilanciere (personalizzato)», poi «… (personalizzato 2)» se il primo esiste.
4. Test: `setCustomMuscles` rifiuta un esercizio di catalogo.
5. e2e `US-43 …`: in un personalizzato i tocchi girano nessuno → principale → secondario → nessuno, lo stato si legge
   nel nome accessibile e resta dopo un ricaricamento; un esercizio di catalogo mostra i muscoli in sola lettura.
6. e2e `US-44 …`: da Squat bilanciere, «Personalizza i muscoli» → nome proposto → «Crea» → pagina della variante con
   l'avviso; la scheda attiva usa la variante, quella archiviata no; «Basata su Squat bilanciere» porta all'originale;
   «Annulla» riporta alla pagina dell'originale con la scheda com'era.
7. Pagine guardate a 390×844 e 320×568, chiaro e scuro.

**Documenti:** ADR «Variante invece di modificare il catalogo» (D7, D17). Brief `route-history`, `docs/ARCHITECTURE.md`,
US-43 e US-44 in USER-STORIES.

### Incremento 5: serie per muscolo in Progressi (US-45; D8, D14, D18, D19, D21)

**Storia:** **US-45** Vedere quante serie ha ricevuto ogni gruppo muscolare nella settimana o, in media, nelle ultime
4 o 12 settimane.

**Ambito:** §7.1. Componente nuovo delle barre in `src/components/history/` e in `/kit`.

**Criteri:**
1. e2e `US-45 …` con un archivio preparato: solo i gruppi con serie, in ordine decrescente, con i valori attesi
   (anche un 0,5 da un secondario); il cambio di periodo cambia valori e riga di lettura; «Settimana» dice «fino a oggi».
2. e2e: un personalizzato senza muscoli dà «Senza muscoli: N serie» con il link alla sua pagina, che si apre.
3. e2e: archivio con soli allenamenti di questa settimana: con «4 settimane» il messaggio di `weeks: 0`.
4. Pagine guardate a 390×844 e 320×568, chiaro e scuro; i valori si leggono come testo.

**Documenti:** brief `route-history`, `docs/ARCHITECTURE.md`, US-45. ADR: nessuno se si segue la SPEC.

### Incremento 6: linea settimanale di un gruppo (US-46), chiude la feature

**Storia:** **US-46** Toccare un gruppo nel grafico e vederne le serie settimana per settimana.

**Ambito:** §7.3.

**Criteri:**
1. Test della funzione: 13 punti (12 concluse più quella in corso, con la nota), zeri nelle settimane vuote, nessun
   punto prima della prima settimana con dati.
2. e2e `US-46 …`: il tocco su una barra apre il foglio con il grafico del gruppo; la barra ha il nome accessibile di §7.3.

**Chiusura della feature (AGENTS.md):** questa SPEC in `docs/archive/features/` con il nome
INC-<chiusura>_muscle-volume.md, insieme a `research/` se serve come riferimento, cancellazione di `features/muscle-volume/`,
aggiornamento di `docs/PROJECT.md`.

## 10. Attacco al piano (AGENTS.md, regola 9)

### 10.1 Buchi trovati e chiusi nella SPEC

| Buco | Cosa si rompeva | Chiuso in |
| --- | --- | --- |
| Chiave di `localStorage` con «v2» nel nome | Con una chiave nuova, una scheda vecchia avrebbe tenuto un diario a parte | D20, §6.2 |
| Reindirizzamento solo «nella migrazione» | Una scheda vecchia che riscrive un v2 dopo il deploy rimetterebbe l'id tolto | §6.2, regola 4: su ogni validazione, idempotente |
| PoC: id sconosciuto diventa personalizzato (`poc-import.ts:116`) | Il rematore tolto sarebbe rinato come esercizio personalizzato | §6.2, regola 6 |
| Doppioni dopo il reindirizzamento | Alternative ripetute, `alternativeOf` uguale all'esercizio | §6.2, regola 4; criterio 1.6 |
| Vecchio nome «Rematore al cavo basso» | Scritto a mano avrebbe creato un personalizzato | §6.3; domanda D |
| `seed-data.test.ts` blocca `rematore-al-cavo-basso` | Il test fallisce, o qualcuno lo cancella e perde la protezione degli ID | §6.3, «Test degli ID» |
| Schema v3 diviso tra incrementi | Ogni push va in produzione: un campo dopo il primo push senza versione nuova si perde nelle schede vecchie | Incremento 1, tutto lo schema dei personalizzati |
| Media «per settimana» non definita | Divisore arbitrario; un utente nuovo vedrebbe valori diluiti su 12 settimane | §6.4, «Periodo»; D21 |
| Avviso con «Annulla» dopo la navigazione | Il `Toast` vive nell'isola, che si ricrea a ogni pagina | §7.2, `&created=1` |
| «Annulla» della variante | Serviva codice di ripristino | §6.5: `mergeExercise` è l'inverso esatto, con un test |
| Nome della variante già usato | Il secondo «Personalizza» avrebbe dato errore | `proposeVariantName`, §6.5 |
| Pagina dell'esercizio senza storico | La variante appena creata avrebbe mostrato solo «nessun dato», senza muscoli | §7.2, sezione sempre visibile |
| Muscoli di un personalizzato cambiati | Cambiano le settimane passate | §6.5: voluto, scritto |
| AGENTS.md a 120 righe | Una riga in più fa fallire `npm run docs:check` | §6.6 |
| «variante» in senso tecnico (prop `variant`, PoC) | Una sostituzione cieca avrebbe rotto componenti e import del PoC | §6.6, «Non si tocca» |

### 10.2 Domande a Francesco (un solo blocco; ognuna ha un valore predefinito e nessuna blocca l'incremento 1)

**A. Gruppi a zero (D19).** Mostrando solo i gruppi con serie, un gruppo mai allenato sparisce: il grafico non dice
«polpacci: 0», cioè proprio «cosa trascuro» (§1).
- Utenti: nessuna richiesta trovata.
- Competitor: Hevy mostra la sagoma con tutti i muscoli, anche quelli senza serie ([H2]); Boostcamp la mappa di
  calore di tutto il corpo ([B1]).
- Opzioni:
  - A1, come hai deciso: solo i gruppi con serie. Pro: grafico corto. Contro: lo zero non si vede;
  - A2: in più una riga «Nessuna serie: …» con i gruppi a zero, esclusi addominali e avambracci, che il catalogo non
    usa. Pro: lo zero si vede in una riga. Contro: una riga in più, e i due gruppi esclusi hanno una regola a parte.
- **Predefinito: A1.** Tocca l'incremento 5.

**B. Periodi (D21):** «Settimana», «4 settimane» (predefinito), «12 settimane», con medie sulle settimane concluse
(confronto in §7.1). Tocca gli incrementi 3 e 5.

**C. Conferma della variante (D17).** Il foglio di «Personalizza i muscoli» dice le conseguenze (schede che cambiano,
storico che resta, record da zero) e il suo pulsante «Crea» è la conferma, senza un `ConfirmDialog` in più.
`ConfirmDialog` nel progetto è per le azioni distruttive (AGENTS.md, «Feedback»), e questa si annulla.
- Utenti e competitor: nessuna fonte (Hevy non documenta la modifica degli esercizi di libreria, `opzioni-domande.md`,
  domanda 6).
- Opzioni:
  - C1: il foglio come conferma. Pro: un passo in meno. Contro: nessuno, se il testo dice le conseguenze;
  - C2: foglio più `ConfirmDialog`. Pro: due passi espliciti. Contro: due conferme per un'azione che si annulla.
- **Predefinito: C1.** Tocca l'incremento 4.

**D. Alias.** Oltre a «Pulley basso» e «Low cable row», `rematore-seduto-al-cavo-basso` prende anche il vecchio nome
«Rematore al cavo basso», così chi lo scrive a mano trova l'esercizio invece di crearne uno personalizzato.
**Predefinito: sì.** Tocca l'incremento 1.

## 11. Fuori ambito

- La voce «backup condivisibile» di `docs/todo.md`: lavoro Small separato.
- Zone colorate e soglie (D5); pesi regolabili; raggruppamento superiore dei gruppi.
- Rinominare un esercizio personalizzato dopo la creazione (non esiste oggi: nessuna funzione in `src/lib/archive/`).
- Riscrivere lo storico dell'originale sulla variante (opzione D di `opzioni-domande.md`, domanda 6: scartata).
