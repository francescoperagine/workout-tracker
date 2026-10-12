// Modello dati v2 dell'archivio (step 2). Vedi docs/restyling/PIANO.md, "Modello dati v2".
// Regola delle unità: pesi sempre in kg e distanze in metri; la conversione avviene solo
// in ingresso e in uscita (src/lib/units.ts).

export const ARCHIVE_KEY = 'workout-tracker.archive.v2';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const SET_TYPES = ['normal', 'warmup', 'drop', 'failure'] as const;
export type SetType = (typeof SET_TYPES)[number];

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'm' | 'ft';

/** Esercizio di base del catalogo (src/data/catalog.ts). Gli approfondimenti possono essere vuoti. */
export interface CatalogExercise {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  steps: string[];
  caution: string;
  sources: { title: string; url: string }[];
}

/** Esercizio creato dall'utente scrivendo un nome a mano (US-14). Vive in `archive.catalog`. */
export interface CustomExercise {
  id: string;
  name: string;
}

/** Voce di una scheda */
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  /** id di esercizi alternativi, per quando la macchina è occupata */
  alternatives: string[];
  /** stessa stringa = superserie */
  group: string | null;
  /** serie target */
  sets: number;
  /** testo libero, anche un intervallo: "6–8" */
  reps: string;
  /** kg */
  loadMin: number | null;
  /** kg; uguale a loadMin se non è un intervallo */
  loadMax: number | null;
  loadNote: string;
  /** testo per l'utente: "per manubrio" */
  unit: string;
  /** secondi */
  rest: number;
  /** secondi */
  warmupRest: number;
}

/** Scheda */
export interface Routine {
  id: string;
  name: string;
  notes: string;
  archived: boolean;
  exercises: RoutineExercise[];
}

export interface SessionSet {
  id: string;
  type: SetType;
  /** sempre in kg, anche se l'utente usa lb */
  kg: number | null;
  reps: number | null;
  /** timestamp della spunta; null = non completata */
  completedAt: number | null;
}

export interface SessionExercise {
  id: string;
  /** esercizio fatto davvero (la variante, se c'è) */
  exerciseId: string;
  /** esercizio previsto dalla scheda, quando si è passati a una variante */
  variantOf: string | null;
  group: string | null;
  rest: number;
  warmupRest: number;
  notes: string;
  sets: SessionSet[];
}

export interface Session {
  id: string;
  /** YYYY-MM-DD in ora locale */
  date: string;
  routineId: string | null;
  name: string;
  start: number;
  /** null = in corso (al massimo una sessione alla volta) */
  end: number | null;
  exercises: SessionExercise[];
}

export interface Settings {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  /** secondi, usato quando la voce non ha un recupero */
  defaultRest: number;
  sound: boolean;
  vibration: boolean;
}

/**
 * Pianificazione ed eccezioni: un id di scheda, `null` = riposo, chiave assente = nulla di pianificato.
 */
export type Schedule = Partial<Record<Weekday, string | null>>;

export interface Archive {
  version: 2;
  /** incrementata a ogni salvataggio, per i conflitti tra schede del browser */
  revision: number;
  /** solo gli esercizi personalizzati; quelli di base arrivano dal codice */
  catalog: Record<string, CustomExercise>;
  routines: Routine[];
  schedule: Schedule;
  /** YYYY-MM-DD -> id scheda, o null per riposo */
  overrides: Record<string, string | null>;
  sessions: Session[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  weightUnit: 'kg',
  distanceUnit: 'm',
  defaultRest: 90,
  sound: true,
  vibration: true,
};

/** Limiti del PoC, più quelli delle parti nuove (schede, catalogo personale). */
/** Predefiniti di una voce di scheda nuova: serie e recupero di riscaldamento (s), modificabili nella scheda. */
export const DEFAULT_SETS = 3;
export const DEFAULT_WARMUP_REST = 60;

export const LIMITS = {
  importBytes: 10 * 1024 * 1024,
  sessions: 10_000,
  exercisesPerSession: 100,
  setsPerExercise: 100,
  routines: 200,
  exercisesPerRoutine: 100,
  alternativesPerExercise: 20,
  customExercises: 5_000,
  idLength: 200,
  sessionNameLength: 120,
  routineNameLength: 120,
  exerciseNameLength: 200,
  notesLength: 1000,
  shortTextLength: 100,
  /** kg, ripetizioni (come nel PoC) */
  maxValue: 10_000,
  /** secondi */
  maxRest: 3600,
} as const;

export function emptyArchive(): Archive {
  return {
    version: 2,
    revision: 0,
    catalog: {},
    routines: [],
    schedule: {},
    overrides: {},
    sessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export class ArchiveError extends Error {
  override name = 'ArchiveError';
}
