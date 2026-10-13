# ADR-002 — Pagine indicizzabili

Status: Accepted
Increment: INC-002

## Context

Durante il restyling l'app era in prova su `workers.dev`, non elencata, e le pagine avevano
`<meta name="robots" content="noindex, nofollow">` (decisione 12 di `docs/archive/restyling/PIANO.md`: la
reperibilità veniva dalla pagina Projects del sito personale). Dopo il rilascio sul dominio Francesco vuole che il
progetto sia raggiungibile e visibile anche dai motori di ricerca. I dati restano nel browser: indicizzare le
pagine non espone nulla di personale.

## Decision

- Tolto il meta `robots` da `src/layouts/Base.astro`: tutte le pagine pubblicate sono indicizzabili.
- Ogni pagina dichiara `<link rel="canonical">` costruito da `site` di `astro.config.mjs`, così la copia su
  `workout-tracker.francescoperagine.workers.dev` non fa concorrenza al dominio.

## Consequences

- La copia su `workers.dev` resta attiva (chi l'ha installata da lì ha il diario in quell'origine) ma non viene
  indicizzata come duplicato.
- Niente `robots.txt` né sitemap: senza `robots.txt` è tutto permesso, e i motori trovano l'app dal link nella
  pagina Projects. Una sitemap serve solo se Search Console la chiede.
- `/kit` non è nella build pubblicata, quindi non ha bisogno di un `noindex` proprio.

## Alternatives Considered

- **Indicizzare solo la home** e lasciare `noindex` sulle schermate dell'app: un prop in più in `Base.astro` per
  pagine che hanno comunque titolo e descrizione propri; scartato per semplicità.
- **Spegnere `workers_dev`** invece del canonico: chi usa quell'origine perderebbe l'accesso al proprio diario.
