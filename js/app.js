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

// ---------- Petits utilitaires ----------
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n, d = 0) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => (n == null ? "—" : (Math.abs(n) >= 1000 ? num(n) : num(n, 2)) + " " + C.monnaie);
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
    img.src = f.skin;
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
  all: [],        // tous les shops du serveur (pour comparer les prix)
  ours: [],       // nos shops, enrichis
  market: [],     // HDV, prix agrégés par item
  players: {},    // profils des fondateurs
  refreshed: null,
  view: { mode: "sell", q: "", cat: "", sort: "nom", hideEmpty: false },
  cart: Object.fromEntries(Object.entries(store.get("wc_cart", {}) || {}).map(([k, v]) => [String(k), int(v)]).filter(([, v]) => v > 0)),
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

function enrich() {
  S.ours = S.all.filter(s => isOurs(s.ownerName)).map(s => {
    const extra = C.items[s.material] || {};
    const o = { ...s, cat: extra.categorie || "Divers", note: extra.note || "", promo: extra.promo || "", sector: sector(s) };
    o.cmp = compare(o);
    return o;
  });
}

async function loadAll(first) {
  try {
    await Promise.all([loadShops(), loadMarket().catch(() => { S.market = []; }), loadPlayers()]);
    enrich();
    renderAll(first);
  } catch (err) {
    console.error(err);
    if (first) $("#shopList").innerHTML = `<div class="empty panel">Impossible de joindre l'API VikingCraft pour l'instant.<br><br><button class="btn" id="retry" type="button">Réessayer</button></div>`;
    $("#retry")?.addEventListener("click", () => { $("#shopList").innerHTML = `<p class="loading">Chargement des shops…</p>`; loadAll(true); });
  }
}

function renderAll(first) {
  renderHeroStats();
  renderFilters();
  renderShops();
  renderCart();
  renderTeam();
  renderMap();
  if (staffUnlocked()) renderDash();
  const t = S.refreshed ? new Date(S.refreshed) : new Date();
  $("#shopsUpdated").textContent = `Mis à jour à ${t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`;
  if (first && location.hash.length > 1) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

// ---------- Accueil ----------
function renderWarps() {
  $("#warps").innerHTML = C.warps.map(w =>
    `<button class="cmd" type="button" data-copy="${esc(w.commande)}"><div><code>${esc(w.commande)}</code><span>${esc(w.texte)} · cliquer pour copier</span></div></button>`).join("");
}
function renderHeroStats() {
  const sells = S.ours.filter(s => s.type === "sell");
  $("#stShops").textContent = num(S.ours.filter(s => s.remainingStock > 0).length);
  $("#stStock").textContent = num(sells.reduce((a, s) => a + s.remainingStock, 0));
  const online = C.fondateurs.filter(f => S.players[f.pseudo]?.seen?.online).length;
  $("#stOnline").textContent = `${online} / ${C.fondateurs.length}`;
  $("#stCheap").textContent = num(sells.filter(s => s.cmp.verdict === "moins" && s.remainingStock > 0).length);
}

// ---------- Zones ----------
function renderZones() {
  $("#zonesGrid").innerHTML = C.zones.map((z, i) => `
    <figure class="zone panel" tabindex="0" data-zone="${i}">
      <img src="${esc(z.image)}" alt="${esc(z.titre)}" loading="lazy">
      <figcaption><h3>${esc(z.titre)}</h3><p>${esc(z.texte)}</p></figcaption>
    </figure>`).join("");
}
function openZone(i) {
  const z = C.zones[i], dlg = $("#lightbox");
  $("#lbImg").src = z.image; $("#lbImg").alt = z.titre;
  $("#lbCap").textContent = `${z.titre} — ${z.texte}`;
  dlg.showModal();
}

// ---------- Liste des prix ----------
function renderFilters() {
  const cats = [...new Set(S.ours.map(s => s.cat))].sort((a, b) => a.localeCompare(b, "fr"));
  const sel = $("#cat"), cur = sel.value;
  sel.innerHTML = `<option value="">Toutes catégories</option>` + cats.map(c => `<option${c === cur ? " selected" : ""}>${esc(c)}</option>`).join("");
  $("#nSell").textContent = `(${S.ours.filter(s => s.type === "sell").length})`;
  $("#nBuy").textContent = `(${S.ours.filter(s => s.type === "buy").length})`;
}

function shopRow(s) {
  const sell = s.type === "sell", out = s.remainingStock <= 0;
  const pct = Math.min(100, s.remainingStock / Math.max(FULL_STOCK, s.remainingStock) * 100);
  const barCls = out ? "zero" : s.remainingStock <= LOW_STOCK ? "low" : "";
  const stockTxt = sell
    ? (out ? `<span class="badge b-out">Rupture</span>` : `${num(s.remainingStock)} en stock`)
    : (out ? `<span class="badge b-out">Complet</span>` : `Encore ${num(s.remainingStock)}`);
  const inCart = S.cart[s.id];
  return `
  <div class="row panel${out ? " out" : ""}">
    <span class="slot">${icon(s.material)}</span>
    <div class="row-main">
      <div class="row-name">${esc(s.name)} ${s.promo ? `<span class="badge b-promo">${esc(s.promo)}</span>` : ""} ${publicBadge(s)}</div>
      <div class="row-sub">
        <span>${head(s.ownerName)}${esc(s.ownerName)}</span>
        <span class="coord tip" tabindex="0" data-copy="${s.x} ${s.y} ${s.z}" data-tip="Cliquer pour copier les coordonnées">${esc(s.sector)} · ${s.x} ${s.y} ${s.z}</span>
      </div>
      ${s.note ? `<div class="row-note">${esc(s.note)}</div>` : ""}
    </div>
    <div class="row-price tip" tabindex="0" data-tip="${esc(compareTip(s))}">
      <b>${money(s.price)}</b><small>${s.stackAmount > 1 ? `les ${s.stackAmount}` : "l'unité"}</small>
    </div>
    <div class="row-stock">${stockTxt}<div class="bar ${barCls}"><i style="width:${pct}%"></i></div></div>
    <div class="row-act">${sell
      ? `<button class="btn btn-sm" type="button" data-add="${esc(s.id)}" ${out ? "disabled" : ""}>${inCart ? "✓ Panier" : "+ Panier"}</button>`
      : ""}</div>
  </div>`;
}

function renderShops() {
  const v = S.view, q = v.q.trim().toLowerCase();
  let list = S.ours.filter(s => s.type === v.mode
    && (!v.cat || s.cat === v.cat)
    && (!v.hideEmpty || s.remainingStock > 0)
    && (!q || s.name.toLowerCase().includes(q) || s.material.toLowerCase().includes(q) || s.ownerName.toLowerCase().includes(q)));
  const deal = s => s.cmp.ref ? unit(s) / s.cmp.ref * (s.type === "sell" ? 1 : -1) : (s.cmp.verdict === "seul" ? 0.5 : 1);
  const sorters = {
    nom: (a, b) => a.name.localeCompare(b.name, "fr") || unit(a) - unit(b),
    prix: (a, b) => unit(a) - unit(b),
    "prix-desc": (a, b) => unit(b) - unit(a),
    stock: (a, b) => b.remainingStock - a.remainingStock,
    affaire: (a, b) => deal(a) - deal(b),
  };
  list.sort(sorters[v.sort]);
  // ruptures en bas de liste
  list = [...list.filter(s => s.remainingStock > 0), ...list.filter(s => s.remainingStock <= 0)];
  $("#modeHint").textContent = v.mode === "sell"
    ? "Ce que tu peux acheter sur nos shops. Survole un prix pour le comparer au reste du serveur."
    : "Ce qu'on te rachète : viens vendre tes items sur ces shops.";
  $("#shopList").innerHTML = list.length ? list.map(shopRow).join("") : `<p class="empty panel">Aucun shop ne correspond.</p>`;
}

// ---------- Panier ----------
function saveCart() { store.set("wc_cart", S.cart); }
function addToCart(id) {
  const s = S.ours.find(x => x.id === id); if (!s) return;
  if (S.cart[id]) { delete S.cart[id]; toast(`${s.name} retiré du panier`); }
  else { S.cart[id] = Math.min(64 * (s.stackAmount || 1), s.remainingStock); toast(`${s.name} ajouté au panier`); }
  saveCart(); renderCart(); renderShops();
}
function cartLines() {
  return Object.entries(S.cart).map(([id, qty]) => ({ s: S.ours.find(x => x.id === id), qty })).filter(l => l.s);
}
function renderCart() {
  const lines = cartLines();
  // on oublie les shops qui ont disparu
  if (S.ours.length && lines.length !== Object.keys(S.cart).length) { S.cart = Object.fromEntries(lines.map(l => [l.s.id, l.qty])); saveCart(); }
  $("#cartCount").textContent = lines.length;
  $("#cartItems").innerHTML = lines.length ? lines.map(({ s, qty }) => `
    <div class="cart-line">
      <span class="slot">${icon(s.material)}</span>
      <div class="nm">${esc(s.name)}<small>${money(unit(s))} l'unité · ${esc(s.ownerName)}</small></div>
      <input type="number" min="1" max="${s.remainingStock}" value="${int(qty)}" data-qty="${esc(s.id)}" aria-label="Quantité de ${esc(s.name)}">
    </div>`).join("") : `<p class="hint">Ton panier est vide. Ajoute des items depuis la liste des prix.</p>`;
  $("#cartTotal").textContent = money(lines.reduce((a, l) => a + unit(l.s) * l.qty, 0));
}
function cartText() {
  const lines = cartLines();
  const total = lines.reduce((a, l) => a + unit(l.s) * l.qty, 0);
  return [`Commande Warp Cash :`, ...lines.map(l => `- ${num(l.qty)} × ${l.s.name} (${money(unit(l.s))}) = ${money(unit(l.s) * l.qty)}`), `Total : ${money(total)}`].join("\n");
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
    const cmd = online ? `/msg ${f.pseudo} ` : `/mail ${f.pseudo} `;
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
        <button class="cmdline" type="button" data-copy="${esc(cmd)}" title="Copier la commande"><span>${esc(cmd)}…</span><small>copier</small></button>
      </div>
    </article>`;
  }).join("");
  $("#contact").innerHTML = `
    <h3>Nous contacter</h3>
    <p><b>En jeu :</b> si on est en ligne, <code>/msg pseudo message</code>. Sinon, <code>/mail pseudo message</code>, on le lira à la connexion. Le bouton sous chaque fondateur te donne la bonne commande.</p>
    <p><b>Discord :</b> ${/^https:\/\//.test(C.discord) ? `<a class="btn btn-sm" href="${esc(C.discord)}" target="_blank" rel="noopener">Rejoindre le Discord</a>` : "lien bientôt disponible."}</p>`;
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
const staffUnlocked = () => { try { return sessionStorage.getItem("wc_staff") === "1"; } catch { return false; } };
const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
async function pbkdf2(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = Uint8Array.from(saltHex.match(/../g).map(h => parseInt(h, 16)));
  return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}
// Dans la console du site : await warpCash.nouveauMotDePasse("mon mot de passe")
// → affiche le bloc motDePasse à coller dans js/config.js
window.warpCash = {
  async nouveauMotDePasse(password) {
    const sel = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer), iterations = 600000;
    const bloc = { sel, iterations, empreinte: await pbkdf2(password, sel, iterations) };
    console.log("motDePasse: " + JSON.stringify(bloc, null, 2) + ",");
    return bloc;
  },
};
function showStaff() {
  const on = location.hash === "#gestion";
  $("#gestion").hidden = !on;
  if (!on) return;
  const ok = staffUnlocked();
  $("#lockForm").hidden = ok; $("#dash").hidden = !ok;
  if (ok) renderDash(); else setTimeout(() => $("#pw").focus(), 50);
  $("#gestion").scrollIntoView();
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

// ---------- Navigation : lien actif ----------
function watchSections() {
  const links = [...document.querySelectorAll("#nav a, #rail a")];
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main > section").forEach(s => io.observe(s));
  // carte et classements : chargés seulement quand on s'en approche
  const lazy = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      if (e.target.id === "carte") initMap();
      if (e.target.id === "classements") loadBoards();
      lazy.unobserve(e.target);
    }
  }, { rootMargin: "300px 0px" });
  lazy.observe($("#carte")); lazy.observe($("#classements"));
}

// ---------- Événements ----------
function bind() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-copy],[data-add],[data-zone],.seg-btn");
    if (!t) return;
    if (t.dataset.copy) copy(t.dataset.copy.trim());
    else if (t.dataset.add) addToCart(t.dataset.add);
    else if (t.dataset.zone) openZone(+t.dataset.zone);
    else if (t.classList.contains("seg-btn")) {
      document.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("on", b === t));
      S.view.mode = t.dataset.mode; renderShops();
    }
  });
  $("#zonesGrid").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.dataset.zone) openZone(+e.target.dataset.zone); });
  $("#q").addEventListener("input", e => { S.view.q = e.target.value; renderShops(); });
  $("#cat").addEventListener("change", e => { S.view.cat = e.target.value; renderShops(); });
  $("#sort").addEventListener("change", e => { S.view.sort = e.target.value; renderShops(); });
  $("#hideEmpty").addEventListener("change", e => { S.view.hideEmpty = e.target.checked; renderShops(); });

  $("#cartBtn").addEventListener("click", () => { $("#cart").hidden = !$("#cart").hidden; });
  $("#cartClose").addEventListener("click", () => { $("#cart").hidden = true; });
  $("#cartClear").addEventListener("click", () => { S.cart = {}; saveCart(); renderCart(); renderShops(); });
  $("#cartCopy").addEventListener("click", () => cartLines().length ? copy(cartText(), "Liste") : toast("Le panier est vide"));
  $("#cartItems").addEventListener("change", e => {
    const id = e.target.dataset.qty; if (!id) return;
    const s = S.ours.find(x => x.id === id);
    const v = Math.max(1, Math.min(s ? s.remainingStock : 1, Math.round(+e.target.value || 1)));
    S.cart[id] = v; e.target.value = v; saveCart(); renderCart();
  });

  $("#lbClose").addEventListener("click", () => $("#lightbox").close());
  $("#lightbox").addEventListener("click", e => { if (e.target.id === "lightbox") $("#lightbox").close(); });

  $("#lockForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!window.crypto?.subtle) { $("#pwErr").textContent = "Ouvre le site en https pour te connecter."; $("#pwErr").hidden = false; return; }
    const mdp = C.motDePasse, btn = e.submitter;
    if (btn) btn.disabled = true;
    const ok = await pbkdf2($("#pw").value, mdp.sel, mdp.iterations) === mdp.empreinte;
    if (btn) btn.disabled = false;
    if (ok) {
      try { sessionStorage.setItem("wc_staff", "1"); } catch { /* rien */ }
      $("#pw").value = ""; $("#pwErr").hidden = true; showStaff();
    } else { $("#pwErr").hidden = false; }
  });
  window.addEventListener("hashchange", showStaff);
}

// ---------- Démarrage ----------
loadSkins();
renderWarps();
renderZones();
bind();
watchSections();
showStaff();
loadAll(true);
setInterval(() => { if (!document.hidden) loadAll(false); }, 180e3);

})();
