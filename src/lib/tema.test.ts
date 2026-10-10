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

describe('registro dei temi', () => {
  it('ogni tema non predefinito ha la sua regola CSS :root[data-theme]', async () => {
    const { readFileSync, readdirSync, existsSync } = await import('node:fs');
    const { REGISTRO_TEMI, TEMA_PREDEFINITO, TEMI } = await import('./tema');
    const cartella = new URL('../styles/temi/', import.meta.url);
    const css = [
      readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8'),
      ...(existsSync(cartella) ? readdirSync(cartella).filter((f) => f.endsWith('.css')).map((f) => readFileSync(new URL(f, cartella), 'utf8')) : []),
    ].join('\n');
    for (const tema of TEMI.filter((t) => t !== TEMA_PREDEFINITO)) {
      expect(css, `manca :root[data-theme="${tema}"]`).toContain(`:root[data-theme="${tema}"]`);
      const schema = REGISTRO_TEMI[tema].schema;
      if (schema !== 'auto') expect(css).toMatch(new RegExp(`:root\\[data-theme="${tema}"\\][^}]*color-scheme:\\s*${schema}`));
    }
  });

  it('lo script inline ammette solo i temi del registro', async () => {
    const { scriptTemaPrimaDelDisegno } = await import('./tema');
    const script = scriptTemaPrimaDelDisegno();
    expect(script).toContain('["chiaro","scuro"]');
    expect(script).not.toContain('sistema');
  });
});
