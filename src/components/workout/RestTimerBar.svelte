<script lang="ts">
  // Timer di recupero ridotto (US-23, DESIGN.md "Timer di recupero"): barra del guscio alta 56px, il
  // livello avanza in larghezza da sinistra; un tocco riapre lo schermo intero. Sta sopra la barra
  // dell'allenamento e, sulle altre pagine, nella mini-barra (con la freccia per tornare all'allenamento
  // in `trailing`). A fine recupero diventa lime con "Vai".
  import type { Snippet } from 'svelte';
  import Timer from '@lucide/svelte/icons/timer';
  import { formatDuration, speakDuration } from '../../lib/format';

  interface Props {
    remaining: number;
    /** livello che resta, 1 → 0 */
    fraction: number;
    next?: string | null;
    /** solo per /kit: barra ferma, non toccabile */
    preview?: boolean;
    onopen?: () => void;
    /** azione a destra della barra (la freccia della mini-barra) */
    trailing?: Snippet;
  }

  let { remaining, fraction, next = null, preview = false, onopen, trailing }: Props = $props();

  const go = $derived(remaining === 0);
  const nextText = $derived(next ?? 'Ultimo esercizio');
  const label = $derived(
    go ? `Recupero finito. ${next ? `Adesso: ${next}` : 'Ultimo esercizio'}. Tocca per aprire` : `Recupero: ${speakDuration(remaining)}. Prossima: ${nextText}. Tocca per aprire`,
  );
</script>

{#snippet content()}
  <Timer size={20} aria-hidden="true" />
  <span class="digits-bar">{go ? 'Vai' : formatDuration(remaining)}</span>
  <span class="next">{nextText}</span>
{/snippet}

<div
  class={['shell', 'bar', preview && 'preview']}
  class:go
  role={preview ? 'img' : undefined}
  aria-label={preview ? `Anteprima del timer ridotto: ${go ? 'recupero finito' : `${formatDuration(remaining)} restanti`}` : undefined}
  inert={preview}
>
  <span class="bar-level" style:width={`${go ? 100 : fraction * 100}%`} aria-hidden="true"></span>
  {#if preview}
    <div class="main">{@render content()}</div>
  {:else}
    <button type="button" class="main" aria-label={label} onclick={onopen}>{@render content()}</button>
  {/if}
  {@render trailing?.()}
</div>

<style>
  .bar {
    position: relative;
    display: flex;
    align-items: stretch;
    min-height: 56px;
    border-top: 1px solid var(--color-shell-line);
    overflow: hidden;
    color: var(--color-shell-foreground);
  }
  .preview {
    border-radius: var(--radius-panel);
  }
  .bar-level {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--color-level);
    border-top: 3px solid var(--color-shell-accent);
  }
  .bar > :global(*:not(.bar-level)) {
    position: relative;
  }
  .main {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    min-height: 56px;
    padding: 0 1rem;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .main :global(svg) {
    flex-shrink: 0;
  }
  .go {
    background: var(--color-shell-accent);
    color: var(--color-shell-on-accent);
  }
  .go .bar-level {
    display: none;
  }
  .digits-bar {
    font-size: var(--text-digits);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .next {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    color: var(--color-shell-muted);
  }
  .go .next {
    color: var(--color-shell-on-accent);
  }
  .go :global(:focus-visible) {
    outline-color: var(--color-shell-on-accent);
  }
</style>
