// Validazione dell'archivio v2. Come nel PoC, l'oggetto viene ricostruito campo per campo:
// le proprietà estranee non entrano nell'archivio, e un errore rende l'intero contenuto non valido.
// I riferimenti (id di scheda o di esercizio) non sono vincolanti: un id sconosciuto non rende
// illeggibile il diario, l'interfaccia lo mostra comunque.
// I messaggi sono per l'utente, quindi in italiano.
import { isValidDateKey } from './dates';
import {
  ArchiveError,
  DEFAULT_SETTINGS,
  LIMITS,
  SET_TYPES,
  WEEKDAYS,
  type Archive,
  type CustomExercise,
  type Routine,
  type RoutineExercise,
  type Schedule,
  type Session,
  type SessionExercise,
  type SessionSet,
  type Settings,
} from './types';

type Obj = Record<string, unknown>;

function object(value: unknown, where: string): Obj {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ArchiveError(`${where}: struttura non valida.`);
  return value as Obj;
}

function list(value: unknown, max: number, where: string): unknown[] {
  if (!Array.isArray(value)) throw new ArchiveError(`${where}: elenco mancante.`);
  if (value.length > max) throw new ArchiveError(`${where}: più di ${max} elementi.`);
  return value;
}

function text(value: unknown, max: number, where: string, required = false): string {
  if (typeof value !== 'string' || value.length > max) throw new ArchiveError(`${where}: testo non valido o troppo lungo.`);
  if (required && !value.trim()) throw new ArchiveError(`${where}: testo vuoto.`);
  return value;
}

function id(value: unknown, where: string): string {
  return text(value, LIMITS.idLength, where, true);
}

function uniqueId(value: unknown, seen: Set<string>, where: string): string {
  const v = id(value, where);
  if (seen.has(v)) throw new ArchiveError(`${where}: identificativo duplicato.`);
  seen.add(v);
  return v;
}

interface NumberOptions {
  min?: number;
  max?: number;
  integer?: boolean;
}

function number(value: unknown, where: string, { min = 0, max = LIMITS.maxValue as number, integer = false }: NumberOptions = {}): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new ArchiveError(`${where}: numero non valido.`);
  }
  return value;
}

function numberOrNull(value: unknown, where: string, options?: NumberOptions): number | null {
  return value === null ? null : number(value, where, options);
}

function timestamp(value: unknown, where: string): number {
  return number(value, where, { max: 8.64e15, integer: true });
}

function boolean(value: unknown, where: string): boolean {
  if (typeof value !== 'boolean') throw new ArchiveError(`${where}: valore non valido.`);
  return value;
}

function idOrNull(value: unknown, where: string): string | null {
  return value === null ? null : id(value, where);
}

function rest(value: unknown, where: string): number {
  return number(value, where, { max: LIMITS.maxRest, integer: true });
}

function routineExercise(value: unknown, seen: Set<string>, where: string): RoutineExercise {
  const v = object(value, where);
  const loadMin = numberOrNull(v.loadMin, `${where}, carico minimo`);
  const loadMax = numberOrNull(v.loadMax, `${where}, carico massimo`);
  if (loadMin !== null && loadMax !== null && loadMin > loadMax) throw new ArchiveError(`${where}: intervallo di carico non valido.`);
  return {
    id: uniqueId(v.id, seen, where),
    exerciseId: id(v.exerciseId, `${where}, esercizio`),
    alternatives: list(v.alternatives, LIMITS.alternativesPerExercise, `${where}, alternative`).map((a) => id(a, `${where}, alternativa`)),
    group: v.group === null ? null : text(v.group, LIMITS.shortTextLength, `${where}, superserie`, true),
    sets: number(v.sets, `${where}, serie`, { max: LIMITS.setsPerExercise, integer: true }),
    reps: text(v.reps, LIMITS.shortTextLength, `${where}, ripetizioni`),
    loadMin,
    loadMax,
    loadNote: text(v.loadNote, LIMITS.shortTextLength, `${where}, nota sul carico`),
    unit: text(v.unit, LIMITS.shortTextLength, `${where}, unità`),
    rest: rest(v.rest, `${where}, recupero`),
    warmupRest: rest(v.warmupRest, `${where}, recupero di riscaldamento`),
  };
}

function routine(value: unknown, seen: Set<string>, where: string): Routine {
  const r = object(value, where);
  const exerciseIds = new Set<string>();
  return {
    id: uniqueId(r.id, seen, where),
    name: text(r.name, LIMITS.routineNameLength, `${where}, nome`, true),
    notes: text(r.notes, LIMITS.notesLength, `${where}, note`),
    archived: boolean(r.archived, `${where}, archiviata`),
    exercises: list(r.exercises, LIMITS.exercisesPerRoutine, `${where}, esercizi`).map((e, i) => routineExercise(e, exerciseIds, `${where}, esercizio ${i + 1}`)),
  };
}

function sessionSet(value: unknown, seen: Set<string>, where: string): SessionSet {
  const s = object(value, where);
  if (!SET_TYPES.includes(s.type as never)) throw new ArchiveError(`${where}: tipo di serie non valido.`);
  return {
    id: uniqueId(s.id, seen, where),
    type: s.type as SessionSet['type'],
    kg: numberOrNull(s.kg, `${where}, peso`),
    reps: numberOrNull(s.reps, `${where}, ripetizioni`, { integer: true }),
    completedAt: s.completedAt === null ? null : timestamp(s.completedAt, `${where}, spunta`),
  };
}

function sessionExercise(value: unknown, seen: Set<string>, where: string): SessionExercise {
  const e = object(value, where);
  const setIds = new Set<string>();
  return {
    id: uniqueId(e.id, seen, where),
    exerciseId: id(e.exerciseId, `${where}, esercizio`),
    variantOf: idOrNull(e.variantOf, `${where}, esercizio previsto`),
    group: e.group === null ? null : text(e.group, LIMITS.shortTextLength, `${where}, superserie`, true),
    rest: rest(e.rest, `${where}, recupero`),
    warmupRest: rest(e.warmupRest, `${where}, recupero di riscaldamento`),
    notes: text(e.notes, LIMITS.notesLength, `${where}, note`),
    sets: list(e.sets, LIMITS.setsPerExercise, `${where}, serie`).map((s, i) => sessionSet(s, setIds, `${where}, serie ${i + 1}`)),
  };
}

function session(value: unknown, seen: Set<string>, where: string): Session {
  const s = object(value, where);
  if (!isValidDateKey(s.date)) throw new ArchiveError(`${where}: data non valida.`);
  const start = timestamp(s.start, `${where}, inizio`);
  const end = s.end === null ? null : timestamp(s.end, `${where}, fine`);
  if (end !== null && end < start) throw new ArchiveError(`${where}: la fine precede l’inizio.`);
  const exerciseIds = new Set<string>();
  return {
    id: uniqueId(s.id, seen, where),
    date: s.date,
    routineId: idOrNull(s.routineId, `${where}, scheda`),
    name: text(s.name, LIMITS.sessionNameLength, `${where}, nome`),
    start,
    end,
    exercises: list(s.exercises, LIMITS.exercisesPerSession, `${where}, esercizi`).map((e, i) => sessionExercise(e, exerciseIds, `${where}, esercizio ${i + 1}`)),
  };
}

function catalog(value: unknown): Record<string, CustomExercise> {
  const c = object(value, 'Catalogo');
  const entries = Object.entries(c);
  if (entries.length > LIMITS.customExercises) throw new ArchiveError(`Catalogo: più di ${LIMITS.customExercises} esercizi.`);
  const result: Record<string, CustomExercise> = Object.create(null);
  for (const [key, e] of entries) {
    const o = object(e, 'Catalogo, esercizio');
    const exerciseId = id(o.id, 'Catalogo, esercizio');
    if (exerciseId !== key) throw new ArchiveError('Catalogo: identificativo incoerente.');
    result[exerciseId] = { id: exerciseId, name: text(o.name, LIMITS.exerciseNameLength, 'Catalogo, nome', true) };
  }
  return { ...result };
}

function schedule(value: unknown): Schedule {
  const s = object(value, 'Pianificazione');
  const result: Schedule = {};
  for (const [day, routineId] of Object.entries(s)) {
    if (!WEEKDAYS.includes(day as never)) throw new ArchiveError('Pianificazione: giorno non valido.');
    result[day as keyof Schedule] = idOrNull(routineId, 'Pianificazione');
  }
  return result;
}

function overrides(value: unknown): Record<string, string | null> {
  const o = object(value, 'Eccezioni');
  const entries = Object.entries(o);
  if (entries.length > LIMITS.sessions) throw new ArchiveError('Eccezioni: troppi elementi.');
  const result: Record<string, string | null> = {};
  for (const [date, routineId] of entries) {
    if (!isValidDateKey(date)) throw new ArchiveError('Eccezioni: data non valida.');
    result[date] = idOrNull(routineId, 'Eccezioni');
  }
  return result;
}

function settings(value: unknown): Settings {
  const s = object(value, 'Impostazioni');
  if (s.weightUnit !== 'kg' && s.weightUnit !== 'lb') throw new ArchiveError('Impostazioni: unità di peso non valida.');
  if (s.distanceUnit !== 'm' && s.distanceUnit !== 'ft') throw new ArchiveError('Impostazioni: unità di distanza non valida.');
  return {
    ...DEFAULT_SETTINGS,
    weightUnit: s.weightUnit,
    distanceUnit: s.distanceUnit,
    defaultRest: rest(s.defaultRest, 'Impostazioni, recupero predefinito'),
    sound: boolean(s.sound, 'Impostazioni, suono'),
    vibration: boolean(s.vibration, 'Impostazioni, vibrazione'),
  };
}

/** Valida e ricostruisce un archivio v2. Lancia ArchiveError con un messaggio in italiano. */
export function validateArchive(data: unknown): Archive {
  const a = object(data, 'Archivio');
  if (a.version !== 2) throw new ArchiveError('Formato dell’archivio non riconosciuto.');
  const routineIds = new Set<string>();
  const sessionIds = new Set<string>();
  return {
    version: 2,
    revision: number(a.revision, 'Revisione', { max: Number.MAX_SAFE_INTEGER, integer: true }),
    catalog: catalog(a.catalog),
    routines: list(a.routines, LIMITS.routines, 'Schede').map((r, i) => routine(r, routineIds, `Scheda ${i + 1}`)),
    schedule: schedule(a.schedule),
    overrides: overrides(a.overrides),
    sessions: list(a.sessions, LIMITS.sessions, 'Allenamenti').map((s, i) => session(s, sessionIds, `Allenamento ${i + 1}`)),
    settings: settings(a.settings),
  };
}
