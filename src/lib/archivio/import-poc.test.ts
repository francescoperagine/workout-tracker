import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assicuraEsercizio } from './catalogo';
import { daChiaveData } from './date';
import { convertiArchivioPoc, leggiChiavePoc } from './import-poc';
import { CHIAVE_ARCHIVIO_POC, ErroreArchivio, archivioVuoto } from './tipi';
import { validaArchivio } from './validazione';

// Backup sintetico nel formato di "Esporta" del PoC (finché non c'è un backup reale dell'utente).
const testoBackup = readFileSync(new URL('../../../tests/fixtures/backup-poc-sintetico.json', import.meta.url), 'utf8');
const backup = () => JSON.parse(testoBackup);

describe('US-02 import del backup del PoC', () => {
  const { archivio, scartati, avvisi } = convertiArchivioPoc(backup());
  const sessione = (id: string) => archivio.sessioni.find((s) => s.id === id)!;

  it('il risultato è un archivio v2 valido', () => {
    expect(validaArchivio(JSON.parse(JSON.stringify(archivio)))).toEqual(archivio);
  });

  it('allenamenti validi importati con id, data, nome e scheda; quelli non validi scartati con il motivo', () => {
    expect(archivio.sessioni.map((s) => [s.id, s.data, s.schedaId, s.nome])).toEqual([
      ['poc-1', '2026-09-01', 'scheda-a', 'Scheda A'],
      ['poc-2', '2026-09-03', 'scheda-b', 'Scheda B'],
      ['poc-3', '2026-09-05', null, 'Allenamento libero'],
      ['poc-5', '2026-09-08', 'scheda-a', 'Scheda A'],
    ]);
    expect(scartati).toEqual([
      { elemento: 'Allenamento del 3 settembre 2026, esercizio 3', motivo: 'serie con peso o ripetizioni non validi' },
      { elemento: 'Allenamento 4 del file', motivo: 'data non valida' },
      { elemento: 'Allenamento del 6 settembre 2026', motivo: 'identificativo duplicato nel file' },
    ]);
  });

  it('le schede A/B usate arrivano come schede iniziali, con gli stessi id', () => {
    expect(archivio.schede.map((s) => s.id)).toEqual(['scheda-a', 'scheda-b']);
  });

  it('varianti riconosciute dagli id: esercizio fatto e previsto', () => {
    const [squat, panca] = sessione('poc-1').voci;
    expect(squat).toMatchObject({ esercizioId: 'squat-bilanciere', varianteDi: null, gruppo: null, recupero: 120 });
    // Chest press al posto della panca piana: superserie e recupero dalla voce 2a della scheda A
    expect(panca).toMatchObject({ esercizioId: 'chest-press', varianteDi: 'panca-piana-bilanciere', gruppo: '2', recupero: 60, note: 'macchina 2, sedile 4' });
    expect(sessione('poc-5').voci[0]).toMatchObject({ esercizioId: 'leg-press', varianteDi: 'squat-bilanciere' });
  });

  it('pesi e ripetizioni in numeri (kg), serie vuote conservate come non completate', () => {
    const [squat, panca] = sessione('poc-1').voci;
    const inizio = daChiaveData('2026-09-01').getTime();
    expect(squat.serie).toEqual([
      { id: 'e1-s1', tipo: 'normale', kg: 50, ripetizioni: 8, completata: inizio },
      { id: 'e1-s2', tipo: 'normale', kg: 50, ripetizioni: 7, completata: inizio },
      { id: 'e1-s3', tipo: 'normale', kg: null, ripetizioni: null, completata: null },
    ]);
    expect(panca.serie[0].kg).toBe(42.5);
  });

  it('allenamento concluso: fine registrata; non concluso: resta in corso, serie non spuntate', () => {
    expect(sessione('poc-1').fine).toBe(sessione('poc-1').inizio);
    const inCorso = sessione('poc-5');
    expect(inCorso.fine).toBeNull();
    expect(inCorso.voci[0].serie.map((s) => s.completata)).toEqual([null, null]);
  });

  it('US-14: i nomi liberi diventano esercizi personalizzati, riconosciuti senza maiuscole e spazi', () => {
    expect(archivio.catalogo).toEqual({
      'pers-crunch-ai-cavi': { id: 'pers-crunch-ai-cavi', nome: 'Crunch ai cavi' },
      'pers-palla-medica': { id: 'pers-palla-medica', nome: 'Pàlla medica' },
    });
    expect(sessione('poc-2').voci[1].esercizioId).toBe('pers-crunch-ai-cavi');
    // "crunch  ai CAVI" nell'allenamento libero è lo stesso esercizio
    expect(sessione('poc-3').voci[0].esercizioId).toBe('pers-crunch-ai-cavi');
  });

  it('un nome libero uguale a un esercizio personalizzato già presente lo riusa', () => {
    const corrente = assicuraEsercizio(archivioVuoto(), 'Crunch ai cavi').archivio;
    const conv = convertiArchivioPoc(backup(), corrente);
    expect(conv.archivio.catalogo).not.toHaveProperty('pers-crunch-ai-cavi');
    expect(conv.archivio.sessioni[1].voci[1].esercizioId).toBe('pers-crunch-ai-cavi');
  });

  it('un nome cambiato a mano nel PoC resta nelle note, con un avviso', () => {
    expect(sessione('poc-2').voci[0].note).toBe('per manubrio · Nome registrato: Rematore pesante');
    expect(avvisi).toContain('Allenamento del 3 settembre 2026, esercizio 1: il nome "Rematore pesante" è stato conservato nelle note.');
  });

  it('un id che non è nel catalogo resta lo stesso, come esercizio personalizzato', () => {
    const dati = backup();
    Object.assign(dati.allenamenti[0].esercizi[0], { catalogoId: 'stacco-sumo', varianteId: 'stacco-sumo', variante: 'Stacco sumo', nome: 'Stacco sumo' });
    const conv = convertiArchivioPoc(dati);
    expect(conv.archivio.catalogo['stacco-sumo']).toEqual({ id: 'stacco-sumo', nome: 'Stacco sumo' });
    expect(conv.archivio.sessioni[0].voci[0].esercizioId).toBe('stacco-sumo');
  });

  it('rifiuta un file che non è un backup del PoC o supera 10.000 allenamenti', () => {
    expect(() => convertiArchivioPoc({ versione: 2, allenamenti: [] })).toThrow(ErroreArchivio);
    expect(() => convertiArchivioPoc({ versione: 1 })).toThrow('Formato di backup non riconosciuto.');
    expect(() => convertiArchivioPoc([])).toThrow(ErroreArchivio);
    expect(() => convertiArchivioPoc({ versione: 1, allenamenti: new Array(10_001).fill(null) })).toThrow('10.000');
  });

  it('lettura diretta della chiave del PoC sulla stessa origine', () => {
    expect(leggiChiavePoc({ getItem: (k) => (k === CHIAVE_ARCHIVIO_POC ? testoBackup : null) })).toBe(testoBackup);
    expect(leggiChiavePoc({ getItem: () => null })).toBeNull();
    expect(leggiChiavePoc({ getItem: () => { throw new Error('negato'); } })).toBeNull();
  });
});
