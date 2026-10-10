<script lang="ts">
  // /kit: stato dei giorni del calendario (US-05), con un archivio dimostrativo e "oggi" fisso a
  // giovedì 8 ottobre 2026: la striscia della settimana di Oggi e il vocabolario degli stati.
  import WeekStrip from '../calendar/WeekStrip.svelte';
  import { STATUS_LOOK } from '../calendar/day-status';
  import { emptyArchive, starterRoutines, type Archive, type Session } from '../../lib/archive';

  const TODAY = '2026-10-08';
  const routines = starterRoutines();
  const done = (date: string, routineId: string | null, end: number | null = 1): Session => ({
    id: `kit-${date}`,
    date,
    routineId,
    name: routines.find((r) => r.id === routineId)?.name ?? 'Allenamento libero',
    start: 0,
    end,
    exercises: [],
  });
  const archive: Archive = {
    ...emptyArchive(),
    routines,
    schedule: { mon: 'routine-a', tue: 'routine-b', thu: 'routine-a', fri: 'routine-b', sun: null },
    sessions: [done('2026-10-05', 'routine-a'), done('2026-10-07', null), done(TODAY, 'routine-a', null)],
  };
</script>

<div class="flex flex-col gap-4">
  <WeekStrip {archive} today={TODAY} />
  <ul class="states">
    {#each Object.entries(STATUS_LOOK) as [status, look] (status)}
      {#if look.icon}
        <li class={look.tone}><look.icon size={20} aria-hidden="true" /><span class="text">{look.label}</span></li>
      {/if}
    {/each}
  </ul>
</div>

<style>
  .states {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .states li {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
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
</style>
