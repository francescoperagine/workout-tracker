<script lang="ts">
  // Mini-barra "allenamento in corso" (US-17, brief route-workout): sulle altre schermate riporta alla
  // sessione con un tocco. Vive nello stack in basso del guscio, sopra la tab bar, ed è persistente tra
  // le pagine (transition:persist in AppLayout): segue il cambio di pagina con `astro:page-load`.
  // Non compare sull'allenamento stesso né su Oggi, che ha già "Riprendi allenamento" come azione
  // principale. Allo step 7 ospiterà anche il timer di recupero ridotto.
  import { onMount } from 'svelte';
  import CirclePlay from '@lucide/svelte/icons/circle-play';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { currentExercise, exerciseName, sessionInProgress, summarizeSession } from '../../lib/archive';
  import { appUrl, isCurrentPath } from '../../lib/paths';
  import { formatElapsed } from '../../lib/format';
  import { setBottomBar } from '../../lib/bottom-bars';

  interface Props {
    /** solo per /kit: disegna la barra ferma, con questi testi, senza leggere l'archivio */
    preview?: { name: string; meta: string } | null;
  }

  let { preview = null }: Props = $props();

  const store = preview ? null : archiveStore();
  // anche nel rendering alla build (anteprima di /kit), dove location non c'è
  let path = $state(typeof location === 'undefined' ? '' : location.pathname);
  let now = $state(Date.now());
  let height = $state(0);

  onMount(() => {
    const onPage = () => {
      path = location.pathname;
      now = Date.now();
    };
    const timer = setInterval(() => (now = Date.now()), 30_000);
    document.addEventListener('astro:page-load', onPage);
    document.addEventListener('visibilitychange', onPage);
    return () => {
      clearInterval(timer);
      document.removeEventListener('astro:page-load', onPage);
      document.removeEventListener('visibilitychange', onPage);
    };
  });

  const session = $derived(!store || store.state === 'unreadable' ? null : sessionInProgress(store.archive));
  const hidden = $derived(['/workout', '/', '/welcome'].some((p) => isCurrentPath(path, p)));
  const visible = $derived(!!session && !hidden);

  const meta = $derived.by(() => {
    if (!session) return '';
    const current = currentExercise(session);
    return [`da ${formatElapsed(summarizeSession(session, now).duration)}`, current && store ? exerciseName(store.archive, current.exerciseId) : '']
      .filter(Boolean)
      .join(' · ');
  });

  $effect(() => {
    if (!preview) setBottomBar('workout-mini', visible ? height : 0, true);
  });
</script>

{#if preview}
  <div class="shell mini" role="img" aria-label={`Anteprima della mini-barra: ${preview.name}, ${preview.meta}`}>
    <CirclePlay size={22} aria-hidden="true" class="icon" />
    <span class="text">
      <span class="name">{preview.name}</span>
      <span class="meta">{preview.meta}</span>
    </span>
    <span class="go" aria-hidden="true">Riprendi<ChevronRight size={20} /></span>
  </div>
{:else if visible && session}
  <a class="shell mini" href={appUrl('/workout')} bind:offsetHeight={height} aria-label={`Allenamento in corso: ${session.name}, ${meta}. Torna all’allenamento`}>
    <CirclePlay size={22} aria-hidden="true" class="icon" />
    <span class="text">
      <span class="name">{session.name}</span>
      <span class="meta">{meta}</span>
    </span>
    <span class="go" aria-hidden="true">Riprendi<ChevronRight size={20} /></span>
  </a>
{/if}

<style>
  .mini {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    padding: 0.375rem 0.5rem 0.375rem 1rem;
    border-top: 1px solid var(--color-shell-line);
    color: var(--color-shell-foreground);
    text-decoration: none;
  }
  .mini:hover {
    background: var(--color-shell-panel);
  }
  .mini :global(.icon) {
    flex-shrink: 0;
    color: var(--color-shell-accent);
  }
  .text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .name,
  .meta {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .name {
    font-weight: 650;
  }
  .meta {
    color: var(--color-shell-muted);
    font-size: var(--text-sm);
  }
  .go {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.125rem;
    color: var(--color-shell-accent);
    font-weight: 650;
  }
</style>
