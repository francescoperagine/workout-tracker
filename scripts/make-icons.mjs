// Uso: node scripts/make-icons.mjs (sharp arriva con Astro). Rigenera public/icons/ e public/favicon.svg.
// Sorgente: scripts/icon-source/, il bilanciere dell'illustrazione a pennello del sito vettorializzato con potrace
// (variante A dell'INC-008). barbell.svg per 192/512, barbell-bold.svg (tratti più pieni) per il favicon, che si
// vede a 16–48 px. Tratto carta su sfondo scuro, i neutri della palette.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const INK = '#FAFAF7';
const BG = '#1C1C1E';
const W = 1083; // viewBox dei sorgenti
const H = 570;
const root = new URL('../', import.meta.url).pathname;
const glyph = (name) => readFileSync(`${root}scripts/icon-source/${name}.svg`, 'utf8').match(/<g[\s\S]*<\/g>/)[0];

/** `fit`: frazione del lato occupata dal disegno; `round`: angoli arrotondati (any), altrimenti a tutto campo */
function icon(name, { fit, round }) {
  const w = 512 * fit;
  const h = (w * H) / W;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512"${round ? ' rx="113"' : ''} fill="${BG}"/><svg x="${(512 - w) / 2}" y="${(512 - h) / 2}" width="${w}" height="${h}" viewBox="0 0 ${W} ${H}" fill="${INK}">${glyph(name)}</svg></svg>`;
}

// maskable: il disegno intero dentro il cerchio della zona sicura (80%), misurato sulla diagonale del riquadro
const MASK_FIT = (0.8 * W) / Math.hypot(W, H);
const jobs = [
  ['icon-192.png', icon('barbell', { fit: 0.8, round: true }), 192],
  ['icon-512.png', icon('barbell', { fit: 0.8, round: true }), 512],
  ['icon-maskable-512.png', icon('barbell', { fit: MASK_FIT, round: false }), 512],
  ['apple-touch-icon.png', icon('barbell', { fit: 0.8, round: false }), 180], // iOS arrotonda da sé
];
for (const [name, svg, size] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(`${root}public/icons/${name}`);
  console.log(name);
}
writeFileSync(`${root}public/favicon.svg`, icon('barbell-bold', { fit: 0.8, round: true }) + '\n');
console.log('favicon.svg');
