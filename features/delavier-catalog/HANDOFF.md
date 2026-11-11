---
mode: implement
feature: delavier-catalog
inc_base: 06e9910   # commit di INC-028; la SPEC e questo file non sono ancora committati
last_inc: INC-032   # ultimo incremento in CHANGELOG
spec: features/delavier-catalog/SPEC.md
resume_from: SPEC §3, incremento 5
---

> **MODE: implement**: si esegue l'ambito dell'incremento indicato in `resume_from`, senza riprogettare né allargare.
> Se la realtà contraddice la SPEC, fermati e riferisci: mai riparare l'handoff da soli.

# Handoff d'esecuzione: delavier-catalog

La SPEC è completa: metodo (§1), decisioni D1–D14 (§2), incrementi con ambito e criteri (§3), tabella dei muscoli
(§4). **Un incremento per sessione**, nell'ordine di §3. Non rimettere in discussione le decisioni senza una fonte nuova.

## Prima di tutto (controlla, poi fermati se qualcosa non torna)

1. `git log --oneline -5`: il punto di partenza è `inc_base` o un suo discendente.
2. `grep -m1 '^## INC-' CHANGELOG.md` deve dare `last_inc`. Il tuo incremento è il successivo.
3. Letture: `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, la SPEC (§2 e l'incremento), poi solo le righe di codice
   citate. Con la UI: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/route-history.md`,
   `.claude/skills/impeccable/reference/craft-floor.md`.
4. Incremento 2: il PDF e le bozze sono in `docs/sources/` (fuori da git). Le figure le legge chi ragiona, sulle
   immagini delle pagine; a Hermes solo testo e impaginazione (§1).

## Lavoro

Esegui l'incremento di `resume_from`. Ordine: 1 modello dei muscoli · 2 catalogo dal Delavier · 3 correzione del
diario · 4 Progressi come catalogo · 5 grafici con l'elenco · 6 sagoma e colori, chiusura.

**Ogni incremento chiude così** (AGENTS.md, «Completamento»): gate con comando e codice d'uscita (`npm run check`,
`npm test`, `npm run build`, `npm run test:e2e`, `WT_BASE=/workout-tracker/ npm run test:e2e`, `npm run docs:check`;
l'incremento 3 solo `docs:check`); con la UI pagine guardate a 390×844 e 320×568; voce in `CHANGELOG.md` con l'INC
letto dalla testa; ADR citati dall'incremento; qui `inc_base`, `last_inc`, `resume_from` aggiornati; resoconto breve
e prompt per la sessione successiva.

## Stato

- **Incremento 1 fatto** (INC-029, ADR-014, 11 novembre 2026): `Muscles` mappa gruppo → quota, costanti in
  `types.ts`, conversione in lettura, gruppi nuovi, editor e sezione Muscoli con «N serie». Il catalogo ha ancora i
  valori di ADR-011 convertiti.
- **Incremento 2 fatto** (INC-030, 11 novembre 2026): 159 voci in `src/data/catalog.ts`; letture delle pagine in
  `docs/sources/delavier-catalog/lettura.md`, trascrizioni di Hermes in `bozze/`, indice in `indice.md`. 22 punti in
  SPEC §5 aspettano Francesco: quando risponde, si cambiano le righe con `proposta §5 (Pn)` e si toglie il rimando.
- **Incremento 3 fatto** (INC-031, 11 novembre 2026): `docs/sources/delavier-catalog/correggi-diario.ts` (`npx jiti
  …`) scrive il diario corretto accanto all'export, con «-corretto» nel nome; Francesco lo reimporta con «Sostituisci».
- **Incremento 4 fatto** (INC-032, 11 novembre 2026): catalogo in Progressi (US-47), tab Progressi/Info (US-48),
  regola del filo in DESIGN.md. Le tab sono nel componente, non un componente base (nessuna voce in /kit).

## Prompt per la sessione successiva

```
Workout-tracker, feature delavier-catalog: esegui l'handoff features/delavier-catalog/HANDOFF.md (mode: implement,
resume_from). Un incremento, gate e documenti come da AGENTS.md, poi aggiorna l'handoff e fermati.
```
