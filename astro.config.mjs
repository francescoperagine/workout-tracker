// @ts-check

import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: 'https://francescoperagine.com',
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
