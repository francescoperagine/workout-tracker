# AGENTS.md

Guida per agenti di codice che lavorano su questo repository.

## Panoramica

BodyTracker è un diario di allenamento in palestra, con interfaccia in **italiano**.
Il repository contiene due cose distinte:

| Percorso | Cosa è | Stato |
| --- | --- | --- |
| `src/`, `public/`, config in radice | App **Astro 5 + Tailwind CSS 4** (package `astro-bodytracker-starter`) | In sviluppo attivo, è il target principale |
| `BodyTracker/` | Versione precedente: pacchetto statico HTML/CSS/JS senza build (`palestra/`) più documentazione di prodotto e design (`documentazione/`) | Riferimento. Non viene importato né compilato da Astro |

Tutti i dati dell'utente restano nel browser (`localStorage`): nessun backend, database, account o chiamata API. Mantieni questo vincolo, a meno che non venga chiesto esplicitamente di cambiarlo.

## Comandi

```sh
npm install        # oppure npm ci
npm run dev        # dev server su http://localhost:4321
npm run build      # build di produzione in dist/ (vedi "Problemi noti": oggi fallisce)
npm run preview
npm run astro -- <comando>
```

Non ci sono test, linter, formatter né `astro check` configurati (`@astrojs/check` non è installato). Per verificare una modifica, avvia `npm run dev` e controlla le pagine nel browser (Chromium/Playwright è disponibile); verifica anche il layout a larghezza telefono, perché l'uso principale è da mobile in palestra.

## Struttura dell'app Astro

```
astro.config.mjs        site francescoperagine.com, output: 'server', integrazioni mdx + sitemap, plugin Vite di Tailwind
tailwind.config.mjs     palette "brand" e animazioni (attenzione: non è caricato, vedi sotto)
src/consts.ts           SITE_TITLE, SITE_DESCRIPTION, SITE_URL (usati da Layout e RSS)
src/styles/global.css   @import "tailwindcss" + poche regole globali
src/layouts/Layout.astro  <html lang="it">, Header + <main class="container"> + Footer. Props: title, description, showBackButton
src/pages/
  index.astro           Home: WeeklyCalendar, CalendarConfig, WorkoutEditor, HistoryView
  about.astro           Pagina informativa statica
  workout/[date].astro  Editor dell'allenamento di una data (YYYY-MM-DD), prerender = false
  rss.xml.js            Feed RSS residuo del template blog
src/components/
  Header.astro          Navigazione sticky + menu mobile (script bundlato da Astro)
  Footer.astro
  WeeklyCalendar.astro  Settimana corrente/precedente/successiva; ogni giorno linka a /workout/<data>
  CalendarConfig.astro  Assegna un nome di scheda a ciascun giorno della settimana
  WorkoutEditor.astro   Editor "allenamento del giorno" in home
  HistoryView.astro     Elenco storico, esporta/importa JSON, cancella tutto
```

### Modello di rendering

- I file `.astro` producono solo markup statico; **tutta la logica è lato client** in tag `<script>`.
- La maggior parte degli script è `<script type="module">` o `<script define:vars={...}>`, quindi **inline e non elaborati da Astro/TypeScript**: niente import, niente tipi, niente controllo in fase di build. Solo lo script di `Header.astro` è un `<script>` semplice, bundlato da Astro.
- Il rendering avviene costruendo stringhe HTML e assegnandole a `innerHTML`, con delegazione degli eventi tramite attributi `data-*` (`data-addset`, `data-deleteset="i-j"`, `data-reps`, `data-weight`, `data-deleteex`, …).
- I componenti comunicano tramite l'evento `window` `bb:updated` (e l'evento `storage` per altre schede). Dopo aver scritto lo storico, emetti `window.dispatchEvent(new CustomEvent('bb:updated'))`.
- Ogni componente cerca la propria radice con un attributo (`[data-weekly-calendar]`, `[data-calendar-config]`, `[data-workout-editor]`, `[data-history-view]`) e poi usa `root.querySelector('#id')`. Gli ID sono duplicati tra componenti e pagine (`#exercise-list`, `#add-exercise`, `#list`), quindi limita sempre le query alla radice del componente.

### Chiavi di localStorage

| Chiave | Forma | Lettura / scrittura |
| --- | --- | --- |
| `bb-calendar` | `{ "Lunedì": "Petto", ... }`: nomi completi dei giorni in italiano, con accento | CalendarConfig (l/s), WeeklyCalendar (l), `workout/[date]` (l) |
| `bb-workouts` | `[{ date: "YYYY-MM-DD", exercises: [{ name, sets: [{ reps, weight }] }] }]`, al massimo un elemento per data | `workout/[date]` (l/s), HistoryView (l/s/import/clear), WeeklyCalendar (l) |
| `workout` | Singolo `{ date, exercises }` | WorkoutEditor (l/s), WeeklyCalendar (l, unito a `bb-workouts` se la data non c'è) |

I nomi dei giorni devono coincidere esattamente tra `CalendarConfig` (`['Lunedì', …, 'Domenica']`), `WeeklyCalendar` (`dayNames`, indicizzato da `getDay()`) e `workout/[date]` (giorno da `toLocaleDateString('it-IT')`, con iniziale maiuscola).

## Convenzioni

- Testo dell'interfaccia, `title`/`description` e messaggi utente in **italiano**; date formattate con `toLocaleDateString('it-IT', …)`.
- Ogni pagina usa `Layout`; le sottopagine passano `showBackButton={true}`.
- Lo stile è fatto con classi di utilità Tailwind direttamente nel markup: card `bg-white rounded-2xl shadow-lg p-6/p-8`, azioni primarie `bg-blue-600 … hover:bg-blue-700`, azioni di salvataggio `bg-green-600`, azioni distruttive in rosso. Tailwind 4 usa la sintassi `bg-linear-to-r`/`bg-linear-to-br` (non `bg-gradient-to-*`).
- Le azioni distruttive chiedono conferma con `confirm(...)`; il feedback oggi usa `alert(...)`.
- Il codice segue lo stile dei file vicini: alcuni file usano punto e virgola, altri no. Non riformattare interi file.
- I commenti nel codice sono un misto di italiano e inglese; preferisci l'italiano per i testi rivolti all'utente.

## Problemi noti (verificati)

Tienine conto prima di dare per scontato un comportamento; correggili solo se rientrano nel compito.

1. **`npm run build` fallisce** con `NoAdapterInstalled`: `astro.config.mjs` imposta `output: 'server'` ma non c'è un adapter. Il dev server funziona. Correzione possibile: aggiungere un adapter, oppure tornare a `output: 'static'` e mantenere `prerender = false` solo dove serve (che a sua volta richiede un adapter).
2. **`/workout/<data non valida>` restituisce 500**: `[date].astro` usa `throw Astro.redirect('/')`, ma il redirect va restituito (`return Astro.redirect('/')`).
3. **`/rss.xml`** è un residuo del template blog: chiama `getCollection('blog')`, ma non esiste una configurazione delle content collection, quindi il feed è vuoto e registra un errore. Anche `Layout` aggiunge un `<link rel="alternate">` verso questo feed.
4. **Il `tailwind.config.mjs` non viene usato**: Tailwind 4 non carica automaticamente i file di configurazione JS. Le classi `brand-*` e le animazioni personalizzate non esistono, a meno di aggiungere `@config "../../tailwind.config.mjs";` in `global.css` o di spostare i token in un blocco `@theme`. Anche la classe `input` usata in `CalendarConfig` non è definita.
5. **Modelli dati incoerenti**: `WorkoutEditor` scrive sulla chiave separata `workout` invece che su `bb-workouts`; `HistoryView` legge `item.name` e mostra `item.exercises` come stringhe, mentre le voci di `bb-workouts` non hanno `name` e gli esercizi sono oggetti `{ name, sets }`. L'importazione in `HistoryView` sostituisce tutto lo storico senza validare gli elementi.
6. **Date e fusi orari**: `WeeklyCalendar.formatDate` usa `toISOString()` (UTC), quindi nei fusi orari a est di UTC la data può risultare del giorno precedente. Altrove si usa `new Date(\`${date}T00:00:00\`)` (ora locale). Per le chiavi `YYYY-MM-DD` preferisci una formattazione in ora locale.
7. **XSS tramite `innerHTML`**: nomi di esercizi e schede scelti dall'utente vengono inseriti nell'HTML senza escape. Quando tocchi questi render, esegui l'escape o usa `textContent`.
8. I link di Header e Footer verso `#allenamenti`/`#storico` funzionano solo nella home; `#privacy` e `#termini` non hanno destinazione.

## Riferimento: `BodyTracker/`

- `BodyTracker/LEGGIMI.md`: funzionalità e vincoli di privacy della versione statica (salvataggio a ogni modifica con stato visibile, esportazione e importazione con unione e deduplicazione, protezione da sovrascritture tra schede, gestione dell'errore di quota, schede A/B, varianti, catalogo esercizi con ID stabili).
- `BodyTracker/documentazione/PRODUCT.md`: principi di prodotto (uso con una mano, salvataggio visibile, nessuna sovrascrittura silenziosa, carichi distinti per variante).
- `BodyTracker/documentazione/DESIGN.md` e `design.json`: design system "verde scuro" (token per colori, tipografia, raggi e spaziature).
- `BodyTracker/palestra/esercizi.js`: catalogo esercizi (`window.catalogoEsercizi`) e schede iniziali (`window.schedeIniziali`).

Quando porti una funzionalità dalla versione statica all'app Astro, usa questi file come specifica. Non modificare `BodyTracker/palestra/` se non richiesto: è un pacchetto pubblicabile a sé stante, con un formato dati proprio (`bodytracker.archivio.v1`, campi in italiano, `versione: 1`) che non è compatibile con le chiavi `bb-*` dell'app Astro.

## Note varie

- `.vscode/settings.json` contiene un percorso specifico di Windows: non dipenderne.
- `dist/`, `.astro/` e `node_modules/` sono ignorati da git.
- `README.md` è ancora quello del template minimo di Astro.
