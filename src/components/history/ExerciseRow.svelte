<script lang="ts">
  // Riga di un esercizio verso la sua pagina (Progressi, US-47; foglio di un gruppo, US-49): nome, poi l'ultima
  // volta e gli allenamenti, o «–» se mai fatto («mai fatto» per lo screen reader); `extra` è una riga in più
  // (le serie che l'esercizio ha dato a un gruppo). Il filo tra le righe è dell'elenco che la contiene.
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { ExerciseDone } from '../../lib/archive';
  import { formatRelativeDay, plural } from '../../lib/format';

  interface Props {
    href: string;
    name: string;
    done?: ExerciseDone;
    /** YYYY-MM-DD, per «7 giorni fa» */
    today: string;
    extra?: string;
  }

  let { href, name, done, today, extra }: Props = $props();
</script>

<a {href} class="exercise-row">
  <span class="min-w-0 flex-1">
    <span class="block text-lg font-bold [overflow-wrap:anywhere]">{name}</span>
    {#if done}
      <span class="block text-sm text-text-muted">Ultima volta: {formatRelativeDay(done.lastDate, today)} · {plural(done.sessions, 'allenamento', 'allenamenti')}</span>
    {:else}
      <span class="block text-sm text-text-muted"><span aria-hidden="true">–</span><span class="sr-only">mai fatto</span></span>
    {/if}
    {#if extra}<span class="block text-sm">{extra}</span>{/if}
  </span>
  <ChevronRight size={20} class="shrink-0 text-text-muted" aria-hidden="true" />
</a>

<style>
  .exercise-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    padding: 0.5rem 0;
    color: inherit;
    text-decoration: none;
  }
</style>
