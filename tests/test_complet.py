import json, sys
from playwright.sync_api import sync_playwright
import pathlib
URL=pathlib.Path(__file__).resolve().parents[1].joinpath('dist','bilans-ovins-ordiarp.html').as_uri()
F=dict(nom_exploitation='Ferme exemple (chiffres fictifs)',eleveur='Éleveur fictif',commune='Pays basque',campagne='2025-2026',technicien='Pierot Charles',date_bilan='2026-11-16',race='Manech tête rousse',valorisation='Livreur (laiterie)',aop='Oui',
 sau=60,ha_propriete=20,umo_exploitant=1.5,umo_salarie=0.3, brebis_presentes=300,femelles_repro=260,agnelles_luttees=70,beliers=14,lutte_debut='2025-07-10',lutte_fin='2025-08-25',agnelage_debut='2025-12-05',agnelage_fin='2026-01-30',
 mb_adultes=240,mb_agnelles=55,nes_total=400,nes_morts=14,reformes=55,morts_adultes=12,morts_sevrage=26,agnelles_gardees=70,agneaux_autoconso=5,
 traite_debut='2026-02-01',traite_fin='2026-07-20',brebis_traites=270,lait_livre=40000,prix_base=1300,primes=1800,penalites=200,
 stock_debut=20,stock_fin=18,jours_pat_prin=60,jours_pat_aut=40,ing_pat=0.9,brebis_estive=250,estive_debut='2026-06-10',estive_fin='2026-09-20',ing_estive=1.2,estive_redevance=1500,estive_gardiennage=2500,
 femelles_ia=150,mb_ia=100,ia_agnelles_gardees=30,cout_semence=1800,cout_hormones=1350,cout_inseminateur=1500,h_astreinte_an=1900,
 produit_fermier=0,ventes_reformes=3600,laine=300,autres_produits=500,ch_elevage=3800,ch_surfaces=2400,ch_salaires=9000,ch_fermages=2800,ch_meca=5500,ch_energie=1800,ch_assurances=1500,ch_gestion=2200,amortissements=6500,frais_financiers=1800,annuites=9000,smic=21000,fermage_theo=150,capitaux_propres=80000,
 com_forts='Bonne fertilité.',com_vigilance='Concentrés élevés.',com_conseils='Analyser les foins.')
T=dict(surfaces=[dict(nom='Prairies de fauche',usage='Prairie naturelle fauchée',ha=25,coupes=2,azote=40),dict(nom='Parcours',usage='Prairie naturelle pâturée',ha=30,coupes=0)],
 ventes_agneaux=[dict(categorie='Agneau de lait (léger)',nb=300,poids=10,prix=65)],
 lait_mensuel=[{} for _ in range(12)],
 fourrages=[dict(nom='Foin 1re coupe',type='Foin de prairie (1re coupe)',origine="Produit sur l'exploitation",ha=25,qte=70,ms=86,stade='Normal',qualite='Bonne',mat=110,ufl=0.62,pdie=75,pdin=70,uel=1.1),
            dict(nom='Regain',type='Regain',origine="Produit sur l'exploitation",ha=25,qte=25,ms=85,mat=140,ufl=0.68,pdie=82,pdin=88),
            dict(nom='Luzerne achetée',type='Foin de luzerne ou légumineuses',origine='Acheté',qte=12,ms=88,prix=220,mat=170,ufl=0.65,pdie=95,pdin=110),
            dict(nom='Paille',type='Paille (litière)',origine='Acheté',qte=10,ms=88,prix=90)],
 concentres=[dict(nom='Granulé 18',cat='Aliment composé (granulé)',origine='Acheté',qte=30,ms=88,prix=420,dest='Brebis en lactation',ufl=1.0,pdi=130),
             dict(nom='Orge',cat='Céréale (orge, maïs, blé…)',origine="Produit sur l'exploitation",qte=8,ms=87,prix=200,ufl=1.15,pdi=95),
             dict(nom='CMV',cat='Minéral et vitamines',origine='Acheté',qte=1.5,ms=95,prix=900)],
 rations=[dict(nom='Lactation hiver',stade='Pleine lactation',eff=270,jours=120,prod=1.2,f1='Foin 1re coupe',f1kg=1.0,f2='Regain',f2kg=0.4,c1='Granulé 18',c1kg=0.45,bufl=1.4,bpdi=140),dict(nom='Fin de gestation',stade='Fin de gestation',eff=290,jours=45,f1='Foin 1re coupe',f1kg=1.1,c1='Orge',c1kg=0.15,bufl=1.15,bpdi=110)],
 sante=[dict(poste='Médicaments et soins',nb=300,cout=2800),dict(poste='Visites et interventions du vétérinaire',cout=1400)],
 aides=[dict(nature='Aide ovine',montant=9000),dict(nature='ICHN',montant=7000)])
L=[2500,5200,6500,5400,4800,4500,3800,3600,2700,1500,0,0]
for i,v in enumerate(L): T['lait_mensuel'][i]=dict(litres=v,tb=70+i,tp=55,cell=900,germes=20)
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':390,'height':844})
    pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#nouv'); pg.screenshot(path='t_home.png')
    pg.click('#nouv'); pg.wait_for_selector('input[data-k="nom_exploitation"]')
    pg.fill('input[data-k="nom_exploitation"]','Ferme Etchegaray')   # saisie réelle
    pg.screenshot(path='t_expl.png')
    pg.evaluate('([f,t])=>{Object.assign(cur.f,f);cur.t=t;sauver();render();}',[F,T])
    res={}
    for i,m in enumerate(['expl','surf','tro','agn','lait','four','pat','conc','rat','sant','gen','trav','eco','obs']):
        pg.evaluate('i=>{vue.mod=i;render();}',i)
        pg.screenshot(path=f't_mod_{i:02d}.png',full_page=False)
        res[m]=pg.evaluate('()=>[...document.querySelectorAll("[data-calc]")].map(e=>e.dataset.calc+"="+e.textContent)')
        al=pg.evaluate('()=>[...document.querySelectorAll("#alertes .alerte")].map(e=>e.textContent)')
        if al: res[m+'_alertes']=al
    pg.evaluate('()=>{go("bilan")}'); pg.wait_for_selector('.rapport'); pg.screenshot(path='t_bilan.png',full_page=True)
    pg.emulate_media(media='print'); pg.pdf(path='t_bilan.pdf',format='A4',print_background=True)
    open('exemples/exemple_dossier.json','w',encoding='utf-8').write(pg.evaluate('()=>JSON.stringify({version:1,exps:DB.exps,refs:{}},null,1)'))
    n=pg.evaluate('()=>({ind:INDICATEURS.length,nonnul:INDICATEURS.filter(i=>makeG(cur).n(i.k)!=null).map(i=>i.k)})')
    res['_indic']=n
    b.close()
json.dump(res,open('t_res.json','w'),ensure_ascii=False,indent=1)
print('ERREURS:',errs)
for k,v in res.items(): print(k, v if not isinstance(v,list) else '; '.join(v)[:900])
