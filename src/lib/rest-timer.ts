// Timer di recupero (step 7: US-21…US-26). Logica pura, senza DOM: l'istante di fine (`end`) è la
// verità, il tempo che resta si ricalcola sempre da lì. Così bloccare il telefono, ricaricare o
// cambiare pagina non sposta il conteggio (US-26): al rientro il tempo è giusto, o il recupero è finito.
// Lo stato vive in una chiave sua (`bodytracker.restTimer`), fuori dall'archivio: cambia spesso e non
// fa parte del diario (PIANO.md, "Modello dati v2").
import { blocksOf } from './archive/routine-edit';
import { exerciseName } from './archive/catalog';
import { plannedEntry, previousExercise, previousSets, setNumbers } from './archive/workout';
import type { Archive, Session } from './archive/types';
import { formatWeight } from './units';

export const REST_TIMER_KEY = 'bodytracker.restTimer';

/** Soglie degli annunci per lo screen reader (P9): solo a 30 s, 10 s e alla fine */
export const ANNOUNCE_AT = [30, 10, 0] as const;
/** Secondi di −15 s e +15 s */
export const REST_STEP = 15;
/** Lo schermo "Vai" si chiude da solo dopo tanti millisecondi in vista */
export const GO_VISIBLE_MS = 6_000;
/** Oltre questo ritardo la fine non suona più: l'utente era altrove e lo vede al rientro */
export const LATE_ALERT_MS = 60_000;

export interface RestTimerState {
  sessionId: string;
  /** voce della sessione (SessionExercise.id) */
  exerciseId: string;
  /** serie la cui spunta ha avviato il recupero: togliere la spunta lo annulla */
  setId: string;
  /** timestamp */
  start: number;
  /** timestamp della fine: l'unica verità del conteggio */
  end: number;
  /** durata complessiva in secondi, dopo −15 s e +15 s */
  duration: number;
  /** recupero di riscaldamento */
  warmup: boolean;
  /** ridotto in barra (US-23) */
  minimized: boolean;
  /** suono e vibrazione di fine già dati (una volta sola, anche tra pagine e schede) */
  alerted: boolean;
}

export interface RestStart {
  seconds: number;
  warmup: boolean;
}

/** Secondi che restano, arrotondati per eccesso: 1:00 resta 1:00 per tutto il primo secondo */
export function restRemaining(state: Pick<RestTimerState, 'end'>, now: number): number {
  return Math.max(0, Math.ceil((state.end - now) / 1000));
}

export function isRestOver(state: Pick<RestTimerState, 'end'>, now: number): boolean {
  return now >= state.end;
}

/** Quanto livello resta (1 → 0), a scatti di un secondo */
export function restFraction(state: Pick<RestTimerState, 'end' | 'duration'>, now: number): number {
  if (state.duration <= 0) return 0;
  return Math.min(1, restRemaining(state, now) / state.duration);
}

/** Secondi passati dalla fine del recupero (0 se non è finito) */
export function restOverFor(state: Pick<RestTimerState, 'end'>, now: number): number {
  return Math.max(0, Math.floor((now - state.end) / 1000));
}

export function startRest(
  target: Pick<RestTimerState, 'sessionId' | 'exerciseId' | 'setId'>,
  rest: RestStart,
  now: number,
): RestTimerState | null {
  // 0 = nessun timer (US-21)
  if (!(rest.seconds > 0)) return null;
  return { ...target, start: now, end: now + rest.seconds * 1000, duration: rest.seconds, warmup: rest.warmup, minimized: false, alerted: false };
}

/**
 * −15 s / +15 s (US-22). La fine non va mai prima di adesso: togliere più del tempo che resta chiude
 * il recupero. A recupero finito non cambia nulla.
 */
export function shiftRest(state: RestTimerState, seconds: number, now: number): RestTimerState {
  if (isRestOver(state, now)) return state;
  const end = Math.max(now, state.end + seconds * 1000);
  return { ...state, end, duration: Math.max(0, Math.round((end - state.start) / 1000)) };
}

/**
 * Il recupero che parte alla spunta di una serie, o null (US-21, US-25, PIANO "Recupero"):
 * - quello di riscaldamento per una serie di riscaldamento, altrimenti quello dell'esercizio;
 * - 0 = nessun timer;
 * - in superserie solo a fine giro: se un altro esercizio del blocco ha meno serie fatte e ne ha
 *   ancora da fare, il giro continua e il recupero non parte (2a → 2b → recupero → 2a…).
 * Il recupero predefinito delle Impostazioni vale quando nasce una voce senza recupero (voce nuova,
 * esercizio aggiunto in sessione, voce del PoC senza recupero leggibile): qui ogni esercizio ne ha uno.
 */
export function restAfterCheck(session: Pick<Session, 'exercises'>, exerciseId: string, setId: string): RestStart | null {
  const exercise = session.exercises.find((e) => e.id === exerciseId);
  const set = exercise?.sets.find((s) => s.id === setId);
  if (!exercise || !set || set.completedAt === null) return null;
  const block = blocksOf(session.exercises).find((b) => b.entries.includes(exercise));
  if (block && block.entries.length > 1) {
    const done = (e: typeof exercise) => e.sets.filter((s) => s.completedAt !== null).length;
    const mine = done(exercise);
    const roundGoesOn = block.entries.some((e) => e !== exercise && done(e) < mine && e.sets.some((s) => s.completedAt === null));
    if (roundGoesOn) return null;
  }
  const warmup = set.type === 'warmup';
  const seconds = warmup ? exercise.warmupRest : exercise.rest;
  return seconds > 0 ? { seconds, warmup } : null;
}

/**
 * true se il timer non vale più: sessione conclusa o tolta, serie tolta o con la spunta tolta
 * (US-22, anche da un'altra scheda del browser), variante cambiata (le spunte si svuotano).
 */
export function restIsStale(state: RestTimerState, archive: Pick<Archive, 'sessions'>): boolean {
  const session = archive.sessions.find((s) => s.id === state.sessionId);
  if (!session || session.end !== null) return true;
  const set = session.exercises.find((e) => e.id === state.exerciseId)?.sets.find((s) => s.id === state.setId);
  return !set || set.completedAt === null;
}

/**
 * Soglia da annunciare passando da `before` a `after` secondi restanti, o null. Dopo un salto (rientro
 * da schermo bloccato) si annuncia solo l'ultima soglia superata, mai una raffica.
 */
export function crossedThreshold(before: number, after: number): (typeof ANNOUNCE_AT)[number] | null {
  let crossed: (typeof ANNOUNCE_AT)[number] | null = null;
  for (const t of ANNOUNCE_AT) if (before > t && after <= t) crossed = t;
  return crossed;
}

/**
 * La prossima serie attesa, per il timer (US-21): "Panca piana bilanciere · serie 2 · 40 kg × 6–8".
 * Peso e ripetizioni: quelli già scritti nella riga, altrimenti la volta scorsa, altrimenti i target
 * della scheda (il carico della scheda non vale per una variante).
 */
export function nextSetText(
  archive: Archive,
  session: Session,
  next: { exercise: Session['exercises'][number]; set: Session['exercises'][number]['sets'][number] } | null,
): string | null {
  if (!next) return null;
  const { exercise, set } = next;
  const index = exercise.sets.indexOf(set);
  const number = setNumbers(exercise.sets)[index];
  const previous = previousSets(exercise, previousExercise(archive, session, exercise.exerciseId)?.exercise ?? null)[index];
  const entry = plannedEntry(archive, session, exercise);
  const kg = set.kg ?? previous?.kg ?? (exercise.variantOf || set.type === 'warmup' ? null : (entry?.loadMin ?? null));
  const reps = set.reps ?? previous?.reps ?? (set.type === 'warmup' ? null : entry?.reps || null);
  const weight = kg === null ? '' : formatWeight(kg, archive.settings);
  // spazi unificatori: "40 kg × 8" va a capo tutto insieme
  const load = weight && reps !== null ? `${weight}\u00a0×\u00a0${reps}` : weight || (reps !== null ? `${reps}\u00a0rip` : '');
  return [exerciseName(archive, exercise.exerciseId), number ? `serie ${number}` : 'riscaldamento', load].filter(Boolean).join(' · ');
}

/** Lettura tollerante della chiave: un contenuto rovinato vale come nessun timer. */
export function parseRestTimer(raw: string | null): RestTimerState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<RestTimerState>;
    const ok =
      typeof v.sessionId === 'string' &&
      typeof v.exerciseId === 'string' &&
      typeof v.setId === 'string' &&
      Number.isFinite(v.start) &&
      Number.isFinite(v.end) &&
      Number.isFinite(v.duration);
    if (!ok) return null;
    return {
      sessionId: v.sessionId!,
      exerciseId: v.exerciseId!,
      setId: v.setId!,
      start: v.start!,
      end: v.end!,
      duration: v.duration!,
      warmup: v.warmup === true,
      minimized: v.minimized === true,
      alerted: v.alerted === true,
    };
  } catch {
    return null;
  }
}
