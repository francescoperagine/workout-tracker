<script lang="ts">
  // Un esercizio dell'allenamento attivo (brief route-workout): nome (tocco = approfondimento), target
  // della scheda, variante, righe serie, "Aggiungi serie" e la nota sul carico. Ogni gesto salva subito
  // (P4). Fatto (tutte le serie spuntate) si compatta in una riga, ma resta modificabile.
  import { tick } from 'svelte';
  import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
  import CheckCheck from '@lucide/svelte/icons/check-check';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Info from '@lucide/svelte/icons/info';
  import Plus from '@lucide/svelte/icons/plus';
  import LiveField from '../ui/LiveField.svelte';
  import ReorderHandle from '../ui/ReorderHandle.svelte';
  import SetRow, { formatPrevious, type CheckResult, type Previous } from '../ui/SetRow.svelte';
  import {
    LIMITS,
    addSet,
    completeExercise,
    completedSet,
    exerciseName,
    isValidSetValue,
    plannedEntry,
    previousExercise,
    previousSets,
    suggestedSets,
    replaceSet,
    setExerciseNotes,
    setNumbers,
    updateSet,
    type Archive,
    type PreviousSet,
    type Session,
    type SessionExercise,
    type SessionSet,
  } from '../../lib/archive';
  import { formatDayMonth, formatDuration, plural, withPreposition } from '../../lib/format';
  import { formatNumber, formatWeight, formatWeightRange, parseWeight, weightFieldValue } from '../../lib/units';

  interface Props {
    archive: Archive;
    session: Session;
    exercise: SessionExercise;
    /** "1", "2a"… */
    label: string;
    /** contiene la serie da fare adesso (P7) */
    current: boolean;
    /** compattato perché fatto; il tocco su "Mostra serie" lo riapre */
    compact: boolean;
    /** id delle serie che hanno battuto un record di carico (US-29) */
    records: ReadonlySet<string>;
    today: string;
    edit: (change: (archive: Archive) => Archive) => boolean;
    /** l'utente ha toccato l'esercizio: resta aperto anche se fatto */
    ontouch: () => void;
    ontoggle: () => void;
    /** dopo una spunta: chi gestisce l'elenco avvia il recupero e sposta l'attenzione alla serie successiva */
    onchecked: (setId: string) => void;
    /** dopo "Completa esercizio" (US-37): serie appena spuntate, il loro `completedAt`, quante restano senza ripetizioni */
    oncompleted: (completed: string[], at: number, missing: number) => void;
    /** tocco sull'indice della serie: foglio con tipo e "Togli serie" */
    onsetoptions: (setId: string) => void;
    onvariant: () => void;
    ondetails: () => void;
    onoptions: () => void;
    /** maniglia del riordino (US-38) sul numero; assente con un esercizio solo */
    handle?: { label: string; onstart: (event: PointerEvent) => void; onstep: (direction: -1 | 1) => void } | null;
  }

  let {
    archive,
    session,
    exercise,
    label,
    current,
    compact,
    records,
    today,
    edit,
    ontouch,
    ontoggle,
    onchecked,
    oncompleted,
    onsetoptions,
    onvariant,
    ondetails,
    onoptions,
    handle = null,
  }: Props = $props();

  const settings = $derived(archive.settings);
  const unit = $derived(settings.weightUnit);
  const name = $derived(exerciseName(archive, exercise.exerciseId));
  const entry = $derived(plannedEntry(archive, session, exercise));
  const previous = $derived(previousExercise(archive, session, exercise.exerciseId));
  const rawPrevious = $derived(previousSets(exercise, previous?.exercise ?? null));
  const suggested = $derived(suggestedSets(exercise, rawPrevious));
  const numbers = $derived(setNumbers(exercise.sets));
  const done = $derived(exercise.sets.length > 0 && exercise.sets.every((s) => s.completedAt !== null));
  const id = $derived(`exercise-${exercise.id}`);

  // serie lasciate senza spunta da "Completa esercizio" perché senza ripetizioni (US-37): evidenziate
  // finché non si modificano o si spuntano
  let flagged: string[] = $state([]);
  const missing = $derived(exercise.sets.filter((s) => flagged.includes(s.id) && s.completedAt === null));
  const unflag = (setId: string) => {
    if (flagged.includes(setId)) flagged = flagged.filter((id) => id !== setId);
  };

  let noteOpen = $state(false);
  let noteField: { focus(select?: boolean): void } | undefined = $state();

  /** Apre la nota sul carico (dal foglio delle azioni) e ci porta il cursore */
  export async function openNote() {
    noteOpen = true;
    await tick();
    noteField?.focus();
  }

  const nbsp = (text: string) => text.replace(/ /g, ' ');

  /** Target della scheda; con una variante il carico previsto non vale (era per l'altro esercizio) */
  const target = $derived.by(() => {
    const rest = exercise.rest === 0 ? 'nessun recupero' : `rec. ${formatDuration(exercise.rest)}`;
    if (!entry) return nbsp(rest);
    const load = exercise.variantOf ? '' : [formatWeightRange(entry.loadMin, entry.loadMax, settings), entry.unit].filter(Boolean).join(' ');
    return [entry.reps ? `${entry.sets} × ${entry.reps}` : plural(entry.sets, 'serie', 'serie'), load, exercise.variantOf ? '' : entry.loadNote, rest]
      .filter(Boolean)
      .map(nbsp)
      .join(' · ');
  });

  const previousNote = $derived(previous?.exercise.notes.trim() ?? '');
  const previousWhen = $derived(previous ? withPreposition('di', formatDayMonth(previous.session.date, today)) : '');

  // --- valori ---------------------------------------------------------------------------------
  const weightText = (kg: number | null) => {
    const value = weightFieldValue(kg, unit);
    return value === null ? '' : formatNumber(value);
  };

  function shown(p: PreviousSet | null): Previous | null {
    return p ? { kg: p.kg === null ? '' : formatWeight(p.kg, settings, false), reps: p.reps === null ? '' : String(p.reps) } : null;
  }

  function patch(set: SessionSet, change: Partial<Omit<SessionSet, 'id'>>): boolean {
    ontouch();
    unflag(set.id);
    return edit((a) => updateSet(a, session.id, exercise.id, set.id, change));
  }

  function onKg(set: SessionSet, text: string): boolean {
    const kg = parseWeight(text, unit);
    if (kg !== null && !isValidSetValue(kg)) return false;
    return patch(set, { kg });
  }

  function onReps(set: SessionSet, text: string): boolean {
    const clean = text.trim();
    if (clean === '') return patch(set, { reps: null });
    if (!/^\d+$/.test(clean) || !isValidSetValue(Number(clean), true)) return false;
    return patch(set, { reps: Number(clean) });
  }

  function onCheck(set: SessionSet, suggestion: PreviousSet | null): CheckResult {
    ontouch();
    unflag(set.id);
    if (set.completedAt !== null) {
      edit((a) => updateSet(a, session.id, exercise.id, set.id, { completedAt: null }));
      return;
    }
    const completed = completedSet(set, suggestion, Date.now());
    // senza ripetizioni la riga non si spunta: il cursore va al primo campo vuoto (US-12)
    if (!completed) return set.kg === null && suggestion?.kg == null ? 'kg' : 'reps';
    if (edit((a) => replaceSet(a, session.id, exercise.id, completed))) onchecked(set.id);
  }

  /** "Completa esercizio" (US-37): le serie con le ripetizioni si spuntano, le altre si evidenziano */
  function complete() {
    ontouch();
    const at = Date.now();
    let completed: string[] = [];
    if (!edit((a) => {
      const result = completeExercise(a, session.id, exercise.id, at);
      completed = result.completed;
      return result.archive;
    })) return;
    const empty = exercise.sets.filter((s) => s.completedAt === null && s.reps === null && !completed.includes(s.id));
    flagged = empty.map((s) => s.id);
    oncompleted(completed, at, empty.length);
  }

  // --- serie ----------------------------------------------------------------------------------
  function add() {
    ontouch();
    edit((a) => addSet(a, session.id, exercise.id).archive);
  }

  const setLabel = (set: SessionSet) => {
    const i = exercise.sets.indexOf(set);
    return set.type === 'warmup' ? 'riscaldamento' : `serie ${numbers[i]}`;
  };

  const compactSummary = $derived(
    exercise.sets
      .filter((s) => s.completedAt !== null && s.reps !== null)
      .map((s) => nbsp(formatPrevious({ kg: s.kg === null ? '' : formatWeight(s.kg, settings, false), reps: String(s.reps) }, unit)))
      .join(' · '),
  );
</script>

<section class="exercise" class:current aria-label={name} {id}>
  <div class="head">
    <div class="lead">
      {#if handle}
        <ReorderHandle id={`handle-${exercise.id}`} label={handle.label} onstart={handle.onstart} onstep={handle.onstep}>
          <span class="order" aria-hidden="true">{label}</span>
        </ReorderHandle>
      {:else}
        <span class="order" aria-hidden="true">{label}</span>
      {/if}
    </div>
    {#if current && !compact}<span class="sr-only">Adesso: </span>{/if}
    <div class="title">
      <h3>
        <button type="button" class="name" aria-haspopup="dialog" aria-label={`${name}: come si esegue`} onclick={ondetails}>
          {name}<Info size={18} aria-hidden="true" />
        </button>
      </h3>
      {#if compact}
        <p class="meta done-line">
          <CircleCheck size={16} aria-hidden="true" />
          <span>{[plural(exercise.sets.length, 'serie', 'serie'), compactSummary].filter(Boolean).join(' · ')}</span>
        </p>
      {:else}
        <p class="meta">{target}</p>
        {#if exercise.variantOf}
          <p class="meta">Al posto di {exerciseName(archive, exercise.variantOf)}</p>
        {/if}
        {#if previousNote && previousNote !== exercise.notes.trim()}
          <p class="meta">Nota {previousWhen}: «{previousNote}»</p>
        {/if}
      {/if}
    </div>
    <div class="actions">
      {#if !compact && !done}
        <button type="button" class="btn btn-icon" aria-label={`Completa ${name}`} onclick={complete}>
          <CheckCheck size={22} aria-hidden="true" />
        </button>
      {/if}
      <button type="button" class="btn btn-icon" aria-haspopup="dialog" aria-label={`Altre azioni: ${name}`} onclick={onoptions}>
        <Ellipsis size={22} aria-hidden="true" />
      </button>
    </div>
  </div>

  {#if compact || done}
    <button type="button" class="btn btn-text toggle" aria-expanded={!compact} aria-controls={`${id}-sets`} onclick={ontoggle}>
      {compact ? 'Mostra serie' : 'Nascondi serie'}
    </button>
  {/if}

  {#if !compact}
    <div class="body" id={`${id}-sets`}>
      <button type="button" class="btn btn-text variant" aria-haspopup="dialog" onclick={onvariant}>
        <ArrowLeftRight aria-hidden="true" />
        {exercise.variantOf ? 'Cambia variante' : 'Cambia esercizio'}
      </button>

      <div class="sets">
        <div class="column-heads" aria-hidden="true">
          <span class="text-center">Serie</span><span>Precedente</span><span class="text-center">{unit}</span><span class="text-center">Rip</span><span></span>
        </div>
        {#each exercise.sets as set, i (set.id)}
          {@const previousSet = rawPrevious[i]}
          {@const suggestion = suggested[i]}
          <SetRow
            id={`set-${set.id}`}
            number={numbers[i]}
            type={set.type}
            previous={shown(previousSet)}
            suggestion={shown(suggestion)}
            kg={weightText(set.kg)}
            reps={set.reps === null ? '' : String(set.reps)}
            done={set.completedAt !== null}
            {unit}
            record={records.has(set.id)}
            flagged={missing.includes(set)}
            typeMenu
            ontype={() => {
              ontouch();
              onsetoptions(set.id);
            }}
            oncopy={() => previousSet && patch(set, { kg: previousSet.kg, reps: previousSet.reps })}
            onkg={(text) => onKg(set, text)}
            onreps={(text) => onReps(set, text)}
            oncheck={() => onCheck(set, suggestion)}
          />
        {/each}
      </div>

      <p class="missing" role="status">
        {#if missing.length}
          <CircleAlert size={16} aria-hidden="true" />
          <span>Mancano le ripetizioni: {missing.map((s) => setLabel(s)).join(', ')}.</span>
        {/if}
      </p>

      <button type="button" class="btn btn-text add-set" onclick={add} disabled={exercise.sets.length >= LIMITS.setsPerExercise}>
        <Plus aria-hidden="true" />Aggiungi serie
      </button>
      {#if exercise.sets.length >= LIMITS.setsPerExercise}
        <p class="hint mt-0">Al massimo {LIMITS.setsPerExercise} serie per esercizio.</p>
      {/if}

      {#if noteOpen || exercise.notes}
        <LiveField
          bind:this={noteField}
          id={`${id}-notes`}
          label="Nota sul carico"
          placeholder="Es. per manubrio, sedile 4"
          maxlength={LIMITS.notesLength}
          value={exercise.notes}
          oninput={(text) => void edit((a) => setExerciseNotes(a, session.id, exercise.id, text))}
        />
      {/if}
    </div>
  {/if}
</section>

<style>
  .exercise {
    display: flex;
    flex-direction: column;
    scroll-margin-block: 5rem calc(var(--bottom-bars-height) + 1rem);
  }
  .head {
    margin-top: -0.375rem;
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    gap: 0 0.5rem;
    align-items: start;
  }
  .order {
    align-self: stretch;
    padding-top: 0.625rem;
    color: var(--color-accent-text);
    font-size: var(--text-lg);
    font-weight: 700;
    text-align: center;
  }
  /* il titolo divide la prima riga con i pulsanti; target e note sotto prendono anche il loro spazio (320px) */
  .title {
    display: contents;
  }
  .title > * {
    grid-column: 2 / -1;
    min-width: 0;
  }
  .title > h3 {
    grid-column: 2;
    grid-row: 1;
  }
  .lead {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
  }
  .lead :global(.reorder-handle) {
    padding-top: 0;
  }
  .actions {
    display: flex;
    grid-column: 3;
    grid-row: 1;
  }
  h3 {
    margin: 0;
  }
  .name {
    display: inline;
    min-height: 48px;
    padding: 0.5rem 0;
    border: 0;
    background: transparent;
    color: var(--color-foreground);
    font: inherit;
    font-size: var(--text-lg);
    font-weight: 700;
    line-height: 1.3;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .name :global(svg) {
    display: inline;
    margin-left: 0.375rem;
    vertical-align: -0.125rem;
    color: var(--color-muted);
  }
  .name:hover :global(svg) {
    color: var(--color-accent-text);
  }
  /* l'esercizio della serie da fare adesso: il numero diventa una pastiglia piena (P7) */
  .current .order {
    margin-top: 0.5rem;
    padding: 0.125rem 0;
    border-radius: var(--radius-field);
    background: var(--color-accent);
    color: var(--color-on-accent);
  }
  .meta {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
  .done-line {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
  }
  .done-line :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
    color: var(--color-accent-text);
  }
  .toggle {
    align-self: flex-start;
    margin-left: 2.5rem;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .variant {
    align-self: flex-start;
    margin-left: 2.5rem;
    margin-top: -0.25rem;
  }
  .column-heads {
    display: grid;
    grid-template-columns: 2rem minmax(3.75rem, 1fr) minmax(3.25rem, 4.75rem) minmax(3rem, 4rem) 3rem;
    gap: clamp(0.25rem, 1.6vw, 0.5rem);
    padding-bottom: 0.25rem;
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .add-set {
    align-self: flex-start;
  }
  .missing {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    margin: 0;
    color: var(--color-warning);
    font-size: var(--text-sm);
  }
  .missing:empty {
    display: none;
  }
  .missing :global(svg) {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .exercise :global(.live-field) {
    margin-top: 0.5rem;
  }
</style>
