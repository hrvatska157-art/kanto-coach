/* Kanto Coach – gemeinsame Logik für Website und Chrome-Erweiterung.
 * Keine Abhängigkeiten. Erwartet die Daten aus meta.json / data.json und optional window.KK_DE.
 */
(function (root) {
'use strict';
const NUM = /\d+(?:\.\d+)?/g;
const TYPE_COL = { normal:['#a8a77a','#1b1a10'], fire:['#e2703a','#fff'], water:['#4d8fe0','#fff'], grass:['#5ba849','#fff'], electric:['#eac52e','#1d1700'], ice:['#7fd3d3','#0d2424'], fighting:['#bf3a2f','#fff'], poison:['#9a4fa8','#fff'], ground:['#d2ad62','#241a06'], flying:['#8f9ce8','#10142c'], psychic:['#e5577e','#fff'], bug:['#9cad2a','#fff'], rock:['#b6a35a','#1f1a07'], ghost:['#6a5a9e','#fff'], dragon:['#6e4fe0','#fff'] };
const COST_COL = { 0:'#7a8296', 1:'#7d8699', 2:'#2f9a5d', 3:'#2f74cc', 4:'#9a52da', 5:'#d99a17' };
const STONE_ART = { fire:'fire-stone', water:'water-stone', electric:'thunder-stone', grass:'leaf-stone', ice:'ice-stone', normal:'blank-plate', fighting:'fist-plate', poison:'toxic-plate', ground:'earth-plate', flying:'sky-plate', psychic:'mind-plate', bug:'insect-plate', rock:'stone-plate', ghost:'spooky-plate', dragon:'draco-plate' };
// Pokédex-Nummern der Kampagnen-Pokémon, die nicht in data.json stehen
const CAMP_DEX = { bellsprout:[69,70,71], clefairy:[35,36], drowzee:[96,97], grimer:[88,89], kangaskhan:[115], koffing:[109,110], mankey:[56,57], meowth:[52,53], mrmime:[122], nidoranf:[29,30,31], pinsir:[127], porygon:[137], tangela:[114], venonat:[48,49], omanyte:[138,139], kabuto:[140,141], 'pikachu-partner':[25] };
// Linien, die in data.json fehlen können: die Neuen aus v35 (PvP-IDs, seit Regeln 39 in data.json) und Kampagnen-Linien.
// data.json hat immer Vorrang; diese Tabelle ist nur Rückfall für ältere Regel-Stände (?rules=…) und die Kampagne.
// c = Kosten, t = Typen, dex = Pokédex-Nummer je Stern, n = englische Namen je Stufe, pvp = im PvP-Shop
const NEW_LINES = {
  venomoth: { c: 3, t: ['bug', 'poison'], dex: [48, 49], n: ['Venonat', 'Venomoth'], pvp: true, range: 3 },
  porygon3: { c: 3, t: ['normal'], dex: [137], n: ['Porygon'], pvp: true, range: 3 },
  omastar: { c: 3, t: ['rock', 'water'], dex: [138, 139], n: ['Omanyte', 'Omastar'], pvp: true, range: 3 },
  victreebel: { c: 4, t: ['grass', 'poison'], dex: [69, 70, 71], n: ['Bellsprout', 'Weepinbell', 'Victreebel'], pvp: true, range: 1 },
  tangela4: { c: 4, t: ['grass'], dex: [114], n: ['Tangela'], pvp: true, range: 1 },
  primeape: { c: 4, t: ['fighting'], dex: [56, 57], n: ['Mankey', 'Primeape'], pvp: true, range: 1 },
  nidoqueen: { c: 4, t: ['poison', 'ground'], dex: [29, 30, 31], n: ['Nidoran♀', 'Nidorina', 'Nidoqueen'], pvp: true, range: 1 },
  kabutops: { c: 4, t: ['rock', 'water'], dex: [140, 141], n: ['Kabuto', 'Kabutops'], pvp: true, range: 1 },
  koga: { c: 5, t: ['poison'], dex: [109, 110], n: ['Koffing', 'Weezing'], pvp: true, range: 2, owner: 'Koga' },
  giovanni: { c: 5, t: ['normal'], dex: [52, 53], n: ['Meowth', 'Persian'], pvp: true, range: 1, owner: 'Giovanni' },
  samurai: { c: 5, t: ['bug'], dex: [127], n: ['Pinsir'], pvp: true, range: 1, owner: 'Samurai' },
  // Kampagne
  venonat: { c: 3, t: ['bug', 'poison'], dex: [48, 49], n: ['Venonat', 'Venomoth'] },
  porygon: { c: 3, t: ['normal'], dex: [137], n: ['Porygon'] },
  omanyte: { c: 3, t: ['rock', 'water'], dex: [138, 139], n: ['Omanyte', 'Omastar'] },
  bellsprout: { c: 4, t: ['grass', 'poison'], dex: [69, 70, 71], n: ['Bellsprout', 'Weepinbell', 'Victreebel'] },
  tangela: { c: 4, t: ['grass'], dex: [114], n: ['Tangela'] },
  mankey: { c: 4, t: ['fighting'], dex: [56, 57], n: ['Mankey', 'Primeape'] },
  nidoranf: { c: 4, t: ['poison', 'ground'], dex: [29, 30, 31], n: ['Nidoran♀', 'Nidorina', 'Nidoqueen'] },
  kabuto: { c: 4, t: ['rock', 'water'], dex: [140, 141], n: ['Kabuto', 'Kabutops'] },
  koffing: { c: 0, t: ['poison'], dex: [109, 110], n: ['Koffing', 'Weezing'] },
  meowth: { c: 0, t: ['normal'], dex: [52, 53], n: ['Meowth', 'Persian'] },
  pinsir: { c: 0, t: ['bug'], dex: [127], n: ['Pinsir'] },
  doduo: { c: 0, t: ['normal', 'flying'], dex: [84, 85], n: ['Doduo', 'Dodrio'] },
  clefairy: { c: 0, t: ['normal'], dex: [35, 36], n: ['Clefairy', 'Clefable'] },
  drowzee: { c: 0, t: ['psychic'], dex: [96, 97], n: ['Drowzee', 'Hypno'] },
  grimer: { c: 0, t: ['poison'], dex: [88, 89], n: ['Grimer', 'Muk'] },
  kangaskhan: { c: 0, t: ['normal'], dex: [115], n: ['Kangaskhan'] },
  mrmime: { c: 0, t: ['psychic'], dex: [122], n: ['Mr. Mime'] },
};
// Gleiche Pokémon, andere ID: Kampagne -> PvP (v35)
const PVP_ALIAS = { venonat: 'venomoth', porygon: 'porygon3', omanyte: 'omastar', bellsprout: 'victreebel', tangela: 'tangela4', mankey: 'primeape', nidoranf: 'nidoqueen', kabuto: 'kabutops', koffing: 'koga', meowth: 'giovanni', pinsir: 'samurai' };
// Umgekehrt (PvP -> Kampagne) für die Kampagnen-Statistik; die Figuren-Pokémon (Koga, Giovanni, Samurai) haben dort eigene IDs
const CAMP_ALIAS = Object.fromEntries(Object.entries(PVP_ALIAS).filter(([, p]) => !['koga', 'giovanni', 'samurai'].includes(p)).map(([c, p]) => [p, c]));
// Verankerte Form (v37): „<linie>-a<k>“ = die Linie bleibt in ihrer k-ten Form (0 = erste), z. B. weedle-a1 = Kokuna ⚓
const ANCHOR = /^(.+)-a(\d)$/;
function splitId(id) { const m = ANCHOR.exec(String(id || '')); return m ? { base: m[1], anchor: +m[2] } : { base: id, anchor: null }; }
// Figuren-Pokémon haben eigene Bildnummern (9000 + Pokédex-Nr.), Sprites gibt es unter der normalen Nummer
function spriteDex(dex) { return dex > 9000 ? dex - 9000 : dex; }

function binomAtLeast(N, p, k) {
  if (k <= 0) return 1; if (p <= 0 || N <= 0) return 0; if (p >= 1) return N >= k ? 1 : 0;
  let term = Math.pow(1 - p, N), cum = 0;
  for (let i = 0; i < k && i <= N; i++) { cum += term; term = term * (N - i) / (i + 1) * p / (1 - p); }
  return Math.max(0, Math.min(1, 1 - cum));
}
// Wahrscheinlichkeit, dass von unabhängigen Ereignissen mit Wahrscheinlichkeiten ps mindestens k eintreten
function atLeastK(ps, k) {
  if (k <= 0) return 1; if (k > ps.length) return 0;
  let dp = [1];
  for (const p of ps) { const nx = new Array(dp.length + 1).fill(0); for (let i = 0; i < dp.length; i++) { nx[i] += dp[i] * (1 - p); nx[i + 1] += dp[i] * p; } dp = nx; }
  let s = 0; for (let i = k; i < dp.length; i++) s += dp[i]; return Math.min(1, s);
}

function create(opts) {
  const data = opts.data, meta = opts.meta, DE = opts.de || { pokemon:{}, moves:{}, items:{}, types:{}, texts:{}, stops:{}, leagues:{}, boons:{}, campaignOnly:{} };
  const K = { data, meta, lang: opts.lang || 'de', TYPE_COL, COST_COL, STONE_ART, binomAtLeast, atLeastK };
  K.setLang = (l) => { K.lang = l === 'en' ? 'en' : 'de'; };

  /* ---------- Namen & Texte ---------- */
  K.numStr = (s) => (K.lang === 'de' ? String(s).replace('.', ',') : String(s));
  K.fill = (tpl, en) => { const nums = String(en).match(NUM) || []; let i = 0; return tpl.replace(/#/g, () => K.numStr(nums[i++] != null ? nums[i - 1] : '#')); };
  K.gtext = (en) => { if (!en) return ''; if (K.lang !== 'de') return en; const tpl = DE.texts[en.replace(NUM, '#')]; return tpl ? K.fill(tpl, en) : en; };
  K.pname = (en) => (K.lang === 'de' ? (DE.pokemon[en] || en) : en);
  K.NEW_LINES = NEW_LINES; K.PVP_ALIAS = PVP_ALIAS; K.CAMP_ALIAS = CAMP_ALIAS; K.splitId = splitId; K.spriteDex = spriteDex;
  K.base = (id) => splitId(id).base;
  K.anchorOf = (id) => splitId(id).anchor;
  const rawNames = (id) => { const l = data.lines[id]; return l ? l.n : (NEW_LINES[id] ? NEW_LINES[id].n : (DE.campaignOnly[id] || [id])); };
  // Verankert: nur die gewählte Form (sie steigt in ★ auf, ohne sich zu entwickeln)
  K.lineNames = (id) => { const s = splitId(id); const n = rawNames(s.base); return s.anchor == null ? n : [n[Math.min(s.anchor, n.length - 1)]]; };
  K.isCampaignOnly = (id) => { const b = K.base(id); return !data.lines[b] && !(NEW_LINES[b] && NEW_LINES[b].pvp); };
  K.isNewLine = (id) => { const b = K.base(id); return !data.lines[b] && !!NEW_LINES[b]; };
  K.ownerOf = (id) => { const b = K.base(id); return (NEW_LINES[b] && NEW_LINES[b].owner) || ''; };
  const own = (id, nm) => { const b = K.base(id); const s = splitId(id); const o = NEW_LINES[b] && NEW_LINES[b].owner ? `${nm} (${NEW_LINES[b].owner})` : nm; return s.anchor == null ? o : o + ' ⚓'; };
  K.unitName = (id, star) => { const n = K.lineNames(id); return own(id, K.pname(n[Math.min(Math.max(star || 1, 1), n.length) - 1])); };
  K.lineName = (id) => { const n = K.lineNames(id); return own(id, K.pname(n[n.length - 1])); };
  K.baseName = (id) => K.pname(K.lineNames(id)[0]);
  K.lineFullName = (id) => K.lineNames(id).map(K.pname).join(' → ') + (K.anchorOf(id) != null ? ' ⚓' : '');
  K.lineCost = (id) => { id = K.base(id); const l = data.lines[id]; return l ? l.c : (NEW_LINES[id] ? NEW_LINES[id].c : (id === 'pikachu-partner' ? 2 : 0)); };
  K.lineRange = (id) => { id = K.base(id); const l = data.lines[id]; return l ? l.range : (NEW_LINES[id] && NEW_LINES[id].range) || 1; };
  K.lineTypes = (id) => { id = K.base(id); const l = data.lines[id]; return l ? l.t : (NEW_LINES[id] ? NEW_LINES[id].t : []); };
  K.typeName = (t) => { if (K.lang === 'de') return DE.types[t] || t; const tr = data.traits[t]; return tr ? tr.en : t; };
  K.itemName = (id) => { const it = data.items[id]; if (!it) return id; return K.lang === 'de' ? (DE.items[it.en] || it.en) : it.en; };
  K.itemText = (id) => { const it = data.items[id]; return it ? K.gtext(it.text.en) : ''; };
  K.itemShort = (id) => { const it = data.items[id]; return it && it.short ? K.gtext(it.short.en) : ''; };
  K.itemArt = (id) => (id.startsWith('emblem-') ? (STONE_ART[id.slice(7)] || 'blank-plate') : id === 'eviolite' ? 'metal-powder' : id);
  // Pokédex-Nummer einer Form (Stern = Entwicklungsstufe) und Sprite-Adresse
  // Pokédex-Nummern je Form (l.s), sonst aus den Sternen
  const formDex = (b) => { const l = data.lines[b]; if (l) return l.s && l.s.length ? l.s : [...new Set(l.stars.map((x) => x.dex))]; return CAMP_DEX[b] || (NEW_LINES[b] && NEW_LINES[b].dex) || null; };
  K.dexOf = (id, star) => {
    const s = splitId(id);
    if (s.anchor != null) { const d = formDex(s.base); return d ? d[Math.min(s.anchor, d.length - 1)] : null; }
    const l = data.lines[id]; if (l) { const x = l.stars[Math.min(Math.max(star || 1, 1), l.stars.length) - 1]; return x ? x.dex : null; }
    const d = formDex(id); return d ? d[Math.min(Math.max(star || 1, 1), d.length) - 1] : null;
  };
  K.lastDex = (id) => { const s = splitId(id); if (s.anchor != null) return K.dexOf(id); const l = data.lines[id]; if (l) return l.stars[l.stars.length - 1].dex; const d = formDex(id); return d ? d[d.length - 1] : null; };
  // Formen, die man verankern kann: jede außer der letzten (v37)
  K.anchorForms = (id) => { const d = formDex(id) || []; const n = rawNames(id); return d.slice(0, -1).map((dex, k) => ({ id: id + '-a' + k, dex, en: n[k] || '' })); };
  K.moveName = (en) => (K.lang === 'de' ? (DE.moves[en] || en) : en);
  K.traitDesc = (t, v) => { const tr = data.traits[t]; return tr ? K.gtext(tr.desc.en).replace('{v}', K.numStr(v)) : ''; };
  K.stopName = (raw) => { const i = raw.indexOf(':'); const n = parseInt(raw.slice(0, i), 10); const key = raw.slice(i + 1); const tr = DE.stops[key]; return { n, key, name: tr ? tr[K.lang] : key.charAt(0).toUpperCase() + key.slice(1) }; };
  K.leagueName = (id) => { const l = DE.leagues[id]; return l ? l[K.lang] : id; };
  K.boonName = (b) => { const de = DE.boons[b.name.en]; return K.lang === 'de' && de ? de.name : b.name.en; };
  K.boonText = (b, en) => { const de = DE.boons[b.name.en]; return K.lang === 'de' && de ? K.fill(de.text, en) : en; };
  K.compTitle = (c) => { const tr = data.traits[c.name.trait]; const need = tr ? tr.th[Math.max(0, c.name.level - 1)] : c.name.level; return `${K.typeName(c.name.trait)} ${need} · ${(c.name.units || []).map(K.lineName).join(' + ')}`; };

  /* ---------- abgeleitete Daten ---------- */
  K.lines = Object.keys(data.lines);
  K.shopLines = K.lines.filter((id) => data.lines[id].shop);
  K.shopByCost = {};
  for (const id of K.shopLines) (K.shopByCost[data.lines[id].c] = K.shopByCost[data.lines[id].c] || []).push(id);
  // Neue PvP-Linien zählen für Pool-Größen und Auswahl mit, sobald die Statistik sie kennt
  K.newShopLines = Object.keys(NEW_LINES).filter((id) => NEW_LINES[id].pvp && !data.lines[id] && meta && (meta.units || []).some((u) => u.line === id));
  for (const id of K.newShopLines) (K.shopByCost[NEW_LINES[id].c] = K.shopByCost[NEW_LINES[id].c] || []).push(id);
  K.allShopLines = [...K.shopLines, ...K.newShopLines];
  const lineInfo = (id) => { id = K.base(id); return data.lines[id] || (NEW_LINES[id] && NEW_LINES[id].pvp ? { c: NEW_LINES[id].c, shop: true } : null); };
  K.statsOk = !!(meta && meta.comps && meta.comps.length);
  K.unitTier = {}; K.itemTier = {}; K.comps = []; K.compById = {}; K.prior = {}; K.lineItems = {}; K.itemHolders = {};
  if (K.statsOk) {
    K.unitTier = Object.fromEntries((meta.units || []).map((u) => [u.line, u]));
    K.itemTier = Object.fromEntries((meta.items || []).map((u) => [u.id, u]));
    // Kern-Comps ohne Anteile (kleine Stichprobe): alle Kern-Einheiten zählen voll
    K.comps = meta.comps.map((c, i) => {
      const core = c.units.some((u) => u.share == null);
      return { ...c, idx: i, coreOnly: core,
        units: c.units.map((u) => ({ ...u, share: u.share == null ? 100 : u.share, star: u.star == null ? 2 : u.star, items: u.items || [] })),
        traits: (c.traits || []).map((x) => ({ ...x, share: x.share == null ? 100 : x.share })) };
    });
    K.comps.forEach((c) => { K.compById[c.id] = c; });
    for (const c of K.comps) {
      if (c.placement && c.placement.cells) {
        const w = c.placement.n || c.n;
        for (const x of c.placement.cells) {
          const p = (K.prior[x.line] = K.prior[x.line] || { cell: {}, row: [0, 0, 0, 0], col: Array(7).fill(0), tot: 0 });
          const v = x.share * w / 100; p.cell[x.cell] = (p.cell[x.cell] || 0) + v; p.row[Math.floor(x.cell / 7)] += v; p.col[x.cell % 7] += v; p.tot += v;
        }
      }
      if (c.tier === 'S' || c.tier === 'A') for (const u of c.units) for (const it of (u.items || [])) {
        const w = c.n * u.share / 100 * it.share / 100;
        (K.lineItems[u.line] = K.lineItems[u.line] || {})[it.id] = (K.lineItems[u.line][it.id] || 0) + w;
        (K.itemHolders[it.id] = K.itemHolders[it.id] || {})[u.line] = (K.itemHolders[it.id][u.line] || 0) + w;
      }
    }
  }
  K.bestComp = () => K.comps.filter((c) => c.n >= 100).sort((a, b) => a.avg - b.avg)[0] || K.comps[0];
  K.topItemsFor = (line, n = 3) => Object.entries(K.lineItems[line] || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);

  /* ---------- Pokédex: alle Formen ---------- */
  K.dexEntries = () => {
    const out = []; const seen = new Set();
    for (const id of K.lines) {
      const l = data.lines[id];
      l.stars.forEach((s, i) => {
        const key = s.name + '#' + s.dex; if (seen.has(key)) return; seen.add(key);
        out.push({ key: id + ':' + (i + 1), line: id, star: i + 1, en: s.name, dex: s.dex, cost: l.c, types: l.t, shop: l.shop, camp: false });
      });
    }
    for (const id of Object.keys(DE.campaignOnly || {})) {
      if (data.lines[id] || id === 'pikachu-partner') continue;
      const names = DE.campaignOnly[id]; const dex = CAMP_DEX[id] || [];
      names.forEach((n, i) => { const key = n + '#' + (dex[i] || 0); if (seen.has(key)) return; seen.add(key); out.push({ key: id + ':' + (i + 1), line: id, star: i + 1, en: n, dex: dex[i] || 999, cost: 0, types: [], shop: false, camp: true }); });
    }
    return out.sort((a, b) => a.dex - b.dex || a.star - b.star);
  };

  /* ---------- Brett ---------- */
  function rangeRows(range) {
    if (range <= 1) return [1, 0.55, 0.15, 0.05];
    if (range === 2) return [0.35, 1, 0.55, 0.2];
    if (range === 3) return [0.05, 0.3, 0.8, 1];
    return [0, 0.15, 0.6, 1];
  }
  K.boardUnits = (c, cap) => {
    const sorted = [...c.units].sort((a, b) => b.share - a.share);
    let units = sorted.filter((u) => u.share >= 40);
    if (units.length < 6) units = sorted.filter((u) => u.share >= 25);
    const st = c.guide && c.guide.stages && c.guide.stages.length ? c.guide.stages[c.guide.stages.length - 1] : null;
    const lvl = st ? st.levels.reduce((a, b) => (b.share > a.share ? b : a)).level : 8;
    const max = cap || Math.min(9, Math.max(lvl, 7));
    const seen = new Set();
    return units.filter((u) => { const b = splitId(u.line).base; return seen.has(b) ? false : seen.add(b); }).slice(0, max)
      .map((u) => ({ line: u.line, star: u.star || 1, share: u.share, items: (u.items || []).map((i) => i.id) }));
  };
  // units: [{line, star}], cells: gemessene Positionen [{cell,line,share}]
  K.placeUnits = (units, cells = []) => {
    const placed = {}; const used = new Set(); const out = [];
    for (const x of [...cells].sort((a, b) => b.share - a.share)) {
      const u = units.find((v) => v.line === x.line && !placed[v.line]);
      if (!u || used.has(x.cell)) continue;
      placed[u.line] = true; used.add(x.cell);
      out.push({ ...u, cell: x.cell, share: x.share, measured: true });
    }
    const rest = units.filter((u) => !placed[u.line]).map((u) => ({ u, p: K.prior[u.line], conf: K.prior[u.line] ? K.prior[u.line].tot : 0, range: K.lineRange(u.line) })).sort((a, b) => b.conf - a.conf);
    for (const r of rest) {
      let best = -1, bestScore = -Infinity; const rr = rangeRows(r.range);
      for (let cell = 0; cell < 28; cell++) {
        if (used.has(cell)) continue;
        const row = Math.floor(cell / 7), col = cell % 7; let s = 0;
        if (r.p && r.p.tot > 0) s += 3 * (r.p.cell[cell] || 0) / r.p.tot + 1.5 * r.p.row[row] / r.p.tot + 0.6 * r.p.col[col] / r.p.tot + 0.25 * rr[row];
        else s += rr[row];
        s -= 0.035 * Math.abs(col - 3);
        if (s > bestScore) { bestScore = s; best = cell; }
      }
      if (best < 0) break;
      used.add(best); out.push({ ...r.u, cell: best, measured: false });
    }
    return out;
  };
  K.buildBoard = (c) => K.placeUnits(K.boardUnits(c), (c.placement && c.placement.cells) || []);

  /* ---------- Typ-Boni ---------- */
  // units: [{line, items:[]}] auf dem Brett
  K.traitsFor = (units) => {
    // Jede Linie zählt einmal – auch eine verankerte Form zusammen mit ihrer eigenen Linie (v39)
    const cnt = {}; const seen = new Set();
    for (const u of units) {
      const b = K.base(u.line); if (seen.has(b)) continue; seen.add(b);
      const types = new Set(K.lineTypes(u.line));
      for (const it of (u.items || [])) if (it.startsWith('emblem-')) types.add(it.slice(7));
      types.forEach((t) => { cnt[t] = (cnt[t] || 0) + 1; });
    }
    return Object.entries(cnt).filter(([t]) => data.traits[t]).map(([t, n]) => {
      const tr = data.traits[t]; let lv = 0; tr.th.forEach((th, i) => { if (n >= th) lv = i + 1; });
      return { type: t, n, lv, th: tr.th, value: tr.values[Math.max(0, lv - 1)], next: tr.th.find((th) => th > n) };
    }).sort((a, b) => b.lv - a.lv || b.n - a.n || a.type.localeCompare(b.type));
  };

  /* ---------- Shop ---------- */
  K.pSlot = (level, line, o = {}) => {
    const pvp = data.pvp; const l = lineInfo(line); if (!l || !l.shop) return 0;
    const c = l.c; const per = pvp.pool[c]; const nUnits = (K.shopByCost[c] || []).length;
    const left = Math.max(0, per - (o.own || 0) - (o.others || 0));
    const poolLeft = Math.max(1, per * nUnits - (o.own || 0) - (o.others || 0) - (o.gone || 0));
    const tierP = ((pvp.odds[level] || [0, 0, 0, 0, 0])[c - 1] || 0) / 100;
    return tierP * left / poolLeft;
  };
  K.shopCalc = (level, o) => {
    const pvp = data.pvp; const l = lineInfo(o.unit) || { c: K.lineCost(o.unit) || 1 }; const c = l.c;
    const per = pvp.pool[c]; const nUnits = (K.shopByCost[c] || []).length;
    const left = Math.max(0, per - o.own - o.others);
    const poolLeft = Math.max(1, per * nUnits - o.own - o.others - o.gone);
    const tierP = ((pvp.odds[level] || [0, 0, 0, 0, 0])[c - 1] || 0) / 100;
    const pSlot = tierP * left / poolLeft;
    return { c, per, nUnits, left, poolLeft, tierP, pSlot, pShop: 1 - Math.pow(1 - pSlot, o.slots || 5) };
  };
  K.minLevelFor = (cost) => { const pvp = data.pvp; return Object.keys(pvp.odds).map(Number).sort((a, b) => a - b).find((lv) => (pvp.odds[lv] || [])[cost - 1] > 0) || null; };

  /* ---------- Vorhersage: welche Comp ist baubar? ---------- */
  // owned: {line: Kopien}, shop: [line|null], level, gold
  K.predict = (o) => {
    const level = o.level || 7, gold = o.gold || 0, slots = o.slots || 5, horizon = o.horizon == null ? 6 : o.horizon;
    const owned = o.owned || {}; const shop = (o.shop || []).filter(Boolean);
    const shops = Math.floor(gold / (data.pvp.rerollCost || 2)) + horizon; const N = shops * slots;
    const ref = (meta && meta.ref) || 4;
    const cands = K.comps.filter((c) => c.n >= (o.minN || 30) && (!o.tiers || o.tiers.includes(c.tier)));
    const res = [];
    for (const c of cands) {
      const need = K.boardUnits(c, Math.min(9, Math.max(level + 1, 7)));
      if (need.length < 3) continue;
      const have = [], inShop = [], miss = [];
      // Gekauft wird immer die Linie; ob sie verankert wird, entscheidest du im Spiel
      for (const u of need) { const b = K.base(u.line); if (owned[b] > 0) have.push(u); else if (shop.includes(b)) inShop.push(u); else miss.push(u); }
      // Gerechnet wird mit dem Level, auf dem man die Comp typischerweise fertig baut (7, für 5er-Pokémon 8),
      // und mit den Shops der kommenden Runden (horizon) plus dem aktuellen Gold.
      const ps = miss.map((u) => {
        const c = K.lineCost(u.line); const lv = Math.min(9, Math.max(level, c >= 5 ? 8 : 7));
        return binomAtLeast(N, K.pSlot(lv, u.line, { own: 0 }), 1);
      });
      const allow = need.length >= 7 ? 1 : 0;
      const pBuild = atLeastK(ps, Math.max(0, miss.length - allow));
      const wTot = need.reduce((s, u) => s + u.share, 0) || 1;
      const progress = (have.reduce((s, u) => s + u.share, 0) + 0.9 * inShop.reduce((s, u) => s + u.share, 0)) / wTot;
      const strength = Math.max(0.2, Math.min(2, 1 + (ref - c.avg) / 2));
      const score = (0.55 * pBuild + 0.45 * progress) * strength;
      res.push({ comp: c, need, have, inShop, miss, missP: miss.map((u, i) => ({ ...u, p: ps[i] })), pBuild, progress, score });
    }
    return res.sort((a, b) => b.score - a.score).slice(0, o.limit || 8);
  };
  // Welche Comps profitieren von einem Shop-Pokémon?
  K.compsUsing = (line, list) => (list || []).filter((r) => r.need.some((u) => K.base(u.line) === K.base(line)));

  /* ---------- Team-Codes des Spiels (KT1) ---------- */
  // Format wie im Spiel (Planer → „Code einfügen“): KT1;r40;[xm=pvp|tower|adv;][xn=Name;]linie:stern[s]:feld[:item.item.item]
  K.parseTeamCode = (str) => {
    const s = String(str || '').trim().replace(/\s+/g, ''); const parts = s.split(';').filter(Boolean);
    if (!parts.length || parts[0].toUpperCase() !== 'KT1') return null;
    let rules = null, mode = null, name = null; const units = []; const used = new Set();
    for (const raw of parts.slice(1)) {
      if (/^x/i.test(raw)) {
        const [k, ...v] = raw.split('='); const val = v.join('=');
        if (/^xm$/i.test(k) && /^(pvp|tower|adv)$/i.test(val)) mode = val.toLowerCase();
        else if (/^xn$/i.test(k) && val) { try { name = decodeURIComponent(val).slice(0, 40); } catch (e) { /* ungültig */ } }
        continue;
      }
      const p = raw.toLowerCase();
      if (/^r\d{1,4}$/.test(p)) { rules = +p.slice(1); continue; }
      const f = p.split(':'); if (f.length < 3) continue;
      const line = f[0]; if (!/^[a-z0-9-]{1,24}$/.test(line)) continue;
      const star = Math.max(1, Math.min(3, parseInt(f[1], 10) || 1)); const shiny = /s$/.test(f[1]);
      const cell = parseInt(f[2], 10); if (!(cell >= 0 && cell < 28) || used.has(cell)) continue; used.add(cell);
      const items = f[3] ? f[3].split('.').filter((x) => /^[a-z0-9-]{1,24}$/.test(x)).slice(0, 3) : [];
      units.push({ line, star, shiny, cell, items });
    }
    return units.length ? { rules, units, mode, name } : null;
  };
  // o: { mode: 'pvp'|'tower'|'adv', name }. Verankerte Formen gehen als Linie in den Code (den Anker wählt man im Spiel).
  // Abenteuer und Turm kennen die v35-Neuen nur unter ihren Kampagnen-IDs (bellsprout statt victreebel …) – im Spiel geprüft.
  const codeLine = (line, mode) => { const b = K.base(line); return mode && mode !== 'pvp' ? CAMP_ALIAS[b] || b : b; };
  K.teamCode = (units, rules, o = {}) => {
    const list = units.filter((u) => u.cell != null).sort((a, b) => a.cell - b.cell);
    if (!list.length) return '';
    const head = ['KT1', 'r' + (rules || data.rules)];
    if (o.mode) head.push('xm=' + o.mode);
    if (o.name) head.push('xn=' + encodeURIComponent(String(o.name).slice(0, 40)));
    return [...head, ...list.map((u) => `${codeLine(u.line, o.mode)}:${u.star || 1}${u.shiny ? 's' : ''}:${u.cell}${u.items && u.items.length ? ':' + u.items.slice(0, 3).join('.') : ''}`)].join(';');
  };

  /* ---------- Kampagne & Turm: festes Team ---------- */
  K.optimizeFixedTeam = (mode, o = {}) => {
    const size = Math.max(3, Math.min(9, o.size || 8));
    const lock = (o.lock || []).filter(Boolean); const exclude = new Set(o.exclude || []);
    const stops = mode.stops.filter((s) => { const n = parseInt(s.stop, 10); return (o.from == null || n >= o.from) && (o.to == null || n <= o.to); });
    const coresBy = {}; for (const c of mode.cores) if (c.n >= 10) (coresBy[c.stop] = coresBy[c.stop] || []).push(c);
    const lineStat = {}; for (const l of mode.lines) lineStat[l.line] = l;
    // ab welcher Station ein Pokémon in den Daten erstmals eingesetzt wird (≈ verfügbar)
    const avail = {}; for (const c of mode.cores) if (c.n >= 10) { const n = parseInt(c.stop, 10); for (const l of c.core) if (avail[l] == null || n < avail[l]) avail[l] = n; }
    K._avail = avail;
    const W = stops.map((s) => ({ s, n: parseInt(s.stop, 10), cores: coresBy[s.stop] || [], w: Math.max(0.02, (100 - s.win) / 100) * (coresBy[s.stop] ? 1 : 0.5) }));
    const coreVal = (c) => 0.7 * c.lo + 0.3 * c.win;
    const stopWin = (x, full) => {
      const set = new Set([...full].filter((l) => avail[l] == null || avail[l] <= x.n));
      let ld = 0, k = 0; set.forEach((l) => { if (lineStat[l]) { ld += lineStat[l].d; k++; } });
      let best = x.s.win + (k ? 0.5 * ld / k : 0); let core = null;
      for (const c of x.cores) {
        const hit = c.core.filter((l) => set.has(l)).length;
        if (hit === 3) { const v = coreVal(c); if (v > best || (core && core.hit < 3)) { if (v > best) best = v; core = { c, hit }; } }
        else if (hit === 2) { const v = x.s.win + 0.35 * (coreVal(c) - x.s.win); if (v > best) { best = v; core = { c, hit }; } }
      }
      return { v: Math.max(0, Math.min(100, best)), core };
    };
    const wSum = W.reduce((s, x) => s + x.w, 0) || 1;
    // Bonus je Linie (z. B. weil du sie schon besitzt), in Prozentpunkten Siegchance über alle Stationen
    const bonus = o.bonus || {};
    const score = (set) => W.reduce((s, x) => s + x.w * stopWin(x, set).v, 0) + [...set].reduce((s, l) => s + (bonus[l] || 0) * wSum, 0);
    const cand = mode.lines.filter((l) => (l.n >= (o.minN || 150) || bonus[l.line]) && !exclude.has(l.line) && (o.maxFrom == null || avail[l.line] == null || avail[l.line] <= o.maxFrom)).map((l) => l.line);
    for (const l of lock) if (!cand.includes(l)) cand.push(l);
    let team = new Set(lock.slice(0, size));
    while (team.size < size) {
      let best = null, bs = -Infinity;
      for (const l of cand) { if (team.has(l)) continue; team.add(l); const s = score(team); team.delete(l); if (s > bs) { bs = s; best = l; } }
      if (!best) break; team.add(best);
    }
    for (let round = 0; round < 5; round++) {
      let improved = false; let cur = score(team);
      for (const out of [...team]) {
        if (lock.includes(out)) continue;
        for (const inn of cand) {
          if (team.has(inn)) continue;
          team.delete(out); team.add(inn); const s = score(team);
          if (s > cur + 1e-9) { cur = s; improved = true; break; }
          team.delete(inn); team.add(out);
        }
        if (improved) break;
      }
      if (!improved) break;
    }
    const total = score(team);
    const contrib = [...team].map((l) => { team.delete(l); const s = score(team); team.add(l); return { line: l, gain: total - s }; }).sort((a, b) => b.gain - a.gain);
    const perStop = W.map((x) => { const r = stopWin(x, team); return { stop: x.s, base: x.s.win, est: r.v, core: r.core, hasCores: x.cores.length > 0, w: x.w }; });
    const okItem = (id) => data.items[id] && (data.items[id].k === 'full' || data.items[id].k === 'emblem');
    const holders = (line) => (mode.holders || []).filter((h) => h.line === line && h.n >= 20 && okItem(h.id)).sort((a, b) => b.lo - a.lo);
    const usedItems = {};
    const units = contrib.map((x) => {
      const hs = holders(x.line); const items = [];
      for (const h of hs) { if (items.length >= 3) break; if ((usedItems[h.id] || 0) >= 2) continue; items.push(h.id); usedItems[h.id] = (usedItems[h.id] || 0) + 1; }
      // Empfohlener Stern: der höchste, der fast so gut abschneidet wie der beste (kleine Stichproben bei 1★ verzerren sonst)
      const stars = (mode.stars || []).filter((s) => s.line === x.line && s.n >= 30);
      const bestLo = stars.length ? Math.max(...stars.map((s) => s.lo)) : 0;
      const star = stars.length ? Math.max(...stars.filter((s) => s.lo >= bestLo - 3).map((s) => s.star)) : 2;
      return { line: x.line, gain: x.gain, items, star: Math.max(2, star), stat: lineStat[x.line] || null, locked: lock.includes(x.line), from: avail[x.line] == null ? null : avail[x.line] };
    });
    const hard = perStop.filter((p) => p.hasCores);
    const avgHard = hard.length ? hard.reduce((s, p) => s + p.est, 0) / hard.length : 0;
    const baseHard = hard.length ? hard.reduce((s, p) => s + p.base, 0) / hard.length : 0;
    return { units, perStop, avgHard, baseHard, weak: perStop.filter((p) => p.hasCores && p.est < 55).sort((a, b) => a.est - b.est) };
  };
  // Alternative für eine einzelne schwache Station: bester Kern, der mit höchstens einem Tausch erreichbar ist
  K.swapHint = (mode, stopKey, team) => {
    const set = new Set(team);
    const cores = mode.cores.filter((c) => c.stop === stopKey && c.n >= 10).sort((a, b) => b.lo - a.lo);
    for (const c of cores) { const miss = c.core.filter((l) => !set.has(l)); if (miss.length === 1) return { core: c, add: miss[0] }; }
    return null;
  };

  /* ---------- Plan & Ratgeber (für PvP, Kampagne und Turm gleich) ---------- */
  // Typische Level/Gold je Stage aus dem Stage-Ablauf einer Comp
  K.stageNorm = (c, stage) => {
    const st = c && c.guide && c.guide.stages ? c.guide.stages.find((g) => g.stage === stage) : null; if (!st) return null;
    const mode = (arr) => arr.reduce((a, b) => (b.share > a.share ? b : a));
    return { level: mode(st.levels).level, gold: mode(st.gold).from, units: st.units.filter((u) => u.share >= 35).map((u) => u.line) };
  };
  // Pläne für Kampagne/Turm: Team-Comps aus dem PvP (dort ist bewiesen, dass die Typen zusammenpassen),
  // bewertet mit den Kampagnen-/Turm-Daten der einzelnen Pokémon und passend zu dem, was du schon hast.
  // Statistik einer Linie im Modus (campana): PvP-ID, Kampagnen-ID oder – bei verankerten Formen – die Linie
  K.campStat = (mode) => {
    const ls = {}; for (const l of mode.lines) ls[l.line] = l;
    return (id) => { const s = splitId(id); return ls[id] || ls[CAMP_ALIAS[id]] || (s.anchor != null ? ls[s.base] || ls[CAMP_ALIAS[s.base]] : null) || null; };
  };
  // Kandidaten für Abenteuer/Turm-Pläne: was dort im Shop liegt, plus verankerte Formen mit eigenen Werten.
  // Laut Spielcode (Planer-Pool, Stand v40) gibt es dort die v35-Neuen außer Koga nicht im Shop.
  const PVE_NOT_IN_SHOP = new Set(['venomoth', 'porygon3', 'omastar', 'victreebel', 'tangela4', 'primeape', 'nidoqueen', 'kabutops', 'giovanni', 'samurai']);
  K.pveShop = (id) => { const l = data.lines[K.base(id)]; return !PVE_NOT_IN_SHOP.has(K.base(id)) && !!l && !!(l.shop || l.b); }; // b = Evoli-Entwicklung
  K.campPool = (mode) => {
    const ids = new Set(K.allShopLines.filter(K.pveShop));
    for (const l of mode.lines) if (K.anchorOf(l.line) != null && K.pveShop(l.line)) ids.add(l.line);
    return [...ids];
  };
  K.campComps = (mode, o = {}) => {
    const owned = o.owned || {}; const lineStat = {}; for (const l of mode.lines) lineStat[l.line] = l;
    // PvP-IDs der Comps auf die Kampagnen-IDs abbilden (primeape -> mankey …); verankerte Formen haben eigene Werte, sonst die der Linie
    const statOf = (id) => { const s = splitId(id); return lineStat[id] || lineStat[CAMP_ALIAS[id]] || (s.anchor != null ? lineStat[s.base] || lineStat[CAMP_ALIAS[s.base]] : null); };
    K.campStatOf = statOf;
    const availOf = (id) => { const a = avail[id] ?? avail[CAMP_ALIAS[id]] ?? avail[K.base(id)] ?? avail[CAMP_ALIAS[K.base(id)]]; return a == null ? null : a; };
    const avail = {}; for (const c of mode.cores) if (c.n >= 10) { const n = parseInt(c.stop, 10); for (const l of c.core) if (avail[l] == null || n < avail[l]) avail[l] = n; }
    const ownN = (id) => owned[K.base(id)] || 0;
    const seen = new Set(); const out = [];
    for (const c of K.comps.filter((x) => x.n >= 50 && !x.coreOnly).sort((a, b) => a.avg - b.avg)) {
      const units = K.boardUnits(c, 8); const key = units.map((u) => u.line).sort().join(','); if (seen.has(key)) continue; seen.add(key);
      let wsum = 0, dsum = 0, known = 0;
      for (const u of units) { const ls = statOf(u.line); const w = u.share; wsum += w; if (ls && ls.n >= 500) { dsum += w * ls.d; known += w; } }
      if (!known || known < wsum * 0.6) continue; // zu viele Pokémon ohne Daten in diesem Modus
      const strength = dsum / known;                     // Ø Vorteil der Pokémon in diesem Modus (Prozentpunkte)
      const fitW = units.reduce((s, u) => s + (ownN(u.line) ? u.share * (ownN(u.line) >= 3 ? 1.4 : 1) : 0), 0) / wsum;
      const late = units.filter((u) => availOf(u.line) != null && o.stop != null && availOf(u.line) > o.stop + 6).length;
      // Pokémon, die es im Abenteuer/Turm nicht im Shop gibt, machen die Comp dort schwer baubar
      const noShop = units.filter((u) => !K.pveShop(u.line)).length;
      const score = strength + 6 * fitW - 0.6 * late - 2 * noShop + Math.max(-1, Math.min(1, ((K.meta && K.meta.ref) || 4) - c.avg)) * 0.8;
      out.push({ comp: c, units, strength, fit: fitW, late, score, owned: units.filter((u) => ownN(u.line)).length });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, o.limit || 8);
  };
  // Rückfall ohne Statistik (meta.json fehlt): Pläne aus den Spielregeln mit Typ-Synergie bauen.
  // Je Paar aus Haupt- und Neben-Typ werden erst die Typ-Stufen gefüllt, dann der Rest mit den stärksten Pokémon.
  // stat(id) -> {d, n}: Vorteil im Modus (campana) – ohne das zählen die Kosten (teurer = stärker).
  // Ergebnis hat die Form einer Meta-Comp (synthetic: true), damit Overlay und Website sie wie einen Plan nutzen können.
  K.synergyComps = (o = {}) => {
    const size = Math.max(5, Math.min(9, o.size || 8)); const owned = o.owned || {}; const stat = o.stat || null;
    const pool = (o.lines || K.allShopLines).filter((id) => K.lineTypes(id).length && (!stat || (stat(id) && stat(id).n >= (o.minN || 300))));
    const own = (id) => owned[K.base(id)] || 0;
    const val = (id) => {
      let v = stat ? stat(id).d : (K.lineCost(id) - 3) * 1.2;
      if (own(id)) v += own(id) >= 3 ? 3 : 1.5;
      return v;
    };
    const has = (id, t) => K.lineTypes(id).includes(t);
    const reach = (t, n) => { const th = data.traits[t].th; let best = 0; for (const x of th) if (x <= n) best = x; return best; };
    const traits = Object.keys(data.traits).filter((t) => pool.some((id) => has(id, t)));
    const seen = new Set(); const out = [];
    for (const t1 of traits) for (const t2 of [null, ...traits]) {
      if (t2 === t1) continue;
      const team = []; const inTeam = (id) => team.some((x) => K.base(x) === K.base(id)); const take = (id) => { if (!inTeam(id) && team.length < size) team.push(id); };
      const c1 = pool.filter((id) => has(id, t1)).sort((a, b) => val(b) - val(a));
      const n1 = reach(t1, Math.min(c1.length, size - 2)); if (n1 < 2 && data.traits[t1].th[0] > 1) continue;
      c1.slice(0, n1 || 1).forEach(take);
      if (t2) {
        const c2 = pool.filter((id) => has(id, t2) && !inTeam(id)).sort((a, b) => val(b) - val(a));
        const now2 = team.filter((id) => has(id, t2)).length;
        const n2 = reach(t2, Math.min(now2 + c2.length, now2 + size - team.length));
        if (n2 <= now2) continue;
        c2.slice(0, n2 - now2).forEach(take);
      }
      // Rest: stärkste Pokémon, bevorzugt solche, die eine Typ-Stufe vollmachen
      while (team.length < size) {
        const cur = K.traitsFor(team.map((l) => ({ line: l, items: [] })));
        let best = null, bs = -Infinity;
        for (const id of pool) {
          if (inTeam(id)) continue;
          const bonus = K.lineTypes(id).reduce((s, t) => { const x = cur.find((y) => y.type === t); return s + (x && x.next && x.next - x.n === 1 ? 2 : 0); }, 0);
          const s = val(id) + bonus; if (s > bs) { bs = s; best = id; }
        }
        if (!best) break; take(best);
      }
      const key = [...team].sort().join(','); if (seen.has(key)) continue; seen.add(key);
      const tr = K.traitsFor(team.map((l) => ({ line: l, items: [] })));
      const score = team.reduce((s, id) => s + val(id), 0) / team.length + tr.reduce((s, x) => s + x.lv * 0.6, 0);
      const main = tr.find((x) => x.type === t1) || tr[0];
      out.push({ t1, t2, team, tr, score, main });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, o.limit || 8).map((x, i) => {
      const id = 'syn:' + x.t1 + (x.t2 ? '+' + x.t2 : '');
      const c = { id, synthetic: true, tier: '≈', avg: null, n: 0, score: x.score, idx: -1 - i,
        name: { trait: x.main.type, level: x.main.lv || 1, units: x.team.filter((l) => has(l, x.main.type)).sort((a, b) => K.lineCost(b) - K.lineCost(a)).slice(0, 2) },
        units: x.team.map((l, k) => ({ line: l, star: 2, share: 100 - k, items: [] })), traits: x.tr.filter((y) => y.lv > 0).map((y) => ({ type: y.type, level: y.lv, share: 100 })) };
      K.compById[id] = c; return c;
    });
  };
  // Safari-Zone (Karussell): welche Karte (Pokémon + Item) nehmen? Unter Zeitdruck zählt eine klare Reihenfolge.
  // o: { cards: [{line, item, taken}], plan: [{line, share}], owned: {line: Kopien}, want: {itemId: Gewicht}, board: [line] }
  // Liefert die freien Karten absteigend bewertet: [{idx, score, why: ['star'|'core'|'plan'|'item'|'trait'|'own'|'cost'], item}]
  K.safariPick = (o) => {
    const owned = o.owned || {}; const plan = o.plan || []; const want = o.want || {};
    const pl = {}; plan.forEach((u, i) => { const b = K.base(u.line); if (!pl[b]) pl[b] = { ...u, rank: i }; });
    const field = K.traitsFor((o.board || []).map((l) => ({ line: l, items: [] })));
    const out = [];
    (o.cards || []).forEach((c, idx) => {
      if (!c || c.taken || !c.line) return;
      const b = K.base(c.line); const own = owned[b] || 0; const p = pl[b]; const why = []; let s = 0;
      if (own % 3 === 2 && own < 9) { s += 60; why.push('star'); }                       // macht einen Stern
      if (p) { s += p.share >= 80 ? 45 : 32; why.push(p.share >= 80 ? 'core' : 'plan'); }
      else if (own > 0 && own < 9) { s += 10; if (!why.length) why.push('own'); }
      if (!p && !own && K.lineTypes(b).some((t) => { const x = field.find((y) => y.type === t); return x && x.next && x.next - x.n === 1; })) { s += 12; why.push('trait'); }
      const iw = c.item ? want[c.item] || 0 : 0;
      if (iw) { s += iw; why.push('item'); }
      else if (c.item && data.items[c.item] && data.items[c.item].k === 'full') { s += 14; why.push('full'); } // fertiges Item ist immer etwas wert
      else if (c.item && data.items[c.item] && data.items[c.item].k === 'part') s += 6;
      s += K.lineCost(b) * 1.5; if (!why.length) why.push('cost');
      out.push({ idx, line: c.line, item: c.item, score: s, why });
    });
    return out.sort((a, b) => b.score - a.score);
  };
  // Item-Belohnung („Wähle eins!“): welches Item nehmen?
  // o: { items: [itemId], want: {itemId: Gewicht} (aus dem Plan), bag: {itemId: Anzahl} }
  // Liefert [{idx, id, score, why: ['want'|'pair'|'full'|'part'|'other'], makes?}] absteigend
  K.lootPick = (o) => {
    const want = o.want || {}; const bag = o.bag || {};
    const tierV = (id) => { const x = K.itemTier[id]; return x ? ({ S: 12, A: 8, B: 4, C: 1 }[x.tier] || 0) : 4; };
    const out = [];
    (o.items || []).forEach((id, idx) => {
      const it = data.items[id]; if (!it) return;
      let s = 0; const why = []; let makes = null;
      if (want[id]) { s += want[id] + 10; why.push('want'); }
      if (it.k === 'full') { s += 14 + tierV(id); if (!why.length) why.push('full'); }
      else if (it.k === 'part') {
        // Passt zu einer Komponente im Beutel? Dann entsteht sofort ein fertiges Item
        let best = null;
        for (const [a, b, r] of data.recipes || []) {
          const other = a === id ? b : b === id ? a : null; if (other == null) continue;
          if (!((bag[other] || 0) > 0)) continue; // das angebotene Item ist neu, also reicht eine passende Komponente im Beutel
          const v = (want[r] || 0) + tierV(r); if (!best || v > best.v) best = { r, v };
        }
        if (best) { s += 8 + best.v; makes = best.r; if (!why.length) why.push('pair'); }
        else {
          // Sonst: die Komponente, aus der die stärksten Items entstehen (bei Gleichstand)
          const flex = Math.max(0, ...(data.recipes || []).filter(([a, b]) => a === id || b === id).map(([, , r]) => tierV(r) + (want[r] ? 6 : 0)));
          s += 6 + flex * 0.5; if (!why.length) why.push('part');
        }
      } else { s += 3; if (!why.length) why.push('other'); }
      out.push({ idx, id, score: s, why, makes });
    });
    return out.sort((a, b) => b.score - a.score);
  };
  // Segen des Turms (alle 10 Etagen ab 11): Karte über ihr Bild erkennen (data.boons[].art, beim Geschenk das Item selbst).
  // Keine Statistik in der API, darum Faustregeln: Komponenten/Items wirken die ganze Partie, Level nur mit wartenden Pokémon,
  // Trank/Asche nur bei wenig KP. o: { arts: [bild-id], level, hp, want: {itemId: Gewicht}, waiting, lost, floor }
  K.boonOf = (art) => {
    if (!art) return null;
    const b = Object.entries(data.boons || {}).find(([, x]) => x.art === art); if (b) return { id: b[0], item: null };
    return data.items[art] && data.items[art].k === 'full' ? { id: 'item', item: art } : null;
  };
  K.boonPick = (o) => {
    const lvl = o.level || 0; const hp = o.hp == null ? 100 : o.hp; const want = o.want || {}; const floor = o.floor || 11;
    const tierV = (id) => { const x = K.itemTier[id]; return x ? ({ S: 10, A: 7, B: 4, C: 1 }[x.tier] || 0) : 4; };
    const out = [];
    (o.arts || []).forEach((art, idx) => {
      const b = K.boonOf(art); if (!b) return; let s = 10; let why = b.id;
      switch (b.id) {
        case 'vitamins': s = 30; break;
        case 'item': s = 24 + tierV(b.item) + (want[b.item] ? 12 : 0); why = want[b.item] ? 'itemPlan' : 'item'; break;
        case 'candy': s = lvl >= 9 ? 0 : 20 + (o.waiting > 0 || o.lost ? 10 : 0); why = o.waiting > 0 || o.lost ? 'candyNeed' : 'candy'; break;
        case 'expshare': s = lvl >= 8 ? 4 : 20; break;
        case 'potion': s = hp <= 50 ? 34 : 8; why = hp <= 50 ? 'potionNeed' : 'potion'; break;
        case 'ash': s = hp <= 40 ? 30 : 14; break;
        case 'amulet': s = floor < 40 ? 22 : 12; break;
        case 'nugget': s = 18; break;
        case 'egg': s = 22; break;
        case 'moonstone': s = 20; break;
        case 'flute': s = 18; break;
        case 'master': s = 15; break;
        case 'coincase': s = 14; break;
        case 'wonder': s = 6; break;
      }
      out.push({ idx, id: b.id, item: b.item, score: s, why });
    });
    return out.sort((a, b) => b.score - a.score);
  };
  // Siegel im Spiel erkennen: Name aus der Karte (Spielsprache) gegen en/es und die eigene deutsche Übersetzung.
  // Typ-Siegel („{T}-Herz“) werden über die Vorlage erkannt, der Typ über seinen Namen. Liefert {id, type} oder null.
  const normS = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9{}]+/g, '');
  let sealIdx = null;
  const sealIndex = () => {
    if (sealIdx) return sealIdx;
    const sde = (typeof window !== 'undefined' && window.KK_SEALS_DE) || {};
    const exact = {}; const tpl = [];
    for (const [id, s] of Object.entries(data.seals || {})) {
      for (const n of [s.name && s.name.en, s.name && s.name.es, sde[id] && sde[id][0]]) {
        if (!n) continue;
        if (s.template === 'type' && n.includes('{T}')) { const [a, b] = normS(n).split('{t}'); tpl.push({ id, a, b }); } else exact[normS(n)] = id;
      }
    }
    const types = Object.keys(data.traits || {}).map((t) => ({ t, names: [data.traits[t].en, data.traits[t].es, DE.types && DE.types[t]].filter(Boolean).map(normS) }));
    return (sealIdx = { exact, tpl, types });
  };
  K.sealMatch = (label, round) => {
    const n = normS(String(label || '').split(':')[0]); if (!n) return null;
    const ix = sealIndex();
    if (ix.exact[n]) return { id: ix.exact[n], type: null };
    for (const x of ix.tpl) {
      if (!n.startsWith(x.a) || !n.endsWith(x.b) || n.length <= x.a.length + x.b.length) continue;
      const mid = n.slice(x.a.length, n.length - x.b.length); const ty = ix.types.find((y) => y.names.includes(mid));
      if (ty) return { id: x.id, type: ty.t };
    }
    // Rückfall (Name anders übersetzt): gleiche Zahlen im Wirkungstext wie genau ein Siegel dieser Runde
    const nums = (t) => (String(t || '').match(/\d+/g) || []).sort().join(',');
    const want = nums(String(label).split(':').slice(1).join(':').split('.')[0]);
    if (!want) return null;
    const hit = Object.entries(data.seals || {}).filter(([, s]) => s.template !== 'type' && (s.text || []).some((t) => (!round || t.round === round) && nums(t.line && t.line.en) === want));
    return hit.length === 1 ? { id: hit[0][0], type: null } : null;
  };
  // Grobe Rolle einer Linie aus Reichweite und Attacke (die API nennt keine Rollen)
  K.lineRole = (id) => {
    const l = data.lines[K.base(id)]; if (!l) return null; const s = l.stars[0]; const kind = s.move && s.move.kind; const hp = s.stats ? s.stats.hp : 0;
    if (['heal', 'shield', 'buff'].includes(kind) && l.range >= 2) return 'support';
    if (l.range >= 3) return 'marksman';
    if (['dash', 'teleport', 'execute'].includes(kind)) return 'assassin';
    if (l.range <= 1 && (['shield', 'aoeSelf', 'buff'].includes(kind) || hp / Math.max(1, l.c) >= 1000)) return 'tank';
    return 'fighter';
  };
  const ROLE_RX = { tank: /tank/i, marksman: /marksm/i, support: /support/i, fighter: /fighter/i, assassin: /assassin/i };
  // Siegel-Wahl: keine Statistik in der API, darum Faustregeln. Wirtschaft/EP früh, Typ-/Rollen-Siegel nur, wenn sie zum Plan passen.
  // o: { seals: [{id, type}], plan: [{line}], owned: {line: n}, stage }  ->  [{idx, id, type, score, why}]
  K.sealPick = (o) => {
    const stage = o.stage || 3; const plan = o.plan || []; const owned = o.owned || {};
    const tr = K.traitsFor(plan.map((u) => ({ line: u.line, items: [] })));
    const lines = new Set([...plan.map((u) => K.base(u.line)), ...Object.keys(owned).filter((l) => owned[l] > 0)]);
    const roles = {}; plan.forEach((u) => { const r = K.lineRole(u.line); if (r) roles[r] = (roles[r] || 0) + 1; });
    const out = [];
    (o.seals || []).forEach((x, idx) => {
      if (!x || !x.id) return; const s = (data.seals || {})[x.id]; if (!s) return;
      const txt = (s.text || []).map((t) => (t.line && t.line.en) || '').join(' ');
      let sc = 10; let why = s.cat;
      if (s.cat === 'eco') sc = stage <= 2 ? 30 : stage === 3 ? 24 : 8;
      else if (s.cat === 'xp') sc = stage <= 2 ? 22 : stage === 3 ? 16 : 6;
      else if (s.cat === 'item') sc = 28; // Komponenten/fertige Items wirken die ganze Partie
      else if (s.cat === 'shop') sc = 16;
      else if (s.cat === 'board') sc = 15;
      else if (s.cat === 'later') sc = stage <= 3 ? 14 : 6;
      else if (s.cat === 'trait') {
        const t = x.type && tr.find((y) => y.type === x.type);
        sc = !x.type ? 10 : t && t.lv > 0 ? 34 + t.lv * 2 : 3; why = !x.type ? 'trait' : t && t.lv > 0 ? 'traitFit' : 'miss';
      } else if (s.cat === 'role') {
        const r = Object.keys(ROLE_RX).filter((k) => ROLE_RX[k].test(txt)); const n = r.reduce((a, k) => a + (roles[k] || 0), 0);
        sc = r.length ? (n >= 2 ? 30 : n === 1 ? 16 : 3) : 14; why = r.length ? (n >= 1 ? 'roleFit' : 'miss') : 'role';
      } else if (s.cat === 'hero') { const fit = s.hero && lines.has(s.hero); sc = fit ? 34 : 2; why = fit ? 'heroFit' : 'miss'; }
      else if (s.cat === 'combat') {
        const ty = Object.keys(data.traits || {}).filter((t) => new RegExp('\\b' + data.traits[t].en + '\\b').test(txt));
        const fit = ty.some((t) => tr.some((y) => y.type === t && y.lv > 0));
        sc = !ty.length ? 18 : fit ? 30 : 6; why = !ty.length ? 'combat' : fit ? 'traitFit' : 'miss';
      }
      sc += ((s.rarity || 1) - 1) * 3;
      out.push({ idx, id: x.id, type: x.type, score: sc, why });
    });
    return out.sort((a, b) => b.score - a.score);
  };
  // Ratgeber: Was kaufe ich, was mache ich mit dem Gold, was fehlt dem Feld?
  // o: { plan: [{line, share, star}], owned, board: [{line, star}], shop: [line], level, gold, stage, comp }
  K.advise = (o) => {
    const owned = o.owned || {}; const plan = o.plan || []; const pl = {}; plan.forEach((u, i) => { const b = K.base(u.line); if (!pl[b]) pl[b] = { ...u, rank: i }; });
    const boardLines = [...new Set((o.board || []).map((u) => K.base(u.line)))];
    const fieldTraits = K.traitsFor(boardLines.map((l) => ({ line: l, items: [] })));
    const gold = o.gold || 0; const buys = [];
    const counted = {};
    (o.shop || []).forEach((line, slot) => {
      if (!line) return; const cost = K.lineCost(line) || 1; const own = (owned[line] || 0) + (counted[line] || 0);
      const inPlan = pl[line]; const onField = boardLines.includes(line);
      let kind = '', prio = 0, why = '';
      if (own % 3 === 2 && own < 9 && (inPlan || onField || own >= 2)) { kind = 'star'; prio = inPlan ? 100 : 80; why = own >= 8 ? 'star3' : 'star2'; }
      else if (inPlan && own === 0) { kind = 'buy'; prio = 70 - inPlan.rank * 2 + (inPlan.share >= 80 ? 8 : 0); why = inPlan.share >= 80 ? 'core' : 'plan'; }
      else if (inPlan && own % 3 === 1 && own < 9) { kind = 'buy'; prio = 50 - inPlan.rank; why = 'pair'; } // ab ★★★ (9 Kopien) bringt eine weitere nichts
      else if (!onField && !own) {
        const hit = K.lineTypes(line).map((t) => fieldTraits.find((x) => x.type === t)).find((x) => x && x.next && x.next - x.n === 1);
        if (hit) { kind = 'trait'; prio = 30; why = 'trait'; buys.push({ line, slot, cost, kind, prio, why, trait: hit.type, next: hit.next }); counted[line] = (counted[line] || 0) + 1; return; }
      }
      if (kind) { buys.push({ line, slot, cost, kind, prio, why }); counted[line] = (counted[line] || 0) + 1; }
    });
    buys.sort((a, b) => b.prio - a.prio);
    // Gold reicht nicht für alles: von oben nach unten kaufen
    let left = gold; for (const b of buys) { b.affordable = b.cost <= left; if (b.affordable) left -= b.cost; }
    const tips = [];
    // Zinsen: im PvP aus den Regeln; Kampagne/Turm können andere Grenzen haben (der Leser liest sie aus der Gold-Anzeige)
    const it = o.interest || data.pvp.interest || { step: 10, max: 5 }; const cap = it.step * it.max;
    const free = o.teamN != null && o.level ? o.level - o.teamN : null;
    if (free > 0) tips.push({ k: 'free', n: free });
    const near = fieldTraits.filter((x) => x.next && x.next - x.n === 1).slice(0, 2);
    for (const x of near) tips.push({ k: 'near', type: x.type, n: x.n, next: x.next });
    const norm = o.stage != null && o.comp ? K.stageNorm(o.comp, o.stage) : null;
    const missing = plan.filter((u) => !owned[K.base(u.line)]).length;
    if (norm && o.level && o.level < norm.level) tips.push({ k: 'level', stage: o.stage, level: norm.level });
    // Abenteuer/Turm (keine Stage-Normen): Gold über der Zinsgrenze arbeitet nicht – in EP oder Sterne stecken.
    // Nach einer Niederlage (o.lost) zählt Stärke mehr als Zinsen. o.xp = { buys } aus der Level-Anzeige des Spiels.
    const pve = o.stage == null && !!o.mode && o.mode !== 'pvp';
    const spare = left - cap; const lvl = o.level || 0;
    const waiting = o.bench != null ? o.bench : 0; // Plan-/starke Pokémon, die keinen Platz haben
    let xpTip = null;
    if (pve && lvl && lvl < 9 && !o.nz) {
      const need = o.xp && o.xp.buys ? o.xp.buys : 1;
      if ((spare >= 4 && (waiting > 0 || plan.length > lvl)) || (o.lost && left >= 4)) xpTip = { k: 'xp', buys: Math.max(1, Math.min(need, Math.floor((o.lost ? left : spare) / 4))), need, level: lvl + 1, lost: !!o.lost };
    }
    if (xpTip) tips.push(xpTip);
    if (!buys.some((b) => b.kind !== 'trait' && b.affordable) && !o.nz) {
      if (gold < cap && !(pve && o.lost)) tips.push({ k: 'save', cap, max: it.max, gold });
      else if (missing > 0 && gold >= cap) tips.push({ k: 'roll', cap, missing });
      else if (pve && !xpTip && spare >= 2) tips.push({ k: 'rollStar', cap });
    }
    return { buys, tips, fieldTraits, cap };
  };

  /* ---------- Kampagnen-/Turm-Coach: Phasen und Kaufempfehlung ---------- */
  // Abschnitte nach Stationsnummer (Kampagne) bzw. Etage (Turm)
  K.campPhases = (kind, mode) => {
    const nums = mode ? mode.stops.map((s) => parseInt(s.stop, 10)) : [];
    const last = nums.length ? Math.max(...nums) : (kind === 'tower' ? 200 : 38);
    const cuts = kind === 'tower' ? [[1, 20], [21, 50], [51, Math.max(51, last)]] : [[1, 8], [9, 20], [21, Math.max(21, last)]];
    return cuts.map(([a, b], i) => ({ i, from: a, to: b, key: ['early', 'mid', 'late'][i] }));
  };
  K.phaseOf = (phases, stop) => { if (stop == null) return 0; const i = phases.findIndex((p) => stop >= p.from && stop <= p.to); return i < 0 ? (stop < phases[0].from ? 0 : phases.length - 1) : i; };
  // o: { kind, stop, owned: {line: Kopien}, level }
  K.campPlan = (mode, o = {}) => {
    const phases = K.campPhases(o.kind, mode); const cur = K.phaseOf(phases, o.stop);
    const owned = o.owned || {}; const bonus = {};
    for (const [l, n] of Object.entries(owned)) if (n > 0) bonus[l] = n >= 9 ? 5 : n >= 3 ? 3 : 1.5;
    const sizes = o.kind === 'tower' ? [6, 8, 9] : [5, 7, 8];
    return phases.map((p, i) => {
      if (i < cur) return { ...p, past: true };
      const from = i === cur && o.stop != null ? Math.max(p.from, o.stop) : p.from;
      let size = sizes[i]; if (i === cur && o.level) size = Math.max(3, Math.min(9, Math.max(o.level, size - 1)));
      const half = Object.fromEntries(Object.entries(bonus).map(([l, v]) => [l, v / 2]));
      const res = K.optimizeFixedTeam(mode, { size, from, to: p.to, bonus: i === cur ? bonus : i === cur + 1 ? half : {}, minN: 100, maxFrom: p.to });
      return { ...p, from, size, current: i === cur, res };
    });
  };
  // Beste Kerne (3 Pokémon) für die nächsten Stationen
  K.campCores = (mode, stop, span = 4) => {
    const s0 = stop || 1; const base = {}; for (const s of mode.stops) base[s.stop] = s.win;
    return mode.cores.filter((c) => c.n >= 10 && parseInt(c.stop, 10) >= s0 && parseInt(c.stop, 10) <= s0 + span)
      .map((c) => ({ ...c, num: parseInt(c.stop, 10), base: base[c.stop] == null ? null : base[c.stop], gain: c.lo - (base[c.stop] || 50) }))
      .sort((a, b) => a.num - b.num || b.gain - a.gain);
  };
  // Kaufempfehlung aus dem Shop: Begründungen aus Team-Plan, Kernen der nächsten Stationen, Kopien und Linien-Statistik
  K.campShopRecs = (mode, o = {}, plan) => {
    const owned = o.owned || {}; const shop = [...new Set((o.shop || []).filter(Boolean))];
    const lineStat = {}; for (const l of mode.lines) lineStat[l.line] = l;
    const curP = (plan || []).find((p) => p.current && p.res); const nextP = (plan || []).find((p) => !p.past && !p.current && p.res);
    const inCur = new Set(curP ? curP.res.units.map((u) => u.line) : []); const inNext = new Set(nextP ? nextP.res.units.map((u) => u.line) : []);
    const cores = K.campCores(mode, o.stop, 5);
    const out = [];
    for (const line of shop) {
      let score = 0; const why = [];
      if (inCur.has(line)) { score += 3; why.push({ k: 'team', phase: curP.key }); }
      else if (inNext.has(line)) { score += 1.5; why.push({ k: 'next', phase: nextP.key }); }
      const own = owned[line] || 0;
      let bestCore = null;
      for (const c of cores) {
        if (!c.core.includes(line) || c.base == null || c.lo < c.base + 3) continue; // nur Kerne, die klar besser sind als der Schnitt
        const others = c.core.filter((x) => x !== line); const have = others.filter((x) => (owned[x] || 0) > 0).length;
        const v = (have === 2 ? 4 : have === 1 ? 1.5 : 0.3) * Math.max(0.2, Math.min(2, (c.gain + 10) / 25));
        if (!bestCore || v > bestCore.v) bestCore = { v, c, have, others };
      }
      if (bestCore && bestCore.have > 0) { score += bestCore.v; why.push({ k: 'core', core: bestCore.c, have: bestCore.have, others: bestCore.others }); }
      if (own % 3 === 2) { score += 2; why.push({ k: 'star', n: own + 1 }); } else if (own > 0) { score += 0.6; why.push({ k: 'own', n: own }); }
      const ls = lineStat[line];
      if (ls && ls.d >= 2) { score += 0.6; why.push({ k: 'strong', d: ls.d }); } else if (ls && ls.flag === 'weak' && score < 1) { score -= 0.8; why.push({ k: 'weak', d: ls.d }); }
      out.push({ line, score, why });
    }
    return out.sort((a, b) => b.score - a.score);
  };

  return K;
}

root.KKCore = { NEW_LINES, PVP_ALIAS, CAMP_ALIAS, splitId, spriteDex, create, binomAtLeast, atLeastK, TYPE_COL, COST_COL, STONE_ART, NUM };
})(typeof window !== 'undefined' ? window : globalThis);
