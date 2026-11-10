---
mode: plan
feature: muscle-volume
inc_base: fd25741   # HEAD di main al 10 novembre 2026 dopo INC-020; ultimo incremento in CHANGELOG: INC-020
spec: features/muscle-volume/SPEC.md
resume_from: SPEC §8 (domande aperte)
---

> **MODE: plan**: si producono la SPEC completa e l'handoff d'esecuzione. Scrivere nei file sorgente è una
> violazione: se pensi che sia ora di implementare, dillo e fermati.

# Handoff di piano — muscle-volume

La ricerca è fatta e le decisioni D1-D9 sono in SPEC §2: non rifarle e non rimetterle in discussione senza una
fonte nuova. Resta da chiudere SPEC §8, attaccare il piano (AGENTS.md, regola 9) e scrivere l'handoff
`mode: implement`.

## Prima di tutto (controlla, poi fermati se qualcosa non torna)

1. `git log --oneline -3`: il punto di partenza è `inc_base` o un suo discendente. Se dopo `inc_base` ci sono commit
   che toccano `src/lib/archive/` o `src/data/`, rileggi SPEC §6 contro il codice prima di proseguire.
2. `grep -m1 '^## INC-' CHANGELOG.md` deve dare INC-020.
3. Letture del livello Feature: `docs/ARCHITECTURE.md`, `docs/PROJECT.md`, questa SPEC. Poi solo le righe che
   servono di `src/lib/archive/types.ts`, `src/lib/archive/validation.ts`, `src/lib/archive/backup.ts`,
   `src/lib/archive/progress.ts`, `src/data/catalog.ts`.

## Lavoro

1. **Verifica SPEC §6 nel codice:** come validazione e backup trattano campi nuovi, se serve una versione
   dell'archivio, dove ha senso tenere la mappa. Scrivi le risposte nella SPEC con file e riga.
2. **Bozza della mappa dei 43 esercizi** (`src/data/catalog.ts`) in un file nuovo
   features/muscle-volume/research/mappa-43.md. Una riga per esercizio con:
   - principali e secondari;
   - l'azione articolare che li giustifica;
   - lo studio, se esiste (Kubo 2019 per lo squat; cercarne altri per hip thrust, stacco rumeno, rematori, panca
     inclinata, alzate);
   - l'esito del controllo con `features/muscle-volume/research/wger-crosscheck.md`.

   Regola di SPEC D4. Gruppi di SPEC §3. Niente EMG come criterio. Ogni studio citato con autori, anno, rivista e
   DOI verificati con una ricerca.
3. **Opzioni per le domande 3-7 di SPEC §8:** per ciascuna, cosa chiedono gli utenti, cosa fanno i competitor, pro
   e contro, con fonti citate (gli URL mancanti di SPEC §5 vanno ritrovati se una decisione dipende da loro).
4. **Un solo messaggio a Francesco** con domande, rischi e decisioni (AGENTS.md, regola 2). Insieme: la mappa da
   confrontare con il suo libro (Delavier 6ª ed.) e la conferma dei gruppi (lombari e adduttori).
5. Con le risposte: completa la SPEC (incrementi, criteri verificabili, test), attaccala (regola 9), scrivi
   l'handoff `mode: implement` al posto di questo file e chiudi con il prompt pronto da incollare.

## Vincoli di Francesco (valgono per tutta la feature)

- Terminologia: **variante** = esercizio personalizzato derivato da un altro; **alternativa** = esercizio scelto al
  posto di quello della scheda. Il codice di oggi le confonde (SPEC §6).

- Anti BS: ogni affermazione su efficacia, numeri o comportamento dei competitor ha la fonte; se non c'è, dillo.
- Ogni decisione: utenti, competitor, pro e contro. Senza che te lo ricordi.
- Italiano, conclusione per prima, niente lineette lunghe.
- Commit solo se chiesto; il push lo fa lui (`main` va in produzione). `docs/todo.md` è suo: non toccarlo.
- Non trascrivere in blocco le liste del libro né copiarne testo o illustrazioni (SPEC §4, aspetto legale).

## Ambiente (insidie già incontrate)

- La VM del desktop non installa pacchetti (registro npm 403) e `node_modules` del Mac ha binari darwin: non
  toccarli. Il gate lo lancia Francesco dal Terminale (log in `.gate.log`). In modalità piano non serve.
- Reddit è bloccato dagli strumenti web: non aggirarlo; se servono thread, chiedili a Francesco.
