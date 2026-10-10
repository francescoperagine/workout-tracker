// Uso: node scripts/make-icons.mjs (sharp arriva con Astro). Rigenera public/icons/.
// Icone della PWA dal disegno del favicon (manubrio lime sul guscio verde scuro).
import sharp from 'sharp';
const out = new URL('../public/icons/', import.meta.url).pathname;
const glyph = '<path d="M6 10h4v12H6zm16 0h4v12h-4zM3 13h3v6H3zm23 0h3v6h-3zM10 14h12v4H10z" fill="#c7e69c"/>';
// any: angoli arrotondati come il favicon; full: a tutto campo (maskable e apple-touch, il sistema ritaglia)
const any = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#142321"/>${glyph}</svg>`;
// maskable: il disegno sta nella zona sicura (cerchio dell'80%), quindi ridotto al 62% e centrato
const full = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#142321"/><g transform="translate(16 16) scale(${scale}) translate(-16 -16)">${glyph}</g></svg>`;
const jobs = [
  ['icon-192.png', any, 192],
  ['icon-512.png', any, 512],
  ['icon-maskable-512.png', full(0.62), 512],
  ['apple-touch-icon.png', full(0.75), 180],
];
for (const [name, svg, size] of jobs) {
  await sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png({ compressionLevel: 9 }).toFile(`${out}/${name}`);
  console.log(name);
}
