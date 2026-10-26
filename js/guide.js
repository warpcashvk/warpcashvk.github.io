// Page guide : boutons « copier la commande »
(() => {
"use strict";

const toast = document.getElementById("toast");
let timer;
function show(msg) {
  toast.textContent = msg; toast.classList.add("show");
  clearTimeout(timer); timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

document.addEventListener("click", async e => {
  const t = e.target.closest("[data-copy]");
  if (!t) return;
  const text = t.dataset.copy;
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* rien */ } ta.remove();
  }
  show(`${text} copié !`);
});

})();
