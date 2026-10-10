<script lang="ts">
  // Conferma di un'azione distruttiva (P8): l'unico caso, con il timer, in cui una modale è giusta.
  // Sostituisce confirm(): il pulsante dice cosa fa, l'annullamento è il default del tasto Esc.
  interface Props {
    aperto: boolean;
    titolo: string;
    testo: string;
    conferma: string;
    pericolo?: boolean;
    onconferma: () => void;
  }

  let { aperto = $bindable(false), titolo, testo, conferma, pericolo = true, onconferma }: Props = $props();

  let dialogo: HTMLDialogElement;
  const id = `dialogo-${Math.random().toString(36).slice(2, 8)}`;

  $effect(() => {
    if (aperto && !dialogo.open) dialogo.showModal();
    else if (!aperto && dialogo.open) dialogo.close();
  });
</script>

<dialog bind:this={dialogo} class="dialogo" aria-labelledby={id} aria-describedby={`${id}-testo`} onclose={() => (aperto = false)}>
  <h2 {id}>{titolo}</h2>
  <p id={`${id}-testo`}>{testo}</p>
  <div class="azioni">
    <button type="button" class="pulsante pulsante-secondario" onclick={() => (aperto = false)}>Annulla</button>
    <button
      type="button"
      class={['pulsante', pericolo ? 'pulsante-pericolo' : 'pulsante-primario']}
      onclick={() => {
        aperto = false;
        onconferma();
      }}
    >
      {conferma}
    </button>
  </div>
</dialog>

<style>
  .dialogo {
    width: calc(100% - 2rem);
    max-width: 28rem;
    padding: 1.5rem;
    border: 1px solid var(--color-linea);
    border-radius: var(--radius-finestra);
    background: var(--color-superficie);
    color: var(--color-testo);
  }
  .dialogo::backdrop {
    background: var(--color-fondale);
  }
  h2 {
    margin: 0 0 0.5rem;
    font-size: var(--text-xl);
    line-height: 1.3;
    font-weight: 700;
  }
  p {
    margin: 0;
    color: var(--color-secondario);
  }
  .azioni {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .azioni > :global(*) {
    flex: 1 1 8rem;
  }
</style>
