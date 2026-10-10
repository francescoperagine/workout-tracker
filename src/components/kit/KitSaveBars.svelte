<script lang="ts">
  // I quattro stati della barra di salvataggio.
  import SaveBar, { type SaveBarStatus } from '../ui/SaveBar.svelte';

  const statuses: SaveBarStatus[] = ['saved', 'saving', 'unsaved', 'conflict'];
</script>

<div class="flex flex-col gap-3">
  {#each statuses as status (status)}
    <div class="overflow-hidden rounded-[var(--radius-panel)] border border-shell-line">
      <SaveBar {status}>
        {#snippet action()}
          <button type="button" class="btn btn-primary">Termina</button>
        {/snippet}
      </SaveBar>
    </div>
  {/each}
</div>
