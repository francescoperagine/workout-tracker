<script lang="ts">
  // Timer di recupero nel guscio (step 7): un'isola sola per tutta la visita (transition:persist in
  // AppLayout), così lo schermo intero si apre su qualsiasi pagina e il conteggio non si interrompe
  // cambiando pagina. Tiene lo schermo acceso finché c'è un allenamento in corso (US-24) e annuncia il
  // recupero solo a 30 s, 10 s e alla fine (P9). La barra ridotta sta nella barra dell'allenamento e
  // nella mini-barra (RestTimerBar).
  import RestTimer from '../workout/RestTimer.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { nextSet, sessionInProgress } from '../../lib/archive';
  import { crossedThreshold, nextSetText } from '../../lib/rest-timer';
  import { restTimer } from '../../lib/rest-timer.svelte';
  import { keepScreenOn } from '../../lib/wake-lock';

  const store = archiveStore();
  const timer = restTimer();

  const session = $derived(store.state === 'unreadable' ? null : sessionInProgress(store.archive));
  const next = $derived(session ? nextSetText(store.archive, session, nextSet(session)) : null);

  $effect(() => keepScreenOn(!!session));

  // Annunci solo alle soglie: si confronta con il valore dello scatto precedente dello stesso timer
  let announcement = $state('');
  let last: { setId: string; remaining: number } | null = null;
  $effect(() => {
    const state = timer.state;
    const remaining = timer.remaining;
    if (!state) {
      last = null;
      return;
    }
    if (last?.setId === state.setId) {
      const crossed = crossedThreshold(last.remaining, remaining);
      if (crossed === 0) announcement = next ? `Recupero finito. Adesso: ${next}` : 'Recupero finito';
      else if (crossed !== null) announcement = `Mancano ${crossed} secondi di recupero`;
    } else announcement = '';
    last = { setId: state.setId, remaining };
  });
</script>

<!-- sempre montato: chiudendo la finestra il focus torna da solo alla spunta che l'ha aperta -->
<RestTimer
  open={timer.open}
  remaining={timer.remaining}
  duration={timer.state?.duration ?? 0}
  fraction={timer.fraction}
  warmup={timer.state?.warmup}
  overFor={timer.overFor}
  {next}
  {announcement}
  onshift={(s) => timer.shift(s)}
  onskip={() => timer.stop()}
  onminimize={() => timer.minimize()}
/>
<!-- con il timer ridotto gli annunci passano da qui: la finestra chiusa non parla -->
{#if timer.state?.minimized}
  <p class="sr-only" role="status" aria-live="assertive">{announcement}</p>
{/if}
