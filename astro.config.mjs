// @ts-check

import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import { serviceWorker } from './src/integrations/service-worker';

// Percorso base e sito configurabili: l'app è pubblicata alla radice di workout-tracker.francescoperagine.com
// (progetto Cloudflare Pages `workout-tracker`); WT_BASE serve solo per provarla in un sottopercorso, es. `WT_BASE=/workout-tracker/ npm run build`.
const base = process.env.WT_BASE || '/';

// https://astro.build/config
export default defineConfig({
  site: process.env.WT_SITE || 'https://workout-tracker.francescoperagine.com',
  base: base.endsWith('/') ? base : `${base}/`,
  integrations: [svelte(), serviceWorker()],
  vite: {
    plugins: [tailwindcss()],
  },
});
