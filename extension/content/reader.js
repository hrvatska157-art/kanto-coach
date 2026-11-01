/* Kanto Coach – Leser im Spiel-Frame (Version 1.3, geprüft gegen Spielversion 40)
 * Liest nur, was im Spiel SICHTBAR ist, und zwar sprachunabhängig:
 *   Shop-Karten   <button class="card c3 …"> mit dem Bild ./pk/thumb/<Pokédex-Nr>.webp
 *   Bank          .bench .slot[data-bench] mit Bild und Sternen (.pstars.s2)
 *   Item-Beutel   button.it-slot > img.it-ico (./pk/items/<id>.png), Anzahl ×n
 *   Level, Gold   .ec-lvinfo / .stat.gold (Zahl), Rückfall: Beschriftung
 *   Brett         .units2d > .unit2d (nur mit ausgerichteter Feld-Schablone)
 * Keine Spielvariablen, kein Netzwerk-Mitlesen, keine Automatik: Es wird nichts geklickt oder gekauft.
 * Markierungen und die Feld-Schablone liegen in einer eigenen Ebene über dem Spiel und lassen Klicks durch.
 */
(() => {
'use strict';
if (window.__kkCoachReader) return;
window.__kkCoachReader = true;

let map = null;            // { base, forms, names, items } vom Hintergrund
let marks = { shop: {}, items: {} };
let enabled = true;
let langSel = 'auto';
// Sprache der Schablonen-Texte: Einstellung oder wie das Spiel
function uiLang() { if (langSel === 'de' || langSel === 'en') return langSel; return /^de\b/i.test(document.documentElement.lang || navigator.language || '') ? 'de' : 'en'; }
let field = { show: false, edit: false };
let fieldUnits = [];
let calibs = {};
let last = '';
let timer = null;
const spr = {};

const TX = {
  de: { corners: ['Vorne links', 'Vorne rechts', 'Hinten links', 'Hinten rechts'], done: 'Fertig', reset: 'Zurücksetzen',
    help: 'Zieh die vier Punkte auf die Mitte der vier Eck-Felder DEINER Spielfeldhälfte (vorne = Reihe zum Gegner). Danach liegt die Platzierung genau auf dem Brett.' },
  en: { corners: ['Front left', 'Front right', 'Back left', 'Back right'], done: 'Done', reset: 'Reset',
    help: 'Drag the four dots onto the centre of the four corner hexes of YOUR half of the board (front = row facing the enemy). The placement then sits exactly on the board.' },
};

/* ---------- Geometrie des Spielbretts (wie im Spiel: 7 Spalten, versetzte Reihen) ---------- */
const SZ = 0.6, DX = Math.sqrt(3) * SZ, DZ = 1.5 * SZ;
// cell = Team-Code-Feld 0..27 (Reihe 0 = vorne). Im Spiel ist das Reihe 4..7 von 8.
function world(cell) { const R = 4 + Math.floor(cell / 7), c = cell % 7; return [(c + (R & 1) * 0.5 - 3.25) * DX, (R - 3.5) * DZ]; }
const CORNERS = [0, 6, 21, 27];
const DEF_PTS = [[0.39, 0.52], [0.61, 0.52], [0.378, 0.75], [0.645, 0.75]];
function solve(A, b) { // Gauß mit Pivot
  const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
    [M[i], M[p]] = [M[p], M[i]]; if (Math.abs(M[i][i]) < 1e-12) return null;
    for (let r = 0; r < n; r++) if (r !== i) { const f = M[r][i] / M[i][i]; for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = solve(A, b); return h ? [...h, 1] : null;
}
function apply(H, x, y) { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; }
function invert(m) {
  const [a, b, c, d, e, f, g, h, i] = m; const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C; if (Math.abs(det) < 1e-12) return null;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}
function calibKey() { return innerWidth + 'x' + innerHeight; }
function currentPts() {
  const k = calibKey(); if (calibs[k]) return { pts: calibs[k], exact: true };
  // nächstliegende gespeicherte Fenstergröße mit ähnlichem Seitenverhältnis nehmen
  let best = null, bd = Infinity; const ar = innerWidth / innerHeight;
  for (const [key, pts] of Object.entries(calibs)) { const [w, h] = key.split('x').map(Number); const d = Math.abs(w / h - ar) * 4 + Math.abs(w - innerWidth) / innerWidth; if (d < bd) { bd = d; best = pts; } }
  return best && bd < 0.6 ? { pts: best, exact: false } : { pts: DEF_PTS, exact: false, def: true };
}
function hom() {
  const { pts } = currentPts();
  const H = homography(CORNERS.map(world), pts.map(([fx, fy]) => [fx * innerWidth, fy * innerHeight]));
  return H;
}
function isCalibrated() { return Object.keys(calibs).length > 0; }

/* ---------- Markierungsebene ---------- */
// Nach einem Update die Ebene der alten Version entfernen; eine verwaiste (alte) Instanz zeichnet nichts mehr
document.querySelectorAll('#kk-coach-marks').forEach((e) => e.remove());
const orphan = () => { try { return !(chrome.runtime && chrome.runtime.id); } catch (e) { return true; } };
const layerHost = document.createElement('div');
layerHost.id = 'kk-coach-marks';
layerHost.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483645';
const layer = layerHost.attachShadow({ mode: 'open' });
layer.innerHTML = `<style>
  :host{all:initial}
  .ring{position:fixed;border-radius:14px;pointer-events:none;box-shadow:0 0 0 3px var(--c),0 0 18px 2px var(--c);animation:p 1.6s ease-in-out infinite}
  .ring.it{border-radius:10px}
  .ring.dash{box-shadow:none;border:2px dashed var(--c);animation:none;opacity:.8}
  .tag{position:fixed;transform:translate(-50%,-60%);pointer-events:none;background:var(--c);color:#14110a;font:800 11px/1 system-ui,sans-serif;letter-spacing:.04em;padding:4px 7px;border-radius:7px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.5)}
  .tag.it{font-size:9.5px;padding:3px 5px}
  .tag.unit{transform:translate(-50%,-100%);font-size:10.5px}
  .num{position:fixed;transform:translate(-45%,-45%);pointer-events:none;width:20px;height:20px;border-radius:50%;background:var(--c);color:#14110a;font:900 12px/20px system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2px #14110a,0 2px 6px rgba(0,0,0,.6)}
  .num.it{width:17px;height:17px;font-size:10.5px;line-height:17px}
  @keyframes p{50%{box-shadow:0 0 0 3px var(--c),0 0 26px 6px var(--c)}}
  svg{position:fixed;left:0;top:0;overflow:visible;pointer-events:none}
  .fu{position:fixed;transform:translate(-50%,-78%);display:flex;flex-direction:column;align-items:center;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}
  .fu img.mon{width:var(--s);height:var(--s);image-rendering:pixelated;opacity:.92}
  .fu.ok img.mon{opacity:.35}
  .fu b{font:800 9.5px/1.1 system-ui,sans-serif;color:#14110a;background:var(--c);border-radius:6px;padding:2px 5px;white-space:nowrap;margin-top:-4px}
  .fu .its{display:flex;gap:1px;margin-top:1px}.fu .its img{width:15px;height:15px;image-rendering:pixelated;background:rgba(17,20,29,.75);border-radius:4px}
  .h{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#ff5c4e;border:3px solid #fff;box-shadow:0 0 0 2px #ff5c4e,0 3px 10px rgba(0,0,0,.6);pointer-events:auto;cursor:grab;touch-action:none;display:grid;place-items:center;font:800 12px/1 system-ui;color:#fff}
  .h span{position:absolute;top:30px;left:50%;transform:translateX(-50%);background:#11141d;color:#edf0f6;font:700 11px/1 system-ui;padding:4px 6px;border-radius:6px;white-space:nowrap}
  .bar{position:fixed;left:50%;top:12px;transform:translateX(-50%);max-width:min(560px,92vw);background:rgba(17,20,29,.96);color:#edf0f6;border:1px solid #333d52;border-radius:12px;padding:10px 12px;font:13px/1.4 system-ui,sans-serif;pointer-events:auto;display:flex;gap:10px;align-items:center;box-shadow:0 8px 30px rgba(0,0,0,.5)}
  .bar button{font:700 12.5px system-ui;border:1px solid #3e485e;background:#1c2130;color:#edf0f6;border-radius:8px;padding:6px 11px;cursor:pointer;white-space:nowrap}
  .bar button.pri{background:#ff5c4e;border-color:#ff5c4e;color:#1a0806}
  @media (prefers-reduced-motion:reduce){.ring{animation:none}}
</style><svg id="fs"></svg><div id="fu"></div><div id="m"></div><div id="ed"></div>`;
const holder = layer.getElementById('m');
const fsvg = layer.getElementById('fs');
const fuel = layer.getElementById('fu');
const edel = layer.getElementById('ed');
function attachLayer() { if (!layerHost.isConnected && document.body) document.body.appendChild(layerHost); }
const COLORS = { target: '#f2bf45', upgrade: '#4fcb88', comp: '#8ab4ff', craft: '#f2bf45', use: '#8ab4ff', pick: '#f2bf45', pick2: '#c9cfdc', keep: '#8d95a8' };
const ST_COL = { ok: '#4fcb88', own: '#8ab4ff', shop: '#f2bf45', miss: '#c9cfdc' };

/* ---------- Lesen ---------- */
const RX_MON = /\/pk\/(?:thumb|art|icons|sd(?:\/back)?(?:\/shiny)?)\/(\d+)\.(?:webp|png|gif)/;
const RX_ITEM = /\/pk\/items\/([a-z0-9-]+)\.png/;
function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }
function srcOf(img) { return img ? (img.currentSrc || img.getAttribute('src') || img.src || '') : ''; }
function monNum(el) {
  for (const img of el.querySelectorAll('img')) { const m = RX_MON.exec(srcOf(img)); if (m) return +m[1]; }
  return 0;
}
function lineByName(label) {
  if (!map || !label) return null;
  const low = label.toLowerCase(); let best = null, bl = 0;
  for (const [n, id] of Object.entries(map.names)) { if (n.length > bl && low.includes(n) && new RegExp(`(^|[^\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'u').test(low)) { best = id; bl = n.length; } }
  return best;
}
function ownFromCard(b, label) {
  const cls = b.className || '';
  if (!/\b(owned|pair)\b/.test(cls)) return 0; // ohne diese Klassen besitzt du keine Kopie
  let own = 0;
  const tail = label.includes(';') ? label.slice(label.indexOf(';') + 1) : '';
  const two = /(\d+)[^\d★]*2\s*★[^\d]*(\d+)/.exec(tail);
  if (two) own = (+two[1]) * 3 + (+two[2]);
  else { const n = /(\d+)/.exec(tail); if (n && +n[1] < 9) own = +n[1]; }
  if (/\bm3\b/.test(cls)) own = Math.max(own, 8); else if (/\bm2\b/.test(cls)) own = Math.max(own, 2);
  if (!own) { const on = b.querySelectorAll('.cpips i.on').length; own = Math.max(1, /to3/.test((b.querySelector('.cpips') || {}).className || '') ? on * 3 : on); }
  return own;
}
function readShop() {
  const out = [];
  // Shop-Plätze in Reihenfolge: gekaufte Plätze sind „div.card.empty“ und bleiben als Lücke stehen,
  // damit die Positionen im Overlay zum Spiel-Shop passen
  const slots = document.querySelectorAll('.cards > .card.empty, .cards > .cardwrap');
  for (const s of (slots.length ? slots : document.querySelectorAll('button.card'))) {
    if (!visible(s)) continue;
    if (/\bempty\b/.test(s.className)) { out.push({ el: s, empty: true, num: 0, line: null, cost: 0, own: 0, merge: 0, owner: false, plan: false, name: '' }); continue; }
    const b = s.matches('button.card') ? s : s.querySelector('button.card'); if (!b) continue;
    const label = b.getAttribute('aria-label') || '';
    const num = monNum(b); const owner = !!b.querySelector('.c-trainer');
    // Figuren-Pokémon (Koga, Giovanni, Samurai) haben im Spiel die Bildnummer 9000 + Pokédex-Nr.
    let line = num && map ? ((owner && num < 9000 && map.base[9000 + num]) || map.base[num] || (map.forms[num] || [])[0] || null) : null;
    if (!line) line = lineByName(label);
    const cm = /\bc(\d)\b/.exec(b.className || ''); const cn = firstInt((b.querySelector('.ccost .num') || {}).textContent);
    // Typen der Karte: Symbol-Bild „types/<typ>-g.png“ (englische Typ-ID, sprachunabhängig). Im Turm (v41) kennt
    // data.json viele Pokémon nicht – Kosten, Typen und Name kommen dann nur von der Karte.
    const types = [...b.querySelectorAll('.ctraits .type-ico')].map((e) => (/types\/([a-z]+)-/.exec(e.getAttribute('style') || '') || [])[1]).filter(Boolean);
    const cname = ((b.querySelector('.cname') || {}).textContent || '').trim().slice(0, 30);
    // „plan“: Das Spiel markiert selbst Karten, die in seinem Planer stehen (z. B. nach „Code einfügen“)
    out.push({ el: b, num, line, cost: cn || (cm ? +cm[1] : 0), types, cname, own: ownFromCard(b, label), merge: (/\bmerge\b/.test(b.className || '') && +((/\bm(\d)\b/.exec(b.className) || [])[1] || 2)) || 0, owner, plan: /\bplan\b/.test(b.className || '') || !!b.querySelector('.c-plan'), name: label.replace(/\s*\(.*$/, '').slice(0, 60) });
  }
  return out.slice(0, 5);
}
function firstInt(s) { const m = /(\d+)/.exec(s || ''); return m ? +m[1] : null; }
// EP aus der Level-Anzeige: „Level 3: 3 Pokémon auf dem Feld, EP 4 von 8: 1 EP-Kauf bis zum Aufstieg“ -> Zahlen [Level, Plätze, EP, Ziel, Käufe]
// Planungsphase: Knopf „Kämpfen“ (Abenteuer/Turm, Freundesraum) oder die PvP-Uhr im Planungsmodus (.pt-timer.plan, z. B. Training ohne Bereit-Knopf)
function inPlanning() { return !!document.querySelector('button.fight') || !!document.querySelector('.pt-timer.plan'); }
function readXp() {
  for (const el of document.querySelectorAll('.ec-lvinfo')) {
    const n = (el.getAttribute('aria-label') || '').match(/\d+/g); if (n && n.length >= 5) return { xp: +n[2], next: +n[3], buys: +n[4] };
  }
  return null;
}
function readLevel() {
  for (const el of document.querySelectorAll('.ec-lvinfo')) if (visible(el)) { const v = firstInt(el.getAttribute('aria-label')) ?? firstInt((el.querySelector('.ec-lvnum') || {}).textContent); if (v != null) return v; }
  for (const el of document.querySelectorAll('[aria-label^="Level "],[aria-label^="Nivel "]')) if (visible(el)) { const m = /^\S+ (\d+)\s*:/.exec(el.getAttribute('aria-label')); if (m) return +m[1]; }
  return null;
}
function readGold() {
  for (const el of document.querySelectorAll('.stat.gold')) if (visible(el)) { const n = el.querySelector('.gnum .num, .num'); const v = firstInt(n ? n.textContent : '') ?? firstInt(el.getAttribute('aria-label')); if (v != null) return v; }
  for (const el of document.querySelectorAll('[aria-label^="Gold "],[aria-label^="Oro "]')) if (visible(el)) { const m = /^\S+ (\d+)\./.exec(el.getAttribute('aria-label')); if (m) return +m[1]; }
  return null;
}
// Zinsregel aus der Gold-Anzeige, sprachunabhängig über die Zahlenfolge:
// „Gold 5. Zinsen +0 pro Station (+1 pro 10 Gold, maximal +4) …“ -> [5, 0, 1, 10, 4, …]
function readInterest() {
  const el = document.querySelector('.stat.gold'); if (!el) return null;
  const nums = ((el.getAttribute('aria-label') || '').match(/\d+/g) || []).map(Number);
  return nums.length >= 5 && nums[2] === 1 && nums[3] >= 5 && nums[4] >= 1 && nums[4] <= 9 ? { step: nums[3], max: nums[4] } : null;
}
function readHp() { for (const el of document.querySelectorAll('.stat.hp')) if (visible(el)) { const v = firstInt((el.querySelector('.num') || el).textContent); if (v != null) return v; } return null; }
// Verankerte Form (v37): Das Bild zeigt eine frühere Form, als die Sterne erwarten lassen (z. B. Kokuna mit ★★★).
// Die Linie bleibt dieselbe; „anchor“ ist die Nummer der Form (0 = erste), wie in den IDs der Statistik („weedle-a1“).
function formOf(num, starHint) {
  if (!map || !num) return null;
  const f = map.forms[num]; if (!f) return null;
  const out = { line: f[0], star: starHint || f[1] };
  const fi = map.formIdx && map.formIdx[num];
  if (fi != null && starHint && starHint > f[1] && map.last && map.last[f[0]] !== num) out.anchor = fi;
  return out;
}
function readBench() {
  const out = [];
  for (const sl of document.querySelectorAll('.bench .slot.filled[data-bench]')) {
    if (sl.closest('.looking')) continue; // Bank eines anderen Spielers
    const num = monNum(sl); const st = sl.querySelector('.pstars'); const sm = st ? /\bs(\d)\b/.exec(st.className) : null;
    const f = formOf(num, sm ? +sm[1] : 0); if (f) out.push({ ...f, num });
  }
  return out;
}
// Eigene Pokémon auf dem Brett: Das Spiel hängt über jedes Pokémon eine Leiste .ubar.ally (eigene) bzw. .ubar.foe (Gegner)
// mit derselben data-uid wie das Sprite (.unit2d). Daraus kommen Linie (Bildnummer), Stern und getragene Items.
// Mit ausgerichteter Schablone wird zusätzlich das Feld bestimmt.
let foes = [];
function readBoard() {
  foes = [];
  const root = document.querySelector('.units2d'); if (!root) return null;
  const bars = {};
  for (const b of root.querySelectorAll('.ubar[data-uid]')) {
    const ps = b.querySelector('.pstars'); const sm = ps ? /\bs(\d)\b/.exec(ps.className) : null;
    // Getragene Items: v41 zeigt sie als <i class="uit" data-itip="<id>"> (Bild nur als CSS-Variable), ältere Versionen als <img>
    const items = [...b.querySelectorAll('.uitems [data-itip], .uitems img')].map((e) => (e.dataset && e.dataset.itip) || (RX_ITEM.exec(srcOf(e)) || [])[1]).filter(Boolean);
    bars[b.dataset.uid] = { ally: b.classList.contains('ally'), foe: b.classList.contains('foe'), star: sm ? +sm[1] : 0, items };
  }
  const H = isCalibrated() ? hom() : null; const Hi = H && invert(H);
  const out = []; const used = new Set(); foes = [];
  for (const u of root.querySelectorAll(':scope > .unit2d[data-uid]')) {
    if (u.style.display === 'none') continue;
    const bar = bars[u.dataset.uid]; if (!bar) continue;
    const img = u.querySelector('img'); if (!img) continue;
    const m = RX_MON.exec(srcOf(img)); if (!m) continue;
    // Gegner (Leiste .foe): nur Linie und Stern – fürs Abschätzen, was die anderen spielen (PvP: Pool, Typen)
    if (bar.foe) { const f = formOf(+m[1], bar.star || 0); if (f) foes.push({ line: f.line, star: f.star, num: +m[1] }); continue; }
    if (!bar.ally) continue;
    const f = formOf(+m[1], bar.star || 0); if (!f) continue;
    const e = { ...f, num: +m[1], items: bar.items };
    if (Hi) {
      const r = img.getBoundingClientRect();
      if (r.width >= 4) {
        const [wx, wz] = apply(Hi, r.left + r.width / 2, r.bottom - r.height * 0.14);
        let best = -1, bd = Infinity;
        for (let c = 0; c < 28; c++) { const [x, z] = world(c); const d = Math.hypot(x - wx, z - wz); if (d < bd) { bd = d; best = c; } }
        if (best >= 0 && bd <= 0.62 && !used.has(best)) { used.add(best); e.cell = best; }
      }
    }
    out.push(e);
  }
  return out;
}
let lastItems = null;
function readItems(planning) {
  const looking = [...document.querySelectorAll('.it-count')].some((e) => (e.textContent || '').includes('👁'));
  if (looking) return { items: lastItems, seen: false };
  const items = {}; let any = false; const seenSlots = new Set();
  for (const b of document.querySelectorAll('button.it-slot')) {
    if (b.closest('.it-queue') || !visible(b)) continue;
    const key = b.dataset.islot != null ? b.dataset.islot : null; if (key != null && seenSlots.has(key)) continue; if (key != null) seenSlots.add(key);
    const m = RX_ITEM.exec(srcOf(b.querySelector('img'))); if (!m) continue;
    const id = m[1]; const nEl = b.querySelector('.it-n'); const n = firstInt(nEl ? nEl.textContent : '') || firstInt((/×\s*(\d+)/.exec(b.getAttribute('aria-label') || '') || [])[1]) || 1;
    items[id] = (items[id] || 0) + n; any = true;
  }
  if (any) { lastItems = items; return { items, seen: true }; }
  // Beutel zugeklappt (kleine Fenster): Anzahl steht am Beutel, die Items selbst sind nicht sichtbar
  const bag = document.querySelector('.it-bag'); const cnt = bag ? firstInt((bag.querySelector('.num') || {}).textContent) : null;
  if (bag && visible(bag) && cnt) return { items: lastItems, seen: false, hidden: true, count: cnt };
  // Kein Item sichtbar und kein zugeklappter Beutel mit Zahl: Beutel ist leer (das Spiel blendet ihn dann aus)
  if (!planning) return { items: lastItems, seen: false };
  lastItems = {}; return { items: {}, seen: true };
}

/* Safari-Zone (Karussell im PvP, z. B. Runde 2-4/3-4): Karten mit Pokémon und Item, reihum wählen.
 * Vier Darstellungen je nach Spieleinstellung: button.sf3-mon (auf dem Brett), .sfv-card (SafariV2), .sft-card (Leiste), .sfs-card (Vollbild).
 * Gemeinsam: taken = schon weg, mine = deins, can = du darfst jetzt; Item-Bild in .<präfix>-item. */
const SAFARI_CARD = 'button.sf3-mon, button.sfv-card, button.sft-card, button.sfs-card';
function readSafari() {
  const btns = [...document.querySelectorAll(SAFARI_CARD)]; if (!btns.length) return null;
  const cards = btns.map((b) => {
    const num = monNum(b); const it = RX_ITEM.exec(srcOf(b.querySelector('.sf3-item img, .sfv-item img, .sft-item img, .sfs-item img')));
    const line = num && map ? (map.base[num] || (map.forms[num] || [])[0] || null) : null;
    return { line, num, item: it ? it[1] : null, taken: /\btaken\b/.test(b.className), mine: /\bmine\b/.test(b.className) };
  });
  return { cards, myTurn: !!document.querySelector('.sf3.my-turn, .sfv.me, .sft.me, .sfs.me'), done: !!document.querySelector('.sfv.done, .sft.done, .sfs.done'), got: !!document.querySelector('.sf3-tr.me.done') };
}

/* Item-Belohnung („Wähle eins!“): .modal.itemreward mit button.ir-card je Item (Bild .ir-ico img.it-ico) */
function readLoot() {
  const btns = [...document.querySelectorAll('.itemreward button.ir-card')]; if (!btns.length) return null;
  const items = btns.map((b) => { const m = RX_ITEM.exec(srcOf(b.querySelector('.ir-ico img, img'))); return m ? m[1] : null; });
  return { items, picked: btns.some((b) => /\bpicked\b/.test(b.className)) };
}
/* Siegel-Wahl („Wähle ein Siegel“): .sx-pick mit .sx-card > button.sx-take (aria-label „Name: Wirkung“ in Spielsprache) */
function readSeal() {
  const cards = [...document.querySelectorAll('.sx-pick .sx-card')]; if (!cards.length) return null;
  return { labels: cards.map((c) => { const b = c.querySelector('button.sx-take'); return b ? b.getAttribute('aria-label') || '' : ''; }), picked: cards.some((c) => /\bpicked\b/.test(c.className)) };
}
/* Partnerwahl („Wähle!“, Start von Abenteuer/Nuzlocke): button.sp-slot mit Pokémon-Bild, aria „Name, Typen“ */
function readStarter() {
  const btns = [...document.querySelectorAll('button.sp-slot')]; if (!btns.length) return null;
  return { cards: btns.map((b) => { const num = monNum(b); return { num, line: num && map ? (map.base[num] || (map.forms[num] || [])[0] || null) : null }; }) };
}
/* Segen des Turms: .modal.tboon mit button.ev-card.tb-card, Bild items/<art>.png (Sonderbonbon = rare-candy, Geschenk = das Item) */
function readBoon() {
  const btns = [...document.querySelectorAll('.tboon button.ev-card')]; if (!btns.length) return null;
  return { arts: btns.map((b) => { const m = RX_ITEM.exec(srcOf(b.querySelector('img'))); return m ? m[1] : null; }), labels: btns.map((b) => (b.getAttribute('aria-label') || '').split(':')[0].trim()), texts: btns.map((b) => b.getAttribute('aria-label') || b.textContent || ''), picked: btns.some((b) => /\bpicked\b/.test(b.className)),
    relic: !!document.querySelector('.tboon.trel') }; // Relikt-Wahl nach einem Wächter: gleiches Fenster, Klasse trel
}
/* Ereignis im Abenteuer („Prof. Eich“ u. a.): .modal.evround (ohne .tboon) mit button.ev-card – Item-Bild, Pokémon-Bild oder nur Symbol (🍬 = EP) */
function readEvent() {
  const btns = [...document.querySelectorAll('.evround:not(.tboon) button.ev-card')]; if (!btns.length) return null;
  return { cards: btns.map((b) => { const it = RX_ITEM.exec(srcOf(b.querySelector('img'))); const num = monNum(b);
    return { item: it ? it[1] : null, line: num && map ? (map.base[num] || (map.forms[num] || [])[0] || null) : null, xp: !it && !num && /🍬/.test(b.textContent || ''), label: (b.getAttribute('aria-label') || '').split(':')[0].trim() }; }),
    picked: btns.some((b) => /\bpicked\b/.test(b.className)) };
}
// Markierungen vom Overlay (ältere Form: nur Shop-Objekt)
function parseMarks(v) {
  v = v || {};
  return v.shop || v.items || v.safari || v.loot || v.seal || v.starter || v.btn || v.boon || v.field || v.event ? { shop: v.shop || {}, items: v.items || {}, safari: v.safari || null, loot: v.loot || null, seal: v.seal || null, starter: v.starter || null, boon: v.boon || null, event: v.event || null, field: v.field || null, btn: v.btn || {}, board: v.board || {} } : { shop: v, items: {} };
}

/* Spielmodus aus der Fortschrittsleiste oben: PvP-Runde, Kampagnen-Station oder Turm-Etage */
function readMode() {
  const tw = document.querySelector('.rtrack.tw');
  if (tw) return { mode: 'tower', stop: firstInt(tw.getAttribute('aria-label')) };
  const pt = document.querySelector('.rtrack.pt-track');
  if (pt) { const m = /(\d+)\s*-\s*(\d+)/.exec(pt.getAttribute('aria-label') || ''); return { mode: 'pvp', stage: m ? +m[1] : null, round: m ? +m[2] : null }; }
  for (const el of document.querySelectorAll('.rtrack[role="group"]')) {
    const parts = (el.getAttribute('aria-label') || '').split(' · ');
    // Abenteuer (v35+): Klasse „ph-<art>“ (gyms = Kanto mit 8 Orden) und Stufe .st-lv.lv1–3 = Normal/Veteran/Legende
    const ph = /\bph-([a-z0-9-]+)/.exec(el.className || ''); const lv = document.querySelector('.st-lv[class*="lv"]');
    const lm = lv ? /\blv(\d)\b/.exec(lv.className) : null;
    const extra = { adv: ph ? ph[1] : null, dif: lm ? +lm[1] : null, nz: !!document.querySelector('.nz-lives') }; // Nuzlocke: eigene Regeln (1 Kauf pro Shop)
    // „Titel · Ort · Station 7 von 38 · 2 von 8 Orden“ – die vorletzte Angabe ist die Station
    for (let i = parts.length - 2; i >= 0; i--) { const m = /(\d+)\D+(\d+)/.exec(parts[i]); if (m) return { mode: 'camp', stop: +m[1], total: +m[2], ...extra }; }
    return { mode: 'camp', stop: null, ...extra };
  }
  return null;
}

/* ---------- Zeichnen ---------- */
// mk: { kind, label, col?, n? } – col überschreibt die Farbe (Item-Paare), n ist eine Nummer im Kreis (Reihenfolge/Paar)
function ring(r, mk, cls = '') {
  const c = mk.col || COLORS[mk.kind] || COLORS.comp;
  const ringEl = document.createElement('div'); ringEl.className = 'ring ' + cls + (mk.dash ? ' dash' : ''); ringEl.style.setProperty('--c', c);
  Object.assign(ringEl.style, { left: r.left - 3 + 'px', top: r.top - 3 + 'px', width: r.width + 6 + 'px', height: r.height + 6 + 'px' });
  holder.append(ringEl);
  if (mk.label) { const tag = document.createElement('div'); tag.className = 'tag ' + cls; tag.style.setProperty('--c', c); tag.textContent = mk.label; Object.assign(tag.style, { left: r.left + r.width / 2 + 'px', top: r.top + 'px' }); holder.append(tag); }
  if (mk.n) { const n = document.createElement('div'); n.className = 'num ' + cls; n.style.setProperty('--c', c); n.textContent = mk.n; Object.assign(n.style, { left: r.left + 'px', top: r.top + 'px' }); holder.append(n); }
}
// Nur markieren, was wirklich oben liegt – nicht durch Menüs, Siegel-Auswahl oder andere Fenster des Spiels hindurch
function onTop(el) { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.4); return !!t && (t === el || el.contains(t)); }
function drawMarks(cards) {
  holder.textContent = '';
  if (!enabled) return;
  for (const c of cards) { const mk = c.line && marks.shop && marks.shop[c.line]; if (mk && onTop(c.el)) ring(c.el.getBoundingClientRect(), mk); }
  if (marks.items && Object.keys(marks.items).length) {
    const used = {}; // je Item-ID: wie viele Marken schon vergeben (Liste = eine Marke je Platz, z. B. zwei gleiche Komponenten)
    for (const b of document.querySelectorAll('button.it-slot')) {
      if (b.closest('.it-queue') || !visible(b)) continue;
      const m = RX_ITEM.exec(srcOf(b.querySelector('img'))); const v = m && marks.items[m[1]]; if (!v) continue;
      const i = used[m[1]] || 0; used[m[1]] = i + 1; const mk = Array.isArray(v) ? v[i] : v;
      if (mk && onTop(b)) ring(b.getBoundingClientRect(), mk, 'it');
    }
  }
  // Safari-Zone: Empfehlung direkt an der Karte (Index wie im Spiel)
  if (marks.safari) document.querySelectorAll(SAFARI_CARD).forEach((b, i) => { const mk = marks.safari[i]; if (mk && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); });
  if (marks.event) document.querySelectorAll('.evround:not(.tboon) button.ev-card').forEach((b, i) => { const mk = marks.event[i]; if (mk && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); });
  if (marks.boon) document.querySelectorAll('.tboon button.ev-card').forEach((b, i) => { const mk = marks.boon[i]; if (mk && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); });
  if (marks.starter) document.querySelectorAll('button.sp-slot').forEach((b, i) => { const mk = marks.starter[i]; if (mk && visible(b)) ring(b.getBoundingClientRect(), mk); });
  // Knöpfe „EP kaufen“ / „Neu würfeln“, wenn der Coach genau das rät
  for (const [k, sel] of [['xp', '.btn-lvl'], ['roll', '.btn-roll']]) { const mk = marks.btn && marks.btn[k]; const b = mk && document.querySelector(sel); if (b && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); }
  if (marks.seal) document.querySelectorAll('.sx-pick .sx-card').forEach((c, i) => { const mk = marks.seal[i]; const b = c.querySelector('button.sx-take') || c; if (mk && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); });
  if (marks.loot) document.querySelectorAll('.itemreward button.ir-card').forEach((b, i) => { const mk = marks.loot[i]; if (mk && visible(b) && onTop(b)) ring(b.getBoundingClientRect(), mk); });
  // Aufstellung: Bank-Pokémon, das aufs Feld soll („AUFS FELD“ / „1 REIN“), und Pokémon auf dem Brett, das dafür raus soll („1 RAUS“)
  if (marks.field) {
    const fin = marks.field.in || {}; const fout = marks.field.out || {}; const doneIn = new Set();
    for (const sl of document.querySelectorAll('.bench .slot.filled[data-bench]')) {
      if (sl.closest('.looking') || !visible(sl)) continue;
      const st = sl.querySelector('.pstars'); const sm = st ? /\bs(\d)\b/.exec(st.className) : null; const f = formOf(monNum(sl), sm ? +sm[1] : 0);
      const mk = f && (fin[f.line] || (marks.field.sell || {})[f.line]); if (!mk || doneIn.has(f.line) || !onTop(sl)) continue; doneIn.add(f.line); ring(sl.getBoundingClientRect(), mk, 'it');
    }
    const root = document.querySelector('.units2d');
    if (root && Object.keys(fout).length) {
      const done = new Set();
      for (const bar of root.querySelectorAll('.ubar.ally[data-uid]')) {
        const u = root.querySelector(':scope > .unit2d[data-uid="' + bar.dataset.uid + '"] img'); const m = u && RX_MON.exec(srcOf(u)); const f = m && formOf(+m[1], 0);
        const mk = f && fout[f.line]; if (!mk || done.has(f.line)) continue; done.add(f.line);
        const r = bar.getBoundingClientRect(); if (r.width < 2) continue;
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (top && top.closest('.modal, [role="dialog"]')) continue;
        const tag = document.createElement('div'); tag.className = 'tag unit'; tag.style.setProperty('--c', mk.col || COLORS.keep); tag.textContent = mk.label; Object.assign(tag.style, { left: r.left + r.width / 2 + 'px', top: r.top - 26 + 'px' }); holder.append(tag);
      }
    }
  }
  // Brett: wer ein fertiges Item bekommen soll – Hinweis über der Lebensleiste des eigenen Pokémon
  if (marks.board && Object.keys(marks.board).length) {
    const root = document.querySelector('.units2d'); if (!root) return; const done = new Set();
    for (const bar of root.querySelectorAll('.ubar.ally[data-uid]')) {
      const u = root.querySelector(':scope > .unit2d[data-uid="' + bar.dataset.uid + '"] img'); const m = u && RX_MON.exec(srcOf(u)); const f = m && formOf(+m[1], 0);
      const mk = f && marks.board[f.line]; if (!mk || done.has(f.line)) continue; done.add(f.line);
      const r = bar.getBoundingClientRect(); if (r.width < 2) continue;
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (top && top.closest('.modal, [role="dialog"]')) continue; // nicht durch Fenster des Spiels hindurch
      const tag = document.createElement('div'); tag.className = 'tag unit'; tag.style.setProperty('--c', mk.col || COLORS.use); tag.textContent = mk.label; Object.assign(tag.style, { left: r.left + r.width / 2 + 'px', top: r.top - 6 + 'px' }); holder.append(tag);
    }
  }
}
const SVGNS = 'http://www.w3.org/2000/svg';
function hexPts(H, cell, scale = 0.94) {
  const [cx, cz] = world(cell); const pts = [];
  for (let k = 0; k < 6; k++) { const a = Math.PI / 180 * (60 * k + 30); pts.push(apply(H, cx + SZ * scale * Math.cos(a), cz + SZ * scale * Math.sin(a))); }
  return pts;
}
async function sprites(keys) {
  const want = keys.filter((k) => spr[k] == null); if (!want.length) return;
  want.forEach((k) => { spr[k] = ''; });
  try { const r = await chrome.runtime.sendMessage({ type: 'sprites', list: want.map((k) => { const [kind, name] = k.split(':'); return { kind, name }; }) }); if (r && r.ok) Object.assign(spr, r.sprites); } catch (e) {}
  drawField();
}
let dragging = false;
function drawField(keepEditor) {
  fsvg.textContent = ''; fuel.textContent = ''; if (!keepEditor) edel.textContent = '';
  if (!enabled || !(field.show || field.edit)) return;
  const H = hom(); if (!H) return;
  fsvg.setAttribute('width', innerWidth); fsvg.setAttribute('height', innerHeight);
  const byCell = {}; for (const u of fieldUnits) byCell[u.cell] = u;
  for (let c = 0; c < 28; c++) {
    const u = byCell[c]; const p = document.createElementNS(SVGNS, 'polygon');
    p.setAttribute('points', hexPts(H, c).map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' '));
    const col = u ? ST_COL[u.st] || ST_COL.miss : '#ffffff';
    p.setAttribute('fill', u ? col : 'none'); p.setAttribute('fill-opacity', u ? (u.st === 'ok' ? '0.18' : '0.3') : '0');
    p.setAttribute('stroke', col); p.setAttribute('stroke-opacity', u ? '0.95' : (field.edit ? '0.7' : '0.25')); p.setAttribute('stroke-width', u ? '2.5' : '1.2');
    if (u && u.st !== 'ok') p.setAttribute('stroke-dasharray', u.st === 'miss' ? '5 4' : '');
    fsvg.appendChild(p);
  }
  const need = [];
  for (const u of fieldUnits) {
    const [cx, cz] = world(u.cell); const [x, y] = apply(H, cx, cz);
    const [x2] = apply(H, cx + DX, cz); const s = Math.max(28, Math.min(84, Math.abs(x2 - x) * 0.9));
    const el = document.createElement('div'); el.className = 'fu ' + u.st; el.style.setProperty('--c', ST_COL[u.st] || ST_COL.miss); el.style.setProperty('--s', s + 'px');
    Object.assign(el.style, { left: x + 'px', top: y + 'px' });
    const k = 'pokemon:' + u.dex; need.push(k);
    if (u.st !== 'ok') { const im = document.createElement('img'); im.className = 'mon'; if (spr[k]) im.src = spr[k]; im.alt = ''; el.appendChild(im); }
    const b = document.createElement('b'); b.textContent = (u.st === 'ok' ? '✓ ' : '') + u.name + (u.star > 1 ? ' ' + '★'.repeat(u.star) : ''); el.appendChild(b);
    if (u.items && u.items.length && u.st !== 'ok') { const its = document.createElement('div'); its.className = 'its'; for (const id of u.items.slice(0, 3)) { const ik = 'gameitem:' + id; need.push(ik); const im = document.createElement('img'); if (spr[ik]) im.src = spr[ik]; im.alt = ''; its.appendChild(im); } el.appendChild(its); }
    fuel.appendChild(el);
  }
  sprites(need);
  if (field.edit && !keepEditor) drawEditor();
}
function drawEditor() {
  const tx = TX[uiLang()] || TX.de; const { pts } = currentPts();
  const bar = document.createElement('div'); bar.className = 'bar';
  bar.innerHTML = `<span></span><button class="pri" data-a="done"></button><button data-a="reset"></button>`;
  bar.querySelector('span').textContent = tx.help; bar.querySelector('[data-a=done]').textContent = tx.done; bar.querySelector('[data-a=reset]').textContent = tx.reset;
  bar.addEventListener('click', (e) => {
    const a = e.target.closest('button'); if (!a) return;
    if (a.dataset.a === 'done') { saveCalib(currentPts().pts); setField({ edit: false, show: true }); }
    if (a.dataset.a === 'reset') { delete calibs[calibKey()]; saveCalibs(); drawField(); }
  });
  edel.appendChild(bar);
  pts.forEach(([fx, fy], i) => {
    const h = document.createElement('div'); h.className = 'h'; h.textContent = String(i + 1);
    const lab = document.createElement('span'); lab.textContent = tx.corners[i]; h.appendChild(lab);
    Object.assign(h.style, { left: fx * innerWidth + 'px', top: fy * innerHeight + 'px' });
    h.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
      const cur = currentPts().pts.map((p) => [...p]);
      dragging = true;
      const move = (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const fx = Math.min(1, Math.max(0, ev.clientX / innerWidth)), fy = Math.min(1, Math.max(0, ev.clientY / innerHeight));
        cur[i] = [fx, fy]; calibs[calibKey()] = cur.map((q) => [...q]);
        h.style.left = fx * innerWidth + 'px'; h.style.top = fy * innerHeight + 'px';
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawField(true); });
      };
      const up = (ev) => { dragging = false; try { h.releasePointerCapture(ev.pointerId); } catch (e2) {} h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); saveCalibs(); };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
    edel.appendChild(h);
  });
}
let raf = 0;
function drawFieldSoon() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawField(); }); }
function saveCalib(pts) { calibs[calibKey()] = pts; saveCalibs(); }
function saveCalibs() { try { chrome.storage.local.set({ kkCalib: calibs }); } catch (e) {} }
function setField(v) { field = { ...field, ...v }; try { chrome.storage.local.set({ kkField: field }); } catch (e) {} drawField(); }

/* ---------- Hauptschleife ---------- */
// Im Hauptmenü liegt das Spielfeld der letzten Partie unsichtbar hinter der Lobby (.title.lobby) – nicht mitlesen
function inLobby() { const l = document.querySelector('.title.lobby'); if (!l) return false; const r = l.getBoundingClientRect(); return r.width > innerWidth * 0.6 && r.height > innerHeight * 0.6; }
let lastMapTry = 0;
// Seit v41 läuft das Spiel direkt auf einoow.com (Hub und Modus-Seiten, ohne iframe); auf anderen einoow-Seiten nichts tun
const KANTO_PATH = /^\/(kanto-tactics|pvp|duo|tower|nuzlocke|play\/kanto-tactics|playables\/kanto-tactics)(\/|$)/;
function onKanto() { return KANTO_PATH.test(location.pathname) || !!document.querySelector('.app .ec-lvinfo, .app .cards'); }
// Selbstdiagnose (nur in der Umgebung der Erweiterung sichtbar): Durchläufe, letzter Ausstieg, letzter Fehler
const dbg = (window.__kkReaderDbg = { n: 0, at: '', err: '' });
function scan() {
  timer = null; dbg.n++;
  try { scanOnce(); } catch (e) { dbg.err = (e && e.message) + ' ' + String(e && e.stack).split('\n').slice(1, 3).join(' '); }
}
function scanOnce() {
  if (orphan()) { dbg.at = 'verwaist'; layerHost.remove(); return; } // Erweiterung wurde neu geladen – die neue Instanz übernimmt
  if (!enabled || !onKanto()) { dbg.at = 'aus'; holder.textContent = ''; drawField(); return; }
  attachLayer();
  // Zuordnungstabelle fehlt noch (Hintergrund war beim Start beschäftigt): alle 5 s neu anfragen
  if (!map && Date.now() - lastMapTry > 5000) { lastMapTry = Date.now(); loadMap(); }
  if (inLobby()) {
    dbg.at = 'lobby'; holder.textContent = '';
    if (last !== 'lobby') { last = 'lobby'; try { chrome.storage.local.set({ kkLive: { lobby: true, ts: Date.now() } }); } catch (e) {} }
    return;
  }
  const cards = readShop();
  drawMarks(cards);
  const level = readLevel(), gold = readGold();
  const safari = readSafari(); const loot = readLoot(); const seal = readSeal(); const starter = readStarter(); const boon = readBoon(); const event = readEvent();
  if (!cards.length && level == null && gold == null && !safari && !loot && !seal && !starter && !boon && !event) { dbg.at = 'kein HUD'; return; } // kein Spiel-HUD sichtbar
  const bench = readBench(); const board = readBoard(); const it = readItems(cards.length > 0);
  const state = {
    shop: cards.map((c) => c.line), shopInfo: cards.map((c) => ({ line: c.line, num: c.num, cost: c.cost, types: c.types, cname: c.cname, own: c.own, merge: c.merge, owner: c.owner, plan: c.plan, name: c.line ? '' : c.name })), foes: board ? foes : [],
    own: Object.fromEntries(cards.filter((c) => c.line).map((c) => [c.line, c.own])),
    level, gold, hp: readHp(), interest: readInterest(), benchCap: document.querySelectorAll('.bench .slot[data-bench]').length || null, xp: readXp(), safari, loot, seal, starter, boon, event, game: readMode(), planning: inPlanning(), teamN: firstInt((document.querySelector('.teamcount') || { getAttribute: () => '' }).getAttribute('aria-label')), lang: document.documentElement.lang || '', bench, board, items: it.items, itemsSeen: it.seen, itemsHidden: !!it.hidden, itemsCount: it.count || null,
    diag: { cards: cards.filter((c) => !c.empty).length, matched: cards.filter((c) => c.line).length, unknown: cards.filter((c) => !c.line && !c.empty).map((c) => c.num || c.name).slice(0, 5), bench: bench.length, board: board ? board.length : null, calibrated: isCalibrated(), map: !!map },
  };
  const key = JSON.stringify(state); dbg.at = 'ok ' + Date.now();
  if (key !== last) { last = key; try { chrome.storage.local.set({ kkLive: { ...state, ts: Date.now() } }); } catch (e) { /* Erweiterung neu geladen */ } }
  else if (Date.now() - lastBeat > 8000) { lastBeat = Date.now(); try { chrome.storage.local.set({ kkLive: { ...state, ts: Date.now() } }); } catch (e) {} }
}
let lastBeat = 0;
// Timer-Nummern teilt sich die Erweiterung mit der Seite: Räumt das Spiel Timer ab, bliebe „timer“ für immer gesetzt
// und der Leser stünde still. Darum: ein gesetzter, aber seit 1 s nicht ausgeführter Timer gilt als verloren.
let timerAt = 0;
function schedule() { dbg.sch = (dbg.sch || 0) + 1; if (timer && Date.now() - timerAt > 1000) timer = null; if (!timer) { timerAt = Date.now(); timer = setTimeout(scan, 120); } }

/* Käufe mitzählen: nur Beobachten, das Spiel bearbeitet den Klick ganz normal weiter */
document.addEventListener('click', (e) => {
  const b = e.target && e.target.closest && e.target.closest('button.card');
  if (!b || b.disabled || !enabled || !map) return;
  const num = monNum(b); const line = (num && (map.base[num] || (map.forms[num] || [])[0])) || lineByName(b.getAttribute('aria-label'));
  if (line) try { chrome.storage.local.set({ kkBought: { line, ts: Date.now() } }); } catch (err) {}
  schedule();
}, true);

new MutationObserver(schedule).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-label', 'class', 'disabled', 'src'] });
addEventListener('resize', () => { schedule(); drawFieldSoon(); }); addEventListener('scroll', schedule, true);
for (const ev of ['pointerup', 'keyup', 'visibilitychange']) addEventListener(ev, schedule, true);
// Mehrere unabhängige Taktgeber, damit der Leser nie stehen bleibt (siehe schedule): Intervall, sich selbst neu planender Timer, Bildwiederholung
let beatInt = setInterval(schedule, 1500); let lastTick = Date.now();
(function chain() { lastTick = Date.now(); schedule(); setTimeout(chain, 1500); })();
(function frame(i) { if (i % 90 === 0) { schedule(); if (Date.now() - lastTick > 4000) { clearInterval(beatInt); beatInt = setInterval(schedule, 1500); (function chain() { lastTick = Date.now(); schedule(); setTimeout(chain, 1500); })(); } } requestAnimationFrame(() => frame(i + 1)); })(1);

chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.kkMarks) { const v = ch.kkMarks.newValue || {}; marks = parseMarks(v); schedule(); }
  if (area === 'local' && ch.kkField) { field = { show: false, edit: false, ...(ch.kkField.newValue || {}) }; drawField(); }
  if (area === 'local' && ch.kkFieldUnits) { fieldUnits = ch.kkFieldUnits.newValue || []; drawField(); }
  if (area === 'local' && ch.kkCalib && !dragging) { calibs = ch.kkCalib.newValue || {}; drawFieldSoon(); }
  if (area === 'sync' && ch.autoShop) { enabled = ch.autoShop.newValue !== false; schedule(); drawField(); }
  if (area === 'sync' && ch.lang) { langSel = ch.lang.newValue || 'auto'; drawField(); }
  if (area === 'local' && ch.fetchedAt) loadMap();
});
async function loadMap() {
  try { const r = await chrome.runtime.sendMessage({ type: 'readerMap' }); if (r && r.ok) { map = r; last = ''; schedule(); } } catch (e) {}
}
(async () => {
  try { const s = await chrome.storage.sync.get({ autoShop: true, lang: 'auto' }); enabled = s.autoShop !== false; langSel = s.lang || 'auto'; } catch (e) {}
  try {
    const l = await chrome.storage.local.get(['kkMarks', 'kkField', 'kkFieldUnits', 'kkCalib']);
    const v = l.kkMarks || {}; marks = parseMarks(v);
    field = { show: false, edit: false, ...(l.kkField || {}) }; fieldUnits = l.kkFieldUnits || []; calibs = l.kkCalib || {};
  } catch (e) {}
  await loadMap();
  attachLayer(); schedule(); drawField();
})();
})();
