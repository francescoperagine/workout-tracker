import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { schedaDaPoc, type VoceSchedaPoc } from '../lib/archivio/conversione';
import { CATALOGO_BASE } from './catalogo';
import { SCHEDE_INIZIALI } from './schede-iniziali';

// Elenco permanente degli ID del catalogo del PoC: lo storico dell'utente li usa.
// Se questo test fallisce, un ID è stato cambiato o rimosso: non va fatto.
const ID_DEL_POC = ['squat-bilanciere', 'leg-press', 'squat-al-smith', 'goblet-squat', 'panca-piana-bilanciere', 'chest-press', 'panca-piana-manubri', 'rematore-manubri-petto-su-panca-inclinata', 'rematore-al-cavo-basso', 'row-machine-con-appoggio', 'hip-thrust-bilanciere', 'hip-thrust-machine', 'glute-bridge-con-manubrio', 'pull-through-al-cavo', 'distensioni-manubri-seduto-schienale-alto', 'shoulder-press-machine', 'curl-manubri-su-panca-inclinata', 'curl-al-cavo-basso', 'curl-ez', 'alzate-laterali', 'alzate-al-cavo', 'macchina-laterali', 'standing-calf', 'calf-alla-leg-press', 'calf-monopodalico-con-manubrio', 'stacco-rumeno-bilanciere', 'stacco-rumeno-manubri', 'hyperextension-45-con-disco', 'distensioni-manubri-panca-inclinata', 'incline-chest-press', 'panca-inclinata-al-smith', 'lat-machine-presa-prona', 'trazioni-assistite-o-negative', 'lat-monobraccio-al-cavo', 'leg-press-piedi-a-meta-pedana', 'hack-squat', 'leg-extension', 'rematore-seduto-al-cavo-basso', 'rematore-manubrio-monobraccio-con-appoggio', 'row-machine', 'french-press-ez', 'pushdown-ai-cavi', 'french-press-con-manubrio'];

describe('catalogo di base', () => {
  it('contiene tutti gli ID del PoC, invariati', () => {
    for (const id of ID_DEL_POC) {
      expect(CATALOGO_BASE[id], id).toBeDefined();
      expect(CATALOGO_BASE[id].id).toBe(id);
    }
  });

  it('ogni chiave coincide con l’id e gli approfondimenti non sono inventati (vuoti)', () => {
    for (const [chiave, e] of Object.entries(CATALOGO_BASE)) {
      expect(e.id).toBe(chiave);
      expect(e.nome.trim()).not.toBe('');
      expect(e.descrizione).toBe('');
      expect(e.passaggi).toEqual([]);
      expect(e.fonti).toEqual([]);
    }
  });

  it('le schede iniziali usano solo esercizi del catalogo', () => {
    for (const scheda of SCHEDE_INIZIALI) {
      for (const voce of scheda.voci) {
        for (const id of [voce.esercizioId, ...voce.alternative]) expect(CATALOGO_BASE[id], id).toBeDefined();
      }
    }
  });
});

// Confronto con il PoC finché esiste BodyTracker/ (step 9: questo blocco va tolto insieme alla cartella;
// l'elenco ID_DEL_POC qui sopra resta).
describe('parità con BodyTracker/palestra/esercizi.js', () => {
  const contesto = { window: {} as { catalogoEsercizi: Record<string, unknown>; schedeIniziali: Record<string, VoceSchedaPoc[]> } };
  runInNewContext(readFileSync(new URL('../../BodyTracker/palestra/esercizi.js', import.meta.url), 'utf8'), contesto);
  const { catalogoEsercizi, schedeIniziali } = contesto.window;

  it('il catalogo convertito è identico a quello del PoC', () => {
    expect(JSON.parse(JSON.stringify(CATALOGO_BASE))).toEqual(JSON.parse(JSON.stringify(catalogoEsercizi)));
    expect(Object.keys(catalogoEsercizi)).toEqual(ID_DEL_POC);
  });

  it('le schede iniziali sono la conversione delle schede A/B del PoC', () => {
    const attese = Object.entries(schedeIniziali).map(([lettera, voci]) => schedaDaPoc(lettera, JSON.parse(JSON.stringify(voci))));
    expect(SCHEDE_INIZIALI).toEqual(attese);
  });

  it('A/B: recuperi, carichi e superserie come nel PoC', () => {
    const [a, b] = SCHEDE_INIZIALI;
    expect(a.voci.map((v) => [v.id, v.recupero, v.gruppo])).toEqual([
      ['a-1', 120, null],
      ['a-2a', 60, '2'],
      ['a-2b', 60, '2'],
      ['a-3', 90, null],
      ['a-4a', 60, '4'],
      ['a-4b', 60, '4'],
      ['a-5a', 45, '5'],
      ['a-5b', 45, '5'],
    ]);
    expect(b.voci.find((v) => v.id === 'b-3')).toMatchObject({ caricoMin: null, caricoMax: null, notaCarico: 'Da tarare' });
    expect(b.voci.find((v) => v.id === 'b-4b')).toMatchObject({ caricoMin: null, notaCarico: 'Bilanciere + 5 kg' });
    expect(a.voci.find((v) => v.id === 'a-2b')).toMatchObject({ caricoMin: 12, caricoMax: 14, unita: 'per manubrio' });
  });
});
