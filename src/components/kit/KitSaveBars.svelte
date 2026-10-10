<script lang="ts">
  // Gli stati della barra di salvataggio.
  // In fondo, la barra dell'allenamento attivo (durata, "Salvato", Termina) e la mini-barra delle altre pagine.
  import SaveBar, { type SaveBarStatus } from '../ui/SaveBar.svelte';
  import WorkoutMiniBar from '../shell/WorkoutMiniBar.svelte';

  const statuses: SaveBarStatus[] = ['saved', 'saving', 'unsaved', 'conflict', 'unreadable'];
</script>

<div class="flex flex-col gap-3">
  {#each statuses as status (status)}
    <div class="overflow-hidden rounded-[var(--radius-panel)] border border-shell-line">
      <SaveBar {status}>
        {#snippet action()}
          {#if status === 'unreadable'}
            <button type="button" class="btn btn-secondary">Recupera</button>
          {:else}
            <button type="button" class="btn btn-primary">Termina</button>
          {/if}
        {/snippet}
      </SaveBar>
    </div>
  {/each}
  <p class="hint">Allenamento attivo: la durata sopra lo stato, «Salvato» in breve.</p>
  <div class="overflow-hidden rounded-[var(--radius-panel)] border border-shell-line">
    <SaveBar status="saved" compact>
      {#snippet detail()}
        <p class="m-0 text-lg leading-tight font-bold">42 min</p>
      {/snippet}
      {#snippet action()}
        <button type="button" class="btn btn-primary">Termina</button>
      {/snippet}
    </SaveBar>
  </div>
  <p class="hint">Mini-barra sulle altre pagine, sopra la tab bar: riporta all’allenamento in corso.</p>
  <div class="overflow-hidden rounded-[var(--radius-panel)] border border-shell-line">
    <WorkoutMiniBar preview={{ name: 'Scheda A', meta: 'da 25 min · Panca piana bilanciere' }} />
  </div>
</div>
