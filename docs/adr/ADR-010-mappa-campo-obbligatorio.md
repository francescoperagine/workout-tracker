# ADR-010 — Mappa come campo obbligatorio del catalogo

Status: Accepted
Increment: INC-022

## Context

La feature `muscle-volume` conta le serie per gruppo muscolare: ogni esercizio del catalogo di base deve dire quali
muscoli allena. Il catalogo è un modulo statico, `src/data/catalog.ts` (`BASE_CATALOG`, tipo `CatalogExercise`), e
le 42 voci cambiano solo con un commit. I personalizzati hanno già `muscles` nell'archivio v3 (ADR-009).

## Decision

- `CatalogExercise.muscles: Muscles` (principali e secondari, gruppi di `MUSCLE_GROUPS`) è **obbligatorio**, scritto
  su ogni voce di `BASE_CATALOG` con un commento che dice la fonte (ADR-011).
- Alternative scartate:
  - campo facoltativo: una voce nuova senza muscoli passerebbe in silenzio e sparirebbe dal conteggio;
  - una tabella a parte `id → muscoli`: due posti da tenere allineati, e il compilatore non vede una voce mancante;
  - importare i muscoli da wger: errori gravi e un solo gruppo per le spalle (ADR-011).

## Consequences

- `npm run check` fallisce se una voce del catalogo non ha `muscles` (`ts(2741)`, provato in INC-022).
- `src/data/seed-data.test.ts` controlla che ogni voce abbia almeno un principale e nessun gruppo in entrambe le
  liste; la validazione dei personalizzati (ADR-009) applica la stessa regola all'archivio.
- La mappa non sta nell'archivio: correggerla è un commit, e vale subito per tutto lo storico. Una variante creata
  dall'utente (incremento 4) non riceve le correzioni successive.
