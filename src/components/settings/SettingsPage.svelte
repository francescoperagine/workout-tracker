<script lang="ts">
  // Impostazioni (US-30, US-31, US-21, US-24) e Dati e privacy (US-32, US-33, US-02, US-03).
  // Ogni preferenza si salva al cambio; il tema è del dispositivo (src/lib/theme.ts), il resto è
  // nell'archivio (settings). L'esito delle azioni sui dati arriva con un avviso breve, mai con alert().
  import { onMount } from 'svelte';
  import SegmentedControl from '../ui/SegmentedControl.svelte';
  import Stepper from '../ui/Stepper.svelte';
  import Switch from '../ui/Switch.svelte';
  import Toast from '../ui/Toast.svelte';
  import DataSection from './DataSection.svelte';
  import InstallSection from './InstallSection.svelte';
  import { archiveStore } from '../../lib/archive-store.svelte';
  import { LIMITS, type DistanceUnit, type Settings, type WeightUnit } from '../../lib/archive';
  import { THEME_LABELS, THEMES, readTheme, saveTheme, type Theme } from '../../lib/theme';
  import { canVibrate } from '../../lib/device';
  import { formatDuration, speakDuration } from '../../lib/format';

  const store = archiveStore();
  const settings = $derived(store.archive.settings);

  let theme: Theme = $state(readTheme());
  const themeOptions = THEMES.map((value) => ({ value, label: THEME_LABELS[value] }));
  const weightOptions = [
    { value: 'kg', label: 'kg' },
    { value: 'lb', label: 'lb' },
  ] as const;
  const distanceOptions = [
    { value: 'm', label: 'm' },
    { value: 'ft', label: 'ft' },
  ] as const;

  // Copie locali per i controlli; tornano ai valori dell'archivio a ogni suo cambiamento
  let weightUnit: WeightUnit = $state('kg');
  let distanceUnit: DistanceUnit = $state('m');
  let defaultRest = $state(90);
  let sound = $state(true);
  let vibration = $state(true);
  function syncFromArchive() {
    weightUnit = settings.weightUnit;
    distanceUnit = settings.distanceUnit;
    defaultRest = settings.defaultRest;
    sound = settings.sound;
    vibration = settings.vibration;
  }
  $effect(syncFromArchive);

  const vibrationSupported = canVibrate();

  let toast: { message: string; action?: string; onaction?: () => void } | null = $state(null);
  function notify(message: string, action?: string, onaction?: () => void) {
    toast = { message, action, onaction };
  }

  function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const result = store.update((a) => ({ ...a, settings: { ...a.settings, [key]: value } }));
    if (!result.ok && result.state !== 'unsaved') {
      // archivio illeggibile o in conflitto: il controllo torna al valore salvato
      syncFromArchive();
      notify('Impostazione non salvata: prima recupera il diario o ricarica.');
    }
  }

  onMount(() => {
    // apertura con #data (dalla barra di salvataggio o dal primo avvio): la sezione è già in vista
    if (location.hash === '#data') document.getElementById('data')?.scrollIntoView();
  });
</script>

<div class="flex flex-col gap-10">
  <section aria-labelledby="s-look" class="flex flex-col gap-3">
    <h2 id="s-look" class="section-title">Aspetto</h2>
    <div class="flex flex-col gap-2">
      <SegmentedControl name="theme" label="Tema" options={themeOptions} bind:value={theme} onchange={(t) => saveTheme(t)} />
      <p class="hint mt-0">Sistema segue l’impostazione chiaro/scuro del telefono. La scelta vale per questo dispositivo.</p>
    </div>
  </section>

  <section aria-labelledby="s-units" class="flex flex-col gap-3">
    <h2 id="s-units" class="section-title">Unità di misura</h2>
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2">
        <SegmentedControl name="weight-unit" label="Peso" options={weightOptions} bind:value={weightUnit} onchange={(u) => saveSetting('weightUnit', u)} />
        <p class="hint mt-0">Cambiare unità non modifica i dati salvati: cambia solo come vengono mostrati.</p>
      </div>
      <div class="flex flex-col gap-2">
        <SegmentedControl name="distance-unit" label="Distanza" options={distanceOptions} bind:value={distanceUnit} onchange={(u) => saveSetting('distanceUnit', u)} />
        <p class="hint mt-0">Per ora nessuna schermata mostra distanze: servirà per gli esercizi a distanza, come la camminata con carico.</p>
      </div>
    </div>
  </section>

  <section aria-labelledby="s-training" class="flex flex-col gap-3">
    <h2 id="s-training" class="section-title">Allenamento</h2>
    <div class="flex flex-col gap-4">
      <Stepper
        label="Recupero predefinito"
        hint="Si usa per gli esercizi che nella scheda non hanno un recupero."
        bind:value={defaultRest}
        min={15}
        max={LIMITS.maxRest}
        step={15}
        format={formatDuration}
        speak={speakDuration}
        decrementLabel="−15 s"
        incrementLabel="+15 s"
        onchange={(v) => saveSetting('defaultRest', v)}
      />
      <div class="flex flex-col gap-1 border-t border-line pt-3">
        <Switch label="Suono a fine recupero" bind:checked={sound} onchange={(v) => saveSetting('sound', v)} />
        <Switch
          label="Vibrazione a fine recupero"
          hint={vibrationSupported ? undefined : 'Questo dispositivo non permette la vibrazione dal browser.'}
          bind:checked={vibration}
          disabled={!vibrationSupported}
          onchange={(v) => saveSetting('vibration', v)}
        />
      </div>
      <p class="hint mt-0">
        Gli avvisi di fine recupero arrivano solo con l’app aperta, che tiene lo schermo acceso durante l’allenamento. Con il
        telefono bloccato o l’app chiusa non sono garantiti.
      </p>
    </div>
  </section>

  <DataSection {notify} />

  <InstallSection />
</div>

<Toast message={toast?.message ?? null} action={toast?.action} onaction={toast?.onaction} onclose={() => (toast = null)} />

<style>
  p {
    max-width: 56ch;
  }
  /* titolo di sezione nel contenuto: "Titolo pagina" di DESIGN.md */
  .section-title {
    margin: 0;
    font-size: var(--text-page-title);
    line-height: var(--text-page-title--line-height);
    font-weight: 700;
  }
</style>
