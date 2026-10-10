<script lang="ts">
  // Campo numerico della riga serie: cifre grandi e tabulari (P3), tastiera numerica,
  // il valore della volta scorsa come segnaposto.
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value'> {
    value: string;
    /** 'decimale' per il peso (accetta la virgola), 'intero' per le ripetizioni */
    tipo?: 'decimale' | 'intero';
    etichetta: string;
    fatto?: boolean;
  }

  let { value = $bindable(''), tipo = 'decimale', etichetta, fatto = false, ...resto }: Props = $props();

  let input: HTMLInputElement;

  export function focus() {
    input.focus();
  }
</script>

<input
  class="campo-serie"
  class:fatto
  type="text"
  inputmode={tipo === 'decimale' ? 'decimal' : 'numeric'}
  enterkeyhint="next"
  autocomplete="off"
  aria-label={etichetta}
  bind:value
  bind:this={input}
  {...resto}
/>

<style>
  .campo-serie {
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0 0.125rem;
    border-radius: var(--radius-campo);
    border: 1px solid var(--color-linea-forte);
    background: var(--color-campo);
    color: var(--color-testo);
    font: inherit;
    /* almeno 20px (P3) anche a 320px di larghezza */
    font-size: clamp(var(--text-xl), 5.6vw, var(--text-cifre));
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .campo-serie::placeholder {
    font-weight: 400;
  }
  .campo-serie:focus-visible {
    outline-offset: 1px;
    border-color: var(--color-accento-testo);
  }
  .campo-serie.fatto {
    border-color: transparent;
    background: transparent;
  }
  .campo-serie.fatto:focus-visible {
    border-color: var(--color-accento-testo);
    background: var(--color-campo);
  }
</style>
