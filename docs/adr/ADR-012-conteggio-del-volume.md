# ADR-012 — Conteggio del volume per muscolo

Status: Accepted
Increment: INC-023, INC-029

## Context

Progressi deve dire quante serie a settimana riceve ogni gruppo muscolare (muscle-volume). Un esercizio ha
principali e secondari (ADR-010, ADR-011); servono un peso per ciascuno, una regola su quali serie contano e una
definizione di settimana e di media. Fonti:
- Pelland et al. 2026, *Sports Medicine* 56(2):481-505, DOI 10.1007/s40279-025-02344-w: tra i modelli di conteggio,
  quello frazionario con 0,5 per il lavoro indiretto è quello che si adatta meglio ai dati;
- Havers, Micke, Geisler, Held 2026, *Sports Med Open* 12:38, DOI 10.1186/s40798-026-01012-1: nessun peso diverso
  per le drop set;
- Hevy conta le serie in modo descrittivo, senza soglie (SPEC §5); le soglie MEV/MRV non hanno base sperimentale
  (Minor, Helms, Schepis 2020).

## Decision

1. **Pesi fissi:** principale `PRIMARY_SETS = 1`, secondario `SECONDARY_SETS = 0.5` (Pelland 2026). Da INC-029
   (ADR-014) il peso è la quota del gruppo nella mappa dell'esercizio, `MOST_RECRUITED = 1` o `RECRUITED = 0.5`. Più principali
   ricevono 1 ciascuno. Nessuna percentuale libera.
2. **Cosa conta:** le serie di sessioni concluse con `countsForProgress()` (spuntate, non di riscaldamento); normali,
   drop e cedimento valgono 1. L'esercizio è quello fatto (`exerciseId`), non `alternativeOf`. Un esercizio senza
   muscoli va in `unclassified`, uno con soli secondari no.
3. **Settimana da lunedì**, `weekStart()` in ora locale. «Settimana» = la settimana in corso, totali, parziale.
   «4 settimane» e «12 settimane» = media sulle settimane concluse prima di quella in corso, dalla prima settimana
   con dati in poi; le settimane vuote nel mezzo valgono zero.
4. **Un solo modulo,** `src/lib/archive/muscles.ts`, con pesi e regole e la citazione: se le evidenze cambiano si
   cambiano il file e i suoi test.
- Alternative scartate: conteggio diretto (secondari a 0 o a 1, peggio nei dati di Pelland); peso ridotto per le
  drop (nessuna fonte); media divisa sempre per 4 o 12 (diluisce i valori di chi ha appena cominciato); settimana
  mobile di 7 giorni (non coincide con il calendario dell'app).

## Consequences

- Ogni drop è una riga a sé (`SET_TYPES`): una drop set con due scalate vale 3 serie, probabilmente una sovrastima.
  Il limite è scritto nel commento del modulo.
- Cambiare i muscoli di un personalizzato cambia anche le settimane passate: il volume si ricalcola, non si salva.
- Nessun arrotondamento nel modulo: lo decide l'interfaccia (incremento 5).
