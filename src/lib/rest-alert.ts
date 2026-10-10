// Avvisi di fine recupero (US-24): suono generato in locale con AudioContext (nessun file scaricato,
// brief del timer) e vibrazione dove il browser la permette. Su iOS l'audio parte solo se il contesto
// è stato sbloccato da un gesto: lo sblocca la spunta della serie (`unlockAudio`).
import { canVibrate } from './device';

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    context = null;
  }
  return context;
}

/** Da chiamare dentro un gesto dell'utente (la spunta): il suono di fine potrà partire. */
export function unlockAudio(): void {
  const ctx = audioContext();
  if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => {});
}

/** Tre toni brevi e acuti, distinguibili nel rumore della sala pesi. */
export function playEndSound(): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  const t0 = ctx.currentTime + 0.02;
  [0, 0.28, 0.56].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === 2 ? 1320 : 880;
    const start = t0 + offset;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.4, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.22);
  });
}

export function vibrateEnd(): void {
  if (canVibrate()) navigator.vibrate([200, 100, 200, 100, 400]);
}

/** Suono e vibrazione secondo le Impostazioni */
export function alertRestEnd(settings: { sound: boolean; vibration: boolean }): void {
  if (settings.sound) playEndSound();
  if (settings.vibration) vibrateEnd();
}
