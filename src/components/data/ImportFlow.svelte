<script lang="ts">
  // Importazione di un backup (US-02, US-32), dalle Impostazioni e dal primo avvio:
  // file (v2 o del PoC) → anteprima con numero di allenamenti e periodo →
  // scelta "mantieni" o "sostituisci" se ci sono elementi già presenti → riepilogo con gli scartati.
  // Fino alla conferma nulla viene modificato; un file non valido lascia il diario com'è.
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    checkSize,
    mergeImport,
    previewImport,
    readBackup,
    type DuplicateChoice,
    type ImportData,
    type ImportPreview,
  } from '../../lib/archive';
  import type { Discarded } from '../../lib/archive/poc-import';
  import { formatPeriod, plural } from '../../lib/format';

  interface Props {
    /** chiamata quando l'utente chiude il riepilogo di un'importazione riuscita */
    ondone?: () => void;
  }

  let { ondone }: Props = $props();

  // L'archivio si legge solo nel browser: il benvenuto rende questo componente anche alla build
  const store = {
    get repo() {
      return archiveStore().repo;
    },
    get archive() {
      return archiveStore().archive;
    },
    get state() {
      return archiveStore().state;
    },
  };

  type Phase = 'idle' | 'preview' | 'done' | 'error';
  interface Outcome {
    added: number;
    existing: number;
    choice: DuplicateChoice;
    routines: number;
    closedSessions: number;
    discarded: Discarded[];
    /** messaggio se il diario importato è rimasto solo in memoria */
    unsaved: string | null;
  }

  let open = $state(false);
  let phase: Phase = $state('idle');
  let data: ImportData | null = $state.raw(null);
  let preview: ImportPreview | null = $state.raw(null);
  let choice: DuplicateChoice = $state('keep');
  let error = $state('');
  let outcome: Outcome | null = $state.raw(null);
  let input: HTMLInputElement;

  // Le schede di un backup del PoC (A/B iniziali) si aggiungono solo se mancano: per il PoC la scelta
  // riguarda soltanto gli allenamenti
  const hasDuplicates = $derived(
    !!preview && preview.existingSessions + (preview.format === 'v2' ? preview.existingRoutines : 0) > 0,
  );
  const title = $derived(
    phase === 'done' ? 'Backup importato' : phase === 'error' ? 'Backup non importato' : data?.format === 'poc' ? 'Diario della versione precedente' : 'Importa backup',
  );

  /** Apre la scelta del file */
  export function pickFile() {
    input.value = '';
    input.click();
  }

  function messageOf(e: unknown): string {
    return e instanceof ArchiveError ? e.message : 'Il file non si può leggere.';
  }

  async function start(read: () => Promise<string>) {
    try {
      if (store.state === 'conflict') throw new ArchiveError('Il diario è cambiato in un’altra scheda: ricarica prima di importare.');
      const text = await read();
      data = readBackup(text, store.archive);
      preview = previewImport(store.archive, data);
      choice = 'keep';
      phase = 'preview';
    } catch (e) {
      error = messageOf(e);
      phase = 'error';
    }
    open = true;
  }

  async function onFile() {
    const file = input.files?.[0];
    if (!file) return;
    await start(async () => {
      checkSize(file.size);
      return file.text();
    });
  }

  function isEmpty() {
    const a = store.archive;
    return !a.sessions.length && !a.routines.length && !Object.keys(a.catalog).length;
  }

  function confirm() {
    if (!data || !preview) return;
    // Senza elementi in comune non c'è nulla da scegliere: su un diario vuoto (ripristino su un
    // dispositivo nuovo) il backup porta anche le sue impostazioni, altrimenti restano quelle di qui
    const effective: DuplicateChoice = hasDuplicates ? choice : isEmpty() ? 'replace' : 'keep';
    try {
      const merged = mergeImport(store.archive, data, effective);
      const result = store.repo.replace(merged.archive);
      if (!result.ok && result.state !== 'unsaved') throw new ArchiveError(result.message ?? 'Importazione non riuscita.');
      outcome = {
        added: preview.newSessions,
        existing: preview.existingSessions,
        choice: effective,
        routines: preview.newRoutines,
        closedSessions: merged.closedSessions,
        discarded: preview.discarded,
        unsaved: result.ok ? null : (result.message ?? null),
      };
      phase = 'done';
    } catch (e) {
      error = messageOf(e);
      phase = 'error';
    }
  }

  // Alla chiusura del foglio: dopo un'importazione riuscita si avvisa chi ha aperto il flusso
  $effect(() => {
    if (open || phase === 'idle') return;
    const done = phase === 'done';
    phase = 'idle';
    if (done) ondone?.();
  });
</script>

<input bind:this={input} type="file" accept="application/json,.json" class="sr-only" tabindex="-1" aria-hidden="true" onchange={onFile} />

<BottomSheet bind:open {title}>
  {#if phase === 'preview' && preview}
    <div class="flex flex-col gap-4">
      {#if store.state === 'unreadable'}
        <p class="warning">
          Il diario salvato su questo dispositivo non è leggibile: importando, il suo contenuto viene sostituito. Se vuoi
          conservarlo, scaricalo prima da Dati e privacy.
        </p>
      {/if}
      <ul class="facts">
        <li>
          <strong>{plural(preview.sessions, 'allenamento', 'allenamenti')}</strong>
          {#if preview.period}
            {formatPeriod(preview.period.from, preview.period.to)}
          {/if}
        </li>
        {#if preview.sessions}
          <li>{plural(preview.newSessions, 'nuovo', 'nuovi')}, {plural(preview.existingSessions, 'già presente', 'già presenti')} su questo dispositivo</li>
        {/if}
        {#if preview.newRoutines || preview.existingRoutines}
          <li>
            {plural(preview.newRoutines + preview.existingRoutines, 'scheda', 'schede')}{preview.existingRoutines
              ? `, ${preview.existingRoutines} già ${preview.existingRoutines === 1 ? 'presente' : 'presenti'}`
              : ''}
          </li>
        {/if}
        {#if preview.newExercises}
          <li>{plural(preview.newExercises, 'esercizio personalizzato nuovo', 'esercizi personalizzati nuovi')}</li>
        {/if}
      </ul>

      {#if preview.discarded.length}
        <div>
          <h3 class="subhead">{plural(preview.discarded.length, 'elemento scartato', 'elementi scartati')}</h3>
          <ul class="list">
            {#each preview.discarded as item, i (i)}
              <li><span class="font-semibold">{item.item}:</span> {item.reason}</li>
            {/each}
          </ul>
        </div>
      {/if}
      {#if preview.warnings.length}
        <div>
          <h3 class="subhead">Da sapere</h3>
          <ul class="list">
            {#each preview.warnings as warning, i (i)}
              <li>{warning}</li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if hasDuplicates}
        <fieldset class="flex flex-col gap-2">
          <legend class="subhead">Per gli elementi già presenti</legend>
          <label class="choice">
            <input class="radio" type="radio" name="import-choice" value="keep" bind:group={choice} />
            <span>
              <span class="block font-semibold">Mantieni quelli di questo dispositivo</span>
              <span class="block text-sm text-muted">Dal backup si aggiungono solo gli elementi nuovi.</span>
            </span>
          </label>
          <label class="choice">
            <input class="radio" type="radio" name="import-choice" value="replace" bind:group={choice} />
            <span>
              <span class="block font-semibold">Sostituisci con quelli del backup</span>
              <span class="block text-sm text-muted">
                {data?.format === 'v2'
                  ? 'Gli elementi in comune prendono la versione del backup, insieme alle impostazioni.'
                  : 'Gli allenamenti in comune prendono la versione del backup.'}
              </span>
            </span>
          </label>
        </fieldset>
      {/if}
    </div>
  {:else if phase === 'done' && outcome}
    <div class="flex flex-col gap-4">
      <ul class="facts">
        <li><strong>{plural(outcome.added, 'allenamento aggiunto', 'allenamenti aggiunti')}</strong></li>
        {#if outcome.existing}
          <li>
            {outcome.choice === 'replace'
              ? `${plural(outcome.existing, 'allenamento sostituito', 'allenamenti sostituiti')} con la versione del backup`
              : `${plural(outcome.existing, 'allenamento già presente lasciato', 'allenamenti già presenti lasciati')} com’era`}
          </li>
        {/if}
        {#if outcome.routines}
          <li>{plural(outcome.routines, 'scheda aggiunta', 'schede aggiunte')}</li>
        {/if}
        {#if outcome.closedSessions}
          <li>{plural(outcome.closedSessions, 'allenamento in corso è stato concluso', 'allenamenti in corso sono stati conclusi')}: ne resta aperto uno solo.</li>
        {/if}
      </ul>
      {#if outcome.unsaved}
        <p class="warning">{outcome.unsaved}</p>
      {/if}
      {#if outcome.discarded.length}
        <div>
          <h3 class="subhead">Non importati</h3>
          <ul class="list">
            {#each outcome.discarded as item, i (i)}
              <li><span class="font-semibold">{item.item}:</span> {item.reason}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  {:else if phase === 'error'}
    <div class="flex flex-col gap-2">
      <p class="field-error mt-0 text-base" role="alert">{error}</p>
      <p class="text-muted">Nessun dato è stato modificato.</p>
    </div>
  {/if}

  {#snippet footer()}
    {#if phase === 'preview'}
      <button type="button" class="btn btn-secondary grow" onclick={() => (open = false)}>Annulla</button>
      <button type="button" class="btn btn-primary grow" onclick={confirm}>Importa</button>
    {:else}
      <button type="button" class="btn btn-primary grow" onclick={() => (open = false)}>{phase === 'done' ? 'Fatto' : 'Chiudi'}</button>
    {/if}
  {/snippet}
</BottomSheet>

<style>
  .facts {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .subhead {
    margin: 0 0 0.375rem;
    padding: 0;
    font-size: var(--text-base);
    font-weight: 700;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin: 0;
    padding-left: 1.25rem;
    list-style: disc;
    color: var(--color-muted);
  }
  .list :global(.font-semibold) {
    color: var(--color-foreground);
  }
  .warning {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--color-warning-line);
    border-radius: var(--radius-panel);
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
</style>
