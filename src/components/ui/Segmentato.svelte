<script lang="ts" generics="T extends string">
  // Controllo segmentato (radiogroup nativo): una scelta tra poche opzioni sempre visibili.
  interface Props {
    nome: string;
    etichetta: string;
    opzioni: readonly { valore: T; etichetta: string }[];
    valore: T;
    onchange?: (valore: T) => void;
  }

  let { nome, etichetta, opzioni, valore = $bindable(), onchange }: Props = $props();
</script>

<fieldset class="segmentato">
  <legend class="etichetta">{etichetta}</legend>
  <div class="opzioni">
    {#each opzioni as opzione (opzione.valore)}
      <label class:attiva={valore === opzione.valore}>
        <input type="radio" name={nome} value={opzione.valore} bind:group={valore} onchange={() => onchange?.(opzione.valore)} />
        {opzione.etichetta}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .segmentato {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .opzioni {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-pannello);
    border: 1px solid var(--color-linea-forte);
    background: var(--color-campo);
  }
  label {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 48px;
    padding: 0 0.5rem;
    border-radius: var(--radius-campo);
    color: var(--color-secondario);
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s var(--ease-uscita), color 0.15s var(--ease-uscita);
  }
  label:hover {
    color: var(--color-testo);
  }
  label.attiva {
    background: var(--color-accento);
    color: var(--color-su-accento);
  }
  input {
    position: absolute;
    inset: 0;
    opacity: 0;
    margin: 0;
    cursor: pointer;
  }
  label:has(input:focus-visible) {
    outline: 3px solid var(--color-accento-testo);
    outline-offset: 2px;
  }
</style>
