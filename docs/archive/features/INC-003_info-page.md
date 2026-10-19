# SPEC — Pagina Info, icone dell'intestazione, paternità del repo

Stato: **chiusa con INC-003** (una sola milestone, un incremento).

## Obiettivo

Una pagina `/info/` sul progetto con i contatti dell'autore, raggiungibile da un'icona «?» nell'intestazione;
l'icona delle Impostazioni passa dagli slider all'ingranaggio; il repo dichiara l'autore.

## Analisi (stato attuale)

- **Intestazione:** `src/components/ui/AppHeader.astro`, montata da `src/layouts/AppLayout.astro`. A destra uno
  slot `actions` e il link alle Impostazioni (`SlidersHorizontal`, `aria-label="Impostazioni"`), nascosto con
  `showSettings={false}` (solo `/settings/`). `/welcome/` non ha intestazione; `/workout/` ha il ritorno a sinistra.
- **Icone:** Lucide (`@lucide/astro` nelle pagine, `@lucide/svelte` nelle isole). Ingranaggio = `settings`,
  punto interrogativo = `circle-question-mark`, entrambe già nel pacchetto installato.
- **Dati:** diario in `localStorage` (`workout-tracker.archive.v2`) via `src/lib/archive/repository.ts`; tema,
  ultimo backup, timer e suggerimenti in altre chiavi `localStorage`. Niente IndexedDB.
- **Persistenza:** già chiesta. `askPersistenceOnce()` (`src/lib/archive-store.svelte.ts`), chiamata da
  `ArchiveStatus` al mount: una volta per visita, solo se esiste un archivio (mai al primo avvio), errori
  ignorati. Le Impostazioni mostrano l'esito (`persisted()`). **Nessuna modifica necessaria.**
- **Import/export:** Impostazioni › Dati e privacy (`DataSection.svelte`, `id="data"`): «Esporta backup» scarica
  un JSON (`exportArchive`), «Importa backup» apre `ImportFlow` (v2 e PoC v1) con anteprima. `/settings#data`
  scorre già alla sezione (`SettingsPage.svelte:65`), usato da 8 link dell'app.
- **PWA:** manifest generato (`src/pages/manifest.webmanifest.ts`), service worker workbox con precache di tutto
  `dist/` (`src/integrations/service-worker.ts`): `/info/` entra nel precache da sola.
- **Lingua:** solo italiano, testi nel codice, nessun sistema di traduzioni.
- **Versione:** `package.json` è fermo a `0.0.1` e non è esposto nell'app; il contatore reale è `INC-XXX` in
  testa a `CHANGELOG.md`.
- **Repo:** `github.com/francescoperagine/workout-tracker`, pubblico (API GitHub senza credenziali: 200).
- **Email:** `info@francescoperagine.com`, da `../personal-website/src/consts.ts` (`EMAIL`, usata da `ContactPage.astro`).

## Ambito

1. `AppHeader.astro`: `SlidersHorizontal` → `Settings` (ingranaggio); nuovo link «?» (`CircleQuestionMark`,
   `aria-label="Informazioni"`, stesso `btn btn-icon`) a sinistra dell'ingranaggio, verso `appUrl('/info')`.
   Prop `showInfo` (default `true`) passata da `AppLayout`, `false` solo su `/info/`. Su `/settings/` resta la «?».
   Nessuna voce nella tab bar.
2. `src/pages/info.astro`: pagina statica (nessuna isola, nessun JS), `AppLayout title="Info"`, tab bar senza voce
   attiva, `showInfo={false}`. Componenti e classi esistenti (`panel`, titolo di sezione, `btn`). Testi sotto.
3. Mailto: `mailto:info@francescoperagine.com?subject=Workout%20Tracker`, senza corpo (vedi D1). Link avvolto in
   `<!--email_off-->…<!--/email_off-->` (vedi Rischi).
4. `Base.astro`: `<meta name="author" content="Francesco Peragine" />`.
5. `package.json`: `author` `{ "name": "Francesco Peragine", "url": "https://francescoperagine.com" }`,
   `homepage` `https://workout-tracker.francescoperagine.com`.
6. `README.md`: sezione «Autore» con nome, sito, LinkedIn.
7. E2E `US-34`: la «?» porta a `/info/` da ogni pagina con intestazione, l'ingranaggio alle Impostazioni, il mailto
   ha l'oggetto atteso, nessuna richiesta esterna, il link all'export porta a `/settings/#data`.
8. Docs: `CHANGELOG.md` (INC nuovo), `docs/ARCHITECTURE.md` se elenca le pagine, chiusura della feature.

Fuori ambito: persistenza (già presente), traduzioni, voce nella tab bar, numero di versione visibile in pagina.

## Testi della pagina

Approvati da Francesco il 19 ottobre 2026; il testo di riferimento è `src/pages/info.astro`. Unico cambio rispetto
alla proposta: nella sezione dei contatti l'invito a raccontare cosa è successo e ad allegare uno screenshot.

## Decisioni

- **D1 — Niente versione nel corpo dell'email** (Francesco): chi scrive non sa a cosa serve l'`INC-XXX`; un
  messaggio utile è testo più screenshot. Il mailto ha solo l'oggetto e la pagina invita ad allegare uno screenshot.

## Rischi

- **Offuscamento email di Cloudflare:** l'app è sulla stessa zona del sito personale. Se Email Obfuscation è attiva,
  Cloudflare riscrive i `mailto:` in `/cdn-cgi/l/email-protection` con uno script esterno al precache: offline il
  link si rompe. Mitigazione: commenti `email_off` (documentati da Cloudflare) e, dopo il deploy, `curl` della
  pagina in produzione per verificare che il `mailto:` arrivi intatto.

## Verifica

Gate di `AGENTS.md` con codici d'uscita; pagina e icone a 390×844 e 320×568, tema chiaro e scuro; `href` del mailto
controllato nell'e2e e aperto in locale (`open "mailto:…"`) nel client di posta.
