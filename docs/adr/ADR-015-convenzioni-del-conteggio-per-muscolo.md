# ADR-015 — Convenzioni del conteggio per muscolo

Status: Accepted
Increment: INC-034, INC-035 (convenzioni decise lì, scritte qui perché non vengano ridiscusse); INC-040 (tensore della
fascia lata nei flessori dell'anca, retto femorale applicato)

## Context

ADR-012 dice come si contano le serie, ADR-014 come si legge il Delavier e quale fonte vince. Restavano sparse tra
la SPEC di delavier-catalog (`docs/archive/features/INC-034_delavier-catalog.md`, §1 e §4) e il CHANGELOG le regole
che tengono insieme muscoli, gruppi e barre di Progressi. Senza scriverle, ogni dubbio su un muscolo («il retto
femorale flette l'anca, perché va nei quadricipiti?») riapre la discussione da capo.

## Decision

1. **Unità:** serie ricevute da un gruppo, con quota 1 o 0,5 (`MOST_RECRUITED`, `RECRUITED`; Pelland et al. 2026,
   *Sports Medicine*, DOI 10.1007/s40279-025-02344-w). È l'unica unità confrontabile con la letteratura sul volume.
2. **Ogni muscolo appartiene a un solo gruppo** (tabella di §4 di INC-034). Un muscolo in due gruppi conterebbe due
   volte le stesse serie: è una conseguenza aritmetica del punto 1, non un risultato scientifico.
3. **Il gruppo di un muscolo si sceglie con la classificazione delle fonti**, secondo la gerarchia di ADR-014 §5
   (studi confermati, poi il libro, poi il resto), mai a intuito. Esempi:
   - il retto femorale resta in Quadricipiti anche quando flette l'anca (classificazione anatomica unanime): dove il
     libro lo nomina, leg raise e sit-up danno serie anche ai quadricipiti (pp. 176, 180, 183; INC-040), e non è un
     errore;
   - il tensore della fascia lata va in Flessori dell'anca: il libro lo mette tra i «flexor muscles of the hip
     (iliopsoas, rectus femoris, and tensor fasciae latae)» (p. 174) e in ogni frase che lo dà come muscolo lavorato
     (pp. 176, 177, 180, 183) agisce da flessore. Sostituisce la decisione dell'11/11/2026 («non conta», INC-035),
     presa su una proposta senza questa fonte. Nessun valore cambia: in quelle frasi l'ileopsoas dà già ai flessori lo
     stesso valore (INC-040).
4. **Muscoli senza gruppo** (coracobrachiale, tibiale e gli altri «—» di §4) non contano.
5. **Niente raggruppamenti sopra i gruppi** (aree come Core o Gambe): un gruppo è uno e ha una sola barra.

- Alternative scartate: un muscolo in più gruppi con la quota divisa (le serie non sono più confrontabili con la
  letteratura e la somma per gruppo non dice più niente); aree sopra i gruppi (una barra che somma gruppi diversi
  conta serie che nessuno studio misura così).

## Consequences

- Spostare un muscolo di gruppo cambia le serie di tutti gli esercizi che lo nominano: si cambiano la tabella di §4
  (o un ADR che la sostituisce) e le righe di `src/data/catalog.ts`, con la fonte nel commento.
- Un gruppo nuovo è un valore in più in `MUSCLE_GROUPS`, accanto agli altri, mai un livello sopra di loro.
