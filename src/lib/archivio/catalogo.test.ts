import { describe, expect, it } from 'vitest';
import {
  assicuraEsercizio,
  cercaPerNome,
  chiaveNome,
  eserciziDisponibili,
  nomeEsercizio,
  suggerisciEsercizi,
  trovaEsercizio,
} from './catalogo';
import { ErroreArchivio, archivioVuoto } from './tipi';

describe('US-14 nome scritto a mano', () => {
  it('il confronto ignora maiuscole, spazi, punteggiatura e accenti', () => {
    expect(chiaveNome('Leg press, piedi a metà pedana')).toBe(chiaveNome('  leg PRESS piedi a meta  pedana '));
    expect(chiaveNome('Hyperextension 45° con disco')).toBe('hyperextension45condisco');
    expect(chiaveNome('Pull-through al cavo')).toBe(chiaveNome('pullthrough al cavo'));
    expect(chiaveNome('?!')).toBe('');
  });

  it('un nome che corrisponde a un esercizio del catalogo usa quello, senza creare nulla', () => {
    const archivio = archivioVuoto();
    const esito = assicuraEsercizio(archivio, 'hack  SQUAT');
    expect(esito.creato).toBe(false);
    expect(esito.esercizio).toEqual({ id: 'hack-squat', nome: 'Hack squat', personalizzato: false });
    expect(esito.archivio).toBe(archivio);
  });

  it('un nome nuovo diventa un esercizio personalizzato, riusato la volta dopo', () => {
    const vuoto = archivioVuoto();
    const primo = assicuraEsercizio(vuoto, '  Crunch   ai cavi ');
    expect(primo.creato).toBe(true);
    expect(primo.esercizio).toEqual({ id: 'pers-crunch-ai-cavi', nome: 'Crunch ai cavi', personalizzato: true });
    expect(primo.archivio.catalogo['pers-crunch-ai-cavi']).toEqual({ id: 'pers-crunch-ai-cavi', nome: 'Crunch ai cavi' });
    // l'archivio di partenza non viene modificato
    expect(vuoto.catalogo).toEqual({});

    const secondo = assicuraEsercizio(primo.archivio, 'crunch AI cavì');
    expect(secondo.creato).toBe(false);
    expect(secondo.esercizio.id).toBe('pers-crunch-ai-cavi');
    expect(secondo.archivio).toBe(primo.archivio);
  });

  it('lo stesso nome crea lo stesso id su dispositivi diversi', () => {
    const a = assicuraEsercizio(archivioVuoto(), 'Pàlla medica').esercizio.id;
    const b = assicuraEsercizio(archivioVuoto(), 'palla MEDICA').esercizio.id;
    expect(a).toBe(b);
    expect(a).toBe('pers-palla-medica');
  });

  it('rifiuta un nome vuoto, senza lettere o troppo lungo', () => {
    expect(() => assicuraEsercizio(archivioVuoto(), '   ')).toThrow(ErroreArchivio);
    expect(() => assicuraEsercizio(archivioVuoto(), '—')).toThrow(ErroreArchivio);
    expect(() => assicuraEsercizio(archivioVuoto(), 'x'.repeat(201))).toThrow(ErroreArchivio);
  });

  it('suggerisce i nomi simili mentre si scrive: prima chi comincia con il testo', () => {
    const archivio = assicuraEsercizio(archivioVuoto(), 'Panca declinata').archivio;
    const nomi = (testo: string) => suggerisciEsercizi(archivio, testo).map((e) => e.nome);
    expect(nomi('panca')).toEqual([
      'Panca piana bilanciere',
      'Panca piana manubri',
      'Panca inclinata al Smith',
      'Panca declinata',
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
      'Distensioni manubri panca inclinata',
    ]);
    expect(nomi('pan inc')).toEqual([
      'Rematore manubri, petto su panca inclinata',
      'Curl manubri su panca inclinata',
      'Distensioni manubri panca inclinata',
      'Panca inclinata al Smith',
    ]);
    expect(nomi('HACK')).toEqual(['Hack squat']);
    expect(nomi('')).toEqual([]);
    expect(suggerisciEsercizi(archivio, 'a', 3)).toHaveLength(3);
  });

  it('elenco, ricerca per id e nome di un id sconosciuto', () => {
    const archivio = assicuraEsercizio(archivioVuoto(), 'Zercher squat').archivio;
    const tutti = eserciziDisponibili(archivio);
    expect(tutti[0].id).toBe('squat-bilanciere');
    expect(tutti.at(-1)).toEqual({ id: 'pers-zercher-squat', nome: 'Zercher squat', personalizzato: true });
    expect(trovaEsercizio(archivio, 'curl-ez')?.nome).toBe('Curl EZ');
    expect(nomeEsercizio(archivio, 'esercizio-futuro')).toBe('esercizio-futuro');
    expect(cercaPerNome(archivio, 'zercher-squat')?.id).toBe('pers-zercher-squat');
    expect(cercaPerNome(archivio, '   ')).toBeNull();
  });
});
