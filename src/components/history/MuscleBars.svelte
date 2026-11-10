<script lang="ts">
  // Barre orizzontali delle serie per gruppo muscolare (US-45): etichetta e valore scritti, barra proporzionale
  // al valore più alto. HTML e CSS, nessuna libreria; l'elenco è anche la vista accessibile, senza tooltip.
  import { formatSets } from '../../lib/format';

  interface Props {
    rows: readonly { label: string; value: number }[];
  }

  let { rows }: Props = $props();
  const max = $derived(Math.max(...rows.map((r) => r.value)));
</script>

<ol class="bars">
  {#each rows as row (row.label)}
    <li>
      <span class="name">{row.label}</span>
      <span class="value">{formatSets(row.value)}<span class="sr-only">{' serie'}</span></span>
      <span class="bar" style:width="{(row.value / max) * 100}%" aria-hidden="true"></span>
    </li>
  {/each}
</ol>

<style>
  .bars {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
    align-items: baseline;
  }
  .name {
    overflow-wrap: anywhere;
  }
  .value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  /* barra sottile ancorata a sinistra, estremo dei dati arrotondato; almeno 4px perché un 0,5 si veda */
  .bar {
    grid-column: 1 / -1;
    min-width: 4px;
    height: 8px;
    border-radius: 0 4px 4px 0;
    background: var(--color-accent-indicator);
  }
</style>
