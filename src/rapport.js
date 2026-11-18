'use strict';
/* ============================================================
   RAPPORT — graphiques et mise en page du bilan
   Chaque graphique dit ce qu'il lui manque quand les données
   ne suffisent pas.
   ============================================================ */
const COL = { v:'#1F3D2B', v2:'#2F5A40', v3:'#5B7F5E', o:'#C58B2A', sable:'#E2C98F', br:'#9A6B1C', gris:'#9A9A8A', bad:'#843C0C', bon:'#2F5A40' };
const gr  = s => `<div class="graph">${s}</div>`;
const msg = t => `<p class="note manque">${t}</p>`;
const tx  = (x,y,t,o='') => `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" ${o}>${esc(t)}</text>`;
const court = (t,n) => { t=String(t||''); return t.length>n? t.slice(0,n-1)+'…':t; };

/* 1. Lait mois par mois, avec matière grasse et protéique */
function svgCourbes(exp){
  const rows=rowsOf(exp,'lait_mensuel'); const L=rows.map(r=>num(r.litres));
  if(!L.some(x=>x>0)) return msg('Courbe de lactation : saisissez le lait livré mois par mois (rubrique Lait).');
  const W=640,H=170,y0=18,x0=46,x1=590,bw=(x1-x0)/12,mx=Math.max(...L,1);
  const tb=rows.map(r=>num(r.tb)), tp=rows.map(r=>num(r.tp)); const sm=Math.max(...tb,...tp,1)*1.15;
  const yL=v=>y0+H*(1-v/mx), yG=v=>y0+H*(1-v/sm);
  let s=`<svg viewBox="0 0 ${W} ${H+62}" role="img" aria-label="Lait livré par mois, matière grasse et protéique">`;
  [0,.5,1].forEach(t=>{ const y=y0+H*(1-t); s+=`<line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#e5dfcd"/>`+tx(x0-6,y+4,FM.int(mx*t),'text-anchor="end" font-size="11" fill="#666"')+tx(x1+6,y+4,FM.int(sm*t),'font-size="11" fill="#9A6B1C"'); });
  L.forEach((v,i)=>{ if(v>0){ s+=`<rect x="${(x0+i*bw+7).toFixed(1)}" y="${yL(v).toFixed(1)}" width="${(bw-14).toFixed(1)}" height="${(y0+H-yL(v)).toFixed(1)}" rx="2" fill="${COL.v}" opacity=".9"/>`; }
    s+=tx(x0+i*bw+bw/2,y0+H+16,MOIS[i].slice(0,3)+'.','text-anchor="middle" font-size="11" fill="#555"'); });
  const ligne=(a,c)=>{ const pts=a.map((v,i)=>v>0?[x0+i*bw+bw/2,yG(v)]:null).filter(Boolean); if(pts.length<2) return ''; return `<polyline points="${pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2.2"/>`+pts.map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${c}"/>`).join(''); };
  s+=ligne(tb,COL.o)+ligne(tp,COL.bad);
  s+=`<rect x="${x0}" y="${H+36}" width="10" height="10" fill="${COL.v}"/>`+tx(x0+15,H+45,'Litres livrés (axe de gauche)','font-size="11" fill="#333"')+`<line x1="${x0+210}" x2="${x0+226}" y1="${H+41}" y2="${H+41}" stroke="${COL.o}" stroke-width="2.5"/>`+tx(x0+231,H+45,'Matière grasse g/L','font-size="11" fill="#333"')+`<line x1="${x0+350}" x2="${x0+366}" y1="${H+41}" y2="${H+41}" stroke="${COL.bad}" stroke-width="2.5"/>`+tx(x0+371,H+45,'Matière protéique g/L (axe de droite)','font-size="11" fill="#333"');
  return gr(s+'</svg>');
}
function svgCellules(exp){
  const rows=rowsOf(exp,'lait_mensuel'); const C=rows.map(r=>num(r.cell)); if(!C.some(x=>x>0)) return msg('Cellules : saisissez les cellules mois par mois (rubrique Lait) pour voir leur évolution.');
  const W=640,H=70,x0=46,x1=590,bw=(x1-x0)/12,mx=Math.max(...C,1); let s=`<svg viewBox="0 0 ${W} ${H+48}" role="img" aria-label="Cellules par mois"><g transform="translate(0,14)">`;
  C.forEach((v,i)=>{ if(v>0){ const h=Math.max(2,v/mx*H); s+=`<rect x="${(x0+i*bw+7).toFixed(1)}" y="${(H+8-h).toFixed(1)}" width="${(bw-14).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${COL.br}"/>`+tx(x0+i*bw+bw/2,H+4-h,FM.int(v),'text-anchor="middle" font-size="10" fill="#333"'); } s+=tx(x0+i*bw+bw/2,H+24,MOIS[i].slice(0,3)+'.','text-anchor="middle" font-size="11" fill="#555"'); });
  return gr(s+'</g></svg>')+'<p class="note">Cellules en milliers par millilitre.</p>';
}

/* 2. Parcours des agneaux */
function svgAgneaux(g){
  if(g.n('nes_total')==null) return msg('Parcours des agneaux : saisissez les naissances (rubrique Troupeau) et le sevrage (rubrique Agneaux).');
  const it=[['Agneaux nés',g.n('nes_total'),COL.v],['Nés vivants',g.n('nes_vivants'),COL.v2],['Sevrés',g.n('sevres'),COL.v3],['Vendus',g.n('vendus'),COL.o],['Gardés pour le renouvellement',g.n('agnelles_gardees'),COL.sable],['Consommés ou donnés',g.n('agneaux_autoconso'),COL.gris]].filter(x=>x[1]!=null);
  const mx=Math.max(...it.map(x=>x[1]),1); const W=640,lab=190,bh=24; let s=`<svg viewBox="0 0 ${W} ${it.length*bh+10}" role="img" aria-label="Parcours des agneaux">`;
  it.forEach((x,i)=>{ const w=Math.max(2,(W-lab-60)*x[1]/mx), y=i*bh+4; s+=tx(lab-8,y+16,x[0],'text-anchor="end" font-size="12" fill="#333"')+`<rect x="${lab}" y="${y+2}" width="${w.toFixed(1)}" height="${bh-8}" rx="2" fill="${x[2]}"/>`+tx(lab+w+6,y+16,FM.int(x[1]),'font-size="12" font-weight="600" fill="#222"'); });
  const pertes=g.z('nes_morts')+g.z('morts_sevrage'); return gr(s+'</svg>')+`<p class="note">Pertes avant le sevrage : ${FM.int(pertes)} agneaux (${FM.int(g.z('nes_morts'))} mort-nés, ${FM.int(g.z('morts_sevrage'))} morts entre la naissance et le sevrage).</p>`;
}

/* 3. Couverture des besoins par lot */
function svgCouverture(g){
  const lots=g.rows('rations').filter(r=>r.nom||r.stade).map(r=>({n:r.nom||r.stade,c:g.rc('rations',r)})).filter(x=>x.c.cov_ufl!=null||x.c.cov_pdi!=null);
  if(!lots.length) return msg('Couverture des besoins : saisissez au moins un lot avec ses fourrages, ses concentrés et ses besoins (rubrique Rations).');
  const W=640,lab=170,max=1.5,bh=15,gap=12,top=18,Hh=lots.length*(2*bh+gap)+top+22; const xs=v=>lab+(W-lab-30)*Math.min(v,max)/max;
  let s=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Couverture des besoins par lot">`;
  s+=`<rect x="${xs(.95)}" y="${top-4}" width="${xs(1.15)-xs(.95)}" height="${Hh-top-12}" fill="#E8EFE3"/><line x1="${xs(1)}" x2="${xs(1)}" y1="${top-4}" y2="${Hh-16}" stroke="${COL.v}" stroke-dasharray="4 3"/>`;
  [0,.5,1,1.5].forEach(t=>{ s+=tx(xs(t),Hh-3,Math.round(t*100)+' %','text-anchor="middle" font-size="11" fill="#666"'); });
  lots.forEach((l,i)=>{ const y=top+i*(2*bh+gap); s+=tx(lab-8,y+bh+4,court(l.n,24),'text-anchor="end" font-size="12" fill="#333"');
    [['cov_ufl','Énergie',COL.v],['cov_pdi','Protéines',COL.o]].forEach(([k,lib,c],j)=>{ const v=l.c[k]; const yy=y+j*bh; if(v==null){ s+=tx(lab+4,yy+bh-3,lib+' : non calculable','font-size="10" fill="#888"'); return; }
      const col=v<.95?COL.bad:(v>1.15?COL.br:c); s+=`<rect x="${lab}" y="${yy+1}" width="${(xs(v)-lab).toFixed(1)}" height="${bh-3}" fill="${col}"/>`+tx(xs(v)+5,yy+bh-3,`${lib} ${Math.round(v*100)} %`,'font-size="11" fill="#222"'); }); });
  return gr(s+'</svg>')+'<p class="note">Zone claire : couverture entre 95 et 115 % (repère indicatif). Barre brune : apport insuffisant ou excessif.</p>';
}

/* 4. Cascade économique */
function svgCascade(g){
  if(g.n('produit_total')==null) return msg('Cascade économique : saisissez les produits et les charges (rubrique Économie).');
  const autres=g.z('charges_oper')-g.z('ch_alim');
  const st=[['Lait',g.z('produit_lait')+g.z('produit_fermier'),'+'],['Agneaux',g.z('ventes_agn'),'+'],['Autres',g.z('ventes_reformes')+g.z('laine')+g.z('autres_produits'),'+'],['Aides',g.z('aides_total'),'+'],['Alimentation',-g.z('ch_alim'),'-'],['Autres troupeau',-autres,'-'],['Structure',-g.z('charges_structure'),'-'],['EBE',null,'='],['Amort. et frais',-(g.z('amortissements')+g.z('frais_financiers')),'-'],['Résultat courant',null,'=']];
  let run=0; const bars=st.map(([l,v,t])=>{ if(t==='='){ const b={l,a:0,b:run,t}; return b; } const a=run; run+=v; return {l,a,b:run,t}; });
  const all=bars.flatMap(b=>[b.a,b.b]); const mx=Math.max(...all,0), mn=Math.min(...all,0); const W=640,H=190,y0=14,xl=10,bw=(W-xl*2)/bars.length; const y=v=>y0+H*(mx-v)/((mx-mn)||1);
  let s=`<svg viewBox="0 0 ${W} ${H+56}" role="img" aria-label="Du produit au résultat">`;
  s+=`<line x1="${xl}" x2="${W-xl}" y1="${y(0)}" y2="${y(0)}" stroke="#999"/>`;
  bars.forEach((b,i)=>{ const x=xl+i*bw+6, top=Math.min(y(b.a),y(b.b)), h=Math.max(2,Math.abs(y(b.a)-y(b.b))); const col=b.t==='='?COL.v:(b.t==='+'?COL.v3:COL.o); const val=b.t==='='?b.b:b.b-b.a;
    s+=`<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${(bw-12).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${col}"/>`+tx(x+(bw-12)/2,top-4,FM.int(val),'text-anchor="middle" font-size="10.5" font-weight="600" fill="#222"')+tx(x+(bw-12)/2,H+y0+16,court(b.l,12),'text-anchor="middle" font-size="10.5" fill="#444"'); });
  return gr(s+'</svg>')+'<p class="note">En euros. Vert : produits. Ocre : charges. Vert foncé : soldes (EBE puis résultat courant).</p>';
}

/* 5. Écarts aux références du centre */
function svgEcarts(g){
  const L=INDICATEURS.map(i=>{ const v=g.n(i.k), r=num(refOf(i).ref); if(v==null||v===0||!r) return null; return {i,e:(v-r)/r,v}; }).filter(Boolean);
  if(!L.length) return msg('Profil par rapport aux références : aucune référence saisie. Renseignez-les dans « Références » depuis la liste des dossiers.');
  const W=640,lab=210,bh=24,cx=lab+(W-lab-70)/2,half=(W-lab-70)/2; let s=`<svg viewBox="0 0 ${W} ${L.length*bh+22}" role="img" aria-label="Écarts aux références">`;
  s+=`<line x1="${cx}" x2="${cx}" y1="0" y2="${L.length*bh+4}" stroke="#777"/>`;
  L.forEach((x,i)=>{ const y=i*bh+2, sens=refOf(x.i).sens, c=Math.max(-1,Math.min(1,x.e)), w=Math.abs(c)*half;
    const bon= sens==='I'? null : (sens==='H'? x.e>0 : x.e<0); const col= bon==null?COL.gris:(bon?COL.bon:COL.bad);
    s+=tx(lab-8,y+16,court(x.i.l,34),'text-anchor="end" font-size="11.5" fill="#333"')+`<rect x="${(c<0?cx-w:cx).toFixed(1)}" y="${y+3}" width="${Math.max(w,1.5).toFixed(1)}" height="${bh-9}" fill="${col}"/>`+tx(cx+half+8,y+16,(x.e>=0?'+':'−')+Math.abs(Math.round(x.e*100))+' %','font-size="11.5" font-weight="600" fill="#222"'); });
  return gr(s+'</svg>')+'<p class="note">Vert : meilleur que la référence. Brun : moins bon. Gris : indicateur donné pour information. Les écarts supérieurs à 100 % sont tronqués.</p>';
}

/* 6. Calendrier de la campagne */
function svgCalendrier(g){
  const ev=[['Lutte','lutte_debut','lutte_fin',COL.o],['Mises bas','agnelage_debut','agnelage_fin',COL.v],['Traite','traite_debut','traite_fin',COL.v3],['Estive','estive_debut','estive_fin',COL.br]]
    .map(([l,a,b,c])=>({l,a:g.d(a)&&new Date(g.d(a)+'T00:00:00'),b:g.d(b)&&new Date(g.d(b)+'T00:00:00'),c})).filter(e=>e.a&&e.b&&e.b>=e.a);
  if(!ev.length) return msg('Calendrier : saisissez les dates de lutte, de mises bas, de traite ou d\'estive.');
  const d0=new Date(Math.min(...ev.map(e=>e.a))); d0.setDate(1); const d1=new Date(Math.max(...ev.map(e=>e.b))); d1.setMonth(d1.getMonth()+1,1);
  const nm=(d1.getFullYear()-d0.getFullYear())*12+d1.getMonth()-d0.getMonth(); const W=640,lab=80,pw=W-lab-10,bh=26,H=ev.length*bh+30; const xs=d=>lab+pw*(d-d0)/(d1-d0);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calendrier de la campagne">`;
  for(let i=0;i<nm;i++){ const m=new Date(d0.getFullYear(),d0.getMonth()+i,1); const x=xs(m); s+=`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="0" y2="${ev.length*bh+4}" stroke="#e5dfcd"/>`+tx(x+pw/nm/2,H-8,m.toLocaleDateString('fr-FR',{month:'short'}).replace('.',''),'text-anchor="middle" font-size="10.5" fill="#555"'); }
  ev.forEach((e,i)=>{ const y=i*bh+3, x=xs(e.a), w=Math.max(4,xs(new Date(+e.b+864e5))-x); s+=tx(lab-8,y+17,e.l,'text-anchor="end" font-size="12" fill="#333"')+`<rect x="${x.toFixed(1)}" y="${y+2}" width="${w.toFixed(1)}" height="${bh-8}" rx="3" fill="${e.c}"/>`; });
  return gr(s+'</svg>');
}

/* 7. Qualité des fourrages analysés */
function svgFourrages(g){
  const P=g.rows('fourrages').filter(r=>r.type!=='Paille (litière)'&&num(r.ufl)>0&&num(r.mat)>0);
  if(!P.length) return msg('Qualité des fourrages : saisissez au moins une analyse (énergie et azote) dans la rubrique Fourrages.');
  const xs=P.map(r=>num(r.mat)), ys=P.map(r=>num(r.ufl)); const xmin=Math.min(...xs,100)-15, xmax=Math.max(...xs,160)+15, ymin=Math.min(...ys,.55)-.05, ymax=Math.max(...ys,.8)+.05;
  const W=640,H=222,x0=52,y0=24,pw=W-x0-20,ph=H-y0-34; const X=v=>x0+pw*(v-xmin)/(xmax-xmin), Y=v=>y0+ph*(1-(v-ymin)/(ymax-ymin));
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Énergie et azote des fourrages">`;
  [0,.5,1].forEach(t=>{ const v=ymin+(ymax-ymin)*t; s+=`<line x1="${x0}" x2="${W-20}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e5dfcd"/>`+tx(x0-6,Y(v)+4,FM.d2(v),'text-anchor="end" font-size="11" fill="#666"'); const a=xmin+(xmax-xmin)*t; s+=tx(X(a),H-18,FM.int(a),'text-anchor="middle" font-size="11" fill="#666"'); });
  s+=tx(x0+pw/2,H-3,'Matière azotée totale (g/kg MS)','text-anchor="middle" font-size="11" fill="#444"')+tx(x0,y0-2,'UFL/kg MS','font-size="11" fill="#444"');
  P.forEach(r=>{ const x=X(num(r.mat)), y=Y(num(r.ufl)), ach=r.origine==='Acheté'; s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${ach?COL.o:COL.v}"/>`+tx(x+9,y+4,court(r.nom||r.type,22),'font-size="11" fill="#222"'); });
  return gr(s+'</svg>')+'<p class="note">Vert : produit sur l\'exploitation. Ocre : acheté. Les fourrages sans analyse ne figurent pas.</p>';
}

/* 8. Simulation : que change une variation de prix ou de volume ? */
function svgSensibilite(g){
  const ebe=g.n('ebe'); if(ebe==null||g.n('produit_total')==null) return msg('Simulation : saisissez les produits et les charges (rubrique Économie).');
  const it=[['Prix du lait +5 %',.05*g.z('produit_lait')],['Lait livré +5 % (mêmes charges)',.05*g.z('produit_lait')],['Agneaux vendus +5 %',.05*g.z('ventes_agn')],['Prix des concentrés achetés +10 %',-.1*g.z('cout_conc_achete')],['Prix des fourrages achetés +10 %',-.1*g.z('cout_fourrage_achete')],['Aides −10 %',-.1*g.z('aides_total')],['Charges de structure +5 %',-.05*g.z('charges_structure')]].filter(x=>x[1]!==0);
  if(!it.length) return msg('Simulation : données insuffisantes.');
  const mx=Math.max(...it.map(x=>Math.abs(x[1])),1); const W=640,lab=230,bh=26,half=(W-lab-110)/2,cx=lab+half; let s=`<svg viewBox="0 0 ${W} ${it.length*bh+6}" role="img" aria-label="Simulation de l'EBE">`;
  s+=`<line x1="${cx}" x2="${cx}" y1="0" y2="${it.length*bh}" stroke="#777"/>`;
  it.forEach((x,i)=>{ const y=i*bh+2, w=Math.abs(x[1])/mx*half; s+=tx(lab-8,y+17,x[0],'text-anchor="end" font-size="11.5" fill="#333"')+`<rect x="${(x[1]<0?cx-w:cx).toFixed(1)}" y="${y+3}" width="${Math.max(w,1.5).toFixed(1)}" height="${bh-9}" fill="${x[1]<0?COL.bad:COL.bon}"/>`+tx(cx+half+8,y+17,`${x[1]>=0?'+':'−'}${FM.int(Math.abs(x[1]))} €`+(ebe?` (${x[1]>=0?'+':'−'}${Math.abs(Math.round(x[1]/ebe*100))} %)`:''),'font-size="11.5" font-weight="600" fill="#222"'); });
  return gr(s+'</svg>')+`<p class="note">Effet sur l'EBE (${FM.eur(ebe)}), toutes choses égales par ailleurs. Simulation simple : elle ignore les réactions de l'élevage (par exemple moins de concentrés quand ils coûtent plus cher).</p>`;
}

/* ---------- Rapport ---------- */
function rapportHTML(exp){
  const g=makeG(exp); const f=exp.f; const val=k=>g.n(k);
  const tuile=(t,k,u,note,fmt)=>`<div class="tuile"><div class="tt">${t}</div><div class="tv">${fmtVal(val(k),fmt)}<small> ${u}</small></div><div class="td">${note}</div></div>`;
  const rowsI=MOD_BILAN_VOLETS.map(v=>{ const lst=INDICATEURS.filter(i=>i.v===v); if(!lst.length) return '';
    return `<h3>${v}</h3><table class="ind"><thead><tr><th>Indicateur</th><th>Valeur</th><th>Référence</th><th>Écart</th><th>Appréciation</th></tr></thead><tbody>${lst.map(i=>{ const x=val(i.k); const r=refOf(i);
      return `<tr><td><b>${esc(i.l)}</b><div class="def">${esc(i.def)}</div></td><td class="n">${fmtVal(x,i.fmt)}${x!=null&&!/%|€/.test(i.u)?`<span class="u"> ${esc(i.u)}</span>`:''}</td><td class="n">${num(r.ref)?fmtVal(num(r.ref),i.fmt)+(r.src&&/ancien|vérifier|Estimation|2003|2011|2015|2022|2024/.test(r.src)?' *':''):'—'}</td><td class="n">${ecartTxt(i,x)}</td><td>${chip(apprec(i,x))}</td></tr>`; }).join('')}</tbody></table>`; }).join('');
  const refsUtilisees=INDICATEURS.filter(i=>num(refOf(i).ref)&&val(i.k)!=null&&val(i.k)!==0).map(i=>`<li><b>${esc(i.l)}</b> : ${esc(refOf(i).src||'Référence saisie par le centre')}</li>`).join('');
  const lignesEco=(ks,fortes=[])=>`<table class="eco">${ks.map(k=>{ const fl=FIELDS[k]; return `<tr class="${fortes.includes(k)?'tot':''}"><td>${esc(fl.l)}</td><td class="n">${fmtVal(val(k),fmtChamp(fl))}</td></tr>`; }).join('')}</table>`;
  const prod=[{l:'Lait',v:val('produit_lait'),c:COL.v},{l:'Produits fermiers',v:f.produit_fermier,c:COL.v2},{l:'Agneaux',v:val('ventes_agn'),c:COL.o},{l:'Réformes',v:num(f.ventes_reformes),c:COL.v3},{l:'Aides',v:val('aides_total'),c:COL.sable,t:'#222'},{l:'Autres',v:num(f.laine)+num(f.autres_produits),c:COL.gris}].map(x=>({...x,v:num(x.v)}));
  const emploi=[{l:'Charges du troupeau',v:g.z('charges_oper'),c:COL.o},{l:'Charges de structure',v:g.z('charges_structure'),c:COL.sable,t:'#222'},{l:'EBE (reste)',v:Math.max(g.z('ebe'),0),c:COL.v}];
  const nb=g.n('brebis_presentes'); let ressources=msg('Origine de l\'alimentation : saisissez le nombre de brebis, les fourrages et les concentrés.');
  if(nb){ const concProd=g.sum('concentres','ms_kg',r=>r.origine==='Produit sur l\'exploitation'&&!['Minéral et vitamines','Lait maternisé'].includes(r.cat))||0; const concMs=g.z('conc_ms_t')*1000;
    ressources=gr(svgPile([{l:'Fourrages produits',v:g.z('ms_produit')*1000/nb,c:COL.v},{l:'Herbe pâturée',v:g.z('herbe_pat'),c:COL.v3},{l:'Fourrages achetés',v:g.z('ms_achete')*1000/nb,c:COL.o},{l:'Concentrés produits',v:concProd/nb,c:COL.sable,t:'#222'},{l:'Concentrés achetés',v:Math.max(concMs-concProd,0)/nb,c:COL.br}],' kg MS/brebis')); }
  const coutAlim=(g.z('cout_conc_achete')+g.z('cout_fourrage_achete')+g.z('cout_mineraux'))>0? gr(svgPile([{l:'Concentrés achetés',v:g.z('cout_conc_achete'),c:COL.br},{l:'Fourrages achetés',v:g.z('cout_fourrage_achete'),c:COL.o},{l:'Minéraux et lait maternisé',v:g.z('cout_mineraux'),c:COL.sable,t:'#222'}],' €')) : '';
  const rations=rowsOf(exp,'rations').filter(r=>r.nom||r.stade); const tabRat=rations.length?`<table class="ind"><thead><tr><th>Lot</th><th>Effectif</th><th>Énergie apportée</th><th>Couverture énergie</th><th>Couverture protéines</th><th>Part de concentré</th></tr></thead><tbody>${rations.map(r=>{ const c=g.rc('rations',r); const cv=v=>v==null?'—':`<b style="color:${v<0.95?'#843C0C':v>1.15?'#7F6000':'#1F3D2B'}">${FM.pct(v)}</b>`; return `<tr><td>${esc(r.nom||r.stade)}</td><td class="n">${esc(r.eff||'')}</td><td class="n">${fmtVal(c.apt_ufl,'d2')} UFL</td><td class="n">${cv(c.cov_ufl)}</td><td class="n">${cv(c.cov_pdi)}</td><td class="n">${fmtVal(c.part_conc,'pct')}</td></tr>`; }).join('')}</tbody></table>`:'';
  const fourr=rowsOf(exp,'fourrages').filter(r=>r.nom||r.type); const tabF=fourr.length?`<table class="ind"><thead><tr><th>Fourrage</th><th>Origine</th><th>Matière sèche</th><th>Stade</th><th>Énergie</th><th>Azote</th><th>Qualité</th></tr></thead><tbody>${fourr.map(r=>{ const c=g.rc('fourrages',r); return `<tr><td>${esc(r.nom||r.type)}<div class="def">${esc(r.type||'')}</div></td><td>${esc(r.origine||'')}</td><td class="n">${fmtVal(c.ms_t,'d1')} t</td><td>${esc((r.stade||'').split(' (')[0])}</td><td class="n">${num(r.ufl)?FM.d2(num(r.ufl)):'—'}</td><td class="n">${num(r.mat)?FM.int(num(r.mat)):'—'}</td><td>${esc(r.qualite||'')}</td></tr>`; }).join('')}</tbody></table><p class="note">Énergie en UFL/kg de matière sèche, azote en g/kg de matière sèche. « — » : pas d'analyse saisie.</p>`:'';
  const coms=[['Points forts',f.com_forts],['Points de vigilance',f.com_vigilance],['Conseils pour la campagne suivante',f.com_conseils]].map(([t,c])=>`<div class="com"><h4>${t}</h4><p>${c?esc(c).replace(/\n/g,'<br>'):'&nbsp;'}</p></div>`).join('');
  return `<div class="rapport"><div class="bandeau"><h1>Bilan technico-économique</h1><div class="s">Campagne ${esc(f.campagne||'')} · Centre ovin d'Ordiarp</div></div>
  <div class="idg">${[['Exploitation',f.nom_exploitation],['Éleveur ou éleveuse',f.eleveur],['Commune',f.commune],['Race',f.race],['Valorisation',f.valorisation],['Établi par',[f.technicien,f.date_bilan&&new Date(f.date_bilan).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')],['Brebis présentes',nb],['Surface fourragère',val('sfp')!=null?FM.d1(val('sfp'))+' ha':''],['Main-d\'œuvre',val('umo_total')!=null?FM.d2(val('umo_total'))+' UMO':'']].map(([a,b])=>`<div><b>${a}</b>${esc(b||'—')}</div>`).join('')}</div>
  <div class="tuiles">${tuile('Productivité numérique','productivite','agneaux/femelle','Agneaux sevrés par femelle mise à la reproduction','d2')}${tuile('Lait','lait_brebis','L/brebis','Par brebis présente','int')}${tuile('Marge sur coût alimentaire','mca_brebis','€/brebis','Lait et agneaux moins l\'alimentation','eur')}${tuile('Coût de production','cout_1000l','€/1000 L','Toutes charges et rémunérations','eur')}</div>
  <h2>1 · Vue d'ensemble</h2><h3>Profil par rapport aux références du centre</h3>${svgEcarts(g)}${rowsI}
  ${refsUtilisees?`<div class="sources"><h4>Sources des références (*)</h4><ul>${refsUtilisees}</ul><p class="note">Les références marquées d'une étoile sont anciennes ou provisoires : elles donnent un ordre de grandeur, pas une norme.</p></div>`:''}
  <div class="saut"></div><h2>2 · Problématiques relevées et pistes de travail</h2>${diagHTML(exp)}
  <div class="saut"></div><h2>3 · Lait, agneaux et calendrier</h2><h3>Courbe de la campagne</h3>${svgCourbes(exp)}<h3>Cellules</h3>${svgCellules(exp)}
  <div class="duo"><div>${lignesEco(['lait_total','lait_brebis','lait_brebis_traite','jours_traite','tb_moy','tp_moy','prix_moyen'])}</div><div>${lignesEco(['lait_ha','brebis_umo','litres_umo','h_astreinte_brebis'])}</div></div>
  <h3>Parcours des agneaux</h3>${svgAgneaux(g)}<h3>Calendrier</h3>${svgCalendrier(g)}
  <div class="saut"></div><h2>4 · Alimentation</h2><h3>D'où vient ce que mangent les brebis</h3>${ressources}
  <div class="duo"><div>${lignesEco(['ms_consomme','fourrage_brebis','autonomie_fourragere','autonomie_alim','qualite_ufl','qualite_mat'])}</div><div>${lignesEco(['conc_kg_brebis','conc_ms_brebis','conc_g_litre','autonomie_conc','cout_alim_brebis','cout_alim_1000l'])}</div></div>
  ${coutAlim?`<h3>Où va l'argent de l'alimentation achetée</h3>${coutAlim}`:''}
  <h3>Qualité des fourrages</h3>${svgFourrages(g)}${tabF}<h3>Couverture des besoins par lot</h3>${svgCouverture(g)}${tabRat}
  <div class="saut"></div><h2>5 · Résultats économiques</h2>
  <h3>Du produit au résultat</h3>${svgCascade(g)}
  <h3>D'où vient le produit (${fmtVal(val('produit_total'),'eur')})</h3>${gr(svgPile(prod,' €'))}<h3>Où va chaque euro de produit</h3>${gr(svgPile(emploi,' €'))}
  <h3>Que changerait une variation de prix ou de volume ?</h3>${svgSensibilite(g)}
  <div class="duo"><div><h3>Produits</h3>${lignesEco(['produit_lait','produit_fermier','ventes_agn','ventes_reformes','laine','autres_produits','aides_total','produit_total'],['produit_total'])}<h3>Charges du troupeau</h3>${lignesEco(['ch_alim','ch_veto','ch_elevage','ch_litiere','ch_ia','ch_estive','ch_surfaces','charges_oper'],['charges_oper'])}</div>
  <div><h3>Charges de structure</h3>${lignesEco(['ch_salaires','ch_fermages','ch_meca','ch_energie','ch_assurances','ch_gestion','charges_structure'],['charges_structure'])}<h3>Résultats</h3>${lignesEco(['marge_brute','ebe','amortissements','frais_financiers','rcai','annuites','dispo'],['marge_brute','ebe'])}<h3>Coût de production</h3>${lignesEco(['cout_production','cout_1000l','prix_revient','remun_smic'])}</div></div>
  <div class="saut"></div><h2>6 · Santé, génétique et travail</h2><div class="duo"><div>${lignesEco(['cout_sante','sante_brebis','avortements','mammites'])}</div><div>${lignesEco(['part_ia','fertilite_ia','cout_ia_femelle','cout_ia_mb'])}</div></div>
  <h2>7 · Commentaires du technicien</h2>${coms}
  <p class="note">Ce bilan repose sur les chiffres déclarés pour la campagne ${esc(f.campagne||'')}. Les appréciations sont des repères pour la discussion, pas des notes : chaque exploitation a ses contraintes (altitude, estive, main-d'œuvre).</p></div>`;
}
