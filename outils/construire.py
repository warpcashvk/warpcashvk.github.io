# =====================================================================
#  Assemble les pages du site : le haut (menu), le bas (pied de page, panier)
#  sont communs, le contenu de chaque page est dans outils/pages/<page>.html.
#
#  Après avoir modifié un fichier de outils/pages/ ou ce script :
#      python outils/construire.py
#  (VERSION est ajoutée aux liens CSS/JS pour que les navigateurs prennent
#  la nouvelle version : l'augmenter quand css/ ou js/ changent.)
# =====================================================================
import html
import io
import os

VERSION = "9"
SITE = "https://warpcashvk.github.io"
TEX = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.1/assets/minecraft/textures/"
ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)

MENU = [
    ("accueil", "/", "Accueil"),
    ("zones", "/zones/", "Zones"),
    ("prix", "/prix/", "Prix"),
    ("carte", "/carte/", "Carte"),
    ("equipe", "/equipe/", "Équipe"),
    ("classements", "/classements/", "Classements"),
    ("guide", "/guide/", "Guide"),
]

PAGES = [
    dict(page="accueil", dossier="", titre="Warp Cash VikingCraft – shops de GambaleSempai et shadowyahit",
         desc="Le warp Cash sur VikingCraft FR (/warp cash) : les shops et fermes de GambaleSempai et shadowyahit, avec prix et stocks en direct."),
    dict(page="zones", dossier="zones", titre="Visite du warp Cash – VikingCraft FR",
         desc="Le warp Cash de VikingCraft FR en images : le hall, les fermes à canne, la tour des cultures, la mob farm et la salle des coffres."),
    dict(page="prix", dossier="prix", titre="Prix du warp Cash – shops VikingCraft en direct",
         desc="Les prix en direct des shops de GambaleSempai et shadowyahit sur VikingCraft FR, comparés au reste du serveur et à l'hôtel des ventes."),
    dict(page="carte", dossier="carte", titre="Carte des shops du warp Cash – VikingCraft FR",
         desc="Tous les shops de GambaleSempai et shadowyahit sur la carte du Continent de VikingCraft FR, avec leurs coordonnées."),
    dict(page="equipe", dossier="equipe", titre="L'équipe du warp Cash – GambaleSempai et shadowyahit",
         desc="GambaleSempai et shadowyahit, les fondateurs du warp Cash sur VikingCraft FR : qui est en ligne et comment les contacter en jeu."),
    dict(page="classements", dossier="classements", titre="Classements de GambaleSempai et shadowyahit – VikingCraft FR",
         desc="Les places de GambaleSempai et shadowyahit dans le top 100 des classements de VikingCraft FR : fortune, niveau, collections…"),
    dict(page="guide", dossier="guide", titre="Guide du joueur – Warp Cash VikingCraft", classe="guide",
         desc="Venir au warp Cash (/warp cash), acheter et vendre sur les shops de GambaleSempai et shadowyahit, les retrouver avec /market : le guide du joueur sur VikingCraft FR."),
    dict(page="gestion", dossier="gestion", titre="Espace équipe – Warp Cash", prive=True,
         desc="Espace réservé à l'équipe du warp Cash."),
]

CSP = ("default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; "
       "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; "
       "img-src 'self' data: https://cdn.jsdelivr.net https://mc-heads.net https://vkanalyzer.nexsarum.dev https://cdnjs.cloudflare.com; "
       "connect-src 'self' https://api.vikingcraft.fr https://api.github.com; "
       "object-src 'none'; base-uri 'self'; form-action 'self'")

LEAFLET_CSS = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==" crossorigin="anonymous" referrerpolicy="no-referrer">'
LEAFLET_JS = '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" integrity="sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>'

JSON_LD = """<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://warpcashvk.github.io/#site",
      "url": "https://warpcashvk.github.io/",
      "name": "Warp Cash VikingCraft",
      "alternateName": "Warp Cash",
      "inLanguage": "fr-FR",
      "description": "Le warp Cash sur le serveur Minecraft VikingCraft FR : shops et fermes de GambaleSempai et shadowyahit."
    },
    {
      "@type": "Organization",
      "@id": "https://warpcashvk.github.io/#org",
      "name": "Warp Cash",
      "url": "https://warpcashvk.github.io/",
      "logo": "https://warpcashvk.github.io/img/icones/emeraude-512.png",
      "founder": [
        { "@type": "Person", "name": "GambaleSempai" },
        { "@type": "Person", "name": "shadowyahit" }
      ]
    }
  ]
}
</script>
"""


def head(p):
    url = SITE + "/" + (p["dossier"] + "/" if p["dossier"] else "")
    t, d = html.escape(p["titre"]), html.escape(p["desc"])
    lignes = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f'<meta http-equiv="Content-Security-Policy" content="{CSP}">',
        '<meta name="referrer" content="strict-origin-when-cross-origin">',
        f"<title>{t}</title>",
        f'<meta name="description" content="{d}">',
    ]
    if p.get("prive"):
        lignes.append('<meta name="robots" content="noindex, nofollow">')
    else:
        lignes += [
            f'<link rel="canonical" href="{url}">',
            '<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="Warp Cash – VikingCraft FR">',
            '<meta property="og:locale" content="fr_FR">',
            f'<meta property="og:title" content="{t}">',
            f'<meta property="og:description" content="{d}">',
            f'<meta property="og:url" content="{url}">',
            f'<meta property="og:image" content="{SITE}/img/og.jpg">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            '<meta property="og:image:alt" content="Warp Cash sur VikingCraft FR : /warp cash">',
            '<meta name="twitter:card" content="summary_large_image">',
            f'<meta name="twitter:title" content="{t}">',
            f'<meta name="twitter:description" content="{d}">',
            f'<meta name="twitter:image" content="{SITE}/img/og.jpg">',
        ]
    lignes.append('<meta name="theme-color" content="#c6f548">')
    out = "\n".join(lignes) + "\n"
    if p["page"] == "accueil":
        out += JSON_LD
    # Icône hébergée sur le site, carrée et multiple de 48 px : sinon Google affiche un globe gris
    out += ('<link rel="icon" href="/favicon.ico" sizes="48x48">\n'
            '<link rel="icon" type="image/png" sizes="192x192" href="/img/icones/emeraude-192.png">\n'
            '<link rel="apple-touch-icon" href="/img/icones/apple-touch-icon.png">\n')
    out += '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    out += '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@500;700&family=Pixelify+Sans:wght@700&display=swap">\n'
    if p["page"] == "carte":
        out += LEAFLET_CSS + "\n"
    out += f'<link rel="stylesheet" href="/css/style.css?v={VERSION}">\n'
    out += f'<script src="/js/theme.js?v={VERSION}"></script>\n'
    return out


def entete(p):
    liens = "\n".join(
        f'    <a href="{u}"{" class=\"on\" aria-current=\"page\"" if k == p["page"] else ""}>{n}</a>' for k, u, n in MENU)
    return f"""<header class="topbar" id="topbar">
  <a class="brand" href="/">
    <img src="{TEX}item/emerald.png" alt="">
    <span>Warp Cash</span>
  </a>
  <nav class="nav" id="nav" aria-label="Menu">
{liens}
  </nav>
  <button class="btn btn-sm btn-accent cart-toggle" id="cartBtn" type="button" aria-controls="cart">
    <img src="{TEX}item/bundle.png" alt="">
    <span class="cart-label">Panier</span> <b id="cartCount">0</b>
  </button>
  <button class="menu-btn" id="menuBtn" type="button" aria-controls="nav" aria-expanded="false" aria-label="Ouvrir le menu">
    <span></span><span></span><span></span>
  </button>
</header>
"""


def pied():
    liens = " · ".join(f'<a href="{u}">{n}</a>' for k, u, n in MENU)
    return f"""<footer class="footer">
  <p class="footer-nav">{liens}</p>
  <p>Site fait par et pour le warp Cash · non officiel · données <a href="https://api.vikingcraft.fr" target="_blank" rel="noopener">api.vikingcraft.fr</a></p>
  <p class="muted">Minecraft et ses textures © Mojang. Carte : VkAnalyzer.</p>
  <p><a href="/gestion/" class="staff-link">Espace équipe</a></p>
</footer>

<!-- Panier -->
<aside class="cart panel" id="cart" hidden aria-label="Panier">
  <div class="cart-head">
    <h3>Panier</h3>
    <button class="btn btn-sm" id="cartClose" type="button" aria-label="Fermer">✕</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot">
    <div class="cart-total">Total : <b id="cartTotal">0</b></div>
    <div class="cart-actions">
      <button class="btn btn-sm" id="cartCopy" type="button">Copier la liste</button>
      <button class="btn btn-sm" id="cartClear" type="button">Vider</button>
    </div>
    <p class="hint">Le paiement se fait en jeu, directement sur chaque shop.</p>
  </div>
</aside>

<!-- Agrandissement des photos -->
<dialog class="lightbox" id="lightbox">
  <img id="lbImg" alt="">
  <p id="lbCap"></p>
  <button class="btn btn-sm" id="lbClose" type="button">Fermer</button>
</dialog>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
"""


def page(p):
    contenu = io.open(os.path.join(ICI, "pages", p["page"] + ".html"), encoding="utf-8").read().rstrip() + "\n"
    classe = f' class="{p["classe"]}"' if p.get("classe") else ""
    scripts = (LEAFLET_JS + "\n" if p["page"] == "carte" else "") + \
        f'<script src="/js/config.js?v={VERSION}"></script>\n<script src="/js/app.js?v={VERSION}"></script>\n'
    return ("<!doctype html>\n<html lang=\"fr\">\n<head>\n<!-- Page générée par outils/construire.py : modifier outils/pages/"
            + p["page"] + ".html puis relancer le script. -->\n"
            + head(p) + "</head>\n"
            + f'<body data-page="{p["page"]}">\n\n'
            + entete(p) + f"\n<main id=\"main\"{classe}>\n\n" + contenu + "\n</main>\n\n"
            + pied() + "\n" + scripts + "</body>\n</html>\n")


def sitemap():
    urls = [p for p in PAGES if not p.get("prive")]
    lignes = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in urls:
        u = SITE + "/" + (p["dossier"] + "/" if p["dossier"] else "")
        prio = "1.0" if p["page"] == "accueil" else "0.8" if p["page"] in ("prix", "zones", "guide") else "0.6"
        freq = "daily" if p["page"] in ("accueil", "prix", "carte") else "weekly"
        lignes.append(f"  <url><loc>{u}</loc><changefreq>{freq}</changefreq><priority>{prio}</priority></url>")
    lignes.append("</urlset>")
    return "\n".join(lignes) + "\n"


for p in PAGES:
    dossier = os.path.join(RACINE, p["dossier"])
    os.makedirs(dossier, exist_ok=True)
    with io.open(os.path.join(dossier, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(page(p))
    print("ok", "/" + (p["dossier"] + "/" if p["dossier"] else ""))
with io.open(os.path.join(RACINE, "sitemap.xml"), "w", encoding="utf-8", newline="\n") as f:
    f.write(sitemap())
print("ok sitemap.xml")
