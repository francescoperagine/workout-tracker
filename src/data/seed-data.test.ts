import { describe, expect, it } from 'vitest';
import { BASE_CATALOG } from './catalog';
import { STARTER_ROUTINES } from './starter-routines';

// Elenco permanente degli ID del catalogo del PoC: lo storico dell'utente li usa.
// Se questo test fallisce, un ID è stato cambiato o rimosso: non va fatto.
const POC_IDS = ['squat-bilanciere', 'leg-press', 'squat-al-smith', 'goblet-squat', 'panca-piana-bilanciere', 'chest-press', 'panca-piana-manubri', 'rematore-manubri-petto-su-panca-inclinata', 'rematore-al-cavo-basso', 'row-machine-con-appoggio', 'hip-thrust-bilanciere', 'hip-thrust-machine', 'glute-bridge-con-manubrio', 'pull-through-al-cavo', 'distensioni-manubri-seduto-schienale-alto', 'shoulder-press-machine', 'curl-manubri-su-panca-inclinata', 'curl-al-cavo-basso', 'curl-ez', 'alzate-laterali', 'alzate-al-cavo', 'macchina-laterali', 'standing-calf', 'calf-alla-leg-press', 'calf-monopodalico-con-manubrio', 'stacco-rumeno-bilanciere', 'stacco-rumeno-manubri', 'hyperextension-45-con-disco', 'distensioni-manubri-panca-inclinata', 'incline-chest-press', 'panca-inclinata-al-smith', 'lat-machine-presa-prona', 'trazioni-assistite-o-negative', 'lat-monobraccio-al-cavo', 'leg-press-piedi-a-meta-pedana', 'hack-squat', 'leg-extension', 'rematore-seduto-al-cavo-basso', 'rematore-manubrio-monobraccio-con-appoggio', 'row-machine', 'french-press-ez', 'pushdown-ai-cavi', 'french-press-con-manubrio'];

describe('catalogo di base', () => {
  it('contiene tutti gli ID del PoC, invariati', () => {
    expect(Object.keys(BASE_CATALOG)).toEqual(POC_IDS);
    for (const id of POC_IDS) {
      expect(BASE_CATALOG[id], id).toBeDefined();
      expect(BASE_CATALOG[id].id).toBe(id);
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
