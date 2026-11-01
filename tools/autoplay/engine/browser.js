// Spiel-Browser des Bots: eigener Browser mit eigenem Profil – ohne Erweiterung. Leser und Coach-Logik werden in eine
// isolierte Umgebung der Spielseite eingespielt (inject.js) und sprechen über den Kanal „kkHost“ mit host.js in Node.
//   Chrome, Edge, Brave, Opera, Vivaldi (Chromium): DevTools-Protokoll (CDP)
//   Firefox: WebDriver BiDi (der offene Standard, den Firefox statt CDP spricht)
// Beide Klassen haben dieselbe Schnittstelle: launch, nav, reload, ev, evalWorld, click, drag, key, shot, ok, close.
'use strict';
const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs'); const http = require('http');
const { HOME } = require('./files'); const host = require('./host'); const { WORLD, pageSource } = require('./inject');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej));
const PAGE_DATA_SKIP = (k) => k === 'data' || k === 'meta' || k.startsWith('camp:') || k.startsWith('spr:'); // braucht die Seite nicht als Speicher
const VIEW = { width: 1584, height: 805 }; // Spielfläche wie bei der Vermessung des Bretts (board.js)

// ---------- Browser finden ----------
const PF = process.env.PROGRAMFILES || 'C:/Program Files', PF86 = process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', LA = process.env.LOCALAPPDATA || '';
const KNOWN = {
  chrome: [`${PF}/Google/Chrome/Application/chrome.exe`, `${PF86}/Google/Chrome/Application/chrome.exe`, `${LA}/Google/Chrome/Application/chrome.exe`],
  edge: [`${PF86}/Microsoft/Edge/Application/msedge.exe`, `${PF}/Microsoft/Edge/Application/msedge.exe`],
  firefox: [`${PF}/Mozilla Firefox/firefox.exe`, `${PF86}/Mozilla Firefox/firefox.exe`, `${LA}/Mozilla Firefox/firefox.exe`],
  brave: [`${PF}/BraveSoftware/Brave-Browser/Application/brave.exe`, `${LA}/BraveSoftware/Brave-Browser/Application/brave.exe`],
  opera: [`${LA}/Programs/Opera/opera.exe`], vivaldi: [`${LA}/Vivaldi/Application/vivaldi.exe`],
};
const exists = (p) => { try { return !!p && fs.existsSync(p); } catch (e) { return false; } };
const kindOf = (exe) => (/firefox/i.test(exe || '') ? 'firefox' : 'chromium');
// pref: 'auto' | 'chrome' | 'edge' | 'firefox' | … | Pfad zu einer .exe
function findBrowser(pref) {
  if (pref && /[\\/]/.test(pref)) return exists(pref) ? { exe: pref, kind: kindOf(pref), name: path.basename(pref) } : null;
  const order = pref && KNOWN[pref] ? [pref] : ['chrome', 'edge', 'firefox', 'brave', 'vivaldi', 'opera'];
  for (const k of order) { const exe = KNOWN[k].find(exists); if (exe) return { exe, kind: k === 'firefox' ? 'firefox' : 'chromium', name: k }; }
  return null;
}
function installedBrowsers() { return Object.entries(KNOWN).filter(([, l]) => l.some(exists)).map(([k]) => k); }

// ---------- gemeinsam: Nachrichten der Seite an den Hintergrund ----------
async function hostMessage(m, reply) {
  if (m.type === 'init') { const local = {}; for (const [k, v] of Object.entries(host.store)) if (!PAGE_DATA_SKIP(k)) local[k] = v; return reply({ local, sync: host.sync }); }
  if (m.type === 'set') return host.setLocal(m.payload, 'page');
  if (m.type === 'remove') return host.removeLocal(m.payload, 'page');
  if (m.type === 'sync') { Object.assign(host.sync, m.payload); return undefined; }
  if (m.type === 'msg') return reply(await host.message(m.payload));
  return undefined;
}
function hookStore(game) {
  if (game._hooked) return; game._hooked = true;
  host.listeners.add((ch, area, origin) => { if (origin === 'page' || !game.ok()) return; const c = {}; for (const [k, v] of Object.entries(ch)) if (!PAGE_DATA_SKIP(k)) c[k] = v; if (Object.keys(c).length) game.evalWorld(`__kkHostChanged(${JSON.stringify(c)})`).catch(() => {}); });
}
const wrapExpr = (expr) => `(async () => { const v = await (${expr}); return v === undefined ? '__undef__' : JSON.stringify(v); })()`;
const unwrap = (s) => (s == null || s === '__undef__' ? undefined : JSON.parse(s));

// ---------- Chromium (CDP) ----------
class Game {
  constructor(opts = {}) { this.opts = opts; this.port = opts.port || 9340; this.proc = null; this.ws = null; this.ctxId = null; this.alive = false; this.kind = 'chromium'; }
  async launch() {
    const b = this.opts.found || findBrowser(this.opts.browser); if (!b) throw new Error('Kein Browser gefunden – bitte Chrome, Edge oder Firefox installieren');
    for (let i = 0; i < 10; i++) { const used = await getJson(`http://127.0.0.1:${this.port}/json/version`).then(() => true, () => false); if (!used) break; this.port++; }
    const profile = path.join(HOME, 'profile'); fs.mkdirSync(profile, { recursive: true });
    this.proc = spawn(b.exe, [`--user-data-dir=${profile}`, `--remote-debugging-port=${this.port}`, '--no-first-run', '--no-default-browser-check',
      '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
      '--window-size=1600,900', '--window-position=60,60', 'about:blank'], { stdio: 'ignore' });
    this.proc.on('exit', () => { this.alive = false; this.proc = null; });
    this.alive = true; await this.connect();
  }
  async connect() {
    let t = null;
    for (let i = 0; i < 40 && !t; i++) { try { const ts = await getJson(`http://127.0.0.1:${this.port}/json`); t = ts.find((x) => x.type === 'page'); } catch (e) {} if (!t) await sleep(500); }
    if (!t) throw new Error('Spiel-Browser antwortet nicht');
    const ws = new WebSocket(t.webSocketDebuggerUrl); this.ws = ws; let id = 0; const pend = {};
    await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    this.send = (method, params = {}) => new Promise((r) => { if (ws.readyState !== 1) return r({ error: 'closed' }); const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend[i]) { delete pend[i]; r({ error: 'timeout' }); } }, 30000); });
    ws.onclose = () => { this.ws = null; };
    ws.onmessage = (e) => { const m = JSON.parse(e.data);
      if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; return; }
      if (m.method === 'Runtime.executionContextCreated' && m.params.context.name === WORLD) this.ctxId = m.params.context.id;
      if (m.method === 'Runtime.executionContextsCleared') this.ctxId = null;
      if (m.method === 'Runtime.bindingCalled' && m.params.name === 'kkHost') { const msg = JSON.parse(m.params.payload); const ctx = m.params.executionContextId; this.ctxId = ctx;
        hostMessage(msg, (data) => this.send('Runtime.evaluate', { expression: `__kkHostReply(${msg.id}, ${JSON.stringify(data)})`, contextId: ctx })).catch(() => {}); }
    };
    await this.send('Page.enable'); await this.send('Runtime.enable');
    await this.send('Runtime.addBinding', { name: 'kkHost', executionContextName: WORLD });
    await this.send('Page.addScriptToEvaluateOnNewDocument', { source: pageSource(), worldName: WORLD, runImmediately: true });
    hookStore(this);
  }
  async ev(expr) { const r = await this.send('Runtime.evaluate', { expression: wrapExpr(expr), awaitPromise: true, returnByValue: true, userGesture: true }); try { return unwrap(r.result && r.result.result ? r.result.result.value : undefined); } catch (e) { return undefined; } }
  async evalWorld(expr) { if (!this.ctxId) return undefined; const r = await this.send('Runtime.evaluate', { expression: wrapExpr(expr), contextId: this.ctxId, awaitPromise: true, returnByValue: true }); try { return unwrap(r.result && r.result.result ? r.result.result.value : undefined); } catch (e) { return undefined; } }
  async nav(url) { await this.send('Page.navigate', { url }); }
  async reload() { await this.send('Page.reload'); }
  mouse(type, x, y) { return this.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' }); }
  async click(p) { if (!p) return false; await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y }); await this.mouse('mousePressed', p.x, p.y); await sleep(40); await this.mouse('mouseReleased', p.x, p.y); return true; }
  async drag(a, b) { if (!a || !b) return false; await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x, y: a.y }); await this.mouse('mousePressed', a.x, a.y);
    for (let i = 1; i <= 14; i++) { await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x + (b.x - a.x) * i / 14, y: a.y + (b.y - a.y) * i / 14, button: 'left', buttons: 1 }); await sleep(20); }
    await this.mouse('mouseReleased', b.x, b.y); return true; }
  async key(k) { await this.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k }); await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k }); }
  async shot(file, quality = 70) { const r = await this.send('Page.captureScreenshot', { format: 'jpeg', quality }); if (!r.result) return null; const buf = Buffer.from(r.result.data, 'base64'); if (file) fs.writeFileSync(file, buf); return buf; }
  ok() { return !!(this.ws && this.ws.readyState === 1 && this.alive); }
  close() { try { if (this.ws) this.ws.close(); } catch (e) {} try { if (this.proc) this.proc.kill(); } catch (e) {} this.alive = false; }
}

// ---------- Firefox (WebDriver BiDi) ----------
const FX_PREFS = [
  ['browser.shell.checkDefaultBrowser', false], ['browser.startup.homepage_override.mstone', '"ignore"'], ['datareporting.policy.dataSubmissionEnabled', false],
  ['toolkit.telemetry.reportingpolicy.firstRun', false], ['browser.aboutwelcome.enabled', false], ['trailhead.firstrun.didSeeAboutWelcome', true],
  ['dom.min_background_timeout_value', 4], ['dom.timeout.enable_budget_timer_throttling', false], ['browser.tabs.warnOnClose', false],
  ['widget.windows.window_occlusion_tracking.enabled', false], ['dom.disable_beforeunload', true],
];
class GameFx {
  constructor(opts = {}) { this.opts = opts; this.port = opts.port || 9350; this.proc = null; this.ws = null; this.alive = false; this.ctx = null; this.kind = 'firefox'; }
  async launch() {
    const b = this.opts.found || findBrowser(this.opts.browser); if (!b) throw new Error('Firefox nicht gefunden');
    for (let i = 0; i < 10; i++) { const used = await new Promise((r) => { const s = require('net').connect(this.port, '127.0.0.1', () => { s.end(); r(true); }); s.on('error', () => r(false)); }); if (!used) break; this.port++; }
    const profile = path.join(HOME, 'profile-firefox'); fs.mkdirSync(profile, { recursive: true });
    fs.writeFileSync(path.join(profile, 'user.js'), FX_PREFS.map(([k, v]) => `user_pref("${k}", ${v});`).join('\n') + '\n');
    // Firefox meldet auf stderr, wann (und auf welchem Port) WebDriver BiDi lauscht – darauf warten statt blind zu probieren.
    // -wait-for-browser: unter Windows startet firefox.exe sonst einen Launcher, der sich sofort beendet (Ausgabe und Prozess wären weg)
    const proc = spawn(b.exe, ['-profile', profile, '-no-remote', '-new-instance', '-wait-for-browser', `--remote-debugging-port=${this.port}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
    this.proc = proc; let err = '';
    const ready = new Promise((r) => {
      const t = setTimeout(() => r(null), 40000);
      const on = (d) => { err = (err + d).slice(-4000); const m = /WebDriver BiDi listening on ws:\/\/[^:]+:(\d+)/.exec(err); if (m) { clearTimeout(t); r(+m[1]); } };
      proc.stderr.on('data', on); proc.stdout.on('data', on); proc.on('exit', () => { clearTimeout(t); r(null); });
    });
    proc.on('exit', () => { this.alive = false; if (this.proc === proc) this.proc = null; });
    const port = await ready;
    if (!port) {
      try { proc.kill(); } catch (e) {}
      const locked = /already running|bereits ausgeführt|profile.*(locked|in use)/i.test(err);
      throw new Error(locked ? 'Firefox-Profil des Bots ist noch offen – altes Bot-Firefox-Fenster schließen' : 'Firefox startet WebDriver BiDi nicht' + (err ? ': ' + err.trim().split('\n').pop() : ''));
    }
    this.port = port; this.alive = true;
    try { await this.connect(); } catch (e) { try { proc.kill(); } catch (x) {} throw e; }
  }
  async connect() {
    let ws = null;
    for (let i = 0; i < 20 && !ws; i++) { try { const w = new WebSocket(`ws://127.0.0.1:${this.port}/session`); await new Promise((r, j) => { w.onopen = r; w.onerror = j; }); ws = w; } catch (e) { await sleep(500); } }
    if (!ws) throw new Error('Firefox antwortet nicht (WebDriver BiDi)');
    this.ws = ws; let id = 0; const pend = {};
    this.send = (method, params = {}) => new Promise((r) => { if (ws.readyState !== 1) return r({ error: 'closed' }); const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend[i]) { delete pend[i]; r({ error: 'timeout' }); } }, 30000); });
    ws.onclose = () => { this.ws = null; };
    ws.onmessage = (e) => { const m = JSON.parse(e.data);
      if (m.id != null && pend[m.id]) { pend[m.id](m); delete pend[m.id]; return; }
      if (m.type === 'event' && m.method === 'script.message' && m.params.channel === 'kkHost') {
        const msg = JSON.parse(m.params.data.value); const ctx = m.params.source.context || this.ctx;
        hostMessage(msg, (data) => this.send('script.evaluate', { expression: `__kkHostReply(${msg.id}, ${JSON.stringify(data)})`, target: { context: ctx, sandbox: WORLD }, awaitPromise: false })).catch(() => {});
      }
    };
    const s = await this.send('session.new', { capabilities: { alwaysMatch: { unhandledPromptBehavior: { default: 'dismiss' } } } });
    if (s.type === 'error') throw new Error('Firefox-Sitzung: ' + (s.message || s.error));
    await this.send('session.subscribe', { events: ['script.message'] });
    const tree = await this.send('browsingContext.getTree', {}); this.ctx = tree.result.contexts[0].context;
    await this.send('browsingContext.setViewport', { context: this.ctx, viewport: VIEW });
    await this.send('script.addPreloadScript', { functionDeclaration: `(kkHostChannel) => { const kkHost = (s) => kkHostChannel(s);\n${pageSource()}\n}`,
      arguments: [{ type: 'channel', value: { channel: 'kkHost' } }], sandbox: WORLD });
    hookStore(this);
  }
  async _eval(expr, sandbox) {
    const r = await this.send('script.evaluate', { expression: wrapExpr(expr), target: sandbox ? { context: this.ctx, sandbox } : { context: this.ctx }, awaitPromise: true, userActivation: true });
    const v = r.result; if (!v || v.type === 'exception' || !v.result) return undefined; try { return unwrap(v.result.value); } catch (e) { return undefined; }
  }
  ev(expr) { return this._eval(expr, null); }
  evalWorld(expr) { return this._eval(expr, WORLD); }
  async nav(url) { await this.send('browsingContext.navigate', { context: this.ctx, url, wait: 'none' }); }
  async reload() { await this.send('browsingContext.reload', { context: this.ctx, wait: 'none' }); }
  act(actions) { return this.send('input.performActions', { context: this.ctx, actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions }] }); }
  async click(p) { if (!p) return false; const x = Math.round(p.x), y = Math.round(p.y); await this.act([{ type: 'pointerMove', x, y }, { type: 'pointerDown', button: 0 }, { type: 'pause', duration: 40 }, { type: 'pointerUp', button: 0 }]); return true; }
  async drag(a, b) { if (!a || !b) return false; const steps = [{ type: 'pointerMove', x: Math.round(a.x), y: Math.round(a.y) }, { type: 'pointerDown', button: 0 }];
    for (let i = 1; i <= 14; i++) steps.push({ type: 'pointerMove', x: Math.round(a.x + (b.x - a.x) * i / 14), y: Math.round(a.y + (b.y - a.y) * i / 14), duration: 20 });
    steps.push({ type: 'pointerUp', button: 0 }); await this.act(steps); return true; }
  async key(k) { const v = { Escape: '\uE00C', Enter: '\uE007' }[k] || k; await this.send('input.performActions', { context: this.ctx, actions: [{ type: 'key', id: 'kb', actions: [{ type: 'keyDown', value: v }, { type: 'keyUp', value: v }] }] }); }
  async shot(file, quality = 70) { const r = await this.send('browsingContext.captureScreenshot', { context: this.ctx, format: { type: 'image/jpeg', quality: quality / 100 } }); if (!r.result) return null; const buf = Buffer.from(r.result.data, 'base64'); if (file) fs.writeFileSync(file, buf); return buf; }
  ok() { return !!(this.ws && this.ws.readyState === 1 && this.alive); }
  close() { try { if (this.ws) this.send('browser.close', {}); } catch (e) {} setTimeout(() => { try { if (this.proc) this.proc.kill(); } catch (e) {} }, 1500); this.alive = false; }
}

// passender Spiel-Browser zur Einstellung
function createGame(opts = {}) { const found = findBrowser(opts.browser); if (!found) throw new Error('Kein Browser gefunden – bitte Chrome, Edge oder Firefox installieren'); return found.kind === 'firefox' ? new GameFx({ ...opts, found }) : new Game({ ...opts, found }); }
module.exports = { Game, GameFx, createGame, findBrowser, installedBrowsers, sleep };
