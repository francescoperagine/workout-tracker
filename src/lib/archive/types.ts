// Modello dati v3 dell'archivio (v2 dallo step 2, docs/archive/restyling/PIANO.md; v3 da muscle-volume, ADR-009).
// Regola delle unità: pesi sempre in kg e distanze in metri; la conversione avviene solo
// in ingresso e in uscita (src/lib/units.ts).

// La chiave resta «v2» anche con la versione 3 (ADR-009): con una chiave nuova una scheda con il codice
// vecchio continuerebbe a leggere e scrivere un diario a parte. La versione è il campo `version`.
export const ARCHIVE_KEY = 'workout-tracker.archive.v2';

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const SET_TYPES = ['normal', 'warmup', 'drop', 'failure'] as const;
export type SetType = (typeof SET_TYPES)[number];

/** Gruppi muscolari (muscle-volume, D1 e D10; delavier-catalog, D6). Gli id sono dati: mai cambiati. */
export const MUSCLE_GROUPS = ['chest', 'lats', 'traps', 'front-delts', 'side-delts', 'rear-delts', 'biceps', 'brachialis',
  'triceps', 'forearms', 'abs', 'lower-back', 'glutes', 'hip-flexors', 'quads', 'hamstrings', 'popliteus', 'adductors',
  'calves'] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

// Quota di una serie che va a un gruppo (ADR-014): il Delavier dà solo l'ordine tra «most recruited» e «recruited»,
// i numeri vengono da Pelland et al. 2026, Sports Medicine, DOI 10.1007/s40279-025-02344-w. Stanno qui e non in
// muscles.ts perché il catalogo li usa e muscles.ts importa il catalogo (import circolare). Cambiare RECRUITED rende
// non validi i valori salvati nei personalizzati: va aggiunta la conversione in lettura (validation.ts).
export const MOST_RECRUITED = 1;
export const RECRUITED = 0.5;
export const MUSCLE_VALUES: readonly number[] = [MOST_RECRUITED, RECRUITED];

/** Muscoli di un esercizio: gruppo → quota di una serie (un valore di MUSCLE_VALUES); vuota = senza muscoli */
export type Muscles = Partial<Record<MuscleGroup, number>>;

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'm' | 'ft';

/** Esercizio di base del catalogo (src/data/catalog.ts). Gli approfondimenti possono essere vuoti. */
export interface CatalogExercise {
  id: string;
  name: string;
  /** altri nomi con cui si cerca o si scrive l'esercizio (inglese, varianti italiane); mai uguali al nome */
  aliases: string[];
  /** muscoli allenati con la quota di una serie; obbligatorio perché ogni voce del catalogo ne abbia (ADR-010) */
  muscles: Muscles;
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
  /** vuota finché l'utente non li sceglie */
  muscles: Muscles;
  /** esercizio di catalogo da cui deriva (muscle-volume, D7); null = creato da un nome scritto a mano */
  variantOf: string | null;
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
  /** esercizio fatto davvero (l'alternativa, se c'è) */
  exerciseId: string;
  /** esercizio previsto dalla scheda, quando si è passati a un'alternativa (in v2 si chiamava variantOf) */
  alternativeOf: string | null;
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
  version: 3;
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
    version: 3,
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
