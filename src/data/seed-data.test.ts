import { describe, expect, it } from 'vitest';
import { BASE_CATALOG, EXERCISE_REDIRECTS } from './catalog';
import { STARTER_ROUTINES } from './starter-routines';
import { MUSCLE_GROUPS, MUSCLE_VALUES } from '../lib/archive/types';
import { nameKey } from '../lib/archive/catalog';

// Elenco permanente degli ID del catalogo del PoC: lo storico dell'utente li usa.
// Se questo test fallisce, un ID è stato cambiato o rimosso senza reindirizzamento: non va fatto.
// Un ID si toglie solo con una voce in EXERCISE_REDIRECTS, e resta in questo elenco.
const POC_IDS = ['squat-bilanciere', 'leg-press', 'squat-al-smith', 'goblet-squat', 'panca-piana-bilanciere', 'chest-press', 'panca-piana-manubri', 'rematore-manubri-petto-su-panca-inclinata', 'rematore-al-cavo-basso', 'row-machine-con-appoggio', 'hip-thrust-bilanciere', 'hip-thrust-machine', 'glute-bridge-con-manubrio', 'pull-through-al-cavo', 'distensioni-manubri-seduto-schienale-alto', 'shoulder-press-machine', 'curl-manubri-su-panca-inclinata', 'curl-al-cavo-basso', 'curl-ez', 'alzate-laterali', 'alzate-al-cavo', 'macchina-laterali', 'standing-calf', 'calf-alla-leg-press', 'calf-monopodalico-con-manubrio', 'stacco-rumeno-bilanciere', 'stacco-rumeno-manubri', 'hyperextension-45-con-disco', 'distensioni-manubri-panca-inclinata', 'incline-chest-press', 'panca-inclinata-al-smith', 'lat-machine-presa-prona', 'trazioni-assistite-o-negative', 'lat-monobraccio-al-cavo', 'leg-press-piedi-a-meta-pedana', 'hack-squat', 'leg-extension', 'rematore-seduto-al-cavo-basso', 'rematore-manubrio-monobraccio-con-appoggio', 'row-machine', 'french-press-ez', 'pushdown-ai-cavi', 'french-press-con-manubrio'];

describe('catalogo di base', () => {
  it('contiene tutti gli ID del PoC, nel catalogo o reindirizzati', () => {
    for (const id of POC_IDS) expect(Object.hasOwn(BASE_CATALOG, id) || Object.hasOwn(EXERCISE_REDIRECTS, id), id).toBe(true);
  });

  it('nomi e alias: mai uguali al nome della voce, nessuna chiave di confronto in due voci', () => {
    const owner = new Map<string, string>();
    for (const e of Object.values(BASE_CATALOG)) {
      for (const n of e.aliases) expect(nameKey(n), e.id).not.toBe(nameKey(e.name));
      for (const key of new Set([e.name, ...e.aliases].map(nameKey))) {
        expect(owner.get(key), `${e.id}: «${key}» è già di ${owner.get(key)}`).toBeUndefined();
        owner.set(key, e.id);
      }
    }
  });

  it('reindirizzamenti: verso un esercizio del catalogo, mai da uno che c’è ancora, senza catene', () => {
    for (const [from, to] of Object.entries(EXERCISE_REDIRECTS)) {
      expect(Object.hasOwn(BASE_CATALOG, from), from).toBe(false);
      expect(Object.hasOwn(BASE_CATALOG, to), to).toBe(true);
      expect(Object.hasOwn(EXERCISE_REDIRECTS, to), to).toBe(false);
    }
  });

  it('ogni chiave coincide con l’id e gli approfondimenti non sono inventati (vuoti)', () => {
    for (const [key, e] of Object.entries(BASE_CATALOG)) {
      expect(e.id).toBe(key);
      expect(e.name.trim()).not.toBe('');
      expect(e.description).toBe('');
      expect(e.steps).toEqual([]);
      expect(e.sources).toEqual([]);
    }
  });

  it('muscoli: ogni voce ha almeno un gruppo, con gruppi e valori ammessi', () => {
    for (const e of Object.values(BASE_CATALOG)) {
      expect(Object.keys(e.muscles).length, e.id).toBeGreaterThan(0);
      for (const [g, v] of Object.entries(e.muscles)) {
        expect(MUSCLE_GROUPS, e.id).toContain(g);
        expect(MUSCLE_VALUES, e.id).toContain(v);
      }
    }
  });

  // delavier-catalog (ADR-014): righe trascritte dal libro e ricontrollate sull'immagine della pagina, da non
  // cambiare senza rileggere la pagina. La prima è D8 della SPEC.
  it('muscoli: un campione di righe come le dice il libro', () => {
    const rows: [string, Record<string, number>][] = [
      ['stacco-da-terra', { lats: 1, glutes: 1, traps: 0.5, 'lower-back': 0.5, hamstrings: 0.5, quads: 0.5 }], // p. 104, fig. p. 110
      ['stacco-trap-bar', { traps: 1, quads: 1, lats: 0.5, 'lower-back': 0.5, glutes: 0.5, hamstrings: 0.5 }], // fig. p. 110
      ['curl-manubri', { forearms: 1, brachialis: 1, biceps: 1, 'front-delts': 1, chest: 0.5 }], // p. 6
      ['hammer-curl', { forearms: 1, biceps: 0.5, brachialis: 0.5 }], // p. 9
      ['estensioni-tricipiti-sopra-la-testa-al-cavo', { triceps: 1 }], // p. 23
      ['panca-piana-manubri', { chest: 1, triceps: 0.5, 'front-delts': 0.5 }], // p. 77
      ['lat-machine-presa-prona', { lats: 1, traps: 0.5, biceps: 0.5, brachialis: 0.5, chest: 0.5 }], // p. 90
      ['hyperextension-45-con-disco', { 'lower-back': 1, glutes: 0.5, hamstrings: 0.5 }], // p. 112
      ['leg-curl-seduto', { hamstrings: 1, popliteus: 1, calves: 0.5 }], // p. 142
      ['slanci-posteriori-al-cavo', { glutes: 1, hamstrings: 0.5 }], // p. 159
      ['leg-raise-alla-sbarra', { 'hip-flexors': 1, abs: 1, quads: 1 }], // p. 183, retto femorale (INC-040)
    ];
    for (const [id, muscles] of rows) expect(BASE_CATALOG[id].muscles, id).toEqual(muscles);
  });

  // Gerarchia delle fonti (ADR-014): dove uno studio confermato misura un muscolo, vince sul libro.
  it('muscoli: le righe in cui uno studio confermato corregge il libro', () => {
    const rows: [string, Record<string, number>][] = [
      ['panca-piana-bilanciere', { chest: 1, 'front-delts': 1, triceps: 0.5 }], // tricipiti: Ogasawara 2011-2013, Lanza 2024
      ['squat-bilanciere', { quads: 1, glutes: 1, adductors: 1, 'lower-back': 1, abs: 1 }], // femorali: Kubo 2019, Plotkin 2023
      ['squat-al-smith', { quads: 1, glutes: 1, adductors: 1, 'lower-back': 1, abs: 1 }],
    ];
    for (const [id, muscles] of rows) expect(BASE_CATALOG[id].muscles, id).toEqual(muscles);
  });

  it('le schede iniziali usano solo esercizi del catalogo', () => {
    for (const routine of STARTER_ROUTINES) {
      for (const item of routine.exercises) {
        for (const id of [item.exerciseId, ...item.alternatives]) expect(BASE_CATALOG[id], id).toBeDefined();
      }
    }
  });

  // schede A/B convertite dal PoC (eliminato allo step 9, resta nella cronologia git)
  it('A/B: recuperi, carichi e superserie come nel PoC', () => {
    const [a, b] = STARTER_ROUTINES;
    expect(a.exercises.map((e) => [e.id, e.rest, e.group])).toEqual([
      ['a-1', 120, null],
      ['a-2a', 60, '2'],
      ['a-2b', 60, '2'],
      ['a-3', 90, null],
      ['a-4a', 60, '4'],
      ['a-4b', 60, '4'],
      ['a-5a', 45, '5'],
      ['a-5b', 45, '5'],
    ]);
    expect(b.exercises.find((e) => e.id === 'b-3')).toMatchObject({ loadMin: null, loadMax: null, loadNote: 'Da tarare' });
    expect(b.exercises.find((e) => e.id === 'b-4b')).toMatchObject({ loadMin: null, loadNote: 'Bilanciere + 5 kg' });
    expect(a.exercises.find((e) => e.id === 'a-2b')).toMatchObject({ loadMin: 12, loadMax: 14, unit: 'per manubrio' });
  });
});
