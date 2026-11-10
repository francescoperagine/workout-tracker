# ADR-011 — Fonte della mappa: studi di crescita, poi azione articolare

Status: Accepted
Increment: INC-022, INC-026

## Context

Servono muscoli principali e secondari per i 42 esercizi del catalogo (ADR-010), con il conteggio frazionario di
Pelland et al. 2026 (principale 1 serie, secondario 0,5). Le fonti possibili non dicono la stessa cosa:
- wger, sui 18 abbinamenti per nome: 8 concordano, 5 in parte, 3 sbagliano i principali (squat, leg press,
  hyperextension), 2 sono vuoti, e ha un solo gruppo per le spalle;
- Hevy ammette un solo principale per esercizio (SPEC D3), mentre lo squat profondo ne fa crescere tre;
- l'EMG non predice la crescita (Vigotsky et al. 2022);
- per 12 esercizi su 42 c'è uno studio di crescita con risonanza o ecografia, e tre lo contraddicono: leg press
  (glutei e adduttori crescono, Kinoshita 2026), squat (femorali no, Kubo 2019), hip thrust (solo glutei, Plotkin 2023).

Dettaglio, sigle e DOI nella mappa della feature (docs/archive/features/INC-027_muscle-volume-research/mappa-43.md, archiviata con la SPEC
in `docs/archive/features/` alla chiusura).

## Decision

1. **C'è uno studio di crescita:** comanda lo studio. Principale il bersaglio o un muscolo che cresce quanto lui,
   secondario se cresce meno, niente se non cresce. Così squat, leg press e leg press a metà pedana hanno principali
   quadricipiti, glutei e adduttori e nessun femorale; hip thrust solo glutei; leg extension solo quadricipiti.
2. **Non c'è:** principale il muscolo dell'azione articolare principale, secondario quello di un'altra azione sotto
   carico (il gomito nella panca). Dove lo studio è su un esercizio vicino il commento dice «analogia».
3. **Stabilizzatori isometrici non contati** (addominali e lombari nello squat, trapezio superiore nelle spinte):
   scelta nostra, confermata da Francesco il 10 novembre 2026, non presa da Pelland 2026.
4. **EMG mai usata**; wger solo come controllo. I 7 punti senza studio non si verificano sul Delavier: li chiude la
   regola stessa, con il motivo nella riga della mappa (INC-026). Cambia solo il pull-through, femorali principali per
   analogia con Morin 2025 e Bourne 2017.
- Alternative scartate: wger o la mappa delle app (errori sopra); un solo principale per esercizio (lo squat fa
  crescere tre gruppi, Kubo 2019); EMG (non predice la crescita).

## Consequences

- `src/data/seed-data.test.ts` blocca le righe decise dagli studi: si cambiano solo con uno studio nuovo.
- Il conteggio per gruppo differisce da wger su squat e leg press (adduttori e glutei principali, femorali no).
- I limiti restano scritti nella mappa: leg press con un solo studio su non allenati; per rematori, lat machine e spinte
  sopra la testa vale l'azione articolare finché non esce uno studio di crescita (uno con risonanza su lat machine
  contro rematore è registrato, senza risultati); allora la regola 1 si applica a quelle righe.
