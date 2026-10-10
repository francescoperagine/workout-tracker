<script lang="ts">
  // Foglio dal basso su <dialog> nativo: focus intrappolato, Esc chiude, il focus torna a chi l'ha aperto.
  // Per scelte e consultazioni in linea (catalogo, approfondimento, variante), non per inserire dati (P8).
  import type { Snippet } from 'svelte';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    aperto: boolean;
    titolo: string;
    children: Snippet;
    piede?: Snippet;
  }

  let { aperto = $bindable(false), titolo, children, piede }: Props = $props();

  let dialogo: HTMLDialogElement;
  const id = `foglio-${Math.random().toString(36).slice(2, 8)}`;

  $effect(() => {
    if (aperto && !dialogo.open) dialogo.showModal();
    else if (!aperto && dialogo.open) dialogo.close();
  });

  function clicSulFondale(evento: MouseEvent) {
    if (evento.target === dialogo) aperto = false;
  }
</script>

<dialog bind:this={dialogo} class="foglio" aria-labelledby={id} onclose={() => (aperto = false)} onclick={clicSulFondale}>
  <div class="maniglia" aria-hidden="true"></div>
  <header>
    <h2 {id}>{titolo}</h2>
    <button type="button" class="pulsante pulsante-icona" aria-label="Chiudi" onclick={() => (aperto = false)}>
      <X size={22} aria-hidden="true" />
    </button>
  </header>
  <div class="corpo">
    {@render children()}
  </div>
  {#if piede}
    <footer>{@render piede()}</footer>
  {/if}
</dialog>

<style>
  .foglio {
    margin: auto auto 0;
    width: 100%;
    max-width: 40rem;
    max-height: 85dvh;
    padding: 0 1rem calc(1rem + env(safe-area-inset-bottom));
    border: 1px solid var(--color-linea);
    border-bottom: 0;
    border-radius: var(--radius-finestra) var(--radius-finestra) 0 0;
    background: var(--color-superficie);
    color: var(--color-testo);
    overflow: auto;
    overscroll-behavior: contain;
  }
  .foglio[open] {
    display: flex;
    flex-direction: column;
    animation: sale 0.32s var(--ease-uscita);
  }
  .foglio::backdrop {
    background: var(--color-fondale);
  }
  .maniglia {
    width: 40px;
    height: 4px;
    margin: 8px auto 0;
    border-radius: var(--radius-campo);
    background: var(--color-linea-forte);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0 0.5rem;
  }
  h2 {
    margin: 0;
    font-size: var(--text-xl);
    line-height: 1.3;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .corpo {
    flex: 1;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-top: 1rem;
  }
  @keyframes sale {
    from {
      transform: translateY(24px);
      opacity: 0.6;
    }
  }
</style>
