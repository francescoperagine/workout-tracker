<script lang="ts">
  // Storico (US-27, US-20): allenamenti conclusi per mese; i progressi per esercizio sono nella tab Progressi.
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import History from '@lucide/svelte/icons/rotate-ccw-clock';
  import Trophy from '@lucide/svelte/icons/trophy';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import { sessionInProgress, sessionRecords, toDateKey, workoutSummary, type Session } from '../../lib/archive';
  import { formatClock, formatElapsed, formatLongDay, formatMonth, formatOnDay, plural } from '../../lib/format';
  import { formatWeight } from '../../lib/units';

  const store = archiveStore();
  const now = Date.now();
  const today = toDateKey(new Date(now));

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
      group.rows.push({ session, meta, records: new Set(sessionRecords(store.archive, session).map((r) => r.exerciseId)).size });
    }
    return groups;
  });

  const startedLine = $derived(
    running ? `In corso · ${running.date === today ? `iniziato alle ${formatClock(running.start)}` : `iniziato ${formatOnDay(running.date, today)}`}` : '',
  );
  const sessionHref = (id: string) => `${appUrl('/session')}?id=${encodeURIComponent(id)}`;
</script>

{#if unreadable}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else}
  <div class="flex flex-col gap-5">
    {#if running}
      <!-- una riga come le altre, non un secondo "Riprendi": quello è nella mini-barra (step 9) -->
      <section class="flex flex-col gap-1">
        <h2 class="m-0 text-xl leading-snug font-bold">In corso</h2>
        <a href={appUrl('/workout')} class="row border-b border-border">
          <span class="min-w-0 flex-1">
            <span class="block text-lg font-bold [overflow-wrap:anywhere]">{running.name}</span>
            <span class="block text-sm text-text-muted">{startedLine}</span>
          </span>
          <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
        </a>
      </section>
    {/if}

    {#if months.length}
      {#each months as month (month.key)}
        <section class="flex flex-col gap-1">
          <h2 class="m-0 text-xl leading-snug font-bold">{month.title}</h2>
          <ol class="m-0 list-none p-0">
            {#each month.rows as row (row.session.id)}
              <li class="border-b border-border last:border-b-0">
                <a href={sessionHref(row.session.id)} class="row">
                  <span class="min-w-0 flex-1">
                    <span class="block text-lg font-bold [overflow-wrap:anywhere]">{row.session.name}</span>
                    <span class="block text-sm text-text-muted">
                      {row.meta}
                      {#if row.records}
                        · <Trophy size={16} class="inline align-text-bottom text-text" aria-hidden="true" />
                        {row.records === 1 ? 'Record' : `Record in ${row.records} esercizi`}
                      {/if}
                    </span>
                  </span>
                  <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
                </a>
              </li>
            {/each}
          </ol>
        </section>
      {/each}
    {:else if !running}
      <div class="flex flex-col items-start gap-3 py-8">
        <History size={28} class="text-text-muted" aria-hidden="true" />
        <h2 class="m-0 text-xl leading-snug font-bold">Ancora nessun allenamento</h2>
        <p class="m-0 max-w-[60ch] text-text-muted">Quando termini un allenamento lo ritrovi qui, per data, con serie e volume. Da qui puoi anche correggerlo.</p>
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
