import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  dayInfo,
  firstSessionDate,
  hasWeeklyPlan,
  monthWeeks,
  setDateOverride,
  setWeeklyDay,
  staleWeeklyDays,
  weekDates,
  weekStart,
} from './calendar';
import { fromDateKey } from './dates';
import { planFor } from './routines';
import { ArchiveError, emptyArchive, type Archive, type Routine, type Session } from './types';

function routine(id: string, archived = false): Routine {
  return { id, name: `Scheda ${id.toUpperCase()}`, notes: '', archived, exercises: [] };
}

let n = 0;
function session(date: string, routineId: string | null, finished = true): Session {
  const start = fromDateKey(date).getTime() + n++;
  return { id: `s${n}`, date, routineId, name: '', start, end: finished ? start + 3_600_000 : null, exercises: [] };
}

const archive = (partial: Partial<Archive>): Archive => ({ ...emptyArchive(), ...partial });
// 2026-10-08 è un giovedì; "oggi" nei test è sabato 10 ottobre
const TODAY = '2026-10-10';

describe('settimane e mesi in ora locale', () => {
  it('giorni, lunedì della settimana e i sette giorni', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    // cambio dell'ora legale (25 ottobre 2026 in Europa): nessun giorno saltato
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(weekStart('2026-10-08')).toBe('2026-10-05');
    expect(weekStart('2026-10-05')).toBe('2026-10-05');
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
    expect(weekDates('2026-10-08')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  });

  it('il mese copre settimane intere da lunedì, anche tra due anni', () => {
    const october = monthWeeks('2026-10-08');
    expect(october).toHaveLength(5);
    expect(october[0][0]).toBe('2026-09-28');
    expect(october.at(-1)!.at(-1)).toBe('2026-11-01');
    // febbraio 2026 comincia di domenica: la prima riga parte dal 26 gennaio
    expect(monthWeeks('2026-02-15')).toHaveLength(5);
    expect(monthWeeks('2026-02-15')[0][0]).toBe('2026-01-26');
    expect(monthWeeks('2025-12-10').at(-1)).toContain('2026-01-04');
    expect(addMonths('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-01');
  });
});

describe('US-05 stato di ogni giorno', () => {
  const base = archive({ routines: [routine('a'), routine('b')], schedule: { mon: 'a', wed: null, thu: 'b', sat: 'a' } });

  it('fatto, saltato, pianificato, riposo, niente', () => {
    const a = { ...base, sessions: [session('2026-10-05', 'a')] };
    expect(dayInfo(a, '2026-10-05', TODAY).status).toBe('done');
    expect(dayInfo(a, '2026-10-08', TODAY).status).toBe('skipped');
    expect(dayInfo(a, '2026-10-07', TODAY).status).toBe('rest');
    expect(dayInfo(a, '2026-10-06', TODAY).status).toBe('empty');
    const today = dayInfo(a, TODAY, TODAY);
    expect(today).toMatchObject({ status: 'planned', isToday: true, isPast: false, weekday: 'sat' });
    expect(dayInfo(a, '2026-10-15', TODAY).status).toBe('planned');
  });

  it('sessione in un giorno di riposo o senza piano: fatto; sessione in corso: in corso', () => {
    const a = { ...base, sessions: [session('2026-10-07', null), session(TODAY, 'a', false)] };
    expect(dayInfo(a, '2026-10-07', TODAY).status).toBe('done');
    expect(dayInfo(a, TODAY, TODAY).status).toBe('in-progress');
    const twice = { ...base, sessions: [session('2026-10-05', 'a'), session('2026-10-05', null)] };
    expect(dayInfo(twice, '2026-10-05', TODAY).sessions).toHaveLength(2);
  });

  it('l’eccezione cambia lo stato: riposo al posto della scheda non è un giorno saltato', () => {
    const a = { ...base, overrides: { '2026-10-08': null } };
    expect(dayInfo(a, '2026-10-08', TODAY)).toMatchObject({ status: 'rest', plan: { kind: 'rest', override: true } });
  });

  it('prima sessione dello storico', () => {
    expect(firstSessionDate(base)).toBeNull();
    expect(firstSessionDate({ ...base, sessions: [session('2026-10-05', 'a'), session('2026-09-01', null)] })).toBe('2026-09-01');
  });
});

describe('US-04 settimana tipo', () => {
  const base = archive({ routines: [routine('a'), routine('b'), routine('x', true)] });

  it('assegna una scheda, il riposo o niente a un giorno; vale per tutte le settimane', () => {
    let a = setWeeklyDay(base, 'thu', 'b');
    expect(a.schedule).toEqual({ thu: 'b' });
    expect(planFor(a, '2026-10-08')).toMatchObject({ kind: 'routine', routine: { id: 'b' } });
    expect(planFor(a, '2026-12-31')).toMatchObject({ kind: 'routine', routine: { id: 'b' } });
    a = setWeeklyDay(a, 'sun', null);
    expect(a.schedule).toEqual({ thu: 'b', sun: null });
    expect(hasWeeklyPlan(a)).toBe(true);
    a = setWeeklyDay(a, 'thu', undefined);
    expect(a.schedule).toEqual({ sun: null });
    expect(base.schedule).toEqual({}); // non muta l'argomento
    expect(setWeeklyDay(a, 'sun', null)).toBe(a);
  });

  it('non si assegna una scheda archiviata o inesistente', () => {
    expect(() => setWeeklyDay(base, 'mon', 'x')).toThrow(ArchiveError);
    expect(() => setWeeklyDay(base, 'mon', 'nessuna')).toThrow(ArchiveError);
  });

  it('avvisa dei giorni assegnati a una scheda archiviata', () => {
    const a = { ...base, schedule: { mon: 'x', tue: 'a', wed: 'sparita' } };
    expect(staleWeeklyDays(a).map((d) => [d.weekday, d.routine?.id ?? null])).toEqual([
      ['mon', 'x'],
      ['wed', null],
    ]);
  });
});

describe('US-06 eccezione per una sola data', () => {
  const base = archive({ routines: [routine('a'), routine('b')], schedule: { thu: 'b' } });

  it('altra scheda o riposo per una data, senza toccare la settimana tipo', () => {
    const a = setDateOverride(base, '2026-10-08', 'a');
    expect(a.overrides).toEqual({ '2026-10-08': 'a' });
    expect(a.schedule).toEqual({ thu: 'b' });
    expect(planFor(a, '2026-10-08')).toMatchObject({ kind: 'routine', routine: { id: 'a' }, override: true });
    expect(planFor(a, '2026-10-15')).toMatchObject({ routine: { id: 'b' }, override: false });
    const rest = setDateOverride(a, '2026-10-08', null);
    expect(rest.overrides).toEqual({ '2026-10-08': null });
  });

  it('tornare alla settimana tipo toglie l’eccezione; un’eccezione uguale alla settimana non serve', () => {
    const a = setDateOverride(base, '2026-10-08', 'a');
    expect(setDateOverride(a, '2026-10-08', undefined).overrides).toEqual({});
    expect(setDateOverride(a, '2026-10-08', 'b').overrides).toEqual({});
    expect(setDateOverride(base, '2026-10-08', 'b')).toBe(base);
    // un giorno senza piano: il riposo è un'eccezione
    expect(setDateOverride(base, '2026-10-09', null).overrides).toEqual({ '2026-10-09': null });
  });

  it('rifiuta date non valide e schede archiviate', () => {
    expect(() => setDateOverride(base, '2026-02-30', 'a')).toThrow(ArchiveError);
    expect(() => setDateOverride({ ...base, routines: [routine('a', true)] }, '2026-10-08', 'a')).toThrow(ArchiveError);
  });
});
