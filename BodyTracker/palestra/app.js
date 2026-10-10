/* BodyTracker: nessuna richiesta di rete per leggere o salvare allenamenti.
   Il catalogo è separato dal diario; gli approfondimenti non cambiano lo storico. */
'use strict';
const chiaveArchivio = 'bodytracker.archivio.v1';
const catalogo = window.catalogoEsercizi;
const schede = window.schedeIniziali;
let archivio = { versione: 1, allenamenti: [] };
let vista = 'allenamento', identificativoAperto = null, modifichePendenti = false, archivioBloccato = false;
let contenutoGrezzo = null, datiImportati = null;
const contenuto = document.getElementById('contenuto');
const finestra = document.getElementById('finestra');
const simboli = {
 aggiungi: '<path d="M12 5v14M5 12h14"/>',
 rimuovi: '<path d="M6 6l12 12M18 6L6 18"/>',
 cestino: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7M14 10v7"/>',
 fatto: '<path d="M5 12l4 4L19 6"/>',
 info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>'
};
function icona(nome) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+simboli[nome]+'</svg>'; }
function proteggi(valore) { return String(valore ?? '').replace(/[&<>"']/g, carattere => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[carattere])); }
function identificativo() { return crypto.randomUUID ? crypto.randomUUID() : 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2); }
function dataOggi() { const data = new Date(); return [data.getFullYear(),String(data.getMonth()+1).padStart(2,'0'),String(data.getDate()).padStart(2,'0')].join('-'); }
function dataValida(data) { return typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data) && new Date(data+'T12:00:00Z').toISOString().slice(0,10) === data; }
function dataLeggibile(data) { return new Date(data+'T12:00:00').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}); }
function allenamentoAperto() { return archivio.allenamenti.find(allenamento => allenamento.id === identificativoAperto); }
function avviso(testo) { const elemento = document.getElementById('messaggio'); elemento.textContent = testo; elemento.hidden = !testo; }
function stato(testo, errore = false) { const elemento = document.getElementById('stato'); elemento.textContent = testo; elemento.classList.toggle('errore',errore); }
function salva() {
 if (archivioBloccato) { avviso('L’archivio non è disponibile. Esporta il contenuto originale o importa un backup dalla sezione Dati e privacy.'); return false; }
 try { localStorage.setItem(chiaveArchivio,JSON.stringify(archivio)); modifichePendenti = false; stato('Salvato su questo dispositivo'); return true; }
 catch (errore) { modifichePendenti = true; stato('Salvataggio non riuscito',true); avviso('Il browser non consente il salvataggio o lo spazio è esaurito. Esporta subito un backup da Dati e privacy; le modifiche restano aperte in questa pagina.'); return false; }
}
function carica() {
 try {
  contenutoGrezzo = localStorage.getItem(chiaveArchivio);
  if (contenutoGrezzo !== null) archivio = convalidaArchivio(JSON.parse(contenutoGrezzo));
  const aperto = [...archivio.allenamenti].reverse().find(allenamento => !allenamento.concluso);
  identificativoAperto = aperto?.id ?? null;
 } catch (errore) { archivioBloccato = true; avviso('Non riesco a leggere l’archivio locale. Il contenuto originale non è stato sovrascritto: puoi scaricarlo da Dati e privacy e importare un backup valido.'); }
}
/* Un backup è accettato solo se ogni allenamento ha una struttura valida.
   La ricostruzione esplicita impedisce di importare proprietà estranee. */
function convalidaArchivio(dati) {
 if (!dati || dati.versione !== 1 || !Array.isArray(dati.allenamenti) || dati.allenamenti.length > 10000) throw new Error('Formato di backup non riconosciuto.');
 const identificativi = new Set();
 const stringa = (valore, limite) => typeof valore === 'string' && valore.length <= limite;
 const numero = (valore, intero = false) => stringa(valore,16) && (valore === '' || (/^\d+(\.\d+)?$/.test(valore) && Number(valore) <= 10000 && (!intero || Number.isInteger(Number(valore)))));
 return {versione:1,allenamenti:dati.allenamenti.map(allenamento => {
  if (!allenamento || !stringa(allenamento.id,100) || !allenamento.id || identificativi.has(allenamento.id) || !dataValida(allenamento.data) || !stringa(allenamento.nome,120) || typeof allenamento.concluso !== 'boolean' || !Array.isArray(allenamento.esercizi) || allenamento.esercizi.length > 100) throw new Error('Il backup contiene un allenamento non valido o duplicato.');
  identificativi.add(allenamento.id);
  const nomiEsercizi = new Set();
  return {id:allenamento.id,data:allenamento.data,scheda:['A','B','libero'].includes(allenamento.scheda)?allenamento.scheda:'libero',nome:allenamento.nome,concluso:allenamento.concluso,esercizi:allenamento.esercizi.map(esercizio => {
   if (!esercizio || !stringa(esercizio.id,100) || !esercizio.id || nomiEsercizi.has(esercizio.id) || !stringa(esercizio.nome,200) || !esercizio.nome.trim() || !stringa(esercizio.catalogoId,200) || !stringa(esercizio.varianteId,200) || !stringa(esercizio.variante,200) || !stringa(esercizio.note,1000) || typeof esercizio.completato !== 'boolean' || !Array.isArray(esercizio.serie) || esercizio.serie.length < 1 || esercizio.serie.length > 100) throw new Error('Il backup contiene un esercizio non valido.');
   nomiEsercizi.add(esercizio.id);
   return {id:esercizio.id,nome:esercizio.nome,catalogoId:esercizio.catalogoId,varianteId:esercizio.varianteId,variante:esercizio.variante,note:esercizio.note,completato:esercizio.completato,serie:esercizio.serie.map(serie => {
    if (!serie || !numero(serie.peso) || !numero(serie.ripetizioni,true)) throw new Error('Il backup contiene una serie non valida.');
    return {peso:serie.peso,ripetizioni:serie.ripetizioni};
   })};
  })};
 })};
}
function esercizioDaCatalogo(id, nome) { return {id:identificativo(),catalogoId:id || '',nome,varianteId:id || '',variante:nome,serie:[{peso:'',ripetizioni:''}],note:'',completato:false}; }
function creaAllenamento(modello) {
 if (archivioBloccato) return avviso('Ripristina prima l’archivio da Dati e privacy.');
 const allenamento = {id:identificativo(),data:dataOggi(),scheda:modello,nome:modello === 'libero' ? 'Allenamento libero' : 'Scheda '+modello,concluso:false,esercizi:modello === 'libero' ? [] : schede[modello].map(esercizio => esercizioDaCatalogo(esercizio.id,esercizio.nome))};
 archivio.allenamenti.push(allenamento); identificativoAperto = allenamento.id; salva(); mostra();
 if (modello === 'libero') aggiungiEsercizio();
}
function riferimento(esercizio) { const preferita=schede[allenamentoAperto()?.scheda] || []; return [...preferita,...schede.A,...schede.B].find(elemento => elemento.id === esercizio.catalogoId); }
function precedente(esercizio) {
 const aperto = allenamentoAperto();
 return archivio.allenamenti.filter(a => a.id !== aperto.id && a.concluso && a.data <= aperto.data).sort((a,b) => b.data.localeCompare(a.data)).flatMap(a => a.esercizi.map(e => ({allenamento:a,esercizio:e}))).find(r => r.esercizio.varianteId === esercizio.varianteId && r.esercizio.variante === esercizio.variante && r.esercizio.serie.some(s => s.peso || s.ripetizioni));
}
function mostraEsercizio(esercizio, indice) {
 const guida = riferimento(esercizio), prima = precedente(esercizio);
 const varianti = guida ? [{id:guida.id,nome:guida.nome},...guida.alternative] : [{id:esercizio.varianteId,nome:esercizio.variante}];
 if (!varianti.some(v => v.id === esercizio.varianteId)) varianti.push({id:esercizio.varianteId,nome:esercizio.variante});
 return `<section class="esercizio ${esercizio.completato?'completato':''}" data-esercizio="${proteggi(esercizio.id)}"><div class="testa-esercizio"><span class="ordine">${guida?.ordine || indice+1}</span><button class="nome-esercizio" data-azione="approfondimento" data-id="${proteggi(esercizio.id)}" aria-label="Apri scheda: ${proteggi(esercizio.variante)}">${proteggi(esercizio.nome)}${icona('info')}</button><button class="icona spunta" data-azione="completa" data-id="${proteggi(esercizio.id)}" aria-pressed="${esercizio.completato}" aria-label="${esercizio.completato?'Segna da fare':'Segna completato'}: ${proteggi(esercizio.nome)}">${icona('fatto')}</button></div>
 ${guida?`<p class="riferimento"><b>${guida.ripetizioni} rip.</b> · Recupero ${guida.recupero}<br>Partenza: ${proteggi(guida.partenza)}${guida.unita?' · '+proteggi(guida.unita):''}<span>Indicazioni per l’esercizio principale, non per le alternative</span></p>`:''}
 <div class="campi-identita"><label>Variante<select data-campo="variante">${varianti.map(v=>`<option value="${proteggi(v.id)}" ${v.id===esercizio.varianteId?'selected':''}>${proteggi(v.nome)}</option>`).join('')}</select></label><details class="modifica-nome"><summary>Modifica nome</summary><label>Nome esercizio<input data-campo="nome" value="${proteggi(esercizio.nome)}" maxlength="200" required></label></details></div>
 ${prima?`<p class="precedente">Ultima volta, ${dataLeggibile(prima.allenamento.data)}: <b>${prima.esercizio.serie.map(s=>`${proteggi(s.peso)||'—'} kg × ${proteggi(s.ripetizioni)||'—'}`).join(' · ')}</b></p>`:''}
 <div class="intestazioni-serie"><span>Serie</span><span>Peso · kg</span><span>Ripetizioni</span><span></span></div>${esercizio.serie.map((serie,i)=>`<div class="serie"><span class="numero-serie">${i+1}</span><input type="number" min="0" max="10000" step="any" inputmode="decimal" placeholder="—" aria-label="Peso in kg, serie ${i+1}, ${proteggi(esercizio.nome)}" data-campo="peso" data-serie="${i}" value="${proteggi(serie.peso)}"><input type="number" min="0" max="10000" step="1" inputmode="numeric" placeholder="—" aria-label="Ripetizioni, serie ${i+1}, ${proteggi(esercizio.nome)}" data-campo="ripetizioni" data-serie="${i}" value="${proteggi(serie.ripetizioni)}"><button class="icona" data-azione="rimuovi-serie" data-id="${proteggi(esercizio.id)}" data-serie="${i}" aria-label="Rimuovi serie ${i+1}" ${esercizio.serie.length===1?'disabled':''}>${icona('rimuovi')}</button></div>`).join('')}
 <button class="testuale" data-azione="aggiungi-serie" data-id="${proteggi(esercizio.id)}">${icona('aggiungi')} Aggiungi serie</button><label>Note<input data-campo="note" maxlength="1000" placeholder="Es. carico totale, per manubrio o aggiunto" value="${proteggi(esercizio.note)}"></label><button class="elimina-esercizio" data-azione="elimina-esercizio" data-id="${proteggi(esercizio.id)}">Rimuovi esercizio</button></section>`;
}
function mostra() {
 document.querySelectorAll('[data-vista]').forEach(pulsante => {if(pulsante.dataset.vista===vista)pulsante.setAttribute('aria-current','page');else pulsante.removeAttribute('aria-current');});
 document.getElementById('barra').hidden = vista !== 'allenamento' || !allenamentoAperto();
 if (vista === 'storico') return mostraStorico();
 if (vista === 'dati') return mostraDati();
 const allenamento = allenamentoAperto();
 if (!allenamento) {
  contenuto.innerHTML = `<div class="introduzione"><h1>Il prossimo allenamento</h1><p>Parti da una scheda o scegli i tuoi esercizi.</p></div><div class="scelta-schede"><button data-azione="inizia" data-modello="A"><strong>Scheda A</strong><span>Squat, panca e hip thrust</span><small>8 esercizi · con alternative</small></button><button data-azione="inizia" data-modello="B"><strong>Scheda B</strong><span>Rumeno, inclinata e leg press</span><small>8 esercizi · con alternative</small></button></div><button class="primario ampio" data-azione="inizia" data-modello="libero">Allenamento libero</button><p class="nota-locale">I dati restano in questo browser. Esporta un backup per conservarli anche altrove.</p>`;
  return;
 }
 const completati = allenamento.esercizi.filter(e=>e.completato).length;
 contenuto.innerHTML = `<div class="titolo-sessione"><div><h1>${proteggi(allenamento.nome)}</h1><p>${allenamento.concluso?'Concluso · puoi ancora modificarlo':'In corso'} · <span id="conteggio">${completati}/${allenamento.esercizi.length}</span> esercizi completati</p></div><button class="secondario" data-azione="torna">Cambia allenamento</button></div><div class="dati-sessione"><label>Data allenamento<input type="date" id="data-allenamento" value="${allenamento.data}" required></label><details class="modifica-nome"><summary>Modifica nome allenamento</summary><label>Nome allenamento<input id="nome-allenamento" value="${proteggi(allenamento.nome)}" maxlength="120" required></label></details></div><div id="lista-esercizi">${allenamento.esercizi.map(mostraEsercizio).join('') || '<div class="vuoto"><h2>Da quale esercizio inizi?</h2><p>Aggiungi un esercizio dal catalogo o scrivine uno tuo.</p></div>'}</div><button class="secondario ampio" data-azione="aggiungi-esercizio">${icona('aggiungi')} Aggiungi esercizio</button><div class="azioni-sessione"><button class="primario" data-azione="concludi">${allenamento.concluso?'Riapri allenamento':'Concludi allenamento'}</button><button class="pericolo" data-azione="elimina-allenamento">Elimina allenamento</button></div>`;
 stato(modifichePendenti?'Modifiche da salvare':'Salvato su questo dispositivo',modifichePendenti);
}
function mostraStorico() {
 const ordinati = [...archivio.allenamenti].sort((a,b)=>b.data.localeCompare(a.data));
 contenuto.innerHTML = `<div class="introduzione"><h1>Il tuo storico</h1><p>${ordinati.length} ${ordinati.length===1?'allenamento registrato':'allenamenti registrati'}</p></div>${ordinati.length?ordinati.map(a=>`<button class="riga-storico" data-azione="apri" data-id="${proteggi(a.id)}"><span class="giorno">${new Date(a.data+'T12:00:00').getDate()}<small>${new Date(a.data+'T12:00:00').toLocaleDateString('it-IT',{month:'short',year:'numeric'})}</small></span><span><strong>${proteggi(a.nome)}</strong><small>${a.concluso?'Concluso':'In corso'} · ${a.esercizi.length} esercizi · ${a.esercizi.reduce((s,e)=>s+e.serie.length,0)} serie</small></span><span class="apri">Apri</span></button>`).join(''):'<div class="vuoto"><h2>Qui ritroverai i tuoi allenamenti</h2><p>Le sessioni compaiono appena le inizi, anche prima di concluderle.</p><button class="primario" data-azione="nuovo">Inizia il primo</button></div>'}`;
}
function mostraDati() {
 contenuto.innerHTML = `<div class="introduzione"><h1>I tuoi dati, sul tuo dispositivo</h1><p>Nessun account. Nessuna sincronizzazione online.</p></div><section class="sezione-dati"><h2>Backup degli allenamenti</h2><p>Esporta un file JSON e conservalo. Puoi importarlo nello stesso browser o su un altro dispositivo.</p><div class="azioni-backup"><button class="primario" data-azione="esporta">Esporta JSON</button><label class="secondario pulsante-file">Importa JSON<input type="file" id="importa" accept="application/json,.json"></label></div>${archivioBloccato?'<button class="testuale" data-azione="esporta-originale">Scarica il contenuto originale non leggibile</button>':''}</section><section class="sezione-dati"><h2>Come vengono conservati</h2><p>BodyTracker salva gli allenamenti esclusivamente nel localStorage di questo browser e non li invia a server esterni. Ogni visitatore ha il proprio diario.</p><p>Cambiando browser, dispositivo o dominio non ritroverai automaticamente i dati. Cancellando i dati del sito puoi perdere lo storico; in navigazione privata il browser può eliminarlo alla chiusura.</p><p>Il sito che ospita questa pagina potrebbe avere statistiche o altri script propri: questa copia autonoma di BodyTracker non ne include.</p></section><section class="sezione-dati"><h2>Schede degli esercizi</h2><p>Tocca il nome di un esercizio per aprire la sua scheda. Spiegazioni e immagini potranno essere aggiunte al catalogo senza cambiare gli allenamenti già registrati.</p></section>`;
}
function apriFinestra(titolo,corpo) { document.getElementById('titolo-finestra').textContent = titolo; document.getElementById('corpo-finestra').innerHTML = corpo; finestra.showModal(); }
function conferma(titolo,testo,azione) {
 apriFinestra(titolo,`<p>${proteggi(testo)}</p><div class="azioni-finestra"><button class="secondario" id="annulla">Annulla</button><button class="pericolo" id="conferma">Conferma</button></div>`);
 document.getElementById('annulla').onclick = ()=>finestra.close();
 document.getElementById('conferma').onclick = ()=>{finestra.close();azione();};
}
function aggiungiEsercizio() {
 const nomi = Object.values(catalogo).sort((a,b)=>a.nome.localeCompare(b.nome));
 apriFinestra('Aggiungi esercizio',`<form id="nuovo-esercizio"><label>Nome esercizio<input id="nome-nuovo" list="nomi-catalogo" placeholder="Cerca o scrivi un esercizio" maxlength="200" required autofocus autocomplete="off"></label><datalist id="nomi-catalogo">${nomi.map(e=>`<option value="${proteggi(e.nome)}"></option>`).join('')}</datalist><p class="secondario-testo">Puoi usare qualsiasi nome, anche se non è nel catalogo.</p><button class="primario ampio" type="submit">Aggiungi all’allenamento</button></form>`);
 document.getElementById('nuovo-esercizio').onsubmit = evento=>{evento.preventDefault();const nome = document.getElementById('nome-nuovo').value.trim();if(!nome)return;const sessione=allenamentoAperto();if(sessione.esercizi.length>=100)return avviso('Il limite è 100 esercizi per allenamento.');const trovato=nomi.find(e=>e.nome.toLocaleLowerCase('it')===nome.toLocaleLowerCase('it'));sessione.esercizi.push(esercizioDaCatalogo(trovato?.id,nome));salva();finestra.close();mostra();document.querySelector('[data-esercizio="'+sessione.esercizi.at(-1).id+'"]')?.scrollIntoView({block:'start',behavior:'smooth'});};
}
/* Solo immagini locali o incorporate: un approfondimento non aggiunge
   tracciamenti o risorse esterne. I collegamenti alle fonti sono espliciti. */
function percorsoImmagineSicuro(percorso) { return typeof percorso==='string' && (percorso.startsWith('data:image/') && !percorso.startsWith('data:image/svg') || /^(\.\/)?[a-zA-Z0-9_-][a-zA-Z0-9_./-]*\.(png|jpg|jpeg|webp|avif|gif)$/i.test(percorso) && !percorso.includes('..')); }
function approfondimento(esercizio) {
 const scheda = catalogo[esercizio.varianteId];
 const esiste = scheda && (scheda.descrizione || scheda.passaggi.length || scheda.immagine);
 let corpo = esiste ? `${percorsoImmagineSicuro(scheda.immagine)?`<img class="immagine-esercizio" src="${proteggi(scheda.immagine)}" alt="${proteggi(scheda.testoAlternativo || scheda.nome)}" loading="lazy">`:''}${scheda.descrizione?`<p class="descrizione">${proteggi(scheda.descrizione)}</p>`:''}${scheda.passaggi.length?`<h3>Esecuzione</h3><ol>${scheda.passaggi.map(p=>`<li>${proteggi(p)}</li>`).join('')}</ol>`:''}${scheda.attenzione?`<h3>Da tenere presente</h3><p>${proteggi(scheda.attenzione)}</p>`:''}${scheda.fonti?.length?`<h3>Fonti</h3><ul>${scheda.fonti.filter(f=>/^https?:\/\//.test(f.url)).map(f=>`<li><a href="${proteggi(f.url)}" target="_blank" rel="noopener noreferrer">${proteggi(f.titolo)}</a></li>`).join('')}</ul>`:''}` : '<p>L’approfondimento per questo esercizio non è ancora disponibile.</p><p class="secondario-testo">Puoi continuare a registrare serie e carichi.</p>';
 apriFinestra(esercizio.variante,corpo);
}
function scarica(nome,contenutoFile) { const indirizzo=URL.createObjectURL(new Blob([contenutoFile],{type:'application/json'}));const collegamento=document.createElement('a');collegamento.href=indirizzo;collegamento.download=nome;collegamento.click();setTimeout(()=>URL.revokeObjectURL(indirizzo),1000); }
async function importa(file) {
 if(!file)return;
 try {
  if(file.size>10*1024*1024)throw new Error('Il file supera il limite di 10 MB.');
  datiImportati=convalidaArchivio(JSON.parse(await file.text()));
  const esistenti=new Set(archivio.allenamenti.map(a=>a.id));
  const nuovi=datiImportati.allenamenti.filter(a=>!esistenti.has(a.id)).length;
  const conflitti=datiImportati.allenamenti.length-nuovi;
  apriFinestra('Importa backup',`<p>${datiImportati.allenamenti.length} allenamenti nel file: ${nuovi} nuovi e ${conflitti} già presenti.</p><p>Gli allenamenti nuovi verranno aggiunti. Scegli come gestire quelli con lo stesso identificativo.</p><label>Allenamenti già presenti<select id="gestione-conflitti"><option value="mantieni">Mantieni quelli su questo dispositivo</option><option value="sostituisci">Sostituisci con quelli del backup</option></select></label><div class="azioni-finestra"><button id="annulla-importazione" class="secondario">Annulla</button><button id="conferma-importazione" class="primario">Importa backup</button></div>`);
  document.getElementById('annulla-importazione').onclick=()=>{datiImportati=null;finestra.close();};
  document.getElementById('conferma-importazione').onclick=()=>{
   const mappa=new Map(archivio.allenamenti.map(a=>[a.id,a]));
   const sostituisci=document.getElementById('gestione-conflitti').value==='sostituisci';
   datiImportati.allenamenti.forEach(a=>{if(!mappa.has(a.id)||sostituisci)mappa.set(a.id,a);});
   if(mappa.size>10000){avviso('Il diario risultante supera il limite di 10.000 allenamenti. Importazione annullata.');finestra.close();return;}archivio={versione:1,allenamenti:[...mappa.values()]};archivioBloccato=false;datiImportati=null;finestra.close();
   const riuscito=salva();if(riuscito)avviso('Backup importato e salvato su questo dispositivo.');vista='storico';mostra();
  };
 } catch(errore) { datiImportati=null;avviso('Importazione non riuscita: '+errore.message+' Il diario esistente non è stato modificato.'); }
}
contenuto.addEventListener('input',evento=>{
 const campo=evento.target, allenamento=allenamentoAperto();if(!allenamento || archivioBloccato)return;
 if(campo.id==='nome-allenamento'){if(!campo.value.trim())return campo.setCustomValidity('Inserisci il nome dell’allenamento.');campo.setCustomValidity('');allenamento.nome=campo.value;contenuto.querySelector('h1').textContent=campo.value;salva();return;}
 const contenitore=campo.closest('[data-esercizio]');if(!contenitore)return;
 const esercizio=allenamento.esercizi.find(e=>e.id===contenitore.dataset.esercizio);
 if(['peso','ripetizioni'].includes(campo.dataset.campo)){
  if(!campo.validity.valid || (campo.value && Number(campo.value)<0))return stato('Correggi il valore evidenziato',true);
  esercizio.serie[Number(campo.dataset.serie)][campo.dataset.campo]=campo.value;
 }else if(campo.dataset.campo==='nome'){
  if(!campo.value.trim())return campo.setCustomValidity('Inserisci il nome dell’esercizio.');campo.setCustomValidity('');esercizio.nome=campo.value;
  const pulsante=contenitore.querySelector('.nome-esercizio');pulsante.innerHTML=proteggi(campo.value)+icona('info');
 }else if(campo.dataset.campo==='note')esercizio.note=campo.value;else return;
 salva();
});
contenuto.addEventListener('change',evento=>{
 const campo=evento.target;if(campo.id==='importa')return importa(campo.files[0]);
 const allenamento=allenamentoAperto();if(!allenamento)return;
 if(campo.id==='data-allenamento'){if(dataValida(campo.value)){allenamento.data=campo.value;salva();mostra();}return;}
 if(campo.dataset.campo==='variante'){
  const esercizio=allenamento.esercizi.find(e=>e.id===campo.closest('[data-esercizio]').dataset.esercizio);
  const applica=()=>{esercizio.varianteId=campo.value;esercizio.variante=campo.selectedOptions[0].textContent;esercizio.serie=[{peso:'',ripetizioni:''}];esercizio.completato=false;salva();mostra();};
  if(esercizio.serie.some(s=>s.peso||s.ripetizioni)){
   const nuovoId=campo.value, nuovoNome=campo.selectedOptions[0].textContent;campo.value=esercizio.varianteId;
   conferma('Cambiare variante?','Le serie già inserite per questo esercizio verranno svuotate, perché il carico si riferisce alla variante attuale.',()=>{esercizio.varianteId=nuovoId;esercizio.variante=nuovoNome;esercizio.serie=[{peso:'',ripetizioni:''}];esercizio.completato=false;salva();mostra();});
  }else applica();
 }
});
document.addEventListener('click',evento=>{
 const pulsante=evento.target.closest('button');if(!pulsante || pulsante.disabled)return;
 if(pulsante.dataset.vista){vista=pulsante.dataset.vista;mostra();return;}
 const azione=pulsante.dataset.azione;if(!azione)return;
 const allenamento=allenamentoAperto();const esercizio=allenamento?.esercizi.find(e=>e.id===pulsante.dataset.id);
 if(azione==='inizia')return creaAllenamento(pulsante.dataset.modello);
 if(azione==='nuovo'||azione==='torna'){identificativoAperto=null;vista='allenamento';mostra();return;}
 if(azione==='apri'){identificativoAperto=pulsante.dataset.id;vista='allenamento';mostra();return;}
 if(azione==='esporta')return scarica('bodytracker-'+dataOggi()+'.json',JSON.stringify({...archivio,esportatoIl:new Date().toISOString()},null,2));
 if(azione==='esporta-originale')return scarica('bodytracker-contenuto-originale.json',contenutoGrezzo ?? '');
 if(azione==='aggiungi-esercizio')return aggiungiEsercizio();
 if(azione==='approfondimento')return approfondimento(esercizio);
 if(azione==='elimina-allenamento')return conferma('Eliminare l’allenamento?','Questa operazione rimuove tutti gli esercizi e le serie della sessione. Puoi recuperarli solo da un backup.',()=>{archivio.allenamenti=archivio.allenamenti.filter(a=>a.id!==allenamento.id);identificativoAperto=null;salva();mostra();});
 if(azione==='elimina-esercizio')return conferma('Rimuovere l’esercizio?',esercizio.nome+' e tutte le sue serie verranno rimossi da questo allenamento.',()=>{allenamento.esercizi=allenamento.esercizi.filter(e=>e.id!==esercizio.id);salva();mostra();});
 if(azione==='concludi'){
  if(!allenamento.esercizi.length)return avviso('Aggiungi almeno un esercizio prima di concludere.');
  allenamento.concluso=!allenamento.concluso;salva();mostra();return;
 }
 if(azione==='completa'){esercizio.completato=!esercizio.completato;salva();mostra();return;}
 if(azione==='aggiungi-serie'){if(esercizio.serie.length>=100)return avviso('Il limite è 100 serie per esercizio.');const ultima=esercizio.serie.at(-1);esercizio.serie.push({peso:ultima.peso,ripetizioni:''});salva();mostra();return;}
 if(azione==='rimuovi-serie' && esercizio.serie.length>1){const indice=Number(pulsante.dataset.serie);const applica=()=>{esercizio.serie.splice(indice,1);salva();mostra();};if(esercizio.serie[indice].peso||esercizio.serie[indice].ripetizioni)return conferma('Rimuovere la serie?','I valori di questa serie verranno eliminati.',applica);applica();}
});
document.getElementById('chiudi-finestra').innerHTML=icona('rimuovi');
document.getElementById('chiudi-finestra').onclick=()=>finestra.close();
document.getElementById('salva').onclick=()=>salva();
window.addEventListener('beforeunload',evento=>{if(modifichePendenti){evento.preventDefault();evento.returnValue='';}});
/* Se un’altra scheda modifica il diario, non sovrascriviamo lo storico:
   questa scheda deve prima ricaricare o esportare le proprie modifiche. */
window.addEventListener('storage',evento=>{if(evento.key===chiaveArchivio){archivioBloccato=true;avviso('Il diario è stato modificato in un’altra scheda. Esporta eventuali modifiche aperte e ricarica questa pagina prima di continuare.');}});
carica();mostra();
