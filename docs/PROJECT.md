# Progetto

Chi è il prodotto, per chi, con quali vincoli e principi: `PRODUCT.md` (nella radice, lo legge Impeccable).
Qui c'è solo dove siamo e dove si va.

## Stato (13 ottobre 2026)

- **Restyling chiuso** (step 0–9, 12 ottobre 2026): storia, decisioni e user story in `docs/archive/restyling/`.
- **Rilascio fatto:** dominio `workout-tracker.francescoperagine.com` collegato al Worker (12 ottobre), backup
  spostato da `workers.dev` al dominio, voce nei Projects di personal-website (INC-119 di quel repo, stato
  `production`), Workers Builds collegato al repository: ogni push su `main` va online da solo.
- **Governance:** adottata con INC-001 (`ai-governance-template` v6).
- **Feature attive:** nessuna (`features/` vuota).

## Focus attuale

Correzioni dopo le prove sull'app installata. Da provare in palestra: storico e progressi (step 8), suono di
fine recupero, e le correzioni dello step 9 (variante a metà esercizio che tiene le serie fatte, «Termina» con
conferma, allenamento senza tab bar, livello del timer, «Ogni martedì» nel foglio del giorno, peso suggerito
dalla serie sopra).

Decisioni aperte dello step 9, da chiudere con Francesco (raccomandazione tra parentesi):

1. **Numerazione dopo una variante a metà esercizio:** la variante è una voce nuova con il suo numero e il
   conteggio dice «1 di 9 esercizi fatti» (tenerla: è quello che è successo davvero).
2. **Nome accessibile dei giorni del calendario** più lungo del testo visibile, Lighthouse 96 (tenerlo).
3. **Deploy con l'app aperta in allenamento:** non riprodotto; un chunk vecchio tolto dalla cache darebbe errore
   solo offline (non pushare mentre ci si allena; intervenire solo se capita).
4. **Proposte della critique non fatte:** segno sulla riga della serie da fare adesso, pulsanti ± per il peso,
   impostazione «Distanza» che oggi non ha effetto (aspettare le prove in palestra).

## Limiti noti

- Gli avvisi di fine recupero arrivano solo con l'app aperta: il Web Push è solo predisposto (handler in
  `public/sw-push.js`, contratto in `docs/archive/restyling/WEB-PUSH.md`), senza server né permessi.
- Riordino di schede ed esercizi solo con le frecce: il trascinamento è rimandato.
- Offline si aprono solo gli URL delle pagine con la barra finale (`/settings/`): i link dell'app la hanno sempre.
- I punti iOS della checklist di `WEB-PUSH.md` (wake lock, sblocco dell'audio, vibrazione) non sono verificati:
  nessun iPhone disponibile.
- Gli approfondimenti del catalogo sono vuoti: niente testi tecnici o consigli medici inventati.
- Le pagine restano `noindex`: la reperibilità viene dalla pagina Projects del sito personale.

## Direzione

Nessuna milestone fissata. Candidati, solo se le prove li chiedono: server Web Push per gli avvisi ad app
chiusa, riordino con trascinamento, le proposte della critique (decisione aperta 4).
