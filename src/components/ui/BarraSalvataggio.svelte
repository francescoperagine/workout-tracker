<script lang="ts" module>
  export type StatoSalvataggio = 'salvato' | 'salvataggio' | 'errore' | 'conflitto';
</script>

<script lang="ts">
  // Barra fissa in basso con lo stato del salvataggio (US-33, P4) e l'azione principale della schermata.
  import type { Snippet } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';

  interface Props {
    stato: StatoSalvataggio;
    onsalvaora?: () => void;
    onricarica?: () => void;
    /** azione principale a destra (es. "Termina") */
    azione?: Snippet;
  }

  let { stato, onsalvaora, onricarica, azione }: Props = $props();

  const TESTI: Record<StatoSalvataggio, string> = {
    salvato: 'Salvato su questo dispositivo',
    salvataggio: 'Salvataggio…',
    errore: 'Non salvato: spazio esaurito. I dati restano in questa pagina.',
    conflitto: 'Il diario è cambiato in un’altra scheda. Ricarica per non sovrascriverlo.',
  };
</script>

<div class="guscio barra" class:problema={stato === 'errore' || stato === 'conflitto'}>
  <p class="stato" role="status" aria-live="polite">
    {#if stato === 'salvato'}
      <Check size={18} aria-hidden="true" class="icona-ok" />
    {:else if stato === 'salvataggio'}
      <LoaderCircle size={18} aria-hidden="true" class="icona-attesa" />
    {:else}
      <CircleAlert size={18} aria-hidden="true" class="icona-avviso" />
    {/if}
    <span>{TESTI[stato]}</span>
  </p>
  <div class="azioni">
    {#if stato === 'errore'}
      <button type="button" class="pulsante pulsante-secondario" onclick={onsalvaora}>Salva ora</button>
    {:else if stato === 'conflitto'}
      <button type="button" class="pulsante pulsante-secondario" onclick={onricarica}><RefreshCw aria-hidden="true" />Ricarica</button>
    {:else if azione}
      {@render azione()}
    {/if}
  </div>
</div>

<style>
  .barra {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 68px;
    padding: 0.625rem 1rem;
    border-top: 1px solid var(--color-guscio-linea);
  }
  .barra.problema {
    border-top-color: var(--color-guscio-avviso-linea);
  }
  .stato {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.35;
    color: var(--color-guscio-secondario);
  }
  .problema .stato {
    color: var(--color-guscio-avviso);
  }
  .stato :global(svg) {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .stato :global(.icona-ok) {
    color: var(--color-guscio-accento);
  }
  .stato :global(.icona-avviso) {
    color: var(--color-guscio-avviso-icona);
  }
  .stato :global(.icona-attesa) {
    animation: gira 1s linear infinite;
  }
  .azioni {
    flex-shrink: 0;
  }
  @keyframes gira {
    to {
      transform: rotate(360deg);
    }
  }
</style>
