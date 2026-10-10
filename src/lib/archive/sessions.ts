// Sessioni (step 5): avvio da una scheda o libero (US-11), una sola in corso alla volta (US-20),
// riapertura, annullamento con "Annulla" e i dati che Oggi mostra (in corso, ultimo allenamento).
// La registrazione delle serie arriva con l'allenamento attivo (step 6).
import { toDateKey } from './dates';
import { newId } from './routine-edit';
import { sessionInProgress } from './routines';
import { ArchiveError, LIMITS, type Archive, type Session, type SessionExercise } from './types';

export const FREE_SESSION_NAME = 'Allenamento libero';

export interface SessionResult {
  archive: Archive;
  session: Session;
}

function checkNoneInProgress(archive: Pick<Archive, 'sessions'>) {
  const running = sessionInProgress(archive);
  if (running) throw new ArchiveError(`C’è già un allenamento in corso («${running.name}»): riprendilo o concludilo prima.`);
}

/**
 * Inizia un allenamento adesso. Da una scheda: una voce di sessione per ogni voce della scheda, con
 * superserie e recuperi della scheda e tante serie vuote quante le serie target (i valori della volta
 * scorsa arrivano come suggerimento allo step 6). Senza scheda (`null`): allenamento libero, vuoto.
 */
export function startSession(archive: Archive, routineId: string | null, now: number): SessionResult {
  checkNoneInProgress(archive);
  if (archive.sessions.length >= LIMITS.sessions) throw new ArchiveError(`Il limite è ${LIMITS.sessions.toLocaleString('it-IT')} allenamenti.`);
  let name = FREE_SESSION_NAME;
  let exercises: SessionExercise[] = [];
  if (routineId !== null) {
    const routine = archive.routines.find((r) => r.id === routineId);
    if (!routine) throw new ArchiveError('Questa scheda non esiste più.');
    if (routine.archived) throw new ArchiveError(`«${routine.name}» è archiviata: ripristinala per allenarti con questa scheda.`);
    name = routine.name;
    exercises = routine.exercises.slice(0, LIMITS.exercisesPerSession).map((entry) => ({
      id: newId('exercise'),
      exerciseId: entry.exerciseId,
      variantOf: null,
      group: entry.group,
      rest: entry.rest,
      warmupRest: entry.warmupRest,
      notes: '',
      sets: Array.from({ length: Math.min(entry.sets, LIMITS.setsPerExercise) }, () => ({
        id: newId('set'),
        type: 'normal' as const,
        kg: null,
        reps: null,
        completedAt: null,
      })),
    }));
  }
  const session: Session = { id: newId('session'), date: toDateKey(new Date(now)), routineId, name, start: now, end: null, exercises };
  return { archive: { ...archive, sessions: [...archive.sessions, session] }, session };
}

/** Riapre una sessione conclusa (brief di Oggi: "Riapri"); resta una sola sessione in corso. */
export function reopenSession(archive: Archive, id: string): Archive {
  const session = archive.sessions.find((s) => s.id === id);
  if (!session) throw new ArchiveError('Questo allenamento non esiste più.');
  if (session.end === null) return archive;
  checkNoneInProgress(archive);
  return { ...archive, sessions: archive.sessions.map((s) => (s.id === id ? { ...s, end: null } : s)) };
}

/** Conclude la sessione in corso; come nel PoC serve almeno un esercizio. */
export function finishSession(archive: Archive, id: string, now: number): Archive {
  const session = archive.sessions.find((s) => s.id === id);
  if (!session) throw new ArchiveError('Questo allenamento non esiste più.');
  if (session.end !== null) return archive;
  if (!session.exercises.length) throw new ArchiveError('Aggiungi almeno un esercizio prima di concludere.');
  return { ...archive, sessions: archive.sessions.map((s) => (s.id === id ? { ...s, end: Math.max(now, s.start) } : s)) };
}

export interface RemovedSession {
  session: Session;
  index: number;
}

/** Toglie una sessione; `restoreSession` la rimette al suo posto ("Annulla"). */
export function removeSession(archive: Archive, id: string): { archive: Archive; removed: RemovedSession } {
  const index = archive.sessions.findIndex((s) => s.id === id);
  if (index < 0) throw new ArchiveError('Questo allenamento non esiste più.');
  const sessions = [...archive.sessions];
  const [session] = sessions.splice(index, 1);
  return { archive: { ...archive, sessions }, removed: { session, index } };
}

export function restoreSession(archive: Archive, removed: RemovedSession): Archive {
  if (archive.sessions.some((s) => s.id === removed.session.id)) return archive;
  if (removed.session.end === null) checkNoneInProgress(archive);
  const sessions = [...archive.sessions];
  sessions.splice(Math.min(removed.index, sessions.length), 0, removed.session);
  return { ...archive, sessions };
}

/** true se la sessione ha almeno un valore o una spunta (annullarla perderebbe qualcosa) */
export function sessionHasData(session: Session): boolean {
  return session.exercises.some((e) => e.sets.some((s) => s.kg !== null || s.reps !== null || s.completedAt !== null));
}

export interface SessionSummary {
  exercises: number;
  /** serie spuntate, riscaldamento compreso */
  completedSets: number;
  /** millisecondi: fino alla fine, o fino a `now` se è in corso */
  duration: number;
}

export function summarizeSession(session: Session, now: number): SessionSummary {
  let completedSets = 0;
  for (const e of session.exercises) for (const s of e.sets) if (s.completedAt !== null) completedSets++;
  return { exercises: session.exercises.length, completedSets, duration: Math.max(0, (session.end ?? now) - session.start) };
}

/** Esercizio a cui si è arrivati: il primo con una serie non spuntata, altrimenti l'ultimo */
export function currentExercise(session: Session): SessionExercise | null {
  return session.exercises.find((e) => e.sets.some((s) => s.completedAt === null)) ?? session.exercises.at(-1) ?? null;
}

/** L'ultima sessione conclusa (per data, poi per inizio) */
export function lastFinishedSession(archive: Pick<Archive, 'sessions'>): Session | null {
  let last: Session | null = null;
  for (const s of archive.sessions) {
    if (s.end === null) continue;
    if (!last || s.date > last.date || (s.date === last.date && s.start > last.start)) last = s;
  }
  return last;
}
