// Catalogo di base, convertito una volta dal catalogo del PoC (step 2; il PoC è nella cronologia git).
// Gli ID NON vanno cambiati né rimossi: lo storico dell'utente e i backup del PoC li usano
// (sono dati, per questo restano in italiano). I campi seguono il modello v2, in inglese.
// Gli approfondimenti sono vuoti di proposito: non vanno inventati testi tecnici o consigli medici.
// Un approfondimento si aggiunge compilando i campi; le immagini vanno in public/exercises/ (percorsi
// relativi, niente domini esterni né SVG incorporati).
import type { CatalogExercise } from '../lib/archive/types';

export const BASE_CATALOG: Readonly<Record<string, CatalogExercise>> = {
  'squat-bilanciere': {
    id: 'squat-bilanciere',
    name: 'Squat bilanciere',
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
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  },
  'rematore-al-cavo-basso': {
    id: 'rematore-al-cavo-basso',
    name: 'Rematore al cavo basso',
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
    description: '',
    image: '',
    imageAlt: '',
    steps: [],
    caution: '',
    sources: []
  }
};
