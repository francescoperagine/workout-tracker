// Manifest della PWA (US-03), generato alla build per usare il percorso base (WT_BASE) in
// start_url, scope e icone. I colori sono lo sfondo dell'icona (grigio molto scuro), uguali nei due temi:
// la schermata di avvio non è più verde. Il <meta name="theme-color"> di Base.astro resta sul token shell
// (#142321) finché non cambia la palette dell'app, e a pagina aperta prevale lui.
import type { APIRoute } from 'astro';
import { BASE, appUrl } from '../lib/paths';

const SHELL = '#1C1C1E';

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
