<script lang="ts">
  // Progressi (/progress, quinta tab, INC-015): gli esercizi fatti, ciascuno verso i suoi progressi
  // (/exercise?id=…). Prima era la vista Esercizi dello Storico. In futuro qui anche le misure del corpo.
  // In cima le serie per muscolo (US-45, INC-025): barre per gruppo nel periodo scelto, i gruppi a zero in una
  // riga, gli esercizi senza muscoli con i link alle loro pagine. Il tocco su una barra apre in un foglio la linea
  // settimanale del gruppo (US-46): le ultime 12 settimane concluse più quella in corso, segnata come parziale.
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import MuscleBars from './MuscleBars.svelte';
  import ProgressChart, { type ChartPoint } from './ProgressChart.svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import {
    addDays,
    exerciseName,
    exercisesDone,
    groupWeeks,
    MUSCLE_GROUPS,
    MUSCLE_LABELS,
    periodVolume,
    toDateKey,
    weeklyVolume,
    type MuscleGroup,
    type VolumePeriod,
  } from '../../lib/archive';
  import { formatDayMonth, formatRelativeDay, formatWeekRange, formatSets, plural } from '../../lib/format';

  const store = archiveStore();
  const today = toDateKey(new Date());

  const unreadable = $derived(store.state === 'unreadable');
  const done = $derived(exercisesDone(store.archive));
  const exerciseHref = (id: string) => `${appUrl('/exercise')}?id=${encodeURIComponent(id)}`;

  const PERIODS: { value: VolumePeriod; label: string; short?: string }[] = [
    { value: 'week', label: 'Settimana' },
    { value: '4w', label: '4 settimane', short: '4S' },
    { value: '12w', label: '12 settimane', short: '12S' },
  ];
  let period: VolumePeriod = $state('4w');
  const weeks = $derived(weeklyVolume(store.archive));
  const volume = $derived(periodVolume(weeks, period, today));
  const bars = $derived(volume.groups.map((g) => ({ label: MUSCLE_LABELS[g.group], value: g.sets })));
  const zero = $derived(MUSCLE_GROUPS.filter((g) => !volume.groups.some((v) => v.group === g)));
  const unclassifiedSets = $derived(volume.unclassified.reduce((sum, u) => sum + u.sets, 0));
  let trendGroup: MuscleGroup | null = $state(null);
  let trendOpen = $state(false);
  const trend = $derived<ChartPoint[]>(
    trendGroup
      ? groupWeeks(weeks, trendGroup, today).map((w) => ({
          date: w.week,
          value: w.sets,
          note: w.partial ? 'Settimana in corso, parziale' : `Settimana ${formatWeekRange(w.week, addDays(w.week, 6), today)}`,
        }))
      : [],
  );
  const trendTitle = $derived(`${trendGroup ? MUSCLE_LABELS[trendGroup] : ''}: serie per settimana`);
  const setsText = (value: number) => `${formatSets(value)} serie`;
  const dayText = (date: string) => formatDayMonth(date, today);
  function openTrend(index: number) {
    trendGroup = volume.groups[index].group;
    trendOpen = true;
  }
  const reading = $derived(
    volume.partial
      ? 'Settimana in corso, fino a oggi.'
      : `Media per settimana, ${volume.weeks === 1 ? 'ultima settimana conclusa' : `ultime ${volume.weeks} settimane concluse`}.`,
  );
</script>

{#if unreadable}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if done.length}
  <div class="flex flex-col gap-5">
    <section aria-labelledby="volume-title" class="flex flex-col gap-3">
      <div class="volume-head">
        <h2 id="volume-title" class="m-0 text-lg font-bold">Serie per muscolo</h2>
        <SegmentedControl name="volume-period" label="Periodo" options={PERIODS} bind:value={period} compact />
      </div>
      {#if volume.weeks === 0}
        <p class="m-0 max-w-[60ch] text-text-muted">Serve almeno una settimana conclusa: intanto guarda la settimana in corso.</p>
      {:else if !bars.length && !volume.unclassified.length}
        <p class="m-0 max-w-[60ch] text-text-muted">Nessuna serie in questo periodo.</p>
      {:else}
        {#if bars.length}
          <MuscleBars rows={bars} onselect={openTrend} />
        {/if}
        <p class="m-0 text-sm text-text-muted">{reading}</p>
        {#if bars.length && zero.length}
          <p class="m-0 max-w-[60ch]"><span class="text-text-muted">Nessuna serie:</span> {zero.map((g) => MUSCLE_LABELS[g]).join(', ')}</p>
        {/if}
        {#if volume.unclassified.length}
          <div>
            <p class="m-0"><span class="text-text-muted">Senza muscoli:</span> {formatSets(unclassifiedSets)} serie</p>
            <ul class="m-0 list-none p-0">
              {#each volume.unclassified as item (item.exerciseId)}
                <li><a href={exerciseHref(item.exerciseId)} class="unclassified [overflow-wrap:anywhere]">{exerciseName(store.archive, item.exerciseId)}</a></li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </section>
    <BottomSheet bind:open={trendOpen} title={trendTitle}>
      <ProgressChart points={trend} format={setsText} formatDate={dayText} label={trendTitle} />
    </BottomSheet>
    <p class="m-0 text-text-muted">Ogni esercizio ha i suoi progressi, anche alternative e varianti.</p>
    <ol class="m-0 list-none p-0">
      {#each done as item (item.exerciseId)}
        <li class="border-b border-border last:border-b-0">
          <a href={exerciseHref(item.exerciseId)} class="row">
            <span class="min-w-0 flex-1">
              <span class="block text-lg font-bold [overflow-wrap:anywhere]">{exerciseName(store.archive, item.exerciseId)}</span>
              <span class="block text-sm text-text-muted">
                Ultima volta: {formatRelativeDay(item.lastDate, today)} · {plural(item.sessions, 'allenamento', 'allenamenti')}
              </span>
            </span>
            <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ol>
  </div>
{:else}
  <div class="flex flex-col items-start gap-3 py-8">
    <ChartLine size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Nessun esercizio registrato</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Dopo il primo allenamento concluso trovi qui i progressi di ogni esercizio.</p>
    <a href={appUrl('/')} class="btn btn-primary">Vai a Oggi</a>
  </div>
{/if}

<style>
  /* titolo a sinistra, periodo a destra; dove non c'è posto il periodo va a capo */
  .volume-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 0.5rem;
    margin-bottom: -0.25rem;
  }
  .volume-head > :global(:last-child) {
    margin-left: auto;
  }
  /* bersaglio da 48px per ogni link */
  .unclassified {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
  }
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
