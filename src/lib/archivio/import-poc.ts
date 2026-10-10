// Import del diario del PoC (`bodytracker.archivio.v1`, US-02): da file di backup ("Esporta" del PoC)
// o dalla lettura diretta della sua chiave sulla stessa origine. È una funzione permanente dell'app.
//
// Il file deve avere la struttura del PoC (versione 1, elenco degli allenamenti, al massimo 10.000);
// a differenza del PoC, un allenamento o un esercizio non valido viene scartato con il motivo invece
// di rifiutare l'intero file, così il riepilogo finale può elencarli (US-02).
import { CATALOGO_BASE } from '../../data/catalogo';
import { SCHEDE_INIZIALI } from '../../data/schede-iniziali';
import { assicuraEsercizio, chiaveNome } from './catalogo';
import { daChiaveData, dataValida } from './date';
import {
  CHIAVE_ARCHIVIO_POC,
  ErroreArchivio,
  IMPOSTAZIONI_PREDEFINITE,
  LIMITI,
  archivioVuoto,
  type Archivio,
  type Scheda,
  type Serie,
  type Sessione,
  type VoceSessione,
} from './tipi';

export interface Scarto {
  /** "Allenamento del 12/03/2026" o "Allenamento 3 del file" */
  elemento: string;
  motivo: string;
}

export interface ConversionePoc {
  /** sessioni convertite, catalogo personale creato per i nomi liberi, schede iniziali usate */
  archivio: Archivio;
  scartati: Scarto[];
  avvisi: string[];
}

/** Lettura diretta della chiave del PoC (stessa origine). null se non c'è. */
export function leggiChiavePoc(memoria: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): string | null {
  try {
    return memoria?.getItem(CHIAVE_ARCHIVIO_POC) ?? null;
  } catch {
    return null;
  }
}

type Oggetto = Record<string, unknown>;
const ogg = (v: unknown): v is Oggetto => !!v && typeof v === 'object' && !Array.isArray(v);
const stringa = (v: unknown, limite: number): v is string => typeof v === 'string' && v.length <= limite;
/** Numeri del PoC: stringhe "" o "42.5", al massimo 10000 */
const numeroPoc = (v: unknown, intero = false) =>
  stringa(v, 16) && (v === '' || (/^\d+(\.\d+)?$/.test(v) && Number(v) <= LIMITI.valoreMassimo && (!intero || Number.isInteger(Number(v)))));

const SCHEDE_POC: Record<string, Scheda | undefined> = {
  A: SCHEDE_INIZIALI.find((s) => s.id === 'scheda-a'),
  B: SCHEDE_INIZIALI.find((s) => s.id === 'scheda-b'),
};

function dataLeggibile(data: string): string {
  return daChiaveData(data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Converte il contenuto del PoC (già letto con JSON.parse). `corrente` serve a riconoscere i nomi
 * liberi già presenti tra gli esercizi personalizzati.
 */
export function convertiArchivioPoc(dati: unknown, corrente: Pick<Archivio, 'catalogo'> = archivioVuoto()): ConversionePoc {
  if (!ogg(dati) || dati.versione !== 1 || !Array.isArray(dati.allenamenti)) throw new ErroreArchivio('Formato di backup non riconosciuto.');
  if (dati.allenamenti.length > LIMITI.sessioni) throw new ErroreArchivio('Il backup supera il limite di 10.000 allenamenti.');

  // Il catalogo di lavoro parte da quello corrente, ma nel risultato vanno solo gli esercizi nuovi
  let lavoro: Archivio = { ...archivioVuoto(), catalogo: { ...corrente.catalogo } };
  const scartati: Scarto[] = [];
  const avvisi: string[] = [];
  const sessioni: Sessione[] = [];
  const schedeUsate = new Set<string>();
  const idVisti = new Set<string>();

  dati.allenamenti.forEach((a: unknown, indice: number) => {
    const posizione = `Allenamento ${indice + 1} del file`;
    if (!ogg(a)) return scartati.push({ elemento: posizione, motivo: 'struttura non valida' });
    const elemento = dataValida(a.data) ? `Allenamento del ${dataLeggibile(a.data)}` : posizione;
    if (!stringa(a.id, 100) || !a.id) return scartati.push({ elemento, motivo: 'identificativo mancante' });
    if (idVisti.has(a.id)) return scartati.push({ elemento, motivo: 'identificativo duplicato nel file' });
    if (!dataValida(a.data)) return scartati.push({ elemento, motivo: 'data non valida' });
    if (!stringa(a.nome, LIMITI.lunghezzaNomeSessione)) return scartati.push({ elemento, motivo: 'nome non valido o troppo lungo' });
    if (typeof a.concluso !== 'boolean') return scartati.push({ elemento, motivo: 'stato "concluso" mancante' });
    if (!Array.isArray(a.esercizi)) return scartati.push({ elemento, motivo: 'elenco degli esercizi mancante' });
    if (a.esercizi.length > LIMITI.vociPerSessione) return scartati.push({ elemento, motivo: 'più di 100 esercizi' });
    idVisti.add(a.id);

    const lettera = a.scheda === 'A' || a.scheda === 'B' ? a.scheda : null;
    const schedaPoc = lettera ? SCHEDE_POC[lettera] : undefined;
    if (schedaPoc) schedeUsate.add(schedaPoc.id);
    // Istante stabile: mezzogiorno locale, più la posizione nel file per l'ordine tra sessioni dello stesso giorno
    const inizio = daChiaveData(a.data).getTime() + indice;
    const voci: VoceSessione[] = [];
    const idVoci = new Set<string>();

    a.esercizi.forEach((e: unknown, j: number) => {
      const dove = `${elemento}, esercizio ${j + 1}`;
      if (
        !ogg(e) || !stringa(e.id, 100) || !e.id || !stringa(e.nome, 200) || !e.nome.trim() || !stringa(e.catalogoId, 200) ||
        !stringa(e.varianteId, 200) || !stringa(e.variante, 200) || !stringa(e.note, LIMITI.lunghezzaNote) ||
        typeof e.completato !== 'boolean' || !Array.isArray(e.serie) || e.serie.length < 1 || e.serie.length > LIMITI.seriePerVoce
      ) {
        return scartati.push({ elemento: dove, motivo: 'esercizio non valido' });
      }
      if (idVoci.has(e.id)) return scartati.push({ elemento: dove, motivo: 'identificativo duplicato' });
      if (!e.serie.every((s: unknown) => ogg(s) && numeroPoc(s.peso) && numeroPoc(s.ripetizioni, true))) {
        return scartati.push({ elemento: dove, motivo: 'serie con peso o ripetizioni non validi' });
      }
      idVoci.add(e.id);

      // Esercizio fatto: la variante. Senza id (nome libero) si cerca o si crea per nome, come US-14.
      let esercizioId = e.varianteId || e.catalogoId;
      const nomeFatto = (e.variante || e.nome).trim();
      if (!esercizioId) {
        try {
          const esito = assicuraEsercizio(lavoro, nomeFatto);
          lavoro = esito.archivio;
          esercizioId = esito.esercizio.id;
        } catch (errore) {
          return scartati.push({ elemento: dove, motivo: errore instanceof ErroreArchivio ? errore.message : 'nome non valido' });
        }
      } else if (!(esercizioId in CATALOGO_BASE) && !(esercizioId in lavoro.catalogo)) {
        // Id sconosciuto (catalogo del PoC modificato a mano): si conserva l'id come esercizio personalizzato
        lavoro = { ...lavoro, catalogo: { ...lavoro.catalogo, [esercizioId]: { id: esercizioId, nome: nomeFatto } } };
        avvisi.push(`"${nomeFatto}" non è nel catalogo: aggiunto agli esercizi personalizzati.`);
      }
      const previsto = e.catalogoId && e.catalogoId !== esercizioId ? e.catalogoId : null;
      const voceScheda = schedaPoc?.voci.find((v) => v.esercizioId === (previsto ?? esercizioId));

      // Un nome cambiato a mano nel PoC non ha un campo nel modello v2: resta nelle note
      let note = e.note;
      const nomiNoti = [e.variante, CATALOGO_BASE[e.catalogoId]?.nome, CATALOGO_BASE[esercizioId]?.nome].filter(Boolean).map((n) => chiaveNome(n!));
      if (!nomiNoti.includes(chiaveNome(e.nome))) {
        note = [note, `Nome registrato: ${e.nome.trim()}`].filter(Boolean).join(' · ').slice(0, LIMITI.lunghezzaNote);
        avvisi.push(`${dove}: il nome "${e.nome.trim()}" è stato conservato nelle note.`);
      }

      const fatto = a.concluso || e.completato;
      const serie: Serie[] = e.serie.map((s: { peso: string; ripetizioni: string }, k: number) => {
        const kg = s.peso === '' ? null : Number(s.peso);
        const ripetizioni = s.ripetizioni === '' ? null : Number(s.ripetizioni);
        return { id: `${e.id}-s${k + 1}`, tipo: 'normale', kg, ripetizioni, completata: fatto && (kg !== null || ripetizioni !== null) ? inizio : null };
      });
      voci.push({
        id: e.id,
        esercizioId,
        varianteDi: previsto,
        gruppo: voceScheda?.gruppo ?? null,
        recupero: voceScheda?.recupero ?? IMPOSTAZIONI_PREDEFINITE.recuperoPredefinito,
        recuperoRiscaldamento: voceScheda?.recuperoRiscaldamento ?? IMPOSTAZIONI_PREDEFINITE.recuperoPredefinito,
        note,
        serie,
      });
    });

    sessioni.push({ id: a.id, data: a.data, schedaId: schedaPoc?.id ?? null, nome: a.nome, inizio, fine: a.concluso ? inizio : null, voci });
  });

  const nuoviEsercizi = Object.fromEntries(Object.entries(lavoro.catalogo).filter(([id]) => !(id in corrente.catalogo)));
  return {
    archivio: {
      ...archivioVuoto(),
      catalogo: nuoviEsercizi,
      schede: SCHEDE_INIZIALI.filter((s) => schedeUsate.has(s.id)).map((s) => structuredClone(s) as Scheda),
      sessioni,
    },
    scartati,
    avvisi: [...new Set(avvisi)],
  };
}
