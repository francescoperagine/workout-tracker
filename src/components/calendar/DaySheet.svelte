<script lang="ts" module>
  const RULE = '__weekly';
  const REST = '__rest';
</script>

<script lang="ts">
  // Foglio di un giorno del calendario: gli allenamenti di quella data (US-05) e cosa prevede, con
  // l'eccezione per quella sola data (US-06): come la settimana tipo, riposo o un'altra scheda.
  // Oggi si avvia l'allenamento, in un giorno passato se ne registra uno fatto, da oggi in poi si crea una
  // scheda nuova e la si assegna alla data. Ogni scelta si salva subito. Da oggi in poi viene prima la
  // settimana tipo di quel giorno ("Ogni giovedì", US-04), poi l'eccezione per la sola data (US-06).
  import { navigate } from 'astro:transitions/client';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import {
    activeRoutines,
    createRoutine,
    dayInfo,
    overrideValue,
    sessionInProgress,
    setDateOverride,
    setSessionDate,
    setWeeklyDay,
    startSession,
    summarizeSession,
    weeklyValue,
    type Archive,
  } from '../../lib/archive';
  import { WEEKDAY_LONG, formatClock, formatElapsed, formatLongDay, formatOnDay, plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';
  import { STATUS_LOOK } from './day-status';

  interface Props {
    open: boolean;
    date: string | null;
    archive: Archive;
    today: string;
    now: number;
    /** applica una modifica all'archivio; false se non è andata */
    edit: (change: (archive: Archive) => Archive) => boolean;
    /** porta alla settimana tipo, sul giorno indicato */
    oneditweek: (weekday: string) => void;
  }

  let { open = $bindable(false), date, archive, today, now, edit, oneditweek }: Props = $props();

  const day = $derived(date ? dayInfo(archive, date, today) : null);
  const weekly = $derived(day ? weeklyValue(archive, day.weekday) : undefined);
  const active = $derived(activeRoutines(archive));
  // la scelta uguale alla settimana tipo è già "Come ogni …"
  const routines = $derived(active.filter((r) => r.id !== weekly));
  const NOTHING = '__nothing';
  const weeklySelect = $derived(weekly === undefined ? NOTHING : weekly === null ? REST : weekly);
  // settimana tipo verso una scheda archiviata o sparita: resta visibile come scelta attuale
  const staleWeekly = $derived(
    typeof weekly === 'string' && !active.some((r) => r.id === weekly)
      ? (archive.routines.find((r) => r.id === weekly)?.name ?? 'Scheda eliminata')
      : null,
  );

  function chooseWeekly(value: string) {
    if (!day) return;
    const weekday = day.weekday;
    edit((a) => setWeeklyDay(a, weekday, value === NOTHING ? undefined : value === REST ? null : value));
  }

  const current = $derived.by(() => {
    if (!date) return RULE;
    const value = overrideValue(archive, date);
    return value === undefined ? RULE : value === null ? REST : value;
  });

  // eccezione verso una scheda archiviata (o sparita): resta visibile come scelta attuale
  const staleOverride = $derived.by(() => {
    if (!date) return null;
    const value = overrideValue(archive, date);
    if (typeof value !== 'string' || archive.routines.some((r) => r.id === value && !r.archived)) return null;
    const routine = archive.routines.find((r) => r.id === value);
    return { id: value, label: routine ? `${routine.name} (archiviata)` : 'Scheda eliminata' };
  });

  const weeklyLabel = $derived.by(() => {
    const value = weekly;
    if (value === undefined) return 'niente in programma';
    if (value === null) return 'riposo';
    const routine = archive.routines.find((r) => r.id === value);
    return !routine ? 'niente in programma' : routine.archived ? `${routine.name}, archiviata: niente in programma` : routine.name;
  });

  function choose(value: string) {
    if (!date) return;
    const d = date;
    edit((a) => setDateOverride(a, d, value === RULE ? undefined : value === REST ? null : value));
  }

  const running = $derived(sessionInProgress(archive));
  const plannedRoutine = $derived(day?.plan.kind === 'routine' ? day.plan.routine : null);

  function go(change: (archive: Archive) => Archive, path: string) {
    if (edit(change)) {
      open = false;
      void navigate(appUrl(path));
    }
  }

  function begin() {
    const routineId = plannedRoutine?.id ?? null;
    go((a) => startSession(a, routineId, Date.now()).archive, '/workout');
  }

  function record() {
    if (!date) return;
    const d = date;
    const routineId = plannedRoutine?.id ?? null;
    go((a) => {
      const result = startSession(a, routineId, Date.now());
      return setSessionDate(result.archive, result.session.id, d);
    }, '/workout');
  }

  function createForDate() {
    if (!date) return;
    const d = date;
    let id = '';
    const ok = edit((a) => {
      const result = createRoutine(a);
      id = result.routine.id;
      return setDateOverride(result.archive, d, id);
    });
    if (ok) {
      open = false;
      void navigate(appUrl(`/routine?id=${encodeURIComponent(id)}&date=${d}`));
    }
  }

  const title = $derived.by(() => {
    if (!day) return '';
    const text = `${formatLongDay(day.date, today)}${day.isToday ? ', oggi' : ''}`;
    return text.charAt(0).toUpperCase() + text.slice(1);
  });
</script>

<BottomSheet bind:open {title}>
  {#if day}
    {@const look = STATUS_LOOK[day.status]}
    <div class="content">
      {#if running}
        <a class="btn btn-primary" href={appUrl('/workout')}>Riprendi l’allenamento in corso</a>
      {:else if day.isToday}
        <button type="button" class="btn btn-primary btn-wrap" onclick={begin}>
          {plannedRoutine ? `Inizia «${plannedRoutine.name}»` : 'Inizia allenamento libero'}
        </button>
      {:else if day.isPast}
        <button type="button" class="btn btn-secondary btn-wrap" onclick={record}>Registra un allenamento fatto</button>
      {/if}

      {#if day.sessions.length}
        <section aria-label="Allenamenti">
          <ul class="sessions">
            {#each day.sessions as session (session.id)}
              {@const summary = summarizeSession(session, now)}
              <li class="session">
                {#if session.end === null}
                  <span class="name">{session.name}</span>
                {:else}
                  <!-- il dettaglio modificabile (US-27); il ritorno porta di nuovo a questo giorno -->
                  <a class="name link" href={`${appUrl('/session')}?id=${encodeURIComponent(session.id)}&date=${day.date}`}>{session.name}<ChevronRight size={20} aria-hidden="true" /></a>
                {/if}
                <span class="meta">
                  {[formatClock(session.start), summary.duration >= 60_000 ? formatElapsed(summary.duration) : '', plural(summary.completedSets, 'serie', 'serie'), session.end === null ? 'in corso' : '']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {#if session.end === null}
                  <a class="btn btn-secondary resume" href={appUrl('/workout')}>Riprendi</a>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {:else if day.status === 'skipped'}
        <p class="status warning">
          {#if look.icon}<look.icon size={20} aria-hidden="true" />{/if}
          Saltato: nessun allenamento registrato.
        </p>
      {:else if day.isPast}
        <p class="status muted">Nessun allenamento registrato.</p>
      {/if}

      {#if !day.isPast}
        <div class="weekly">
          <label for="day-weekly" class="label">Ogni {WEEKDAY_LONG[day.weekday]}</label>
          <select id="day-weekly" class="field" value={weeklySelect} onchange={(event) => chooseWeekly(event.currentTarget.value)}>
            <option value={NOTHING}>Niente</option>
            <option value={REST}>Riposo</option>
            {#each active as routine (routine.id)}
              <option value={routine.id}>{routine.name}</option>
            {/each}
            {#if staleWeekly}
              <option value={weeklySelect} disabled>{staleWeekly}</option>
            {/if}
          </select>
        </div>
      {/if}

      <fieldset class="choices">
        <legend class="legend">{day.isPast ? 'Era in programma' : `Solo ${formatOnDay(day.date, today)}`}</legend>
        <label class="choice">
          <input class="radio" type="radio" name="day-plan" value={RULE} checked={current === RULE} onchange={() => choose(RULE)} />
          <span class="choice-text">
            <span>{day.isPast ? 'Come la settimana tipo' : `Come ogni ${WEEKDAY_LONG[day.weekday]}`}</span>
            <span class="meta">{weeklyLabel}</span>
          </span>
        </label>
        {#if weekly !== null}
          <label class="choice">
            <input class="radio" type="radio" name="day-plan" value={REST} checked={current === REST} onchange={() => choose(REST)} />
            <span>Riposo</span>
          </label>
        {/if}
        {#each routines as routine (routine.id)}
          <label class="choice">
            <input class="radio" type="radio" name="day-plan" value={routine.id} checked={current === routine.id} onchange={() => choose(routine.id)} />
            <span>{routine.name}</span>
          </label>
        {/each}
        {#if staleOverride}
          <label class="choice">
            <input class="radio" type="radio" name="day-plan" value={staleOverride.id} checked disabled />
            <span>{staleOverride.label}</span>
          </label>
        {/if}
        {#if !day.isPast}
          <button type="button" class="btn btn-text self-start" onclick={createForDate}>+ Nuova scheda</button>
        {/if}
      </fieldset>

      <button type="button" class="btn btn-text self-start" onclick={() => oneditweek(day.weekday)}>Cambia la settimana tipo</button>
    </div>
  {/if}
</BottomSheet>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .sessions {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .session {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 0.75rem;
    min-height: 56px;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  .session:first-child {
    border-top: 1px solid var(--color-line);
  }
  .name {
    flex: 1 1 100%;
    font-size: var(--text-lg);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 48px;
    color: var(--color-foreground);
    text-decoration: none;
  }
  .link :global(svg) {
    flex-shrink: 0;
    color: var(--color-muted);
  }
  .meta {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .session .meta {
    flex: 1;
  }
  .btn-wrap {
    padding-block: 0.5rem;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .resume {
    min-width: 8rem;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
  .warning {
    color: var(--color-warning);
  }
  .muted {
    color: var(--color-muted);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .legend {
    margin-bottom: 0.5rem;
    font-weight: 700;
  }
  .weekly {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .choice-text {
    display: flex;
    flex-direction: column;
  }
</style>
