<script lang="ts">
  // Campo di testo che salva a ogni battuta (P4): il testo scritto resta com'è mentre il campo ha il
  // focus; fuori dal focus torna al valore salvato (es. normalizzato, o cambiato in un'altra scheda).
  // `oninput` salva e restituisce un messaggio d'errore se il testo non è valido: allora il testo resta
  // visibile con l'errore, e il valore salvato non cambia.
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'oninput' | 'id'> {
    id: string;
    label: string;
    /** valore salvato, come testo da mostrare */
    value: string;
    hint?: string;
    multiline?: boolean;
    oninput: (text: string) => string | void;
  }

  let { id, label, value, hint, multiline = false, oninput, ...rest }: Props = $props();

  let text = $state('');
  let focused = $state(false);
  let error = $state('');
  let element: HTMLInputElement | HTMLTextAreaElement | undefined = $state();

  $effect(() => {
    const saved = value;
    if (!focused && !error) text = saved;
  });

  function handleInput() {
    error = oninput(text) || '';
  }

  export function focus(select = false) {
    element?.focus();
    if (select && element) element.select();
  }

  const describedBy = $derived([error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined);
</script>

<div class="live-field">
  <label class="label" for={id}>{label}</label>
  {#if multiline}
    <textarea
      {id}
      class="field"
      rows="3"
      bind:this={element}
      bind:value={text}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      oninput={handleInput}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
      {...rest as Record<string, unknown>}
    ></textarea>
  {:else}
    <input
      {id}
      class="field"
      type="text"
      autocomplete="off"
      bind:this={element}
      bind:value={text}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      oninput={handleInput}
      onfocus={() => (focused = true)}
      onblur={() => (focused = false)}
      {...rest}
    />
  {/if}
  {#if error}
    <p class="field-error" id={`${id}-error`}>{error}</p>
  {:else if hint}
    <p class="hint" id={`${id}-hint`}>{hint}</p>
  {/if}
</div>

<style>
  .live-field {
    min-width: 0;
  }
  textarea {
    resize: vertical;
    min-height: 5.5rem;
  }
</style>
