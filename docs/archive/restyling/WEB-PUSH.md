# Timer di recupero: avvisi, Web Push e prova sui telefoni

Documento dello step 7 (PIANO.md, "Predisposizione Web Push"). Oggi gli avvisi di fine recupero arrivano **solo con l'app aperta**: nessun server, nessuna richiesta esterna (decisione 3 e 5 del piano). Qui ci sono il funzionamento attuale, il contratto di un futuro endpoint e la checklist per la prova manuale su iPhone e Android.

## Come funziona oggi

- **Motore:** `src/lib/rest-timer.ts` (logica pura) e `src/lib/rest-timer.svelte.ts` (store). La verità è l'istante di fine (`end`, timestamp), salvato nella chiave `workout-tracker.restTimer` a ogni cambiamento: ricarica, chiusura e schermo bloccato non spostano il conteggio. Il tempo si ricalcola a ogni scatto (250 ms) e a `visibilitychange`.
- **Avviso locale:** `localRestNotifier` (`src/lib/rest-notifier.ts`) programma un timeout alla fine; lo store controlla comunque la fine a ogni scatto. Suono (`AudioContext`, sbloccato dalla spunta) e vibrazione (`navigator.vibrate`) secondo le Impostazioni, una volta sola (`alerted` nello stato salvato, anche tra schede del browser). Oltre un minuto di ritardo non suonano più: l'utente vede "Recupero finito da …" al rientro.
- **Schermo acceso:** Screen Wake Lock (`src/lib/wake-lock.ts`) per tutto l'allenamento in corso, richiesto di nuovo quando la pagina torna visibile.
- **Service worker:** `public/sw-push.js`, importato da `sw.js` (`importScripts` in `src/integrations/service-worker.ts`), ha già gli handler `push` e `notificationclick`. Oggi nessuno invia push.

## Interfaccia

```ts
interface RestNotifier {
  schedule(timer: RestTimerState): Promise<void>; // sostituisce l'avviso con lo stesso setId
  cancel(id: string): Promise<void>;              // id = setId del timer
}
```

Un'implementazione Web Push avrebbe la stessa forma: `schedule` manda al server l'iscrizione e l'istante di fine, `cancel` lo ritira. Lo store chiama già `schedule` all'avvio e dopo −15 s / +15 s, `cancel` a Salta, alla spunta tolta e a un nuovo recupero.

## Contratto di un futuro endpoint (non implementato)

Serve un server, quindi va deciso esplicitamente: oggi l'app non manda nulla a nessuno (PRODUCT.md).

`POST {endpoint}/rest-timers`

```json
{
  "subscription": { "endpoint": "https://…", "keys": { "p256dh": "…", "auth": "…" } },
  "id": "<setId>",
  "end": 1791560520000,
  "title": "Recupero finito",
  "body": "Adesso: Panca piana bilanciere · serie 2 · 40 kg × 6–8"
}
```

- Risposta `204`. Una seconda chiamata con lo stesso `id` sostituisce la precedente (+15 s).
- `DELETE {endpoint}/rest-timers/<id>` annulla (Salta, spunta tolta). Idempotente.
- Alla fine il server manda un push con payload `{ "type": "rest-end", "title", "body", "tag": "<id>" }`, cifrato secondo RFC 8291 (VAPID, RFC 8292). Il server conserva solo iscrizione e istante di fine, mai il diario, e li cancella dopo l'invio.
- Lato app mancherebbero: chiave pubblica VAPID nella build, richiesta del permesso di notifica (mai al primo avvio: da un interruttore nelle Impostazioni), `pushManager.subscribe` sulla registrazione del service worker, `pushRestNotifier` che implementa `RestNotifier`.
- **iOS:** il Web Push funziona solo con l'app installata sulla schermata Home (iOS 16.4 e successivi).

## Checklist per la prova manuale (iPhone e Android)

Da fare con l'app pubblicata e installata, e anche in una scheda del browser. Annotare modello, sistema e browser.

1. Spunta di una serie → schermo intero con il tempo giusto e la prossima serie; le cifre si leggono a braccio teso, al sole e in penombra.
2. −15 s, +15 s, Salta, Riduci: rispondono al primo tocco, anche con le mani sudate.
3. Fine recupero con lo schermo acceso: suono (con il silenzioso disattivato), vibrazione su Android; su iPhone nessuna vibrazione (atteso).
4. Lo schermo resta acceso durante l'allenamento senza toccarlo per 2–3 minuti (wake lock). Su iPhone: provare installata e in Safari.
5. Bloccare il telefono a metà recupero, sbloccare dopo la fine → "Recupero finito da …", nessun suono fuori tempo; sbloccare prima della fine → tempo giusto.
6. Chiudere l'app a metà recupero e riaprirla → stesso timer, stesso tempo.
7. Ridurre il timer, correggere una serie, aprire Calendario → il timer ridotto è nella mini-barra; la freccia riporta all'allenamento.
8. Superserie 2a/2b: nessun recupero dopo 2a, recupero dopo 2b.
9. Togliere la spunta durante il recupero → il timer sparisce.
10. Con suono e vibrazione spenti nelle Impostazioni → solo lo schermo lime.
