<script lang="ts">
  // Reset dello storico (US-32): ultima voce delle Impostazioni, conferma che dice cosa si perde,
  // annullamento dal toast. Le impostazioni restano: si cancella il diario, non le preferenze.
  import Trash from '@lucide/svelte/icons/trash';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { emptyArchive, type Archive } from '../../lib/archive';
  import { plural } from '../../lib/format';

  interface Props {
    notify: (message: string, action?: string, onaction?: () => void) => void;
  }

  let { notify }: Props = $props();

  const store = archiveStore();
  const archive = $derived(store.archive);
  const counts = $derived({
    sessions: archive.sessions.length,
    routines: archive.routines.length,
    custom: Object.keys(archive.catalog).length,
  });
  const isEmpty = $derived(!counts.sessions && !counts.routines && !counts.custom && !Object.keys(archive.schedule).length);

  let confirmReset = $state(false);

  function reset() {
    const previous: Archive = store.archive;
    const result = store.repo.replace({ ...emptyArchive(), settings: { ...previous.settings }, revision: previous.revision });
    if (!result.ok && result.state !== 'unsaved') {
      notify('Reset non riuscito: il diario non è disponibile.');
      return;
    }
    notify('Storico resettato su questo dispositivo.', 'Annulla', () => {
      store.repo.replace(previous);
    });
  }

  const resetText = $derived(
    `Elimini da questo dispositivo lo storico di ${plural(counts.sessions, 'allenamento', 'allenamenti')} con i progressi e i record, ${plural(
      counts.routines,
      'scheda',
      'schede',
    )}, ${plural(counts.custom, 'esercizio personalizzato', 'esercizi personalizzati')} e la pianificazione della settimana. Le impostazioni restano. Se non hai un backup, esportalo prima.`,
  );
</script>

<section aria-label="Resetta lo storico" class="panel flex flex-col gap-3">
  <p class="m-0 max-w-[56ch] text-text-muted">
    Elimina da questo dispositivo allenamenti, progressi e record, schede e pianificazione. Le impostazioni restano.
  </p>
  <button type="button" class="btn btn-danger w-full" disabled={isEmpty || store.state !== 'saved'} onclick={() => (confirmReset = true)}>
    <Trash aria-hidden="true" />Resetta lo storico
  </button>
</section>

<ConfirmDialog bind:open={confirmReset} title="Resettare lo storico?" text={resetText} confirmLabel="Resetta lo storico" onconfirm={reset} />
