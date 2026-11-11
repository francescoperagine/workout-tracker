<script lang="ts">
  // Progressi (/progress, quinta tab, INC-015): sotto le serie per muscolo il catalogo (delavier-catalog,
  // US-47): ricerca per nome e alias come nella scelta degli esercizi, «Solo fatti» acceso a ogni apertura,
  // elenco alfabetico anche durante la ricerca; ogni riga porta ai progressi dell'esercizio (/exercise?id=…).
  // In futuro qui anche le misure del corpo.
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
  import Switch from '../ui/Switch.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import {
    addDays,
    availableExercises,
    exerciseName,
    exercisesDone,
    groupWeeks,
    MUSCLE_GROUPS,
    MUSCLE_LABELS,
    periodVolume,
    suggestExercises,
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
  const exerciseHref = (id: string, tab?: 'info') => `${appUrl('/exercise')}?id=${encodeURIComponent(id)}${tab ? `&tab=${tab}` : ''}`;

  // US-47: il catalogo (base, personalizzati e gli id fatti che non ci sono più), in ordine alfabetico
  let query = $state('');
  let onlyDone = $state(true);
  const doneById = $derived(new Map(done.map((d) => [d.exerciseId, d])));
  const rows = $derived.by(() => {
    const entries = availableExercises(store.archive).map((e) => ({ id: e.id, name: e.name }));
    const known = new Set(entries.map((e) => e.id));
    for (const d of done) if (!known.has(d.exerciseId)) entries.push({ id: d.exerciseId, name: exerciseName(store.archive, d.exerciseId) });
    const typed = query.trim();
    const matching = typed ? new Set(suggestExercises(store.archive, typed, Infinity).map((e) => e.id)) : null;
    return entries
      .filter((e) => (!onlyDone || doneById.has(e.id)) && (!matching || matching.has(e.id)))
      .sort((a, b) => a.name.localeCompare(b.name, 'it'));
  });
  const emptyList = $derived(
    query.trim()
      ? `Nessun esercizio${onlyDone ? ' fatto' : ''} con questo nome.${onlyDone ? ' Spegni «Solo fatti» per cercare in tutto il catalogo.' : ''}`
      : 'Nessun esercizio fatto finora: spegni «Solo fatti» per vedere tutto il catalogo.',
  );

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
{:else}
  <div class="flex flex-col">
    {#if done.length}
      <section aria-labelledby="volume-title" class="flex flex-col gap-3 pb-6">
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
                  <li><a href={exerciseHref(item.exerciseId, 'info')} class="unclassified [overflow-wrap:anywhere]">{exerciseName(store.archive, item.exerciseId)}</a></li>
                {/each}
              </ul>
            </div>
          {/if}
        {/if}
      </section>
      <BottomSheet bind:open={trendOpen} title={trendTitle}>
        <ProgressChart points={trend} format={setsText} formatDate={dayText} label={trendTitle} />
      </BottomSheet>
    {:else}
      <div class="flex flex-col items-start gap-3 pb-6">
        <ChartLine size={28} class="text-text-muted" aria-hidden="true" />
        <h2 class="m-0 text-xl leading-snug font-bold">Nessun esercizio registrato</h2>
        <p class="m-0 max-w-[60ch] text-text-muted">Dopo il primo allenamento concluso trovi qui i progressi di ogni esercizio.</p>
        <a href={appUrl('/')} class="btn btn-primary">Vai a Oggi</a>
      </div>
    {/if}

    <!-- tipi di informazione diversi uno sotto l'altro: un filo li separa (DESIGN.md, «La regola del filo») -->
    <section aria-labelledby="exercises-title" class="flex flex-col gap-3 border-t border-border pt-6">
      <h2 id="exercises-title" class="m-0 text-lg font-bold">Esercizi</h2>
      <p class="m-0 text-text-muted">Ogni esercizio ha i suoi progressi, anche alternative e varianti.</p>
      <div>
        <label class="label" for="exercise-search">Cerca per nome</label>
        <input id="exercise-search" class="field" type="search" enterkeyhint="search" autocomplete="off" bind:value={query} aria-controls="exercise-list" />
      </div>
      <Switch label="Solo fatti" bind:checked={onlyDone} />
      <p class="sr-only" role="status">{query.trim() ? plural(rows.length, 'esercizio', 'esercizi') : ''}</p>
      {#if rows.length}
        <ol id="exercise-list" class="m-0 list-none p-0">
          {#each rows as row (row.id)}
            {@const item = doneById.get(row.id)}
            <li class="border-b border-border last:border-b-0">
              <a href={exerciseHref(row.id)} class="row">
                <span class="min-w-0 flex-1">
                  <span class="block text-lg font-bold [overflow-wrap:anywhere]">{row.name}</span>
                  {#if item}
                    <span class="block text-sm text-text-muted">
                      Ultima volta: {formatRelativeDay(item.lastDate, today)} · {plural(item.sessions, 'allenamento', 'allenamenti')}
                    </span>
                  {:else}
                    <span class="block text-sm text-text-muted"><span aria-hidden="true">–</span><span class="sr-only">mai fatto</span></span>
                  {/if}
                </span>
                <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ol>
      {:else}
        <p id="exercise-list" class="m-0 max-w-[60ch] text-text-muted">{emptyList}</p>
      {/if}
    </section>
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
