<script lang="ts">
  // Maniglia del riordino (US-38) su una lista dimostrativa: stesso gesto e stessa regola dell'allenamento
  // (src/lib/reorder.ts, moveToIndex), senza archivio.
  import { tick } from 'svelte';
  import ReorderHandle from '../ui/ReorderHandle.svelte';
  import { moveToIndex } from '../../lib/archive';
  import { startDrag, unitStyle, type DragState } from '../../lib/reorder';

  let items = $state([
    { id: 'k1', group: null, name: 'Squat bilanciere' },
    { id: 'k2', group: null, name: 'Panca piana bilanciere' },
    { id: 'k3', group: null, name: 'Rematore al cavo basso' },
    { id: 'k4', group: null, name: 'Alzate laterali' },
  ]);
  let drag: DragState | null = $state(null);
  let announcement = $state('');

  function moved(id: string, to: number) {
    items = moveToIndex(items, id, to);
    announcement = `${items[to].name}: posizione ${to + 1} di ${items.length}.`;
  }

  function begin(id: string, event: PointerEvent) {
    const from = items.findIndex((i) => i.id === id);
    drag = { inGroup: false, block: id, view: null };
    startDrag({
      event,
      ready: tick(),
      from,
      units: () => [...document.querySelectorAll<HTMLElement>('#kit-reorder > li')],
      onupdate: (view) => drag && (drag.view = view),
      ondrop: (target) => {
        drag = null;
        if (target !== from) moved(id, target);
      },
      oncancel: () => (drag = null),
    });
  }

  async function step(id: string, direction: -1 | 1) {
    const to = items.findIndex((i) => i.id === id) + direction;
    if (to < 0 || to >= items.length) return;
    moved(id, to);
    await tick();
    document.getElementById(`kit-handle-${id}`)?.focus();
  }
</script>

<ol id="kit-reorder" class="list">
  {#each items as item, i (item.id)}
    {@const unit = unitStyle(drag, i, null)}
    <li class={['panel', 'row', drag && 'shifting', unit.dragged && 'dragged']} style:transform={unit.transform}>
      <ReorderHandle
        id={`kit-handle-${item.id}`}
        label={`Sposta ${item.name}: trascina, o frecce su e giù`}
        onstart={(e) => begin(item.id, e)}
        onstep={(d) => void step(item.id, d)}
      >
        <span class="order" aria-hidden="true">{i + 1}</span>
      </ReorderHandle>
      <span class="font-semibold">{item.name}</span>
    </li>
  {/each}
</ol>
<p class="sr-only" role="status">{announcement}</p>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    gap: 0.5rem;
  }
  .order {
    color: var(--color-accent-text);
    font-size: var(--text-lg);
    font-weight: 700;
  }
  .shifting {
    position: relative;
  }
  @media (prefers-reduced-motion: no-preference) {
    .shifting:not(.dragged) {
      transition: transform 0.18s var(--ease-out-expo);
    }
  }
  .dragged {
    z-index: 2;
    outline: 2px solid var(--color-accent-text);
    outline-offset: 2px;
  }
</style>
