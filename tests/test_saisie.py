from playwright.sync_api import sync_playwright
import pathlib
URL=pathlib.Path(__file__).resolve().parents[1].joinpath('dist','bilans-ovins-ordiarp.html').as_uri()
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844}); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.click('#nouv')
    pg.fill('input[data-k="nom_exploitation"]','Ferme Test')
    pg.click('[data-mod="2"]')                       # Troupeau
    pg.fill('input[data-k="femelles_repro"]','200'); pg.fill('input[data-k="mb_adultes"]','180'); pg.fill('input[data-k="nes_total"]','250')
    print('fertilité:',pg.inner_text('[data-calc="fertilite"]'),'prolificité:',pg.inner_text('[data-calc="prolificite"]'))
    pg.fill('input[data-k="mb_adultes"]','999'); print('alerte:',pg.inner_text('#alertes'))
    pg.click('[data-mod="5"]'); pg.click('[data-add="fourrages"]')
    pg.fill('input[data-c="qte"]','50'); pg.fill('input[data-c="ms"]','86,5')   # virgule décimale
    print('MS t (saisie avec virgule):',pg.inner_text('[data-rc^="fourrages|0|ms_t"]'))
    pg.click('[data-mod="7"]'); pg.click('[data-add="concentres"]'); print('MS par défaut concentré:',pg.input_value('input[data-c="ms"]'))
    pg.wait_for_timeout(600)
    pg.reload(); pg.wait_for_selector('.expc'); print('après rechargement:',pg.inner_text('.expc h3'), '|', pg.inner_text('.expc small'))
    # export/import aller-retour
    data=pg.evaluate('()=>JSON.stringify({version:1,exps:DB.exps,refs:DB.refs})')
    pg.evaluate('()=>{DB.exps=[];sauver();render()}'); print('vide:',pg.locator('.expc').count())
    pg.set_input_files('#imp',files=[{'name':'x.json','mimeType':'application/json','buffer':data.encode()}])
    pg.once('dialog',lambda d:(print('dialogue:',d.message),d.accept()))
    pg.wait_for_timeout(600); print('importé:',pg.locator('.expc').count())
    b.close()
print('erreurs JS:',errs)
