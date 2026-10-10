import { describe, expect, it } from 'vitest';
import {
  KG_PER_LB,
  formatDistance,
  formatWeight,
  formatWeightRange,
  fromKg,
  fromMeters,
  parseDecimal,
  parseWeight,
  roundToStep,
  toKg,
  toMeters,
  weightFieldValue,
} from './units';

const NBSP = ' ';

describe('US-31 unità di misura', () => {
  it('kg resta kg, lb usa la libbra internazionale', () => {
    expect(fromKg(100, 'kg')).toBe(100);
    expect(toKg(100, 'kg')).toBe(100);
    expect(toKg(1, 'lb')).toBe(KG_PER_LB);
    expect(fromKg(KG_PER_LB, 'lb')).toBe(1);
  });

  it('andata e ritorno senza perdita: il valore digitato si rilegge identico nella stessa unità', () => {
    // Pesi realistici in lb e kg, decimali compresi, fino al limite di 10000
    const values = [0, 0.5, 1, 2.5, 5, 12.25, 45, 61.5, 95.3, 135, 135.3, 225, 315, 405, 999.75, 10000];
    for (const v of values) {
      expect(weightFieldValue(parseWeight(String(v), 'lb'), 'lb')).toBe(v);
      expect(weightFieldValue(parseWeight(String(v), 'kg'), 'kg')).toBe(v);
    }
    // e su un campione fitto al centesimo
    for (let cents = 0; cents <= 50_000; cents += 7) {
      const v = cents / 100;
      expect(weightFieldValue(toKg(v, 'lb'), 'lb')).toBe(v);
    }
  });

  it('il dato salvato non viene arrotondato: 135 lb in kg resta il valore esatto', () => {
    expect(parseWeight('135', 'lb')).toBe(135 * KG_PER_LB);
    expect(parseWeight('135', 'lb')).not.toBe(61.25);
  });

  it('cambiare unità non altera il dato: si riconverte lo stesso numero', () => {
    const kg = parseWeight('62,5', 'kg')!;
    expect(formatWeight(kg, { weightUnit: 'lb' })).toBe(`138${NBSP}lb`);
    expect(formatWeight(kg, { weightUnit: 'kg' })).toBe(`62,5${NBSP}kg`);
    expect(kg).toBe(62.5);
  });

  it('in visualizzazione arrotonda a 0,25 kg e 0,5 lb, con la virgola decimale', () => {
    expect(formatWeight(61.2349, { weightUnit: 'kg' })).toBe(`61,25${NBSP}kg`);
    expect(formatWeight(toKg(135, 'lb'), { weightUnit: 'lb' })).toBe(`135${NBSP}lb`);
    expect(formatWeight(toKg(135.3, 'lb'), { weightUnit: 'lb' })).toBe(`135,5${NBSP}lb`);
    expect(formatWeight(1000, { weightUnit: 'kg' })).toBe(`1000${NBSP}kg`);
    expect(formatWeight(40, { weightUnit: 'kg' }, false)).toBe('40');
    expect(formatWeight(null, { weightUnit: 'kg' })).toBe('—');
  });

  it('distanze: m e ft, andata e ritorno', () => {
    expect(fromMeters(0.3048, 'ft')).toBe(1);
    expect(toMeters(1, 'ft')).toBe(0.3048);
    for (const v of [0, 1, 10, 33.5, 100, 400, 5280]) expect(Number(fromMeters(toMeters(v, 'ft'), 'ft').toFixed(6))).toBe(v);
    expect(formatDistance(400, { distanceUnit: 'm' })).toBe(`400${NBSP}m`);
    expect(formatDistance(100, { distanceUnit: 'ft' })).toBe(`328${NBSP}ft`);
    expect(formatDistance(null, { distanceUnit: 'm' })).toBe('—');
  });

  it('legge i numeri digitati con la virgola o il punto', () => {
    expect(parseDecimal('62,5')).toBe(62.5);
    expect(parseDecimal(' 62.5 ')).toBe(62.5);
    expect(parseDecimal(',5')).toBe(0.5);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('-3')).toBeNaN();
    expect(parseDecimal('12kg')).toBeNaN();
    expect(parseWeight('abc', 'lb')).toBeNaN();
    expect(parseWeight('', 'lb')).toBeNull();
  });

  it('arrotonda al passo senza rumore dei float', () => {
    expect(roundToStep(0.30000000000000004, 0.1)).toBe(0.3);
    expect(roundToStep(12.13, 0.25)).toBe(12.25);
    expect(roundToStep(12.12, 0.25)).toBe(12);
  });
});

describe('formatWeightRange', () => {
  it('carico singolo, intervallo o assente, nell’unità scelta', () => {
    expect(formatWeightRange(40, 40, { weightUnit: 'kg' })).toBe('40\u00a0kg');
    expect(formatWeightRange(45, 50, { weightUnit: 'kg' })).toBe('45–50\u00a0kg');
    expect(formatWeightRange(null, null, { weightUnit: 'kg' })).toBe('');
    expect(formatWeightRange(20, null, { weightUnit: 'kg' })).toBe('20\u00a0kg');
    expect(formatWeightRange(toKg(135, 'lb'), toKg(145, 'lb'), { weightUnit: 'lb' })).toBe('135–145\u00a0lb');
  });
});
