// Schede A/B del PoC (window.schedeIniziali, nella cronologia git), convertite una volta
// nel modello v2 (step 2): recuperi in secondi (per un intervallo
// il minimo), carichi divisi in loadMin, loadMax e loadNote, superserie da "2a"/"2b".
// Il PoC non indica il numero di serie né il recupero di riscaldamento: valgono i predefiniti della
// conversione (3 serie, 60 s), modificabili nella scheda. Gli ID di schede e voci restano stabili.
import type { Routine } from '../lib/archive/types';

export const STARTER_ROUTINES: readonly Routine[] = [
  {
    id: 'routine-a',
    name: 'Scheda A',
    notes: '',
    archived: false,
    exercises: [
      {
        id: 'a-1',
        exerciseId: 'squat-bilanciere',
        alternatives: [
          'leg-press',
          'squat-al-smith',
          'goblet-squat'
        ],
        group: null,
        sets: 3,
        reps: '6–8',
        loadMin: 45,
        loadMax: 50,
        loadNote: '',
        unit: '',
        rest: 120,
        warmupRest: 60
      },
      {
        id: 'a-2a',
        exerciseId: 'panca-piana-bilanciere',
        alternatives: [
          'chest-press',
          'panca-piana-manubri'
        ],
        group: '2',
        sets: 3,
        reps: '6–8',
        loadMin: 40,
        loadMax: 40,
        loadNote: '',
        unit: '',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'a-2b',
        exerciseId: 'rematore-manubri-petto-su-panca-inclinata',
        alternatives: [
          'rematore-al-cavo-basso',
          'row-machine-con-appoggio'
        ],
        group: '2',
        sets: 3,
        reps: '8–10',
        loadMin: 12,
        loadMax: 14,
        loadNote: '',
        unit: 'per manubrio',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'a-3',
        exerciseId: 'hip-thrust-bilanciere',
        alternatives: [
          'hip-thrust-machine',
          'glute-bridge-con-manubrio',
          'pull-through-al-cavo'
        ],
        group: null,
        sets: 3,
        reps: '8–12',
        loadMin: 40,
        loadMax: 40,
        loadNote: 'da tarare',
        unit: '',
        rest: 90,
        warmupRest: 60
      },
      {
        id: 'a-4a',
        exerciseId: 'distensioni-manubri-seduto-schienale-alto',
        alternatives: [
          'shoulder-press-machine'
        ],
        group: '4',
        sets: 3,
        reps: '8–12',
        loadMin: 10,
        loadMax: 12,
        loadNote: '',
        unit: 'per manubrio',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'a-4b',
        exerciseId: 'curl-manubri-su-panca-inclinata',
        alternatives: [
          'curl-al-cavo-basso',
          'curl-ez'
        ],
        group: '4',
        sets: 3,
        reps: '10–12',
        loadMin: 8,
        loadMax: 8,
        loadNote: '',
        unit: 'per manubrio',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'a-5a',
        exerciseId: 'alzate-laterali',
        alternatives: [
          'alzate-al-cavo',
          'macchina-laterali'
        ],
        group: '5',
        sets: 3,
        reps: '12–15',
        loadMin: 6,
        loadMax: 7,
        loadNote: '',
        unit: 'per manubrio',
        rest: 45,
        warmupRest: 60
      },
      {
        id: 'a-5b',
        exerciseId: 'standing-calf',
        alternatives: [
          'calf-alla-leg-press',
          'calf-monopodalico-con-manubrio'
        ],
        group: '5',
        sets: 3,
        reps: '10–15',
        loadMin: 50,
        loadMax: 50,
        loadNote: '',
        unit: '',
        rest: 45,
        warmupRest: 60
      }
    ]
  },
  {
    id: 'routine-b',
    name: 'Scheda B',
    notes: '',
    archived: false,
    exercises: [
      {
        id: 'b-1',
        exerciseId: 'stacco-rumeno-bilanciere',
        alternatives: [
          'stacco-rumeno-manubri',
          'hyperextension-45-con-disco'
        ],
        group: null,
        sets: 3,
        reps: '8–10',
        loadMin: 40,
        loadMax: 40,
        loadNote: '',
        unit: '',
        rest: 120,
        warmupRest: 60
      },
      {
        id: 'b-2a',
        exerciseId: 'distensioni-manubri-panca-inclinata',
        alternatives: [
          'incline-chest-press',
          'panca-inclinata-al-smith'
        ],
        group: '2',
        sets: 3,
        reps: '8–12',
        loadMin: 10,
        loadMax: 12,
        loadNote: '',
        unit: 'per manubrio',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'b-2b',
        exerciseId: 'lat-machine-presa-prona',
        alternatives: [
          'trazioni-assistite-o-negative',
          'lat-monobraccio-al-cavo'
        ],
        group: '2',
        sets: 3,
        reps: '8–12',
        loadMin: 35,
        loadMax: 39,
        loadNote: '',
        unit: '',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'b-3',
        exerciseId: 'leg-press-piedi-a-meta-pedana',
        alternatives: [
          'hack-squat',
          'goblet-squat',
          'leg-extension'
        ],
        group: null,
        sets: 3,
        reps: '10–12',
        loadMin: null,
        loadMax: null,
        loadNote: 'Da tarare',
        unit: '',
        rest: 90,
        warmupRest: 60
      },
      {
        id: 'b-4a',
        exerciseId: 'rematore-seduto-al-cavo-basso',
        alternatives: [
          'rematore-manubrio-monobraccio-con-appoggio',
          'row-machine'
        ],
        group: '4',
        sets: 3,
        reps: '10–12',
        loadMin: 39,
        loadMax: 39,
        loadNote: '',
        unit: '',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'b-4b',
        exerciseId: 'french-press-ez',
        alternatives: [
          'pushdown-ai-cavi',
          'french-press-con-manubrio'
        ],
        group: '4',
        sets: 3,
        reps: '10–12',
        loadMin: null,
        loadMax: null,
        loadNote: 'Bilanciere + 5 kg',
        unit: '',
        rest: 60,
        warmupRest: 60
      },
      {
        id: 'b-5a',
        exerciseId: 'alzate-laterali',
        alternatives: [
          'alzate-al-cavo'
        ],
        group: '5',
        sets: 3,
        reps: '12–15',
        loadMin: 6,
        loadMax: 7,
        loadNote: '',
        unit: 'per manubrio',
        rest: 45,
        warmupRest: 60
      },
      {
        id: 'b-5b',
        exerciseId: 'standing-calf',
        alternatives: [
          'calf-alla-leg-press',
          'calf-monopodalico-con-manubrio'
        ],
        group: '5',
        sets: 3,
        reps: '10–15',
        loadMin: 50,
        loadMax: 55,
        loadNote: '',
        unit: '',
        rest: 45,
        warmupRest: 60
      }
    ]
  }
];
