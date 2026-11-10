// Catalogo: esercizi di base (dal codice) più quelli personalizzati dell'utente (nell'archivio).
// US-14: un nome scritto a mano si confronta senza maiuscole, spazi, punteggiatura e accenti;
// se non corrisponde a nessun esercizio diventa un esercizio personalizzato, riusato le volte dopo.
import { BASE_CATALOG, EXERCISE_REDIRECTS } from '../../data/catalog';
import { ArchiveError, LIMITS, type Archive, type CatalogExercise, type CustomExercise, type Routine, type RoutineExercise, type Session, type SessionExercise } from './types';

export const CUSTOM_PREFIX = 'custom-';

/** Parole del nome, senza accenti e in minuscolo: "Panca  piana, Manubri" → ["panca", "piana", "manubri"] */
function words(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('it')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Chiave di confronto: "Hyperextension 45° con disco" e "hyperextension45condisco" coincidono. */
export function nameKey(name: string): string {
  return words(name).join('');
}

export interface CatalogEntry {
  id: string;
  name: string;
  /** altri nomi (solo gli esercizi di base ne hanno) */
  aliases: readonly string[];
  custom: boolean;
}

const BASE_ENTRIES: readonly CatalogEntry[] = Object.values(BASE_CATALOG).map((e) => ({ id: e.id, name: e.name, aliases: e.aliases, custom: false }));

/** Parole di nome e alias di ogni esercizio di base, calcolate una volta sola */
const BASE_WORDS = new Map(BASE_ENTRIES.map((e) => [e.id, [e.name, ...e.aliases].map(words)]));

/** Parole del nome e di ogni alias: [nome, ...alias] */
function entryWords(entry: CatalogEntry): string[][] {
  return (!entry.custom && BASE_WORDS.get(entry.id)) || [entry.name, ...entry.aliases].map(words);
}

/** Tutti gli esercizi, prima quelli di base nell'ordine del catalogo, poi i personalizzati per nome. */
export function availableExercises(archive: Pick<Archive, 'catalog'>): CatalogEntry[] {
  const custom = Object.values(archive.catalog)
    .filter((e) => !(e.id in BASE_CATALOG))
    .map((e) => ({ id: e.id, name: e.name, aliases: [], custom: true }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'));
  return [...BASE_ENTRIES, ...custom];
}

export function findExercise(archive: Pick<Archive, 'catalog'>, id: string): CatalogEntry | null {
  const base = BASE_CATALOG[id];
  if (base) return { id, name: base.name, aliases: base.aliases, custom: false };
  const custom = archive.catalog[id];
  return custom ? { id, name: custom.name, aliases: [], custom: true } : null;
}

/** Nome da mostrare; un id sconosciuto (es. un backup di una versione futura) resta leggibile. */
export function exerciseName(archive: Pick<Archive, 'catalog'>, id: string): string {
  return findExercise(archive, id)?.name ?? id;
}

/** Corrispondenza esatta sulla chiave del nome o di un alias; vince l'esercizio di base. */
export function findByName(archive: Pick<Archive, 'catalog'>, name: string): CatalogEntry | null {
  const key = nameKey(name);
  if (!key) return null;
  return availableExercises(archive).find((e) => entryWords(e).some((w) => w.join('') === key)) ?? null;
}

/**
 * Nomi simili mentre si scrive: prima quelli che cominciano con il testo, poi quelli che contengono
 * tutte le parole scritte (in qualsiasi ordine, anche come inizio di parola: "pan inc" trova
 * "Distensioni manubri panca inclinata").
 */
export function suggestExercises(archive: Pick<Archive, 'catalog'>, text: string, limit = 8): CatalogEntry[] {
  const typed = words(text);
  if (!typed.length) return [];
  const key = typed.join('');
  const scored: { entry: CatalogEntry; score: number }[] = [];
  for (const entry of availableExercises(archive)) {
    // il punteggio migliore tra il nome e gli alias: "romanian" trova "Stacco rumeno bilanciere"
    let score = 0;
    for (const name of entryWords(entry)) {
      const entryKey = name.join('');
      if (entryKey === key) score = 3;
      else if (entryKey.startsWith(key)) score = Math.max(score, 2);
      else if (typed.every((t) => name.some((w) => w.startsWith(t)))) score = Math.max(score, 1);
      if (score === 3) break;
    }
    if (score) scored.push({ entry, score });
  }
  // sort è stabile: a pari punteggio resta l'ordine del catalogo
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.entry);
}

/** Id stabile dal nome: due dispositivi che scrivono lo stesso nome creano lo stesso id. */
export function customExerciseId(name: string): string {
  return CUSTOM_PREFIX + words(name).join('-');
}

export function isValidExerciseName(name: string): boolean {
  const clean = name.trim();
  return clean.length > 0 && clean.length <= LIMITS.exerciseNameLength && nameKey(clean) !== '';
}

export interface EnsureResult {
  archive: Archive;
  exercise: CatalogEntry;
  /** true se è stato aggiunto un esercizio personalizzato */
  created: boolean;
}

/**
 * US-14: restituisce l'esercizio che corrisponde al nome scritto a mano (anche a un suo alias), o lo
 * crea come personalizzato. Non modifica l'archivio ricevuto. Il nome salvato è quello scritto, ripulito
 * dagli spazi in eccesso.
 */
export function ensureExercise(archive: Archive, typedName: string): EnsureResult {
  const name = typedName.trim().replace(/\s+/g, ' ');
  if (!isValidExerciseName(name)) throw new ArchiveError('Scrivi il nome dell’esercizio (al massimo 200 caratteri).');
  const existing = findByName(archive, name);
  if (existing) return { archive, exercise: existing, created: false };
  if (Object.keys(archive.catalog).length >= LIMITS.customExercises) {
    throw new ArchiveError(`Il limite è ${LIMITS.customExercises} esercizi personalizzati.`);
  }
  let id = customExerciseId(name).slice(0, LIMITS.idLength);
  // Solo per sicurezza: con la stessa chiave l'id coinciderebbe, quindi qui un id occupato è un caso limite
  for (let n = 2; id in archive.catalog || id in BASE_CATALOG; n++) id = `${customExerciseId(name).slice(0, LIMITS.idLength - 6)}-${n}`;
  const created: CustomExercise = { id, name, muscles: { primary: [], secondary: [] }, variantOf: null };
  return {
    archive: { ...archive, catalog: { ...archive.catalog, [id]: created } },
    exercise: { id, name, aliases: [], custom: true },
    created: true,
  };
}

/** Controlla un'unione e restituisce l'esercizio che resta; errore con un messaggio per l'utente. */
function checkMerge(archive: Pick<Archive, 'catalog'>, absorbedId: string, intoId: string): CatalogEntry {
  if (absorbedId in BASE_CATALOG) throw new ArchiveError('Un esercizio predefinito non si può unire a un altro.');
  if (!(absorbedId in archive.catalog)) throw new ArchiveError('Questo esercizio personalizzato non esiste più.');
  if (absorbedId === intoId) throw new ArchiveError('Scegli un esercizio diverso.');
  const into = findExercise(archive, intoId);
  if (!into) throw new ArchiveError('L’esercizio scelto non esiste più.');
  return into;
}

/**
 * US-35: unisce un esercizio personalizzato a un altro (di base o personalizzato), che resta. Tutte le
 * sessioni (anche quella in corso) e tutte le schede (anche archiviate) passano a `intoId`; l'assorbito
 * sparisce dal catalogo. Non si annulla: il nome assorbito di un personalizzato si perde.
 */
export function mergeExercise(archive: Archive, absorbedId: string, intoId: string): Archive {
  checkMerge(archive, absorbedId, intoId);
  const catalog = { ...archive.catalog };
  delete catalog[absorbedId];
  const map = { [absorbedId]: intoId };
  return { ...archive, catalog, sessions: rewriteSessions(archive.sessions, map), routines: rewriteRoutines(archive.routines, map) };
}

/** Id dopo la mappa `vecchio → nuovo`; `Object.hasOwn` perché un id come "constructor" non è nella mappa */
function mapped(map: Readonly<Record<string, string>>, id: string): string {
  return Object.hasOwn(map, id) ? map[id] : id;
}

/** Id dopo i reindirizzamenti del catalogo di base (EXERCISE_REDIRECTS, ADR-009) */
export function redirectedId(id: string): string {
  return mapped(EXERCISE_REDIRECTS, id);
}

/**
 * Sostituisce gli id della mappa negli esercizi delle sessioni (fatto e previsto). Un'alternativa
 * diventata uguale all'esercizio fatto non è più un'alternativa. Le sessioni non toccate restano le stesse.
 */
export function rewriteSessions(sessions: Session[], map: Readonly<Record<string, string>>): Session[] {
  const hit = (e: SessionExercise) => Object.hasOwn(map, e.exerciseId) || (e.alternativeOf !== null && Object.hasOwn(map, e.alternativeOf));
  return sessions.map((session) => {
    if (!session.exercises.some(hit)) return session;
    return {
      ...session,
      exercises: session.exercises.map((e) => {
        if (!hit(e)) return e;
        const exerciseId = mapped(map, e.exerciseId);
        const alternativeOf = e.alternativeOf === null ? null : mapped(map, e.alternativeOf);
        return { ...e, exerciseId, alternativeOf: alternativeOf === exerciseId ? null : alternativeOf };
      }),
    };
  });
}

/** Sostituisce gli id della mappa nelle voci delle schede (esercizio e alternative), senza doppioni. */
export function rewriteRoutines(routines: Routine[], map: Readonly<Record<string, string>>): Routine[] {
  const hit = (e: RoutineExercise) => Object.hasOwn(map, e.exerciseId) || e.alternatives.some((id) => Object.hasOwn(map, id));
  return routines.map((routine) => {
    if (!routine.exercises.some(hit)) return routine;
    return {
      ...routine,
      exercises: routine.exercises.map((e) => {
        if (!hit(e)) return e;
        const exerciseId = mapped(map, e.exerciseId);
        // niente doppioni e niente alternativa uguale all'esercizio della voce
        const alternatives = [...new Set(e.alternatives.map((id) => mapped(map, id)))].filter((id) => id !== exerciseId);
        return { ...e, exerciseId, alternatives };
      }),
    };
  });
}

/**
 * ID tolti dal catalogo di base (EXERCISE_REDIRECTS, ADR-009) sostituiti con quelli che restano, in
 * schede, sessioni e personalizzati. Idempotente: si applica a ogni archivio letto, anche a un v2
 * riscritto da una scheda con il codice vecchio.
 */
export function applyRedirects(archive: Archive): Archive {
  const catalog = Object.fromEntries(
    Object.entries(archive.catalog).map(([id, e]) => [id, e.variantOf === null ? e : { ...e, variantOf: redirectedId(e.variantOf) }]),
  );
  return {
    ...archive,
    catalog,
    routines: rewriteRoutines(archive.routines, EXERCISE_REDIRECTS),
    sessions: rewriteSessions(archive.sessions, EXERCISE_REDIRECTS),
  };
}

/** Quante sessioni e schede cambierebbe `mergeExercise`, per il testo della conferma. */
export function mergeImpact(archive: Pick<Archive, 'sessions' | 'routines'>, absorbedId: string): { sessions: number; routines: number } {
  return {
    sessions: archive.sessions.filter((s) => s.exercises.some((e) => e.exerciseId === absorbedId || e.alternativeOf === absorbedId)).length,
    routines: archive.routines.filter((r) => r.exercises.some((e) => e.exerciseId === absorbedId || e.alternatives.includes(absorbedId))).length,
  };
}

/** Approfondimento di un esercizio di base (US-19); null per i personalizzati, che non ne hanno. */
export function exerciseDetails(id: string): CatalogExercise | null {
  return BASE_CATALOG[id] ?? null;
}

/** true se l'approfondimento ha qualcosa da mostrare */
export function hasDetails(details: CatalogExercise | null): details is CatalogExercise {
  return !!details && !!(details.description || details.steps.length || details.caution || safeImagePath(details.image) || details.sources.length);
}

/**
 * Immagine di un approfondimento, con la regola del PoC: solo un file del sito (percorso relativo a
 * public/exercises/, senza "..") o un'immagine raster incorporata; niente domini esterni né SVG.
 * Restituisce il percorso accettato, o null.
 */
export function safeImagePath(path: string): string | null {
  if (/^data:image\/(png|jpeg|webp|avif|gif);base64,[a-z0-9+/=]+$/i.test(path)) return path;
  if (/^(\.\/)?[a-z0-9_-][a-z0-9_./-]*\.(png|jpe?g|webp|avif|gif)$/i.test(path) && !path.includes('..') && !path.includes('//')) return path.replace(/^\.\//, '');
  return null;
}

/** Fonti con un indirizzo web vero (http o https), come nel PoC */
export function safeSources(details: CatalogExercise): { title: string; url: string }[] {
  return details.sources.filter((s) => /^https?:\/\//i.test(s.url) && s.title.trim());
}
