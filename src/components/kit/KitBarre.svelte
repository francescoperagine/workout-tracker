<script lang="ts">
  // I quattro stati della barra di salvataggio.
  import BarraSalvataggio, { type StatoSalvataggio } from '../ui/BarraSalvataggio.svelte';

  const stati: StatoSalvataggio[] = ['salvato', 'salvataggio', 'errore', 'conflitto'];
</script>

<div class="flex flex-col gap-3">
  {#each stati as stato (stato)}
    <div class="overflow-hidden rounded-[var(--radius-pannello)] border border-guscio-linea">
      <BarraSalvataggio {stato}>
        {#snippet azione()}
          <button type="button" class="pulsante pulsante-primario">Termina</button>
        {/snippet}
      </BarraSalvataggio>
    </div>
  {/each}
</div>
