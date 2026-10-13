# Changelog

Incrementi, dal più recente. Prima di INC-001: il restyling, step 0–9, in `docs/archive/restyling/PIANO.md`
e nella cronologia git.

## INC-002

Date: 2026-10-13

Summary:
**Pagine indicizzabili e decisioni dello step 9 chiuse.**
Le pagine non sono più `noindex`: il progetto deve essere trovabile anche dai motori di ricerca. Il canonico
punta al dominio, così la copia su `workers.dev` non risulta un duplicato. Le quattro decisioni aperte dello
step 9 sono chiuse come raccomandato.

Deliverables:
- `src/layouts/Base.astro`: tolto `<meta name="robots" content="noindex, nofollow">`, aggiunto
  `<link rel="canonical">` da `site`; commento di `src/pages/_kit.astro` allineato.
- `tests/e2e/smoke.spec.ts`: ogni pagina non ha il meta `robots` e ha il canonico.
- `docs/PROJECT.md`: decisioni aperte chiuse (variante con il suo numero, nome accessibile del calendario tenuto,
  niente push durante un allenamento tra i limiti, proposte della critique nella direzione); tolto il limite `noindex`.
- `PRODUCT.md`, `docs/ARCHITECTURE.md` aggiornati.

ADR: ADR-002 (Accepted). Gate: (`npm run check` — exit 0; `npm test` — exit 0; `npm run build` — exit 0; `npm run test:e2e` — exit 0; `WT_BASE=/workout-tracker/ npm run test:e2e` — exit 0; `npm run docs:check` — exit 0).

## INC-001

Date: 2026-10-13

Summary:
**Adozione di ai-governance v6 e chiusura del rilascio.**
Il repository adotta `ai-governance-template` v6: `AGENTS.md` torna un file operativo sotto le 120 righe, il
resto va in documenti letti solo quando servono, e c'è un controllo dei percorsi nei documenti. Registra anche
i passi del rilascio fatti da Francesco: backup spostato sul dominio, voce nei Projects di personal-website,
Workers Builds collegato (ogni push su `main` va online).

Deliverables:
- `AGENTS.md` riscritto sul modello del §8 (deviazioni, nove regole, livelli, invarianti, completamento).
- Nuovi `docs/ARCHITECTURE.md` (sezioni spostate da `AGENTS.md`), `docs/SVILUPPO.md` (comandi, note sui test,
  insidie dell'handoff dello step 9), `docs/PROJECT.md` (stato, focus, decisioni aperte, limiti), `docs/todo.md`.
- `docs/restyling/` → `docs/archive/restyling/`; riferimenti aggiornati in `README.md`, `PRODUCT.md` e nei
  commenti di `src/lib/rest-notifier.ts`, `src/lib/archive/types.ts`, `public/sw-push.js`.
- `scripts/docs-check.sh` (copia del template) e `npm run docs:check`; corretti i percorsi d'esempio in
  `README.md`, `DESIGN.md` e `docs/SVILUPPO.md` che il controllo segnalava.
- Pubblicazione aggiornata in `README.md`, `PRODUCT.md`, `docs/ARCHITECTURE.md`: niente più deploy a mano.

ADR: ADR-001 (Accepted). Gate: (`npm run docs:check` — exit 0; nessun codice vivo toccato, solo commenti: niente build né test).
