// Archivio degli allenamenti nel localStorage, condiviso da tutti i componenti.

export const CALENDAR_KEY = 'bb-calendar';
export const WORKOUTS_KEY = 'bb-workouts';
// Chiave usata dalle versioni precedenti di WorkoutEditor: viene migrata in WORKOUTS_KEY.
const LEGACY_WORKOUT_KEY = 'workout';
export const UPDATED_EVENT = 'bb:updated';

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  date: string; // YYYY-MM-DD, ora locale
  exercises: Exercise[];
}

export type CalendarConfig = Record<string, string>;

// Indicizzati come Date.getDay() (0 = domenica)
export const DAY_NAMES = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
// Ordine di visualizzazione della settimana
export const WEEK_DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

// --- Date ---

/** Data in formato YYYY-MM-DD secondo l'ora locale (non UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte YYYY-MM-DD in una Date locale; null se il formato o la data non sono validi. */
export function parseDateKey(key: string | null | undefined): Date | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return toDateKey(date) === key ? date : null;
}

export function dayNameOf(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function workoutUrl(dateKey: string): string {
  return `/workout?date=${dateKey}`;
}

// --- HTML ---

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Validazione ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSet(value: unknown): value is WorkoutSet {
  return (
    isRecord(value) &&
    typeof value.reps === 'number' &&
    Number.isFinite(value.reps) &&
    typeof value.weight === 'number' &&
    Number.isFinite(value.weight)
  );
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    Array.isArray(value.sets) &&
    value.sets.every(isSet)
  );
}

export function isWorkout(value: unknown): value is Workout {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    parseDateKey(value.date) !== null &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isExercise)
  );
}

/** Valida un intero file di importazione; lancia un Error con un messaggio in italiano. */
export function parseWorkouts(value: unknown): Workout[] {
  if (!Array.isArray(value)) {
    throw new Error('Formato non valido: serve un array di allenamenti');
  }
  value.forEach((item, i) => {
    if (!isWorkout(item)) {
      throw new Error(`L'allenamento n. ${i + 1} non è valido`);
    }
  });
  const dates = new Set<string>();
  for (const w of value as Workout[]) {
    if (dates.has(w.date)) throw new Error(`Data duplicata nel file: ${w.date}`);
    dates.add(w.date);
  }
  return value as Workout[];
}

// --- localStorage ---

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Errore leggendo "${key}":`, e);
    return null;
  }
}

function notifyUpdated(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

export function loadCalendar(): CalendarConfig {
  const data = readJson(CALENDAR_KEY);
  if (!isRecord(data)) return {};
  const config: CalendarConfig = {};
  for (const [day, name] of Object.entries(data)) {
    if (typeof name === 'string') config[day] = name;
  }
  return config;
}

export function saveCalendar(config: CalendarConfig): void {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(config));
}

export function resetCalendar(): void {
  localStorage.removeItem(CALENDAR_KEY);
}

let legacyChecked = false;

function migrateLegacyWorkout(): void {
  if (legacyChecked) return;
  legacyChecked = true;
  const legacy = readJson(LEGACY_WORKOUT_KEY);
  if (legacy === null) return;
  if (isWorkout(legacy) && legacy.exercises.length > 0) {
    const data = readJson(WORKOUTS_KEY);
    const list = Array.isArray(data) ? data.filter(isWorkout) : [];
    if (!list.some((w) => w.date === legacy.date)) {
      list.push(legacy);
      writeWorkouts(list);
    }
  }
  localStorage.removeItem(LEGACY_WORKOUT_KEY);
}

function writeWorkouts(list: Workout[]): void {
  const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(sorted));
}

/** Tutti gli allenamenti salvati, in ordine di data crescente. */
export function loadWorkouts(): Workout[] {
  migrateLegacyWorkout();
  const data = readJson(WORKOUTS_KEY);
  return Array.isArray(data) ? data.filter(isWorkout) : [];
}

export function getWorkout(date: string): Workout {
  return loadWorkouts().find((w) => w.date === date) ?? { date, exercises: [] };
}

/** Salva l'allenamento della sua data; un allenamento senza esercizi viene rimosso. */
export function putWorkout(workout: Workout): void {
  const others = loadWorkouts().filter((w) => w.date !== workout.date);
  if (workout.exercises.length > 0) others.push(workout);
  writeWorkouts(others);
  notifyUpdated();
}

/** Unisce gli allenamenti importati: quelli con la stessa data sostituiscono gli esistenti. */
export function mergeWorkouts(imported: Workout[]): void {
  const byDate = new Map(loadWorkouts().map((w) => [w.date, w]));
  imported.forEach((w) => byDate.set(w.date, w));
  writeWorkouts([...byDate.values()]);
  notifyUpdated();
}

export function clearWorkouts(): void {
  localStorage.removeItem(WORKOUTS_KEY);
  notifyUpdated();
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
