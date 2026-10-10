# Restyling BodyTracker: piano

Segue [ANALISI.md](ANALISI.md). Ogni step è un commit (o una PR) verificabile da solo, nell'ordine indicato. Il codice si scrive solo dopo la conferma di questo piano.

**Obiettivo finale:** un solo progetto, l'app Astro nella radice, con **tutte le funzioni dell'app attuale e del PoC** più quelle nuove. Il PoC in `BodyTracker/` viene assorbito durante il restyling (catalogo, schede, documentazione di design, comportamenti) e **la cartella viene eliminata nell'ultimo step**, dopo aver verificato la parità delle funzioni (vedi "Assorbimento del PoC").

## Decisioni prese

| # | Tema | Decisione |
| --- | --- | --- |
| 1 | Mondo visivo | Si parte dal mondo del PoC (verde, operativo) con **tema chiaro e tema scuro**: segue il sistema, con scelta manuale Sistema/Chiaro/Scuro |
| 2 | Timer | **Come Strong**: la spunta della serie avvia il recupero, mostrato a tutto schermo |
| 3 | Avvisi | Per ora solo con l'app aperta. **Predisposizione leggera per il Web Push** (interfaccia più handler nel service worker), senza server |
| 4 | Ambito v1 | Oltre a calendario, schede e allenamento: **tipi di serie** e **grafici dei progressi** |
| 5 | PWA | Installabile, **sempre usabile offline, privata**: nessuna richiesta esterna, font e icone inclusi nel sito, nessuna statistica |
| 6 | Dati | Nessuna migrazione dal vecchio formato `bb-*`. **Import dei dati del PoC** (`bodytracker.archivio.v1`) come funzione permanente dell'app, per recuperare il tuo diario attuale |
| 7 | Hosting | Oggi pubblicata in un **percorso del sito personale**, domani su un dominio proprio: il percorso base deve essere configurabile |
| 8 | Progetti | Resta solo l'app nella radice. **`BodyTracker/` viene eliminata** a fine restyling |

Assunzioni da confermare (se non indicato altrimenti):
- unità **kg**;
- nome **BodyTracker**;
- indirizzo di pubblicazione sul sito personale `/bodytracker/`: è il **percorso URL**, non la cartella del repository, ed è modificabile con `BT_BASE`;
- interfaccia solo in italiano.

## Scelte tecniche

- **Astro 7**, aggiornato da 5 con `npx @astrojs/upgrade` all'inizio, prima della riscrittura. Output statico.
- **Svelte 5 come isole** (`@astrojs/svelte`) per le parti con stato: allenamento attivo, timer, editor delle schede, grafici.
  - Toglie i template `innerHTML`, quindi anche il rischio XSS.
  - Runtime piccolo, transizioni native.
  - Le pagine e il guscio restano `.astro`.
- **Navigazione:** pagine Astro con `<ClientRouter />` (View Transitions). L'isola "allenamento in corso + timer" usa `transition:persist`, così sopravvive ai cambi di pagina senza ricaricarsi.
- **Tailwind 4 con token in `@theme`**, generati dal `DESIGN.md`. Si rimuovono `tailwind.config.mjs` e la palette viola.
- **Icone:** SVG di [Lucide](https://lucide.dev) incluse a build-time (licenza ISC), un solo spessore di tratto.
- **Font:** self-hosted in `public/fonts` (woff2, sottoinsieme latino), scelto nello step 1 con Impeccable. Niente Inter o Arial (vietati da Impeccable) e niente Google Fonts (privacy).
- **PWA:**
  - `manifest.webmanifest` con icone;
  - service worker generato con **`workbox-build`** in un hook `astro:build:done`, che fa il precache di tutto `dist/`. Si usa questa via perché `@vite-pwa/astro` dichiara compatibilità solo fino ad Astro 5;
  - registrazione con scope pari al percorso base.
- **Percorso base:** `base` e `site` di Astro da variabili d'ambiente (`BT_BASE`, `BT_SITE`). Tutti i link passano da un helper che usa `import.meta.env.BASE_URL`.
- **Archivio:** `localStorage`, chiave `bodytracker.archivio.v2`, dietro un modulo repository che gestisce validazione, revisioni e conflitti tra schede, sul modello del PoC.
  - All'avvio `navigator.storage.persist()`.
  - Avviso nel pannello Dati: su iOS i siti non installati possono perdere i dati dopo 7 giorni senza visite. Consigliati l'installazione e un backup periodico.
- **Test:**
  - **Vitest** per la logica pura: archivio, validazione, import del PoC, calcoli dei progressi, timer con orologio finto;
  - **Playwright** per i flussi end-to-end, con la Chromium preinstallata.
- **Qualità UI:** Impeccable installato nel repository (`npx impeccable install`) con hook del detector, più `npx impeccable detect` sui file e sulle pagine renderizzate in CI e in locale.

## Modello dati v2 (bozza)

```ts
interface Archivio {
  versione: 2;
  revisione: number;                    // incrementata a ogni salvataggio, per i conflitti tra schede
  catalogo: Record<string, Esercizio>;  // esercizi personalizzati; quelli di base arrivano dal codice
  schede: Scheda[];
  pianificazione: Record<GiornoSettimana, string | null>; // lun..dom -> id scheda
  eccezioni: Record<string, string | null>;               // YYYY-MM-DD -> id scheda (o riposo)
  sessioni: Sessione[];
  impostazioni: { tema: 'sistema' | 'chiaro' | 'scuro'; recuperoPredefinito: number; suono: boolean; vibrazione: boolean };
}

interface Scheda {
  id: string; nome: string; note: string; archiviata: boolean;
  voci: VoceScheda[];
}
interface VoceScheda {
  id: string;
  esercizioId: string;
  alternative: string[];          // id esercizi
  gruppo: string | null;          // stessa stringa = superserie
  serie: number;                  // serie target
  ripetizioni: string;            // "6–8"
  carico: string;                 // "45–50 kg", testo libero
  unita: string;                  // "per manubrio"
  recupero: number;               // secondi
  recuperoRiscaldamento: number;  // secondi
}

interface Sessione {
  id: string; data: string; schedaId: string | null; nome: string;
  inizio: number; fine: number | null;   // timestamp
  voci: VoceSessione[];
}
interface VoceSessione {
  id: string; esercizioId: string; varianteDi: string | null;
  gruppo: string | null; recupero: number; recuperoRiscaldamento: number; note: string;
  serie: Serie[];
}
interface Serie {
  id: string;
  tipo: 'normale' | 'riscaldamento' | 'drop' | 'cedimento';
  kg: number | null; ripetizioni: number | null;
  completata: number | null;             // timestamp della spunta
}

// Chiave separata, aggiornata spesso
interface TimerRecupero { sessioneId: string; voceId: string; serieId: string; inizio: number; fine: number; durata: number }
```

**Dati iniziali**
- Il catalogo e le schede A/B del PoC (`esercizi.js`) vengono convertiti una volta in `src/data/catalogo.ts` e `src/data/schede-iniziali.ts`. Gli ID degli esercizi restano identici, perché il tuo storico li usa. Le eventuali immagini degli esercizi vanno in `public/esercizi/`.
- I recuperi come "2′" o "60–75″" vengono convertiti in secondi: per un intervallo si usa il valore minimo (es. 60–75″ → 60 s), e la scheda resta modificabile.

**Import del PoC**
- Da file di backup, la funzione "Esporta" del PoC.
- Se la nuova app è pubblicata sulla **stessa origine** del PoC, anche lettura diretta della chiave `bodytracker.archivio.v1`, con anteprima e conferma.

## Assorbimento del PoC

Ogni funzione del PoC deve esistere nell'app radice prima di eliminare `BodyTracker/`. La colonna "Step" indica dove viene realizzata; lo step finale la verifica con un test e2e.

| Funzione del PoC | Nella nuova app | Step |
| --- | --- | --- |
| Avvio da scheda A/B o allenamento libero | Avvio da qualsiasi scheda (A/B come dati iniziali) o libero | 5 |
| Più allenamenti nella stessa data, data e nome modificabili | Uguale | 6 |
| Aggiungi esercizio dal catalogo con ricerca, o nome libero | Uguale, con ricerca nel catalogo | 4, 6 |
| Pesi decimali, note per esercizio (peso totale, per manubrio, macchina) | Uguale; l'unità della scheda ("per manubrio") è mostrata accanto ai kg | 6 |
| "Aggiungi serie" riprende il peso della serie precedente, ripetizioni vuote | Uguale | 6 |
| Varianti con conferma e svuotamento delle serie se ci sono valori | Uguale | 6 |
| Indicazioni della scheda (ripetizioni, partenza, recupero) sull'esercizio | Uguale, dai campi della voce di scheda | 6 |
| Riferimento all'ultima sessione conclusa della stessa variante | Colonna "precedente" per serie | 6 |
| Spunta dell'esercizio completato | Spunta **per serie** (come Strong); esercizio completato quando tutte le serie sono spuntate | 6 |
| Concludi e riapri l'allenamento; "aggiungi almeno un esercizio prima di concludere" | Uguale, più il riepilogo | 6 |
| Storico con modifica delle sessioni concluse, eliminazione con conferma | Uguale | 8 |
| Approfondimento esercizio (descrizione, immagine locale sicura, passaggi, attenzione, fonti) | Foglio dal basso; stessa regola sui percorsi delle immagini (niente domini esterni né SVG incorporati) | 6 |
| Stato "Salvato su questo dispositivo", "Salva ora" per riprovare, errore di quota con dati tenuti in memoria | Uguale nella barra fissa | 2, 6 |
| Avviso prima di chiudere con modifiche non salvate (`beforeunload`) | Uguale | 6 |
| Protezione tra schede: se il diario cambia altrove, blocco e richiesta di ricaricare | Uguale, con `revisione` | 2 |
| Archivio illeggibile: niente sovrascrittura, download del contenuto originale | Uguale | 2, 3 |
| Export JSON; import con validazione completa, limite 10 MB e 10.000 allenamenti, scelta tra mantenere o sostituire gli ID già presenti | Uguale per il formato v2; il formato v1 del PoC viene convertito | 2, 3 |
| Limiti 100 esercizi per sessione e 100 serie per esercizio, lunghezze massime dei testi | Uguale | 2 |
| Testi su privacy e limiti (dati per origine, navigazione privata, backup) | Sezione Dati e privacy, aggiornata per la PWA | 3 |
| `PRODUCT.md`, `DESIGN.md`, `design.json` del PoC | Spostati in radice con `git mv`, poi aggiornati da Impeccable | 0, 1 |

## Regole di comportamento chiave

- **Valori precedenti:**
  - ogni riga serie mostra il risultato della stessa serie (stesso indice e stessa variante) nell'ultima sessione conclusa con quell'esercizio;
  - toccando "precedente" il valore viene copiato nei campi;
  - una nuova sessione da scheda precompila il numero di serie della scheda, con campi vuoti e valori precedenti come suggerimento.
- **Tipi di serie:**
  - si cambiano toccando l'indice della serie (1 → R riscaldamento → D drop → C cedimento → 1);
  - le serie di riscaldamento non hanno numero e non contano per volume, record e grafici.
- **Recupero (come Strong):**
  - la spunta di una serie avvia il recupero dell'esercizio, o quello di riscaldamento se la serie è di riscaldamento;
  - in una **superserie** il recupero parte solo dopo la serie dell'ultimo esercizio del gruppo, mentre le spunte intermedie spostano il focus all'esercizio successivo;
  - durata 0 = nessun timer;
  - togliere la spunta durante il recupero annulla il timer.
- **Varianti:** stessa regola del PoC. Se la variante ha già valori, il cambio chiede conferma e svuota le serie; lo storico tiene traccia di variante ed esercizio base.
- **Sessioni:** più sessioni nello stesso giorno sono possibili. Una sola sessione "in corso" alla volta; concludere mostra un riepilogo (durata, serie, volume, record).

## Step

### Step 0: Fondamenta del progetto
- Aggiornamento ad Astro 7 e dipendenze; rimozione di MDX e sitemap se non servono (l'app è privata e non va indicizzata, quindi `noindex`).
- Installazione di Impeccable (hook detector) e di Svelte, Vitest e Playwright (dev).
- `PRODUCT.md` in radice: `git mv` di quello del PoC (insieme a `DESIGN.md` e `design.json`, che lo step 1 aggiorna), poi aggiornato con le decisioni sopra.
- `/impeccable shape` per le superfici: Oggi, Allenamento attivo, Timer, Schede, Calendario, Storico/Progressi, Dati. I brief vanno in `.impeccable/surfaces/`.
- **Verifica:** `npm run build` verde, brief confermati da te.

### Step 1: Design system (chiaro e scuro)
- Con Impeccable: estensione del mondo del PoC a una variante chiara, scelta del font, **mossa distintiva** (il timer a tutto schermo).
- `DESIGN.md` in radice con token per entrambi i temi; token in `@theme`; temi via `prefers-color-scheme` più attributo `data-theme`.
- Componenti base:
  - pulsanti (primario, secondario, pericolo, icona), campo, campo numerico serie, selettore;
  - foglio dal basso e dialog, tab bar, barra di stato del salvataggio, stato vuoto, toast;
  - superfici del browser tematizzate (selezione, caret, focus, scrollbar).
- Pagina interna `/_kit` per vedere tutti i componenti nei due temi (esclusa dal precache).
- **Verifica:** detector a 0 su `/_kit` nei due temi, contrasti ≥ 4,5:1, target ≥ 44–48px.

### Step 2: Dati
- `src/lib/archivio/`: tipi, validazione, repository (caricamento, salvataggio, revisione, quota, conflitto tra schede, evento di aggiornamento), seed dal PoC, conversione dei recuperi.
- Import ed export v2, import del backup del PoC e lettura diretta della sua chiave.
- Conversione di `BodyTracker/palestra/esercizi.js` in `src/data/` (catalogo e schede iniziali, stessi ID).
- Rimozione del codice `bb-*` attuale.
- **Verifica:** test Vitest su validazione, import del PoC (con un tuo backup reale, se me lo fornisci, oppure uno sintetico), conflitti e quota.

### Step 3: Guscio dell'app e PWA
- Layout mobile con tab bar in basso (Oggi, Calendario, Schede, Storico) e accesso alle impostazioni; safe area; `ClientRouter`.
- Manifest, icone, service worker con precache, registrazione con scope pari al percorso base, pagina offline non necessaria (tutto in precache).
- Impostazioni: tema, recupero predefinito, suono e vibrazione, sezione Dati e privacy.
- **Verifica:** Playwright offline (contesto senza rete dopo la prima visita), nessuna richiesta a domini esterni, build con `BT_BASE=/bodytracker/` funzionante.

### Step 4: Schede
- Elenco: crea, duplica, rinomina, archivia, elimina con conferma.
- Editor:
  - aggiungi esercizio dal catalogo (ricerca) o personalizzato;
  - riordino (frecce, accessibile; trascinamento facoltativo) e raggruppamento in superserie;
  - serie, ripetizioni, carico, unità, recupero e recupero di riscaldamento, alternative.
- **Verifica:** e2e "crea scheda C con superserie e la ritrovi dopo il ricaricamento".

### Step 5: Calendario e Oggi
- Calendario:
  - settimana scorrevole e vista mese compatta;
  - assegnazione di una scheda a ogni giorno della settimana, eccezione per una singola data (scheda diversa o riposo);
  - stati del giorno: pianificato, fatto, saltato, oggi.
- Oggi: scheda prevista e "Inizia allenamento"; alternative (altra scheda, allenamento libero); "Riprendi" se c'è una sessione in corso; ultimo allenamento.
- **Verifica:** e2e "pianifico B il giovedì → giovedì Oggi propone B".

### Step 6: Allenamento attivo
- Elenco esercizi con target della scheda, selettore variante, approfondimento dal catalogo.
- Righe serie `tipo/n · precedente · kg · rip · ✓`, aggiungi o rimuovi serie, note.
- Aggiungi esercizio durante la sessione; riordino.
- Barra fissa con durata della sessione e stato del salvataggio; "Termina" con riepilogo; sessione riapribile dallo storico.
- Mini-barra persistente (`transition:persist`) quando si naviga altrove.
- **Verifica:** e2e di una sessione completa da scheda, con ricaricamento a metà; viewport 320, 390, 430 e desktop.

### Step 7: Timer di recupero
- Overlay a tutto schermo:
  - conto alla rovescia grande con cifre tabulari, progresso;
  - −15 s, +15 s, Salta, Riduci (diventa barra);
  - anteprima della prossima serie (esercizio, kg × rip attesi).
- Motore:
  - basato su `fine` (timestamp), persistito nella sua chiave, ricalcolato a `visibilitychange`;
  - wake lock durante la sessione;
  - suono con `AudioContext` sbloccato dal tocco della spunta; `navigator.vibrate` dove disponibile;
  - `aria-live` a 30 s, 10 s e alla fine; `prefers-reduced-motion`.
- **Predisposizione Web Push:**
  - interfaccia `AvvisoRecupero { programma(timer): Promise<void>; annulla(id): Promise<void> }` con implementazione locale (in primo piano);
  - handler `push` e `notificationclick` già presenti nel service worker;
  - documento con il contratto di un futuro endpoint (`POST {subscription, fine}`). Nessun server.
- **Verifica:** Vitest con timer finti; e2e con `page.clock` (spunta → overlay → +15 s → fine → chiusura); prova manuale su iPhone e Android, con una checklist nel documento.

### Step 8: Storico e progressi
- Storico per data (lista più accesso dal calendario), dettaglio sessione modificabile, eliminazione con conferma.
- Pagina esercizio:
  - grafici di **carico massimo**, **1RM stimato** (Epley, solo serie normali con ripetizioni ≤ 12) e **volume per sessione**, con selettore di periodo;
  - record personali e cronologia delle serie.
- Grafici in **SVG scritto a mano** dentro componenti Svelte: nessuna libreria esterna, tematizzabili e offline. Si seguono le linee guida della skill dataviz al momento dell'implementazione.
- **Verifica:** Vitest sui calcoli (riscaldamento escluso, varianti separate), e2e sulla pagina esercizio con dati seed.

### Step 9: Rifinitura, eliminazione del PoC e rilascio
- Impeccable: `critique`, `audit`, `harden` (stati vuoti, errori, nomi lunghi, quota piena, conflitto tra schede), `polish`.
- Verifica della tabella "Assorbimento del PoC": ogni riga deve avere un test e2e verde.
- **Eliminazione di `BodyTracker/`** (resta nella cronologia git). Le parti ancora utili di `LEGGIMI.md` (privacy, limiti, aggiunta di approfondimenti al catalogo) confluiscono nel `README.md`.
- Aggiornamento di `AGENTS.md` e `README.md` (comandi, pubblicazione in un percorso del sito, privacy, catalogo).
- **Verifica:** detector a 0 su tutte le pagine nei due temi, suite Playwright verde, Lighthouse PWA/accessibilità, build con base `/bodytracker/` provata con un server statico, nessun riferimento residuo a `BodyTracker/` nel repository.

## Rischi e punti da verificare

- **iOS:** wake lock nelle app installate (bug risolto in 18.4 secondo una fonte), sblocco dell'audio, assenza di vibrazione. Va provato su un iPhone reale prima di chiudere lo step 7.
- **Perdita di dati su iOS** per i siti non installati: va mitigata con l'invito all'installazione, `storage.persist()` e il promemoria di backup.
- **I tuoi dati nel PoC:** vivono nel browser in cui usi il PoC pubblicato, non nel repository. Prima di dismettere il PoC pubblicato, esporta un backup da "Dati e privacy". La lettura diretta funziona solo se la nuova app è pubblicata sullo stesso dominio del PoC.
- **Ambito:** grafici e tipi di serie aumentano il lavoro degli step 6 e 8. Superserie e riordino con trascinamento sono i candidati da rimandare se serve.
