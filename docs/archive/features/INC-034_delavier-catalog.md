# SPEC — delavier-catalog

Stato: **chiusa con INC-034** (11/11/2026): incrementi 1–6 fatti (INC-029 … INC-034). Le proposte di §5 hanno la
risposta di Francesco, applicata con INC-035 insieme alla gerarchia delle fonti di §1. Livello: Feature, 6 incrementi.

Obiettivo: catalogo preso dal Delavier (*Strength Training Anatomy*, 3ª ed.), muscoli con il valore di una serie al
posto di principali/secondari, Progressi che diventa il catalogo, grafici con l'elenco sotto, sagoma del corpo,
diario di Francesco corretto da reimportare.

## 1. Fonte e metodo

- **Gerarchia delle fonti** (Francesco, 11/11/2026; ADR-014, applicata con INC-035; vale per tutto il catalogo):
  1. **Studi verificati e confermati.** *Verificato:* pubblicato su rivista con revisione, letto nel testo dello
     studio (non in articoli divulgativi), non ritrattato, con una misura diretta della crescita (risonanza, TAC o
     ecografia) dopo un periodo di allenamento. *Confermato:* lo stesso risultato da almeno due gruppi di ricerca
     indipendenti, oppure da una revisione sistematica o meta-analisi. Per i muscoli che hanno misurato, gli studi
     confermati vincono sul libro.
  2. **Il libro** (*Strength Training Anatomy*, 3ª ed., 2010). Dice quali muscoli lavorano, non quanto crescono. Cede
     dove uno studio confermato, più recente, lo smentisce. Le contraddizioni tra sue pagine si segnalano nel
     commento della riga.
  3. **Studi singoli, competitor, logica.** Uno studio singolo non scavalca il libro: vale solo dove il libro non dice
     nulla (es. hip thrust). Analogie e logica si segnano come tali.

  Classificazione degli studi: `docs/archive/features/INC-027_muscle-volume-research/mappa-43.md`, sezione
  «Gerarchia delle fonti». L'elettromiografia non conta in nessun livello.
- **Libro:** `docs/sources/Strength Training Anatomy- 3rd Edition.pdf` (cartella esclusa da git, copyright). 196 pagine
  PDF; **pagina del libro = pagina PDF − 2** (p. 104 = PDF 106, p. 110 = PDF 112). Le illustrazioni non vanno nell'app.
  Francesco ha anche l'edizione italiana («Nuova guida agli esercizi di muscolazione»), non nel repo: nel catalogo
  vale la pagina del PDF inglese. Non ci sono altri libri del Delavier: fuori dal libro si passa alla letteratura.
- **Bozze e trascrizioni** (frasi del libro, note di lettura) solo in `docs/sources/delavier-catalog/`, ignorata da git.
  Nel repository entrano solo il catalogo (nome, alias, valori, pagina) e l'elenco per Francesco (§5).
- **Regole di lettura.** Nessuna mappatura per deduzione: ciò che le regole non decidono va in §5.
  1. legenda della figura (solo p. 110): «most recruited» → 1, «recruited» → 0,5;
  2. «mainly / primarily» contro «to a lesser extent»: 1 e 0,5;
  3. «works X… it also works Y»: X → 1, Y → 0,5;
  4. elenco senza nessun separatore: tutti 1;
  5. i grassetti delle tavole anatomiche e le figurine rosse in alto a sinistra non contano.
- **Controllo ripetibile** (INC-040): `src/data/catalog-reading.test.ts`, dentro `npm test`, verifica che ogni muscolo
  nominato nella frase dei muscoli lavorati di `lettura.md` finisca, secondo §4, nelle voci con quella pagina; le
  eccezioni sono elencate nel test con la regola che le decide. Senza `docs/sources/` (fuori da git) il test salta.
- **Gruppo da più muscoli:** prende il valore più alto tra i suoi muscoli (D4).
- **Ogni voce del catalogo** ha nel commento della riga la fonte con la pagina (`// Delavier p. 104, fig. p. 110`).
- **Divisione del lavoro:** Hermes (deepseek-flash) fa il lavoro meccanico (testo e impaginazione delle pagine); chi
  ragiona legge le figure e verifica ogni trascrizione **sull'immagine della pagina** (`pdftoppm -r 150`), mai sul
  testo estratto. Prova su p. 110 (11/11/2026): Hermes sbaglia i colori (lombari e femorali dati rossi, sono arancio;
  gluteo «quasi tutto arancio», è rosso).

## 2. Decisioni

- **D1 — Modello:** i muscoli di un esercizio sono una mappa gruppo → valore, `Muscles = Partial<Record<MuscleGroup,
  number>>`: il valore è la quota di una serie che va al gruppo. Niente campo «livello»: testi, colori e sagoma si
  ricavano dal valore. Valori ammessi oggi: 1 e 0,5 (`MUSCLE_VALUES`); mappa vuota = senza muscoli. Il Delavier dà
  solo l'ordine tra le due categorie, il numero viene da Pelland et al. 2026 (Sports Medicine, DOI
  10.1007/s40279-025-02344-w).
- **D2 — Costanti:** `MOST_RECRUITED = 1` e `RECRUITED = 0.5`, con nome, usate dal catalogo e dall'editor: cambiare
  0,5 è una riga. Stanno in `types.ts` accanto a `MUSCLE_GROUPS`, non in `muscles.ts`: `muscles.ts` importa il
  catalogo e il catalogo importerebbe `muscles.ts` (import circolare, `ReferenceError` a seconda dell'ordine di
  caricamento). Cambiare 0,5 rende non validi i valori 0,5 salvati nei personalizzati: chi lo cambia aggiunge la
  conversione in lettura (come D3).
- **D3 — Archivi e backup vecchi:** si convertono in lettura (`validation.ts`): `{primary, secondary}` → principali
  1, secondari 0,5. Si scrive sempre la forma nuova; la versione dell'archivio resta 3.
- **D4 — Gruppo da più muscoli:** valore più alto (una sola quota per serie).
- **D5 — Varianti del libro:** una «Variation» è una voce a sé solo se cambia attrezzo o muscoli; gli allungamenti
  restano fuori.
- **D6 — Gruppi nuovi:** `brachialis` (Brachiale) dopo `biceps`, `hip-flexors` (Flessori dell'anca) dopo `glutes`,
  `popliteus` (Popliteo) dopo `hamstrings`. Gli id dei gruppi sono dati: quelli esistenti non cambiano.
- **D7 — Tabella §4** approvata con le scelte di Francesco.
- **D8 — Stacco da terra classico** (p. 104, figura p. 110): dorsali e glutei 1; trapezio, lombari, femorali e
  quadricipiti 0,5. Sui lombari vale il colore della figura, non la didascalia.
- **D9 — Catalogo:** tutti gli esercizi del libro (secondo D5), nome italiano d'uso comune, alias (sempre anche il
  nome inglese del Delavier), valori, pagina nel commento. Gli ID esistenti (42 più quello reindirizzato) restano e si
  riverificano con le stesse regole; quelli senza pagina nel libro seguono la letteratura o vanno in §5.
- **D10 — Voce compatta:** con centinaia di voci il formato di oggi (12 righe, approfondimento vuoto) non regge; i
  campi vuoti si riempiono con una funzione in `src/data/catalog.ts`, una riga per esercizio. Scelta meccanica.
- **D11 — Editor dei personalizzati:** a tocchi, nessuno → 1 → 0,5 → nessuno; il testo dice il valore.
- **D12 — Colori:** la palette di base resta monocromatica, il rosso è un accento. Nella tab Info i valori vanno su
  una scala giallo → arancione → rosso, con il rosso distinguibile da quello degli errori e il giallo con il bordo
  (ADR-005 aggiornato). In Progressi la sagoma usa un solo colore con intensità relativa al massimo del periodo.
- **D13 — Sagoma:** unisex, nello stile a pennello del progetto. Da MuscleMap (github.com/Jsplice/MuscleMap, MIT,
  attribuzione nelle Info) solo le zone dei muscoli; contorno con un tratto che imita l'inchiostro. Brachiale e
  flessori dell'anca si tracciano a mano; il popliteo è profondo e non si disegna. Una sagoma disegnata davvero a
  pennello è una voce di `docs/todo.md` (la aggiunge Francesco o la si propone nel resoconto).
- **D14 — ADR-014** sostituisce la regola di ADR-011 (studi di crescita, poi azione articolare) con le regole di §1;
  ADR-011 passa a «Superseded by ADR-014». ADR-012 resta (conteggio), con il peso ora preso dal valore.

## 3. Incrementi

### Incremento 1 — modello dei muscoli

Ambito:
- `types.ts`: `Muscles = Partial<Record<MuscleGroup, number>>`, `MOST_RECRUITED`, `RECRUITED`, `MUSCLE_VALUES`;
  `MUSCLE_GROUPS` con i tre gruppi di D6.
- `muscles.ts`: etichette dei gruppi nuovi; `exerciseMuscles` null con la mappa vuota; `weeklyVolume` somma
  `n × valore`; `PRIMARY_SETS`/`SECONDARY_SETS` tolti; `formatShare(valore)` («1 serie», «0,5 serie») e
  `sortedMuscles(muscles)` (valore decrescente, poi ordine di `MUSCLE_GROUPS`) per i testi.
- `validation.ts`: chiavi in `MUSCLE_GROUPS`, valori in `MUSCLE_VALUES`, messaggi in italiano; forma vecchia
  convertita (D3).
- `catalog.ts` (archivio): nuovo personalizzato con `{}`, `createVariant` copia la mappa (oggetto nuovo),
  `setCustomMuscles` valida la mappa.
- `src/data/catalog.ts`: conversione meccanica delle 42 voci (principale → `MOST_RECRUITED`, secondario →
  `RECRUITED`); i valori del Delavier arrivano con l'incremento 2. `seed-data.test.ts` alla forma nuova.
- `MuscleEditor`: tre stati per gruppo (D11); `ExerciseProgress`: un elenco «gruppo — quota di una serie» al posto di
  «Principali»/«Secondari». `/kit`, test unitari ed e2e (US-43, US-44, US-45, fixture nei test) alla forma nuova. Il
  fixture `tests/fixtures/workout-tracker-2026-11-05.json` resta in sola lettura: lo legge la conversione di D3.
- ADR-014 (D14); `docs/ARCHITECTURE.md` (modello, `muscles.ts`).

Criteri: `npm test` con: un esercizio `{chest: 1, triceps: 0.5}` con 3 serie dà petto 3 e tricipiti 1,5; la forma
vecchia `{primary: ['chest'], secondary: ['triceps']}` si legge come `{chest: 1, triceps: 0.5}`; la validazione scarta
gruppo ignoto, valore 0,7, valore non numerico. e2e US-44 che porta un gruppo da nessuno a 1 a 0,5 a nessuno e legge
l'archivio salvato. Gate completo.

### Incremento 2 — catalogo dal Delavier

1. **Indice** (Hermes): esercizi del libro con numero, nome inglese, pagina, «Variation» (secondo D5), in
   `docs/sources/delavier-catalog/indice.md`. Chi ragiona lo controlla contro le pagine dell'indice del libro.
2. **Bozze per capitolo** (Hermes, un capitolo per lancio): per esercizio la frase dei muscoli trascritta, la pagina.
   Chi ragiona la confronta con l'immagine della pagina e applica le regole di §1.
3. **Scrittura del catalogo** da bozze verificate: nome italiano d'uso comune, alias (nome inglese del Delavier e nomi
   di palestra), valori tramite §4, commento con la pagina. ID nuovi in kebab-case italiano; nessun ID esistente
   cambia. Servono almeno: stacco da terra, leg curl seduto, curl manubri, «Overhead cable triceps extensions»
   (incremento 3).
4. **I 42 esercizi attuali** riverificati: con pagina nel libro prendono i suoi valori; gli altri la letteratura o §5.
5. **Elenco per Francesco** (§5): ogni caso che le regole non decidono e ogni proposta senza fonte (segnata
   «proposta»; nel catalogo vale la proposta finché Francesco non risponde).
6. ADR-014 aggiornato se le regole di §1 cambiano durante la lettura; ADR-011 «Superseded».

Criteri: `seed-data.test.ts` controlla che ogni voce abbia almeno un gruppo con valori in `MUSCLE_VALUES`, che gli
ID del PoC ci siano tutti (nel catalogo o reindirizzati), la riga dello stacco classico (D8) e, per un campione di 10
voci, i valori trascritti. Ogni voce ha `// Delavier p. N` oppure la fonte esterna oppure il rimando a §5. Gate
completo. Può servire più di una sessione: le bozze restano in `docs/sources/delavier-catalog/`.

### Incremento 3 — correzione del diario

Da `docs/sources/workout-tracker-2026-11-11.json` (l'originale non si tocca) un file corretto a parte,
accanto all’originale con «-corretto» nel nome, da reimportare con «Sostituisci». Lo produce uno script in
`docs/sources/delavier-catalog/` (dati personali, fuori da git) che usa solo funzioni pure dell'archivio
(`mergeExercise`, `rewriteSessions`, `rewriteRoutines`) dove bastano.
- **Personalizzati → catalogo** (sessioni, schede, alternative): Romanian deadlift → `stacco-rumeno-bilanciere`;
  Deadlift e Stacco da terra → stacco da terra; Leg curl e Leg curl seduto → leg curl seduto; Curl manubri → curl
  manubri; Estensioni tricipiti sopra la testa al cavo → «Overhead cable triceps extensions». I personalizzati
  tolti escono da `catalog`.
- **2 ottobre**, rematore seduto al cavo basso: kg e ripetizioni invertiti → 25×15, 32×12, 39×10, 32×8.
- **5 ottobre**, squat con nota «Romanian deadlift prime 3 / leg press»: le prime 3 serie su stacco rumeno
  bilanciere, le ultime 3 su leg press a metà pedana, entrambe come alternative dello squat (`alternativeOf`).
- **5 ottobre**, curl manubri su panca inclinata con nota «Curl manubri»: le serie passano a curl manubri.
- **5 ottobre**, standing calf con nota «Lat machine»: le serie passano a lat machine presa prona.
- **8 ottobre**, «rematore manubri petto su panca inclinata» (27,3 / 34,3 / 47,3 kg) → rematore seduto al cavo basso.
- **Sessione del 4 novembre:** inizia il 30 ottobre e finisce il 5 novembre: `start` subito prima della prima serie
  spuntata, `end` all'ultima.
- **41,25 kg della lat machine → 41,3**, come nelle altre sessioni.
- Restano come sono: durata 0 delle sessioni del 2, 5 e 8 ottobre; le serie vuote non spuntate.
- Le note che descrivevano la correzione si tolgono solo se non dicono altro.

Criteri: il file corretto passa `validateArchive`; `weeklyVolume` sul file corretto non ha `unclassified`; uno script
di controllo stampa le righe cambiate (prima → dopo) e Francesco le rilegge. Niente codice vivo toccato: niente gate
dell'app, solo `npm run docs:check` se cambiano documenti; voce nel CHANGELOG.

### Incrementi 4–6 — interfaccia

Prima di toccare la UI: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/route-history.md` (o il brief della
superficie), `craft-floor.md`. Componenti nuovi anche in `/kit`. Pagine guardate a 390×844 e 320×568.

#### Incremento 4 — Progressi diventa il catalogo (US-47, US-48)
- Sotto «Serie per muscolo»: barra di ricerca (nome e alias, stessa corrispondenza di `suggestExercises`) e
  interruttore «Solo fatti», acceso a ogni apertura. Elenco di tutto il catalogo più i personalizzati, alfabetico
  anche durante la ricerca, con la card di oggi; un esercizio mai fatto ha come seconda riga «–», con il testo
  nascosto «mai fatto» per lo screen reader.
- Pagina dell'esercizio con due tab: «Progressi» (record, grafico, storico; aperta per prima) e «Info» (muscoli con il
  valore di ogni serie, «Personalizza i muscoli», «Unisci in…», approfondimento). La sezione «Muscoli» esce dallo
  storico. La tab sta nell'URL (`&tab=info`), letta nel client.
- Esercizio mai fatto: tab Progressi vuota con un messaggio e un link alla tab Info.
- I link di «Senza muscoli» aprono la tab Info.
- `DESIGN.md`: «quando in verticale si susseguono tipi di informazione diversi, tra l'uno e l'altro c'è un
  separatore» (filo `border`), applicata alle due pagine toccate.
- Criteri: e2e US-47 (cerca per alias, spegne «Solo fatti», apre un esercizio mai fatto e arriva a Info) e US-48 (tab,
  link da «Senza muscoli» alla tab Info).

#### Incremento 5 — grafici con l'elenco sotto (US-49, US-50)
- Foglio «<Gruppo>: serie per settimana»: sotto il grafico gli esercizi che hanno dato serie al gruppo nelle stesse
  settimane del grafico, con la card dell'elenco di Progressi più le serie contate (già pesate) e il valore. Il tocco
  su un punto filtra l'elenco su quella settimana; un secondo tocco sullo stesso punto o il comando visibile «Tutte
  le settimane» toglie il filtro. Funzione pura nuova in `muscles.ts` con il suo test.
- Pagina dell'esercizio: il tocco su un punto evidenzia la riga di quell'allenamento nello storico, senza spostare il
  focus e senza scroll.
- Criteri: e2e US-49 (filtro e sua rimozione) e US-50 (riga evidenziata, `document.activeElement` e `scrollY`
  invariati).

#### Incremento 6 — sagoma del corpo e colori (US-51), chiusura
- Zone dei muscoli di MuscleMap (MIT, licenza che copre anche i tracciati, verificata l'11/11/2026) in un modulo
  nostro, resi con un componente Svelte nostro: sagoma unisex (D13), fronte e retro, contorno a inchiostro. Mancano
  nei tracciati brachiale e flessori dell'anca: si tracciano a mano; il popliteo non si disegna. Dati grezzi circa
  130 KB, da ridurre (precisione delle coordinate). Attribuzione e licenza nella pagina Info.
- Tab Info: scala giallo → arancione → rosso sul valore (D12), con la legenda scritta; ADR-005 aggiornato.
- Progressi, sopra le barre: un colore solo, intensità relativa al massimo del periodo; il tocco su una zona apre il
  foglio del gruppo; ogni zona è un controllo con nome accessibile.
- Criteri: e2e US-51 (tocco su una zona apre il foglio del gruppo giusto); contrasti in `src/styles/contrast.test.ts`.
- Chiusura della feature (AGENTS.md, «Ciclo delle feature»).

## 4. Tabella muscoli del Delavier → gruppi dell'app (approvata, D7)

Il gruppo di un muscolo si sceglie una volta qui e vale per tutto il catalogo. «—» = non contato.

| Muscolo nel Delavier | Gruppo | Nota |
| --- | --- | --- |
| Pectoralis major (clavicolare, sternale, costale) | Petto | |
| Pectoralis minor | — | profondo, abbassa la scapola |
| Serratus anterior | — | |
| Anterior / middle / posterior deltoid | Deltoidi anteriori / laterali / posteriori | |
| Supraspinatus | Deltoidi laterali | abduzione |
| Infraspinatus, teres minor | Deltoidi posteriori | rotazione esterna |
| Subscapularis | — | rotazione interna, profondo |
| Coracobrachialis | — | Francesco: non conta |
| Latissimus dorsi | Dorsali | |
| Teres major | Dorsali | |
| Rhomboids | Trapezio | |
| Trapezius (superiore, medio, inferiore) | Trapezio | |
| Levator scapulae | Trapezio | |
| Biceps brachii | Bicipiti | |
| Brachialis | Brachiale | gruppo nuovo |
| Brachioradialis («long supinator») | Avambracci | |
| Flessori ed estensori del polso e delle dita, pronatori | Avambracci | |
| Triceps brachii (tre capi), anconeus | Tricipiti | |
| Rectus abdominis | Addominali | |
| External / internal obliques, transversus | Addominali | |
| Erector spinae, sacrolumbar, quadratus lumborum, «lumbar muscles» | Lombari | |
| Gluteus maximus | Glutei | |
| Gluteus medius, gluteus minimus | Glutei | valore predefinito, Francesco può cambiarlo |
| Tensor fasciae latae | Flessori dell'anca | INC-040: il libro lo dà tra i «flexor muscles of the hip (iliopsoas, rectus femoris, and tensor fasciae latae)» (p. 174) e dove lo nomina come muscolo lavorato (pp. 176, 177, 180, 183) agisce da flessore; prima Glutei, poi «—» (11/11/2026, decisione presa senza questa fonte) |
| Piriformis e rotatori profondi dell'anca | Glutei | |
| Quadriceps (rectus femoris, vasti) | Quadricipiti | |
| Hamstrings (biceps femoris, semitendinosus, semimembranosus) | Femorali | |
| Adductors (magnus, longus, brevis), pectineus, gracilis | Adduttori | |
| Sartorius | — | |
| Iliopsoas (psoas, iliacus) | Flessori dell'anca | gruppo nuovo, valore predefinito, Francesco può cambiarlo |
| Gastrocnemius, soleus (triceps surae) | Polpacci | |
| Tibialis anterior, peronei | — | Francesco: il tibiale non conta |
| Popliteus | Popliteo | gruppo nuovo |
| Sternocleidomastoid, splenius e muscoli del collo | — | |

«Valore predefinito» (gluteo medio, ileopsoas): il valore che le regole di §1 danno al muscolo nella frase, come per
ogni altro; se Francesco li vuole sempre a un valore fisso (es. 0,5), è una riga in §5.

## 5. Elenco per Francesco

Compilato con l'incremento 2 (11/11/2026), dalle 127 schede del libro lette sulle immagini (bozze e trascrizioni in
`docs/sources/delavier-catalog/`). Ogni voce del catalogo che ne dipende ha `§5 (Pn)` nel commento.

**Risposte di Francesco (11/11/2026, applicate con INC-035):** P1–P6, P8–P16, P18–P22 sì, come proposto. **P7:**
tricipiti 0,5 nella panca piana (e nella sua variante al Smith): il libro non li nomina, crescono meno del petto
(gruppo di Ogasawara e Abe, risonanza, 2011-2013; Lanza et al. 2024, *J Bodyw Mov Ther* 40:1417-1422, DOI
10.1016/j.jbmt.2024.07.054, gruppo indipendente: confermato). **P17:** squat e squat al Smith senza femorali
(Kubo 2019 e Plotkin 2023, gruppi indipendenti, smentiscono il libro); quadricipiti, glutei, adduttori, lombari e
addominali 1 come dice il libro (su lombari e addominali ci sono solo studi di elettromiografia, che non conta).
**Tabella di §4:** il tensore della fascia lata non conta più (muscolo accessorio come coracobrachiale e tibiale;
StatPearls «Tensor Fasciae Latae Muscle», Kenhub, regione glutea). Nessun valore cambia: nelle voci che lo nominano
(sit-up pp. 174, 176, 177, leg raise pp. 180, 183) la lettura non l'aveva contato. *Superata da INC-040:* il tensore
va nei Flessori dell'anca (§4); nessun valore cambia nemmeno così, perché in ognuna di quelle frasi l'ileopsoas dà già
ai flessori lo stesso valore (p. 174: solo nella variante, non contato).

**Schemi di frase che le regole di §1 non coprono** (valgono per più esercizi):
- **P2 «as well as»** («uses the deltoid … as well as the trapezius, triceps»): proposta come «also» → 0,5. Lento dietro,
  distensioni manubri seduto, Arnold press, alzate frontali al cavo, squat sumo con manubrio, sit-up su panca inclinata.
  Alternativa: elenco senza separatori → 1.
- **P3 «the deltoid, mainly the X»**: proposta X → 1, gli altri due capi → 0,5 (stesso gruppo «deltoide» con un
  «mainly» dentro). Lento dietro, distensioni seduto, Arnold, alzate posteriori, alzate frontali al cavo, macchina
  laterali.
- **P4 muscoli che si contraggono a fine movimento** («when the shoulder blades come together, the trapezius and
  rhomboids contract»): proposta 0,5 se è parte dell'esecuzione descritta; non contati se è una scelta («if you
  continue raising the arm…», «above horizontal»). Rematori, alzate posteriori, pec deck inverso, aperture ai cavi.
- **P5 «the deltoid» senza capo** (alzate laterali da sdraiato, p. 45; il commento dice «work all the deltoid
  fibers»): proposta i tre capi a 1.
- **P13 frase a parte con i muscoli che «also contract / come into play / are used isometrically»** (lombari nei
  rematori a busto flesso, trapezio e deltoidi posteriori nella lat presa stretta, quadrato dei lombi nei piegamenti
  laterali alla panca romana): proposta 0,5, come «also».

**Esercizio per esercizio:**
- **P1 Dip tra panche (p. 30):** «works the triceps and pectorals as well as the anterior deltoid» → tricipiti 1, petto
  1, deltoidi anteriori 0,5.
- **P6 Tirate al mento (pp. 56 e 115):** il libro la descrive due volte con frasi diverse (spalle: «mainly uses the
  deltoid, trapezius, and biceps»; dorso: «mainly uses the superior portion of the trapezius as well as the deltoids…»).
  Una voce sola con il valore più alto delle due: deltoidi, trapezio e bicipiti 1; brachiale, avambracci, addominali,
  glutei, lombari 0,5.
- **P7 Panca piana (p. 64):** il testo nomina pettorale, piccolo pettorale, deltoide anteriore, serrato, coracobrachiale;
  **non il tricipite** (in figura è etichettato, ma i grassetti non contano). Oggi: petto 1, deltoidi anteriori 1,
  tricipiti 0. Proposta: lasciare così (regola) oppure tricipiti 0,5 da Pelland/ADR-011.
- **P8 Chest press (p. 73):** «the triceps and the posterior fascicles of the deltoids are also recruited»: il libro
  dice *posteriori*, probabilmente un errore (in una spinta lavora l'anteriore). Oggi: deltoidi posteriori 0,5 come da
  testo. Proposta: anteriori 0,5.
- **P9 Dip alle parallele (p. 74):** nessuna frase d'elenco, solo «the more the chest is angled forward … pectorals;
  the more vertical … triceps». Proposta petto 1, tricipiti 1 (anche per la variante alla macchina).
- **P10 Stabilizzatori nominati:** pullover con manubrio (p. 83: «the last three muscles stabilize the scapula»,
  romboidi tra questi) → romboidi non contati; pullover con bilanciere (p. 84, stessa lista senza la frase) → trapezio
  1; pullover al cavo alto (p. 96: «the long head of the triceps, which stabilizes the arm–trunk hinge») → tricipiti 1.
  Proposta: contare solo quelli senza la parola «stabilize» (oggi così).
- **P11 Esercizi del PoC che il libro non ha** (valori proposti, nessuna fonte del Delavier):
  goblet squat → come il front squat (p. 125, carico davanti); incline chest press → come la panca inclinata (p. 62);
  lat monobraccio al cavo → come la lat machine (p. 90); rematore manubri petto su panca inclinata → come il T-bar con
  appoggio (p. 101); row machine → come il rematore seduto al cavo (p. 94); calf alla leg press → polpacci 1; hip
  thrust machine → glutei 1 (hip thrust bilanciere ha la sua fonte, Plotkin 2023); pull-through al cavo → glutei e
  femorali 1 (come prima, analogia con Morin 2025 e Bourne 2017).
- **P12 Trazioni presa inversa (p. 88):** «develops the latissimus dorsi and teres major and is associated with the
  intense work of the biceps brachii and brachialis»: proposta bicipiti e brachiale 1 («intense»), trapezio e petto 0,5
  («also contracts»).
- **P14 Stacco rumeno = stiff-legged deadlift (p. 102)?** Il libro non ha lo stacco rumeno; proposta di usare la sua
  scheda (lombari, glutei, femorali 1). Gli adduttori 0,5 di prima escono.
- **P15 Stacco sumo (p. 103):** «works the quadriceps and adductor muscles intensely … it works the back less»;
  il commento aggiunge zona lombare e glutei. Proposta quadricipiti e adduttori 1, lombari e glutei 0,5.
- **P16 Squat sumo con manubrio (p. 124):** «works the quadriceps as well as the gluteal muscles» + commento «the
  wide-leg position works the adductors». Proposta quadricipiti 1, glutei e adduttori 0,5.
- **P17 Squat (p. 126):** «mainly works the quadriceps, gluteal muscles, adductor group, erector spinae, abdominal
  muscles, and the hamstrings»: per la regola tutti 1. Contraddice Kubo 2019 (femorali non crescono) e ADR-011
  (stabilizzatori non contati). Oggi vale il libro: lombari, addominali e femorali ricevono una serie intera per ogni
  serie di squat (anche lo squat al Smith). Dimmi se vuoi un'eccezione.
- **P18 Leg press (p. 135):** solo frasi sulla posizione dei piedi («low … isolates the quadriceps; higher … gluteal
  muscles and hamstrings; wider … adductors»). Proposta per la leg press e quella a metà pedana: quadricipiti 1;
  glutei, femorali, adduttori 0,5.
- **P19 Box squat (p. 137):** il testo parla solo dei quadricipiti, in confronto. Proposta quadricipiti 1.
- **P20 Affondi con bilanciere (p. 156):** glutei 1; passo corto → quadricipiti, lungo → femorali. Proposta
  quadricipiti e femorali 0,5.
- **P21 Sit-up alla panca romana (p. 177):** «the rectus abdominis, iliopsoas, and tensor fasciae latae contribute
  strongly». Proposta flessori dell'anca 1.
- **P22 Crunch alla macchina (p. 179):** nessuna frase sui muscoli. Proposta addominali 1.
- **P23 Affondi con bilanciere (p. 156), aggiunta con INC-040:** il passo lungo «stretches the rectus femoris and
  iliopsoas of the back leg». Allungati, non lavorati: oggi i flessori dell'anca non contano (i quadricipiti hanno già
  0,5 dal passo corto, P20). Proposta: lasciare così. Alternativa: flessori dell'anca 0,5 come i muscoli del passo (P20).
  **Risposta di Francesco (12/11/2026):** lasciare così.

**Identificazioni** (esercizio del PoC → scheda del libro, senza proposta sui valori): curl EZ → barbell curls (p. 12);
shoulder press machine → «various machines» del lento avanti (p. 34); trazioni assistite → chin-ups (p. 86); row
machine con appoggio → variante del T-bar con appoggio (p. 101); glute bridge con manubrio → bridging (p. 162);
hyperextension 45° → back extensions (p. 112); French press con manubrio → lying dumbbell triceps extensions (p. 25:
l'alias «Overhead dumbbell triceps extension» è passato alla voce di p. 28).

**Stabilizzatori nelle istruzioni** («keep the abdominals contracted», «isometric contraction of the gluteals») non
sono contati in nessuna voce: non sono nella frase dei muscoli lavorati.

## 6. Domande chiuse

Le risposte dell'11/11/2026 sono D1–D14 e la tabella di §4. Restano a Francesco solo i punti di §5.
