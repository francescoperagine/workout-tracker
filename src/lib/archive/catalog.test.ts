import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { BASE_CATALOG } from '../../data/catalog';
import {
  availableExercises,
  createVariant,
  ensureExercise,
  exerciseName,
  findByName,
  findExercise,
  mergeExercise,
  mergeImpact,
  nameKey,
  proposeVariantName,
  setCustomMuscles,
  suggestExercises,
  variantImpact,
} from './catalog';
import { validateArchive } from './validation';
import { ArchiveError, emptyArchive, LIMITS, type Archive, type Session } from './types';

describe('US-14 nome scritto a mano', () => {
  it('il confronto ignora maiuscole, spazi, punteggiatura e accenti', () => {
    expect(nameKey('Leg press, piedi a metà pedana')).toBe(nameKey('  leg PRESS piedi a meta  pedana '));
    expect(nameKey('Hyperextension 45° con disco')).toBe('hyperextension45condisco');
    expect(nameKey('Pull-through al cavo')).toBe(nameKey('pullthrough al cavo'));
    expect(nameKey('?!')).toBe('');
  });

  it('un nome che corrisponde a un esercizio del catalogo usa quello, senza creare nulla', () => {
    const archive = emptyArchive();
    const result = ensureExercise(archive, 'hack  SQUAT');
    expect(result.created).toBe(false);
    expect(result.exercise).toMatchObject({ id: 'hack-squat', name: 'Hack squat', custom: false });
    expect(result.archive).toBe(archive);
  });

  it('un nome nuovo diventa un esercizio personalizzato, riusato la volta dopo', () => {
    const empty = emptyArchive();
    const first = ensureExercise(empty, '  Crunch   ai cavi ');
    expect(first.created).toBe(true);
    expect(first.exercise).toEqual({ id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi', aliases: [], custom: true });
    expect(first.archive.catalog['custom-crunch-ai-cavi']).toEqual({ id: 'custom-crunch-ai-cavi', name: 'Crunch ai cavi', muscles: {}, variantOf: null });
    // l'archivio di partenza non viene modificato
    expect(empty.catalog).toEqual({});

    const second = ensureExercise(first.archive, 'crunch AI cavì');
    expect(second.created).toBe(false);
    expect(second.exercise.id).toBe('custom-crunch-ai-cavi');
    expect(second.archive).toBe(first.archive);
  });

  it('lo stesso nome crea lo stesso id su dispositivi diversi', () => {
    const a = ensureExercise(emptyArchive(), 'Pàlla medica').exercise.id;
    const b = ensureExercise(emptyArchive(), 'palla MEDICA').exercise.id;
    expect(a).toBe(b);
    expect(a).toBe('custom-palla-medica');
  });

  it('rifiuta un nome vuoto, senza lettere o troppo lungo', () => {
    expect(() => ensureExercise(emptyArchive(), '   ')).toThrow(ArchiveError);
    expect(() => ensureExercise(emptyArchive(), '—')).toThrow(ArchiveError);
    expect(() => ensureExercise(emptyArchive(), 'x'.repeat(201))).toThrow(ArchiveError);
  });

  it('suggerisce i nomi simili mentre si scrive: prima chi comincia con il testo', () => {
    const archive = ensureExercise(emptyArchive(), 'Panca declinata').archive;
    const names = (text: string) => suggestExercises(archive, text).map((e) => e.name);
    expect(names('panca')).toEqual([
      'Panca piana bilanciere',
      'Panca piana manubri',
      // dall'alias «Panca inclinata manubri» (US-35)
      'Distensioni manubri panca inclinata',
      'Panca inclinata al Smith',
      'Panca declinata',
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
    ]);
    expect(names('pan inc')).toEqual([
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
      'Distensioni manubri panca inclinata',
      'Panca inclinata al Smith',
    ]);
    expect(names('HACK')).toEqual(['Hack squat']);
    expect(names('')).toEqual([]);
    expect(suggestExercises(archive, 'a', 3)).toHaveLength(3);
  });

  it('elenco, ricerca per id e nome di un id sconosciuto', () => {
    const archive = ensureExercise(emptyArchive(), 'Zercher squat').archive;
    const all = availableExercises(archive);
    expect(all[0].id).toBe('squat-bilanciere');
    expect(all.at(-1)).toEqual({ id: 'custom-zercher-squat', name: 'Zercher squat', aliases: [], custom: true });
    expect(findExercise(archive, 'curl-ez')?.name).toBe('Curl EZ');
    expect(exerciseName(archive, 'esercizio-futuro')).toBe('esercizio-futuro');
    expect(findByName(archive, 'zercher-squat')?.id).toBe('custom-zercher-squat');
    expect(findByName(archive, '   ')).toBeNull();
  });
});

// Diario vero di Francesco al 5 novembre 2026 (sola lettura): doppioni nati prima degli alias.
const fixtureText = readFileSync(new URL('../../../tests/fixtures/workout-tracker-2026-11-05.json', import.meta.url), 'utf8');
const fixture = (): Archive => validateArchive(JSON.parse(fixtureText));
const OCT_5 = '93699965-4e61-4835-9e49-9f204efeb56f';

describe('US-35 alias del catalogo di base', () => {
  it('nessuna chiave si ripete tra nomi e alias di esercizi diversi; nessun alias vuoto o uguale al nome', () => {
    const owner = new Map<string, string>();
    for (const e of Object.values(BASE_CATALOG)) {
      for (const alias of e.aliases) {
        expect(nameKey(alias), `${e.id}: «${alias}»`).not.toBe('');
        expect(nameKey(alias), `${e.id}: «${alias}»`).not.toBe(nameKey(e.name));
      }
      for (const key of new Set([e.name, ...e.aliases].map(nameKey))) {
        expect(owner.get(key), `«${key}» è di ${owner.get(key)} e di ${e.id}`).toBeUndefined();
        owner.set(key, e.id);
      }
    }
  });

  it('un alias trova l’esercizio di base, anche quando esiste un personalizzato con quel nome', () => {
    for (const archive of [emptyArchive(), fixture()]) {
      for (const typed of ['romanian deadlift', 'Stacco Rumeno', 'RÓMANIAN deadlift']) {
        expect(findByName(archive, typed)?.id, typed).toBe('stacco-rumeno-bilanciere');
        const ensured = ensureExercise(archive, typed);
        expect(ensured.created).toBe(false);
        expect(ensured.archive).toBe(archive);
      }
    }
    expect(suggestExercises(emptyArchive(), 'romanian').map((e) => e.id)).toEqual(['stacco-rumeno-bilanciere', 'stacco-rumeno-manubri']);
    expect(availableExercises(emptyArchive()).find((e) => e.id === 'leg-press')?.aliases).toEqual(['Pressa', 'Pressa orizzontale']);
  });

  it('il vecchio nome del rematore tolto e i suoi alias trovano il rematore seduto (ADR-009)', () => {
    for (const typed of ['Rematore al cavo basso', 'Pulley basso', 'Low cable row']) expect(findByName(emptyArchive(), typed)?.id, typed).toBe('rematore-seduto-al-cavo-basso');
  });
});

describe('US-35 unione di esercizi duplicati', () => {
  it('custom-deadlift in custom-stacco-da-terra: sessioni riscritte, assorbito eliminato, archivio valido', () => {
    const before = fixture();
    const snapshot = JSON.stringify(before);
    expect(mergeImpact(before, 'custom-deadlift')).toEqual({ sessions: 1, routines: 0 });
    const after = mergeExercise(before, 'custom-deadlift', 'custom-stacco-da-terra');
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after.catalog['custom-deadlift']).toBeUndefined();
    expect(after.catalog['custom-stacco-da-terra']).toBeDefined();
    const ids = after.sessions.flatMap((s) => s.exercises.flatMap((e) => [e.exerciseId, e.alternativeOf]));
    expect(ids).not.toContain('custom-deadlift');
    const nov4 = after.sessions.find((s) => s.date === '2026-11-04')!;
    expect(nov4.exercises.filter((e) => e.exerciseId === 'custom-stacco-da-terra').map((e) => e.sets.map((s) => [s.kg, s.reps]))).toEqual([
      [[30, 10], [50, 8], [50, 10], [50, 10]],
    ]);
    expect(validateArchive(JSON.parse(JSON.stringify(after)))).toEqual(after);
    // il 2026-10-05, con i suoi dati sporchi, resta com'era
    expect(JSON.stringify(after.sessions.find((s) => s.id === OCT_5))).toBe(JSON.stringify(before.sessions.find((s) => s.id === OCT_5)));
  });

  it('schede (anche le alternative) e sessioni: niente doppioni né alternative di sé stesso', () => {
    const before = fixture();
    expect(mergeImpact(before, 'custom-estensioni-tricipiti-sopra-la-testa-al-cavo')).toEqual({ sessions: 2, routines: 1 });
    const after = mergeExercise(before, 'custom-estensioni-tricipiti-sopra-la-testa-al-cavo', 'french-press-ez');
    // a-5: l'esercizio diventa French press EZ, che esce dalle sue alternative
    expect(after.routines[0].exercises[4]).toMatchObject({ exerciseId: 'french-press-ez', alternatives: ['french-press-con-manubrio'] });
    // 2026-10-12: French press EZ fatta al posto dell'assorbito non è più un’alternativa
    const oct12 = after.sessions.find((s) => s.date === '2026-10-12')!;
    expect(oct12.exercises[4]).toMatchObject({ exerciseId: 'french-press-ez', alternativeOf: null });
    // custom con custom: sceglie l'utente; l’alternativa del 2026-10-12 torna l'esercizio previsto
    const legCurl = mergeExercise(before, 'custom-leg-curl-seduto', 'custom-leg-curl');
    expect(legCurl.sessions.find((s) => s.date === '2026-10-12')!.exercises[3]).toMatchObject({ exerciseId: 'custom-leg-curl', alternativeOf: null });
    expect(JSON.stringify(legCurl.sessions.find((s) => s.id === OCT_5))).toBe(JSON.stringify(before.sessions.find((s) => s.id === OCT_5)));
  });

  it('alternativa che diventa un doppione, assorbito unico esercizio di una scheda archiviata', () => {
    let archive = emptyArchive();
    archive = ensureExercise(archive, 'Panca declinata').archive;
    archive = ensureExercise(archive, 'Decline bench').archive;
    const entry = { sets: 3, reps: '8', loadMin: null, loadMax: null, loadNote: '', unit: '', rest: 90, warmupRest: 60, group: null };
    archive = {
      ...archive,
      routines: [
        { id: 'r1', name: 'A', notes: '', archived: true, exercises: [{ ...entry, id: 'e1', exerciseId: 'custom-decline-bench', alternatives: [] }] },
        { id: 'r2', name: 'B', notes: '', archived: false, exercises: [{ ...entry, id: 'e2', exerciseId: 'leg-press', alternatives: ['custom-decline-bench', 'custom-panca-declinata'] }] },
      ],
    };
    const after = mergeExercise(archive, 'custom-decline-bench', 'custom-panca-declinata');
    expect(after.routines[0].exercises[0].exerciseId).toBe('custom-panca-declinata');
    expect(after.routines[1].exercises[0].alternatives).toEqual(['custom-panca-declinata']);
    expect(Object.keys(after.catalog)).toEqual(['custom-panca-declinata']);
  });

  it('rifiuta stesso esercizio, assorbito di base o sconosciuto, destinazione sconosciuta', () => {
    const archive = fixture();
    expect(() => mergeExercise(archive, 'custom-deadlift', 'custom-deadlift')).toThrow(ArchiveError);
    expect(() => mergeExercise(archive, 'squat-bilanciere', 'leg-press')).toThrow('predefinito');
    expect(() => mergeExercise(archive, 'custom-nessuno', 'leg-press')).toThrow('non esiste più');
    expect(() => mergeExercise(archive, 'custom-deadlift', 'esercizio-futuro')).toThrow('non esiste più');
  });
});

describe('US-44 variante di un esercizio di catalogo', () => {
  const entry = { sets: 3, reps: '8', loadMin: null, loadMax: null, loadNote: '', unit: '', rest: 90, warmupRest: 60, group: null };
  const session = (id: string, end: number | null): Session => ({
    id, date: '2026-11-02', routineId: 'r1', name: 'A', start: 1, end,
    exercises: [{ id: `${id}-e`, exerciseId: 'squat-bilanciere', alternativeOf: null, group: null, rest: 90, warmupRest: 60, notes: '', sets: [] }],
  });
  const archive = (): Archive => ({
    ...emptyArchive(),
    routines: [
      { id: 'r1', name: 'A', notes: '', archived: false, exercises: [{ ...entry, id: 'e1', exerciseId: 'squat-bilanciere', alternatives: ['leg-press'] }] },
      { id: 'r2', name: 'B', notes: '', archived: false, exercises: [{ ...entry, id: 'e2', exerciseId: 'leg-press', alternatives: ['squat-bilanciere', 'hack-squat'] }] },
      { id: 'r3', name: 'C', notes: '', archived: true, exercises: [{ ...entry, id: 'e3', exerciseId: 'squat-bilanciere', alternatives: [] }] },
      { id: 'r4', name: 'D', notes: '', archived: false, exercises: [{ ...entry, id: 'e4', exerciseId: 'hack-squat', alternatives: [] }] },
    ],
    sessions: [session('s1', 2), session('s2', null)],
  });

  it('copia i muscoli, imposta variantOf e sostituisce l’originale solo nelle schede attive', () => {
    const before = archive();
    const snapshot = structuredClone(before);
    const result = createVariant(before, 'squat-bilanciere', 'Squat bilanciere (personalizzato)');
    expect(result.id).toBe('custom-squat-bilanciere-personalizzato');
    expect(result.archive.catalog[result.id]).toEqual({
      id: result.id,
      name: 'Squat bilanciere (personalizzato)',
      muscles: BASE_CATALOG['squat-bilanciere'].muscles,
      variantOf: 'squat-bilanciere',
    });
    expect(result.archive.catalog[result.id].muscles).not.toBe(BASE_CATALOG['squat-bilanciere'].muscles);
    const [r1, r2, r3, r4] = result.archive.routines;
    expect(r1.exercises[0]).toMatchObject({ exerciseId: result.id, alternatives: ['leg-press'] });
    expect(r2.exercises[0].alternatives).toEqual([result.id, 'hack-squat']);
    expect(r3).toBe(before.routines[2]);
    expect(r4).toBe(before.routines[3]);
    // sessioni, anche quella in corso, invariate
    expect(result.archive.sessions).toBe(before.sessions);
    expect(result.routines).toBe(2);
    expect(result.routines).toBe(variantImpact(before, 'squat-bilanciere'));
    expect(before).toEqual(snapshot);
  });

  it('«Annulla» è mergeExercise della variante nell’originale', () => {
    const before = archive();
    const { archive: after, id } = createVariant(before, 'squat-bilanciere', 'Squat mio');
    expect(mergeExercise(after, id, 'squat-bilanciere')).toEqual(before);
  });

  it('rifiuta un personalizzato, un nome già usato o non valido e il limite dei personalizzati', () => {
    const custom = ensureExercise(archive(), 'Squat mio');
    expect(() => createVariant(custom.archive, custom.exercise.id, 'Altro')).toThrow(ArchiveError);
    expect(() => createVariant(custom.archive, 'squat-bilanciere', 'squat MIO')).toThrow('già');
    expect(() => createVariant(custom.archive, 'squat-bilanciere', 'Pressa')).toThrow('già');
    expect(() => createVariant(custom.archive, 'squat-bilanciere', '  ')).toThrow(ArchiveError);
    const full = archive();
    for (let i = 0; i < LIMITS.customExercises; i++) full.catalog[`custom-x${i}`] = { id: `custom-x${i}`, name: `X ${i}`, muscles: {}, variantOf: null };
    expect(() => createVariant(full, 'squat-bilanciere', 'Squat mio')).toThrow('limite');
  });

  it('propone «<nome> (personalizzato)», poi «(personalizzato 2)» se il primo esiste', () => {
    const a = archive();
    expect(proposeVariantName(a, 'squat-bilanciere')).toBe('Squat bilanciere (personalizzato)');
    const b = createVariant(a, 'squat-bilanciere', proposeVariantName(a, 'squat-bilanciere')).archive;
    expect(proposeVariantName(b, 'squat-bilanciere')).toBe('Squat bilanciere (personalizzato 2)');
  });
});

describe('US-43 muscoli di un personalizzato', () => {
  it('salva una copia della mappa senza mutare l’archivio', () => {
    const { archive, exercise } = ensureExercise(emptyArchive(), 'Crunch ai cavi');
    const muscles = { abs: 1, 'lower-back': 0.5 };
    const after = setCustomMuscles(archive, exercise.id, muscles);
    expect(after.catalog[exercise.id].muscles).toEqual({ abs: 1, 'lower-back': 0.5 });
    expect(after.catalog[exercise.id].muscles).not.toBe(muscles);
    expect(archive.catalog[exercise.id].muscles).toEqual({});
  });

  it('rifiuta un esercizio di catalogo, uno sconosciuto, un gruppo ignoto e un valore non ammesso', () => {
    const { archive, exercise } = ensureExercise(emptyArchive(), 'Crunch ai cavi');
    expect(() => setCustomMuscles(archive, 'squat-bilanciere', { quads: 1 })).toThrow('catalogo');
    expect(() => setCustomMuscles(archive, 'custom-nessuno', {})).toThrow('non esiste più');
    expect(() => setCustomMuscles(archive, exercise.id, { core: 1 } as never)).toThrow(ArchiveError);
    expect(() => setCustomMuscles(archive, exercise.id, { abs: 0.7 })).toThrow(ArchiveError);
  });
});
