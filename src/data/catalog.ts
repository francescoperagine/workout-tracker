// Catalogo di base, convertito una volta dal catalogo del PoC (step 2; il PoC è nella cronologia git).
// Gli ID NON vanno cambiati né rimossi senza un reindirizzamento in EXERCISE_REDIRECTS: lo storico
// dell'utente e i backup del PoC li usano (sono dati, per questo restano in italiano). I campi seguono
// il modello dell'archivio, in inglese.
// Gli approfondimenti sono vuoti di proposito: non vanno inventati testi tecnici o consigli medici.
// Un approfondimento si aggiunge compilando i campi; le immagini vanno in public/exercises/ (percorsi
// relativi, niente domini esterni né SVG incorporati).
// I muscoli seguono la regola di ADR-011 (studi di crescita, poi azione articolare); il commento di ogni
// voce dice la fonte, «analogia» dove lo studio è su un esercizio vicino.
import type { CatalogExercise } from '../lib/archive/types';

export const BASE_CATALOG: Readonly<Record<string, CatalogExercise>> = {
  'squat-bilanciere': {
    id: 'squat-bilanciere',
    name: 'Squat bilanciere',
    aliases: ['Squat', 'Back squat', 'Barbell squat'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // Kubo 2019
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'leg-press': {
    id: 'leg-press',
    name: 'Leg press',
    aliases: ['Pressa', 'Pressa orizzontale'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // Kinoshita 2026
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'squat-al-smith': {
    id: 'squat-al-smith',
    name: 'Squat al Smith',
    aliases: ['Smith machine squat', 'Squat Smith'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // analogia con Kubo 2019
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'goblet-squat': {
    id: 'goblet-squat',
    name: 'Goblet squat',
    aliases: ['Squat goblet'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // analogia con Kubo 2019
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'panca-piana-bilanciere': {
    id: 'panca-piana-bilanciere',
    name: 'Panca piana bilanciere',
    aliases: ['Panca piana', 'Bench press', 'Barbell bench press'],
    muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] }, // Ogasawara 2013
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'chest-press': {
    id: 'chest-press',
    name: 'Chest press',
    aliases: ['Macchina pettorali', 'Chest press machine'],
    muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] }, // analogia con Ogasawara 2013
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'panca-piana-manubri': {
    id: 'panca-piana-manubri',
    name: 'Panca piana manubri',
    aliases: ['Dumbbell bench press', 'Panca manubri'],
    muscles: { primary: ['chest'], secondary: ['triceps', 'front-delts'] }, // analogia con Ogasawara 2013
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'rematore-manubri-petto-su-panca-inclinata': {
    id: 'rematore-manubri-petto-su-panca-inclinata',
    name: 'Rematore manubri, petto su panca inclinata',
    aliases: ['Chest supported dumbbell row', 'Rematore manubri panca inclinata'],
    muscles: { primary: ['lats', 'traps'], secondary: ['rear-delts', 'biceps'] }, // azione articolare; bicipiti: analogia con Mannarino 2021
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'row-machine-con-appoggio': {
    id: 'row-machine-con-appoggio',
    name: 'Row machine con appoggio',
    aliases: ['Chest supported row machine'],
    muscles: { primary: ['lats', 'traps'], secondary: ['rear-delts', 'biceps'] }, // azione articolare; bicipiti: analogia con Mannarino 2021
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'hip-thrust-bilanciere': {
    id: 'hip-thrust-bilanciere',
    name: 'Hip thrust bilanciere',
    aliases: ['Barbell hip thrust', "Spinta d'anca bilanciere"],
    muscles: { primary: ['glutes'], secondary: [] }, // Plotkin 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'hip-thrust-machine': {
    id: 'hip-thrust-machine',
    name: 'Hip thrust machine',
    aliases: ["Spinta d'anca macchina"],
    muscles: { primary: ['glutes'], secondary: [] }, // analogia con Plotkin 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'glute-bridge-con-manubrio': {
    id: 'glute-bridge-con-manubrio',
    name: 'Glute bridge con manubrio',
    aliases: ['Dumbbell glute bridge', 'Ponte glutei manubrio'],
    muscles: { primary: ['glutes'], secondary: [] }, // analogia con Plotkin 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'pull-through-al-cavo': {
    id: 'pull-through-al-cavo',
    name: 'Pull-through al cavo',
    aliases: ['Cable pull through'],
    muscles: { primary: ['glutes', 'hamstrings'], secondary: [] }, // femorali: analogia con Morin 2025 e Bourne 2017; resto: azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'distensioni-manubri-seduto-schienale-alto': {
    id: 'distensioni-manubri-seduto-schienale-alto',
    name: 'Distensioni manubri seduto, schienale alto',
    aliases: ['Seated dumbbell shoulder press', 'Shoulder press manubri'],
    muscles: { primary: ['front-delts'], secondary: ['side-delts', 'triceps'] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'shoulder-press-machine': {
    id: 'shoulder-press-machine',
    name: 'Shoulder press machine',
    aliases: ['Macchina spalle', 'Lento avanti macchina'],
    muscles: { primary: ['front-delts'], secondary: ['side-delts', 'triceps'] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'curl-manubri-su-panca-inclinata': {
    id: 'curl-manubri-su-panca-inclinata',
    name: 'Curl manubri su panca inclinata',
    aliases: ['Incline dumbbell curl'],
    muscles: { primary: ['biceps'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'curl-al-cavo-basso': {
    id: 'curl-al-cavo-basso',
    name: 'Curl al cavo basso',
    aliases: ['Low cable curl', 'Cable curl'],
    muscles: { primary: ['biceps'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'curl-ez': {
    id: 'curl-ez',
    name: 'Curl EZ',
    aliases: ['EZ bar curl', 'Curl bilanciere EZ'],
    muscles: { primary: ['biceps'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'alzate-laterali': {
    id: 'alzate-laterali',
    name: 'Alzate laterali',
    aliases: ['Lateral raise', 'Dumbbell lateral raise'],
    muscles: { primary: ['side-delts'], secondary: [] }, // Larsen 2025
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'alzate-al-cavo': {
    id: 'alzate-al-cavo',
    name: 'Alzate al cavo',
    aliases: ['Cable lateral raise'],
    muscles: { primary: ['side-delts'], secondary: [] }, // Larsen 2025
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'macchina-laterali': {
    id: 'macchina-laterali',
    name: 'Macchina laterali',
    aliases: ['Lateral raise machine'],
    muscles: { primary: ['side-delts'], secondary: [] }, // analogia con Larsen 2025
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'standing-calf': {
    id: 'standing-calf',
    name: 'Standing calf',
    aliases: ['Standing calf raise', 'Calf in piedi'],
    muscles: { primary: ['calves'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'calf-alla-leg-press': {
    id: 'calf-alla-leg-press',
    name: 'Calf alla leg press',
    aliases: ['Leg press calf raise'],
    muscles: { primary: ['calves'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'calf-monopodalico-con-manubrio': {
    id: 'calf-monopodalico-con-manubrio',
    name: 'Calf monopodalico con manubrio',
    aliases: ['Single leg dumbbell calf raise'],
    muscles: { primary: ['calves'], secondary: [] }, // azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'stacco-rumeno-bilanciere': {
    id: 'stacco-rumeno-bilanciere',
    name: 'Stacco rumeno bilanciere',
    aliases: ['Stacco rumeno', 'Romanian deadlift', 'RDL', 'Barbell romanian deadlift'],
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['adductors'] }, // femorali: analogia con Morin 2025; resto: azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'stacco-rumeno-manubri': {
    id: 'stacco-rumeno-manubri',
    name: 'Stacco rumeno manubri',
    aliases: ['Dumbbell romanian deadlift'],
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['adductors'] }, // femorali: analogia con Morin 2025; resto: azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'hyperextension-45-con-disco': {
    id: 'hyperextension-45-con-disco',
    name: 'Hyperextension 45° con disco',
    aliases: ['Back extension', 'Iperestensioni'],
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower-back'] }, // femorali: Bourne 2017; resto: azione articolare
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'distensioni-manubri-panca-inclinata': {
    id: 'distensioni-manubri-panca-inclinata',
    name: 'Distensioni manubri panca inclinata',
    aliases: ['Incline dumbbell press', 'Panca inclinata manubri'],
    muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] }, // Chaves 2020
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'incline-chest-press': {
    id: 'incline-chest-press',
    name: 'Incline chest press',
    aliases: ['Macchina pettorali inclinata'],
    muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] }, // analogia con Chaves 2020
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'panca-inclinata-al-smith': {
    id: 'panca-inclinata-al-smith',
    name: 'Panca inclinata al Smith',
    aliases: ['Smith incline bench press'],
    muscles: { primary: ['chest'], secondary: ['front-delts', 'triceps'] }, // analogia con Chaves 2020
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'lat-machine-presa-prona': {
    id: 'lat-machine-presa-prona',
    name: 'Lat machine presa prona',
    aliases: ['Lat pulldown', 'Lat machine'],
    muscles: { primary: ['lats'], secondary: ['biceps', 'traps'] }, // azione articolare; bicipiti: Gentil 2015
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'trazioni-assistite-o-negative': {
    id: 'trazioni-assistite-o-negative',
    name: 'Trazioni assistite o negative',
    aliases: ['Assisted pull up', 'Trazioni assistite'],
    muscles: { primary: ['lats'], secondary: ['biceps', 'traps'] }, // azione articolare; bicipiti: analogia con Gentil 2015
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'lat-monobraccio-al-cavo': {
    id: 'lat-monobraccio-al-cavo',
    name: 'Lat monobraccio al cavo',
    aliases: ['Single arm lat pulldown'],
    muscles: { primary: ['lats'], secondary: ['biceps', 'traps'] }, // azione articolare; bicipiti: analogia con Gentil 2015
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'leg-press-piedi-a-meta-pedana': {
    id: 'leg-press-piedi-a-meta-pedana',
    name: 'Leg press, piedi a metà pedana',
    aliases: ['Leg press mid platform'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // Kinoshita 2026
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'hack-squat': {
    id: 'hack-squat',
    name: 'Hack squat',
    aliases: ['Hack squat machine'],
    muscles: { primary: ['quads', 'glutes', 'adductors'], secondary: [] }, // analogia con Kubo 2019 e Kinoshita 2026
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'leg-extension': {
    id: 'leg-extension',
    name: 'Leg extension',
    aliases: ['Estensioni gambe', 'Leg extension machine'],
    muscles: { primary: ['quads'], secondary: [] }, // Kinoshita 2026
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'rematore-seduto-al-cavo-basso': {
    id: 'rematore-seduto-al-cavo-basso',
    name: 'Rematore seduto al cavo basso',
    aliases: ['Seated cable row', 'Pulley basso', 'Low cable row', 'Rematore al cavo basso'],
    muscles: { primary: ['lats', 'traps'], secondary: ['rear-delts', 'biceps'] }, // azione articolare; bicipiti: analogia con Mannarino 2021
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'rematore-manubrio-monobraccio-con-appoggio': {
    id: 'rematore-manubrio-monobraccio-con-appoggio',
    name: 'Rematore manubrio monobraccio con appoggio',
    aliases: ['One arm dumbbell row', 'Single arm dumbbell row'],
    muscles: { primary: ['lats', 'traps'], secondary: ['rear-delts', 'biceps'] }, // azione articolare; bicipiti: Mannarino 2021
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'row-machine': {
    id: 'row-machine',
    name: 'Row machine',
    aliases: ['Macchina rematore', 'Machine row'],
    muscles: { primary: ['lats', 'traps'], secondary: ['rear-delts', 'biceps'] }, // azione articolare; bicipiti: analogia con Mannarino 2021
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'french-press-ez': {
    id: 'french-press-ez',
    name: 'French press EZ',
    aliases: ['EZ bar skull crusher', 'Skull crusher EZ'],
    muscles: { primary: ['triceps'], secondary: [] }, // analogia con Maeo 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'pushdown-ai-cavi': {
    id: 'pushdown-ai-cavi',
    name: 'Pushdown ai cavi',
    aliases: ['Triceps pushdown', 'Pushdown'],
    muscles: { primary: ['triceps'], secondary: [] }, // Maeo 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'french-press-con-manubrio': {
    id: 'french-press-con-manubrio',
    name: 'French press con manubrio',
    aliases: ['Dumbbell skull crusher', 'Overhead dumbbell triceps extension'],
    muscles: { primary: ['triceps'], secondary: [] }, // analogia con Maeo 2023
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  }
};

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
