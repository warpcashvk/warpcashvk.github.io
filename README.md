# Warp Cash — site web

Site du warp Cash sur VikingCraft FR (`/warp cash`, `/warp cash_ferme`).
Les prix, stocks, profils et classements viennent en direct de l'API `api.vikingcraft.fr` :
rien à mettre à jour à la main quand vous changez un shop en jeu.

## Ce qu'il y a dans le dossier

| Fichier | À quoi il sert |
|---|---|
| `index.html` | La page |
| `css/style.css` | Le design |
| `js/config.js` | **Le seul fichier à modifier au quotidien** : textes des zones, catégories et promos des items, Discord, skins, mot de passe |
| `js/app.js` | La logique (API, panier, carte, classements…) |
| `img/zones/` | Les screenshots de la visite |
| `img/skins/` | Les skins des fondateurs (PNG 64×64) |

## Modifier le contenu

Tout se passe dans `js/config.js` :

- **Zones** : changez `titre` et `texte`. Pour ajouter une zone, mettez l'image dans `img/zones/` et ajoutez un bloc dans `zones`.
- **Items** : `categorie`, `note` (petite phrase sous le nom) et `promo` (badge, ex. `"-20 %"`), par nom Minecraft (`SUGAR_CANE`, `WHEAT`…).
- **Discord** : collez le lien d'invitation dans `discord`.
- **Skins** : mettez le fichier PNG du skin dans `img/skins/` et indiquez son chemin dans `skin`.
  Le site dessine le personnage et la tête à partir de ce fichier.
- **Secteurs** : renommez « Secteur principal » / « Secteur est » comme vous voulez.

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

Les navigateurs gardent les fichiers en cache. Après une modification de `css/` ou `js/`,
augmentez le numéro de version dans `index.html` et `guide/index.html`
(`style.css?v=3` → `?v=4`, pareil pour les `.js`) pour que tout le monde voie la nouvelle version tout de suite.

## Crédits

- Données : API publique VikingCraft.
- Carte : tuiles de VkAnalyzer (site fait par un joueur) — si elles disparaissent, la carte s'affiche vide.
- Textures d'items : Minecraft © Mojang, via le dépôt InventivetalentDev/minecraft-assets.
