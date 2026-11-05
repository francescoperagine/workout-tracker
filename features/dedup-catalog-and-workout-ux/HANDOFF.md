---
mode: implement
feature: dedup-catalog-and-workout-ux
inc_base: c28692e   # HEAD di main al 5 novembre 2026; ultimo incremento in CHANGELOG: INC-003
spec: features/dedup-catalog-and-workout-ux/SPEC.md
---

> **MODE: implement** — esegui l'ambito di `SPEC.md`, senza riprogettare né allargare. Scrivere fuori
> dall'ambito è un difetto anche quando migliora qualcosa.

# Handoff — dedup-catalog-and-workout-ux

## Prima di scrivere codice (controlla, poi fermati se qualcosa non torna)

1. `git rev-parse --short HEAD` e `git log --oneline -1`: il punto di partenza deve essere `inc_base` o un suo
   discendente; se `main` ha commit che toccano `src/lib/archive/`, `src/components/workout/`,
   `src/components/routines/` o `src/data/catalog.ts` dopo `inc_base`, **fermati e riferisci**.
2. I percorsi e i nomi citati nella SPEC esistono (`previousExercise`, `addSessionExercise`,
   `switchExercise`, `moveInList`, `ensureExercise`, `src/components/exercises/ExercisePicker.svelte`, header di
   `WorkoutExercise.svelte`, `BASE_CATALOG` con 43 voci). A ogni discrepanza, o se la realtà contraddice la
   SPEC, **fermati e riferisci. Mai riparare un handoff o la SPEC da soli.**
3. Il prossimo incremento si legge con `grep -m1 '^## INC-' CHANGELOG.md` (oggi INC-003, quindi il primo
   sarà INC-004); mai assegnato a mano.
4. `workout-tracker-2026-11-05.json` è nella radice, non tracciato: copialo in `tests/fixtures/`, lascia
   l'originale.
5. `adb` non è nel PATH: `export PATH=$PATH:$HOME/Library/Android/sdk/platform-tools`.

## Letture (livello Feature)

`AGENTS.md` → `docs/ARCHITECTURE.md` → `docs/PROJECT.md` → `features/dedup-catalog-and-workout-ux/SPEC.md`.
Per la UI: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/` e
`.claude/skills/impeccable/reference/craft-floor.md`. `CHANGELOG.md`, `docs/adr/`, `docs/archive/`: cerca la
voce che serve, mai per intero. Non toccare `docs/todo.md` fino alla chiusura (SPEC §8).

## Ordine e consegna

Cinque incrementi, un commit ciascuno, nell'ordine della SPEC §6: 1 catalogo e default · 2 completa
esercizio · 3 trascinamento · 4 selezione della cella · 5 icona. Solo `main`, niente branch né pull request;
**non pushare** (ogni push va in produzione): consegni commit locali e Francesco decide.

- Controlli mirati dopo ogni modifica, gate completo a fine incremento (SPEC §7), comando e codice d'uscita
  registrati, mai «è passato». Il «gate verde» di un worker non è una prova: rilancialo.
- Voce di `CHANGELOG.md` con `INC-XXX` nuovo a ogni incremento; ADR solo se scegli tra alternative vere
  (SPEC §8), altrimenti `ADR: nessuna (meccanico)`.
- **Incremento 5:** fermati al foglio di confronto (`screenshots/icon-compare.png`) e chiedi la scelta A/B a
  Francesco; non applicare nessuna variante prima.
- **Chiusura** (SPEC §8) nell'ultimo incremento: archivio della SPEC, cancella la cartella della feature,
  `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/todo.md` (solo i due interventi concordati).
- Raccogli i dubbi in un solo messaggio a Francesco, mai uno per turno. Chiudi da solo: gate verde → checklist
  → resoconto breve (screenshot prima/dopo inclusi) → fine.

## Delegazione

Hermes: `/Users/thuls/.local/bin/hermes --yolo -z "<prompt autosufficiente>"` dalla radice del repo, solo per
lavoro meccanico con specifica completa (screenshot sul telefono, tabella degli alias dopo il test di
unicità). Leggi il diff di un worker prima di darlo per fatto.
