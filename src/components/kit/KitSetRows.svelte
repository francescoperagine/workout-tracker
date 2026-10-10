<script lang="ts">
  // Esercizio dimostrativo con righe serie vere: la spunta avvia il recupero a tutto schermo.
  import Plus from '@lucide/svelte/icons/plus';
  import SetRow, { type Previous, type SetType } from '../ui/SetRow.svelte';
  import RestTimer from '../workout/RestTimer.svelte';

  interface DemoSet {
    type: SetType;
    previous: Previous | null;
    kg: string;
    reps: string;
    done: boolean;
  }

  let sets: DemoSet[] = $state([
    { type: 'normal', previous: { kg: '40', reps: '8' }, kg: '40', reps: '8', done: true },
    { type: 'normal', previous: { kg: '40', reps: '7' }, kg: '', reps: '', done: false },
    { type: 'normal', previous: { kg: '37,5', reps: '8' }, kg: '', reps: '', done: false },
    { type: 'normal', previous: null, kg: '', reps: '', done: false },
  ]);
  let resting = $state(false);
  let next: string | null = $state(null);

  // Le serie di riscaldamento non hanno numero
  const numbers = $derived.by(() => {
    let n = 0;
    return sets.map((s) => (s.type === 'warmup' ? 0 : ++n));
  });

  function onCheck(index: number, done: boolean) {
    if (!done) {
      resting = false;
      return;
    }
    const following = sets.findIndex((s, i) => i > index && !s.done);
    next =
      following === -1
        ? null
        : `Panca piana · serie ${numbers[following]} · ${sets[following].previous?.kg ?? sets[index].kg} kg × 6–8`;
    resting = false;
    queueMicrotask(() => (resting = true));
  }

  // Con il timer attivo lo stack in basso è tab bar (57px) più barra ridotta (56px): i toast salgono sopra
  $effect(() => {
    document.body.style.setProperty('--bottom-bars-height', resting ? '113px' : '57px');
  });

  function addSet() {
    const last = sets.at(-1);
    sets.push({ type: 'normal', previous: null, kg: last?.kg ?? '', reps: '', done: false });
  }
</script>

<section class="panel" aria-labelledby="demo-exercise">
  <h3 id="demo-exercise" class="text-lg leading-snug font-bold">
    <span class="mr-2 text-accent-text">2a</span>Panca piana bilanciere
  </h3>
  <p class="mt-1 mb-3 text-base text-muted">6–8 rip · 40 kg · rec. 0:20 (demo) · con 2b</p>
  <div class="column-heads text-sm text-muted" aria-hidden="true">
    <span class="text-center">Serie</span><span>Precedente</span><span class="text-center">kg</span><span class="text-center">Rip</span><span></span>
  </div>
  {#each sets as s, i (i)}
    <SetRow
      number={numbers[i]}
      bind:type={s.type}
      previous={s.previous}
      bind:kg={s.kg}
      bind:reps={s.reps}
      bind:done={s.done}
      oncheck={(done) => onCheck(i, done)}
    />
  {/each}
  <button type="button" class="btn btn-text mt-1" onclick={addSet}><Plus aria-hidden="true" />Aggiungi serie</button>
</section>

<div class="fixed inset-x-0 bottom-[calc(57px+env(safe-area-inset-bottom))] z-30">
  <RestTimer duration={20} {next} bind:active={resting} />
</div>

<style>
  .column-heads {
    display: grid;
    grid-template-columns: 2rem minmax(3.75rem, 1fr) minmax(3.25rem, 4.75rem) minmax(3rem, 4rem) 3rem;
    gap: clamp(0.25rem, 1.6vw, 0.5rem);
    padding-bottom: 0.25rem;
  }
</style>
