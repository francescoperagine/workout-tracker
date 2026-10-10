// Catalogo: esercizi di base (dal codice) più quelli personalizzati dell'utente (nell'archivio).
// US-14: un nome scritto a mano si confronta senza maiuscole, spazi, punteggiatura e accenti;
// se non corrisponde a nessun esercizio diventa un esercizio personalizzato, riusato le volte dopo.
import { BASE_CATALOG } from '../../data/catalog';
import { ArchiveError, LIMITS, type Archive, type CatalogExercise, type CustomExercise } from './types';

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
  custom: boolean;
}

/** Tutti gli esercizi, prima quelli di base nell'ordine del catalogo, poi i personalizzati per nome. */
export function availableExercises(archive: Pick<Archive, 'catalog'>): CatalogEntry[] {
  const base = Object.values(BASE_CATALOG).map((e) => ({ id: e.id, name: e.name, custom: false }));
  const custom = Object.values(archive.catalog)
    .filter((e) => !(e.id in BASE_CATALOG))
    .map((e) => ({ id: e.id, name: e.name, custom: true }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'));
  return [...base, ...custom];
}

export function findExercise(archive: Pick<Archive, 'catalog'>, id: string): CatalogEntry | null {
  const base = BASE_CATALOG[id];
  if (base) return { id, name: base.name, custom: false };
  const custom = archive.catalog[id];
  return custom ? { id, name: custom.name, custom: true } : null;
}

/** Nome da mostrare; un id sconosciuto (es. un backup di una versione futura) resta leggibile. */
export function exerciseName(archive: Pick<Archive, 'catalog'>, id: string): string {
  return findExercise(archive, id)?.name ?? id;
}

/** Corrispondenza esatta sulla chiave; vince l'esercizio di base. */
export function findByName(archive: Pick<Archive, 'catalog'>, name: string): CatalogEntry | null {
  const key = nameKey(name);
  if (!key) return null;
  return availableExercises(archive).find((e) => nameKey(e.name) === key) ?? null;
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
    const name = words(entry.name);
    const entryKey = name.join('');
    let score = 0;
    if (entryKey === key) score = 3;
    else if (entryKey.startsWith(key)) score = 2;
    else if (typed.every((t) => name.some((w) => w.startsWith(t)))) score = 1;
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
 * US-14: restituisce l'esercizio che corrisponde al nome scritto a mano, o lo crea come
 * personalizzato. Non modifica l'archivio ricevuto. Il nome salvato è quello scritto, ripulito
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
  const created: CustomExercise = { id, name };
  return {
    archive: { ...archive, catalog: { ...archive.catalog, [id]: created } },
    exercise: { id, name, custom: true },
    created: true,
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
