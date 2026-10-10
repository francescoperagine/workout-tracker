<script lang="ts">
  // Selettore del tema per /kit. ?theme=light|dark forza il tema senza salvarlo (screenshot e detector).
  import { onMount } from 'svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import { THEME_LABELS, THEMES, applyTheme, isTheme, readTheme, saveTheme, type Theme } from '../../lib/theme';

  let theme: Theme = $state('system');
  const options = THEMES.map((value) => ({ value, label: THEME_LABELS[value] }));

  onMount(() => {
    const forced = new URLSearchParams(location.search).get('theme');
    if (isTheme(forced)) {
      theme = forced;
      applyTheme(forced);
    } else {
      theme = readTheme();
    }
  });
</script>

<SegmentedControl name="theme" label="Tema" {options} bind:value={theme} onchange={(t) => saveTheme(t)} />
