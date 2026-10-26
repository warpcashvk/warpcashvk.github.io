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
| `js/config.js` | **Le fichier à modifier au quotidien** : textes des zones, Discord, skins, mot de passe |
| `data/items.json` | Catégories, notes et promos des items (modifiables depuis l'Espace équipe) |
| `js/app.js` | La logique (API, panier, carte, classements…) |
| `img/zones/` | Les screenshots de la visite |
| `img/skins/` | Les skins des fondateurs (PNG 64×64) |

## Modifier le contenu

Tout se passe dans `js/config.js` :

- **Zones** : changez `titre` et `texte`. Pour ajouter une zone, mettez l'image dans `img/zones/` et ajoutez un bloc dans `zones`.
- **Discord** : collez le lien d'invitation dans `discord`.
- **Skins** : mettez le fichier PNG du skin dans `img/skins/` et indiquez son chemin dans `skin`.
  Le site dessine le personnage et la tête à partir de ce fichier.
- **Secteurs** : renommez « Secteur principal » / « Secteur est » comme vous voulez.

## Catégories, notes et promos des items

Elles se changent depuis le site : **Espace équipe** (lien en bas de page) → « Catégories et textes des items ».
On peut créer, renommer, supprimer et réordonner les catégories, et pour chaque item choisir sa catégorie,
sa note (petite phrase sous le nom) et sa promo (badge, ex. « -20 % »). Le bouton « Enregistrer sur le site »
écrit le fichier `data/items.json` sur GitHub ; le site est à jour pour tout le monde 1 à 2 minutes après.

Pour enregistrer, il faut un **jeton GitHub** (à créer une fois, par chacun de vous deux) :

1. Sur github.com, connecté au compte `warpcashvk` : photo de profil → **Settings** → **Developer settings**
   → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. Nom : `Warp Cash`, expiration au choix (ex. 1 an).
3. **Repository access** : *Only select repositories* → `warpcashvk/warpcashvk.github.io`.
4. **Permissions** → *Repository permissions* → **Contents : Read and write** (rien d'autre).
5. **Generate token**, copier le jeton (`github_pat_…`) et le coller dans l'Espace équipe.

Le jeton reste dans le navigateur (cocher « Se souvenir sur cet appareil » pour ne pas le recoller).
Ne le partagez jamais : avec lui, on peut modifier le site. En cas de doute, supprimez-le sur GitHub et créez-en un autre.

## Thèmes de saison

Le site change de thème tout seul, chaque année (fichier `js/theme.js`) :

- **Halloween** du 1er au 31 octobre : orange et violet, citrouilles, toiles d'araignée, chauves-souris ;
- **Noël** du 1er novembre au 1er janvier inclus : rouge et vert, neige qui tombe, guirlande, lanternes ;
- le reste de l'année : thème classique.

Les visiteurs peuvent couper le thème avec le bouton 🎃 / 🎄 en bas à gauche (retenu jusqu'à la saison suivante).
L'animation est coupée d'office pour ceux qui ont demandé moins d'animations dans leur système.
Pour voir un thème hors saison : ajouter `?theme=halloween`, `?theme=noel` ou `?theme=classique` à l'adresse.

## Changer le mot de passe de l'espace équipe

Le mot de passe n'est écrit nulle part en clair : `js/config.js` ne contient que son empreinte
(PBKDF2-SHA256, salée, 600 000 tours). Pour en mettre un nouveau :

1. Ouvrez le site, appuyez sur F12, onglet **Console**.
2. Tapez : `await warpCash.nouveauMotDePasse("votre mot de passe")`
3. Copiez le bloc `motDePasse: {...}` affiché à la place de celui de `js/config.js`.

Choisissez un mot de passe long (une phrase de 4-5 mots) et qui ne sert nulle part ailleurs.

⚠️ Sur un site statique, cette page est un rideau, pas un coffre-fort : quelqu'un qui fouille
le code peut l'ouvrir sans mot de passe. Elle n'affiche que des données déjà publiques dans l'API.
N'y mettez jamais rien de secret.

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

Le site a une page par rubrique : accueil (`/`), prix (`/prix/`), zones, carte, équipe, classements,
guide et Espace équipe (`/gestion/`, non référencée sur Google).
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

## Crédits

- Données : API publique VikingCraft.
- Carte : tuiles de VkAnalyzer (site fait par un joueur) — si elles disparaissent, la carte s'affiche vide.
- Textures d'items : Minecraft © Mojang, via le dépôt InventivetalentDev/minecraft-assets.
