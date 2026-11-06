---
mode: implement
feature: workout-gym-ux
inc_base: de2f0bb   # HEAD di main al 6 novembre 2026; ultimo incremento in CHANGELOG: INC-010
spec: features/workout-gym-ux/SPEC.md
---

> **MODE: implement** — esegui l'ambito di `SPEC.md`, senza riprogettare né allargare. Scrivere fuori
> dall'ambito è un difetto anche quando migliora qualcosa.

# Handoff — workout-gym-ux

## Prima di scrivere codice (controlla, poi fermati se qualcosa non torna)

1. `git rev-parse --short HEAD` e `git log --oneline -3`: il punto di partenza è `inc_base` o un suo discendente.
   Se dopo `inc_base` ci sono commit che toccano `src/lib/archive/`, `src/components/workout/`,
   `src/components/routines/`, `src/components/calendar/`, `src/components/ui/` o `src/styles/global.css`,
   **fermati e riferisci**. `features/workout-gym-ux/` può essere non tracciata: è normale.
2. I percorsi e i nomi citati nella SPEC §2 esistono alle righe indicate (±10): `previousSets`, `defaultSets`,
   `prefillSets`, `suggestedSets`, `completedSet`, `plannedEntry` in `workout.ts`; `finishSession` in
   `sessions.ts`; `isCompact`, `option()`, `rows` in `Workout.svelte`; `rows` in `RoutineEditor.svelte`;
   `BottomSheet.svelte`; `playEndSound` in `rest-alert.ts`; `TabBar.astro`; `--color-danger` e `.btn-danger` in
   `global.css`. A ogni discrepanza, o se la realtà contraddice la SPEC, **fermati e riferisci. Mai riparare un
   handoff o la SPEC da soli.** I punti segnati **da verificare** nella SPEC si controllano con un comando prima
   di modificare; se la verifica smentisce la SPEC, fermati.
3. Il prossimo incremento si legge con `grep -m1 '^## INC-' CHANGELOG.md` (oggi INC-010, quindi il primo sarà
   INC-011); mai assegnato a mano.
4. `adb` non è nel PATH: `~/Library/Android/sdk/platform-tools/adb`. Se il telefono non è collegato, fai le viste
   con Playwright e scrivilo tra i limiti.

## Letture (livello Feature)

`AGENTS.md` → `docs/ARCHITECTURE.md` → `docs/PROJECT.md` → `features/workout-gym-ux/SPEC.md`. Per la UI:
`PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/` e `.claude/skills/impeccable/reference/craft-floor.md`.
`CHANGELOG.md`, `docs/adr/`, `docs/archive/`: cerca la voce che serve, mai per intero. Non toccare
`docs/todo.md`.

## Ordine e consegna

Cinque incrementi, **un commit ciascuno**, nell'ordine della SPEC §5: 1 correzioni · 2 card e riordino ·
3 segnaposto · 4 suono e allenamento dimenticato · 5 tab Progressi e chiusura. Solo `main`, niente branch né
pull request; **non pushare** (ogni push va in produzione): consegni commit locali e Francesco decide.

- Controlli mirati dopo ogni modifica, gate completo a fine incremento (SPEC §7), comando e codice d'uscita
  registrati, mai «è passato».
- Voce di `CHANGELOG.md` con `INC-XXX` nuovo a ogni incremento; ADR solo per le scelte di SPEC §8, che si
  citano a vicenda con l'incremento; altrimenti `ADR: nessuna (meccanico)`.
- Se il contesto si fa stretto tra un incremento e l'altro, fermati dopo il commit e scrivi un handoff di
  ripresa con lo stesso formato (`mode: implement`, `inc_base` = il tuo ultimo commit), chiudendo il messaggio
  con il prompt pronto da incollare.
- **Chiusura** (SPEC §8) nell'ultimo incremento.
- Raccogli i dubbi in un solo messaggio a Francesco, mai uno per turno. Chiudi da solo: gate verde → checklist →
  resoconto breve (screenshot prima/dopo inclusi) → fine.
