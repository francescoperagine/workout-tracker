import { describe, expect, it } from 'vitest';
import { fromDateKey } from './dates';
import { planFor, quickStart, sessionInProgress, withStarterRoutines } from './routines';
import { emptyArchive, type Archive, type Routine, type Session } from './types';

function routine(id: string, archived = false): Routine {
  return { id, name: `Scheda ${id.toUpperCase()}`, notes: '', archived, exercises: [] };
}

let n = 0;
function session(date: string, routineId: string | null, finished = true): Session {
  const start = fromDateKey(date).getTime() + n++;
  return { id: `s${n}`, date, routineId, name: '', start, end: finished ? start + 3_600_000 : null, exercises: [] };
}

function archive(partial: Partial<Archive>): Archive {
  return { ...emptyArchive(), ...partial };
}

const ids = (rows: { routine: Routine }[]) => rows.map((r) => r.routine.id);
// 2026-10-08 è un giovedì
const THURSDAY = '2026-10-08';

describe('US-11 avvio rapido dalle ultime schede', () => {
  it('senza storico: le schede attive nel loro ordine, suggerita la prima', () => {
    const a = archive({ routines: [routine('a'), routine('b'), routine('x', true), routine('c')] });
    const start = quickStart(a, THURSDAY);
    expect(ids(start.rows)).toEqual(['a', 'b', 'c']);
    expect(start.rows.every((r) => r.lastDone === null && !r.planned)).toBe(true);
    expect(start.suggested).toBe('a');
  });

  it('senza schede: nessuna riga e nessun suggerimento', () => {
    expect(quickStart(emptyArchive(), THURSDAY)).toMatchObject({ rows: [], suggested: null });
  });

  it('le ultime 4 schede fatte, distinte, dalla più recente', () => {
    const a = archive({
      routines: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => routine(id)),
      sessions: [
        session('2026-09-20', 'e'),
        session('2026-09-25', 'a'),
        session('2026-09-28', 'b'),
        session('2026-10-01', 'c'),
        session('2026-10-03', 'a'),
        session('2026-10-05', 'd'),
        session('2026-10-06', null), // allenamento libero: non è una scheda
      ],
    });
    const start = quickStart(a, THURSDAY);
    expect(ids(start.rows)).toEqual(['d', 'a', 'c', 'b']);
    expect(start.rows.map((r) => r.lastDone)).toEqual(['2026-10-05', '2026-10-03', '2026-10-01', '2026-09-28']);
    // senza pianificazione: tra le recenti, quella fatta da più tempo
    expect(start.suggested).toBe('b');
  });

  it('A/B si alternano da sole: dopo A suggerisce B, dopo B suggerisce A', () => {
    const base = { routines: [routine('a'), routine('b')] };
    const afterA = archive({ ...base, sessions: [session('2026-10-01', 'b'), session('2026-10-06', 'a')] });
    expect(quickStart(afterA, THURSDAY).suggested).toBe('b');
    const afterB = archive({ ...base, sessions: [...afterA.sessions, session('2026-10-07', 'b')] });
    expect(quickStart(afterB, THURSDAY).suggested).toBe('a');
    // due sessioni nello stesso giorno: conta l'ultima iniziata
    const sameDay = archive({ ...base, sessions: [session('2026-10-07', 'b'), session('2026-10-07', 'a')] });
    expect(quickStart(sameDay, THURSDAY).suggested).toBe('b');
  });

  it('con meno di 4 schede fatte completa con le altre attive', () => {
    const a = archive({ routines: [routine('a'), routine('b'), routine('c')], sessions: [session('2026-10-01', 'c')] });
    const start = quickStart(a, THURSDAY);
    expect(ids(start.rows)).toEqual(['c', 'a', 'b']);
    expect(start.suggested).toBe('c');
  });

  it('la pianificata per oggi è la suggerita e si aggiunge se non è tra le recenti', () => {
    const a = archive({
      routines: ['a', 'b', 'c', 'd', 'e', 'p'].map((id) => routine(id)),
      sessions: ['a', 'b', 'c', 'd', 'e'].map((id, i) => session(`2026-10-0${i + 1}`, id)),
      schedule: { thu: 'p' },
    });
    const start = quickStart(a, THURSDAY);
    expect(ids(start.rows)).toEqual(['e', 'd', 'c', 'b', 'p']);
    expect(start.rows.at(-1)).toMatchObject({ planned: true, lastDone: null });
    expect(start.suggested).toBe('p');
    // se è già tra le recenti non si duplica
    const withB = { ...a, schedule: { thu: 'b' } };
    expect(ids(quickStart(withB, THURSDAY).rows)).toEqual(['e', 'd', 'c', 'b']);
    expect(quickStart(withB, THURSDAY).suggested).toBe('b');
  });

  it('l’eccezione per la data vince sulla pianificazione settimanale; riposo = nessuna pianificata', () => {
    const base = archive({
      routines: [routine('a'), routine('b')],
      sessions: [session('2026-10-05', 'a'), session('2026-10-06', 'b')],
      schedule: { thu: 'b' },
    });
    expect(quickStart({ ...base, overrides: { [THURSDAY]: 'a' } }, THURSDAY).suggested).toBe('a');
    const rest = quickStart({ ...base, overrides: { [THURSDAY]: null } }, THURSDAY);
    expect(rest.plan).toEqual({ kind: 'rest', override: true });
    // giorno di riposo: si può allenarsi comunque, con il suggerimento delle recenti
    expect(rest.suggested).toBe('a');
  });

  it('una scheda archiviata non compare e non viene suggerita, anche se pianificata', () => {
    const a = archive({
      routines: [routine('a', true), routine('b')],
      sessions: [session('2026-10-06', 'a'), session('2026-10-01', 'b')],
      schedule: { thu: 'a' },
    });
    const start = quickStart(a, THURSDAY);
    expect(ids(start.rows)).toEqual(['b']);
    expect(start.suggested).toBe('b');
    expect(start.plan).toEqual({ kind: 'none' });
  });

  it('una sessione in corso non conta come fatta', () => {
    const a = archive({ routines: [routine('a'), routine('b')], sessions: [session('2026-10-01', 'a'), session(THURSDAY, 'b', false)] });
    expect(quickStart(a, THURSDAY).rows.find((r) => r.routine.id === 'b')?.lastDone).toBeNull();
    expect(sessionInProgress(a)?.routineId).toBe('b');
  });
});

describe('pianificazione e schede iniziali', () => {
  it('pianificazione settimanale per giorno; chiave assente = nulla di pianificato', () => {
    const a = archive({ routines: [routine('a')], schedule: { mon: 'a', tue: null } });
    expect(planFor(a, '2026-10-05')).toMatchObject({ kind: 'routine', override: false });
    expect(planFor(a, '2026-10-06')).toEqual({ kind: 'rest', override: false });
    expect(planFor(a, '2026-10-07')).toEqual({ kind: 'none' });
  });

  it('"Inizia con le schede di esempio" aggiunge A e B solo se mancano', () => {
    const withAB = withStarterRoutines(emptyArchive());
    expect(withAB.routines.map((r) => r.id)).toEqual(['routine-a', 'routine-b']);
    expect(withStarterRoutines(withAB)).toBe(withAB);
    // copia: modificarla non tocca i dati del codice
    withAB.routines[0].name = 'Modificata';
    expect(withStarterRoutines(emptyArchive()).routines[0].name).toBe('Scheda A');
  });
});
