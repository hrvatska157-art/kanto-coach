/* Kanto Coach – Hintergrunddienst
 * Lädt meta.json und data.json (eigener Coach-Server oder direkt einoow.com), speichert sie zwischen
 * (höchstens einmal pro Stunde neu, wie es die API-Bedingungen verlangen) und liefert Sprites als data:-URLs.
 */
'use strict';
// Deutsche Namen (KK_DE) auch im Hintergrund verfügbar machen, damit der Leser deutsche Beschriftungen zuordnen kann
self.window = self;
try { importScripts('lib/i18n-game.js'); } catch (e) { console.warn('i18n nicht geladen', e); }
const GAME = 'https://einoow.com/playables/kanto-tactics/';
const API = 'https://einoow.com/api/meta/kanto/';
const GH = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/';
const MAX_AGE = 60 * 60 * 1000;
const sprites = new Map();

async function settings() {
  const s = await chrome.storage.sync.get({ server: '', lang: 'de' });
  s.server = (s.server || '').trim().replace(/\/+$/, '');
  return s;
}
async function fetchJSON(url) {
  // Mit Zeitlimit: einoow.com antwortet bei Ausfällen manchmal gar nicht, dann bliebe der Leser ohne Zuordnungstabelle
  const r = await fetch(url, { cache: 'no-cache', signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' (' + url + ')');
  return r.json();
}
async function fetchFile(name, s) {
  if (s.server) {
    try { return { json: await fetchJSON(s.server + '/api/' + name), source: s.server }; }
    catch (e) { console.warn('Coach-Server nicht erreichbar, nutze einoow.com', e); }
  }
  return { json: await fetchJSON(API + name), source: 'einoow.com' };
}
// meta.json (Statistik) und data.json (Regeln) getrennt behandeln: Fällt die Statistik aus (die API antwortet dann mit 503),
// bleibt der letzte gute Stand in Gebrauch; ohne jeden Stand läuft der Coach nur mit den Spielregeln weiter.
async function getData(force) {
  const cached = await chrome.storage.local.get(['meta', 'data', 'fetchedAt', 'source', 'metaAt', 'metaErr']);
  if (!force && cached.data && Date.now() - (cached.fetchedAt || 0) < MAX_AGE) return cached;
  const s = await settings();
  const [m, d] = await Promise.allSettled([fetchFile('meta.json', s), fetchFile('data.json', s)]);
  const out = { meta: cached.meta || null, data: cached.data || null, metaAt: cached.metaAt || 0, source: cached.source || '' };
  if (d.status === 'fulfilled') { out.data = d.value.json; out.source = d.value.source; }
  if (m.status === 'fulfilled' && m.value.json && Array.isArray(m.value.json.comps)) { out.meta = m.value.json; out.metaAt = Date.now(); out.metaErr = ''; }
  else out.metaErr = String((m.reason && (m.reason.message || m.reason)) || 'meta.json ohne Comps');
  if (!out.data) throw (d.reason || new Error('data.json nicht erreichbar'));
  out.fetchedAt = Date.now();
  if (d.status === 'rejected') out.stale = true;
  await chrome.storage.local.set(out);
  return out;
}
/* Kampagnen- und Turmdaten (campana.json), je Schwierigkeit zwischengespeichert, höchstens stündlich neu */
async function getCamp(dif, force) {
  const k = 'camp:' + (dif || 0); const cached = (await chrome.storage.local.get(k))[k];
  if (!force && cached && Date.now() - cached.at < MAX_AGE) return cached.json;
  try {
    const s = await settings(); const q = 'campana.json' + (dif ? '?dif=' + dif : '');
    const r = await fetchFile(q, s);
    // Speicher der Erweiterung hat 10 MB, eine Schwierigkeit braucht ~3 MB: höchstens zwei behalten (diese + die zuletzt geladene andere),
    // sonst ist der Speicher voll und Spielstand/Markierungen (kkLive, kkMarks) können nicht mehr geschrieben werden
    const all = await chrome.storage.local.get(null);
    const old = Object.keys(all).filter((x) => x.startsWith('camp:') && x !== k).sort((a, b) => ((all[b] && all[b].at) || 0) - ((all[a] && all[a].at) || 0)).slice(1);
    if (old.length) await chrome.storage.local.remove(old);
    await chrome.storage.local.set({ [k]: { json: r.json, at: Date.now() } });
    return r.json;
  } catch (e) { if (cached) return cached.json; throw e; }
}
async function blobToDataURL(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer()); let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  return 'data:' + (blob.type || 'image/png') + ';base64,' + btoa(bin);
}
async function sprite(kind, name) {
  const key = kind + ':' + name;
  if (sprites.has(key)) return sprites.get(key);
  const stored = (await chrome.storage.local.get('spr:' + key))['spr:' + key];
  if (stored) { sprites.set(key, stored); return stored; }
  const s = await settings();
  const urls = [];
  if (kind === 'gameitem') urls.push(`${GAME}pk/items/${name}.png`);
  else {
    // Figuren-Pokémon (9000 + Nr.): normales Sprite der Pokédex-Nummer
    const n = kind === 'pokemon' && +name > 9000 ? +name - 9000 : name;
    if (s.server) urls.push(`${s.server}/img/${kind}/${n}.png`);
    urls.push(`${GH}${kind}/${n}.png`);
  }
  for (const u of urls) {
    try { const r = await fetch(u); if (!r.ok) continue; const url = await blobToDataURL(await r.blob()); sprites.set(key, url); chrome.storage.local.set({ ['spr:' + key]: url }); return url; } catch (e) { /* nächste Quelle */ }
  }
  sprites.set(key, ''); return '';
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  checkDiskUpdate(); // jede Anfrage aus dem Spiel ist eine Gelegenheit, auf eine neue Version im Ordner zu prüfen
  (async () => {
    try {
      if (msg.type === 'getData') reply({ ok: true, ...(await getData(msg.force)) });
      else if (msg.type === 'getCamp') reply({ ok: true, camp: await getCamp(+msg.dif || 0, msg.force) });
      else if (msg.type === 'sprites') {
        const out = {};
        await Promise.all((msg.list || []).slice(0, 80).map(async (x) => { if (/^(pokemon|items|gameitem)$/.test(x.kind) && /^[a-z0-9-]{1,40}$/.test(String(x.name))) out[x.kind + ':' + x.name] = await sprite(x.kind, x.name); }));
        reply({ ok: true, sprites: out });
      } else if (msg.type === 'settings') reply({ ok: true, settings: await settings() });
      else if (msg.type === 'openOverlay') reply({ ok: await ensureOverlay(msg.tabId).then(async (ok) => { if (ok) { try { await chrome.tabs.sendMessage(msg.tabId, { type: 'show' }); } catch (e) {} } return ok; }) });
      else if (msg.type === 'nameMap' || msg.type === 'readerMap') reply({ ok: true, ...readerMap((await getData(false)).data) });
      else if (msg.type === 'status') { const c = await chrome.storage.local.get(['fetchedAt', 'source']); reply({ ok: true, ...c }); }
      else reply({ ok: false, error: 'unknown message' });
    } catch (e) { reply({ ok: false, error: String(e.message || e) }); }
  })();
  return true;
});

/* Zuordnungstabellen für den Leser im Spiel-Frame.
 * base:  Pokédex-Nummer der Shop-Karte (immer die Grundform) -> Linie
 * forms: Pokédex-Nummer einer beliebigen Form -> [Linie, kleinster Stern dieser Form]
 * names: Name in Englisch oder Deutsch (klein) -> Linie, nur als Rückfall
 * items: bekannte Item-IDs -> Art (part/full/tool/emblem) */
// Pokémon, die in den PvP-Statistiken der API (noch) fehlen: Kampagnen-Pokémon und die Neuen aus Version 35 (gleiche Tabelle wie in core.js)
const EXTRA_DEX = { bellsprout: [69, 70, 71], clefairy: [35, 36], drowzee: [96, 97], grimer: [88, 89], kangaskhan: [115], koffing: [109, 110], mankey: [56, 57], meowth: [52, 53], mrmime: [122], nidoranf: [29, 30, 31], pinsir: [127], porygon: [137], tangela: [114], venonat: [48, 49], omanyte: [138, 139], kabuto: [140, 141], doduo: [84, 85] };
function readerMap(d) {
  const base = {}, forms = {}, names = {}, items = {}, formIdx = {}, last = {};
  const ids = Object.keys(d.lines).sort((a, b) => (d.lines[b].shop ? 1 : 0) - (d.lines[a].shop ? 1 : 0));
  const de = (self.KK_DE && self.KK_DE.pokemon) || {};
  for (const id of ids) {
    const l = d.lines[id];
    const b = l.stars[0] && l.stars[0].dex;
    if (b && (base[b] == null || (l.shop && id === String(l.n[0]).toLowerCase()))) base[b] = id;
    for (const st of l.stars) {
      const f = forms[st.dex];
      if (!f || (!d.lines[f[0]].shop && l.shop) || (f[0] === id && st.star < f[1])) forms[st.dex] = [id, st.star];
    }
    // Für verankerte Formen: Nummer der Form in ihrer Linie und letzte Form
    const fd = l.s && l.s.length ? l.s : [...new Set(l.stars.map((x) => x.dex))];
    if (l.shop || !last[id]) { fd.forEach((x, i) => { if (forms[x] && forms[x][0] === id) formIdx[x] = i; }); last[id] = fd[fd.length - 1]; }
    const all = [...(l.n || []), ...l.stars.map((x) => x.name)];
    for (const n of all) { for (const v of [n, de[n]]) if (v) { const k = String(v).toLowerCase(); if (!names[k] || (l.shop && k === String(l.n[0]).toLowerCase())) names[k] = id; } }
  }
  for (const [id, l] of Object.entries(d.lines)) if (l.shop) { const k = String(l.n[0]).toLowerCase(); names[k] = id; if (de[l.n[0]]) names[de[l.n[0]].toLowerCase()] = id; }
  const extra = {};
  const camp = (self.KK_DE && self.KK_DE.campaignOnly) || {};
  for (const [id, dex] of Object.entries(EXTRA_DEX)) {
    if (d.lines[id]) continue;
    extra[id] = true;
    if (base[dex[0]] == null) base[dex[0]] = id;
    dex.forEach((x, i) => { if (!forms[x]) forms[x] = [id, i + 1]; });
    for (const n of camp[id] || []) for (const v of [n, de[n]]) if (v && !names[String(v).toLowerCase()]) names[String(v).toLowerCase()] = id;
  }
  for (const [id, it] of Object.entries(d.items || {})) items[id] = it.k;
  return { base, forms, names, items, extra, formIdx, last };
}

/* Overlay in einem beliebigen Tab öffnen (Popup oder Tastenkürzel) */
async function ensureOverlay(tabId) {
  try { const r = await chrome.tabs.sendMessage(tabId, { type: 'ping' }); if (r && r.ok) return true; } catch (e) { /* noch nicht geladen */ }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['lib/i18n-game.js', 'lib/core.js', 'content/overlay.js'] });
    return true;
  } catch (e) { console.warn('Overlay kann hier nicht geöffnet werden', e); return false; }
}
async function toTab(tabId, msg) { if (await ensureOverlay(tabId)) { try { await chrome.tabs.sendMessage(tabId, msg); } catch (e) {} } }
chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (!tab || !tab.id) [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  if (cmd === 'toggle-overlay') toTab(tab.id, { type: 'toggle' });
  if (cmd === 'clear-shop') toTab(tab.id, { type: 'clearShop' });
});

chrome.alarms.create('refresh', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'refresh') getData(true).catch(() => {}); if (a.name === 'disk') checkDiskUpdate(); });
chrome.runtime.onInstalled.addListener(() => { getData(true).catch(() => {}); });

/* Entpackt installiert (Ordner): Liegt dort eine neuere Version, lädt sich die Erweiterung selbst neu und spielt die neuen
 * Skripte in offene Spiel-Tabs ein – kein Klick in chrome://extensions nötig. (Bei der Erweiterung aus dem Web Store wäre
 * die Datei immer gleich, dann passiert nichts.) */
let lastDiskCheck = 0;
async function checkDiskUpdate() {
  if (Date.now() - lastDiskCheck < 20000) return; lastDiskCheck = Date.now();
  try {
    const m = await (await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' })).json();
    if (m.version && m.version !== chrome.runtime.getManifest().version) chrome.runtime.reload();
  } catch (e) { /* Datei gerade im Umbau – nächster Versuch */ }
}
chrome.alarms.create('disk', { periodInMinutes: 1 });
chrome.runtime.onInstalled.addListener(async (d) => {
  if (d.reason !== 'update') return;
  // Nach dem Neuladen laufen die alten Skripte in offenen Tabs verwaist weiter – neue einspielen (sie räumen die alten weg)
  const tabs = await chrome.tabs.query({ url: 'https://einoow.com/*' }).catch(() => []);
  for (const t of tabs) for (const c of chrome.runtime.getManifest().content_scripts || []) {
    try { await chrome.scripting.executeScript({ target: { tabId: t.id, allFrames: !!c.all_frames }, files: c.js }); } catch (e) { /* Tab ohne Zugriff */ }
  }
});
