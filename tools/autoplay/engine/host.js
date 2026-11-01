// Hintergrund der Coach-Logik ohne Chrome-Erweiterung: extension/background.js läuft in Node (vm) mit nachgebauten
// chrome.*-Schnittstellen. Der Speicher (chrome.storage.local) liegt hier in Node, wird in eine Datei gesichert und mit
// der Spielseite geteilt (Leser + unsichtbares Overlay laufen dort, siehe inject.js).
'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const { read, HOME } = require('./files');

// ---------- Speicher (chrome.storage.local / .sync) ----------
const STORE_FILE = path.join(HOME, 'store.json');
// Große, nur im Hintergrund gebrauchte Einträge (API-Daten, Bilder) nicht in die Datei – die lädt der Hintergrund stündlich neu
const VOLATILE = (k) => k.startsWith('spr:') || k.startsWith('camp:');
let store = {}; try { store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); } catch (e) { store = {}; }
const sync = { lang: 'auto', server: '', autoShop: true };
let saveT = null;
const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => { const out = {}; for (const [k, v] of Object.entries(store)) if (!VOLATILE(k)) out[k] = v; try { fs.writeFileSync(STORE_FILE, JSON.stringify(out)); } catch (e) {} }, 1500); };
const listeners = new Set(); // (changes, area, origin) – origin 'page' | 'host'
function pick(src, keys) {
  if (keys == null) return { ...src };
  if (typeof keys === 'string') return keys in src ? { [keys]: src[keys] } : {};
  if (Array.isArray(keys)) { const o = {}; for (const k of keys) if (k in src) o[k] = src[k]; return o; }
  const o = {}; for (const [k, d] of Object.entries(keys)) o[k] = k in src ? src[k] : d; return o;
}
function setLocal(items, origin) {
  const ch = {};
  for (const [k, v] of Object.entries(items)) { ch[k] = { oldValue: store[k], newValue: v }; store[k] = v; }
  persist(); for (const l of listeners) l(ch, 'local', origin);
}
function removeLocal(keys, origin) {
  const ch = {}; for (const k of [].concat(keys)) { if (k in store) { ch[k] = { oldValue: store[k] }; delete store[k]; } }
  persist(); for (const l of listeners) l(ch, 'local', origin);
}
const P = (v) => Promise.resolve(v);
const chromeShim = (onMessageList) => ({
  storage: {
    local: { get: (k) => P(pick(store, k)), set: (o) => { setLocal(o, 'host'); return P(); }, remove: (k) => { removeLocal(k, 'host'); return P(); } },
    sync: { get: (k) => P(pick(sync, k)), set: (o) => { Object.assign(sync, o); return P(); } },
    onChanged: { addListener: () => {} },
  },
  runtime: {
    id: 'kanto-coach-autoplay',
    onMessage: { addListener: (f) => onMessageList.push(f) },
    onInstalled: { addListener: (f) => setTimeout(() => { try { f({ reason: 'install' }); } catch (e) {} }, 50) },
    getManifest: () => JSON.parse(read('extension/manifest.json')),
    getURL: (p) => 'about:blank#' + p, reload: () => {},
  },
  alarms: { create: () => {}, onAlarm: { addListener: () => {} } },
  commands: { onCommand: { addListener: () => {} } },
  tabs: { query: () => P([]), sendMessage: () => P() },
  scripting: { executeScript: () => P() },
});

// ---------- background.js in Node ----------
const onMessage = [];
function startBackground() {
  const ctx = { console, fetch, AbortSignal, btoa, atob, setTimeout, clearTimeout, setInterval, clearInterval, URL, Blob, TextEncoder, TextDecoder, Promise };
  ctx.self = ctx; ctx.window = ctx; ctx.chrome = chromeShim(onMessage);
  ctx.importScripts = (...files) => { for (const f of files) vm.runInContext(read('extension/' + f), ctx, { filename: f }); };
  vm.createContext(ctx);
  vm.runInContext(read('extension/background.js'), ctx, { filename: 'background.js' });
  // stündlich neu laden (wie der Alarm „refresh“ der Erweiterung; die API erlaubt höchstens stündliche Abfragen)
  setInterval(() => message({ type: 'getData', force: true }).catch(() => {}), 60 * 60 * 1000);
  return ctx;
}
// Nachricht an den Hintergrund (wie chrome.runtime.sendMessage aus der Seite)
function message(msg) {
  return new Promise((res) => {
    let done = false; const reply = (r) => { if (!done) { done = true; res(r); } };
    for (const f of onMessage) { const keep = f(msg, {}, reply); if (keep !== true && !done) {} }
    setTimeout(() => reply({ ok: false, error: 'timeout' }), 60000);
  });
}
module.exports = { store, sync, setLocal, removeLocal, pick, listeners, startBackground, message };
