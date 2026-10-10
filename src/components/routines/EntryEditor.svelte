<script lang="ts">
  // Voce della scheda (US-07, US-08, US-09). Chiusa si legge come la scheda di carta: numero, nome e
  // target compatti ("3 × 6–8 · 40 kg · rec. 1:15"). Aperta si modifica in linea, senza modale (P8):
  // ogni campo salva a ogni modifica (P4).
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import Trash from '@lucide/svelte/icons/trash';
  import LiveField from '../ui/LiveField.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import Switch from '../ui/Switch.svelte';
  import {
    LIMITS,
    exerciseName,
    linkWithPrevious,
    normalizeReps,
    updateEntry,
    type Archive,
    type EntryPatch,
    type RoutineExercise,
  } from '../../lib/archive';
  import { formatWeightRange, parseWeight, weightFieldValue, formatNumber } from '../../lib/units';
  import { formatDuration, plural, speakDuration } from '../../lib/format';

  interface Props {
    archive: Archive;
    routineId: string;
    entry: RoutineExercise;
    /** "1", "2a"… */
    label: string;
    index: number;
    /** in superserie con la voce precedente */
    linked: boolean;
    expanded: boolean;
    readonly?: boolean;
    ontoggle: () => void;
    edit: (change: (archive: Archive) => Archive) => boolean;
    onpick: (mode: 'replace' | 'alternative') => void;
    onremove: () => void;
  }

  let { archive, routineId, entry, label, index, linked, expanded, readonly = false, ontoggle, edit, onpick, onremove }: Props = $props();

  const settings = $derived(archive.settings);
  const unit = $derived(settings.weightUnit);
  const name = $derived(exerciseName(archive, entry.exerciseId));
  const base = $derived(`entry-${entry.id}`);

  // spazi unificatori: ogni pezzo del riassunto va a capo intero
  const restText = (seconds: number) => (seconds === 0 ? 'nessun\u00a0recupero' : `rec.\u00a0${formatDuration(seconds)}`);
  const summary = $derived(
    [
      entry.reps ? `${entry.sets}\u00a0×\u00a0${entry.reps}` : plural(entry.sets, 'serie', 'serie').replace(' ', '\u00a0'),
      formatWeightRange(entry.loadMin, entry.loadMax, settings),
      restText(entry.rest),
    ]
      .filter(Boolean)
      .join(' · '),
  );
  const details = $derived(
    [entry.unit, entry.loadNote, entry.alternatives.length ? plural(entry.alternatives.length, 'alternativa', 'alternative') : '']
      .filter(Boolean)
      .join(' · '),
  );

  function patch(change: EntryPatch): boolean {
    return edit((a) => updateEntry(a, routineId, entry.id, change));
  }

  // Carico: il valore è salvato in kg e mostrato nell'unità scelta, con la virgola
  const fieldText = (kg: number | null) => {
    const value = weightFieldValue(kg, unit);
    return value === null ? '' : formatNumber(value);
  };
  const minText = $derived(fieldText(entry.loadMin));
  /** "fino a" è vuoto se il carico è un valore solo */
  const maxText = $derived(entry.loadMax === null || entry.loadMax === entry.loadMin ? '' : fieldText(entry.loadMax));

  function readWeight(text: string): number | null | string {
    const kg = parseWeight(text, unit);
    if (kg === null) return null;
    if (Number.isNaN(kg)) return `Scrivi un numero, per esempio 42,5.`;
    if (kg > LIMITS.maxValue) return 'Il valore è troppo grande.';
    return kg;
  }

  function onMinInput(text: string): string | void {
    const min = readWeight(text);
    if (typeof min === 'string') return min;
    const single = entry.loadMax === null || entry.loadMax === entry.loadMin;
    if (min === null) return void patch({ loadMin: null, loadMax: single ? null : entry.loadMax });
    // oltre il massimo l'intervallo si chiude sul valore nuovo: "fino a" si riscrive dopo, se serve
    patch({ loadMin: min, loadMax: single || entry.loadMax === null || min > entry.loadMax ? min : entry.loadMax });
  }

  function onMaxInput(text: string): string | void {
    const max = readWeight(text);
    if (typeof max === 'string') return max;
    if (max === null) return void patch({ loadMax: entry.loadMin });
    if (entry.loadMin === null) return 'Scrivi prima il carico.';
    if (max < entry.loadMin) return 'Deve essere almeno uguale al carico.';
    patch({ loadMax: max });
  }

  const restFormat = (v: number) => (v === 0 ? 'Nessuno' : formatDuration(v));
  const restSpeak = (v: number) => (v === 0 ? 'nessun recupero' : speakDuration(v));
</script>

<div class="entry" class:expanded>
  {#if readonly}
    <div class="row">
      <span class="order" aria-hidden="true">{label}</span>
      <div class="text">
        <span class="name"><span class="sr-only">{label}. </span>{name}</span>
        <span class="summary">{summary}</span>
        {#if details}<span class="summary">{details}</span>{/if}
      </div>
    </div>
  {:else}
    <button type="button" class="row toggle" id={`${base}-toggle`} aria-expanded={expanded} aria-controls={`${base}-editor`} onclick={ontoggle}>
      <span class="order" aria-hidden="true">{label}</span>
      <span class="text">
        <span class="name"><span class="sr-only">{label}. </span>{name}</span>
        <span class="summary">{summary}</span>
        {#if details}<span class="summary">{details}</span>{/if}
      </span>
      <span class="chevron" aria-hidden="true"><ChevronDown size={22} /></span>
    </button>
  {/if}

  {#if expanded && !readonly}
    <div class="editor" id={`${base}-editor`} role="group" aria-label={`Modifica ${name}`}>
      <div class="exercise">
        <div class="min-w-0">
          <span class="label">Esercizio</span>
          <p class="m-0 font-semibold">{name}</p>
        </div>
        <button type="button" class="btn btn-text" onclick={() => onpick('replace')}>Cambia</button>
      </div>

      <Stepper
        label="Serie"
        value={entry.sets}
        min={1}
        max={LIMITS.setsPerExercise}
        step={1}
        format={(v) => String(v)}
        decrementLabel="−1"
        incrementLabel="+1"
        onchange={(sets) => patch({ sets })}
      />

      <LiveField
        id={`${base}-reps`}
        label="Ripetizioni"
        hint="Un numero o un intervallo, per esempio 8 o 6-8."
        placeholder="es. 6–8"
        value={entry.reps}
        oninput={(text) => void patch({ reps: normalizeReps(text) })}
      />

      <div class="pair">
        <LiveField id={`${base}-load-min`} label={`Carico (${unit})`} inputmode="decimal" value={minText} oninput={onMinInput} />
        <LiveField id={`${base}-load-max`} label={`Fino a (${unit})`} inputmode="decimal" placeholder="facoltativo" value={maxText} oninput={onMaxInput} />
      </div>

      <div class="pair">
        <LiveField
          id={`${base}-unit`}
          label="Il carico è"
          placeholder="per manubrio"
          maxlength={LIMITS.shortTextLength}
          value={entry.unit}
          oninput={(text) => void patch({ unit: text.trim() })}
        />
        <LiveField
          id={`${base}-note`}
          label="Nota sul carico"
          placeholder="da tarare"
          maxlength={LIMITS.shortTextLength}
          value={entry.loadNote}
          oninput={(text) => void patch({ loadNote: text.trim() })}
        />
      </div>

      <Stepper
        label="Recupero"
        hint={entry.rest === 0 ? 'Nessun timer dopo le serie di questo esercizio.' : undefined}
        value={entry.rest}
        min={0}
        max={LIMITS.maxRest}
        step={15}
        format={restFormat}
        speak={restSpeak}
        decrementLabel="−15 s"
        incrementLabel="+15 s"
        onchange={(rest) => patch({ rest })}
      />
      <Stepper
        label="Recupero di riscaldamento"
        hint="Dopo le serie segnate come riscaldamento."
        value={entry.warmupRest}
        min={0}
        max={LIMITS.maxRest}
        step={15}
        format={restFormat}
        speak={restSpeak}
        decrementLabel="−15 s"
        incrementLabel="+15 s"
        onchange={(warmupRest) => patch({ warmupRest })}
      />

      <div class="alternatives">
        <span class="label" id={`${base}-alt-label`}>Alternative, se la macchina è occupata</span>
        {#if entry.alternatives.length}
          <ul aria-labelledby={`${base}-alt-label`}>
            {#each entry.alternatives as alternative (alternative)}
              <li>
                <span class="min-w-0 grow">{exerciseName(archive, alternative)}</span>
                <button
                  type="button"
                  class="btn btn-icon"
                  aria-label={`Togli l’alternativa ${exerciseName(archive, alternative)}`}
                  onclick={() => patch({ alternatives: entry.alternatives.filter((a) => a !== alternative) })}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="hint mt-0">Nessuna alternativa.</p>
        {/if}
        {#if entry.alternatives.length < LIMITS.alternativesPerExercise}
          <button type="button" class="btn btn-secondary self-start" onclick={() => onpick('alternative')}>
            <Plus aria-hidden="true" />Aggiungi alternativa
          </button>
        {/if}
      </div>

      {#if index > 0}
        <Switch
          label="In superserie con l’esercizio sopra"
          hint="Si alternano, e il recupero parte alla fine del giro."
          checked={linked}
          onchange={(value) => edit((a) => linkWithPrevious(a, routineId, entry.id, value))}
        />
      {/if}

      <button type="button" class="btn btn-danger self-start" onclick={onremove}>
        <Trash aria-hidden="true" />Togli dalla scheda
      </button>
    </div>
  {/if}
</div>

<style>
  .row {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    min-height: 56px;
    padding: 0.5rem 0;
    text-align: left;
  }
  .toggle {
    border: 0;
    border-radius: var(--radius-field);
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  .toggle:hover .chevron {
    color: var(--color-foreground);
  }
  .order {
    /* sopra il filo che unisce le voci di una superserie */
    position: relative;
    align-self: start;
    padding: 0.0625rem 0 0.25rem;
    background: var(--color-background);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent-text);
    text-align: center;
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-weight: 650;
    font-size: var(--text-lg);
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .summary {
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .chevron {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    color: var(--color-muted);
    transition: rotate 0.2s var(--ease-out-expo);
  }
  .expanded .chevron {
    rotate: 180deg;
  }
  .editor {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 0.5rem 0 1.25rem 3rem;
  }
  .exercise {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .alternatives {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .alternatives .label {
    margin: 0;
  }
  .alternatives ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .alternatives li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 48px;
    overflow-wrap: anywhere;
  }
  .alternatives li + li {
    border-top: 1px solid var(--color-line);
  }
  @media (max-width: 359px) {
    .editor {
      padding-left: 0;
    }
  }
</style>
