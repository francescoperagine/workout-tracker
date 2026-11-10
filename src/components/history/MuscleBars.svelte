<script lang="ts">
  // Barre orizzontali delle serie per gruppo muscolare (US-45): etichetta e valore scritti, barra proporzionale
  // al valore più alto. HTML e CSS, nessuna libreria; l'elenco è anche la vista accessibile, senza tooltip.
  // Con onselect ogni riga è un pulsante che apre l'andamento del gruppo (US-46).
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { formatSets } from '../../lib/format';

  interface Props {
    rows: readonly { label: string; value: number }[];
    /** tocco su una riga, con il suo indice */
    onselect?: (index: number) => void;
  }

  let { rows, onselect }: Props = $props();
  const max = $derived(Math.max(...rows.map((r) => r.value)));
</script>

<ol class="bars">
  {#each rows as row, i (row.label)}
    {#snippet content()}
      <span class="name">{row.label}</span>
      <span class="value">{formatSets(row.value)}<span class="sr-only">{' serie'}</span></span>
      <span class="bar" style:width="{(row.value / max) * 100}%" aria-hidden="true"></span>
    {/snippet}
    <li>
      {#if onselect}
        <button type="button" class="row pick" aria-label="{row.label}: {formatSets(row.value)} serie, apri l'andamento" onclick={() => onselect(i)}>
          {@render content()}
          <ChevronRight size={16} class="chevron text-text-muted" aria-hidden="true" />
        </button>
      {:else}
        <div class="row">{@render content()}</div>
      {/if}
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
  .bars:has(.pick) {
    gap: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
    align-items: baseline;
  }
  /* pulsante: tutta la riga, almeno 48px, la freccia dopo il valore dice che si apre */
  .pick {
    grid-template-columns: minmax(0, 1fr) auto auto;
    width: 100%;
    min-height: 48px;
    padding: 0.25rem 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .pick :global(.chevron) {
    grid-row: 1;
    grid-column: 3;
    align-self: center;
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
