<script lang="ts">
  // Interruttore on/off (checkbox nativa con role="switch") su una riga intera da 48px:
  // etichetta e spiegazione a sinistra, interruttore a destra. Per preferenze sì/no (suono, vibrazione).
  interface Props {
    label: string;
    hint?: string;
    checked: boolean;
    disabled?: boolean;
    onchange?: (checked: boolean) => void;
  }

  let { label, hint, checked = $bindable(), disabled = false, onchange }: Props = $props();
  const id = `switch-${Math.random().toString(36).slice(2, 8)}`;
</script>

<label class="row" class:disabled for={id}>
  <span class="text">
    <span class="title">{label}</span>
    {#if hint}<span class="hint-line" id={`${id}-hint`}>{hint}</span>{/if}
  </span>
  <input
    {id}
    type="checkbox"
    role="switch"
    bind:checked
    {disabled}
    aria-describedby={hint ? `${id}-hint` : undefined}
    onchange={() => onchange?.(checked)}
  />
</label>

<style>
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 48px;
    padding: 0.25rem 0;
    cursor: pointer;
  }
  .row.disabled {
    cursor: not-allowed;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title {
    font-weight: 600;
  }
  .hint-line {
    color: var(--color-muted);
    font-size: var(--text-sm);
    line-height: 1.4;
  }
  input {
    appearance: none;
    flex-shrink: 0;
    position: relative;
    width: 52px;
    height: 32px;
    margin: 0;
    border: 1.5px solid var(--color-line-strong);
    border-radius: 16px;
    background: var(--color-field);
    cursor: inherit;
    transition: background-color 0.15s var(--ease-out-expo), border-color 0.15s var(--ease-out-expo);
  }
  input::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background: var(--color-line-strong);
    transition: transform 0.2s var(--ease-out-expo), background-color 0.15s var(--ease-out-expo);
  }
  input:checked {
    border-color: var(--color-accent);
    background: var(--color-accent);
  }
  input:checked::before {
    transform: translateX(20px);
    background: var(--color-on-accent);
  }
  input:disabled {
    opacity: 0.45;
  }
</style>
