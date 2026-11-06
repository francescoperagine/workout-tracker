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

/**
 * Tre campane brevi e ascendenti (Do6, Mi6, Sol6), al posto dei bip a onda quadra che suonavano aspri
 * (INC-014). Ogni nota è una sinusoide con un'armonica leggera all'ottava, attacco morbido (~10 ms) e coda
 * esponenziale (~0,8 s); le fondamentali tra 1 e 2 kHz, dove l'altoparlante del telefono rende. Il compressore tiene
 * alto il volume senza distorcere quando le code si sovrappongono. Limite: la sinusoide pura si sentiva poco
 * in palestra (prova del 12 ottobre 2026); va riprovata lì. Il volume resta quello dei contenuti multimediali.
 */
export function playEndSound(): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  // fondamentale e armonica all'ottava, più piano: un oscillatore per nota
  const bell = ctx.createPeriodicWave(new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0.25]));
  const t0 = ctx.currentTime + 0.02;
  [1047, 1319, 1568].forEach((frequency, i) => {
    const start = t0 + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.setPeriodicWave(bell);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.8, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.8);
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + 0.85);
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
