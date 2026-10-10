import { describe, expect, it } from 'vitest';
import { conSchedeIniziali } from './schede';
import { ErroreArchivio, archivioVuoto, type Archivio } from './tipi';
import { validaArchivio } from './validazione';

function esempio(): Archivio {
  const a = conSchedeIniziali(archivioVuoto());
  return {
    ...a,
    revisione: 7,
    catalogo: { 'pers-crunch-ai-cavi': { id: 'pers-crunch-ai-cavi', nome: 'Crunch ai cavi' } },
    pianificazione: { lun: 'scheda-a', gio: 'scheda-b', dom: null },
    eccezioni: { '2026-10-08': null },
    sessioni: [
      {
        id: 's1',
        data: '2026-10-05',
        schedaId: 'scheda-a',
        nome: 'Scheda A',
        inizio: 1_790_000_000_000,
        fine: 1_790_003_600_000,
        voci: [
          {
            id: 'v1',
            esercizioId: 'leg-press',
            varianteDi: 'squat-bilanciere',
            gruppo: null,
            recupero: 120,
            recuperoRiscaldamento: 60,
            note: 'sedile 4',
            serie: [
              { id: 'r1', tipo: 'riscaldamento', kg: 60, ripetizioni: 10, completata: 1_790_000_100_000 },
              { id: 'r2', tipo: 'normale', kg: 61.23496995, ripetizioni: 8, completata: 1_790_000_300_000 },
              { id: 'r3', tipo: 'normale', kg: null, ripetizioni: null, completata: null },
            ],
          },
        ],
      },
    ],
    impostazioni: { unitaPeso: 'lb', unitaDistanza: 'ft', recuperoPredefinito: 75, suono: false, vibrazione: true },
  };
}

function con(modifica: (a: any) => void): unknown {
  const a = structuredClone(esempio());
  modifica(a);
  return a;
}

describe('US-33 validazione dell’archivio v2', () => {
  it('un archivio valido passa identico, anche dopo JSON', () => {
    const a = esempio();
    expect(validaArchivio(JSON.parse(JSON.stringify(a)))).toEqual(a);
    expect(validaArchivio(archivioVuoto())).toEqual(archivioVuoto());
  });

  it('le proprietà estranee vengono scartate (ricostruzione esplicita, come nel PoC)', () => {
    const v = validaArchivio(con((a) => {
      a.esportatoIl = '2026-10-10T10:00:00Z';
      a.sessioni[0].voci[0].serie[0].html = 'proprietà estranea';
      a.impostazioni.tema = 'scuro';
    }));
    expect(v).not.toHaveProperty('esportatoIl');
    expect(v.sessioni[0].voci[0].serie[0]).not.toHaveProperty('html');
    expect(v.impostazioni).not.toHaveProperty('tema');
  });

  it.each([
    ['versione diversa', (a: any) => (a.versione = 1)],
    ['revisione mancante', (a: any) => delete a.revisione],
    ['data impossibile', (a: any) => (a.sessioni[0].data = '2026-02-30')],
    ['data in altro formato', (a: any) => (a.sessioni[0].data = '05/10/2026')],
    ['id di sessione duplicato', (a: any) => a.sessioni.push(structuredClone(a.sessioni[0]))],
    ['id di serie duplicato', (a: any) => (a.sessioni[0].voci[0].serie[1].id = 'r1')],
    ['peso negativo', (a: any) => (a.sessioni[0].voci[0].serie[0].kg = -5)],
    ['peso oltre 10000', (a: any) => (a.sessioni[0].voci[0].serie[0].kg = 10001)],
    ['peso come testo', (a: any) => (a.sessioni[0].voci[0].serie[0].kg = '60')],
    ['ripetizioni decimali', (a: any) => (a.sessioni[0].voci[0].serie[0].ripetizioni = 8.5)],
    ['tipo di serie sconosciuto', (a: any) => (a.sessioni[0].voci[0].serie[0].tipo = 'super')],
    ['fine prima dell’inizio', (a: any) => (a.sessioni[0].fine = a.sessioni[0].inizio - 1)],
    ['nota oltre 1000 caratteri', (a: any) => (a.sessioni[0].voci[0].note = 'x'.repeat(1001))],
    ['nome sessione oltre 120 caratteri', (a: any) => (a.sessioni[0].nome = 'x'.repeat(121))],
    ['più di 100 serie', (a: any) => (a.sessioni[0].voci[0].serie = Array.from({ length: 101 }, (_, i) => ({ id: `r${i}`, tipo: 'normale', kg: null, ripetizioni: null, completata: null })))],
    ['più di 100 esercizi', (a: any) => (a.sessioni[0].voci = Array.from({ length: 101 }, (_, i) => ({ ...a.sessioni[0].voci[0], id: `v${i}` })))],
    ['recupero oltre un’ora', (a: any) => (a.schede[0].voci[0].recupero = 3601)],
    ['intervallo di carico rovesciato', (a: any) => Object.assign(a.schede[0].voci[0], { caricoMin: 50, caricoMax: 45 })],
    ['scheda senza nome', (a: any) => (a.schede[0].nome = '  ')],
    ['giorno inesistente', (a: any) => (a.pianificazione.lunedi = 'scheda-a')],
    ['eccezione con data non valida', (a: any) => (a.eccezioni['2026-13-01'] = null)],
    ['unità di peso sconosciuta', (a: any) => (a.impostazioni.unitaPeso = 'stone')],
    ['catalogo con chiave incoerente', (a: any) => (a.catalogo['altro-id'] = { id: 'pers-x', nome: 'X' })],
    ['sessioni non in un elenco', (a: any) => (a.sessioni = {})],
  ])('rifiuta: %s', (_, modifica) => {
    expect(() => validaArchivio(con(modifica))).toThrow(ErroreArchivio);
  });

  it('rifiuta valori che non sono un archivio', () => {
    for (const valore of [null, 42, 'testo', [], { versione: 2 }]) expect(() => validaArchivio(valore)).toThrow(ErroreArchivio);
  });

  it('i riferimenti sconosciuti non rendono illeggibile il diario', () => {
    const v = validaArchivio(con((a) => {
      a.sessioni[0].schedaId = 'scheda-eliminata';
      a.sessioni[0].voci[0].esercizioId = 'esercizio-futuro';
      a.pianificazione.mar = 'scheda-eliminata';
    }));
    expect(v.sessioni[0].schedaId).toBe('scheda-eliminata');
  });
});
