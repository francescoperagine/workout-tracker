<script lang="ts">
  // Sagoma del corpo (delavier-catalog, US-51): le zone dei muscoli di src/data/body-map.ts, davanti e dietro, con un
  // contorno che imita l'inchiostro (bordo `text` mosso da un filtro di rumore). Due usi:
  // - `share` (tab Info): il valore è la quota di una serie, sulla scala giallo → arancione → rosso (ADR-005), con la
  //   legenda scritta dei valori presenti;
  // - `intensity` (Progressi): un colore solo, l'indicatore, più pieno quanto più il gruppo si avvicina al massimo.
  // Con `onselect` ogni gruppo è un pulsante con il suo nome (la prima vista dove compare; nell'altra la zona
  // risponde al tocco ma non è ripetuta per lo screen reader). Il popliteo non si disegna: è profondo.
  import { BODY_VIEWBOX, BODY_VIEWS } from '../../data/body-map';
  import { formatShare, MOST_RECRUITED, RECRUITED, type MuscleGroup } from '../../lib/archive';

  interface Props {
    values: Partial<Record<MuscleGroup, number>>;
    mode: 'share' | 'intensity';
    /** nome della figura per lo screen reader */
    label: string;
    onselect?: (group: MuscleGroup) => void;
    /** nome accessibile del pulsante di un gruppo */
    describe?: (group: MuscleGroup) => string;
  }

  let { values, mode, label, onselect, describe }: Props = $props();

  const filterId = `ink-${Math.random().toString(36).slice(2, 8)}`;
  const max = $derived(Math.max(0, ...Object.values(values).map((v) => v ?? 0)));

  const fill = (group: MuscleGroup) => color(values[group] ?? 0);

  function color(v: number): string {
    if (v <= 0) return 'var(--color-bg)';
    if (mode === 'intensity') return `color-mix(in oklab, var(--color-accent-indicator) ${Math.round(20 + (80 * v) / max)}%, var(--color-bg))`;
    // scala sulla quota: RECRUITED è l'arancione, MOST_RECRUITED il rosso, sotto RECRUITED verso il giallo
    if (v >= MOST_RECRUITED) return 'var(--color-heat-high)';
    if (v >= RECRUITED) return `color-mix(in oklab, var(--color-heat-high) ${Math.round((100 * (v - RECRUITED)) / (MOST_RECRUITED - RECRUITED))}%, var(--color-heat-mid))`;
    return `color-mix(in oklab, var(--color-heat-mid) ${Math.round((100 * v) / RECRUITED)}%, var(--color-heat-low))`;
  }

  /** zone di una vista raggruppate per gruppo, nell'ordine del file; il pulsante sta nella prima vista del gruppo */
  const views = $derived.by(() => {
    const seen = new Set<MuscleGroup>();
    return BODY_VIEWS.map((view) => {
      const groups = new Map<MuscleGroup, string[]>();
      for (const zone of view.zones) groups.set(zone.group, [...(groups.get(zone.group) ?? []), zone.d]);
      return {
        ...view,
        groups: [...groups].map(([group, paths]) => {
          const first = !seen.has(group);
          seen.add(group);
          return { group, paths, focusable: first };
        }),
      };
    });
  });

  const legend = $derived(
    mode === 'share' ? [...new Set(Object.values(values).filter((v): v is number => (v ?? 0) > 0))].sort((a, b) => b - a) : [],
  );

  function onkeydown(event: KeyboardEvent, group: MuscleGroup) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onselect?.(group);
  }
</script>

<figure class="body-map" aria-label={label}>
  <svg class="defs" aria-hidden="true" width="0" height="0">
    <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="5" />
    </filter>
  </svg>
  <div class="views">
    {#each views as view (view.id)}
      <div class="view">
        <svg viewBox={BODY_VIEWBOX} role="group" aria-label={view.label}>
          <g filter={`url(#${filterId})`}>
            {#each view.groups as zone (zone.group)}
              {#if onselect}
                <g
                  class="zone interactive"
                  role={zone.focusable ? 'button' : undefined}
                  tabindex={zone.focusable ? 0 : undefined}
                  aria-label={zone.focusable ? (describe?.(zone.group) ?? zone.group) : undefined}
                  aria-hidden={zone.focusable ? undefined : 'true'}
                  onclick={() => onselect?.(zone.group)}
                  onkeydown={(event) => onkeydown(event, zone.group)}
                >
                  {#each zone.paths as d, i (i)}<path {d} fill={fill(zone.group)} />{/each}
                </g>
              {:else}
                <g class="zone" aria-hidden="true">
                  {#each zone.paths as d, i (i)}<path {d} fill={fill(zone.group)} />{/each}
                </g>
              {/if}
            {/each}
          </g>
        </svg>
        <span class="caption" aria-hidden="true">{view.label}</span>
      </div>
    {/each}
  </div>
  {#if legend.length}
    <figcaption class="legend">
      {#each legend as value (value)}
        <span class="key"><span class="swatch" style:background={color(value)}></span>{formatShare(value)}</span>
      {/each}
    </figcaption>
  {/if}
</figure>

<style>
  .body-map {
    margin: 0;
  }
  .defs {
    position: absolute;
  }
  .views {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    max-width: 22rem;
    margin-inline: auto;
  }
  .view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .view svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .caption {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
  }
  /* contorno a inchiostro: lo stesso per ogni zona, piena o vuota */
  .zone path {
    stroke: var(--color-text);
    stroke-width: 4;
    stroke-linejoin: round;
  }
  .interactive {
    cursor: pointer;
    outline: none;
  }
  .interactive:hover path {
    stroke-width: 7;
  }
  .interactive:focus-visible path {
    stroke: var(--color-accent-indicator);
    stroke-width: 9;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem 1rem;
    margin-top: 0.5rem;
    font-size: var(--text-sm);
  }
  .key {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }
  /* il campione ha il contorno a inchiostro come le zone: il giallo da solo non si vede sul fondo */
  .swatch {
    width: 1rem;
    height: 1rem;
    border: 1px solid var(--color-text);
    border-radius: 3px;
  }
</style>
