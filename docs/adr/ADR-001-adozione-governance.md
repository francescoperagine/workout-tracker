# ADR-001 — Adozione di ai-governance v6 e deviazioni dal template

Status: Accepted
Increment: INC-001

## Context

Il repository adotta `ai-governance-template` v6 dopo il restyling (step 0–9), che aveva la sua struttura:
un `AGENTS.md` di 216 righe che faceva anche da architettura, e la storia in `docs/restyling/` (analisi, piano a
step con le decisioni, user story, brief, handoff). Impeccable richiede `PRODUCT.md` e `DESIGN.md` nella radice.
Il template vuole `AGENTS.md` sotto le 120 righe, `docs/PROJECT.md`, `docs/ROADMAP.md` e la storia nel CHANGELOG.

## Decision

- `AGENTS.md` riscritto sul modello del §8, in italiano, con le nove regole del §7 inline (nessun meccanismo di
  sistema condiviso tra le sessioni locali e cloud). Struttura, rendering, chiavi di storage, pubblicazione e PoC
  passano parola per parola a `docs/ARCHITECTURE.md`; comandi non ovvi e insidie di test e container a un file in
  più, `docs/SVILUPPO.md`.
- Niente `docs/ROADMAP.md`: la direzione è una sezione di `docs/PROJECT.md`.
- Identità, utenti e principi restano in `PRODUCT.md`; `docs/PROJECT.md` li richiama e tiene stato, focus e limiti.
- `docs/restyling/` spostata intera in `docs/archive/restyling/` (scelta di Francesco), compreso l'ultimo
  `HANDOFF.md`. Gli step non diventano INC: il CHANGELOG comincia da INC-001 e rimanda all'archivio.
- `scripts/docs-check.sh` è la copia identica dello script del template; i percorsi controllati si allargano con
  `DOCS_CHECK_DIRS` in `package.json` (anche `tests`, `scripts`, `public`). Nessun hook.

## Consequences

- Il file letto a ogni turno passa da 216 a meno di 120 righe; architettura e insidie si leggono solo quando servono.
- Un aggiornamento del template deve conservare le deviazioni elencate in `AGENTS.md`.
- USER-STORIES, BRIEF e WEB-PUSH, ancora di riferimento, stanno sotto `docs/archive/`: il nome dice «chiuso» anche
  per documenti che si leggono ancora. `AGENTS.md` lo dice in chiaro.

## Alternatives Considered

- **Adozione senza deviazioni** (`docs/ROADMAP.md`, `PRODUCT.md` spostato in `docs/PROJECT.md`): Impeccable non
  troverebbe più `PRODUCT.md`, e una roadmap senza milestone sarebbe uno stub da tenere aggiornato.
- **`docs/restyling/` lasciata dov'era**, esclusa da `docs:check`: nessun commento del codice da toccare, ma una
  cartella chiusa fuori da `docs/archive/` sembra lavoro in corso.
- **`AGENTS.md` in inglese**, come personal-website e Ordiria: scartato per la convenzione del repo, che vuole i
  documenti in italiano.
