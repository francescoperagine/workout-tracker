# BodyTracker

Diario di palestra statico, in italiano, senza build, account, backend, librerie remote o analytics. Gli allenamenti vengono salvati automaticamente nel `localStorage` del browser. Ogni visitatore usa il proprio archivio.

## Pubblicazione sul tuo sito

1. Nel pacchetto, la cartella `palestra/` contiene i cinque file dell’app. Copia questa cartella nella parte pubblica del tuo sito.
2. Mantieni insieme `index.html`, `stile.css`, `app.js`, `esercizi.js` e `favicon.svg`; puoi rinominare la cartella.
3. Apri `https://tuo-dominio.it/palestra/` nel browser del telefono. Puoi aggiungere un collegamento alla schermata Home.

Non serve eseguire npm, compilare, configurare un database o creare credenziali. Le risorse usano percorsi relativi: il pacchetto funziona anche in una sottocartella. Non cambiare `app.js` in uno script di tipo module senza aggiornare il caricamento del catalogo.

Per un sito Vue/Vite, puoi copiare l'intera cartella in `public/palestra/`; verrà pubblicata come pagina autonoma. Assicurati che la regola SPA non riscriva le richieste ai file di questa cartella. Per WordPress, carica la cartella tramite FTP o il gestore file: non incollare gli script nell'editor dei post. Su un hosting con indice automatico, `index.html` deve essere il documento predefinito della cartella.

Il contesto del prodotto e il sistema visivo (`PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`) sono stati spostati nella radice del repository, dove li legge Impeccable. La cartella `palestra/` è l’unica da caricare sul sito.

## Uso

- Inizia dalla scheda A, B o da un allenamento libero. Più allenamenti possono avere la stessa data.
- Cambia data e nome, aggiungi esercizi dal catalogo oppure scrivi un nome libero.
- Inserisci peso e ripetizioni; i numeri decimali dei pesi sono ammessi. Indica nelle note se il peso è totale, per manubrio, aggiunto o riferito a una macchina.
- Aggiungi serie: viene ripreso il peso della precedente, ma le ripetizioni restano vuote.
- Per gli esercizi delle schede puoi scegliere una variante. Se ci sono già valori, il cambio richiede conferma e svuota le serie di quell'esercizio. Per conservare entrambe le varianti, aggiungi un secondo esercizio.
- Il segno di spunta indica che hai completato l'esercizio; puoi concludere e riaprire la sessione. Lo storico permette di modificare anche le sessioni concluse.
- Tocca il nome per aprire la scheda di approfondimento della variante selezionata.
- Esporta periodicamente da **Dati e privacy**. L'importazione valida tutto il file e unisce i diari, lasciando scegliere come trattare gli identificativi già presenti.

Il salvataggio avviene a ogni modifica valida: controlla la dicitura **Salvato su questo dispositivo**. Se il browser non consente di salvare o lo spazio è esaurito, esporta subito il diario; le modifiche aperte restano in memoria fino alla chiusura. Il pulsante “Salva ora” consente di riprovare.

## Privacy e limiti

- Gli allenamenti non vengono inviati a nessun server. Il pacchetto non include font remoti, librerie esterne, statistiche o richieste API.
- Il caricamento iniziale della pagina usa il normale server del tuo sito. Il sito ospitante potrebbe registrare accessi o includere script propri: ciò non è controllato da BodyTracker.
- I dati appartengono all'origine del sito (protocollo + dominio + porta), non alla singola sottocartella. Due copie sullo stesso dominio condividono l'archivio se usano la stessa chiave `bodytracker.archivio.v1`. Per diari separati modifica `chiaveArchivio` in `app.js` prima della prima pubblicazione.
- Un altro browser, dispositivo, sottodominio o il passaggio da HTTP a HTTPS ha un archivio diverso: trasferisci i dati con esportazione/importazione.
- Cancellando i dati del sito si perde l'archivio; in navigazione privata può sparire alla chiusura. Non è sincronizzato o cifrato dall'app; gli script della stessa origine possono leggere localStorage. Pubblica su HTTPS e mantieni sicuro il sito.
- L'archivio locale ha una capacità finita. Il codice segnala l'errore di quota senza dichiarare un salvataggio riuscito. Il backup JSON è leggibile: non condividerlo se contiene dati personali.
- Se modifichi il diario contemporaneamente in due schede, la seconda richiede il ricaricamento invece di sovrascrivere silenziosamente.
- Il pacchetto non include un service worker: una pagina già caricata funziona senza rete, ma la riapertura offline dipende dalla cache del browser e non è garantita.
- Il diario della precedente versione ospitata con ChatGPT non viene importato automaticamente. Il nuovo formato usa campi italiani e `versione: 1`.

## Aggiungere approfondimenti

Modifica `esercizi.js`. Ogni esercizio e variante ha un ID stabile e i campi:

```javascript
window.catalogoEsercizi['squat-bilanciere'] = {
  id: 'squat-bilanciere',
  nome: 'Squat bilanciere',
  descrizione: '',             // Testo semplice, senza HTML.
  immagine: 'immagini/squat.webp',
  testoAlternativo: '',        // Descrizione accessibile dell'immagine.
  passaggi: [],                // Elenco di testi per l'esecuzione.
  attenzione: '',              // Note o precauzioni verificate.
  fonti: []                    // Es. { titolo: 'Titolo', url: 'https://...' }.
};
```

Questo è un esempio di struttura, non un contenuto tecnico già verificato. Aggiungi spiegazioni corrette e immagini per cui hai i diritti. La scheda non presenta consigli medici generati o informazioni inventate: gli approfondimenti sono inizialmente vuoti.

Metti le immagini nella cartella locale `immagini/`. Sono accettati percorsi relativi semplici (PNG, JPG, WebP, AVIF, GIF) o immagini raster incorporate; immagini su domini esterni e SVG incorporati non sono caricati. I collegamenti alle fonti si aprono solo su azione dell'utente.

Per nuove voci aggiungi una proprietà a `window.catalogoEsercizi`: comparirà nei suggerimenti “Aggiungi esercizio”. Per creare alternative modifica `window.schedeIniziali`. Gli ID esistenti non vanno cambiati: lo storico li usa per riconoscere le varianti e associare gli approfondimenti. Le nuove indicazioni del catalogo non riscrivono i nomi o i carichi degli allenamenti passati.

## Sorgenti e design

- `index.html`: struttura, navigazione e finestra accessibile nativa.
- `stile.css`: sistema visivo responsive e stati di interazione.
- `app.js`: registrazione, salvataggio, storico, validazione e backup.
- `esercizi.js`: catalogo e modelli A/B.

La costruzione segue la skill Impeccable di https://github.com/pbakaus/impeccable, conservando l'identità del diario iniziale. Impeccable è una guida di progettazione, non una dipendenza necessaria per eseguire l'app.

## Controlli eseguiti

Verificati con Chromium: salvataggio e riapertura, aggiunta delle serie, annullamento del cambio variante, esercizi liberi, apertura delle schede, storico, esportazione e ripristino, file JSON non valido, deduplicazione degli allenamenti, indicazioni della scheda B, assenza di richieste a domini esterni. Verificati layout a 320, 390 e 1440 pixel; a 390×844 i primi campi peso e ripetizioni sono visibili sopra la barra del salvataggio. Verificati anche l'errore di quota dello storage e la conservazione dei valori in memoria. Nessun allenamento di prova viene distribuito nel pacchetto.
