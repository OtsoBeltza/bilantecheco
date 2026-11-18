'use strict';
/* ============================================================
   APPLICATION — logique, interface, rapport
   ============================================================ */
const STORE_KEY = 'bilans-ovins-ordiarp-v1';
const num = v => { if(v===''||v==null) return 0; if(typeof v==='number') return isFinite(v)?v:0; const x=parseFloat(String(v).replace(/[\s  ]/g,'').replace(',','.')); return isFinite(x)?x:0; };
const dv = (a,b) => (a==null||!isFinite(a)||b==null||!b||!isFinite(b)) ? null : a/b;
const jours = (a,b) => { if(!a||!b) return null; const x=Math.round((new Date(b)-new Date(a))/864e5); return isFinite(x)&&x>=0?x:null; };
const _nf = d => new Intl.NumberFormat('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
const FM = { int:v=>_nf(0).format(v), d1:v=>_nf(1).format(v), d2:v=>_nf(2).format(v), pct:v=>_nf(1).format(v*100)+' %', eur:v=>_nf(0).format(v)+' €', eur2:v=>_nf(2).format(v)+' €' };
const fmtVal = (v,f) => (v==null||typeof v!=='number'||!isFinite(v)) ? '—' : (FM[f]||FM.d2)(v);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/* Module d'observations ajouté ici (texte libre) */
MODULES.push({ id:'obs', t:'Observations et conseils', court:'Conseils', intro:'Ce que vous avez vu sur place. Ces trois cadres sont repris dans le rapport remis à l\'éleveur.',
  blocs:[ { t:'Contexte de la campagne', f:[ A('aleas','Aléas de l\'année (sécheresse, maladie, prédation, prix…)'), S('predation','Pression de prédation',['Aucune constatée','Occasionnelle','Régulière']), A('projets','Projets de l\'éleveur') ] },
          { t:'Commentaires du technicien', f:[ A('com_forts','Points forts'), A('com_vigilance','Points de vigilance'), A('com_conseils','Conseils pour la campagne suivante') ] } ] });

/* Index des champs et des calculs */
const ALLC = {}, FIELDS = {};
MODULES.forEach(m=>m.blocs.forEach(b=>(b.f||[]).forEach(f=>{ FIELDS[f.k]=f; if(f.t==='c') ALLC[f.k]=f; })));
const defaultsScalaires = () => { const o={}; Object.values(FIELDS).forEach(f=>{ if(f.def!=null) o[f.k]=f.def; }); return o; };
const fmtChamp = f => f.t==='c' ? f.fmt : (f.u==='€'||f.u==='€/ha') ? 'eur' : (f.d===2?'d2':f.d===1?'d1':'int');

/* ---------------- État et stockage ---------------- */
let DB = { version:1, exps:[], refs:{} };
let cur = null;
let stockageOk = true;
let vue = {nom:'home', mod:0};
let saveTimer = null;

function charger(){ try{ const s=localStorage.getItem(STORE_KEY); if(s){ const d=JSON.parse(s); if(d&&Array.isArray(d.exps)) DB=Object.assign({version:1,exps:[],refs:{}},d); } }catch(e){ stockageOk=false; } }
function sauver(){ try{ localStorage.setItem(STORE_KEY,JSON.stringify(DB)); stockageOk=true; }catch(e){ stockageOk=false; } majEtat(); }
function sauverPlusTard(){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ if(cur) cur.maj=Date.now(); sauver(); },350); }
function majEtat(){ const e=$('#etat'); if(!e) return; const h=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); e.textContent = stockageOk ? `Enregistré sur cet appareil à ${h}` : 'Stockage indisponible : exportez régulièrement vos données'; e.className = stockageOk?'ok':'ko'; }

const nouvelle = () => ({ id:uid(), maj:Date.now(), f:defaultsScalaires(), t:{} });
const nomExp = e => e.f.nom_exploitation || 'Exploitation sans nom';

/* ---------------- Moteur de calcul ---------------- */
function rowsOf(exp,t){ const def=TABLES[t]; let r=exp.t[t]; if(!r) r=exp.t[t]=[]; if(def.fixe){ while(r.length<def.fixe.length) r.push({}); } return r; }
function makeG(exp){
  const memo={}, busy={}, rcCache=new WeakMap();
  const g = {
    n(k){ if(ALLC[k]){ if(k in memo) return memo[k]; if(busy[k]) return null; busy[k]=1; let v=null; try{ v=ALLC[k].f(g); }catch(e){ v=null; } busy[k]=0; if(typeof v!=='number'||!isFinite(v)) v=null; return memo[k]=v; }
          const r=exp.f[k]; return (r===''||r==null)?null:num(r); },
    z(k){ const v=g.n(k); return v==null?0:v; },
    d(k){ return exp.f[k]||null; },
    rows(t){ return rowsOf(exp,t); },
    rc(t,row){ if(rcCache.has(row)) return rcCache.get(row); const o={}; (TABLES[t].rcalcs||[]).forEach(c=>{ let v=null; try{ v=c.f(row,g,o); }catch(e){} o[c.k]=(typeof v==='number'&&isFinite(v))?v:null; }); rcCache.set(row,o); return o; },
    sum(t,col,pred){ const def=TABLES[t]; const isC=(def.rcalcs||[]).some(c=>c.k===col); let s=0, any=false;
      rowsOf(exp,t).forEach(row=>{ if(pred&&!pred(row)) return; let v; if(isC){ v=g.rc(t,row)[col]; if(v==null) return; } else { if(row[col]===''||row[col]==null) return; v=num(row[col]); } s+=v; any=true; });
      return any? s : null; }
  };
  return g;
}

/* ---------------- Références et appréciation ---------------- */
function refOf(ind){ const u=DB.refs[ind.k]||{}; return { ref: u.ref!==undefined? u.ref : (ind.ref!==undefined?ind.ref:''), sens: u.sens||ind.sens, tol: u.tol!==undefined? u.tol : ind.tol, src: u.src!==undefined? u.src : (ind.src||'') }; }
function apprec(ind,val){
  const r=refOf(ind); const ref=num(r.ref);
  if(r.sens==='I') return 'Pour information';
  if(!ref) return 'Pas de référence';
  if(val==null||val===0) return 'Non renseigné';
  const e=(r.sens==='H'?1:-1)*(val-ref)/ref;
  return e>num(r.tol)?'Favorable':(e<-num(r.tol)?'À améliorer':'Proche de la référence');
}
const CLS = {'Favorable':'ok','Proche de la référence':'mid','À améliorer':'bad'};
const chip = a => `<span class="chip ${CLS[a]||'nd'}">${esc(a)}</span>`;
function ecartTxt(ind,val){ const r=refOf(ind), ref=num(r.ref); if(!ref||val==null||val===0) return '—'; const e=(val-ref)/ref*100; return (e>=0?'+':'−')+Math.abs(e).toFixed(0)+' %'; }

/* ---------------- Complétude ---------------- */
function compMod(exp,m){
  let tot=0, ok=0;
  m.blocs.forEach(b=>{ if(b.table){ tot++; const rows=exp.t[b.table]||[]; if(rows.some(r=>Object.values(r).some(v=>v!==''&&v!=null))) ok++; }
    (b.f||[]).forEach(f=>{ if(f.t==='c'||f.def!=null) return; tot++; const v=exp.f[f.k]; if(v!==''&&v!=null) ok++; }); });
  return tot? ok/tot : 0;
}
const compTotale = exp => { const ms=MODULES; return ms.reduce((s,m)=>s+compMod(exp,m),0)/ms.length; };

/* ---------------- Composants HTML ---------------- */
function optionsDyn(g,dyn){
  const t = dyn; const noms=[...new Set(g.rows(t).map(r=>r.nom).filter(Boolean))]; return noms;
}
function champHTML(f,val,attrs,g){
  const aide = f.aide? `<small class="aide">${esc(f.aide)}</small>`:'';
  const unit = f.u? `<span class="u">${esc(f.u)}</span>`:'';
  if(f.t==='c') return `<div class="champ calc${f.fort?' fort':''}"><label>${esc(f.l)}</label><div class="ligne"><span class="val" data-calc="${f.k}">—</span>${unit}</div>${aide}</div>`;
  let inp='';
  if(f.t==='s'){ let opts=f.opts; if(f.dyn) opts=optionsDyn(g,f.dyn);
    inp=`<select ${attrs}><option value="">Choisir…</option>${opts.map(o=>`<option${o===val?' selected':''}>${esc(o)}</option>`).join('')}${val&&!opts.includes(val)?`<option selected>${esc(val)}</option>`:''}</select>`; }
  else if(f.t==='d') inp=`<input type="date" ${attrs} value="${esc(val)}">`;
  else if(f.t==='a') inp=`<textarea rows="3" ${attrs}>${esc(val)}</textarea>`;
  else if(f.t==='t') inp=`<input type="text" ${attrs} value="${esc(val)}" autocomplete="off">`;
  else inp=`<input type="text" inputmode="decimal" ${attrs} value="${esc(val)}" autocomplete="off">`;
  return `<div class="champ"><label>${esc(f.l)}</label><div class="ligne">${inp}${unit}</div>${aide}</div>`;
}
function tableHTML(t,exp,g){
  const def=TABLES[t]; const rows=rowsOf(exp,t);
  if(def.fixe){
    return `<section class="bloc"><h3>${esc(def.titre)}</h3><div class="tabscroll"><table class="saisie"><thead><tr><th>Mois</th>${def.cols.map(c=>`<th>${esc(c.l)}<br><span class="u">${esc(c.u||'')}</span></th>`).join('')}</tr></thead><tbody>${
      def.fixe.map((m,i)=>`<tr><th>${m}</th>${def.cols.map(c=>`<td><input type="text" inputmode="decimal" data-t="${t}" data-i="${i}" data-c="${c.k}" value="${esc(rows[i][c.k])}" autocomplete="off"></td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  return `<section class="bloc" data-table="${t}"><h3>${esc(def.titre)}</h3><div class="cartes">${rows.map((r,i)=>carteHTML(t,r,i,g,i===rows.length-1&&exp._ouvert===t)).join('')}</div><button class="btn ajout" data-add="${t}">+ ${esc(def.ajout)}</button></section>`;
}
function carteHTML(t,r,i,g,ouvert){
  const def=TABLES[t];
  const champs=def.cols.map(c=>champHTML(c,r[c.k]==null?'':r[c.k],`data-t="${t}" data-i="${i}" data-c="${c.k}"`,g)).join('');
  const calcs=(def.rcalcs||[]).map(c=>`<div class="champ calc"><label>${esc(c.l)}</label><div class="ligne"><span class="val" data-rc="${t}|${i}|${c.k}" data-fmt="${c.fmt}">—</span><span class="u">${esc(c.u||'')}</span></div></div>`).join('');
  return `<details class="carte"${ouvert?' open':''}><summary><span class="nomc" data-nom="${t}|${i}">${esc(def.libelle(r,i))}</span><span class="res" data-resume="${t}|${i}"></span><button class="sup" data-del="${t}|${i}" aria-label="Supprimer">Supprimer</button></summary><div class="grille">${champs}${calcs}</div></details>`;
}
function moduleHTML(m,exp,g){
  let h=`<h2>${esc(m.t)}</h2><p class="intro">${esc(m.intro||'')}</p><div id="alertes"></div>`;
  m.blocs.forEach(b=>{
    if(b.table){ h+=tableHTML(b.table,exp,g); return; }
    h+=`<section class="bloc">${b.t?`<h3>${esc(b.t)}</h3>`:''}${b.intro?`<p class="intro">${esc(b.intro)}</p>`:''}<div class="grille">${b.f.map(f=>champHTML(f,exp.f[f.k]==null?'':exp.f[f.k],`data-k="${f.k}"`,g)).join('')}</div></section>`;
  });
  return h;
}

/* ---------------- Vues ---------------- */
function render(){
  const app=$('#app');
  if(vue.nom==='home') app.innerHTML=homeHTML();
  else if(vue.nom==='edit') app.innerHTML=editHTML();
  else if(vue.nom==='bilan') app.innerHTML=bilanVueHTML();
  else if(vue.nom==='refs') app.innerHTML=refsHTML();
  window.scrollTo(0,0);
  if(vue.nom==='edit') refresh();
  majEtat();
}
function go(nom,mod){ vue={nom,mod:mod==null?vue.mod:mod}; render(); }

function homeHTML(){
  const liste = DB.exps.length? DB.exps.slice().sort((a,b)=>b.maj-a.maj).map(e=>{
    const p=Math.round(compTotale(e)*100);
    return `<article class="expc"><div><h3>${esc(nomExp(e))}</h3><p>${esc([e.f.eleveur,e.f.commune,e.f.campagne].filter(Boolean).join(' · ')||'Aucune information saisie')}</p><div class="barre"><i style="width:${p}%"></i></div><small>${p} % renseigné · modifié le ${new Date(e.maj).toLocaleDateString('fr-FR')}</small></div>
      <div class="actions"><button class="btn prim" data-open="${e.id}">Ouvrir</button><button class="btn" data-bilan="${e.id}">Bilan</button><button class="btn" data-dup="${e.id}">Dupliquer</button><button class="btn" data-exp1="${e.id}">Exporter</button><button class="btn danger" data-sup="${e.id}">Supprimer</button></div></article>`;
  }).join('') : `<div class="vide"><h3>Commencez par une première exploitation</h3><p>Chaque exploitation et chaque campagne forment un dossier distinct, enregistré sur cet appareil.</p></div>`;
  return `<header class="haut accueil"><div><span class="sur">Centre ovin d'Ordiarp</span><h1>Bilans technico-économiques</h1></div></header>
  <main class="contenu">${stockageOk?'':'<div class="alerte">Le stockage de cet appareil est indisponible. Exportez vos données après chaque séance.</div>'}
  <div class="barre-actions"><button class="btn prim" id="nouv">+ Nouvelle exploitation</button><label class="btn">Importer<input type="file" id="imp" accept=".json,application/json" hidden></label><button class="btn" id="expall">Tout exporter</button><button class="btn" id="vrefs">Références</button></div>
  ${liste}
  <p class="pied">Les données restent sur cet appareil. Pour les conserver ou les copier sur un autre appareil, utilisez « Exporter » (fichier JSON).</p></main>`;
}

function editHTML(){
  const g=makeG(cur); const m=MODULES[vue.mod];
  const chips=MODULES.map((x,i)=>`<button class="chipnav${i===vue.mod?' actif':''}" data-mod="${i}">${esc(x.court)}<i data-chip="${x.id}"></i></button>`).join('');
  return `<header class="haut"><button class="retour" id="retour" aria-label="Retour à la liste">‹</button><div class="titre"><b>${esc(nomExp(cur))}</b><span id="etat" class="ok"></span></div><button class="btn prim petit" id="vbilan">Bilan</button></header>
  <nav class="modnav" aria-label="Rubriques">${chips}</nav><div class="progres"><i id="pg" style="width:0"></i></div>
  <main class="contenu">${moduleHTML(m,cur,g)}
  <div class="pasapas"><button class="btn" id="prec"${vue.mod===0?' disabled':''}>‹ Précédent</button>${vue.mod<MODULES.length-1?'<button class="btn prim" id="suiv">Suivant ›</button>':'<button class="btn prim" id="vbilan2">Voir le bilan</button>'}</div></main>`;
}

/* Mise à jour des valeurs calculées sans reconstruire les champs */
function refresh(){
  if(vue.nom!=='edit'||!cur) return;
  const g=makeG(cur);
  document.querySelectorAll('[data-calc]').forEach(el=>{ const f=ALLC[el.dataset.calc]; el.textContent=fmtVal(g.n(f.k),f.fmt); });
  document.querySelectorAll('[data-rc]').forEach(el=>{ const [t,i,k]=el.dataset.rc.split('|'); const row=rowsOf(cur,t)[+i]; if(!row) return; el.textContent=fmtVal(g.rc(t,row)[k],el.dataset.fmt); });
  document.querySelectorAll('[data-resume]').forEach(el=>{ const [t,i]=el.dataset.resume.split('|'); const row=rowsOf(cur,t)[+i]; if(!row) return; el.textContent=TABLES[t].resume? TABLES[t].resume(row,g,g.rc(t,row)):''; });
  document.querySelectorAll('[data-nom]').forEach(el=>{ const [t,i]=el.dataset.nom.split('|'); const row=rowsOf(cur,t)[+i]; if(row) el.textContent=TABLES[t].libelle(row,+i); });
  const m=MODULES[vue.mod]; const msgs=(m.ctrl||[]).map(c=>{ try{ return c(g); }catch(e){ return null; } }).filter(Boolean);
  const al=$('#alertes'); if(al) al.innerHTML=msgs.map(x=>`<div class="alerte">${esc(x)}</div>`).join('');
  document.querySelectorAll('[data-chip]').forEach(el=>{ const mm=MODULES.find(x=>x.id===el.dataset.chip); const p=compMod(cur,mm); el.className=p>=0.8?'plein':(p>0?'moitie':''); });
  const pg=$('#pg'); if(pg) pg.style.width=Math.round(compTotale(cur)*100)+'%';
}

/* ---------------- Rapport (écran et impression) ---------------- */
function svgPile(segs,suffixe){
  const tot=segs.reduce((s,x)=>s+Math.max(x.v,0),0); if(!tot) return '<p class="note">Données insuffisantes.</p>';
  let x=0, s=`<svg viewBox="0 0 640 34" role="img">`; segs.forEach(sg=>{ const w=640*Math.max(sg.v,0)/tot; if(w>0){ s+=`<rect x="${x.toFixed(1)}" y="2" width="${w.toFixed(1)}" height="28" fill="${sg.c}"/>`; if(w>46) s+=`<text x="${(x+w/2).toFixed(1)}" y="21" text-anchor="middle" font-size="12" fill="${sg.t||'#fff'}">${Math.round(sg.v/tot*100)} %</text>`; } x+=w; });
  s+='</svg><div class="leg">'+segs.filter(z=>z.v>0).map(z=>`<span><i style="background:${z.c}"></i>${esc(z.l)} : ${FM.int(z.v)}${suffixe}</span>`).join('')+'</div>';
  return s;
}
FIELDS.avortements=FIELDS.avortements||{l:'Avortements'}; FIELDS.mammites=FIELDS.mammites||{l:'Cas de mammites'};
function bilanVueHTML(){
  return `<header class="haut noprint"><button class="retour" id="retourEdit" aria-label="Retour à la saisie">‹</button><div class="titre"><b>Bilan · ${esc(nomExp(cur))}</b></div><button class="btn prim petit" id="imprimer">Imprimer ou PDF</button></header>
  <main class="contenu large">${rapportHTML(cur)}<div class="barre-actions noprint"><button class="btn" id="csv">Exporter les indicateurs (CSV)</button><button class="btn" id="exp1b">Exporter le dossier (JSON)</button></div></main>`;
}

/* ---------------- Références (réglages) ---------------- */
function refsHTML(){
  return `<header class="haut"><button class="retour" id="retour" aria-label="Retour">‹</button><div class="titre"><b>Références de comparaison</b></div></header>
  <main class="contenu"><p class="intro">Les valeurs de comparaison servent à qualifier chaque indicateur. Seules celles qui ont une source sont préremplies, et plusieurs sont anciennes. Remplacez-les par les références actuelles du centre.</p>
  ${MOD_BILAN_VOLETS.map(v=>`<h3>${v}</h3>`+INDICATEURS.filter(i=>i.v===v).map(i=>{ const r=refOf(i); return `<div class="refc"><b>${esc(i.l)}</b> <span class="u">${esc(i.u)}</span><div class="grille3"><label>Référence<input type="text" inputmode="decimal" data-ref="${i.k}" data-p="ref" value="${esc(r.ref)}"></label><label>Sens<select data-ref="${i.k}" data-p="sens"><option value="H"${r.sens==='H'?' selected':''}>Plus haut, mieux</option><option value="B"${r.sens==='B'?' selected':''}>Plus bas, mieux</option><option value="I"${r.sens==='I'?' selected':''}>Information</option></select></label><label>Tolérance<input type="text" inputmode="decimal" data-ref="${i.k}" data-p="tol" value="${esc(Math.round(num(r.tol)*100))}"><span class="u">%</span></label></div><label class="src">Source<input type="text" data-ref="${i.k}" data-p="src" value="${esc(r.src)}"></label></div>`; }).join('')).join('')}
  <div class="barre-actions"><button class="btn danger" id="rinit">Revenir aux valeurs d'origine</button></div></main>`;
}

/* ---------------- Export et import ---------------- */
function telecharger(nom,contenu,type){ const b=new Blob([contenu],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=nom; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }
const slug = s => String(s||'bilan').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'bilan';
function exporterJSON(exps,nom){ telecharger(nom,JSON.stringify({version:1,export:new Date().toISOString(),exps,refs:DB.refs},null,1),'application/json'); }
function exporterCSV(exp){ const g=makeG(exp); const l=[['Volet','Indicateur','Unité','Valeur','Référence','Appréciation']];
  INDICATEURS.forEach(i=>{ const v=g.n(i.k); l.push([i.v,i.l,i.u,v==null?'':String(v).replace('.',','),num(refOf(i).ref)?String(refOf(i).ref).replace('.',','):'',apprec(i,v)]); });
  telecharger(`indicateurs-${slug(nomExp(exp))}-${slug(exp.f.campagne)}.csv`,'﻿'+l.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\r\n'),'text/csv;charset=utf-8'); }
function importer(file){ const fr=new FileReader(); fr.onload=()=>{ try{ const d=JSON.parse(fr.result); if(!d||!Array.isArray(d.exps)) throw new Error('format'); let n=0; d.exps.forEach(e=>{ if(!e||!e.f) return; const i=DB.exps.findIndex(x=>x.id===e.id); if(i>=0) DB.exps[i]=e; else DB.exps.push(e); n++; }); if(d.refs&&Object.keys(d.refs).length) DB.refs=Object.assign({},DB.refs,d.refs); sauver(); render(); alert(`${n} dossier(s) importé(s).`); }catch(err){ alert('Ce fichier n\'est pas un export valide de cette application.'); } }; fr.readAsText(file); }

/* ---------------- Événements ---------------- */
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.dataset.ref){ const k=t.dataset.ref,p=t.dataset.p; const u=DB.refs[k]=DB.refs[k]||{}; u[p]= p==='ref'? t.value : p==='tol'? num(t.value)/100 : t.value; sauverPlusTard(); return; }
  if(!cur) return;
  if(t.dataset.k){ cur.f[t.dataset.k]=t.value; }
  else if(t.dataset.t){ const rows=rowsOf(cur,t.dataset.t); const r=rows[+t.dataset.i]; if(r) r[t.dataset.c]=t.value; }
  else return;
  sauverPlusTard(); refresh();
});
document.addEventListener('click',e=>{
  const b=e.target.closest('button, [data-mod]'); if(!b) return; const d=b.dataset;
  if(b.id==='nouv'){ cur=nouvelle(); DB.exps.push(cur); sauver(); go('edit',0); }
  else if(d.open){ cur=DB.exps.find(x=>x.id===d.open); go('edit',0); }
  else if(d.bilan){ cur=DB.exps.find(x=>x.id===d.bilan); go('bilan'); }
  else if(d.dup){ const o=DB.exps.find(x=>x.id===d.dup); const c=JSON.parse(JSON.stringify(o)); c.id=uid(); c.f.nom_exploitation=nomExp(o)+' (copie)'; c.maj=Date.now(); DB.exps.push(c); sauver(); render(); }
  else if(d.exp1){ const o=DB.exps.find(x=>x.id===d.exp1); exporterJSON([o],`dossier-${slug(nomExp(o))}-${slug(o.f.campagne)}.json`); }
  else if(d.sup){ const o=DB.exps.find(x=>x.id===d.sup); if(confirm(`Supprimer définitivement « ${nomExp(o)} » ? Pensez à l'exporter avant.`)){ DB.exps=DB.exps.filter(x=>x.id!==d.sup); sauver(); render(); } }
  else if(b.id==='expall') exporterJSON(DB.exps,`tous-les-dossiers-${new Date().toISOString().slice(0,10)}.json`);
  else if(b.id==='vrefs') go('refs');
  else if(b.id==='retour'){ cur=null; go('home'); }
  else if(b.id==='retourEdit') go('edit');
  else if(d.mod!==undefined){ vue.mod=+d.mod; render(); }
  else if(b.id==='prec'&&vue.mod>0){ vue.mod--; render(); }
  else if(b.id==='suiv'){ vue.mod++; render(); }
  else if(b.id==='vbilan'||b.id==='vbilan2') go('bilan');
  else if(b.id==='imprimer') window.print();
  else if(b.id==='csv') exporterCSV(cur);
  else if(b.id==='exp1b') exporterJSON([cur],`dossier-${slug(nomExp(cur))}-${slug(cur.f.campagne)}.json`);
  else if(d.add){ const t=d.add; const row={}; (TABLES[t].cols).forEach(c=>{ if(c.def!=null) row[c.k]=c.def; }); rowsOf(cur,t).push(row); cur._ouvert=t; sauverPlusTard(); const m=MODULES[vue.mod]; const ctn=document.querySelector(`[data-table="${t}"] .cartes`); if(ctn){ const i=rowsOf(cur,t).length-1; ctn.insertAdjacentHTML('beforeend',carteHTML(t,row,i,makeG(cur),true)); } refresh(); }
  else if(d.del){ e.preventDefault(); const [t,i]=d.del.split('|'); if(confirm('Supprimer cette ligne ?')){ rowsOf(cur,t).splice(+i,1); sauverPlusTard(); render(); } }
  else if(b.id==='rinit'){ if(confirm('Revenir aux références d\'origine ?')){ DB.refs={}; sauver(); render(); } }
});
document.addEventListener('change',e=>{ if(e.target.id==='imp'&&e.target.files[0]) importer(e.target.files[0]); });
