# Site statique Finanssia

## Modifier le contenu

Le contenu est directement dans les pages HTML.

- Accueil : `index.html`
- Présentation du conseiller : `votre-conseiller/index.html`
- Accompagnement et publics : `services/`, `demarche/`
- Guides : `guides/` et ses sous-dossiers
- Avis et questions fréquentes : `avis-clients/`, `faq/`
- Contact et rendez-vous : `contact/`, `prendre-rendez-vous/`
- Informations professionnelles : `mentions-legales/`

Les coordonnées de contact sont affichées dans les pages. La prise de rendez-vous utilise Calendly.

## Styles et navigation

- `assets/css/` : styles partagés
- `assets/js/navigation.js` : menu mobile, fermeture avec Échap et gestion du focus
- `assets/img/optimized/` : variantes WebP adaptées à la taille d’affichage

Les images originales sont conservées dans `assets/img/`. Les attributs `srcset`, `sizes`, `width` et `height` doivent correspondre aux variantes utilisées.

Le menu conserve ses liens visibles lorsque JavaScript est désactivé.

## Vérifier le référencement

Depuis la racine du site :

```sh
node scripts/seo-check.js
```

Ce contrôle utilise uniquement Node.js et les fichiers locaux. Il vérifie les titres et descriptions uniques, les URL canoniques, les H1, les données structurées, les liens locaux, les dimensions des images et la couverture du sitemap.

Lors de l’ajout d’une page, mettre à jour `sitemap.xml` et les liens internes. Les fichiers `robots.txt` et `sitemap.xml` utilisent le domaine canonique `https://www.finanssia.com/`.

## Informations à maintenir

Les qualifications et la rémunération présentées sur l’accueil, la page du conseiller et les guides proviennent des informations déjà publiées dans les mentions légales et la FAQ. Les changements professionnels doivent être répercutés dans ces pages et leurs données structurées.

Les sept guides ont fait l’objet d’une révision de fond le 19 septembre 2026. La date visible et le champ dateModified décrivent cette modification éditoriale, sans prétendre à une validation personnelle du conseiller. Les dates de publication initiale restent inconnues et ne sont pas inventées.

Les sources officielles sont liées au fil du texte et listées en fin de guide ; les mêmes références figurent dans Article.citation. La méthode éditoriale est présentée sur guides/#methode-editoriale. Les exemples sont fictifs et exposent leurs hypothèses, exclusions et limites.

Pour une mise à jour : vérifier la règle sur la source officielle, adapter le texte et les exemples concernés, puis modifier la date uniquement si le fond évolue. Les points fiscaux et réglementaires, les modalités de rémunération et les qualifications doivent être confirmés par le responsable du cabinet avant publication ; la présente révision ne crée ni nouveau diplôme, ni historique professionnel, ni résultat client.

Le contenu local ne permet pas de vérifier les positions dans Google, les liens entrants ou les performances des visiteurs.
