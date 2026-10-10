import { describe, expect, it } from 'vitest';
import { groupFromOrder, restSeconds, routineFromPoc, splitLoad } from './conversion';

describe('conversione dei recuperi del PoC', () => {
  it.each([
    ['2′', 120],
    ['90″', 90],
    ['60″', 60],
    ['60–75″', 60],
    ['45–60″', 45],
    ['1′30″', 90],
    ["1'30\"", 90],
    ['1:30', 90],
    ['1,5′', 90],
    ['2–3′', 120],
    ['75', 75],
    [' 90 ″ ', 90],
  ])('%s → %i s', (text, seconds) => {
    expect(restSeconds(text)).toBe(seconds);
  });

  it('un testo non riconosciuto dà null', () => {
    expect(restSeconds('')).toBeNull();
    expect(restSeconds('a piacere')).toBeNull();
  });
});

describe('conversione dei carichi del PoC', () => {
  it.each([
    ['45–50 kg', 45, 50, ''],
    ['40 kg', 40, 40, ''],
    ['40 kg, da tarare', 40, 40, 'da tarare'],
    ['12–14 kg', 12, 14, ''],
    ['35–39 kg', 35, 39, ''],
    ['12,5 kg', 12.5, 12.5, ''],
    ['10-12 kg', 10, 12, ''],
    ['Da tarare', null, null, 'Da tarare'],
    ['Bilanciere + 5 kg', null, null, 'Bilanciere + 5 kg'],
    ['', null, null, ''],
  ])('%s', (text, min, max, note) => {
    expect(splitLoad(text)).toEqual({ loadMin: min, loadMax: max, loadNote: note });
  });
});

describe('superserie dal numero d’ordine', () => {
  it('2a e 2b sono lo stesso gruppo, 1 non è in superserie', () => {
    expect(groupFromOrder('2a')).toBe('2');
    expect(groupFromOrder('2b')).toBe('2');
    expect(groupFromOrder('1')).toBeNull();
    expect(groupFromOrder('10a')).toBe('10');
  });
});

describe('scheda del PoC → scheda v2', () => {
  it('id stabili, recupero in secondi, carico diviso, alternative per id', () => {
    const routine = routineFromPoc('A', [
      {
        id: 'hip-thrust-bilanciere',
        ordine: '3',
        nome: 'Hip thrust bilanciere',
        ripetizioni: '8–12',
        partenza: '40 kg, da tarare',
        recupero: '90″',
        unita: '',
        alternative: [{ id: 'hip-thrust-machine', nome: 'Hip thrust machine' }],
      },
    ]);
    expect(routine).toEqual({
      id: 'routine-a',
      name: 'Scheda A',
      notes: '',
      archived: false,
      exercises: [
        {
          id: 'a-3',
          exerciseId: 'hip-thrust-bilanciere',
          alternatives: ['hip-thrust-machine'],
          group: null,
          sets: 3,
          reps: '8–12',
          loadMin: 40,
          loadMax: 40,
          loadNote: 'da tarare',
          unit: '',
          rest: 90,
          warmupRest: 60,
        },
      ],
    });
  });
});
