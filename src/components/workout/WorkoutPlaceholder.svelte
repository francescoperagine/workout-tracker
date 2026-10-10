<script lang="ts">
  // Allenamento (/workout), segnaposto onesto dello step 5: "Inizia allenamento" crea già la sessione
  // vera (una sola in corso), e qui se ne vede il programma; la registrazione delle serie, il timer e
  // il riepilogo arrivano con gli step 6 e 7, che sostituiscono questa pagina.
  // Si può annullare l'allenamento (con "Annulla"), o concluderlo se ha già dei valori (import).
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import Toast from '../ui/Toast.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    exerciseName,
    finishSession,
    orderLabels,
    removeSession,
    restoreSession,
    sessionHasData,
    sessionInProgress,
    summarizeSession,
    type Archive,
    type RemovedSession,
    type SessionExercise,
  } from '../../lib/archive';
  import { formatClock, formatDuration, formatElapsed, plural } from '../../lib/format';
  import { formatWeightRange } from '../../lib/units';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  let now = $state(Date.now());

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(timer);
  });

  const session = $derived(sessionInProgress(store.archive));
  const routine = $derived(session?.routineId ? store.archive.routines.find((r) => r.id === session.routineId) : undefined);
  const labels = $derived(session ? orderLabels(session.exercises) : []);

  let confirmOpen = $state(false);
  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);

  function edit(change: (archive: Archive) => Archive): boolean {
    try {
      const result = store.update(change);
      if (!result.ok && result.state !== 'unsaved') {
        toast = { message: result.message ?? 'Modifica non salvata.' };
        return false;
      }
      return true;
    } catch (error) {
      if (!(error instanceof ArchiveError)) throw error;
      toast = { message: error.message };
      return false;
    }
  }

  /** Target della voce di scheda corrispondente (stessa posizione e stesso esercizio) */
  function target(exercise: SessionExercise, index: number): string {
    const entry = routine?.exercises[index];
    const sets = plural(exercise.sets.length, 'serie', 'serie');
    const rest = exercise.rest ? `rec. ${formatDuration(exercise.rest)}` : 'nessun recupero';
    if (!entry || entry.exerciseId !== exercise.exerciseId) return [sets, rest].join(' · ');
    return [entry.reps ? `${exercise.sets.length} × ${entry.reps}` : sets, formatWeightRange(entry.loadMin, entry.loadMax, store.archive.settings), rest]
      .filter(Boolean)
      .join(' · ');
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
    if (ok && undo) toast = { message: 'Allenamento annullato.', action: 'Annulla', onaction: () => edit((a) => restoreSession(a, undo)) };
  }

  function askDiscard() {
    if (session && sessionHasData(session)) confirmOpen = true;
    else discard();
  }

  function finish() {
    if (session && edit((a) => finishSession(a, session.id, Date.now()))) void navigate(appUrl('/'));
  }
</script>

{#if !session}
  <div class="flex flex-col items-start gap-3 py-8">
    <Dumbbell size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Nessun allenamento in corso</h2>
    <p class="m-0 max-w-[60ch] text-muted">Da Oggi scegli la scheda e tocca “Inizia allenamento”.</p>
    <a class="btn btn-primary" href={appUrl('/')}>Vai a Oggi</a>
  </div>
{:else}
  {@const summary = summarizeSession(session, now)}
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="title">{session.name}</h2>
      <p class="m-0 text-muted">Iniziato alle {formatClock(session.start)} · da {formatElapsed(summary.duration)}</p>
    </div>

    <p class="notice">
      La registrazione delle serie, con il valore della volta scorsa e il timer di recupero, arriva con il prossimo aggiornamento
      dell’app. Intanto qui trovi il programma della scheda.
    </p>

    {#if session.exercises.length}
      <ol class="exercises" aria-label="Esercizi">
        {#each session.exercises as exercise, i (exercise.id)}
          <li class="exercise">
            <span class="order" aria-hidden="true">{labels[i]}</span>
            <span class="flex min-w-0 flex-col">
              <span class="name">{exerciseName(store.archive, exercise.exerciseId)}</span>
              <span class="meta">{target(exercise, i)}</span>
            </span>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="m-0 text-muted">Allenamento libero: gli esercizi si aggiungeranno durante la sessione.</p>
    {/if}

    <div class="actions">
      {#if sessionHasData(session) && session.exercises.length}
        <button type="button" class="btn btn-primary btn-block" onclick={finish}>Concludi allenamento</button>
      {/if}
      <a class="btn btn-secondary btn-block" href={appUrl('/')}>Torna a Oggi</a>
      <button type="button" class="btn btn-danger btn-block" onclick={askDiscard}>Annulla allenamento</button>
    </div>
  </div>
{/if}

<ConfirmDialog
  bind:open={confirmOpen}
  title="Annullare l’allenamento?"
  text={session ? `Si perde quanto registrato in «${session.name}»: ${plural(summarizeSession(session, now).completedSets, 'serie fatta', 'serie fatte')}.` : ''}
  confirmLabel="Annulla allenamento"
  onconfirm={discard}
/>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .notice {
    margin: 0;
    max-width: 60ch;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-panel);
    background: var(--color-surface);
  }
  .exercises {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .exercise {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    padding: 0.5rem 0;
    border-top: 1px solid var(--color-line);
  }
  .exercise:last-child {
    border-bottom: 1px solid var(--color-line);
  }
  .order {
    flex-shrink: 0;
    width: 2rem;
    color: var(--color-accent-text);
    font-size: var(--text-lg);
    font-weight: 700;
  }
  .name {
    font-size: var(--text-lg);
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .meta {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
