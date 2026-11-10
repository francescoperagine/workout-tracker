---
mode: implement
feature: muscle-volume
inc_base: ce2635c   # commit di INC-024 (incremento 4); il commit dopo tocca solo questo file
last_inc: INC-024   # ultimo incremento in CHANGELOG
spec: features/muscle-volume/SPEC.md
resume_from: SPEC §9, incremento 5
---

> **MODE: implement**: si esegue l'ambito dell'incremento indicato in `resume_from`, senza riprogettare né allargare.
> Se la realtà contraddice la SPEC, fermati e riferisci: mai riparare l'handoff da soli.

# Handoff d'esecuzione: muscle-volume

La SPEC è completa: decisioni D1-D21 (§2), modello (§6), interfaccia (§7), incrementi con criteri e test (§9). **Un
incremento per sessione**, nell'ordine di §9. Non rimettere in discussione le decisioni senza una fonte nuova.

## Prima di tutto (controlla, poi fermati se qualcosa non torna)

1. `git log --oneline -5`: il punto di partenza è `inc_base` o un suo discendente. Se dopo `inc_base` ci sono commit
   che toccano `src/lib/archive/`, `src/data/` o `src/components/history/`, rileggi le righe di SPEC §6 e §7 citate
   dall'incremento contro il codice prima di proseguire.
2. `grep -m1 '^## INC-' CHANGELOG.md` deve dare `last_inc`. Il tuo incremento è il successivo.
3. Letture: `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, la SPEC (solo §2 e le sezioni elencate dall'incremento), poi
   solo le righe di codice che la SPEC cita. Con la UI: `PRODUCT.md`, `DESIGN.md`,
   `.impeccable/surfaces/route-history.md`, `.claude/skills/impeccable/reference/craft-floor.md`, la skill `dataviz`
   per il grafico.
4. **SPEC §10.2:** se Francesco ha risposto alle domande A-D, le risposte sono scritte lì (o te le dà nel prompt):
   applicale. Senza risposta vale il predefinito.
5. **Delavier (SPEC §3.2):** dall'incremento 2 in poi, se l'esito è arrivato e non è ancora in
   `features/muscle-volume/research/mappa-43.md`, si applica prima (tabella e `src/data/catalog.ts`).

## Lavoro

Esegui l'incremento di `resume_from`: ambito, criteri e documenti sono in SPEC §9. Riassunto dell'ordine:

1. archivio v3, rematore tolto con reindirizzamento, `variantOf` → `alternativeOf` e testi (D11, D12, D13, D20);
2. mappa del catalogo come campo obbligatorio (D4, D11);
3. modulo del volume, solo logica e test (D2, D15, D16);
4. muscoli nella pagina dell'esercizio e varianti (US-43, US-44);
5. serie per muscolo in Progressi (US-45);
6. linea settimanale di un gruppo (US-46) e chiusura della feature.

**Ogni incremento chiude così** (AGENTS.md, «Completamento»):
- gate completo, con comando e codice d'uscita: `npm run check`, `npm test`, `npm run build`, `npm run test:e2e`,
  `WT_BASE=/workout-tracker/ npm run test:e2e`, `npm run docs:check`; con la UI, pagine guardate a 390×844 e 320×568;
- voce in `CHANGELOG.md` con l'INC letto dalla testa; gli ADR elencati dall'incremento in SPEC §9, con il prossimo
  numero libero in `docs/adr/`, che citano l'incremento e ne sono citati;
- in questo file: `inc_base` = il tuo commit, `last_inc` = il tuo INC, `resume_from` = l'incremento successivo;
- resoconto breve e il prompt per la sessione successiva (qui sotto, con l'incremento aggiornato).

## Stato

- **Incremento 1 fatto** (INC-021, ADR-009, 10 novembre 2026): archivio v3, `EXERCISE_REDIRECTS`, `alternativeOf`,
  `AlternativeSheet`. `CustomExercise` ha già `muscles` e `variantOf`; `rewriteSessions`/`rewriteRoutines` in
  `src/lib/archive/catalog.ts` sono il riscrittore da riusare per la variante (incremento 4).
- **Incremento 2 fatto** (INC-022, ADR-010, ADR-011, 10 novembre 2026): `CatalogExercise.muscles` obbligatorio, le 42
  voci di `src/data/catalog.ts` uguali alla tabella di `mappa-43.md`, righe degli studi bloccate in
  `src/data/seed-data.test.ts`.
- **Incremento 3 fatto** (INC-023, ADR-012, 10 novembre 2026): `src/lib/archive/muscles.ts` con `exerciseMuscles`
  (null = senza muscoli), `weeklyVolume`, `periodVolume`, `MUSCLE_LABELS`; test dei criteri 1-8.
- **Incremento 4 fatto** (INC-024, ADR-013, 10 novembre 2026): sezione «Muscoli» in `ExerciseProgress.svelte`,
  `MuscleEditor.svelte` (anche in `/kit`), `createVariant`/`setCustomMuscles` in `src/lib/archive/catalog.ts`; e2e in
  `tests/e2e/us-43-us-44-muscles.spec.ts`. I link di «Senza muscoli» (incremento 5) vanno a `/exercise?id=`, dove ora
  l'editor c'è. Il prossimo ADR libero è ADR-014 (l'incremento 5 non ne elenca).
- Domande di SPEC §10.2 senza risposta al 10 novembre: valgono i predefiniti. Esito Delavier: non ancora arrivato.

## Insidie già note (dettagli in SPEC §10.1)

- **Ogni push su `main` va in produzione:** lo schema v3 dei personalizzati (`muscles`, `variantOf`) entra tutto
  nell'incremento 1.
- **La chiave di `localStorage` non cambia** (`workout-tracker.archive.v2`, D20).
- **Reindirizzamento su ogni validazione**, idempotente; nel PoC prima di `src/lib/archive/poc-import.ts:116`.
- **«variante» non è sempre l'alternativa:** la prop `variant`, la «variante compatta» del `SegmentedControl` e i campi
  del formato del PoC non si toccano (SPEC §6.6).
- **AGENTS.md è a 120 righe**, il massimo di `npm run docs:check`: l'invariante cambia nella stessa riga.
- **`tests/fixtures/` è di sola lettura:** i fixture restano v2 e servono a provare la migrazione.
- **`docs:check`** segnala ogni percorso tra apici inversi che non esiste: nei documenti, un file non ancora creato si
  scrive senza apici.

## Perimetro e vincoli di Francesco

- Solo i file dell'incremento; `docs/todo.md` è di Francesco: non toccarlo (la voce «backup condivisibile» è un
  lavoro separato).
- Commit con i soli file dell'incremento; **il push lo fa Francesco**.
- Terminologia: **variante** = esercizio personalizzato derivato da un altro; **alternativa** = esercizio scelto al
  posto di quello della scheda.
- Anti BS: ogni affermazione con la fonte; se manca, dillo. Ogni decisione nuova con utenti, competitor, pro e contro.
- Italiano, conclusione per prima, niente lineette lunghe; domande raccolte in un solo messaggio.
- Delega a un worker solo alle condizioni di AGENTS.md, regola 4 (di norma no: la sessione è fresca).

## Prompt per la sessione successiva

```
Repo workout-tracker (/Users/thuls/Repository/workout-tracker, branch main). Leggi AGENTS.md, poi
features/muscle-volume/HANDOFF.md (mode: implement) e le sezioni di features/muscle-volume/SPEC.md che
l'incremento indicato in resume_from richiede. Esegui solo quell'incremento (SPEC §9), chiudilo con il gate
completo, CHANGELOG, ADR e l'aggiornamento di HANDOFF.md, poi fermati con il prompt per l'incremento dopo.
Risposte alle domande di SPEC §10.2: [incolla qui, oppure «valgono i predefiniti»].
Esito Delavier: [incolla qui, oppure «non ancora»].
```
