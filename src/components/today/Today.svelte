<script lang="ts">
  // Oggi, versione dello step 3: porta al primo avvio se nel browser non c'è ancora un archivio
  // (US-01) e conferma che il diario è pronto. Avvio dell'allenamento, schede recenti e settimana
  // arrivano con lo step 5.
  import { onMount } from 'svelte';
  import { navigate } from 'astro:transitions/client';
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { activeRoutines } from '../../lib/archive';
  import { plural } from '../../lib/format';
  import { appUrl } from '../../lib/paths';

  const store = archiveStore();
  let ready = $state(false);

  onMount(() => {
    if (store.isNew) void navigate(appUrl('/welcome'), { history: 'replace' });
    else ready = true;
  });

  const routines = $derived(activeRoutines(store.archive));
  const sessions = $derived(store.archive.sessions.length);
</script>

{#if ready && store.state === 'unreadable'}
  <!-- messaggio in linea, mai un'azione che sovrascrive (brief di Oggi) -->
  <div class="flex flex-col items-start gap-3 py-8">
    <CircleAlert size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario salvato non è leggibile</h2>
    <p class="m-0 max-w-[60ch] text-muted">
      Non è stato sovrascritto. In Dati e privacy puoi scaricarne il contenuto originale e importare un backup.
    </p>
    <a href={appUrl('/settings#data')} class="btn btn-primary">Vai a Dati e privacy</a>
  </div>
{:else if ready}
  <div class="flex flex-col items-start gap-3 py-8">
    <Dumbbell size={28} class="text-muted" aria-hidden="true" />
    <h2 class="m-0 text-xl leading-snug font-bold">Il diario è pronto</h2>
    <p class="m-0 max-w-[60ch] text-muted">
      Su questo dispositivo: {plural(routines.length, 'scheda', 'schede')}{routines.length
        ? ` (${routines.map((r) => r.name).join(', ')})`
        : ''}, {plural(sessions, 'allenamento', 'allenamenti')}. L’avvio dell’allenamento dalla scheda del giorno arriva con
      il prossimo aggiornamento dell’app.
    </p>
    <a href={appUrl('/settings')} class="btn btn-secondary">Impostazioni e backup</a>
  </div>
{/if}
