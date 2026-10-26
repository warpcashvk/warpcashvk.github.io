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
    { pseudo: "shadowyahit", role: "Fondateur", skin: "img/skins/shadowyahit.png?v=2" },   // skin C.C. (minecraftskins.com, mrjerkthatsnake4)
  ],

  // Lien d'invitation Discord. Laisser vide ("") pour cacher le bouton.
  discord: "",

  // Pseudos Discord à contacter (affichés sans dire qui est qui). On ne contacte pas l'équipe en jeu.
  discordPseudos: ["qn8w", "moonmisty32"],

  // Adresse mail de contact (page Équipe et mentions légales). Elle est écrite par le
  // JavaScript, donc absente du HTML brut que lisent les robots à spam.
  email: "warpcashvk@gmail.com",

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
  ],

  // Catégories, notes et promos des items : elles sont dans data/items.json
  // et se modifient depuis l'Espace équipe (bouton « Enregistrer sur le site »).
  // Dépôt GitHub du site, utilisé par ce bouton :
  github: {
    depot: "warpcashvk/warpcashvk.github.io", branche: "main", fichier: "data/items.json",
    email: "348219096+warpcashvk@users.noreply.github.com",   // adresse « noreply » du compte GitHub
  },
};
