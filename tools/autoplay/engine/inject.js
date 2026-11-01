// Quelltext, der in die Spielseite eingespielt wird – in eine eigene, isolierte Umgebung („KantoCoachBot“), getrennt vom
// Spiel. Er bildet die chrome.*-Schnittstellen nach, die Leser und Overlay brauchen (Speicher, Nachrichten an den
// Hintergrund), und spricht über die DevTools-Bindung kkHost mit dem Bot in Node. Danach laufen dieselben Dateien wie in
// der Erweiterung: lib/i18n-game.js, lib/seals-de.js, lib/core.js, content/overlay.js (unsichtbar im Bot-Modus), content/reader.js.
'use strict';
const { read } = require('./files');
const WORLD = 'KantoCoachBot';
function pageSource() {
  const manifest = read('extension/manifest.json');
  const files = ['extension/lib/i18n-game.js', 'extension/lib/seals-de.js', 'extension/lib/core.js', 'extension/content/overlay.js', 'extension/content/reader.js'];
  const parts = files.map((f) => `try { (function () {\n${read(f)}\n}).call(window); } catch (e) { console.warn('[KantoCoachBot] ${f}', e); }`);
  return `(() => {
  if (window.top !== window || window.__kkBotLoaded) return; window.__kkBotLoaded = true;
  const MANIFEST = ${manifest};
  const send = (o) => { try { kkHost(JSON.stringify(o)); } catch (e) {} };
  const pend = new Map(); let seq = 0;
  const call = (type, payload) => new Promise((res) => { const id = ++seq; pend.set(id, res); send({ id, type, payload }); });
  window.__kkHostReply = (id, data) => { const f = pend.get(id); if (f) { pend.delete(id); f(data); } };
  let local = {}, sync = {}; const onCh = [];
  const fire = (ch, area) => setTimeout(() => { for (const f of onCh) { try { f(ch, area); } catch (e) {} } }, 0);
  // Änderungen aus Node (der Bot schreibt z. B. kkBot oder leert das Protokoll)
  window.__kkHostChanged = (ch) => { for (const [k, c] of Object.entries(ch)) { if ('newValue' in c) local[k] = c.newValue; else delete local[k]; } fire(ch, 'local'); };
  const pick = (src, keys) => { if (keys == null) return { ...src }; if (typeof keys === 'string') return keys in src ? { [keys]: src[keys] } : {};
    if (Array.isArray(keys)) { const o = {}; for (const k of keys) if (k in src) o[k] = src[k]; return o; }
    const o = {}; for (const [k, d] of Object.entries(keys)) o[k] = k in src ? src[k] : d; return o; };
  const done = (v, cb) => { if (cb) { try { cb(v); } catch (e) {} } return Promise.resolve(v); };
  const chrome = {
    storage: {
      local: {
        get: (k, cb) => done(pick(local, k), cb),
        set: (o, cb) => { const ch = {}; for (const [k, v] of Object.entries(o)) { ch[k] = { oldValue: local[k], newValue: v }; local[k] = v; } send({ type: 'set', payload: o }); fire(ch, 'local'); return done(undefined, cb); },
        remove: (keys, cb) => { const ch = {}; for (const k of [].concat(keys)) { ch[k] = { oldValue: local[k] }; delete local[k]; } send({ type: 'remove', payload: [].concat(keys) }); fire(ch, 'local'); return done(undefined, cb); },
      },
      sync: { get: (k, cb) => done(pick(sync, k), cb), set: (o, cb) => { Object.assign(sync, o); send({ type: 'sync', payload: o }); const ch = {}; for (const [k, v] of Object.entries(o)) ch[k] = { newValue: v }; fire(ch, 'sync'); return done(undefined, cb); } },
      onChanged: { addListener: (f) => onCh.push(f) },
    },
    runtime: {
      id: 'kanto-coach-autoplay', getManifest: () => MANIFEST, getURL: (p) => p,
      sendMessage: (msg, cb) => call('msg', msg).then((r) => { if (cb) { try { cb(r); } catch (e) {} } return r; }),
      onMessage: { addListener: () => {} },
    },
  };
  const start = async () => {
    const init = await call('init');
    local = init.local || {}; sync = init.sync || {};
    ${parts.join('\n    ')}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
})();`;
}
module.exports = { WORLD, pageSource };
