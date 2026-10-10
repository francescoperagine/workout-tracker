import { describe, expect, it } from 'vitest';
import {
  formatClock,
  formatDateKey,
  formatDayMonth,
  formatDuration,
  formatElapsed,
  formatLongDay,
  formatMonth,
  formatOnDay,
  formatPeriod,
  formatRelativeDay,
  formatWeekRange,
  formatWeekdays,
  plural,
  speakDuration,
  withPreposition,
} from './format';

describe('format', () => {
  it('plurali', () => {
    expect(plural(1, 'scheda', 'schede')).toBe('1 scheda');
    expect(plural(0, 'scheda', 'schede')).toBe('0 schede');
    expect(plural(1200, 'allenamento', 'allenamenti')).toBe('1200 allenamenti');
    expect(plural(12000, 'allenamento', 'allenamenti')).toBe('12.000 allenamenti');
  });

  it('date in italiano, in ora locale', () => {
    expect(formatDateKey('2026-10-10')).toBe('10 ottobre 2026');
    expect(formatDateKey('2026-03-01')).toBe('1 marzo 2026');
  });

  it('durate come sul timer', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('durate a parole per gli screen reader', () => {
    expect(speakDuration(90)).toBe('1 minuto e 30 secondi');
    expect(speakDuration(120)).toBe('2 minuti');
    expect(speakDuration(15)).toBe('15 secondi');
    expect(speakDuration(0)).toBe('0 secondi');
  });

  it('preposizioni articolate davanti alle date', () => {
    expect(withPreposition('a', '8 settembre')).toBe('all’8 settembre');
    expect(withPreposition('da', '11 marzo')).toBe('dall’11 marzo');
    expect(withPreposition('di', '1 maggio')).toBe('del 1 maggio');
    expect(withPreposition('a', '18 maggio')).toBe('al 18 maggio');
    expect(formatPeriod('2026-09-01', '2026-09-08')).toBe('dal 1 settembre 2026 all’8 settembre 2026');
    expect(formatPeriod('2026-03-11', '2026-03-11')).toBe('dell’11 marzo 2026');
  });
});

describe('giorni e date brevi', () => {
  it('formatWeekdays', () => {
    expect(formatWeekdays(['mon', 'thu'])).toBe('lun, gio');
    expect(formatWeekdays(['sun'], true)).toBe('domenica');
    expect(formatWeekdays([])).toBe('');
  });

  it('formatDayMonth mostra l’anno solo se diverso', () => {
    expect(formatDayMonth('2026-10-03', '2026-10-10')).toBe('3 ottobre');
    expect(formatDayMonth('2025-12-31', '2026-10-10')).toBe('31 dicembre 2025');
  });
});

describe('date relative e settimane (step 5)', () => {
  const today = '2026-10-10'; // sabato

  it('formatRelativeDay', () => {
    expect(formatRelativeDay('2026-10-10', today)).toBe('oggi');
    expect(formatRelativeDay('2026-10-09', today)).toBe('ieri');
    expect(formatRelativeDay('2026-10-08', today)).toBe('giovedì');
    expect(formatRelativeDay('2026-10-04', today)).toBe('domenica');
    expect(formatRelativeDay('2026-10-03', today)).toBe('7 giorni fa');
    expect(formatRelativeDay('2026-09-28', today)).toBe('12 giorni fa');
    expect(formatRelativeDay('2026-08-01', today)).toBe('1 agosto');
    expect(formatRelativeDay('2025-12-20', today)).toBe('20 dicembre 2025');
  });

  it('durata dell’allenamento e ora', () => {
    expect(formatElapsed(30_000)).toBe('0 min');
    expect(formatElapsed(25 * 60_000)).toBe('25 min');
    expect(formatElapsed(65 * 60_000)).toBe('1 h 05 min');
    expect(formatClock(new Date(2026, 9, 10, 18, 5).getTime())).toBe('18:05');
  });

  it('intervallo della settimana, mese e giorno per esteso', () => {
    expect(formatWeekRange('2026-10-05', '2026-10-11', today)).toBe('5–11 ottobre');
    expect(formatWeekRange('2026-09-28', '2026-10-04', today)).toBe('28 settembre – 4 ottobre');
    expect(formatWeekRange('2025-12-29', '2026-01-04', today)).toBe('29 dicembre 2025 – 4 gennaio 2026');
    expect(formatWeekRange('2025-10-06', '2025-10-12', today)).toBe('6–12 ottobre 2025');
    expect(formatMonth('2026-10-08')).toBe('ottobre 2026');
    expect(formatLongDay('2026-10-08', today)).toBe('giovedì 8 ottobre');
    expect(formatOnDay('2026-10-09', today)).toBe('ieri');
    expect(formatOnDay('2026-09-08', today)).toBe('l’8 settembre');
    expect(formatOnDay('2026-09-11', today)).toBe('l’11 settembre');
    expect(formatOnDay('2026-09-03', today)).toBe('il 3 settembre');
  });
});
