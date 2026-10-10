# Restyling BodyTracker: piano

Segue [ANALISI.md](ANALISI.md). Ogni step è un commit (o una PR) verificabile da solo, nell'ordine indicato. Il codice si scrive solo dopo la conferma di questo piano.

**Obiettivo finale:** un solo progetto, l'app Astro nella radice, con **tutte le funzioni dell'app attuale e del PoC** più quelle nuove. Il PoC in `BodyTracker/` viene assorbito durante il restyling (catalogo, schede, documentazione di design, comportamenti) e **la cartella viene eliminata nell'ultimo step**, dopo aver verificato la parità delle funzioni (vedi "Assorbimento del PoC").

## Prodotto e UX

Scena d'uso, principi UX verificabili (P1–P10) e user story con priorità (US-01…US-33) sono in [USER-STORIES.md](USER-STORIES.md). **Le storie guidano gli step**: ogni step elenca quelle che realizza; una storia è chiusa solo quando il suo test e2e (nominato con l'ID) è verde.

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
| 9 | Impostazioni | **Tema** Sistema/Chiaro/Scuro e **unità di misura**: peso kg/lb, distanza m/ft (vedi "Unità di misura") |
| 10 | Pubblicazione | Percorso URL `/bodytracker/` sul sito personale (non è la cartella del repository; modificabile con `BT_BASE`) |
| 11 | Lingua | Interfaccia solo in italiano per ora |

Nome: **BodyTracker**.

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
- **Archivio:** `localStorage`, chiave `bodytracker.archive.v2`, dietro un modulo repository che gestisce validazione, revisioni e conflitti tra schede, sul modello del PoC.
  - All'avvio `navigator.storage.persist()`.
  - Avviso nel pannello Dati: su iOS i siti non installati possono perdere i dati dopo 7 giorni senza visite. Consigliati l'installazione e un backup periodico.
- **Test:**
  - **Vitest** per la logica pura: archivio, validazione, import del PoC, calcoli dei progressi, timer con orologio finto;
  - **Playwright** per i flussi end-to-end, con la Chromium preinstallata.
- **Qualità UI:** Impeccable installato nel repository (`npx impeccable install`) con hook del detector, più `npx impeccable detect` sui file e sulle pagine renderizzate in CI e in locale.

## Modello dati v2

Implementato allo step 2 in `src/lib/archive/types.ts` (nomi in inglese come tutto il codice; i commenti dicono il termine della palestra).

```ts
interface Archive {
  version: 2;
  revision: number;                     // incrementata a ogni salvataggio, per i conflitti tra schede
  catalog: Record<string, CustomExercise>; // esercizi personalizzati; quelli di base arrivano dal codice
  routines: Routine[];                  // schede
  schedule: Partial<Record<Weekday, string | null>>; // mon..sun -> id scheda; null = riposo, assente = niente
  overrides: Record<string, string | null>;          // eccezioni: YYYY-MM-DD -> id scheda (o riposo)
  sessions: Session[];
  settings: {
    // il tema non sta qui: è una preferenza del dispositivo, nella chiave `bodytracker.theme` (step 1)
    weightUnit: 'kg' | 'lb';
    distanceUnit: 'm' | 'ft';
    defaultRest: number;                // recupero predefinito, secondi
    sound: boolean; vibration: boolean;
  };
}

interface Routine {                     // scheda
  id: string; name: string; notes: string; archived: boolean;
  exercises: RoutineExercise[];
}
interface RoutineExercise {             // voce della scheda
  id: string;
  exerciseId: string;
  alternatives: string[];         // id esercizi
  group: string | null;           // stessa stringa = superserie
  sets: number;                   // serie target
  reps: string;                   // "6–8"
  loadMin: number | null;         // kg, convertito in visualizzazione
  loadMax: number | null;         // kg; uguale a loadMin se non è un intervallo
  loadNote: string;               // "da tarare"
  unit: string;                   // "per manubrio"
  rest: number;                   // recupero, secondi
  warmupRest: number;             // recupero di riscaldamento, secondi
}

interface Session {
  id: string; date: string; routineId: string | null; name: string;
  start: number; end: number | null;    // timestamp; end null = in corso
  exercises: SessionExercise[];
}
interface SessionExercise {
  id: string; exerciseId: string; variantOf: string | null;
  group: string | null; rest: number; warmupRest: number; notes: string;
  sets: SessionSet[];
}
interface SessionSet {                  // serie
  id: string;
  type: 'normal' | 'warmup' | 'drop' | 'failure'; // normale, riscaldamento, drop, cedimento
  kg: number | null;                     // sempre in kg, anche se l'utente usa lb
  reps: number | null;
  completedAt: number | null;            // timestamp della spunta
}

// Chiave separata `bodytracker.restTimer`, aggiornata spesso (step 7, src/lib/rest-timer.ts)
interface RestTimerState {
  sessionId: string; exerciseId: string; setId: string; // exerciseId = voce della sessione
  start: number; end: number; duration: number;          // end è la verità; duration in secondi, dopo ±15 s
  warmup: boolean; minimized: boolean; alerted: boolean; // riscaldamento, ridotto, avviso di fine già dato
}
```

**Dati iniziali**
- Il catalogo e le schede A/B del PoC (`esercizi.js`) vengono convertiti una volta in `src/data/catalog.ts` e `src/data/starter-routines.ts`. Gli ID degli esercizi restano identici, perché il tuo storico li usa. Le eventuali immagini degli esercizi vanno in `public/exercises/`.
- I recuperi come "2′" o "60–75″" vengono convertiti in secondi: per un intervallo si usa il valore minimo (es. 60–75″ → 60 s), e la scheda resta modificabile.

- Il carico di partenza del PoC (testo come "45–50 kg" o "40 kg, da tarare") viene diviso in `loadMin`, `loadMax` e `loadNote`.

## Unità di misura

Costo basso, perché la regola è unica: **i dati si salvano sempre in unità metriche** (kg, metri) e si convertono solo in ingresso e in uscita.
- `src/lib/units.ts`: `fromKg`/`toKg` e `fromMeters`/`toMeters`, più la formattazione (`formatWeight(kg, settings)` → "135 lb"), con test.
- **Peso (kg/lb):** campi serie, colonna "precedente", carichi delle schede, riepilogo, volume, record e grafici mostrano e accettano l'unità scelta.
  - Il valore digitato viene convertito in kg **senza arrotondare** il dato salvato: 135 lb restano 135 lb quando rilette.
  - L'arrotondamento è solo in visualizzazione: 0,25 kg / 0,5 lb.
  - Cambiare unità non modifica nessun dato salvato.
- **Distanza (m/ft):** l'impostazione e le funzioni di conversione esistono da subito, ma oggi **nessuna schermata usa distanze** (non ci sono esercizi cardio né misure corporee). Servirà quando verranno aggiunti esercizi a distanza (es. camminata con carico, vogatore); fino ad allora è l'unico punto senza effetto visibile, e la schermata Impostazioni lo dice.
- Export ed import restano in kg/metri, indipendenti dall'unità mostrata.

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
| Protezione tra schede: se il diario cambia altrove, blocco e richiesta di ricaricare | Uguale, con `revision` | 2 |
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
  - si cambiano toccando l'indice della serie, che apre il foglio della serie (Normale, Riscaldamento, Drop, Cedimento, "Togli serie"); fino allo step 6 il tocco passava al tipo successivo (1 → R → D → C → 1);
  - le serie di riscaldamento non hanno numero e non contano per volume, record e grafici.
- **Recupero (come Strong):**
  - la spunta di una serie avvia il recupero dell'esercizio, o quello di riscaldamento se la serie è di riscaldamento;
  - in una **superserie** il recupero parte solo dopo la serie dell'ultimo esercizio del gruppo, mentre le spunte intermedie spostano il focus all'esercizio successivo;
  - durata 0 = nessun timer;
  - togliere la spunta durante il recupero annulla il timer.
- **Varianti:** stessa regola del PoC. Se la variante ha già valori, il cambio chiede conferma e svuota le serie; lo storico tiene traccia di variante ed esercizio base.
  - Oltre alle alternative della scheda, "Altro esercizio…" accetta un nome scritto a mano. Se corrisponde (senza maiuscole, spazi e accenti) a un esercizio del catalogo si usa quello; altrimenti si crea un esercizio personalizzato in `catalogo`, riusato le volte successive. La voce di sessione ha `esercizioId` del sostituto e `varianteDi` dell'esercizio previsto.
- **Sessioni:** più sessioni nello stesso giorno sono possibili. Una sola sessione "in corso" alla volta; concludere mostra un riepilogo (durata, serie, volume, record).

## Step

### Step 0: Fondamenta del progetto
- **Storie:** conferma di storie e priorità con l'utente; ogni brief dichiara le storie e i principi che copre.
- Aggiornamento ad Astro 7 e dipendenze; rimozione di MDX e sitemap se non servono (l'app è privata e non va indicizzata, quindi `noindex`).
- Installazione di Impeccable (hook detector) e di Svelte, Vitest e Playwright (dev).
- `PRODUCT.md` in radice: `git mv` di quello del PoC (insieme a `DESIGN.md` e `design.json`, che lo step 1 aggiorna), poi aggiornato con le decisioni sopra.
- `/impeccable shape` per le superfici: Oggi, Allenamento attivo, Timer, Schede, Calendario, Storico/Progressi, Dati. I brief vanno in `.impeccable/surfaces/`.
- **Verifica:** `npm run build` verde, brief confermati da te.
- **Stato (10 ottobre 2026):** fondamenta fatte (Astro 7.3, Svelte 5, Vitest, Playwright, Impeccable 4.5.2, `noindex`, documenti di design in radice). Brief in `.impeccable/surfaces/`, indicizzati in [BRIEF.md](BRIEF.md), e revisione delle storie **confermati dall'utente** lo stesso giorno (superserie, note, approfondimento e più sessioni al giorno diventano M; spunta su riga vuota = 1 tocco).

### Step 1: Design system (chiaro e scuro)
- **Principi:** P2, P3, P9, più US-30 (temi).
- Con Impeccable: estensione del mondo del PoC a una variante chiara, scelta del font, **mossa distintiva** (il timer a tutto schermo).
- `DESIGN.md` in radice con token per entrambi i temi; token in `@theme`; temi via `prefers-color-scheme` più attributo `data-theme`.
- Componenti base:
  - pulsanti (primario, secondario, pericolo, icona), campo, campo numerico serie, selettore;
  - foglio dal basso e dialog, tab bar, barra di stato del salvataggio, stato vuoto, toast;
  - superfici del browser tematizzate (selezione, caret, focus, scrollbar).
- Pagina interna `/kit` per vedere tutti i componenti nei due temi (esclusa dal precache e dalla navigazione). Non `/_kit`: Astro non genera le pagine il cui nome comincia con `_`.
- **Verifica:** detector a 0 su `/kit` nei due temi, contrasti ≥ 4,5:1, target ≥ 44–48px.
- **Stato (10 ottobre 2026):** fatto. Scelte dell'utente: tema chiaro "guscio verde" (intestazione, barre e timer restano verde scuro), font Atkinson Hyperlegible Next, timer a **livello che si svuota**. `DESIGN.md` riscritto, token in `@theme` con `light-dark()`, componenti base in `src/components/ui/`, `/kit`, test US-30. Il tema è salvato nella chiave `bodytracker.theme` e non nell'archivio: lo script inline lo applica prima del primo disegno senza leggere il diario.

### Step 2: Dati
- **Storie:** US-02 (import PoC, logica), US-31 (unità, logica), US-33 (salvataggio, quota, conflitti).
- `src/lib/archive/`: tipi, validazione, repository (caricamento, salvataggio, revisione, quota, conflitto tra schede, evento di aggiornamento), seed dal PoC, conversione dei recuperi e dei carichi.
- `src/lib/units.ts` (conversioni e formattazione di peso e distanza).
- Import ed export v2, import del backup del PoC e lettura diretta della sua chiave.
- Conversione di `BodyTracker/palestra/esercizi.js` in `src/data/` (catalogo e schede iniziali, stessi ID).
- Rimozione del codice `bb-*` attuale.
- **Verifica:** test Vitest su validazione, import del PoC (con un tuo backup reale, se me lo fornisci, oppure uno sintetico), conflitti, quota e conversioni di unità (andata e ritorno senza perdita).
- **Stato (10 ottobre 2026):** fatto, con 129 test Vitest nuovi (135 in tutto). `src/lib/archive/`, `src/lib/units.ts`, `src/data/` e il backup sintetico in `tests/fixtures/`. Dopo la chiusura dello step, su richiesta dell'utente, **tutto il codice è passato all'inglese** (file, route, identificatori, campi del modello dati, chiavi di storage, token e classi CSS); restano in italiano i testi per l'utente, i commenti, la documentazione e gli ID degli esercizi del PoC. Decisioni prese nello step:
  - **Pianificazione ed eccezioni:** id di scheda, `null` = riposo, chiave assente = nulla di pianificato (servono tre stati: US-04 "Riposo" e il caso "nessuna pianificazione" del brief di Oggi).
  - **Conflitto tra schede:** come nel PoC non si sovrascrive mai; in più, con la revisione, una scheda **senza modifiche in sospeso** adotta il diario più recente invece di bloccarsi. Il blocco con "ricarica" resta per il conflitto vero (modifiche in entrambe) e per chi salva su una revisione superata.
  - **Schede iniziali:** il PoC non ha numero di serie né recupero di riscaldamento: **3 serie e 60 s**, modificabili. Id `routine-a`/`routine-b`, voci `a-1`, `a-2a`, …
  - **Esercizi personalizzati (US-14):** id `custom-<parole-del-nome>`, stabile (stesso nome → stesso id anche su un altro dispositivo); confronto senza maiuscole, spazi, punteggiatura e accenti; vince l'esercizio di base.
  - **Import del PoC:** il file con struttura sbagliata si rifiuta; un singolo allenamento o esercizio non valido si **scarta con il motivo** (US-02) invece di rifiutare tutto. Nomi liberi → esercizi personalizzati; un id sconosciuto resta lo stesso come personalizzato; un nome cambiato a mano nel PoC finisce nelle note (il modello v2 non ha il campo). Allenamento `A`/`B` → schede iniziali, aggiunte solo se mancano; gruppo e recuperi della voce dalla scheda. Inizio = mezzogiorno locale della data; le serie con valori di un allenamento concluso (o di un esercizio spuntato) sono completate; le serie vuote restano, non completate.
  - **Import v2:** validazione completa (un errore rifiuta il file). Unione per id con "mantieni"/"sostituisci" anche per schede, esercizi personalizzati, pianificazione ed eccezioni; impostazioni del backup solo con "sostituisci". Resta aperta una sola sessione in corso, la più recente.
  - **Unità:** campi di modifica al centesimo (135,3 lb restano 135,3), etichette al passo di 0,25 kg / 0,5 lb e 0,1 m / 0,5 ft, virgola decimale e spazio unificatore.
  - **Route in inglese:** `/welcome`, `/workout`, `/routines` e `/routine?id=`, `/calendar`, `/history`, `/session?id=`, `/exercise?id=`, `/settings`. `/workout` è oggi la pagina vecchia del giorno (`workout.astro`): allo step 6 la sostituisce l'allenamento attivo.
  - **Codice `bb-*`:** non rimosso. Le pagine vecchie ne dipendono finché gli step 3–6 non le sostituiscono; si toglie con l'ultima di esse, insieme allo smoke test.

### Step 3: Guscio dell'app e PWA
- **Storie:** US-01, US-02 (interfaccia), US-03, US-30, US-31, US-32, US-33.
- Layout mobile con tab bar in basso (Oggi, Calendario, Schede, Storico) e accesso alle impostazioni; safe area; `ClientRouter`.
- Manifest, icone, service worker con precache, registrazione con scope pari al percorso base, pagina offline non necessaria (tutto in precache).
- Impostazioni: tema (Sistema/Chiaro/Scuro, applicato prima del primo disegno per evitare il lampo di tema sbagliato), unità di peso e di distanza, recupero predefinito, suono e vibrazione, sezione Dati e privacy.
- **Verifica:** Playwright offline (contesto senza rete dopo la prima visita), nessuna richiesta a domini esterni, build con `BT_BASE=/bodytracker/` funzionante.
- **Stato (10 ottobre 2026):** fatto. Guscio (`AppLayout` con `ClientRouter`, intestazione, tab bar, barra di salvataggio nel guscio), PWA (manifest generato con il percorso base, icone, service worker con `workbox-build`), `BT_BASE`/`BT_SITE` con `appUrl()`, Impostazioni, Dati e privacy, primo avvio `/welcome`. 84 test e2e verdi sia nella radice sia con `BT_BASE=/bodytracker/`, 147 test Vitest, `astro check` pulito, detector di Impeccable a 0 sui sorgenti e sulle pagine. Decisioni prese nello step:
  - **App vecchia rimossa:** la home `bb-*` è sostituita da Oggi; la pagina del giorno e `/about` sarebbero rimaste orfane (raggiungibili solo dalla vecchia home), quindi sono state tolte insieme a `src/scripts/`, `Layout.astro` e alla grafica vecchia di `global.css`. Il testo di `/about` sulla privacy è confluito in Dati e privacy. Nessuna migrazione dei dati `bb-*` (decisione 6).
  - **Oggi e le altre tab allo step 3:** Oggi porta a `/welcome` se non c'è un archivio e conferma che il diario è pronto (schede e allenamenti); Calendario, Schede e Storico sono stati vuoti "In arrivo". Gli step 4, 5 e 8 li sostituiscono.
  - **Barra di salvataggio:** nel guscio compare **solo quando c'è un problema** (spazio esaurito con "Salva ora", conflitto con "Ricarica", archivio illeggibile con "Recupera" verso Dati e privacy), così non ruba 68px nella zona del pollice quando tutto va bene. Allo step 6 l'allenamento attivo la mostra sempre. `SaveBar` ha lo stato nuovo `unreadable`.
  - **Archivio illeggibile:** niente benvenuto (non è un primo avvio), messaggio in linea su Oggi, "Scarica il contenuto originale" in Dati e privacy, export disattivato; le preferenze del diario non si salvano finché non si importa un backup valido.
  - **Permessi:** `navigator.storage.persist()` (che in Firefox chiede un permesso) si chiama solo quando l'archivio esiste: dopo la scelta sul primo avvio, o all'apertura per chi ha già un diario. Lo stato della conservazione è scritto in Dati e privacy.
  - **Installazione (US-03):** l'evento `beforeinstallprompt` viene trattenuto; "Installa l'app" sta nelle Impostazioni (su iPhone le istruzioni per Safari). L'invito discreto **dopo il primo allenamento concluso** arriva con il riepilogo (step 6), che è dove si conclude un allenamento. Avviso dei 7 giorni su iPhone e iPad non installati.
  - **Import:** senza elementi in comune non si chiede nulla; su un diario vuoto (ripristino su un telefono nuovo) un backup v2 porta anche le sue impostazioni, altrimenti restano quelle del dispositivo. Per il PoC la scelta riguarda solo gli allenamenti, perché le sue schede A/B si aggiungono solo se mancano. Il riepilogo elenca aggiunti, sostituiti o lasciati, sessioni in corso chiuse e scartati con il motivo.
  - **Cancella tutto:** conferma con il conteggio di ciò che si perde e avviso con "Annulla"; le impostazioni restano.
  - **Ultimo backup:** chiave del dispositivo `bodytracker.lastBackup`, fuori dall'archivio (come il tema): dice quando *questo browser* ha esportato.
  - **Recupero predefinito:** valore a passi di 15 s (da 0:15 a 60:00) con due pulsanti, perché il tastierino numerico non ha i due punti di "1:30". Componenti nuovi del design system: `Stepper` e `Switch` (interruttore), in `/kit` e in DESIGN.md.
  - **Service worker:** `generateSW` con `skipWaiting` e `clientsClaim` (una versione nuova prende subito il controllo; con il `ClientRouter` le pagine nuove portano i loro chunk), `/kit` fuori dal precache, parametri della query ignorati. Le pagine si linkano con la barra finale (`/settings/`), così il precache le trova senza regole aggiuntive.
  - **Tema e `ClientRouter`:** lo scambio di pagina sostituisce gli attributi di `<html>`; lo script inline del tema li riapplica al documento nuovo su `astro:before-swap`.

### Step 4: Schede
- **Storie:** US-07, US-08, US-09, US-10.
- Elenco: crea, duplica, rinomina, archivia, elimina con conferma.
- Editor:
  - aggiungi esercizio dal catalogo (ricerca) o personalizzato;
  - riordino (frecce, accessibile; trascinamento facoltativo) e raggruppamento in superserie;
  - serie, ripetizioni, carico, unità, recupero e recupero di riscaldamento, alternative.
- **Verifica:** e2e "crea scheda C con superserie e la ritrovi dopo il ricaricamento".
- **Stato (10 ottobre 2026):** fatto. Elenco `/routines` (`RoutineList`), editor `/routine?id=` (`RoutineEditor`, `EntryEditor`), foglio del catalogo `ExercisePicker`, campo `LiveField` che salva a ogni battuta; logica pura in `src/lib/archive/routine-edit.ts`. 28 test e2e nuovi in `us-07-us-10-routines.spec.ts` (112 in tutto, verdi nella radice e con `BT_BASE=/bodytracker/`), 172 test Vitest, `astro check` pulito, detector a 0 su `src/` e su `/kit` nei due temi. Le schede A/B del PoC si ricreano identiche dall'editor (test e2e dedicato). Decisioni prese nello step:
  - **Crea:** una scheda vuota con il nome proposto ("Scheda C", la prima lettera libera) e subito l'editor, dove il nome si cambia. Nessun passaggio intermedio né campi obbligatori.
  - **Azioni di una scheda:** nell'elenco, pulsante "⋯" che apre un foglio dal basso con Modifica esercizi, Rinomina, Duplica, Archivia/Ripristina, Elimina. Rinomina avviene **in linea** nella riga (Invio salva, Esc annulla). Duplica crea "Scheda A (copia)" subito dopo l'originale e resta nell'elenco, con "Annulla". Archivia e Ripristina con "Annulla"; l'archiviata si apre in **sola lettura** con "Ripristina".
  - **Eliminare:** solo una scheda senza allenamenti (altrimenti il foglio spiega perché e propone di archiviarla); conferma che dice cosa si perde (esercizi, giorni assegnati); toglie dalla pianificazione e dalle eccezioni i giorni che la indicavano, e "Annulla" li rimette.
  - **Archiviare:** non tocca sessioni né pianificazione; `planFor` ignora già le archiviate, quindi ripristinandola torna nei suoi giorni.
  - **Riordino:** modalità "Riordina"/"Fine" con frecce da 48px, nell'elenco e nell'editor (il trascinamento resta rimandato). Il focus resta sulla freccia e la nuova posizione è annunciata. Con le superserie: una voce singola scavalca il blocco vicino senza entrarci; dentro una superserie la voce scambia il posto con la vicina; dal bordo della superserie si sposta **l'intera superserie** (l'etichetta della freccia lo dice).
  - **Superserie:** interruttore "In superserie con l'esercizio sopra" nell'editor della voce (unire la prima voce di una superserie fonde i due blocchi; separare stacca la voce e le successive del gruppo). Numerazione come sulla carta (1, 2a, 2b, 3), riga "Superserie · 2 esercizi" e un filo nella colonna dei numeri. I gruppi si normalizzano dopo ogni modifica: solo voci consecutive, almeno due; la stringa del gruppo è un numero libero ("2", come nel PoC).
  - **Voce:** chiusa si legge come la carta ("3 × 6–8 · 40 kg · rec. 1:15", poi unità, nota e numero di alternative); un tocco la apre in linea (una alla volta). Una voce nuova ha 3 serie, il recupero predefinito delle Impostazioni e 60 s di riscaldamento, e si apre da sola.
  - **Campi:** serie con il valore a passi (−1/+1); ripetizioni testo libero, "6-8" diventa "6–8"; carico "Carico" più "Fino a" facoltativo nell'unità scelta (se il carico supera il "fino a" l'intervallo si chiude sul valore nuovo; un "fino a" minore del carico è un errore che non si salva); "Il carico è" (unità, es. "per manubrio") e "Nota sul carico"; recupero e recupero di riscaldamento a passi di 15 s, con 0 = "Nessuno" (nessun timer). Note della scheda facoltative.
  - **Salvataggio:** ogni campo salva a ogni battuta (`LiveField`): mentre il campo ha il focus il testo resta com'è, fuori dal focus torna al valore salvato (normalizzato o cambiato in un'altra scheda); un testo non valido resta visibile con l'errore e non si salva.
  - **Catalogo:** foglio dal basso con ricerca (il campo ha il focus all'apertura, Invio sceglie il primo risultato), elenco completo a ricerca vuota, "Crea «…»" quando il nome non corrisponde esattamente a un esercizio (personalizzato con `ensureExercise`, US-14). Per le alternative non si propongono l'esercizio della voce né quelle già scelte; cambiando l'esercizio si può scegliere un'alternativa, che esce dall'elenco delle alternative.
  - **Elenco:** per ogni scheda numero di esercizi, giorni assegnati e "ultima volta il …" (o "mai fatta"); senza schede, stato vuoto con "Crea scheda" e "Aggiungi le schede di esempio".

### Step 5: Calendario e Oggi
- **Storie:** US-04, US-05, US-06, US-11.
- Calendario:
  - settimana scorrevole e vista mese compatta;
  - assegnazione di una scheda a ogni giorno della settimana, eccezione per una singola data (scheda diversa o riposo);
  - stati del giorno: pianificato, fatto, saltato, oggi.
- Oggi: le ultime 4 schede fatte (più quella pianificata) come righe da toccare, con la suggerita già selezionata (la pianificata, altrimenti la recente fatta da più tempo; decisione confermata il 10 ottobre 2026, logica in `quickStart` dallo step 2) e "Inizia allenamento" nella zona del pollice: 1 tocco nel caso felice, 2 al massimo; alternative (altra scheda, allenamento libero); "Riprendi" se c'è una sessione in corso; ultimo allenamento.
- **Verifica:** e2e "pianifico B il giovedì → giovedì Oggi propone B".
- **Stato (10 ottobre 2026):** fatto. Calendario `/calendar` (`Calendar`, `DaySheet`, `WeekStrip`), Oggi riscritta (`Today`), segnaposto `/workout`; logica pura in `src/lib/archive/calendar.ts` e `sessions.ts`. 144 test e2e verdi nella radice e con `BT_BASE=/bodytracker/` (nuovi `us-04-us-06-calendar` e `us-11-us-17-today`, con `page.clock`), 195 Vitest, `astro check` pulito, detector a 0 su `src/`, `/calendar`, `/workout` e `/kit` nei due temi. Decisioni prese nello step (da confermare con l'utente):
  - **Avvio:** "Inizia allenamento" crea subito la sessione vera (`startSession`: una voce per esercizio con superserie e recuperi della scheda, tante serie vuote quante le serie target) e porta a `/workout`, che fino allo step 6 è un **segnaposto onesto**: programma della scheda con i target, "Torna a Oggi", "Annulla allenamento" (con "Annulla"; conferma se ci sono valori) e "Concludi" solo se la sessione ha già valori (sessioni aperte importate dal PoC). Una sessione vuota non si conclude, così il calendario non mostra "fatto" senza serie.
  - **Oggi:** striscia della settimana in alto (tocco → foglio del giorno nel Calendario), data e cosa prevede ("In programma: Scheda A", "Oggi riposo", "Niente in programma · Pianifica la settimana"), righe a scelta singola con la suggerita selezionata, "Altra scheda" (solo se ci sono altre schede attive: il foglio seleziona e chiude, la scheda scelta diventa una riga in più) e "Allenamento libero" come pulsanti testuali, "Inizia allenamento" appiccicato sopra la tab bar, ultimo allenamento (link al giorno nel calendario; i record arrivano con lo step 8). Una sola azione primaria per stato: "Riprendi allenamento" con una sessione in corso (le righe spariscono; durata, esercizio corrente e serie fatte; "iniziato l’8 settembre" se è rimasta aperta da un altro giorno), "Allenati comunque" nel giorno di riposo, "Nuovo allenamento" con "Fatto oggi: … · Riapri" se oggi c'è già una sessione conclusa, "Allenamento libero" senza schede attive.
  - **Suggerita:** come allo step 2, più una regola: una scheda già conclusa nella data non si suggerisce di nuovo (seconda sessione del giorno, US-20).
  - **Calendario:** segmentato Settimana/Mese; settimana con una riga per giorno (giorno e numero, scheda o ciò che si è fatto, stato con icona e testo); dall'inizio dello storico fino a 26 settimane avanti; mese come tabella con un segno per giorno e legenda. Stati: fatto (anche in un giorno di riposo o senza piano), in corso, saltato (giorno passato con una scheda e nessuna sessione), in programma ("Da fare" oggi), riposo, niente.
  - **Foglio del giorno:** per ogni data, passata o futura, gli allenamenti di quel giorno e "In programma" con le scelte "Come la settimana tipo (…)", "Riposo, solo per questa data" e le altre schede attive "solo per questa data". Anche le date passate accettano un'eccezione: è il modo di dire "giovedì l'ho spostato", così il giorno non risulta saltato. Scegliere lo stesso valore della settimana tipo toglie l'eccezione. "Cambia la settimana tipo" porta al `select` di quel giorno.
  - **Settimana tipo:** sezione in fondo al Calendario con un `select` nativo per giorno (Niente, Riposo, schede attive), salvato a ogni scelta; avviso in linea se un giorno indica una scheda archiviata o sparita; senza pianificazione un avviso in testa al Calendario e "Pianifica la settimana" in Oggi.

### Step 6: Allenamento attivo
- **Storie:** US-11…US-20.
- Elenco esercizi con target della scheda, selettore variante, approfondimento dal catalogo.
- Righe serie `tipo/n · precedente · kg|lb · rip · ✓` (intestazione e valori nell'unità scelta), aggiungi o rimuovi serie, note.
- Aggiungi esercizio durante la sessione; riordino.
- Barra fissa con durata della sessione e stato del salvataggio; "Termina" con riepilogo; sessione riapribile dallo storico.
- Mini-barra persistente (`transition:persist`) quando si naviga altrove.
- **Verifica:** e2e di una sessione completa da scheda, con ricaricamento a metà; viewport 320, 390, 430 e desktop; conteggio dei tocchi per serie (P1). **Prova reale in palestra** dell'utente sul proprio telefono con la checklist di USER-STORIES.md §5, e correzioni prima dello step 7.

- **Stato (10 ottobre 2026):** fatto, in attesa della prova reale in palestra. Allenamento attivo in `src/components/workout/` (`Workout`, `WorkoutExercise`, `VariantSheet`, `ExerciseDetailsSheet`, `SessionSummary`), mini-barra `src/components/shell/WorkoutMiniBar.svelte`, logica pura in `src/lib/archive/workout.ts`, stack delle barre in `src/lib/bottom-bars.ts`; il segnaposto dello step 5 è stato tolto. 54 test e2e nuovi in `us-12-us-20-workout.spec.ts` (198 in tutto, verdi nella radice e con `BT_BASE=/bodytracker/`), 213 Vitest, `astro check` pulito, detector a 0 su `src/`. Decisioni prese nello step (da confermare con l'utente):
  - **Precedente:** l'esercizio nell'ultima sessione **conclusa prima di questa** (data, poi ora d'inizio) con lo stesso esercizio, cioè la stessa variante, e almeno un valore. Le serie si confrontano per posizione **separatamente** tra riscaldamento e serie di lavoro: aggiungere un riscaldamento non sposta i confronti.
  - **Spunta (P1):** i campi vuoti prendono il precedente (anche uno solo: scrivere solo le ripetizioni tiene il peso della volta scorsa). Servono le ripetizioni; il peso può mancare (corpo libero). Senza valori il cursore va al primo campo vuoto. Ogni battuta salva (come `LiveField`): un numero non valido resta visibile con il bordo d'errore e non si salva. Invio nel peso passa alle ripetizioni.
  - **Serie da fare adesso:** si resta sul blocco dell'ultima serie spuntata finché ha serie da fare, poi il blocco successivo, poi quelli saltati; in superserie tocca all'esercizio con meno serie fatte (2a, 2b, 2a…). Il numero dell'esercizio diventa una pastiglia piena e, dopo la spunta, la riga successiva scorre in vista solo se è fuori schermo. `currentExercise` (Oggi, mini-barra) usa la stessa regola.
  - **Esercizio fatto:** si compatta in una riga con le serie fatte e "Mostra serie"; l'ultimo toccato resta aperto per correggere.
  - **Varianti:** "Cambia esercizio" sempre visibile sotto i target (anche senza alternative, per "Altro esercizio…"); foglio con l'esercizio previsto, le alternative della voce e "Altro esercizio…" con i nomi simili. Con valori già inseriti conferma "Cambia e svuota": restano numero e tipo delle serie, si svuotano i valori; la nota resta. Con una variante i target mostrano serie, ripetizioni e recupero ma non il carico (era per l'esercizio previsto), più "Al posto di …". I target vengono dalla voce della scheda trovata per esercizio previsto (`plannedEntry`), quindi reggono riordini e varianti.
  - **Serie:** "Aggiungi serie" riprende il peso dell'ultima; "Togli serie" toglie **l'ultima** (con "Annulla" se aveva valori; ne resta almeno una). Nessuna rimozione per riga: una sesta colonna non entra a 320px e lo swipe non può essere l'unico modo. *Cambiato allo step 7 su decisione dell'utente:* si toglie **qualsiasi serie** dal foglio della serie (vedi lo stato dello step 7).
  - **Esercizi:** aggiunti dal catalogo (o con un nome nuovo, personalizzato) con tante serie e dello stesso tipo dell'ultima volta e i suoi recuperi, altrimenti 3 serie e il recupero predefinito. "⋯" per esercizio: nota sul carico, come si esegue, cambia esercizio, togli dall'allenamento (con "Annulla", senza conferma). Riordino con "Riordina esercizi" e frecce, come nelle schede.
  - **Note sul carico:** campo sotto le serie quando c'è una nota (si apre dal "⋯"); la nota della volta scorsa compare sotto i target ("Nota del 6 ottobre: «…»").
  - **Nome, data, annullamento:** in fondo alla pagina, "Nome e data" apre i campi in linea (niente modali per inserire dati); "Annulla allenamento" con conferma se ci sono valori, con "Annulla".
  - **Barra dell'allenamento:** sempre visibile sopra la tab bar (che resta, con "Oggi" attiva): durata in minuti (non un orologio che scorre), stato breve "Salvato" e "Termina"; in errore o conflitto l'azione diventa "Salva ora"/"Ricarica". La barra del guscio (`ArchiveStatus`) su `/workout` non compare.
  - **Termina:** senza conferma, perché il riepilogo ha "Riapri allenamento". Regola nuova in `finishSession`: oltre ad almeno un esercizio (PoC) serve almeno un valore, così il calendario non segna "fatto" un allenamento vuoto. Il riepilogo è `/workout?summary=<id>` (sostituisce la voce nella cronologia, regge il ricaricamento): durata e orari, esercizi con almeno una serie fatta, serie di lavoro (più quelle di riscaldamento a parte), volume (kg × rip delle serie di lavoro fatte), **record di carico** (carico massimo oltre quello delle sessioni precedenti con la stessa variante; 1RM e volume arrivano con lo step 8) e cosa si è fatto per esercizio. Lo stesso record è segnato con un trofeo nella riga serie alla spunta (US-29).
  - **Installazione (US-03):** l'invito compare solo nel riepilogo del **primo** allenamento concluso, solo se l'app non è già installata e se si può fare qualcosa (richiesta del browser trattenuta, o istruzioni su iPhone e iPad).
  - **Mini-barra (US-17):** nello stack in basso, sopra la tab bar, con `transition:persist`; nascosta sull'allenamento e su Oggi (che ha già "Riprendi allenamento"). Lo stack in basso è ora una somma di barre dichiarate (`setBottomBar`).
  - **Approfondimento (US-19):** il catalogo non ha ancora testi; il foglio lo dice e mostra cosa si è fatto l'ultima volta. Immagini solo locali (`public/exercises/`) o raster incorporate, fonti solo http(s), come nel PoC.
  - **Chiusura con modifiche non salvate:** avviso `beforeunload` globale, nello store dell'archivio.

### Step 7: Timer di recupero
- **Storie:** US-21…US-26.
- Overlay a tutto schermo:
  - conto alla rovescia grande con cifre tabulari, progresso;
  - −15 s, +15 s, Salta, Riduci (diventa barra);
  - anteprima della prossima serie (esercizio, kg × rip attesi).
- Motore:
  - basato su `end` (timestamp), persistito nella sua chiave, ricalcolato a `visibilitychange`;
  - wake lock durante la sessione;
  - suono con `AudioContext` sbloccato dal tocco della spunta; `navigator.vibrate` dove disponibile;
  - `aria-live` a 30 s, 10 s e alla fine; `prefers-reduced-motion`.
- **Predisposizione Web Push:**
  - interfaccia `RestNotifier { schedule(timer): Promise<void>; cancel(id): Promise<void> }` con implementazione locale (in primo piano);
  - handler `push` e `notificationclick` già presenti nel service worker;
  - documento con il contratto di un futuro endpoint (`POST {subscription, fine}`). Nessun server.
- **Verifica:** Vitest con timer finti; e2e con `page.clock` (spunta → overlay → +15 s → fine → chiusura); prova manuale su iPhone e Android, con una checklist nel documento; **seconda prova reale in palestra** focalizzata su timer, interruzioni e leggibilità.

- **Stato (10 ottobre 2026):** fatto, in attesa delle prove reali (palestra dello step 6, rimandata dall'utente, più quella dello step 7, e prova manuale su iPhone e Android con la checklist di [WEB-PUSH.md](WEB-PUSH.md)). Motore in `src/lib/rest-timer.ts` (logica pura) e `src/lib/rest-timer.svelte.ts` (store), avvisi in `src/lib/rest-alert.ts`, schermo acceso in `src/lib/wake-lock.ts`, `RestNotifier` in `src/lib/rest-notifier.ts`, handler `push` e `notificationclick` in `public/sw-push.js`; viste `RestTimer` (schermo intero) e `RestTimerBar` (ridotto), isola globale `RestTimerHost` nel guscio. 19 test Vitest nuovi, a orologio finto (232 in tutto), 17 test e2e nuovi in `us-21-us-26-rest-timer.spec.ts` con `page.clock` più uno per togliere una serie in mezzo (234 esecuzioni in tutto, verdi nella radice e con `BT_BASE=/bodytracker/`), `astro check` pulito, detector a 0 su `src/`.
  - **Esito della prova dello step 6 e decisioni aperte (risposte dell'utente del 10 ottobre 2026):** prova in palestra non ancora fatta (si farà insieme a quella del timer). Decisione 1 cambiata: **"Togli" su ogni riga**. Confermate le raccomandazioni sulle altre: "Termina" senza conferma, tab bar visibile durante l'allenamento, durata in minuti, "Cambia esercizio" sempre visibile, peso facoltativo alla spunta; mini-barra su Oggi **solo con un recupero in corso**.
  - **Togli serie su ogni riga:** il tocco sul numero della serie apre un foglio dal basso con il tipo (Normale, Riscaldamento, Drop, Cedimento, con la sigla e la scelta attuale segnata) e "Togli serie" (con "Annulla" se aveva valori; spento con una serie sola, e il foglio dice perché). Il pulsante "Togli serie" sotto le righe non c'è più. Cambiare tipo costa ora 2 tocchi invece di 1–3, ma ogni tipo ha il suo nome e la rimozione sta dove sta la serie.
  - **Quando parte:** alla spunta riuscita (non a quella che porta al campo vuoto). Recupero di riscaldamento per una serie di riscaldamento; 0 = nessun timer. **Superserie:** il giro continua (nessun recupero) se un altro esercizio del blocco ha meno serie fatte e ne ha ancora da fare; altrimenti parte il recupero dell'esercizio appena spuntato. Una spunta che non avvia un recupero chiude quello in corso (si è ripreso a lavorare); una nuova spunta sostituisce il recupero in corso.
  - **Recupero predefinito:** ogni voce ha un recupero numerico; il predefinito delle Impostazioni si applica quando nasce una voce senza recupero (voce nuova di una scheda, esercizio aggiunto in sessione o nell'allenamento libero, e ora anche una voce del PoC con recupero mancante o illeggibile, che prima diventava 0 = nessun timer). Cambiare il predefinito non tocca le voci già create.
  - **Annullamento:** il timer non vale più (e sparisce) quando la serie perde la spunta, viene tolta, cambia variante, o la sessione si conclude o si annulla, anche da un'altra scheda del browser: lo store lo verifica a ogni modifica dell'archivio.
  - **Motore:** l'istante di fine è la verità, salvato nella chiave `bodytracker.restTimer` a ogni cambiamento (avvio, ±15 s, riduci, avviso dato); scatti di 250 ms e ricalcolo a `visibilitychange`; evento `storage` per le altre schede. −15 s non porta mai la fine nel passato: con meno di 15 s chiude il recupero. La durata nell'intestazione segue ±15 s ("Recupero · 2:15").
  - **Fine:** "Vai" lime con "Adesso" e la serie; si chiude da solo dopo 6 s **in vista** (con la pagina nascosta aspetta il rientro). Al rientro a recupero finito l'intestazione dice "Recupero finito da 1:20". Suono e vibrazione una volta sola, solo se la fine arriva entro un minuto (niente suono fuori tempo dopo lo schermo bloccato).
  - **Suono:** tre toni brevi (880, 880, 1320 Hz) generati con `AudioContext`, sbloccato dalla spunta; vibrazione `[200, 100, 200, 100, 400]` ms. Seguono gli interruttori delle Impostazioni.
  - **Schermo acceso:** wake lock per tutto l'allenamento in corso (non solo durante il recupero, come dice US-24), richiesto di nuovo al rientro, rilasciato alla fine dell'allenamento.
  - **Ridotto:** "Riduci", l'icona in alto o Esc. Sull'allenamento la barra sta sopra la barra dell'allenamento; sulle altre pagine sostituisce la mini-barra, con una freccia a destra per tornare all'allenamento (il tocco sulla barra riapre lo schermo intero lì dove si è). Ridotto resta ridotto tra le pagine e dopo una ricarica; una nuova spunta riapre lo schermo intero.
  - **Prossima serie:** esercizio, "serie N" o "riscaldamento", peso × ripetizioni: i valori già scritti nella riga, altrimenti la volta scorsa, altrimenti i target della scheda (non il carico della scheda per una variante). All'ultima serie: "Ultimo esercizio · Quando hai finito, Termina".
  - **Annunci:** a 30 s, 10 s e alla fine, anche con il timer ridotto; dopo un salto (rientro) solo l'ultima soglia superata.
  - **Isola globale:** il timer vive nel guscio (`RestTimerHost`, `transition:persist`), così si apre su qualsiasi pagina; la finestra resta montata e chiudendola il focus torna alla spunta.
  - **Web Push:** solo predisposizione (interfaccia, handler nel service worker, contratto e checklist in [WEB-PUSH.md](WEB-PUSH.md)); nessun permesso chiesto, nessun server.
  - **Test dello step 6:** le schede di quei test non hanno recupero (`rest: 0`), perché spuntano più serie di fila; il recupero ha la sua suite.

### Step 8: Storico e progressi
- **Storie:** US-27, US-28, US-29.
- Storico per data (lista più accesso dal calendario), dettaglio sessione modificabile, eliminazione con conferma.
- Pagina esercizio:
  - grafici di **carico massimo**, **1RM stimato** (Epley, solo serie normali con ripetizioni ≤ 12) e **volume per sessione**, con selettore di periodo;
  - record personali e cronologia delle serie.
- Grafici in **SVG scritto a mano** dentro componenti Svelte: nessuna libreria esterna, tematizzabili e offline. Si seguono le linee guida della skill dataviz al momento dell'implementazione.
- **Verifica:** Vitest sui calcoli (riscaldamento escluso, varianti separate), e2e sulla pagina esercizio con dati seed.

### Step 9: Rifinitura, eliminazione del PoC e rilascio
- **Storie:** tutte le M con test verde; critique di Impeccable sui flussi principali di USER-STORIES.md §4.
- Impeccable: `critique`, `audit`, `harden` (stati vuoti, errori, nomi lunghi, quota piena, conflitto tra schede), `polish`.
- Verifica della tabella "Assorbimento del PoC": ogni riga deve avere un test e2e verde.
- **Eliminazione di `BodyTracker/`** (resta nella cronologia git). Le parti ancora utili di `LEGGIMI.md` (privacy, limiti, aggiunta di approfondimenti al catalogo) confluiscono nel `README.md`.
- Aggiornamento di `AGENTS.md` e `README.md` (comandi, pubblicazione in un percorso del sito, privacy, catalogo).
- **Verifica:** detector a 0 su tutte le pagine nei due temi, suite Playwright verde, Lighthouse PWA/accessibilità, build con base `/bodytracker/` provata con un server statico, nessun riferimento residuo a `BodyTracker/` nel repository.

## Rischi e punti da verificare

- **iOS:** wake lock nelle app installate (bug risolto in 18.4 secondo una fonte), sblocco dell'audio, assenza di vibrazione. Va provato su un iPhone reale prima di chiudere lo step 7.
- **Perdita di dati su iOS** per i siti non installati: va mitigata con l'invito all'installazione, `storage.persist()` e il promemoria di backup.
- **I tuoi dati nel PoC:** vivono nel browser in cui usi il PoC pubblicato, non nel repository. Prima di dismettere il PoC pubblicato, esporta un backup da "Dati e privacy". La lettura diretta funziona solo se la nuova app è pubblicata sullo stesso dominio del PoC.
- **Ambito:** grafici e tipi di serie aumentano il lavoro degli step 6 e 8. Il riordino con trascinamento è il candidato da rimandare se serve. Le superserie no: nelle schede reali 6 esercizi su 8 sono in superserie, e sono M (confermato, vedi [BRIEF.md](BRIEF.md)).
