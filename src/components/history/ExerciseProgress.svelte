<script lang="ts">
  // Progressi di un esercizio (/exercise?id=…, brief route-history, US-28 e US-29): prima il grafico di
  // carico massimo, 1RM stimato (Epley) o volume per allenamento, con misura e periodo su una riga e il
  // confronto con l'allenamento precedente; sotto i record personali in una riga e la cronologia delle
  // serie. L'esercizio è quello fatto davvero: ogni alternativa ha la sua pagina, il riscaldamento non
  // conta, tutto nell'unità scelta. I calcoli sono in src/lib/archive/progress.ts. Ogni riga della
  // cronologia ha «Era un altro esercizio» (US-42): le serie di quell'allenamento passano all'esercizio
  // giusto, con «Annulla» nell'avviso. Due tab (delavier-catalog, US-48): «Progressi» (grafico, record,
  // cronologia; aperta per prima) e «Info» (&tab=info nell'URL): muscoli con la quota di una serie (US-43,
  // US-44), in sola lettura per il catalogo con «Personalizza i muscoli» che crea una variante, l'editor e
  // «Unisci in…» per i personalizzati, l'approfondimento. Dopo la creazione si arriva qui con &created=1:
  // l'avviso con «Annulla» vive nella pagina della variante, perché l'isola si ricrea a ogni navigazione.
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import Merge from '@lucide/svelte/icons/merge';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import { navigate } from 'astro:transitions/client';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import BodyMap from './BodyMap.svelte';
  import MuscleEditor from './MuscleEditor.svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import Toast from '../ui/Toast.svelte';
  import ExercisePicker, { type PickedExercise } from '../exercises/ExercisePicker.svelte';
  import ProgressChart, { type ChartPoint } from './ProgressChart.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import {
    ArchiveError,
    EPLEY_MAX_REPS,
    MUSCLE_LABELS,
    createVariant,
    ensureExercise,
    exerciseDetails,
    exerciseHistory,
    exerciseName,
    mergeExercise,
    personalRecords,
    pointsInPeriod,
    proposeVariantName,
    reassignExercise,
    setCustomMuscles,
    hasDetails,
    safeSources,
    sortedMuscles,
    MOST_RECRUITED,
    RECRUITED,
    formatShare,
    setNumbers,
    toDateKey,
    undoReassign,
    variantImpact,
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

  // US-48: tab della pagina, nell'URL per i link («Senza muscoli» apre Info) e per il ricaricamento
  type Tab = 'progress' | 'info';
  const TABS: { value: Tab; label: string }[] = [
    { value: 'progress', label: 'Progressi' },
    { value: 'info', label: 'Info' },
  ];
  let tab: Tab = $state(params.get('tab') === 'info' ? 'info' : 'progress');
  function selectTab(next: Tab, focus = false) {
    tab = next;
    const url = new URL(location.href);
    if (next === 'info') url.searchParams.set('tab', 'info');
    else url.searchParams.delete('tab');
    window.history.replaceState(window.history.state, '', url);
    if (focus) document.getElementById(`tab-${next}`)?.focus();
  }
  function tabKeys(event: KeyboardEvent) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    selectTab(event.key === 'Home' || event.key === 'ArrowLeft' ? 'progress' : 'info', true);
  }

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
  // US-50: il punto toccato nel grafico evidenzia la sua riga nella cronologia, senza focus né scorrimento
  let highlighted: string | null = $state(null);

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

  // US-43, US-44: muscoli dell'esercizio (catalogo in sola lettura, personalizzato modificabile)
  const exerciseHref = (id: string) => `${appUrl('/exercise')}?id=${encodeURIComponent(id)}`;
  const details = exerciseDetails(exerciseId);
  const baseMuscles = details?.muscles ?? null;
  const aliases = details?.aliases ?? [];
  const custom = $derived(store.archive.catalog[exerciseId] ?? null);

  let variantOpen = $state(false);
  let variantName = $state('');
  let variantError = $state('');
  const impact = $derived(variantImpact(store.archive, exerciseId));

  // «Unisci in…» di un personalizzato: lo stesso foglio del catalogo, già nella scelta della destinazione
  let mergeOpen = $state(false);
  function mergeHere(absorbedId: string, intoId: string): boolean {
    if (!edit((a) => mergeExercise(a, absorbedId, intoId))) return false;
    mergeOpen = false;
    navigate(exerciseHref(intoId));
    return true;
  }

  function openVariant() {
    variantName = proposeVariantName(store.archive, exerciseId);
    variantError = '';
    variantOpen = true;
  }

  function createVariantHere(event: SubmitEvent) {
    event.preventDefault();
    let id = '';
    try {
      const result = store.update((a) => {
        const created = createVariant(a, exerciseId, variantName);
        id = created.id;
        return created.archive;
      });
      if (!result.ok && result.state !== 'unsaved') {
        toast = { message: result.message ?? 'Modifica non salvata.' };
        return;
      }
    } catch (error) {
      if (!(error instanceof ArchiveError)) throw error;
      // nome già usato o non valido: l'errore sotto il campo, il foglio resta aperto
      variantError = error.message;
      return;
    }
    variantOpen = false;
    navigate(`${exerciseHref(id)}&tab=info&created=1`);
  }

  // appena creata la variante: avviso con «Annulla», una volta sola (il parametro si toglie subito)
  if (params.get('created') === '1') {
    const baseId = custom?.variantOf;
    if (baseId) {
      const routines = variantImpact(store.archive, exerciseId);
      toast = {
        message: `Creato «${name}»${routines ? `, sostituito in ${plural(routines, 'scheda', 'schede')}` : ''}.`,
        action: 'Annulla',
        onaction: () => {
          if (edit((a) => mergeExercise(a, exerciseId, baseId))) navigate(`${exerciseHref(baseId)}&tab=info`);
        },
      };
    }
    const url = new URL(location.href);
    url.searchParams.delete('created');
    window.history.replaceState(window.history.state, '', url);
  }
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

    <div class="tabs" role="tablist" aria-label="Sezioni dell’esercizio">
      {#each TABS as t (t.value)}
        <button
          type="button"
          role="tab"
          id={`tab-${t.value}`}
          class="tab"
          aria-selected={tab === t.value}
          aria-controls={tab === t.value ? `panel-${t.value}` : undefined}
          tabindex={tab === t.value ? 0 : -1}
          onclick={() => selectTab(t.value)}
          onkeydown={tabKeys}>{t.label}</button
        >
      {/each}
    </div>

    {#if tab === 'progress'}
      <div class="panel-tab" role="tabpanel" id="panel-progress" aria-labelledby="tab-progress">
        {#if !history.length}
          <div class="flex flex-col items-start gap-3 py-4">
            <ChartLine size={28} class="text-text-muted" aria-hidden="true" />
            <h3 class="m-0 text-xl leading-snug font-bold">Ancora nessuna serie</h3>
            <p class="m-0 max-w-[60ch] text-text-muted">I progressi compaiono dopo il primo allenamento concluso con almeno una serie spuntata di questo esercizio.</p>
            <a class="btn btn-text info-link" href={`${exerciseHref(exerciseId)}&tab=info`} onclick={(event) => { event.preventDefault(); selectTab('info', true); }}>Muscoli e informazioni</a>
          </div>
        {:else}
          <section aria-labelledby="chart-title" class="section">
            <h3 id="chart-title" class="visually-hidden">{current.title}</h3>
            <div class="controls">
              <SegmentedControl name="metric" label="Misura" options={METRICS} bind:value={metric} compact />
              <SegmentedControl name="period" label="Periodo" options={PERIODS} bind:value={period} compact />
            </div>
            {#if chartPoints.length}
              <ProgressChart points={chartPoints} format={valueText} formatDate={dateText} label={current.title} details={sessionDetails} onpick={(i) => (highlighted = shown[i]?.point.sessionId ?? null)} />
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
                  <li class:highlighted={point.sessionId === highlighted} aria-current={point.sessionId === highlighted ? 'true' : undefined}>
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
    {:else}
      <div class="panel-tab" role="tabpanel" id="panel-info" aria-labelledby="tab-info">
      {#if baseMuscles || custom}
        <section aria-labelledby="muscles-title" class="section">
          <h3 id="muscles-title" class="subtitle">Muscoli</h3>
          {#if custom?.variantOf}
            <a class="based-on" href={`${exerciseHref(custom.variantOf)}&tab=info`}>Basata su {exerciseName(store.archive, custom.variantOf)}</a>
          {/if}
          {#if baseMuscles}
            <BodyMap values={baseMuscles} mode="share" label={`Sagoma: i muscoli di ${name}`} />
          <p class="hint m-0">Quanto conta una serie per ogni gruppo:</p>
            <dl class="muscle-list">
              {#each sortedMuscles(baseMuscles) as { group, value } (group)}
                <div><dt>{MUSCLE_LABELS[group]}:</dt> <dd>{formatShare(value)}</dd></div>
              {/each}
            </dl>
            <button type="button" class="btn btn-secondary personalize" aria-haspopup="dialog" onclick={openVariant}>Personalizza i muscoli</button>
          {:else if custom}
            {#if Object.keys(custom.muscles).length === 0}
              <p class="m-0 max-w-[60ch] text-text-muted">Scegli i muscoli: finché sono vuoti, le serie finiscono in «Senza muscoli» in Progressi.</p>
            {/if}
            {#if Object.keys(custom.muscles).length}
            <BodyMap values={custom.muscles} mode="share" label={`Sagoma: i muscoli di ${name}`} />
          {/if}
          <p class="hint m-0">Un tocco: conta {formatShare(MOST_RECRUITED)}. Due: {formatShare(RECRUITED)}. Tre: nessuna.</p>
            <MuscleEditor muscles={custom.muscles} onchange={(m) => edit((a) => setCustomMuscles(a, exerciseId, m))} />
          {/if}
        </section>
      {/if}
      {#if custom}
        <section aria-labelledby="merge-title" class="section">
          <h3 id="merge-title" class="subtitle">È un doppione?</h3>
          <p class="m-0 max-w-[60ch] text-text-muted">Se è lo stesso esercizio di un altro, uniscilo: allenamenti e schede passano a quello.</p>
          <button type="button" class="btn btn-secondary personalize" aria-haspopup="dialog" onclick={() => (mergeOpen = true)}><Merge size={20} aria-hidden="true" />Unisci in…</button>
        </section>
      {/if}
      <section aria-labelledby="details-title" class="section">
        <h3 id="details-title" class="subtitle">Approfondimento</h3>
        {#if details && aliases.length}
          <p class="m-0 max-w-[60ch]"><span class="text-text-muted">Si chiama anche:</span> {aliases.join(', ')}</p>
        {/if}
        {#if details && hasDetails(details)}
          {#if details.description}<p class="m-0 max-w-[60ch]">{details.description}</p>{/if}
          {#if details.steps.length}
            <ol class="m-0 max-w-[60ch] pl-5">
              {#each details.steps as step, i (i)}<li>{step}</li>{/each}
            </ol>
          {/if}
          {#if details.caution}<p class="m-0 max-w-[60ch]">{details.caution}</p>{/if}
          {#if safeSources(details).length}
            <ul class="m-0 pl-5">
              {#each safeSources(details) as source (source.url)}
                <li><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>
              {/each}
            </ul>
          {/if}
        {:else}
          <p class="m-0 max-w-[60ch] text-text-muted">{custom ? 'È un esercizio personalizzato: non ha un approfondimento.' : 'L’approfondimento di questo esercizio non è ancora disponibile.'}</p>
        {/if}
      </section>
      </div>
    {/if}
  </div>
{/if}

{#if baseMuscles}
  <BottomSheet bind:open={variantOpen} title="Personalizza i muscoli">
    <form id="variant-form" class="variant-form" novalidate onsubmit={createVariantHere}>
      <div>
        <label class="label" for="variant-name">Nome del nuovo esercizio</label>
        <input
          id="variant-name"
          class="field"
          bind:value={variantName}
          oninput={() => (variantError = '')}
          aria-invalid={variantError ? 'true' : undefined}
          aria-describedby={variantError ? 'variant-name-error' : undefined}
        />
        {#if variantError}
          <p class="field-error" id="variant-name-error"><CircleAlert size={16} aria-hidden="true" />{variantError}</p>
        {/if}
      </div>
      <p class="m-0 max-w-[60ch] text-text-muted">
        Crea un esercizio tuo con i muscoli di «{name}», da modificare.
        {#if impact}Lo sostituisce in {plural(impact, 'scheda attiva', 'schede attive')}; gli allenamenti fatti restano su «{name}», e il nuovo esercizio parte senza record né grafico.{:else}Gli allenamenti fatti restano su «{name}», e il nuovo esercizio parte senza record né grafico.{/if}
      </p>
    </form>
    {#snippet footer()}
      <button type="submit" form="variant-form" class="btn btn-primary btn-block">Crea</button>
    {/snippet}
  </BottomSheet>
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

{#if custom}
  <ExercisePicker bind:open={mergeOpen} title="Unisci in…" catalog={store.archive} mergeFrom={{ id: exerciseId, name, aliases: [], custom: true }} onpick={() => {}} onmerge={mergeHere} />
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
  /* tipi di informazione diversi uno sotto l'altro: un filo li separa (DESIGN.md, «La regola del filo») */
  .panel-tab {
    display: flex;
    flex-direction: column;
  }
  .panel-tab > :global(* + *) {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
  }
  /* tab della pagina: come la tab bar, la scelta in inchiostro e grassetto con un filo di 2px sotto */
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-bottom: -0.25rem;
    border-bottom: 1px solid var(--color-border);
  }
  .tab {
    min-height: 48px;
    padding: 0 0.75rem;
    border: 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .tab:hover {
    color: var(--color-text);
  }
  .tab[aria-selected='true'] {
    border-bottom-color: var(--color-text);
    color: var(--color-text);
    font-weight: 700;
  }
  .tab:focus-visible {
    outline: 2px solid var(--color-accent-indicator);
    outline-offset: -2px;
  }
  .info-link {
    margin-left: -0.75rem;
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
  .based-on {
    align-self: flex-start;
    color: var(--color-accent-text);
  }
  .muscle-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0;
  }
  .muscle-list dt {
    display: inline;
    font-size: inherit;
  }
  .muscle-list dd {
    display: inline;
  }
  .personalize {
    align-self: flex-start;
  }
  .variant-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
  /* la riga del punto scelto nel grafico: il bordo dell'indicatore, come l'esercizio corrente */
  .list li.highlighted {
    margin-inline: -0.5rem;
    padding-left: 0.5rem;
    border-radius: var(--radius-field);
    box-shadow: inset 0 0 0 2px var(--color-accent-indicator);
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
