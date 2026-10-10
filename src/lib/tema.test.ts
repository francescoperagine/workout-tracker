import { describe, expect, it } from 'vitest';
import { CHIAVE_TEMA, isTema, leggiTema, salvaTema } from './tema';

function memoria(iniziale: Record<string, string> = {}) {
  const dati = new Map(Object.entries(iniziale));
  return {
    dati,
    getItem: (k: string) => dati.get(k) ?? null,
    setItem: (k: string, v: string) => void dati.set(k, v),
    removeItem: (k: string) => void dati.delete(k),
  };
}

describe('tema', () => {
  it('riconosce solo i tre valori ammessi', () => {
    expect(isTema('chiaro')).toBe(true);
    expect(isTema('scuro')).toBe(true);
    expect(isTema('sistema')).toBe(true);
    expect(isTema('dark')).toBe(false);
    expect(isTema(null)).toBe(false);
  });

  it('senza preferenza salvata, o con un valore non valido, segue il sistema', () => {
    expect(leggiTema(memoria())).toBe('sistema');
    expect(leggiTema(memoria({ [CHIAVE_TEMA]: 'viola' }))).toBe('sistema');
    expect(leggiTema(memoria({ [CHIAVE_TEMA]: 'scuro' }))).toBe('scuro');
  });

  it('se lo storage non è accessibile segue il sistema', () => {
    const rotto = { getItem: () => { throw new Error('SecurityError'); } };
    expect(leggiTema(rotto)).toBe('sistema');
  });

  it('"sistema" toglie la chiave, gli altri la scrivono', () => {
    const radice = { dataset: {} as DOMStringMap };
    globalThis.document = { documentElement: radice } as unknown as Document;
    const s = memoria();
    expect(salvaTema('chiaro', s)).toBe(true);
    expect(s.dati.get(CHIAVE_TEMA)).toBe('chiaro');
    expect(radice.dataset.theme).toBe('chiaro');
    expect(salvaTema('sistema', s)).toBe(true);
    expect(s.dati.has(CHIAVE_TEMA)).toBe(false);
    expect(radice.dataset.theme).toBeUndefined();
  });
});
