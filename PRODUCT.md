# BodyTracker
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Confermato: app **Astro 7** statica nella radice del repository, con isole **Svelte 5** per le parti con stato (allenamento attivo, timer, editor delle schede, grafici), **Tailwind CSS 4** con token in `@theme`, PWA con service worker generato da `workbox-build`. Test con Vitest (logica) e Playwright (flussi). Codice in TypeScript; testi dell'interfaccia in italiano. Il PoC statico in `BodyTracker/` è la specifica delle funzioni da assorbire e verrà eliminato a fine restyling.

## Users
- **Primario:** il proprietario del sito, in palestra, con il telefono in mano **tra una serie e l'altra** (60–120 s di recupero), spesso in piedi, con una mano libera e le mani sudate o con magnesite. Segue schede proprie (oggi A/B, con varianti per le macchine occupate). Vuole sapere cosa fare adesso, cosa ha fatto la volta scorsa, registrare senza pensarci e vedere se progredisce.
- **Secondario:** chi visita il sito e prova l'app per sé. Arriva senza dati e senza account e deve capire in pochi secondi che i dati restano sul suo telefono.
- **Fuori ambito:** allenatori con più atleti, social, sincronizzazione tra dispositivi, piani generati automaticamente, consigli medici.

## Product Purpose
Diario di allenamento con i pesi, privato e offline: pianificare le schede sulla settimana, avviare l'allenamento del giorno con un tocco, registrare ogni serie (peso, ripetizioni, tipo) vedendo il valore della volta scorsa, recuperare il tempo giusto con un timer a tutto schermo, ritrovare e correggere lo storico, vedere i progressi per esercizio. Successo: una serie registrata in 1 tocco quando si ripete la volta scorsa (la spunta conferma il precedente), e nessun dato mai perso.

## Positioning
Il flusso essenziale di Strong (riga serie con "precedente", spunta che avvia il recupero), ma come web app installabile che **non manda nulla a nessun server**: niente account, niente abbonamento, niente statistiche, tutto nel browser e funzionante offline. In più, le **varianti per esercizio** con carichi separati, per quando la macchina è occupata.

## Operating Context
- Sala pesi con luce variabile: zone luminose, penombra, schermo al sole vicino a una finestra. Serve leggibilità in tema chiaro e scuro.
- Rete scarsa o assente in palestra: dopo la prima visita tutto deve funzionare offline.
- Interruzioni continue: notifiche, macchina occupata, chiacchiere, schermo che si spegne. Chiudere, bloccare o ricaricare deve riportare esattamente alla sessione e al timer in corso.
- Uso principale da telefono (riferimento 390×844, minimo 320×568), anche installata sulla schermata Home; desktop per pianificare e rivedere lo storico.
- Pubblicata nel percorso `/bodytracker/` del sito personale (configurabile con `BT_BASE`/`BT_SITE`), in futuro su un dominio proprio.

## Capabilities and Constraints
- **Funzioni v1:** primo avvio con schede di esempio o da zero; schede con esercizi dal catalogo o liberi, serie, ripetizioni e carichi target (anche intervalli), recupero e recupero di riscaldamento, alternative, superserie; pianificazione settimanale con eccezioni per singola data; allenamento attivo con colonna "precedente", spunta per serie, tipi di serie (normale, riscaldamento, drop, cedimento), varianti, note sul carico, approfondimento dell'esercizio; timer di recupero a tutto schermo (−15 s, +15 s, Salta, Riduci); riepilogo di fine sessione con record; storico modificabile; grafici dei progressi (carico massimo, 1RM stimato, volume); impostazioni di tema, unità, recupero predefinito, suono e vibrazione; esportazione, importazione e import del backup del PoC.
- **Dati:** solo nel `localStorage` del browser (chiave `bodytracker.archivio.v2`), con validazione, revisione per i conflitti tra schede, gestione dell'errore di quota e `navigator.storage.persist()`. Nessun backend, database, account, API, font remoti o statistiche. I dati non vanno inviati da nessuna parte.
- **Unità:** peso in kg o lb, distanza in m o ft, scelte nelle impostazioni. I dati si salvano sempre in kg e metri; l'arrotondamento è solo in visualizzazione. Oggi nessuna schermata usa distanze.
- **Avvisi del timer:** garantiti solo con l'app aperta (suono, vibrazione dove disponibile, schermo acceso con wake lock). Con l'app chiusa nessuna garanzia: c'è solo la predisposizione per un futuro Web Push, senza server.
- **iOS:** i siti non installati possono perdere i dati dopo 7 giorni senza visite; nessuna vibrazione; l'audio richiede un gesto. L'app invita all'installazione e al backup.
- **Import:** il formato del PoC (`bodytracker.archivio.v1`, campi in italiano, `versione: 1`) resta supportato come formato di importazione. Nessuna migrazione dal vecchio formato `bb-*`.
- **Limiti:** 100 esercizi per sessione, 100 serie per esercizio, lunghezze massime dei testi, file di import fino a 10 MB e 10.000 allenamenti.
- **Lessico:** "scheda", "serie", "ripetizioni", "recupero", "riscaldamento", "variante", "superserie", "precedente", "carico". Interfaccia solo in italiano.

## Brand Commitments
Nome **BodyTracker**. Interfaccia in italiano. UX e grafica progettate con Impeccable. Il mondo visivo è quello del PoC (verde, operativo), esteso a un tema chiaro e uno scuro con scelta Sistema/Chiaro/Scuro: il guscio resta verde scuro in entrambi, il font è Atkinson Hyperlegible Next, la mossa distintiva è il timer a livello che si svuota. I dettagli visivi sono in `DESIGN.md`.

## Evidence on Hand
- Schede reali A/B e catalogo esercizi con ID stabili in `BodyTracker/palestra/esercizi.js` (`window.schedeIniziali`, `window.catalogoEsercizi`). Gli ID non vanno cambiati: lo storico dell'utente li usa.
- Gli approfondimenti del catalogo sono **vuoti**: non ci sono descrizioni, immagini o fonti verificate. Non vanno inventati testi tecnici o consigli medici.
- Nessun backup reale dell'utente è ancora disponibile per provare l'import del PoC; fino ad allora si usa un backup sintetico.
- Ricerche su concorrenti (Strong, Hevy) e vincoli del timer sul web in `docs/restyling/ANALISI.md`; scena d'uso, principi e user story in `docs/restyling/USER-STORIES.md`.

## Product Principles
- **Usabile con una mano, tra una serie e l'altra:** le azioni frequenti stanno nella zona del pollice e costano pochissimi tocchi.
- **Cosa fare adesso, sempre in vista:** esercizio corrente, target e precedente senza scorrere né aprire menu.
- **Mai perdere dati:** salvataggio a ogni modifica con stato visibile, nessuna sovrascrittura silenziosa, azioni distruttive annullabili o confermate, ripresa esatta dopo un'interruzione.
- **Distinguere i carichi delle varianti diverse:** "precedente", record e grafici sono per variante.
- **Privata e sempre disponibile:** offline dopo la prima visita, nessuna richiesta esterna.

## Accessibility & Inclusion
Contrasto AA in entrambi i temi, anche per testo secondario e placeholder; target di almeno 48px per le azioni frequenti; cifre di peso e ripetizioni grandi e tabulari, timer leggibile a braccio teso; navigazione da tastiera e screen reader; `prefers-reduced-motion`; annunci del timer solo a soglie (30 s, 10 s, fine). Nessun gesto come unico modo per un'azione.
