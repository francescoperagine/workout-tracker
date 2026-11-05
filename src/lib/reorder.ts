// Riordino con il trascinamento (US-38), senza librerie: Pointer Events sulla maniglia
// (ReorderHandle.svelte), condiviso da allenamento e editor della scheda. Le funzioni pure sono in cima
// (reorder.test.ts); `startDrag` è la parte che tocca il DOM, provata dagli e2e e sul telefono.

/**
 * Posto di rilascio: quante altre unità hanno il centro sopra il puntatore. `centers` sono i centri delle
 * unità nell'ordine di partenza, misurati all'inizio (coordinate del documento): restano fermi durante
 * il gesto, così il posto non oscilla mentre le righe scorrono.
 */
export function dropIndex(centers: readonly number[], from: number, y: number): number {
  return centers.filter((c, i) => i !== from && c < y).length;
}

/** Spostamento verticale di un'unità che non si trascina: fa posto a quella trascinata (`size` = sua altezza più lo spazio) */
export function shiftFor(index: number, from: number, target: number, size: number): number {
  if (index === from) return 0;
  if (from < target && index > from && index <= target) return -size;
  if (from > target && index >= target && index < from) return size;
  return 0;
}

/** Scorrimento automatico ai bordi: pixel per fotogramma, negativo verso l'alto, 0 fuori dalle fasce */
export function edgeSpeed(y: number, top: number, bottom: number, zone = 72, max = 18): number {
  if (y < top + zone) return -Math.round(max * Math.min(1, (top + zone - y) / zone));
  if (y > bottom - zone) return Math.round(max * Math.min(1, (y - (bottom - zone)) / zone));
  return 0;
}

export interface DragView {
  from: number;
  target: number;
  /** traslazione dell'unità trascinata, in px */
  offset: number;
  /** quanto si spostano le altre per farle posto */
  size: number;
}

/** Gesto in corso, dal punto di vista della lista: `block` è il primo id del blocco della voce trascinata */
export interface DragState {
  inGroup: boolean;
  block: string;
  view: DragView | null;
}

/**
 * Traslazione e stato di un'unità durante il gesto. `block` = null per un blocco della lista, altrimenti il
 * primo id del blocco di cui l'unità è una voce (solo le voci di quella superserie si muovono).
 */
export function unitStyle(drag: DragState | null, index: number, block: string | null): { transform: string | undefined; dragged: boolean } {
  const view = drag?.view;
  const mine = !!drag && (block === null ? !drag.inGroup : drag.inGroup && drag.block === block);
  if (!view || !mine) return { transform: undefined, dragged: false };
  const y = index === view.from ? view.offset : shiftFor(index, view.from, view.target, view.size);
  return { transform: y ? `translateY(${y}px)` : undefined, dragged: index === view.from };
}

interface DragOptions {
  event: PointerEvent;
  /** si risolve quando la lista è passata alle righe compatte (tick di Svelte) */
  ready: Promise<unknown>;
  /** gli elementi delle unità tra cui si muove, nell'ordine, a lista compatta */
  units: () => HTMLElement[];
  from: number;
  onupdate: (view: DragView) => void;
  ondrop: (target: number) => void;
  oncancel: () => void;
}

/** Fascia della pagina libera da intestazione e barre fisse, per lo scorrimento automatico */
function viewportBand(): { top: number; bottom: number } {
  const header = document.querySelector('header');
  const bars = parseFloat(getComputedStyle(document.body).getPropertyValue('--bottom-bars-height')) || 0;
  return { top: header ? Math.max(0, header.getBoundingClientRect().bottom) : 0, bottom: window.innerHeight - bars };
}

/**
 * Gesto di trascinamento dalla maniglia. Dopo `ready` (lista compatta) misura le unità e fa scorrere la
 * pagina così che l'unità trascinata stia sotto il dito: il layout cambia sotto il puntatore e l'offset
 * si ricalcola da lì. Rilascio → `ondrop` (anche sullo stesso posto: chi chiama non salva nulla);
 * `Esc` o `pointercancel` → `oncancel`. Ascolta su `window`: la maniglia premuta sparisce con la lista
 * compatta e le righe ne hanno un'altra.
 */
export function startDrag({ event, ready, units, from, onupdate, ondrop, oncancel }: DragOptions): void {
  const pointerId = event.pointerId;
  let clientY = event.clientY;
  let centers: number[] | null = null;
  let size = 0;
  let target = from;
  let frame = 0;
  let done = false;

  const update = () => {
    if (!centers) return;
    const y = clientY + window.scrollY;
    target = dropIndex(centers, from, y);
    onupdate({ from, target, offset: y - centers[from], size });
  };

  const loop = () => {
    const band = viewportBand();
    const speed = edgeSpeed(clientY, band.top, band.bottom);
    if (speed) {
      window.scrollBy(0, speed);
      update();
    }
    frame = requestAnimationFrame(loop);
  };

  const finish = (drop: boolean) => {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', onKey, true);
    document.documentElement.classList.remove('reorder-dragging');
    if (drop && centers) ondrop(target);
    else oncancel();
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    e.preventDefault();
    clientY = e.clientY;
    update();
  };
  const onUp = (e: PointerEvent) => e.pointerId === pointerId && finish(true);
  const onCancel = (e: PointerEvent) => e.pointerId === pointerId && finish(false);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    finish(false);
  };

  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  window.addEventListener('keydown', onKey, true);
  document.documentElement.classList.add('reorder-dragging');

  void ready.then(() => {
    if (done) return;
    const elements = units();
    const rects = elements.map((el) => el.getBoundingClientRect());
    if (!rects[from]) return finish(false);
    centers = rects.map((r) => r.top + r.height / 2 + window.scrollY);
    const next = rects[from + 1] ?? rects[from - 1];
    const gap = next ? Math.max(0, next.top > rects[from].top ? next.top - rects[from].bottom : rects[from].top - next.bottom) : 0;
    size = rects[from].height + gap;
    // ancoraggio: la riga compatta torna sotto il dito, il resto lo fa la traslazione
    window.scrollBy(0, rects[from].top + rects[from].height / 2 - clientY);
    update();
    frame = requestAnimationFrame(loop);
  });
}
