// Dateien der Coach-Logik (extension/…) und der Oberfläche: im Projekt direkt von der Platte,
// in der ausführbaren Datei (Node SEA) als eingebettete Assets.
'use strict';
const fs = require('fs'); const path = require('path'); const os = require('os');
let sea = null; try { sea = require('node:sea'); if (!sea.isSea()) sea = null; } catch (e) { sea = null; }
const ROOT = path.join(__dirname, '..', '..', '..');
// name = Pfad relativ zum Projekt, z. B. 'extension/content/reader.js'
function read(name) {
  if (sea) return sea.getAsset(name, 'utf8');
  return fs.readFileSync(path.join(ROOT, name), 'utf8');
}
// Arbeitsordner: Profil des Spiel-Chromes, Speicher, Einstellungen, Protokolle
const HOME = process.env.KK_AUTOPLAY_HOME || (sea ? path.join(process.env.LOCALAPPDATA || os.homedir(), 'KantoCoachAutoplay') : path.join(ROOT, 'tools', 'autoplay', 'data'));
fs.mkdirSync(HOME, { recursive: true });
const LOGS = path.join(HOME, 'logs'); fs.mkdirSync(LOGS, { recursive: true });
module.exports = { read, HOME, LOGS, isSea: !!sea, ROOT };
