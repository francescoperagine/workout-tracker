# BodyTracker: brief delle superfici (step 0)

Indice dei brief scritti con il metodo `shape` di Impeccable. I brief veri e propri sono in `.impeccable/surfaces/`, dove Impeccable li rilegge a ogni modifica della superficie. Questo documento li collega ai flussi, alle storie e ai principi di [USER-STORIES.md](USER-STORIES.md). Tutte le superfici sono in modalità **Operate**.

**Stato: bozza da confermare.** Nessuna scelta visiva (colori, font, forma del timer) è presa qui: la fa lo step 1, partendo dal mondo del PoC.

## 1. Superfici

| Superficie | Percorso | Brief | Storie | Principi |
| --- | --- | --- | --- | --- |
| Oggi | `/` | [route.md](../../.impeccable/surfaces/route.md) | US-11, 17, 05, 03 | P2, P7, P8, P10 |
| Primo avvio | `/benvenuto` | [route-benvenuto.md](../../.impeccable/surfaces/route-benvenuto.md) | US-01, 02, 11 | P4, P6, P8, P10 |
| Allenamento attivo (con riepilogo e mini-barra) | `/allenamento` | [route-allenamento.md](../../.impeccable/surfaces/route-allenamento.md) | US-12…20, 08, 29, 33 | P1, P2, P3, P4, P5, P7, P8, P10 |
| Timer di recupero | overlay in `/allenamento` (`TimerRecupero.svelte`) | [src-components-allenamento-timerrecupero-svelte.md](../../.impeccable/surfaces/src-components-allenamento-timerrecupero-svelte.md) | US-21…26 | P2, P3, P5, P8, P9 |
| Schede (elenco ed editor) | `/schede`, `/scheda?id=` | [route-schede.md](../../.impeccable/surfaces/route-schede.md) | US-07, 08, 09, 10 | P2, P4, P8, P10 |
| Calendario | `/calendario` | [route-calendario.md](../../.impeccable/surfaces/route-calendario.md) | US-04, 05, 06, 27 | P2, P3, P7, P10 |
| Storico e progressi | `/storico`, `/sessione?id=`, `/esercizio?id=` | [route-storico.md](../../.impeccable/surfaces/route-storico.md) | US-27, 28, 29, 18, 20 | P3, P4, P9, P10 |
| Impostazioni e Dati | `/impostazioni` | [route-impostazioni.md](../../.impeccable/surfaces/route-impostazioni.md) | US-30…33, 02, 03, 24 | P4, P6, P9, P10 |

Navigazione: tab bar in basso con **Oggi, Calendario, Schede, Storico**; Impostazioni da un'icona nell'intestazione (proposta). Le pagine con un parametro lo leggono dalla query string, perché il sito è statico.

**Copertura:** ogni storia M ha almeno una superficie. Le storie trasversali (US-17 mini-barra, US-33 stato del salvataggio, US-23 timer ridotto) compaiono in più brief e saranno componenti condivisi dello step 1.

## 2. Flussi principali, attraverso le superfici

I flussi vengono prima delle pagine: ogni passaggio qui sotto deve funzionare a una mano, a 390×844, senza scorrere per trovare l'azione successiva.

### Flusso 1. Allenamento del giorno (US-11, 12, 21, 22, 18)

1. **Oggi:** la scheda di oggi ("Scheda A · 8 esercizi") con "Inizia allenamento" in basso. 1 tocco.
2. **Allenamento attivo:** in vista il primo esercizio, "1 Squat bilanciere · 6–8 · 45–50 kg · rec. 2:00", con le serie precompilate vuote e "precedente" su ogni riga.
3. **Serie:** tocco su "precedente" (copia 50 × 8), poi spunta: 2 tocchi (P1). Se cambia qualcosa: un campo, poi la spunta.
4. **Timer:** alla spunta si apre il recupero a tutto schermo, 2:00, con "Prossima: Squat bilanciere · serie 2 · 50 kg × 6–8". Se serve: +15 s, oppure Salta.
5. Alla fine del recupero: segnale, "Vai", chiusura; il focus torna sulla riga della serie successiva.
6. **Superserie (2a/2b):** spunta di 2a → nessun timer, il focus passa a 2b; spunta di 2b → recupero del giro.
7. **Termina:** in basso nella barra fissa; il riepilogo mostra durata, serie, volume e record.

### Flusso 2. Interruzione (US-17, 26)

1. A metà del recupero il telefono si blocca, o il browser viene chiuso.
2. Alla riapertura (anche da Oggi, che mostra "Riprendi"), l'app torna all'allenamento con il timer al tempo giusto, oppure con "Recupero finito da 0:40".
3. Nessun dato perso: lo stato del salvataggio nella barra fissa lo conferma.

### Flusso 3. Macchina occupata (US-14, 08)

1. Nell'esercizio corrente, il selettore variante mostra le alternative della scheda ("Leg press", "Squat al Smith", "Goblet squat").
2. Se ci sono già valori inseriti: conferma, poi le serie si svuotano (come nel PoC).
3. "Precedente" e record diventano quelli della variante scelta; la scheda non cambia.

### Flusso 4. Primo avvio (US-01, 11)

1. **Benvenuto:** cosa fa l'app, "i dati restano su questo telefono", tre azioni.
2. "Inizia con le schede di esempio" carica A e B e porta a **Oggi**, con "Inizia allenamento" sulla scheda A.
3. Nessun permesso chiesto. L'invito all'installazione arriva solo dopo il primo allenamento concluso (US-03).

### Flusso 5. Cambio programma (US-10, 07, 04)

1. **Schede:** "Duplica" su Scheda A → "Scheda A (copia)", subito rinominabile.
2. **Editor:** si cambia una voce (esercizio dal catalogo, serie, ripetizioni, carico, recupero), si raggruppa una superserie; tutto si salva a ogni modifica.
3. **Calendario:** nella pianificazione settimanale il lunedì passa a "Scheda C". Da lunedì **Oggi** propone la nuova scheda.

## 3. Revisione delle storie: proposte da confermare

Le storie di [USER-STORIES.md](USER-STORIES.md) restano invariate finché non le confermi. Proposte emerse scrivendo i brief:

1. **US-09 superserie e US-25 recupero in superserie: da S a M.** Nelle schede reali A e B, 6 esercizi su 8 sono in superserie (2a/2b, 4a/4b, 5a/5b). Senza superserie il recupero partirebbe dopo ogni serie, quindi il flusso principale sarebbe sbagliato. Il piano le indicava come candidate da rimandare: va tolta questa indicazione.
2. **US-16 note sul carico, US-19 approfondimento e US-20 più sessioni nello stesso giorno: da S/C a M.** Sono funzioni del PoC, e la tabella "Assorbimento del PoC" richiede che esistano tutte prima di eliminare `BodyTracker/`. Con la priorità attuale la v1 non potrebbe chiudere lo step 9.
3. **Storia mancante: modificare data e nome di una sessione** (funzione del PoC, oggi solo nella tabella di assorbimento). Proposta: aggiungere a US-27 il criterio "data e nome della sessione modificabili, anche in corso".
4. **Criteri mancanti:**
   - US-15: riordinare gli esercizi durante la sessione (è nello step 6 ma non nella storia);
   - US-21: recupero predefinito dalle Impostazioni quando la voce non ne ha uno;
   - US-33: archivio illeggibile, con download del contenuto originale e nessuna sovrascrittura (è nella tabella di assorbimento).
5. **Fuori ambito esplicito per la v1:** calcolatore dei dischi, calcolatore di riscaldamento, note per singola serie. Strong li ha, ma non sono nelle decisioni del piano.
6. **P1, una scelta da fare:** vedi domanda 1 qui sotto.

## 4. Domande aperte

Solo quelle che il piano e le storie non risolvono già:

1. **Spunta su una riga vuota.** Come in Strong, la spunta di una serie senza valori conferma i valori "precedente" (**1 tocco** per ripetere la volta scorsa), oppure la serie vuota non si può spuntare e servono "precedente" + spunta (**2 tocchi**, come scritto oggi in P1)? Il rischio della prima è registrare per errore valori non fatti; l'annullamento della spunta lo mitiga.
2. **Priorità:** confermi le proposte 1 e 2 della sezione 3 (superserie, note, approfondimento e più sessioni al giorno diventano M)?
3. **Struttura:** confermi le proposte assunte nei brief?
   - primo avvio come schermata dedicata `/benvenuto`;
   - riepilogo come schermata dopo "Termina";
   - Impostazioni da un'icona nell'intestazione, non come quinta tab;
   - Progressi dentro Storico;
   - vista mese del Calendario in v1.

## 5. Cosa succede dopo la conferma

- Le storie confermate diventano il contratto del restyling; aggiorno USER-STORIES.md e i brief con le risposte.
- Step 1: il design system, con Impeccable (new-work in modalità refinement del mondo del PoC): tema chiaro e scuro, font, mossa distintiva sul timer, `DESIGN.md` riscritto.
