# Todo (solo per il maintainer)
- [x] correggere l'esercizio di un allenamento passato scelto per sbaglio (es. «leg press» per «leg press, piedi a metà pedata»): dalla cronologia della pagina dell'esercizio, «Era un altro esercizio» (US-42, INC-020)
- [ ] nell'allenamento: volume dell'esercizio rispetto all'ultima volta, aggiornato mentre si spuntano le serie (la richiesta più votata nei thread di Hevy e Strong; oggi c'è il precedente serie per serie, non il totale)
- [ ] vista per gruppo muscolare (volume per muscolo, per settimana o mese): serve aggiungere i muscoli ai 43 esercizi del catalogo. Serve a chi cambia spesso esercizi e a chi usa molto le varianti, perché lo storico per singolo esercizio resta rado
- [ ] immagini ed esecuzione degli esercizi: è un progetto di contenuti (fonti, licenze, stile a pennello), va nell'approfondimento e nella libreria, non nella pagina dei progressi
- [ ] backup condivisibile: «Esporta backup» (`src/components/settings/DataSection.svelte`) apre un foglio con «Condividi» (foglio di sistema: WhatsApp, Gmail, Drive…) e «Scarica». Condividi solo se `navigator.canShare({ files })` è vero, altrimenti solo download. Insidia: Chrome non condivide file .json (Web Share accetta solo alcuni tipi), quindi il file condiviso va come .txt / text/plain con dentro lo stesso JSON, e l'import (`src/components/data/ImportFlow.svelte`, oggi `accept="application/json,.json"`) deve accettare anche .txt. L'email passa dal foglio di sistema: un link mailto non può allegare file
- [ ] import del CSV di Strong: solo per stare alla pari (lo fanno già Hevy, GymPsycho e altri), non è un elemento distintivo
- [ ] record per periodo: la riga dei record segue 3M / 1A / Tutto (chiesto da chi rientra da un infortunio; segnale debole)
- [x] quando si seleziona un allenamento alternativo, l'esercizio selezionato dovrebbe utilizzare lo stesso set di dati se è usato altrove come esercizio già nella scheda. come a dire: se sto usando il romanian deadlift come esercizio (che sia alternativo o che sia aggiunto alla scheda) come impstazione di default dovrebbe esserci l'ultimo romanian deadlift che ho fatto (preso dalla memoria, quindi salvare il set)
- [x] per ciascun esercizio nella scheda deve esserci un pulsante in alto a destra per completarlo del tutto
- [x] riordinare gli esercizi tramite drag & drop
- la lista degli esercizi non è grande
- [x] stacco rumeno e romanian deadlift sono considerati esercizi differenti
- il suono di fine timer è veramente irritante ed alto
- i grafici dei miglioramenti devono essere raggiungibili subito ( mettere in barra vicino lo storico ?)
- al primo avvio ci deve essere un tutorial overlay tipo: qui (con freccia) crei allenamenti etc, qui le impostazioni...
- l'attuale rotella delle impostazioni contiene tante info, in alternativa si può usare hamburger menù (che si apre anche trascinando da sx). in alto a dx resta solo l'help della pagina attuale.
- per ogni "pagina" deve esserci il ? dedicato con l'help . le info attualmente nell'help (che sono generiche) possono andare in hamburger menù'
- [x] palette bianco e nero in chiaro e scuro, bordi grigi chiari; colori accesi e vividi solo per dettagli e grafiche (definiti da Francesco); stile a pennello solo per illustrazioni e onboarding; controlli e numeri in font pulito con cifre tabulari
- [x] icona e identità visiva: l'icona attuale è identica a quella di Strong. Ricavare l'icona dall'illustrazione a pennello del sito (/Users/thuls/Repository/personal-website/src/assets/projects/workout-tracker-hero.webp bilanciere o figura semplificata, tratti spessi, dentro la zona sicura maskable), testarla a 16/32/48/192/512 px e sul launcher accanto a Strong. Stile a pennello solo per illustrazioni/onboarding; palette inchiostro + carta + un accento vermiglio (sostituisce il punto palette verde)
- [ ] sezione Profilo
- [ ] schede di esempio per chi comincia, prese da programmi per principianti documentati, con la fonte
- [ ] sagoma del corpo disegnata davvero a pennello (oggi: zone dei muscoli di MuscleMap con un contorno che imita l'inchiostro, `src/data/body-map.ts`), unisex, con brachiale e flessori dell'anca
- [ ] le impostazioni di aspetto e unità di misura devono essere in una linea 
<Opzione a sx>       <toggle tutto a dx>
, così 3 impostazioni prendono la finestra intera. non c'è bisogno di spiegare cose per kg/lb o m/ft e sistema. sono cose autoesplicative.
Recupero predefinito <attuale> <-15s> <+15s> 
- "Installa sul telefono" (invece di App sul telefono) va posizionato prima di Cancella tutto il diario. 
- rinominare "cancella tutto il diario" in "resetta lo storico", con avviso in modale con conferma con avvertenza di cosa cancella (storico, progressi etc)
- in storico "Record in <n> esercizi va sempre su newline, ora non lo fa"