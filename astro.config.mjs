// @ts-check

import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import { serviceWorker } from './src/integrations/service-worker';

// Percorso base e sito configurabili: l'app è pubblicata alla radice di workout-tracker.francescoperagine.com
// (Worker Cloudflare `workout-tracker`); WT_BASE serve solo per provarla in un sottopercorso, es. `WT_BASE=/workout-tracker/ npm run build`.
const base = process.env.WT_BASE || '/';

// /kit (pagina interna del design system, src/pages/_kit.astro) esiste solo con `npm run dev` o con WT_KIT=1,
// che la config di Playwright imposta per la sua build: la build pubblicata non la contiene.
/** @type {import('astro').AstroIntegration} */
const kitPage = {
  name: 'workout-tracker-kit',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev' || process.env.WT_KIT === '1') injectRoute({ pattern: '/kit', entrypoint: './src/pages/_kit.astro' });
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: process.env.WT_SITE || 'https://workout-tracker.francescoperagine.com',
  base: base.endsWith('/') ? base : `${base}/`,
  integrations: [svelte(), serviceWorker(), kitPage],
  vite: {
    plugins: [tailwindcss()],
  },
});
