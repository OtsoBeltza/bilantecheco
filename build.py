"""Assemble l'application en un seul fichier HTML (CSS, JavaScript et polices intégrés).
Usage : python3 build.py   ->   dist/bilans-ovins-ordiarp.html
"""
import base64, pathlib
R = pathlib.Path(__file__).resolve().parent
SRC, FONTS = R/'src', R/'fonts'
POLICES = [('Inter',400,'inter-latin-400-normal.woff2'),('Inter',600,'inter-latin-600-normal.woff2'),
           ('Source Serif 4',400,'source-serif-4-latin-400-normal.woff2'),
           ('Source Serif 4',600,'source-serif-4-latin-600-normal.woff2'),
           ('Source Serif 4',700,'source-serif-4-latin-700-normal.woff2')]
css = ''.join(f"@font-face{{font-family:'{n}';font-weight:{w};font-display:swap;"
              f"src:url(data:font/woff2;base64,{base64.b64encode((FONTS/f).read_bytes()).decode()}) format('woff2')}}\n"
              for n, w, f in POLICES)
css += (SRC/'style.css').read_text(encoding='utf-8')
# L'ordre compte : le modèle, puis l'interface, le diagnostic, le rapport, le démarrage.
js = "\n".join((SRC/n).read_text(encoding='utf-8').replace("'use strict';", "", 1)
               for n in ['modele.js','app.js','diag.js','rapport.js','start.js'])
html = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Bilans technico-économiques ovins · Centre ovin d'Ordiarp</title><meta name="theme-color" content="#1F3D2B">
<style>{css}</style></head><body><div id="app"></div>
<noscript>Cette application a besoin de JavaScript.</noscript>
<script>'use strict';
{js}
</script></body></html>'''
out = R/'dist'/'bilans-ovins-ordiarp.html'
out.parent.mkdir(exist_ok=True); out.write_text(html, encoding='utf-8')
print(out, round(len(html)/1024), 'Ko')
