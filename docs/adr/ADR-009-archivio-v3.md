# ADR-009 — Archivio v3: versione nuova, chiave invariata, `alternativeOf`, ID tolti con reindirizzamento

Status: Accepted
Increment: INC-021

## Context

La feature `muscle-volume` aggiunge ai personalizzati `muscles` e `variantOf` (l'esercizio di catalogo da cui
deriva una variante) e libera la parola «variante» per questo senso: il campo della sessione che diceva l'esercizio
previsto quando se ne fa un altro si chiamava `variantOf`, ma è l'alternativa. Il catalogo di base aveva due voci per
lo stesso esercizio, `rematore-al-cavo-basso` e `rematore-seduto-al-cavo-basso` (risposta 3 di Francesco), e la
regola degli ID diceva «mai rimossi».

Fatti nel codice (a `c220ee3`): la validazione ricostruisce ogni oggetto campo per campo e perde i campi che non
conosce; la stessa funzione serve al caricamento e all'import; un archivio che non si valida diventa `unreadable` e
blocca le scritture; una scheda del browser già aperta tiene il codice vecchio fino al ricaricamento. Ogni push su
`main` va in produzione. Dettaglio in `docs/archive/features/` (SPEC di muscle-volume, §6.2) a chiusura della feature.

## Decision

- **`version: 3`.** Restando a 2, una scheda con il codice vecchio rileggerebbe l'archivio («Ricarica» dopo un
  conflitto), toglierebbe in silenzio muscoli e `variantOf` e al salvataggio successivo li cancellerebbe. Con la 3
  il codice vecchio vede «Formato non riconosciuto» e non scrive. `validateArchive` legge 2 e 3 e restituisce
  sempre 3; il backup accetta entrambe (formato `app`, non più `v2`) ed esporta la 3. Lo schema dei personalizzati
  entra tutto in INC-021, anche se l'interfaccia arriva dopo: un campo aggiunto più tardi senza una versione nuova
  riaprirebbe lo stesso problema.
- **Chiave invariata, `workout-tracker.archive.v2`.** Con una chiave nuova una scheda vecchia continuerebbe a
  leggere e scrivere la v2: due diari che divergono, e il codice nuovo dovrebbe scegliere quale vince. Contro
  accettato: il nome della chiave non dice la versione (lo dice un commento in `src/lib/archive/types.ts`).
- **`SessionExercise.variantOf` → `alternativeOf`**, con i nomi collegati (`AlternativeSheet`, `AlternativeChoice`,
  identificatori di `Workout.svelte`) e i testi. In v2 si legge `variantOf`.
- **ID tolti con reindirizzamento.** `EXERCISE_REDIRECTS` in `src/data/catalog.ts` (`rematore-al-cavo-basso` →
  `rematore-seduto-al-cavo-basso`); il rematore seduto prende gli alias «Pulley basso», «Low cable row» e il vecchio
  nome. La regola diventa «mai cambiati né rimossi **senza un reindirizzamento**»; una voce di `EXERCISE_REDIRECTS`
  non si toglie mai. Il reindirizzamento si applica **a ogni validazione** (idempotente: copre anche una scheda
  vecchia che riscrive un v2 dopo il deploy) a schede, sessioni e `variantOf` dei personalizzati, con le regole di
  `mergeExercise` (niente alternative doppie o uguali all'esercizio, `alternativeOf` uguale all'esercizio → `null`):
  il riscrittore è uno solo (`rewriteSessions`, `rewriteRoutines`). Nell'import del PoC si applica agli id appena
  letti, prima del ramo che trasforma un id sconosciuto in un personalizzato.
- Alternative scartate: restare a 2 aggiungendo campi facoltativi (perdita silenziosa, sopra); chiave nuova (due
  diari); tenere i due rematori (storico diviso in due pagine per lo stesso esercizio); reindirizzare solo nella
  migrazione da v2 (una scheda vecchia rimetterebbe l'id tolto).

## Consequences

- Dopo il deploy, una scheda aperta con il codice vecchio mostra «Formato non riconosciuto» finché non si ricarica;
  nessun dato si perde.
- Un backup esportato dopo INC-021 non si importa in una versione dell'app precedente.
- Lo storico dei due rematori si somma sotto `rematore-seduto-al-cavo-basso` (nel backup del 5 novembre: 5 punti).
- Gli alias del catalogo valgono anche per l'import del PoC: un nome registrato uguale a un alias non finisce più
  nelle note.
- Il controllo degli ID (`src/data/seed-data.test.ts`) accetta un id del PoC solo se è nel catalogo o reindirizzato,
  verso un esercizio del catalogo e senza catene.
