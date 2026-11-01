// Der Bot: spielt Kanto Tactics in einem eigenen Chrome nach den Markierungen der Coach-Logik (die läuft unsichtbar in der
// Spielseite, siehe inject.js) und legt nach jeder Partie ein Protokoll ab. Gesteuert von der Oberfläche (app.js):
// start(cfg), pause(), resume(), skip(), stop(); Ereignisse 'log', 'status', 'game'.
// Regeln: nur als Gast, PvP nur „Training · gegen 7 Bots“, klickt nur, was ein Spieler auch klicken würde.
'use strict';
const fs = require('fs'); const path = require('path'); const vm = require('vm'); const EventEmitter = require('events');
const { read, LOGS } = require('./files'); const host = require('./host'); const { createGame, sleep } = require('./browser'); const board = require('./board');

const HUB = { tower: 'm-tower', adv: 'm-adv', nuz: 'm-nuzlocke', pvp: 'm-pvp' };
const MODE_DE = { adv: 'Abenteuer', tower: 'Duellturm', nuz: 'Nuzlocke', pvp: 'PvP-Training' };
// ---------- Seiten-Helfer (laufen im Spiel) ----------
const VIS = "(e)=>{const r=e.getBoundingClientRect();return r.width>4&&r.height>4&&getComputedStyle(e).visibility!=='hidden'}";
const jsClickSel = (sel, i = 0) => `(()=>{const l=[...document.querySelectorAll(${JSON.stringify(sel)})].filter(${VIS});const e=l[${i}];if(!e)return null;e.click();return (e.textContent||'').trim().slice(0,40)||'ok';})()`;
const centerSel = (sel, i = 0) => `(()=>{const l=[...document.querySelectorAll(${JSON.stringify(sel)})].filter(${VIS}).filter(e=>!e.closest('.it-queue'));const e=l[${i}];if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`;
// Knopf in einem Fenster per Text – nie „Aufgeben“, nie gewertetes PvP
const clickModalText = (rx) => String.raw`(()=>{const rx=new RegExp(${JSON.stringify(rx)},'i');const bad=/aufgeben|surrender|abandon|run beenden|partie suchen|gewertet/i;
  const bs=[...document.querySelectorAll('.modal button, [role=dialog] button, .ev-box button, .nz-ev-btns button, .slot-wrap button, [class*=slots] button')].filter(${VIS});
  const b=bs.find(e=>rx.test(e.textContent.trim())&&!bad.test(e.textContent));if(!b)return null;b.click();return b.textContent.trim().slice(0,40);})()`;
const PAGE_INFO = String.raw`(()=>{const v=${VIS};const hero=document.querySelector('.hub-hero');
  const modals=[...document.querySelectorAll('.modal,[role=dialog]')].filter(v).map(m=>({cls:String(m.className).slice(0,60),btns:[...m.querySelectorAll('button')].filter(v).map(b=>b.textContent.trim().replace(/\s+/g,' ').slice(0,30))}));
  const allBtns=[...document.querySelectorAll('button')].filter(v).map(b=>b.textContent.trim().replace(/\s+/g,' ').slice(0,30));
  return {path:location.pathname,hub:hero?String(hero.className):null,guest:!!document.querySelector('.hub-login'),fight:!!document.querySelector('button.fight'),
    starter:!!document.querySelector('button.sp-slot'),modals,weiter:allBtns.filter(t=>/^(Weiter|Zurück zur Lobby|Nochmal|Neuer Aufstieg|Neu starten)/i.test(t)).slice(0,4)};})()`;
const BOARD = String.raw`[...document.querySelectorAll('.units2d .ubar.ally[data-uid]')].map(b=>{const img=document.querySelector('.units2d > .unit2d[data-uid="'+b.dataset.uid+'"] img');const m=/\/(\d+)\.(webp|png|gif)/.exec(img?.src||'');const r=(img||b).getBoundingClientRect();return {num:m?+m[1]:0,x:r.left+r.width/2,yItem:r.top+r.height*0.85,yBody:r.top+r.height*0.6,yFeet:r.bottom-r.height*0.15};})`;
const BENCH = String.raw`[...document.querySelectorAll('.bench .slot.filled[data-bench]')].filter(e=>!e.closest('.looking')).map(e=>{const m=/\/(\d+)\.(webp|png|gif)/.exec(e.querySelector('img')?.src||'');const r=e.getBoundingClientRect();return {num:m?+m[1]:0,x:r.left+r.width/2,y:r.top+r.height/2};})`;
const BAG = String.raw`[...document.querySelectorAll('button.it-slot')].filter(b=>!b.closest('.it-queue')).map(b=>{const m=/pk\/items\/([a-z0-9-]+)\.png/.exec(b.querySelector('img')?.src||'');const r=b.getBoundingClientRect();return {id:m&&m[1],x:r.left+r.width/2,y:r.top+r.height/2,w:r.width};}).filter(x=>x.w>4)`;
// eigene Figuren mit Fußpunkt (Rahmen des .unit2d-Elements, wie bei der Vermessung)
const UNITS2D = String.raw`[...document.querySelectorAll('.units2d .ubar.ally[data-uid]')].map(b=>{const u=document.querySelector('.units2d > .unit2d[data-uid="'+b.dataset.uid+'"]');if(!u)return null;const img=u.querySelector('img');const m=/\/(\d+)\.(webp|png|gif)/.exec(img?.src||'');const r=u.getBoundingClientRect();return {uid:b.dataset.uid,num:m?+m[1]:0,x:r.left+r.width/2,bottom:r.bottom,h:r.height};}).filter(Boolean)`;
const TEAMCOUNT = String.raw`(document.querySelector('.teamcount')?.getAttribute('aria-label')||'').match(/\d+/)?.[0]`;
const PVP_PLACE = String.raw`(()=>{const m=/(?:^|\n)\s*Du\s*\n?\s*(\d)\./.exec(document.body.innerText||'');return m?+m[1]:null})()`;

class Stop extends Error {}
// Ortszeit für Dateinamen: 2026-11-01-19-13
const stamp = (t) => { const d = new Date(t); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}`; };
class Bot extends EventEmitter {
  constructor() { super(); this.state = 'idle'; this.game = null; this.cfg = null; this.cur = null; this.results = []; this.actions = []; this.core = null; this._stop = false; this._pause = false; this._skip = false; }
  log(s) { const line = new Date().toLocaleTimeString('de-DE') + ' ' + s; this.actions.push(line); if (this.actions.length > 200) this.actions.shift(); try { fs.appendFileSync(path.join(LOGS, 'autoplay.log'), line + '\n'); } catch (e) {} this.emit('log', line); }
  status() {
    const L = host.store.kkLive || {}; const g = L.game || {}; let K = null; try { K = this.getCore(); } catch (e) {}
    const nm = (u) => { try { return K ? K.unitName(u.line, u.star) : u.line; } catch (e) { return u.line; } };
    return { state: this.state, cfg: this.cfg, cur: this.cur, results: this.results.slice(-50), account: this.account == null ? null : this.account, browserOpen: !!(this.game && this.game.ok()),
      live: L.ts && !L.lobby ? { mode: g.mode, at: g.mode === 'pvp' ? (g.stage ? `${g.stage}-${g.round}` : null) : g.stop, nz: !!g.nz, lives: g.lives, hp: L.hp, gold: L.gold, level: L.level, planning: !!L.planning,
        board: (L.board || []).map((u) => ({ line: u.line, name: nm(u), star: u.star, items: u.items || [] })), bench: (L.bench || []).map((u) => ({ line: u.line, name: nm(u), star: u.star })), age: Math.round((Date.now() - L.ts) / 1000) } : null,
      actions: this.actions.slice(-40) };
  }
  // Warten, das Pause und Stopp beachtet
  async wait(ms) { const end = Date.now() + ms; while (Date.now() < end || this._pause) { if (this._stop) throw new Stop(); await sleep(Math.min(250, Math.max(10, end - Date.now()))); } if (this._stop) throw new Stop(); }
  pause() { if (this.state === 'running') { this._pause = true; this.state = 'paused'; this.log('|| Pause'); this.emit('status'); } }
  resume() { if (this.state === 'paused') { this._pause = false; this.state = 'running'; this.log('▶ weiter'); this.emit('status'); } }
  skip() { if (this.state === 'running' || this.state === 'paused') { this._skip = true; this.log('⏭ Partie überspringen (Protokoll wird gesichert)'); } }
  stop() { if (this.state !== 'idle') { this._stop = true; this._pause = false; this.state = 'stopping'; this.log('■ Stopp angefordert'); this.emit('status'); } }

  // Bot-Browser öffnen (ohne zu spielen), z. B. um sich dort bei einoow anzumelden – Zugangsdaten gibt der Nutzer selbst ein
  async openBrowser(cfg) {
    if (!this.game || !this.game.ok()) { this.game = createGame({ browser: cfg && cfg.browser }); await this.game.launch(); }
    await this.game.nav('https://einoow.com/kanto-tactics'); this.log('>> Bot-Browser geöffnet – dort kannst du dich bei einoow anmelden (oben rechts „Anmelden“)');
    setTimeout(async () => { try { const g = await this.game.ev("!!document.querySelector('.hub-login')"); this.account = g === false; this.emit('status'); } catch (e) {} }, 8000);
  }
  async start(cfg) {
    if (this.state !== 'idle') return false;
    this.cfg = cfg; this._stop = false; this._pause = false; this.state = 'running'; this.emit('status');
    this.run().catch((e) => { if (!(e instanceof Stop)) this.log('!! Abbruch: ' + (e && e.message || e)); }).finally(async () => {
      try { await this.exportLogs('gestoppt', true); } catch (e) {}
      if (this.game && !this.cfg.keepOpen) { this.game.close(); this.game = null; }
      this.state = 'idle'; this.cur = null; this.log('===== Bot angehalten'); this.emit('status');
    });
    return true;
  }
  async run() {
    const c = this.cfg; const modes = c.modes.filter((m) => HUB[m]);
    if (!modes.length) throw new Error('keine Modi gewählt');
    this.log(`===== Start · ${modes.map((m) => MODE_DE[m]).join(', ')} · ${c.games} Partien · max ${c.hours} h · Abenteuer-Stufe ${c.dif}`);
    host.setLocal({ kkBot: true }, 'host');
    const r = await host.message({ type: 'getData' }); if (!r || !r.ok) this.log('!! Spieldaten nicht geladen: ' + (r && r.error));
    if (!this.game || !this.game.ok()) { this.game = createGame({ browser: c.browser }); await this.game.launch(); }
    this.exported = (() => { try { return JSON.parse(fs.readFileSync(path.join(LOGS, 'exported.json'), 'utf8')); } catch (e) { return {}; } })();
    const tEnd = Date.now() + c.hours * 3600e3; let n = 0; let mi = 0;
    while (n < c.games && Date.now() < tEnd) {
      const mode = modes[mi++ % modes.length]; this._skip = false;
      try {
        if (!this.game.ok()) { this.game = createGame({ browser: c.browser }); await this.game.launch(); }
        if (!(await this.startRun(mode))) { this.log(`!! ${MODE_DE[mode]}: Start nicht möglich – nächster Modus`); await this.wait(3000); continue; }
        const t0 = Date.now(); this.cur = { mode, no: n + 1, t0 }; this.emit('status');
        const res = await this.playRun(mode, t0);
        const base = `${stamp(t0)}_${mode}`;
        if (c.shots !== false) await this.game.shot(path.join(LOGS, base + '.jpg'));
        const rounds = await this.exportLogs(res.reason, false, base, mode, t0);
        n++;
        const row = { start: new Date(t0).toISOString(), mode, reason: res.reason, at: res.at ?? '', hp: res.hp ?? '', place: res.place || '', minutes: Math.round((Date.now() - t0) / 60000), rounds, file: base };
        this.results.push(row); this.appendSummary(row);
        this.log(`== Partie ${n}/${c.games} (${MODE_DE[mode]}) vorbei: ${res.reason} · Stand ${res.at ?? '–'} · ${rounds} Runden protokolliert`);
        this.cur = null; this.emit('game', row); this.emit('status');
        await this.leaveToLobby();
      } catch (e) {
        if (e instanceof Stop) throw e;
        this.log('!! Fehler: ' + (e && e.message || e)); try { await this.game.reload(); } catch (x) {} await this.wait(8000);
      }
    }
    this.log('===== Fertig: alle Partien gespielt');
  }
  appendSummary(r) {
    const f = path.join(LOGS, 'summary.csv'); const head = fs.existsSync(f) ? '' : 'start;modus;ende;stand;kp;platz;minuten;runden;datei\n';
    fs.appendFileSync(f, head + [r.start, r.mode, r.reason, r.at, r.hp, r.place, r.minutes, r.rounds, r.file].join(';') + '\n');
  }

  // ---------- Partie starten ----------
  async startRun(mode) {
    const G = this.game; const c = this.cfg;
    await this.leaveToLobby();
    await G.nav('https://einoow.com/kanto-tactics'); await this.wait(6000);
    const info = await G.ev(PAGE_INFO);
    // Konto: nur, wenn in den Einstellungen erlaubt (Ergebnisse zählen dann für das Konto, z. B. in der Turm-Rangliste)
    this.account = !!(info && !info.guest);
    if (this.account && !c.account) { this.log('!! Im Bot-Browser ist ein einoow-Konto angemeldet, in den Einstellungen ist „Mit meinem Konto spielen“ aber aus – kein Start.'); this.stop(); throw new Stop(); }
    if (!this._accLogged) { this._accLogged = true; this.log(this.account ? '>> spielt mit deinem einoow-Konto (Ergebnisse zählen für dein Konto)' : '>> spielt als Gast'); }
    await G.ev(jsClickSel('.hub-card.' + HUB[mode])); await this.wait(1500);
    if (mode === 'adv') { await G.ev(String.raw`(()=>{const c=[...document.querySelectorAll('.ads-card')].find(e=>e.textContent.trim().toLowerCase().startsWith(${JSON.stringify((c.adv || 'Kanto').toLowerCase())}));if(c)c.click();return !!c})()`); await this.wait(1000); }
    if (mode === 'pvp') {
      await G.ev(jsClickSel('.pp-ddbtn')); await this.wait(800);
      await G.ev(String.raw`(()=>{const o=[...document.querySelectorAll('button, [role=option]')].find(e=>/^Training/.test(e.textContent.trim())&&/Bots/.test(e.textContent)&&e.getBoundingClientRect().width>5);if(o)o.click();return !!o})()`); await this.wait(800);
      const sel = await G.ev("(document.querySelector('.pp-ddbtn')||{}).textContent||''");
      if (!/^\s*Training/.test(sel) || !/Bots/.test(sel)) { this.log(`!! PvP: „Training gegen Bots“ nicht gewählt – kein Start (Schutz: nie gegen Menschen)`); return false; }
    }
    const hub = await G.ev("(document.querySelector('.hub-hero')||{}).className||''");
    if (!new RegExp('\\b' + HUB[mode] + '\\b').test(hub)) { this.log(`!! Startseite zeigt nicht ${MODE_DE[mode]} – kein Start`); return false; }
    const t = await G.ev(jsClickSel('.hub-play')); this.log(`>> ${MODE_DE[mode]}: Start „${t}“`); await this.wait(6000);
    if (mode === 'pvp') { await G.ev(clickModalText('^(▶ ?Spiel|Spiel starten|Start|Los geht)')); await this.wait(4000); }
    if (mode === 'adv' && c.dif > 1) {
      const r = await G.ev(String.raw`(()=>{const o=[...document.querySelectorAll('.dt-opt, .ln-dopt')].filter(e=>e.getBoundingClientRect().width>3);if(!o.length)return 'kein Schalter (Stufe noch nicht freigeschaltet)';const e=o[${c.dif - 1}];if(!e)return 'Stufe gesperrt';e.click();return 'gewählt: '+e.textContent.trim();})()`);
      this.log(`>> Abenteuer-Stufe ${c.dif}: ${r}`);
    }
    return true;
  }
  async leaveToLobby() { for (let i = 0; i < 3; i++) { const t = await this.game.ev(clickModalText('^(Zurück zur Lobby|Zur Lobby|Nicht mehr zusehen|Fertig|Weiter|OK)')); if (!t) break; this.log('>> Ende-Fenster: ' + t); await this.wait(2500); } }

  // ---------- Eine Partie spielen ----------
  async playRun(mode, t0) {
    const G = this.game; const c = this.cfg; const pace = c.pace || 1;
    let lastAt = null, lastHp = null, alive = false, acted = {}, lastRound = '', rolls = 0, inRun = false, lastProgress = Date.now(), lastSig = '', stuckTries = 0, lastAction = Date.now();
    let numLine = await this.lineMap();
    while (true) {
      if (this._skip) return { reason: 'übersprungen', at: lastAt, hp: lastHp };
      if (Date.now() - t0 > (c.runMinutes || 45) * 60e3) return { reason: `Zeitlimit ${c.runMinutes} min`, at: lastAt, hp: lastHp };
      const L = host.store.kkLive || {}; const M = host.store.kkMarks || {}; const info = (await G.ev(PAGE_INFO)) || { modals: [], weiter: [] };
      const g = L.game || {};
      if (L.ts && L.ts > t0 && g.mode) { lastAt = g.mode === 'pvp' ? (g.stage ? `${g.stage}-${g.round}` : lastAt) : g.stop; if (L.hp != null) lastHp = L.hp; }
      if (inRun && L.lobby) return { reason: lastHp === 0 || (lastHp != null && lastHp <= 3) ? 'verloren' : 'Lobby', at: lastAt, hp: lastHp };
      if (inRun && alive && L.hp === 0) { await this.wait(3000); const place = mode === 'pvp' ? await G.ev(PVP_PLACE) : null; return { reason: place ? `Platz ${place}` : '0 KP', at: lastAt, hp: 0, place }; }
      if ((info.weiter || []).some((t) => /Zurück zur Lobby|Nochmal|Neuer Aufstieg|Neu starten/i.test(t)) && inRun && alive) return { reason: 'Ergebnis', at: lastAt, hp: lastHp };
      // nur Spielstände nach dem Start (der letzte Stand der vorigen Partie kann noch „0 KP“ zeigen)
      if (L.ts && L.ts > t0 && !L.lobby && g.mode) { inRun = true; if (L.planning && (L.hp > 0 || (L.hp == null && g.nz))) alive = true; }
      // Endfenster einer älteren Partie (PvP läuft nach dem Ausscheiden weiter): schließen, neu starten
      if (!alive && (info.modals || []).some((m) => /pv-end|game-over|gameover/.test(m.cls))) { const t = await G.ev(clickModalText('^Zurück zur Lobby')); this.log('>> altes Endfenster geschlossen: ' + t); await this.wait(3000); await this.startRun(mode); lastProgress = Date.now(); continue; }
      const round = g.mode === 'pvp' ? `pvp:${g.stage}-${g.round}` : `${g.mode}:${g.stop}`;
      if (round !== lastRound) { lastRound = round; rolls = 0; acted = {}; }
      // Wächter: nichts ändert sich mehr
      const sig = JSON.stringify([L.planning, L.gold, L.hp, L.level, g.stop, g.round, L.board && L.board.length, info.modals, info.starter]);
      if (sig !== lastSig) { lastSig = sig; lastProgress = Date.now(); stuckTries = 0; }
      if (Date.now() - lastProgress > 150e3) {
        stuckTries++; const f = path.join(LOGS, `haengt_${Date.now()}.jpg`); await G.shot(f);
        this.log(`?? hängt seit ${Math.round((Date.now() - lastProgress) / 1000)} s (Versuch ${stuckTries}) · Fenster ${JSON.stringify(info.modals).slice(0, 200)} · Bild ${path.basename(f)}`);
        if (stuckTries === 1) await G.key('Escape');
        else if (stuckTries === 2) await G.ev(clickModalText('.'));
        else if (stuckTries === 3) { await G.reload(); await this.wait(8000); await G.ev(jsClickSel('.hub-play')); }
        else return { reason: 'hängt', at: lastAt, hp: lastHp };
        lastProgress = Date.now() - 100e3; await this.wait(3000); continue;
      }
      try {
        const did = await this.step(L, M, info, { acted, round, numLine, rolls: () => rolls, roll: () => rolls++ });
        if (did) { lastAction = Date.now(); this.emit('status'); await this.wait(900 * pace); continue; }
        // Alles gekauft/getauscht: Aufstellung nach Rollen (einmal je Runde und Brett), dann kämpfen
        if (L.planning && c.arrange !== false && !(info.modals || []).length && Date.now() - lastAction > 1500 * pace && await this.arrange(L, round, acted, numLine)) { lastAction = Date.now(); continue; }
        // Nichts mehr zu tun: kämpfen (im PvP startet der Kampf von selbst). Freie Plätze + Bank: erst den Markierungen Zeit geben
        const waitPlace = L.teamN != null && L.level && L.teamN < L.level && (L.bench || []).length && Date.now() - lastAction < 9000;
        const fk = 'fight' + L.hp + L.gold + Math.floor(Date.now() / 20000);
        if (mode !== 'pvp' && L.planning && info.fight && !(info.modals || []).length && !waitPlace && Date.now() - lastAction > 2500 * pace && !acted[fk]) {
          acted[fk] = 1; await G.ev(jsClickSel('button.fight')); this.log(`>> ${round} Kampf · Lv${L.level} ${L.gold}G ${L.hp ?? '–'}KP`); this.emit('status');
        }
      } catch (e) { if (e instanceof Stop) throw e; this.log('ERR ' + e.message); numLine = await this.lineMap(); }
      await this.wait(1100 * pace);
    }
  }
  // Aufstellung nach Rollen: Tanks vorn, Fernkämpfer/Magier hinten (bei gegnerischen Assassinen hinten in die Mitte),
  // Assassinen an die Flanken; Felder aus echten Ranked-Spielen der Comp haben Vorrang (K.buildBoard, nur gemessene).
  // Ziehen auf ein besetztes Feld tauscht im Spiel die beiden Pokémon – darum nach jedem Zug neu lesen.
  async arrange(L, round, acted, numLine) {
    const key = 'arr' + round + JSON.stringify((L.board || []).map((u) => u.line + u.star).sort());
    if (acted[key] || (L.board || []).length < 2) return false; acted[key] = 1;
    const K = this.getCore(); if (!K) return false; const G = this.game;
    const vp = await G.ev('({w:innerWidth,h:innerHeight})'); if (!vp) return false;
    const lineOf = (n) => numLine[n] || numLine[n % 9000];
    // Das Spiel vergibt beim Verschieben eine neue ID – darum Schlüssel aus der Linie (gleiche Linie zweimal: nach links/rechts nummeriert)
    const read = async () => { const l = ((await G.ev(UNITS2D)) || []).map((u) => ({ ...u, line: lineOf(u.num), cell: board.cellAt(u.x, u.bottom, vp) })).sort((a, b) => a.x - b.x); const n = {}; for (const u of l) { n[u.line] = (n[u.line] || 0) + 1; u.key = u.line + '#' + n[u.line]; } return l; };
    let units = await read(); if (units.length < 2 || units.some((u) => u.cell == null)) return false; // Brett anders als vermessen (Fenstergröße?) – nichts verschieben
    // Plan der Coach-Logik (Overlay merkt ihn sich in „ov“) und dessen gemessene Felder
    const ov = host.store.ov || {}; const g = L.game || {};
    const planId = g.mode === 'pvp' ? ov.target : (ov.plans || {})['camp:' + (g.mode === 'tower' ? 'tower' : 'camp')];
    const meta = {}; try { const c = planId && K.compById[planId]; if (c) for (const u of K.buildBoard(c)) if (u.measured) meta[K.base(u.line)] = u.cell; } catch (e) {}
    const fi = K.foeInfo((L.foes || []).map((f) => ({ line: f.line, star: f.star })));
    const star = (line) => ((L.board || []).find((b) => K.base(b.line) === K.base(line)) || {}).star || 1;
    const us = units.filter((u) => u.line).map((u) => ({ key: u.key, line: u.line, role: K.lineRole(u.line) || 'fighter', power: K.unitPower(u.line, star(u.line), 0), metaCell: meta[K.base(u.line)] }));
    const target = board.plan(us, { foeAssassins: fi.assassins.length >= 2 });
    // Ziehen auf ein besetztes Feld bewirkt im Spiel nichts (kein Tausch): erst Züge auf freie Ziel-Felder; hängt alles im Kreis,
    // ein Pokémon auf ein freies Feld außerhalb der Ziele parken
    let moved = 0;
    for (let i = 0; i < 14; i++) {
      units = await read(); if (units.some((x) => x.cell == null)) { await this.wait(300); units = await read(); }
      const occ = new Set(units.map((x) => x.cell)); const wrong = units.filter((x) => target[x.key] != null && x.cell !== target[x.key]);
      if (!wrong.length) break;
      let u = wrong.find((x) => !occ.has(target[x.key])); let cell = u ? target[u.key] : null;
      if (!u) { const goals = new Set(Object.values(target)); cell = [...Array(28).keys()].find((c) => !occ.has(c) && !goals.has(c)); u = wrong[0]; if (cell == null) break; }
      await G.drag({ x: u.x, y: u.bottom - u.h * 0.35 }, board.cellPos(cell, vp)); await this.wait(500); moved++;
    }
    if (moved) {
      await this.wait(400); const after = await read(); const hit = after.filter((x) => target[x.key] != null && x.cell === target[x.key]).length;
      const names = us.map((u) => `${u.line}:${u.role[0]}${target[u.key]}`).join(' ');
      this.log(`>> Aufstellung (${moved} Züge, ${hit}/${us.length} am Ziel${fi.assassins.length >= 2 ? ', Gegner mit Assassinen' : ''}): ${names}`);
    }
    return moved > 0;
  }
  // Bildnummer -> Linie (Tabelle des Hintergrunds, auch Turm-Pokémon ohne API-Daten)
  async lineMap() { const r = await host.message({ type: 'readerMap' }); const out = {}; for (const [n, f] of Object.entries((r && r.forms) || {})) out[n] = f[0]; return out; }
  // Coach-Logik auch im Bot (für Entscheidungen ohne Markierung, z. B. Arena-Wahl)
  getCore() {
    if (this.core) return this.core;
    const data = host.store.data; const meta = host.store.meta; if (!data || !data.lines) return null;
    const ctx = { console }; ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
    vm.runInContext(read('extension/lib/i18n-game.js'), ctx); vm.runInContext(read('extension/lib/core.js'), ctx);
    this.core = ctx.KKCore.create({ data, meta: meta && meta.comps ? meta : { comps: [], units: [], items: [], traits: [], rules: data.rules }, de: ctx.KK_DE, lang: 'de' });
    this.core.data = data; return this.core;
  }

  // ---------- Ein Schritt: der Markierung des Coaches folgen ----------
  async step(L, M, info, ctx) {
    const G = this.game; const { acted, round, numLine } = ctx; const once = (k) => (acted[k] ? false : (acted[k] = 1, true));
    const pickMark = async (kind, sel) => {
      const mk = M[kind]; if (!mk) return false; const idx = Object.entries(mk).find(([, x]) => x.n === 1); if (!idx) return false;
      if (!once(kind + round + JSON.stringify(L[kind] && (L[kind].items || L[kind].labels || L[kind].arts || L[kind].cards)))) return false;
      const t = await G.ev(jsClickSel(sel, +idx[0])); this.log(`>> ${kind}: Karte ${+idx[0] + 1} (${t})`); return !!t;
    };
    // Arena-Wahl: niedrigere Stufe zuerst, dazu der Typ-Vorteil des eigenen Teams
    if ((info.modals || []).some((m) => /\bgc\b/.test(m.cls)) && once('gym' + round)) {
      const cards = await G.ev(String.raw`[...document.querySelectorAll('.gc .gc-card')].map((b,i)=>{const t=/types\/([a-z]+)-g\.png/.exec(b.innerHTML)||[];return {i,lv:+((/:\s*(\d+)/.exec(b.getAttribute('aria-label')||'')||[])[1]||0),type:t[1]||null,name:(b.querySelector('.gc-name')||{}).textContent||''};})`) || [];
      const K = this.getCore(); const team = (L.board || []).concat(L.bench || []);
      const fit = (type) => { if (!K || !type || !team.length) return 0; let s = 0;
        for (const u of team) { const l = K.data.lines[K.base(u.line)]; const mv = l && l.stars[Math.min(u.star || 1, l.stars.length) - 1].move;
          if (mv && mv.type) s += K.typeEff(mv.type, [type]) - 1; s -= (K.typeEff(type, K.lineTypes(u.line)) - 1) * 0.5; }
        return s / team.length; };
      const best = cards.map((x) => ({ ...x, s: -0.5 * x.lv + fit(x.type) })).sort((a, b) => b.s - a.s)[0];
      if (best) { await G.ev(jsClickSel('.gc .gc-card', best.i)); this.log(`>> Arena: ${best.name} (Stufe ${best.lv}, ${best.type})`); return true; }
    }
    if (info.starter) {
      const idx = M.starter ? +(Object.entries(M.starter).find(([, x]) => x.n === 1) || ['0'])[0] : 0;
      if (once('starter' + JSON.stringify(L.starter))) { await G.ev(jsClickSel('button.sp-slot', idx)); await this.wait(1000); const t = await G.ev(jsClickSel('button.sp-go')); this.log(`>> Partner ${idx + 1} (${t})`); await this.wait(2500); return true; }
    }
    if (await pickMark('loot', '.itemreward button.ir-card')) return true;
    if (await pickMark('seal', '.sx-pick .sx-card button.sx-take')) return true;
    if (await pickMark('boon', '.tboon button.ev-card')) return true;
    if (await pickMark('event', '.evround:not(.tboon) button.ev-card')) return true;
    if (L.safari && L.safari.myTurn && await pickMark('safari', 'button.sf3-mon, button.sfv-card, button.sft-card, button.sfs-card')) return true;
    for (const [sel, k] of [['.itemreward button.ir-card', 'loot'], ['.evround button.ev-card', 'event'], ['.sx-pick .sx-card button.sx-take', 'seal']]) {
      if (L[k] && !L[k].picked && !M[k] && once('first' + k + round + JSON.stringify(L[k]))) { const t = await G.ev(jsClickSel(sel, 0)); if (t) { this.log(`>> ${k} ohne Empfehlung: erste Karte (${t})`); return true; } }
    }
    if ((info.modals || []).length || (info.weiter || []).length) {
      const t = await G.ev(clickModalText('^(Los geht|Weiter|Verstanden|OK$|Schließen|Fertig|Nein danke|Überspringen|Keins|Später)'));
      if (t && once('dlg' + t + round + JSON.stringify(info.modals))) { this.log('>> Fenster: ' + t); return true; }
    }
    if (!L.planning) return false;
    const ms = Object.entries(M.shop || {}).filter(([, x]) => x.n).sort((a, b) => a[1].n - b[1].n);
    for (const [line] of ms) {
      const i = (L.shopInfo || []).findIndex((x) => x && x.line === line); if (i < 0 || !once('buy' + round + line + i + L.gold)) continue;
      const t = await G.ev(`(()=>{const w=document.querySelectorAll('.cards > .card.empty, .cards > .cardwrap')[${i}];const b=w&&(w.matches('button.card')?w:w.querySelector('button.card'));if(!b)return null;b.click();return 'ok';})()`);
      if (t) { this.log(`>> kaufe ${line}`); return true; }
    }
    const bag = (await G.ev(BAG)) || []; const slotsBy = {}; for (const b of bag) (slotsBy[b.id] = slotsBy[b.id] || []).push(b);
    const pairs = {}; for (const [id, l] of Object.entries(M.items || {})) { const used = slotsBy[id] || []; l.forEach((mk, k) => { if (mk.kind === 'craft' && used[k]) (pairs[mk.n] = pairs[mk.n] || []).push(used[k]); }); }
    const pr = Object.entries(pairs).find(([, l]) => l.length === 2);
    if (pr && once('pair' + round + pr[0] + JSON.stringify(L.items))) { this.log(`>> Item bauen: ${pr[1][0].id} + ${pr[1][1].id}`); await G.drag(pr[1][0], pr[1][1]); return true; }
    const units = (await G.ev(BOARD)) || []; const lineOf = (x) => numLine[x.num] || numLine[x.num % 9000];
    const use = Object.entries(M.items || {}).find(([, l]) => l.some((mk) => mk.kind === 'use'));
    if (use && once('use' + round + use[0] + JSON.stringify(L.items))) {
      const target = Object.entries(M.board || {}).find(([, mk]) => (mk.label || '').startsWith('⬇'));
      const tu = target && units.find((x) => lineOf(x) === target[0]); const from = (slotsBy[use[0]] || [])[0];
      if (tu && from) { this.log(`>> gebe ${use[0]} an ${target[0]}`); await G.drag(from, { x: tu.x, y: tu.yItem }); return true; }
    }
    const fin = (M.field && M.field.in) || {}; const fout = (M.field && M.field.out) || {}; const bench = (await G.ev(BENCH)) || [];
    const sw = Object.entries(fin).find(([, mk]) => mk.n);
    if (sw) {
      const outLine = Object.entries(fout).find(([, mk]) => (mk.label || '').startsWith(sw[1].n + ' '));
      if (outLine && once('swap' + round + sw[0] + JSON.stringify(L.board))) {
        const from = bench.find((x) => lineOf(x) === sw[0]); const to = units.find((x) => lineOf(x) === outLine[0]);
        if (from && to) { this.log(`>> tausche ${sw[0]} rein, ${outLine[0]} raus`); await G.drag(from, { x: to.x, y: to.yBody }); return true; }
      }
    }
    const placeL = Object.entries(fin).filter(([, mk]) => !mk.n).map(([l]) => l);
    if (placeL.length && once('place' + round + JSON.stringify(L.board) + JSON.stringify(L.bench))) {
      const from = bench.find((x) => placeL.includes(lineOf(x))); const tc = () => G.ev(TEAMCOUNT);
      if (from && !units.length) {
        // leeres Brett (Nuzlocke nach Ausfällen): Raster über die eigene Hälfte, Erfolg am Team-Zähler prüfen
        const vp = await G.ev('({w:innerWidth,h:innerHeight})'); const before = await tc();
        for (const fy of [0.5, 0.56, 0.45, 0.61]) for (const fx of [0.5, 0.45, 0.55, 0.41, 0.59]) { await G.drag(from, { x: vp.w * fx, y: vp.h * fy }); await this.wait(600); if ((await tc()) !== before) { this.log(`>> stelle ${lineOf(from)} aufs leere Brett`); return true; } }
      } else if (from) {
        const w = units.length > 1 ? Math.min(...units.slice(1).map((f) => Math.hypot(f.x - units[0].x, f.yFeet - units[0].yFeet))) : 95;
        const cands = []; for (const f of units) for (const [dx, dy] of [[-1, 0], [1, 0], [-0.5, 0.78], [0.5, 0.78], [-0.5, -0.78], [0.5, -0.78]]) { const p = { x: f.x + dx * w, y: f.yFeet + dy * w }; if (units.every((q) => Math.hypot(q.x - p.x, q.yFeet - p.y) > w * 0.6)) cands.push(p); }
        const before = await tc();
        for (const p of cands.slice(0, 6)) { await G.drag(from, p); await this.wait(700); if ((await tc()) !== before) { this.log(`>> stelle ${lineOf(from)} auf`); return true; } }
      }
    }
    const sellL = Object.keys((M.field && M.field.sell) || {});
    if (sellL.length && once('sell' + round + JSON.stringify(L.bench))) {
      const from = bench.find((x) => sellL.includes(lineOf(x))); const shop = await G.ev(centerSel('.cards'));
      if (from && shop) { this.log(`>> verkaufe ${lineOf(from)}`); await G.drag(from, shop); return true; }
    }
    if (M.btn && M.btn.xp && once('xp' + round + L.gold + L.level + (L.xp ? L.xp.xp : ''))) { this.log('>> EP kaufen'); await G.ev(jsClickSel('.btn-lvl')); return true; }
    if (M.btn && M.btn.roll && ctx.rolls() < 20 && once('roll' + round + L.gold + JSON.stringify(L.shopInfo))) { ctx.roll(); this.log('>> neu würfeln'); await G.ev(jsClickSel('.btn-roll')); return true; }
    return false;
  }

  // ---------- Protokoll ablegen (Partien aus dem Speicher, die in diesem Lauf Runden bekamen) ----------
  async exportLogs(reason, all, base, mode, t0) {
    try {
      const log = host.store.kkLog || { games: [] }; const ex = this.exported || {};
      const games = (log.games || []).filter((g) => g.rounds.length > (ex[g.id] || 0) && (all || (g.last || 0) >= (t0 || 0) - 60e3));
      if (!games.length) return 0;
      const file = { app: 'Kanto Coach', kind: 'match-log', v: 1, bot: { tool: 'autoplay', mode, reason, cfg: this.cfg, at: new Date().toISOString() }, exported: new Date().toISOString(), games };
      const name = (base || stamp(Date.now()) + '_' + reason.replace(/\W+/g, '')) + '.json';
      fs.writeFileSync(path.join(LOGS, name), JSON.stringify(file, null, 1));
      games.forEach((g) => { ex[g.id] = g.rounds.length; }); this.exported = ex; fs.writeFileSync(path.join(LOGS, 'exported.json'), JSON.stringify(ex));
      this.log(`>> Protokoll: ${name}`);
      return games.reduce((a, g) => a + g.rounds.length, 0);
    } catch (e) { this.log('!! Protokoll nicht gesichert: ' + e.message); return 0; }
  }
}
module.exports = { Bot, MODE_DE };
