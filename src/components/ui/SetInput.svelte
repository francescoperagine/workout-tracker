<script lang="ts">
  // Campo numerico della riga serie: cifre grandi e tabulari (P3), tastiera numerica,
  // il valore della volta scorsa come segnaposto.
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value'> {
    value: string;
    /** 'decimal' per il peso (accetta la virgola), 'integer' per le ripetizioni */
    kind?: 'decimal' | 'integer';
    label: string;
    done?: boolean;
  }

  let { value = $bindable(''), kind = 'decimal', label, done = false, ...rest }: Props = $props();

  let input: HTMLInputElement;

  export function focus() {
    input.focus();
  }
</script>

<input
  class="set-input"
  class:done
  type="text"
  inputmode={kind === 'decimal' ? 'decimal' : 'numeric'}
  enterkeyhint="next"
  autocomplete="off"
  aria-label={label}
  bind:value
  bind:this={input}
  {...rest}
/>

<style>
  .set-input {
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0 0.125rem;
    border-radius: var(--radius-field);
    border: 1px solid var(--color-line-strong);
    background: var(--color-field);
    color: var(--color-foreground);
    font: inherit;
    /* almeno 20px (P3) anche a 320px di larghezza */
    font-size: clamp(var(--text-xl), 5.6vw, var(--text-digits));
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .set-input::placeholder {
    font-weight: 400;
  }
  .set-input:focus-visible {
    outline-offset: 1px;
    border-color: var(--color-accent-text);
  }
  .set-input.done {
    border-color: transparent;
    background: transparent;
  }
  .set-input.done:focus-visible {
    border-color: var(--color-accent-text);
    background: var(--color-field);
  }
</style>
