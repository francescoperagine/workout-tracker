<script lang="ts">
  // Approfondimento dell'esercizio (US-19) in un foglio dal basso: descrizione, immagine locale,
  // passaggi, attenzione e fonti dal catalogo. Oggi gli approfondimenti sono vuoti di proposito (non si
  // inventano testi tecnici): il foglio lo dice e mostra almeno cosa si è fatto l'ultima volta.
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { exerciseDetails, exerciseName, findExercise, hasDetails, safeImagePath, safeSources, type Archive, type PreviousExercise } from '../../lib/archive';
  import { appUrl } from '../../lib/paths';
  import { formatDayMonth } from '../../lib/format';
  import { formatWeight } from '../../lib/units';

  interface Props {
    open: boolean;
    archive: Archive;
    exerciseId: string | null;
    previous: PreviousExercise | null;
    today: string;
  }

  let { open = $bindable(false), archive, exerciseId, previous, today }: Props = $props();

  const details = $derived(exerciseId ? exerciseDetails(exerciseId) : null);
  const custom = $derived(exerciseId ? findExercise(archive, exerciseId)?.custom === true : false);
  const image = $derived(details ? safeImagePath(details.image) : null);
  const imageSrc = $derived(image && !image.startsWith('data:') ? appUrl(`/exercises/${image}`) : image);

  const lastTime = $derived.by(() => {
    if (!previous) return '';
    const sets = previous.exercise.sets
      .filter((s) => s.reps !== null || s.kg !== null)
      .map((s) => [s.kg === null ? '' : formatWeight(s.kg, archive.settings), s.reps === null ? '' : `${s.reps} rip`].filter(Boolean).join(' × '));
    return sets.join(' · ');
  });
</script>

<BottomSheet bind:open title={exerciseId ? exerciseName(archive, exerciseId) : ''}>
  <div class="details">
    {#if hasDetails(details)}
      {#if imageSrc}
        <img src={imageSrc} alt={details.imageAlt || details.name} loading="lazy" />
      {/if}
      {#if details.description}<p>{details.description}</p>{/if}
      {#if details.steps.length}
        <h3>Esecuzione</h3>
        <ol>
          {#each details.steps as step, i (i)}<li>{step}</li>{/each}
        </ol>
      {/if}
      {#if details.caution}
        <h3>Da tenere presente</h3>
        <p>{details.caution}</p>
      {/if}
      {#if safeSources(details).length}
        <h3>Fonti</h3>
        <ul>
          {#each safeSources(details) as source (source.url)}
            <li><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>
          {/each}
        </ul>
      {/if}
    {:else}
      <p>
        {custom ? 'È un esercizio personalizzato: non ha un approfondimento.' : 'L’approfondimento per questo esercizio non è ancora disponibile.'}
      </p>
      <p class="muted">Puoi continuare a registrare serie e carichi.</p>
    {/if}

    {#if previous && lastTime}
      <h3>Ultima volta, {formatDayMonth(previous.session.date, today)}</h3>
      <p>{lastTime}</p>
      {#if previous.exercise.notes.trim()}<p class="muted">Nota: «{previous.exercise.notes.trim()}»</p>{/if}
    {/if}

    {#if exerciseId}
      <a class="btn btn-secondary progress" href={`${appUrl('/exercise')}?id=${encodeURIComponent(exerciseId)}`}>Vedi i progressi</a>
    {/if}
  </div>
</BottomSheet>

<style>
  .details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }
  p,
  ol,
  ul {
    margin: 0;
    max-width: 60ch;
  }
  ol,
  ul {
    padding-left: 1.25rem;
  }
  h3 {
    margin: 0.75rem 0 0;
    font-size: var(--text-lg);
    font-weight: 700;
  }
  .muted {
    color: var(--color-muted);
  }
  .progress {
    align-self: flex-start;
    margin-top: 0.75rem;
  }
  img {
    width: 100%;
    max-height: 40dvh;
    object-fit: contain;
    border-radius: var(--radius-panel);
    background: var(--color-field);
  }
</style>
