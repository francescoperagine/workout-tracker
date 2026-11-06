<script lang="ts">
  // Progressi (/progress, quinta tab, INC-015): gli esercizi fatti, ciascuno verso i suoi progressi
  // (/exercise?id=…). Prima era la vista Esercizi dello Storico. In futuro qui anche le misure del corpo.
  import ChartLine from '@lucide/svelte/icons/chart-line';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { appUrl } from '../../lib/paths';
  import { exerciseName, exercisesDone, toDateKey } from '../../lib/archive';
  import { formatRelativeDay, plural } from '../../lib/format';

  const store = archiveStore();
  const today = toDateKey(new Date());

  const unreadable = $derived(store.state === 'unreadable');
  const done = $derived(exercisesDone(store.archive));
  const exerciseHref = (id: string) => `${appUrl('/exercise')}?id=${encodeURIComponent(id)}`;
</script>

{#if unreadable}
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.</p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if done.length}
  <div class="flex flex-col gap-5">
    <p class="m-0 text-text-muted">Le varianti hanno ciascuna i loro progressi.</p>
    <ol class="m-0 list-none p-0">
      {#each done as item (item.exerciseId)}
        <li class="border-b border-border last:border-b-0">
          <a href={exerciseHref(item.exerciseId)} class="row">
            <span class="min-w-0 flex-1">
              <span class="block text-lg font-bold [overflow-wrap:anywhere]">{exerciseName(store.archive, item.exerciseId)}</span>
              <span class="block text-sm text-text-muted">
                Ultima volta: {formatRelativeDay(item.lastDate, today)} · {plural(item.sessions, 'allenamento', 'allenamenti')}
              </span>
            </span>
            <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
          </a>
        </li>
      {/each}
    </ol>
  </div>
{:else}
  <div class="flex flex-col items-start gap-3 py-8">
    <ChartLine size={28} class="text-text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Nessun esercizio registrato</h2>
    <p class="m-0 max-w-[60ch] text-text-muted">Dopo il primo allenamento concluso trovi qui i progressi di ogni esercizio.</p>
    <a href={appUrl('/')} class="btn btn-primary">Vai a Oggi</a>
  </div>
{/if}

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    padding: 0.5rem 0;
    color: inherit;
    text-decoration: none;
  }
</style>
