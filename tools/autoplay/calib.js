// Vermessung des Spielbretts für die Aufstellung nach Rollen (Entwicklerwerkzeug, nicht Teil der .exe).
// Voraussetzung: app.js läuft, der Bot ist in einer Planungsphase pausiert (Port 9340). Ein Pokémon vom Brett wird über
// ein Raster auf die eigene Hälfte gezogen; wo es einrastet, ist ein Feld. Ergebnis: calib-out.json
'use strict';
const http = require('http');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));
(async () => {
  const port = +(process.argv[2] || 9340);
  const t = (await getJson(`http://127.0.0.1:${port}/json`)).find((x) => x.type === 'page' && /einoow/.test(x.url));
  const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const pend = {};
  await new Promise((r) => (ws.onopen = r)); ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result.result.value; };
  const mouse = (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
  const drag = async (a, b) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x, y: a.y }); await mouse('mousePressed', a.x, a.y);
    for (let i = 1; i <= 12; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x + (b.x - a.x) * i / 12, y: a.y + (b.y - a.y) * i / 12, button: 'left', buttons: 1 }); await sleep(15); }
    await mouse('mouseReleased', b.x, b.y); };
  const vp = await ev('({w:innerWidth,h:innerHeight})');
  const units = () => ev(String.raw`[...document.querySelectorAll('.units2d .ubar.ally[data-uid]')].map(b=>{const u=document.querySelector('.units2d > .unit2d[data-uid="'+b.dataset.uid+'"]');const r=(u||b).getBoundingClientRect();return {uid:b.dataset.uid,x:r.left+r.width/2,bottom:r.bottom,h:r.height,w:r.width};})`);
  const u0 = (await units()).sort((a, b) => a.h - b.h)[0]; console.log('Fenster', vp, 'Testfigur', u0);
  const seen = new Map(); let cur = u0;
  for (let fy = 0.30; fy <= 0.80; fy += 0.025) for (let fx = 0.22; fx <= 0.78; fx += 0.025) {
    const p = { x: Math.round(vp.w * fx), y: Math.round(vp.h * fy) };
    await drag({ x: cur.x, y: cur.bottom - cur.h * 0.35 }, p); await sleep(300);
    const n = (await units()).find((x) => x.uid === u0.uid); if (!n) { console.log('Figur weg bei', fx.toFixed(2), fy.toFixed(2)); break; }
    cur = n; const k = Math.round(n.x / 3) + ',' + Math.round(n.bottom / 3);
    if (!seen.has(k)) seen.set(k, { fx: +(n.x / vp.w).toFixed(4), fy: +(n.bottom / vp.h).toFixed(4), h: +(n.h / vp.h).toFixed(4) });
  }
  const cells = [...seen.values()].sort((a, b) => a.fy - b.fy || a.fx - b.fx);
  console.log('Felder', cells.length); require('fs').writeFileSync(require('path').join(__dirname, 'calib-out.json'), JSON.stringify({ vp, cells }, null, 1));
  console.log(cells.map((c) => c.fx.toFixed(3) + '/' + c.fy.toFixed(3)).join(' '));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
