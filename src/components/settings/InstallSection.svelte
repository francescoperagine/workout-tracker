<script lang="ts">
  // Installazione sulla schermata Home (US-03): stato e azione, mai una richiesta all'avvio.
  // Dove il browser lo permette, "Installa l'app" mostra la sua richiesta; su iPhone si spiega il percorso a mano.
  import { onMount } from 'svelte';
  import { INSTALL_EVENT, canPromptInstall, promptInstall } from '../../lib/pwa';
  import { isIos, isStandalone } from '../../lib/device';

  let installed = $state(false);
  let canPrompt = $state(false);
  let ios = $state(false);

  onMount(() => {
    const refresh = () => {
      installed = isStandalone();
      canPrompt = canPromptInstall();
    };
    ios = isIos();
    refresh();
    window.addEventListener(INSTALL_EVENT, refresh);
    return () => window.removeEventListener(INSTALL_EVENT, refresh);
  });
</script>

<section aria-labelledby="s-app" class="flex flex-col gap-3">
  <h2 id="s-app" class="section-title">App sul telefono</h2>
  <div class="panel flex flex-col gap-3">
    {#if installed}
      <p class="m-0">BodyTracker è installata su questo dispositivo e funziona anche senza rete.</p>
    {:else}
      <p class="m-0">
        Installata sulla schermata Home, BodyTracker si apre come un’app, a tutto schermo, e funziona anche senza rete.
      </p>
      {#if canPrompt}
        <button type="button" class="btn btn-secondary self-start" onclick={() => promptInstall()}>Installa l’app</button>
      {:else if ios}
        <p class="m-0 text-muted">In Safari tocca Condividi, poi «Aggiungi alla schermata Home».</p>
      {:else}
        <p class="m-0 text-muted">Dal menu del browser scegli «Installa app» o «Aggiungi alla schermata Home».</p>
      {/if}
    {/if}
  </div>
</section>

<style>
  p {
    max-width: 56ch;
  }
  /* titolo di sezione nel contenuto: "Titolo pagina" di DESIGN.md */
  .section-title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
  }
</style>
