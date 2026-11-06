<script lang="ts">
  // Foglio dal basso, dialogo di conferma e avviso con "Annulla".
  import Trash from '@lucide/svelte/icons/trash';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import Toast from '../ui/Toast.svelte';
  import ExercisePicker, { type PickedExercise } from '../exercises/ExercisePicker.svelte';
  import ForgottenSheet from '../workout/ForgottenSheet.svelte';
  import { emptyArchive, mergeExercise, toDateKey, type Archive, type ForgottenSession } from '../../lib/archive';

  const variants = ['Panca piana bilanciere', 'Panca piana manubri', 'Chest press'];
  // demo: in app i suggerimenti vengono dal catalogo
  const catalog = ['Panca inclinata manubri', 'Panca declinata bilanciere', 'Croci ai cavi', 'Piegamenti sulle braccia', 'Dip alle parallele'];
  const OTHER = '__other__';
  let sheetOpen = $state(false);
  let dialogOpen = $state(false);
  let variant = $state(variants[0]);
  let choice = $state(variants[0]);
  let other = $state('');
  let otherInput: HTMLInputElement | undefined = $state();
  let toast: string | null = $state(null);
  // foglio del catalogo dell'editor delle schede: un archivio finto con un doppione da unire (US-35)
  let pickerOpen = $state(false);
  let kitArchive: Archive = $state.raw({
    ...emptyArchive(),
    catalog: { 'custom-romanian-deadlift': { id: 'custom-romanian-deadlift', name: 'Romanian deadlift' } },
  });
  let picked = $state('');
  // allenamento dimenticato (US-41): ultima serie ieri alle 17:42, o nessuna serie
  let forgottenOpen = $state(false);
  let forgotten: ForgottenSession | null = $state(null);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(17, 42, 0, 0);
  const openForgotten = (lastSet: boolean) => {
    forgotten = { at: yesterday.getTime(), lastSet };
    forgottenOpen = true;
  };
  const describe = (p: PickedExercise) => (p.kind === 'new' ? `nuovo «${p.name}»` : p.id);

  const suggestions = $derived(
    other.trim().length < 2
      ? []
      : catalog.filter((n) => n.toLowerCase().includes(other.trim().toLowerCase()) && n.toLowerCase() !== other.trim().toLowerCase()).slice(0, 3),
  );
  const ready = $derived(choice !== OTHER || other.trim().length > 0);

  $effect(() => {
    if (choice === OTHER) otherInput?.focus();
  });

  function apply() {
    variant = choice === OTHER ? other.trim() : choice;
    sheetOpen = false;
  }
</script>

<div class="flex flex-wrap gap-3">
  <button type="button" class="btn btn-secondary" onclick={() => (sheetOpen = true)}>Cambia variante</button>
  <button type="button" class="btn btn-danger" onclick={() => (dialogOpen = true)}><Trash aria-hidden="true" />Elimina sessione</button>
  <button type="button" class="btn btn-secondary" onclick={() => (toast = 'Serie 3 rimossa')}>Rimuovi serie</button>
  <button type="button" class="btn btn-secondary" onclick={() => (pickerOpen = true)}>Aggiungi esercizio</button>
  <button type="button" class="btn btn-secondary" onclick={() => openForgotten(true)}>Allenamento dimenticato</button>
  <button type="button" class="btn btn-secondary" onclick={() => openForgotten(false)}>Dimenticato, senza serie</button>
</div>
<p class="hint">Variante scelta: {variant}{picked ? ` · esercizio: ${picked}` : ''}</p>

<ExercisePicker bind:open={pickerOpen} title="Aggiungi esercizio" catalog={kitArchive}
  onpick={(p) => (picked = describe(p))}
  onmerge={(from, to) => {
    kitArchive = mergeExercise(kitArchive, from, to);
    return true;
  }}
/>

<!-- con onback il foglio ha «Torna al menu» a sinistra del titolo: nell'app riapre il menu ⋯ dell'esercizio, qui chiude -->
<BottomSheet bind:open={sheetOpen} title="Cambia variante" onback={() => (sheetOpen = false)}>
  <p class="mb-3 text-text-muted">Se la macchina è occupata. «Precedente» e record seguiranno la variante scelta.</p>
  <ul class="flex flex-col gap-2">
    {#each variants as v (v)}
      <li>
        <label class="choice">
          <input type="radio" name="variant" value={v} bind:group={choice} class="radio" />
          {v}
        </label>
      </li>
    {/each}
    <li>
      <label class="choice">
        <input type="radio" name="variant" value={OTHER} bind:group={choice} class="radio" />
        Altro esercizio…
      </label>
      {#if choice === OTHER}
        <div class="mt-2">
          <label class="label" for="variant-other">Che esercizio hai fatto al posto di quello previsto?</label>
          <input
            id="variant-other"
            class="field"
            bind:this={otherInput}
            bind:value={other}
            maxlength="80"
            autocomplete="off"
            enterkeyhint="done"
            placeholder="Es. Panca inclinata manubri"
            onkeydown={(e) => e.key === 'Enter' && ready && apply()}
          />
          {#if suggestions.length}
            <div class="mt-1 flex flex-wrap gap-x-3">
              {#each suggestions as s (s)}
                <button type="button" class="btn btn-text" onclick={() => (other = s)}>{s}</button>
              {/each}
            </div>
          {/if}
          <p class="hint">Vale solo per oggi: la scheda non cambia. Il nome resta nel catalogo, così la prossima volta ritrovi il precedente.</p>
        </div>
      {/if}
    </li>
  </ul>
  {#snippet footer()}
    <button type="button" class="btn btn-primary btn-block" disabled={!ready} onclick={apply}>Usa questa variante</button>
  {/snippet}
</BottomSheet>

<ConfirmDialog
  bind:open={dialogOpen}
  title="Eliminare la sessione del 9 ottobre?"
  text="Spariscono 8 esercizi e 24 serie. Non si può annullare: se vuoi tenerne una copia, esporta prima un backup."
  confirmLabel="Elimina sessione"
  onconfirm={() => (toast = 'Sessione eliminata (demo: nessun dato toccato)')}
/>

<ForgottenSheet
  bind:open={forgottenOpen}
  {forgotten}
  today={toDateKey(new Date())}
  onfinish={() => (toast = 'Terminato all’ora dell’ultima serie (demo: nessun dato toccato)')}
  ondiscard={() => (toast = 'Allenamento annullato (demo: nessun dato toccato)')}
/>

<Toast message={toast} action={toast?.startsWith('Serie') ? 'Annulla' : undefined} onaction={() => {}} onclose={() => (toast = null)} />
