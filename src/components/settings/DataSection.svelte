<script lang="ts">
  // Dati e privacy (US-32, US-33, US-02, US-03): dove sono i dati, backup ed esportazione, importazione
  // (v2 e PoC), recupero di un archivio illeggibile, cancellazione con conferma forte e annullamento.
  // Testi semplici: niente "localStorage" né "origin" senza spiegazione (brief route-settings).
  import { onMount } from 'svelte';
  import Download from '@lucide/svelte/icons/download';
  import Upload from '@lucide/svelte/icons/upload';
  import Trash from '@lucide/svelte/icons/trash';
  import ImportFlow from '../data/ImportFlow.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { backupFileName, emptyArchive, exportArchive, readPocKey, type Archive } from '../../lib/archive';
  import { downloadText, isIos, isStandalone, readLastBackup, saveLastBackup } from '../../lib/device';
  import { formatTimestamp, plural } from '../../lib/format';

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

  let lastBackup: number | null = $state(readLastBackup());
  let persisted: boolean | null = $state(null);
  let pocText: string | null = $state(readPocKey());
  let showIosWarning = $state(false);
  let confirmClear = $state(false);
  let importFlow: ImportFlow;

  onMount(() => {
    showIosWarning = isIos() && !isStandalone();
    navigator.storage?.persisted?.().then((value) => (persisted = value)).catch(() => {});
  });

  function exportBackup() {
    const now = new Date();
    const name = backupFileName(now);
    downloadText(exportArchive(store.archive, now), name);
    saveLastBackup(now.getTime());
    lastBackup = now.getTime();
    notify(`Backup esportato: ${name}`);
  }

  function downloadOriginal() {
    if (store.repo.originalContent === null) return;
    downloadText(store.repo.originalContent, `bodytracker-illeggibile-${backupFileName().slice('bodytracker-'.length)}`);
  }

  function clearAll() {
    const previous: Archive = store.archive;
    // Le impostazioni restano: si cancella il diario, non le preferenze
    const result = store.repo.replace({ ...emptyArchive(), settings: { ...previous.settings }, revision: previous.revision });
    if (!result.ok && result.state !== 'unsaved') {
      notify('Cancellazione non riuscita: il diario non è disponibile.');
      return;
    }
    notify('Diario cancellato da questo dispositivo.', 'Annulla', () => {
      store.repo.replace(previous);
    });
  }

  const clearText = $derived(
    `Elimini da questo dispositivo ${[
      plural(counts.sessions, 'allenamento', 'allenamenti'),
      plural(counts.routines, 'scheda', 'schede'),
      plural(counts.custom, 'esercizio personalizzato', 'esercizi personalizzati'),
    ].join(', ')} e la pianificazione della settimana. Le impostazioni restano. Se non hai un backup, esportalo prima.`,
  );
</script>

<section id="data" aria-labelledby="s-data" class="flex scroll-mt-24 flex-col gap-3">
  <h2 id="s-data" class="section-title">Dati e privacy</h2>

  {#if store.state === 'unreadable'}
    <div class="warning flex flex-col gap-3" role="alert">
      <p class="m-0">
        Non riesco a leggere il diario salvato in questo browser. Non l’ho sovrascritto: scarica il contenuto originale per
        conservarlo, poi importa un backup valido.
      </p>
      <button type="button" class="btn btn-secondary self-start" onclick={downloadOriginal}>
        <Download aria-hidden="true" />Scarica il contenuto originale
      </button>
    </div>
  {/if}

  <div class="panel flex flex-col gap-3">
    <p class="m-0">
      Il diario è salvato solo in questo browser, su questo dispositivo. Non c’è un account e nulla viene inviato a un
      server: l’app funziona anche senza rete.
    </p>
    <p class="m-0 text-muted">
      Ogni browser e ogni indirizzo del sito ha il suo spazio: da un altro browser, da un altro telefono o in navigazione
      privata questi dati non ci sono. Per spostarli o conservarli usa un backup.
    </p>
    {#if persisted !== null}
      <p class="m-0 text-muted">
        {persisted
          ? 'Il browser si è impegnato a conservare i dati anche quando lo spazio scarseggia.'
          : 'Il browser potrebbe cancellare i dati se lo spazio scarseggia: fai un backup ogni tanto.'}
      </p>
    {/if}
  </div>

  {#if showIosWarning}
    <p class="warning m-0">
      Su iPhone e iPad, Safari cancella i dati dei siti che non apri da 7 giorni. Installa l’app sulla schermata Home e fai un
      backup ogni tanto.
    </p>
  {/if}

  <div class="panel flex flex-col gap-4">
    <div>
      <h3 class="subhead">Backup</h3>
      <p class="m-0 text-muted" data-testid="archive-summary">
        {isEmpty
          ? 'Il diario è vuoto.'
          : `Nel diario: ${plural(counts.sessions, 'allenamento', 'allenamenti')}, ${plural(counts.routines, 'scheda', 'schede')}.`}
        Ultimo backup da questo browser: {lastBackup ? formatTimestamp(lastBackup) : 'mai'}.
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <button type="button" class="btn btn-primary grow" onclick={exportBackup} disabled={store.state === 'unreadable'}>
        <Download aria-hidden="true" />Esporta backup
      </button>
      <button type="button" class="btn btn-secondary grow" onclick={() => importFlow.pickFile()}>
        <Upload aria-hidden="true" />Importa backup
      </button>
    </div>
    <p class="hint mt-0">
      Il backup è un file che resta tuo: puoi reimportarlo qui o su un altro dispositivo. Importa anche il file esportato
      dalla versione precedente dell’app.
    </p>
  </div>

  {#if pocText}
    <div class="panel flex flex-col gap-3">
      <h3 class="subhead">Diario della versione precedente</h3>
      <p class="m-0 text-muted">Su questo dispositivo c’è il diario della versione precedente dell’app. Puoi importarlo qui, con un’anteprima prima di confermare.</p>
      <button type="button" class="btn btn-secondary self-start" onclick={() => pocText && importFlow.importText(pocText)}>
        <Upload aria-hidden="true" />Importa il diario precedente
      </button>
    </div>
  {/if}

  <div class="panel flex flex-col gap-3">
    <h3 class="subhead">Cancella il diario</h3>
    <p class="m-0 text-muted">Elimina allenamenti, schede e pianificazione da questo dispositivo. Le impostazioni restano.</p>
    <button type="button" class="btn btn-danger self-start" disabled={isEmpty || store.state !== 'saved'} onclick={() => (confirmClear = true)}>
      <Trash aria-hidden="true" />Cancella tutto il diario
    </button>
  </div>
</section>

<ImportFlow bind:this={importFlow} ondone={() => notify('Backup importato.')} />

<ConfirmDialog bind:open={confirmClear} title="Cancellare tutto il diario?" text={clearText} confirmLabel="Cancella tutto" onconfirm={clearAll} />

<style>
  p {
    max-width: 56ch;
  }
  /* titolo di sezione nel contenuto: "Titolo pagina" di DESIGN.md */
  .section-title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
  }
  .subhead {
    margin: 0 0 0.25rem;
    font-size: var(--text-base);
    font-weight: 700;
  }
  .warning {
    padding: 0.75rem;
    border: 1px solid var(--color-warning-line);
    border-radius: var(--radius-panel);
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }
</style>
