<script lang="ts">
  // Stato dell'archivio nel guscio di ogni schermata (US-33, P4). Quando tutto è salvato non occupa
  // spazio; se il salvataggio fallisce, il diario è cambiato in un'altra scheda o è illeggibile,
  // la barra di salvataggio compare sopra la tab bar con l'azione che risolve il problema.
  import { onMount } from 'svelte';
  import SaveBar, { type SaveBarStatus } from '../ui/SaveBar.svelte';
  import { archiveStore, askPersistenceOnce } from '../../lib/archive-store.svelte';
  import { appUrl, isCurrentPath } from '../../lib/paths';
  import { setBottomBar } from '../../lib/bottom-bars';

  const store = archiveStore();
  const SAVE_BAR_HEIGHT = 68;

  const status: SaveBarStatus | null = $derived(
    store.state === 'unsaved' ? 'unsaved' : store.state === 'conflict' ? 'conflict' : store.state === 'unreadable' ? 'unreadable' : null,
  );
  const onSettings = isCurrentPath(location.pathname, '/settings');

  // Gli avvisi brevi si posano sopra lo stack delle barre: la pagina ne dichiara l'altezza
  $effect(() => setBottomBar('save', status ? SAVE_BAR_HEIGHT : 0));

  onMount(() => askPersistenceOnce());
</script>

{#if status}
  <SaveBar {status} onsavenow={() => store.repo.saveNow()} onreload={() => store.repo.reload()}>
    {#snippet action()}
      {#if !onSettings}
        <a href={appUrl('/settings#data')} class="btn btn-secondary">Recupera</a>
      {/if}
    {/snippet}
  </SaveBar>
{/if}
