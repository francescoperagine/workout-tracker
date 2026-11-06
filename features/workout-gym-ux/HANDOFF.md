---
mode: implement
feature: workout-gym-ux
inc_base: 7db9ebc   # HEAD di main al 6 novembre 2026 dopo INC-012; ultimo incremento in CHANGELOG: INC-012
spec: features/workout-gym-ux/SPEC.md
resume_from: incremento 3 (segnaposto)
---

> **MODE: implement** — esegui l'ambito di `SPEC.md` dall'incremento 3, senza riprogettare né allargare.
> Scrivere fuori dall'ambito è un difetto anche quando migliora qualcosa.

# Handoff di ripresa — workout-gym-ux

Incrementi 1 e 2 fatti e committati, non pushati: `824507a` INC-011 (correzioni) e `7db9ebc` INC-012 (card a
fisarmonica, ✓✓ che passa al successivo, riordino solo trascinando). Restano gli incrementi 3, 4 e 5 della
SPEC §5. Note di esecuzione e verifiche già fatte in SPEC §9: leggile, non rifarle.

## Prima di scrivere codice (controlla, poi fermati se qualcosa non torna)

1. `git rev-parse --short HEAD` e `git log --oneline -3`: il punto di partenza è `inc_base` o un suo
   discendente. Se dopo `inc_base` ci sono commit che toccano `src/lib/archive/`, `src/components/workout/`,
   `src/components/ui/`, `src/lib/rest-*.ts` o `src/styles/global.css`, **fermati e riferisci**. Le sole
   modifiche non committate attese sono `features/workout-gym-ux/SPEC.md` e questo file (decisioni del 6
   novembre, da includere nel commit dell'incremento 3); `screenshots/` e `workout-tracker-2026-11-05.json`
   sono non tracciati e **non vanno committati**.
2. `grep -m1 '^## INC-' CHANGELOG.md` deve dare INC-012: il prossimo è INC-013, mai assegnato a mano.
3. I nomi citati in SPEC §3.1 e §9 esistono alle righe indicate (±10): `previousSets`, `defaultSets` (~89),
   `prefillSets` (~107), `suggestedSets` (~122), `completedSet` (~135), `plannedEntry` (~143),
   `completeExercise` (~237), `addSessionExercise` (~312), `switchExercise` (~380) in
   `src/lib/archive/workout.ts`; `startSession` in `sessions.ts:48`; `nextSetText` in `src/lib/rest-timer.ts`;
   `playEndSound` in `src/lib/rest-alert.ts`; `TabBar.astro`. A ogni discrepanza, o se la realtà contraddice la
   SPEC, **fermati e riferisci. Mai riparare un handoff o la SPEC da soli.**

## Ambiente (insidie già incontrate)

- `node`/`npm` non sono nel PATH della shell: anteponi `export PATH=/usr/local/bin:$PATH`.
- Il dev server su `localhost:4321` non è tuo: non ucciderlo. Tra un giro di e2e e l'altro chiudi l'anteprima
  con `pkill -f "[a]stro preview --port 4322"` in un comando a sé.
- `adb`: `~/Library/Android/sdk/platform-tools/adb`. Il 6 novembre il telefono era collegato ma bloccato
  (CDP vuoto): se è ancora così, viste con Playwright a 390×844 e 320×568, chiaro e scuro, e scrivilo tra i limiti.

## Letture (livello Feature)

`AGENTS.md` → `docs/ARCHITECTURE.md` → `docs/PROJECT.md` → `features/workout-gym-ux/SPEC.md` (§3.1, §3.8–§3.10,
§5–§9). Per la UI: `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/` e
`.claude/skills/impeccable/reference/craft-floor.md`. `CHANGELOG.md`, `docs/adr/`, `docs/archive/`: cerca la
voce che serve, mai per intero (ultimo ADR: ADR-007). Non toccare `docs/todo.md`.

## Ordine e consegna

Tre incrementi, **un commit ciascuno**, nell'ordine della SPEC §5:

3. **Segnaposto (INC-013):** SPEC §3.1 tranne il punto 4 (fatto in INC-011), con le decisioni del 6 novembre
   ai punti 5 e 9: ✓✓ completa con i valori scritti o, dove vuoti, con il segnaposto; «Aggiungi serie» resta
   com'è; il target della scheda segue la regola di `nextSetText` (niente kg di scheda su una variante, nessun
   target sul riscaldamento). US-36 riscritta in `docs/archive/restyling/USER-STORIES.md` con il suo e2e; ADR
   nuovo (segnaposto contro valori veri, rovescia INC-004) che cita INC-013 e viceversa.
4. **Suono e allenamento dimenticato (INC-014):** SPEC §3.8 e §3.9 (US-41, e2e con orologio controllato).
5. **Tab Progressi e chiusura (INC-015):** SPEC §3.10, poi §8 (SPEC in
   `docs/archive/features/` come `INC-015_workout-gym-ux.md`, cancellata `features/workout-gym-ux/`, aggiornati
   `docs/PROJECT.md` e `docs/ARCHITECTURE.md`).

Regole di consegna:

- Solo `main`, niente branch né pull request; **non pushare** (ogni push va in produzione).
- Controlli mirati dopo ogni modifica, gate completo a fine incremento (SPEC §7): `npm run check`, `npm test`,
  `npm run build`, `npm run test:e2e`, `WT_BASE=/workout-tracker/ npm run test:e2e`, `npm run docs:check`;
  comando e codice d'uscita registrati, mai «è passato».
- Voce di `CHANGELOG.md` con `INC-XXX` nuovo a ogni incremento; una riga di note in SPEC §9 per incremento.
- Se il contesto si fa stretto tra un incremento e l'altro, fermati dopo il commit e riscrivi questo handoff
  (`inc_base` = il tuo ultimo commit, `resume_from` = l'incremento successivo), chiudendo il messaggio con il
  prompt pronto da incollare.
- Raccogli i dubbi in un solo messaggio a Francesco. Nel resoconto finale ricorda anche: il sidecar
  `design.json` di Impeccable non è aggiornato ai token di INC-010/011; con un nome su due righe ⓘ sta a destra
  del nome sull'ultima riga (scelta di INC-012, da guardare sul telefono).
- Chiudi da solo: gate verde → checklist → resoconto breve (screenshot prima/dopo inclusi) → fine.
