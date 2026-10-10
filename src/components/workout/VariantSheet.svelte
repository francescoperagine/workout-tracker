<script lang="ts" module>
  export type VariantChoice = { kind: 'existing'; id: string } | { kind: 'new'; name: string };
</script>

<script lang="ts">
  // Macchina occupata (US-14, flusso 3): foglio dal basso con l'esercizio previsto, le alternative
  // della scheda e "Altro esercizio…", un campo per scrivere a mano l'esercizio fatto al posto di
  // quello previsto, con i nomi simili del catalogo come suggerimento. Vale solo per questa sessione.
  import { tick } from 'svelte';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { LIMITS, exerciseName, findByName, isValidExerciseName, suggestExercises, type Archive } from '../../lib/archive';

  interface Props {
    open: boolean;
    catalog: Pick<Archive, 'catalog'>;
    /** esercizio fatto adesso */
    current: string;
    /** esercizio previsto dalla scheda (o quello iniziale) */
    planned: string;
    alternatives: readonly string[];
    onpick: (choice: VariantChoice) => void;
  }

  let { open = $bindable(false), catalog, current, planned, alternatives, onpick }: Props = $props();

  const OTHER = '__other__';
  const uid = Math.random().toString(36).slice(2, 8);
  let choice = $state('');
  let other = $state('');
  let otherInput: HTMLInputElement | undefined = $state();

  const options = $derived([...new Set([planned, ...alternatives, current])]);

  // ogni apertura riparte dall'esercizio di adesso
  $effect(() => {
    if (open) {
      choice = current;
      other = '';
    }
  });

  const typed = $derived(other.trim().replace(/\s+/g, ' '));
  const suggestions = $derived(
    typed.length < 2 ? [] : suggestExercises(catalog, typed, 5).filter((e) => e.name !== typed && !options.includes(e.id)).slice(0, 4),
  );
  const ready = $derived(choice !== OTHER ? choice !== '' : isValidExerciseName(typed));

  async function chooseOther() {
    choice = OTHER;
    await tick();
    otherInput?.focus();
  }

  function apply() {
    if (!ready) return;
    open = false;
    if (choice !== OTHER) return onpick({ kind: 'existing', id: choice });
    const match = findByName(catalog, typed);
    onpick(match ? { kind: 'existing', id: match.id } : { kind: 'new', name: typed });
  }
</script>

<BottomSheet bind:open title="Cambia esercizio">
  <p class="intro">Se la macchina è occupata. Vale solo per oggi: la scheda non cambia, e «precedente» segue l’esercizio scelto.</p>
  <fieldset>
    <legend class="sr-only">Esercizio da fare</legend>
    <ul class="options">
      {#each options as id (id)}
        <li>
          <label class="choice">
            <input type="radio" class="radio" name={`variant-${uid}`} value={id} bind:group={choice} />
            <span class="option-text">
              <span>{exerciseName(catalog, id)}</span>
              {#if id === planned}<span class="tag">previsto</span>{/if}
            </span>
          </label>
        </li>
      {/each}
      <li>
        <label class="choice">
          <input type="radio" class="radio" name={`variant-${uid}`} value={OTHER} bind:group={choice} onchange={chooseOther} />
          Altro esercizio…
        </label>
        {#if choice === OTHER}
          <div class="other">
            <label class="label" for={`variant-other-${uid}`}>Che esercizio fai al posto di quello previsto?</label>
            <input
              id={`variant-other-${uid}`}
              class="field"
              bind:this={otherInput}
              bind:value={other}
              maxlength={LIMITS.exerciseNameLength}
              autocomplete="off"
              autocapitalize="sentences"
              enterkeyhint="done"
              placeholder="Es. Panca inclinata manubri"
              onkeydown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  apply();
                }
              }}
            />
            {#if suggestions.length}
              <div class="suggestions" aria-label="Nomi simili nel catalogo">
                {#each suggestions as s (s.id)}
                  <button type="button" class="btn btn-text" onclick={() => (other = s.name)}>{s.name}</button>
                {/each}
              </div>
            {/if}
            <p class="hint">Un nome nuovo resta nel catalogo come esercizio personalizzato, così la prossima volta ritrovi il precedente.</p>
          </div>
        {/if}
      </li>
    </ul>
  </fieldset>
  {#snippet footer()}
    <button type="button" class="btn btn-primary btn-block" disabled={!ready} onclick={apply}>Usa questo esercizio</button>
  {/snippet}
</BottomSheet>

<style>
  .intro {
    margin: 0 0 0.75rem;
    max-width: 60ch;
    color: var(--color-muted);
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .option-text {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.5rem;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .tag {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .other {
    margin-top: 0.75rem;
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    column-gap: 0.75rem;
    margin-top: 0.25rem;
  }
</style>
