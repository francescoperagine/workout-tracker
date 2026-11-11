<script lang="ts">
  // Muscoli di un esercizio personalizzato (US-43, delavier-catalog D11): un pulsante per gruppo, nell'ordine
  // fisso di MUSCLE_GROUPS; il tocco gira nessuno → MOST_RECRUITED → RECRUITED → nessuno, come MacroFactor.
  // Lo stato si legge come testo sotto il nome e nel nome accessibile («Petto, 1 serie»), non solo dal
  // colore. Ogni tocco chiama onchange con una mappa nuova.
  import { formatShare, MOST_RECRUITED, MUSCLE_GROUPS, MUSCLE_LABELS, RECRUITED, type MuscleGroup, type Muscles } from '../../lib/archive';

  interface Props {
    muscles: Muscles;
    onchange: (muscles: Muscles) => void;
  }

  let { muscles, onchange }: Props = $props();

  function cycle(m: MuscleGroup) {
    const next = { ...muscles };
    if (muscles[m] === undefined) next[m] = MOST_RECRUITED;
    else if (muscles[m] === MOST_RECRUITED) next[m] = RECRUITED;
    else delete next[m];
    onchange(next);
  }
</script>

<ul class="muscles">
  {#each MUSCLE_GROUPS as m (m)}
    {@const value = muscles[m]}
    <li>
      <button
        type="button"
        class="muscle"
        class:full={value === MOST_RECRUITED}
        class:part={value !== undefined && value !== MOST_RECRUITED}
        aria-label={`${MUSCLE_LABELS[m]}, ${value === undefined ? 'nessuna serie' : formatShare(value)}`}
        onclick={() => cycle(m)}
      >
        <span class="name">{MUSCLE_LABELS[m]}</span>
        {#if value !== undefined}<span class="role">{formatShare(value)}</span>{/if}
      </button>
    </li>
  {/each}
</ul>

<style>
  .muscles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(8rem, 100%), 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .muscle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    min-height: 56px;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border-control);
    border-radius: var(--radius-field);
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s var(--ease-out-expo), border-color 0.15s var(--ease-out-expo);
  }
  .muscle:hover {
    background: color-mix(in srgb, var(--color-text) 8%, var(--color-bg));
  }
  .muscle:focus-visible {
    outline: 2px solid var(--color-accent-indicator);
    outline-offset: 3px;
  }
  .name {
    font-weight: 600;
    line-height: 1.25;
  }
  .role {
    font-size: var(--text-sm);
    line-height: 1.25;
  }
  /* una serie intera: pieno d'accento, come il segmento scelto */
  .full,
  .full:hover {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-on-accent);
  }
  /* una parte di serie: bordo in inchiostro raddoppiato, come la riga di scelta selezionata */
  .part {
    border-color: var(--color-text);
    box-shadow: inset 0 0 0 1px var(--color-text);
  }
  @media (prefers-reduced-motion: reduce) {
    .muscle {
      transition: none;
    }
  }
</style>
