import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { anteprimaImport, controllaDimensione, esportaArchivio, leggiBackup, nomeFileBackup, unisciImport } from './backup';
import { assicuraEsercizio } from './catalogo';
import { RepositoryArchivio } from './repository';
import { conSchedeIniziali } from './schede';
import { ErroreArchivio, archivioVuoto, type Archivio, type Sessione } from './tipi';

const testoPoc = readFileSync(new URL('../../../tests/fixtures/backup-poc-sintetico.json', import.meta.url), 'utf8');

function sessione(id: string, data: string, extra: Partial<Sessione> = {}): Sessione {
  return { id, data, schedaId: null, nome: id, inizio: Date.parse(`${data}T10:00:00`), fine: Date.parse(`${data}T11:00:00`), voci: [], ...extra };
}

function locale(): Archivio {
  return {
    ...conSchedeIniziali(archivioVuoto()),
    revisione: 12,
    pianificazione: { lun: 'scheda-a' },
    eccezioni: { '2026-10-01': null },
    sessioni: [sessione('s1', '2026-10-01', { nome: 'locale' }), sessione('s2', '2026-10-03')],
  };
}

describe('US-32 esportazione v2', () => {
  it('produce un JSON reimportabile identico, con la data di esportazione', () => {
    const a = { ...locale(), impostazioni: { ...locale().impostazioni, unitaPeso: 'lb' as const } };
    const testo = esportaArchivio(a, new Date('2026-10-10T08:00:00Z'));
    expect(JSON.parse(testo).esportatoIl).toBe('2026-10-10T08:00:00.000Z');
    const letto = leggiBackup(testo, archivioVuoto());
    expect(letto).toEqual({ formato: 'v2', archivio: a, scartati: [], avvisi: [] });
  });

  it('nome del file con la data locale', () => {
    expect(nomeFileBackup(new Date(2026, 0, 5, 23, 59))).toBe('bodytracker-2026-01-05.json');
  });
});

describe('US-32 lettura di un backup', () => {
  it('riconosce il formato del PoC', () => {
    expect(leggiBackup(testoPoc, archivioVuoto()).formato).toBe('poc');
  });

  it('il formato v2 si valida per intero: un errore rifiuta il file', () => {
    const rotto = JSON.parse(esportaArchivio(locale()));
    rotto.sessioni[1].data = '2026-02-31';
    expect(() => leggiBackup(JSON.stringify(rotto), archivioVuoto())).toThrow(/^Il backup non è valido: Allenamento 2: data non valida\.$/);
  });

  it.each([
    ['JSON non valido', '{', 'Il file non è un backup leggibile (JSON non valido).'],
    ['formato sconosciuto', '{"versione":3}', 'Formato di backup non riconosciuto.'],
    ['vecchio formato bb-*', '[{"date":"2026-10-01","exercises":[]}]', 'Formato di backup non riconosciuto.'],
  ])('rifiuta: %s', (_, testo, messaggio) => {
    expect(() => leggiBackup(testo, archivioVuoto())).toThrow(messaggio);
  });

  it('limite di 10 MB', () => {
    expect(() => controllaDimensione(10 * 1024 * 1024)).not.toThrow();
    expect(() => controllaDimensione(10 * 1024 * 1024 + 1)).toThrow('Il file supera il limite di 10 MB.');
    expect(() => leggiBackup(' '.repeat(10 * 1024 * 1024 + 1), archivioVuoto())).toThrow(ErroreArchivio);
  });
});

describe('US-02 / US-32 anteprima e unione', () => {
  it('anteprima del backup del PoC: allenamenti, periodo, nuovi e scartati', () => {
    const corrente = { ...archivioVuoto(), sessioni: [sessione('poc-1', '2026-09-01')] };
    const anteprima = anteprimaImport(corrente, leggiBackup(testoPoc, corrente));
    expect(anteprima).toMatchObject({
      formato: 'poc',
      sessioni: 4,
      nuove: 3,
      giaPresenti: 1,
      periodo: { da: '2026-09-01', a: '2026-09-08' },
      schedeNuove: 2,
      eserciziNuovi: 2,
    });
    expect(anteprima.scartati).toHaveLength(3);
  });

  it('"mantieni" conserva gli allenamenti del dispositivo, "sostituisci" prende quelli del backup', () => {
    const backup = { ...locale(), sessioni: [sessione('s1', '2026-10-01', { nome: 'dal backup' }), sessione('s9', '2026-09-20')] };
    const dati = leggiBackup(esportaArchivio(backup), archivioVuoto());

    const mantieni = unisciImport(locale(), dati, 'mantieni').archivio;
    expect(mantieni.sessioni.map((s) => [s.id, s.nome])).toEqual([['s9', 's9'], ['s1', 'locale'], ['s2', 's2']]);

    const sostituisci = unisciImport(locale(), dati, 'sostituisci').archivio;
    expect(sostituisci.sessioni.map((s) => [s.id, s.nome])).toEqual([['s9', 's9'], ['s1', 'dal backup'], ['s2', 's2']]);
    // la revisione resta quella locale: la incrementa il repository al salvataggio
    expect(sostituisci.revisione).toBe(12);
  });

  it('pianificazione, eccezioni e impostazioni: "mantieni" completa, "sostituisci" sovrascrive', () => {
    const backup = {
      ...locale(),
      pianificazione: { lun: 'scheda-b', gio: 'scheda-b' },
      eccezioni: { '2026-10-01': 'scheda-a', '2026-10-02': null },
      impostazioni: { ...locale().impostazioni, unitaPeso: 'lb' as const },
    };
    const dati = leggiBackup(esportaArchivio(backup), archivioVuoto());
    const m = unisciImport(locale(), dati, 'mantieni').archivio;
    expect(m.pianificazione).toEqual({ lun: 'scheda-a', gio: 'scheda-b' });
    expect(m.eccezioni).toEqual({ '2026-10-01': null, '2026-10-02': null });
    expect(m.impostazioni.unitaPeso).toBe('kg');
    const s = unisciImport(locale(), dati, 'sostituisci').archivio;
    expect(s.pianificazione).toEqual({ lun: 'scheda-b', gio: 'scheda-b' });
    expect(s.eccezioni['2026-10-01']).toBe('scheda-a');
    expect(s.impostazioni.unitaPeso).toBe('lb');
  });

  it('il PoC non tocca mai le schede dell’utente, anche con "sostituisci"', () => {
    const corrente = locale();
    corrente.schede[0] = { ...corrente.schede[0], nome: 'La mia A' };
    const unito = unisciImport(corrente, leggiBackup(testoPoc, corrente), 'sostituisci').archivio;
    expect(unito.schede.map((s) => s.nome)).toEqual(['La mia A', 'Scheda B']);
    expect(unito.impostazioni).toEqual(corrente.impostazioni);
  });

  it('esercizi personalizzati uniti senza duplicati', () => {
    const corrente = assicuraEsercizio(archivioVuoto(), 'crunch ai cavi').archivio;
    const unito = unisciImport(corrente, leggiBackup(testoPoc, corrente), 'mantieni').archivio;
    expect(Object.keys(unito.catalogo).sort()).toEqual(['pers-crunch-ai-cavi', 'pers-palla-medica']);
    expect(unito.catalogo['pers-crunch-ai-cavi'].nome).toBe('crunch ai cavi');
  });

  it('una sola sessione in corso: resta aperta la più recente, le altre si chiudono', () => {
    const corrente = { ...archivioVuoto(), sessioni: [sessione('aperta', '2026-10-05', { fine: null })] };
    const esito = unisciImport(corrente, leggiBackup(testoPoc, corrente), 'mantieni');
    expect(esito.sessioniChiuse).toBe(1);
    expect(esito.archivio.sessioni.filter((s) => s.fine === null).map((s) => s.id)).toEqual(['aperta']);
    expect(esito.archivio.sessioni.find((s) => s.id === 'poc-5')!.fine).not.toBeNull();
  });

  it('oltre 10.000 allenamenti l’importazione viene annullata', () => {
    const corrente = { ...archivioVuoto(), sessioni: Array.from({ length: 9_999 }, (_, i) => sessione(`l${i}`, '2026-01-01')) };
    expect(() => unisciImport(corrente, leggiBackup(testoPoc, archivioVuoto()), 'mantieni')).toThrow(
      'Il diario risultante supera il limite di 10.000 allenamenti. Importazione annullata.',
    );
  });

  it('dal file al repository: il diario importato si salva e si rilegge', () => {
    const memoria = new Map<string, string>();
    const m = { getItem: (k: string) => memoria.get(k) ?? null, setItem: (k: string, v: string) => void memoria.set(k, v) };
    const repo = new RepositoryArchivio(m);
    const { archivio } = unisciImport(repo.archivio, leggiBackup(testoPoc, repo.archivio), 'mantieni');
    expect(repo.sostituisci(archivio).ok).toBe(true);
    expect(new RepositoryArchivio(m).archivio.sessioni).toHaveLength(4);
  });
});
