<script lang="ts" module>
  export type PickedExercise = { kind: 'existing'; id: string } | { kind: 'new'; name: string };
</script>

<script lang="ts">
  // Scelta di un esercizio dal catalogo, in un foglio dal basso (US-07, US-08, poi US-14 allo step 6).
  // Si cerca scrivendo; un nome che non c'è diventa un esercizio personalizzato con "Crea «…»".
  // Il catalogo di base e quello personale arrivano da src/lib/archive/catalog.ts: nessun nome inventato.
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { availableExercises, findByName, isValidExerciseName, suggestExercises, type Archive } from '../../lib/archive';

  interface Props {
    open: boolean;
    title: string;
    catalog: Pick<Archive, 'catalog'>;
    /** esercizi da non proporre (quello della voce, le alternative già scelte) */
    exclude?: readonly string[];
    onpick: (picked: PickedExercise) => void;
  }

  let { open = $bindable(false), title, catalog, exclude = [], onpick }: Props = $props();

  let query = $state('');
  const searchId = `exercise-search-${Math.random().toString(36).slice(2, 8)}`;

  // ogni apertura riparte da una ricerca vuota
  $effect(() => {
    if (open) query = '';
  });

  const typed = $derived(query.trim().replace(/\s+/g, ' '));
  const results = $derived(
    (typed ? suggestExercises(catalog, typed, 60) : availableExercises(catalog)).filter((e) => !exclude.includes(e.id)),
  );
  /** "Crea «…»" solo se il nome non corrisponde già a un esercizio */
  const canCreate = $derived(typed !== '' && isValidExerciseName(typed) && !findByName(catalog, typed));

  function pick(picked: PickedExercise) {
    open = false;
    onpick(picked);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    // Invio sceglie il primo risultato, oppure crea l'esercizio scritto
    if (results[0]) pick({ kind: 'existing', id: results[0].id });
    else if (canCreate) pick({ kind: 'new', name: typed });
  }
</script>

<BottomSheet bind:open {title}>
  <div class="search">
    <label class="label" for={searchId}>Cerca o scrivi il nome</label>
    <div class="search-box">
      <Search size={20} aria-hidden="true" />
      <!-- svelte-ignore a11y_autofocus: il foglio si apre per cercare, il campo è l'unica cosa da fare -->
      <input
        id={searchId}
        class="field"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        autocapitalize="sentences"
        autofocus
        aria-controls={`${searchId}-results`}
        bind:value={query}
        {onkeydown}
      />
    </div>
  </div>

  <p class="sr-only" role="status">
    {typed ? `${results.length} risultati${canCreate ? `, oppure crea ${typed}` : ''}` : ''}
  </p>

  <ul class="results" id={`${searchId}-results`}>
    {#each results as exercise (exercise.id)}
      <li>
        <button type="button" class="result" onclick={() => pick({ kind: 'existing', id: exercise.id })}>
          <span class="name">{exercise.name}</span>
          {#if exercise.custom}<span class="tag">personalizzato</span>{/if}
        </button>
      </li>
    {/each}
    {#if canCreate}
      <li>
        <button type="button" class="result create" onclick={() => pick({ kind: 'new', name: typed })}>
          <Plus size={20} aria-hidden="true" />
          <span class="name">Crea «{typed}»</span>
          <span class="tag">nuovo esercizio personalizzato</span>
        </button>
      </li>
    {/if}
  </ul>
  {#if typed && !results.length && !canCreate}
    <p class="hint">Nessun esercizio con questo nome.</p>
  {/if}
</BottomSheet>

<style>
  .search {
    position: sticky;
    top: 0;
    z-index: 1;
    padding-bottom: 0.75rem;
    background: var(--color-surface);
  }
  .search-box {
    position: relative;
  }
  .search-box :global(svg) {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    translate: 0 -50%;
    color: var(--color-muted);
    pointer-events: none;
  }
  .search-box .field {
    padding-left: 2.5rem;
  }
  /* la crocetta del browser non è del sistema: si svuota il campo con la tastiera */
  .search-box .field::-webkit-search-cancel-button {
    appearance: none;
  }
  .results {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .results li + li {
    border-top: 1px solid var(--color-line);
  }
  .result {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.5rem;
    width: 100%;
    min-height: 48px;
    padding: 0.5rem 0.25rem;
    border: 0;
    border-radius: var(--radius-field);
    background: transparent;
    color: var(--color-foreground);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .result:hover {
    background: color-mix(in oklab, var(--color-surface) 90%, var(--color-accent));
  }
  .name {
    overflow-wrap: anywhere;
  }
  .tag {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .create {
    color: var(--color-accent-text);
    font-weight: 650;
  }
  .create .tag {
    font-weight: 400;
    flex-basis: 100%;
    padding-left: 1.75rem;
  }
</style>
