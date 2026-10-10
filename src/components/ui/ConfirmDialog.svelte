<script lang="ts">
  // Conferma di un'azione distruttiva (P8): l'unico caso, con il timer, in cui una modale è giusta.
  // Sostituisce confirm(): il pulsante dice cosa fa, l'annullamento è il default del tasto Esc.
  interface Props {
    open: boolean;
    title: string;
    text: string;
    confirmLabel: string;
    danger?: boolean;
    onconfirm: () => void;
  }

  let { open = $bindable(false), title, text, confirmLabel, danger = true, onconfirm }: Props = $props();

  let dialog: HTMLDialogElement;
  const id = `dialog-${Math.random().toString(36).slice(2, 8)}`;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });
</script>

<dialog bind:this={dialog} class="confirm" aria-labelledby={id} aria-describedby={`${id}-text`} onclose={() => (open = false)}>
  <h2 {id}>{title}</h2>
  <p id={`${id}-text`}>{text}</p>
  <div class="actions">
    <button type="button" class="btn btn-secondary" onclick={() => (open = false)}>Annulla</button>
    <button
      type="button"
      class={['btn', danger ? 'btn-danger' : 'btn-primary']}
      onclick={() => {
        open = false;
        onconfirm();
      }}
    >
      {confirmLabel}
    </button>
  </div>
</dialog>

<style>
  .confirm {
    margin: auto;
    width: calc(100% - 2rem);
    max-width: 28rem;
    padding: 1.5rem;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-dialog);
    background: var(--color-surface);
    color: var(--color-foreground);
  }
  .confirm::backdrop {
    background: var(--color-backdrop);
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: var(--text-xl);
    line-height: 1.3;
    font-weight: 700;
  }
  p {
    margin: 0;
    color: var(--color-muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .actions > :global(*) {
    flex: 1 1 auto;
  }
</style>
