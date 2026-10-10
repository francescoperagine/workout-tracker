import { describe, expect, it } from 'vitest';
import { formatDateKey, formatDuration, formatPeriod, plural, speakDuration, withPreposition } from './format';

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
