import { describe, expect, it, vi } from 'vitest';
import { ArchiveRepository, MESSAGES, requestPersistence, type ArchiveEvent } from './repository';
import { ARCHIVE_KEY, emptyArchive, type Archive } from './types';

/** localStorage finto, condiviso tra più "schede del browser"; può simulare la quota piena. */
function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const m = {
    data,
    full: false,
    writes: 0,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (m.full) throw new DOMException('quota', 'QuotaExceededError');
      m.writes++;
      data.set(k, v);
    },
  };
  return m;
}

const setRest = (seconds: number) => (a: Archive) => ({ ...a, settings: { ...a.settings, defaultRest: seconds } });
const addOverride = (n: number) => (a: Archive) => ({ ...a, overrides: { ...a.overrides, [`2026-10-${String(n).padStart(2, '0')}`]: null } });
const stored = (m: ReturnType<typeof memoryStore>) => JSON.parse(m.data.get(ARCHIVE_KEY)!) as Archive;

describe('US-33 salvataggio con revisione', () => {
  it('primo avvio: archivio vuoto, niente scritto finché non si modifica', () => {
    const m = memoryStore();
    const repo = new ArchiveRepository(m);
    expect(repo.isNew).toBe(true);
    expect(repo.archive).toEqual(emptyArchive());
    expect(m.writes).toBe(0);
    expect(repo.update(addOverride(1))).toEqual({ ok: true, state: 'saved' });
    expect(repo.isNew).toBe(false);
    expect(stored(m).revision).toBe(1);
    expect(repo.message).toBe('Salvato su questo dispositivo');
  });

  it('ogni salvataggio incrementa la revisione e si rilegge identico', () => {
    const m = memoryStore();
    const repo = new ArchiveRepository(m);
    repo.update(addOverride(1));
    repo.update(addOverride(2));
    repo.update(addOverride(3));
    expect(repo.archive.revision).toBe(3);
    expect(new ArchiveRepository(m).archive).toEqual(repo.archive);
  });

  it('notifica chi ascolta, con l’origine dell’aggiornamento', () => {
    const repo = new ArchiveRepository(memoryStore());
    const events: ArchiveEvent[] = [];
    const unsubscribe = repo.subscribe((e) => events.push(e));
    repo.update(addOverride(1));
    unsubscribe();
    repo.update(addOverride(2));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ state: 'saved', origin: 'edit' });
  });
});

describe('US-33 quota esaurita', () => {
  it('i dati restano in memoria, lo stato lo dice e "Salva ora" riprova', () => {
    const m = memoryStore();
    const repo = new ArchiveRepository(m);
    repo.update(addOverride(1));
    m.full = true;
    const result = repo.update(addOverride(2));
    expect(result).toEqual({ ok: false, state: 'unsaved', message: MESSAGES.quota });
    expect(repo.pending).toBe(true);
    // la modifica non è persa: è in memoria
    expect(repo.archive.overrides).toHaveProperty('2026-10-02');
    // e nel localStorage resta l'ultima versione buona
    expect(stored(m).overrides).not.toHaveProperty('2026-10-02');
    // altre modifiche si accumulano in memoria
    repo.update(addOverride(3));
    expect(repo.state).toBe('unsaved');
    expect(repo.saveNow().ok).toBe(false);

    m.full = false;
    expect(repo.saveNow()).toEqual({ ok: true, state: 'saved' });
    expect(repo.pending).toBe(false);
    expect(Object.keys(stored(m).overrides)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(stored(m).revision).toBe(2);
  });

  it('localStorage inaccessibile: si lavora in memoria, il salvataggio segnala l’errore', () => {
    const repo = new ArchiveRepository({
      getItem: () => {
        throw new DOMException('negato', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('negato', 'SecurityError');
      },
    });
    expect(repo.state).toBe('saved');
    expect(repo.update(addOverride(1)).state).toBe('unsaved');
    expect(repo.archive.overrides).toHaveProperty('2026-10-01');
  });
});

describe('US-33 archivio illeggibile', () => {
  it.each([
    ['JSON rotto', '{"version":2,'],
    ['formato sconosciuto', '{"version":9}'],
    ['dati non validi', JSON.stringify({ ...emptyArchive(), sessions: [{ id: 'x' }] })],
  ])('%s: nessuna sovrascrittura, contenuto originale scaricabile', (_, raw) => {
    const m = memoryStore({ [ARCHIVE_KEY]: raw });
    const repo = new ArchiveRepository(m);
    expect(repo.state).toBe('unreadable');
    expect(repo.message).toBe(MESSAGES.unreadable);
    expect(repo.originalContent).toBe(raw);
    expect(repo.isNew).toBe(false);
    expect(repo.update(addOverride(1))).toEqual({ ok: false, state: 'unreadable', message: MESSAGES.blocked });
    expect(repo.saveNow().ok).toBe(false);
    expect(m.data.get(ARCHIVE_KEY)).toBe(raw);
    expect(m.writes).toBe(0);
  });

  it('importare un backup valido è la scelta esplicita che sblocca l’archivio', () => {
    const m = memoryStore({ [ARCHIVE_KEY]: 'non è JSON' });
    const repo = new ArchiveRepository(m);
    const backup = { ...emptyArchive(), revision: 40, overrides: { '2026-10-01': null } };
    expect(repo.replace(backup)).toEqual({ ok: true, state: 'saved' });
    expect(repo.originalContent).toBeNull();
    expect(stored(m).overrides).toEqual({ '2026-10-01': null });
    expect(stored(m).revision).toBe(41);
    expect(repo.update(addOverride(2)).ok).toBe(true);
  });
});

describe('US-33 conflitto tra schede del browser', () => {
  it('chi salva su un diario cambiato altrove viene bloccato, senza sovrascrivere', () => {
    const m = memoryStore();
    const tab1 = new ArchiveRepository(m);
    tab1.update(addOverride(1));
    const tab2 = new ArchiveRepository(m);
    tab2.update(addOverride(2)); // revisione 2 nel localStorage
    // la scheda 1 non ha ricevuto l'evento storage (es. era sospesa) e prova a salvare
    const result = tab1.update(addOverride(3));
    expect(result).toEqual({ ok: false, state: 'conflict', message: MESSAGES.conflict });
    expect(Object.keys(stored(m).overrides)).toEqual(['2026-10-01', '2026-10-02']);
    // bloccata finché non ricarica
    expect(tab1.update(addOverride(4)).state).toBe('conflict');
    expect(tab1.replace(emptyArchive()).state).toBe('conflict');
    tab1.reload();
    expect(tab1.state).toBe('saved');
    expect(tab1.archive.revision).toBe(2);
    expect(tab1.update(addOverride(5)).ok).toBe(true);
  });

  it('evento storage senza modifiche in sospeso: adotta il diario più recente', () => {
    const m = memoryStore();
    const tab1 = new ArchiveRepository(m);
    tab1.update(addOverride(1));
    const tab2 = new ArchiveRepository(m);
    tab2.update(addOverride(2));
    const listener = vi.fn();
    tab1.subscribe(listener);
    tab1.onExternalChange(m.data.get(ARCHIVE_KEY)!);
    expect(tab1.state).toBe('saved');
    expect(tab1.archive.overrides).toHaveProperty('2026-10-02');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ origin: 'external', state: 'saved' }));
    // e può continuare a salvare
    expect(tab1.update(addOverride(3)).ok).toBe(true);
    expect(stored(m).revision).toBe(3);
  });

  it('evento storage con modifiche non salvate: conflitto, niente si perde in memoria', () => {
    const m = memoryStore();
    const tab1 = new ArchiveRepository(m);
    tab1.update(addOverride(1));
    m.full = true;
    tab1.update(addOverride(9)); // resta in memoria
    m.full = false;
    const tab2 = new ArchiveRepository(m);
    tab2.update(addOverride(2));
    tab1.onExternalChange(m.data.get(ARCHIVE_KEY)!);
    expect(tab1.state).toBe('conflict');
    expect(tab1.archive.overrides).toHaveProperty('2026-10-09');
    expect(tab1.saveNow().state).toBe('conflict');
    expect(stored(m).overrides).not.toHaveProperty('2026-10-09');
  });

  it('un evento con la stessa revisione (il proprio salvataggio) non cambia nulla', () => {
    const m = memoryStore();
    const repo = new ArchiveRepository(m);
    repo.update(addOverride(1));
    const listener = vi.fn();
    repo.subscribe(listener);
    repo.onExternalChange(m.data.get(ARCHIVE_KEY)!);
    expect(listener).not.toHaveBeenCalled();
  });

  it('se un’altra scheda cancella il diario, chi salva non lo ricrea in silenzio', () => {
    const m = memoryStore();
    const repo = new ArchiveRepository(m);
    repo.update(setRest(75));
    m.data.delete(ARCHIVE_KEY);
    expect(repo.update(addOverride(1)).state).toBe('conflict');
    expect(m.data.has(ARCHIVE_KEY)).toBe(false);
  });

  it('un archivio illeggibile si riprova a leggere quando un’altra scheda lo ripara', () => {
    const m = memoryStore({ [ARCHIVE_KEY]: 'rotto' });
    const repo = new ArchiveRepository(m);
    const valid = JSON.stringify({ ...emptyArchive(), revision: 3 });
    m.data.set(ARCHIVE_KEY, valid);
    repo.onExternalChange(valid);
    expect(repo.state).toBe('saved');
    expect(repo.archive.revision).toBe(3);
  });
});

describe('persistenza dello storage', () => {
  it('chiede persist() solo se non è già persistente; null se non supportato', async () => {
    const persist = vi.fn(async () => true);
    expect(await requestPersistence({ persist, persisted: async () => true })).toBe(true);
    expect(persist).not.toHaveBeenCalled();
    expect(await requestPersistence({ persist, persisted: async () => false })).toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    expect(await requestPersistence(undefined)).toBeNull();
    expect(await requestPersistence({ persist: async () => Promise.reject(new Error('no')), persisted: async () => false })).toBe(false);
  });
});
