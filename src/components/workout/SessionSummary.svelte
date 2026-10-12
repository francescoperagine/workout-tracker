<script lang="ts">
  // Riepilogo di fine allenamento (US-18, brief route-workout: "una schermata a sé dopo Termina"):
  // durata, esercizi, serie, volume e record battuti (carico, 1RM stimato, volume: US-29), poi cosa si è fatto per
  // esercizio. Dopo il primo allenamento concluso, l'invito discreto a installare l'app (US-03).
  // La sessione resta modificabile: "Riapri allenamento" la rimette in corso.
  import { onMount } from 'svelte';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import Trophy from '@lucide/svelte/icons/trophy';
  import { exerciseName, finishedCount, sessionRecords, setNumbers, workoutSummary, type Archive, type RecordKind, type Session } from '../../lib/archive';
  import { formatClock, formatElapsed, formatLongDay, plural } from '../../lib/format';
  import { formatWeight } from '../../lib/units';
  import { appUrl } from '../../lib/paths';
  import { INSTALL_EVENT, canPromptInstall, promptInstall } from '../../lib/pwa';
  import { isIos, isStandalone } from '../../lib/device';

  interface Props {
    archive: Archive;
    session: Session;
    today: string;
    onreopen: () => void;
  }

  let { archive, session, today, onreopen }: Props = $props();

  const settings = $derived(archive.settings);
  const summary = $derived(workoutSummary(session, Date.now()));
  // le sessioni importate dal PoC non hanno una durata vera
  const hasDuration = $derived(summary.duration >= 60_000);

  const rows = $derived(
    [
      hasDuration ? { term: 'Durata', value: formatElapsed(summary.duration) } : null,
      { term: 'Esercizi', value: String(summary.exercises) },
      { term: 'Serie', value: summary.warmupSets ? `${summary.sets} + ${summary.warmupSets} di riscaldamento` : String(summary.sets) },
      summary.volume > 0 ? { term: 'Volume', value: formatWeight(summary.volume, settings) } : null,
    ].filter((r) => r !== null),
  );

  /** "40 × 8 · 40 × 8 · R 20 × 10": le serie fatte, il riscaldamento con la sigla */
  function setsLine(e: Session['exercises'][number]): string {
    const numbers = setNumbers(e.sets);
    return e.sets
      .map((s, i) => ({ s, n: numbers[i] }))
      .filter(({ s }) => s.completedAt !== null)
      .map(({ s }) => {
        const value = [s.kg === null ? '' : formatWeight(s.kg, settings, false), s.reps === null ? '' : String(s.reps)].filter(Boolean).join(' × ');
        return s.type === 'warmup' ? `R ${value}` : value;
      })
      .join(' · ');
  }

  // record per esercizio: "Carico 45 kg, prima 40 kg · 1RM stimato …"
  const RECORD_LABEL: Record<RecordKind, string> = { load: 'Carico', e1rm: '1RM stimato', volume: 'Volume' };
  const records = $derived(sessionRecords(archive, session));
  const recordsByExercise = $derived(
    [...new Set(records.map((r) => r.exerciseId))].map((exerciseId) => ({
      exerciseId,
      text: records
        .filter((r) => r.exerciseId === exerciseId)
        .map((r) => `${RECORD_LABEL[r.kind]} ${formatWeight(r.value, settings)}, prima ${formatWeight(r.previous, settings)}`)
        .join(' · '),
    })),
  );

  const done = $derived(session.exercises.filter((e) => e.sets.some((s) => s.completedAt !== null)));
  const skipped = $derived(session.exercises.length - done.length);

  // --- invito all'installazione: solo dopo il primo allenamento concluso, e solo se si può fare -----
  const first = $derived(finishedCount(archive) === 1);
  let canPrompt = $state(false);
  let ios = $state(false);
  let installed = $state(true);

  onMount(() => {
    const refresh = () => {
      installed = isStandalone();
      canPrompt = canPromptInstall();
    };
    ios = isIos();
    refresh();
    window.addEventListener(INSTALL_EVENT, refresh);
    return () => window.removeEventListener(INSTALL_EVENT, refresh);
  });

  const invite = $derived(first && !installed && (canPrompt || ios));
</script>

<div class="summary">
  <div class="head">
    <CircleCheck size={28} aria-hidden="true" class="text-accent-text" />
    <h2 class="title">Allenamento concluso</h2>
    <p class="meta">
      {[session.name, formatLongDay(session.date, today), hasDuration && session.end ? `${formatClock(session.start)}–${formatClock(session.end)}` : '']
        .filter(Boolean)
        .join(' · ')}
    </p>
  </div>

  <dl class="stats">
    {#each rows as row (row.term)}
      <div class="stat">
        <dt>{row.term}</dt>
        <dd>{row.value}</dd>
      </div>
    {/each}
  </dl>

  {#if records.length}
    <section aria-labelledby="records-title" class="section">
      <h3 id="records-title" class="subtitle"><Trophy size={20} aria-hidden="true" class="text-accent-text" />{records.length === 1 ? 'Record battuto' : 'Record battuti'}</h3>
      <ul class="list">
        {#each recordsByExercise as record (record.exerciseId)}
          <li>
            <a class="name" href={`${appUrl('/exercise')}?id=${encodeURIComponent(record.exerciseId)}`}>{exerciseName(archive, record.exerciseId)}</a>
            <span class="detail">{record.text}</span>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section aria-labelledby="done-title" class="section">
    <h3 id="done-title" class="subtitle">Cosa hai fatto</h3>
    <ul class="list">
      {#each done as exercise (exercise.id)}
        <li>
          <span class="name">{exerciseName(archive, exercise.exerciseId)}</span>
          <span class="detail">{setsLine(exercise)}</span>
        </li>
      {/each}
    </ul>
    {#if skipped}
      <p class="detail">{skipped === 1 ? '1 esercizio senza serie fatte' : `${skipped} esercizi senza serie fatte`}: restano nell’allenamento, così riaprendolo li ritrovi.</p>
    {/if}
  </section>

  {#if invite}
    <section class="panel install" aria-labelledby="install-title">
      <h3 id="install-title" class="install-title">Tienila sul telefono</h3>
      <p class="m-0">Installata sulla schermata Home, Workout Tracker si apre come un’app e funziona anche senza rete.</p>
      {#if canPrompt}
        <button type="button" class="btn btn-secondary self-start" onclick={() => promptInstall()}>Installa l’app</button>
      {:else}
        <p class="m-0 text-muted">In Safari tocca Condividi, poi «Aggiungi alla schermata Home». Su iPhone è anche il modo per non perdere i dati.</p>
      {/if}
    </section>
  {/if}

  <div class="actions">
    <a class="btn btn-primary btn-block" href={appUrl('/')}>Fatto</a>
    <button type="button" class="btn btn-secondary btn-block" onclick={onreopen}>Riapri allenamento</button>
  </div>
</div>

<style>
  .summary {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
  }
  .meta {
    margin: 0;
    color: var(--color-muted);
  }
  .stats {
    margin: 0;
    border-top: 1px solid var(--color-line);
  }
  .stat {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    min-height: 48px;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  dt {
    color: var(--color-muted);
  }
  dd {
    margin: 0;
    font-size: var(--text-digits);
    font-weight: 600;
    text-align: right;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .subtitle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: var(--text-xl);
    font-weight: 700;
  }
  .list {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    border-top: 1px solid var(--color-line);
  }
  .name {
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .detail {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-sm);
  }
  .install {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .install-title {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: 700;
  }
  .install p {
    max-width: 56ch;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
