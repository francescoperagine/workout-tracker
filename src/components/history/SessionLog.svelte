<script lang="ts">
  // Dettaglio di un allenamento concluso (/session?id=…, US-27): un registro di sola lettura. Solo gli
  // esercizi con almeno una serie fatta, nell'ordine in cui sono stati fatti, con le serie fatte in una
  // riga; ⓘ apre l'approfondimento, l'icona dei progressi porta alla pagina dell'esercizio. Per correggere
  // si riapre l'allenamento; in fondo anche l'eliminazione (con conferma e "Annulla").
  import { navigate } from 'astro:transitions/client';
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import Info from '@lucide/svelte/icons/info';
  import Link from '@lucide/svelte/icons/link';
  import Trash from '@lucide/svelte/icons/trash';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import Toast from '../ui/Toast.svelte';
  import ExerciseDetailsSheet from '../workout/ExerciseDetailsSheet.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    blocksOf,
    exerciseName,
    previousExercise,
    removeSession,
    reopenSession,
    restoreSession,
    summarizeSession,
    toDateKey,
    workoutSummary,
    type Archive,
    type RemovedSession,
    type SessionExercise,
  } from '../../lib/archive';
  import { formatClock, formatLongDay, formatOnDay, plural } from '../../lib/format';
  import { formatWeight } from '../../lib/units';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  const params = new URL(location.href).searchParams;
  const sessionId = params.get('id');
  /** si arriva dal calendario: si torna al giorno */
  const fromDate = params.get('date');
  const now = Date.now();
  const today = toDateKey(new Date(now));

  const session = $derived(store.state === 'unreadable' ? null : (store.archive.sessions.find((s) => s.id === sessionId && s.end !== null) ?? null));
  // il dettaglio di una sessione in corso è l'allenamento stesso
  $effect(() => {
    if (store.archive.sessions.some((s) => s.id === sessionId && s.end === null)) void navigate(appUrl('/workout'), { history: 'replace' });
  });

  const doneSets = (e: SessionExercise) => e.sets.filter((s) => s.completedAt !== null);
  // un registro: gli esercizi senza serie fatte non compaiono
  const blocks = $derived(blocksOf((session?.exercises ?? []).filter((e) => doneSets(e).length > 0)));

  const meta = $derived.by(() => {
    if (!session) return '';
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
  });

  /** "3 serie · 8 × 12 · 10 × 12 · R 20 × 10": le serie fatte, il riscaldamento con la sigla */
  function setsLine(e: SessionExercise): string {
    const sets = doneSets(e);
    const values = sets.map((s) => {
      const value = [s.kg === null ? '' : formatWeight(s.kg, store.archive.settings, false), s.reps === null ? '' : String(s.reps)].filter(Boolean).join(' × ');
      return (s.type === 'warmup' ? `R ${value}` : value).replace(/ /g, ' ');
    });
    return [plural(sets.length, 'serie', 'serie'), ...values].join(' · ');
  }

  let detailsFor: string | null = $state(null);
  let detailsOpen = $state(false);
  let discardOpen = $state(false);
  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);

  function notify(message: string, action?: string, onaction?: () => void) {
    toast = { message, action, onaction };
  }

  function edit(change: (archive: Archive) => Archive): boolean {
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

  function reopen() {
    if (!session) return;
    const id = session.id;
    if (edit((a) => reopenSession(a, id))) void navigate(appUrl('/workout'), { history: 'replace' });
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
    if (ok && undo) notify('Allenamento eliminato.', 'Annulla', () => edit((a) => restoreSession(a, undo)));
  }
</script>

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if session}
  <div class="log">
    <a href={fromDate ? appUrl(`/calendar?date=${fromDate}`) : appUrl('/history')} class="btn btn-text back">
      <ChevronLeft aria-hidden="true" />{fromDate ? 'Torna al calendario' : 'Storico'}
    </a>
    <div>
      <h2 class="title">{session.name}</h2>
      <p class="meta">{meta}</p>
    </div>

    <ol class="blocks" aria-label="Esercizi">
      {#each blocks as block (block.entries[0].id)}
        <li class="panel">
          {#if block.entries.length > 1}
            <p class="superset"><Link size={16} aria-hidden="true" />Superserie · {plural(block.entries.length, 'esercizio', 'esercizi')}</p>
          {/if}
          {#each block.entries as exercise (exercise.id)}
            {@const name = exerciseName(store.archive, exercise.exerciseId)}
            <section class="entry" aria-label={name}>
              <div class="head">
                <h3>
                  <span class="name">{name}</span><button
                    type="button"
                    class="info"
                    aria-haspopup="dialog"
                    aria-label={`${name}: come si esegue`}
                    onclick={() => {
                      detailsFor = exercise.exerciseId;
                      detailsOpen = true;
                    }}><Info size={18} aria-hidden="true" /></button
                  >
                </h3>
                <a class="btn btn-icon progress" href={`${appUrl('/exercise')}?id=${encodeURIComponent(exercise.exerciseId)}`} aria-label={`Progressi: ${name}`}>
                  <ChartLine size={22} aria-hidden="true" />
                </a>
              </div>
              <p class="sets">{setsLine(exercise)}</p>
              {#if exercise.notes.trim()}
                <p class="sets">Nota: «{exercise.notes.trim()}»</p>
              {/if}
            </section>
          {/each}
        </li>
      {/each}
    </ol>

    <div class="actions">
      <button type="button" class="btn btn-secondary btn-block" onclick={reopen}>Riapri allenamento</button>
      <button type="button" class="btn btn-danger btn-block" onclick={() => (discardOpen = true)}><Trash aria-hidden="true" />Elimina allenamento</button>
    </div>
  </div>
{:else}
  <div class="flex flex-col items-start gap-3 py-8">
    <Dumbbell size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Allenamento non trovato</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Forse è stato eliminato, anche da un’altra scheda del browser.</p>
    <a class="btn btn-primary" href={appUrl('/history')}>Vai allo Storico</a>
  </div>
{/if}

<ExerciseDetailsSheet
  bind:open={detailsOpen}
  archive={store.archive}
  exerciseId={detailsFor}
  previous={session && detailsFor ? previousExercise(store.archive, session, detailsFor) : null}
  {today}
/>

<ConfirmDialog
  bind:open={discardOpen}
  title="Eliminare l’allenamento?"
  text={session
    ? `Si perde quanto registrato in «${session.name}» ${formatOnDay(session.date, today)}: ${plural(summarizeSession(session, now).completedSets, 'serie fatta', 'serie fatte')}.`
    : ''}
  confirmLabel="Elimina allenamento"
  onconfirm={discard}
/>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  .log {
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
    color: var(--color-text-muted);
  }
  .blocks {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .superset {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin: 0 0 0.25rem;
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .entry + .entry {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border);
  }
  /* nome (con ⓘ) e progressi su una riga; sotto, allineate al nome, le serie fatte */
  .head {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: -0.375rem;
  }
  h3 {
    flex: 1;
    min-width: 0;
    display: flex;
    margin: 0;
  }
  .name {
    min-width: 0;
    padding: 0.5rem 0;
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  /* ⓘ subito dopo il nome, all'altezza dell'ultima riga: piccolo a vista, bersaglio allargato */
  .info {
    position: relative;
    flex-shrink: 0;
    display: inline-grid;
    place-items: center;
    align-self: flex-end;
    width: 1.25rem;
    height: 1.5rem;
    margin: 0 0 0.5rem 0.25rem;
    padding: 0;
    border: 0;
    border-radius: var(--radius-field);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .info::before {
    content: '';
    position: absolute;
    inset: -0.75rem;
  }
  .info:hover {
    color: var(--color-text);
  }
  /* il bersaglio da 48px sporge sotto: con il nome su una riga la riga delle serie resta attaccata */
  .progress {
    flex-shrink: 0;
    margin: 0 -0.5rem -0.5rem 0;
  }
  .sets {
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
</style>
