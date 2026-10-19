# Workout Tracker

Diario di allenamento in palestra, in italiano, pensato per il telefono tra una serie e l'altra: schede con varianti e superserie, pianificazione sulla settimana, allenamento con la colonna «precedente» e la spunta per serie, timer di recupero a tutto schermo, storico modificabile e progressi per esercizio.

Si installa sulla schermata Home come app (PWA) e funziona offline dopo la prima visita. **Nessun account, nessun server, nessuna statistica:** i dati restano nel browser.

App: <https://workout-tracker.francescoperagine.com>

## Privacy e limiti

- Gli allenamenti non vengono inviati a nessun server. L'app non usa font remoti, librerie esterne, statistiche o richieste API: font e icone sono inclusi nel sito. Il service worker mette in cache l'app per l'uso offline, non i dati.
- Il diario è nel `localStorage` del browser (chiave `workout-tracker.archive.v2`). I dati appartengono all'**origine** (protocollo + dominio + porta): un altro browser, dispositivo o dominio ha un diario diverso. Per spostarli si usa **Esporta backup** e **Importa backup** in Impostazioni › Dati e privacy.
- Cancellando i dati del sito si perde il diario; in navigazione privata può sparire alla chiusura. Su iOS i siti **non installati** possono perdere i dati dopo 7 giorni senza visite: conviene installare l'app ed esportare un backup di tanto in tanto. L'app chiede al browser di conservare i dati (`navigator.storage.persist()`) dopo il primo avvio.
- Il diario non è cifrato né sincronizzato. Il backup è un file JSON leggibile: non condividerlo se contiene dati personali.
- Il salvataggio avviene a ogni modifica, con lo stato visibile. Se lo spazio è esaurito o il browser non salva, l'app lo dice, tiene le modifiche in memoria e permette di riprovare con «Salva ora»: esporta subito un backup. Se il diario viene modificato in due schede, la seconda chiede di ricaricare invece di sovrascrivere. Un diario illeggibile non viene mai sovrascritto e se ne può scaricare il contenuto originale.
- Limiti: 100 esercizi per allenamento, 100 serie per esercizio, testi di lunghezza limitata, file di import fino a 10 MB e 10.000 allenamenti.
- Gli avvisi di fine recupero (suono, vibrazione dove c'è, schermo acceso) funzionano solo con l'app aperta.

L'import accetta anche i backup della prima versione statica dell'app (formato `bodytracker.archivio.v1`, file esportato da «Dati e privacy»): allenamenti, varianti ed esercizi liberi vengono convertiti, con un riepilogo degli elementi scartati.

## Autore

[Francesco Peragine](https://francescoperagine.com) · [LinkedIn](https://linkedin.com/in/fperagine)

## Sviluppo

App statica **Astro 7** con isole **Svelte 5** e **Tailwind CSS 4**. Richiede Node.js.

```sh
npm ci
npm run dev        # http://localhost:4321 (anche /kit, la pagina del design system)
npm run build      # sito statico in dist/, con il service worker
npm run preview
npm run check      # type-check
npm test           # Vitest
npm run test:e2e   # Playwright sulla build (npx playwright install chromium la prima volta)
```

`WT_BASE=/percorso/` costruisce l'app in un sotto-percorso, `WT_SITE` cambia il dominio. La pagina `/kit` esiste solo con `npm run dev` o con `WT_KIT=1` (la imposta la config di Playwright): la build pubblicata non la contiene.

Struttura, convenzioni e decisioni sono in [AGENTS.md](AGENTS.md); prodotto e design in [PRODUCT.md](PRODUCT.md) e [DESIGN.md](DESIGN.md); la storia del restyling in [docs/archive/restyling/](docs/archive/restyling/).

## Pubblicazione

Worker Cloudflare `workout-tracker`, solo asset statici, configurato in [wrangler.jsonc](wrangler.jsonc): `https://workout-tracker.francescoperagine.com` (e `workers.dev`). Workers Builds è collegato al repository: ogni push su `main` (build `npm run build`, deploy `npx wrangler deploy`) va in produzione da solo, quindi si pusha solo con check, test, build ed e2e verdi.

## Catalogo esercizi e approfondimenti

Il catalogo di base è in [src/data/catalog.ts](src/data/catalog.ts), le schede di esempio A/B in [src/data/starter-routines.ts](src/data/starter-routines.ts). Gli **ID degli esercizi non vanno cambiati né rimossi**: lo storico e i backup li usano per riconoscere esercizi e varianti. Un esercizio nuovo si aggiunge con un ID nuovo; gli esercizi scritti a mano nell'app diventano esercizi personalizzati nel diario.

Gli approfondimenti («come si esegue») sono vuoti di proposito: non contengono testi tecnici o consigli medici inventati. Per aggiungerne uno si compilano i campi dell'esercizio:

```ts
'squat-bilanciere': {
  id: 'squat-bilanciere',
  name: 'Squat bilanciere',
  description: '',     // testo semplice, senza HTML
  image: 'squat.webp', // file in public/exercises/
  imageAlt: '',        // descrizione accessibile dell'immagine
  steps: [],           // passaggi dell'esecuzione
  caution: '',         // note o precauzioni verificate
  sources: [],         // { title: 'Titolo', url: 'https://…' }
},
```

Usa spiegazioni corrette e immagini di cui hai i diritti. Le immagini sono file PNG, JPG, WebP, AVIF o GIF nella cartella `exercises/` di `public/` (percorso relativo, senza `..`) o immagini raster incorporate; immagini su domini esterni e SVG non vengono caricati. Le fonti si aprono solo su azione dell'utente e devono essere indirizzi `http` o `https`.
