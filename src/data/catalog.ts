// Catalogo di base: gli esercizi di Delavier, Strength Training Anatomy, 3ª ed. (delavier-catalog, ADR-014), più
// quelli del PoC che il libro non ha. Gli ID NON vanno cambiati né rimossi senza un reindirizzamento in
// EXERCISE_REDIRECTS: lo storico dell'utente e i backup li usano (sono dati, per questo in italiano).
// Ogni voce: nome italiano d'uso comune, alias (sempre il nome inglese del libro), muscoli come gruppo → quota di una
// serie (MOST_RECRUITED, RECRUITED), fonte nel commento: «Delavier p. N» (pagina del libro, PDF = N + 2), «variante»
// quando la voce è una Variation del libro con un altro attrezzo, «fuori dal libro» con la fonte, «§5 (Pn)» quando le
// regole di lettura non decidono e vale la risposta di Francesco (docs/archive/features/INC-034_delavier-catalog.md, §5).
// Gerarchia delle fonti (SPEC §1, ADR-014): studi confermati, poi il libro, poi studi singoli, analogie e logica, che
// valgono solo dove il libro tace e sono segnati come tali («studio singolo», «analogia», «logica»).
// Gli approfondimenti restano vuoti di proposito: niente testi tecnici o consigli medici inventati; le illustrazioni
// del libro non si usano.
import { MOST_RECRUITED, RECRUITED, type CatalogExercise, type Muscles } from '../lib/archive/types';

const entry = (name: string, aliases: string[], muscles: Muscles) => ({ name, aliases, muscles });

// Una chiave ripetuta è un errore di compilazione: niente doppioni silenziosi.
const ENTRIES: Record<string, ReturnType<typeof entry>> = {
  // 1 Braccia (Delavier pp. 4–31)
  'curl-manubri': entry('Curl manubri', ['Dumbbell curls', 'Curl con manubri'], { forearms: MOST_RECRUITED, brachialis: MOST_RECRUITED, biceps: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, chest: RECRUITED }), // Delavier p. 6
  'curl-concentrato': entry('Curl concentrato', ['Concentration curls', 'Concentration curl'], { biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED }), // Delavier p. 7
  'curl-manubri-su-panca-inclinata': entry('Curl manubri su panca inclinata', ['Incline dumbbell curl', 'Incline dumbbell curls'], { biceps: MOST_RECRUITED, forearms: RECRUITED, brachialis: RECRUITED }), // Delavier p. 8
  'hammer-curl': entry('Hammer curl', ['Hammer curls', 'Curl a martello'], { forearms: MOST_RECRUITED, biceps: RECRUITED, brachialis: RECRUITED }), // Delavier p. 9
  'curl-al-cavo-basso': entry('Curl al cavo basso', ['Low cable curl', 'Cable curl', 'Low-pulley curls'], { biceps: MOST_RECRUITED }), // Delavier p. 10
  'curl-al-cavo-alto': entry('Curl al cavo alto', ['High-pulley curls', 'High cable curl'], { biceps: MOST_RECRUITED, brachialis: RECRUITED }), // Delavier p. 11
  'curl-bilanciere': entry('Curl bilanciere', ['Barbell curls', 'Barbell curl', 'Curl con bilanciere'], { biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: RECRUITED }), // Delavier p. 12
  'curl-ez': entry('Curl EZ', ['EZ bar curl', 'Curl bilanciere EZ'], { biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: RECRUITED }), // Delavier p. 12 (barbell curls con la barra EZ)
  'curl-alla-macchina': entry('Curl alla macchina', ['Machine curls', 'Biceps curl machine'], { biceps: MOST_RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 14
  'curl-al-cavo-con-appoggio': entry('Curl al cavo con appoggio', ['Atlas pulley curl', 'Cable preacher curl'], { biceps: MOST_RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 14, variante
  'curl-panca-scott': entry('Curl alla panca Scott', ['Preacher curls', 'Preacher curl', 'Curl Scott'], { biceps: MOST_RECRUITED }), // Delavier p. 15
  'estensioni-dei-polsi': entry('Estensioni dei polsi con bilanciere', ['Reverse wrist curls', 'Reverse wrist curl'], { forearms: MOST_RECRUITED }), // Delavier p. 16
  'flessioni-dei-polsi': entry('Flessioni dei polsi con bilanciere', ['Wrist curls', 'Wrist curl'], { forearms: MOST_RECRUITED }), // Delavier p. 17
  'curl-inverso-bilanciere': entry('Curl inverso bilanciere', ['Reverse barbell curls', 'Reverse curl', 'Curl presa prona'], { forearms: MOST_RECRUITED, brachialis: RECRUITED, biceps: RECRUITED }), // Delavier p. 18
  'pushdown-ai-cavi': entry('Pushdown ai cavi', ['Triceps pushdown', 'Pushdown', 'Push-downs', 'Pushdown alla corda'], { triceps: MOST_RECRUITED }), // Delavier p. 20
  'pushdown-presa-inversa': entry('Pushdown presa inversa', ['Reverse push-downs', 'Reverse grip pushdown'], { triceps: MOST_RECRUITED, forearms: RECRUITED }), // Delavier p. 21
  'pushdown-inverso-monobraccio': entry('Pushdown inverso a un braccio', ['One-arm reverse push-downs'], { triceps: MOST_RECRUITED }), // Delavier p. 22
  'estensioni-tricipiti-sopra-la-testa-al-cavo': entry('Estensioni tricipiti sopra la testa al cavo', ['Overhead cable triceps extensions', 'Overhead cable triceps extension', 'French press al cavo sopra la testa'], { triceps: MOST_RECRUITED }), // Delavier p. 23
  'french-press-ez': entry('French press EZ', ['EZ bar skull crusher', 'Skull crusher EZ', 'Lying triceps extensions', 'French press bilanciere'], { triceps: MOST_RECRUITED }), // Delavier p. 24
  'french-press-al-cavo': entry('French press al cavo', ['Lying cable triceps extension'], { triceps: MOST_RECRUITED }), // Delavier p. 24, variante
  'french-press-con-manubrio': entry('French press con manubrio', ['Dumbbell skull crusher', 'Lying dumbbell triceps extensions'], { triceps: MOST_RECRUITED }), // Delavier p. 25
  'estensioni-tricipiti-manubrio-monobraccio': entry('Estensioni tricipiti sopra la testa con manubrio a un braccio', ['One-arm overhead dumbbell triceps extensions'], { triceps: MOST_RECRUITED }), // Delavier p. 26
  'kickback-tricipiti': entry('Kickback tricipiti', ['Triceps kickbacks', 'Triceps kickback'], { triceps: MOST_RECRUITED }), // Delavier p. 27
  'estensioni-tricipiti-sopra-la-testa-manubrio': entry('Estensioni tricipiti sopra la testa con manubrio', ['Seated dumbbell triceps extensions', 'Overhead dumbbell triceps extension', 'French press seduto con manubrio'], { triceps: MOST_RECRUITED }), // Delavier p. 28
  'french-press-seduto-ez': entry('French press seduto EZ', ['Seated E-Z bar triceps extensions'], { triceps: MOST_RECRUITED }), // Delavier p. 29
  'dip-tra-panche': entry('Dip tra panche', ['Triceps dips', 'Bench dips'], { triceps: MOST_RECRUITED, chest: MOST_RECRUITED, 'front-delts': RECRUITED }), // Delavier p. 30, §5 (P1)
  // 2 Spalle (pp. 32–60)
  'lento-dietro': entry('Lento dietro', ['Back presses', 'Behind the neck press'], { 'side-delts': MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, 'front-delts': RECRUITED, traps: RECRUITED, triceps: RECRUITED }), // Delavier p. 33, §5 (P2, P3)
  'lento-avanti': entry('Lento avanti', ['Seated front presses', 'Military press', 'Lento avanti seduto'], { 'front-delts': MOST_RECRUITED, 'side-delts': MOST_RECRUITED, chest: MOST_RECRUITED, triceps: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 34
  'shoulder-press-machine': entry('Shoulder press machine', ['Macchina spalle', 'Lento avanti macchina'], { 'front-delts': MOST_RECRUITED, 'side-delts': MOST_RECRUITED, chest: MOST_RECRUITED, triceps: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 34, «various machines»
  'distensioni-manubri-seduto-schienale-alto': entry('Distensioni manubri seduto, schienale alto', ['Seated dumbbell shoulder press', 'Shoulder press manubri', 'Seated dumbbell presses'], { 'side-delts': MOST_RECRUITED, 'front-delts': RECRUITED, 'rear-delts': RECRUITED, traps: RECRUITED, triceps: RECRUITED }), // Delavier p. 35, §5 (P2, P3)
  'distensioni-manubri-sdraiato-gomiti-stretti': entry('Distensioni manubri da sdraiato, gomiti stretti', ['Lying dumbbell presses'], { 'front-delts': MOST_RECRUITED, 'side-delts': RECRUITED }), // Delavier p. 38
  'arnold-press': entry('Arnold press', ['Arnold presses'], { 'front-delts': MOST_RECRUITED, 'side-delts': RECRUITED, 'rear-delts': RECRUITED, chest: RECRUITED, triceps: RECRUITED, traps: RECRUITED }), // Delavier p. 40, §5 (P2, P3)
  'alzate-posteriori-busto-flesso': entry('Alzate posteriori a busto flesso', ['Bent-over lateral raises', 'Rear delt fly', 'Alzate a 90°'], { 'rear-delts': MOST_RECRUITED, 'front-delts': RECRUITED, 'side-delts': RECRUITED, traps: RECRUITED }), // Delavier p. 41, §5 (P3, P4)
  'alzate-laterali': entry('Alzate laterali', ['Lateral raise', 'Dumbbell lateral raise', 'Lateral dumbbell raises'], { 'side-delts': MOST_RECRUITED }), // Delavier p. 42
  'alzate-frontali-alternate': entry('Alzate frontali alternate', ['Alternate front arm raises', 'Front raise', 'Alzate frontali con manubri'], { 'front-delts': MOST_RECRUITED, chest: MOST_RECRUITED, 'side-delts': RECRUITED, 'rear-delts': RECRUITED }), // Delavier p. 44
  'alzate-laterali-da-sdraiato': entry('Alzate laterali da sdraiato', ['Side-lying lateral raises'], { 'front-delts': MOST_RECRUITED, 'side-delts': MOST_RECRUITED, 'rear-delts': MOST_RECRUITED }), // Delavier p. 45, §5 (P5)
  'alzate-frontali-cavo-presa-prona': entry('Alzate frontali al cavo basso, presa prona', ['Low-pulley front raises, overhand grip'], { 'front-delts': MOST_RECRUITED, 'side-delts': RECRUITED, 'rear-delts': RECRUITED, chest: RECRUITED, biceps: RECRUITED }), // Delavier p. 46, §5 (P2, P3)
  'alzate-frontali-cavo-presa-neutra': entry('Alzate frontali al cavo basso, presa neutra', ['Low-pulley front raises, neutral grip'], { 'front-delts': MOST_RECRUITED, chest: RECRUITED, 'side-delts': RECRUITED, biceps: RECRUITED }), // Delavier p. 47, §5 (P2)
  'aperture-posteriori-cavi-alti': entry('Aperture posteriori ai cavi alti', ['High-pulley lateral extensions', 'Reverse cable fly'], { 'rear-delts': MOST_RECRUITED, traps: RECRUITED }), // Delavier p. 49, §5 (P4)
  'extrarotazioni-al-cavo': entry('Extrarotazioni al cavo', ['External arm rotations at a pulley', 'Cable external rotation'], { 'rear-delts': MOST_RECRUITED }), // Delavier p. 50
  'alzate-posteriori-cavo-basso': entry('Alzate posteriori al cavo basso', ['Low-pulley bent-over lateral raises'], { 'rear-delts': MOST_RECRUITED, traps: RECRUITED }), // Delavier p. 51, §5 (P4)
  'alzate-al-cavo': entry('Alzate al cavo', ['Cable lateral raise', 'Low-pulley lateral raises'], { 'side-delts': MOST_RECRUITED }), // Delavier p. 52
  'alzate-frontali-un-manubrio': entry('Alzate frontali con un manubrio', ['One-dumbbell front raises'], { 'front-delts': MOST_RECRUITED, chest: MOST_RECRUITED, biceps: MOST_RECRUITED }), // Delavier p. 54
  'alzate-frontali-bilanciere': entry('Alzate frontali con bilanciere', ['Barbell front raises', 'Barbell front raise'], { 'front-delts': MOST_RECRUITED, chest: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED }), // Delavier p. 55
  'alzate-frontali-cavo-basso-barra': entry('Alzate frontali al cavo basso con barra', ['Front raise at a low pulley', 'Cable front raise'], { 'front-delts': MOST_RECRUITED, chest: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED }), // Delavier p. 55, variante
  'tirate-al-mento': entry('Tirate al mento', ['Upright rows', 'Upright row', 'Tirata al mento'], { 'front-delts': MOST_RECRUITED, 'side-delts': MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, traps: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: RECRUITED, forearms: RECRUITED, abs: RECRUITED, glutes: RECRUITED, 'lower-back': RECRUITED }), // Delavier pp. 56 e 115, le due pagine si contraddicono (p. 56 «mainly» deltoidi, trapezio e bicipiti; p. 115 «mainly» il solo trapezio): vale il più alto (§5 P6)
  'macchina-laterali': entry('Macchina laterali', ['Lateral raise machine', 'Machine lateral raises'], { 'side-delts': MOST_RECRUITED, 'front-delts': RECRUITED, 'rear-delts': RECRUITED }), // Delavier p. 57, §5 (P3)
  'pec-deck-inverso': entry('Pec deck inverso', ['Pec deck rear-delt laterals', 'Reverse pec deck', 'Reverse fly machine'], { 'rear-delts': MOST_RECRUITED, traps: RECRUITED }), // Delavier p. 58, §5 (P4)
  // 3 Petto (pp. 61–84)
  'panca-inclinata-bilanciere': entry('Panca inclinata bilanciere', ['Incline bench presses', 'Incline bench press', 'Panca inclinata'], { chest: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 62
  'panca-inclinata-al-smith': entry('Panca inclinata al Smith', ['Smith incline bench press'], { chest: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 62, variante
  'panca-piana-bilanciere': entry('Panca piana bilanciere', ['Panca piana', 'Bench press', 'Barbell bench press', 'Bench presses'], { chest: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, triceps: RECRUITED }), // Delavier p. 64; tricipiti 0,5 (il libro non li nomina): Ogasawara 2011-2013 e Lanza 2024, confermato (§5 P7)
  'panca-piana-al-smith': entry('Panca piana al Smith', ['Smith machine bench press'], { chest: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, triceps: RECRUITED }), // Delavier p. 64, variante; tricipiti 0,5 come la panca piana (§5 P7)
  'panca-presa-stretta': entry('Panca presa stretta', ['Close-grip bench presses', 'Close grip bench press'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 69
  'panca-presa-stretta-al-smith': entry('Panca presa stretta al Smith', ['Smith machine close grip bench press'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 69, variante
  'panca-declinata-bilanciere': entry('Panca declinata bilanciere', ['Decline bench presses', 'Decline bench press', 'Panca declinata'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED, 'front-delts': MOST_RECRUITED }), // Delavier p. 72
  'panca-declinata-al-smith': entry('Panca declinata al Smith', ['Smith machine decline bench press'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED, 'front-delts': MOST_RECRUITED }), // Delavier p. 72, variante
  'chest-press': entry('Chest press', ['Macchina pettorali', 'Chest press machine', 'Machine bench presses'], { chest: MOST_RECRUITED, triceps: RECRUITED, 'front-delts': RECRUITED }), // Delavier p. 73; il libro dice «posterior», probabile errore: deltoidi anteriori (§5 P8)
  'dip-alle-parallele': entry('Dip alle parallele', ['Parallel bar dips', 'Dips', 'Dip'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 74, §5 (P9)
  'dip-alla-macchina': entry('Dip alla macchina', ['Dips machine', 'Dip machine'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 74, variante, §5 (P9)
  'piegamenti-sulle-braccia': entry('Piegamenti sulle braccia', ['Push-ups', 'Push-up', 'Flessioni'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 76
  'panca-piana-manubri': entry('Panca piana manubri', ['Dumbbell bench press', 'Panca manubri', 'Dumbbell presses'], { chest: MOST_RECRUITED, triceps: RECRUITED, 'front-delts': RECRUITED }), // Delavier p. 77
  'croci-manubri': entry('Croci con manubri', ['Dumbbell flys', 'Dumbbell fly', 'Croci su panca piana'], { chest: MOST_RECRUITED }), // Delavier p. 78
  'distensioni-manubri-panca-inclinata': entry('Distensioni manubri panca inclinata', ['Incline dumbbell press', 'Panca inclinata manubri', 'Incline dumbbell presses'], { chest: MOST_RECRUITED, 'front-delts': RECRUITED, triceps: RECRUITED }), // Delavier p. 79
  'croci-panca-inclinata': entry('Croci su panca inclinata', ['Incline dumbbell flys', 'Incline dumbbell fly'], { chest: MOST_RECRUITED }), // Delavier p. 80
  'pec-deck': entry('Pec deck', ['Pec deck flys', 'Butterfly', 'Pec fly machine'], { chest: MOST_RECRUITED, biceps: RECRUITED }), // Delavier p. 81
  'croci-ai-cavi': entry('Croci ai cavi', ['Cable crossover flys', 'Cable crossover'], { chest: MOST_RECRUITED }), // Delavier p. 82
  'pullover-manubrio': entry('Pullover con manubrio', ['Dumbbell pullovers', 'Dumbbell pullover', 'Pullover'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED, lats: MOST_RECRUITED }), // Delavier p. 83; romboidi: §5 (P10)
  'pullover-alla-macchina': entry('Pullover alla macchina', ['Pullover machine'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED, lats: MOST_RECRUITED }), // Delavier p. 83, variante; romboidi: §5 (P10)
  'pullover-bilanciere': entry('Pullover con bilanciere', ['Barbell pullovers', 'Barbell pullover'], { chest: MOST_RECRUITED, triceps: MOST_RECRUITED, lats: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 84; romboidi: §5 (P10)
  'incline-chest-press': entry('Incline chest press', ['Macchina pettorali inclinata'], { chest: MOST_RECRUITED, 'front-delts': MOST_RECRUITED, triceps: MOST_RECRUITED }), // fuori dal libro, analogia con la panca inclinata, p. 62 (§5 P11)
  // 4 Dorso (pp. 85–121)
  'trazioni-alla-sbarra': entry('Trazioni alla sbarra', ['Chin-ups', 'Pull-ups', 'Pull up', 'Trazioni presa prona'], { lats: MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 86
  'trazioni-assistite-o-negative': entry('Trazioni assistite o negative', ['Assisted pull up', 'Trazioni assistite'], { lats: MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 86 (trazioni con assistenza)
  'trazioni-presa-inversa': entry('Trazioni presa inversa', ['Reverse chin-ups', 'Chin up', 'Trazioni presa supina'], { lats: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, traps: RECRUITED, chest: RECRUITED }), // Delavier p. 88, §5 (P12)
  'lat-machine-presa-inversa': entry('Lat machine presa inversa', ['Reverse grip lat pulldown', 'Lat machine presa supina'], { lats: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, traps: RECRUITED, chest: RECRUITED }), // Delavier p. 88, variante, §5 (P12)
  'lat-machine-presa-prona': entry('Lat machine presa prona', ['Lat pulldown', 'Lat machine', 'Lat pull-downs'], { lats: MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, chest: RECRUITED }), // Delavier p. 90
  'lat-machine-dietro-la-nuca': entry('Lat machine dietro la nuca', ['Back lat pull-downs', 'Behind the neck lat pulldown'], { lats: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 91
  'lat-machine-a-leva': entry('Lat machine a leva', ['Machine lat pulldown', 'Lever lat pulldown'], { lats: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 91, variante
  'lat-machine-presa-stretta': entry('Lat machine presa stretta', ['Close-grip lat pull-downs', 'Close grip lat pulldown', 'Lat machine con triangolo'], { lats: MOST_RECRUITED, traps: RECRUITED, 'rear-delts': RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 93, §5 (P13)
  'lat-monobraccio-al-cavo': entry('Lat monobraccio al cavo', ['Single arm lat pulldown'], { lats: MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, chest: RECRUITED }), // fuori dal libro, analogia con la lat machine, p. 90 (§5 P11)
  'rematore-seduto-al-cavo-basso': entry('Rematore seduto al cavo basso', ['Seated cable row', 'Pulley basso', 'Low cable row', 'Rematore al cavo basso', 'Seated rows'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 94, §5 (P4)
  'rematore-cavo-basso-presa-larga': entry('Rematore al cavo basso, presa larga', ['Wide grip seated rows', 'Wide grip seated row'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 95, §5 (P4)
  'pullover-al-cavo': entry('Pullover al cavo alto', ['Straight-arm lat pull-downs', 'Straight arm pulldown', 'Lat machine a braccia tese'], { lats: MOST_RECRUITED, triceps: MOST_RECRUITED }), // Delavier p. 96; tricipiti: §5 (P10)
  'rematore-manubrio-monobraccio-con-appoggio': entry('Rematore manubrio monobraccio con appoggio', ['One arm dumbbell row', 'Single arm dumbbell row', 'One-arm dumbbell rows'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, traps: RECRUITED, biceps: RECRUITED, brachialis: RECRUITED, forearms: RECRUITED }), // Delavier p. 97, §5 (P4)
  'rematore-manubri': entry('Rematore con manubri', ['Dumbbell rows', 'Bent over dumbbell row'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 98, §5 (P4, P13)
  'rematore-bilanciere': entry('Rematore bilanciere', ['Barbell rows', 'Barbell row', 'Bent over row', 'Rematore con bilanciere'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 99, §5 (P4, P13)
  't-bar-row': entry('T-bar row', ['T-bar rows', 'Rematore T-bar'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, traps: MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, abs: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 100, §5 (P13)
  't-bar-row-con-appoggio': entry('T-bar row con appoggio', ['T-bar rows with abdominal support', 'Chest supported T-bar row'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 101
  'row-machine-con-appoggio': entry('Row machine con appoggio', ['Chest supported row machine'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: MOST_RECRUITED }), // Delavier p. 101, variante
  'rematore-manubri-petto-su-panca-inclinata': entry('Rematore manubri, petto su panca inclinata', ['Chest supported dumbbell row', 'Rematore manubri panca inclinata'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, brachialis: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: MOST_RECRUITED }), // fuori dal libro, analogia con il T-bar row con appoggio, p. 101 (§5 P11)
  'row-machine': entry('Row machine', ['Macchina rematore', 'Machine row'], { lats: MOST_RECRUITED, 'rear-delts': MOST_RECRUITED, biceps: MOST_RECRUITED, forearms: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED }), // fuori dal libro, analogia con il rematore seduto al cavo basso, p. 94 (§5 P11)
  'stacco-gambe-tese': entry('Stacco a gambe tese', ['Stiff-legged deadlifts', 'Stiff leg deadlift'], { 'lower-back': MOST_RECRUITED, glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // Delavier p. 102
  'stacco-rumeno-bilanciere': entry('Stacco rumeno bilanciere', ['Stacco rumeno', 'Romanian deadlift', 'RDL', 'Barbell romanian deadlift'], { 'lower-back': MOST_RECRUITED, glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // Delavier p. 102, §5 (P14)
  'stacco-rumeno-manubri': entry('Stacco rumeno manubri', ['Dumbbell romanian deadlift'], { 'lower-back': MOST_RECRUITED, glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // Delavier p. 102, §5 (P14)
  'stacco-sumo': entry('Stacco sumo', ['Sumo deadlifts', 'Sumo deadlift'], { quads: MOST_RECRUITED, adductors: MOST_RECRUITED, 'lower-back': RECRUITED, glutes: RECRUITED }), // Delavier p. 103, §5 (P15)
  'stacco-da-terra': entry('Stacco da terra', ['Deadlifts', 'Deadlift', 'Stacco classico'], { lats: MOST_RECRUITED, glutes: MOST_RECRUITED, traps: RECRUITED, 'lower-back': RECRUITED, hamstrings: RECRUITED, quads: RECRUITED }), // Delavier p. 104, fig. p. 110; lombari: didascalia e figura non concordano, vale la figura (D8)
  'stacco-trap-bar': entry('Stacco con trap bar', ['Trap bar deadlifts', 'Trap bar deadlift', 'Hex bar deadlift'], { traps: MOST_RECRUITED, quads: MOST_RECRUITED, lats: RECRUITED, 'lower-back': RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED }), // Delavier p. 108, fig. p. 110
  'hyperextension-45-con-disco': entry('Hyperextension 45° con disco', ['Back extension', 'Iperestensioni', 'Back extensions'], { 'lower-back': MOST_RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED }), // Delavier p. 112
  'iperestensioni-alla-macchina': entry('Iperestensioni alla macchina', ['Machine back extensions', 'Lower back machine'], { 'lower-back': MOST_RECRUITED }), // Delavier p. 113
  'scrollate-bilanciere': entry('Scrollate con bilanciere', ['Barbell shrugs', 'Barbell shrug', 'Shrug bilanciere'], { traps: MOST_RECRUITED }), // Delavier p. 116
  'scrollate-manubri': entry('Scrollate con manubri', ['Dumbbell shrugs', 'Dumbbell shrug', 'Shrug manubri'], { traps: MOST_RECRUITED }), // Delavier p. 117
  'scrollate-trap-bar': entry('Scrollate con trap bar', ['Trap bar shrugs'], { traps: MOST_RECRUITED }), // Delavier p. 118
  'scrollate-alla-macchina': entry('Scrollate alla macchina', ['Machine shrugs'], { traps: MOST_RECRUITED }), // Delavier p. 119
  // 5 Gambe (pp. 122–154)
  'squat-manubri': entry('Squat con manubri', ['Dumbbell squats', 'Dumbbell squat'], { quads: MOST_RECRUITED, glutes: MOST_RECRUITED }), // Delavier p. 123
  'squat-sumo-manubrio': entry('Squat sumo con manubrio', ['Squats with a dumbbell held between the legs', 'Dumbbell sumo squat', 'Plié squat'], { quads: MOST_RECRUITED, glutes: RECRUITED, adductors: RECRUITED }), // Delavier p. 124, §5 (P2, P16)
  'front-squat': entry('Front squat', ['Front squats', 'Squat frontale'], { quads: MOST_RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED, abs: RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 125
  'goblet-squat': entry('Goblet squat', ['Squat goblet'], { quads: MOST_RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED, abs: RECRUITED, 'lower-back': RECRUITED }), // fuori dal libro, analogia con il front squat, p. 125 (§5 P11)
  'squat-bilanciere': entry('Squat bilanciere', ['Squat', 'Back squat', 'Barbell squat', 'Squats'], { quads: MOST_RECRUITED, glutes: MOST_RECRUITED, adductors: MOST_RECRUITED, 'lower-back': MOST_RECRUITED, abs: MOST_RECRUITED }), // Delavier p. 126; femorali 0 (il libro dice 1): Kubo 2019 e Plotkin 2023, confermato (§5 P17)
  'squat-al-smith': entry('Squat al Smith', ['Smith machine squat', 'Squat Smith'], { quads: MOST_RECRUITED, glutes: MOST_RECRUITED, adductors: MOST_RECRUITED, 'lower-back': MOST_RECRUITED, abs: MOST_RECRUITED }), // Delavier p. 127, variante; femorali 0 come lo squat (§5 P17)
  'squat-bilanciere-basso': entry('Squat a bilanciere basso', ['Power squats', 'Low bar squat', 'Squat powerlifting'], { quads: MOST_RECRUITED, adductors: MOST_RECRUITED, glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED, abs: MOST_RECRUITED, 'lower-back': MOST_RECRUITED }), // Delavier p. 129
  'leg-press': entry('Leg press', ['Pressa', 'Pressa orizzontale', 'Incline leg presses', 'Pressa inclinata'], { quads: MOST_RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED, adductors: RECRUITED }), // Delavier p. 135, §5 (P18); Kinoshita 2026 (glutei più dei quadricipiti, femorali no) è uno studio singolo: non scavalca il libro
  'leg-press-piedi-a-meta-pedana': entry('Leg press, piedi a metà pedana', ['Leg press mid platform'], { quads: MOST_RECRUITED, glutes: RECRUITED, hamstrings: RECRUITED, adductors: RECRUITED }), // Delavier p. 135, §5 (P18); Kinoshita 2026 (glutei più dei quadricipiti, femorali no) è uno studio singolo: non scavalca il libro
  'hack-squat': entry('Hack squat', ['Hack squat machine', 'Hack squats'], { quads: MOST_RECRUITED }), // Delavier p. 136
  'box-squat': entry('Box squat', ['Box squats'], { quads: MOST_RECRUITED }), // Delavier p. 137, §5 (P19)
  'leg-extension': entry('Leg extension', ['Estensioni gambe', 'Leg extension machine', 'Leg extensions'], { quads: MOST_RECRUITED }), // Delavier p. 138
  'leg-curl-sdraiato': entry('Leg curl sdraiato', ['Lying leg curls', 'Lying leg curl'], { hamstrings: MOST_RECRUITED, calves: MOST_RECRUITED, popliteus: MOST_RECRUITED }), // Delavier p. 140
  'leg-curl-in-piedi': entry('Leg curl in piedi', ['Standing leg curls', 'Standing leg curl'], { hamstrings: MOST_RECRUITED, calves: RECRUITED }), // Delavier p. 141
  'leg-curl-seduto': entry('Leg curl seduto', ['Seated leg curls', 'Seated leg curl', 'Leg curl'], { hamstrings: MOST_RECRUITED, popliteus: MOST_RECRUITED, calves: RECRUITED }), // Delavier p. 142
  'good-morning': entry('Good morning', ['Good mornings'], { glutes: MOST_RECRUITED, 'lower-back': MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // Delavier p. 144
  'adduzioni-al-cavo': entry('Adduzioni al cavo', ['Cable adductions', 'Cable adduction'], { adductors: MOST_RECRUITED }), // Delavier p. 146
  'adductor-machine': entry('Adductor machine', ['Machine adductions', 'Macchina adduttori', 'Adduzioni alla macchina'], { adductors: MOST_RECRUITED }), // Delavier p. 147
  'calf-a-corpo-libero': entry('Calf a corpo libero su un gradino', ['Flexion and extension of the feet', 'Bodyweight calf raise'], { calves: MOST_RECRUITED }), // Delavier p. 148
  'standing-calf': entry('Standing calf', ['Standing calf raise', 'Calf in piedi', 'Standing calf raises'], { calves: MOST_RECRUITED }), // Delavier p. 149
  'calf-in-piedi-bilanciere': entry('Calf in piedi con bilanciere', ['Barbell standing calf raise'], { calves: MOST_RECRUITED }), // Delavier p. 149, variante
  'calf-alla-leg-press': entry('Calf alla leg press', ['Leg press calf raise'], { calves: MOST_RECRUITED }), // fuori dal libro, logica: flessione plantare come lo standing calf (§5 P11)
  'calf-monopodalico-con-manubrio': entry('Calf monopodalico con manubrio', ['Single leg dumbbell calf raise', 'One-leg toe raises'], { calves: MOST_RECRUITED }), // Delavier p. 150
  'donkey-calf': entry('Donkey calf', ['Donkey calf raises', 'Donkey calf raise'], { calves: MOST_RECRUITED }), // Delavier p. 151
  'calf-seduto-macchina': entry('Calf seduto alla macchina', ['Seated machine calf raises', 'Seated calf raise'], { calves: MOST_RECRUITED }), // Delavier p. 152
  'calf-seduto-bilanciere': entry('Calf seduto con bilanciere', ['Seated barbell calf raises'], { calves: MOST_RECRUITED }), // Delavier p. 153
  // 6 Glutei (pp. 155–169)
  'affondi-bilanciere': entry('Affondi con bilanciere', ['Barbell lunges', 'Barbell lunge'], { glutes: MOST_RECRUITED, quads: RECRUITED, hamstrings: RECRUITED }), // Delavier p. 156, §5 (P20)
  'affondi-manubri': entry('Affondi con manubri', ['Dumbbell lunges', 'Dumbbell lunge', 'Affondi'], { glutes: MOST_RECRUITED, quads: MOST_RECRUITED }), // Delavier p. 157
  'slanci-posteriori-al-cavo': entry('Slanci posteriori al cavo', ['Cable back kicks', 'Cable kickback', 'Kickback glutei al cavo'], { glutes: MOST_RECRUITED, hamstrings: RECRUITED }), // Delavier p. 159
  'slanci-posteriori-alla-macchina': entry('Slanci posteriori alla macchina', ['Machine hip extensions', 'Glute kickback machine'], { glutes: MOST_RECRUITED, hamstrings: RECRUITED }), // Delavier p. 160
  'slanci-posteriori-a-terra': entry('Slanci posteriori a terra', ['Floor hip extensions', 'Donkey kick'], { glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // Delavier p. 161
  'ponte-glutei': entry('Ponte glutei', ['Bridging', 'Glute bridge', 'Ponte'], { hamstrings: MOST_RECRUITED, glutes: MOST_RECRUITED }), // Delavier p. 162
  'glute-bridge-con-manubrio': entry('Glute bridge con manubrio', ['Dumbbell glute bridge', 'Ponte glutei manubrio'], { hamstrings: MOST_RECRUITED, glutes: MOST_RECRUITED }), // Delavier p. 162 (con il manubrio)
  'hip-thrust-bilanciere': entry('Hip thrust bilanciere', ['Barbell hip thrust', "Spinta d'anca bilanciere"], { glutes: MOST_RECRUITED }), // fuori dal libro: Plotkin 2023, studio singolo (vale perché il libro tace)
  'hip-thrust-machine': entry('Hip thrust machine', ["Spinta d'anca macchina"], { glutes: MOST_RECRUITED }), // fuori dal libro, analogia con l'hip thrust bilanciere (Plotkin 2023) (§5 P11)
  'pull-through-al-cavo': entry('Pull-through al cavo', ['Cable pull through'], { glutes: MOST_RECRUITED, hamstrings: MOST_RECRUITED }), // fuori dal libro, analogia con Morin 2025 e Bourne 2017 (§5 P11)
  'abduzioni-al-cavo': entry('Abduzioni al cavo', ['Cable hip abductions', 'Cable hip abduction'], { glutes: MOST_RECRUITED }), // Delavier p. 164
  'abduzioni-in-piedi-macchina': entry('Abduzioni in piedi alla macchina', ['Standing machine hip abductions'], { glutes: MOST_RECRUITED }), // Delavier p. 166
  'abduzioni-da-sdraiato': entry('Abduzioni da sdraiato', ['Lying hip abductions', 'Side-lying leg raise'], { glutes: MOST_RECRUITED }), // Delavier p. 167
  'abductor-machine': entry('Abductor machine', ['Seated machine hip abductions', 'Macchina abduttori', 'Abduzioni alla macchina'], { glutes: MOST_RECRUITED }), // Delavier p. 168
  // 7 Addome (pp. 170–188)
  'crunch-a-terra': entry('Crunch a terra', ['Crunches'], { abs: MOST_RECRUITED }), // Delavier p. 172
  'sit-up': entry('Sit-up', ['Sit-ups'], { abs: MOST_RECRUITED, 'hip-flexors': RECRUITED }), // Delavier p. 173
  'sit-up-alla-spalliera': entry('Sit-up alla spalliera', ['Gym ladder sit-ups'], { abs: MOST_RECRUITED }), // Delavier p. 174
  'crunch-polpacci-sulla-panca': entry('Crunch con i polpacci sulla panca', ['Calves over bench sit-ups'], { abs: MOST_RECRUITED }), // Delavier p. 175
  'sit-up-panca-inclinata': entry('Sit-up su panca inclinata', ['Incline bench sit-ups', 'Decline sit-up'], { abs: MOST_RECRUITED, 'hip-flexors': RECRUITED }), // Delavier p. 176, §5 (P2)
  'sit-up-panca-romana': entry('Sit-up alla panca romana', ['Suspended bench sit-ups', 'Roman chair sit-up'], { abs: MOST_RECRUITED, 'hip-flexors': MOST_RECRUITED }), // Delavier p. 177, §5 (P21)
  'crunch-al-cavo-alto': entry('Crunch al cavo alto', ['High-pulley crunches', 'Cable crunch'], { abs: MOST_RECRUITED }), // Delavier p. 178
  'crunch-alla-macchina': entry('Crunch alla macchina', ['Machine crunches', 'Ab crunch machine'], { abs: MOST_RECRUITED }), // Delavier p. 179, §5 (P22)
  'leg-raise-panca-inclinata': entry('Leg raise su panca inclinata', ['Incline leg raises'], { 'hip-flexors': MOST_RECRUITED, abs: MOST_RECRUITED }), // Delavier p. 180
  'leg-raise-sedia-romana': entry('Leg raise alla sedia romana', ['Leg raises', 'Captain chair leg raise', 'Knee raise'], { 'hip-flexors': MOST_RECRUITED, abs: MOST_RECRUITED }), // Delavier p. 182
  'leg-raise-alla-sbarra': entry('Leg raise alla sbarra', ['Hanging leg raises', 'Hanging leg raise'], { 'hip-flexors': MOST_RECRUITED, abs: MOST_RECRUITED }), // Delavier p. 183
  'torsioni-busto-bastone': entry('Torsioni del busto con bastone', ['Trunk rotations'], { abs: MOST_RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 184
  'piegamenti-laterali-manubrio': entry('Piegamenti laterali con manubrio', ['Dumbbell side bends', 'Dumbbell side bend'], { abs: MOST_RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 185
  'piegamenti-laterali-cavo-basso': entry('Piegamenti laterali al cavo basso', ['Cable side bend'], { abs: MOST_RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 185, variante
  'piegamenti-laterali-panca-romana': entry('Piegamenti laterali alla panca romana', ['Roman chair side bends'], { abs: MOST_RECRUITED, 'lower-back': RECRUITED }), // Delavier p. 186, §5 (P13)
  'rotazioni-busto-macchina': entry('Rotazioni del busto alla macchina', ['Machine trunk rotations', 'Torso rotation machine'], { abs: MOST_RECRUITED }), // Delavier p. 187
  'rotazioni-busto-macchina-seduto': entry('Rotazioni del busto alla macchina da seduto', ['Seated torso rotation machine'], { abs: MOST_RECRUITED }), // Delavier p. 187, variante
};

/** Gli approfondimenti (descrizione, immagine, passi, avvertenze, fonti) sono vuoti finché non c'è un testo verificato */
export const BASE_CATALOG: Readonly<Record<string, CatalogExercise>> = Object.fromEntries(
  Object.entries(ENTRIES).map(([id, e]) => [id, { id, ...e, description: '', image: '', imageAlt: '', steps: [], caution: '', sources: [] }]),
);

/**
 * ID tolti dal catalogo di base → ID che li sostituisce (ADR-009). Si applicano a ogni archivio letto,
 * ai backup e all'import del PoC. Mai rimuovere una voce di qui: un backup vecchio può ancora usarla;
 * la destinazione è sempre in BASE_CATALOG e non è a sua volta una chiave (niente catene).
 * - 10 novembre 2026, muscle-volume (D12): «Rematore al cavo basso» era lo stesso esercizio del
 *   rematore seduto al pulley basso.
 */
export const EXERCISE_REDIRECTS: Readonly<Record<string, string>> = {
  'rematore-al-cavo-basso': 'rematore-seduto-al-cavo-basso',
};
