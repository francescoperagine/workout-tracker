// Esportazione e importazione dei backup (US-02, US-32).
// - Export: l'archivio v2 in JSON, in kg e metri, indipendente dall'unità mostrata.
// - Import: riconosce il formato v2 (validazione completa: un errore rifiuta il file) e quello del
//   PoC (convertito, con gli eventuali elementi scartati). Limite di 10 MB e 10.000 allenamenti.
// - Unione come nel PoC: gli elementi nuovi si aggiungono; per quelli con lo stesso identificativo
//   l'utente sceglie "mantieni" (`keep`, questo dispositivo) o "sostituisci" (`replace`, il backup).
import { toDateKey } from './dates';
import { convertPocArchive, type Discarded } from './poc-import';
import { validateArchive } from './validation';
import { ArchiveError, LIMITS, type Archive, type Schedule, type Session } from './types';

export type BackupFormat = 'v2' | 'poc';
export type DuplicateChoice = 'keep' | 'replace';

export interface ImportData {
  format: BackupFormat;
  archive: Archive;
  discarded: Discarded[];
  warnings: string[];
}

export function exportArchive(archive: Archive, now: Date = new Date()): string {
  return JSON.stringify({ ...archive, exportedAt: now.toISOString() }, null, 2);
}

export function backupFileName(now: Date = new Date()): string {
  return `workout-tracker-${toDateKey(now)}.json`;
}

/** Da chiamare con `file.size` prima di leggere il file. */
export function checkSize(bytes: number): void {
  if (bytes > LIMITS.importBytes) throw new ArchiveError('Il file supera il limite di 10 MB.');
}

/** Legge il testo di un backup (v2 o PoC). Lancia ArchiveError con un messaggio per l'utente. */
export function readBackup(text: string, current: Pick<Archive, 'catalog'>): ImportData {
  checkSize(new TextEncoder().encode(text).length);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ArchiveError('Il file non è un backup leggibile (JSON non valido).');
  }
  // v2 ha `version`, il PoC `versione`
  const fields = data && typeof data === 'object' ? (data as { version?: unknown; versione?: unknown }) : {};
  if (fields.version === 2) {
    try {
      return { format: 'v2', archive: validateArchive(data), discarded: [], warnings: [] };
    } catch (error) {
      throw new ArchiveError(`Il backup non è valido: ${error instanceof Error ? error.message : 'struttura non riconosciuta.'}`);
    }
  }
  if (fields.versione === 1) {
    const { archive, discarded, warnings } = convertPocArchive(data, current);
    return { format: 'poc', archive, discarded, warnings };
  }
  throw new ArchiveError('Formato di backup non riconosciuto.');
}

export interface ImportPreview {
  format: BackupFormat;
  /** allenamenti nel file */
  sessions: number;
  newSessions: number;
  existingSessions: number;
  /** prima e ultima data degli allenamenti nel file */
  period: { from: string; to: string } | null;
  newRoutines: number;
  existingRoutines: number;
  newExercises: number;
  discarded: Discarded[];
  warnings: string[];
}

export function previewImport(current: Archive, data: ImportData): ImportPreview {
  const sessions = new Set(current.sessions.map((s) => s.id));
  const routines = new Set(current.routines.map((r) => r.id));
  const dates = data.archive.sessions.map((s) => s.date).sort();
  const newSessions = data.archive.sessions.filter((s) => !sessions.has(s.id)).length;
  const newRoutines = data.archive.routines.filter((r) => !routines.has(r.id)).length;
  return {
    format: data.format,
    sessions: data.archive.sessions.length,
    newSessions,
    existingSessions: data.archive.sessions.length - newSessions,
    period: dates.length ? { from: dates[0], to: dates.at(-1)! } : null,
    newRoutines,
    existingRoutines: data.archive.routines.length - newRoutines,
    newExercises: Object.keys(data.archive.catalog).filter((id) => !(id in current.catalog)).length,
    discarded: data.discarded,
    warnings: data.warnings,
  };
}

function mergeById<T extends { id: string }>(local: T[], imported: T[], replace: boolean): T[] {
  const map = new Map(local.map((e) => [e.id, e]));
  for (const e of imported) if (replace || !map.has(e.id)) map.set(e.id, e);
  return [...map.values()];
}

/** Con "mantieni" le voci locali restano e il backup completa solo quelle assenti. */
function mergeRecord<T>(local: Record<string, T>, imported: Record<string, T>, replace: boolean): Record<string, T> {
  return replace ? { ...local, ...imported } : { ...imported, ...local };
}

function mostRecentFirst(a: Session, b: Session): number {
  return b.date.localeCompare(a.date) || b.start - a.start;
}

export interface MergeResult {
  archive: Archive;
  /** sessioni "in corso" chiuse perché ne resta aperta una sola, la più recente */
  closedSessions: number;
}

/**
 * Unisce il backup all'archivio corrente. Non modifica gli argomenti. La revisione resta quella
 * corrente: la incrementa il repository al salvataggio.
 * - Allenamenti e schede: per id, secondo la scelta. Le schede di un backup del PoC sono le schede
 *   iniziali A/B: si aggiungono solo se mancano, senza mai toccare quelle dell'utente.
 * - Esercizi personalizzati, pianificazione ed eccezioni: per chiave, secondo la scelta.
 * - Impostazioni: quelle del backup v2 solo con "sostituisci"; il PoC non ne ha.
 */
export function mergeImport(current: Archive, data: ImportData, choice: DuplicateChoice): MergeResult {
  const replace = choice === 'replace';
  const v2 = data.format === 'v2';
  const sessions = mergeById(current.sessions, data.archive.sessions, replace);
  if (sessions.length > LIMITS.sessions) {
    throw new ArchiveError('Il diario risultante supera il limite di 10.000 allenamenti. Importazione annullata.');
  }
  const routines = mergeById(current.routines, data.archive.routines, replace && v2);
  if (routines.length > LIMITS.routines) throw new ArchiveError(`Il diario risultante supera il limite di ${LIMITS.routines} schede. Importazione annullata.`);
  const catalog = mergeRecord(current.catalog, data.archive.catalog, replace);
  if (Object.keys(catalog).length > LIMITS.customExercises) {
    throw new ArchiveError(`Il diario risultante supera il limite di ${LIMITS.customExercises} esercizi personalizzati. Importazione annullata.`);
  }

  // Una sola sessione in corso alla volta: resta aperta la più recente, le altre si chiudono
  let closedSessions = 0;
  const open = sessions.filter((s) => s.end === null).sort(mostRecentFirst)[0];
  const normalized = sessions.map((s) => {
    if (s.end !== null || s === open) return s;
    closedSessions++;
    const checks = s.exercises.flatMap((e) => e.sets.map((x) => x.completedAt ?? 0));
    return { ...s, end: Math.max(s.start, ...checks) };
  });

  return {
    archive: {
      ...current,
      catalog,
      routines,
      schedule: mergeRecord(current.schedule, data.archive.schedule, replace) as Schedule,
      overrides: mergeRecord(current.overrides, data.archive.overrides, replace),
      sessions: normalized.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start),
      settings: v2 && replace ? { ...data.archive.settings } : current.settings,
    },
    closedSessions,
  };
}
