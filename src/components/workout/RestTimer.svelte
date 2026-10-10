<script lang="ts">
  // Timer di recupero a tutto schermo (brief src-components-workout-resttimer-svelte, US-21…US-26):
  // lo schermo stesso è la clessidra. Un livello verde scende a scatti di un secondo; negli ultimi 10 s
  // le cifre diventano lime, alla fine tutto lo schermo passa all'accento con "Vai".
  // È una vista: il conteggio arriva da fuori (RestTimerHost, motore in src/lib/rest-timer.ts), qui
  // solo il disegno, i gesti e la finestra modale. Con `preview` disegna lo schermo fermo per /kit.
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import { formatDuration } from '../../lib/format';
  import { REST_STEP } from '../../lib/rest-timer';

  interface Props {
    /** secondi che restano (0 = "Vai") */
    remaining: number;
    /** durata complessiva, in secondi */
    duration: number;
    /** livello che resta, 1 → 0 */
    fraction: number;
    /** prossima serie attesa, es. "Panca piana · serie 2 · 40 kg × 6–8"; null all'ultimo esercizio */
    next?: string | null;
    warmup?: boolean;
    /** secondi dalla fine del recupero, al rientro dopo lo schermo bloccato */
    overFor?: number;
    /** finestra aperta (fuori da /kit) */
    open?: boolean;
    /** solo per /kit: lo schermo fermo in un riquadro */
    preview?: boolean;
    /** testo per lo screen reader, solo alle soglie (P9) */
    announcement?: string;
    onshift?: (seconds: number) => void;
    onskip?: () => void;
    onminimize?: () => void;
  }

  let {
    remaining,
    duration,
    fraction,
    next = null,
    warmup = false,
    overFor = 0,
    open = false,
    preview = false,
    announcement = '',
    onshift,
    onskip,
    onminimize,
  }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  const go = $derived(remaining === 0);
  const final = $derived(remaining > 0 && remaining <= 10);
  const heading = $derived(
    go
      ? overFor >= 5
        ? `Recupero finito da ${formatDuration(overFor)}`
        : 'Recupero finito'
      : `${warmup ? 'Recupero di riscaldamento' : 'Recupero'}\u00a0·\u00a0${formatDuration(duration)}`,
  );

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function onCancel(event: Event) {
    // Esc riduce invece di chiudere: il recupero continua
    event.preventDefault();
    onminimize?.();
  }
</script>

{#snippet screen()}
  <div class="screen" class:go class:final>
    <!-- il livello pieno si ferma sotto l'intestazione, così la linea lime non la attraversa -->
    <div class="level" style:height={`calc(${go ? 0 : fraction} * (100% - 4.5rem))`} aria-hidden="true"></div>
    <div class="head">
      <span>{heading}</span>
      {#if !go}
        <button type="button" class="btn btn-icon" aria-label="Riduci il timer" onclick={onminimize}>
          <Minimize2 size={22} aria-hidden="true" />
        </button>
      {/if}
    </div>
    <div class="center">
      <p class="timer-digits" class:long={remaining >= 600}>
        {#if go}Vai{:else}<span class="sr-only">Mancano</span> {formatDuration(remaining)}{/if}
      </p>
      <p class="next">
        {#if next}
          <span class="next-label">{go ? 'Adesso' : 'Prossima'}</span>
          {next}
        {:else}
          <span class="next-label">Ultimo esercizio</span>
          Quando hai finito, Termina
        {/if}
      </p>
    </div>
    <div class="controls">
      {#if go}
        <button type="button" class="plate wide" onclick={onskip}>Chiudi</button>
      {:else}
        <button type="button" class="plate" onclick={() => onshift?.(-REST_STEP)} aria-label="Togli 15 secondi">−15 s</button>
        <button type="button" class="plate" onclick={() => onshift?.(REST_STEP)} aria-label="Aggiungi 15 secondi">+15 s</button>
        <button type="button" class="plate" onclick={onskip} aria-label="Salta il recupero">Salta</button>
      {/if}
    </div>
    {#if !go}
      <button type="button" class="btn btn-text minimize" onclick={onminimize}>Riduci</button>
    {/if}
    <p class="sr-only" role="status" aria-live="assertive">{announcement}</p>
  </div>
{/snippet}

{#if preview}
  <div
    class="shell frame"
    role="img"
    aria-label={go ? 'Anteprima del timer: recupero finito' : `Anteprima del timer: ${formatDuration(remaining)} restanti`}
    inert
  >
    {@render screen()}
  </div>
{:else}
  <dialog bind:this={dialog} class="shell overlay" aria-label="Recupero" oncancel={onCancel}>
    {#if open}
      {@render screen()}
    {/if}
  </dialog>
{/if}

<style>
  .overlay {
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .overlay::backdrop {
    background: var(--color-shell);
  }
  .frame {
    position: relative;
    height: min(720px, 85dvh);
    border-radius: var(--radius-dialog);
    overflow: hidden;
  }
  .screen {
    position: relative;
    container-type: size;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: max(0.5rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
    overflow: hidden;
    background: var(--color-shell);
    color: var(--color-shell-foreground);
  }
  .level {
    position: absolute;
    inset: auto 0 0;
    background: var(--color-level);
    border-top: 4px solid var(--color-shell-accent);
  }
  /* Ultimi 10 s: le cifre passano all'accento, preludio allo schermo lime di "Vai" */
  .final .timer-digits {
    color: var(--color-shell-accent);
  }
  .screen.go {
    background: var(--color-shell-accent);
    color: var(--color-shell-on-accent);
  }
  .head,
  .center,
  .controls {
    position: relative;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 48px;
    color: var(--color-shell-muted);
  }
  .go .head,
  .go .next-label {
    color: var(--color-shell-on-accent);
  }
  .center {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    text-align: center;
  }
  .timer-digits {
    margin: 0;
    /* "m:ss" largo circa l'80% dello schermo; "mm:ss" un passo sotto */
    font-size: min(44cqw, 30cqh, 16rem);
    line-height: 1;
    font-weight: 650;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .timer-digits.long {
    font-size: min(35cqw, 30cqh, 13rem);
  }
  .next {
    margin: 0 auto;
    max-width: 30ch;
    font-size: var(--text-lg);
    line-height: 1.4;
  }
  .next-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-shell-muted);
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.625rem;
  }
  .plate {
    min-height: 64px;
    border-radius: var(--radius-panel);
    border: 1px solid var(--color-shell-line-strong);
    background: var(--color-shell-panel);
    color: var(--color-shell-foreground);
    font-size: var(--text-xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .plate:hover {
    background: var(--color-shell-panel-hover);
  }
  .minimize {
    position: relative;
    align-self: center;
    margin-top: 0.25rem;
    padding: 0 1.5rem;
    color: var(--color-shell-muted);
  }
  .plate.wide {
    grid-column: 1 / -1;
  }
  .go .plate {
    background: var(--color-shell-on-accent);
    border-color: var(--color-shell-on-accent);
    color: var(--color-shell-accent);
  }
  .go :global(:focus-visible) {
    outline-color: var(--color-shell-on-accent);
  }
  @media (prefers-reduced-motion: reduce) {
    .screen,
    .level {
      transition: none;
    }
  }
</style>
