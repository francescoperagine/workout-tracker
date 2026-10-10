// Catalogo: esercizi di base (dal codice) più quelli personalizzati dell'utente (nell'archivio).
// US-14: un nome scritto a mano si confronta senza maiuscole, spazi, punteggiatura e accenti;
// se non corrisponde a nessun esercizio diventa un esercizio personalizzato, riusato le volte dopo.
import { CATALOGO_BASE } from '../../data/catalogo';
import { ErroreArchivio, LIMITI, type Archivio, type EsercizioPersonalizzato } from './tipi';

export const PREFISSO_PERSONALIZZATO = 'pers-';

/** Parole del nome, senza accenti e in minuscolo: "Panca  piana, Manubri" → ["panca", "piana", "manubri"] */
function parole(nome: string): string[] {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('it')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/** Chiave di confronto: "Hyperextension 45° con disco" e "hyperextension45condisco" coincidono. */
export function chiaveNome(nome: string): string {
  return parole(nome).join('');
}

export interface VoceCatalogo {
  id: string;
  nome: string;
  personalizzato: boolean;
}

/** Tutti gli esercizi, prima quelli di base nell'ordine del catalogo, poi i personalizzati per nome. */
export function eserciziDisponibili(archivio: Pick<Archivio, 'catalogo'>): VoceCatalogo[] {
  const base = Object.values(CATALOGO_BASE).map((e) => ({ id: e.id, nome: e.nome, personalizzato: false }));
  const personali = Object.values(archivio.catalogo)
    .filter((e) => !(e.id in CATALOGO_BASE))
    .map((e) => ({ id: e.id, nome: e.nome, personalizzato: true }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  return [...base, ...personali];
}

export function trovaEsercizio(archivio: Pick<Archivio, 'catalogo'>, id: string): VoceCatalogo | null {
  const base = CATALOGO_BASE[id];
  if (base) return { id, nome: base.nome, personalizzato: false };
  const personale = archivio.catalogo[id];
  return personale ? { id, nome: personale.nome, personalizzato: true } : null;
}

/** Nome da mostrare; un id sconosciuto (es. un backup di una versione futura) resta leggibile. */
export function nomeEsercizio(archivio: Pick<Archivio, 'catalogo'>, id: string): string {
  return trovaEsercizio(archivio, id)?.nome ?? id;
}

/** Corrispondenza esatta sulla chiave; vince l'esercizio di base. */
export function cercaPerNome(archivio: Pick<Archivio, 'catalogo'>, nome: string): VoceCatalogo | null {
  const chiave = chiaveNome(nome);
  if (!chiave) return null;
  return eserciziDisponibili(archivio).find((e) => chiaveNome(e.nome) === chiave) ?? null;
}

/**
 * Nomi simili mentre si scrive: prima quelli che cominciano con il testo, poi quelli che contengono
 * tutte le parole scritte (in qualsiasi ordine, anche come inizio di parola: "pan inc" trova
 * "Distensioni manubri panca inclinata").
 */
export function suggerisciEsercizi(archivio: Pick<Archivio, 'catalogo'>, testo: string, limite = 8): VoceCatalogo[] {
  const cercate = parole(testo);
  if (!cercate.length) return [];
  const chiave = cercate.join('');
  const punteggi: { voce: VoceCatalogo; punti: number }[] = [];
  for (const voce of eserciziDisponibili(archivio)) {
    const nome = parole(voce.nome);
    const chiaveVoce = nome.join('');
    let punti = 0;
    if (chiaveVoce === chiave) punti = 3;
    else if (chiaveVoce.startsWith(chiave)) punti = 2;
    else if (cercate.every((c) => nome.some((p) => p.startsWith(c)))) punti = 1;
    if (punti) punteggi.push({ voce, punti });
  }
  // sort è stabile: a pari punteggio resta l'ordine del catalogo
  return punteggi.sort((a, b) => b.punti - a.punti).slice(0, limite).map((p) => p.voce);
}

/** Id stabile dal nome: due dispositivi che scrivono lo stesso nome creano lo stesso id. */
export function idPersonalizzato(nome: string): string {
  return PREFISSO_PERSONALIZZATO + parole(nome).join('-');
}

export function nomeEsercizioValido(nome: string): boolean {
  const pulito = nome.trim();
  return pulito.length > 0 && pulito.length <= LIMITI.lunghezzaNomeEsercizio && chiaveNome(pulito) !== '';
}

export interface EsitoEsercizio {
  archivio: Archivio;
  esercizio: VoceCatalogo;
  /** true se è stato aggiunto un esercizio personalizzato */
  creato: boolean;
}

/**
 * US-14: restituisce l'esercizio che corrisponde al nome scritto a mano, o lo crea come
 * personalizzato. Non modifica l'archivio ricevuto. Il nome salvato è quello scritto, ripulito
 * dagli spazi in eccesso.
 */
export function assicuraEsercizio(archivio: Archivio, nomeScritto: string): EsitoEsercizio {
  const nome = nomeScritto.trim().replace(/\s+/g, ' ');
  if (!nomeEsercizioValido(nome)) throw new ErroreArchivio('Scrivi il nome dell’esercizio (al massimo 200 caratteri).');
  const esistente = cercaPerNome(archivio, nome);
  if (esistente) return { archivio, esercizio: esistente, creato: false };
  if (Object.keys(archivio.catalogo).length >= LIMITI.eserciziPersonalizzati) {
    throw new ErroreArchivio(`Il limite è ${LIMITI.eserciziPersonalizzati} esercizi personalizzati.`);
  }
  let id = idPersonalizzato(nome).slice(0, LIMITI.lunghezzaId);
  // Solo per sicurezza: con la stessa chiave l'id coinciderebbe, quindi qui un id occupato è un caso limite
  for (let n = 2; id in archivio.catalogo || id in CATALOGO_BASE; n++) id = `${idPersonalizzato(nome).slice(0, LIMITI.lunghezzaId - 6)}-${n}`;
  const nuovo: EsercizioPersonalizzato = { id, nome };
  return {
    archivio: { ...archivio, catalogo: { ...archivio.catalogo, [id]: nuovo } },
    esercizio: { id, nome, personalizzato: true },
    creato: true,
  };
}
