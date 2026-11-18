'use strict';
/* ============================================================
   MODÈLE DE DONNÉES — bilan technico-économique ovin lait
   Tout ce qui est saisi, calculé et comparé est décrit ici.
   ============================================================ */
const MOIS = ['Novembre','Décembre','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre'];

// Constructeurs de champs
const N = (k,l,u,o={}) => ({k,l,u,t:'n',...o});
const T = (k,l,o={})   => ({k,l,t:'t',...o});
const A = (k,l,o={})   => ({k,l,t:'a',...o});           // zone de texte
const S = (k,l,opts,o={}) => ({k,l,t:'s',opts,...o});
const D = (k,l,o={})   => ({k,l,t:'d',...o});
const C = (k,l,u,fmt,f,o={}) => ({k,l,u,t:'c',fmt,f,...o});

const OUINON = ['Oui','Non'];
const TYPES_FOURRAGE = ['Foin de prairie (1re coupe)','Regain','Foin de luzerne ou légumineuses','Ensilage d\'herbe','Enrubannage','Ensilage de maïs','Méteil fourrager','Paille (litière)','Autre fourrage'];
const CAT_CONC = ['Céréale (orge, maïs, blé…)','Protéagineux ou tourteau','Aliment composé (granulé)','Luzerne déshydratée','Minéral et vitamines','Lait maternisé','Autre'];
const USAGES_SURFACE = ['Prairie naturelle fauchée','Prairie naturelle pâturée','Prairie temporaire','Maïs fourrage','Méteil ou céréales fourragères','Luzerne ou légumineuses','Céréales pour le grain','Autre surface non fourragère'];
const USAGES_NON_FOURRAGERS = ['Céréales pour le grain','Autre surface non fourragère'];
const STADES_LOT = ['Fin de gestation','Début de lactation','Pleine lactation','Fin de lactation','Tarissement','Agnelles','Béliers','Autre lot'];

/* ---------- Surfaces, ration, tables : définitions de tableaux ---------- */
const TABLES = {
  surfaces: { titre:'Parcelles et surfaces', ajout:'Ajouter une surface', libelle:r=>(r.nom||r.usage||'Surface'),
    cols:[ T('nom','Nom ou repère (facultatif)'), S('usage','Usage principal',USAGES_SURFACE), N('ha','Surface','ha',{d:1}),
           N('coupes','Nombre de coupes de foin','coupes',{aide:'0 si uniquement pâturée'}), N('azote','Azote apporté','unités/ha',{aide:'Engrais minéral et organique, en unités d\'azote'}),
           N('fumier','Fumier ou lisier épandu','t/ha') ],
    resume:(r,g)=> r.ha? `${FM.d1(num(r.ha))} ha`:'' },

  ventes_agneaux: { titre:'Ventes d\'agneaux', ajout:'Ajouter une catégorie de vente', libelle:r=>r.categorie||'Vente d\'agneaux',
    cols:[ S('categorie','Catégorie',['Agneau de lait (léger)','Agneau lourd','Agneau Label ou IGP','Agnelle ou agneau de reproduction','Autre']),
           N('nb','Nombre vendu','agneaux'), N('poids','Poids moyen (carcasse ou vif)','kg'), N('prix','Prix moyen','€/tête',{aide:'Prix par agneau, prime comprise'}) ],
    rcalcs:[ C('total','Produit','€','eur',(r)=> num(r.nb)*num(r.prix)) ],
    resume:(r,g,rc)=> rc.total? FM.eur(rc.total):'' },

  lait_mensuel: { titre:'Lait livré mois par mois', fixe:MOIS, libelle:(r,i)=>MOIS[i],
    cols:[ N('litres','Lait livré','litres'), N('tb','Matière grasse (TB)','g/L',{d:1}), N('tp','Matière protéique (TP)','g/L',{d:1}),
           N('cell','Cellules','milliers/mL'), N('germes','Germes','milliers/mL') ],
    resume:(r)=> r.litres? FM.int(num(r.litres))+' L':'' },

  fourrages: { titre:'Fourrages : récolte, achats, qualité', ajout:'Ajouter un fourrage', libelle:r=>r.nom||r.type||'Fourrage',
    cols:[ T('nom','Nom ou repère (ex. foin des Aldudes)'), S('type','Type de fourrage',TYPES_FOURRAGE),
           S('origine','Origine',['Produit sur l\'exploitation','Acheté']), N('ha','Surface récoltée','ha',{d:1,aide:'Si produit sur l\'exploitation'}),
           N('qte','Quantité récoltée ou achetée','t brutes',{d:1}), N('ms','Matière sèche','%',{aide:'Foin ≈ 85-90 %. Enrubannage ≈ 40-60 %. Ensilage d\'herbe ≈ 20-40 %. À mesurer si possible.'}),
           N('prix','Prix d\'achat','€/t brute',{aide:'Si acheté, ou valeur de cession si vous voulez le valoriser'}),
           S('stade','Stade de fauche',['Précoce (avant épiaison)','Normal','Tardif (graines formées)'],{}),
           D('date_recolte','Date de récolte'),
           S('conditions','Conditions de récolte',['Bonnes (séchage rapide)','Moyennes','Mauvaises (pluie, retard)']),
           S('qualite','Qualité apparente',['Très bonne','Bonne','Moyenne','Médiocre']),
           D('date_analyse','Date de l\'analyse (si faite)'),
           N('mat','Matière azotée totale','g/kg MS',{aide:'Donnée de l\'analyse en laboratoire'}),
           N('ufl','Énergie (UFL)','UFL/kg MS',{d:2}), N('pdie','Protéines digestibles PDIE','g/kg MS'), N('pdin','Protéines digestibles PDIN','g/kg MS'),
           N('uel','Encombrement (UEL)','UEL/kg MS',{d:2}), N('ca','Calcium','g/kg MS',{d:1}), N('p','Phosphore','g/kg MS',{d:1}) ],
    rcalcs:[ C('ms_t','Matière sèche','t MS','d1',(r)=> num(r.qte)*(r.ms===''||r.ms==null?0:num(r.ms))/100),
             C('rdt','Rendement','t MS/ha','d1',(r,g,rc)=> r.origine==='Acheté'?null: dv(rc.ms_t,num(r.ha))),
             C('valeur','Valeur d\'achat','€','eur',(r)=> r.origine==='Acheté'? num(r.qte)*num(r.prix):null) ],
    resume:(r,g,rc)=> rc.ms_t? `${FM.d1(rc.ms_t)} t MS`:'' },

  concentres: { titre:'Concentrés et compléments', ajout:'Ajouter un aliment', libelle:r=>r.nom||r.cat||'Aliment',
    cols:[ T('nom','Nom de l\'aliment (ex. orge, granulé 18 %)'), S('cat','Catégorie',CAT_CONC), S('origine','Origine',['Acheté','Produit sur l\'exploitation']),
           N('qte','Quantité sur la campagne','t brutes',{d:2}), N('ms','Matière sèche','%',{def:88,aide:'Valeur usuelle proposée. À corriger avec l\'étiquette.'}),
           N('prix','Prix','€/t',{aide:'Prix d\'achat. Pour un aliment produit : valeur retenue (prix de cession)'}),
           S('dest','Distribué à',['Brebis (toutes)','Brebis en lactation','Agnelles','Béliers','Agneaux','Tous les animaux']),
           N('ufl','Énergie (UFL)','UFL/kg MS',{d:2,aide:'Étiquette ou tables INRAE'}), N('pdi','Protéines digestibles (PDI)','g/kg MS') ],
    rcalcs:[ C('ms_kg','Matière sèche','kg MS','int',(r)=> num(r.qte)*1000*pm(r.ms)/100),
             C('valeur','Valeur','€','eur',(r)=> num(r.qte)*num(r.prix)) ],
    resume:(r,g,rc)=> r.qte? `${FM.d2(num(r.qte))} t · ${FM.eur(rc.valeur)}`:'' },

  rations: { titre:'Rations par lot et période', ajout:'Ajouter un lot', libelle:r=>r.nom||r.stade||'Lot',
    cols:[ T('nom','Nom du lot (ex. lactation hiver)'), S('stade','Stade',STADES_LOT), N('eff','Effectif du lot','brebis'), N('jours','Durée','jours'),
           N('prod','Production laitière moyenne','L/brebis/jour',{d:2}),
           S('f1','Fourrage 1',null,{dyn:'fourrages'}), N('f1kg','Quantité ingérée','kg MS/j',{d:2}),
           S('f2','Fourrage 2',null,{dyn:'fourrages'}), N('f2kg','Quantité ingérée','kg MS/j',{d:2}),
           N('patkg','Herbe pâturée (estimation)','kg MS/j',{d:2}), N('patufl','Énergie de l\'herbe pâturée','UFL/kg MS',{d:2}), N('patpdi','Protéines de l\'herbe pâturée','g PDI/kg MS'),
           S('c1','Concentré 1',null,{dyn:'concentres'}), N('c1kg','Quantité distribuée','kg brut/j',{d:2}),
           S('c2','Concentré 2',null,{dyn:'concentres'}), N('c2kg','Quantité distribuée','kg brut/j',{d:2}),
           N('bufl','Besoin énergie du lot','UFL/brebis/j',{d:2,aide:'À calculer avec INRAtion, Systali ou les tables INRAE. Non préremplie : les besoins dépendent du poids, du stade et du lait.'}),
           N('bpdi','Besoin protéines du lot','g PDI/brebis/j') ],
    rcalcs:[ C('ms_j','Matière sèche ingérée','kg MS/j','d2',(r,g)=> msRation(r,g)),
             C('apt_ufl','Énergie apportée','UFL/j','d2',(r,g)=> aptRation(r,g,'ufl')),
             C('apt_pdi','Protéines apportées','g PDI/j','int',(r,g)=> aptRation(r,g,'pdi')),
             C('cov_ufl','Couverture énergie','%','pct',(r,g,rc)=> num(r.bufl)>0&&rc.apt_ufl? rc.apt_ufl/num(r.bufl):null),
             C('cov_pdi','Couverture protéines','%','pct',(r,g,rc)=> num(r.bpdi)>0&&rc.apt_pdi? rc.apt_pdi/num(r.bpdi):null),
             C('ratio','Protéines pour 1 UFL','g PDI/UFL','int',(r,g,rc)=> dv(rc.apt_pdi,rc.apt_ufl)),
             C('part_conc','Part de concentré dans la ration','%','pct',(r,g,rc)=> dv(concMs(r,g),rc.ms_j)) ],
    resume:(r,g,rc)=> rc.cov_ufl? `énergie couverte à ${FM.pct(rc.cov_ufl)}`:'' },

  sante: { titre:'Dépenses de santé', ajout:'Ajouter un poste', libelle:r=>r.poste||'Poste',
    cols:[ S('poste','Poste',['Visites et interventions du vétérinaire','Médicaments et soins','Vaccins','Antiparasitaires','Analyses (laboratoire)','Parage et boiteries','Cotisation GDS','Autre']),
           N('nb','Animaux concernés','têtes'), N('cout','Coût','€') ],
    resume:(r)=> r.cout? FM.eur(num(r.cout)):'' },

  aides: { titre:'Aides perçues', ajout:'Ajouter une aide', libelle:r=>r.nature||'Aide',
    cols:[ T('nature','Nature de l\'aide (ex. aide ovine, ICHN, MAEC…)'), N('montant','Montant perçu','€',{aide:'Part qui revient à l\'atelier ovin si l\'exploitation a d\'autres productions'}) ],
    resume:(r)=> r.montant? FM.eur(num(r.montant)):'' }
};

/* ---------- Fonctions de calcul sur les rations ---------- */
function ligneFourrage(g,nom){ return nom? g.rows('fourrages').find(x=>x.nom===nom):null; }
function ligneConc(g,nom){ return nom? g.rows('concentres').find(x=>x.nom===nom):null; }
function pdiFourrage(f){ const a=num(f.pdie), b=num(f.pdin); if(a&&b) return Math.min(a,b); return a||b||0; }
function msRation(r,g){
  let t=num(r.f1kg)+num(r.f2kg)+num(r.patkg);
  [['c1','c1kg'],['c2','c2kg']].forEach(([c,q])=>{ const l=ligneConc(g,r[c]); if(l&&num(r[q])) t+=num(r[q])*pm(l.ms)/100; });
  return t||null;
}
function concMs(r,g){
  let t=0; [['c1','c1kg'],['c2','c2kg']].forEach(([c,q])=>{ const l=ligneConc(g,r[c]); if(l&&num(r[q])) t+=num(r[q])*pm(l.ms)/100; });
  return t||null;
}
function aptRation(r,g,w){
  let t=0, any=false;
  [['f1','f1kg'],['f2','f2kg']].forEach(([f,q])=>{ const l=ligneFourrage(g,r[f]); if(l&&num(r[q])){ const v= w==='ufl'?num(l.ufl):pdiFourrage(l); t+=num(r[q])*v; any=true; } });
  if(num(r.patkg)){ t+=num(r.patkg)*(w==='ufl'?num(r.patufl):num(r.patpdi)); any=true; }
  [['c1','c1kg'],['c2','c2kg']].forEach(([c,q])=>{ const l=ligneConc(g,r[c]); if(l&&num(r[q])){ const kgms=num(r[q])*pm(l.ms)/100; t+=kgms*(w==='ufl'?num(l.ufl):num(l.pdi)); any=true; } });
  return any? t:null;
}
// Une teneur en matière sèche absente vaut 0, sauf pour les concentrés où la valeur usuelle (88 %) est préremplie.
function pm(v){ return (v===''||v==null)? 0 : num(v); }

/* ---------- Modules ---------- */
const MODULES = [
 { id:'expl', t:'Exploitation', court:'Exploitation', intro:'Qui, où, et quel type d\'élevage. Ces informations apparaissent en tête du rapport.',
   blocs:[
    { t:'Identification', f:[ T('nom_exploitation','Nom de l\'exploitation'), T('eleveur','Éleveur ou éleveuse'), T('commune','Commune'),
        T('campagne','Campagne',{aide:'Exemple : 2025-2026'}), T('technicien','Bilan établi par'), D('date_bilan','Date du bilan') ] },
    { t:'Type d\'élevage', f:[ S('race','Race',['Manech tête rousse','Manech tête noire','Basco-béarnaise','Plusieurs races','Autre']),
        S('valorisation','Valorisation du lait',['Livreur (laiterie)','Fermier (fromage à la ferme)','Mixte livreur et fermier']), T('laiterie','Laiterie ou collecteur'),
        S('aop','Lait pour AOP Ossau-Iraty',OUINON), S('bio','Agriculture biologique',OUINON), S('label_agneau','Agneaux sous Label ou IGP',OUINON),
        S('atelier_associe','Autre atelier sur l\'exploitation',['Aucun','Vaches allaitantes','Autre élevage','Cultures de vente']),
        N('ugb_autres','Animaux hors ovins','UGB',{d:1,aide:'Pour répartir le chargement. Les produits et charges saisis plus loin doivent concerner l\'atelier ovin seul.'}),
        N('altitude','Altitude de la ferme','m'), S('estive_oui','Montée en estive',OUINON) ] }
   ] },

 { id:'surf', t:'Surfaces et main-d\'œuvre', court:'Surfaces', intro:'Les surfaces servent à calculer le chargement, le lait par hectare et les rendements en fourrage.',
   blocs:[
    { t:'Totaux', f:[ N('sau','Surface agricole utile (SAU)','ha',{d:1,aide:'Hors estive collective'}), N('ha_propriete','Dont surface en propriété','ha',{d:1}),
        C('sfp','Surface fourragère principale','ha','d1',g=> g.sum('surfaces','ha',r=>!USAGES_NON_FOURRAGERS.includes(r.usage))),
        C('sfp_pct','Part fourragère dans la SAU','%','pct',g=> dv(g.n('sfp'),g.n('sau'))) ] },
    { table:'surfaces' },
    { t:'Main-d\'œuvre', f:[ N('umo_exploitant','Exploitants (temps de travail)','UMO',{d:2,aide:'1 UMO = une personne à temps plein sur l\'année'}),
        N('umo_famille','Autre main-d\'œuvre familiale','UMO',{d:2}), N('umo_salarie','Salariés','UMO',{d:2}),
        C('umo_total','Main-d\'œuvre totale','UMO','d2',g=> g.z('umo_exploitant')+g.z('umo_famille')+g.z('umo_salarie')||null) ] }
   ],
   ctrl:[ g=> g.n('sfp')>g.n('sau')&&g.n('sau')? 'La surface fourragère dépasse la SAU. Vérifiez les surfaces ou la SAU.':null ] },

 { id:'tro', t:'Troupeau et reproduction', court:'Troupeau', intro:'Effectifs moyens de la campagne et résultats de la reproduction.',
   blocs:[
    { t:'Effectifs', f:[ N('brebis_presentes','Brebis présentes (effectif moyen)','brebis',{aide:'Base de tous les chiffres « par brebis »'}),
        N('femelles_repro','Brebis adultes mises à la reproduction','têtes'), N('agnelles_luttees','Agnelles mises à la reproduction','têtes'),
        N('beliers','Béliers de monte naturelle','têtes'), N('beliers_achetes','Dont béliers achetés dans l\'année','têtes'),
        C('femelles_belier','Femelles par bélier','têtes','d1',g=> dv(g.z('femelles_repro')+g.z('agnelles_luttees'),g.n('beliers'))) ] },
    { t:'Calendrier', f:[ D('lutte_debut','Début de la lutte'), D('lutte_fin','Fin de la lutte'), D('agnelage_debut','Premières mises bas'), D('agnelage_fin','Dernières mises bas'),
        C('agnelage_etalement','Étalement des mises bas','jours','int',g=> jours(g.d('agnelage_debut'),g.d('agnelage_fin'))) ] },
    { t:'Mises bas', f:[ N('mb_adultes','Brebis adultes ayant mis bas','têtes'), N('mb_agnelles','Agnelles ayant mis bas','têtes'),
        N('nes_total','Agneaux nés (vivants et morts)','agneaux'), N('nes_morts','Dont mort-nés','agneaux') ] },
    { t:'Sorties d\'adultes', f:[ N('reformes','Brebis réformées','brebis'), N('morts_adultes','Brebis mortes','brebis'), N('achats_brebis','Brebis achetées','brebis') ] },
    { t:'Résultats (calculés)', f:[
        C('fertilite','Fertilité','%','pct',g=> dv(g.z('mb_adultes')+g.z('mb_agnelles'),g.z('femelles_repro')+g.z('agnelles_luttees')),{aide:'Femelles ayant mis bas ÷ femelles mises à la reproduction'}),
        C('prolificite','Prolificité','agneaux/mise bas','d2',g=> dv(g.n('nes_total'),g.z('mb_adultes')+g.z('mb_agnelles')),{aide:'Agneaux nés ÷ femelles ayant mis bas'}),
        C('taux_reforme','Taux de réforme','%','pct',g=> dv(g.n('reformes'),g.n('brebis_presentes'))),
        C('mortalite_adultes','Mortalité des adultes','%','pct',g=> dv(g.n('morts_adultes'),g.n('brebis_presentes'))) ] }
   ],
   ctrl:[ g=> g.z('mb_adultes')+g.z('mb_agnelles')>g.z('femelles_repro')+g.z('agnelles_luttees')&&g.z('femelles_repro')? 'Plus de mises bas que de femelles mises à la reproduction. Vérifiez les effectifs.':null,
          g=> g.z('nes_morts')>g.z('nes_total')? 'Il y a plus de mort-nés que d\'agneaux nés.':null ] },

 { id:'agn', t:'Agneaux', court:'Agneaux', intro:'Du naissance au sevrage, puis la vente ou le renouvellement.',
   blocs:[
    { t:'Du naissance au sevrage', f:[ N('morts_sevrage','Agneaux morts entre naissance et sevrage','agneaux',{aide:'Sans compter les mort-nés'}),
        N('age_sevrage','Âge moyen au sevrage','jours'),
        C('nes_vivants','Agneaux nés vivants','agneaux','int',g=> g.n('nes_total')!=null? g.z('nes_total')-g.z('nes_morts'):null),
        C('sevres','Agneaux sevrés','agneaux','int',g=> g.n('nes_vivants')!=null? g.z('nes_vivants')-g.z('morts_sevrage'):null),
        C('mortalite_agneaux','Mortalité des agneaux','%','pct',g=> dv(g.z('nes_morts')+g.z('morts_sevrage'),g.n('nes_total')),{aide:'(mort-nés + morts avant sevrage) ÷ agneaux nés'}),
        C('productivite','Productivité numérique','agneaux/femelle','d2',g=> dv(g.n('sevres'),g.z('femelles_repro')+g.z('agnelles_luttees')),{aide:'Agneaux sevrés ÷ femelles mises à la reproduction'}) ] },
    { t:'Destination des agneaux', f:[ N('agnelles_gardees','Agnelles gardées pour le renouvellement','agnelles'), N('agneaux_autoconso','Agneaux consommés ou donnés','agneaux'),
        C('vendus','Agneaux vendus','agneaux','int',g=> g.sum('ventes_agneaux','nb')),
        C('ecart_agneaux','Contrôle : agneaux non expliqués','agneaux','int',g=> g.n('sevres')!=null? g.z('sevres')-g.z('vendus')-g.z('agnelles_gardees')-g.z('agneaux_autoconso'):null,{aide:'Doit être proche de 0'}),
        C('taux_renouv','Taux de renouvellement','%','pct',g=> dv(g.n('agnelles_gardees'),g.n('brebis_presentes'))) ] },
    { table:'ventes_agneaux' },
    { t:'Total', f:[ C('produit_agneaux','Produit des ventes d\'agneaux','€','eur',g=> g.sum('ventes_agneaux','total')) ] }
   ],
   ctrl:[ g=> g.n('ecart_agneaux')!=null&&Math.abs(g.n('ecart_agneaux'))>3? `${FM.int(Math.abs(g.n('ecart_agneaux')))} agneaux sevrés ne sont ni vendus, ni gardés, ni consommés. Vérifiez les ventes ou les agneaux encore présents.`:null ] },

 { id:'lait', t:'Lait', court:'Lait', intro:'Volume, durée de traite, qualité et prix du lait. Les données mensuelles servent à tracer la courbe de la campagne.',
   blocs:[
    { t:'Campagne de traite', f:[ D('traite_debut','Début de la traite'), D('traite_fin','Fin de la traite'),
        C('jours_traite','Durée de traite','jours','int',g=> jours(g.d('traite_debut'),g.d('traite_fin')),{aide:'Le cahier des charges de l\'AOP Ossau-Iraty limite la période de traite (à vérifier dans la version en vigueur).'}),
        N('brebis_traites','Brebis traites (effectif moyen)','brebis'), N('lait_livre','Lait livré','litres'), N('lait_direct','Lait transformé à la ferme','litres',{aide:'Fermiers uniquement'}),
        N('lait_agneaux','Lait consommé par les agneaux (estimation)','litres') ] },
    { table:'lait_mensuel' },
    { t:'Prix et qualité', f:[ N('prix_base','Prix de base du lait','€/1000 L'), N('primes','Primes de qualité et de saison','€'), N('penalites','Pénalités','€'),
        C('prix_moyen','Prix moyen payé','€/1000 L','eur',g=> g.z('lait_livre')? g.n('produit_lait_livre')/g.z('lait_livre')*1000:null),
        C('produit_lait_livre','Produit du lait livré','€','eur',g=> g.z('lait_livre')? g.z('lait_livre')/1000*g.z('prix_base')+g.z('primes')-g.z('penalites'):null) ] },
    { t:'Résultats (calculés)', f:[ C('lait_total','Lait produit (livré et transformé)','litres','int',g=> (g.z('lait_livre')+g.z('lait_direct'))||null),
        C('lait_brebis','Lait par brebis présente','L/brebis','int',g=> dv(g.n('lait_total'),g.n('brebis_presentes'))),
        C('lait_brebis_traite','Lait par brebis traite','L/brebis','int',g=> dv(g.n('lait_total'),g.n('brebis_traites'))),
        C('tb_moy','Matière grasse moyenne','g/L','d1',g=> moyPond(g,'lait_mensuel','tb')), C('tp_moy','Matière protéique moyenne','g/L','d1',g=> moyPond(g,'lait_mensuel','tp')),
        C('lait_mensuel_total','Total des mois saisis','litres','int',g=> g.sum('lait_mensuel','litres')) ] }
   ],
   ctrl:[ g=> g.n('lait_mensuel_total')&&g.z('lait_livre')&&Math.abs(g.n('lait_mensuel_total')-g.z('lait_livre'))>0.03*g.z('lait_livre')? 'Le total des mois diffère de plus de 3 % du lait livré. Vérifiez les saisies.':null ] },

 { id:'four', t:'Fourrages et stocks', court:'Fourrages', intro:'Une carte par fourrage : combien, d\'où il vient, et surtout sa qualité. Une analyse en laboratoire donne les valeurs les plus fiables.',
   blocs:[
    { table:'fourrages' },
    { t:'Stocks et consommation', f:[ N('stock_debut','Stock de fourrages au début de la campagne','t MS',{d:1}), N('stock_fin','Stock de fourrages en fin de campagne','t MS',{d:1}),
        N('pertes_pct','Pertes estimées (refus, stockage)','%',{aide:'Facultatif. Non déduites des calculs ci-dessous, seulement indiquées dans le rapport.'}),
        C('ms_produit','Fourrages produits','t MS','d1',g=> g.sum('fourrages','ms_t',r=>r.origine!=='Acheté'&&r.type!=='Paille (litière)')),
        C('ms_achete','Fourrages achetés','t MS','d1',g=> g.sum('fourrages','ms_t',r=>r.origine==='Acheté'&&r.type!=='Paille (litière)')),
        C('ms_consomme','Fourrages consommés','t MS','d1',g=> (g.z('ms_produit')+g.z('ms_achete')+g.z('stock_debut')-g.z('stock_fin'))||null,{aide:'Produits + achetés + stock de début − stock de fin'}),
        C('fourrage_brebis','Fourrages consommés par brebis','kg MS','int',g=> dv(g.n('ms_consomme')*1000,g.n('brebis_presentes'))),
        C('autonomie_fourragere','Autonomie fourragère','%','pct',g=> dv(g.z('ms_produit')+g.z('stock_debut')-g.z('stock_fin'),g.n('ms_consomme'))),
        C('cout_fourrage_achete','Coût des fourrages achetés','€','eur',g=> g.sum('fourrages','valeur',r=>r.type!=='Paille (litière)')),
        C('litiere_achetee','Paille achetée (litière)','€','eur',g=> g.sum('fourrages','valeur',r=>r.type==='Paille (litière)')),
        C('qualite_ufl','Énergie moyenne des fourrages analysés','UFL/kg MS','d2',g=> moyPondMS(g,'ufl')),
        C('qualite_mat','Matière azotée moyenne des fourrages analysés','g/kg MS','int',g=> moyPondMS(g,'mat')) ] }
   ] },

 { id:'pat', t:'Pâturage et estive', court:'Pâturage', intro:'L\'herbe pâturée est une vraie part de l\'alimentation, mais elle est difficile à mesurer. Les quantités sont des estimations.',
   blocs:[
    { t:'Pâturage sur l\'exploitation', f:[ N('jours_pat_prin','Jours de pâturage au printemps','jours'), N('jours_pat_aut','Jours de pâturage en automne','jours'),
        N('ing_pat','Herbe pâturée estimée par brebis et par jour','kg MS',{d:2,aide:'Estimation : la méthode (hauteur d\'herbe, comparaison avec la ration) est à préciser par le centre.'}),
        S('mode_pat','Conduite du pâturage',['Tournant (parcelles changées souvent)','Libre ou sur grandes parcelles','Variable selon la saison']) ] },
    { t:'Estive', f:[ N('brebis_estive','Brebis montées en estive','brebis'), D('estive_debut','Montée en estive'), D('estive_fin','Descente d\'estive'),
        C('jours_estive','Durée de l\'estive','jours','int',g=> jours(g.d('estive_debut'),g.d('estive_fin'))),
        N('ing_estive','Herbe estimée par brebis et par jour','kg MS',{d:2}), S('estive_type','Type d\'estive',['Individuelle','Collective (commission syndicale…)','Mixte']),
        N('estive_redevance','Redevance et cotisations','€'), N('estive_gardiennage','Gardiennage et berger','€'), N('estive_transport','Transport','€'),
        S('traite_estive','Traite en estive',['Non','Oui (lait livré)','Oui (fromage d\'estive)']) ] },
    { t:'Résultat (estimation)', f:[ C('herbe_pat','Herbe pâturée par brebis (sur la campagne)','kg MS','int',g=> (g.z('jours_pat_prin')+g.z('jours_pat_aut'))*g.z('ing_pat')+g.z('jours_estive')*g.z('ing_estive')||null),
        C('cout_estive','Coût de l\'estive','€','eur',g=> (g.z('estive_redevance')+g.z('estive_gardiennage')+g.z('estive_transport'))||null) ] }
   ] },

 { id:'conc', t:'Concentrés et compléments', court:'Concentrés', intro:'Chaque aliment distribué, acheté ou produit sur la ferme. Les valeurs alimentaires servent à calculer les apports.',
   blocs:[
    { table:'concentres' },
    { t:'Totaux (calculés)', f:[
        C('conc_t','Concentrés distribués aux brebis et agneaux','t brutes','d1',g=> g.sum('concentres','qte',r=>!['Minéral et vitamines','Lait maternisé'].includes(r.cat))),
        C('conc_ms_t','Dont en matière sèche','t MS','d1',g=> g.sum('concentres','ms_kg',r=>!['Minéral et vitamines','Lait maternisé'].includes(r.cat))/1000),
        C('conc_kg_brebis','Concentrés par brebis présente','kg brut','int',g=> dv(g.n('conc_t')*1000,g.n('brebis_presentes'))),
        C('conc_ms_brebis','Concentrés par brebis présente (matière sèche)','kg MS','int',g=> dv(g.n('conc_ms_t')*1000,g.n('brebis_presentes')),{aide:'Le cahier des charges de l\'AOP limite les concentrés par brebis : à comparer à la version en vigueur.'}),
        C('conc_g_litre','Concentrés par litre de lait','g/L','int',g=> dv(g.n('conc_t')*1e6,g.n('lait_total'))),
        C('autonomie_conc','Autonomie en concentrés','%','pct',g=> dv(g.sum('concentres','qte',r=>r.origine==='Produit sur l\'exploitation'&&!['Minéral et vitamines','Lait maternisé'].includes(r.cat)),g.n('conc_t'))),
        C('cout_conc_achete','Coût des concentrés achetés','€','eur',g=> g.sum('concentres','valeur',r=>r.origine!=='Produit sur l\'exploitation'&&!['Minéral et vitamines','Lait maternisé'].includes(r.cat))),
        C('valeur_conc_produit','Valeur des concentrés produits','€','eur',g=> g.sum('concentres','valeur',r=>r.origine==='Produit sur l\'exploitation'&&!['Minéral et vitamines','Lait maternisé'].includes(r.cat))),
        C('cout_mineraux','Minéraux et lait maternisé','€','eur',g=> g.sum('concentres','valeur',r=>['Minéral et vitamines','Lait maternisé'].includes(r.cat))) ] }
   ],
   ctrl:[ g=> g.n('conc_ms_brebis')>150? 'Plus de 150 kg de matière sèche de concentrés par brebis : à comparer au plafond du cahier des charges AOP (valeur à confirmer).':null ] },

 { id:'rat', t:'Rations et couverture des besoins', court:'Rations', intro:'Pour chaque lot, ce que la brebis reçoit par jour comparé à ce qu\'elle doit recevoir. Les besoins se calculent avec INRAtion, Systali ou les tables INRAE : ils ne sont pas préremplis.',
   blocs:[
    { table:'rations' },
    { t:'Totaux (calculés)', f:[ C('rat_fourrage_t','Fourrages distribués d\'après les rations','t MS','d1',g=> ratFourrageT(g),{aide:'Effectif × jours × quantité. À comparer aux fourrages consommés du bilan.'}),
        C('rat_ecart','Écart avec les fourrages consommés','%','pct',g=> g.n('rat_fourrage_t')&&g.n('ms_consomme')? g.n('rat_fourrage_t')/g.n('ms_consomme')-1:null) ] }
   ],
   ctrl:[ g=> g.n('rat_ecart')!=null&&Math.abs(g.n('rat_ecart'))>0.2? 'Les rations donnent des fourrages très différents du bilan fourrager (plus de 20 %). Vérifiez les effectifs, les durées ou les quantités.':null ] },

 { id:'sant', t:'Santé du troupeau', court:'Santé', intro:'Les soins, les accidents sanitaires et la prévention.',
   blocs:[
    { t:'Événements de l\'année', f:[ N('avortements','Avortements','brebis'), N('mammites','Cas de mammites','brebis'), N('boiteries','Cas de boiteries','brebis'), N('diarrhees','Agneaux malades (diarrhées, etc.)','agneaux'),
        S('gds','Adhésion au GDS',OUINON), S('visite_sanitaire','Visite sanitaire d\'élevage réalisée',OUINON), S('vaccination','Plan de vaccination',['Aucun','Partiel','Complet']),
        S('parasitisme','Gestion du parasitisme',['Traitement systématique','Selon analyses de coproscopie','Autre']) ] },
    { table:'sante' },
    { t:'Total', f:[ C('cout_sante','Frais de santé','€','eur',g=> g.sum('sante','cout')||null), C('sante_brebis','Frais de santé par brebis','€/brebis','eur2',g=> dv(g.n('cout_sante'),g.n('brebis_presentes'))) ] }
   ] },

 { id:'gen', t:'Génétique et insémination', court:'Génétique', intro:'Insémination artificielle, choix des béliers et suivi génétique.',
   blocs:[
    { t:'Insémination artificielle', f:[ S('mode_repro','Mode de reproduction',['Monte naturelle','Insémination artificielle','Les deux']), N('femelles_ia','Femelles mises en insémination','têtes'), N('mb_ia','Femelles ayant mis bas après insémination','têtes'),
        N('doses','Doses utilisées','doses'), N('ia_agnelles_gardees','Agnelles gardées issues d\'insémination','agnelles'), S('synchro','Synchronisation des chaleurs',['Éponges et hormones','Sans hormones','Non concerné']) ] },
    { t:'Coûts', f:[ N('cout_semence','Semences','€'), N('cout_hormones','Éponges et hormones','€'), N('cout_inseminateur','Intervention de l\'inséminateur','€'), N('cout_beliers','Achat de béliers','€') ] },
    { t:'Suivi génétique', f:[ S('controle_laitier','Contrôle laitier',OUINON), N('cout_controle','Coût du contrôle laitier','€'), S('schema','Adhésion au schéma de sélection',OUINON), N('beliers_index','Béliers avec index connu','têtes') ] },
    { t:'Résultats (calculés)', f:[ C('part_ia','Part du troupeau inséminée','%','pct',g=> dv(g.n('femelles_ia'),g.z('femelles_repro')+g.z('agnelles_luttees'))),
        C('fertilite_ia','Fertilité après insémination','%','pct',g=> dv(g.n('mb_ia'),g.n('femelles_ia'))),
        C('cout_ia_total','Coût de l\'insémination','€','eur',g=> (g.z('cout_semence')+g.z('cout_hormones')+g.z('cout_inseminateur'))||null),
        C('cout_ia_femelle','Coût par femelle inséminée','€/femelle','eur2',g=> dv(g.n('cout_ia_total'),g.n('femelles_ia'))),
        C('cout_ia_mb','Coût par mise bas obtenue','€/mise bas','eur2',g=> dv(g.n('cout_ia_total'),g.n('mb_ia'))),
        C('part_renouv_ia','Part des agnelles de renouvellement issues d\'IA','%','pct',g=> dv(g.n('ia_agnelles_gardees'),g.n('agnelles_gardees'))) ] }
   ] },

 { id:'trav', t:'Travail et bâtiments', court:'Travail', intro:'Le temps de travail et les équipements. Le temps d\'astreinte est une estimation si aucun bilan de travail n\'a été fait.',
   blocs:[
    { t:'Temps de travail', f:[ N('h_traite','Temps de traite par jour (toutes personnes)','heures',{d:1}), N('h_alim','Temps d\'alimentation par jour','heures',{d:1}),
        N('h_astreinte_an','Travail d\'astreinte total sur l\'année (estimation)','heures',{aide:'Traite, alimentation, soins, agnelages : tout ce qui ne peut pas être reporté'}),
        N('h_saison','Travail de saison (foins, estive, tonte)','heures'),
        C('h_astreinte_brebis','Astreinte par brebis','heures','d1',g=> dv(g.n('h_astreinte_an'),g.n('brebis_presentes'))),
        C('brebis_umo','Brebis par unité de main-d\'œuvre','brebis/UMO','int',g=> dv(g.n('brebis_presentes'),g.n('umo_total'))),
        C('litres_umo','Litres de lait par unité de main-d\'œuvre','L/UMO','int',g=> dv(g.n('lait_total'),g.n('umo_total'))) ] },
    { t:'Bâtiments et équipement', f:[ N('surface_bergerie','Surface de la bergerie','m²'), S('traite_type','Mode de traite',['Traite à la main','Machine à traire (lactoduc)','Machine à traire (pots)','Salle de traite']), N('quais','Places de traite','places'),
        S('alim_meca','Distribution des aliments',['À la main','Mécanisée en partie','Mécanisée']), S('confort','Satisfaction de l\'éleveur sur son travail',['Très satisfaisant','Satisfaisant','Difficile','Très difficile']) ] }
   ] },

 { id:'eco', t:'Résultats économiques', court:'Économie', intro:'Tout en euros hors taxes, pour l\'atelier ovin. Les produits issus des autres modules se reportent tout seuls.',
   blocs:[
    { t:'Produits', f:[ C('produit_lait','Lait livré','€','eur',g=> g.n('produit_lait_livre')), N('produit_fermier','Fromages et produits fermiers vendus','€'), C('ventes_agn','Agneaux vendus','€','eur',g=> g.n('produit_agneaux')),
        N('ventes_reformes','Brebis de réforme et reproducteurs vendus','€'), N('laine','Laine','€'), N('autres_produits','Autres produits','€') ] },
    { table:'aides' },
    { t:'Total des produits', f:[ C('aides_total','Aides','€','eur',g=> g.sum('aides','montant')||null), C('produit_total','Produit brut total','€','eur',g=> (g.z('produit_lait')+g.z('produit_fermier')+g.z('ventes_agn')+g.z('ventes_reformes')+g.z('laine')+g.z('autres_produits')+g.z('aides_total'))||null) ] },
    { t:'Charges opérationnelles (liées au troupeau)', f:[ C('ch_alim','Alimentation achetée','€','eur',g=> (g.z('cout_fourrage_achete')+g.z('cout_conc_achete')+g.z('cout_mineraux'))||null,{aide:'Reprise des fourrages, concentrés et minéraux achetés'}),
        C('ch_veto','Frais de santé','€','eur',g=> g.n('cout_sante')), N('ch_elevage','Frais d\'élevage divers','€',{aide:'Produits de traite, analyses du lait, cotisations d\'élevage, tonte, identification…'}),
        C('ch_litiere','Litière achetée','€','eur',g=> g.n('litiere_achetee')), C('ch_ia','Insémination et génétique','€','eur',g=> (g.z('cout_ia_total')+g.z('cout_beliers')+g.z('cout_controle'))||null),
        C('ch_estive','Estive','€','eur',g=> g.n('cout_estive')), N('ch_surfaces','Charges de surfaces','€',{aide:'Semences, engrais, produits, travaux des champs'}),
        C('charges_oper','Total des charges opérationnelles','€','eur',g=> (g.z('ch_alim')+g.z('ch_veto')+g.z('ch_elevage')+g.z('ch_litiere')+g.z('ch_ia')+g.z('ch_estive')+g.z('ch_surfaces'))||null,{fort:true}),
        C('marge_brute','MARGE BRUTE','€','eur',g=> g.n('produit_total')!=null||g.n('charges_oper')!=null? g.z('produit_total')-g.z('charges_oper'):null,{fort:true}) ] },
    { t:'Charges de structure', f:[ N('ch_salaires','Salaires et cotisations des salariés','€'), N('ch_fermages','Fermages et impôts fonciers','€'), N('ch_meca','Carburant, entretien du matériel, travaux par tiers','€'),
        N('ch_energie','Eau, électricité, énergie','€'), N('ch_assurances','Assurances','€'), N('ch_gestion','Comptabilité et frais divers','€'),
        C('charges_structure','Total des charges de structure','€','eur',g=> (g.z('ch_salaires')+g.z('ch_fermages')+g.z('ch_meca')+g.z('ch_energie')+g.z('ch_assurances')+g.z('ch_gestion'))||null,{fort:true}),
        C('ebe','EXCÉDENT BRUT D\'EXPLOITATION (EBE)','€','eur',g=> g.n('marge_brute')!=null? g.z('marge_brute')-g.z('charges_structure'):null,{fort:true}) ] },
    { t:'Au-delà de l\'EBE', f:[ N('amortissements','Amortissements','€'), N('frais_financiers','Frais financiers (intérêts)','€'), N('annuites','Annuités (capital et intérêts remboursés)','€'),
        C('rcai','Résultat courant','€','eur',g=> g.n('ebe')!=null? g.z('ebe')-g.z('amortissements')-g.z('frais_financiers'):null),
        C('dispo','Disponible après annuités','€','eur',g=> g.n('ebe')!=null? g.z('ebe')-g.z('annuites'):null,{aide:'EBE moins annuités, avant cotisations sociales et prélèvements privés'}) ] },
    { t:'Coût de production du lait (méthode simplifiée)', intro:'Inspirée de l\'approche des Réseaux d\'élevage : toutes les charges, plus une rémunération du travail de l\'exploitant, des terres en propriété et des capitaux propres. Le centre doit valider ces paramètres.',
      f:[ N('smic','SMIC annuel brut de référence','€',{aide:'À saisir (valeur de la campagne). Non préremplie.'}), N('fermage_theo','Fermage de référence pour les terres en propriété','€/ha'),
        N('capitaux_propres','Capitaux propres engagés dans l\'atelier','€'), N('taux_cap','Taux de rémunération des capitaux propres','%',{d:1,def:1.5,aide:'Valeur de la méthode des cas-types, à confirmer par le centre'}),
        C('cout_production','Coût de production total','€','eur',g=> g.n('charges_oper')==null&&g.n('charges_structure')==null? null:
            g.z('charges_oper')+g.z('charges_structure')+g.z('amortissements')+g.z('frais_financiers')+g.z('umo_exploitant')*g.z('smic')+g.z('ha_propriete')*g.z('fermage_theo')+g.z('capitaux_propres')*g.z('taux_cap')/100),
        C('cout_1000l','Coût de production pour 1 000 litres','€/1000 L','eur',g=> dv(g.n('cout_production')*1000,g.n('lait_total'))),
        C('prix_revient','Prix de revient du lait pour 1 000 litres','€/1000 L','eur',g=> g.n('cout_production')==null? null: dv((g.n('cout_production')-g.z('aides_total')-g.z('ventes_agn')-g.z('ventes_reformes')-g.z('laine')-g.z('autres_produits'))*1000,g.n('lait_total')),{aide:'Coût de production moins aides et autres produits. Pour un fermier, préférer le coût de production complet.'}),
        C('remun_smic','Rémunération permise','SMIC/UMO','d2',g=> g.z('smic')>0&&g.z('umo_exploitant')>0&&g.n('produit_total')!=null? (g.z('produit_total')-(g.n('cout_production')-g.z('umo_exploitant')*g.z('smic')))/g.z('umo_exploitant')/g.z('smic'):null) ] },
    { t:'Indicateurs économiques (calculés)', f:[ C('produit_brebis','Produit brut par brebis','€/brebis','eur',g=> dv(g.n('produit_total'),g.n('brebis_presentes'))),
        C('produit_lait_brebis','Produit du lait par brebis','€/brebis','eur',g=> dv(g.n('produit_lait'),g.n('brebis_presentes'))),
        C('produit_agn_brebis','Produit des agneaux par brebis','€/brebis','eur',g=> dv(g.n('ventes_agn'),g.n('brebis_presentes'))),
        C('cout_alim_brebis','Coût alimentaire par brebis','€/brebis','eur',g=> dv(g.n('ch_alim'),g.n('brebis_presentes'))),
        C('cout_alim_1000l','Coût alimentaire pour 1 000 litres','€/1000 L','eur',g=> dv(g.n('ch_alim')*1000,g.n('lait_total'))),
        C('mca_brebis','Marge sur coût alimentaire par brebis','€/brebis','eur',g=> g.n('produit_lait')==null&&g.n('ventes_agn')==null? null: dv(g.z('produit_lait')+g.z('ventes_agn')-g.z('cout_conc_achete')-g.z('valeur_conc_produit')-g.z('cout_fourrage_achete'),g.n('brebis_presentes')),{aide:'Produit du lait + agneaux − concentrés (achetés et produits) − fourrages achetés, par brebis'}),
        C('marge_brute_brebis','Marge brute par brebis','€/brebis','eur',g=> dv(g.n('marge_brute'),g.n('brebis_presentes'))),
        C('ebe_brebis','EBE par brebis','€/brebis','eur',g=> dv(g.n('ebe'),g.n('brebis_presentes'))),
        C('ebe_uth','EBE par unité de main-d\'œuvre','€/UMO','eur',g=> dv(g.n('ebe'),g.n('umo_total'))),
        C('taux_ebe','EBE sur produit brut','%','pct',g=> dv(g.n('ebe'),g.n('produit_total'))),
        C('part_aides','Part des aides dans le produit','%','pct',g=> dv(g.n('aides_total'),g.n('produit_total'))),
        C('part_annuites','Annuités sur produit brut','%','pct',g=> dv(g.n('annuites'),g.n('produit_total'))) ] }
   ],
   ctrl:[ g=> g.n('produit_total')&&g.n('charges_oper')&&g.n('marge_brute')<0? 'La marge brute est négative. Vérifiez les produits et les charges saisis.':null ] }
];

/* Le coefficient UGB est un paramètre global : on le place dans la fiche Surfaces pour qu'il soit modifiable. */
MODULES.find(m=>m.id==='surf').blocs[0].f.push(N('coef_ugb','Équivalent UGB d\'une brebis','UGB',{d:2,def:0.15,aide:'Valeur usuelle proposée, à confirmer par le centre'}));
MODULES.find(m=>m.id==='surf').blocs[0].f.push(C('chargement','Chargement','UGB/ha','d2',g=> dv(g.z('brebis_presentes')*(g.n('coef_ugb')||0.15)+g.z('ugb_autres'),g.n('sfp'))));
MODULES.find(m=>m.id==='four').blocs[1].f.push(
  C('rdt_fourrage','Rendement des fourrages récoltés','t MS/ha','d1',g=> dv(g.n('ms_produit'),g.sum('fourrages','ha',r=>r.origine!=='Acheté'&&r.type!=='Paille (litière)'))),
  C('ms_totale','Matière sèche totale consommée par brebis','kg MS','int',g=> { const nb=g.n('brebis_presentes'); if(!nb) return null; const t=(g.z('ms_consomme')*1000+g.z('conc_ms_t')*1000)/nb+g.z('herbe_pat'); return t>0?t:null; }),
  C('autonomie_alim','Autonomie alimentaire (matière sèche)','%','pct',g=> { const nb=g.n('brebis_presentes'); if(!nb||!g.n('ms_totale')) return null;
      const prod=(g.z('ms_produit')+g.z('stock_debut')-g.z('stock_fin'))*1000/nb+g.z('herbe_pat')+g.sum('concentres','ms_kg',r=>r.origine==='Produit sur l\'exploitation'&&!['Minéral et vitamines','Lait maternisé'].includes(r.cat))/nb; return prod/g.n('ms_totale'); },{aide:'Matière sèche produite sur l\'exploitation (fourrages, herbe, concentrés produits) ÷ matière sèche totale consommée'}),
  C('part_conc_ms','Part des concentrés dans la matière sèche','%','pct',g=> { const nb=g.n('brebis_presentes'); return nb&&g.n('ms_totale')? dv(g.z('conc_ms_t')*1000/nb,g.n('ms_totale')):null; }),
  C('lait_ha','Lait par hectare de surface fourragère','L/ha','int',g=> dv(g.n('lait_total'),g.n('sfp')))
);
function ratFourrageT(g){ let t=0, any=false; g.rows('rations').forEach(r=>{ const s=num(r.f1kg)+num(r.f2kg); if(s&&num(r.eff)&&num(r.jours)){ t+=s*num(r.eff)*num(r.jours)/1000; any=true; } }); return any?t:null; }
function moyPond(g,t,c){ let s=0,w=0; g.rows(t).forEach(r=>{ const l=num(r.litres), v=num(r[c]); if(l&&v){ s+=l*v; w+=l; } }); return w? s/w:null; }
function moyPondMS(g,c){ let s=0,w=0; g.rows('fourrages').forEach(r=>{ if(r.type==='Paille (litière)') return; const q=num(r.qte)*pm(r.ms)/100, v=num(r[c]); if(q&&v){ s+=q*v; w+=q; } }); return w? s/w:null; }

/* ---------- Indicateurs du bilan et références ----------
   sens : H = plus haut vaut mieux, B = plus bas vaut mieux, I = pour information
   ref  : valeur de comparaison. Seules celles qui ont une source sont préremplies. */
const INDICATEURS = [
 {k:'fertilite',v:'Technique',l:'Fertilité',u:'%',fmt:'pct',sens:'H',tol:.03,def:'Part des femelles mises à la reproduction qui ont mis bas.'},
 {k:'prolificite',v:'Technique',l:'Prolificité',u:'agneaux/mise bas',fmt:'d2',sens:'H',tol:.03,def:'Nombre moyen d\'agneaux nés par brebis qui a agnelé.'},
 {k:'productivite',v:'Technique',l:'Productivité numérique',u:'agneaux/femelle',fmt:'d2',sens:'H',tol:.05,def:'Agneaux sevrés pour chaque femelle mise à la reproduction.'},
 {k:'mortalite_agneaux',v:'Technique',l:'Mortalité des agneaux',u:'%',fmt:'pct',sens:'B',tol:.1,def:'Part des agneaux nés qui n\'arrivent pas au sevrage.'},
 {k:'mortalite_adultes',v:'Technique',l:'Mortalité des adultes',u:'%',fmt:'pct',sens:'B',tol:.1,def:'Part des brebis présentes mortes dans l\'année.'},
 {k:'taux_renouv',v:'Technique',l:'Taux de renouvellement',u:'%',fmt:'pct',sens:'I',tol:.05,def:'Part du troupeau remplacée par de jeunes brebis.'},
 {k:'lait_brebis',v:'Lait',l:'Lait par brebis présente',u:'L/brebis',fmt:'int',sens:'I',tol:.05,def:'Litres produits rapportés à une brebis présente.',ref:136,src:'Référentiel travail ovin lait (Institut de l\'Élevage, 2011), 62 bilans Roquefort et Pyrénées-Atlantiques : valeur ancienne, à actualiser.'},
 {k:'lait_ha',v:'Lait',l:'Lait par hectare fourrager',u:'L/ha',fmt:'int',sens:'I',tol:.05,def:'Litres produits par hectare de surface fourragère.',ref:1737,src:'Appui technique Pyrénées-Atlantiques, échantillon 2003 (Morin et al., CIHEAM) : valeur ancienne.'},
 {k:'tb_moy',v:'Lait',l:'Matière grasse moyenne',u:'g/L',fmt:'d1',sens:'I',tol:.05,def:'Moyenne pondérée par les volumes.'},
 {k:'tp_moy',v:'Lait',l:'Matière protéique moyenne',u:'g/L',fmt:'d1',sens:'I',tol:.05,def:'Moyenne pondérée par les volumes.'},
 {k:'jours_traite',v:'Lait',l:'Durée de traite',u:'jours',fmt:'int',sens:'I',tol:.05,def:'Du premier au dernier jour de traite.',ref:265,src:'Plafond de la période de traite cité pour l\'AOP Ossau-Iraty (Réussir Pâtre) : à vérifier dans le cahier des charges en vigueur.'},
 {k:'fourrage_brebis',v:'Alimentation',l:'Fourrages consommés par brebis',u:'kg MS',fmt:'int',sens:'I',tol:.1,def:'Matière sèche de fourrages par brebis présente.'},
 {k:'autonomie_fourragere',v:'Alimentation',l:'Autonomie fourragère',u:'%',fmt:'pct',sens:'H',tol:.05,def:'Part des fourrages qui vient de l\'exploitation.'},
 {k:'conc_kg_brebis',v:'Alimentation',l:'Concentrés par brebis',u:'kg brut',fmt:'int',sens:'B',tol:.08,def:'Concentrés distribués rapportés à une brebis présente.'},
 {k:'conc_ms_brebis',v:'Alimentation',l:'Concentrés par brebis (matière sèche)',u:'kg MS',fmt:'int',sens:'B',tol:.05,def:'À comparer au plafond de l\'AOP.',ref:150,src:'Plafond annoncé dans le plan national d\'orientation AOP Ossau-Iraty (INAO, version 2015) : à vérifier dans le cahier des charges en vigueur.'},
 {k:'conc_g_litre',v:'Alimentation',l:'Concentrés par litre de lait',u:'g/L',fmt:'int',sens:'B',tol:.08,def:'Grammes de concentrés pour produire un litre.'},
 {k:'autonomie_conc',v:'Alimentation',l:'Autonomie en concentrés',u:'%',fmt:'pct',sens:'H',tol:.05,def:'Part des concentrés produits sur l\'exploitation.'},
 {k:'autonomie_alim',v:'Alimentation',l:'Autonomie alimentaire (matière sèche)',u:'%',fmt:'pct',sens:'H',tol:.05,def:'Part de la matière sèche consommée qui est produite sur l\'exploitation.'},
 {k:'qualite_ufl',v:'Alimentation',l:'Énergie moyenne des fourrages',u:'UFL/kg MS',fmt:'d2',sens:'H',tol:.05,def:'Moyenne des fourrages analysés, pondérée par les quantités.'},
 {k:'cout_alim_brebis',v:'Alimentation',l:'Coût alimentaire par brebis',u:'€/brebis',fmt:'eur',sens:'B',tol:.05,def:'Dépense d\'alimentation achetée pour une brebis.'},
 {k:'cout_alim_1000l',v:'Alimentation',l:'Coût alimentaire pour 1 000 L',u:'€/1000 L',fmt:'eur',sens:'B',tol:.05,def:'Dépense d\'alimentation achetée pour 1 000 litres.'},
 {k:'chargement',v:'Alimentation',l:'Chargement',u:'UGB/ha',fmt:'d2',sens:'I',tol:.05,def:'Animaux (en UGB) par hectare fourrager.',ref:1.93,src:'Appui technique Pyrénées-Atlantiques, échantillon 2003 (Morin et al., CIHEAM) : valeur ancienne.'},
 {k:'part_ia',v:'Génétique',l:'Part du troupeau inséminée',u:'%',fmt:'pct',sens:'I',tol:.05,def:'Part des femelles mises à la reproduction qui ont été inséminées.'},
 {k:'fertilite_ia',v:'Génétique',l:'Fertilité après insémination',u:'%',fmt:'pct',sens:'H',tol:.05,def:'Part des femelles inséminées qui ont mis bas.'},
 {k:'cout_ia_femelle',v:'Génétique',l:'Coût par femelle inséminée',u:'€/femelle',fmt:'eur2',sens:'B',tol:.05,def:'Semences, hormones et inséminateur.'},
 {k:'h_astreinte_brebis',v:'Travail',l:'Astreinte par brebis',u:'heures',fmt:'d1',sens:'B',tol:.1,def:'Heures d\'astreinte par brebis et par an.'},
 {k:'brebis_umo',v:'Travail',l:'Brebis par unité de main-d\'œuvre',u:'brebis/UMO',fmt:'int',sens:'H',tol:.05,def:'Taille du troupeau pour une personne à plein temps.'},
 {k:'produit_brebis',v:'Économie',l:'Produit brut par brebis',u:'€/brebis',fmt:'eur',sens:'H',tol:.05,def:'Tout ce que rapporte une brebis dans l\'année.'},
 {k:'mca_brebis',v:'Économie',l:'Marge sur coût alimentaire par brebis',u:'€/brebis',fmt:'eur',sens:'I',tol:.05,def:'Lait + agneaux moins le coût de l\'alimentation, par brebis.',ref:123,src:'Appui technique Pyrénées-Atlantiques, échantillon 2003 (Morin et al., CIHEAM) : valeur très ancienne, à actualiser.'},
 {k:'marge_brute_brebis',v:'Économie',l:'Marge brute par brebis',u:'€/brebis',fmt:'eur',sens:'H',tol:.05,def:'Ce qui reste après les charges liées au troupeau.'},
 {k:'ebe_brebis',v:'Économie',l:'EBE par brebis',u:'€/brebis',fmt:'eur',sens:'H',tol:.05,def:'Ce qui reste après toutes les charges courantes.'},
 {k:'ebe_uth',v:'Économie',l:'EBE par unité de main-d\'œuvre',u:'€/UMO',fmt:'eur',sens:'H',tol:.05,def:'Ce qui reste pour rémunérer le travail et rembourser les emprunts.'},
 {k:'taux_ebe',v:'Économie',l:'EBE sur produit brut',u:'%',fmt:'pct',sens:'H',tol:.05,def:'Part du produit qui reste après les charges courantes.'},
 {k:'part_aides',v:'Économie',l:'Part des aides dans le produit',u:'%',fmt:'pct',sens:'I',tol:.05,def:'Dépendance de l\'exploitation aux aides.'},
 {k:'cout_1000l',v:'Économie',l:'Coût de production pour 1 000 L',u:'€/1000 L',fmt:'eur',sens:'I',tol:.05,def:'Toutes charges et rémunérations comprises.',ref:2508,src:'Idele, Inosys Réseaux d\'élevage : 2 508 €/1000 L en 2022 dans les Pyrénées-Atlantiques (Réussir Pâtre). Valeur de 2022, sensible à l\'année et au champ de calcul.'},
 {k:'prix_revient',v:'Économie',l:'Prix de revient du lait pour 1 000 L',u:'€/1000 L',fmt:'eur',sens:'B',tol:.05,def:'Coût de production moins aides et autres produits.'},
 {k:'remun_smic',v:'Économie',l:'Rémunération permise',u:'SMIC/UMO',fmt:'d2',sens:'I',tol:.05,def:'Revenu du travail de l\'exploitant en multiples du SMIC.',ref:0.7,src:'Estimation 2024 pour les Pyrénées-Atlantiques (Idele, Réussir Pâtre). Estimation, non comparable sans mêmes règles de calcul.'}
];

const MOD_BILAN_VOLETS = ['Technique','Lait','Alimentation','Génétique','Travail','Économie'];
