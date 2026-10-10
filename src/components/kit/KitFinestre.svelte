<script lang="ts">
  // Foglio dal basso, dialogo di conferma e avviso con "Annulla".
  import Foglio from '../ui/Foglio.svelte';
  import Dialogo from '../ui/Dialogo.svelte';
  import Toast from '../ui/Toast.svelte';

  const varianti = ['Panca piana bilanciere', 'Panca piana manubri', 'Chest press'];
  // demo: in app i suggerimenti vengono dal catalogo
  const catalogo = ['Panca inclinata manubri', 'Panca declinata bilanciere', 'Croci ai cavi', 'Piegamenti sulle braccia', 'Dip alle parallele'];
  const ALTRO = '__altro__';
  let foglio = $state(false);
  let dialogo = $state(false);
  let variante = $state(varianti[0]);
  let scelta = $state(varianti[0]);
  let altro = $state('');
  let campoAltro: HTMLInputElement | undefined = $state();
  let toast: string | null = $state(null);

  const suggerimenti = $derived(
    altro.trim().length < 2
      ? []
      : catalogo.filter((n) => n.toLowerCase().includes(altro.trim().toLowerCase()) && n.toLowerCase() !== altro.trim().toLowerCase()).slice(0, 3),
  );
  const pronta = $derived(scelta !== ALTRO || altro.trim().length > 0);

  $effect(() => {
    if (scelta === ALTRO) campoAltro?.focus();
  });

  function usa() {
    variante = scelta === ALTRO ? altro.trim() : scelta;
    foglio = false;
  }
</script>

<div class="flex flex-wrap gap-3">
  <button type="button" class="pulsante pulsante-secondario" onclick={() => (foglio = true)}>Cambia variante</button>
  <button type="button" class="pulsante pulsante-pericolo" onclick={() => (dialogo = true)}>Elimina sessione</button>
  <button type="button" class="pulsante pulsante-secondario" onclick={() => (toast = 'Serie 3 rimossa')}>Rimuovi serie</button>
</div>
<p class="aiuto">Variante scelta: {variante}</p>

<Foglio bind:aperto={foglio} titolo="Cambia variante">
  <p class="mb-3 text-secondario">Se la macchina è occupata. «Precedente» e record seguiranno la variante scelta.</p>
  <ul class="flex flex-col gap-2">
    {#each varianti as v (v)}
      <li>
        <label class="scelta">
          <input type="radio" name="variante" value={v} bind:group={scelta} class="radio" />
          {v}
        </label>
      </li>
    {/each}
    <li>
      <label class="scelta">
        <input type="radio" name="variante" value={ALTRO} bind:group={scelta} class="radio" />
        Altro esercizio…
      </label>
      {#if scelta === ALTRO}
        <div class="mt-2">
          <label class="etichetta" for="variante-altro">Che esercizio hai fatto al posto di quello previsto?</label>
          <input
            id="variante-altro"
            class="campo"
            bind:this={campoAltro}
            bind:value={altro}
            maxlength="80"
            autocomplete="off"
            enterkeyhint="done"
            placeholder="Es. Panca inclinata manubri"
            onkeydown={(e) => e.key === 'Enter' && pronta && usa()}
          />
          {#if suggerimenti.length}
            <div class="mt-1 flex flex-wrap gap-x-3">
              {#each suggerimenti as s (s)}
                <button type="button" class="pulsante pulsante-testo" onclick={() => (altro = s)}>{s}</button>
              {/each}
            </div>
          {/if}
          <p class="aiuto">Vale solo per oggi: la scheda non cambia. Il nome resta nel catalogo, così la prossima volta ritrovi il precedente.</p>
        </div>
      {/if}
    </li>
  </ul>
  {#snippet piede()}
    <button type="button" class="pulsante pulsante-primario pulsante-ampio" disabled={!pronta} onclick={usa}>Usa questa variante</button>
  {/snippet}
</Foglio>

<Dialogo
  bind:aperto={dialogo}
  titolo="Eliminare la sessione del 9 ottobre?"
  testo="Spariscono 8 esercizi e 24 serie. Non si può annullare: se vuoi tenerne una copia, esporta prima un backup."
  conferma="Elimina sessione"
  onconferma={() => (toast = 'Sessione eliminata (demo: nessun dato toccato)')}
/>

<Toast messaggio={toast} azione={toast?.startsWith('Serie') ? 'Annulla' : undefined} onazione={() => {}} onchiudi={() => (toast = null)} />
