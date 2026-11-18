'use strict';
/* ============================================================
   DIAGNOSTIC — problématiques détectées dans les données saisies
   et pistes de solution.
   Chaque piste porte son niveau de preuve :
     'src'     = appuyée par une publication consultée (voir SOURCES)
     'terrain' = repère de pratique courante, non démontré ici : à valider par le centre
   ============================================================ */
const SOURCES = {
  lots:{ t:'Productions animales (INRAE) : mise en lots des brebis laitières', u:'https://productions-animales.org/article/download/4101/12534/30519',
         r:'Séparer le troupeau en deux lots réduit d\'environ 24 % l\'hétérogénéité de production ; un troisième lot ajoute environ 6 %. Dans un essai (134 brebis, 180 jours), un ajustement fin des concentrés a économisé 51 kg par brebis à lait égal. Séparer les lots sans différencier les apports n\'a rien économisé.' },
  primi:{ t:'Productions animales (INRAE) : brebis laitières', u:'https://productions-animales.org/article/download/4101/12534/30519',
         r:'Les primipares représentent environ 30 % d\'un troupeau, mangent moins que les adultes et produisent environ 30 % de lait en moins.' },
  analyse:{ t:'Réussir Pâtre : que faire de ses mauvais foins', u:'https://www.reussir.fr/patre/que-faire-de-ses-mauvais-foins',
         r:'Une analyse simple (matière sèche, UF, PDI, calcium, phosphore) coûte entre 15 et 35 € et permet d\'ajuster les quantités de concentrés.' },
  foinfaible:{ t:'Chambre d\'agriculture de Haute-Loire : chronique ovine, équilibrer la ration (2021)', u:'https://haute-loire.chambre-agriculture.fr/fileadmin/user_upload/Auvergne-Rhone-Alpes/121_Extr-Haute-Loire_img/%C3%A9levage/2018/chroniques_ovines/chroniques_ovines/semaine_49-2021_equilibrer_la_ration.pdf',
         r:'Certains fourrages peuvent être faibles, à peine 0,6 UFL/kg de matière sèche et 50 g de PDI/kg de matière sèche, alors qu\'ils sont la base de l\'alimentation.' },
  aop:{ t:'INAO : plan national de contrôle, AOP Ossau-Iraty (version consultée : 2015)', u:'https://www.inao.gouv.fr/fichier/PNODUOssau-Iraty.pdf',
         r:'Limite de concentrés en moyenne par brebis sur une campagne (150 kg de matière sèche) et limite journalière (800 g, d\'après le texte consulté). Version ancienne : à vérifier dans le cahier des charges en vigueur.' },
  aopmot:{ t:'INAO : plan national de contrôle, AOP Ossau-Iraty (version 2015)', u:'https://www.inao.gouv.fr/fichier/PNODUOssauIraty2015.pdf',
         r:'Le texte consulté mentionne un taux minimal de matière sèche de 70 % pour l\'herbe enrubannée dans certaines dispositions. Portée exacte à vérifier dans le cahier des charges en vigueur.' },
  traite:{ t:'Réussir Pâtre : alimentation des brebis laitières', u:'https://www.reussir.fr/patre/un-dalimentation-des-brebis-laitieres',
         r:'Le cahier des charges de l\'AOP Ossau-Iraty précise que la période de traite est comprise entre novembre et août et ne dépasse pas 265 jours. À vérifier dans la version en vigueur.' },
  predation:{ t:'INRAE (HAL) : viabilité des élevages ovins lait des Pyrénées-Atlantiques selon des scénarios de protection contre les prédateurs', u:'https://hal.inrae.fr/hal-04767111v1/document',
         r:'Dans les scénarios étudiés, la viabilité des élevages est toujours diminuée, de multiples façons.' }
};
const GRAV = { 3:'À traiter en priorité', 2:'À surveiller', 1:'À vérifier ou à noter' };
const P = (t,p,s) => ({t,p,s});

/* Pistes générales associées aux indicateurs hors de la référence du centre */
const PISTES_IND = {
  fertilite:[ P('Vérifier le nombre de femelles par bélier, la durée de la lutte et l\'état corporel des brebis à la lutte.','terrain'), P('Faire contrôler les béliers avant la lutte (état général, aplombs, testicules).','terrain'), P('Regarder les avortements et les maladies de la reproduction (rubrique Santé).','terrain') ],
  prolificite:[ P('Regarder l\'état corporel des brebis à la lutte et l\'alimentation des semaines qui la précèdent.','terrain'), P('Choisir les béliers et les agnelles de renouvellement dans des familles prolifiques.','terrain') ],
  mortalite_agneaux:[ P('Voir la fiche « Où se perdent les agneaux » : la solution dépend du moment des pertes.','terrain') ],
  mortalite_adultes:[ P('Faire établir la cause des morts (autopsie, GDS) avant de chercher une solution générale.','terrain'), P('Regarder les boiteries, mammites et parasitismes saisis dans la rubrique Santé.','terrain') ],
  lait_brebis:[ P('Contrôler la couverture des besoins des lots en lactation (rubrique Rations).','terrain'), P('Regarder la part de primipares : elles produisent moins.','src','primi'), P('Mettre en place ou exploiter le contrôle laitier pour repérer les meilleures brebis.','terrain') ],
  conc_kg_brebis:[ P('Ajuster les concentrés par lot plutôt que pour tout le troupeau.','src','lots'), P('Améliorer la qualité des fourrages pour réduire le besoin de concentrés.','terrain') ],
  conc_ms_brebis:[ P('Ajuster les concentrés par lot plutôt que pour tout le troupeau.','src','lots'), P('Vérifier le plafond du cahier des charges en vigueur.','src','aop') ],
  conc_g_litre:[ P('Ajuster les concentrés par lot selon la production laitière.','src','lots'), P('Faire analyser les fourrages pour mieux ajuster les apports.','src','analyse') ],
  autonomie_fourragere:[ P('Regarder les rendements des prairies : fertilisation, nombre de coupes, date de fauche.','terrain'), P('Acheter des fourrages ciblés (analysés) plutôt que des quantités non connues.','src','analyse') ],
  autonomie_alim:[ P('Regarder les rendements des prairies et la place du pâturage.','terrain'), P('Étudier la production de céréales ou de protéagineux sur l\'exploitation.','terrain') ],
  autonomie_conc:[ P('Étudier la production de céréales ou de protéagineux sur l\'exploitation.','terrain') ],
  cout_alim_brebis:[ P('Regarder d\'abord le poste dominant (concentrés, fourrages achetés ou minéraux).','terrain'), P('Ajuster les concentrés par lot.','src','lots') ],
  cout_alim_1000l:[ P('Regarder d\'abord le poste dominant (concentrés, fourrages achetés ou minéraux).','terrain'), P('Ajuster les concentrés par lot.','src','lots') ],
  mca_brebis:[ P('Chercher d\'abord du côté du produit (litres par brebis, prix), puis du coût alimentaire.','terrain') ],
  produit_brebis:[ P('Regarder les litres par brebis, le prix du lait et la productivité numérique.','terrain') ],
  marge_brute_brebis:[ P('Comparer la marge brute au produit : si le produit est bon, les charges du troupeau sont en cause.','terrain') ],
  ebe_brebis:[ P('Distinguer ce qui vient du produit de ce qui vient des charges de structure.','terrain') ],
  ebe_uth:[ P('Regarder le nombre de brebis par unité de main-d\'œuvre et les charges de structure.','terrain') ],
  taux_ebe:[ P('Regarder le poids des charges de structure et de l\'alimentation dans le produit.','terrain') ],
  cout_1000l:[ P('Séparer l\'effet du volume de lait (charges réparties sur moins de litres) de celui des prix et des charges.','terrain') ],
  prix_revient:[ P('Séparer l\'effet du volume de lait de celui des charges.','terrain') ],
  h_astreinte_brebis:[ P('Regarder la distribution des aliments, l\'étalement des mises bas et l\'organisation de la traite.','terrain') ],
  fertilite_ia:[ P('Vérifier le protocole de synchronisation, le moment de l\'insémination et la manipulation des semences.','terrain') ],
  cout_ia_femelle:[ P('Comparer le coût par mise bas obtenue à celui d\'un bélier de monte naturelle.','terrain') ]
};

/* ---------- Outils ---------- */
function dispo(g,k){
  if(k.startsWith('T:')){ const rows=g.rows(k.slice(2)); return rows.some(r=>Object.values(r).some(v=>v!==''&&v!=null)); }
  return g.n(k)!=null;
}
const libDonnee = k => k.startsWith('T:') ? ({rations:'les rations',fourrages:'les fourrages',lait_mensuel:'le lait mois par mois',ventes_agneaux:'les ventes d\'agneaux',concentres:'les concentrés'}[k.slice(2)]||k) : ((FIELDS[k]&&FIELDS[k].l)||k).toLowerCase();
const lotsAvec = (g,champ,pred) => g.rows('rations').filter(r=>{ const c=g.rc('rations',r); return c[champ]!=null&&pred(c[champ]); }).map(r=>({nom:r.nom||r.stade||'Lot',v:g.rc('rations',r)[champ]}));
const msFourrage = (g,pred) => g.rows('fourrages').filter(r=>r.type!=='Paille (litière)'&&pred(r)).reduce((s,r)=>s+g.rc('fourrages',r).ms_t,0)||0;

/* ---------- Règles ---------- */
const REGLES = [
 { id:'agneaux_ecart', titre:'Des agneaux ne sont pas expliqués', donnees:['sevres'],
   test:g=>{ const e=g.n('ecart_agneaux'); if(e==null||Math.abs(e)<=3) return null;
     return { grav:1, faits:[ e>0? `${FM.int(e)} agneaux sevrés ne sont ni vendus, ni gardés, ni consommés.` : `${FM.int(-e)} agneaux ont été vendus, gardés ou consommés en plus des agneaux sevrés.` ],
       pistes:[ P('Reprendre les ventes, les agnelles gardées et les agneaux encore présents à la date du bilan.','terrain'), P('Vérifier les mort-nés et les morts avant sevrage : un oubli ici fausse la mortalité et la productivité.','terrain') ] }; } },

 { id:'pertes_agneaux', titre:'Où se perdent les agneaux', donnees:['nes_total'],
   test:g=>{ const mn=g.z('nes_morts'), ms=g.z('morts_sevrage'), pertes=mn+ms, nes=g.n('nes_total'); if(!nes||pertes<=0) return null;
     const ind=INDICATEURS.find(i=>i.k==='mortalite_agneaux'); const grav=apprec(ind,g.n('mortalite_agneaux'))==='À améliorer'?3:1; const partN=mn/pertes;
     const faits=[`Les pertes représentent ${FM.pct(pertes/nes)} des agneaux nés (${FM.int(pertes)} agneaux).`, `${FM.pct(partN)} des pertes ont lieu à la naissance (mort-nés), ${FM.pct(1-partN)} entre la naissance et le sevrage.`];
     if(g.z('diarrhees')>0) faits.push(`${FM.int(g.z('diarrhees'))} agneaux malades (diarrhées ou autres) sont signalés.`);
     if(g.z('avortements')>0) faits.push(`${FM.int(g.z('avortements'))} avortements sont signalés.`);
     const pistes = partN>=0.5 ? [ P('Vérifier la couverture des besoins des brebis en fin de gestation (lot « Fin de gestation » de la rubrique Rations).','terrain'), P('Regarder les avortements et leur cause (GDS, laboratoire).','terrain'), P('Regarder l\'état corporel des brebis à l\'agnelage et les difficultés de mise bas.','terrain') ]
       : [ P('Regarder la prise du colostrum, l\'hygiène des loges et la densité en bergerie.','terrain'), P('Regarder les diarrhées et les épisodes de mammite des mères (le lait manque aux agneaux).','terrain'), P('Vérifier la couverture des besoins en début de lactation (rubrique Rations).','terrain') ];
     return { grav, faits, pistes }; } },

 { id:'primipares', titre:'Une part importante de primipares', donnees:['femelles_repro','agnelles_luttees'],
   test:g=>{ const f=g.z('femelles_repro'), a=g.z('agnelles_luttees'); if(!(f+a)||a/(f+a)<=0.3) return null;
     return { grav:1, faits:[`Les agnelles représentent ${FM.pct(a/(f+a))} des femelles mises à la reproduction.`, 'Ce niveau dépasse environ 30 %, part habituelle citée pour les primipares.'],
       pistes:[ P('Les primipares produisent environ 30 % de lait en moins et mangent moins que les adultes : à prévoir dans les attentes de lait.','src','primi'), P('Leur réserver un lot et des apports adaptés, sans les confondre avec les adultes.','src','lots'), P('Vérifier le taux de réforme : un renouvellement très rapide peut venir de réformes précoces.','terrain') ] }; } },

 { id:'couv_ufl_basse', titre:'Énergie insuffisante dans la ration d\'un lot', donnees:['T:rations'],
   test:g=>{ const l=lotsAvec(g,'cov_ufl',v=>v<0.95); if(!l.length) return null; const mn=Math.min(...l.map(x=>x.v));
     return { grav:mn<0.85?3:2, faits:l.map(x=>`${x.nom} : énergie couverte à ${FM.pct(x.v)}.`),
       pistes:[ P('Ajuster les apports lot par lot : donner davantage aux brebis les plus productrices et moins aux autres.','src','lots'), P('Vérifier la quantité réellement ingérée (refus) et la qualité réelle du fourrage par une analyse.','src','analyse'), P('Utiliser le meilleur fourrage pour ce lot, ou augmenter le concentré énergétique.','terrain'), P('Contrôler le besoin saisi : il dépend du poids, du stade et du lait attendu.','terrain') ] }; } },

 { id:'couv_pdi_basse', titre:'Protéines insuffisantes dans la ration d\'un lot', donnees:['T:rations'],
   test:g=>{ const l=lotsAvec(g,'cov_pdi',v=>v<0.95); if(!l.length) return null; const mn=Math.min(...l.map(x=>x.v));
     return { grav:mn<0.85?3:2, faits:l.map(x=>`${x.nom} : protéines couvertes à ${FM.pct(x.v)}.`),
       pistes:[ P('Apporter un correcteur azoté (tourteau ou protéagineux) en priorité au début de la lactation.','terrain'), P('Utiliser des foins de légumineuses ou des regains, plus riches en azote, pour ce lot.','terrain'), P('Faire analyser les fourrages : l\'azote réel est souvent différent de celui qu\'on suppose.','src','analyse') ] }; } },

 { id:'couv_haute', titre:'Apports supérieurs aux besoins', donnees:['T:rations'],
   test:g=>{ const a=lotsAvec(g,'cov_ufl',v=>v>1.15), b=lotsAvec(g,'cov_pdi',v=>v>1.15); if(!a.length&&!b.length) return null;
     return { grav:2, faits:[...a.map(x=>`${x.nom} : énergie couverte à ${FM.pct(x.v)}.`),...b.map(x=>`${x.nom} : protéines couvertes à ${FM.pct(x.v)}.`)],
       pistes:[ P('Réduire les concentrés pour ces lots et les réserver aux lots qui en ont besoin : un essai a économisé 51 kg de concentrés par brebis à lait égal.','src','lots'), P('Vérifier d\'abord que les besoins saisis ne sont pas sous-estimés.','terrain') ] }; } },

 { id:'rations_sans_besoin', titre:'Couverture des besoins non calculable', donnees:['T:rations'],
   test:g=>{ const l=g.rows('rations').filter(r=>(r.nom||r.stade)&&!(num(r.bufl)>0)); if(!l.length) return null;
     return { grav:1, faits:[`${l.length} lot(s) sans besoin d'énergie saisi : ${l.map(r=>r.nom||r.stade).join(', ')}.`], pistes:[ P('Calculer les besoins avec INRAtion, Systali ou les tables INRAE, puis les saisir dans la rubrique Rations.','terrain') ] }; } },

 { id:'fourrage_analyse', titre:'Fourrages sans analyse', donnees:['T:fourrages'],
   test:g=>{ const tot=msFourrage(g,r=>r.origine!=='Acheté'); if(!tot) return null; const sans=msFourrage(g,r=>r.origine!=='Acheté'&&!(num(r.ufl)>0)); if(sans<=0) return null;
     const nb=g.rows('fourrages').filter(r=>r.type!=='Paille (litière)'&&r.origine!=='Acheté'&&!(num(r.ufl)>0)).length;
     return { grav:sans/tot>0.5?2:1, faits:[`${nb} fourrage(s) produit(s) sans analyse, soit ${FM.pct(sans/tot)} de la matière sèche produite.`, 'Sans analyse, l\'énergie et les protéines des rations sont des estimations.'],
       pistes:[ P('Faire analyser les principaux lots de fourrage : le coût est faible par rapport aux concentrés qu\'on peut éviter.','src','analyse'), P('Prélever un échantillon par coupe et par parcelle importante, avant de distribuer.','terrain') ] }; } },

 { id:'fourrage_qualite', titre:'Fourrages de qualité faible', donnees:['T:fourrages'],
   test:g=>{ const faibles=g.rows('fourrages').filter(r=>r.type!=='Paille (litière)'&&(r.qualite==='Médiocre'||/Tardif/.test(r.stade||'')||/Mauvaises/.test(r.conditions||'')||(num(r.ufl)>0&&num(r.ufl)<=0.6)));
     if(!faibles.length) return null; const tot=msFourrage(g,()=>true)||1; const q=faibles.reduce((s,r)=>s+g.rc('fourrages',r).ms_t,0);
     const faits=faibles.map(r=>{ const m=[]; if(r.qualite==='Médiocre') m.push('qualité médiocre'); if(/Tardif/.test(r.stade||'')) m.push('fauché tard'); if(/Mauvaises/.test(r.conditions||'')) m.push('mauvaises conditions de récolte'); if(num(r.ufl)>0&&num(r.ufl)<=0.6) m.push(`énergie basse (${FM.d2(num(r.ufl))} UFL/kg MS)`); return `${r.nom||r.type} : ${m.join(', ')}.`; });
     faits.push(`Ces fourrages représentent ${FM.pct(q/tot)} de la matière sèche.`);
     const pistes=[ P('Réserver ces fourrages aux lots à faibles besoins (brebis taries, début de gestation) et les compléter.','terrain'), P('Faucher plus tôt la prochaine année, ou récolter l\'herbe jeune en enrubannage ou en regain.','terrain') ];
     if(faibles.some(r=>num(r.ufl)>0&&num(r.ufl)<=0.6)) pistes.push(P('Des valeurs de cet ordre (environ 0,6 UFL/kg MS) sont citées pour des foins faibles.','src','foinfaible'));
     return { grav:q/tot>0.3?2:1, faits, pistes }; } },

 { id:'stock_baisse', titre:'Le stock de fourrages a baissé', donnees:['stock_debut','stock_fin'],
   test:g=>{ const d=g.n('stock_debut'), f=g.n('stock_fin'); if(!d||f==null||(d-f)/d<=0.1) return null;
     return { grav:1, faits:[`Le stock est passé de ${FM.d1(d)} à ${FM.d1(f)} t de matière sèche (${FM.pct((d-f)/d)} de baisse).`],
       pistes:[ P('Prévoir la reconstitution du stock : une année difficile suivante se paierait en achats.','terrain'), P('Comparer au besoin d\'un hiver complet (jusqu\'à 20 semaines de rationnement possibles pour des brebis laitières).','terrain') ] }; } },

 { id:'ration_bilan', titre:'Rations et bilan fourrager qui ne concordent pas', donnees:['rat_fourrage_t','ms_consomme'],
   test:g=>{ const e=g.n('rat_ecart'); if(e==null||Math.abs(e)<=0.2) return null;
     return { grav:1, faits:[`Les fourrages distribués d'après les rations (${FM.d1(g.n('rat_fourrage_t'))} t MS) diffèrent de ${FM.pct(Math.abs(e))} des fourrages consommés du bilan (${FM.d1(g.n('ms_consomme'))} t MS).`],
       pistes:[ P('Vérifier que tous les lots sont saisis (agnelles, béliers, tarissement) et leurs durées.','terrain'), P('Vérifier les stocks de début et de fin, et les quantités récoltées ou achetées.','terrain') ] }; } },

 { id:'lait_incoherent', titre:'Le lait mensuel ne correspond pas au lait livré', donnees:['lait_mensuel_total','lait_livre'],
   test:g=>{ const t=g.n('lait_mensuel_total'), l=g.n('lait_livre'); if(!t||!l||Math.abs(t-l)<=0.03*l) return null;
     return { grav:1, faits:[`Le total des mois (${FM.int(t)} L) diffère de plus de 3 % du lait livré (${FM.int(l)} L).`], pistes:[ P('Reprendre les relevés de collecte mois par mois.','terrain') ] }; } },

 { id:'cellules', titre:'Cellules en hausse en fin de lactation', donnees:['T:lait_mensuel'],
   test:g=>{ const m=g.rows('lait_mensuel').filter(r=>num(r.litres)>0&&num(r.cell)>0); if(m.length<6) return null;
     const a=m.slice(0,3).reduce((s,r)=>s+num(r.cell),0)/3, b=m.slice(-3).reduce((s,r)=>s+num(r.cell),0)/3; if(b/a<=2) return null;
     const faits=[`Les cellules passent d'environ ${FM.int(a)} à ${FM.int(b)} milliers/mL entre les trois premiers et les trois derniers mois.`]; if(g.z('mammites')>0) faits.push(`${FM.int(g.z('mammites'))} cas de mammites sont signalés.`);
     return { grav:2, faits, pistes:[ P('Contrôler l\'hygiène et le réglage de la machine à traire, surtout en fin de lactation.','terrain'), P('Repérer et traiter ou réformer les brebis à mammite chronique.','terrain'), P('Regarder les pénalités du paiement à la qualité dans la rubrique Lait.','terrain') ] }; } },

 { id:'ia_vs_naturelle', titre:'Fertilité après insémination inférieure à celle du reste du troupeau', donnees:['fertilite_ia','fertilite'],
   test:g=>{ const fia=g.n('fertilite_ia'); const fem=g.z('femelles_repro')+g.z('agnelles_luttees'); const ia=g.z('femelles_ia'); const mb=g.z('mb_adultes')+g.z('mb_agnelles'); if(fia==null||fem-ia<=0) return null;
     const nat=(mb-g.z('mb_ia'))/(fem-ia); if(!isFinite(nat)||nat-fia<=0.1) return null;
     return { grav:2, faits:[`Fertilité après insémination : ${FM.pct(fia)}, contre ${FM.pct(nat)} pour les femelles non inséminées.`],
       pistes:[ P('Vérifier le protocole de synchronisation et le moment de l\'insémination.','terrain'), P('Vérifier la qualité et la manipulation des semences.','terrain'), P('Regarder l\'état corporel et le stress des brebis au moment de l\'insémination.','terrain'), P('Garder en tête le gain génétique attendu : comparer sur plusieurs campagnes avant de conclure.','terrain') ] }; } },

 { id:'ebe_negatif', titre:'Excédent brut d\'exploitation insuffisant', donnees:['ebe'],
   test:g=>{ const e=g.n('ebe'), d=g.n('dispo'); if(e==null) return null; if(e<0) return { grav:3, faits:[`L'EBE est négatif (${FM.eur(e)}).`], pistes:[ P('Repérer le poste de charges le plus lourd par brebis, puis le poste le plus éloigné de la référence du centre.','terrain'), P('Vérifier la saisie des produits et des aides avant toute conclusion.','terrain') ] };
     if(d!=null&&d<0) return { grav:3, faits:[`Les annuités (${FM.eur(g.z('annuites'))}) dépassent l'EBE (${FM.eur(e)}) : il reste ${FM.eur(d)}.`], pistes:[ P('Regarder avec l\'éleveur le calendrier des remboursements et la possibilité de le lisser.','terrain'), P('Regarder le poids des annuités dans le produit (indicateur « Annuités sur produit brut »).','terrain') ] };
     return null; } },

 { id:'sans_aides', titre:'Sans les aides, l\'EBE serait négatif', donnees:['ebe','aides_total'],
   test:g=>{ const e=g.n('ebe'), a=g.n('aides_total'); if(e==null||!a||e-a>=0) return null;
     return { grav:2, faits:[`EBE : ${FM.eur(e)}. Sans les ${FM.eur(a)} d'aides, il serait de ${FM.eur(e-a)}.`],
       pistes:[ P('Vérifier que toutes les aides auxquelles l\'exploitation a droit sont bien déclarées chaque année.','terrain'), P('Chercher des marges techniques (productivité, alimentation) pour réduire cette dépendance.','terrain') ] }; } },

 { id:'charges_dominantes', titre:'Où se concentrent les charges', donnees:['charges_oper'],
   test:g=>{ const co=g.n('charges_oper'); if(!co) return null; const postes=[['alimentation achetée','ch_alim'],['frais de santé','ch_veto'],['frais d\'élevage','ch_elevage'],['litière','ch_litiere'],['insémination et génétique','ch_ia'],['estive','ch_estive'],['charges de surfaces','ch_surfaces']].map(([l,k])=>({l,v:g.z(k)})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,3);
     if(!postes.length) return null; const pt=g.n('produit_total');
     const faits=[`Postes les plus lourds des charges du troupeau : ${postes.map(x=>`${x.l} (${FM.eur(x.v)}, ${FM.pct(x.v/co)})`).join(' ; ')}.`]; if(pt) faits.push(`Les charges du troupeau représentent ${FM.pct(co/pt)} du produit brut.`);
     return { grav:1, faits, pistes:[ P('Commencer le travail d\'amélioration par le poste le plus lourd.','terrain') ] }; } },

 { id:'predation', titre:'Pression de prédation', donnees:['predation'],
   test:g=>{ if(cur_pred(g)!=='Régulière') return null; return { grav:2, faits:['Une pression de prédation régulière est signalée.'],
     pistes:[ P('Ajouter dans le bilan le coût des moyens de protection (chiens, clôtures, gardiennage) et le temps de travail supplémentaire.','terrain'), P('Les scénarios de protection étudiés par l\'INRAE diminuent toujours la viabilité des élevages : à chiffrer, pas à ignorer.','src','predation') ] }; } }
];
function cur_pred(g){ return g.d('predation'); }

/* Règles liées à l'AOP, ajoutées ici car elles lisent des valeurs de rations et de fourrages */
REGLES.push(
 { id:'aop_conc', titre:'Concentrés au-dessus du plafond de l\'AOP (à vérifier)', donnees:['conc_ms_brebis'],
   test:g=>{ if(g.d('aop')!=='Oui') return null; const v=g.n('conc_ms_brebis'); const jour=g.rows('rations').filter(r=>{ const l=ligneConc(g,r.c1); const l2=ligneConc(g,r.c2); const ms=(l?num(r.c1kg)*pm(l.ms)/100:0)+(l2?num(r.c2kg)*pm(l2.ms)/100:0); return ms>0.8; }).map(r=>r.nom||r.stade);
     if(!(v>150)&&!jour.length) return null; const faits=[]; if(v>150) faits.push(`${FM.int(v)} kg de matière sèche de concentrés par brebis sur la campagne (plafond annoncé : 150 kg).`); if(jour.length) faits.push(`Plus de 0,8 kg de matière sèche de concentrés par jour dans : ${jour.join(', ')}.`);
     return { grav:3, faits, pistes:[ P('Vérifier d\'abord le plafond dans le cahier des charges en vigueur : les valeurs consultées datent de 2015.','src','aop'), P('Ajuster les concentrés par lot pour rester sous le plafond sans perdre de lait.','src','lots'), P('Améliorer la qualité des fourrages pour réduire le besoin.','terrain') ] }; } },
 { id:'aop_traite', titre:'Période de traite longue pour l\'AOP (à vérifier)', donnees:['jours_traite'],
   test:g=>{ if(g.d('aop')!=='Oui'||!(g.n('jours_traite')>265)) return null; return { grav:3, faits:[`La traite dure ${FM.int(g.n('jours_traite'))} jours (plafond cité : 265 jours, de novembre à août).`], pistes:[ P('Vérifier les dates saisies, puis le cahier des charges en vigueur.','src','traite') ] }; } },
 { id:'aop_enrub', titre:'Enrubannage à faible matière sèche (AOP, à vérifier)', donnees:['T:fourrages'],
   test:g=>{ if(g.d('aop')!=='Oui') return null; const l=g.rows('fourrages').filter(r=>/Enrubannage/.test(r.type||'')&&r.ms!==''&&r.ms!=null&&num(r.ms)<70); if(!l.length) return null;
     return { grav:1, faits:l.map(r=>`${r.nom||r.type} : matière sèche ${FM.int(num(r.ms))} %.`), pistes:[ P('Vérifier l\'exigence de 70 % de matière sèche dans le cahier des charges en vigueur.','src','aopmot'), P('Préfaner davantage l\'herbe avant l\'enrubannage.','terrain') ] }; } }
);

/* ---------- Exécution ---------- */
function diagnostiquer(exp){
  const g=makeG(exp); const res=[], nonEval=[];
  REGLES.forEach(r=>{
    const manque=(r.donnees||[]).filter(k=>!dispo(g,k));
    if(manque.length){ nonEval.push({titre:r.titre,manque:manque.map(libDonnee)}); return; }
    let o=null; try{ o=r.test(g); }catch(e){ o=null; }
    if(o) res.push({id:r.id,titre:r.titre,...o});
  });
  /* Indicateurs en retrait par rapport aux références du centre */
  INDICATEURS.forEach(i=>{
    const v=g.n(i.k); if(apprec(i,v)!=='À améliorer') return; const r=refOf(i); const e=(i.sens==='H'?1:-1)*(v-num(r.ref))/num(r.ref);
    res.push({ id:'ref_'+i.k, titre:`${i.l} en retrait de la référence`, grav:e<-0.25?3:2,
      faits:[`${i.l} : ${fmtVal(v,i.fmt)} ${i.u}, contre ${fmtVal(num(r.ref),i.fmt)} pour la référence (${ecartTxt(i,v)}).`, r.src?`Référence : ${r.src}`:'Référence saisie par le centre.'],
      pistes:PISTES_IND[i.k]||[ P('Chercher la cause dans les indicateurs qui composent celui-ci.','terrain') ] });
  });
  res.sort((a,b)=>b.grav-a.grav);
  return {res,nonEval};
}
function diagHTML(exp){
  const {res,nonEval}=diagnostiquer(exp); const nb=n=>res.filter(x=>x.grav===n).length; const utilisees=new Set();
  res.forEach(x=>x.pistes.forEach(p=>{ if(p.s) utilisees.add(p.s); }));
  const sommaire=res.length?`<p class="note"><b>${res.length}</b> point(s) relevé(s) : ${nb(3)} à traiter en priorité, ${nb(2)} à surveiller, ${nb(1)} à vérifier ou à noter.</p>`:'<p class="note">Aucun problème détecté avec les données saisies. Cela peut venir de données manquantes : voir plus bas.</p>';
  const cartes=res.map(x=>`<article class="diag g${x.grav}"><div class="gr">${GRAV[x.grav]}</div><h3>${esc(x.titre)}</h3><p class="lab">Ce que disent les données</p><ul>${x.faits.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p class="lab">Pistes de solution</p><ul class="pistes">${x.pistes.map(p=>`<li><span class="pv ${p.p}">${p.p==='src'?'Source citée':'Repère de terrain'}</span> ${esc(p.t)}</li>`).join('')}</ul></article>`).join('');
  const srcs=[...utilisees].map(k=>SOURCES[k]).filter(Boolean).map(s=>`<li><b>${esc(s.t)}</b> : ${esc(s.r)} <span class="url">${esc(s.u)}</span></li>`).join('');
  const ne=nonEval.length?`<div class="noneval"><h4>Contrôles non réalisés faute de données</h4><ul>${nonEval.map(x=>`<li><b>${esc(x.titre)}</b> : il manque ${esc(x.manque.join(', '))}.</li>`).join('')}</ul></div>`:'';
  return `${sommaire}<p class="note"><span class="pv src">Source citée</span> : la piste s'appuie sur une publication consultée (listée en fin de section). <span class="pv terrain">Repère de terrain</span> : pratique courante, non démontrée ici, à valider par le centre. Les écarts à une référence ne se calculent que si le centre a saisi cette référence.</p>${cartes}${ne}${srcs?`<div class="sources"><h4>Sources des pistes</h4><ul>${srcs}</ul></div>`:''}`;
}
