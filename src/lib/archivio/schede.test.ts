import { describe, expect, it } from 'vitest';
import { daChiaveData } from './date';
import { avvioRapido, conSchedeIniziali, pianificazioneDel, sessioneInCorso } from './schede';
import { archivioVuoto, type Archivio, type Scheda, type Sessione } from './tipi';

function scheda(id: string, archiviata = false): Scheda {
  return { id, nome: `Scheda ${id.toUpperCase()}`, note: '', archiviata, voci: [] };
}

let n = 0;
function sessione(data: string, schedaId: string | null, conclusa = true): Sessione {
  const inizio = daChiaveData(data).getTime() + n++;
  return { id: `s${n}`, data, schedaId, nome: '', inizio, fine: conclusa ? inizio + 3_600_000 : null, voci: [] };
}

function archivio(parziale: Partial<Archivio>): Archivio {
  return { ...archivioVuoto(), ...parziale };
}

const ids = (righe: { scheda: Scheda }[]) => righe.map((r) => r.scheda.id);
// 2026-10-08 è un giovedì
const GIOVEDI = '2026-10-08';

describe('US-11 avvio rapido dalle ultime schede', () => {
  it('senza storico: le schede attive nel loro ordine, suggerita la prima', () => {
    const a = archivio({ schede: [scheda('a'), scheda('b'), scheda('x', true), scheda('c')] });
    const avvio = avvioRapido(a, GIOVEDI);
    expect(ids(avvio.righe)).toEqual(['a', 'b', 'c']);
    expect(avvio.righe.every((r) => r.ultimaVolta === null && !r.pianificata)).toBe(true);
    expect(avvio.suggerita).toBe('a');
  });

  it('senza schede: nessuna riga e nessun suggerimento', () => {
    expect(avvioRapido(archivioVuoto(), GIOVEDI)).toMatchObject({ righe: [], suggerita: null });
  });

  it('le ultime 4 schede fatte, distinte, dalla più recente', () => {
    const a = archivio({
      schede: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => scheda(id)),
      sessioni: [
        sessione('2026-09-20', 'e'),
        sessione('2026-09-25', 'a'),
        sessione('2026-09-28', 'b'),
        sessione('2026-10-01', 'c'),
        sessione('2026-10-03', 'a'),
        sessione('2026-10-05', 'd'),
        sessione('2026-10-06', null), // allenamento libero: non è una scheda
      ],
    });
    const avvio = avvioRapido(a, GIOVEDI);
    expect(ids(avvio.righe)).toEqual(['d', 'a', 'c', 'b']);
    expect(avvio.righe.map((r) => r.ultimaVolta)).toEqual(['2026-10-05', '2026-10-03', '2026-10-01', '2026-09-28']);
    // senza pianificazione: tra le recenti, quella fatta da più tempo
    expect(avvio.suggerita).toBe('b');
  });

  it('A/B si alternano da sole: dopo A suggerisce B, dopo B suggerisce A', () => {
    const base = { schede: [scheda('a'), scheda('b')] };
    const dopoA = archivio({ ...base, sessioni: [sessione('2026-10-01', 'b'), sessione('2026-10-06', 'a')] });
    expect(avvioRapido(dopoA, GIOVEDI).suggerita).toBe('b');
    const dopoB = archivio({ ...base, sessioni: [...dopoA.sessioni, sessione('2026-10-07', 'b')] });
    expect(avvioRapido(dopoB, GIOVEDI).suggerita).toBe('a');
    // due sessioni nello stesso giorno: conta l'ultima iniziata
    const stessoGiorno = archivio({ ...base, sessioni: [sessione('2026-10-07', 'b'), sessione('2026-10-07', 'a')] });
    expect(avvioRapido(stessoGiorno, GIOVEDI).suggerita).toBe('b');
  });

  it('con meno di 4 schede fatte completa con le altre attive', () => {
    const a = archivio({ schede: [scheda('a'), scheda('b'), scheda('c')], sessioni: [sessione('2026-10-01', 'c')] });
    const avvio = avvioRapido(a, GIOVEDI);
    expect(ids(avvio.righe)).toEqual(['c', 'a', 'b']);
    expect(avvio.suggerita).toBe('c');
  });

  it('la pianificata per oggi è la suggerita e si aggiunge se non è tra le recenti', () => {
    const a = archivio({
      schede: ['a', 'b', 'c', 'd', 'e', 'p'].map((id) => scheda(id)),
      sessioni: ['a', 'b', 'c', 'd', 'e'].map((id, i) => sessione(`2026-10-0${i + 1}`, id)),
      pianificazione: { gio: 'p' },
    });
    const avvio = avvioRapido(a, GIOVEDI);
    expect(ids(avvio.righe)).toEqual(['e', 'd', 'c', 'b', 'p']);
    expect(avvio.righe.at(-1)).toMatchObject({ pianificata: true, ultimaVolta: null });
    expect(avvio.suggerita).toBe('p');
    // se è già tra le recenti non si duplica
    const conB = { ...a, pianificazione: { gio: 'b' } };
    expect(ids(avvioRapido(conB, GIOVEDI).righe)).toEqual(['e', 'd', 'c', 'b']);
    expect(avvioRapido(conB, GIOVEDI).suggerita).toBe('b');
  });

  it('l’eccezione per la data vince sulla pianificazione settimanale; riposo = nessuna pianificata', () => {
    const base = archivio({
      schede: [scheda('a'), scheda('b')],
      sessioni: [sessione('2026-10-05', 'a'), sessione('2026-10-06', 'b')],
      pianificazione: { gio: 'b' },
    });
    expect(avvioRapido({ ...base, eccezioni: { [GIOVEDI]: 'a' } }, GIOVEDI).suggerita).toBe('a');
    const riposo = avvioRapido({ ...base, eccezioni: { [GIOVEDI]: null } }, GIOVEDI);
    expect(riposo.pianificazione).toEqual({ tipo: 'riposo', eccezione: true });
    // giorno di riposo: si può allenarsi comunque, con il suggerimento delle recenti
    expect(riposo.suggerita).toBe('a');
  });

  it('una scheda archiviata non compare e non viene suggerita, anche se pianificata', () => {
    const a = archivio({
      schede: [scheda('a', true), scheda('b')],
      sessioni: [sessione('2026-10-06', 'a'), sessione('2026-10-01', 'b')],
      pianificazione: { gio: 'a' },
    });
    const avvio = avvioRapido(a, GIOVEDI);
    expect(ids(avvio.righe)).toEqual(['b']);
    expect(avvio.suggerita).toBe('b');
    expect(avvio.pianificazione).toEqual({ tipo: 'nessuna' });
  });

  it('una sessione in corso non conta come fatta', () => {
    const a = archivio({ schede: [scheda('a'), scheda('b')], sessioni: [sessione('2026-10-01', 'a'), sessione(GIOVEDI, 'b', false)] });
    expect(avvioRapido(a, GIOVEDI).righe.find((r) => r.scheda.id === 'b')?.ultimaVolta).toBeNull();
    expect(sessioneInCorso(a)?.schedaId).toBe('b');
  });
});

describe('pianificazione e schede iniziali', () => {
  it('pianificazione settimanale per giorno; chiave assente = nulla di pianificato', () => {
    const a = archivio({ schede: [scheda('a')], pianificazione: { lun: 'a', mar: null } });
    expect(pianificazioneDel(a, '2026-10-05')).toMatchObject({ tipo: 'scheda', eccezione: false });
    expect(pianificazioneDel(a, '2026-10-06')).toEqual({ tipo: 'riposo', eccezione: false });
    expect(pianificazioneDel(a, '2026-10-07')).toEqual({ tipo: 'nessuna' });
  });

  it('"Inizia con le schede di esempio" aggiunge A e B solo se mancano', () => {
    const conAB = conSchedeIniziali(archivioVuoto());
    expect(conAB.schede.map((s) => s.id)).toEqual(['scheda-a', 'scheda-b']);
    expect(conSchedeIniziali(conAB)).toBe(conAB);
    // copia: modificarla non tocca i dati del codice
    conAB.schede[0].nome = 'Modificata';
    expect(conSchedeIniziali(archivioVuoto()).schede[0].nome).toBe('Scheda A');
  });
});
