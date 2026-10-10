import { describe, expect, it } from 'vitest';
import { dividiCarico, gruppoDaOrdine, recuperoInSecondi, schedaDaPoc } from './conversione';

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
  ])('%s → %i s', (testo, secondi) => {
    expect(recuperoInSecondi(testo)).toBe(secondi);
  });

  it('un testo non riconosciuto dà null', () => {
    expect(recuperoInSecondi('')).toBeNull();
    expect(recuperoInSecondi('a piacere')).toBeNull();
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
  ])('%s', (testo, min, max, nota) => {
    expect(dividiCarico(testo)).toEqual({ caricoMin: min, caricoMax: max, notaCarico: nota });
  });
});

describe('superserie dal numero d’ordine', () => {
  it('2a e 2b sono lo stesso gruppo, 1 non è in superserie', () => {
    expect(gruppoDaOrdine('2a')).toBe('2');
    expect(gruppoDaOrdine('2b')).toBe('2');
    expect(gruppoDaOrdine('1')).toBeNull();
    expect(gruppoDaOrdine('10a')).toBe('10');
  });
});

describe('scheda del PoC → scheda v2', () => {
  it('id stabili, recupero in secondi, carico diviso, alternative per id', () => {
    const scheda = schedaDaPoc('A', [
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
    expect(scheda).toEqual({
      id: 'scheda-a',
      nome: 'Scheda A',
      note: '',
      archiviata: false,
      voci: [
        {
          id: 'a-3',
          esercizioId: 'hip-thrust-bilanciere',
          alternative: ['hip-thrust-machine'],
          gruppo: null,
          serie: 3,
          ripetizioni: '8–12',
          caricoMin: 40,
          caricoMax: 40,
          notaCarico: 'da tarare',
          unita: '',
          recupero: 90,
          recuperoRiscaldamento: 60,
        },
      ],
    });
  });
});
