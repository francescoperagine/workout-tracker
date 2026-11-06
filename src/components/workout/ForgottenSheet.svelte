<script lang="ts">
  // Allenamento dimenticato aperto (US-41): l'ultima serie spuntata, o l'inizio, è di più di 3 ore fa
  // (`forgottenSession`). Con serie fatte propone di terminarlo a quell'ora, così la durata resta giusta;
  // senza, di annullarlo. «Continua» (o ✕) lo lascia in corso. Chi lo usa decide quando aprirlo (una volta
  // per visita della pagina) e fa le modifiche: da qui non si salva nulla.
  import Trash from '@lucide/svelte/icons/trash';
  import BottomSheet from '../ui/BottomSheet.svelte';
  import { toDateKey, type ForgottenSession } from '../../lib/archive';
  import { formatClock, formatDayMonth, formatRelativeDay, withPreposition } from '../../lib/format';

  interface Props {
    open: boolean;
    forgotten: ForgottenSession | null;
    /** oggi, YYYY-MM-DD */
    today: string;
    /** «Termina alle …»: `end` è l'ora dell'ultima serie spuntata */
    onfinish: (end: number) => void;
    /** «Annulla allenamento», solo senza serie spuntate */
    ondiscard: () => void;
  }

  let { open = $bindable(false), forgotten, today, onfinish, ondiscard }: Props = $props();

  /** «alle 17:42», «alle 17:42 di ieri», «alle 17:42 del 3 novembre» */
  function when(at: number): string {
    const key = toDateKey(new Date(at));
    const clock = `alle ${formatClock(at)}`;
    if (key === today) return clock;
    return formatRelativeDay(key, today) === 'ieri' ? `${clock} di ieri` : `${clock} ${withPreposition('di', formatDayMonth(key, today))}`;
  }

  function act(action: () => void) {
    open = false;
    action();
  }
</script>

<BottomSheet bind:open title="Allenamento ancora aperto">
  {#if forgotten}
    <p class="mt-0">
      {forgotten.lastSet
        ? `Ultima serie ${when(forgotten.at)}. Se l’allenamento è finito allora, terminalo a quell’ora: la durata resta giusta.`
        : `Iniziato ${when(forgotten.at)}, senza serie fatte.`}
    </p>
  {/if}
  {#snippet footer()}
    {#if forgotten}
      <div class="actions">
        {#if forgotten.lastSet}
          {@const end = forgotten.at}
          <button type="button" class="btn btn-primary btn-block" onclick={() => act(() => onfinish(end))}>Termina alle {formatClock(end)}</button>
        {:else}
          <button type="button" class="btn btn-danger btn-block" onclick={() => act(ondiscard)}><Trash aria-hidden="true" />Annulla allenamento</button>
        {/if}
        <button type="button" class="btn btn-secondary btn-block" onclick={() => (open = false)}>Continua</button>
      </div>
    {/if}
  {/snippet}
</BottomSheet>

<style>
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
</style>
