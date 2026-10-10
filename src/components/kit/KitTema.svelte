<script lang="ts">
  // Selettore del tema per /kit. ?tema=chiaro|scuro forza il tema senza salvarlo (screenshot e detector).
  import { onMount } from 'svelte';
  import Segmentato from '../ui/Segmentato.svelte';
  import { ETICHETTE_TEMA, TEMI, applicaTema, isTema, leggiTema, salvaTema, type Tema } from '../../lib/tema';

  let tema: Tema = $state('sistema');
  const opzioni = TEMI.map((valore) => ({ valore, etichetta: ETICHETTE_TEMA[valore] }));

  onMount(() => {
    const forzato = new URLSearchParams(location.search).get('tema');
    if (isTema(forzato)) {
      tema = forzato;
      applicaTema(forzato);
    } else {
      tema = leggiTema();
    }
  });
</script>

<Segmentato nome="tema" etichetta="Tema" {opzioni} bind:valore={tema} onchange={(t) => salvaTema(t)} />
