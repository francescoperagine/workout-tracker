import { describe, expect, it } from 'vitest';
import {
  KG_PER_LB,
  aKg,
  aMetri,
  arrotondaAlPasso,
  daKg,
  daMetri,
  formattaDistanza,
  formattaPeso,
  leggiDecimale,
  leggiPeso,
  valoreCampoPeso,
} from './unita';

const NBSP = ' ';

describe('US-31 unità di misura', () => {
  it('kg resta kg, lb usa la libbra internazionale', () => {
    expect(daKg(100, 'kg')).toBe(100);
    expect(aKg(100, 'kg')).toBe(100);
    expect(aKg(1, 'lb')).toBe(KG_PER_LB);
    expect(daKg(KG_PER_LB, 'lb')).toBe(1);
  });

  it('andata e ritorno senza perdita: il valore digitato si rilegge identico nella stessa unità', () => {
    // Pesi realistici in lb e kg, decimali compresi, fino al limite di 10000
    const valori = [0, 0.5, 1, 2.5, 5, 12.25, 45, 61.5, 95.3, 135, 135.3, 225, 315, 405, 999.75, 10000];
    for (const v of valori) {
      expect(valoreCampoPeso(leggiPeso(String(v), 'lb'), 'lb')).toBe(v);
      expect(valoreCampoPeso(leggiPeso(String(v), 'kg'), 'kg')).toBe(v);
    }
    // e su un campione fitto al centesimo
    for (let centesimi = 0; centesimi <= 50_000; centesimi += 7) {
      const v = centesimi / 100;
      expect(valoreCampoPeso(aKg(v, 'lb'), 'lb')).toBe(v);
    }
  });

  it('il dato salvato non viene arrotondato: 135 lb in kg resta il valore esatto', () => {
    expect(leggiPeso('135', 'lb')).toBe(135 * KG_PER_LB);
    expect(leggiPeso('135', 'lb')).not.toBe(61.25);
  });

  it('cambiare unità non altera il dato: si riconverte lo stesso numero', () => {
    const kg = leggiPeso('62,5', 'kg')!;
    expect(formattaPeso(kg, { unitaPeso: 'lb' })).toBe(`138${NBSP}lb`);
    expect(formattaPeso(kg, { unitaPeso: 'kg' })).toBe(`62,5${NBSP}kg`);
    expect(kg).toBe(62.5);
  });

  it('in visualizzazione arrotonda a 0,25 kg e 0,5 lb, con la virgola decimale', () => {
    expect(formattaPeso(61.2349, { unitaPeso: 'kg' })).toBe(`61,25${NBSP}kg`);
    expect(formattaPeso(aKg(135, 'lb'), { unitaPeso: 'lb' })).toBe(`135${NBSP}lb`);
    expect(formattaPeso(aKg(135.3, 'lb'), { unitaPeso: 'lb' })).toBe(`135,5${NBSP}lb`);
    expect(formattaPeso(1000, { unitaPeso: 'kg' })).toBe(`1000${NBSP}kg`);
    expect(formattaPeso(40, { unitaPeso: 'kg' }, false)).toBe('40');
    expect(formattaPeso(null, { unitaPeso: 'kg' })).toBe('—');
  });

  it('distanze: m e ft, andata e ritorno', () => {
    expect(daMetri(0.3048, 'ft')).toBe(1);
    expect(aMetri(1, 'ft')).toBe(0.3048);
    for (const v of [0, 1, 10, 33.5, 100, 400, 5280]) expect(Number(daMetri(aMetri(v, 'ft'), 'ft').toFixed(6))).toBe(v);
    expect(formattaDistanza(400, { unitaDistanza: 'm' })).toBe(`400${NBSP}m`);
    expect(formattaDistanza(100, { unitaDistanza: 'ft' })).toBe(`328${NBSP}ft`);
    expect(formattaDistanza(null, { unitaDistanza: 'm' })).toBe('—');
  });

  it('legge i numeri digitati con la virgola o il punto', () => {
    expect(leggiDecimale('62,5')).toBe(62.5);
    expect(leggiDecimale(' 62.5 ')).toBe(62.5);
    expect(leggiDecimale(',5')).toBe(0.5);
    expect(leggiDecimale('')).toBeNull();
    expect(leggiDecimale('-3')).toBeNaN();
    expect(leggiDecimale('12kg')).toBeNaN();
    expect(leggiPeso('abc', 'lb')).toBeNaN();
    expect(leggiPeso('', 'lb')).toBeNull();
  });

  it('arrotonda al passo senza rumore dei float', () => {
    expect(arrotondaAlPasso(0.30000000000000004, 0.1)).toBe(0.3);
    expect(arrotondaAlPasso(12.13, 0.25)).toBe(12.25);
    expect(arrotondaAlPasso(12.12, 0.25)).toBe(12);
  });
});
