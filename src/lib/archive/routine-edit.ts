// Modifica delle schede (step 4: US-07, US-08, US-09, US-10). Funzioni pure: ricevono l'archivio e ne
// restituiscono uno nuovo, senza mutare quello ricevuto, come vuole repo.update().
// Superserie: le voci consecutive con la stessa stringa in `group`. Dopo ogni modifica i gruppi si
// normalizzano: un gruppo resta tale solo se le sue voci sono consecutive e almeno due.
import { nameKey } from './catalog';
import { ArchiveError, DEFAULT_SETS, DEFAULT_WARMUP_REST, LIMITS, WEEKDAYS, type Archive, type Routine, type RoutineExercise, type Settings, type Weekday } from './types';

/** Id nuovo e univoco in pratica: tempo più una parte casuale (non serve un id crittografico). */
export function newId(prefix: string): string {
  const random = Array.from({ length: 6 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
  return `${prefix}-${Date.now().toString(36)}${random}`;
}

export function findRoutine(archive: Pick<Archive, 'routines'>, id: string): Routine | undefined {
  return archive.routines.find((r) => r.id === id);
}

function cleanName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) throw new ArchiveError('Scrivi il nome della scheda.');
  if (clean.length > LIMITS.routineNameLength) throw new ArchiveError(`Il nome può avere al massimo ${LIMITS.routineNameLength} caratteri.`);
  return clean;
}

function withRoutine(archive: Archive, id: string, change: (routine: Routine) => Routine): Archive {
  if (!findRoutine(archive, id)) throw new ArchiveError('Questa scheda non esiste più.');
  return { ...archive, routines: archive.routines.map((r) => (r.id === id ? change(r) : r)) };
}

// ---------------------------------------------------------------------------------------------
// Elenco delle schede
// ---------------------------------------------------------------------------------------------

/** Nome proposto per una scheda nuova: la prima lettera libera ("Scheda C" dopo A e B), poi un numero. */
export function suggestRoutineName(archive: Pick<Archive, 'routines'>): string {
  const taken = new Set(archive.routines.map((r) => nameKey(r.name)));
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    if (!taken.has(nameKey(`Scheda ${letter}`))) return `Scheda ${letter}`;
  }
  for (let n = 1; ; n++) if (!taken.has(nameKey(`Scheda ${n}`))) return `Scheda ${n}`;
}

function checkRoutineLimit(archive: Archive) {
  if (archive.routines.length >= LIMITS.routines) throw new ArchiveError(`Il limite è ${LIMITS.routines} schede, archiviate comprese.`);
}

export interface RoutineResult {
  archive: Archive;
  routine: Routine;
}

/** Scheda nuova e vuota, in fondo alle attive. */
export function createRoutine(archive: Archive, name = suggestRoutineName(archive)): RoutineResult {
  checkRoutineLimit(archive);
  const routine: Routine = { id: newId('routine'), name: cleanName(name), notes: '', archived: false, exercises: [] };
  return { archive: { ...archive, routines: [...archive.routines, routine] }, routine };
}

/** Nome della copia: "Scheda A (copia)", poi "Scheda A (copia 2)" se il primo è già usato. */
function copyName(archive: Pick<Archive, 'routines'>, name: string): string {
  const taken = new Set(archive.routines.map((r) => nameKey(r.name)));
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? ' (copia)' : ` (copia ${n})`;
    const candidate = name.slice(0, LIMITS.routineNameLength - suffix.length) + suffix;
    if (!taken.has(nameKey(candidate))) return candidate;
  }
}

/** Copia attiva subito dopo l'originale, con id nuovi; le superserie restano tali. */
export function duplicateRoutine(archive: Archive, id: string): RoutineResult {
  const source = findRoutine(archive, id);
  if (!source) throw new ArchiveError('Questa scheda non esiste più.');
  checkRoutineLimit(archive);
  const routine: Routine = {
    ...structuredClone(source),
    id: newId('routine'),
    name: copyName(archive, source.name),
    archived: false,
    exercises: source.exercises.map((e) => ({ ...e, alternatives: [...e.alternatives], id: newId('entry') })),
  };
  const index = archive.routines.indexOf(source);
  const routines = [...archive.routines];
  routines.splice(index + 1, 0, routine);
  return { archive: { ...archive, routines }, routine };
}

export function renameRoutine(archive: Archive, id: string, name: string): Archive {
  const clean = cleanName(name);
  return withRoutine(archive, id, (r) => ({ ...r, name: clean }));
}

export function setRoutineNotes(archive: Archive, id: string, notes: string): Archive {
  return withRoutine(archive, id, (r) => ({ ...r, notes: notes.slice(0, LIMITS.notesLength) }));
}

/** Archiviare non tocca le sessioni passate né la pianificazione: una scheda archiviata non si propone più. */
export function setRoutineArchived(archive: Archive, id: string, archived: boolean): Archive {
  return withRoutine(archive, id, (r) => ({ ...r, archived }));
}

/**
 * Sposta la scheda di un posto tra quelle dello stesso elenco (attive o archiviate).
 * L'ordine delle attive è quello di Oggi senza storico (US-11).
 */
export function moveRoutine(archive: Archive, id: string, direction: -1 | 1): Archive {
  const routine = findRoutine(archive, id);
  if (!routine) throw new ArchiveError('Questa scheda non esiste più.');
  const peers = archive.routines.filter((r) => r.archived === routine.archived);
  const neighbor = peers[peers.indexOf(routine) + direction];
  if (!neighbor) return archive;
  const routines = [...archive.routines];
  const a = routines.indexOf(routine);
  const b = routines.indexOf(neighbor);
  [routines[a], routines[b]] = [routines[b], routines[a]];
  return { ...archive, routines };
}

export function routineSessionCount(archive: Pick<Archive, 'sessions'>, id: string): number {
  return archive.sessions.filter((s) => s.routineId === id).length;
}

/** Data dell'ultima sessione conclusa con la scheda, null se mai fatta */
export function routineLastDone(archive: Pick<Archive, 'sessions'>, id: string): string | null {
  let last: string | null = null;
  for (const s of archive.sessions) if (s.routineId === id && s.end !== null && (last === null || s.date > last)) last = s.date;
  return last;
}

/** Giorni della settimana a cui la scheda è assegnata, da lunedì */
export function scheduledDays(archive: Pick<Archive, 'schedule'>, id: string): Weekday[] {
  return WEEKDAYS.filter((d) => archive.schedule[d] === id);
}

export interface RemovedRoutine {
  routine: Routine;
  index: number;
  days: Weekday[];
  dates: string[];
}

/**
 * Elimina una scheda senza sessioni (US-10): con sessioni si archivia, perché lo storico la usa.
 * Toglie anche i giorni e le eccezioni che la indicavano. Restituisce ciò che serve per l'"Annulla".
 */
export function deleteRoutine(archive: Archive, id: string): { archive: Archive; removed: RemovedRoutine } {
  const routine = findRoutine(archive, id);
  if (!routine) throw new ArchiveError('Questa scheda non esiste più.');
  if (routineSessionCount(archive, id)) throw new ArchiveError('La scheda ha degli allenamenti nello storico: si può solo archiviare.');
  const days = scheduledDays(archive, id);
  const dates = Object.keys(archive.overrides).filter((d) => archive.overrides[d] === id);
  const schedule = { ...archive.schedule };
  for (const d of days) delete schedule[d];
  const overrides = { ...archive.overrides };
  for (const d of dates) delete overrides[d];
  return {
    archive: { ...archive, routines: archive.routines.filter((r) => r.id !== id), schedule, overrides },
    removed: { routine, index: archive.routines.indexOf(routine), days, dates },
  };
}

/** "Annulla" dopo l'eliminazione: rimette la scheda al suo posto e i giorni rimasti liberi. */
export function restoreRoutine(archive: Archive, removed: RemovedRoutine): Archive {
  if (findRoutine(archive, removed.routine.id)) return archive;
  const routines = [...archive.routines];
  routines.splice(Math.min(removed.index, routines.length), 0, removed.routine);
  const schedule = { ...archive.schedule };
  for (const d of removed.days) if (!Object.hasOwn(schedule, d)) schedule[d] = removed.routine.id;
  const overrides = { ...archive.overrides };
  for (const d of removed.dates) if (!Object.hasOwn(overrides, d)) overrides[d] = removed.routine.id;
  return { ...archive, routines, schedule, overrides };
}

// ---------------------------------------------------------------------------------------------
// Voci della scheda e superserie
// ---------------------------------------------------------------------------------------------

/** Blocco della scheda: una voce singola o una superserie (voci consecutive con lo stesso gruppo). */
export interface Block<T extends { group: string | null } = RoutineExercise> {
  group: string | null;
  /** indice della prima voce del blocco */
  start: number;
  entries: T[];
}

/** Vale anche per le voci di una sessione, che hanno lo stesso campo `group`. */
export function blocksOf<T extends { group: string | null }>(exercises: readonly T[]): Block<T>[] {
  const blocks: Block<T>[] = [];
  exercises.forEach((entry, index) => {
    const last = blocks.at(-1);
    if (last && entry.group !== null && last.group === entry.group) last.entries.push(entry);
    else blocks.push({ group: entry.group, start: index, entries: [entry] });
  });
  return blocks;
}

/** Numerazione come sulla scheda di carta: 1, 2a, 2b, 3… */
export function orderLabels(exercises: readonly { group: string | null }[]): string[] {
  return blocksOf(exercises).flatMap((block, n) =>
    block.entries.length > 1 ? block.entries.map((_, i) => `${n + 1}${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}`) : [`${n + 1}`],
  );
}

/**
 * Gruppi coerenti: una stringa di gruppo che ricompare più avanti, separata, diventa un gruppo nuovo;
 * un gruppo di una sola voce torna a `null`. Restituisce lo stesso array se non cambia nulla.
 */
export function normalizeGroups<T extends { group: string | null }>(exercises: readonly T[]): T[] {
  const used = new Set<string>();
  const result: T[] = [];
  let changed = false;
  for (const block of blocksOf(exercises)) {
    let group = block.entries.length > 1 ? block.group : null;
    if (group !== null && used.has(group)) group = freeGroup(exercises, used);
    if (group !== null) used.add(group);
    for (const entry of block.entries) {
      if (entry.group === group) result.push(entry);
      else {
        changed = true;
        result.push({ ...entry, group });
      }
    }
  }
  return changed ? result : (exercises as T[]);
}

/** Il primo numero non usato come gruppo ("2", come nel PoC). */
function freeGroup(exercises: readonly { group: string | null }[], also: Set<string> = new Set()): string {
  const taken = new Set([...exercises.map((e) => e.group), ...also]);
  for (let n = 1; ; n++) if (!taken.has(String(n))) return String(n);
}

function withExercises(archive: Archive, routineId: string, change: (exercises: RoutineExercise[]) => RoutineExercise[]): Archive {
  return withRoutine(archive, routineId, (r) => ({ ...r, exercises: normalizeGroups(change(r.exercises)) }));
}

/** Voce nuova: 3 serie, recupero predefinito delle Impostazioni, ripetizioni e carico da scrivere. */
export function newEntry(exerciseId: string, settings: Pick<Settings, 'defaultRest'>): RoutineExercise {
  return {
    id: newId('entry'),
    exerciseId,
    alternatives: [],
    group: null,
    sets: DEFAULT_SETS,
    reps: '',
    loadMin: null,
    loadMax: null,
    loadNote: '',
    unit: '',
    rest: settings.defaultRest,
    warmupRest: DEFAULT_WARMUP_REST,
  };
}

export function addEntry(archive: Archive, routineId: string, exerciseId: string): { archive: Archive; entry: RoutineExercise } {
  const routine = findRoutine(archive, routineId);
  if (!routine) throw new ArchiveError('Questa scheda non esiste più.');
  if (routine.exercises.length >= LIMITS.exercisesPerRoutine) throw new ArchiveError(`Il limite è ${LIMITS.exercisesPerRoutine} esercizi per scheda.`);
  const entry = newEntry(exerciseId, archive.settings);
  return { archive: withExercises(archive, routineId, (list) => [...list, entry]), entry };
}

export type EntryPatch = Partial<Omit<RoutineExercise, 'id' | 'group'>>;

export function updateEntry(archive: Archive, routineId: string, entryId: string, patch: EntryPatch): Archive {
  return withExercises(archive, routineId, (list) => {
    if (!list.some((e) => e.id === entryId)) throw new ArchiveError('Questo esercizio non è più nella scheda.');
    return list.map((e) => (e.id === entryId ? { ...e, ...patch } : e));
  });
}

/** Alternativa in più (US-08): non l'esercizio della voce, non due volte, al massimo 20. */
export function addAlternative(archive: Archive, routineId: string, entryId: string, exerciseId: string): Archive {
  const entry = findRoutine(archive, routineId)?.exercises.find((e) => e.id === entryId);
  if (!entry) throw new ArchiveError('Questo esercizio non è più nella scheda.');
  if (entry.exerciseId === exerciseId || entry.alternatives.includes(exerciseId)) return archive;
  if (entry.alternatives.length >= LIMITS.alternativesPerExercise) throw new ArchiveError(`Il limite è ${LIMITS.alternativesPerExercise} alternative per esercizio.`);
  return updateEntry(archive, routineId, entryId, { alternatives: [...entry.alternatives, exerciseId] });
}

export function removeAlternative(archive: Archive, routineId: string, entryId: string, exerciseId: string): Archive {
  const entry = findRoutine(archive, routineId)?.exercises.find((e) => e.id === entryId);
  if (!entry) throw new ArchiveError('Questo esercizio non è più nella scheda.');
  return updateEntry(archive, routineId, entryId, { alternatives: entry.alternatives.filter((a) => a !== exerciseId) });
}

export interface RemovedEntry {
  entry: RoutineExercise;
  index: number;
  /** gruppi della scheda prima della rimozione, per ricomporre la superserie con l'"Annulla" */
  groups: Record<string, string | null>;
}

export function removeEntry(archive: Archive, routineId: string, entryId: string): { archive: Archive; removed: RemovedEntry } {
  const list = findRoutine(archive, routineId)?.exercises ?? [];
  const index = list.findIndex((e) => e.id === entryId);
  if (index < 0) throw new ArchiveError('Questo esercizio non è più nella scheda.');
  return {
    archive: withExercises(archive, routineId, (l) => l.filter((e) => e.id !== entryId)),
    removed: { entry: list[index], index, groups: Object.fromEntries(list.map((e) => [e.id, e.group])) },
  };
}

export function restoreEntry(archive: Archive, routineId: string, removed: RemovedEntry): Archive {
  return withExercises(archive, routineId, (list) => {
    if (list.some((e) => e.id === removed.entry.id)) return list;
    const next = [...list];
    next.splice(Math.min(removed.index, next.length), 0, removed.entry);
    return next.map((e) => (Object.hasOwn(removed.groups, e.id) ? { ...e, group: removed.groups[e.id] } : e));
  });
}

/**
 * Cosa fa una freccia sulla voce: dentro una superserie la voce scambia il posto con la vicina dello
 * stesso gruppo; altrimenti si sposta tutto il blocco (voce singola o superserie intera) oltre il blocco
 * vicino, senza entrare in un'altra superserie. `null` se non si può spostare.
 */
export function moveKind<T extends { id: string; group: string | null }>(exercises: readonly T[], entryId: string, direction: -1 | 1): 'within' | 'block' | null {
  const blocks = blocksOf(exercises);
  const b = blocks.findIndex((block) => block.entries.some((e) => e.id === entryId));
  if (b < 0) return null;
  const inBlock = blocks[b].entries.findIndex((e) => e.id === entryId);
  if (blocks[b].entries[inBlock + direction]) return 'within';
  return blocks[b + direction] ? 'block' : null;
}

/**
 * Sposta una voce (della scheda o della sessione) secondo `moveKind`. Restituisce lo stesso array se
 * non si può spostare.
 */
export function moveInList<T extends { id: string; group: string | null }>(exercises: readonly T[], entryId: string, direction: -1 | 1): T[] {
  const kind = moveKind(exercises, entryId, direction);
  if (!kind) return exercises as T[];
  if (kind === 'within') {
    const next = [...exercises];
    const i = next.findIndex((e) => e.id === entryId);
    [next[i], next[i + direction]] = [next[i + direction], next[i]];
    return next;
  }
  const blocks = blocksOf(exercises);
  const b = blocks.findIndex((block) => block.entries.some((e) => e.id === entryId));
  [blocks[b], blocks[b + direction]] = [blocks[b + direction], blocks[b]];
  return blocks.flatMap((block) => block.entries);
}

export function moveEntry(archive: Archive, routineId: string, entryId: string, direction: -1 | 1): Archive {
  const list = findRoutine(archive, routineId)?.exercises;
  if (!list) throw new ArchiveError('Questa scheda non esiste più.');
  if (!moveKind(list, entryId, direction)) return archive;
  return withExercises(archive, routineId, (exercises) => moveInList(exercises, entryId, direction));
}

/** true se la voce è in superserie con quella che la precede */
export function linkedToPrevious(exercises: readonly RoutineExercise[], index: number): boolean {
  const entry = exercises[index];
  return index > 0 && entry.group !== null && exercises[index - 1].group === entry.group;
}

/**
 * Superserie con la voce precedente (US-09). Unire: la voce (con l'eventuale superserie che apre)
 * entra nel gruppo della precedente. Separare: la voce e quelle che la seguono nel gruppo formano un
 * blocco a parte.
 */
export function linkWithPrevious(archive: Archive, routineId: string, entryId: string, linked: boolean): Archive {
  return withExercises(archive, routineId, (list) => {
    const i = list.findIndex((e) => e.id === entryId);
    if (i <= 0 || linkedToPrevious(list, i) === linked) return list;
    const blocks = blocksOf(list);
    const block = blocks.find((bl) => bl.start <= i && i < bl.start + bl.entries.length)!;
    if (linked) {
      const previous = list[i - 1];
      const group = previous.group ?? freeGroup(list);
      const members = new Set([previous.id, ...block.entries.map((e) => e.id)]);
      return list.map((e) => (members.has(e.id) ? { ...e, group } : e));
    }
    const group = freeGroup(list);
    const tail = new Set(block.entries.slice(i - block.start).map((e) => e.id));
    return list.map((e) => (tail.has(e.id) ? { ...e, group } : e));
  });
}

/** "6-8" → "6–8": il trattino dell'intervallo diventa quello tipografico, come nelle schede del PoC. */
export function normalizeReps(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/(\d)\s*[-—–]\s*(?=\d)/g, '$1–')
    .trim()
    .slice(0, LIMITS.shortTextLength);
}
