<script lang="ts" generics="T extends string">
  // Controllo segmentato (radiogroup nativo): una scelta tra poche opzioni sempre visibili.
  interface Props {
    name: string;
    label: string;
    options: readonly { value: T; label: string }[];
    value: T;
    onchange?: (value: T) => void;
  }

  let { name, label, options, value = $bindable(), onchange }: Props = $props();
</script>

<fieldset class="segmented">
  <legend class="label">{label}</legend>
  <div class="options">
    {#each options as option (option.value)}
      <label class:active={value === option.value}>
        <input type="radio" {name} value={option.value} bind:group={value} onchange={() => onchange?.(option.value)} />
        {option.label}
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
</style>
