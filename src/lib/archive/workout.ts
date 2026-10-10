// Allenamento attivo (step 6: US-12…US-20). Funzioni pure sulla sessione: ricevono l'archivio e ne
// restituiscono uno nuovo, senza mutare quello ricevuto, come vuole repo.update().
// Regole (PIANO.md, "Regole di comportamento chiave"):
// - "precedente": la stessa serie (stessa posizione tra le serie di riscaldamento o tra quelle di
//   lavoro) dell'ultima sessione conclusa, prima di questa, con lo stesso esercizio (cioè la stessa
//   variante: ogni variante ha i suoi carichi);
// - la spunta su una riga vuota conferma il precedente (1 tocco, P1);
// - le serie di riscaldamento non hanno numero e non contano per volume e record.
import { DEFAULT_SETS, DEFAULT_WARMUP_REST } from './conversion';
import { isValidDateKey } from './dates';
import { blocksOf, moveInList, newId, normalizeGroups } from './routine-edit';
import { ArchiveError, LIMITS, SET_TYPES, type Archive, type RoutineExercise, type Session, type SessionExercise, type SessionSet, type SetType } from './types';

// ---------------------------------------------------------------------------------------------
// Lettura
// ---------------------------------------------------------------------------------------------

/** Numero di ogni serie tra quelle che contano; le serie di riscaldamento non hanno numero (0). */
export function setNumbers(sets: readonly Pick<SessionSet, 'type'>[]): number[] {
  let n = 0;
  return sets.map((s) => (s.type === 'warmup' ? 0 : ++n));
}

export function setHasValues(set: Pick<SessionSet, 'kg' | 'reps'>): boolean {
  return set.kg !== null || set.reps !== null;
}

export function exerciseHasValues(exercise: SessionExercise): boolean {
  return exercise.sets.some((s) => setHasValues(s) || s.completedAt !== null);
}

/** true se `a` viene prima di `b` (data, poi inizio) */
function earlier(a: Session, b: Session): boolean {
  return a.date < b.date || (a.date === b.date && a.start < b.start);
}

/** Sessioni concluse prima di `session`, dalla più recente */
function finishedBefore(archive: Pick<Archive, 'sessions'>, session: Session): Session[] {
  return archive.sessions
    .filter((s) => s.id !== session.id && s.end !== null && earlier(s, session))
    .sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);
}

export interface PreviousExercise {
  session: Session;
  exercise: SessionExercise;
}

/**
 * L'esercizio fatto l'ultima volta (US-12, US-16): nella sessione conclusa più recente prima di
 * `session`, la prima voce con lo stesso esercizio che ha almeno un valore.
 */
export function previousExercise(archive: Pick<Archive, 'sessions'>, session: Session, exerciseId: string): PreviousExercise | null {
  for (const s of finishedBefore(archive, session)) {
    const exercise = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some(setHasValues));
    if (exercise) return { session: s, exercise };
  }
  return null;
}

export interface PreviousSet {
  kg: number | null;
  reps: number | null;
}

/**
 * "Precedente" per ogni serie: la serie nella stessa posizione tra quelle dello stesso genere
 * (riscaldamento o di lavoro), così aggiungere un riscaldamento non sposta i confronti. null se
 * l'ultima volta non c'era o era vuota.
 */
export function previousSets(current: Pick<SessionExercise, 'sets'>, previous: Pick<SessionExercise, 'sets'> | null): (PreviousSet | null)[] {
  if (!previous) return current.sets.map(() => null);
  const warmups = previous.sets.filter((s) => s.type === 'warmup');
  const work = previous.sets.filter((s) => s.type !== 'warmup');
  let w = 0;
  let n = 0;
  return current.sets.map((set) => {
    const match = set.type === 'warmup' ? warmups[w++] : work[n++];
    return match && setHasValues(match) ? { kg: match.kg, reps: match.reps } : null;
  });
}

/**
 * Serie spuntata (P1): i campi vuoti prendono il precedente. Servono le ripetizioni; il peso può
 * mancare (esercizi a corpo libero). null se mancano le ripetizioni: la riga non si spunta.
 */
export function completedSet(set: SessionSet, previous: PreviousSet | null, now: number): SessionSet | null {
  const kg = set.kg ?? previous?.kg ?? null;
  const reps = set.reps ?? previous?.reps ?? null;
  if (reps === null) return null;
  return { ...set, kg, reps, completedAt: now };
}

/** Voce della scheda da cui viene l'esercizio (target, alternative), anche dopo riordini e varianti. */
export function plannedEntry(archive: Pick<Archive, 'routines'>, session: Session, exercise: SessionExercise): RoutineExercise | null {
  const routine = session.routineId ? archive.routines.find((r) => r.id === session.routineId) : undefined;
  if (!routine) return null;
  const planned = exercise.variantOf ?? exercise.exerciseId;
  // la k-esima voce della sessione con quell'esercizio previsto corrisponde alla k-esima della scheda
  const k = session.exercises.slice(0, session.exercises.indexOf(exercise)).filter((e) => (e.variantOf ?? e.exerciseId) === planned).length;
  return routine.exercises.filter((e) => e.exerciseId === planned)[k] ?? null;
}

export interface NextSet {
  exercise: SessionExercise;
  set: SessionSet;
}

/**
 * La serie da fare adesso (P7). Si resta sul blocco dell'ultima serie spuntata finché ha serie da
 * fare, poi si passa al blocco successivo che ne ha (e si ricomincia dall'inizio per quelli saltati).
 * In una superserie si alternano gli esercizi: tocca a quello con meno serie fatte, nell'ordine 2a, 2b.
 */
export function nextSet(session: Pick<Session, 'exercises'>): NextSet | null {
  const blocks = blocksOf(session.exercises);
  let last: { time: number; block: number } | null = null;
  blocks.forEach((block, b) => {
    for (const e of block.entries) for (const s of e.sets) if (s.completedAt !== null && (!last || s.completedAt >= last.time)) last = { time: s.completedAt, block: b };
  });
  const from = (last as { block: number } | null)?.block ?? 0;
  const order = [...blocks.slice(from), ...blocks.slice(0, from)];
  for (const block of order) {
    let pick: SessionExercise | null = null;
    let fewest = Infinity;
    for (const e of block.entries) {
      if (!e.sets.some((s) => s.completedAt === null)) continue;
      const done = e.sets.filter((s) => s.completedAt !== null).length;
      if (done < fewest) {
        fewest = done;
        pick = e;
      }
    }
    if (pick) return { exercise: pick, set: pick.sets.find((s) => s.completedAt === null)! };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Modifiche della sessione
// ---------------------------------------------------------------------------------------------

function withSession(archive: Archive, sessionId: string, change: (session: Session) => Session): Archive {
  if (!archive.sessions.some((s) => s.id === sessionId)) throw new ArchiveError('Questo allenamento non esiste più.');
  return { ...archive, sessions: archive.sessions.map((s) => (s.id === sessionId ? change(s) : s)) };
}

function withExercises(archive: Archive, sessionId: string, change: (exercises: SessionExercise[]) => SessionExercise[]): Archive {
  return withSession(archive, sessionId, (s) => ({ ...s, exercises: normalizeGroups(change(s.exercises)) }));
}

function withExercise(archive: Archive, sessionId: string, exerciseId: string, change: (exercise: SessionExercise) => SessionExercise): Archive {
  return withExercises(archive, sessionId, (list) => {
    if (!list.some((e) => e.id === exerciseId)) throw new ArchiveError('Questo esercizio non è più nell’allenamento.');
    return list.map((e) => (e.id === exerciseId ? change(e) : e));
  });
}

function withSets(archive: Archive, sessionId: string, exerciseId: string, change: (sets: SessionSet[]) => SessionSet[]): Archive {
  return withExercise(archive, sessionId, exerciseId, (e) => ({ ...e, sets: change(e.sets) }));
}

export function findSessionExercise(session: Session, exerciseId: string): SessionExercise | undefined {
  return session.exercises.find((e) => e.id === exerciseId);
}

/** Sostituisce una serie (spunta, valori, tipo). */
export function replaceSet(archive: Archive, sessionId: string, exerciseId: string, set: SessionSet): Archive {
  return withSets(archive, sessionId, exerciseId, (sets) => {
    if (!sets.some((s) => s.id === set.id)) throw new ArchiveError('Questa serie non c’è più.');
    return sets.map((s) => (s.id === set.id ? set : s));
  });
}

export function updateSet(archive: Archive, sessionId: string, exerciseId: string, setId: string, patch: Partial<Omit<SessionSet, 'id'>>): Archive {
  const set = archive.sessions.find((s) => s.id === sessionId)?.exercises.find((e) => e.id === exerciseId)?.sets.find((s) => s.id === setId);
  if (!set) throw new ArchiveError('Questa serie non c’è più.');
  return replaceSet(archive, sessionId, exerciseId, { ...set, ...patch });
}

/** Tipo successivo, toccando l'indice della serie: 1 → R → D → C → 1 (US-13) */
export function nextSetType(type: SetType): SetType {
  return SET_TYPES[(SET_TYPES.indexOf(type) + 1) % SET_TYPES.length];
}

/** Valore accettato per peso (kg) e ripetizioni: numero finito, non negativo, entro il limite del PoC. */
export function isValidSetValue(value: number, integer = false): boolean {
  return Number.isFinite(value) && value >= 0 && value <= LIMITS.maxValue && (!integer || Number.isInteger(value));
}

/** "Aggiungi serie": riprende il peso dell'ultima serie, ripetizioni vuote (come nel PoC). */
export function addSet(archive: Archive, sessionId: string, exerciseId: string): { archive: Archive; set: SessionSet } {
  const exercise = archive.sessions.find((s) => s.id === sessionId)?.exercises.find((e) => e.id === exerciseId);
  if (!exercise) throw new ArchiveError('Questo esercizio non è più nell’allenamento.');
  if (exercise.sets.length >= LIMITS.setsPerExercise) throw new ArchiveError(`Il limite è ${LIMITS.setsPerExercise} serie per esercizio.`);
  const set: SessionSet = { id: newId('set'), type: 'normal', kg: exercise.sets.at(-1)?.kg ?? null, reps: null, completedAt: null };
  return { archive: withSets(archive, sessionId, exerciseId, (sets) => [...sets, set]), set };
}

export interface RemovedSet {
  exerciseId: string;
  set: SessionSet;
  index: number;
}

export function removeSet(archive: Archive, sessionId: string, exerciseId: string, setId: string): { archive: Archive; removed: RemovedSet } {
  const exercise = archive.sessions.find((s) => s.id === sessionId)?.exercises.find((e) => e.id === exerciseId);
  const index = exercise?.sets.findIndex((s) => s.id === setId) ?? -1;
  if (!exercise || index < 0) throw new ArchiveError('Questa serie non c’è più.');
  return {
    archive: withSets(archive, sessionId, exerciseId, (sets) => sets.filter((s) => s.id !== setId)),
    removed: { exerciseId, set: exercise.sets[index], index },
  };
}

/** "Annulla" dopo la rimozione di una serie */
export function restoreSet(archive: Archive, sessionId: string, removed: RemovedSet): Archive {
  return withSets(archive, sessionId, removed.exerciseId, (sets) => {
    if (sets.some((s) => s.id === removed.set.id)) return sets;
    const next = [...sets];
    next.splice(Math.min(removed.index, next.length), 0, removed.set);
    return next;
  });
}

/**
 * Esercizio aggiunto durante la sessione (US-15): tante serie (e dello stesso tipo) quante l'ultima
 * volta, così ogni riga ha il suo precedente; senza storico 3 serie. Recuperi dell'ultima volta,
 * altrimenti quello predefinito delle Impostazioni.
 */
export function addSessionExercise(archive: Archive, sessionId: string, exerciseId: string): { archive: Archive; exercise: SessionExercise } {
  const session = archive.sessions.find((s) => s.id === sessionId);
  if (!session) throw new ArchiveError('Questo allenamento non esiste più.');
  if (session.exercises.length >= LIMITS.exercisesPerSession) throw new ArchiveError(`Il limite è ${LIMITS.exercisesPerSession} esercizi per allenamento.`);
  const previous = previousExercise(archive, session, exerciseId)?.exercise;
  const types: SetType[] = previous ? previous.sets.map((s) => s.type) : Array.from({ length: DEFAULT_SETS }, () => 'normal');
  const exercise: SessionExercise = {
    id: newId('exercise'),
    exerciseId,
    variantOf: null,
    group: null,
    rest: previous?.rest ?? archive.settings.defaultRest,
    warmupRest: previous?.warmupRest ?? DEFAULT_WARMUP_REST,
    notes: '',
    sets: types.slice(0, LIMITS.setsPerExercise).map((type) => ({ id: newId('set'), type, kg: null, reps: null, completedAt: null })),
  };
  return { archive: withExercises(archive, sessionId, (list) => [...list, exercise]), exercise };
}

export interface RemovedSessionExercise {
  exercise: SessionExercise;
  index: number;
  /** gruppi prima della rimozione, per ricomporre la superserie con l'"Annulla" */
  groups: Record<string, string | null>;
}

export function removeSessionExercise(archive: Archive, sessionId: string, exerciseId: string): { archive: Archive; removed: RemovedSessionExercise } {
  const list = archive.sessions.find((s) => s.id === sessionId)?.exercises ?? [];
  const index = list.findIndex((e) => e.id === exerciseId);
  if (index < 0) throw new ArchiveError('Questo esercizio non è più nell’allenamento.');
  return {
    archive: withExercises(archive, sessionId, (l) => l.filter((e) => e.id !== exerciseId)),
    removed: { exercise: list[index], index, groups: Object.fromEntries(list.map((e) => [e.id, e.group])) },
  };
}

export function restoreSessionExercise(archive: Archive, sessionId: string, removed: RemovedSessionExercise): Archive {
  return withExercises(archive, sessionId, (list) => {
    if (list.some((e) => e.id === removed.exercise.id)) return list;
    const next = [...list];
    next.splice(Math.min(removed.index, next.length), 0, removed.exercise);
    return next.map((e) => (Object.hasOwn(removed.groups, e.id) ? { ...e, group: removed.groups[e.id] } : e));
  });
}

/** Riordino in sessione (US-15), con le stesse regole delle schede per le superserie. */
export function moveSessionExercise(archive: Archive, sessionId: string, exerciseId: string, direction: -1 | 1): Archive {
  const list = archive.sessions.find((s) => s.id === sessionId)?.exercises;
  if (!list) throw new ArchiveError('Questo allenamento non esiste più.');
  const moved = moveInList(list, exerciseId, direction);
  return moved === list ? archive : withExercises(archive, sessionId, () => moved);
}

/**
 * Passa a una variante o a un altro esercizio (US-14), solo per questa sessione. `variantOf` resta
 * l'esercizio previsto (null se si torna a quello). Le serie restano (numero e tipo) ma si svuotano,
 * perché il carico si riferiva all'esercizio di prima (come nel PoC: la conferma la chiede l'interfaccia).
 */
export function switchExercise(archive: Archive, sessionId: string, exerciseId: string, newExerciseId: string): Archive {
  return withExercise(archive, sessionId, exerciseId, (e) => {
    if (e.exerciseId === newExerciseId) return e;
    const planned = e.variantOf ?? e.exerciseId;
    return {
      ...e,
      exerciseId: newExerciseId,
      variantOf: newExerciseId === planned ? null : planned,
      sets: e.sets.map((s) => ({ ...s, kg: null, reps: null, completedAt: null })),
    };
  });
}

/** Nota sul carico (US-16): totale, per manubrio, macchina, regolazioni. */
export function setExerciseNotes(archive: Archive, sessionId: string, exerciseId: string, notes: string): Archive {
  return withExercise(archive, sessionId, exerciseId, (e) => ({ ...e, notes: notes.slice(0, LIMITS.notesLength) }));
}

/** Nome della sessione, modificabile anche in corso (US-27) */
export function renameSession(archive: Archive, sessionId: string, name: string): Archive {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) throw new ArchiveError('Scrivi il nome dell’allenamento.');
  if (clean.length > LIMITS.sessionNameLength) throw new ArchiveError(`Il nome può avere al massimo ${LIMITS.sessionNameLength} caratteri.`);
  return withSession(archive, sessionId, (s) => ({ ...s, name: clean }));
}

/** Data della sessione (YYYY-MM-DD, ora locale), modificabile anche in corso (US-27) */
export function setSessionDate(archive: Archive, sessionId: string, date: string): Archive {
  if (!isValidDateKey(date)) throw new ArchiveError('Scegli una data valida.');
  return withSession(archive, sessionId, (s) => ({ ...s, date }));
}

// ---------------------------------------------------------------------------------------------
// Riepilogo e record
// ---------------------------------------------------------------------------------------------

function countsForRecords(set: SessionSet): boolean {
  return set.completedAt !== null && set.type !== 'warmup';
}

/** Carico massimo (kg) di un esercizio nelle sessioni concluse prima di `session`; null se non c'è. */
export function bestLoadBefore(archive: Pick<Archive, 'sessions'>, session: Session, exerciseId: string): number | null {
  let best: number | null = null;
  for (const s of finishedBefore(archive, session)) {
    for (const e of s.exercises) {
      if (e.exerciseId !== exerciseId) continue;
      for (const set of e.sets) if (countsForRecords(set) && set.kg !== null && (best === null || set.kg > best)) best = set.kg;
    }
  }
  return best;
}

export interface LoadRecord {
  exerciseId: string;
  kg: number;
  previousBest: number;
  /** la prima serie della sessione che ha raggiunto il record */
  setId: string;
}

/**
 * Record di carico (US-29): il carico massimo di questa sessione supera quello delle sessioni
 * precedenti con lo stesso esercizio (la stessa variante). Riscaldamento escluso; senza storico non
 * c'è record. Gli altri record (1RM, volume) arrivano con i grafici dello step 8.
 */
export function loadRecords(archive: Pick<Archive, 'sessions'>, session: Session): LoadRecord[] {
  const best = new Map<string, { kg: number; setId: string }>();
  for (const e of session.exercises) {
    for (const set of e.sets) {
      if (!countsForRecords(set) || set.kg === null) continue;
      const current = best.get(e.exerciseId);
      if (!current || set.kg > current.kg) best.set(e.exerciseId, { kg: set.kg, setId: set.id });
    }
  }
  const records: LoadRecord[] = [];
  for (const [exerciseId, { kg, setId }] of best) {
    const previousBest = bestLoadBefore(archive, session, exerciseId);
    if (previousBest !== null && kg > previousBest) records.push({ exerciseId, kg, previousBest, setId });
  }
  return records;
}

export interface WorkoutSummary {
  /** millisecondi */
  duration: number;
  /** esercizi con almeno una serie fatta */
  exercises: number;
  /** serie di lavoro fatte (il riscaldamento è a parte) */
  sets: number;
  warmupSets: number;
  /** kg × ripetizioni delle serie di lavoro fatte, in kg */
  volume: number;
  records: LoadRecord[];
}

/** Riepilogo di fine allenamento (US-18) */
export function workoutSummary(archive: Pick<Archive, 'sessions'>, session: Session, now: number): WorkoutSummary {
  let exercises = 0;
  let sets = 0;
  let warmupSets = 0;
  let volume = 0;
  for (const e of session.exercises) {
    const done = e.sets.filter((s) => s.completedAt !== null);
    if (done.length) exercises++;
    for (const s of done) {
      if (s.type === 'warmup') {
        warmupSets++;
        continue;
      }
      sets++;
      if (s.kg !== null && s.reps !== null) volume += s.kg * s.reps;
    }
  }
  return { duration: Math.max(0, (session.end ?? now) - session.start), exercises, sets, warmupSets, volume, records: loadRecords(archive, session) };
}

/** Numero di allenamenti conclusi (l'invito all'installazione arriva dopo il primo, US-03) */
export function finishedCount(archive: Pick<Archive, 'sessions'>): number {
  return archive.sessions.filter((s) => s.end !== null).length;
}
