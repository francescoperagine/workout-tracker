<script lang="ts">
  // Progressi di un esercizio (/exercise?id=…, brief route-history, US-28 e US-29): record personali,
  // grafico di carico massimo, 1RM stimato (Epley) o volume per allenamento con il periodo, e la
  // cronologia delle serie. L'esercizio è quello fatto davvero: ogni variante ha la sua pagina, il
  // riscaldamento non conta, tutto nell'unità scelta. I calcoli sono in src/lib/archive/progress.ts.
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import ProgressChart, { type ChartPoint } from './ProgressChart.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import {
    EPLEY_MAX_REPS,
    exerciseHistory,
    exerciseName,
    personalRecords,
    pointsInPeriod,
    setNumbers,
    toDateKey,
    type ExercisePoint,
    type Period,
  } from '../../lib/archive';
  import { formatDayMonth, plural } from '../../lib/format';
  import { formatNumber, formatWeight, fromKg, roundToStep, WEIGHT_STEP } from '../../lib/units';

  type Metric = 'load' | 'e1rm' | 'volume';

  const store = archiveStore();
  const exerciseId = new URL(location.href).searchParams.get('id') ?? '';
  const today = toDateKey(new Date());

  let metric: Metric = $state('load');
  let period: Period = $state('3m');

  const settings = $derived(store.archive.settings);
  const unit = $derived(settings.weightUnit);
  const name = $derived(exerciseName(store.archive, exerciseId));
  const history = $derived(exerciseHistory(store.archive, exerciseId));
  const records = $derived(personalRecords(history));
  const inPeriod = $derived(pointsInPeriod(history, period, today));

  const METRICS: { value: Metric; label: string; title: string; pick: (p: ExercisePoint) => number | null }[] = [
    { value: 'load', label: 'Carico', title: 'Carico massimo per allenamento', pick: (p) => p.maxLoad },
    { value: 'e1rm', label: '1RM', title: '1RM stimato per allenamento', pick: (p) => p.e1rm },
    { value: 'volume', label: 'Volume', title: 'Volume per allenamento', pick: (p) => (p.volume > 0 ? p.volume : null) },
  ];
  const PERIODS: { value: Period; label: string }[] = [
    { value: '3m', label: '3 mesi' },
    { value: '1y', label: '1 anno' },
    { value: 'all', label: 'Tutto' },
  ];

  const current = $derived(METRICS.find((m) => m.value === metric)!);
  const chartPoints: ChartPoint[] = $derived(
    inPeriod.flatMap((p) => {
      const kg = current.pick(p);
      return kg === null ? [] : [{ date: p.date, value: roundToStep(fromKg(kg, unit), WEIGHT_STEP[unit]) }];
    }),
  );

  const dateText = (date: string) => formatDayMonth(date, today);
  const valueText = (value: number) => `${formatNumber(value)} ${unit}`;
  const sessionHref = (id: string) => `${appUrl('/session')}?id=${encodeURIComponent(id)}`;

  /** perché non c'è un grafico per la misura scelta */
  const noChart = $derived.by(() => {
    if (!inPeriod.length) return period === 'all' ? '' : `Nessun allenamento con questo esercizio ${period === '3m' ? 'negli ultimi 3 mesi' : 'nell’ultimo anno'}.`;
    if (metric === 'e1rm') return `Nessuna serie normale con carico e da 1 a ${EPLEY_MAX_REPS} ripetizioni: l’1RM si stima solo da quelle.`;
    return 'Nessuna serie con il carico: il riscaldamento non conta, e senza carico (corpo libero) non c’è un andamento del peso.';
  });

  /** "R 20 × 10 · 40 × 8 · D 30 × 6": le serie fatte, con la sigla dei tipi speciali */
  const BADGE = { normal: '', warmup: 'R', drop: 'D', failure: 'C' } as const;
  function setsLine(p: ExercisePoint): string {
    return p.sets
      .map((s) => {
        const value = [s.kg === null ? '' : formatWeight(s.kg, settings, false), s.reps === null ? '' : String(s.reps)].filter(Boolean).join('\u00a0×\u00a0');
        return [BADGE[s.type], value].filter(Boolean).join('\u00a0');
      })
      .join(' · ');
  }

  function metricsLine(p: ExercisePoint): string {
    return [p.e1rm === null ? '' : `1RM ${formatWeight(p.e1rm, settings)}`, p.volume > 0 ? `volume ${formatWeight(p.volume, settings)}` : '']
      .filter(Boolean)
      .join(' · ');
  }

  const recordRows = $derived(
    [
      records.maxLoad && {
        term: 'Carico massimo',
        value: [formatWeight(records.maxLoad.value, settings), records.maxLoad.reps === null ? '' : `× ${records.maxLoad.reps}`].filter(Boolean).join(' '),
        best: records.maxLoad,
      },
      records.e1rm && { term: '1RM stimato', value: formatWeight(records.e1rm.value, settings), best: records.e1rm },
      records.volume && { term: 'Volume', value: formatWeight(records.volume.value, settings), best: records.volume },
    ].filter((r) => !!r),
  );

  const recent = $derived([...inPeriod].reverse());
  // il numero di serie di lavoro di un punto, per la cronologia
  const workSets = (p: ExercisePoint) => setNumbers(p.sets).filter(Boolean).length;
</script>

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else}
  <div class="page">
    <a href={`${appUrl('/history')}?view=exercises`} class="btn btn-text back"><ChevronLeft aria-hidden="true" />Esercizi</a>

    <div>
      <h2 class="title">{name}</h2>
      {#if history.length}
        <p class="meta">{plural(history.length, 'allenamento', 'allenamenti')} dal {dateText(history[0].date)}</p>
      {/if}
    </div>

    {#if !history.length}
      <div class="flex flex-col items-start gap-3 py-4">
        <ChartLine size={28} class="text-muted" aria-hidden="true" />
        <h3 class="m-0 text-xl leading-snug font-bold">Ancora nessuna serie</h3>
        <p class="m-0 max-w-[60ch] text-muted">I progressi compaiono dopo il primo allenamento concluso con almeno una serie spuntata di questo esercizio.</p>
      </div>
    {:else}
      {#if recordRows.length}
        <section aria-labelledby="records-title" class="section">
          <h3 id="records-title" class="subtitle">Record personali</h3>
          <dl class="records">
            {#each recordRows as row (row.term)}
              <div class="record">
                <dt>{row.term}</dt>
                <dd class="record-value">{row.value}</dd>
                <dd><a href={sessionHref(row.best.sessionId)}>{dateText(row.best.date)}</a></dd>
              </div>
            {/each}
          </dl>
        </section>
      {:else}
        <p class="m-0 max-w-[60ch] text-muted">Solo serie di riscaldamento o senza carico: non contano per record e grafici.</p>
      {/if}

      <section aria-labelledby="chart-title" class="section">
        <h3 id="chart-title" class="subtitle">{current.title}</h3>
        <div class="controls">
          <SegmentedControl name="metric" label="Misura" options={METRICS} bind:value={metric} />
          <SegmentedControl name="period" label="Periodo" options={PERIODS} bind:value={period} />
        </div>
        {#if chartPoints.length}
          <ProgressChart points={chartPoints} format={valueText} formatDate={dateText} label={current.title} />
          {#if chartPoints.length === 1}
            <p class="hint m-0">Un solo allenamento in questo periodo: l’andamento compare dal secondo.</p>
          {/if}
          {#if metric === 'e1rm'}
            <p class="hint m-0">Stima con la formula di Epley, dalle serie normali fino a {EPLEY_MAX_REPS} ripetizioni.</p>
          {/if}
        {:else if noChart}
          <p class="m-0 max-w-[60ch] text-muted">{noChart}</p>
        {/if}
      </section>

      {#if recent.length}
        <section aria-labelledby="sets-title" class="section">
          <h3 id="sets-title" class="subtitle">Cronologia delle serie</h3>
          <ol class="list">
            {#each recent as point (point.sessionId)}
              <li>
                <a class="row" href={sessionHref(point.sessionId)}>
                  <span class="day">{dateText(point.date)}</span>
                  <span class="sets">{setsLine(point)}</span>
                  <span class="detail">{[plural(workSets(point), 'serie', 'serie'), metricsLine(point)].filter(Boolean).join(' · ')}</span>
                </a>
              </li>
            {/each}
          </ol>
        </section>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .back {
    align-self: flex-start;
    margin: -0.75rem 0 -1rem;
    gap: 0.25rem;
  }
  .title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .meta {
    margin: 0.25rem 0 0;
    color: var(--color-muted);
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .subtitle {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .records {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
    gap: 0.75rem 1rem;
    margin: 0;
  }
  .record {
    display: flex;
    flex-direction: column;
  }
  dt {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  dd {
    margin: 0;
  }
  .record-value {
    font-size: var(--text-xl);
    font-weight: 700;
    line-height: 1.25;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    border-bottom: 1px solid var(--color-line);
  }
  .row {
    display: flex;
    flex-direction: column;
    min-height: 56px;
    padding: 0.5rem 0;
    color: var(--color-foreground);
    text-decoration: none;
  }
  .list li:last-child {
    border-bottom: 0;
  }
  .day {
    color: var(--color-accent-text);
    font-weight: 700;
  }
  .sets {
    font-size: var(--text-lg);
    overflow-wrap: anywhere;
  }
  .detail {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
</style>
