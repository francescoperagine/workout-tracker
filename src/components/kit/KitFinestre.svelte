<script lang="ts">
  // Foglio dal basso, dialogo di conferma e avviso con "Annulla".
  import Foglio from '../ui/Foglio.svelte';
  import Dialogo from '../ui/Dialogo.svelte';
  import Toast from '../ui/Toast.svelte';

  const varianti = ['Panca piana bilanciere', 'Panca piana manubri', 'Chest press'];
  let foglio = $state(false);
  let dialogo = $state(false);
  let variante = $state(varianti[0]);
  let toast: string | null = $state(null);
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
        <label class="flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-campo)] border border-linea-forte px-3">
          <input type="radio" name="variante" value={v} bind:group={variante} class="size-5" />
          {v}
        </label>
      </li>
    {/each}
  </ul>
  {#snippet piede()}
    <button type="button" class="pulsante pulsante-primario pulsante-ampio" onclick={() => (foglio = false)}>Usa questa variante</button>
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
