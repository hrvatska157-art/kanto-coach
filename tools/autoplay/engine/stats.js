// Auswertung der Protokolle für die Oberfläche: je Modus Partien, Kämpfe, Niederlagen, bestes Ergebnis, PvP-Plätze,
// und was in verlorenen Kämpfen auffällig oft vorkam (gleiche Merkmale wie tools/analyze-log.js).
'use strict';
const fs = require('fs'); const path = require('path');
const HEALERS = new Set(['chansey', 'snorlax', 'tangela4', 'tangela', 'clefairy']);
const campGoal = (s) => (s >= 22 ? 8 : s >= 16 ? 7 : s >= 10 ? 6 : s >= 7 ? 5 : s >= 5 ? 4 : 0);
function flags(g, r) {
  const f = []; const cap = g.mode === 'pvp' ? 50 : 40; const a = r.advice || {};
  if (r.teamN != null && r.level && r.teamN < r.level) f.push('freie Plätze');
  if (r.gold >= cap + 10) f.push('viel Gold liegen gelassen');
  if (g.mode === 'camp' && !g.nz && typeof r.at === 'number' && r.level < campGoal(r.at)) f.push('Level unter Fahrplan');
  if ((a.field || []).some((x) => x[0] === 'swap')) f.push('Tausch-Tipp offen');
  if ((a.buys || []).some((b) => b[1] === 'star')) f.push('Stern-Kauf offen');
  if ((r.foes || []).some((u) => HEALERS.has(u[0])) && !(r.board || []).some((u) => (u[2] || []).some((i) => i === 'poison-barb' || i === 'flame-orb'))) f.push('Gegner heilt, keine Anticura');
  if (!(r.board || []).some((u) => u[1] >= 2) && (typeof r.at === 'number' ? r.at >= 8 : String(r.at) >= '3')) f.push('kein ★★ auf dem Feld');
  return f;
}
function load(dir) {
  const byId = {}; const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'exported.json') : [];
  for (const f of files) {
    let j; try { j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { continue; }
    for (const g of j.games || []) { if (!byId[g.id] || g.rounds.length > byId[g.id].rounds.length) byId[g.id] = { ...g, file: f, bot: j.bot || null }; }
  }
  return Object.values(byId).sort((a, b) => (a.start < b.start ? -1 : 1));
}
function summary(dir) {
  const games = load(dir); const modes = {}; const flagAgg = {};
  for (const g of games) {
    const mode = g.nz ? 'nuz' : g.mode === 'camp' ? 'adv' : g.mode;
    const m = (modes[mode] = modes[mode] || { games: 0, fights: 0, lost: 0, best: null, places: [] });
    m.games++;
    for (const r of g.rounds) {
      if (!r.res) continue; m.fights++; if (r.res.lost) m.lost++;
      for (const x of flags(g, r)) { const k = mode + '|' + x; const e = (flagAgg[k] = flagAgg[k] || { mode, flag: x, n: 0, lost: 0 }); e.n++; if (r.res.lost) e.lost++; }
    }
    const last = g.rounds[g.rounds.length - 1]; const at = last && last.at;
    if (at != null && (m.best == null || (typeof at === 'number' ? at > m.best : String(at) > String(m.best)))) m.best = at;
    const place = g.bot && /Platz (\d)/.exec(g.bot.reason || ''); if (place) m.places.push(+place[1]);
  }
  // PvP-Plätze stehen in summary.csv (das Protokoll kennt nur Runden)
  try {
    const csv = fs.readFileSync(path.join(dir, 'summary.csv'), 'utf8').trim().split('\n').slice(1).map((l) => l.split(';'));
    const pv = modes.pvp; if (pv) pv.places = csv.filter((x) => x[1] === 'pvp' && /Platz (\d)/.test(x[2])).map((x) => +/Platz (\d)/.exec(x[2])[1]);
  } catch (e) {}
  const flagsOut = Object.values(flagAgg).filter((e) => e.n >= 2).sort((a, b) => b.lost / b.n - a.lost / a.n || b.n - a.n).slice(0, 15);
  return { games: games.length, modes, flags: flagsOut, recent: recent(dir) };
}
function recent(dir) {
  try { const csv = fs.readFileSync(path.join(dir, 'summary.csv'), 'utf8').trim().split('\n'); const head = csv[0].split(';');
    return csv.slice(1).slice(-40).reverse().map((l) => { const v = l.split(';'); const o = {}; head.forEach((h, i) => { o[h] = v[i]; }); return o; });
  } catch (e) { return []; }
}
module.exports = { summary, load, flags };
