// Eigene Brett-Hälfte auf dem Bildschirm (Bot-Fenster 1600×900, Innenfläche 1584×805), im echten Spiel vermessen
// (tools/autoplay/calib.js, 01.11.2026): Ein Pokémon wurde über ein Raster gezogen, gemessen wurde, wo es einrastet.
// Zellen wie in den Team-Codes und meta.json: cell = row × 7 + col, row 0 = vorne (zum Gegner), 3 = hinten.
// Geometrie wie im Spiel: x = (col + (R & 1) · 0,5 − 3,25) mit R = 4 + row; die Kamera verzerrt leicht (hinten breiter).
'use strict';
const ROW_Y = [0.440, 0.503, 0.568, 0.640];   // Fußpunkt je Reihe (Anteil der Fensterhöhe)
const ROW_DX = [0.0432, 0.0444, 0.0453, 0.0470]; // Abstand zweier Felder je Reihe (Anteil der Fensterbreite)
const X0 = 0.4965;
function cellPos(cell, vp) {
  const row = Math.floor(cell / 7), col = cell % 7, R = 4 + row;
  return { x: vp.w * (X0 + ROW_DX[row] * (col + (R & 1) * 0.5 - 3.25)), y: vp.h * ROW_Y[row] - vp.h * 0.012 };
}
// Zelle, auf der eine Figur steht (Fußpunkt x/bottom), oder null, wenn sie nicht auf der eigenen Hälfte steht
// Reihe nach der Höhe (die Figuren wippen im Stand – der Fußpunkt schwankt um gut 1 % der Höhe), dann die nächste Spalte
function cellAt(x, bottom, vp) {
  const fy = bottom / vp.h; let row = 0, bd = Infinity;
  ROW_Y.forEach((y, r) => { const d = Math.abs(y - fy); if (d < bd) { bd = d; row = r; } });
  if (bd > 0.032) return null; // nicht auf der eigenen Hälfte (z. B. Bank oder Gegner)
  let best = null, bx = Infinity;
  for (let col = 0; col < 7; col++) { const c = row * 7 + col; const d = Math.abs(cellPos(c, vp).x - x) / vp.w; if (d < bx) { bx = d; best = c; } }
  return bx < ROW_DX[row] * 0.6 ? best : null;
}
// Wunsch-Aufstellung nach Rollen (Spielcode-Rollen, K.lineRole) und – falls vorhanden – gemessenen Feldern der Comp:
// Tanks vorn in die Mitte, Kämpfer vorn/zweite Reihe, Assassinen an die Flanken, Fernkämpfer/Magier/Unterstützer hinten –
// in die Ecken, außer der Gegner hat Assassinen (die springen in die Ecken): dann hinten in die Mitte.
function plan(units, opts = {}) {
  const used = new Set(); const out = {};
  const take = (u, cells) => { for (const c of cells) if (!used.has(c)) { used.add(c); out[u.key] = c; return true; } return false; };
  const row = (r, order) => order.map((c) => r * 7 + c);
  const mid = [3, 2, 4, 1, 5, 0, 6], flank = [0, 6, 1, 5, 2, 4, 3], corner = [0, 6, 1, 5, 2, 4, 3];
  const backOrder = opts.foeAssassins ? mid : corner;
  const rank = { tank: 0, fighter: 1, assassin: 2, special: 3, support: 4, mage: 5, marksman: 6 };
  const sorted = units.slice().sort((a, b) => (rank[a.role] ?? 3) - (rank[b.role] ?? 3) || (b.power || 0) - (a.power || 0));
  // gemessene Felder der Comp zuerst (aus echten Ranked-Spielen), wenn sie zur Rolle passen
  for (const u of sorted) if (u.metaCell != null && !used.has(u.metaCell)) { used.add(u.metaCell); out[u.key] = u.metaCell; }
  for (const u of sorted) {
    if (out[u.key] != null) continue;
    if (u.role === 'tank') take(u, [...row(0, mid), ...row(1, mid)]);
    else if (u.role === 'fighter') take(u, [...row(0, mid), ...row(1, mid), ...row(2, mid)]);
    else if (u.role === 'assassin') take(u, [...row(1, flank), ...row(0, flank), ...row(2, flank)]);
    else take(u, [...row(3, backOrder), ...row(2, backOrder), ...row(1, backOrder)]);
  }
  return out;
}
module.exports = { cellPos, cellAt, plan, ROW_Y };
