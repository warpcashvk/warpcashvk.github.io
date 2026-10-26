// =====================================================================
//  Thèmes de saison, chaque année :
//    Halloween : du 1er au 31 octobre
//    Noël      : du 1er novembre au 1er janvier inclus
//  Le reste du temps, thème classique. Les visiteurs peuvent couper le thème
//  avec le petit bouton en bas à gauche (retenu jusqu'à la saison suivante).
//  Pour tester : ajouter ?theme=halloween, ?theme=noel ou ?theme=classique à l'adresse.
// =====================================================================
(() => {
"use strict";

const TEX = "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21.1/assets/minecraft/textures/";
const SEASONS = {
  halloween: { nom: "Halloween", emoji: "🎃", splash: "Joyeux Halloween !", couleur: "#ff8c1a", logo: "block/jack_o_lantern" },
  noel: { nom: "Noël", emoji: "🎄", splash: "Joyeux Noël !", couleur: "#ff6b74", logo: "item/snowball" },
};

function season(d) {
  const m = d.getMonth();
  if (m === 9) return { id: "halloween", an: d.getFullYear() };
  if (m === 10 || m === 11) return { id: "noel", an: d.getFullYear() };
  if (m === 0 && d.getDate() === 1) return { id: "noel", an: d.getFullYear() - 1 };
  return null;
}

const forced = new URLSearchParams(location.search).get("theme");
let cur = season(new Date());
if (forced === "classique") cur = null;
else if (SEASONS[forced]) cur = { id: forced, an: new Date().getFullYear() };
if (!cur) return;

const S = SEASONS[cur.id], KEY = "wc_theme_off", stamp = `${cur.id}-${cur.an}`;
const root = document.documentElement;
const isOff = () => { try { return localStorage.getItem(KEY) === stamp; } catch { return false; } };
const setOff = off => { try { off ? localStorage.setItem(KEY, stamp) : localStorage.removeItem(KEY); } catch { /* stockage indisponible */ } };

// Posé tout de suite (script dans le <head>) pour éviter un flash du thème classique
if (!isOff()) root.dataset.theme = cur.id;

const saved = { splash: null, logo: null, color: null };
let fx = null;

function apply(on) {
  if (on) root.dataset.theme = cur.id; else delete root.dataset.theme;
  const splash = document.querySelector(".splash");
  if (splash) { saved.splash ??= splash.textContent; splash.textContent = on ? S.splash : saved.splash; }
  const logo = document.querySelector(".brand img");
  if (logo) { saved.logo ??= logo.src; logo.src = on ? TEX + S.logo + ".png" : saved.logo; }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) { saved.color ??= meta.content; meta.content = on ? S.couleur : saved.color; }
  const btn = document.querySelector(".season-toggle");
  if (btn) {
    btn.classList.toggle("off", !on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? `Couper le thème ${S.nom}` : `Remettre le thème ${S.nom}`;
    btn.setAttribute("aria-label", btn.title);
  }
  if (on && !fx) fx = startFx();
  if (!on && fx) { fx.stop(); fx = null; }
}

// ---------- Effet animé : neige (Noël) ou chauves-souris (Halloween) ----------
// Un bitmap par battement d'ailes ; « o » = yeux
const BAT = [
  ["X.........X", "XX.......XX", "XXXoXXXoXXX", ".XXXXXXXXX.", "...XXXXX...", "....X.X...."],
  ["...........", "....XXX....", ".XXoXXXoXX.", "XXXXXXXXXXX", "XX.XXXXX.XX", "X...X.X...X"],
];

function startFx() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const c = document.createElement("canvas");
  c.className = "season-fx"; c.setAttribute("aria-hidden", "true");
  document.body.append(c);
  const x = c.getContext("2d");
  let w = 0, h = 0, raf = 0, last = performance.now();
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = innerWidth; h = innerHeight;
    c.width = w * dpr; c.height = h * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener("resize", resize);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const snow = cur.id === "noel";
  const count = snow ? (w < 700 ? 45 : 90) : (w < 700 ? 4 : 8);
  const P = Array.from({ length: count }, () => snow
    ? { x: rnd(0, w), y: rnd(-h, h), s: Math.round(rnd(2, 5)), v: rnd(18, 55), a: rnd(.35, .9), ph: rnd(0, 6.3), sw: rnd(8, 26) }
    : newBat(true));
  function newBat(anywhere) {
    const dir = Math.random() < .5 ? 1 : -1;
    return { x: anywhere ? rnd(0, w) : dir > 0 ? -40 : w + 40, y: rnd(60, h * .7), dir, v: rnd(40, 90), ph: rnd(0, 6.3), px: w < 700 ? 2 : 3, flap: rnd(0, 1) };
  }
  function drawBat(b, t) {
    const frame = BAT[Math.floor(t * 7 + b.flap * 2) % 2], px = b.px;
    const ox = Math.round(b.x - 5.5 * px), oy = Math.round(b.y + Math.sin(t * 2 + b.ph) * 18);
    frame.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === ".") return;
      x.fillStyle = ch === "o" ? "#ffb347" : "#6b4a8a";
      x.fillRect(ox + (b.dir > 0 ? i : 10 - i) * px, oy + j * px, px, px);
    }));
  }
  function tick(now) {
    const dt = Math.min(.05, (now - last) / 1000), t = now / 1000;
    last = now;
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (snow) {
        p.y += p.v * dt;
        if (p.y > h + 10) { p.y = -10; p.x = rnd(0, w); }
        x.fillStyle = `rgba(255, 255, 255, ${p.a})`;
        x.fillRect(Math.round(p.x + Math.sin(t * .8 + p.ph) * p.sw), Math.round(p.y), p.s, p.s);
      } else {
        p.x += p.dir * p.v * dt;
        if (p.x < -60 || p.x > w + 60) P[i] = newBat(false);
        else drawBat(p, t);
      }
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return { stop() { cancelAnimationFrame(raf); removeEventListener("resize", resize); c.remove(); } };
}

// ---------- Bouton pour couper / remettre le thème ----------
function init() {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "season-toggle"; btn.textContent = S.emoji;
  btn.addEventListener("click", () => { const on = !root.dataset.theme; setOff(!on); apply(on); });
  document.body.append(btn);
  apply(!isOff());
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

})();
