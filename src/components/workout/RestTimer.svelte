<script lang="ts" module>
  export function formatDuration(seconds: number): string {
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
</script>

<script lang="ts">
  // Timer di recupero a tutto schermo (US-21…23): lo schermo stesso è la clessidra.
  // Un livello verde scende a ogni secondo; alla fine tutto lo schermo passa all'accento con "Vai".
  // Il motore definitivo (istante di fine persistito, wake lock, suono) arriva allo step 7:
  // qui il conto si basa già sull'istante di fine, quindi resta giusto anche se la scheda va in background.
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import Timer from '@lucide/svelte/icons/timer';
  import { untrack } from 'svelte';

  interface Props {
    /** durata impostata, in secondi */
    duration: number;
    /** prossima serie attesa, es. "Panca piana · serie 2 · 40 kg × 6–8"; null all'ultimo esercizio */
    next?: string | null;
    /** true mentre il recupero è in corso (aperto o ridotto) */
    active?: boolean;
    /** solo per /kit: disegna lo schermo fermo, in un riquadro, con questi secondi restanti (0 = "Vai") */
    preview?: number | null;
    /** solo per /kit, con preview: disegna la barra del timer ridotto */
    previewMinimized?: boolean;
    onend?: () => void;
  }

  let { duration, next = null, active = $bindable(false), preview = null, previewMinimized = false, onend }: Props = $props();

  let endAt = $state(0);
  let total = $state(0);
  let now = $state(Date.now());
  let minimized = $state(false);
  let dialog: HTMLDialogElement | undefined = $state();
  let announcement = $state('');
  let lastAnnounced = -1;
  let goTimeout: ReturnType<typeof setTimeout> | undefined;

  const remaining = $derived(preview ?? Math.max(0, Math.ceil((endAt - now) / 1000)));
  const fraction = $derived(preview !== null ? preview / duration : total > 0 ? Math.min(1, remaining / total) : 0);
  const go = $derived(remaining === 0);
  const final = $derived(remaining > 0 && remaining <= 10);

  // Avvio e arresto
  $effect(() => {
    if (preview !== null || !active) return;
    untrack(() => {
      if (endAt !== 0) return;
      endAt = Date.now() + duration * 1000;
      total = duration;
      minimized = false;
      lastAnnounced = -1;
    });
    const interval = setInterval(() => (now = Date.now()), 250);
    const onVisibility = () => (now = Date.now());
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });

  $effect(() => {
    if (active) return;
    endAt = 0;
    clearTimeout(goTimeout);
  });

  // Overlay modale solo quando è attivo e non ridotto
  $effect(() => {
    if (!dialog) return;
    const show = active && !minimized;
    if (show && !dialog.open) dialog.showModal();
    else if (!show && dialog.open) dialog.close();
  });

  // Annunci solo a soglie (P9) e chiusura dopo "Vai"
  $effect(() => {
    if (preview !== null || !active || endAt === 0) return;
    const r = remaining;
    if (r === lastAnnounced) return;
    if (r === 30 || r === 10) announcement = `Mancano ${r} secondi di recupero`;
    if (r === 0) {
      announcement = next ? `Recupero finito. Vai: ${next}` : 'Recupero finito';
      onend?.();
      goTimeout = setTimeout(close, 6000);
    }
    lastAnnounced = r;
  });

  function shift(seconds: number) {
    now = Date.now();
    endAt = Math.max(now, endAt + seconds * 1000);
    const r = Math.ceil((endAt - now) / 1000);
    if (r > total) total = r;
  }

  function close() {
    clearTimeout(goTimeout);
    active = false;
  }

  function onCancel(event: Event) {
    // Esc riduce invece di chiudere: il recupero continua
    event.preventDefault();
    minimized = true;
  }
</script>

{#snippet screen()}
  <div class="screen" class:go class:final>
    <!-- il livello pieno si ferma sotto l'intestazione, così la linea lime non la attraversa -->
    <div class="level" style:height={`calc(${go ? 0 : fraction} * (100% - 4.5rem))`} aria-hidden="true"></div>
    <div class="head">
      <span>Recupero · {formatDuration(duration)}</span>
      <button type="button" class="btn btn-icon" aria-label="Riduci il timer" onclick={() => (minimized = true)}>
        <Minimize2 size={22} aria-hidden="true" />
      </button>
    </div>
    <div class="center">
      <p class="timer-digits" class:long={remaining >= 600} aria-hidden="true">{go ? 'Vai' : formatDuration(remaining)}</p>
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
        <button type="button" class="plate wide" onclick={close}>Chiudi</button>
      {:else}
        <button type="button" class="plate" onclick={() => shift(-15)} aria-label="Togli 15 secondi">−15 s</button>
        <button type="button" class="plate" onclick={() => shift(15)} aria-label="Aggiungi 15 secondi">+15 s</button>
        <button type="button" class="plate" onclick={close}>Salta</button>
      {/if}
    </div>
    {#if !go}
      <button type="button" class="btn btn-text minimize" onclick={() => (minimized = true)}>Riduci</button>
    {/if}
    <p class="sr-only" role="status" aria-live="assertive">{announcement}</p>
  </div>
{/snippet}

{#snippet bar(clickable: boolean)}
  <svelte:element
    this={clickable ? 'button' : 'div'}
    type={clickable ? 'button' : undefined}
    class="shell minimized"
    class:go
    onclick={clickable ? () => (minimized = false) : undefined}
    aria-label={clickable ? `Recupero: ${go ? 'finito' : formatDuration(remaining) + ' restanti'}. Tocca per aprire` : undefined}
  >
    <span class="bar-level" style:width={`${go ? 100 : fraction * 100}%`} aria-hidden="true"></span>
    <Timer size={20} aria-hidden="true" />
    <span class="minimized-digits">{go ? 'Vai' : formatDuration(remaining)}</span>
    <span class="minimized-next">{next ?? 'Ultimo esercizio'}</span>
  </svelte:element>
{/snippet}

{#if preview !== null}
  <div
    class={['shell', previewMinimized ? 'frame-minimized' : 'frame']}
    role="img"
    aria-label={go ? 'Anteprima del timer: recupero finito' : `Anteprima del timer: ${formatDuration(remaining)} restanti`}
    inert
  >
    {#if previewMinimized}
      {@render bar(false)}
    {:else}
      {@render screen()}
    {/if}
  </div>
{:else}
  <dialog bind:this={dialog} class="shell overlay" aria-label="Recupero" oncancel={onCancel}>
    {#if active && !minimized}
      {@render screen()}
    {/if}
  </dialog>
  {#if active && minimized}
    {@render bar(true)}
  {/if}
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
  .frame-minimized {
    border-radius: var(--radius-panel);
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
    color: var(--color-shell-muted);
  }
  .go .head,
  .go .head :global(.btn-icon),
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
  .minimized {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    min-height: 56px;
    padding: 0 1rem;
    border-top: 1px solid var(--color-shell-line);
    overflow: hidden;
    text-align: left;
    cursor: pointer;
  }
  .bar-level {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--color-level);
    border-top: 3px solid var(--color-shell-accent);
  }
  .minimized > :global(*:not(.bar-level)) {
    position: relative;
  }
  .minimized.go {
    background: var(--color-shell-accent);
    color: var(--color-shell-on-accent);
  }
  .minimized.go .bar-level {
    display: none;
  }
  .minimized-digits {
    font-size: var(--text-digits);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .minimized-next {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    color: var(--color-shell-muted);
  }
  .minimized.go .minimized-next {
    color: var(--color-shell-on-accent);
  }
</style>
