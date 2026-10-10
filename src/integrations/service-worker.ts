// Service worker della PWA (step 3, decisione 5 del piano): generato con workbox-build dopo la build,
// fa il precache di tutto dist/ così l'app funziona offline dopo la prima visita, senza richieste esterne.
// Si usa workbox-build in un hook astro:build:done perché @vite-pwa/astro dichiara compatibilità solo fino ad Astro 5.
import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { generateSW } from 'workbox-build';

export function serviceWorker(): AstroIntegration {
  let base = '/';
  return {
    name: 'bodytracker-service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.endsWith('/') ? config.base : `${config.base}/`;
      },
      'astro:build:done': async ({ dir, logger }) => {
        const globDirectory = fileURLToPath(dir);
        const { count, size, warnings } = await generateSW({
          globDirectory,
          swDest: `${globDirectory}/sw.js`,
          globPatterns: ['**/*.{html,js,css,woff2,svg,png,webmanifest}'],
          // /kit è una pagina interna del design system: fuori dal precache
          globIgnores: ['kit/**', '_astro/Kit*', 'sw.js', 'workbox-*.js'],
          // gli URL del precache partono dal percorso base (BT_BASE)
          modifyURLPrefix: { '': base },
          // le pagine sono cartelle con index.html; i parametri (es. ?id=) non cambiano il file
          directoryIndex: 'index.html',
          ignoreURLParametersMatching: [/.*/],
          // una versione nuova prende subito il controllo; le vecchie copie vengono rimosse
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          // tutto in un file: niente runtime di Workbox da scaricare a parte
          inlineWorkboxRuntime: true,
          sourcemap: false,
          mode: 'production',
        });
        for (const warning of warnings) logger.warn(warning);
        logger.info(`sw.js: ${count} file in precache (${Math.round(size / 1024)} KB)`);
      },
    },
  };
}
