// Schede A/B del PoC (window.schedeIniziali di BodyTracker/palestra/esercizi.js), convertite una volta
// nel modello v2 con src/lib/archivio/conversione.ts (step 2): recuperi in secondi (per un intervallo
// il minimo), carichi divisi in caricoMin, caricoMax e notaCarico, superserie da "2a"/"2b".
// Il PoC non indica il numero di serie né il recupero di riscaldamento: valgono i predefiniti della
// conversione (3 serie, 60 s), modificabili nella scheda. Gli ID di schede e voci restano stabili.
import type { Scheda } from '../lib/archivio/tipi';

export const SCHEDE_INIZIALI: readonly Scheda[] = [
  {
    id: 'scheda-a',
    nome: 'Scheda A',
    note: '',
    archiviata: false,
    voci: [
      {
        id: 'a-1',
        esercizioId: 'squat-bilanciere',
        alternative: [
          'leg-press',
          'squat-al-smith',
          'goblet-squat'
        ],
        gruppo: null,
        serie: 3,
        ripetizioni: '6–8',
        caricoMin: 45,
        caricoMax: 50,
        notaCarico: '',
        unita: '',
        recupero: 120,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-2a',
        esercizioId: 'panca-piana-bilanciere',
        alternative: [
          'chest-press',
          'panca-piana-manubri'
        ],
        gruppo: '2',
        serie: 3,
        ripetizioni: '6–8',
        caricoMin: 40,
        caricoMax: 40,
        notaCarico: '',
        unita: '',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-2b',
        esercizioId: 'rematore-manubri-petto-su-panca-inclinata',
        alternative: [
          'rematore-al-cavo-basso',
          'row-machine-con-appoggio'
        ],
        gruppo: '2',
        serie: 3,
        ripetizioni: '8–10',
        caricoMin: 12,
        caricoMax: 14,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-3',
        esercizioId: 'hip-thrust-bilanciere',
        alternative: [
          'hip-thrust-machine',
          'glute-bridge-con-manubrio',
          'pull-through-al-cavo'
        ],
        gruppo: null,
        serie: 3,
        ripetizioni: '8–12',
        caricoMin: 40,
        caricoMax: 40,
        notaCarico: 'da tarare',
        unita: '',
        recupero: 90,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-4a',
        esercizioId: 'distensioni-manubri-seduto-schienale-alto',
        alternative: [
          'shoulder-press-machine'
        ],
        gruppo: '4',
        serie: 3,
        ripetizioni: '8–12',
        caricoMin: 10,
        caricoMax: 12,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-4b',
        esercizioId: 'curl-manubri-su-panca-inclinata',
        alternative: [
          'curl-al-cavo-basso',
          'curl-ez'
        ],
        gruppo: '4',
        serie: 3,
        ripetizioni: '10–12',
        caricoMin: 8,
        caricoMax: 8,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-5a',
        esercizioId: 'alzate-laterali',
        alternative: [
          'alzate-al-cavo',
          'macchina-laterali'
        ],
        gruppo: '5',
        serie: 3,
        ripetizioni: '12–15',
        caricoMin: 6,
        caricoMax: 7,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 45,
        recuperoRiscaldamento: 60
      },
      {
        id: 'a-5b',
        esercizioId: 'standing-calf',
        alternative: [
          'calf-alla-leg-press',
          'calf-monopodalico-con-manubrio'
        ],
        gruppo: '5',
        serie: 3,
        ripetizioni: '10–15',
        caricoMin: 50,
        caricoMax: 50,
        notaCarico: '',
        unita: '',
        recupero: 45,
        recuperoRiscaldamento: 60
      }
    ]
  },
  {
    id: 'scheda-b',
    nome: 'Scheda B',
    note: '',
    archiviata: false,
    voci: [
      {
        id: 'b-1',
        esercizioId: 'stacco-rumeno-bilanciere',
        alternative: [
          'stacco-rumeno-manubri',
          'hyperextension-45-con-disco'
        ],
        gruppo: null,
        serie: 3,
        ripetizioni: '8–10',
        caricoMin: 40,
        caricoMax: 40,
        notaCarico: '',
        unita: '',
        recupero: 120,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-2a',
        esercizioId: 'distensioni-manubri-panca-inclinata',
        alternative: [
          'incline-chest-press',
          'panca-inclinata-al-smith'
        ],
        gruppo: '2',
        serie: 3,
        ripetizioni: '8–12',
        caricoMin: 10,
        caricoMax: 12,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-2b',
        esercizioId: 'lat-machine-presa-prona',
        alternative: [
          'trazioni-assistite-o-negative',
          'lat-monobraccio-al-cavo'
        ],
        gruppo: '2',
        serie: 3,
        ripetizioni: '8–12',
        caricoMin: 35,
        caricoMax: 39,
        notaCarico: '',
        unita: '',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-3',
        esercizioId: 'leg-press-piedi-a-meta-pedana',
        alternative: [
          'hack-squat',
          'goblet-squat',
          'leg-extension'
        ],
        gruppo: null,
        serie: 3,
        ripetizioni: '10–12',
        caricoMin: null,
        caricoMax: null,
        notaCarico: 'Da tarare',
        unita: '',
        recupero: 90,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-4a',
        esercizioId: 'rematore-seduto-al-cavo-basso',
        alternative: [
          'rematore-manubrio-monobraccio-con-appoggio',
          'row-machine'
        ],
        gruppo: '4',
        serie: 3,
        ripetizioni: '10–12',
        caricoMin: 39,
        caricoMax: 39,
        notaCarico: '',
        unita: '',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-4b',
        esercizioId: 'french-press-ez',
        alternative: [
          'pushdown-ai-cavi',
          'french-press-con-manubrio'
        ],
        gruppo: '4',
        serie: 3,
        ripetizioni: '10–12',
        caricoMin: null,
        caricoMax: null,
        notaCarico: 'Bilanciere + 5 kg',
        unita: '',
        recupero: 60,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-5a',
        esercizioId: 'alzate-laterali',
        alternative: [
          'alzate-al-cavo'
        ],
        gruppo: '5',
        serie: 3,
        ripetizioni: '12–15',
        caricoMin: 6,
        caricoMax: 7,
        notaCarico: '',
        unita: 'per manubrio',
        recupero: 45,
        recuperoRiscaldamento: 60
      },
      {
        id: 'b-5b',
        esercizioId: 'standing-calf',
        alternative: [
          'calf-alla-leg-press',
          'calf-monopodalico-con-manubrio'
        ],
        gruppo: '5',
        serie: 3,
        ripetizioni: '10–15',
        caricoMin: 50,
        caricoMax: 55,
        notaCarico: '',
        unita: '',
        recupero: 45,
        recuperoRiscaldamento: 60
      }
    ]
  }
];
