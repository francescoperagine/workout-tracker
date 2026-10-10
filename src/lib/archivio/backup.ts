// Esportazione e importazione dei backup (US-02, US-32).
// - Export: l'archivio v2 in JSON, in kg e metri, indipendente dall'unità mostrata.
// - Import: riconosce il formato v2 (validazione completa: un errore rifiuta il file) e quello del
//   PoC (convertito, con gli eventuali elementi scartati). Limite di 10 MB e 10.000 allenamenti.
// - Unione come nel PoC: gli elementi nuovi si aggiungono; per quelli con lo stesso identificativo
//   l'utente sceglie "mantieni" (questo dispositivo) o "sostituisci" (il backup).
import { chiaveData } from './date';
import { convertiArchivioPoc, type Scarto } from './import-poc';
import { validaArchivio } from './validazione';
import { ErroreArchivio, LIMITI, type Archivio, type GiornoSettimana, type Sessione } from './tipi';

export type FormatoBackup = 'v2' | 'poc';
export type SceltaDuplicati = 'mantieni' | 'sostituisci';

export interface DatiImport {
  formato: FormatoBackup;
  archivio: Archivio;
  scartati: Scarto[];
  avvisi: string[];
}

export function esportaArchivio(archivio: Archivio, ora: Date = new Date()): string {
  return JSON.stringify({ ...archivio, esportatoIl: ora.toISOString() }, null, 2);
}

export function nomeFileBackup(ora: Date = new Date()): string {
  return `bodytracker-${chiaveData(ora)}.json`;
}

/** Da chiamare con `file.size` prima di leggere il file. */
export function controllaDimensione(byte: number): void {
  if (byte > LIMITI.byteImport) throw new ErroreArchivio('Il file supera il limite di 10 MB.');
}

/** Legge il testo di un backup (v2 o PoC). Lancia ErroreArchivio con un messaggio per l'utente. */
export function leggiBackup(testo: string, corrente: Pick<Archivio, 'catalogo'>): DatiImport {
  controllaDimensione(new TextEncoder().encode(testo).length);
  let dati: unknown;
  try {
    dati = JSON.parse(testo);
  } catch {
    throw new ErroreArchivio('Il file non è un backup leggibile (JSON non valido).');
  }
  const versione = dati && typeof dati === 'object' ? (dati as { versione?: unknown }).versione : undefined;
  if (versione === 2) {
    try {
      return { formato: 'v2', archivio: validaArchivio(dati), scartati: [], avvisi: [] };
    } catch (errore) {
      throw new ErroreArchivio(`Il backup non è valido: ${errore instanceof Error ? errore.message : 'struttura non riconosciuta.'}`);
    }
  }
  if (versione === 1) {
    const { archivio, scartati, avvisi } = convertiArchivioPoc(dati, corrente);
    return { formato: 'poc', archivio, scartati, avvisi };
  }
  throw new ErroreArchivio('Formato di backup non riconosciuto.');
}

export interface AnteprimaImport {
  formato: FormatoBackup;
  /** allenamenti nel file */
  sessioni: number;
  nuove: number;
  giaPresenti: number;
  /** prima e ultima data degli allenamenti nel file */
  periodo: { da: string; a: string } | null;
  schedeNuove: number;
  schedeGiaPresenti: number;
  eserciziNuovi: number;
  scartati: Scarto[];
  avvisi: string[];
}

export function anteprimaImport(corrente: Archivio, dati: DatiImport): AnteprimaImport {
  const sessioni = new Set(corrente.sessioni.map((s) => s.id));
  const schede = new Set(corrente.schede.map((s) => s.id));
  const date = dati.archivio.sessioni.map((s) => s.data).sort();
  const nuove = dati.archivio.sessioni.filter((s) => !sessioni.has(s.id)).length;
  const schedeNuove = dati.archivio.schede.filter((s) => !schede.has(s.id)).length;
  return {
    formato: dati.formato,
    sessioni: dati.archivio.sessioni.length,
    nuove,
    giaPresenti: dati.archivio.sessioni.length - nuove,
    periodo: date.length ? { da: date[0], a: date.at(-1)! } : null,
    schedeNuove,
    schedeGiaPresenti: dati.archivio.schede.length - schedeNuove,
    eserciziNuovi: Object.keys(dati.archivio.catalogo).filter((id) => !(id in corrente.catalogo)).length,
    scartati: dati.scartati,
    avvisi: dati.avvisi,
  };
}

function unisciPerId<T extends { id: string }>(locali: T[], importati: T[], sostituisci: boolean): T[] {
  const mappa = new Map(locali.map((e) => [e.id, e]));
  for (const e of importati) if (sostituisci || !mappa.has(e.id)) mappa.set(e.id, e);
  return [...mappa.values()];
}

/** Con "mantieni" le voci locali restano e il backup completa solo quelle assenti. */
function unisciRecord<T>(locali: Record<string, T>, importati: Record<string, T>, sostituisci: boolean): Record<string, T> {
  return sostituisci ? { ...locali, ...importati } : { ...importati, ...locali };
}

function piuRecente(a: Sessione, b: Sessione): number {
  return b.data.localeCompare(a.data) || b.inizio - a.inizio;
}

export interface EsitoUnione {
  archivio: Archivio;
  /** sessioni "in corso" chiuse perché ne resta aperta una sola, la più recente */
  sessioniChiuse: number;
}

/**
 * Unisce il backup all'archivio corrente. Non modifica gli argomenti. La revisione resta quella
 * corrente: la incrementa il repository al salvataggio.
 * - Allenamenti e schede: per id, secondo la scelta. Le schede di un backup del PoC sono le schede
 *   iniziali A/B: si aggiungono solo se mancano, senza mai toccare quelle dell'utente.
 * - Esercizi personalizzati, pianificazione ed eccezioni: per chiave, secondo la scelta.
 * - Impostazioni: quelle del backup v2 solo con "sostituisci"; il PoC non ne ha.
 */
export function unisciImport(corrente: Archivio, dati: DatiImport, scelta: SceltaDuplicati): EsitoUnione {
  const sostituisci = scelta === 'sostituisci';
  const v2 = dati.formato === 'v2';
  const sessioni = unisciPerId(corrente.sessioni, dati.archivio.sessioni, sostituisci);
  if (sessioni.length > LIMITI.sessioni) {
    throw new ErroreArchivio('Il diario risultante supera il limite di 10.000 allenamenti. Importazione annullata.');
  }
  const schede = unisciPerId(corrente.schede, dati.archivio.schede, sostituisci && v2);
  if (schede.length > LIMITI.schede) throw new ErroreArchivio(`Il diario risultante supera il limite di ${LIMITI.schede} schede. Importazione annullata.`);
  const catalogo = unisciRecord(corrente.catalogo, dati.archivio.catalogo, sostituisci);
  if (Object.keys(catalogo).length > LIMITI.eserciziPersonalizzati) {
    throw new ErroreArchivio(`Il diario risultante supera il limite di ${LIMITI.eserciziPersonalizzati} esercizi personalizzati. Importazione annullata.`);
  }

  // Una sola sessione in corso alla volta: resta aperta la più recente, le altre si chiudono
  let sessioniChiuse = 0;
  const aperta = sessioni.filter((s) => s.fine === null).sort(piuRecente)[0];
  const normalizzate = sessioni.map((s) => {
    if (s.fine !== null || s === aperta) return s;
    sessioniChiuse++;
    const spunte = s.voci.flatMap((v) => v.serie.map((x) => x.completata ?? 0));
    return { ...s, fine: Math.max(s.inizio, ...spunte) };
  });

  return {
    archivio: {
      ...corrente,
      catalogo,
      schede,
      pianificazione: unisciRecord(corrente.pianificazione, dati.archivio.pianificazione, sostituisci) as Partial<Record<GiornoSettimana, string | null>>,
      eccezioni: unisciRecord(corrente.eccezioni, dati.archivio.eccezioni, sostituisci),
      sessioni: normalizzate.sort((a, b) => a.data.localeCompare(b.data) || a.inizio - b.inizio),
      impostazioni: v2 && sostituisci ? { ...dati.archivio.impostazioni } : corrente.impostazioni,
    },
    sessioniChiuse,
  };
}
