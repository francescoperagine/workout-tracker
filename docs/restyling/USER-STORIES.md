# BodyTracker: scena d'uso, principi UX e user story

Base di prodotto per il restyling. Le storie derivano dalle decisioni in [PIANO.md](PIANO.md) e dal PoC. Sono state **confermate dall'utente il 10 ottobre 2026**, insieme ai brief di Impeccable (vedi [BRIEF.md](BRIEF.md) §3–4 per le decisioni). Ogni storia ha un ID (`US-xx`) da riportare nei brief, nei commit e nei nomi dei test e2e.

## 1. Chi la usa e in che situazione

**Utente principale: il proprietario del sito.**
- Si allena in palestra con schede proprie (oggi A/B, con varianti per le macchine occupate) e usa il telefono **tra una serie e l'altra**: 60–120 s di recupero, spesso in piedi e con una mano libera, mani sudate o con magnesite.
- Luce variabile (sala pesi luminosa, zone in penombra, schermo al sole vicino a una finestra).
- Rete scarsa o assente in palestra.
- Interruzioni continue: notifiche, macchina occupata, chiacchiere, schermo che si spegne.
- Vuole sapere **cosa fare adesso** e **cosa ha fatto la volta scorsa**, registrare senza pensarci e vedere se sta progredendo.

**Utente secondario: chi visita il sito e prova l'app per sé.**
- Primo avvio senza dati, nessun account; deve capire in pochi secondi che i dati restano sul suo telefono.
- Può installarla come app sulla schermata Home.

**Fuori ambito:** allenatori che gestiscono più atleti, social, sincronizzazione tra dispositivi, piani generati automaticamente, consigli medici.

## 2. Principi UX (verificabili)

| # | Principio | Come si verifica |
| --- | --- | --- |
| P1 | **Registrare una serie costa pochissimo:** 1 tocco se ripeti la volta scorsa (la spunta su una riga vuota conferma i valori "precedente", come in Strong), al massimo 2 campi più la spunta altrimenti; togliere la spunta annulla | Conteggio dei tocchi nel test e2e di US-12 |
| P2 | **Zona del pollice:** azioni frequenti (spunta, aggiungi serie, timer, Termina) nella metà inferiore o sulla riga della serie; target ≥ 48px; nessun gesto nascosto come unico modo (lo swipe è solo una scorciatoia) | Revisione a 390×844 e 320×568; detector di Impeccable (target piccoli) |
| P3 | **Leggibile a colpo d'occhio:** cifre di peso e ripetizioni ≥ 20px tabulari; timer leggibile a braccio teso (cifre molto grandi); contrasto AA in **entrambi i temi** | Detector, controllo dei contrasti, prova al sole su un telefono reale |
| P4 | **Mai perdere dati:** salvataggio a ogni modifica con stato visibile; le azioni distruttive si possono annullare per qualche secondo o chiedono conferma; mai sovrascritture silenziose | e2e su ricaricamento, quota piena e conflitto tra schede |
| P5 | **Interrompibile:** chiudere, bloccare o ricaricare riporta esattamente alla sessione, all'esercizio e al timer in corso | e2e con ricaricamento a metà sessione e durante il recupero |
| P6 | **Sempre disponibile:** funziona offline dopo la prima visita; nessuna richiesta esterna | e2e offline, controllo di rete |
| P7 | **Cosa fare adesso, sempre in vista:** la schermata Oggi e l'allenamento attivo mostrano esercizio corrente, target e precedente senza scorrere né aprire menu | Revisione dei brief e critique di Impeccable |
| P8 | **Niente modali superflue:** modale solo per il timer, le conferme distruttive e l'approfondimento; il resto avviene in linea o con un foglio dal basso | Critique di Impeccable |
| P9 | **Accessibile:** navigabile da tastiera e da screen reader, `prefers-reduced-motion`, annunci del timer solo a soglie | Audit di Impeccable, test da tastiera |
| P10 | **Linguaggio della palestra, in italiano:** "serie", "ripetizioni", "recupero", "scheda", "riscaldamento"; i pulsanti dicono cosa fanno | Clarify di Impeccable |

## 3. User story

Priorità: **M** = indispensabile per la v1, **S** = importante, **C** = se c'è tempo. "Step" rimanda al piano.

**Fuori ambito per la v1:** calcolatore dei dischi, calcolatore di riscaldamento, note per singola serie (Strong li ha, ma non sono nelle decisioni del piano).

### E1. Primo avvio e dati esistenti

**US-01 (M, step 3).** Come nuovo visitatore, voglio capire subito cosa fa l'app e che i miei dati restano sul telefono, per decidere se usarla.
- Al primo avvio una schermata breve: cosa fa, dove sono i dati, "Inizia con le schede di esempio" o "Parti da zero".
- Nessun account e nessuna richiesta di permessi all'avvio.

**US-02 (M, step 2–3).** Come utente del PoC, voglio importare il mio diario attuale, per non perdere lo storico.
- Importazione dal file di backup del PoC: anteprima con numero di allenamenti e periodo, conferma.
- Varianti ed esercizi riconosciuti dagli ID; riepilogo finale con gli eventuali elementi scartati e il motivo.

**US-03 (S, step 3).** Come utente abituale, voglio installare l'app sulla Home e usarla offline, per averla come un'app vera.
- Invito discreto all'installazione dopo il primo allenamento concluso, non al primo avvio.
- Avviso sul rischio di perdita dei dati per i siti non installati su iOS, con invito al backup.

### E2. Pianificazione e calendario

**US-04 (M, step 5).** Come utente, voglio assegnare una scheda ai giorni della settimana, per sapere ogni giorno cosa fare.
- Scelta tra le schede esistenti oppure "Riposo"; la modifica vale per le settimane future.

**US-05 (M, step 5).** Come utente, voglio vedere la settimana con cosa è pianificato e cosa ho fatto, per capire a colpo d'occhio se sono in linea.
- Ogni giorno mostra scheda pianificata e stato (fatto, saltato, oggi, futuro); toccando un giorno passato si apre la sessione di quel giorno.

**US-06 (S, step 5).** Come utente, voglio spostare o cambiare l'allenamento di un singolo giorno, senza toccare la pianificazione settimanale.
- Eccezione per una sola data (altra scheda o riposo), segnalata nel calendario.

### E3. Schede

**US-07 (M, step 4).** Come utente, voglio creare una scheda con esercizi, serie, ripetizioni target, carico di partenza e recupero, per avere il mio programma nell'app.
- Esercizi dal catalogo con ricerca, o con un nome libero.
- Serie, ripetizioni (anche intervallo), carico (anche intervallo, nell'unità scelta), recupero in min:s.

**US-08 (M, step 4).** Come utente, voglio indicare esercizi alternativi, per sapere cosa fare se la macchina è occupata.

**US-09 (M, step 4).** Come utente, voglio raggruppare due esercizi in superserie, per alternarli e recuperare solo alla fine del giro.

**US-10 (S, step 4).** Come utente, voglio duplicare, rinominare, riordinare e archiviare le schede, per gestire i cambi di programma senza perdere lo storico.
- Archiviare non cancella le sessioni passate. Eliminare richiede conferma e non è possibile se la scheda ha sessioni (si archivia).

### E4. Allenamento

**US-11 (M, step 5–6).** Come utente in palestra, voglio scegliere la scheda e avviare l'allenamento nel minor tempo possibile, per iniziare subito.
- Oggi mostra, come righe grandi da toccare, le **ultime 4 schede fatte** (distinte, dalla più recente), più quella pianificata per oggi se non è già tra queste. Senza storico: le schede attive nel loro ordine.
- Una scheda è **già selezionata** come suggerimento: quella pianificata per oggi; senza pianificazione, tra le recenti quella fatta da più tempo (con A/B si alternano da sole).
- "Inizia allenamento" sta nella zona del pollice. Percorso felice: **1 tocco** se il suggerimento è giusto, **2 tocchi** altrimenti (scheda, poi Inizia). Nessuna conferma e nessuna schermata intermedia.
- Alternative meno frequenti: "Altra scheda" (elenco completo, in un foglio dal basso) e "Allenamento libero".
- Se c'è una sessione in corso, il pulsante principale diventa "Riprendi" e le schede passano in secondo piano.

**US-12 (M, step 6).** Come utente, voglio registrare peso e ripetizioni di ogni serie vedendo cosa ho fatto la volta scorsa, per progredire senza ricordare a memoria.
- Riga serie: tipo/numero · precedente · peso · ripetizioni · spunta.
- Toccando "precedente" i valori vengono copiati; tastiera numerica (decimale per il peso).
- La spunta su una riga vuota conferma i valori "precedente" (1 tocco); senza precedente, una riga vuota non si spunta e il cursore va al primo campo vuoto. Togliere la spunta annulla la registrazione.
- Rispetta P1.

**US-13 (M, step 6).** Come utente, voglio segnare una serie come riscaldamento, drop o cedimento, per distinguere le serie che contano.
- Tocco sul numero della serie per cambiare tipo; il riscaldamento non conta per volume, record e grafici.

**US-14 (M, step 6).** Come utente, voglio passare a una variante quando la macchina è occupata, mantenendo i carichi di ciascuna variante separati.
- Se ci sono già valori: conferma e svuotamento delle serie, come nel PoC. "Precedente" si riferisce alla variante scelta.
- Oltre alle alternative della scheda, il selettore ha **"Altro esercizio…"** con un campo di testo, per scrivere a mano l'esercizio fatto al posto di quello previsto. Mentre si scrive compaiono i nomi simili del catalogo; un nome nuovo diventa un esercizio personalizzato del catalogo, così la volta dopo ha il suo "precedente" e il suo storico.
- La sostituzione vale solo per la sessione: la scheda non cambia.

**US-15 (M, step 6).** Come utente, voglio aggiungere o togliere serie ed esercizi durante la sessione, perché il programma reale cambia.
- "Aggiungi serie" riprende il peso dell'ultima serie con ripetizioni vuote.
- Rimuovere una serie con valori si può annullare.
- Gli esercizi si possono riordinare durante la sessione (frecce accessibili).

**US-16 (M, step 6).** Come utente, voglio annotare dettagli sul carico (totale, per manubrio, macchina, regolazioni del sedile), per ritrovarli la volta dopo.
- La nota è visibile accanto al precedente nella sessione successiva.

**US-17 (M, step 6).** Come utente interrotto, voglio ritrovare la sessione esattamente dove l'ho lasciata, anche dopo aver chiuso il browser.
- Rispetta P5. Dalle altre schermate una mini-barra riporta alla sessione.

**US-18 (M, step 6).** Come utente, voglio concludere l'allenamento e vedere un riepilogo, per chiudere la giornata con un feedback.
- Riepilogo: durata, esercizi, serie, volume, record battuti. Una sessione conclusa resta modificabile e si può riaprire.

**US-19 (M, step 6).** Come utente, voglio consultare come si esegue un esercizio, per fare bene il movimento.
- Approfondimento dal nome dell'esercizio (descrizione, immagine, passaggi, attenzione, fonti), in un foglio dal basso.

**US-20 (M, step 6).** Come utente, voglio fare più sessioni nello stesso giorno (es. mattina e sera).
- Una sola sessione "in corso" alla volta; le altre dello stesso giorno restano nello storico.

### E5. Recupero

**US-21 (M, step 7).** Come utente, voglio che alla spunta della serie parta il recupero a tutto schermo, per riposare il tempo giusto senza pensarci.
- Durata dall'esercizio (quella di riscaldamento se la serie è di riscaldamento); 0 = nessun timer.
- Se la voce non ha un recupero, si usa il recupero predefinito delle Impostazioni.
- Il conto alla rovescia si legge a braccio teso e mostra la prossima serie attesa.

**US-22 (M, step 7).** Come utente, voglio allungare, accorciare o saltare il recupero, perché a volte serve più tempo o la macchina si libera.
- −15 s, +15 s, Salta; togliere la spunta annulla il timer.

**US-23 (M, step 7).** Come utente, voglio ridurre il timer e continuare a usare l'app (correggere una serie, guardare un approfondimento), senza perdere il conteggio.
- Il timer ridotto resta visibile come barra e si riapre con un tocco.

**US-24 (M, step 7).** Come utente, voglio accorgermi della fine del recupero anche senza guardare lo schermo.
- Suono (attivabile), vibrazione dove supportata, schermo acceso durante la sessione. Con l'app chiusa nessuna garanzia, e le Impostazioni lo spiegano.

**US-25 (M, step 7).** Come utente in superserie, voglio che il recupero parta solo alla fine del giro.

**US-26 (M, step 7).** Come utente che ha bloccato il telefono, voglio ritrovare al rientro il tempo corretto (o il recupero già finito), mai un timer sbagliato.

### E6. Storico e progressi

**US-27 (M, step 8).** Come utente, voglio rivedere e correggere le sessioni passate, perché a volte registro male.
- Lista per data e accesso dal calendario; dettaglio modificabile; eliminazione con conferma.
- Data e nome della sessione modificabili, anche durante la sessione in corso.

**US-28 (M, step 8).** Come utente, voglio vedere l'andamento di un esercizio (carico massimo, 1RM stimato, volume), per sapere se sto progredendo.
- Grafico per periodo, nell'unità scelta, varianti separate, riscaldamento escluso; leggibile in entrambi i temi.

**US-29 (S, step 8).** Come utente, voglio sapere quando batto un record personale, per motivarmi.
- Indicazione nella riga serie al momento della spunta e nel riepilogo finale.

### E7. Impostazioni e dati

**US-30 (M, step 3).** Come utente, voglio scegliere tema chiaro, scuro o di sistema, per leggere bene in ogni luce.

**US-31 (M, step 2–3).** Come utente, voglio scegliere kg o lb (e m o ft), per usare le unità a cui sono abituato.
- Cambiare unità non altera i dati; i valori rimangono identici se riletti nella stessa unità.

**US-32 (M, step 3).** Come utente, voglio esportare un backup e reimportarlo, per non dipendere da un solo browser.
- Import con anteprima e scelta "mantieni" o "sostituisci" per gli elementi già presenti, come nel PoC.

**US-33 (M, step 2–3).** Come utente, voglio essere avvisato se il salvataggio fallisce o se il diario è stato modificato in un'altra scheda, per non perdere nulla.
- Rispetta P4, con gli stessi messaggi e comportamenti del PoC.
- Archivio illeggibile: nessuna sovrascrittura, download del contenuto originale.

## 4. Flussi principali da progettare per primi

1. **Allenamento del giorno:** Oggi (scheda suggerita già selezionata, oppure una delle ultime 4) → Inizia → serie (precedente, spunta) → recupero a tutto schermo → serie successiva → … → Termina → riepilogo. Storie: US-11, 12, 21, 22, 18.
2. **Interruzione:** a metà recupero il telefono si blocca; al rientro si ritrova timer e sessione. Storie: US-17, 26.
3. **Macchina occupata:** cambio variante a metà esercizio, scelta tra le alternative o scritta a mano. Storie: US-14, 08.
4. **Primo avvio:** nuovo visitatore → schede di esempio → primo allenamento. Storie: US-01, 11.
5. **Cambio programma:** duplicare la scheda A, modificarla, assegnarla al lunedì. Storie: US-10, 07, 04.

## 5. Validazione

- **Brief (step 0):** ogni brief di `/impeccable shape` elenca le storie e i principi che copre; nessuna storia M resta senza superficie.
- **Test:** ogni storia M ha almeno un test e2e il cui nome comincia con il suo ID (es. `US-12 registra una serie copiando il precedente`).
- **Critique:** `/impeccable critique` sui flussi della sezione 4, non sulle singole pagine.
- **Prova reale:** alla fine degli step 6 e 7, **una sessione vera in palestra** dell'utente sul proprio telefono, con una checklist (tocchi per serie, leggibilità del timer, interruzioni, luce). I problemi trovati diventano correzioni prima di proseguire.
