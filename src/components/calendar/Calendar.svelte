<script lang="ts">
  // Calendario (/calendar, brief route-calendar): settimana scorrevole come vista principale, una riga
  // per giorno con scheda e stato (US-05); mese compatto con i segni dei giorni; settimana tipo in
  // linea (US-04); un tocco su un giorno apre il suo foglio, con gli allenamenti e l'eccezione per
  // quella sola data (US-06). La settimana è la finestra di 7 giorni che parte da oggi. `?date=YYYY-MM-DD`
  // apre il foglio di quel giorno (striscia di Oggi), spostando la finestra solo se cade fuori; `#week-plan`
  // porta alla settimana tipo.
  import { onMount, tick } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import DaySheet from './DaySheet.svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import Toast from '../ui/Toast.svelte';
  import { STATUS_LOOK, dayLabel, planLabel, statusLabel } from './day-status';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import {
    ArchiveError,
    WEEKDAYS,
    activeRoutines,
    addDays,
    addMonths,
    createRoutine,
    dayInfo,
    firstSessionDate,
    hasWeeklyPlan,
    isValidDateKey,
    monthStart,
    monthWeeks,
    setWeeklyDay,
    staleWeeklyDays,
    toDateKey,
    weeklyValue,
    windowDates,
    windowStartFor,
    type Archive,
    type DayInfo,
    type Weekday,
  } from '../../lib/archive';
  import { WEEKDAY_LONG, WEEKDAY_SHORT, formatMonth, formatWeekRange } from '../../lib/format';
  import { appUrl } from '../../lib/paths';

  /** Quante settimane nel futuro si possono scorrere */
  const FUTURE_WEEKS = 26;
  const NOTHING = '';
  const REST = '__rest';

  const store = archiveStore();
  const now = Date.now();
  const today = toDateKey(new Date(now));

  const params = new URLSearchParams(location.search);
  const requested = params.get('date');
  const initial = requested && isValidDateKey(requested) ? requested : today;
  const HINT_KEY = 'workout-tracker.calendarHint';
  const FIRST_HINT = (() => {
    try {
      return localStorage.getItem(HINT_KEY) !== 'seen';
    } catch {
      return true;
    }
  })();

  let view: 'week' | 'month' = $state(params.get('view') === 'month' ? 'month' : 'week');
  let anchor = $state(initial);
  // inizio della finestra di 7 giorni della vista settimana
  let windowStart = $state(windowStartFor(requested, today));
  let showHint = $state(FIRST_HINT);

  // limiti: dall'inizio dello storico a qualche settimana nel futuro
  const earliest = $derived([firstSessionDate(store.archive) ?? today, today, initial].sort()[0]);
  const latest = $derived(addDays(today, FUTURE_WEEKS * 7));

  const week = $derived(windowDates(windowStart).map((date) => dayInfo(store.archive, date, today)));
  const month = $derived(monthWeeks(anchor).map((dates) => dates.map((date) => dayInfo(store.archive, date, today))));
  const routines = $derived(activeRoutines(store.archive));
  const stale = $derived(staleWeeklyDays(store.archive));
  const planned = $derived(hasWeeklyPlan(store.archive));
  const noRoutines = $derived(routines.length === 0);

  let sheetOpen = $state(false);
  let sheetDate: string | null = $state(null);
  let toast: { message: string } | null = $state(null);

  onMount(() => {
    if (requested && isValidDateKey(requested)) openDay(requested);
  });

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

  function openDay(date: string) {
    if (showHint) {
      showHint = false;
      try {
        localStorage.setItem(HINT_KEY, 'seen');
      } catch {
        // storage non disponibile: il suggerimento tornerà
      }
    }
    sheetDate = date;
    sheetOpen = true;
  }

  function moveWeek(direction: -1 | 1) {
    windowStart = addDays(windowStart, direction * 7);
  }

  function createFirst() {
    let id = '';
    const ok = edit((a) => {
      const result = createRoutine(a);
      id = result.routine.id;
      return result.archive;
    });
    if (ok) void navigate(appUrl(`/routine?id=${encodeURIComponent(id)}`));
  }

  function moveMonth(direction: -1 | 1) {
    anchor = addMonths(anchor, direction);
  }

  async function editWeek(weekday: string) {
    sheetOpen = false;
    await tick();
    const select = document.getElementById(`plan-${weekday}`) as HTMLSelectElement | null;
    select?.scrollIntoView({ block: 'center' });
    select?.focus({ preventScroll: true });
  }

  function weeklySelectValue(weekday: Weekday): string {
    const value = weeklyValue(store.archive, weekday);
    return value === undefined ? NOTHING : value === null ? REST : value;
  }

  function setWeekly(weekday: Weekday, value: string) {
    edit((a) => setWeeklyDay(a, weekday, value === NOTHING ? undefined : value === REST ? null : value));
  }

  /** Titolo della riga: cosa si è fatto, se c'è, altrimenti cosa era previsto */
  function rowTitle(day: DayInfo): string {
    return day.sessions.length ? day.sessions.map((s) => s.name).join(' + ') : planLabel(day);
  }

  function rowNote(day: DayInfo): string {
    const notes = [];
    const plan = day.plan;
    if (plan.kind !== 'none' && plan.override) notes.push('solo per questa data');
    if (day.sessions.length && plan.kind === 'routine' && !day.sessions.some((s) => s.routineId === plan.routine.id)) notes.push(`in programma: ${plan.routine.name}`);
    if (day.sessions.length && plan.kind === 'rest') notes.push('era riposo');
    return notes.join(' · ');
  }

  const weekTitle = $derived(formatWeekRange(week[0].date, week[6].date, today));
  const isCurrentWeek = $derived(windowStart === today);
  const isCurrentMonth = $derived(monthStart(anchor) === monthStart(today));
</script>

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else}
  <div class="calendar">
    <SegmentedControl
      name="calendar-view"
      label="Vista"
      options={[
        { value: 'week', label: 'Settimana' },
        { value: 'month', label: 'Mese' },
      ]}
      bind:value={view}
    />

    {#if noRoutines}
      <div class="panel flex flex-col items-start gap-3">
        <p class="m-0 font-bold">Per pianificare serve una scheda.</p>
        <button type="button" class="btn btn-primary" onclick={createFirst}>Crea scheda</button>
      </div>
    {:else if !planned}
      <p class="notice">
        Nessun giorno ha ancora una scheda. <a href="#week-plan">Assegna le schede ai giorni</a> nella settimana tipo, qui sotto.
      </p>
    {/if}

    {#if view === 'week'}
      <section aria-labelledby="week-title" class="period">
        <div class="period-nav">
          <button type="button" class="btn btn-icon" aria-label="Settimana precedente" disabled={addDays(windowStart, -1) < earliest} onclick={() => moveWeek(-1)}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div class="period-title">
            <h2 id="week-title" aria-live="polite">{weekTitle}</h2>
            {#if isCurrentWeek}<p class="period-when">Prossimi 7 giorni</p>{/if}
          </div>
          <button type="button" class="btn btn-icon" aria-label="Settimana successiva" disabled={addDays(windowStart, 7) > latest} onclick={() => moveWeek(1)}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
        {#if !isCurrentWeek}
          <button type="button" class="btn btn-text self-center" onclick={() => (windowStart = today)}>Torna a oggi</button>
        {/if}
        {#if showHint}
          <p class="hint m-0">Tocca un giorno per pianificarlo, iniziare l’allenamento o registrarne uno fatto.</p>
        {/if}

        <ul class="days">
          {#each week as day (day.date)}
            {@const look = STATUS_LOOK[day.status]}
            {@const note = rowNote(day)}
            <li>
              <button type="button" class="day" class:today={day.isToday} aria-haspopup="dialog" aria-label={dayLabel(day, today)} onclick={() => openDay(day.date)}>
                <span class="date" aria-hidden="true">
                  <span class="weekday">{day.isToday ? 'oggi' : WEEKDAY_SHORT[day.weekday]}</span>
                  <span class="number">{Number(day.date.slice(8))}</span>
                </span>
                <span class="what" aria-hidden="true">
                  <span class={['what-title', { quiet: !day.sessions.length && day.plan.kind !== 'routine' }]}>{rowTitle(day)}</span>
                  {#if note}<span class="what-note">{note}</span>{/if}
                </span>
                <span class={['state', look.tone]} aria-hidden="true">
                  {#if look.icon && day.status !== 'rest'}<look.icon size={20} aria-hidden="true" />{/if}
                  {#if day.status !== 'rest'}{statusLabel(day)}{/if}
                </span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <section aria-labelledby="month-title" class="period">
        <div class="period-nav">
          <button type="button" class="btn btn-icon" aria-label="Mese precedente" disabled={monthStart(anchor) <= monthStart(earliest)} onclick={() => moveMonth(-1)}>
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div class="period-title">
            <h2 id="month-title" aria-live="polite" class="first-upper">{formatMonth(anchor)}</h2>
          </div>
          <button type="button" class="btn btn-icon" aria-label="Mese successivo" disabled={monthStart(anchor) >= monthStart(latest)} onclick={() => moveMonth(1)}>
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
        {#if !isCurrentMonth}
          <button type="button" class="btn btn-text self-center" onclick={() => (anchor = today)}>Torna a questo mese</button>
        {/if}

        <table class="month">
          <thead>
            <tr>
              {#each WEEKDAYS as weekday (weekday)}
                <th scope="col"><abbr title={WEEKDAY_LONG[weekday]}>{WEEKDAY_SHORT[weekday]}</abbr></th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each month as days, i (i)}
              <tr>
                {#each days as day (day.date)}
                  {@const look = STATUS_LOOK[day.status]}
                  <td>
                    {#if day.date.slice(0, 7) === anchor.slice(0, 7)}
                      <button type="button" class="cell" class:today={day.isToday} aria-haspopup="dialog" aria-label={dayLabel(day, today)} onclick={() => openDay(day.date)}>
                        <span class="cell-number" aria-hidden="true">{Number(day.date.slice(8))}</span>
                        <span class={['cell-mark', look.tone]} aria-hidden="true">
                          {#if look.icon && day.status !== 'rest'}<look.icon size={16} aria-hidden="true" />{/if}
                        </span>
                      </button>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>

        <ul class="legend" aria-label="Legenda">
          {#each ['done', 'skipped', 'planned'] as const as status (status)}
            {@const look = STATUS_LOOK[status]}
            <li class={look.tone}>
              {#if look.icon}<look.icon size={16} aria-hidden="true" />{/if}
              <span class="legend-text">{look.label}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section id="week-plan" aria-labelledby="week-plan-title" class="week-plan">
      <h2 id="week-plan-title" class="section-title">Settimana tipo</h2>
      <p class="hint m-0">Vale per tutte le settimane. Per cambiare un solo giorno, toccalo nel calendario.</p>
      {#if !routines.length}
        <p class="m-0">
          Non hai schede attive da assegnare: <a href={appUrl('/routines')}>crea una scheda</a>. Intanto puoi segnare i giorni di riposo.
        </p>
      {/if}
      <ul class="plan-rows">
        {#each WEEKDAYS as weekday (weekday)}
          {@const value = weeklySelectValue(weekday)}
          {@const staleDay = stale.find((s) => s.weekday === weekday)}
          <li class="plan-row">
            <label for={`plan-${weekday}`} class="plan-day first-upper">{WEEKDAY_LONG[weekday]}</label>
            <select
              id={`plan-${weekday}`}
              class="field"
              {value}
              aria-describedby={staleDay ? `plan-${weekday}-stale` : undefined}
              onchange={(event) => setWeekly(weekday, event.currentTarget.value)}
            >
              <option value={NOTHING}>Niente</option>
              <option value={REST}>Riposo</option>
              {#each routines as routine (routine.id)}
                <option value={routine.id}>{routine.name}</option>
              {/each}
              {#if staleDay}
                <option value={value} disabled>{staleDay.routine ? `${staleDay.routine.name} (archiviata)` : 'Scheda eliminata'}</option>
              {/if}
            </select>
            {#if staleDay}
              <p class="stale" id={`plan-${weekday}-stale`}>
                {staleDay.routine ? `«${staleDay.routine.name}» è archiviata` : 'La scheda non esiste più'}: questo giorno non propone niente.
                Scegli un’altra scheda{staleDay.routine ? ' o ripristinala in Schede' : ''}.
              </p>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  </div>

  <DaySheet bind:open={sheetOpen} date={sheetDate} archive={store.archive} {today} {now} {edit} oneditweek={editWeek} />
{/if}

<Toast message={toast?.message ?? null} onclose={() => (toast = null)} />

<style>
  .calendar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .notice {
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-panel);
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }
  .notice a {
    color: inherit;
  }
  .period {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .period-nav {
    display: grid;
    grid-template-columns: 48px 1fr 48px;
    align-items: center;
    gap: 0.5rem;
  }
  .period-title {
    text-align: center;
    min-width: 0;
  }
  .period-title h2 {
    margin: 0;
    font-size: var(--text-xl);
    line-height: 1.3;
    font-weight: 700;
  }
  .period-when {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .first-upper::first-letter {
    text-transform: uppercase;
  }
  .days {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .days li + li {
    border-top: 1px solid var(--color-line);
  }
  .day {
    display: grid;
    grid-template-columns: 2.75rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 64px;
    padding: 0.5rem;
    border: 1px solid transparent;
    border-radius: var(--radius-field);
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .day:hover {
    background: color-mix(in oklab, var(--color-surface) 70%, transparent);
  }
  .day.today {
    border-color: var(--color-accent-text);
    background: var(--color-surface);
  }
  .date {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.15;
  }
  .weekday {
    color: var(--color-muted);
    font-size: var(--text-sm);
    font-weight: 600;
  }
  .today .weekday {
    color: var(--color-accent-text);
  }
  .number {
    font-size: var(--text-xl);
    font-weight: 700;
  }
  .what {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .what-title {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .what-title.quiet {
    color: var(--color-muted);
    font-weight: 400;
  }
  .what-note {
    color: var(--color-muted);
    font-size: var(--text-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .state {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--text-sm);
    font-weight: 650;
  }
  .accent {
    color: var(--color-accent-text);
  }
  .warning {
    color: var(--color-warning);
  }
  .muted {
    color: var(--color-muted);
  }
  .month {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .month th {
    padding-bottom: 0.25rem;
    color: var(--color-muted);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .month abbr {
    text-decoration: none;
  }
  .month td {
    padding: 1px;
    height: 56px;
  }
  .cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 100%;
    height: 100%;
    border: 1px solid transparent;
    border-radius: var(--radius-field);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .cell:hover {
    background: color-mix(in oklab, var(--color-surface) 70%, transparent);
  }
  .cell.today {
    border-color: var(--color-accent-text);
    background: var(--color-surface);
  }
  .cell-number {
    font-weight: 650;
  }
  .cell-mark {
    display: grid;
    place-items: center;
    height: 16px;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 1.25rem;
    margin: 0.25rem 0 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }
  .legend-text {
    color: var(--color-muted);
  }
  .week-plan {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1.5rem;
    scroll-margin-top: 5rem;
  }
  .section-title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
  }
  .plan-rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .plan-row {
    display: grid;
    grid-template-columns: minmax(5.5rem, 1fr) minmax(0, 2fr);
    align-items: center;
    gap: 0.25rem 0.75rem;
  }
  .plan-day {
    font-weight: 650;
  }
  .stale {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--color-warning);
    font-size: var(--text-sm);
  }
</style>
