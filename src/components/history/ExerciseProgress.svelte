<script lang="ts">
  // Progressi di un esercizio (/exercise?id=…, brief route-history, US-28 e US-29): prima il grafico di
  // carico massimo, 1RM stimato (Epley) o volume per allenamento, con misura e periodo su una riga e il
  // confronto con l'allenamento precedente; sotto i record personali in una riga e la cronologia delle
  // serie. L'esercizio è quello fatto davvero: ogni alternativa ha la sua pagina, il riscaldamento non
  // conta, tutto nell'unità scelta. I calcoli sono in src/lib/archive/progress.ts. Ogni riga della
  // cronologia ha «Era un altro esercizio» (US-42): le serie di quell'allenamento passano all'esercizio
  // giusto, con «Annulla» nell'avviso.
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import Toast from '../ui/Toast.svelte';
  import ExercisePicker, { type PickedExercise } from '../exercises/ExercisePicker.svelte';
  import ProgressChart, { type ChartPoint } from './ProgressChart.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import {
    ArchiveError,
    EPLEY_MAX_REPS,
    ensureExercise,
    exerciseHistory,
    exerciseName,
    personalRecords,
    pointsInPeriod,
    reassignExercise,
    setNumbers,
    toDateKey,
    undoReassign,
    type Archive,
    type ExercisePoint,
    type Period,
  } from '../../lib/archive';
  import { formatDayMonth, plural, withPreposition } from '../../lib/format';
  import { formatNumber, formatWeight, fromKg, roundToStep, WEIGHT_STEP } from '../../lib/units';

  type Metric = 'load' | 'e1rm' | 'volume';

  const store = archiveStore();
  const params = new URL(location.href).searchParams;
  const exerciseId = params.get('id') ?? '';
  // aperta da «Progressi» nel menu ⋯ dell'allenamento: il ritorno va all'allenamento, non all'elenco
  const back = params.get('from') === 'workout' ? { href: appUrl('/workout'), label: 'Allenamento' } : { href: appUrl('/progress'), label: 'Progressi' };
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
  const PERIODS: { value: Period; label: string; short?: string }[] = [
    { value: '3m', label: '3 mesi', short: '3M' },
    { value: '1y', label: '1 anno', short: '1A' },
    { value: 'all', label: 'Tutto' },
  ];

  const current = $derived(METRICS.find((m) => m.value === metric)!);
  /** i valori della misura su tutto lo storico, nell'unità scelta: il confronto guarda anche prima del periodo */
  const series = $derived(
    history.flatMap((p) => {
      const kg = current.pick(p);
      return kg === null ? [] : [{ point: p, value: roundToStep(fromKg(kg, unit), WEIGHT_STEP[unit]) }];
    }),
  );
  const periodIds = $derived(new Set(inPeriod.map((p) => p.sessionId)));
  /** i valori del periodo, ciascuno con il precedente della stessa misura (anche fuori dal periodo) */
  const shown = $derived(series.flatMap((s, i) => (periodIds.has(s.point.sessionId) ? [{ ...s, previous: series[i - 1] ?? null }] : [])));
  const chartPoints: ChartPoint[] = $derived(shown.map((s) => ({ date: s.point.date, value: s.value, note: comparison(s.value, s.previous) })));

  const dateText = (date: string) => formatDayMonth(date, today);

  /** "+2,5 kg rispetto al 3 ottobre", "Invariato rispetto all’8 settembre", "Primo valore registrato" */
  function comparison(value: number, previous: { point: ExercisePoint; value: number } | null): string {
    if (!previous) return 'Primo valore registrato';
    const diff = roundToStep(value - previous.value, WEIGHT_STEP[unit]);
    const since = `rispetto ${withPreposition('a', dateText(previous.point.date))}`;
    if (diff === 0) return `Invariato ${since}`;
    return `${diff > 0 ? '+' : '\u2212'}${formatNumber(Math.abs(diff))} ${unit} ${since}`;
  }
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

  /** tutti i record dallo stesso allenamento: la data si scrive una volta sola */
  const recordsSession = $derived(
    recordRows.length > 1 && recordRows.every((r) => r.best.sessionId === recordRows[0].best.sessionId) ? recordRows[0].best : null,
  );

  const recent = $derived([...inPeriod].reverse());

  // US-42: l'allenamento della riga scelta, da passare a un altro esercizio
  let reassigning: ExercisePoint | null = $state(null);
  let pickerOpen = $state(false);
  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);

  function edit(change: (archive: Archive) => Archive): boolean {
    try {
      const result = store.update(change);
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

  function askReassign(point: ExercisePoint) {
    reassigning = point;
    pickerOpen = true;
  }

  function reassign(picked: PickedExercise) {
    const point = reassigning;
    if (!point) return;
    pickerOpen = false;
    let targetId = '';
    let before: Parameters<typeof undoReassign>[2] = [];
    const ok = edit((a) => {
      // un nome scritto a mano diventa un esercizio (personalizzato, o quello che ha già quel nome)
      let target = a;
      if (picked.kind === 'existing') targetId = picked.id;
      else {
        const ensured = ensureExercise(a, picked.name);
        target = ensured.archive;
        targetId = ensured.exercise.id;
      }
      const result = reassignExercise(target, point.sessionId, exerciseId, targetId);
      before = result.before;
      return result.archive;
    });
    if (!ok) return;
    const undo = before;
    toast = {
      message: `Allenamento ${withPreposition('di', dateText(point.date))} spostato in ${exerciseName(store.archive, targetId)}.`,
      action: 'Annulla',
      onaction: () => edit((a) => undoReassign(a, point.sessionId, undo)),
    };
  }
  // il numero di serie di lavoro di un punto, per la cronologia
  const workSets = (p: ExercisePoint) => setNumbers(p.sets).filter(Boolean).length;
</script>

{#snippet sessionDetails(index: number)}
  {@const shownPoint = shown[index]?.point}
  {#if shownPoint}
    <p class="selected-sets">{setsLine(shownPoint)}</p>
    <p class="detail">{[plural(workSets(shownPoint), 'serie', 'serie'), metricsLine(shownPoint)].filter(Boolean).join(' · ')}</p>
    <a class="btn btn-text open" href={sessionHref(shownPoint.sessionId)}>Apri l’allenamento</a>
  {/if}
{/snippet}

{#if store.state === 'unreadable'}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else}
  <div class="page">
    <a href={back.href} class="btn btn-text back"><ChevronLeft aria-hidden="true" />{back.label}</a>

    <div>
      <h2 class="title">{name}</h2>
      {#if history.length}
        <p class="meta">{plural(history.length, 'allenamento', 'allenamenti')} {withPreposition('da', dateText(history[0].date))}</p>
      {/if}
    </div>

    {#if !history.length}
      <div class="flex flex-col items-start gap-3 py-4">
        <ChartLine size={28} class="text-text-muted" aria-hidden="true" />
        <h3 class="m-0 text-xl leading-snug font-bold">Ancora nessuna serie</h3>
        <p class="m-0 max-w-[60ch] text-text-muted">I progressi compaiono dopo il primo allenamento concluso con almeno una serie spuntata di questo esercizio.</p>
      </div>
    {:else}
      <section aria-labelledby="chart-title" class="section">
        <h3 id="chart-title" class="visually-hidden">{current.title}</h3>
        <div class="controls">
          <SegmentedControl name="metric" label="Misura" options={METRICS} bind:value={metric} compact />
          <SegmentedControl name="period" label="Periodo" options={PERIODS} bind:value={period} compact />
        </div>
        {#if chartPoints.length}
          <ProgressChart points={chartPoints} format={valueText} formatDate={dateText} label={current.title} details={sessionDetails} />
          {#if chartPoints.length === 1}
            <p class="hint m-0">Un solo allenamento in questo periodo: l’andamento compare dal secondo.</p>
          {/if}
          {#if metric === 'e1rm'}
            <p class="hint m-0">Stima con la formula di Epley, dalle serie normali fino a {EPLEY_MAX_REPS} ripetizioni.</p>
          {/if}
        {:else if noChart}
          <p class="m-0 max-w-[60ch] text-text-muted">{noChart}</p>
        {/if}
      </section>

      {#if recordRows.length}
        <section aria-labelledby="records-title" class="section">
          <h3 id="records-title" class="subtitle">Record personali</h3>
          <dl class="records">
            {#each recordRows as row (row.term)}
              <div class="record">
                <dt>{row.term}</dt>
                <dd class="record-value">{row.value}</dd>
                {#if !recordsSession}
                  <dd class="record-date"><a href={sessionHref(row.best.sessionId)}>{dateText(row.best.date)}</a></dd>
                {/if}
              </div>
            {/each}
          </dl>
          {#if recordsSession}
            <p class="record-date m-0">Fatti tutti nell’<a href={sessionHref(recordsSession.sessionId)}>allenamento {withPreposition('di', dateText(recordsSession.date))}</a></p>
          {/if}
        </section>
      {:else}
        <p class="m-0 max-w-[60ch] text-text-muted">Solo serie di riscaldamento o senza carico: non contano per record e grafici.</p>
      {/if}

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
                <button
                  type="button"
                  class="btn btn-icon reassign"
                  aria-haspopup="dialog"
                  aria-label={`Era un altro esercizio: allenamento ${withPreposition('di', dateText(point.date))}`}
                  onclick={() => askReassign(point)}><ArrowLeftRight size={20} aria-hidden="true" /></button
                >
              </li>
            {/each}
          </ol>
        </section>
      {/if}
    {/if}
  </div>
{/if}

<!-- montato solo dopo il primo «Era un altro esercizio»: chiuso, il foglio terrebbe nella pagina tutto il catalogo -->
{#if reassigning}
  <ExercisePicker
    bind:open={pickerOpen}
    title={`Era un altro esercizio? Allenamento ${withPreposition('di', dateText(reassigning.date))}`}
    catalog={store.archive}
    exclude={[exerciseId]}
    onpick={reassign}
  />
{/if}

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

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
    color: var(--color-text-muted);
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
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  /* misura a sinistra, periodo a destra; dove non c'è posto il periodo va a capo */
  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0 0.5rem;
    margin: -0.5rem 0 -0.25rem;
  }
  .controls > :global(:last-child) {
    margin-left: auto;
  }
  /* righe condivise (subgrid): un'etichetta su due righe non sposta i valori delle altre colonne */
  .records {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 1rem;
    margin: 0;
  }
  .record-date {
    font-size: var(--text-sm);
  }
  .selected-sets {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .open {
    margin-left: -0.25rem;
  }
  .record {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    row-gap: 0;
  }
  .record dt {
    align-self: end;
  }
  dt {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  dd {
    margin: 0;
  }
  .record-value {
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    border-bottom: 1px solid var(--color-border);
  }
  .list .row {
    flex: 1;
    min-width: 0;
  }
  .reassign {
    flex-shrink: 0;
    margin-right: -0.75rem;
    color: var(--color-text-muted);
  }
  .reassign:hover {
    color: var(--color-text);
  }
  .row {
    display: flex;
    flex-direction: column;
    min-height: 56px;
    padding: 0.5rem 0;
    color: var(--color-text);
    text-decoration: none;
  }
  .list li:last-child {
    border-bottom: 0;
  }
  .day {
    color: var(--color-text);
    font-weight: 700;
  }
  .sets {
    font-size: var(--text-lg);
    overflow-wrap: anywhere;
  }
  .detail {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
</style>
