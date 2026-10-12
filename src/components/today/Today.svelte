<script lang="ts">
  // Oggi (/, brief route): la schermata di apertura. Risponde a "cosa faccio oggi?" e avvia o riprende
  // l'allenamento con un tocco (US-11, US-17). Una sola azione primaria per stato:
  // - sessione in corso: "Riprendi allenamento", con durata ed esercizio corrente;
  // - altrimenti le ultime 4 schede fatte più la pianificata come righe a scelta singola, con la
  //   suggerita già selezionata (quickStart), e "Inizia allenamento" fisso nella zona del pollice;
  //   un tocco sulla riga seleziona e non avvia (decisione del 10 ottobre 2026).
  // Senza archivio porta al primo avvio (US-01); con l'archivio illeggibile solo un messaggio.
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CirclePlay from '@lucide/svelte/icons/circle-play';
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import WeekStrip from '../calendar/WeekStrip.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import Toast from '../ui/Toast.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    activeRoutines,
    currentExercise,
    exerciseName,
    lastFinishedSession,
    quickStart,
    reopenSession,
    routineLastDone,
    sessionInProgress,
    sessionsOn,
    startSession,
    summarizeSession,
    toDateKey,
    type Archive,
    type Routine,
  } from '../../lib/archive';
  import { formatElapsed, formatLongDay, formatOnDay, formatRelativeDay, plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  let ready = $state(false);
  let now = $state(Date.now());

  onMount(() => {
    if (store.isNew) {
      void navigate(appUrl('/welcome'), { history: 'replace' });
      return;
    }
    ready = true;
    // la durata della sessione in corso e il cambio di giorno a mezzanotte
    const timer = setInterval(() => (now = Date.now()), 30_000);
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
  const running = $derived(sessionInProgress(store.archive));
  const start = $derived(quickStart(store.archive, today));
  const active = $derived(activeRoutines(store.archive));
  const doneToday = $derived(sessionsOn(store.archive, today).filter((s) => s.end !== null));
  const last = $derived(lastFinishedSession(store.archive));

  // scelta dell'utente; null = la suggerita
  let chosen: string | null = $state(null);
  // scheda scelta da "Altra scheda" che non è tra le righe
  let extraId: string | null = $state(null);
  let sheetOpen = $state(false);

  const rows = $derived.by(() => {
    const extra = extraId && !start.rows.some((r) => r.routine.id === extraId) ? active.find((r) => r.id === extraId) : undefined;
    return extra ? [...start.rows, { routine: extra, lastDone: routineLastDone(store.archive, extra.id), planned: false }] : start.rows;
  });
  const selected = $derived(chosen && rows.some((r) => r.routine.id === chosen) ? chosen : start.suggested);
  const selectedRoutine = $derived(rows.find((r) => r.routine.id === selected)?.routine ?? null);

  let toast: { message: string } | null = $state(null);

  function edit(change: (archive: Archive) => Archive): boolean {
    try {
      const result = store.update(change);
      // spazio esaurito: la modifica resta in memoria e la barra di salvataggio lo dice
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

  function begin(routineId: string | null) {
    if (edit((a) => startSession(a, routineId, Date.now()).archive)) void navigate(appUrl('/workout'));
  }

  function reopen(id: string) {
    if (edit((a) => reopenSession(a, id))) void navigate(appUrl('/workout'));
  }

  function pickOther(routine: Routine) {
    chosen = routine.id;
    extraId = routine.id;
    sheetOpen = false;
  }

  function meta(routine: Routine, lastDone: string | null): string {
    return [plural(routine.exercises.length, 'esercizio', 'esercizi'), lastDone ? formatRelativeDay(lastDone, today) : 'mai fatta'].join(' · ');
  }

  const planLine = $derived.by(() => {
    const plan = start.plan;
    if (plan.kind === 'routine') return `In programma: ${plan.routine.name}${plan.override ? ', solo per oggi' : ''}`;
    if (plan.kind === 'rest') return plan.override ? 'Oggi riposo, solo per oggi' : 'Oggi riposo';
    return 'Niente in programma';
  });

  // durata, esercizio a cui si è arrivati e serie fatte
  const runningMeta = $derived.by(() => {
    if (!running) return '';
    const summary = summarizeSession(running, now);
    const current = currentExercise(running);
    return [
      // una sessione rimasta aperta da un altro giorno (es. importata) dice quando è cominciata
      running.date === today ? `da ${formatElapsed(summary.duration)}` : `iniziato ${formatOnDay(running.date, today)}`,
      current ? exerciseName(store.archive, current.exerciseId) : '',
      summary.completedSets ? plural(summary.completedSets, 'serie fatta', 'serie fatte') : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });

  const lastMeta = $derived.by(() => {
    if (!last) return '';
    const summary = summarizeSession(last, now);
    return [
      formatRelativeDay(last.date, today),
      // le sessioni importate dal PoC non hanno una durata vera
      summary.duration >= 60_000 ? formatElapsed(summary.duration) : '',
      plural(summary.exercises, 'esercizio', 'esercizi'),
      plural(summary.completedSets, 'serie', 'serie'),
    ]
      .filter(Boolean)
      .join(' · ');
  });

  const primaryLabel = $derived(doneToday.length ? 'Nuovo allenamento' : start.plan.kind === 'rest' ? 'Allenati comunque' : 'Inizia allenamento');
</script>

{#if ready && store.state === 'unreadable'}
  <!-- messaggio in linea, mai un'azione che sovrascrive (brief di Oggi) -->
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">
      Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.
    </p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if ready}
  <div class="today">
    <WeekStrip archive={store.archive} {today} />

    <section class="block" aria-labelledby="today-title">
      <div>
        <h2 id="today-title" class="title">{formatLongDay(today, today)}</h2>
        <p class="plan">
          {#if running}
            Allenamento in corso
          {:else}
            {planLine}
          {/if}
          {#if !running && start.plan.kind === 'none' && active.length}
            · <a href={appUrl('/calendar#week-plan')} class="py-3">Pianifica la settimana</a>
          {/if}
        </p>
      </div>

      {#if running}
        <div class="panel running">
          <CirclePlay size={22} class="shrink-0 text-accent-text" aria-hidden="true" />
          <div class="min-w-0">
            <p class="running-name">{running.name}</p>
            <p class="meta">{runningMeta}</p>
          </div>
        </div>
        <div class="thumb">
          <a class="btn btn-primary btn-block start" href={appUrl('/workout')}>Riprendi allenamento</a>
        </div>
      {:else}
        {#if doneToday.length}
          {@const done = doneToday.at(-1)!}
          <div class="done-today">
            <p class="m-0">
              Fatto oggi: <strong>{done.name}</strong>
              <span class="text-muted">· {formatElapsed(summarizeSession(done, now).duration)}</span>
            </p>
            <button type="button" class="btn btn-text" onclick={() => reopen(done.id)}>Riapri</button>
          </div>
        {/if}

        {#if rows.length}
          <fieldset class="routines">
            <legend class="sr-only">Scheda da fare</legend>
            {#each rows as row (row.routine.id)}
              <label class="choice row">
                <input
                  class="radio"
                  type="radio"
                  name="routine"
                  value={row.routine.id}
                  checked={row.routine.id === selected}
                  onchange={() => (chosen = row.routine.id)}
                />
                <span class="row-text">
                  <span class="row-name">{row.routine.name}</span>
                  <span class="meta">{meta(row.routine, row.lastDone)}</span>
                </span>
                {#if row.planned}
                  <span class="tag"><CalendarDays size={16} aria-hidden="true" />Oggi</span>
                {/if}
              </label>
            {/each}
          </fieldset>

          <div class="alternatives">
            {#if active.length > rows.length}
              <button type="button" class="btn btn-text" aria-haspopup="dialog" onclick={() => (sheetOpen = true)}>Altra scheda</button>
            {/if}
            <button type="button" class="btn btn-text" onclick={() => begin(null)}>Allenamento libero</button>
          </div>

          <div class="thumb">
            <button type="button" class="btn btn-primary btn-block start" disabled={!selectedRoutine} onclick={() => begin(selected)}>
              {primaryLabel}
            </button>
          </div>
        {:else}
          <div class="flex flex-col items-start gap-3">
            <ClipboardList size={28} class="text-muted" aria-hidden="true" />
            <p class="m-0 max-w-[60ch] text-muted">
              Non hai schede attive. Crea una scheda per avere il programma sempre pronto, oppure allenati senza scheda e aggiungi gli
              esercizi man mano.
            </p>
            <a class="btn btn-secondary" href={appUrl('/routines')}>Vai alle schede</a>
          </div>
          <div class="thumb">
            <button type="button" class="btn btn-primary btn-block start" onclick={() => begin(null)}>Allenamento libero</button>
          </div>
        {/if}
      {/if}
    </section>

    {#if last}
      <section aria-labelledby="last-title" class="last">
        <h2 id="last-title" class="subtitle">Ultimo allenamento</h2>
        <a class="last-row" href={appUrl(`/calendar?date=${last.date}`)}>
          <span class="row-name">{last.name}</span>
          <span class="meta">{lastMeta}</span>
        </a>
      </section>
    {/if}
  </div>

  <BottomSheet bind:open={sheetOpen} title="Altra scheda">
    <ul class="sheet-list">
      {#each active as routine (routine.id)}
        <li>
          <button type="button" class="sheet-row" aria-pressed={routine.id === selected} onclick={() => pickOther(routine)}>
            <span class="row-name">{routine.name}</span>
            <span class="meta">{meta(routine, routineLastDone(store.archive, routine.id))}</span>
          </button>
        </li>
      {/each}
    </ul>
  </BottomSheet>
{/if}

<Toast message={toast?.message ?? null} onclose={() => (toast = null)} />

<style>
  .today {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
    text-wrap: balance;
  }
  .title::first-letter {
    text-transform: uppercase;
  }
  .plan {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
  }
  .routines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .row {
    min-height: 64px;
  }
  .row-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .row-name {
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .meta {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .tag {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
    color: var(--color-accent-text);
    font-size: var(--text-sm);
    font-weight: 650;
  }
  .alternatives {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 1rem;
  }
  /* "Inizia" resta nella zona del pollice: sopra la tab bar anche quando la pagina scorre (320×568) */
  .thumb {
    position: sticky;
    bottom: calc(var(--bottom-bars-height) + env(safe-area-inset-bottom));
    z-index: 1;
    margin: 0 -1rem;
    padding: 0.75rem 1rem;
    background: var(--color-background);
  }
  /* quando la pagina scorre sotto, il contenuto sfuma invece di sembrare tagliato a metà (320×568) */
  .thumb::before {
    content: '';
    position: absolute;
    inset: -1.5rem 0 100%;
    background: linear-gradient(to bottom, transparent, var(--color-background));
    pointer-events: none;
  }
  .start {
    min-height: 56px;
    font-size: var(--text-lg);
  }
  .running {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .running-name {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .running .meta {
    margin: 0;
  }
  .done-today {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 1rem;
  }
  .subtitle {
    margin: 0 0 0.25rem;
    font-size: var(--text-xl);
    font-weight: 700;
  }
  .last-row {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 64px;
    padding: 0.5rem 0;
    border-top: 1px solid var(--color-line);
    border-bottom: 1px solid var(--color-line);
    color: inherit;
    text-decoration: none;
  }
  .last-row:hover .row-name {
    text-decoration: underline;
  }
  .sheet-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sheet-list li + li {
    border-top: 1px solid var(--color-line);
  }
  .sheet-row {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    min-height: 56px;
    padding: 0.5rem 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sheet-row:hover .row-name {
    text-decoration: underline;
  }
</style>
