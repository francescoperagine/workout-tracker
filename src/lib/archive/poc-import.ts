// Import del diario del PoC (`bodytracker.archivio.v1`, US-02): da file di backup ("Esporta" del PoC).
// È una funzione permanente dell'app.
// I campi letti (allenamenti, esercizi, varianteId, …) sono quelli del formato del PoC, in italiano.
//
// Il file deve avere la struttura del PoC (versione 1, elenco degli allenamenti, al massimo 10.000);
// a differenza del PoC, un allenamento o un esercizio non valido viene scartato con il motivo invece
// di rifiutare l'intero file, così il riepilogo finale può elencarli (US-02).
import { BASE_CATALOG } from '../../data/catalog';
import { STARTER_ROUTINES } from '../../data/starter-routines';
import { ensureExercise, nameKey } from './catalog';
import { fromDateKey, isValidDateKey } from './dates';
import {
  ArchiveError,
  DEFAULT_SETTINGS,
  LIMITS,
  emptyArchive,
  type Archive,
  type Routine,
  type Session,
  type SessionExercise,
  type SessionSet,
} from './types';

export interface Discarded {
  /** "Allenamento del 12 marzo 2026" o "Allenamento 3 del file" (testo per l'utente) */
  item: string;
  reason: string;
}

export interface PocConversion {
  /** sessioni convertite, catalogo personale creato per i nomi liberi, schede iniziali usate */
  archive: Archive;
  discarded: Discarded[];
  warnings: string[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const isString = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
/** Numeri del PoC: stringhe "" o "42.5", al massimo 10000 */
const isPocNumber = (v: unknown, integer = false) =>
  isString(v, 16) && (v === '' || (/^\d+(\.\d+)?$/.test(v) && Number(v) <= LIMITS.maxValue && (!integer || Number.isInteger(Number(v)))));

const POC_ROUTINES: Record<string, Routine | undefined> = {
  A: STARTER_ROUTINES.find((r) => r.id === 'routine-a'),
  B: STARTER_ROUTINES.find((r) => r.id === 'routine-b'),
};

function readableDate(date: string): string {
  return fromDateKey(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Converte il contenuto del PoC (già letto con JSON.parse). `current` serve a riconoscere i nomi
 * liberi già presenti tra gli esercizi personalizzati.
 */
export function convertPocArchive(data: unknown, current: Pick<Archive, 'catalog'> = emptyArchive()): PocConversion {
  if (!isObj(data) || data.versione !== 1 || !Array.isArray(data.allenamenti)) throw new ArchiveError('Formato di backup non riconosciuto.');
  if (data.allenamenti.length > LIMITS.sessions) throw new ArchiveError('Il backup supera il limite di 10.000 allenamenti.');

  // Il catalogo di lavoro parte da quello corrente, ma nel risultato vanno solo gli esercizi nuovi
  let work: Archive = { ...emptyArchive(), catalog: { ...current.catalog } };
  const discarded: Discarded[] = [];
  const warnings: string[] = [];
  const sessions: Session[] = [];
  const usedRoutines = new Set<string>();
  const seenIds = new Set<string>();

  data.allenamenti.forEach((w: unknown, index: number) => {
    const position = `Allenamento ${index + 1} del file`;
    if (!isObj(w)) return discarded.push({ item: position, reason: 'struttura non valida' });
    const item = isValidDateKey(w.data) ? `Allenamento del ${readableDate(w.data)}` : position;
    if (!isString(w.id, 100) || !w.id) return discarded.push({ item, reason: 'identificativo mancante' });
    if (seenIds.has(w.id)) return discarded.push({ item, reason: 'identificativo duplicato nel file' });
    if (!isValidDateKey(w.data)) return discarded.push({ item, reason: 'data non valida' });
    if (!isString(w.nome, LIMITS.sessionNameLength)) return discarded.push({ item, reason: 'nome non valido o troppo lungo' });
    if (typeof w.concluso !== 'boolean') return discarded.push({ item, reason: 'stato "concluso" mancante' });
    if (!Array.isArray(w.esercizi)) return discarded.push({ item, reason: 'elenco degli esercizi mancante' });
    if (w.esercizi.length > LIMITS.exercisesPerSession) return discarded.push({ item, reason: 'più di 100 esercizi' });
    seenIds.add(w.id);

    const letter = w.scheda === 'A' || w.scheda === 'B' ? w.scheda : null;
    const pocRoutine = letter ? POC_ROUTINES[letter] : undefined;
    if (pocRoutine) usedRoutines.add(pocRoutine.id);
    // Istante stabile: mezzogiorno locale, più la posizione nel file per l'ordine tra sessioni dello stesso giorno
    const start = fromDateKey(w.data).getTime() + index;
    const exercises: SessionExercise[] = [];
    const exerciseIds = new Set<string>();

    w.esercizi.forEach((e: unknown, j: number) => {
      const where = `${item}, esercizio ${j + 1}`;
      if (
        !isObj(e) || !isString(e.id, 100) || !e.id || !isString(e.nome, 200) || !e.nome.trim() || !isString(e.catalogoId, 200) ||
        !isString(e.varianteId, 200) || !isString(e.variante, 200) || !isString(e.note, LIMITS.notesLength) ||
        typeof e.completato !== 'boolean' || !Array.isArray(e.serie) || e.serie.length < 1 || e.serie.length > LIMITS.setsPerExercise
      ) {
        return discarded.push({ item: where, reason: 'esercizio non valido' });
      }
      if (exerciseIds.has(e.id)) return discarded.push({ item: where, reason: 'identificativo duplicato' });
      if (!e.serie.every((s: unknown) => isObj(s) && isPocNumber(s.peso) && isPocNumber(s.ripetizioni, true))) {
        return discarded.push({ item: where, reason: 'serie con peso o ripetizioni non validi' });
      }
      exerciseIds.add(e.id);

      // Esercizio fatto: la variante. Senza id (nome libero) si cerca o si crea per nome, come US-14.
      let exerciseId = e.varianteId || e.catalogoId;
      const doneName = (e.variante || e.nome).trim();
      if (!exerciseId) {
        try {
          const result = ensureExercise(work, doneName);
          work = result.archive;
          exerciseId = result.exercise.id;
        } catch (error) {
          return discarded.push({ item: where, reason: error instanceof ArchiveError ? error.message : 'nome non valido' });
        }
      } else if (!(exerciseId in BASE_CATALOG) && !(exerciseId in work.catalog)) {
        // Id sconosciuto (catalogo del PoC modificato a mano): si conserva l'id come esercizio personalizzato
        work = { ...work, catalog: { ...work.catalog, [exerciseId]: { id: exerciseId, name: doneName } } };
        warnings.push(`"${doneName}" non è nel catalogo: aggiunto agli esercizi personalizzati.`);
      }
      const planned = e.catalogoId && e.catalogoId !== exerciseId ? e.catalogoId : null;
      const routineExercise = pocRoutine?.exercises.find((x) => x.exerciseId === (planned ?? exerciseId));

      // Un nome cambiato a mano nel PoC non ha un campo nel modello v2: resta nelle note
      let notes = e.note;
      const knownNames = [e.variante, BASE_CATALOG[e.catalogoId]?.name, BASE_CATALOG[exerciseId]?.name].filter(Boolean).map((n) => nameKey(n!));
      if (!knownNames.includes(nameKey(e.nome))) {
        notes = [notes, `Nome registrato: ${e.nome.trim()}`].filter(Boolean).join(' · ').slice(0, LIMITS.notesLength);
        warnings.push(`${where}: il nome "${e.nome.trim()}" è stato conservato nelle note.`);
      }

      const done = w.concluso || e.completato;
      const sets: SessionSet[] = e.serie.map((s: { peso: string; ripetizioni: string }, k: number) => {
        const kg = s.peso === '' ? null : Number(s.peso);
        const reps = s.ripetizioni === '' ? null : Number(s.ripetizioni);
        return { id: `${e.id}-s${k + 1}`, type: 'normal', kg, reps, completedAt: done && (kg !== null || reps !== null) ? start : null };
      });
      exercises.push({
        id: e.id,
        exerciseId,
        variantOf: planned,
        group: routineExercise?.group ?? null,
        rest: routineExercise?.rest ?? DEFAULT_SETTINGS.defaultRest,
        warmupRest: routineExercise?.warmupRest ?? DEFAULT_SETTINGS.defaultRest,
        notes,
        sets,
      });
    });

    sessions.push({ id: w.id, date: w.data, routineId: pocRoutine?.id ?? null, name: w.nome, start, end: w.concluso ? start : null, exercises });
  });

  const newExercises = Object.fromEntries(Object.entries(work.catalog).filter(([id]) => !(id in current.catalog)));
  return {
    archive: {
      ...emptyArchive(),
      catalog: newExercises,
      routines: STARTER_ROUTINES.filter((r) => usedRoutines.has(r.id)).map((r) => structuredClone(r) as Routine),
      sessions,
    },
    discarded,
    warnings: [...new Set(warnings)],
  };
}
