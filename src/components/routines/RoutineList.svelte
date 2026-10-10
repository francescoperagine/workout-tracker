<script lang="ts">
  // Elenco delle schede (/routines, US-10): attive con esercizi, giorni assegnati e ultima volta fatta,
  // archiviate a parte. Azioni: crea, duplica, rinomina (in linea), riordina (frecce), archivia,
  // elimina solo senza allenamenti (con conferma). Le azioni di una scheda stanno in un foglio dal basso.
  import { tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Archive from '@lucide/svelte/icons/archive';
  import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Copy from '@lucide/svelte/icons/copy';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import ClipboardPen from '@lucide/svelte/icons/clipboard-pen';
  import TextCursorInput from '@lucide/svelte/icons/text-cursor-input';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import Toast from '../ui/Toast.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    LIMITS,
    createRoutine,
    deleteRoutine,
    duplicateRoutine,
    moveRoutine,
    renameRoutine,
    restoreRoutine,
    routineLastDone,
    routineSessionCount,
    scheduledDays,
    setRoutineArchived,
    toDateKey,
    withStarterRoutines,
    type Archive as ArchiveData,
    type Routine,
  } from '../../lib/archive';
  import { formatDayMonth, formatWeekdays, plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  const today = toDateKey(new Date());

  const active = $derived(store.archive.routines.filter((r) => !r.archived));
  const archived = $derived(store.archive.routines.filter((r) => r.archived));

  let reordering = $state(false);
  let renamingId: string | null = $state(null);
  let renameText = $state('');
  let renameError = $state('');
  let announcement = $state('');

  let actionsFor: Routine | null = $state(null);
  let actionsOpen = $state(false);
  let deleting: Routine | null = $state(null);
  let confirmOpen = $state(false);

  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);
  function notify(message: string, action?: string, onaction?: () => void) {
    toast = { message, action, onaction };
  }

  function edit(change: (archive: ArchiveData) => ArchiveData): boolean {
    try {
      const result = store.update(change);
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

  function meta(routine: Routine): string {
    const days = scheduledDays(store.archive, routine.id);
    const last = routineLastDone(store.archive, routine.id);
    return [
      plural(routine.exercises.length, 'esercizio', 'esercizi'),
      days.length && !routine.archived ? formatWeekdays(days) : '',
      last ? `ultima volta il ${formatDayMonth(last, today)}` : 'mai fatta',
    ]
      .filter(Boolean)
      .join(' · ');
  }

  // --- azioni ---------------------------------------------------------------------------------
  function create() {
    let id = '';
    const ok = edit((a) => {
      const result = createRoutine(a);
      id = result.routine.id;
      return result.archive;
    });
    if (ok) void navigate(appUrl(`/routine?id=${encodeURIComponent(id)}`));
  }

  function openActions(routine: Routine) {
    actionsFor = routine;
    actionsOpen = true;
  }

  async function startRename(routine: Routine) {
    actionsOpen = false;
    reordering = false;
    renamingId = routine.id;
    renameText = routine.name;
    renameError = '';
    await tick();
    const input = document.getElementById('rename-field') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }

  async function endRename(save: boolean) {
    const id = renamingId;
    if (!id) return;
    if (save) {
      if (!renameText.trim()) {
        renameError = 'Scrivi il nome della scheda.';
        return;
      }
      if (!edit((a) => renameRoutine(a, id, renameText))) return;
    }
    renamingId = null;
    await tick();
    (document.getElementById(`routine-${id}-actions`) as HTMLElement | null)?.focus();
  }

  function duplicate(routine: Routine) {
    actionsOpen = false;
    let copy: Routine | null = null;
    const ok = edit((a) => {
      const result = duplicateRoutine(a, routine.id);
      copy = result.routine;
      return result.archive;
    });
    const created = copy as Routine | null;
    if (ok && created) {
      const id = created.id;
      notify(`Creata «${created.name}».`, 'Annulla', () => edit((a) => ({ ...a, routines: a.routines.filter((r) => r.id !== id) })));
    }
  }

  function setArchived(routine: Routine, value: boolean) {
    actionsOpen = false;
    if (!edit((a) => setRoutineArchived(a, routine.id, value))) return;
    if (value) notify(`«${routine.name}» archiviata.`, 'Annulla', () => edit((a) => setRoutineArchived(a, routine.id, false)));
    else notify(`«${routine.name}» ripristinata.`);
  }

  function askDelete(routine: Routine) {
    actionsOpen = false;
    deleting = routine;
    confirmOpen = true;
  }

  function confirmDelete() {
    const routine = deleting;
    if (!routine) return;
    let removed: ReturnType<typeof deleteRoutine>['removed'] | null = null;
    const ok = edit((a) => {
      const result = deleteRoutine(a, routine.id);
      removed = result.removed;
      return result.archive;
    });
    const undo = removed as ReturnType<typeof deleteRoutine>['removed'] | null;
    if (ok && undo) notify(`«${routine.name}» eliminata.`, 'Annulla', () => edit((a) => restoreRoutine(a, undo)));
  }

  const deleteText = $derived.by(() => {
    if (!deleting) return '';
    const days = scheduledDays(store.archive, deleting.id);
    const parts = [`Si perdono i suoi ${plural(deleting.exercises.length, 'esercizio', 'esercizi')}`];
    if (days.length) parts.push(`e l’assegnazione a ${formatWeekdays(days, true)}`);
    return `${parts.join(' ')}. Non ci sono allenamenti fatti con questa scheda.`;
  });

  async function move(routine: Routine, direction: -1 | 1) {
    if (!edit((a) => moveRoutine(a, routine.id, direction))) return;
    const list = routine.archived ? archived : active;
    const position = list.findIndex((r) => r.id === routine.id) + 1;
    announcement = `${routine.name}: posizione ${position} di ${list.length}.`;
    await tick();
    const same = document.getElementById(`move-${routine.id}-${direction}`) as HTMLButtonElement | null;
    const other = document.getElementById(`move-${routine.id}-${-direction}`) as HTMLButtonElement | null;
    (same && !same.disabled ? same : other)?.focus();
  }

  function addStarters() {
    if (edit(withStarterRoutines)) notify('Aggiunte le schede di esempio A e B.');
  }
</script>

{#snippet row(routine: Routine, list: Routine[], i: number)}
  <li class="routine">
    {#if renamingId === routine.id}
      <form
        class="rename"
        onsubmit={(event) => {
          event.preventDefault();
          void endRename(true);
        }}
        onkeydown={(event) => {
          if (event.key === 'Escape') void endRename(false);
        }}
      >
        <label class="label" for="rename-field">Nome della scheda</label>
        <input
          id="rename-field"
          class="field"
          type="text"
          autocomplete="off"
          maxlength={LIMITS.routineNameLength}
          aria-invalid={renameError ? 'true' : undefined}
          aria-describedby={renameError ? 'rename-error' : undefined}
          bind:value={renameText}
          oninput={() => (renameError = '')}
        />
        {#if renameError}<p class="field-error" id="rename-error">{renameError}</p>{/if}
        <div class="rename-actions">
          <button type="button" class="btn btn-secondary" onclick={() => endRename(false)}>Annulla</button>
          <button type="submit" class="btn btn-primary">Salva</button>
        </div>
      </form>
    {:else}
      <div class="routine-row">
        {#if reordering}
          <span class="routine-text">
            <span class="name">{routine.name}</span>
            <span class="meta">{meta(routine)}</span>
          </span>
          <button
            type="button"
            id={`move-${routine.id}--1`}
            class="btn btn-icon"
            aria-label={`Sposta su ${routine.name}`}
            disabled={i === 0}
            onclick={() => move(routine, -1)}
          >
            <ArrowUp size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            id={`move-${routine.id}-1`}
            class="btn btn-icon"
            aria-label={`Sposta giù ${routine.name}`}
            disabled={i === list.length - 1}
            onclick={() => move(routine, 1)}
          >
            <ArrowDown size={22} aria-hidden="true" />
          </button>
        {:else}
          <a class="routine-text routine-link" href={appUrl(`/routine?id=${encodeURIComponent(routine.id)}`)}>
            <span class="name">{routine.name}</span>
            <span class="meta">{meta(routine)}</span>
          </a>
          <button
            type="button"
            id={`routine-${routine.id}-actions`}
            class="btn btn-icon"
            aria-label={`Azioni per ${routine.name}`}
            aria-haspopup="dialog"
            onclick={() => openActions(routine)}
          >
            <Ellipsis size={22} aria-hidden="true" />
          </button>
        {/if}
      </div>
    {/if}
  </li>
{/snippet}

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if store.archive.routines.length === 0}
  <div class="flex flex-col items-start gap-3 py-8">
    <ClipboardList size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Nessuna scheda</h2>
    <p class="m-0 max-w-[60ch] text-muted">
      Una scheda è il programma di un allenamento: esercizi, serie, ripetizioni, carichi e recuperi. Creane una, oppure parti dalle
      schede di esempio A e B e modificale.
    </p>
    <div class="flex w-full flex-col gap-3 pt-2">
      <button type="button" class="btn btn-primary btn-block" onclick={create}><Plus aria-hidden="true" />Crea scheda</button>
      <button type="button" class="btn btn-secondary btn-block" onclick={addStarters}>Aggiungi le schede di esempio</button>
    </div>
  </div>
{:else}
  <div class="flex flex-col gap-10">
    <section aria-labelledby="active-title" class="flex flex-col gap-2">
      <div class="flex min-h-12 items-center justify-between gap-3">
        <h2 id="active-title" class="m-0 text-xl font-bold">Attive <span class="font-normal text-muted">{active.length || ''}</span></h2>
        {#if active.length > 1}
          <button type="button" class="btn btn-text" aria-pressed={reordering} onclick={() => (reordering = !reordering)}>
            {reordering ? 'Fine' : 'Riordina'}
          </button>
        {/if}
      </div>
      {#if active.length}
        <ul class="routines">
          {#each active as routine, i (routine.id)}
            {@render row(routine, active, i)}
          {/each}
        </ul>
        {#if reordering}<p class="hint mt-0">L’ordine è quello delle schede proposte in Oggi.</p>{/if}
      {:else}
        <p class="m-0 text-muted">Nessuna scheda attiva: creane una o ripristina un’archiviata.</p>
      {/if}
      <p class="sr-only" role="status">{announcement}</p>
      {#if !reordering}
        <button type="button" class="btn btn-primary btn-block mt-2" disabled={store.archive.routines.length >= LIMITS.routines} onclick={create}>
          <Plus aria-hidden="true" />Crea scheda
        </button>
      {/if}
    </section>

    {#if archived.length}
      <section aria-labelledby="archived-title" class="flex flex-col gap-2">
        <h2 id="archived-title" class="m-0 text-xl font-bold">Archiviate <span class="font-normal text-muted">{archived.length}</span></h2>
        <p class="m-0 max-w-[60ch] text-muted">Non compaiono in Oggi né nel calendario. I loro allenamenti restano nello storico.</p>
        <ul class="routines">
          {#each archived as routine, i (routine.id)}
            {@render row(routine, archived, i)}
          {/each}
        </ul>
      </section>
    {/if}
  </div>
{/if}

<BottomSheet bind:open={actionsOpen} title={actionsFor?.name ?? ''}>
  {#if actionsFor}
    {@const routine = actionsFor}
    {@const sessions = routineSessionCount(store.archive, routine.id)}
    <div class="actions">
      {#if !routine.archived}
        <a class="btn btn-secondary btn-block action" href={appUrl(`/routine?id=${encodeURIComponent(routine.id)}`)} onclick={() => (actionsOpen = false)}>
          <ClipboardPen aria-hidden="true" />Modifica esercizi
        </a>
        <button type="button" class="btn btn-secondary btn-block action" onclick={() => startRename(routine)}>
          <TextCursorInput aria-hidden="true" />Rinomina
        </button>
      {/if}
      <button type="button" class="btn btn-secondary btn-block action" onclick={() => duplicate(routine)}>
        <Copy aria-hidden="true" />Duplica
      </button>
      {#if routine.archived}
        <button type="button" class="btn btn-secondary btn-block action" onclick={() => setArchived(routine, false)}>
          <ArchiveRestore aria-hidden="true" />Ripristina
        </button>
      {:else}
        <button type="button" class="btn btn-secondary btn-block action" onclick={() => setArchived(routine, true)}>
          <Archive aria-hidden="true" />Archivia
        </button>
      {/if}
      {#if sessions === 0}
        <button type="button" class="btn btn-danger btn-block action" onclick={() => askDelete(routine)}>
          <Trash aria-hidden="true" />Elimina
        </button>
      {:else}
        <p class="hint">
          Non si può eliminare: {plural(sessions, 'allenamento nello storico usa', 'allenamenti nello storico usano')} questa scheda.
          {routine.archived ? '' : 'Archiviala per toglierla da Oggi e dal calendario.'}
        </p>
      {/if}
    </div>
  {/if}
</BottomSheet>

<ConfirmDialog
  bind:open={confirmOpen}
  title={`Eliminare «${deleting?.name ?? ''}»?`}
  text={deleteText}
  confirmLabel="Elimina scheda"
  onconfirm={confirmDelete}
/>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .routines {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .routine {
    border-top: 1px solid var(--color-line);
  }
  .routine:last-child {
    border-bottom: 1px solid var(--color-line);
  }
  .routine-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 64px;
  }
  .routine-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    min-height: 64px;
    padding: 0.5rem 0;
  }
  .routine-link {
    color: inherit;
    text-decoration: none;
    border-radius: var(--radius-field);
  }
  .routine-link:hover .name {
    text-decoration: underline;
  }
  .name {
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .meta {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .rename {
    display: flex;
    flex-direction: column;
    padding: 0.75rem 0;
  }
  .rename-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .rename-actions > * {
    flex: 1;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .action {
    justify-content: flex-start;
  }
</style>
