# Changelog

Incrementi, dal più recente. Prima di INC-001: il restyling, step 0–9, in `docs/archive/restyling/PIANO.md`
e nella cronologia git.

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
