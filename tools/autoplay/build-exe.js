#!/usr/bin/env node
// Baut KantoCoachAutoplay.exe (Node „Single Executable Application“, ohne zusätzliche Werkzeuge):
//   node tools/autoplay/build-exe.js      ->  dist/autoplay/KantoCoachAutoplay.exe (+ ZIP)
// Die eigenen Module werden zu einer Datei gebündelt (eine SEA kann nur eingebaute Module laden); Coach-Logik
// (extension/…) und Oberfläche werden als Assets eingebettet – die .exe braucht weder Node noch das Projekt.
'use strict';
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'); const OUT = path.join(ROOT, 'dist', 'autoplay'); fs.mkdirSync(OUT, { recursive: true });
const MODULES = ['app', 'engine/files', 'engine/host', 'engine/inject', 'engine/browser', 'engine/board', 'engine/bot', 'engine/stats'];
const ASSETS = ['extension/manifest.json', 'extension/background.js', 'extension/lib/i18n-game.js', 'extension/lib/seals-de.js', 'extension/lib/core.js',
  'extension/content/overlay.js', 'extension/content/reader.js', 'tools/autoplay/ui/index.html'];

// 1. Bündeln: jedes Modul als Funktion, require() für ./… auf die Bündel-Einträge umgebogen
const parts = MODULES.map((m) => {
  let src = fs.readFileSync(path.join(__dirname, m + '.js'), 'utf8').replace(/^#!.*\n/, '');
  return `${JSON.stringify(m)}: function (module, exports, require) {\n${src}\n}`;
});
const bundle = `'use strict';
const __path = require('path').posix; const __defs = {\n${parts.join(',\n')}\n}; const __cache = {};
function __load(name) {
  if (__cache[name]) return __cache[name].exports;
  const module = { exports: {} }; __cache[name] = module;
  const req = (n) => { if (!n.startsWith('.')) return require(n); const k = __path.normalize(__path.join(__path.dirname(name), n)).replace(/\\.js$/, ''); if (!__defs[k]) throw new Error('Modul fehlt im Bündel: ' + k); return __load(k); };
  __defs[name].call(module.exports, module, module.exports, req); return module.exports;
}
__load('app');
`;
const bundleFile = path.join(OUT, 'bundle.js'); fs.writeFileSync(bundleFile, bundle);

// 2. SEA-Konfiguration mit eingebetteten Assets
const exe = path.join(OUT, 'KantoCoachAutoplay.exe');
const cfg = { main: bundleFile, output: exe, disableExperimentalSEAWarning: true, useCodeCache: false, useSnapshot: false,
  assets: Object.fromEntries(ASSETS.map((a) => [a, path.join(ROOT, a)])) };
const cfgFile = path.join(OUT, 'sea-config.json'); fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 1));
try { fs.rmSync(exe, { force: true }); } catch (e) {}
execFileSync(process.execPath, ['--build-sea', cfgFile], { stdio: 'inherit' });
const mb = (fs.statSync(exe).size / 1048576).toFixed(1);
console.log(`\nFertig: ${exe} (${mb} MB)`);

// 3. Kurze Anleitung daneben legen
fs.writeFileSync(path.join(OUT, 'LIESMICH.txt'), [
  'Kanto Coach Autoplay', '====================', '',
  'Doppelklick auf KantoCoachAutoplay.exe. Es öffnet sich ein Konsolenfenster (offen lassen) und das Programmfenster.',
  'Dort einstellen, was gespielt werden soll, und auf Start klicken. Der Bot spielt in einem eigenen Browser-Fenster.',
  '', 'Voraussetzung: Chrome, Edge, Brave, Vivaldi, Opera oder Firefox.',
  'Daten, Protokolle und Bilder: %LOCALAPPDATA%\\KantoCoachAutoplay',
  '', 'Konto: Standard ist Gast. Mit „Mit meinem einoow-Konto spielen“ und „Bot-Browser öffnen“ meldest du dich dort selbst an.',
  'Regeln: PvP nur als Training gegen Bots (nie gewertet), klickt nur, was ein Spieler auch klicken würde.',
  'Windows kann beim ersten Start warnen („unbekannter Herausgeber“) – die Datei ist nicht signiert.', '',
  'Kanto Coach Autoplay', '--------------------',
  'Double-click KantoCoachAutoplay.exe. A console window (keep it open) and the app window open.',
  'Choose what to play and press Start. The bot plays in its own browser window (Chrome, Edge, Brave, Vivaldi, Opera or Firefox).',
  'Account: guest by default. Tick "play with my einoow account", press "open bot browser" and log in there yourself.',
  'PvP only as training against bots (never ranked). Windows may warn on first start – the file is not signed.', '',
  'Inoffizielles Fan-Werkzeug / unofficial fan tool · Daten: Kanto Tactics · einoow.com', ''].join('\r\n'));
