import { describe, expect, it } from 'vitest';
import { THEME_KEY, isTheme, readTheme, saveTheme } from './theme';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('tema', () => {
  it('riconosce solo i tre valori ammessi', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('system')).toBe(true);
    expect(isTheme('scuro')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });

  it('senza preferenza salvata, o con un valore non valido, segue il sistema', () => {
    expect(readTheme(memoryStore())).toBe('system');
    expect(readTheme(memoryStore({ [THEME_KEY]: 'purple' }))).toBe('system');
    expect(readTheme(memoryStore({ [THEME_KEY]: 'dark' }))).toBe('dark');
  });

  it('se lo storage non è accessibile segue il sistema', () => {
    const broken = { getItem: () => { throw new Error('SecurityError'); } };
    expect(readTheme(broken)).toBe('system');
  });

  it('"system" toglie la chiave, gli altri la scrivono', () => {
    const root = { dataset: {} as DOMStringMap };
    globalThis.document = { documentElement: root } as unknown as Document;
    const s = memoryStore();
    expect(saveTheme('light', s)).toBe(true);
    expect(s.data.get(THEME_KEY)).toBe('light');
    expect(root.dataset.theme).toBe('light');
    expect(saveTheme('system', s)).toBe(true);
    expect(s.data.has(THEME_KEY)).toBe(false);
    expect(root.dataset.theme).toBeUndefined();
  });
});

describe('registro dei temi', () => {
  it('ogni tema non predefinito ha la sua regola CSS :root[data-theme]', async () => {
    const { readFileSync, readdirSync, existsSync } = await import('node:fs');
    const { THEME_REGISTRY, DEFAULT_THEME, THEMES } = await import('./theme');
    const folder = new URL('../styles/themes/', import.meta.url);
    const css = [
      readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8'),
      ...(existsSync(folder) ? readdirSync(folder).filter((f) => f.endsWith('.css')).map((f) => readFileSync(new URL(f, folder), 'utf8')) : []),
    ].join('\n');
    for (const theme of THEMES.filter((t) => t !== DEFAULT_THEME)) {
      expect(css, `manca :root[data-theme="${theme}"]`).toContain(`:root[data-theme="${theme}"]`);
      const scheme = THEME_REGISTRY[theme].scheme;
      if (scheme !== 'auto') expect(css).toMatch(new RegExp(`:root\\[data-theme="${theme}"\\][^}]*color-scheme:\\s*${scheme}`));
    }
  });

  it('lo script inline ammette solo i temi del registro', async () => {
    const { themeBootScript } = await import('./theme');
    const script = themeBootScript();
    expect(script).toContain('["light","dark"]');
    expect(script).not.toContain('system');
  });
});
