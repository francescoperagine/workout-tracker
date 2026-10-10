<script lang="ts" module>
  export type SaveBarStatus = 'saved' | 'saving' | 'unsaved' | 'conflict' | 'unreadable';
</script>

<script lang="ts">
  // Barra fissa in basso con lo stato del salvataggio (US-33, P4) e l'azione principale della schermata.
  import type { Snippet } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';

  interface Props {
    status: SaveBarStatus;
    onsavenow?: () => void;
    onreload?: () => void;
    /** azione principale a destra (es. "Termina"); con `unreadable` è il rimando al recupero dei dati */
    action?: Snippet;
    /** riga sopra lo stato, a sinistra (es. la durata dell'allenamento) */
    detail?: Snippet;
    /** "Salvato" invece di "Salvato su questo dispositivo", dove lo spazio serve alla durata */
    compact?: boolean;
  }

  let { status, onsavenow, onreload, action, detail, compact = false }: Props = $props();

  const MESSAGES: Record<SaveBarStatus, string> = {
    saved: 'Salvato su questo dispositivo',
    saving: 'Salvataggio…',
    unsaved: 'Non salvato: spazio esaurito. I dati restano in questa pagina.',
    conflict: 'Il diario è cambiato in un’altra scheda. Ricarica per non sovrascriverlo.',
    unreadable: 'Il diario salvato non è leggibile. Non è stato sovrascritto: recuperalo da Dati e privacy.',
  };
</script>

<div class="shell bar" class:problem={status === 'unsaved' || status === 'conflict' || status === 'unreadable'}>
  <div class="lead">
    {#if detail}
      {@render detail()}
    {/if}
    <p class="status" role="status" aria-live="polite">
      {#if status === 'saved'}
        <Check size={18} aria-hidden="true" class="icon-ok" />
      {:else if status === 'saving'}
        <LoaderCircle size={18} aria-hidden="true" class="icon-wait" />
      {:else}
        <CircleAlert size={18} aria-hidden="true" class="icon-warning" />
      {/if}
      <span>{compact && status === 'saved' ? 'Salvato' : MESSAGES[status]}</span>
    </p>
  </div>
  <div class="actions">
    {#if status === 'unsaved'}
      <button type="button" class="btn btn-secondary" onclick={onsavenow}>Salva ora</button>
    {:else if status === 'conflict'}
      <button type="button" class="btn btn-secondary" onclick={onreload}><RefreshCw aria-hidden="true" />Ricarica</button>
    {:else if action}
      {@render action()}
    {/if}
  </div>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 68px;
    padding: 0.625rem 1rem;
    border-top: 1px solid var(--color-shell-line);
  }
  .bar.problem {
    border-top-color: var(--color-shell-warning-line);
  }
  .lead {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
  }
  .status {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    min-width: 0;
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.35;
    color: var(--color-shell-muted);
  }
  .problem .status {
    color: var(--color-shell-warning);
  }
  .status :global(svg) {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .status :global(.icon-ok) {
    color: var(--color-shell-accent);
  }
  .status :global(.icon-warning) {
    color: var(--color-shell-warning-icon);
  }
  .status :global(.icon-wait) {
    animation: spin 1s linear infinite;
  }
  .actions {
    flex-shrink: 0;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
