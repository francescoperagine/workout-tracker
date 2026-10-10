<script lang="ts">
  // Valore numerico cambiato a passi con due pulsanti da 48px, senza tastiera (P2): il recupero
  // "1:30" non si scrive comodamente col tastierino numerico, che non ha i due punti.
  // Il valore corrente è annunciato con cortesia a ogni cambio.
  interface Props {
    label: string;
    hint?: string;
    value: number;
    min: number;
    max: number;
    step: number;
    /** testo mostrato: 90 → "1:30" */
    format: (value: number) => string;
    /** testo per gli screen reader, se diverso da quello mostrato: 90 → "1 minuto e 30 secondi" */
    speak?: (value: number) => string;
    /** testo dei pulsanti: "−15 s", "+15 s" */
    decrementLabel: string;
    incrementLabel: string;
    onchange?: (value: number) => void;
  }

  let { label, hint, value = $bindable(), min, max, step, format, speak, decrementLabel, incrementLabel, onchange }: Props = $props();
  const id = `stepper-${Math.random().toString(36).slice(2, 8)}`;

  function change(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    value = next;
    onchange?.(next);
  }
</script>

<div class="stepper" role="group" aria-labelledby={id} aria-describedby={hint ? `${id}-hint` : undefined}>
  <span class="label" {id}>{label}</span>
  <div class="controls">
    <button type="button" class="btn btn-secondary" disabled={value <= min} aria-label={`${label}: ${decrementLabel}`} onclick={() => change(-step)}>
      {decrementLabel}
    </button>
    <output class="digits value" aria-live="polite" aria-label={speak ? speak(value) : undefined}>{format(value)}</output>
    <button type="button" class="btn btn-secondary" disabled={value >= max} aria-label={`${label}: ${incrementLabel}`} onclick={() => change(step)}>
      {incrementLabel}
    </button>
  </div>
  {#if hint}<p class="hint" id={`${id}-hint`}>{hint}</p>{/if}
</div>

<style>
  .controls {
    display: grid;
    grid-template-columns: minmax(5.5rem, 1fr) minmax(5rem, 1.2fr) minmax(5.5rem, 1fr);
    align-items: center;
    gap: 0.75rem;
  }
  .value {
    text-align: center;
  }
</style>
