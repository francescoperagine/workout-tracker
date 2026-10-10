<script lang="ts">
  // Foglio dal basso su <dialog> nativo: focus intrappolato, Esc chiude, il focus torna a chi l'ha aperto.
  // Per scelte e consultazioni in linea (catalogo, approfondimento, variante), non per inserire dati (P8).
  import type { Snippet } from 'svelte';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    open: boolean;
    title: string;
    children: Snippet;
    footer?: Snippet;
  }

  let { open = $bindable(false), title, children, footer }: Props = $props();

  let dialog: HTMLDialogElement;
  const id = `sheet-${Math.random().toString(36).slice(2, 8)}`;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function onBackdropClick(event: MouseEvent) {
    if (event.target === dialog) open = false;
  }
</script>

<dialog bind:this={dialog} class="sheet" aria-labelledby={id} onclose={() => (open = false)} onclick={onBackdropClick}>
  <div class="handle" aria-hidden="true"></div>
  <header>
    <h2 {id}>{title}</h2>
    <button type="button" class="btn btn-icon" aria-label="Chiudi" onclick={() => (open = false)}>
      <X size={22} aria-hidden="true" />
    </button>
  </header>
  <div class="body">
    {@render children()}
  </div>
  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</dialog>

<style>
  .sheet {
    margin: auto auto 0;
    width: 100%;
    max-width: 40rem;
    max-height: 85dvh;
    padding: 0 1rem calc(1rem + env(safe-area-inset-bottom));
    border: 1px solid var(--color-line);
    border-bottom: 0;
    border-radius: var(--radius-dialog) var(--radius-dialog) 0 0;
    background: var(--color-surface);
    color: var(--color-foreground);
    overflow: auto;
    overscroll-behavior: contain;
  }
  .sheet[open] {
    display: flex;
    flex-direction: column;
    animation: rise 0.32s var(--ease-out-expo);
  }
  .sheet::backdrop {
    background: var(--color-backdrop);
  }
  .handle {
    width: 40px;
    height: 4px;
    margin: 8px auto 0;
    border-radius: var(--radius-field);
    background: var(--color-line-strong);
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
  .body {
    flex: 1;
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding-top: 1rem;
  }
  @keyframes rise {
    from {
      transform: translateY(24px);
      opacity: 0.6;
    }
  }
</style>
