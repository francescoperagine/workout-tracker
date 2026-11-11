<script lang="ts" module>
  export type PickedExercise = { kind: 'existing'; id: string } | { kind: 'new'; name: string };
</script>

<script lang="ts">
  // Scelta di un esercizio dal catalogo, in un foglio dal basso (US-07, US-08, poi US-14 allo step 6).
  // Si cerca scrivendo, anche per alias (US-35); un nome che non c'è diventa un esercizio personalizzato
  // con "Crea «…»", uno che c'è già lo dice. Con `onmerge` un personalizzato si unisce a un altro
  // esercizio (US-35): lo stesso foglio passa a «Unisci in…», con la conferma.
  // Il catalogo di base e quello personale arrivano da src/lib/archive/catalog.ts: nessun nome inventato.
  import { tick } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Check from '@lucide/svelte/icons/check';
  import Merge from '@lucide/svelte/icons/merge';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import ConfirmDialog from '../ui/ConfirmDialog.svelte';
  import {
    availableExercises,
    findByName,
    isValidExerciseName,
    mergeImpact,
    suggestExercises,
    type Archive,
    type CatalogEntry,
  } from '../../lib/archive';
  import { plural } from '../../lib/format';

  interface Props {
    open: boolean;
    title: string;
    catalog: Pick<Archive, 'catalog' | 'sessions' | 'routines'>;
    /** esercizi da non proporre (quello della voce, le alternative già scelte) */
    exclude?: readonly string[];
    onpick: (picked: PickedExercise) => void;
    /** unisce un personalizzato a un altro esercizio; true se l'unione è stata salvata */
    onmerge?: (absorbedId: string, intoId: string) => boolean;
    /** il foglio si apre già nella scelta della destinazione di questo personalizzato (pagina dell'esercizio) */
    mergeFrom?: CatalogEntry;
  }

  let { open = $bindable(false), title, catalog, exclude = [], onpick, onmerge, mergeFrom }: Props = $props();

  let query = $state('');
  const searchId = `exercise-search-${Math.random().toString(36).slice(2, 8)}`;
  let searchInput: HTMLInputElement | undefined = $state();
  let backButton: HTMLButtonElement | undefined = $state();
  let intro: HTMLDivElement | undefined = $state();
  /** il personalizzato da unire: il foglio sceglie dove */
  let merging: CatalogEntry | null = $state(null);
  let mergeInto: CatalogEntry | null = $state(null);
  let confirmOpen = $state(false);
  let merged = $state('');

  // ogni apertura riparte da una ricerca vuota, nella scelta normale
  $effect(() => {
    if (open) {
      query = '';
      merging = mergeFrom ?? null;
      merged = '';
    }
  });

  const typed = $derived(query.trim().replace(/\s+/g, ' '));
  const hidden = $derived(merging ? [merging.id] : exclude);
  /** nella scelta della destinazione: il predefinito con lo stesso nome o alias, in testa */
  const suggested = $derived(merging ? findByName({ catalog: {} }, merging.name) : null);
  const results = $derived.by(() => {
    const found = (typed ? suggestExercises(catalog, typed, 60) : availableExercises(catalog)).filter((e) => !hidden.includes(e.id));
    if (!suggested || typed) return found;
    return [suggested, ...found.filter((e) => e.id !== suggested.id)];
  });
  /** l'esercizio che il nome scritto (o un suo alias) indica già: niente "Crea «…»" */
  const existing = $derived(typed && !merging ? findByName(catalog, typed) : null);
  const canCreate = $derived(!merging && typed !== '' && isValidExerciseName(typed) && !existing);
  const offerExisting = $derived(existing && !exclude.includes(existing.id) ? existing : null);
  const impact = $derived(merging ? mergeImpact(catalog, merging.id) : null);

  function pick(picked: PickedExercise) {
    open = false;
    onpick(picked);
  }

  function choose(entry: CatalogEntry) {
    if (!merging) return pick({ kind: 'existing', id: entry.id });
    mergeInto = entry;
    confirmOpen = true;
  }

  async function startMerge(entry: CatalogEntry) {
    merging = entry;
    merged = '';
    query = '';
    // il pulsante toccato sparisce: il focus va a «Torna al catalogo», in testa al foglio, senza aprire
    // la tastiera sopra la destinazione suggerita
    await tick();
    // il foglio scorre tutto insieme (titolo compreso): si riparte dalla cima
    intro?.closest('dialog')?.scrollTo({ top: 0 });
    backButton?.focus({ preventScroll: true });
  }

  function stopMerge() {
    merging = null;
    query = '';
    searchInput?.focus();
  }

  function confirmMerge() {
    if (!merging || !mergeInto || !onmerge) return;
    const [from, to] = [merging.name, mergeInto.name];
    if (!onmerge(merging.id, mergeInto.id)) return;
    merged = `${from} è stato unito a ${to}.`;
    stopMerge();
  }

  const impactText = $derived(
    !impact
      ? ''
      : impact.sessions || impact.routines
        ? `Cambiano ${[impact.sessions && plural(impact.sessions, 'allenamento', 'allenamenti'), impact.routines && plural(impact.routines, 'scheda', 'schede')].filter(Boolean).join(' e ')}.`
        : 'Nessun allenamento e nessuna scheda lo usano.',
  );

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    // Invio sceglie il primo risultato, oppure crea l'esercizio scritto
    if (results[0]) choose(results[0]);
    else if (canCreate) pick({ kind: 'new', name: typed });
  }
</script>

<BottomSheet bind:open title={merging ? `Unisci «${merging.name}» in…` : title}>
  {#if merging}
    <div class="merge-intro" bind:this={intro}>
      <p class="m-0">Scegli l’esercizio che resta: allenamenti e schede con «{merging.name}» passano a quello, e «{merging.name}» sparisce dal catalogo.</p>
      {#if !mergeFrom}
        <button type="button" class="btn btn-text" bind:this={backButton} onclick={stopMerge}><ArrowLeft size={20} aria-hidden="true" />Torna al catalogo</button>
      {/if}
    </div>
  {/if}
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
        bind:this={searchInput}
        aria-controls={`${searchId}-results`}
        bind:value={query}
        {onkeydown}
      />
    </div>
  </div>

  <p class="sr-only" role="status">
    {typed ? `${results.length} risultati${canCreate ? `, oppure crea ${typed}` : offerExisting ? `, esiste già ${offerExisting.name}` : ''}` : ''}
  </p>
  {#if merged}<p class="merged" role="status">{merged}</p>{/if}

  <ul class="results" id={`${searchId}-results`}>
    {#each results as exercise (exercise.id)}
      <li class="row">
        <button type="button" class="result" onclick={() => choose(exercise)}>
          <span class="name">{exercise.name}</span>
          {#if exercise.custom}<span class="tag">personalizzato</span>{/if}
          {#if merging && exercise.id === suggested?.id && !typed}<span class="tag">stesso nome</span>{/if}
        </button>
        {#if onmerge && !merging && exercise.custom}
          <button type="button" class="btn btn-icon" aria-label={`Unisci ${exercise.name} in un altro esercizio`} onclick={() => startMerge(exercise)}>
            <Merge aria-hidden="true" />
          </button>
        {/if}
      </li>
    {/each}
    {#if offerExisting}
      <li>
        <button type="button" class="result create" onclick={() => pick({ kind: 'existing', id: offerExisting.id })}>
          <Check size={20} aria-hidden="true" />
          <span class="name">Esiste già «{offerExisting.name}»: usa questo</span>
        </button>
      </li>
    {/if}
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
  {#if typed && !results.length && !canCreate && !offerExisting}
    <p class="hint">Nessun esercizio con questo nome.</p>
  {/if}
</BottomSheet>

<ConfirmDialog
  bind:open={confirmOpen}
  title={merging && mergeInto ? `Unire «${merging.name}» a «${mergeInto.name}»?` : ''}
  text={`${impactText} Non si può annullare.`}
  confirmLabel="Unisci"
  onconfirm={confirmMerge}
/>

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
    color: var(--color-text-muted);
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
    border-top: 1px solid var(--color-border);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .row .result {
    flex: 1;
    min-width: 0;
  }
  .merge-intro {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    color: var(--color-text-muted);
  }
  .merged {
    margin: 0 0 0.5rem;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
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
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .result:hover {
    background: color-mix(in oklab, var(--color-surface) 92%, var(--color-text));
  }
  .name {
    overflow-wrap: anywhere;
  }
  .tag {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  .create {
    color: var(--color-accent-text);
    font-weight: 650;
  }
  .create .name {
    flex: 1;
    min-width: 0;
  }
  .create .tag {
    font-weight: 400;
    flex-basis: 100%;
    padding-left: 1.75rem;
  }
</style>
