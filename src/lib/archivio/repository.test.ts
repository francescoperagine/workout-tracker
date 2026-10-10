import { describe, expect, it, vi } from 'vitest';
import { MESSAGGI, RepositoryArchivio, richiediPersistenza, type EventoArchivio } from './repository';
import { CHIAVE_ARCHIVIO, archivioVuoto, type Archivio } from './tipi';

/** localStorage finto, condiviso tra più "schede del browser"; può simulare la quota piena. */
function memoria(iniziale: Record<string, string> = {}) {
  const dati = new Map(Object.entries(iniziale));
  const m = {
    dati,
    piena: false,
    scritture: 0,
    getItem: (k: string) => dati.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (m.piena) throw new DOMException('quota', 'QuotaExceededError');
      m.scritture++;
      dati.set(k, v);
    },
  };
  return m;
}

const rinomina = (nome: string) => (a: Archivio) => ({ ...a, impostazioni: { ...a.impostazioni, recuperoPredefinito: nome.length } });
const conNota = (n: number) => (a: Archivio) => ({ ...a, eccezioni: { ...a.eccezioni, [`2026-10-${String(n).padStart(2, '0')}`]: null } });
const salvato = (m: ReturnType<typeof memoria>) => JSON.parse(m.dati.get(CHIAVE_ARCHIVIO)!) as Archivio;

describe('US-33 salvataggio con revisione', () => {
  it('primo avvio: archivio vuoto, niente scritto finché non si modifica', () => {
    const m = memoria();
    const repo = new RepositoryArchivio(m);
    expect(repo.nuovo).toBe(true);
    expect(repo.archivio).toEqual(archivioVuoto());
    expect(m.scritture).toBe(0);
    expect(repo.aggiorna(conNota(1))).toEqual({ ok: true, stato: 'salvato' });
    expect(repo.nuovo).toBe(false);
    expect(salvato(m).revisione).toBe(1);
    expect(repo.messaggio).toBe('Salvato su questo dispositivo');
  });

  it('ogni salvataggio incrementa la revisione e si rilegge identico', () => {
    const m = memoria();
    const repo = new RepositoryArchivio(m);
    repo.aggiorna(conNota(1));
    repo.aggiorna(conNota(2));
    repo.aggiorna(conNota(3));
    expect(repo.archivio.revisione).toBe(3);
    expect(new RepositoryArchivio(m).archivio).toEqual(repo.archivio);
  });

  it('notifica chi ascolta, con l’origine dell’aggiornamento', () => {
    const repo = new RepositoryArchivio(memoria());
    const eventi: EventoArchivio[] = [];
    const smetti = repo.ascolta((e) => eventi.push(e));
    repo.aggiorna(conNota(1));
    smetti();
    repo.aggiorna(conNota(2));
    expect(eventi).toHaveLength(1);
    expect(eventi[0]).toMatchObject({ stato: 'salvato', origine: 'modifica' });
  });
});

describe('US-33 quota esaurita', () => {
  it('i dati restano in memoria, lo stato lo dice e "Salva ora" riprova', () => {
    const m = memoria();
    const repo = new RepositoryArchivio(m);
    repo.aggiorna(conNota(1));
    m.piena = true;
    const esito = repo.aggiorna(conNota(2));
    expect(esito).toEqual({ ok: false, stato: 'non-salvato', messaggio: MESSAGGI.quota });
    expect(repo.inSospeso).toBe(true);
    // la modifica non è persa: è in memoria
    expect(repo.archivio.eccezioni).toHaveProperty('2026-10-02');
    // e nel localStorage resta l'ultima versione buona
    expect(salvato(m).eccezioni).not.toHaveProperty('2026-10-02');
    // altre modifiche si accumulano in memoria
    repo.aggiorna(conNota(3));
    expect(repo.stato).toBe('non-salvato');
    expect(repo.salvaOra().ok).toBe(false);

    m.piena = false;
    expect(repo.salvaOra()).toEqual({ ok: true, stato: 'salvato' });
    expect(repo.inSospeso).toBe(false);
    expect(Object.keys(salvato(m).eccezioni)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(salvato(m).revisione).toBe(2);
  });

  it('localStorage inaccessibile: si lavora in memoria, il salvataggio segnala l’errore', () => {
    const repo = new RepositoryArchivio({
      getItem: () => {
        throw new DOMException('negato', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('negato', 'SecurityError');
      },
    });
    expect(repo.stato).toBe('salvato');
    expect(repo.aggiorna(conNota(1)).stato).toBe('non-salvato');
    expect(repo.archivio.eccezioni).toHaveProperty('2026-10-01');
  });
});

describe('US-33 archivio illeggibile', () => {
  it.each([
    ['JSON rotto', '{"versione":2,'],
    ['formato sconosciuto', '{"versione":9}'],
    ['dati non validi', JSON.stringify({ ...archivioVuoto(), sessioni: [{ id: 'x' }] })],
  ])('%s: nessuna sovrascrittura, contenuto originale scaricabile', (_, grezzo) => {
    const m = memoria({ [CHIAVE_ARCHIVIO]: grezzo });
    const repo = new RepositoryArchivio(m);
    expect(repo.stato).toBe('illeggibile');
    expect(repo.messaggio).toBe(MESSAGGI.illeggibile);
    expect(repo.contenutoOriginale).toBe(grezzo);
    expect(repo.nuovo).toBe(false);
    expect(repo.aggiorna(conNota(1))).toEqual({ ok: false, stato: 'illeggibile', messaggio: MESSAGGI.bloccato });
    expect(repo.salvaOra().ok).toBe(false);
    expect(m.dati.get(CHIAVE_ARCHIVIO)).toBe(grezzo);
    expect(m.scritture).toBe(0);
  });

  it('importare un backup valido è la scelta esplicita che sblocca l’archivio', () => {
    const m = memoria({ [CHIAVE_ARCHIVIO]: 'non è JSON' });
    const repo = new RepositoryArchivio(m);
    const backup = { ...archivioVuoto(), revisione: 40, eccezioni: { '2026-10-01': null } };
    expect(repo.sostituisci(backup)).toEqual({ ok: true, stato: 'salvato' });
    expect(repo.contenutoOriginale).toBeNull();
    expect(salvato(m).eccezioni).toEqual({ '2026-10-01': null });
    expect(salvato(m).revisione).toBe(41);
    expect(repo.aggiorna(conNota(2)).ok).toBe(true);
  });
});

describe('US-33 conflitto tra schede del browser', () => {
  it('chi salva su un diario cambiato altrove viene bloccato, senza sovrascrivere', () => {
    const m = memoria();
    const scheda1 = new RepositoryArchivio(m);
    scheda1.aggiorna(conNota(1));
    const scheda2 = new RepositoryArchivio(m);
    scheda2.aggiorna(conNota(2)); // revisione 2 nel localStorage
    // la scheda 1 non ha ricevuto l'evento storage (es. era sospesa) e prova a salvare
    const esito = scheda1.aggiorna(conNota(3));
    expect(esito).toEqual({ ok: false, stato: 'conflitto', messaggio: MESSAGGI.conflitto });
    expect(Object.keys(salvato(m).eccezioni)).toEqual(['2026-10-01', '2026-10-02']);
    // bloccata finché non ricarica
    expect(scheda1.aggiorna(conNota(4)).stato).toBe('conflitto');
    expect(scheda1.sostituisci(archivioVuoto()).stato).toBe('conflitto');
    scheda1.ricarica();
    expect(scheda1.stato).toBe('salvato');
    expect(scheda1.archivio.revisione).toBe(2);
    expect(scheda1.aggiorna(conNota(5)).ok).toBe(true);
  });

  it('evento storage senza modifiche in sospeso: adotta il diario più recente', () => {
    const m = memoria();
    const scheda1 = new RepositoryArchivio(m);
    scheda1.aggiorna(conNota(1));
    const scheda2 = new RepositoryArchivio(m);
    scheda2.aggiorna(conNota(2));
    const ascolta = vi.fn();
    scheda1.ascolta(ascolta);
    scheda1.modificaEsterna(m.dati.get(CHIAVE_ARCHIVIO)!);
    expect(scheda1.stato).toBe('salvato');
    expect(scheda1.archivio.eccezioni).toHaveProperty('2026-10-02');
    expect(ascolta).toHaveBeenCalledWith(expect.objectContaining({ origine: 'esterna', stato: 'salvato' }));
    // e può continuare a salvare
    expect(scheda1.aggiorna(conNota(3)).ok).toBe(true);
    expect(salvato(m).revisione).toBe(3);
  });

  it('evento storage con modifiche non salvate: conflitto, niente si perde in memoria', () => {
    const m = memoria();
    const scheda1 = new RepositoryArchivio(m);
    scheda1.aggiorna(conNota(1));
    m.piena = true;
    scheda1.aggiorna(conNota(9)); // resta in memoria
    m.piena = false;
    const scheda2 = new RepositoryArchivio(m);
    scheda2.aggiorna(conNota(2));
    scheda1.modificaEsterna(m.dati.get(CHIAVE_ARCHIVIO)!);
    expect(scheda1.stato).toBe('conflitto');
    expect(scheda1.archivio.eccezioni).toHaveProperty('2026-10-09');
    expect(scheda1.salvaOra().stato).toBe('conflitto');
    expect(salvato(m).eccezioni).not.toHaveProperty('2026-10-09');
  });

  it('un evento con la stessa revisione (il proprio salvataggio) non cambia nulla', () => {
    const m = memoria();
    const repo = new RepositoryArchivio(m);
    repo.aggiorna(conNota(1));
    const ascolta = vi.fn();
    repo.ascolta(ascolta);
    repo.modificaEsterna(m.dati.get(CHIAVE_ARCHIVIO)!);
    expect(ascolta).not.toHaveBeenCalled();
  });

  it('se un’altra scheda cancella il diario, chi salva non lo ricrea in silenzio', () => {
    const m = memoria();
    const repo = new RepositoryArchivio(m);
    repo.aggiorna(rinomina('abc'));
    m.dati.delete(CHIAVE_ARCHIVIO);
    expect(repo.aggiorna(conNota(1)).stato).toBe('conflitto');
    expect(m.dati.has(CHIAVE_ARCHIVIO)).toBe(false);
  });

  it('un archivio illeggibile si riprova a leggere quando un’altra scheda lo ripara', () => {
    const m = memoria({ [CHIAVE_ARCHIVIO]: 'rotto' });
    const repo = new RepositoryArchivio(m);
    const valido = JSON.stringify({ ...archivioVuoto(), revisione: 3 });
    m.dati.set(CHIAVE_ARCHIVIO, valido);
    repo.modificaEsterna(valido);
    expect(repo.stato).toBe('salvato');
    expect(repo.archivio.revisione).toBe(3);
  });
});

describe('persistenza dello storage', () => {
  it('chiede persist() solo se non è già persistente; null se non supportato', async () => {
    const persist = vi.fn(async () => true);
    expect(await richiediPersistenza({ persist, persisted: async () => true })).toBe(true);
    expect(persist).not.toHaveBeenCalled();
    expect(await richiediPersistenza({ persist, persisted: async () => false })).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    expect(await richiediPersistenza(undefined)).toBeNull();
    expect(await richiediPersistenza({ persist: async () => Promise.reject(new Error('no')), persisted: async () => false })).toBe(false);
  });
});
