<script lang="ts">
  // Editor di una scheda (/routine?id=…, brief route-routines): nome, voci in ordine con modifica in
  // linea, superserie, riordino con frecce (P9), aggiunta dal catalogo in un foglio dal basso.
  // Ogni modifica si salva subito (P4); una scheda archiviata è in sola lettura, con "Ripristina".
  import { tick } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Link from '@lucide/svelte/icons/link';
  import Plus from '@lucide/svelte/icons/plus';
  import EntryEditor from './EntryEditor.svelte';
  import ExercisePicker, { type PickedExercise } from '../exercises/ExercisePicker.svelte';
  import LiveField from '../ui/LiveField.svelte';
  import Toast from '../ui/Toast.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    LIMITS,
    addAlternative,
    addEntry,
    blocksOf,
    ensureExercise,
    exerciseName,
    findRoutine,
    isValidDateKey,
    linkedToPrevious,
    moveEntry,
    moveKind,
    orderLabels,
    removeEntry,
    renameRoutine,
    restoreEntry,
    setRoutineArchived,
    setRoutineNotes,
    updateEntry,
    type Archive,
  } from '../../lib/archive';
  import { plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  const urlParams = new URLSearchParams(location.search);
  const routineId = urlParams.get('id') ?? '';
  // arrivati dal foglio di un giorno: si torna al calendario con quel foglio aperto
  const fromDate = isValidDateKey(urlParams.get('date') ?? '') ? urlParams.get('date') : null;
  const routine = $derived(findRoutine(store.archive, routineId));
  const exercises = $derived(routine?.exercises ?? []);
  const labels = $derived(orderLabels(exercises));
  const blocks = $derived(blocksOf(exercises));

  let expandedId: string | null = $state(null);
  let reordering = $state(false);
  let announcement = $state('');

  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);
  function notify(message: string, action?: string, onaction?: () => void) {
    toast = { message, action, onaction };
  }

  /** Applica una modifica all'archivio; un errore (limite, nome vuoto…) arriva come avviso. */
  function edit(change: (archive: Archive) => Archive): boolean {
    try {
      const result = store.update(change);
      // con lo spazio esaurito le modifiche restano in memoria e la barra del guscio lo dice
      if (!result.ok && result.state !== 'unsaved') {
        notify(result.message ?? 'Modifica non salvata.');
        return false;
      }
      return true;
    } catch (error) {
      if (!(error instanceof ArchiveError)) throw error;
      notify(error.message);
      return false;
    }
  }

  // --- catalogo -------------------------------------------------------------------------------
  type PickerMode = { kind: 'add' } | { kind: 'replace'; entryId: string } | { kind: 'alternative'; entryId: string };
  let pickerOpen = $state(false);
  let picker: PickerMode = $state({ kind: 'add' });
  const pickerEntry = $derived(picker.kind === 'add' ? undefined : exercises.find((e) => e.id === picker.entryId));
  const pickerTitle = $derived(
    picker.kind === 'add' ? 'Aggiungi esercizio' : picker.kind === 'replace' ? 'Cambia esercizio' : 'Aggiungi alternativa',
  );
  // cambiando esercizio si può scegliere un'alternativa (che esce dalle alternative); aggiungendone una, no
  const pickerExclude = $derived(
    !pickerEntry ? [] : picker.kind === 'replace' ? [pickerEntry.exerciseId] : [pickerEntry.exerciseId, ...pickerEntry.alternatives],
  );

  function openPicker(mode: PickerMode) {
    picker = mode;
    pickerOpen = true;
  }

  async function onpick(picked: PickedExercise) {
    const mode = picker;
    let addedId: string | null = null;
    const ok = edit((a) => {
      let exerciseId: string;
      if (picked.kind === 'new') {
        const ensured = ensureExercise(a, picked.name);
        a = ensured.archive;
        exerciseId = ensured.exercise.id;
      } else exerciseId = picked.id;
      if (mode.kind === 'add') {
        const result = addEntry(a, routineId, exerciseId);
        addedId = result.entry.id;
        return result.archive;
      }
      if (mode.kind === 'alternative') return addAlternative(a, routineId, mode.entryId, exerciseId);
      const current = findRoutine(a, routineId)?.exercises.find((e) => e.id === mode.entryId);
      return updateEntry(a, routineId, mode.entryId, {
        exerciseId,
        alternatives: (current?.alternatives ?? []).filter((id) => id !== exerciseId),
      });
    });
    if (!ok) return;
    if (addedId) {
      // la voce nuova si apre per scrivere serie, ripetizioni e carico
      expandedId = addedId;
      reordering = false;
      await tick();
      document.getElementById(`entry-${addedId}-toggle`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  // --- voci -----------------------------------------------------------------------------------
  async function remove(entryId: string) {
    const entry = exercises.find((e) => e.id === entryId);
    if (!entry) return;
    const name = exerciseName(store.archive, entry.exerciseId);
    const index = exercises.indexOf(entry);
    let removed: ReturnType<typeof removeEntry>['removed'] | null = null;
    const ok = edit((a) => {
      const result = removeEntry(a, routineId, entryId);
      removed = result.removed;
      return result.archive;
    });
    if (!ok || !removed) return;
    const undo = removed;
    expandedId = null;
    notify(`${name}: tolto dalla scheda.`, 'Annulla', () => edit((a) => restoreEntry(a, routineId, undo)));
    // il focus va alla voce che ha preso il suo posto, o all'aggiunta
    await tick();
    const next = exercises[Math.min(index, exercises.length - 1)];
    (document.getElementById(next ? `entry-${next.id}-toggle` : 'add-exercise') as HTMLElement | null)?.focus();
  }

  function moveLabel(entryId: string, direction: -1 | 1): string {
    const entry = exercises.find((e) => e.id === entryId)!;
    const name = exerciseName(store.archive, entry.exerciseId);
    const where = direction < 0 ? 'su' : 'giù';
    return moveKind(exercises, entryId, direction) === 'block' && entry.group !== null
      ? `Sposta ${where} la superserie con ${name}`
      : `Sposta ${where} ${name}`;
  }

  async function move(entryId: string, direction: -1 | 1) {
    if (!edit((a) => moveEntry(a, routineId, entryId, direction))) return;
    const entry = exercises.find((e) => e.id === entryId);
    const index = exercises.findIndex((e) => e.id === entryId);
    if (entry) announcement = `${exerciseName(store.archive, entry.exerciseId)}: ora ${labels[index]}.`;
    // il focus resta sulla freccia (o sull'altra, se questa non può più spostare)
    await tick();
    const same = document.getElementById(`move-${entryId}-${direction}`) as HTMLButtonElement | null;
    const other = document.getElementById(`move-${entryId}-${-direction}`) as HTMLButtonElement | null;
    (same && !same.disabled ? same : other)?.focus();
  }

  // --- scheda ---------------------------------------------------------------------------------
  function onNameInput(text: string): string | void {
    if (!text.trim()) return 'Scrivi il nome della scheda.';
    if (text.trim().length > LIMITS.routineNameLength) return `Al massimo ${LIMITS.routineNameLength} caratteri.`;
    edit((a) => renameRoutine(a, routineId, text));
  }

  function restore() {
    if (edit((a) => setRoutineArchived(a, routineId, false))) notify('Scheda ripristinata: torna tra le schede attive.');
  }
</script>

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if !routine}
  <div class="flex flex-col items-start gap-3 py-8">
    <ClipboardList size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Scheda non trovata</h2>
    <p class="m-0 max-w-[60ch] text-muted">Forse è stata eliminata, anche da un’altra scheda del browser.</p>
    <a href={appUrl('/routines')} class="btn btn-primary">Vai alle schede</a>
  </div>
{:else}
  <div class="flex flex-col gap-6">
    <a href={fromDate ? appUrl(`/calendar?date=${fromDate}`) : appUrl('/routines')} class="btn btn-text back"><ChevronLeft aria-hidden="true" />{fromDate ? 'Torna al calendario' : 'Tutte le schede'}</a>

    {#if routine.archived}
      <div class="flex flex-col items-start gap-3">
        <h2 class="m-0 text-page-title font-bold">{routine.name}</h2>
        <p class="m-0 max-w-[60ch] text-muted">
          Scheda archiviata: non compare in Oggi né nel calendario, e i suoi allenamenti restano nello storico. Ripristinala per
          modificarla.
        </p>
        <button type="button" class="btn btn-primary" onclick={restore}>Ripristina</button>
      </div>
    {:else}
      <LiveField id="routine-name" label="Nome della scheda" maxlength={LIMITS.routineNameLength} value={routine.name} oninput={onNameInput} />
    {/if}

    <section aria-labelledby="entries-title" class="flex flex-col gap-2">
      <div class="flex min-h-12 items-center justify-between gap-3">
        <h2 id="entries-title" class="m-0 text-xl font-bold">
          Esercizi <span class="font-normal text-muted">{exercises.length || ''}</span>
        </h2>
        {#if !routine.archived && exercises.length > 1}
          <button
            type="button"
            class="btn btn-text"
            aria-pressed={reordering}
            onclick={() => {
              reordering = !reordering;
              expandedId = null;
            }}
          >
            {reordering ? 'Fine' : 'Riordina'}
          </button>
        {/if}
      </div>

      {#if exercises.length === 0}
        <p class="m-0 max-w-[60ch] text-muted">
          {routine.archived
            ? 'Questa scheda non ha esercizi.'
            : 'Aggiungi gli esercizi nell’ordine in cui li fai. Per una superserie aggiungi i due esercizi, poi apri il secondo e uniscilo a quello sopra.'}
        </p>
      {:else}
        <ol class="blocks">
          {#each blocks as block (block.entries[0].id)}
            <li class="block" class:superset={block.entries.length > 1}>
              {#if block.entries.length > 1}
                <p class="superset-caption"><Link size={16} aria-hidden="true" />Superserie · {plural(block.entries.length, 'esercizio', 'esercizi')}</p>
              {/if}
              <ol class="entries" aria-label={block.entries.length > 1 ? 'Superserie' : undefined}>
                {#each block.entries as entry, i (entry.id)}
                  {@const index = block.start + i}
                  <li class="entry-item">
                    {#if reordering}
                      <div class="reorder-row">
                        <span class="order" aria-hidden="true">{labels[index]}</span>
                        <span class="min-w-0 grow font-semibold">{exerciseName(store.archive, entry.exerciseId)}</span>
                        <button
                          type="button"
                          id={`move-${entry.id}--1`}
                          class="btn btn-icon"
                          aria-label={moveLabel(entry.id, -1)}
                          disabled={!moveKind(exercises, entry.id, -1)}
                          onclick={() => move(entry.id, -1)}
                        >
                          <ArrowUp size={22} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          id={`move-${entry.id}-1`}
                          class="btn btn-icon"
                          aria-label={moveLabel(entry.id, 1)}
                          disabled={!moveKind(exercises, entry.id, 1)}
                          onclick={() => move(entry.id, 1)}
                        >
                          <ArrowDown size={22} aria-hidden="true" />
                        </button>
                      </div>
                    {:else}
                      <EntryEditor
                        archive={store.archive}
                        {routineId}
                        {entry}
                        label={labels[index]}
                        {index}
                        linked={linkedToPrevious(exercises, index)}
                        expanded={expandedId === entry.id}
                        readonly={routine.archived}
                        ontoggle={() => (expandedId = expandedId === entry.id ? null : entry.id)}
                        {edit}
                        onpick={(mode) => openPicker({ kind: mode, entryId: entry.id })}
                        onremove={() => remove(entry.id)}
                      />
                    {/if}
                  </li>
                {/each}
              </ol>
            </li>
          {/each}
        </ol>
      {/if}
      <p class="sr-only" role="status">{announcement}</p>

      {#if !routine.archived && !reordering}
        <button
          type="button"
          id="add-exercise"
          class="btn btn-primary btn-block mt-2"
          disabled={exercises.length >= LIMITS.exercisesPerRoutine}
          onclick={() => openPicker({ kind: 'add' })}
        >
          <Plus aria-hidden="true" />Aggiungi esercizio
        </button>
      {/if}
    </section>

    {#if !routine.archived}
      <LiveField
        id="routine-notes"
        label="Note sulla scheda"
        hint="Facoltative: obiettivo, giorni, indicazioni generali."
        multiline
        maxlength={LIMITS.notesLength}
        value={routine.notes}
        oninput={(text) => void edit((a) => setRoutineNotes(a, routineId, text))}
      />
    {:else if routine.notes}
      <p class="m-0 max-w-[60ch] whitespace-pre-line text-muted">{routine.notes}</p>
    {/if}
  </div>

  <ExercisePicker bind:open={pickerOpen} title={pickerTitle} catalog={store.archive} exclude={pickerExclude} {onpick} />
{/if}

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .back {
    align-self: flex-start;
    margin: -0.75rem 0 -0.5rem;
    gap: 0.25rem;
  }
  .blocks,
  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .block {
    border-top: 1px solid var(--color-line);
  }
  .block:last-child {
    border-bottom: 1px solid var(--color-line);
  }
  .superset-caption {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0;
    padding: 0.5rem 0 0 0.75rem;
    color: var(--color-accent-text);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  /* la superserie si legge come un blocco: un filo nella colonna del numero unisce ogni voce alla successiva */
  .superset .entry-item {
    position: relative;
  }
  .superset .entry-item:not(:last-child)::before {
    content: "";
    position: absolute;
    top: 2.25rem;
    bottom: -0.75rem;
    left: 1.25rem;
    border-left: 1px solid var(--color-line-strong);
  }
  /* sotto i 360px l'editor della voce usa tutta la larghezza: il filo lo attraverserebbe */
  @media (max-width: 359px) {
    .superset .entry-item:has(:global(.expanded))::before {
      display: none;
    }
  }
  .reorder-row {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) 48px 48px;
    align-items: center;
    gap: 0.5rem;
    min-height: 56px;
    padding: 0.25rem 0;
  }
  .order {
    position: relative;
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-text);
    text-align: center;
    background: var(--color-background);
  }
</style>
