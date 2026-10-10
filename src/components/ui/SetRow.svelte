<script lang="ts" module>
  import type { SetType } from '../../lib/archive/types';
  export type { SetType };
  /** Valori della volta scorsa, già nell'unità scelta; '' se mancano */
  export interface Previous {
    kg: string;
    reps: string;
  }
  /** Cosa fare dopo la spunta: niente, o portare il cursore al campo vuoto */
  export type CheckResult = 'kg' | 'reps' | void;

  /** "40 × 8", "12 rip" (senza peso), "40 kg" (senza ripetizioni) */
  export function formatPrevious(previous: Previous, unit: string): string {
    if (!previous.kg) return `${previous.reps} rip`;
    if (!previous.reps) return `${previous.kg} ${unit}`;
    // spazi sottili unificatori: il precedente sta nella colonna stretta anche a 320px
    return `${previous.kg}\u202f×\u202f${previous.reps}`;
  }
</script>

<script lang="ts">
  // Riga serie, l'unità di lavoro dell'allenamento: tipo/n · precedente · peso · rip · spunta.
  // La riga mostra i valori e passa i gesti a chi la usa, che salva: tocco sull'indice (tipo successivo),
  // tocco sul precedente (lo copia), battute nei campi, spunta. La spunta su una riga vuota conferma il
  // precedente (1 tocco, P1); se manca un valore chi la usa risponde con il campo da compilare.
  import Check from '@lucide/svelte/icons/check';
  import Trophy from '@lucide/svelte/icons/trophy';
  import SetInput from './SetInput.svelte';

  interface Props {
    id?: string;
    /** numero della serie tra quelle che contano (le serie di riscaldamento non hanno numero) */
    number: number;
    type?: SetType;
    previous?: Previous | null;
    kg?: string;
    reps?: string;
    done?: boolean;
    unit?: 'kg' | 'lb';
    /** record di carico battuto con questa serie (US-29) */
    record?: boolean;
    ontype?: () => void;
    oncopy?: () => void;
    onkg?: (text: string) => boolean | void;
    onreps?: (text: string) => boolean | void;
    oncheck?: () => CheckResult;
  }

  let {
    id,
    number,
    type = 'normal',
    previous = null,
    kg = '',
    reps = '',
    done = false,
    unit = 'kg',
    record = false,
    ontype,
    oncopy,
    onkg,
    onreps,
    oncheck,
  }: Props = $props();

  // Testi per l'utente: sigla nel badge e nome nell'etichetta accessibile
  const BADGE: Record<SetType, string> = { normal: '', warmup: 'R', drop: 'D', failure: 'C' };
  const TYPE_NAME: Record<SetType, string> = { normal: 'normale', warmup: 'di riscaldamento', drop: 'drop', failure: 'a cedimento' };

  let kgInput: { focus(): void } | undefined = $state();
  let repsInput: { focus(): void } | undefined = $state();

  const badge = $derived(type === 'normal' ? String(number) : BADGE[type]);
  const setName = $derived(type === 'warmup' ? 'riscaldamento' : `serie ${number}`);

  function check() {
    const missing = oncheck?.();
    if (missing === 'kg') kgInput?.focus();
    else if (missing === 'reps') repsInput?.focus();
  }

  function onkeydown(event: KeyboardEvent, field: 'kg' | 'reps') {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (field === 'kg') repsInput?.focus();
    else (event.currentTarget as HTMLElement).blur();
  }
</script>

<div class="row" class:done {id}>
  <button type="button" class="type" class:special={type !== 'normal'} onclick={ontype} aria-label={`Serie ${TYPE_NAME[type]}: tocca per cambiare tipo`}>
    {badge}
  </button>

  {#if previous}
    <button type="button" class="previous" onclick={oncopy} aria-label={`Copia il precedente: ${formatPrevious(previous, unit)}${record ? '. Record di carico' : ''}`}>
      {#if record}<Trophy size={16} aria-hidden="true" class="record" />{/if}
      <span class="previous-text">{formatPrevious(previous, unit)}</span>
    </button>
  {:else}
    <span class="previous empty">
      {#if record}<Trophy size={16} aria-hidden="true" class="record" /><span class="sr-only">Record di carico. </span>{/if}
      <span aria-label="Nessun precedente">—</span>
    </span>
  {/if}

  <SetInput
    bind:this={kgInput}
    value={kg}
    kind="decimal"
    label={`Peso ${setName}, ${unit}`}
    placeholder={previous?.kg}
    {done}
    oninput={onkg}
    onkeydown={(e) => onkeydown(e, 'kg')}
  />
  <SetInput
    bind:this={repsInput}
    value={reps}
    kind="integer"
    label={`Ripetizioni ${setName}`}
    placeholder={previous?.reps}
    enterkeyhint="done"
    {done}
    oninput={onreps}
    onkeydown={(e) => onkeydown(e, 'reps')}
  />

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
    /* la tastiera e le barre fisse non coprono la riga che si sta compilando */
    scroll-margin-block: 5rem calc(var(--bottom-bars-height) + 1rem);
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
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    min-height: 48px;
    text-align: left;
    color: var(--color-muted);
    font-size: var(--text-base);
    font-variant-numeric: tabular-nums;
  }
  .previous-text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .previous :global(.record) {
    flex-shrink: 0;
    color: var(--color-accent-text);
  }
  button.previous:hover {
    color: var(--color-foreground);
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
