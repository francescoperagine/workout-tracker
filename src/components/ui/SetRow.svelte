<script lang="ts" module>
  import type { SetType } from '../../lib/archive/types';
  export type { SetType };
  export interface Previous {
    kg: string;
    reps: string;
  }
</script>

<script lang="ts">
  // Riga serie, l'unità di lavoro dell'allenamento: tipo/n · precedente · peso · rip · spunta.
  // La spunta su una riga vuota conferma il precedente (1 tocco, P1); senza precedente porta al primo campo vuoto.
  import Check from '@lucide/svelte/icons/check';
  import SetInput from './SetInput.svelte';

  interface Props {
    /** numero della serie tra quelle che contano (le serie di riscaldamento non hanno numero) */
    number: number;
    type?: SetType;
    previous?: Previous | null;
    kg?: string;
    reps?: string;
    done?: boolean;
    unit?: 'kg' | 'lb';
    oncheck?: (done: boolean) => void;
  }

  let {
    number,
    type = $bindable('normal'),
    previous = null,
    kg = $bindable(''),
    reps = $bindable(''),
    done = $bindable(false),
    unit = 'kg',
    oncheck,
  }: Props = $props();

  const CYCLE: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
  // Testi per l'utente: sigla nel badge e nome nell'etichetta accessibile
  const BADGE: Record<SetType, string> = { normal: '', warmup: 'R', drop: 'D', failure: 'C' };
  const TYPE_NAME: Record<SetType, string> = { normal: 'normale', warmup: 'di riscaldamento', drop: 'drop', failure: 'a cedimento' };

  let kgInput: { focus(): void } | undefined = $state();
  let repsInput: { focus(): void } | undefined = $state();

  const badge = $derived(type === 'normal' ? String(number) : BADGE[type]);
  const setName = $derived(type === 'warmup' ? 'riscaldamento' : `serie ${number}`);

  function cycleType() {
    type = CYCLE[(CYCLE.indexOf(type) + 1) % CYCLE.length];
  }

  function copyPrevious() {
    if (!previous) return;
    kg = previous.kg;
    reps = previous.reps;
  }

  function check() {
    if (done) {
      done = false;
      oncheck?.(false);
      return;
    }
    if (previous) {
      if (!kg) kg = previous.kg;
      if (!reps) reps = previous.reps;
    }
    if (!kg) return kgInput?.focus();
    if (!reps) return repsInput?.focus();
    done = true;
    oncheck?.(true);
  }
</script>

<div class="row" class:done>
  <button
    type="button"
    class="type"
    class:special={type !== 'normal'}
    onclick={cycleType}
    aria-label={`Serie ${TYPE_NAME[type]}: tocca per cambiare tipo`}
  >
    {badge}
  </button>

  {#if previous}
    <button type="button" class="previous" onclick={copyPrevious} aria-label={`Copia il precedente: ${previous.kg} ${unit} per ${previous.reps}`}>
      {previous.kg} × {previous.reps}
    </button>
  {:else}
    <span class="previous empty" aria-label="Nessun precedente">—</span>
  {/if}

  <SetInput bind:value={kg} bind:this={kgInput} kind="decimal" label={`Peso ${setName}, ${unit}`} placeholder={previous?.kg} {done} />
  <SetInput bind:value={reps} bind:this={repsInput} kind="integer" label={`Ripetizioni ${setName}`} placeholder={previous?.reps} {done} />

  <button type="button" class="check" onclick={check} aria-pressed={done} aria-label={done ? `Annulla ${setName}` : `Segna ${setName} come fatta`}>
    <Check size={22} strokeWidth={done ? 2.75 : 2} aria-hidden="true" />
  </button>
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 2rem minmax(3.75rem, 1fr) minmax(3.25rem, 4.75rem) minmax(3rem, 4rem) 3rem;
    gap: clamp(0.25rem, 1.6vw, 0.5rem);
    align-items: center;
    min-height: 56px;
    margin-inline: -0.375rem;
    padding-inline: 0.375rem;
    border-radius: var(--radius-field);
    transition: background-color 0.2s var(--ease-out-expo);
  }
  .row.done {
    background: var(--color-done);
  }
  .type {
    height: 48px;
    border-radius: var(--radius-field);
    font-weight: 650;
    font-size: var(--text-lg);
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
  }
  .type.special {
    color: var(--color-accent-text);
  }
  .done .type {
    color: var(--color-accent-text);
  }
  .previous {
    min-height: 48px;
    text-align: left;
    color: var(--color-muted);
    font-size: var(--text-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
  }
  button.previous:hover {
    color: var(--color-foreground);
  }
  .previous.empty {
    display: flex;
    align-items: center;
  }
  .check {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-field);
    border: 1.5px solid var(--color-line-strong);
    color: var(--color-muted);
    transition: background-color 0.15s var(--ease-out-expo), border-color 0.15s var(--ease-out-expo);
  }
  .check:hover {
    border-color: var(--color-accent-text);
    color: var(--color-accent-text);
  }
  .done .check {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-on-accent);
  }
  button {
    cursor: pointer;
  }
  button:focus-visible {
    outline-offset: 1px;
  }
</style>
