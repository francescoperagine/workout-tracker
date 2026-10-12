<script lang="ts">
  // Storico (US-27, US-20): allenamenti conclusi per mese, oppure elenco degli esercizi fatti per i progressi.
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import History from '@lucide/svelte/icons/rotate-ccw-clock';
  import Trophy from '@lucide/svelte/icons/trophy';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import { exerciseName, exercisesDone, sessionInProgress, sessionRecords, toDateKey, workoutSummary, type Session } from '../../lib/archive';
  import { formatClock, formatElapsed, formatLongDay, formatMonth, formatOnDay, formatRelativeDay, plural } from '../../lib/format';
  import { formatWeight } from '../../lib/units';

  const store = archiveStore();
  const now = Date.now();
  const today = toDateKey(new Date(now));

  type View = 'sessions' | 'exercises';
  let view: View = $state(new URLSearchParams(location.search).get('view') === 'exercises' ? 'exercises' : 'sessions');

  // la scelta resta nell'indirizzo, così tornando indietro si ritrova
  function changeView(next: View) {
    const url = new URL(location.href);
    if (next === 'exercises') url.searchParams.set('view', 'exercises');
    else url.searchParams.delete('view');
    history.replaceState(history.state, '', url);
  }

  const unreadable = $derived(store.state === 'unreadable');
  const running = $derived(unreadable ? null : sessionInProgress(store.archive));

  const months = $derived.by(() => {
    const finished = store.archive.sessions.filter((s) => s.end !== null).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);
    const groups: { key: string; title: string; rows: { session: Session; meta: string; records: number }[] }[] = [];
    for (const session of finished) {
      const summary = workoutSummary(session, now);
      const meta = [
        formatLongDay(session.date, today),
        summary.duration >= 60_000 ? formatElapsed(summary.duration) : '',
        plural(summary.sets, 'serie', 'serie'),
        summary.volume > 0 ? formatWeight(summary.volume, store.archive.settings) : '',
      ]
        .filter(Boolean)
        .join(' · ');
      const key = session.date.slice(0, 7);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        const title = formatMonth(session.date);
        group = { key, title: title.charAt(0).toUpperCase() + title.slice(1), rows: [] };
        groups.push(group);
      }
      group.rows.push({ session, meta, records: sessionRecords(store.archive, session).length });
    }
    return groups;
  });

  const done = $derived(exercisesDone(store.archive));

  const startedLine = $derived(
    running ? `In corso · ${running.date === today ? `iniziato alle ${formatClock(running.start)}` : `iniziato ${formatOnDay(running.date, today)}`}` : '',
  );
  const sessionHref = (id: string) => `${appUrl('/session')}?id=${encodeURIComponent(id)}`;
  const exerciseHref = (id: string) => `${appUrl('/exercise')}?id=${encodeURIComponent(id)}`;
</script>

{#if unreadable}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else}
  <div class="flex flex-col gap-5">
    <SegmentedControl
      name="history-view"
      label="Mostra"
      options={[
        { value: 'sessions', label: 'Allenamenti' },
        { value: 'exercises', label: 'Esercizi' },
      ]}
      bind:value={view}
      onchange={changeView}
    />

    {#if view === 'sessions'}
      {#if running}
        <div class="panel flex flex-col items-start gap-3">
          <div>
            <p class="m-0 text-lg font-bold [overflow-wrap:anywhere]">{running.name}</p>
            <p class="m-0 text-sm text-muted">{startedLine}</p>
          </div>
          <a href={appUrl('/workout')} class="btn btn-primary">Riprendi</a>
        </div>
      {/if}

      {#if months.length}
        {#each months as month (month.key)}
          <section class="flex flex-col gap-1">
            <h2 class="m-0 text-xl leading-snug font-bold">{month.title}</h2>
            <ol class="m-0 list-none p-0">
              {#each month.rows as row (row.session.id)}
                <li class="border-b border-line last:border-b-0">
                  <a href={sessionHref(row.session.id)} class="row">
                    <span class="min-w-0 flex-1">
                      <span class="block text-lg font-bold [overflow-wrap:anywhere]">{row.session.name}</span>
                      <span class="block text-sm text-muted">
                        {row.meta}
                        {#if row.records}
                          · <Trophy size={16} class="inline align-text-bottom text-accent-text" aria-hidden="true" />
                          {row.records === 1 ? 'Record' : `${row.records} record`}
                        {/if}
                      </span>
                    </span>
                    <ChevronRight size={20} class="shrink-0 text-muted" aria-hidden="true" />
                  </a>
                </li>
              {/each}
            </ol>
          </section>
        {/each}
      {:else if !running}
        <div class="flex flex-col items-start gap-3 py-8">
          <History size={28} class="text-muted" aria-hidden="true" />
          <h2 class="m-0 text-xl leading-snug font-bold">Ancora nessun allenamento</h2>
          <p class="m-0 max-w-[60ch] text-muted">Quando termini un allenamento lo ritrovi qui, per data, con serie e volume. Da qui puoi anche correggerlo.</p>
          <a href={appUrl('/')} class="btn btn-primary">Vai a Oggi</a>
        </div>
      {/if}
    {:else if done.length}
      <p class="m-0 text-muted">Le varianti hanno ciascuna i loro progressi.</p>
      <ol class="m-0 list-none p-0">
        {#each done as item (item.exerciseId)}
          <li class="border-b border-line last:border-b-0">
            <a href={exerciseHref(item.exerciseId)} class="row">
              <span class="min-w-0 flex-1">
                <span class="block text-lg font-bold [overflow-wrap:anywhere]">{exerciseName(store.archive, item.exerciseId)}</span>
                <span class="block text-sm text-muted">
                  Ultima volta: {formatRelativeDay(item.lastDate, today)} · {plural(item.sessions, 'allenamento', 'allenamenti')}
                </span>
              </span>
              <ChevronRight size={20} class="shrink-0 text-muted" aria-hidden="true" />
            </a>
          </li>
        {/each}
      </ol>
    {:else}
      <div class="flex flex-col items-start gap-3 py-8">
        <History size={28} class="text-muted" aria-hidden="true" />
        <h2 class="m-0 text-xl leading-snug font-bold">Nessun esercizio registrato</h2>
        <p class="m-0 max-w-[60ch] text-muted">Dopo il primo allenamento concluso trovi qui i progressi di ogni esercizio.</p>
        <a href={appUrl('/')} class="btn btn-primary">Vai a Oggi</a>
      </div>
    {/if}
  </div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    padding: 0.5rem 0;
    color: inherit;
    text-decoration: none;
  }
</style>
