<script lang="ts">
  // Avviso breve sopra le barre in basso, con un'azione facoltativa (tipicamente "Annulla", P4).
  // Sostituisce alert(): non blocca e sparisce da solo.
  import X from '@lucide/svelte/icons/x';

  interface Props {
    message: string | null;
    action?: string;
    onaction?: () => void;
    onclose?: () => void;
    /** millisecondi prima della chiusura automatica */
    duration?: number;
  }

  let { message, action, onaction, onclose, duration = 5000 }: Props = $props();

  $effect(() => {
    if (!message) return;
    const t = setTimeout(() => onclose?.(), duration);
    return () => clearTimeout(t);
  });
</script>

<div class="area" role="status" aria-live="polite">
  {#if message}
    <div class="shell toast">
      <span class="text">{message}</span>
      {#if action}
        <button type="button" class="btn btn-text" onclick={() => { onaction?.(); onclose?.(); }}>{action}</button>
      {/if}
      <button type="button" class="btn btn-icon" aria-label="Chiudi avviso" onclick={() => onclose?.()}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  {/if}
</div>

<style>
  .area {
    position: fixed;
    /* sopra le barre in basso della pagina, che ne dichiara l'altezza in --bottom-bars-height */
    inset: auto 0 calc(var(--bottom-bars-height) + 0.75rem + env(safe-area-inset-bottom)) 0;
    z-index: 40;
    display: flex;
    justify-content: center;
    padding: 0 1rem;
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: min(100%, 32rem);
    min-height: 56px;
    padding: 0.25rem 0.25rem 0.25rem 1rem;
    border: 1px solid var(--color-shell-line-strong);
    border-radius: var(--radius-panel);
    box-shadow: 0 8px 24px var(--color-shadow);
    animation: enter 0.24s var(--ease-out-expo);
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
