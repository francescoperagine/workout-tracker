<script lang="ts" generics="T extends string">
  // Controllo segmentato (radiogroup nativo): una scelta tra poche opzioni sempre visibili.
  // `compact`: senza binario e con la legenda solo per lo screen reader, segmenti larghi quanto il testo
  // (bersaglio sempre di 48px, pastiglia visibile più bassa), per i filtri di un grafico. `short` è il testo
  // visibile al posto dell'etichetta ("3M" per "3 mesi"), che resta il nome accessibile del segmento.
  // `inline`: legenda a sinistra e segmenti a destra sulla stessa riga, come un interruttore (Impostazioni).
  interface Props {
    name: string;
    label: string;
    options: readonly { value: T; label: string; short?: string }[];
    value: T;
    compact?: boolean;
    inline?: boolean;
    onchange?: (value: T) => void;
  }

  let { name, label, options, value = $bindable(), compact = false, inline = false, onchange }: Props = $props();
</script>

<fieldset class="segmented" class:compact class:inline>
  <legend class="label">{label}</legend>
  <div class="options">
    {#each options as option (option.value)}
      <label class:active={value === option.value}>
        <input
          type="radio"
          {name}
          value={option.value}
          aria-label={option.short ? option.label : undefined}
          bind:group={value}
          onchange={() => onchange?.(option.value)}
        />
        {#if compact}<span class="chip">{option.short ?? option.label}</span>{:else}{option.short ?? option.label}{/if}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .segmented {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .options {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-panel);
    border: 1px solid var(--color-border-control);
    background: var(--color-bg);
  }
  label {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 48px;
    padding: 0 0.5rem;
    border-radius: var(--radius-field);
    color: var(--color-text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s var(--ease-out-expo), color 0.15s var(--ease-out-expo);
  }
  label:hover {
    color: var(--color-text);
  }
  label.active {
    background: var(--color-accent);
    color: var(--color-on-accent);
  }
  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }
  label:has(input:focus-visible) {
    outline: 2px solid var(--color-accent-indicator);
    outline-offset: 2px;
  }

  /* variante in linea: la legenda flottata smette di essere la legenda "resa" del fieldset e diventa un
     elemento flex; si restringe fino a capo prima di spingere i segmenti su una riga nuova */
  .inline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
  }
  .inline legend {
    color: var(--color-text);
    font-size: var(--text-base);
    float: left;
    flex: 1 1 0;
    padding: 0;
    margin: 0;
    font-weight: 600;
  }
  /* segmenti larghi quanto il testo, così «Sistema Chiaro Scuro» sta accanto alla legenda anche a 320px */
  .inline .options {
    grid-auto-columns: auto;
    margin-left: auto;
  }

  /* variante compatta: niente binario, legenda nascosta alla vista, pastiglia da 32px dentro il bersaglio da 48px */
  .compact legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .compact .options {
    display: flex;
    gap: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
  }
  .compact label {
    padding: 0 0.125rem;
    background: none;
  }
  .compact label.active {
    background: none;
    color: var(--color-on-accent);
  }
  .compact .chip {
    display: grid;
    place-items: center;
    min-height: 2rem;
    padding: 0 0.625rem;
    border-radius: var(--radius-field);
    font-size: var(--text-sm);
    transition: background-color 0.15s var(--ease-out-expo);
  }
  .compact label.active .chip {
    background: var(--color-accent);
  }
  .compact label:has(input:focus-visible) {
    outline: none;
  }
  .compact label:has(input:focus-visible) .chip {
    outline: 2px solid var(--color-accent-indicator);
    outline-offset: 2px;
  }
</style>
