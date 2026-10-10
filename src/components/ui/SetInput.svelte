<script lang="ts">
  // Campo numerico della riga serie: cifre grandi e tabulari (P3), tastiera numerica,
  // il valore della volta scorsa come segnaposto. Salva a ogni battuta come LiveField: mentre ha il
  // focus il testo resta com'è, fuori dal focus torna al valore salvato. `oninput` restituisce false
  // se il testo non è un numero valido: allora il campo lo segnala e il valore salvato non cambia.
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'oninput'> {
    /** valore salvato, come testo da mostrare */
    value: string;
    /** 'decimal' per il peso (accetta la virgola), 'integer' per le ripetizioni */
    kind?: 'decimal' | 'integer';
    label: string;
    done?: boolean;
    oninput?: (text: string) => boolean | void;
  }

  let { value, kind = 'decimal', label, done = false, oninput, ...rest }: Props = $props();

  let input: HTMLInputElement;
  let text = $state('');
  let focused = $state(false);
  let invalid = $state(false);

  $effect(() => {
    const saved = value;
    if (!focused) {
      text = saved;
      invalid = false;
    }
  });

  export function focus() {
    input.focus();
  }

  function handleInput() {
    invalid = oninput?.(text) === false;
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
  aria-invalid={invalid ? 'true' : undefined}
  bind:value={text}
  bind:this={input}
  oninput={handleInput}
  onfocus={() => (focused = true)}
  onblur={() => (focused = false)}
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
  .set-input[aria-invalid='true'] {
    border-color: var(--color-danger);
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
