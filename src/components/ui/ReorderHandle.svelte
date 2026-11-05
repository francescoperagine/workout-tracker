<script lang="ts">
  // Maniglia del riordino (US-38), condivisa da allenamento e editor della scheda: si preme e si trascina
  // (Pointer Events, src/lib/reorder.ts); con il focus Su e Giù spostano di un posto. `touch-action: none`:
  // dalla maniglia non parte lo scorrimento della pagina, dal resto della card sì.
  import type { Snippet } from 'svelte';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';

  interface Props {
    id: string;
    /** es. «Sposta Panca piana: trascina, oppure Su e Giù» */
    label: string;
    onstart: (event: PointerEvent) => void;
    onstep: (direction: -1 | 1) => void;
    /** contenuto accanto all'icona (il numero dell'esercizio) */
    children?: Snippet;
  }

  let { id, label, onstart, onstep, children }: Props = $props();

  function onpointerdown(event: PointerEvent) {
    // solo il tasto principale o il dito; il menu contestuale del tocco lungo non deve partire
    if (event.button !== 0) return;
    event.preventDefault();
    onstart(event);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    onstep(event.key === 'ArrowUp' ? -1 : 1);
  }
</script>

<button type="button" class="reorder-handle" {id} aria-label={label} aria-roledescription="maniglia di riordino" {onpointerdown} {onkeydown} oncontextmenu={(e) => e.preventDefault()}>
  {@render children?.()}
  <GripVertical size={16} aria-hidden="true" class="grip" />
</button>

<style>
  .reorder-handle {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.125rem;
    min-height: 48px;
    padding: 0.25rem 0;
    border: 0;
    border-radius: var(--radius-field);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  /* bersaglio di almeno 44px anche nella colonna stretta del numero */
  .reorder-handle::before {
    content: '';
    position: absolute;
    inset: 0 -0.375rem;
  }
  .reorder-handle :global(.grip) {
    color: var(--color-muted);
  }
  .reorder-handle:hover :global(.grip) {
    color: var(--color-accent-text);
  }
  :global(.reorder-dragging),
  :global(.reorder-dragging *) {
    cursor: grabbing !important;
    user-select: none;
    -webkit-user-select: none;
  }
</style>
