// Selezione automatica del contenuto al focus (US-39): toccare kg o ripetizioni e scrivere sostituisce il
// valore, senza cancellarlo prima. Un'azione Svelte (`use:selectOnFocus`) per SetInput e LiveField.
import type { Action } from 'svelte/action';

/**
 * Seleziona tutto al focus, da tocco, mouse o tastiera. Il tocco che dà il focus su Android e iOS può
 * annullare una selezione fatta subito (il cursore va dove si è toccato): si ripete al fotogramma dopo.
 * Con il mouse il `mouseup` che segue il focus la toglierebbe: il primo si scarta. Dopo, un tocco nel
 * campo già attivo mette il cursore dove si vuole.
 */
export const selectOnFocus: Action<HTMLInputElement, boolean | undefined> = (input, enabled = true) => {
  let on = enabled !== false;
  let justFocused = false;

  const select = () => {
    if (document.activeElement === input) input.setSelectionRange(0, input.value.length);
  };
  const onFocus = () => {
    if (!on) return;
    justFocused = true;
    select();
    requestAnimationFrame(select);
  };
  const onMouseUp = (event: MouseEvent) => {
    if (!justFocused) return;
    justFocused = false;
    event.preventDefault();
  };
  const reset = () => (justFocused = false);

  input.addEventListener('focus', onFocus);
  input.addEventListener('mouseup', onMouseUp);
  input.addEventListener('keydown', reset);
  input.addEventListener('blur', reset);
  return {
    update(value) {
      on = value !== false;
    },
    destroy() {
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('mouseup', onMouseUp);
      input.removeEventListener('keydown', reset);
      input.removeEventListener('blur', reset);
    },
  };
};
