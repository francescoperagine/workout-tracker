<script lang="ts">
  // Grafico a linea dei progressi (US-28) in SVG scritto a mano, secondo la skill dataviz: una serie
  // sola nel colore d'accento (niente legenda, il titolo dice cosa mostra), linea di 2px, punti con
  // l'anello del colore del fondo, griglia sottile e asse dei tempi per data. Tocco, puntatore
  // e frecce scelgono il punto più vicino; il valore si legge sopra il grafico, e gli stessi valori
  // sono nella cronologia sotto (il grafico non è l'unico modo di leggerli).
  import { fromDateKey } from '../../lib/archive';

  export interface ChartPoint {
    /** YYYY-MM-DD */
    date: string;
    /** già nell'unità scelta */
    value: number;
  }

  interface Props {
    points: readonly ChartPoint[];
    /** testo di un valore ("62,5 kg") */
    format: (value: number) => string;
    /** testo di una data ("3 ottobre") */
    formatDate: (date: string) => string;
    /** cosa mostra, per lo screen reader ("Carico massimo per allenamento") */
    label: string;
  }

  let { points, format, formatDate, label }: Props = $props();

  const HEIGHT = 200;
  const PAD = { top: 12, right: 12, bottom: 28, left: 48 };

  let width = $state(0);
  /** punto scelto; null = l'ultimo */
  let picked: number | null = $state(null);
  const selected = $derived(points.length ? Math.min(picked ?? points.length - 1, points.length - 1) : -1);

  // un nuovo periodo o una nuova misura ripartono dall'ultimo punto
  $effect(() => {
    void points;
    picked = null;
  });

  /** Passo "rotondo" (1, 2, 2,5, 5 × 10^k) per circa tre intervalli */
  function niceStep(span: number): number {
    const raw = span / 3;
    const power = 10 ** Math.floor(Math.log10(raw));
    return ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power;
  }

  const scale = $derived.by(() => {
    const values = points.map((p) => p.value);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (min === max) {
      const pad = Math.abs(max) * 0.1 || 1;
      min -= pad;
      max += pad;
    }
    const step = niceStep(max - min);
    const lo = Math.max(0, Math.floor(min / step) * step);
    const hi = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Number(t.toFixed(6)));
    const times = points.map((p) => fromDateKey(p.date).getTime());
    const first = times[0];
    const span = times.at(-1)! - first;
    const plotW = Math.max(0, width - PAD.left - PAD.right);
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const x = (i: number) => PAD.left + (span ? ((times[i] - first) / span) * plotW : plotW / 2);
    const y = (v: number) => PAD.top + plotH - ((v - lo) / (hi - lo)) * plotH;
    return { ticks, x, y };
  });

  const path = $derived(points.map((p, i) => `${i ? 'L' : 'M'}${scale.x(i).toFixed(1)},${scale.y(p.value).toFixed(1)}`).join(''));
  /** con molti punti i pallini diventano rumore: resta solo quello scelto */
  const dots = $derived(points.length <= 40);

  function nearest(clientX: number, svg: SVGSVGElement): number {
    const left = svg.getBoundingClientRect().left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(scale.x(i) - (clientX - left)) < Math.abs(scale.x(best) - (clientX - left))) best = i;
    });
    return best;
  }

  function onpointer(event: PointerEvent) {
    picked = nearest(event.clientX, event.currentTarget as SVGSVGElement);
  }

  function onkeydown(event: KeyboardEvent) {
    const last = points.length - 1;
    const moves: Record<string, number> = { ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: last };
    if (!(event.key in moves)) return;
    event.preventDefault();
    picked = Math.max(0, Math.min(last, moves[event.key]));
  }

  const summary = $derived(
    points.length
      ? `${label}: ${points.length === 1 ? '1 valore' : `${points.length} valori`}, dal ${formatDate(points[0].date)} (${format(points[0].value)}) al ${formatDate(points.at(-1)!.date)} (${format(points.at(-1)!.value)}). Usa le frecce per scorrere i valori.`
      : label,
  );
</script>

{#if points.length}
  <figure class="chart">
    <p class="readout" aria-live="polite">
      <span class="value">{format(points[selected].value)}</span>
      <span class="date">{formatDate(points[selected].date)}</span>
    </p>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="plot" bind:clientWidth={width} tabindex="0" role="group" aria-label={summary} {onkeydown}>
      {#if width}
        <svg {width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true" onpointerdown={onpointer} onpointermove={(e) => e.buttons && onpointer(e)}>
          {#each scale.ticks as tick (tick)}
            <line class="grid" x1={PAD.left} x2={width - PAD.right} y1={scale.y(tick)} y2={scale.y(tick)} />
            <text class="tick" x={PAD.left - 8} y={scale.y(tick)} text-anchor="end" dominant-baseline="middle">{format(tick).replace(/\s.*$/, '')}</text>
          {/each}
          <text class="tick" x={PAD.left} y={HEIGHT - 6} text-anchor={points.length > 1 ? 'start' : 'middle'} dx={points.length > 1 ? 0 : scale.x(0) - PAD.left}>
            {formatDate(points[0].date)}
          </text>
          {#if points.length > 1}
            <text class="tick" x={width - PAD.right} y={HEIGHT - 6} text-anchor="end">{formatDate(points.at(-1)!.date)}</text>
            <line class="cross" x1={scale.x(selected)} x2={scale.x(selected)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />
            <path class="line" d={path} />
          {/if}
          {#each points as point, i (i)}
            {#if dots || i === selected}
              <circle class="dot" class:selected={i === selected} cx={scale.x(i)} cy={scale.y(point.value)} r={i === selected ? 6 : 4} />
            {/if}
          {/each}
        </svg>
      {/if}
    </div>
  </figure>
{/if}

<style>
  .chart {
    margin: 0;
  }
  .readout {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 0.5rem;
    margin: 0 0 0.5rem;
  }
  .value {
    font-size: var(--text-xl);
    font-weight: 700;
  }
  .date {
    color: var(--color-muted);
  }
  .plot {
    min-height: 200px;
    border-radius: var(--radius-field);
    touch-action: pan-y;
  }
  svg {
    display: block;
    overflow: visible;
    cursor: crosshair;
  }
  .grid {
    stroke: var(--color-line);
    stroke-width: 1;
  }
  .cross {
    stroke: var(--color-line-strong);
    stroke-width: 1;
  }
  .tick {
    fill: var(--color-muted);
    font-size: var(--text-xs);
  }
  .line {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .dot {
    fill: var(--color-accent);
    stroke: var(--color-background);
    stroke-width: 2;
  }
</style>
