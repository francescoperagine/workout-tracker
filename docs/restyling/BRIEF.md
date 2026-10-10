# BodyTracker: brief delle superfici (step 0)

Indice dei brief scritti con il metodo `shape` di Impeccable. I brief veri e propri sono in `.impeccable/surfaces/`, dove Impeccable li rilegge a ogni modifica della superficie. Questo documento li collega ai flussi, alle storie e ai principi di [USER-STORIES.md](USER-STORIES.md). Tutte le superfici sono in modalità **Operate**.

**Stato: confermato dall'utente il 10 ottobre 2026.** Nessuna scelta visiva (colori, font, forma del timer) è presa qui: la fa lo step 1, partendo dal mondo del PoC.

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

Navigazione: tab bar in basso con **Oggi, Calendario, Schede, Storico**; Impostazioni da un'icona nell'intestazione (confermato). Le pagine con un parametro lo leggono dalla query string, perché il sito è statico.

**Copertura:** ogni storia M ha almeno una superficie. Le storie trasversali (US-17 mini-barra, US-33 stato del salvataggio, US-23 timer ridotto) compaiono in più brief e saranno componenti condivisi dello step 1.

## 2. Flussi principali, attraverso le superfici

I flussi vengono prima delle pagine: ogni passaggio qui sotto deve funzionare a una mano, a 390×844, senza scorrere per trovare l'azione successiva.

### Flusso 1. Allenamento del giorno (US-11, 12, 21, 22, 18)

1. **Oggi:** la scheda di oggi ("Scheda A · 8 esercizi") con "Inizia allenamento" in basso. 1 tocco.
2. **Allenamento attivo:** in vista il primo esercizio, "1 Squat bilanciere · 6–8 · 45–50 kg · rec. 2:00", con le serie precompilate vuote e "precedente" su ogni riga.
3. **Serie:** spunta sulla riga vuota, che conferma il precedente 50 × 8: 1 tocco (P1). Se cambia qualcosa: tocco su "precedente" o un campo, poi la spunta.
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

## 3. Revisione delle storie: proposte (tutte confermate)

Proposte emerse scrivendo i brief, confermate dall'utente e riportate in [USER-STORIES.md](USER-STORIES.md):

1. **US-09 superserie e US-25 recupero in superserie: da S a M.** Nelle schede reali A e B, 6 esercizi su 8 sono in superserie (2a/2b, 4a/4b, 5a/5b). Senza superserie il recupero partirebbe dopo ogni serie, quindi il flusso principale sarebbe sbagliato. Il piano le indicava come candidate da rimandare: va tolta questa indicazione.
2. **US-16 note sul carico, US-19 approfondimento e US-20 più sessioni nello stesso giorno: da S/C a M.** Sono funzioni del PoC, e la tabella "Assorbimento del PoC" richiede che esistano tutte prima di eliminare `BodyTracker/`. Con la priorità attuale la v1 non potrebbe chiudere lo step 9.
3. **Storia mancante: modificare data e nome di una sessione** (funzione del PoC, oggi solo nella tabella di assorbimento). Proposta: aggiungere a US-27 il criterio "data e nome della sessione modificabili, anche in corso".
4. **Criteri mancanti:**
   - US-15: riordinare gli esercizi durante la sessione (è nello step 6 ma non nella storia);
   - US-21: recupero predefinito dalle Impostazioni quando la voce non ne ha uno;
   - US-33: archivio illeggibile, con download del contenuto originale e nessuna sovrascrittura (è nella tabella di assorbimento).
5. **Fuori ambito esplicito per la v1:** calcolatore dei dischi, calcolatore di riscaldamento, note per singola serie. Strong li ha, ma non sono nelle decisioni del piano.
6. **P1:** la spunta su una riga vuota conferma il precedente (1 tocco). Vedi §4.

## 4. Decisioni prese (10 ottobre 2026)

1. **Spunta su una riga vuota:** conferma i valori "precedente", come in Strong (**1 tocco** per ripetere la volta scorsa). Il rischio di registrare valori non fatti è mitigato dall'annullamento della spunta. Senza precedente, una riga vuota non si spunta. P1 e US-12 sono aggiornati.
2. **Priorità:** confermate le proposte 1 e 2 della sezione 3 (superserie, note sul carico, approfondimento e più sessioni al giorno diventano M), i criteri aggiunti (punti 3 e 4) e le esclusioni (punto 5).
3. **Struttura:** confermate tutte le proposte assunte nei brief:
   - primo avvio come schermata dedicata `/benvenuto`;
   - riepilogo come schermata dopo "Termina";
   - Impostazioni da un'icona nell'intestazione, non come quinta tab;
   - Progressi dentro Storico;
   - vista mese del Calendario in v1.
4. **Hook del detector di Impeccable:** attivo in `.claude/settings.json`, condiviso e valido anche per le sessioni cloud.

## 5. Dopo la conferma

- Le storie confermate sono il contratto del restyling; USER-STORIES.md e i brief riportano le risposte.
- Step 1: il design system, con Impeccable (new-work in modalità refinement del mondo del PoC): tema chiaro e scuro, font, mossa distintiva sul timer, `DESIGN.md` riscritto.
