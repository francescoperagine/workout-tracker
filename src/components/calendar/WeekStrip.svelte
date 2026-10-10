<script lang="ts">
  // Striscia della settimana in Oggi (US-05): sette giorni con lo stato (icona più testo nascosto
  // per gli screen reader nell'etichetta), ognuno porta al giorno nel Calendario.
  import { dayInfo, weekDates, type Archive } from '../../lib/archive';
  import { WEEKDAY_SHORT } from '../../lib/format';
  import { appUrl } from '../../lib/paths';
  import { STATUS_LOOK, dayLabel } from './day-status';

  interface Props {
    archive: Archive;
    today: string;
  }

  let { archive, today }: Props = $props();

  const days = $derived(weekDates(today).map((date) => dayInfo(archive, date, today)));
</script>

<nav aria-label="Questa settimana">
  <ul class="strip">
    {#each days as day (day.date)}
      {@const look = STATUS_LOOK[day.status]}
      <li>
        <a
          class="day"
          class:today={day.isToday}
          href={appUrl(`/calendar?date=${day.date}`)}
          aria-label={dayLabel(day, today)}
          aria-current={day.isToday ? 'date' : undefined}
        >
          <span class="weekday" aria-hidden="true">{WEEKDAY_SHORT[day.weekday]}</span>
          <span class="number" aria-hidden="true">{Number(day.date.slice(8))}</span>
          <span class={['mark', look.tone]} aria-hidden="true">
            {#if look.icon}
              <look.icon size={18} aria-hidden="true" />
            {/if}
          </span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .strip {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 2px;
    margin: 0 -0.5rem;
    padding: 0;
    list-style: none;
  }
  .day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-height: 76px;
    padding: 6px 0;
    border: 1px solid transparent;
    border-radius: var(--radius-field);
    color: inherit;
    text-decoration: none;
  }
  .day:hover {
    background: color-mix(in oklab, var(--color-surface) 70%, transparent);
  }
  .day.today {
    border-color: var(--color-accent-text);
    background: var(--color-surface);
  }
  .weekday {
    color: var(--color-muted);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .today .weekday {
    color: var(--color-accent-text);
  }
  .number {
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.2;
  }
  .mark {
    display: grid;
    place-items: center;
    height: 20px;
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
</style>
