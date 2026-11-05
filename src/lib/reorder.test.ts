import { describe, expect, it } from 'vitest';
import { dropIndex, edgeSpeed, shiftFor, unitStyle, type DragState } from './reorder';

describe('US-38 riordino: funzioni pure', () => {
  const centers = [10, 30, 50, 70];

  describe('dropIndex', () => {
    it('scendendo oltre un centro si guadagna un posto', () => {
      expect(dropIndex(centers, 0, 45)).toBe(1);
      expect(dropIndex(centers, 0, 65)).toBe(2);
    });

    it('risalendo in cima si arriva a 0', () => {
      expect(dropIndex(centers, 2, 5)).toBe(0);
    });

    it('oltre tutti i centri il posto è l’ultimo', () => {
      expect(dropIndex(centers, 1, 1_000)).toBe(centers.length - 1);
    });

    it('prima di tutti i centri il posto è 0', () => {
      expect(dropIndex(centers, 2, 0)).toBe(0);
    });
  });

  describe('shiftFor', () => {
    it('l’unità trascinata non si sposta', () => {
      expect(shiftFor(1, 1, 3, 40)).toBe(0);
      expect(shiftFor(0, 0, 2, 40)).toBe(0);
    });

    it('scendendo le unità in mezzo salgono di una dimensione', () => {
      expect(shiftFor(2, 1, 3, 40)).toBe(-40);
      expect(shiftFor(3, 1, 3, 40)).toBe(-40);
    });

    it('salendo le unità in mezzo scendono di una dimensione', () => {
      expect(shiftFor(2, 3, 1, 40)).toBe(40);
      expect(shiftFor(1, 3, 1, 40)).toBe(40);
    });

    it('chi resta fuori dall’intervallo non si sposta', () => {
      expect(shiftFor(4, 1, 3, 40)).toBe(0);
      expect(shiftFor(0, 1, 3, 40)).toBe(0);
      expect(shiftFor(0, 3, 1, 40)).toBe(0);
      expect(shiftFor(3, 3, 1, 40)).toBe(0);
    });
  });

  describe('edgeSpeed', () => {
    const top = 100;
    const bottom = 600;

    it('nella fascia in alto scorre verso l’alto, più forte vicino al bordo', () => {
      expect(edgeSpeed(top, top, bottom)).toBe(-18);
      expect(edgeSpeed(50, top, bottom)).toBe(-18);
      expect(edgeSpeed(top + 36, top, bottom)).toBe(-9);
      expect(edgeSpeed(top + 64, top, bottom)).toBe(-2);
    });

    it('nella fascia in basso scorre verso il basso, più forte vicino al bordo', () => {
      expect(edgeSpeed(bottom - 44, top, bottom)).toBe(7);
      expect(edgeSpeed(bottom, top, bottom)).toBe(18);
      expect(edgeSpeed(bottom + 200, top, bottom)).toBe(18);
    });

    it('in mezzo e sui bordi delle fasce non scorre', () => {
      expect(edgeSpeed((top + bottom) / 2, top, bottom)).toBe(0);
      expect(edgeSpeed(top + 72, top, bottom)).toBe(0);
      expect(edgeSpeed(bottom - 72, top, bottom)).toBe(0);
    });
  });

  describe('unitStyle', () => {
    const view = { from: 1, target: 3, offset: 25, size: 40 };

    it('senza gesto non c’è traslazione', () => {
      expect(unitStyle(null, 0, null)).toEqual({ transform: undefined, dragged: false });
      expect(unitStyle({ inGroup: false, block: 'b', view: null }, 0, null)).toEqual({ transform: undefined, dragged: false });
    });

    it('a livello di blocchi solo chi non è in un gruppo si muove', () => {
      const drag: DragState = { inGroup: false, block: 'b', view };
      expect(unitStyle(drag, 1, null)).toEqual({ transform: 'translateY(25px)', dragged: true });
      expect(unitStyle(drag, 2, null)).toEqual({ transform: 'translateY(-40px)', dragged: false });
      expect(unitStyle(drag, 0, null)).toEqual({ transform: undefined, dragged: false });
    });

    it('a livello di blocchi le voci di un gruppo restano ferme', () => {
      const drag: DragState = { inGroup: false, block: 'b', view };
      expect(unitStyle(drag, 1, 'b')).toEqual({ transform: undefined, dragged: false });
    });

    it('dentro una superserie si muovono solo le voci di quel blocco', () => {
      const drag: DragState = { inGroup: true, block: 'b1', view: { from: 0, target: 1, offset: 5, size: 30 } };
      expect(unitStyle(drag, 0, 'b1')).toEqual({ transform: 'translateY(5px)', dragged: true });
      expect(unitStyle(drag, 1, 'b1')).toEqual({ transform: 'translateY(-30px)', dragged: false });
      expect(unitStyle(drag, 0, 'altro')).toEqual({ transform: undefined, dragged: false });
      expect(unitStyle(drag, 0, null)).toEqual({ transform: undefined, dragged: false });
    });

    it('a traslazione 0 il transform resta indefinito', () => {
      expect(unitStyle({ inGroup: false, block: 'b', view: { from: 0, target: 0, offset: 0, size: 30 } }, 0, null)).toEqual({
        transform: undefined,
        dragged: true,
      });
    });
  });
});
