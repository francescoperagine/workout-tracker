// Manifest della PWA (US-03), generato alla build per usare il percorso base (WT_BASE) in
// start_url, scope e icone. I colori sono quelli del guscio, uguali nei due temi.
import type { APIRoute } from 'astro';
import { BASE, appUrl } from '../lib/paths';

const SHELL = '#142321';

export const GET: APIRoute = () => {
  const manifest = {
    id: BASE,
    name: 'Workout Tracker',
    short_name: 'Workout',
    description: 'Diario di allenamento privato e offline: i dati restano su questo dispositivo.',
    lang: 'it',
    dir: 'ltr',
    start_url: BASE,
    scope: BASE,
    display: 'standalone',
    background_color: SHELL,
    theme_color: SHELL,
    categories: ['health', 'fitness', 'sports'],
    icons: [
      { src: appUrl('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: appUrl('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: appUrl('/icons/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: appUrl('/favicon.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { 'Content-Type': 'application/manifest+json' } });
};
