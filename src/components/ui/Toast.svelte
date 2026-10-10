<script lang="ts">
  // Avviso breve sopra le barre in basso, con un'azione facoltativa (tipicamente "Annulla", P4).
  // Sostituisce alert(): non blocca e sparisce da solo.
  import X from '@lucide/svelte/icons/x';

  interface Props {
    messaggio: string | null;
    azione?: string;
    onazione?: () => void;
    onchiudi?: () => void;
    /** millisecondi prima della chiusura automatica */
    durata?: number;
  }

  let { messaggio, azione, onazione, onchiudi, durata = 5000 }: Props = $props();

  $effect(() => {
    if (!messaggio) return;
    const t = setTimeout(() => onchiudi?.(), durata);
    return () => clearTimeout(t);
  });
</script>

<div class="area" role="status" aria-live="polite">
  {#if messaggio}
    <div class="guscio toast">
      <span class="testo">{messaggio}</span>
      {#if azione}
        <button type="button" class="pulsante pulsante-testo" onclick={() => { onazione?.(); onchiudi?.(); }}>{azione}</button>
      {/if}
      <button type="button" class="pulsante pulsante-icona" aria-label="Chiudi avviso" onclick={() => onchiudi?.()}>
        <X size={20} aria-hidden="true" />
      </button>
    </div>
  {/if}
</div>

<style>
  .area {
    position: fixed;
    inset: auto 0 calc(140px + env(safe-area-inset-bottom)) 0;
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
    border: 1px solid var(--color-guscio-linea-forte);
    border-radius: var(--radius-pannello);
    box-shadow: 0 8px 24px var(--color-ombra);
    animation: entra 0.24s var(--ease-uscita);
  }
  .testo {
    flex: 1;
    min-width: 0;
  }
  @keyframes entra {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
</style>
