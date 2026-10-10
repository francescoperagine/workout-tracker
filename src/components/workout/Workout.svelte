<script lang="ts">
  // Allenamento attivo (/workout, brief route-workout, step 6: US-12…US-20). La sessione in corso:
  // esercizi con i target della scheda e le superserie, righe serie con il precedente, varianti, note,
  // riordino; in basso la barra fissa con durata, stato del salvataggio e "Termina", che porta al
  // riepilogo (/workout?summary=<id>). Ogni modifica si salva subito (P4) e ricaricare riporta qui (P5).
  import { onMount, tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import Info from '@lucide/svelte/icons/info';
  import Link from '@lucide/svelte/icons/link';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash from '@lucide/svelte/icons/trash';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import LiveField from '../ui/LiveField.svelte';
  import SaveBar, { type SaveBarStatus } from '../ui/SaveBar.svelte';
  import Toast from '../ui/Toast.svelte';
  import ExercisePicker, { type PickedExercise } from '../exercises/ExercisePicker.svelte';
  import ExerciseDetailsSheet from './ExerciseDetailsSheet.svelte';
  import SessionSummary from './SessionSummary.svelte';
  import VariantSheet, { type VariantChoice } from './VariantSheet.svelte';
  import WorkoutExercise from './WorkoutExercise.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    LIMITS,
    addSessionExercise,
    blocksOf,
    ensureExercise,
    exerciseHasValues,
    exerciseName,
    finishSession,
    loadRecords,
    moveKind,
    moveSessionExercise,
    nextSet,
    orderLabels,
    plannedEntry,
    previousExercise,
    removeSession,
    removeSessionExercise,
    renameSession,
    reopenSession,
    restoreSession,
    restoreSessionExercise,
    sessionHasData,
    sessionInProgress,
    setSessionDate,
    summarizeSession,
    switchExercise,
    toDateKey,
    type Archive,
    type RemovedSession,
    type SessionExercise,
  } from '../../lib/archive';
  import { formatClock, formatElapsed, formatOnDay, plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';
  import { setBottomBar } from '../../lib/bottom-bars';

  const store = archiveStore();
  const summaryId = new URL(location.href).searchParams.get('summary');
  let now = $state(Date.now());

  onMount(() => {
    // la durata nella barra; al rientro (schermo sbloccato) subito aggiornata
    const timer = setInterval(() => (now = Date.now()), 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') now = Date.now();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  });

  const today = $derived(toDateKey(new Date(now)));
  const session = $derived(store.state === 'unreadable' ? null : sessionInProgress(store.archive));
  const finished = $derived(summaryId && !session ? store.archive.sessions.find((s) => s.id === summaryId && s.end !== null) : undefined);

  const exercises = $derived(session?.exercises ?? []);
  const blocks = $derived(blocksOf(exercises));
  const labels = $derived(orderLabels(exercises));
  const next = $derived(session ? nextSet(session) : null);
  const records = $derived(new Set(session ? loadRecords(store.archive, session).map((r) => r.setId) : []));
  const doneCount = $derived(exercises.filter((e) => e.sets.length && e.sets.every((s) => s.completedAt !== null)).length);

  // --- stato della pagina ------------------------------------------------------------------------
  /** esercizi fatti riaperti dall'utente */
  let opened: string[] = $state([]);
  /** l'ultimo esercizio toccato resta aperto anche quando è fatto, per correggere l'ultima serie */
  let touched: string | null = $state(null);
  let reordering = $state(false);
  let editingDetails = $state(false);
  let announcement = $state('');
  let refs: Record<string, { openNote(): Promise<void> }> = $state({});

  let pickerOpen = $state(false);
  let variantFor: string | null = $state(null);
  let detailsFor: string | null = $state(null);
  let optionsFor: string | null = $state(null);
  let variantOpen = $state(false);
  let detailsOpen = $state(false);
  let optionsOpen = $state(false);
  let pendingVariant: { exerciseId: string; choice: VariantChoice } | null = $state(null);
  let variantConfirmOpen = $state(false);
  let discardOpen = $state(false);

  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);

  const isCompact = (e: SessionExercise) =>
    e.sets.length > 0 && e.sets.every((s) => s.completedAt !== null) && !opened.includes(e.id) && touched !== e.id;

  function toggle(e: SessionExercise) {
    if (isCompact(e)) opened = [...opened, e.id];
    else {
      opened = opened.filter((id) => id !== e.id);
      if (touched === e.id) touched = null;
    }
  }

  function notify(message: string, action?: string, onaction?: () => void) {
    toast = { message, action, onaction };
  }

  function edit(change: (archive: Archive) => Archive): boolean {
    try {
      const result = store.update(change);
      // spazio esaurito: la modifica resta in memoria e la barra lo dice
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

  const find = (id: string | null) => (id ? exercises.find((e) => e.id === id) : undefined);

  // --- serie spuntata: l'attenzione passa alla serie successiva (in superserie a 2b) ---------------
  async function afterCheck() {
    await tick();
    if (!next) return;
    const row = document.getElementById(`set-${next.set.id}`);
    row?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  // --- esercizi ----------------------------------------------------------------------------------
  function resolve(a: Archive, picked: PickedExercise | VariantChoice): { archive: Archive; id: string } {
    if (picked.kind === 'existing') return { archive: a, id: picked.id };
    const ensured = ensureExercise(a, picked.name);
    return { archive: ensured.archive, id: ensured.exercise.id };
  }

  async function addExercise(picked: PickedExercise) {
    if (!session) return;
    const sessionId = session.id;
    let added: string | null = null;
    const ok = edit((a) => {
      const resolved = resolve(a, picked);
      const result = addSessionExercise(resolved.archive, sessionId, resolved.id);
      added = result.exercise.id;
      return result.archive;
    });
    if (!ok || !added) return;
    touched = added;
    reordering = false;
    await tick();
    document.getElementById(`exercise-${added}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function openVariant(id: string) {
    variantFor = id;
    variantOpen = true;
  }

  function applyVariant(exerciseId: string, choice: VariantChoice) {
    if (!session) return;
    const sessionId = session.id;
    touched = exerciseId;
    edit((a) => {
      const resolved = resolve(a, choice);
      return switchExercise(resolved.archive, sessionId, exerciseId, resolved.id);
    });
  }

  function pickVariant(choice: VariantChoice) {
    const exercise = find(variantFor);
    if (!exercise) return;
    if (choice.kind === 'existing' && choice.id === exercise.exerciseId) return;
    // con valori già inseriti si chiede conferma: le serie si svuotano (come nel PoC)
    if (exerciseHasValues(exercise)) {
      pendingVariant = { exerciseId: exercise.id, choice };
      variantConfirmOpen = true;
    } else applyVariant(exercise.id, choice);
  }

  async function removeExercise(id: string) {
    if (!session) return;
    const sessionId = session.id;
    const exercise = find(id);
    if (!exercise) return;
    const name = exerciseName(store.archive, exercise.exerciseId);
    let removed: ReturnType<typeof removeSessionExercise>['removed'] | null = null;
    const ok = edit((a) => {
      const result = removeSessionExercise(a, sessionId, id);
      removed = result.removed;
      return result.archive;
    });
    const undo = removed as ReturnType<typeof removeSessionExercise>['removed'] | null;
    if (ok && undo) notify(`${name}: tolto dall’allenamento.`, 'Annulla', () => edit((a) => restoreSessionExercise(a, sessionId, undo)));
  }

  function option(action: 'note' | 'details' | 'variant' | 'remove') {
    const id = optionsFor;
    optionsOpen = false;
    if (!id) return;
    if (action === 'note') {
      touched = id;
      opened = opened.includes(id) ? opened : [...opened, id];
      void tick().then(() => refs[id]?.openNote());
    } else if (action === 'details') {
      detailsFor = id;
      detailsOpen = true;
    } else if (action === 'variant') openVariant(id);
    else void removeExercise(id);
  }

  // --- riordino ----------------------------------------------------------------------------------
  function moveLabel(id: string, direction: -1 | 1): string {
    const exercise = find(id)!;
    const name = exerciseName(store.archive, exercise.exerciseId);
    const where = direction < 0 ? 'su' : 'giù';
    return moveKind(exercises, id, direction) === 'block' && exercise.group !== null ? `Sposta ${where} la superserie con ${name}` : `Sposta ${where} ${name}`;
  }

  async function move(id: string, direction: -1 | 1) {
    if (!session) return;
    const sessionId = session.id;
    if (!edit((a) => moveSessionExercise(a, sessionId, id, direction))) return;
    const index = exercises.findIndex((e) => e.id === id);
    const exercise = exercises[index];
    if (exercise) announcement = `${exerciseName(store.archive, exercise.exerciseId)}: ora ${labels[index]}.`;
    // il focus resta sulla freccia (o sull'altra, se questa non può più spostare)
    await tick();
    const same = document.getElementById(`move-${id}-${direction}`) as HTMLButtonElement | null;
    const other = document.getElementById(`move-${id}-${-direction}`) as HTMLButtonElement | null;
    (same && !same.disabled ? same : other)?.focus();
  }

  // --- sessione ----------------------------------------------------------------------------------
  function onNameInput(text: string): string | void {
    if (!session) return;
    if (!text.trim()) return 'Scrivi il nome dell’allenamento.';
    if (text.trim().length > LIMITS.sessionNameLength) return `Al massimo ${LIMITS.sessionNameLength} caratteri.`;
    const sessionId = session.id;
    edit((a) => renameSession(a, sessionId, text));
  }

  function onDateChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    if (!session) return;
    const sessionId = session.id;
    if (!input.value || !edit((a) => setSessionDate(a, sessionId, input.value))) input.value = session.date;
  }

  function discard() {
    if (!session) return;
    const id = session.id;
    let removed: RemovedSession | null = null;
    const ok = edit((a) => {
      const result = removeSession(a, id);
      removed = result.removed;
      return result.archive;
    });
    const undo = removed as RemovedSession | null;
    if (ok && undo) notify('Allenamento annullato.', 'Annulla', () => edit((a) => restoreSession(a, undo)));
  }

  function askDiscard() {
    if (session && sessionHasData(session)) discardOpen = true;
    else discard();
  }

  function finish() {
    if (!session) return;
    const id = session.id;
    // il riepilogo prende il posto dell'allenamento: "indietro" torna a dove si era prima
    if (edit((a) => finishSession(a, id, Date.now()))) void navigate(`${appUrl('/workout')}?summary=${encodeURIComponent(id)}`, { history: 'replace' });
  }

  function reopen(id: string) {
    if (edit((a) => reopenSession(a, id))) void navigate(appUrl('/workout'), { history: 'replace' });
  }

  // --- barra fissa -------------------------------------------------------------------------------
  const status: SaveBarStatus | null = $derived(
    store.state === 'saved' ? (session ? 'saved' : null) : store.state === 'unsaved' ? 'unsaved' : store.state === 'conflict' ? 'conflict' : 'unreadable',
  );
  let barHeight = $state(0);
  $effect(() => setBottomBar('workout', status ? barHeight : 0));

  const startedLine = $derived.by(() => {
    if (!session) return '';
    const started = session.date === today ? `Iniziato alle ${formatClock(session.start)}` : `Iniziato ${formatOnDay(session.date, today)}`;
    return exercises.length ? `${started} · ${doneCount} di ${plural(exercises.length, 'esercizio fatto', 'esercizi fatti')}` : started;
  });

  const variantExercise = $derived(find(variantFor));
  const variantEntry = $derived(session && variantExercise ? plannedEntry(store.archive, session, variantExercise) : null);
  const detailsExercise = $derived(find(detailsFor));
  const optionsExercise = $derived(find(optionsFor));
</script>

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if session}
  <div class="workout">
    <div>
      <h2 class="title">{session.name}</h2>
      <p class="meta">{startedLine}</p>
    </div>

    {#if exercises.length}
      {#if reordering}
        <div class="reorder-head">
          <p class="m-0 text-muted">Sposta gli esercizi con le frecce.</p>
          <button type="button" class="btn btn-primary" onclick={() => (reordering = false)}>Fine</button>
        </div>
      {/if}
      <ol class="blocks" aria-label="Esercizi">
        {#each blocks as block (block.entries[0].id)}
          <li class={['panel', 'block', block.entries.length > 1 && 'superset']}>
            {#if block.entries.length > 1}
              <p class="superset-caption"><Link size={16} aria-hidden="true" />Superserie · {plural(block.entries.length, 'esercizio', 'esercizi')}</p>
            {/if}
            {#each block.entries as exercise, j (exercise.id)}
              {@const index = block.start + j}
              <div class="entry">
                {#if reordering}
                  <div class="reorder-row">
                    <span class="order" aria-hidden="true">{labels[index]}</span>
                    <span class="reorder-name">{exerciseName(store.archive, exercise.exerciseId)}</span>
                    <button
                      type="button"
                      class="btn btn-icon"
                      id={`move-${exercise.id}--1`}
                      aria-label={moveLabel(exercise.id, -1)}
                      disabled={!moveKind(exercises, exercise.id, -1)}
                      onclick={() => move(exercise.id, -1)}
                    >
                      <ArrowUp size={22} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-icon"
                      id={`move-${exercise.id}-1`}
                      aria-label={moveLabel(exercise.id, 1)}
                      disabled={!moveKind(exercises, exercise.id, 1)}
                      onclick={() => move(exercise.id, 1)}
                    >
                      <ArrowDown size={22} aria-hidden="true" />
                    </button>
                  </div>
                {:else}
                  <WorkoutExercise
                    bind:this={refs[exercise.id]}
                    archive={store.archive}
                    {session}
                    {exercise}
                    label={labels[index]}
                    current={next?.exercise.id === exercise.id}
                    compact={isCompact(exercise)}
                    {records}
                    {today}
                    {edit}
                    {notify}
                    ontouch={() => (touched = exercise.id)}
                    ontoggle={() => toggle(exercise)}
                    onchecked={afterCheck}
                    onvariant={() => openVariant(exercise.id)}
                    ondetails={() => {
                      detailsFor = exercise.id;
                      detailsOpen = true;
                    }}
                    onoptions={() => {
                      optionsFor = exercise.id;
                      optionsOpen = true;
                    }}
                  />
                {/if}
              </div>
            {/each}
          </li>
        {/each}
      </ol>
      <p class="sr-only" role="status">{announcement}</p>
    {:else}
      <div class="flex flex-col items-start gap-3">
        <Dumbbell size={28} class="text-muted" aria-hidden="true" />
        <h3 class="m-0 text-xl leading-snug font-bold">Da quale esercizio inizi?</h3>
        <p class="m-0 max-w-[60ch] text-muted">Aggiungi un esercizio dal catalogo o scrivine uno tuo: compare qui con le sue serie.</p>
      </div>
    {/if}

    {#if !reordering}
      <button
        type="button"
        id="add-exercise"
        class={['btn', 'btn-block', exercises.length ? 'btn-secondary' : 'btn-primary']}
        aria-haspopup="dialog"
        disabled={exercises.length >= LIMITS.exercisesPerSession}
        onclick={() => (pickerOpen = true)}
      >
        <Plus aria-hidden="true" />Aggiungi esercizio
      </button>
    {/if}

    <div class="more">
      <div class="flex flex-wrap gap-x-6">
        {#if exercises.length > 1}
          <button type="button" class="btn btn-text" aria-pressed={reordering} onclick={() => (reordering = !reordering)}>
            {reordering ? 'Fine riordino' : 'Riordina esercizi'}
          </button>
        {/if}
        <button type="button" class="btn btn-text" aria-expanded={editingDetails} aria-controls="session-details" onclick={() => (editingDetails = !editingDetails)}>
          Nome e data
        </button>
      </div>
      {#if editingDetails}
        <div class="details" id="session-details">
          <LiveField id="session-name" label="Nome dell’allenamento" maxlength={LIMITS.sessionNameLength} value={session.name} oninput={onNameInput} />
          <div>
            <label class="label" for="session-date">Data</label>
            <input id="session-date" class="field" type="date" value={session.date} onchange={onDateChange} />
          </div>
        </div>
      {/if}
      <button type="button" class="btn btn-danger btn-block" onclick={askDiscard}>Annulla allenamento</button>
    </div>
  </div>
{:else if finished}
  <SessionSummary archive={store.archive} session={finished} {today} onreopen={() => reopen(finished.id)} />
{:else}
  <div class="flex flex-col items-start gap-3 py-8">
    <Dumbbell size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Nessun allenamento in corso</h2>
    <p class="m-0 max-w-[60ch] text-muted">Da Oggi scegli la scheda e tocca “Inizia allenamento”.</p>
    <a class="btn btn-primary" href={appUrl('/')}>Vai a Oggi</a>
  </div>
{/if}

{#if status}
  <div class="bar" bind:offsetHeight={barHeight}>
    <SaveBar {status} compact onsavenow={() => store.repo.saveNow()} onreload={() => store.repo.reload()}>
      {#snippet detail()}
        {#if session}
          <p class="elapsed">
            <span class="sr-only">Durata:</span> {formatElapsed(summarizeSession(session, now).duration)}
          </p>
        {/if}
      {/snippet}
      {#snippet action()}
        {#if session}
          <button type="button" class="btn btn-primary" onclick={finish}>Termina</button>
        {:else if store.state === 'unreadable'}
          <a href={appUrl('/settings#data')} class="btn btn-secondary">Recupera</a>
        {/if}
      {/snippet}
    </SaveBar>
  </div>
{/if}

<ExercisePicker bind:open={pickerOpen} title="Aggiungi esercizio" catalog={store.archive} onpick={addExercise} />

{#if variantExercise}
  <VariantSheet
    bind:open={variantOpen}
    catalog={store.archive}
    current={variantExercise.exerciseId}
    planned={variantExercise.variantOf ?? variantExercise.exerciseId}
    alternatives={variantEntry?.alternatives ?? []}
    onpick={pickVariant}
  />
{/if}

<ExerciseDetailsSheet
  bind:open={detailsOpen}
  archive={store.archive}
  exerciseId={detailsExercise?.exerciseId ?? null}
  previous={session && detailsExercise ? previousExercise(store.archive, session, detailsExercise.exerciseId) : null}
  {today}
/>

<BottomSheet bind:open={optionsOpen} title={optionsExercise ? exerciseName(store.archive, optionsExercise.exerciseId) : ''}>
  <ul class="options">
    <li><button type="button" class="option" onclick={() => option('note')}><NotebookPen size={20} aria-hidden="true" />Nota sul carico</button></li>
    <li><button type="button" class="option" onclick={() => option('details')}><Info size={20} aria-hidden="true" />Come si esegue</button></li>
    <li><button type="button" class="option" onclick={() => option('variant')}><ArrowLeftRight size={20} aria-hidden="true" />Cambia esercizio</button></li>
    <li><button type="button" class="option danger" onclick={() => option('remove')}><Trash size={20} aria-hidden="true" />Togli dall’allenamento</button></li>
  </ul>
</BottomSheet>

<ConfirmDialog
  bind:open={variantConfirmOpen}
  title="Cambiare esercizio?"
  text={pendingVariant
    ? `Le serie già inserite per ${exerciseName(store.archive, find(pendingVariant.exerciseId)?.exerciseId ?? '')} si svuotano, perché il carico si riferisce a quell’esercizio.`
    : ''}
  confirmLabel="Cambia e svuota"
  onconfirm={() => pendingVariant && applyVariant(pendingVariant.exerciseId, pendingVariant.choice)}
/>

<ConfirmDialog
  bind:open={discardOpen}
  title="Annullare l’allenamento?"
  text={session ? `Si perde quanto registrato in «${session.name}»: ${plural(summarizeSession(session, now).completedSets, 'serie fatta', 'serie fatte')}.` : ''}
  confirmLabel="Annulla allenamento"
  onconfirm={discard}
/>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .workout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .meta {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
  }
  .blocks {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .block {
    display: flex;
    flex-direction: column;
  }
  .superset-caption {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0 0 0.25rem;
    color: var(--color-accent-text);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .entry + .entry {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-line);
  }
  .reorder-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .reorder-row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) 48px 48px;
    align-items: center;
    gap: 0.5rem;
    min-height: 48px;
  }
  .order {
    color: var(--color-accent-text);
    font-size: var(--text-lg);
    font-weight: 700;
    text-align: center;
  }
  .reorder-name {
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .more {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .bar {
    position: fixed;
    inset-inline: 0;
    bottom: calc(var(--bottom-bars-base) + env(safe-area-inset-bottom));
    z-index: 20;
  }
  .elapsed {
    margin: 0;
    color: var(--color-shell-foreground);
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.2;
  }
  .options {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .options li + li {
    border-top: 1px solid var(--color-line);
  }
  .option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 56px;
    padding: 0 0.25rem;
    border: 0;
    border-radius: var(--radius-field);
    background: transparent;
    color: var(--color-foreground);
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }
  .option :global(svg) {
    color: var(--color-muted);
  }
  .option:hover {
    background: color-mix(in oklab, var(--color-surface) 90%, var(--color-accent));
  }
  .option.danger,
  .option.danger :global(svg) {
    color: var(--color-danger);
  }
</style>
