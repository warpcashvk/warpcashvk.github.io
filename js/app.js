// =====================================================================
//  Warp Cash — logique du site. Les réglages sont dans js/config.js.
// =====================================================================
(() => {
"use strict";

const C = window.CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const OWNERS = C.fondateurs.map(f => f.pseudo.toLowerCase());
const TEX = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.1/assets/minecraft/textures/";
const VK_TILES = "https://vkanalyzer.nexsarum.dev/map-tiles/overworld/";
const FULL_STOCK = 3456;   // un double coffre plein (54 stacks)
const LOW_STOCK = 64;
const PAGE = document.body.dataset.page || "accueil";
// chemins d'images de config.js (écrits sans « / » au début) : valables sur toutes les pages
const asset = p => (/^(https?:)?\/|^data:/.test(p) ? p : "/" + p);

// anciens liens du site en une seule page (/#shops…) → nouvelles pages
const OLD_ANCHORS = { zones: "/zones/", shops: "/prix/", carte: "/carte/", equipe: "/equipe/", classements: "/classements/", gestion: "/gestion/" };
if (PAGE === "accueil" && OLD_ANCHORS[location.hash.slice(1)]) location.replace(OLD_ANCHORS[location.hash.slice(1)]);

// ---------- Petits utilitaires ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n, d = 0) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => {
  if (n == null) return "—";
  const a = Math.abs(n);
  // les petits prix gardent leurs décimales (0,0052 $) pour que les comparaisons restent lisibles
  const s = a >= 1000 ? num(n) : a >= 1 || a === 0 ? num(n, 2)
    : Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return s + " " + C.monnaie;
};
const unit = s => s.price / (s.stackAmount || 1);
const int = v => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
const median = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const isOurs = name => OWNERS.includes(String(name).toLowerCase());
const ago = sec => {
  if (sec < 90) return "à l'instant";
  if (sec < 3600) return `il y a ${Math.round(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.round(sec / 3600)} h`;
  return `il y a ${Math.round(sec / 86400)} j`;
};
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
};

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}
async function copy(text, label) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* rien */ } ta.remove();
  }
  toast(`${label || text} copié !`);
}

// ---------- Icônes d'items (textures Minecraft) ----------
const ICON_OVERRIDE = {
  GRASS_BLOCK: "block/grass_block_side", CACTUS: "block/cactus_side", TIPPED_ARROW: "item/arrow",
  SHULKER_BOX: "item/shulker_shell", POPPY: "block/poppy", WITHER_ROSE: "block/wither_rose",
  CLOCK: "item/clock_00", COMPASS: "item/compass_00", PLAYER_HEAD: "item/player_head",
};
function iconUrls(material) {
  const k = String(material).toLowerCase();
  return [ICON_OVERRIDE[material], "item/" + k, "block/" + k, "block/" + k + "_side", "block/" + k + "_top", "block/" + k + "_front"]
    .filter(Boolean).map(p => TEX + p + ".png");
}
function icon(material, size) {
  const u = iconUrls(material);
  return `<img src="${u[0]}" data-alt="${u.slice(1).join("|")}" alt="" loading="lazy" ${size ? `width="${size}" height="${size}"` : ""}>`;
}
// Si une texture n'existe pas, on essaie la suivante (item → block → …)
document.addEventListener("error", e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.alt === undefined) return;
  const rest = img.dataset.alt.split("|").filter(Boolean);
  if (rest.length) { img.src = rest.shift(); img.dataset.alt = rest.join("|"); }
  else { delete img.dataset.alt; img.src = TEX + "item/barrier.png"; }
}, true);
// ---------- Skins : dessinés à partir du PNG de chaque fondateur (img/skins/) ----------
const SKINS = {};   // pseudo en minuscules → { head, body } en data URL
function drawSkin(img) {
  const legacy = img.height === 32, S = 10;
  const src = document.createElement("canvas"); src.width = 64; src.height = 64;
  const sx = src.getContext("2d"); sx.drawImage(img, 0, 0);
  const slim = !legacy && sx.getImageData(54, 20, 1, 1).data[3] === 0;   // bras fins (modèle Alex)
  const aw = slim ? 3 : 4;
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w * S; c.height = h * S; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; };
  const [b, bx] = canvas(16, 32), [h, hx] = canvas(8, 8);
  // vue de face : (x, y, largeur, hauteur) dans le skin → (x, y) sur le perso
  const P = (x, y, w, ht, dx, dy, mirror) => {
    if (!mirror) { bx.drawImage(src, x, y, w, ht, dx * S, dy * S, w * S, ht * S); return; }
    bx.save(); bx.translate((dx + w) * S, dy * S); bx.scale(-1, 1);
    bx.drawImage(src, x, y, w, ht, 0, 0, w * S, ht * S); bx.restore();
  };
  P(8, 8, 8, 8, 4, 0); P(20, 20, 8, 12, 4, 8);
  P(44, 20, aw, 12, 4 - aw, 8);
  legacy ? P(44, 20, 4, 12, 12, 8, true) : P(36, 52, aw, 12, 12, 8);
  P(4, 20, 4, 12, 4, 20);
  legacy ? P(4, 20, 4, 12, 8, 20, true) : P(20, 52, 4, 12, 8, 20);
  P(40, 8, 8, 8, 4, 0);   // chapeau
  if (!legacy) { P(20, 36, 8, 12, 4, 8); P(44, 36, aw, 12, 4 - aw, 8); P(52, 52, aw, 12, 12, 8); P(4, 36, 4, 12, 4, 20); P(4, 52, 4, 12, 8, 20); }
  hx.drawImage(src, 8, 8, 8, 8, 0, 0, 8 * S, 8 * S);
  hx.drawImage(src, 40, 8, 8, 8, 0, 0, 8 * S, 8 * S);
  return { body: b.toDataURL(), head: h.toDataURL() };
}
function loadSkins() {
  for (const f of C.fondateurs) {
    if (!f.skin) continue;
    const img = new Image();
    img.onload = () => {
      const s = SKINS[f.pseudo.toLowerCase()] = drawSkin(img);
      document.querySelectorAll("img[data-head]").forEach(i => { if (i.dataset.head === f.pseudo.toLowerCase()) i.src = s.head; });
      document.querySelectorAll("img[data-body]").forEach(i => { if (i.dataset.body === f.pseudo.toLowerCase()) i.src = s.body; });
    };
    img.src = asset(f.skin);
  }
}
const head = (name, size = 16) => {
  const k = String(name).toLowerCase();
  return `<img src="${SKINS[k]?.head || `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`}" data-head="${esc(k)}" alt="" width="${size}" height="${size}">`;
};
const bodySrc = name => SKINS[name.toLowerCase()]?.body || `https://mc-heads.net/body/${encodeURIComponent(name)}/240`;

// ---------- API (limite serveur : 2 requêtes/s, rafale de 20) ----------
const bucket = { tokens: 14, last: performance.now() };
async function takeToken() {
  for (;;) {
    const now = performance.now();
    bucket.tokens = Math.min(14, bucket.tokens + (now - bucket.last) / 1000 * 1.8);
    bucket.last = now;
    if (bucket.tokens >= 1) { bucket.tokens -= 1; return; }
    await sleep((1 - bucket.tokens) / 1.8 * 1000 + 20);
  }
}
async function api(path, tries = 3) {
  await takeToken();
  const r = await fetch(C.api + path);
  if (r.status === 429 && tries > 0) {
    await sleep((Number(r.headers.get("Retry-After")) || 2) * 1000);
    return api(path, tries - 1);
  }
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`API ${r.status} sur ${path}`);
  return (await r.json()).data;
}

// ---------- État ----------
const S = {
  all: [],        // tous les shops du serveur, le temps de comparer les prix
  market: [],     // HDV, prix agrégés par item, idem
  base: [],       // nos shops avec leur comparaison de prix (gardés en cache entre les pages)
  ours: [],       // les mêmes, avec catégorie, note et promo (data/items.json)
  players: {},    // profils des fondateurs
  playersLoaded: false,
  items: { categories: ["Divers"], items: {} },   // data/items.json : catégories, notes, promos
  itemsLock: 0,   // après un enregistrement, on garde la version locale le temps que GitHub publie
  refreshed: null,
  view: { mode: "sell", q: "", cat: "", sort: "nom", hideEmpty: false },
  cart: {},       // id du shop → { q: quantité, n: nom, m: material, u: prix unitaire, o: proprio, max: stock }
  staff: false,   // Espace équipe ouvert (jeton GitHub vérifié), en mémoire seulement
};

// Items dont le même MATERIAL cache des variantes très différentes : pas de comparaison de prix
const VARIANTS = new Set(["POTION", "SPLASH_POTION", "LINGERING_POTION", "TIPPED_ARROW", "ENCHANTED_BOOK",
  "PLAYER_HEAD", "FIREWORK_ROCKET", "SUSPICIOUS_STEW", "WRITTEN_BOOK", "FILLED_MAP", "GOAT_HORN", "SHULKER_BOX"]);

function sector(s) {
  let best = null, bestD = Infinity;
  for (const z of C.secteurs) {
    const d = Math.hypot(s.x - z.x, s.z - z.z);
    if (d <= z.rayon && d < bestD) { best = z.nom; bestD = d; }
  }
  return best || "Hors secteur";
}

function compare(s) {
  if (VARIANTS.has(s.material)) return { verdict: "variante" };
  const others = S.all.filter(o => o.material === s.material && o.type === s.type && !isOurs(o.ownerName) && o.price > 0 && o.remainingStock > 0).map(unit);
  const hdv = s.type === "sell" ? S.market.filter(m => m.material === s.material) : [];
  const hdvMin = hdv.length ? Math.min(...hdv.map(m => m.minUnitPrice)) : null;
  const med = median(others), u = unit(s);
  const c = { n: others.length, med, min: others.length ? Math.min(...others) : null, max: others.length ? Math.max(...others) : null, hdvMin, hdvN: hdv.reduce((a, m) => a + m.listings, 0) };
  if (s.type === "sell") {
    const refs = [med, hdvMin].filter(v => v != null);
    if (!refs.length) { c.verdict = "seul"; return c; }
    c.ref = Math.min(...refs);
    // « Moins cher du serveur » : strictement sous TOUS les autres shops et sous l'HDV
    const lowest = Math.min(...[c.min, hdvMin].filter(v => v != null));
    c.verdict = u < lowest ? "moins" : u > Math.max(...refs) * 1.03 ? "plus" : "marche";
  } else {
    if (!others.length) { c.verdict = "seul"; return c; }
    c.ref = med;
    c.verdict = u > c.max * 1.001 ? "mieux" : u < med * 0.97 ? "moins-bien" : "marche";
  }
  return c;
}

function compareTip(s) {
  const c = s.cmp;
  if (c.verdict === "variante") return "Prix non comparable :\nl'effet ou l'enchantement change tout.";
  const lines = [];
  if (c.n) lines.push(`Autres shops : médiane ${money(c.med)} (${c.n} shop${c.n > 1 ? "s" : ""})`, `de ${money(c.min)} à ${money(c.max)}`);
  else lines.push(s.type === "sell" ? "Aucun autre shop ne le vend." : "Aucun autre shop ne le rachète.");
  if (s.type === "sell") lines.push(c.hdvMin != null ? `HDV : dès ${money(c.hdvMin)} (${c.hdvN} annonce${c.hdvN > 1 ? "s" : ""})` : "HDV : aucune annonce.");
  return lines.join("\n");
}

function publicBadge(s) {
  const v = s.cmp.verdict;
  if (s.type === "sell" && v === "moins") return `<span class="badge b-cheap">Moins cher du serveur</span>`;
  if (s.type === "sell" && v === "seul") return `<span class="badge b-only">Exclusif</span>`;
  if (s.type === "buy" && v === "mieux") return `<span class="badge b-best">Meilleur rachat</span>`;
  if (s.type === "buy" && v === "seul") return `<span class="badge b-only">Exclusif</span>`;
  return "";
}
function staffBadge(s) {
  return {
    moins: `<span class="badge b-cheap">Le moins cher</span>`, marche: `<span class="badge b-market">Dans le marché</span>`,
    plus: `<span class="badge b-pricey">Plus cher</span>`, seul: `<span class="badge b-only">Seul vendeur</span>`,
    mieux: `<span class="badge b-best">Meilleur rachat</span>`, "moins-bien": `<span class="badge b-pricey">Rachat plus bas</span>`,
    variante: `<span class="badge b-market">Non comparable</span>`,
  }[s.cmp.verdict] || "";
}

// ---------- Nettoyage des données reçues ----------
// L'API est un service tiers : on ne garde que les champs utiles, avec le bon type,
// pour qu'aucune valeur inattendue ne puisse injecter du HTML dans la page.
const MATERIAL_RE = /^[A-Z0-9_]{1,64}$/;
const cleanMaterial = m => (MATERIAL_RE.test(m) ? m : "BARRIER");
const cleanShop = s => ({
  id: String(s?.id ?? ""),
  name: String(s?.name ?? "?"),
  ownerName: String(s?.ownerName ?? ""),
  material: cleanMaterial(s?.material),
  type: s?.type === "buy" ? "buy" : "sell",
  price: Math.max(0, Number(s?.price) || 0),
  stackAmount: Math.max(1, int(s?.stackAmount)),
  remainingStock: Math.max(0, int(s?.remainingStock)),
  world: String(s?.world ?? ""),
  x: int(s?.x), y: int(s?.y), z: int(s?.z),
});
const cleanEntry = e => ({ position: Math.max(0, int(e?.position)), playerName: String(e?.playerName ?? ""), formattedScore: String(e?.formattedScore ?? "") });
const txt = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
function cleanItems(d) {
  const categories = [...new Set((Array.isArray(d?.categories) ? d.categories : []).map(c => txt(c, 40)).filter(Boolean))];
  if (!categories.includes("Divers")) categories.push("Divers");
  const items = {};
  for (const [m, v] of Object.entries(d?.items && typeof d.items === "object" ? d.items : {})) {
    if (!MATERIAL_RE.test(m)) continue;
    const e = {}, cat = txt(v?.categorie, 40), note = txt(v?.note, 80), promo = txt(v?.promo, 20);
    if (cat) e.categorie = categories.includes(cat) ? cat : "Divers";
    if (note) e.note = note;
    if (promo) e.promo = promo;
    if (Object.keys(e).length) items[m] = e;
  }
  return { categories, items };
}

// ---------- Chargement des données ----------
async function loadShops() {
  const first = await api("/module/shop/shops?limit=500&offset=0");
  const total = Math.min(int(first.stats?.shops), 20000);
  const pages = [Promise.resolve(first.shops)];
  for (let o = 500; o < total; o += 500) pages.push(api(`/module/shop/shops?limit=500&offset=${o}`).then(d => d.shops));
  S.all = (await Promise.all(pages)).flat().filter(Boolean).map(cleanShop);
  S.refreshed = first.stats?.lastRefresh ?? null;
}
async function loadMarket() {
  const out = [];
  for (let o = 0; o < 5000; o += 250) {
    const d = await api(`/module/hdv/market?limit=250&offset=${o}`);
    const page = Array.isArray(d?.market) ? d.market : [];
    out.push(...page.map(m => ({ material: cleanMaterial(m?.material), listings: Math.max(0, int(m?.listings)), minUnitPrice: Math.max(0, Number(m?.minUnitPrice) || 0) })));
    if (page.length < 250) break;
  }
  S.market = out;
}
async function loadPlayers() {
  const res = await Promise.all(C.fondateurs.map(f => api(`/module/playerinfo/players/${encodeURIComponent(f.pseudo)}`).catch(() => null)));
  C.fondateurs.forEach((f, i) => { S.players[f.pseudo] = res[i]; });
}

async function loadItems() {
  if (Date.now() < S.itemsLock) return;
  const r = await fetch(`/data/items.json?t=${Date.now()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`items.json ${r.status}`);
  S.items = cleanItems(await r.json());
}

function computeBase() {
  S.base = S.all.filter(s => isOurs(s.ownerName)).map(s => {
    const o = { ...s, sector: sector(s) };
    o.cmp = compare(o);
    return o;
  });
  S.all = []; S.market = [];   // plus besoin une fois les comparaisons faites
}
function enrich() {
  S.ours = S.base.map(s => {
    const extra = S.items.items[s.material] || {};
    return { ...s, cat: extra.categorie || "Divers", note: extra.note || "", promo: extra.promo || "" };
  });
}

// ---------- Cache entre les pages (3 min) : changer de page ne relance pas tout le chargement ----------
const CACHE_MS = 180e3;
function cacheGet(k) {
  try { const v = JSON.parse(sessionStorage.getItem("wc_" + k)); return v && Date.now() - v.t < CACHE_MS ? v.d : null; }
  catch { return null; }
}
function cacheSet(k, d) { try { sessionStorage.setItem("wc_" + k, JSON.stringify({ t: Date.now(), d })); } catch { /* stockage plein ou indisponible */ } }
const VERDICTS = new Set(["moins", "plus", "marche", "seul", "mieux", "moins-bien", "variante"]);
const numOrNull = v => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const cleanCmp = c => ({
  verdict: VERDICTS.has(c?.verdict) ? c.verdict : "variante", n: int(c?.n), hdvN: int(c?.hdvN),
  med: numOrNull(c?.med), min: numOrNull(c?.min), max: numOrNull(c?.max), hdvMin: numOrNull(c?.hdvMin), ref: numOrNull(c?.ref),
});

// Ce que chaque page doit charger depuis l'API
const NEEDS = { accueil: ["shops", "players"], prix: ["shops"], carte: ["shops"], equipe: ["players"], gestion: ["shops", "players"] };
async function loadShopData(useCache) {
  const c = useCache && cacheGet("shops");
  if (c) {
    S.base = (Array.isArray(c.base) ? c.base : []).map(s => ({ ...cleanShop(s), sector: txt(s?.sector, 40) || "Hors secteur", cmp: cleanCmp(s?.cmp) }));
    S.refreshed = c.refreshed ?? null;
    return;
  }
  await Promise.all([loadShops(), loadMarket().catch(() => { S.market = []; })]);
  computeBase();
  cacheSet("shops", { base: S.base, refreshed: S.refreshed });
}
async function loadPlayerData(useCache) {
  const c = useCache && cacheGet("players");
  if (c && typeof c === "object") S.players = c;
  else { await loadPlayers(); cacheSet("players", S.players); }
  S.playersLoaded = true;
}

async function loadAll(first) {
  const need = NEEDS[PAGE] || [];
  try {
    await Promise.all([
      loadItems().catch(console.error),
      need.includes("shops") ? loadShopData(first) : null,
      need.includes("players") ? loadPlayerData(first) : null,
    ]);
    enrich();
    renderAll();
  } catch (err) {
    console.error(err);
    if (!first) return;
    const box = $("#shopList") || $("#deals") || $("#team") || $("#dash");
    if (!box) return;
    box.innerHTML = `<div class="empty panel">Impossible de joindre l'API VikingCraft pour l'instant.<br><br><button class="btn" id="retry" type="button">Réessayer</button></div>`;
    $("#retry").addEventListener("click", () => { box.innerHTML = `<p class="loading">Chargement…</p>`; loadAll(true); });
  }
}

function renderAll() {
  if ($("#stShops")) renderHeroStats();
  if ($("#shopList")) { renderFilters(); renderShops(); }
  if ($("#deals")) renderDeals();
  if ($("#team")) renderTeam();
  if ($("#teamPeek")) renderTeamPeek();
  if ($("#map")) { if (map) renderMap(); else initMap(); }
  renderCart();
  if (PAGE === "gestion" && staffUnlocked()) { renderDash(); if (!E.dirty) renderEditor(); }
  const up = $("#shopsUpdated");
  if (up && S.base.length) {
    const t = S.refreshed ? new Date(S.refreshed) : new Date();
    up.textContent = `Mis à jour à ${t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`;
  }
}

// ---------- Accueil ----------
function renderWarps() {
  if (!$("#warps")) return;
  $("#warps").innerHTML = C.warps.map(w =>
    `<button class="cmd" type="button" data-copy="${esc(w.commande)}"><div><code>${esc(w.commande)}</code><span>${esc(w.texte)} · cliquer pour copier</span></div></button>`).join("");
}
function renderHeroStats() {
  const sells = S.ours.filter(s => s.type === "sell");
  $("#stShops").textContent = num(S.ours.filter(s => s.remainingStock > 0).length);
  $("#stStock").textContent = num(sells.reduce((a, s) => a + s.remainingStock, 0));
  const online = C.fondateurs.filter(f => S.players[f.pseudo]?.seen?.online).length;
  $("#stOnline").textContent = S.playersLoaded ? `${online} / ${C.fondateurs.length}` : "…";
  $("#stCheap").textContent = num(sells.filter(s => s.cmp.verdict === "moins" && s.remainingStock > 0).length);
}

// ---------- Zones ----------
function renderZones() {
  const grid = $("#zonesGrid");
  if (!grid) return;
  const limit = int(grid.dataset.limit) || C.zones.length;
  grid.innerHTML = C.zones.slice(0, limit).map((z, i) => `
    <figure class="zone panel" tabindex="0" data-zone="${i}">
      <img src="${esc(asset(z.image))}" alt="${esc(z.titre)}" loading="lazy">
      <figcaption><h3>${esc(z.titre)}</h3><p>${esc(z.texte)}</p></figcaption>
    </figure>`).join("");
}
function openZone(i) {
  const z = C.zones[i], dlg = $("#lightbox");
  $("#lbImg").src = asset(z.image); $("#lbImg").alt = z.titre;
  $("#lbCap").textContent = `${z.titre} — ${z.texte}`;
  dlg.showModal();
}

// ---------- Liste des prix : grille de cartes rangée par catégorie ----------
// Ordre d'affichage : celui choisi dans l'Espace équipe, puis les catégories inconnues, « Divers » en dernier
function catOrder(cats) {
  const ref = S.items.categories;
  const rank = c => (c === "Divers" && ref.indexOf(c) === ref.length - 1 ? 1e6 : ref.includes(c) ? ref.indexOf(c) : 1e5);
  return [...cats].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b, "fr"));
}
function visibleShops(withCat) {
  const v = S.view, q = v.q.trim().toLowerCase();
  return S.ours.filter(s => s.type === v.mode
    && (!withCat || !v.cat || s.cat === v.cat)
    && (!v.hideEmpty || s.remainingStock > 0)
    && (!q || s.name.toLowerCase().includes(q) || s.material.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q)));
}
function renderFilters() {
  const list = visibleShops(false);
  const count = c => list.filter(s => s.cat === c).length;
  const cats = catOrder(new Set(S.ours.filter(s => s.type === S.view.mode).map(s => s.cat)));
  if (S.view.cat && !cats.includes(S.view.cat)) S.view.cat = "";
  const chip = (c, label, n) => `<button class="chip${S.view.cat === c ? " on" : ""}" type="button" data-cat="${esc(c)}"${n ? "" : " disabled"}>${esc(label)} <small>${n}</small></button>`;
  $("#cats").innerHTML = chip("", "Tout", list.length) + cats.map(c => chip(c, c, count(c))).join("");
  $("#nSell").textContent = `(${S.ours.filter(s => s.type === "sell").length})`;
  $("#nBuy").textContent = `(${S.ours.filter(s => s.type === "buy").length})`;
}

function cmpLine(s) {
  const c = s.cmp, u = unit(s);
  if (c.verdict === "variante") return { cls: "", txt: "Prix non comparable" };
  if (s.type === "sell") {
    const lows = [c.min, c.hdvMin].filter(v => v != null);
    if (!lows.length) return { cls: "good", txt: "Personne d'autre n'en vend" };
    const low = Math.min(...lows);
    return { cls: u < low ? "good" : u > low ? "bad" : "", txt: `Ailleurs dès ${money(low)}` };
  }
  if (!c.n) return { cls: "good", txt: "Personne d'autre ne le rachète" };
  return { cls: u > c.max ? "good" : u < c.max ? "bad" : "", txt: `Ailleurs jusqu'à ${money(c.max)}` };
}

function shopCard(s) {
  const sell = s.type === "sell", out = s.remainingStock <= 0, u = unit(s);
  const pct = Math.min(100, s.remainingStock / Math.max(FULL_STOCK, s.remainingStock) * 100);
  const barCls = out ? "zero" : s.remainingStock <= LOW_STOCK ? "low" : "";
  const stockTxt = sell
    ? (out ? `<span class="badge b-out">Rupture</span>` : `${num(s.remainingStock)} en stock`)
    : (out ? `<span class="badge b-out">Complet</span>` : `Encore ${num(s.remainingStock)}`);
  const cmp = cmpLine(s), inCart = S.cart[s.id];
  return `
  <article class="card panel${out ? " out" : ""}">
    <div class="card-top">
      <span class="slot">${icon(s.material)}</span>
      <div class="card-badges">${s.promo ? `<span class="badge b-promo">${esc(s.promo)}</span>` : ""}${publicBadge(s)}</div>
    </div>
    <h4 class="card-name">${esc(s.name)}</h4>
    ${s.note ? `<p class="card-note">${esc(s.note)}</p>` : ""}
    <div class="card-price"><b>${money(u)}</b><small>/ unité</small></div>
    <div class="card-stack">x64 : <b>${money(u * 64)}</b></div>
    <div class="card-cmp tip ${cmp.cls}" tabindex="0" data-tip="${esc(compareTip(s))}">${esc(cmp.txt)}</div>
    <div class="card-foot">
      <div class="card-stock">${stockTxt}<div class="bar ${barCls}"><i style="width:${pct}%"></i></div></div>
      ${sell ? `<button class="add${inCart ? " in" : ""}" type="button" data-add="${esc(s.id)}" ${out ? "disabled" : ""} aria-label="${inCart ? "Retirer" : "Ajouter"} ${esc(s.name)} ${inCart ? "du" : "au"} panier" title="${inCart ? "Dans le panier (cliquer pour retirer)" : "Ajouter au panier"}">${inCart ? "✓" : "+"}</button>` : ""}
    </div>
  </article>`;
}

function renderShops() {
  const v = S.view;
  const sorters = {
    nom: (a, b) => a.name.localeCompare(b.name, "fr") || unit(a) - unit(b),
    prix: (a, b) => unit(a) - unit(b),
    "prix-desc": (a, b) => unit(b) - unit(a),
    stock: (a, b) => b.remainingStock - a.remainingStock,
  };
  const list = visibleShops(true).sort(sorters[v.sort]);
  $("#modeHint").textContent = v.mode === "sell"
    ? "Ce que tu peux acheter sur nos shops. Survole « Ailleurs dès » pour le détail des autres shops et de l'HDV."
    : "Ce qu'on te rachète : viens vendre tes items sur ces shops.";
  if (!list.length) { $("#shopList").innerHTML = `<p class="empty panel">Aucun shop ne correspond.</p>`; return; }
  $("#shopList").innerHTML = catOrder(new Set(list.map(s => s.cat))).map(c => {
    const g = list.filter(s => s.cat === c);
    // ruptures en fin de groupe
    const sorted = [...g.filter(s => s.remainingStock > 0), ...g.filter(s => s.remainingStock <= 0)];
    return `<section class="cat-group"><h3 class="cat-title">${esc(c)} <small>${g.length}</small></h3>
      <div class="cards">${sorted.map(shopCard).join("")}</div></section>`;
  }).join("");
}
function refreshList() { renderFilters(); renderShops(); }

// ---------- Aperçus de l'accueil ----------
function renderDeals() {
  const sells = S.ours.filter(s => s.type === "sell" && s.remainingStock > 0);
  const score = s => (s.cmp.verdict === "seul" ? 0.5 : s.cmp.ref ? unit(s) / s.cmp.ref : 1);   // plus c'est bas, meilleure est l'affaire
  let list = sells.filter(s => s.cmp.verdict === "moins" || s.cmp.verdict === "seul").sort((a, b) => score(a) - score(b));
  if (list.length < 4) list = [...list, ...sells.filter(s => !list.includes(s)).sort((a, b) => b.remainingStock - a.remainingStock)];
  $("#deals").innerHTML = list.length ? list.slice(0, 4).map(shopCard).join("") : `<p class="empty panel">Aucun shop en stock pour l'instant.</p>`;
}
function renderTeamPeek() {
  $("#teamPeek").innerHTML = C.fondateurs.map(f => {
    const p = S.players[f.pseudo], online = !!p?.seen?.online;
    return `
    <div class="peek-member panel">
      ${head(f.pseudo, 48)}
      <div class="peek-who"><b>${esc(f.pseudo)}</b>
        <div class="online"><span class="dot${online ? " on" : ""}"></span>${p ? (online ? "En ligne" : `Vu ${ago(p.seen?.lastSeenSecondsAgo ?? 0)}`) : "Profil introuvable"}</div>
      </div>
    </div>`;
  }).join("");
}
function refreshCards() {
  if ($("#shopList")) renderShops();
  if ($("#deals")) renderDeals();
}

// ---------- Panier ----------
function saveCart() { store.set("wc_cart", S.cart); }
// Chaque ligne garde un instantané (nom, prix…) pour s'afficher aussi sur les pages sans liste des prix
function loadCart() {
  const out = {};
  for (const [id, v] of Object.entries(store.get("wc_cart", {}) || {})) {
    if (typeof v === "number") { if (v > 0) out[String(id)] = { q: int(v) }; continue; }   // ancien format
    if (!v || typeof v !== "object" || !(int(v.q) > 0)) continue;
    out[String(id)] = { q: int(v.q), n: txt(v.n, 64), m: cleanMaterial(v.m), u: Math.max(0, Number(v.u) || 0), o: txt(v.o, 32), max: Math.max(1, int(v.max)) };
  }
  return out;
}
const snap = (s, q) => ({ q, n: s.name, m: s.material, u: unit(s), o: s.ownerName, max: Math.max(1, s.remainingStock) });
function addToCart(id) {
  const s = S.ours.find(x => x.id === id); if (!s) return;
  if (S.cart[id]) { delete S.cart[id]; toast(`${s.name} retiré du panier`); }
  else { S.cart[id] = snap(s, Math.min(64 * (s.stackAmount || 1), s.remainingStock)); toast(`${s.name} ajouté au panier`); }
  saveCart(); renderCart(); refreshCards();
}
// Avec des données fraîches : prix et stocks à jour, shops disparus oubliés
function syncCart() {
  if (!S.base.length) return;
  for (const [id, l] of Object.entries(S.cart)) {
    const s = S.ours.find(x => x.id === id);
    if (s) S.cart[id] = snap(s, Math.min(l.q, Math.max(1, s.remainingStock)));
    else delete S.cart[id];
  }
  saveCart();
}
const cartLines = () => Object.entries(S.cart).filter(([, l]) => l.n).map(([id, l]) => ({ id, ...l }));
function renderCart() {
  syncCart();
  const lines = cartLines();
  $("#cartCount").textContent = lines.length;
  $("#cartItems").innerHTML = lines.length ? lines.map(l => `
    <div class="cart-line">
      <span class="slot">${icon(l.m)}</span>
      <div class="nm">${esc(l.n)}<small>${money(l.u)} l'unité · ${esc(l.o)}</small></div>
      <input type="number" min="1" max="${l.max}" value="${int(l.q)}" data-qty="${esc(l.id)}" aria-label="Quantité de ${esc(l.n)}">
    </div>`).join("") : `<p class="hint">Ton panier est vide. Ajoute des items depuis <a href="/prix/">la liste des prix</a>.</p>`;
  $("#cartTotal").textContent = money(lines.reduce((a, l) => a + l.u * l.q, 0));
}
function cartText() {
  const lines = cartLines();
  const total = lines.reduce((a, l) => a + l.u * l.q, 0);
  return [`Commande Warp Cash :`, ...lines.map(l => `- ${num(l.q)} × ${l.n} (${money(l.u)}) = ${money(l.u * l.q)}`), `Total : ${money(total)}`].join("\n");
}

// ---------- Carte ----------
let map, layerShops, layerClusters;
function initMap() {
  if (map || !window.L) return;
  const CRS = L.extend({}, L.CRS.Simple, { transformation: new L.Transformation(1 / 128, 128, 1 / 128, 128) });
  map = L.map("map", { crs: CRS, minZoom: 0, maxZoom: 9, zoomSnap: 1, attributionControl: false });
  L.tileLayer(VK_TILES + "{z}/{x}/{y}.png?v=2026-10-11T10%3A49%3A34.970Z", {
    tileSize: 256, minZoom: 0, maxNativeZoom: 7, maxZoom: 9, noWrap: true,
    bounds: L.latLngBounds([-16384, -16384], [16384, 16384]),
  }).addTo(map);
  layerShops = L.layerGroup(); layerClusters = L.layerGroup().addTo(map);
  map.on("zoomend", syncMapLayers);
  map.setView([-7760, -900], 2);
  renderMap(true);
}
function syncMapLayers() {
  const detailed = map.getZoom() >= 6;
  if (detailed) { map.removeLayer(layerClusters); layerShops.addTo(map); }
  else { map.removeLayer(layerShops); layerClusters.addTo(map); }
}
function renderMap(fit) {
  if (!map || !S.ours.length) return;
  layerShops.clearLayers(); layerClusters.clearLayers();
  const shops = S.ours.filter(s => s.world === "world");
  // un marqueur par bloc (les shops collés sont regroupés dans la même bulle)
  const spots = new Map();
  for (const s of shops) {
    const k = `${Math.round(s.x / 2)}:${Math.round(s.z / 2)}`;
    if (!spots.has(k)) spots.set(k, []);
    spots.get(k).push(s);
  }
  for (const group of spots.values()) {
    const s0 = group[0], out = group.every(s => s.remainingStock <= 0);
    const ic = L.divIcon({ className: "", html: `<div class="pin${out ? " out" : ""}" style="width:32px;height:32px">${icon(s0.material)}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
    L.marker([s0.z + 0.5, s0.x + 0.5], { icon: ic, title: group.map(s => s.name).join(", ") })
      .bindPopup(popupHtml(group)).addTo(layerShops);
  }
  // une bulle par secteur pour les zooms éloignés
  const bySector = new Map();
  for (const s of shops) {
    const k = s.sector === "Hors secteur" ? `hors:${Math.round(s.x / 300)}:${Math.round(s.z / 300)}` : s.sector;
    if (!bySector.has(k)) bySector.set(k, []);
    bySector.get(k).push(s);
  }
  for (const group of bySector.values()) {
    const x = group.reduce((a, s) => a + s.x, 0) / group.length, z = group.reduce((a, s) => a + s.z, 0) / group.length;
    const size = 30 + Math.min(20, group.length);
    const ic = L.divIcon({ className: "", html: `<div class="cluster" style="width:${size}px;height:${size}px">${group.length}</div>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
    L.marker([z, x], { icon: ic, title: group[0].sector })
      .on("click", () => map.flyTo([z, x], group.length > 1 ? 7 : 8))
      .bindTooltip(`${esc(group[0].sector)} · ${group.length} shop${group.length > 1 ? "s" : ""}`, { direction: "top" })
      .addTo(layerClusters);
  }
  // vue de départ : les secteurs nommés (les shops isolés restent visibles en dézoomant)
  if (fit && shops.length) {
    const main = shops.filter(s => s.sector !== "Hors secteur");
    map.invalidateSize();
    map.fitBounds(L.latLngBounds((main.length ? main : shops).map(s => [s.z, s.x])), { padding: [60, 60], maxZoom: 5 });
  }
  syncMapLayers();
}
function popupHtml(group) {
  return group.map(s => `<div style="display:flex;gap:8px;align-items:center;margin:4px 0">
      ${icon(s.material, 24)}
      <div><b>${esc(s.name)}</b> · ${s.type === "sell" ? "vendu" : "racheté"} ${money(s.price)}<br>
      ${s.remainingStock > 0 ? (s.type === "sell" ? `${num(s.remainingStock)} en stock` : `encore ${num(s.remainingStock)}`) : "<span style='color:var(--red)'>vide</span>"} · ${esc(s.ownerName)}</div>
    </div>`).join("") + `<div style="color:var(--muted);margin-top:4px">X ${group[0].x} · Y ${group[0].y} · Z ${group[0].z}</div>`;
}

// ---------- Équipe ----------
function renderTeam() {
  $("#team").innerHTML = C.fondateurs.map(f => {
    const p = S.players[f.pseudo];
    const online = !!p?.seen?.online;
    const hours = p?.playtime ? Math.round(p.playtime.recordedSeconds / 3600) : null;
    return `
    <article class="member panel">
      <img class="skin" src="${bodySrc(f.pseudo)}" data-body="${esc(f.pseudo.toLowerCase())}" alt="Skin de ${esc(f.pseudo)}">
      <div>
        <h3>${esc(f.pseudo)}</h3>
        <span class="badge b-promo role">${esc(f.role)}</span>
        <div class="online"><span class="dot${online ? " on" : ""}"></span>${p ? (online ? "En ligne en ce moment" : `Hors ligne · vu ${ago(p.seen?.lastSeenSecondsAgo ?? 0)}`) : "Profil introuvable"}</div>
        ${p ? `<dl class="kv">
          <dt>Grade</dt><dd>Niveau ${num(p.serverlevel ?? 0)}</dd>
          <dt>Temps de jeu</dt><dd>${hours != null ? num(hours) + " h" : "—"}</dd>
          <dt>Argent</dt><dd>${money(p.money)}</dd>
          <dt>Recommandations</dt><dd>${esc(p.recommandation ?? "—")}</dd>
        </dl>` : ""}
      </div>
    </article>`;
  }).join("");
  $("#contact").innerHTML = `
    <h3>Nous contacter</h3>
    <p><b>Sur Discord</b>, ajoute l'un de nous en ami et envoie-nous un message (on ne répond pas en jeu) :</p>
    <div class="discord-list" data-discord></div>
    ${/^https:\/\//.test(C.discord) ? `<p><a class="btn btn-sm" href="${esc(C.discord)}" target="_blank" rel="noopener">Rejoindre le serveur Discord</a></p>` : ""}
    ${MAIL ? `<p><b>Par mail :</b> <a data-mail href="#"></a></p>` : ""}`;
  renderMail();
  renderDiscord();
}

// ---------- Pseudos Discord (boutons « copier », sans dire qui est qui) ----------
const DISCORD = (C.discordPseudos || []).map(String).filter(p => /^[\w.]{2,32}$/.test(p));
function renderDiscord() {
  document.querySelectorAll("[data-discord]").forEach(el => {
    el.innerHTML = DISCORD.length
      ? DISCORD.map(p => `<button class="cmdline" type="button" data-copy="${esc(p)}" title="Copier le pseudo Discord"><span>${esc(p)}</span><small>copier</small></button>`).join("")
      : "Discord bientôt disponible.";
  });
}

// ---------- Adresse mail (écrite ici pour ne pas être dans le HTML brut) ----------
const MAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(C.email || "") ? C.email : "";
function renderMail() {
  document.querySelectorAll("[data-mail]").forEach(a => {
    if (!MAIL) { a.replaceWith(document.createTextNode("en jeu uniquement pour l'instant")); return; }
    a.href = "mailto:" + MAIL;
    a.textContent = MAIL;
  });
}

// ---------- Classements ----------
const BOARD_INFO = {
  slimeeco_balance_value: ["Fortune", "item/gold_ingot"],
  level: ["Niveau", "item/experience_bottle"],
  statistic_hours_played: ["Heures de jeu", "item/clock_00"],
  slimedata_player_shopcouronnes: ["Couronnes", "item/gold_nugget"],
  slimebp_palier: ["Passe de combat", "item/map"],
  slimedata_player_recommandation: ["Recommandations", "item/emerald"],
  quests_completed: ["Quêtes terminées", "item/writable_book"],
  statistic_mob_kills: ["Mobs tués", "item/iron_sword"],
  statistic_player_kills: ["Joueurs tués", "item/diamond_sword"],
  statistic_fish_caught: ["Poissons pêchés", "item/cod"],
  statistic_hours_since_death: ["Heures sans mourir", "item/totem_of_undying"],
  statistic_kill_entity_ender_dragon: ["Ender Dragons tués", "item/dragon_breath"],
  skill_power: ["Puissance", "item/blaze_powder"],
  skill_donjon: ["Compétence donjon", "item/trial_key"],
  slimedata_player_donjonskills: ["Points de donjon", "item/ominous_trial_key"],
  slimedata_player_eventkill: ["Kills en event", "item/bow"],
  slimedata_player_slimeevents_chatgames_wins: ["Jeux du chat gagnés", "item/name_tag"],
  slimejobs_collection_levels_total: ["Collections (total)", "item/book"],
  slimejobs_collection_levels_farming: ["Collection fermier", "item/wheat"],
  slimejobs_collection_levels_mining: ["Collection mineur", "item/iron_pickaxe"],
  slimejobs_collection_levels_fighting: ["Collection combat", "item/stone_sword"],
  slimejobs_collection_levels_fishing: ["Collection pêche", "item/fishing_rod"],
  slimejobs_collection_levels_foraging: ["Collection bûcheron", "item/iron_axe"],
  slimejobs_collection_levels_enchanting: ["Collection enchanteur", "item/lapis_lazuli"],
  slimejobs_collection_levels_dungeon: ["Collection donjon", "item/trial_key"],
};
const GAME_NAMES = { combo: "Combo", deacoudre: "Dé à coudre", duel: "Duel", spleef: "Spleef", sumo: "Sumo", tnttag: "TNT Tag" };
const HOUSE_NAMES = { armurier: "Armurier", bucheron: "Bûcheron", chasseur: "Chasseur", enchanteur: "Enchanteur", fermier: "Fermier", mineur: "Mineur", pecheur: "Pêcheur" };
function boardInfo(id, apiName) {
  if (BOARD_INFO[id]) return BOARD_INFO[id];
  let m = id.match(/slimegames_(\w+?)_wins$/); if (m) return [`Victoires ${GAME_NAMES[m[1]] || m[1]}`, "item/golden_sword"];
  m = id.match(/house_(\w+?)_participations$/); if (m) return [`Maison ${HOUSE_NAMES[m[1]] || m[1]}`, "item/oak_door"];
  m = id.match(/cosmeticdust_(\w+)$/); if (m) return [`Poussière ${m[1]}`, "item/glowstone_dust"];
  return [apiName, "item/paper"];
}

let lbStarted = false;
async function loadBoards() {
  if (lbStarted) return; lbStarted = true;
  const cached = store.get("wc_boards", null);
  if (cached && Array.isArray(cached.rows) && Date.now() - cached.t < 3600e3) {
    renderBoards(cached.rows.map(r => ({ id: String(r.id), name: String(r.name), hits: (r.hits || []).map(cleanEntry) })), false);
    return;
  }
  const prog = $("#lbProgress"); prog.hidden = false;
  try {
    const list = [...((await api("/module/leaderboard/boards?limit=100"))?.boards || [])];
    const prio = id => (BOARD_INFO[id] ? Object.keys(BOARD_INFO).indexOf(id) : 100);
    list.sort((a, b) => prio(a.id) - prio(b.id));
    const rows = [];
    let done = 0;
    await Promise.all(list.map(async b => {
      const d = await api(`/module/leaderboard/boards/${encodeURIComponent(b.id)}/entries?limit=100`).catch(() => null);
      const hits = (Array.isArray(d?.entries) ? d.entries : []).map(cleanEntry).filter(e => isOurs(e.playerName));
      if (hits.length) { rows.push({ id: String(b.id), name: String(b.name), hits }); renderBoards(rows, true); }
      done++;
      $("#lbBar").style.width = `${done / list.length * 100}%`;
      $("#lbText").textContent = `Lecture des classements… ${done} / ${list.length}`;
    }));
    store.set("wc_boards", { t: Date.now(), rows });
    prog.hidden = true;
    renderBoards(rows, false);
  } catch (err) {
    console.error(err);
    $("#lbText").textContent = "Classements indisponibles pour le moment.";
  }
}
function renderBoards(rows, partial) {
  const best = r => Math.min(...r.hits.map(h => h.position));
  const sorted = [...rows].sort((a, b) => best(a) - best(b));
  $("#boards").innerHTML = sorted.map(r => {
    const [label, ico] = boardInfo(r.id, r.name);
    const lines = C.fondateurs.map(f => {
      const h = r.hits.find(x => x.playerName.toLowerCase() === f.pseudo.toLowerCase());
      return h
        ? `<div class="board-line">${head(f.pseudo, 20)}<span>${esc(f.pseudo)}<br><span class="score">${esc(h.formattedScore)}</span></span><span class="pos${h.position <= 3 ? " top3" : ""}">#${h.position}</span></div>`
        : `<div class="board-line none">${head(f.pseudo, 20)}<span>${esc(f.pseudo)}</span><span class="pos" style="color:var(--muted);font:600 13px var(--body)">hors top 100</span></div>`;
    }).join("");
    return `<div class="board panel"><h3><img src="${TEX + ico}.png" alt="">${esc(label)}</h3>${lines}</div>`;
  }).join("") || (partial ? "" : `<p class="empty panel">Aucun classement trouvé pour le moment.</p>`);
}

// ---------- Espace équipe ----------
// On entre avec son jeton GitHub : GitHub dit si le compte peut modifier le dépôt.
// Rien de secret n'est écrit dans le code du site, et l'état « connecté » ne vit qu'en mémoire.
const staffUnlocked = () => S.staff === true;
const ghHeaders = token => ({ Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" });
async function checkToken(token) {
  let r;
  try { r = await fetch(`https://api.github.com/repos/${C.github.depot}`, { headers: ghHeaders(token), cache: "no-store" }); }
  catch { return { ok: false, net: true, err: "Impossible de joindre GitHub. Réessaie dans un instant." }; }
  if (r.status === 401) return { ok: false, err: "Jeton refusé par GitHub (expiré ou mal copié)." };
  if (!r.ok) return { ok: false, err: "Ce jeton n'a pas accès au dépôt du site." };
  const repo = await r.json().catch(() => ({}));
  return repo.permissions?.push === true ? { ok: true } : { ok: false, err: "Ce compte ne peut pas modifier le dépôt du site." };
}
function loginError(t) { const p = $("#loginErr"); p.textContent = t; p.hidden = !t; }
async function login(token, remember, auto) {
  const btn = $("#lockForm button[type=submit]");
  btn.disabled = true; if (!auto) loginError("");
  const res = await checkToken(token);
  btn.disabled = false;
  if (!res.ok) {
    if (!res.net) tokenSet("");   // jeton enregistré mais refusé : on l'oublie
    loginError(auto ? "Ton jeton enregistré ne marche plus : " + res.err : res.err);
    return;
  }
  tokenSet(token, remember);
  S.staff = true; $("#ghLogin").value = ""; loginError(""); showStaff();
}
function logout() { tokenSet(""); S.staff = false; E.draft = null; E.dirty = false; showStaff(); }
function showStaff() {
  if (PAGE !== "gestion") return;
  const ok = staffUnlocked();
  $("#lockForm").hidden = ok; $("#dash").hidden = !ok; $("#editor").hidden = !ok;
  if (ok) { renderDash(); renderEditor(); } else setTimeout(() => $("#ghLogin").focus(), 50);
}
function renderDash() {
  if (!S.ours.length) { $("#dash").innerHTML = `<p class="loading">Chargement…</p>`; return; }
  const sells = S.ours.filter(s => s.type === "sell"), buys = S.ours.filter(s => s.type === "buy");
  const empty = S.ours.filter(s => s.remainingStock <= 0);
  const low = sells.filter(s => s.remainingStock > 0 && s.remainingStock <= LOW_STOCK);
  const pricey = S.ours.filter(s => ["plus", "moins-bien"].includes(s.cmp.verdict));
  const money2 = C.fondateurs.reduce((a, f) => a + (S.players[f.pseudo]?.money || 0), 0);
  const tile = (n, l) => `<div class="stat panel-dark"><b>${n}</b><span>${l}</span></div>`;
  const where = s => `${esc(s.sector)} · <span class="coord" data-copy="${s.x} ${s.y} ${s.z}">${s.x} ${s.y} ${s.z}</span>`;
  const todo = [...empty, ...low].sort((a, b) => a.remainingStock - b.remainingStock);
  $("#dash").innerHTML = `
  <div class="dash">
    <div class="dash-grid">
      ${tile(S.ours.length, "shops au total")}
      ${tile(empty.length, "vides ou complets")}
      ${tile(low.length, `stock bas (≤ ${LOW_STOCK})`)}
      ${tile(pricey.length, "prix à revoir")}
      ${tile(money(money2), "argent cumulé")}
    </div>
    <p class="muted">Données API du ${S.refreshed ? new Date(S.refreshed).toLocaleString("fr-FR") : "—"}. La page se met à jour toute seule toutes les 3 minutes.</p>

    <h3>À remplir / à vider</h3>
    <div class="panel table-wrap"><table class="table">
      <tr><th>Item</th><th>Type</th><th>Proprio</th><th class="num">Stock</th><th>Où</th></tr>
      ${todo.map(s => `<tr><td>${icon(s.material, 20)}${esc(s.name)}</td><td>${s.type === "sell" ? "Vente" : "Rachat"}</td><td>${esc(s.ownerName)}</td>
        <td class="num">${s.remainingStock <= 0 ? `<span class="badge b-out">${s.type === "sell" ? "Rupture" : "Complet"}</span>` : num(s.remainingStock)}</td><td>${where(s)}</td></tr>`).join("") || `<tr><td colspan="5">Rien à faire, tout est rempli.</td></tr>`}
    </table></div>

    <h3>Nos prix face au marché</h3>
    <div class="panel table-wrap"><table class="table">
      <tr><th>Item</th><th>Type</th><th class="num">Notre prix /u</th><th class="num">Médiane autres shops</th><th class="num">HDV dès</th><th>Verdict</th></tr>
      ${[...sells, ...buys].sort((a, b) => a.name.localeCompare(b.name, "fr")).map(s => `<tr>
        <td>${icon(s.material, 20)}${esc(s.name)}</td><td>${s.type === "sell" ? "Vente" : "Rachat"}</td>
        <td class="num">${money(unit(s))}</td>
        <td class="num">${s.cmp.med != null ? `${money(s.cmp.med)} <span class="muted">(${s.cmp.n})</span>` : "—"}</td>
        <td class="num">${s.cmp.hdvMin != null ? money(s.cmp.hdvMin) : "—"}</td>
        <td>${staffBadge(s)}</td></tr>`).join("")}
    </table></div>
  </div>`;
}

// ---------- Espace équipe : catégories, notes et promos des items ----------
// Les modifications sont faites sur un brouillon, puis écrites dans data/items.json
// sur GitHub avec un jeton personnel (GitHub Pages republie le site tout seul).
const E = { draft: null, dirty: false };
const TOKEN_KEY = "wc_gh_token";
const tokenGet = () => { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
function tokenSet(t, remember) {
  try {
    localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY);
    if (t) (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
  } catch { /* stockage indisponible */ }
}
const remembered = () => { try { return !!localStorage.getItem(TOKEN_KEY); } catch { return false; } };

function edStart() { E.draft = JSON.parse(JSON.stringify(S.items)); E.dirty = false; }
function edTouch() { E.dirty = true; const m = $("#edState"); if (m) { m.textContent = "Modifications non enregistrées"; m.classList.remove("ok"); } }
function edMaterials() {
  const names = new Map();
  for (const s of S.ours) if (!names.has(s.material)) names.set(s.material, s.name);
  return [...names].sort((a, b) => a[1].localeCompare(b[1], "fr"));
}

function renderEditor() {
  const box = $("#editor");
  if (!box || box.hidden) return;
  if (!S.ours.length) { box.innerHTML = ""; return; }
  if (!E.draft || !E.dirty) edStart();
  const d = E.draft, cats = d.categories;
  const opt = cur => cats.map(c => `<option${c === cur ? " selected" : ""}>${esc(c)}</option>`).join("");
  box.innerHTML = `
  <div class="dash">
    <h3>Catégories et textes des items</h3>
    <p class="muted">Change ce que tu veux, puis « Enregistrer sur le site » : tout le monde voit le changement 1 à 2 minutes plus tard.</p>

    <div class="ed-grid">
      <div class="panel ed-cats">
        <h4>Catégories <small class="muted">dans l'ordre d'affichage</small></h4>
        ${cats.map((c, i) => `
        <div class="ed-cat">
          <input class="field" value="${esc(c)}" maxlength="40" data-ed-rename="${i}" aria-label="Nom de la catégorie ${esc(c)}"${c === "Divers" ? ` disabled title="Catégorie par défaut, non modifiable"` : ""}>
          <button class="btn btn-sm" type="button" data-ed-move="${i}:-1" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
          <button class="btn btn-sm" type="button" data-ed-move="${i}:1" ${i === cats.length - 1 ? "disabled" : ""} aria-label="Descendre">↓</button>
          <button class="btn btn-sm" type="button" data-ed-del="${i}" ${c === "Divers" ? "disabled" : ""} aria-label="Supprimer ${esc(c)}">✕</button>
        </div>`).join("")}
        <form class="ed-cat" id="edAdd">
          <input class="field" id="edNew" maxlength="40" placeholder="Nouvelle catégorie" autocomplete="off">
          <button class="btn btn-sm" type="submit">Ajouter</button>
        </form>
        <p class="muted ed-help">Supprimer une catégorie range ses items dans « Divers ».</p>
      </div>

      <div class="panel ed-save">
        <h4>Enregistrer</h4>
        <button class="btn btn-accent" type="button" id="edSave">Enregistrer sur le site</button>
        <button class="btn btn-sm" type="button" id="edReset">Annuler mes changements</button>
        <p class="ed-state${E.dirty ? "" : " ok"}" id="edState" role="status">${E.dirty ? "Modifications non enregistrées" : "À jour"}</p>
        <p class="muted ed-help">Connecté avec ton jeton GitHub${remembered() ? ", retenu sur cet appareil" : " pour cet onglet"}. Ne le donne à personne.</p>
        <button class="btn btn-sm" type="button" id="edLogout">Se déconnecter</button>
      </div>
    </div>

    <div class="panel table-wrap"><table class="table ed-table">
      <tr><th>Item</th><th>Catégorie</th><th>Note <small>(sous le nom)</small></th><th>Promo <small>(badge)</small></th></tr>
      ${edMaterials().map(([m, name]) => {
        const it = d.items[m] || {};
        return `<tr>
          <td>${icon(m, 20)}${esc(name)}</td>
          <td><select class="field" data-ed-m="${m}" data-ed-f="categorie" aria-label="Catégorie de ${esc(name)}">${opt(it.categorie || "Divers")}</select></td>
          <td><input class="field" data-ed-m="${m}" data-ed-f="note" maxlength="80" value="${esc(it.note || "")}" aria-label="Note de ${esc(name)}"></td>
          <td><input class="field ed-promo" data-ed-m="${m}" data-ed-f="promo" maxlength="20" value="${esc(it.promo || "")}" placeholder="ex. -20 %" aria-label="Promo de ${esc(name)}"></td>
        </tr>`;
      }).join("")}
    </table></div>
  </div>`;
}

function edSetField(m, f, v) {
  const d = E.draft, it = { ...(d.items[m] || {}) };
  v = txt(v, f === "categorie" ? 40 : f === "note" ? 80 : 20);
  if (v && !(f === "categorie" && v === "Divers")) it[f] = v; else delete it[f];
  if (Object.keys(it).length) d.items[m] = it; else delete d.items[m];
  edTouch();
}
function edRenameCat(i, name) {
  const d = E.draft, old = d.categories[i];
  name = txt(name, 40);
  if (!name || name === old || old === "Divers") { renderEditor(); return; }
  if (d.categories.includes(name)) { toast("Cette catégorie existe déjà"); renderEditor(); return; }
  d.categories[i] = name;
  for (const it of Object.values(d.items)) if (it.categorie === old) it.categorie = name;
  edTouch(); renderEditor();
}
function edDelCat(i) {
  const d = E.draft, c = d.categories[i];
  if (c === "Divers") return;
  d.categories.splice(i, 1);
  for (const [m, it] of Object.entries(d.items)) if (it.categorie === c) { delete it.categorie; if (!Object.keys(it).length) delete d.items[m]; }
  edTouch(); renderEditor();
}
function edMoveCat(i, dir) {
  const c = E.draft.categories, j = i + dir;
  if (j < 0 || j >= c.length) return;
  [c[i], c[j]] = [c[j], c[i]];
  edTouch(); renderEditor();
}

const b64 = str => { let bin = ""; for (const b of new TextEncoder().encode(str)) bin += String.fromCharCode(b); return btoa(bin); };
async function edSave() {
  const msg = t => { $("#edState").textContent = t; };
  const token = tokenGet();
  if (!token) { logout(); return; }
  const g = C.github, url = `https://api.github.com/repos/${g.depot}/contents/${g.fichier}`;
  const headers = ghHeaders(token);
  $("#edSave").disabled = true; msg("Enregistrement…");
  try {
    const cur = await fetch(`${url}?ref=${encodeURIComponent(g.branche)}`, { headers, cache: "no-store" });
    if (cur.status === 401) throw new Error("Jeton refusé par GitHub (expiré ou mal copié).");
    if (cur.status === 403 || cur.status === 404) throw new Error("Ce jeton n'a pas accès au dépôt du site.");
    if (!cur.ok) throw new Error(`GitHub répond ${cur.status}.`);
    const { sha } = await cur.json();
    const data = cleanItems(E.draft);
    const body = {
      message: "Items mis à jour depuis l'Espace équipe",
      content: b64(JSON.stringify(data, null, 2) + "\n"),
      sha, branch: g.branche,
      committer: { name: "Warp Cash", email: g.email },
    };
    const r = await fetch(url, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 403 || r.status === 404) throw new Error("Ce jeton ne peut pas écrire sur le dépôt (droit « Contents : Read and write »).");
    if (r.status === 409 || r.status === 422) throw new Error("Le fichier a changé entre-temps. Recharge la page puis recommence.");
    if (!r.ok) throw new Error(`GitHub répond ${r.status}.`);
    S.items = data; S.itemsLock = Date.now() + 5 * 60e3;
    E.dirty = false;
    enrich(); renderDash(); renderEditor();
    msg("Enregistré ! Visible pour tout le monde dans 1 à 2 minutes."); $("#edState").classList.add("ok");
    toast("Enregistré sur le site");
  } catch (err) {
    msg(err.message || "Impossible de joindre GitHub.");
  } finally {
    const b = $("#edSave"); if (b) b.disabled = false;
  }
}

function bindEditor() {
  const box = $("#editor");
  box.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.edM) edSetField(t.dataset.edM, t.dataset.edF, t.value);
    else if (t.dataset.edRename !== undefined) edRenameCat(+t.dataset.edRename, t.value);
  });
  box.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.edMove) { const [i, dir] = t.dataset.edMove.split(":").map(Number); edMoveCat(i, dir); }
    else if (t.dataset.edDel !== undefined) edDelCat(+t.dataset.edDel);
    else if (t.id === "edSave") edSave();
    else if (t.id === "edReset") { E.dirty = false; renderEditor(); }
    else if (t.id === "edLogout" && (!E.dirty || confirm("Tes modifications non enregistrées seront perdues. Se déconnecter ?"))) logout();
  });
  box.addEventListener("submit", e => {
    if (e.target.id !== "edAdd") return;
    e.preventDefault();
    const name = txt($("#edNew").value, 40), c = E.draft.categories;
    if (!name) return;
    if (c.includes(name)) { toast("Cette catégorie existe déjà"); return; }
    c.splice(Math.max(0, c.indexOf("Divers")), 0, name);
    edTouch(); renderEditor();
  });
  window.addEventListener("beforeunload", e => { if (E.dirty && staffUnlocked()) e.preventDefault(); });
}

// ---------- Menu ☰ (téléphone) ----------
function bindMenu() {
  const bar = $("#topbar"), btn = $("#menuBtn");
  if (!bar || !btn) return;
  const set = open => {
    bar.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  };
  btn.addEventListener("click", () => set(!bar.classList.contains("open")));
  document.addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  document.addEventListener("click", e => { if (!bar.contains(e.target)) set(false); });
}

// ---------- Événements ----------
function bind() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-copy],[data-add],[data-zone],[data-cat],[data-sort],.seg-btn");
    if (!t) return;
    if (t.dataset.copy) copy(t.dataset.copy.trim());
    else if (t.dataset.add) addToCart(t.dataset.add);
    else if (t.dataset.zone) openZone(+t.dataset.zone);
    else if (t.dataset.cat !== undefined) { S.view.cat = t.dataset.cat; refreshList(); }
    else if (t.dataset.sort) {
      document.querySelectorAll("[data-sort]").forEach(b => b.classList.toggle("on", b === t));
      S.view.sort = t.dataset.sort; renderShops();
    } else if (t.classList.contains("seg-btn")) {
      document.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("on", b === t));
      S.view.mode = t.dataset.mode; refreshList();
    }
  });
  $("#zonesGrid")?.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset.zone) openZone(+e.target.dataset.zone); });
  $("#q")?.addEventListener("input", e => { S.view.q = e.target.value; refreshList(); });
  $("#hideEmpty")?.addEventListener("change", e => { S.view.hideEmpty = e.target.checked; refreshList(); });

  $("#cartBtn").addEventListener("click", () => { $("#cart").hidden = !$("#cart").hidden; });
  $("#cartClose").addEventListener("click", () => { $("#cart").hidden = true; });
  $("#cartClear").addEventListener("click", () => { S.cart = {}; saveCart(); renderCart(); refreshCards(); });
  $("#cartCopy").addEventListener("click", () => cartLines().length ? copy(cartText(), "Liste") : toast("Le panier est vide"));
  $("#cartItems").addEventListener("change", e => {
    const l = S.cart[e.target.dataset.qty]; if (!l) return;
    const v = Math.max(1, Math.min(l.max || 1, Math.round(+e.target.value || 1)));
    l.q = v; e.target.value = v; saveCart(); renderCart();
  });

  $("#lbClose").addEventListener("click", () => $("#lightbox").close());
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") $("#lightbox").close(); });

  $("#lockForm")?.addEventListener("submit", e => {
    e.preventDefault();
    const token = $("#ghLogin").value.trim();
    if (!token) { loginError("Colle ton jeton GitHub."); $("#ghLogin").focus(); return; }
    login(token, $("#ghLoginRemember").checked, false);
  });
  if (PAGE === "gestion") {
    bindEditor();
    const saved = tokenGet();
    if (saved) login(saved, remembered(), true);   // jeton déjà enregistré : on revérifie auprès de GitHub
  }
}

// ---------- Démarrage ----------
S.cart = loadCart();
loadSkins();
renderWarps();
renderZones();
renderMail();
renderDiscord();
bind();
bindMenu();
showStaff();
renderCart();
if (PAGE === "classements") loadBoards();
if (NEEDS[PAGE]) {
  loadAll(true);
  setInterval(() => { if (!document.hidden) loadAll(false); }, 180e3);
}

})();
