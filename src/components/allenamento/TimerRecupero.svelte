<script lang="ts" module>
  export function formattaDurata(secondi: number): string {
    const s = Math.max(0, Math.round(secondi));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
</script>

<script lang="ts">
  // Timer di recupero a tutto schermo (US-21…23): lo schermo stesso è la clessidra.
  // Un livello verde scende a ogni secondo; alla fine tutto lo schermo passa all'accento con "Vai".
  // Il motore definitivo (istante di fine persistito, wake lock, suono) arriva allo step 7:
  // qui il conto si basa già sull'istante di fine, quindi resta giusto anche se la scheda va in background.
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import Timer from '@lucide/svelte/icons/timer';
  import { untrack } from 'svelte';

  interface Props {
    /** durata impostata, in secondi */
    durata: number;
    /** prossima serie attesa, es. "Panca piana · serie 2 · 40 kg × 6–8"; null all'ultimo esercizio */
    prossima?: string | null;
    /** true mentre il recupero è in corso (aperto o ridotto) */
    attivo?: boolean;
    /** solo per /kit: disegna lo schermo fermo, in un riquadro, con questi secondi restanti (0 = "Vai") */
    anteprima?: number | null;
    /** solo per /kit, con anteprima: disegna la barra del timer ridotto */
    anteprimaRidotta?: boolean;
    onfine?: () => void;
  }

  let { durata, prossima = null, attivo = $bindable(false), anteprima = null, anteprimaRidotta = false, onfine }: Props = $props();

  let fine = $state(0);
  let totale = $state(0);
  let adesso = $state(Date.now());
  let ridotto = $state(false);
  let dialogo: HTMLDialogElement | undefined = $state();
  let annuncio = $state('');
  let ultimoAnnuncio = -1;
  let chiusuraVai: ReturnType<typeof setTimeout> | undefined;

  const restanti = $derived(anteprima ?? Math.max(0, Math.ceil((fine - adesso) / 1000)));
  const frazione = $derived(anteprima !== null ? anteprima / durata : totale > 0 ? Math.min(1, restanti / totale) : 0);
  const vai = $derived(restanti === 0);
  const finale = $derived(restanti > 0 && restanti <= 10);

  // Avvio e arresto
  $effect(() => {
    if (anteprima !== null || !attivo) return;
    untrack(() => {
      if (fine !== 0) return;
      fine = Date.now() + durata * 1000;
      totale = durata;
      ridotto = false;
      ultimoAnnuncio = -1;
    });
    const intervallo = setInterval(() => (adesso = Date.now()), 250);
    const visibilita = () => (adesso = Date.now());
    document.addEventListener('visibilitychange', visibilita);
    return () => {
      clearInterval(intervallo);
      document.removeEventListener('visibilitychange', visibilita);
    };
  });

  $effect(() => {
    if (attivo) return;
    fine = 0;
    clearTimeout(chiusuraVai);
  });

  // Overlay modale solo quando è attivo e non ridotto
  $effect(() => {
    if (!dialogo) return;
    const mostra = attivo && !ridotto;
    if (mostra && !dialogo.open) dialogo.showModal();
    else if (!mostra && dialogo.open) dialogo.close();
  });

  // Annunci solo a soglie (P9) e chiusura dopo "Vai"
  $effect(() => {
    if (anteprima !== null || !attivo || fine === 0) return;
    const r = restanti;
    if (r === ultimoAnnuncio) return;
    if (r === 30 || r === 10) annuncio = `Mancano ${r} secondi di recupero`;
    if (r === 0) {
      annuncio = prossima ? `Recupero finito. Vai: ${prossima}` : 'Recupero finito';
      onfine?.();
      chiusuraVai = setTimeout(chiudi, 6000);
    }
    ultimoAnnuncio = r;
  });

  function sposta(secondi: number) {
    adesso = Date.now();
    fine = Math.max(adesso, fine + secondi * 1000);
    const r = Math.ceil((fine - adesso) / 1000);
    if (r > totale) totale = r;
  }

  function chiudi() {
    clearTimeout(chiusuraVai);
    attivo = false;
  }

  function annulla(evento: Event) {
    // Esc riduce invece di chiudere: il recupero continua
    evento.preventDefault();
    ridotto = true;
  }
</script>

{#snippet schermo()}
  <div class="schermo" class:vai class:finale>
    <!-- il livello pieno si ferma sotto l'intestazione, così la linea lime non la attraversa -->
    <div class="livello" style:height={`calc(${vai ? 0 : frazione} * (100% - 4.5rem))`} aria-hidden="true"></div>
    <div class="testa">
      <span>Recupero · {formattaDurata(durata)}</span>
      <button type="button" class="pulsante pulsante-icona" aria-label="Riduci il timer" onclick={() => (ridotto = true)}>
        <Minimize2 size={22} aria-hidden="true" />
      </button>
    </div>
    <div class="centro">
      <p class="cifre-timer" class:lunghe={restanti >= 600} aria-hidden="true">{vai ? 'Vai' : formattaDurata(restanti)}</p>
      <p class="prossima">
        {#if prossima}
          <span class="etichetta-prossima">{vai ? 'Adesso' : 'Prossima'}</span>
          {prossima}
        {:else}
          <span class="etichetta-prossima">Ultimo esercizio</span>
          Quando hai finito, Termina
        {/if}
      </p>
    </div>
    <div class="comandi">
      {#if vai}
        <button type="button" class="lastra ampia" onclick={chiudi}>Chiudi</button>
      {:else}
        <button type="button" class="lastra" onclick={() => sposta(-15)} aria-label="Togli 15 secondi">−15 s</button>
        <button type="button" class="lastra" onclick={() => sposta(15)} aria-label="Aggiungi 15 secondi">+15 s</button>
        <button type="button" class="lastra" onclick={chiudi}>Salta</button>
      {/if}
    </div>
    {#if !vai}
      <button type="button" class="pulsante pulsante-testo riduci" onclick={() => (ridotto = true)}>Riduci</button>
    {/if}
    <p class="sr-only" role="status" aria-live="assertive">{annuncio}</p>
  </div>
{/snippet}

{#snippet barra(cliccabile: boolean)}
  <svelte:element
    this={cliccabile ? 'button' : 'div'}
    type={cliccabile ? 'button' : undefined}
    class="guscio ridotto"
    class:vai
    onclick={cliccabile ? () => (ridotto = false) : undefined}
    aria-label={cliccabile ? `Recupero: ${vai ? 'finito' : formattaDurata(restanti) + ' restanti'}. Tocca per aprire` : undefined}
  >
    <span class="barra-livello" style:width={`${vai ? 100 : frazione * 100}%`} aria-hidden="true"></span>
    <Timer size={20} aria-hidden="true" />
    <span class="cifre-ridotte">{vai ? 'Vai' : formattaDurata(restanti)}</span>
    <span class="prossima-ridotta">{prossima ?? 'Ultimo esercizio'}</span>
  </svelte:element>
{/snippet}

{#if anteprima !== null}
  <div
    class={['guscio', anteprimaRidotta ? 'riquadro-ridotto' : 'riquadro']}
    role="img"
    aria-label={vai ? 'Anteprima del timer: recupero finito' : `Anteprima del timer: ${formattaDurata(restanti)} restanti`}
    inert
  >
    {#if anteprimaRidotta}
      {@render barra(false)}
    {:else}
      {@render schermo()}
    {/if}
  </div>
{:else}
  <dialog bind:this={dialogo} class="guscio overlay" aria-label="Recupero" oncancel={annulla}>
    {#if attivo && !ridotto}
      {@render schermo()}
    {/if}
  </dialog>
  {#if attivo && ridotto}
    {@render barra(true)}
  {/if}
{/if}

<style>
  .overlay {
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .overlay::backdrop {
    background: var(--color-guscio);
  }
  .riquadro {
    position: relative;
    height: min(720px, 85dvh);
    border-radius: var(--radius-finestra);
    overflow: hidden;
  }
  .riquadro-ridotto {
    border-radius: var(--radius-pannello);
    overflow: hidden;
  }
  .schermo {
    position: relative;
    container-type: size;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: max(0.5rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
    overflow: hidden;
    background: var(--color-guscio);
    color: var(--color-guscio-testo);
  }
  .livello {
    position: absolute;
    inset: auto 0 0;
    background: var(--color-livello);
    border-top: 4px solid var(--color-guscio-accento);
  }
  /* Ultimi 10 s: le cifre passano all'accento, preludio allo schermo lime di "Vai" */
  .finale .cifre-timer {
    color: var(--color-guscio-accento);
  }
  .schermo.vai {
    background: var(--color-guscio-accento);
    color: var(--color-guscio-su-accento);
  }
  .testa,
  .centro,
  .comandi {
    position: relative;
  }
  .testa {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-guscio-secondario);
  }
  .vai .testa,
  .vai .testa :global(.pulsante-icona),
  .vai .etichetta-prossima {
    color: var(--color-guscio-su-accento);
  }
  .centro {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    text-align: center;
  }
  .cifre-timer {
    margin: 0;
    /* "m:ss" largo circa l'80% dello schermo; "mm:ss" un passo sotto */
    font-size: min(44cqw, 30cqh, 16rem);
    line-height: 1;
    font-weight: 650;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .cifre-timer.lunghe {
    font-size: min(35cqw, 30cqh, 13rem);
  }
  .prossima {
    margin: 0 auto;
    max-width: 30ch;
    font-size: var(--text-lg);
    line-height: 1.4;
  }
  .etichetta-prossima {
    display: block;
    font-size: var(--text-sm);
    color: var(--color-guscio-secondario);
  }
  .comandi {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.625rem;
  }
  .lastra {
    min-height: 64px;
    border-radius: var(--radius-pannello);
    border: 1px solid var(--color-guscio-linea-forte);
    background: var(--color-guscio-pannello);
    color: var(--color-guscio-testo);
    font-size: var(--text-xl);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .lastra:hover {
    background: var(--color-guscio-pannello-hover);
  }
  .riduci {
    position: relative;
    align-self: center;
    margin-top: 0.25rem;
    padding: 0 1.5rem;
    color: var(--color-guscio-secondario);
  }
  .lastra.ampia {
    grid-column: 1 / -1;
  }
  .vai .lastra {
    background: var(--color-guscio-su-accento);
    border-color: var(--color-guscio-su-accento);
    color: var(--color-guscio-accento);
  }
  .vai :global(:focus-visible) {
    outline-color: var(--color-guscio-su-accento);
  }
  .ridotto {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    min-height: 56px;
    padding: 0 1rem;
    border-top: 1px solid var(--color-guscio-linea);
    overflow: hidden;
    text-align: left;
    cursor: pointer;
  }
  .barra-livello {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--color-livello);
    border-top: 3px solid var(--color-guscio-accento);
  }
  .ridotto > :global(*:not(.barra-livello)) {
    position: relative;
  }
  .ridotto.vai {
    background: var(--color-guscio-accento);
    color: var(--color-guscio-su-accento);
  }
  .ridotto.vai .barra-livello {
    display: none;
  }
  .cifre-ridotte {
    font-size: var(--text-cifre);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .prossima-ridotta {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--text-sm);
    color: var(--color-guscio-secondario);
  }
  .ridotto.vai .prossima-ridotta {
    color: var(--color-guscio-su-accento);
  }
</style>
