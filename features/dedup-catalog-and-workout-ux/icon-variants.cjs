// Varianti A e B dell'icona dall'illustrazione a pennello, e foglio di confronto (incremento 5).
// Uso, dalla radice del repo: node features/dedup-catalog-and-workout-ux/icon-variants.cjs \
//   /Users/thuls/Repository/personal-website/src/assets/projects/workout-tracker-hero.webp <cartella> screenshots/icon-compare.png
// Strumento della scelta, non della build: dopo la scelta la sorgente versionata va in scripts/icon-source/.
const sharp = require(process.cwd() + '/node_modules/sharp');
const [, , HERO, OUT, SHEET] = process.argv;
const fs = require('fs');
fs.mkdirSync(OUT, { recursive: true });

const INK = '#111111';
const PAPER = '#fafafa';
const LINE = '#d4d4d4';
const DARK = '#161616';

/** inchiostro nero su bianco, tratti ispessiti: sfocatura + soglia alta = dilatazione morbida (bordi a pennello) */
async function thicken(buffer, sigma, cut) {
  return sharp(buffer).greyscale().blur(sigma).threshold(cut).png().toBuffer();
}

/** ritaglio dell'illustrazione, in scala di grigi */
const crop = (left, top, width, height) => sharp(HERO).extract({ left, top, width, height }).greyscale().png().toBuffer();

/** Variante A: solo bilanciere, i due dischi veri dell'illustrazione avvicinati, barra piena */
async function masterA(sigma, cut, barH) {
  const left = await crop(405, 268, 127, 184); // disco sinistro, barra a y 84
  const right = await crop(858, 274, 114, 173); // disco destro, barra a y 78
  const gap = 120;
  const W = 127 + gap + 114;
  const H = 190;
  const barY = 86;
  const bar = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="100" y="${barY - barH / 2}" width="${W - 200}" height="${barH}" rx="${barH / 2}" fill="#000"/></svg>`,
  );
  const composed = await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([
      { input: left, left: 0, top: 2, blend: 'multiply' },
      { input: right, left: 127 + gap, top: 8, blend: 'multiply' },
      { input: bar, left: 0, top: 0, blend: 'multiply' },
    ])
    .png()
    .toBuffer();
  // ingrandito prima di ispessire: la soglia lavora su più pixel e i bordi restano morbidi
  const big = await sharp(composed).resize(W * 3, H * 3, { kernel: 'lanczos3' }).png().toBuffer();
  return thicken(big, sigma, cut);
}

/** Variante B: la figura intera, a tratti pieni */
async function masterB(sigma, cut) {
  const figure = await crop(400, 8, 580, 612);
  const big = await sharp(figure).resize(580 * 2, 612 * 2, { kernel: 'lanczos3' }).png().toBuffer();
  return thicken(big, sigma, cut);
}

/** maschera alfa dell'inchiostro (bianco = inchiostro) dal master nero su bianco */
async function alpha(master) {
  return sharp(master).negate().extractChannel(0).png().toBuffer();
}

/**
 * Tessera dell'icona: `fit` = lato del quadrato in cui sta il disegno (frazione del lato), `round` = angoli
 * arrotondati con bordo grigio chiaro (icona "any"); false = a tutto campo (maskable).
 */
async function tile(master, size, { dark, fit, round }) {
  const meta = await sharp(master).metadata();
  const box = Math.round(size * fit);
  const scale = Math.min(box / meta.width, box / meta.height);
  const w = Math.max(1, Math.round(meta.width * scale));
  const h = Math.max(1, Math.round(meta.height * scale));
  const mask = await sharp(await alpha(master)).resize(w, h, { kernel: 'lanczos3' }).toBuffer();
  const ink = await sharp({ create: { width: w, height: h, channels: 3, background: dark ? PAPER : INK } })
    .joinChannel(mask)
    .png()
    .toBuffer();
  const r = round ? Math.round(size * 0.22) : 0;
  const border = round && !dark ? Math.max(1, Math.round(size / 96)) : 0;
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="${border / 2}" y="${border / 2}" width="${size - border}" height="${size - border}" rx="${r}" fill="${dark ? DARK : PAPER}" ${border ? `stroke="${LINE}" stroke-width="${border}"` : ''}/></svg>`,
  );
  return sharp(bg)
    .composite([{ input: ink, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer();
}

/** cerchio della zona sicura (80%) sopra la maskable */
async function withSafeZone(png, size) {
  const ring = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" fill="none" stroke="#e0362c" stroke-width="3" stroke-dasharray="10 8"/></svg>`,
  );
  return sharp(png).composite([{ input: ring }]).png().toBuffer();
}

const label = (text, w, h = 40, size = 22) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="0" y="${h - 12}" font-family="Helvetica, Arial, sans-serif" font-size="${size}" fill="#333">${text}</text></svg>`);

(async () => {
  // due spessori: i tagli piccoli (16–48) vogliono tratti molto più pieni, come una dimensione ottica
  const variants = {
    A: { large: await masterA(3, 215, 22), small: await masterA(7, 240, 34), fitAny: 0.8, name: 'A · bilanciere' },
    B: { large: await masterB(3, 215), small: await masterB(6, 238), fitAny: 0.82, name: 'B · figura' },
  };
  for (const [key, v] of Object.entries(variants)) {
    fs.writeFileSync(`${OUT}/master-${key}-large.png`, v.large);
    fs.writeFileSync(`${OUT}/master-${key}-small.png`, v.small);
  }

  const SIZES = [16, 32, 48, 192, 512];
  const GAP = 40;
  const rows = [];
  for (const [key, v] of Object.entries(variants)) {
    for (const dark of [false, true]) {
      const items = [];
      for (const s of SIZES) items.push({ s, png: await tile(s <= 48 ? v.small : v.large, s, { dark, fit: v.fitAny, round: true }) });
      // maskable: il disegno intero dentro il cerchio dell'80% → lato del riquadro = 0.8/√2 del lato... ma il
      // disegno non è quadrato: si usa la diagonale vera del riquadro del disegno
      const meta = await sharp(v.large).metadata();
      const diag = Math.hypot(meta.width, meta.height);
      const fitMask = (0.8 * Math.max(meta.width, meta.height)) / diag;
      const mask = await withSafeZone(await tile(v.large, 512, { dark, fit: fitMask, round: false }), 512);
      items.push({ s: 512, png: mask, mask: true });
      rows.push({ title: `${v.name} · ${dark ? 'su grigio molto scuro' : 'su bianco'}`, items });
    }
  }

  const width = GAP + rows[0].items.reduce((n, i) => n + i.s + GAP, 0);
  const rowH = 40 + 512 + 50 + GAP;
  const composites = [];
  rows.forEach((row, r) => {
    const top = GAP + r * rowH;
    composites.push({ input: label(row.title, 1200, 40, 26), left: GAP, top });
    let x = GAP;
    for (const item of row.items) {
      composites.push({ input: item.png, left: x, top: top + 40 + (512 - item.s) });
      composites.push({ input: label(item.mask ? 'maskable 512 · zona sicura 80%' : `${item.s} px`, Math.max(item.s, 120), 34, 18), left: x, top: top + 40 + 512 + 8 });
      x += item.s + GAP;
    }
  });
  await sharp({ create: { width, height: GAP + rows.length * rowH, channels: 3, background: '#ececec' } })
    .composite(composites)
    .png()
    .toFile(SHEET);
  console.log('foglio', SHEET, width);
})();
