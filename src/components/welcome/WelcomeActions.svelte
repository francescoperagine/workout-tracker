<script lang="ts">
  // Azioni del primo avvio (US-01, US-02): schede di esempio, partenza da zero, importazione.
  // Nessun permesso chiesto qui: la conservazione dei dati si chiede solo dopo la scelta.
  // Se sulla stessa origine c'è il diario del PoC, la sua importazione diventa l'azione principale.
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Upload from '@lucide/svelte/icons/upload';
  import ImportFlow from '../data/ImportFlow.svelte';
  import { archiveStore, askPersistenceOnce } from '../../lib/archive-store.svelte';
  import { readPocKey, withStarterRoutines, type Archive } from '../../lib/archive';
  import { appUrl } from '../../lib/paths';

  let pocText: string | null = $state(null);
  let error = $state('');
  let importFlow: ImportFlow;

  onMount(() => {
    pocText = readPocKey();
  });

  function goToday() {
    askPersistenceOnce();
    void navigate(appUrl('/'), { history: 'replace' });
  }

  function begin(change: (archive: Archive) => Archive) {
    const result = archiveStore().update(change);
    if (!result.ok) {
      error = result.message ?? 'Non riesco a salvare il diario su questo dispositivo.';
      return;
    }
    goToday();
  }
</script>

<div class="flex flex-col gap-3">
  {#if pocText}
    <div class="panel flex flex-col gap-3">
      <p class="m-0 font-semibold">Ho trovato il diario della versione precedente su questo dispositivo.</p>
      <button type="button" class="btn btn-primary btn-block" onclick={() => pocText && importFlow.importText(pocText)}>
        Importa il diario
      </button>
    </div>
  {/if}
  <button type="button" class={['btn btn-block', pocText ? 'btn-secondary' : 'btn-primary']} onclick={() => begin(withStarterRoutines)}>
    Inizia con le schede di esempio
  </button>
  <button type="button" class="btn btn-secondary btn-block" onclick={() => begin((a) => ({ ...a }))}>Parti da zero</button>
  <button type="button" class="btn btn-text self-center" onclick={() => importFlow.pickFile()}>
    <Upload aria-hidden="true" />Importa un backup
  </button>
  {#if error}
    <p class="field-error mt-0" role="alert">{error}</p>
  {/if}
</div>

<ImportFlow bind:this={importFlow} ondone={goToday} />
