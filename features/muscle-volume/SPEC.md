# SPEC — muscle-volume

**Livello:** Feature · **Stato:** piano in corso (bozza, non pronta per l'esecuzione) · **Base:** `main` a `fd25741` (INC-020)
**Data del piano:** 10 novembre 2026 · **Origine:** voce «vista per gruppo muscolare» di `docs/todo.md` e ricerca del
10 novembre con Francesco (fonti in §4 e §5)

Questa SPEC raccoglie le decisioni già prese e le domande ancora aperte. La sessione di piano successiva la completa
con `HANDOFF.md` (mode: plan); solo dopo si scrive l'handoff d'esecuzione.

**Terminologia (di Francesco, vincolante):** **variante** = esercizio personalizzato derivato da un altro (D7);
**alternativa** = esercizio scelto al posto di quello previsto dalla scheda. Il codice e i testi di oggi usano
«variante» per l'alternativa: vedi §6.

**Regola per ogni decisione di questa feature (data da Francesco, non va ripetuta):** presentare sempre cosa
chiedono gli utenti, cosa fanno i competitor e pro e contro di ciascuna opzione.

## 1. Obiettivo

- **A. Muscoli per esercizio:** ogni esercizio (catalogo e personalizzati) ha muscoli principali e secondari.
- **B. Serie per gruppo muscolare:** nella tab Progressi, una panoramica con i grafici in alto che mostra quante
  serie riceve ogni gruppo muscolare per settimana. Serve a chi cambia spesso esercizi e a chi usa molte varianti,
  perché lo storico per singolo esercizio resta rado.

## 2. Decisioni prese (10 novembre 2026)

| # | Decisione | Motivo in breve |
| --- | --- | --- |
| D1 | Deltoidi separati: anteriori, laterali, posteriori | Scelta di Francesco; le spinte lavorano gli anteriori, le alzate i laterali, le tirate i posteriori: con un solo «spalle» il conteggio non dice nulla |
| D2 | Conteggio frazionario: principale = 1 serie, secondario = 0,5 | Pelland et al. 2026: il metodo frazionario con 0,5 per il lavoro indiretto è quello che si adatta meglio ai dati. Pesi fissi, nessuna percentuale libera (nessuna evidenza per sceglierle, richiesta marginale) |
| D3 | Più muscoli principali ammessi per esercizio | Lo squat profondo fa crescere quadricipiti e glutei (Kubo 2019, §4); Hevy ne ammette uno solo e sbaglia proprio qui |
| D4 | La mappa del catalogo è nostra, non importata | wger ha errori gravi e un solo muscolo per le spalle (`features/muscle-volume/research/wger-crosscheck.md`). Regola: dove c'è uno studio di crescita muscolare comanda lo studio; altrimenti l'azione articolare principale. I libri di Delavier come verifica, fatta da Francesco (Claude non ha accesso ai libri); wger solo come controllo |
| D5 | Si parte dalle cose base | Conteggio descrittivo delle serie per gruppo (come Hevy). Zone colorate con soglie: non nella prima versione (§4: le soglie MEV/MRV non hanno base sperimentale) |
| D6 | Esercizi personalizzati: liste libere di principali e secondari, senza limiti; un muscolo non può stare in entrambe | Nessuno chiede un limite; MacroFactor fa così (tocco = principale, secondo tocco = secondario) |
| D7 | Modificare i muscoli di un esercizio di catalogo **crea una variante**, cioè un nuovo esercizio personalizzato basato su quello; il catalogo non cambia mai | Scelta di Francesco. Il catalogo resta unico e lo aggiorniamo solo noi; niente conflitti tra aggiornamenti e modifiche dell'utente; niente «Ripristina predefinito». Limite accettato: il derivato non riceve le correzioni successive della mappa |
| D8 | Panoramica in Progressi, grafici in alto, stesso schema della pagina dell'esercizio (INC-019: SegmentedControl compatti, lettura sotto il grafico) | Scelta di Francesco |
| D9 | Logica isolata: costanti del modello (pesi, regole di conteggio) in un solo modulo con la citazione | Se le evidenze cambiano si cambia un file e i suoi test |

## 3. Gruppi muscolari (proposta, da confermare)

Petto, dorsali, trapezio, deltoidi anteriori, deltoidi laterali, deltoidi posteriori, bicipiti, tricipiti,
addominali, **lombari**, glutei, quadricipiti, femorali, **adduttori**, polpacci.

Lombari e adduttori sono inclusi salvo diversa indicazione di Francesco: senza lombari l'iperestensione non ha un
muscolo diretto sensato; gli adduttori crescono con lo squat profondo (Kubo 2019). Avambracci esclusi: nessun
esercizio del catalogo li ha come bersaglio. **Da decidere:** confermare la lista; serve un raggruppamento
superiore (spalle, braccia, gambe) per la vista compatta?

## 4. Evidenze (cosa è scienza e cosa è opinione)

- **Dose-risposta:** più serie settimanali, più crescita, con rendimenti decrescenti. Schoenfeld, Ogborn, Krieger
  2017, *J Sports Sci*: meno di 5 serie +5,4%, 10 o più +9,8%.
- **Conteggio frazionario:** Pelland et al. 2026, *Sports Medicine* 56(2):481-505, DOI 10.1007/s40279-025-02344-w.
  Indiretto = 0,5 è il modello che si adatta meglio; l'incertezza cresce oltre 25-30 serie.
- **Intervalli osservati:** Baz-Valle et al. 2022, *J Hum Kinet*: 12-20 serie per uomini giovani allenati.
  Schoenfeld et al. 2019: fino a 45 serie.
- **Squat:** Kubo, Ikebukuro, Yata 2019, *Eur J Appl Physiol* 119:1933-1942 (risonanza magnetica, 10 settimane):
  squat profondo, grande gluteo +6,7%, adduttori +6,2%, femorali e retto femorale senza variazioni. Quindi:
  quadricipiti e glutei principali, adduttori secondari, femorali non contati.
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

URL dei thread e delle pagine prodotto: non riportati qui; se una decisione dipende da uno di questi punti, la
sessione di piano li ricerca e li cita.

## 6. Modello dati (bozza da verificare nel codice)

- `CatalogExercise` (`src/lib/archive/types.ts`): campo nuovo con principali e secondari (id di gruppo
  muscolare) e la fonte della scelta (studio, azione articolare). Dove tenerlo, se dentro `src/data/catalog.ts`
  o in un file di dati separato, è **da decidere**.
- `CustomExercise` (oggi solo `id` e `name`): muscoli opzionali, più il riferimento all'esercizio da cui è
  derivato (D7). Senza muscoli l'esercizio conta come «non classificato».
- **Verifica nel codice (10 novembre 2026, a `0f18ef6`):**
  - **La validazione ricostruisce ogni oggetto campo per campo**, quindi un campo che non conosce si perde:
    `catalog()` in `src/lib/archive/validation.ts:166-178` tiene solo `id` e `name`, `sessionExercise()` in
    `validation.ts:133-146` solo i campi elencati. La stessa funzione serve al caricamento
    (`src/lib/archive/repository.ts:139`) e all'importazione di un backup (`src/lib/archive/backup.ts:46-48`).
  - **Backup vecchi:** restano validi se il campo nuovo è facoltativo e la validazione gli dà un valore predefinito
    (nessun muscolo).
  - **Versione:** oggi `version: 2` (`src/lib/archive/types.ts:120`). La validazione rifiuta ogni altro numero
    (`validation.ts:219`), il backup sceglie il formato da `version === 2` (`backup.ts:46`).
    - **Restare a 2:** una scheda del browser rimasta aperta con il codice vecchio dopo un deploy (il service worker
      usa `skipWaiting` e `clientsClaim`, `src/integrations/service-worker.ts:32-33`, ma il codice già caricato resta
      quello vecchio) rilegge l'archivio con «Ricarica» dopo un conflitto (`repository.ts:156`), toglie i muscoli in
      silenzio e al salvataggio successivo li cancella.
    - **Passare a 3:** il codice vecchio vede «Formato non riconosciuto»; l'archivio diventa illeggibile
      (`repository.ts:139-147`) e le scritture sono bloccate (`repository.ts:150-153`). Nessuna perdita, solo un
      messaggio fino al ricaricamento della pagina. Il codice nuovo legge 2 e 3 e scrive 3.
    - **Proposta:** versione 3. È una scelta tra alternative: va in ADR.
  - **Dove tenere la mappa:**
    - un campo obbligatorio in `CatalogExercise`, compilato in `src/data/catalog.ts`: il compilatore impone la mappa a
      tutti i 43 esercizi, e un esercizio nuovo non può nascere senza;
    - un file di dati separato in `src/data/` costringerebbe invece a un test per la copertura.
    - **Proposta:** il campo, con il motivo della scelta in un commento accanto a ogni voce (studio o azione
      articolare). Il motivo completo resta in `research/mappa-43.md`, che si archivia con la SPEC.
  - **Derivati (D7):** l'ID di un personalizzato nasce dal nome (`customExerciseId`, `src/lib/archive/catalog.ts:96-99`),
    quindi il derivato deve avere un nome diverso dall'originale. `mergeExercise` rifiuta di assorbire un esercizio
    di base (`catalog.ts:139`).
  - **Conteggio:** `countsForProgress()` (`src/lib/archive/progress.ts:34-36`, spuntata e non di riscaldamento) e il
    filtro sulle sessioni concluse (`progress.ts:87`) esistono già; `weekStart()` (`src/lib/archive/calendar.ts:16`)
    dà il lunedì. Ogni drop è una riga a sé di tipo `drop` (`types.ts:10`).
- **Terminologia nel codice:** `SessionExercise.variantOf` e circa 100 occorrenze in `src/` (per esempio
  `src/components/workout/VariantSheet.svelte`, «Cambia variante» in `src/components/kit/KitOverlays.svelte`,
  «Le varianti hanno ciascuna i loro progressi» in `src/components/history/ProgressPage.svelte`) chiamano
  «variante» quella che per Francesco è un'**alternativa**. Prima della feature serve un incremento che allinei i
  testi visibili e i commenti ad «alternativa». **Da decidere:** rinominare anche gli identificatori; `variantOf`
  è salvato nell'archivio e nei backup, quindi rinominarlo richiede una migrazione. Il riferimento di D7 si
  chiamerà con «variante» in senso proprio, quindi l'ambiguità con `variantOf` va risolta prima.
- Logica (D9): un modulo nuovo in `src/lib/archive/` per il volume per muscolo. Idee di partenza:
  - serie spuntate di sessioni concluse;
  - riscaldamento escluso, come `src/lib/archive/progress.ts`;
  - si conta l'esercizio fatto davvero (`exerciseId`);
  - aggregazione per settimana;
  - pesi 1 e 0,5 come costanti con la citazione.

  **Da decidere:** contano le serie drop? I file nuovi seguono le convenzioni di `docs/ARCHITECTURE.md`.

## 7. Interfaccia (bozza)

- Tab Progressi: in cima alla pagina di riepilogo il grafico delle serie per gruppo muscolare, poi l'elenco
  esercizi già esistente.
- Controlli compatti come in `src/components/history/ExerciseProgress.svelte` (periodo; forse gruppo muscolare).
- Editor dei muscoli per gli esercizi personalizzati (tocco = principale, secondo tocco = secondario); dal
  catalogo, «modifica muscoli» propone di creare il nuovo esercizio (D7).
- Prima di toccare l'interfaccia: `PRODUCT.md`, `DESIGN.md`, il brief in `.impeccable/surfaces/`.

## 8. Domande aperte (da chiudere nella sessione di piano, in un solo blocco)

Materiale per le risposte (10 novembre 2026):
- bozza della mappa in `features/muscle-volume/research/mappa-43.md`;
- opzioni con utenti, competitor, pro e contro in `features/muscle-volume/research/opzioni-domande.md`.

Le domande sono state poste a Francesco; le risposte vanno scritte qui.

1. Lista dei gruppi (§3), con lombari e adduttori.
2. Mappa dei 43 esercizi: bozza da preparare (principali, secondari, azione articolare, studio se esiste),
   Francesco la confronta con i libri di Delavier che ha (pagina per esercizio).
8. Identificatori: rinominare `variantOf` e simili in `alternativeOf` (con migrazione) o lasciarli e cambiare solo
   i testi?
3. Cosa mostra il grafico: barre per gruppo nel periodo, oppure linea di un gruppo per settimana? Quale controllo
   sceglie il gruppo? Opzioni con utenti, competitor, pro e contro.
4. Settimana: da lunedì (come `WEEKDAYS`) o ultimi 7 giorni?
5. Serie drop e a cedimento: contano come serie normali?
6. Dove si apre l'editor dei muscoli e cosa succede alle schede che usano l'esercizio originale quando l'utente
   crea il derivato.
7. Esercizi senza muscoli: come compaiono («non classificati»)?

## 9. Incrementi proposti (da confermare dopo §8)

0. Terminologia: «alternativa» al posto di «variante» nei testi visibili e nei commenti (§6), con la decisione
   sugli identificatori.
1. Dati: gruppi muscolari, mappa del catalogo, modello e validazione (backup vecchi validi).
2. Logica: modulo del volume con test (casi: principale, secondario, più principali, riscaldamento, sessione in
   corso esclusa, esercizio non classificato).
3. Interfaccia: panoramica in Progressi.
4. Esercizi personalizzati: editor dei muscoli e creazione del derivato dal catalogo.

ADR attesi: conteggio frazionario e fonte della mappa (D2, D4); derivato invece di modifica del catalogo (D7).
