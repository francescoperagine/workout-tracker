// Validazione dell'archivio v2. Come nel PoC, l'oggetto viene ricostruito campo per campo:
// le proprietà estranee non entrano nell'archivio, e un errore rende l'intero contenuto non valido.
// I riferimenti (id di scheda o di esercizio) non sono vincolanti: un id sconosciuto non rende
// illeggibile il diario, l'interfaccia lo mostra comunque.
import { dataValida } from './date';
import {
  ErroreArchivio,
  GIORNI_SETTIMANA,
  IMPOSTAZIONI_PREDEFINITE,
  LIMITI,
  TIPI_SERIE,
  type Archivio,
  type EsercizioPersonalizzato,
  type Impostazioni,
  type Pianificazione,
  type Scheda,
  type Serie,
  type Sessione,
  type VoceScheda,
  type VoceSessione,
} from './tipi';

type Oggetto = Record<string, unknown>;

function oggetto(valore: unknown, dove: string): Oggetto {
  if (!valore || typeof valore !== 'object' || Array.isArray(valore)) throw new ErroreArchivio(`${dove}: struttura non valida.`);
  return valore as Oggetto;
}

function lista(valore: unknown, massimo: number, dove: string): unknown[] {
  if (!Array.isArray(valore)) throw new ErroreArchivio(`${dove}: elenco mancante.`);
  if (valore.length > massimo) throw new ErroreArchivio(`${dove}: più di ${massimo} elementi.`);
  return valore;
}

function testo(valore: unknown, massimo: number, dove: string, obbligatorio = false): string {
  if (typeof valore !== 'string' || valore.length > massimo) throw new ErroreArchivio(`${dove}: testo non valido o troppo lungo.`);
  if (obbligatorio && !valore.trim()) throw new ErroreArchivio(`${dove}: testo vuoto.`);
  return valore;
}

function id(valore: unknown, dove: string): string {
  return testo(valore, LIMITI.lunghezzaId, dove, true);
}

function idUnico(valore: unknown, visti: Set<string>, dove: string): string {
  const v = id(valore, dove);
  if (visti.has(v)) throw new ErroreArchivio(`${dove}: identificativo duplicato.`);
  visti.add(v);
  return v;
}

interface OpzioniNumero {
  min?: number;
  max?: number;
  intero?: boolean;
}

function numero(valore: unknown, dove: string, { min = 0, max = LIMITI.valoreMassimo as number, intero = false }: OpzioniNumero = {}): number {
  if (typeof valore !== 'number' || !Number.isFinite(valore) || valore < min || valore > max || (intero && !Number.isInteger(valore))) {
    throw new ErroreArchivio(`${dove}: numero non valido.`);
  }
  return valore;
}

function numeroONull(valore: unknown, dove: string, opzioni?: OpzioniNumero): number | null {
  return valore === null ? null : numero(valore, dove, opzioni);
}

function istante(valore: unknown, dove: string): number {
  return numero(valore, dove, { max: 8.64e15, intero: true });
}

function booleano(valore: unknown, dove: string): boolean {
  if (typeof valore !== 'boolean') throw new ErroreArchivio(`${dove}: valore non valido.`);
  return valore;
}

function idONull(valore: unknown, dove: string): string | null {
  return valore === null ? null : id(valore, dove);
}

function recupero(valore: unknown, dove: string): number {
  return numero(valore, dove, { max: LIMITI.recuperoMassimo, intero: true });
}

function voceScheda(valore: unknown, visti: Set<string>, dove: string): VoceScheda {
  const v = oggetto(valore, dove);
  const caricoMin = numeroONull(v.caricoMin, `${dove}, carico minimo`);
  const caricoMax = numeroONull(v.caricoMax, `${dove}, carico massimo`);
  if (caricoMin !== null && caricoMax !== null && caricoMin > caricoMax) throw new ErroreArchivio(`${dove}: intervallo di carico non valido.`);
  return {
    id: idUnico(v.id, visti, dove),
    esercizioId: id(v.esercizioId, `${dove}, esercizio`),
    alternative: lista(v.alternative, LIMITI.alternativePerVoce, `${dove}, alternative`).map((a) => id(a, `${dove}, alternativa`)),
    gruppo: v.gruppo === null ? null : testo(v.gruppo, LIMITI.lunghezzaTestoBreve, `${dove}, superserie`, true),
    serie: numero(v.serie, `${dove}, serie`, { max: LIMITI.seriePerVoce, intero: true }),
    ripetizioni: testo(v.ripetizioni, LIMITI.lunghezzaTestoBreve, `${dove}, ripetizioni`),
    caricoMin,
    caricoMax,
    notaCarico: testo(v.notaCarico, LIMITI.lunghezzaTestoBreve, `${dove}, nota sul carico`),
    unita: testo(v.unita, LIMITI.lunghezzaTestoBreve, `${dove}, unità`),
    recupero: recupero(v.recupero, `${dove}, recupero`),
    recuperoRiscaldamento: recupero(v.recuperoRiscaldamento, `${dove}, recupero di riscaldamento`),
  };
}

function scheda(valore: unknown, visti: Set<string>, dove: string): Scheda {
  const s = oggetto(valore, dove);
  const voci = new Set<string>();
  return {
    id: idUnico(s.id, visti, dove),
    nome: testo(s.nome, LIMITI.lunghezzaNomeScheda, `${dove}, nome`, true),
    note: testo(s.note, LIMITI.lunghezzaNote, `${dove}, note`),
    archiviata: booleano(s.archiviata, `${dove}, archiviata`),
    voci: lista(s.voci, LIMITI.vociPerScheda, `${dove}, esercizi`).map((v, i) => voceScheda(v, voci, `${dove}, esercizio ${i + 1}`)),
  };
}

function serie(valore: unknown, visti: Set<string>, dove: string): Serie {
  const s = oggetto(valore, dove);
  if (!TIPI_SERIE.includes(s.tipo as never)) throw new ErroreArchivio(`${dove}: tipo di serie non valido.`);
  return {
    id: idUnico(s.id, visti, dove),
    tipo: s.tipo as Serie['tipo'],
    kg: numeroONull(s.kg, `${dove}, peso`),
    ripetizioni: numeroONull(s.ripetizioni, `${dove}, ripetizioni`, { intero: true }),
    completata: s.completata === null ? null : istante(s.completata, `${dove}, spunta`),
  };
}

function voceSessione(valore: unknown, visti: Set<string>, dove: string): VoceSessione {
  const v = oggetto(valore, dove);
  const idSerie = new Set<string>();
  return {
    id: idUnico(v.id, visti, dove),
    esercizioId: id(v.esercizioId, `${dove}, esercizio`),
    varianteDi: idONull(v.varianteDi, `${dove}, esercizio previsto`),
    gruppo: v.gruppo === null ? null : testo(v.gruppo, LIMITI.lunghezzaTestoBreve, `${dove}, superserie`, true),
    recupero: recupero(v.recupero, `${dove}, recupero`),
    recuperoRiscaldamento: recupero(v.recuperoRiscaldamento, `${dove}, recupero di riscaldamento`),
    note: testo(v.note, LIMITI.lunghezzaNote, `${dove}, note`),
    serie: lista(v.serie, LIMITI.seriePerVoce, `${dove}, serie`).map((s, i) => serie(s, idSerie, `${dove}, serie ${i + 1}`)),
  };
}

function sessione(valore: unknown, visti: Set<string>, dove: string): Sessione {
  const s = oggetto(valore, dove);
  if (!dataValida(s.data)) throw new ErroreArchivio(`${dove}: data non valida.`);
  const inizio = istante(s.inizio, `${dove}, inizio`);
  const fine = s.fine === null ? null : istante(s.fine, `${dove}, fine`);
  if (fine !== null && fine < inizio) throw new ErroreArchivio(`${dove}: la fine precede l’inizio.`);
  const voci = new Set<string>();
  return {
    id: idUnico(s.id, visti, dove),
    data: s.data,
    schedaId: idONull(s.schedaId, `${dove}, scheda`),
    nome: testo(s.nome, LIMITI.lunghezzaNomeSessione, `${dove}, nome`),
    inizio,
    fine,
    voci: lista(s.voci, LIMITI.vociPerSessione, `${dove}, esercizi`).map((v, i) => voceSessione(v, voci, `${dove}, esercizio ${i + 1}`)),
  };
}

function catalogo(valore: unknown): Record<string, EsercizioPersonalizzato> {
  const c = oggetto(valore, 'Catalogo');
  const voci = Object.entries(c);
  if (voci.length > LIMITI.eserciziPersonalizzati) throw new ErroreArchivio(`Catalogo: più di ${LIMITI.eserciziPersonalizzati} esercizi.`);
  const risultato: Record<string, EsercizioPersonalizzato> = Object.create(null);
  for (const [chiave, e] of voci) {
    const o = oggetto(e, 'Catalogo, esercizio');
    const idEsercizio = id(o.id, 'Catalogo, esercizio');
    if (idEsercizio !== chiave) throw new ErroreArchivio('Catalogo: identificativo incoerente.');
    risultato[idEsercizio] = { id: idEsercizio, nome: testo(o.nome, LIMITI.lunghezzaNomeEsercizio, 'Catalogo, nome', true) };
  }
  return { ...risultato };
}

function pianificazione(valore: unknown): Pianificazione {
  const p = oggetto(valore, 'Pianificazione');
  const risultato: Pianificazione = {};
  for (const [giorno, schedaId] of Object.entries(p)) {
    if (!GIORNI_SETTIMANA.includes(giorno as never)) throw new ErroreArchivio('Pianificazione: giorno non valido.');
    risultato[giorno as keyof Pianificazione] = idONull(schedaId, 'Pianificazione');
  }
  return risultato;
}

function eccezioni(valore: unknown): Record<string, string | null> {
  const e = oggetto(valore, 'Eccezioni');
  const voci = Object.entries(e);
  if (voci.length > LIMITI.sessioni) throw new ErroreArchivio('Eccezioni: troppi elementi.');
  const risultato: Record<string, string | null> = {};
  for (const [data, schedaId] of voci) {
    if (!dataValida(data)) throw new ErroreArchivio('Eccezioni: data non valida.');
    risultato[data] = idONull(schedaId, 'Eccezioni');
  }
  return risultato;
}

function impostazioni(valore: unknown): Impostazioni {
  const i = oggetto(valore, 'Impostazioni');
  if (i.unitaPeso !== 'kg' && i.unitaPeso !== 'lb') throw new ErroreArchivio('Impostazioni: unità di peso non valida.');
  if (i.unitaDistanza !== 'm' && i.unitaDistanza !== 'ft') throw new ErroreArchivio('Impostazioni: unità di distanza non valida.');
  return {
    ...IMPOSTAZIONI_PREDEFINITE,
    unitaPeso: i.unitaPeso,
    unitaDistanza: i.unitaDistanza,
    recuperoPredefinito: recupero(i.recuperoPredefinito, 'Impostazioni, recupero predefinito'),
    suono: booleano(i.suono, 'Impostazioni, suono'),
    vibrazione: booleano(i.vibrazione, 'Impostazioni, vibrazione'),
  };
}

/** Valida e ricostruisce un archivio v2. Lancia ErroreArchivio con un messaggio in italiano. */
export function validaArchivio(dati: unknown): Archivio {
  const a = oggetto(dati, 'Archivio');
  if (a.versione !== 2) throw new ErroreArchivio('Formato dell’archivio non riconosciuto.');
  const idSchede = new Set<string>();
  const idSessioni = new Set<string>();
  return {
    versione: 2,
    revisione: numero(a.revisione, 'Revisione', { max: Number.MAX_SAFE_INTEGER, intero: true }),
    catalogo: catalogo(a.catalogo),
    schede: lista(a.schede, LIMITI.schede, 'Schede').map((s, i) => scheda(s, idSchede, `Scheda ${i + 1}`)),
    pianificazione: pianificazione(a.pianificazione),
    eccezioni: eccezioni(a.eccezioni),
    sessioni: lista(a.sessioni, LIMITI.sessioni, 'Allenamenti').map((s, i) => sessione(s, idSessioni, `Allenamento ${i + 1}`)),
    impostazioni: impostazioni(a.impostazioni),
  };
}
