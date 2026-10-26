// =====================================================================
//  CONFIGURATION DU SITE WARP CASH
//  C'est le seul fichier à modifier au quotidien (textes, zones, items).
//  Les prix, stocks, profils et classements viennent tout seuls de l'API.
// =====================================================================

window.CONFIG = {
  nomSite: "Warp Cash",
  serveur: "VikingCraft FR",
  api: "https://api.vikingcraft.fr/api/v1",
  monnaie: "$",

  // Commandes affichées sur l'accueil (bouton = copie dans le presse-papiers)
  warps: [
    { commande: "/warp cash", texte: "Le warp principal" },
    { commande: "/warp cash_ferme", texte: "Les fermes" },
  ],

  // Pseudos EXACTS tels que l'API les connaît. Tous leurs shops sont affichés.
  // Le « grade » affiché est le niveau serveur renvoyé par l'API.
  // skin : fichier PNG du skin (64×64) dans img/skins/. Le site dessine le perso et la tête
  //        à partir de ce fichier. Laisser vide ("") = skin Steve par défaut.
  fondateurs: [
    { pseudo: "GambaleSempai", role: "Fondateur", skin: "img/skins/GambaleSempai.png" },
    { pseudo: "shadowyahit", role: "Fondateur", skin: "img/skins/shadowyahit.png" },   // skin du compte « zerotwo »
  ],

  // Lien d'invitation Discord. Laisser vide ("") pour cacher le bouton.
  discord: "",

  // Mot de passe de la page « Espace équipe » : jamais écrit en clair, seulement son empreinte
  // (PBKDF2-SHA256 salée). Pour le changer, voir README.md.
  motDePasse: {
    sel: "4f80ba52648d651456557136a473602b",
    iterations: 600000,
    empreinte: "dc173d311522091704b7261ab0f8cc539514059c7d40a0ae14bd6513646bd4f4",
  },

  // Secteurs : les shops sont rangés dans le secteur le plus proche (rayon en blocs).
  // Renommez-les librement ; un shop hors de tout secteur est affiché « Hors secteur ».
  secteurs: [
    { nom: "Secteur principal", x: -900, z: -7760, rayon: 250 },
    { nom: "Secteur est", x: 2612, z: -3420, rayon: 250 },
  ],

  // Visite des zones : image (dans img/zones/), titre et description.
  // Descriptions provisoires écrites d'après les screenshots — à corriger au fur et à mesure.
  zones: [
    {
      image: "img/zones/hall.webp",
      titre: "Le hall CASH!",
      texte: "L'entrée principale : tapis rouge, grandes verrières et le panneau CASH! en lampes. Toutes les zones partent d'ici.",
    },
    {
      image: "img/zones/canne.webp",
      titre: "Les fermes à canne",
      texte: "Des couloirs de cannes à sucre sur plusieurs étages, récoltées automatiquement par observateurs et pistons.",
    },
    {
      image: "img/zones/anneau.webp",
      titre: "La tour des cultures",
      texte: "Une tour ronde à colonnes : betteraves sur le toit, blé au milieu, légumes au rez-de-chaussée.",
    },
    {
      image: "img/zones/betteraves.webp",
      titre: "Les champs extérieurs",
      texte: "Des champs à perte de vue au pied du bâtiment principal.",
    },
    {
      image: "img/zones/mobfarm.webp",
      titre: "La mob farm",
      texte: "Des colonnes de spawners suspendues au-dessus d'une grille de collecte.",
    },
    {
      image: "img/zones/coffres.webp",
      titre: "La salle des coffres",
      texte: "Le tri automatique : des centaines de coffres et d'entonnoirs qui rangent chaque ressource produite.",
    },
    {
      image: "img/zones/entree.webp",
      titre: "Le passage secret",
      texte: "Accroupis-toi (sneak) pour rentrer.",
    },
  ],

  // Infos ajoutées à la main sur les items, par nom Minecraft (MATERIAL).
  //   categorie : filtre de la liste des prix
  //   note      : petite phrase sous le nom de l'item
  //   promo     : badge affiché à côté du prix (ex. "-20 %", "Nouveau")
  // Un item absent de cette liste est rangé dans « Divers ».
  items: {
    SUGAR_CANE:      { categorie: "Cultures", note: "Tout droit sorti des fermes à canne" },
    WHEAT:           { categorie: "Cultures" },
    CACTUS:          { categorie: "Cultures" },
    KELP:            { categorie: "Cultures" },
    NETHER_WART:     { categorie: "Cultures" },
    POPPY:           { categorie: "Cultures" },
    WITHER_ROSE:     { categorie: "Cultures" },
    BONE:            { categorie: "Drops de mobs" },
    BONE_MEAL:       { categorie: "Drops de mobs" },
    SPIDER_EYE:      { categorie: "Drops de mobs" },
    STRING:          { categorie: "Drops de mobs" },
    GUNPOWDER:       { categorie: "Drops de mobs" },
    BLAZE_ROD:       { categorie: "Drops de mobs" },
    COOKED_PORKCHOP: { categorie: "Drops de mobs" },
    IRON_INGOT:      { categorie: "Drops de mobs" },
    WHITE_WOOL:      { categorie: "Drops de mobs" },
    ARROW:           { categorie: "Combat" },
    TIPPED_ARROW:    { categorie: "Combat" },
    POTION:          { categorie: "Combat" },
    FIREWORK_ROCKET: { categorie: "Combat" },
    ENCHANTED_BOOK:  { categorie: "Combat" },
    GLASS:           { categorie: "Blocs" },
    DIRT:            { categorie: "Blocs" },
    GRASS_BLOCK:     { categorie: "Blocs" },
    GLOWSTONE:       { categorie: "Blocs" },
    SHULKER_BOX:     { categorie: "Divers" },
    PAPER:           { categorie: "Divers" },
  },
};
