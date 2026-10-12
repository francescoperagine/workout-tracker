<script lang="ts">
  // Allenamento attivo (/workout, brief route-workout, step 6: US-12…US-20). La sessione in corso:
  // esercizi con i target della scheda e le superserie, righe serie con il precedente, varianti, note,
  // riordino; in basso la barra fissa con durata, stato del salvataggio e "Termina", che porta al
  // riepilogo (/workout?summary=<id>). Ogni modifica si salva subito (P4) e ricaricare riporta qui (P5).
  // Con `detail` (/session?id=…, step 8: US-27) mostra una sessione conclusa con le stesse righe serie,
  // modificabili: la spunta non avvia il recupero, in fondo "Riapri" ed "Elimina" (con conferma e "Annulla").
  import { onMount, tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import Check from '@lucide/svelte/icons/check';
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
  import RestTimerBar from './RestTimerBar.svelte';
  import VariantSheet, { type VariantChoice } from './VariantSheet.svelte';
  import WorkoutExercise from './WorkoutExercise.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { restTimer } from '../../lib/rest-timer.svelte';
  import { nextSetText } from '../../lib/rest-timer';
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
    removeSet,
    renameSession,
    reopenSession,
    restoreSession,
    restoreSessionExercise,
    restoreSet,
    sessionHasData,
    setHasValues,
    setNumbers,
    updateSet,
    sessionInProgress,
    workoutSummary,
    setSessionDate,
    summarizeSession,
    switchExercise,
    undoSwitch,
    toDateKey,
    type Archive,
    type RemovedSession,
    type SessionExercise,
    type SetType,
  } from '../../lib/archive';
  import { formatClock, formatElapsed, formatLongDay, formatOnDay, plural } from '../../lib/format';
  import { formatWeight } from '../../lib/units';
  import { appUrl } from '../../lib/paths';
  import { setBottomBar } from '../../lib/bottom-bars';

  let { detail = false }: { detail?: boolean } = $props();

  const store = archiveStore();
  const timer = restTimer();
  const params = new URL(location.href).searchParams;
  const summaryId = params.get('summary');
  /** sessione conclusa da mostrare (/session?id=…); `date` se si arriva dal calendario */
  const detailId = detail ? params.get('id') : null;
  const fromDate = detail ? params.get('date') : null;
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
  const session = $derived(
    store.state === 'unreadable'
      ? null
      : detail
        ? (store.archive.sessions.find((s) => s.id === detailId && s.end !== null) ?? null)
        : sessionInProgress(store.archive),
  );
  // il dettaglio di una sessione in corso è l'allenamento stesso
  $effect(() => {
    if (detail && store.archive.sessions.some((s) => s.id === detailId && s.end === null)) void navigate(appUrl('/workout'), { history: 'replace' });
  });
  const finished = $derived(summaryId && !session ? store.archive.sessions.find((s) => s.id === summaryId && s.end !== null) : undefined);

  const exercises = $derived(session?.exercises ?? []);
  const blocks = $derived(blocksOf(exercises));
  const labels = $derived(orderLabels(exercises));
  const next = $derived(session && !detail ? nextSet(session) : null);
  const nextText = $derived(session ? nextSetText(store.archive, session, next) : null);
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
  let setFor: { exerciseId: string; setId: string } | null = $state(null);
  let setOpen = $state(false);
  let variantOpen = $state(false);
  let detailsOpen = $state(false);
  let optionsOpen = $state(false);
  let discardOpen = $state(false);
  let finishOpen = $state(false);

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

  // --- serie spuntata: parte il recupero (US-21, US-25) e l'attenzione passa alla serie successiva ---
  async function afterCheck(exerciseId: string, setId: string) {
    // dentro il gesto della spunta: sblocca anche l'audio del suono di fine
    // una sessione conclusa si corregge e basta: nessun recupero (step 8)
    if (!session || detail) return;
    timer.afterCheck(session.id, exerciseId, setId);
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

  // Cambio di esercizio (US-14): nessuna conferma. Le serie spuntate restano all'esercizio fatto e
  // la variante continua sotto; i valori solo scritti si svuotano. Con qualcosa da perdere c'è "Annulla".
  async function pickVariant(choice: VariantChoice) {
    const exercise = find(variantFor);
    if (!session || !exercise) return;
    if (choice.kind === 'existing' && choice.id === exercise.exerciseId) return;
    const sessionId = session.id;
    const before = $state.snapshot(exercise) as SessionExercise;
    const from = exerciseName(store.archive, exercise.exerciseId);
    let added: string | null = null;
    let to = '';
    const ok = edit((a) => {
      const resolved = resolve(a, choice);
      to = exerciseName(resolved.archive, resolved.id);
      const result = switchExercise(resolved.archive, sessionId, exercise.id, resolved.id);
      added = result.added;
      return result.archive;
    });
    if (!ok) return;
    touched = added ?? exercise.id;
    const undo = () => edit((a) => undoSwitch(a, sessionId, before, added));
    if (added) notify(`Le serie fatte restano a ${from}; continui con ${to}.`, 'Annulla', undo);
    else if (exerciseHasValues(before)) notify(`${to} al posto di ${from}: i valori scritti si sono svuotati.`, 'Annulla', undo);
    if (!added) return;
    await tick();
    document.getElementById(`exercise-${added}`)?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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

  // --- foglio della serie: tipo (US-13) e "Togli serie" su ogni riga (US-15) -----------------------
  const SET_TYPE_OPTIONS: { type: SetType; badge: string; label: string }[] = [
    { type: 'normal', badge: '1', label: 'Normale' },
    { type: 'warmup', badge: 'R', label: 'Riscaldamento' },
    { type: 'drop', badge: 'D', label: 'Drop' },
    { type: 'failure', badge: 'C', label: 'Cedimento' },
  ];

  const setTarget = $derived.by(() => {
    const exercise = find(setFor?.exerciseId ?? null);
    const index = exercise?.sets.findIndex((s) => s.id === setFor?.setId) ?? -1;
    if (!exercise || index < 0) return null;
    const number = setNumbers(exercise.sets)[index];
    return { exercise, set: exercise.sets[index], title: `${exerciseName(store.archive, exercise.exerciseId)} · ${number ? `serie ${number}` : 'riscaldamento'}` };
  });

  function openSet(exerciseId: string, setId: string) {
    setFor = { exerciseId, setId };
    setOpen = true;
  }

  function pickSetType(type: SetType) {
    const target = setTarget;
    setOpen = false;
    if (!session || !target || target.set.type === type) return;
    const sessionId = session.id;
    edit((a) => updateSet(a, sessionId, target.exercise.id, target.set.id, { type }));
  }

  function removeOneSet() {
    const target = setTarget;
    setOpen = false;
    if (!session || !target || target.exercise.sets.length <= 1) return;
    const sessionId = session.id;
    const { exercise, set } = target;
    let removed: ReturnType<typeof removeSet>['removed'] | null = null;
    const ok = edit((a) => {
      const result = removeSet(a, sessionId, exercise.id, set.id);
      removed = result.removed;
      return result.archive;
    });
    const undo = removed as ReturnType<typeof removeSet>['removed'] | null;
    // una serie con valori si recupera con "Annulla" (P4)
    if (ok && undo && (setHasValues(set) || set.completedAt !== null))
      notify(`${exerciseName(store.archive, exercise.exerciseId)}: serie tolta.`, 'Annulla', () => edit((a) => restoreSet(a, sessionId, undo)));
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
    if (ok && undo) notify(detail ? 'Allenamento eliminato.' : 'Allenamento annullato.', 'Annulla', () => edit((a) => restoreSession(a, undo)));
  }

  function askDiscard() {
    if (session && (detail || sessionHasData(session))) discardOpen = true;
    else discard();
  }

  // "Termina" è pieno solo quando ogni serie è spuntata; prima chiede conferma, perché un tocco sbagliato
  // nella zona del pollice chiuderebbe l'allenamento e il recupero (critique dello step 9)
  const pendingSets = $derived(session ? session.exercises.flatMap((e) => e.sets).filter((s) => s.completedAt === null).length : 0);
  const pendingExercises = $derived(session ? session.exercises.filter((e) => e.sets.some((s) => s.completedAt === null)).length : 0);
  const finishReady = $derived(!!session && pendingSets === 0 && sessionHasData(session));

  function askFinish() {
    if (session && pendingSets && sessionHasData(session)) finishOpen = true;
    else finish();
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
    // nel dettaglio i problemi di salvataggio li mostra la barra del guscio
    detail ? null : store.state === 'saved' ? (session ? 'saved' : null) : store.state === 'unsaved' ? 'unsaved' : store.state === 'conflict' ? 'conflict' : 'unreadable',
  );
  let barHeight = $state(0);
  $effect(() => setBottomBar('workout', status ? barHeight : 0));

  const startedLine = $derived.by(() => {
    if (!session) return '';
    if (detail) {
      const summary = workoutSummary(session, now);
      return [
        formatLongDay(session.date, today),
        // le sessioni importate dal PoC non hanno una durata vera
        summary.duration >= 60_000 && session.end ? `${formatClock(session.start)}–${formatClock(session.end)}` : '',
        plural(summary.sets, 'serie', 'serie'),
        summary.volume > 0 ? `volume ${formatWeight(summary.volume, store.archive.settings)}` : '',
      ]
        .filter(Boolean)
        .join(' · ');
    }
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
    {#if detail}
      <a href={fromDate ? appUrl(`/calendar?date=${fromDate}`) : appUrl('/history')} class="btn btn-text back">
        <ChevronLeft aria-hidden="true" />{fromDate ? 'Torna al calendario' : 'Storico'}
      </a>
    {/if}
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
                    ontouch={() => (touched = exercise.id)}
                    ontoggle={() => toggle(exercise)}
                    onchecked={(setId) => afterCheck(exercise.id, setId)}
                    onsetoptions={(setId) => openSet(exercise.id, setId)}
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
      {#if exercises.length >= LIMITS.exercisesPerSession}
        <p class="hint mt-0">Al massimo {LIMITS.exercisesPerSession} esercizi per allenamento.</p>
      {/if}
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
      {#if detail}
        <button type="button" class="btn btn-secondary btn-block" onclick={() => reopen(session.id)}>Riapri allenamento</button>
      {/if}
      <button type="button" class="btn btn-danger btn-block" onclick={askDiscard}>{detail ? 'Elimina allenamento' : 'Annulla allenamento'}</button>
    </div>
  </div>
{:else if detail}
  <div class="flex flex-col items-start gap-3 py-8">
    <Dumbbell size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Allenamento non trovato</h2>
    <p class="m-0 max-w-[60ch] text-muted">Forse è stato eliminato, anche da un’altra scheda del browser.</p>
    <a class="btn btn-primary" href={appUrl('/history')}>Vai allo Storico</a>
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
    {#if session && timer.state?.minimized}
      <!-- il recupero ridotto sta sopra la barra dell'allenamento (US-23) -->
      <RestTimerBar remaining={timer.remaining} fraction={timer.fraction} next={nextText} onopen={() => timer.expand()} />
    {/if}
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
          <button type="button" class={['btn', finishReady ? 'btn-primary' : 'btn-secondary']} onclick={askFinish}>Termina</button>
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
    {#if optionsExercise}
      <li>
        <a class="option" href={`${appUrl('/exercise')}?id=${encodeURIComponent(optionsExercise.exerciseId)}`}><ChartLine size={20} aria-hidden="true" />Progressi</a>
      </li>
    {/if}
    <li><button type="button" class="option" onclick={() => option('variant')}><ArrowLeftRight size={20} aria-hidden="true" />Cambia esercizio</button></li>
    <li><button type="button" class="option danger" onclick={() => option('remove')}><Trash size={20} aria-hidden="true" />Togli dall’allenamento</button></li>
  </ul>
</BottomSheet>

<BottomSheet bind:open={setOpen} title={setTarget?.title ?? ''}>
  {#if setTarget}
    <ul class="options" aria-label="Tipo di serie">
      {#each SET_TYPE_OPTIONS as option (option.type)}
        {@const selected = setTarget.set.type === option.type}
        <li>
          <button type="button" class="option" aria-pressed={selected} onclick={() => pickSetType(option.type)}>
            <span class="badge" class:special={option.type !== 'normal'} aria-hidden="true">{option.badge}</span>
            <span class="grow">{option.label}</span>
            {#if selected}<Check size={20} aria-hidden="true" class="selected" />{/if}
          </button>
        </li>
      {/each}
    </ul>
    <p class="hint">Il riscaldamento non ha numero e non conta per volume e record.</p>
    <div class="options">
      <button type="button" class="option danger" disabled={setTarget.exercise.sets.length <= 1} onclick={removeOneSet}>
        <Trash size={20} aria-hidden="true" />Togli serie
      </button>
      {#if setTarget.exercise.sets.length <= 1}
        <p class="hint">Resta almeno una serie: per togliere l’esercizio usa “Altre azioni”.</p>
      {/if}
    </div>
  {/if}
</BottomSheet>

<ConfirmDialog
  bind:open={finishOpen}
  title="Terminare l’allenamento?"
  text={`${pendingSets === 1 ? 'Resta 1 serie da fare' : `Restano ${pendingSets} serie da fare`}${pendingExercises > 1 ? ` in ${pendingExercises} esercizi` : ''}. Le serie fatte sono salvate, e dal riepilogo puoi riaprire l’allenamento.`}
  confirmLabel="Termina"
  danger={false}
  onconfirm={finish}
/>

<ConfirmDialog
  bind:open={discardOpen}
  title={detail ? 'Eliminare l’allenamento?' : 'Annullare l’allenamento?'}
  text={session
    ? `Si perde quanto registrato in «${session.name}»${detail ? ` ${formatOnDay(session.date, today)}` : ''}: ${plural(summarizeSession(session, now).completedSets, 'serie fatta', 'serie fatte')}.`
    : ''}
  confirmLabel={detail ? 'Elimina allenamento' : 'Annulla allenamento'}
  onconfirm={discard}
/>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .workout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .back {
    align-self: flex-start;
    margin: -0.75rem 0 -0.5rem;
    gap: 0.25rem;
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
    /* /workout non ha la tab bar (step 9): la barra sta in fondo e copre da sé l'area sicura */
    bottom: var(--bottom-bars-base);
    padding-bottom: env(safe-area-inset-bottom);
    background: var(--color-shell);
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
    text-decoration: none;
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
  .option:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .options + .hint,
  .hint + .options {
    margin: 0.5rem 0;
  }
  .options + .hint + .options {
    border-top: 1px solid var(--color-line);
  }
  .badge {
    width: 2rem;
    color: var(--color-muted);
    font-size: var(--text-lg);
    font-weight: 650;
    text-align: center;
  }
  .badge.special {
    color: var(--color-accent-text);
  }
  .grow {
    flex: 1;
  }
  .option :global(.selected) {
    color: var(--color-accent-text);
  }
</style>
