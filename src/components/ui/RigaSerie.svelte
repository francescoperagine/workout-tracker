<script lang="ts" module>
  export type TipoSerie = 'normale' | 'riscaldamento' | 'drop' | 'cedimento';
  export interface Precedente {
    kg: string;
    rip: string;
  }
</script>

<script lang="ts">
  // Riga serie, l'unità di lavoro dell'allenamento: tipo/n · precedente · peso · rip · spunta.
  // La spunta su una riga vuota conferma il precedente (1 tocco, P1); senza precedente porta al primo campo vuoto.
  import Check from '@lucide/svelte/icons/check';
  import CampoSerie from './CampoSerie.svelte';

  interface Props {
    /** numero della serie tra quelle che contano (le serie di riscaldamento non hanno numero) */
    numero: number;
    tipo?: TipoSerie;
    precedente?: Precedente | null;
    kg?: string;
    rip?: string;
    fatta?: boolean;
    unita?: 'kg' | 'lb';
    onspunta?: (fatta: boolean) => void;
  }

  let {
    numero,
    tipo = $bindable('normale'),
    precedente = null,
    kg = $bindable(''),
    rip = $bindable(''),
    fatta = $bindable(false),
    unita = 'kg',
    onspunta,
  }: Props = $props();

  const CICLO: TipoSerie[] = ['normale', 'riscaldamento', 'drop', 'cedimento'];
  const SIGLA: Record<TipoSerie, string> = { normale: '', riscaldamento: 'R', drop: 'D', cedimento: 'C' };
  const NOME: Record<TipoSerie, string> = { normale: 'normale', riscaldamento: 'di riscaldamento', drop: 'drop', cedimento: 'a cedimento' };

  let campoKg: { focus(): void } | undefined = $state();
  let campoRip: { focus(): void } | undefined = $state();

  const sigla = $derived(tipo === 'normale' ? String(numero) : SIGLA[tipo]);
  const nomeSerie = $derived(tipo === 'riscaldamento' ? 'riscaldamento' : `serie ${numero}`);

  function cambiaTipo() {
    tipo = CICLO[(CICLO.indexOf(tipo) + 1) % CICLO.length];
  }

  function copiaPrecedente() {
    if (!precedente) return;
    kg = precedente.kg;
    rip = precedente.rip;
  }

  function spunta() {
    if (fatta) {
      fatta = false;
      onspunta?.(false);
      return;
    }
    if (precedente) {
      if (!kg) kg = precedente.kg;
      if (!rip) rip = precedente.rip;
    }
    if (!kg) return campoKg?.focus();
    if (!rip) return campoRip?.focus();
    fatta = true;
    onspunta?.(true);
  }
</script>

<div class="riga" class:fatta>
  <button
    type="button"
    class="tipo"
    class:speciale={tipo !== 'normale'}
    onclick={cambiaTipo}
    aria-label={`Serie ${NOME[tipo]}: tocca per cambiare tipo`}
  >
    {sigla}
  </button>

  {#if precedente}
    <button type="button" class="precedente" onclick={copiaPrecedente} aria-label={`Copia il precedente: ${precedente.kg} ${unita} per ${precedente.rip}`}>
      {precedente.kg} × {precedente.rip}
    </button>
  {:else}
    <span class="precedente vuoto" aria-label="Nessun precedente">—</span>
  {/if}

  <CampoSerie bind:value={kg} bind:this={campoKg} tipo="decimale" etichetta={`Peso ${nomeSerie}, ${unita}`} placeholder={precedente?.kg} fatto={fatta} />
  <CampoSerie bind:value={rip} bind:this={campoRip} tipo="intero" etichetta={`Ripetizioni ${nomeSerie}`} placeholder={precedente?.rip} fatto={fatta} />

  <button type="button" class="spunta" onclick={spunta} aria-pressed={fatta} aria-label={fatta ? `Annulla ${nomeSerie}` : `Segna ${nomeSerie} come fatta`}>
    <Check size={22} strokeWidth={fatta ? 2.75 : 2} aria-hidden="true" />
  </button>
</div>

<style>
  .riga {
    display: grid;
    grid-template-columns: 2rem minmax(3.75rem, 1fr) minmax(3.25rem, 4.75rem) minmax(3rem, 4rem) 3rem;
    gap: clamp(0.25rem, 1.6vw, 0.5rem);
    align-items: center;
    min-height: 56px;
    margin-inline: -0.375rem;
    padding-inline: 0.375rem;
    border-radius: var(--radius-campo);
    transition: background-color 0.2s var(--ease-uscita);
  }
  .riga.fatta {
    background: var(--color-fatto);
  }
  .tipo {
    height: 48px;
    border-radius: var(--radius-campo);
    font-weight: 650;
    font-size: var(--text-lg);
    color: var(--color-secondario);
    font-variant-numeric: tabular-nums;
  }
  .tipo.speciale {
    color: var(--color-accento-testo);
  }
  .fatta .tipo {
    color: var(--color-accento-testo);
  }
  .precedente {
    min-height: 48px;
    text-align: left;
    color: var(--color-secondario);
    font-size: var(--text-base);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums;
  }
  button.precedente:hover {
    color: var(--color-testo);
  }
  .precedente.vuoto {
    display: flex;
    align-items: center;
  }
  .spunta {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-campo);
    border: 1.5px solid var(--color-linea-forte);
    color: var(--color-secondario);
    transition: background-color 0.15s var(--ease-uscita), border-color 0.15s var(--ease-uscita);
  }
  .spunta:hover {
    border-color: var(--color-accento-testo);
    color: var(--color-accento-testo);
  }
  .fatta .spunta {
    background: var(--color-accento);
    border-color: var(--color-accento);
    color: var(--color-su-accento);
  }
  button {
    cursor: pointer;
  }
  button:focus-visible {
    outline-offset: 1px;
  }
</style>
