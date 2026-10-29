# Warp Cash — site web

Site du warp Cash sur VikingCraft FR (`/warp cash`, `/warp cash_ferme`).
Les prix, stocks, profils et classements viennent en direct de l'API `api.vikingcraft.fr` :
rien à mettre à jour à la main quand vous changez un shop en jeu.

## Ce qu'il y a dans le dossier

| Fichier | À quoi il sert |
|---|---|
| `index.html`, `prix/`, `zones/`, `carte/`, `equipe/`, `classements/`, `guide/`, `gestion/` | Les pages (générées, ne pas modifier à la main) |
| `outils/pages/` | Le contenu de chaque page |
| `outils/construire.py` | Fabrique les pages : menu, en-tête, pied de page, sitemap |
| `css/style.css` | Le design |
| `js/config.js` | **Le fichier à modifier au quotidien** : textes des zones, Discord, skins |
| `data/items.json` | Catégories, notes et promos des items (modifiables depuis l'Espace équipe) |
| `js/app.js` | La logique (API, panier, coordonnées, classements…) |
| `img/zones/` | Les screenshots de la visite |
| `img/skins/` | Les skins des fondateurs (PNG 64×64) |

## Modifier le contenu

Tout se passe dans `js/config.js` :

- **Zones** : changez `titre` et `texte`. Pour ajouter une zone, mettez l'image dans `img/zones/` et ajoutez un bloc dans `zones`.
- **Discord** : collez le lien d'invitation dans `discord`.
- **Pseudos Discord** : `discordPseudos` (boutons « copier » sur les pages Équipe, Guide et Mentions ; on ne contacte pas l'équipe en jeu).
- **Mail de contact** : `email` (affiché sur la page Équipe et dans les mentions légales).
- **Skins** : mettez le fichier PNG du skin dans `img/skins/` et indiquez son chemin dans `skin`.
  Le site dessine le personnage et la tête à partir de ce fichier.
- **Secteurs** : renommez « Secteur principal » / « Secteur est » comme vous voulez.

## Thèmes de saison

Le site change de thème tout seul, chaque année (fichier `js/theme.js`) :

- **Halloween** du 1er au 31 octobre : orange et violet, citrouilles, toiles d'araignée, chauves-souris ;
- **Noël** du 1er novembre au 1er janvier inclus : rouge et vert, neige qui tombe, guirlande, lanternes ;
- le reste de l'année : thème classique.

Les visiteurs peuvent couper le thème avec le bouton 🎃 / 🎄 en bas à gauche (coupé seulement tant que l'onglet reste ouvert).
L'animation est coupée d'office pour ceux qui ont demandé moins d'animations dans leur système.
Pour voir un thème hors saison : ajouter `?theme=halloween`, `?theme=noel` ou `?theme=classique` à l'adresse.

## Tester sur son PC

Dans ce dossier :

```bash
python -m http.server 8765
```

puis ouvrez http://localhost:8765.

## En ligne

Le site est publié sur **https://warpcashvk.github.io** (GitHub Pages, dépôt `warpcashvk/warpcashvk.github.io`).
Chaque modification envoyée sur la branche `main` apparaît sur le site en une à deux minutes.

## Les pages

Le site a une page par rubrique : accueil (`/`), prix (`/prix/`), zones, coordonnées des shops (`/carte/`), équipe, classements,
guide et une page réservée à l'équipe (non référencée sur Google).
Le menu, l'en-tête et le pied de page sont communs : ils sont écrits une seule fois dans `outils/construire.py`.

Pour modifier le texte d'une page, éditez son fichier dans `outils/pages/`, puis régénérez :

```
python outils/construire.py
```

Le script réécrit les `index.html` de chaque dossier et `sitemap.xml`.
Pour ajouter une page : un fichier dans `outils/pages/`, une ligne dans `PAGES` et dans `MENU`.

Les navigateurs gardent les fichiers en cache. Après une modification de `css/` ou `js/`,
augmentez `VERSION` en haut de `outils/construire.py` puis relancez le script :
tout le monde verra la nouvelle version tout de suite.

## Mentions légales et données

La page `/mentions-legales/` (fichier `outils/pages/mentions.html`) contient les mentions légales
(site non professionnel : éditeurs sous pseudo + hébergeur GitHub, LCEN art. 1-1, II, depuis la loi SREN de 2024), les avertissements
Mojang / VikingCraft, les crédits et la politique de confidentialité.
**À mettre à jour** si vous ajoutez un service externe, un stockage dans le navigateur, un formulaire,
une mesure d'audience (qui demanderait alors un bandeau de consentement) ou si le site devient commercial.

Les polices sont hébergées dans `polices/` (licence OFL, `polices/OFL.txt`) : pas d'appel à Google Fonts.

## Crédits

- Données : API publique VikingCraft.
- Textures d'items : Minecraft © Mojang, via le dépôt InventivetalentDev/minecraft-assets.
