<script lang="ts">
  // Interruttori e valore a passi, come nelle Impostazioni.
  import Stepper from '../ui/Stepper.svelte';
  import Switch from '../ui/Switch.svelte';
  import { formatDuration, speakDuration } from '../../lib/format';

  let rest = $state(90);
  let sound = $state(true);
  let vibration = $state(false);
</script>

<div class="panel flex flex-col gap-4">
  <Stepper
    label="Recupero predefinito"
    hint="Si usa per gli esercizi che nella scheda non hanno un recupero."
    bind:value={rest}
    min={15}
    max={600}
    step={15}
    format={formatDuration}
    speak={speakDuration}
    decrementLabel="−15 s"
    incrementLabel="+15 s"
  />
  <div class="flex flex-col gap-1 border-t border-line pt-3">
    <Switch label="Suono a fine recupero" bind:checked={sound} />
    <Switch label="Vibrazione a fine recupero" hint="Questo dispositivo non permette la vibrazione dal browser." bind:checked={vibration} disabled />
  </div>
</div>
