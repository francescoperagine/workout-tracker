import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_COLORS } from '../lib/theme';

// Contrasto WCAG delle coppie di ruoli usate davvero, nei due temi, letto dai token di global.css:
// se un valore cambia e una coppia scende sotto soglia, il test fallisce.
const css = readFileSync(new URL('./global.css', import.meta.url), 'utf8');
const themeBlock = css.slice(css.indexOf('@theme {'), css.indexOf('--font-sans'));

type Rgb = [number, number, number];
const hex = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;

/** Un colore del token: #rrggbb oppure color-mix(in srgb, #a N%, #b), che mescola i canali sRGB */
function parseColor(value: string): Rgb {
  const mix = value.match(/^color-mix\(in srgb, (#[0-9a-f]{6}) (\d+)%, (#[0-9a-f]{6})\)$/i);
  if (mix) {
    const [a, p, b] = [hex(mix[1]), Number(mix[2]) / 100, hex(mix[3])];
    return a.map((c, i) => Math.round(c * p + b[i] * (1 - p))) as Rgb;
  }
  if (/^#[0-9a-f]{6}$/i.test(value)) return hex(value);
  throw new Error(`colore non riconosciuto: ${value}`);
}

/** Divide gli argomenti di light-dark() alla virgola di primo livello */
function splitTop(args: string): [string, string] {
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '(') depth++;
    else if (args[i] === ')') depth--;
    else if (args[i] === ',' && depth === 0) return [args.slice(0, i).trim(), args.slice(i + 1).trim()];
  }
  throw new Error(`light-dark senza due valori: ${args}`);
}

const raw = new Map([...themeBlock.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

function token(name: string, scheme: 0 | 1): Rgb {
  const value = raw.get(name);
  if (!value) throw new Error(`token mancante: ${name}`);
  const ref = value.match(/^var\(--color-([\w-]+)\)$/);
  if (ref) return token(ref[1], scheme);
  const ld = value.match(/^light-dark\((.*)\)$/);
  if (!ld) throw new Error(`il token ${name} non usa light-dark(): ${value}`);
  return parseColor(splitTop(ld[1])[scheme]);
}

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: Rgb, b: Rgb) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const PAIRS: [string[], string[], number][] = [
  [['text', 'text-muted', 'accent-text', 'danger', 'highlight'], ['bg', 'surface', 'accent-tint'], 4.5],
  [['on-accent'], ['accent', 'accent-pressed'], 4.5],
  [['on-danger'], ['danger-fill'], 4.5],
  [['on-done'], ['done'], 4.5],
  [['border-control', 'accent-indicator', 'accent', 'danger-fill'], ['bg', 'surface'], 3],
];

describe('contrasto WCAG dei ruoli di colore', () => {
  for (const [scheme, label] of [[0, 'chiaro'], [1, 'scuro']] as const) {
    for (const [fgs, bgs, min] of PAIRS) {
      for (const fg of fgs) {
        for (const bg of bgs) {
          it(`${label}: ${fg} su ${bg} ≥ ${min}:1`, () => {
            expect(ratio(token(fg, scheme), token(bg, scheme))).toBeGreaterThanOrEqual(min);
          });
        }
      }
    }
  }

  it('theme-color e manifest usano il bg di ciascun tema', () => {
    expect(hex(THEME_COLORS.light)).toEqual(token('bg', 0));
    expect(hex(THEME_COLORS.dark)).toEqual(token('bg', 1));
  });
});

describe('valori di colore solo nel file dei token', () => {
  // Eccezioni motivate: global.css (i token stessi) e theme.ts (copia dei due bg per i meta, verificata sopra)
  const allowed = new Set(['styles/global.css', 'lib/theme.ts']);
  const root = new URL('..', import.meta.url).pathname;
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? files(p) : [p];
    });
  const literal = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/i;

  it('nessun hex, rgb(), hsl() od oklch() fuori dai token', () => {
    const offenders = files(root)
      .filter((p) => /\.(svelte|astro|ts|css)$/.test(p) && !p.endsWith('.test.ts'))
      .filter((p) => !allowed.has(p.slice(root.length)))
      .flatMap((p) =>
        readFileSync(p, 'utf8')
          .split('\n')
          .map((line, i) => [p.slice(root.length), i + 1, line] as const)
          .filter(([, , line]) => literal.test(line)),
      )
      .map(([p, n, line]) => `${p}:${n} ${line.trim()}`);
    expect(offenders).toEqual([]);
  });

  it('in global.css i colori letterali stanno solo nel blocco @theme', () => {
    const outside = css.replace(themeBlock, '');
    expect(outside.match(/#[0-9a-f]{3,8}\b|\brgba?\(/gi) ?? []).toEqual([]);
  });
});
