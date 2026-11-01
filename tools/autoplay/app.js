#!/usr/bin/env node
// Kanto Coach Autoplay – eigenständiges Programm mit Oberfläche. Startet einen kleinen Server nur auf diesem PC
// (127.0.0.1) und öffnet die Oberfläche als App-Fenster. Der Bot spielt in einem eigenen Chrome (Gast-Profil) und braucht
// die Chrome-Erweiterung nicht: Die Coach-Logik läuft eingebettet (engine/).
//   node tools/autoplay/app.js            (oder KantoCoachAutoplay.exe)
//   --no-window   Oberfläche nicht öffnen (nur Server)   --port N   anderer Port
'use strict';
const http = require('http'); const fs = require('fs'); const path = require('path'); const { spawn, exec } = require('child_process');
const { read, HOME, LOGS, isSea } = require('./engine/files');
const host = require('./engine/host'); const { Bot } = require('./engine/bot'); const stats = require('./engine/stats'); const { findBrowser, installedBrowsers } = require('./engine/browser');

const PORT = +(argv('port') || 47800);
function argv(k) { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : null; }
const VERSION = (() => { try { return JSON.parse(read('extension/manifest.json')).version_name; } catch (e) { return '?'; } })();

// ---------- Einstellungen ----------
const SET_FILE = path.join(HOME, 'settings.json');
const DEFAULTS = { modes: ['adv', 'tower', 'nuz', 'pvp'], adv: 'Kanto', dif: 1, games: 4, hours: 1, runMinutes: 45, pace: 1, shots: true, keepOpen: false, browser: '', account: false, arrange: true };
let settings = { ...DEFAULTS }; try { settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SET_FILE, 'utf8')) }; } catch (e) {}
const saveSettings = () => fs.writeFileSync(SET_FILE, JSON.stringify(settings, null, 1));
function clean(s) {
  const o = { ...settings };
  if (Array.isArray(s.modes)) o.modes = s.modes.filter((m) => ['adv', 'tower', 'nuz', 'pvp'].includes(m));
  if (typeof s.adv === 'string') o.adv = s.adv.slice(0, 40);
  for (const [k, lo, hi] of [['dif', 1, 3], ['games', 1, 500], ['hours', 0.1, 48], ['runMinutes', 5, 240], ['pace', 0.5, 3]]) if (s[k] != null && isFinite(+s[k])) o[k] = Math.min(hi, Math.max(lo, +s[k]));
  for (const k of ['shots', 'keepOpen', 'account', 'arrange']) if (s[k] != null) o[k] = !!s[k];
  if (typeof s.browser === 'string') o.browser = s.browser.trim();
  return o;
}

// ---------- Bot ----------
host.startBackground();
const bot = new Bot();
const clients = new Set(); const push = (ev, data) => { const s = `event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`; for (const c of clients) { try { c.write(s); } catch (e) {} } };
bot.on('log', (l) => push('log', l)); bot.on('status', () => push('status', bot.status())); bot.on('game', (g) => push('game', g));
setInterval(() => { if (bot.state !== 'idle') push('status', bot.status()); }, 2000);
let shotCache = { t: 0, buf: null };

// ---------- Server ----------
const json = (res, o, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
const body = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => { d += c; if (d.length > 1e5) req.destroy(); }); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch (e) { r({}); } }); });
const server = http.createServer(async (req, res) => {
  // nur von diesem PC und nur von der eigenen Oberfläche (kein Zugriff fremder Webseiten auf die Steuerung)
  const origin = req.headers.origin; if (origin && origin !== `http://127.0.0.1:${PORT}`) return json(res, { error: 'forbidden' }, 403);
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(read('tools/autoplay/ui/index.html').replace('{{VERSION}}', VERSION)); }
    if (u.pathname === '/api/status') return json(res, { ...bot.status(), settings, version: VERSION, logs: LOGS, browser: (findBrowser(settings.browser) || {}).exe || null, browsers: installedBrowsers() });
    if (u.pathname === '/api/stats') return json(res, stats.summary(LOGS));
    if (u.pathname === '/api/events') { res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' }); res.write('retry: 2000\n\n'); clients.add(res); req.on('close', () => clients.delete(res)); return; }
    if (u.pathname === '/api/shot') {
      if (!bot.game || !bot.game.ok()) { res.writeHead(204); return res.end(); }
      if (Date.now() - shotCache.t > 1500) { shotCache = { t: Date.now(), buf: await bot.game.shot(null, 55) }; }
      if (!shotCache.buf) { res.writeHead(204); return res.end(); }
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' }); return res.end(shotCache.buf);
    }
    if (u.pathname.startsWith('/logs/')) { const f = path.join(LOGS, path.basename(decodeURIComponent(u.pathname.slice(6)))); if (!fs.existsSync(f)) return json(res, { error: 'not found' }, 404);
      res.writeHead(200, { 'Content-Type': f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8', 'Content-Disposition': f.endsWith('.jpg') ? 'inline' : `attachment; filename="${path.basename(f)}"` }); return fs.createReadStream(f).pipe(res); }
    if (req.method !== 'POST') return json(res, { error: 'not found' }, 404);
    const b = await body(req);
    if (u.pathname === '/api/settings') { settings = clean(b); saveSettings(); return json(res, { ok: true, settings }); }
    if (u.pathname === '/api/start') { if (b && Object.keys(b).length) { settings = clean(b); saveSettings(); } if (!settings.modes.length) return json(res, { ok: false, error: 'Bitte mindestens einen Modus wählen' }); return json(res, { ok: await bot.start({ ...settings }) }); }
    if (u.pathname === '/api/pause') { bot.pause(); return json(res, { ok: true }); }
    if (u.pathname === '/api/resume') { bot.resume(); return json(res, { ok: true }); }
    if (u.pathname === '/api/skip') { bot.skip(); return json(res, { ok: true }); }
    if (u.pathname === '/api/stop') { bot.stop(); return json(res, { ok: true }); }
    if (u.pathname === '/api/browser') { if (bot.state !== 'idle') return json(res, { ok: false, error: 'Bot läuft gerade' }); await bot.openBrowser(settings); return json(res, { ok: true }); }
    if (u.pathname === '/api/open-logs') { exec(`explorer "${LOGS}"`); return json(res, { ok: true }); }
    if (u.pathname === '/api/quit') { json(res, { ok: true }); bot.stop(); setTimeout(() => process.exit(0), bot.state === 'idle' ? 300 : 6000); return; }
    return json(res, { error: 'not found' }, 404);
  } catch (e) { return json(res, { error: String(e.message || e) }, 500); }
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log('Kanto Coach Autoplay läuft schon – öffne die Oberfläche.'); openUi(); setTimeout(() => process.exit(0), 1500); }
  else { console.error(e); process.exit(1); }
});
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nKanto Coach Autoplay ${VERSION}\nOberfläche: http://127.0.0.1:${PORT}\nDaten und Protokolle: ${HOME}\nDieses Fenster offen lassen – Schließen beendet den Bot.\n`);
  if (!process.argv.includes('--no-window')) openUi();
});
// Oberfläche als eigenes App-Fenster (Chrome/Edge --app), sonst im Standard-Browser
function openUi() {
  // Programmfenster: Chromium-Browser im App-Modus (Firefox kennt keinen App-Modus – dann der Standard-Browser)
  const url = `http://127.0.0.1:${PORT}/`; const b = findBrowser('chrome') || findBrowser('edge') || findBrowser('brave') || findBrowser('vivaldi'); const exe = b && b.exe;
  if (exe) { const prof = path.join(HOME, 'ui-profile'); spawn(exe, [`--app=${url}`, `--user-data-dir=${prof}`, '--window-size=1280,860', '--no-first-run', '--no-default-browser-check'], { stdio: 'ignore', detached: true }).unref(); }
  else exec(`start "" "${url}"`);
}
process.on('SIGINT', () => { bot.stop(); setTimeout(() => process.exit(0), 4000); });
