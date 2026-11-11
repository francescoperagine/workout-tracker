<script lang="ts">
  // Progressi (/progress, quinta tab, INC-015): sotto le serie per muscolo il catalogo (delavier-catalog,
  // US-47): ricerca per nome e alias come nella scelta degli esercizi, «Solo fatti» acceso a ogni apertura,
  // elenco alfabetico anche durante la ricerca; ogni riga porta ai progressi dell'esercizio (/exercise?id=…).
  // In futuro qui anche le misure del corpo.
  // In cima le serie per muscolo (US-45, INC-025): barre per gruppo nel periodo scelto, i gruppi a zero in una
  // riga, gli esercizi senza muscoli con i link alle loro pagine. Il tocco su una barra apre in un foglio la linea
  // settimanale del gruppo (US-46): le ultime 12 settimane concluse più quella in corso, segnata come parziale;
  // sotto il grafico gli esercizi che hanno dato serie al gruppo (US-49), filtrati sulla settimana toccata.
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import BodyMap from './BodyMap.svelte';
  import ExerciseRow from './ExerciseRow.svelte';
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
    groupExercises,
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
  import { formatDayMonth, formatWeekRange, formatSets, plural } from '../../lib/format';

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
    openGroup(volume.groups[index].group);
  }
  function openGroup(group: MuscleGroup) {
    trendGroup = group;
    weekFilter = null;
    trendOpen = true;
  }
  // US-51: la sagoma colora i gruppi del periodo, più pieni quanto più vicini al massimo
  const mapValues = $derived(Object.fromEntries(volume.groups.map((g) => [g.group, g.sets])) as Partial<Record<MuscleGroup, number>>);
  const describeGroup = (group: MuscleGroup) => `Sagoma, ${MUSCLE_LABELS[group]}: ${setsText(mapValues[group] ?? 0)}`;

  // US-49: gli esercizi del gruppo nelle settimane del grafico, o in quella toccata (un secondo tocco la toglie)
  let weekFilter: string | null = $state(null);
  // con il filtro l'elenco si accorcia e il foglio, ancorato in basso, sposterebbe il grafico sotto il dito:
  // l'elenco tiene l'altezza che ha senza filtro
  let listHeight = $state(0);
  let fullHeight = $state(0);
  $effect(() => {
    if (!weekFilter) fullHeight = listHeight;
  });
  const contributions = $derived(trendGroup ? groupExercises(store.archive, trendGroup, weekFilter ? [weekFilter] : trend.map((p) => p.date)) : []);
  function pickWeek(index: number) {
    const week = trend[index].date;
    weekFilter = weekFilter === week ? null : week;
  }
  const weekText = (week: string) => formatWeekRange(week, addDays(week, 6), today);
  const shareText = (value: number) => `ogni serie conta ${value.toLocaleString('it-IT')}`;
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
            <BodyMap values={mapValues} mode="intensity" label="Sagoma: serie per muscolo nel periodo" onselect={openGroup} describe={describeGroup} />
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
        <ProgressChart points={trend} format={setsText} formatDate={dayText} label={trendTitle} onpick={pickWeek} />
        <section aria-labelledby="group-exercises-title" class="group-exercises" bind:clientHeight={listHeight} style:min-height={weekFilter ? `${fullHeight}px` : null}>
          <div class="group-head">
            <h3 id="group-exercises-title" class="m-0 text-base font-bold">
              {weekFilter ? `Esercizi, ${weekText(weekFilter)}` : 'Esercizi, tutte le settimane'}
            </h3>
            {#if weekFilter}
              <button type="button" class="btn btn-text" onclick={() => (weekFilter = null)}>Tutte le settimane</button>
            {/if}
          </div>
          {#if contributions.length}
            <ol class="m-0 list-none p-0">
              {#each contributions as item (item.exerciseId)}
                <li class="border-b border-border last:border-b-0">
                  <ExerciseRow
                    href={exerciseHref(item.exerciseId)}
                    name={exerciseName(store.archive, item.exerciseId)}
                    done={doneById.get(item.exerciseId)}
                    {today}
                    extra={`${setsText(item.sets)} · ${shareText(item.value)}`}
                  />
                </li>
              {/each}
            </ol>
          {:else}
            <p class="m-0 text-text-muted">Nessun esercizio in questa settimana.</p>
          {/if}
        </section>
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
            <li class="border-b border-border last:border-b-0">
              <ExerciseRow href={exerciseHref(row.id)} name={row.name} done={doneById.get(row.id)} {today} />
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
  /* sotto il grafico del foglio, separato da un filo (regola del filo) */
  .group-exercises {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }
  .group-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0 0.5rem;
    min-height: 48px;
  }
  .group-head :global(.btn-text) {
    margin-right: -0.75rem;
  }
</style>
