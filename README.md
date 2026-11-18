# Bilans technico-économiques ovins lait

Application de saisie et de bilan pour les élevages de brebis laitières (Pyrénées-Atlantiques), conçue pour le Centre ovin d'Ordiarp.

- **Un seul fichier HTML** : CSS, JavaScript et polices intégrés. Aucune dépendance, aucun serveur.
- **Fonctionne sans connexion** : les dossiers sont enregistrés dans le navigateur (`localStorage`), avec export et import en JSON ou CSV.
- **Saisie** : troupeau, agneaux, lait, fourrages (quantité, qualité, analyses), concentrés, rations, pâturage et estive, santé, génétique, travail, économie.
- **Bilan imprimable** (impression du navigateur → PDF) : indicateurs, graphiques, problématiques relevées et pistes de solution.

## Utiliser

Ouvrir `dist/bilans-ovins-ordiarp.html` dans un navigateur. Un dossier fictif est fourni dans `exemples/exemple_dossier.json` (à importer depuis la liste des dossiers), avec le rapport correspondant.

## Construire

```bash
python3 build.py        # produit dist/bilans-ovins-ordiarp.html
```

Python 3 suffit, sans bibliothèque supplémentaire.

## Organisation

| Fichier | Rôle |
|---|---|
| `src/modele.js` | Données : modules, tableaux, indicateurs et formules de calcul |
| `src/app.js` | Interface, enregistrement, import et export |
| `src/diag.js` | Règles de diagnostic, pistes de solution et sources |
| `src/rapport.js` | Graphiques et mise en page du bilan |
| `src/start.js` | Démarrage |
| `src/style.css` | Charte graphique (vert forêt, ocre, blanc cassé) |
| `fonts/` | Polices Inter et Source Serif 4 (licence SIL OFL 1.1) |
| `tests/` | Tests de bout en bout (Playwright) |

L'ordre d'assemblage dans `build.py` compte : le code est concaténé en un seul script.

## Tester

```bash
pip install playwright && playwright install chromium
python3 tests/test_complet.py    # à lancer depuis la racine du dépôt
python3 tests/test_saisie.py
```

## Honnêteté des chiffres

- Les **besoins des animaux** ne sont pas préremplis : à saisir depuis INRAtion, Systali ou les tables INRAE.
- Les **références** ne sont préremplies que lorsqu'elles sont sourcées ; certaines sont anciennes (2003, 2011, 2015, 2022) et marquées d'une étoile : ordre de grandeur, pas norme.
- Chaque **piste de solution** porte une étiquette : *Source citée* (publication consultée, lien dans `src/diag.js`) ou *Repère de terrain* (pratique courante, à valider par le centre).
- Les règles liées à l'**AOP Ossau-Iraty** s'appuient sur un texte de 2015 : à vérifier dans le cahier des charges en vigueur.
- Les seuils de couverture des besoins (95 % et 115 %) sont indicatifs.
- Le **dossier d'exemple** contient des chiffres fictifs.

## Licence

À choisir par le propriétaire du dépôt (aucune licence n'est ajoutée par défaut).
