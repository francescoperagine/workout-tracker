<script lang="ts">
  // Esercizio dimostrativo con righe serie vere: la spunta avvia il recupero a tutto schermo.
  import Plus from '@lucide/svelte/icons/plus';
  import RigaSerie, { type Precedente, type TipoSerie } from '../ui/RigaSerie.svelte';
  import TimerRecupero from '../allenamento/TimerRecupero.svelte';

  interface Serie {
    tipo: TipoSerie;
    precedente: Precedente | null;
    kg: string;
    rip: string;
    fatta: boolean;
  }

  let serie: Serie[] = $state([
    { tipo: 'normale', precedente: { kg: '40', rip: '8' }, kg: '40', rip: '8', fatta: true },
    { tipo: 'normale', precedente: { kg: '40', rip: '7' }, kg: '', rip: '', fatta: false },
    { tipo: 'normale', precedente: { kg: '37,5', rip: '8' }, kg: '', rip: '', fatta: false },
    { tipo: 'normale', precedente: null, kg: '', rip: '', fatta: false },
  ]);
  let recupero = $state(false);
  let prossima: string | null = $state(null);

  // Le serie di riscaldamento non hanno numero
  const numeri = $derived.by(() => {
    let n = 0;
    return serie.map((s) => (s.tipo === 'riscaldamento' ? 0 : ++n));
  });

  function spuntata(indice: number, fatta: boolean) {
    if (!fatta) {
      recupero = false;
      return;
    }
    const successiva = serie.findIndex((s, i) => i > indice && !s.fatta);
    prossima =
      successiva === -1
        ? null
        : `Panca piana · serie ${numeri[successiva]} · ${serie[successiva].precedente?.kg ?? serie[indice].kg} kg × 6–8`;
    recupero = false;
    queueMicrotask(() => (recupero = true));
  }

  // Con il timer attivo lo stack in basso è tab bar (57px) più barra ridotta (56px): i toast salgono sopra
  $effect(() => {
    document.body.style.setProperty('--altezza-barre-basse', recupero ? '113px' : '57px');
  });

  function aggiungiSerie() {
    const ultima = serie.at(-1);
    serie.push({ tipo: 'normale', precedente: null, kg: ultima?.kg ?? '', rip: '', fatta: false });
  }
</script>

<section class="pannello" aria-labelledby="esercizio-demo">
  <h3 id="esercizio-demo" class="text-lg leading-snug font-bold">
    <span class="mr-2 text-accento-testo">2a</span>Panca piana bilanciere
  </h3>
  <p class="mt-1 mb-3 text-base text-secondario">6–8 rip · 40 kg · rec. 0:20 (demo) · con 2b</p>
  <div class="intestazioni text-sm text-secondario" aria-hidden="true">
    <span class="text-center">Serie</span><span>Precedente</span><span class="text-center">kg</span><span class="text-center">Rip</span><span></span>
  </div>
  {#each serie as s, i (i)}
    <RigaSerie
      numero={numeri[i]}
      bind:tipo={s.tipo}
      precedente={s.precedente}
      bind:kg={s.kg}
      bind:rip={s.rip}
      bind:fatta={s.fatta}
      onspunta={(fatta) => spuntata(i, fatta)}
    />
  {/each}
  <button type="button" class="pulsante pulsante-testo mt-1" onclick={aggiungiSerie}><Plus aria-hidden="true" />Aggiungi serie</button>
</section>

<div class="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-30">
  <TimerRecupero durata={20} {prossima} bind:attivo={recupero} />
</div>

<style>
  .intestazioni {
    display: grid;
    grid-template-columns: 2rem minmax(3.75rem, 1fr) minmax(3.25rem, 4.75rem) minmax(3rem, 4rem) 3rem;
    gap: clamp(0.25rem, 1.6vw, 0.5rem);
    padding-bottom: 0.25rem;
  }
</style>
