import { vitePreprocess } from '@astrojs/svelte';

// TypeScript nei componenti Svelte (<script lang="ts">)
export default {
  preprocess: vitePreprocess(),
};
