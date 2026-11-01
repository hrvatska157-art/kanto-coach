# Kanto Coach Autoplay

Eigenständiges Programm mit Oberfläche, das Kanto Tactics selbst spielt – **Abenteuer (Normal/Veteran/Legende),
Duellturm, Nuzlocke und PvP-Training gegen Bots** – und nach jeder Partie ein Protokoll ablegt. Ziel: viele echte
Partien sammeln und die Empfehlungen des Kanto Coach an Siegen und Niederlagen ausrichten.

**Unabhängig vom Overlay:** Die Chrome-Erweiterung muss nicht installiert sein. Das Programm startet einen eigenen
Browser mit eigenem Profil – **Chrome, Edge, Brave, Vivaldi, Opera oder Firefox** – und spielt die Coach-Logik selbst in
die Spielseite ein.

## Starten

- **Fertige Datei:** `dist/autoplay/KantoCoachAutoplay.exe` doppelklicken (bauen mit `node tools/autoplay/build-exe.js`).
  Es öffnet sich ein Konsolenfenster (offen lassen) und das Programmfenster.
- **Aus dem Projekt:** `tools/autoplay/Autoplay starten.bat` oder `node tools/autoplay/app.js`.

Voraussetzung: einer der Browser oben (Chrome-Familie oder Firefox). Die `.exe` enthält Node – sonst nichts zu installieren.
Daten, Protokolle und Bilder: `%LOCALAPPDATA%\KantoCoachAutoplay` (aus dem Projekt: `tools/autoplay/data`).

## Die Oberfläche

| Bereich | Inhalt |
|---|---|
| **Was soll gespielt werden?** | Modi ankreuzen (werden der Reihe nach gespielt), Abenteuer-Geschichte und Stufe |
| **Konto** | „Mit meinem einoow-Konto spielen“ und „Bot-Browser öffnen“: Du meldest dich dort **selbst** an, das Bot-Profil merkt sich die Anmeldung. Der Bot gibt nie ein Passwort ein. |
| **Einstellungen** | Anzahl Partien, höchstens Stunden, Minuten je Partie, Tempo (schnell/normal/gemütlich), Aufstellung nach Rollen, Bild vom Ende speichern, Spiel-Browser offen lassen, Spiel-Browser (automatisch, Chrome, Edge, Firefox, Brave, Vivaldi, Opera oder eigener Pfad) |
| **Start / Pause / Partie überspringen / Stopp / Beenden** | Stopp und Überspringen sichern das Protokoll der laufenden Partie |
| **Live** | Bild des Spiels (alle 2,5 s), Modus, Station/Etage/Runde, KP bzw. Leben, Gold, Level, Partie x/y, Brett und Bank mit Sternen |
| **Was der Bot tut** | jede Aktion (Kauf, Tausch, Item, Kampf, Fenster) und Warnungen |
| **Letzte Partien** | Ergebnis je Partie mit Protokoll und Bild zum Herunterladen |
| **Je Modus** | Partien, Kämpfe, Anteil Niederlagen, bestes Ergebnis, PvP-Plätze |
| **Auffällig bei Niederlagen** | Merkmale direkt vor verlorenen Kämpfen (freie Plätze, viel Gold liegen gelassen, kein ★★, Heiler ohne Anticura …) |

## Wie es gebaut ist

```
app.js            Server nur auf 127.0.0.1 (Oberfläche + Steuerung), öffnet das App-Fenster (Chrome/Edge --app)
ui/index.html     Oberfläche (eine Datei, keine fremden Server)
engine/host.js    extension/background.js läuft in Node (vm) mit nachgebauten chrome.*-Schnittstellen; Speicher in store.json
engine/inject.js  spielt lib/i18n-game.js, lib/seals-de.js, lib/core.js, content/overlay.js (unsichtbar) und content/reader.js
                  in eine isolierte Umgebung der Spielseite ein (eigene chrome.*-Nachbildung, Bindung kkHost zu Node)
engine/browser.js Spiel-Browser: Chrome-Familie über DevTools (CDP, Port ab 9340), Firefox über WebDriver BiDi (Port ab 9350,
                  Vorab-Skript in eigener Sandbox, Kanal kkHost); Maus/Klicks, Bildschirmfotos
engine/board.js   Brett-Geometrie (im Spiel vermessen) und Wunsch-Aufstellung nach Rollen
engine/bot.js     Ablauf: Start je Modus, Markierungen des Coaches ausführen, Fenster, Wächter, Protokoll
engine/stats.js   Auswertung der Protokolle für die Oberfläche
build-exe.js      bündelt alles zu einer Datei und baut die .exe (Node „Single Executable Application“)
```

Die Entscheidungen sind dieselben wie im Overlay: Plan, Käufe, Aufstellung, Items, Tafeln, Segen, Relikte, Siegel, EP,
Würfeln. Dazu entscheidet der Bot selbst die Arena-Wahl (Stufe + Typ-Vorteil) und stellt auf ein leeres Brett.

**Aufstellung nach Rollen** (vor jedem Kampf): gemessene Felder der Comp aus Ranked-Spielen zuerst, sonst Tanks vorn in
die Mitte, Kämpfer vorn/zweite Reihe, Assassinen an die Flanken, Fernkämpfer/Magier hinten in die Ecken – hat der Gegner
Assassinen, hinten in die Mitte. Das Brett ist 3D (keine Felder im DOM); `engine/board.js` rechnet Felder in
Bildschirmpunkte um (vermessen für die Innenfläche 1584×805, Fenstergröße stellt der Bot selbst ein). Das Spiel vergibt
beim Verschieben neue IDs, und ein Ablegen auf ein besetztes Feld tut nichts – deshalb zieht der Bot erst auf freie
Ziele und parkt Figuren notfalls auf freien Feldern (höchstens 14 Züge).
Änderungen an der Coach-Logik (`public/js/core.js` → `node tools/sync-extension.js`) wirken im Bot nach einem Neustart
von `app.js`; für die `.exe` neu bauen.

## Regeln, an die sich der Bot hält

- **Gast oder eigenes Konto.** Standard ist Gast (Ränge nur im Browser gespeichert). Mit dem Häkchen „Mit meinem
  einoow-Konto spielen“ spielt er mit dem Konto, das du im Bot-Browser selbst angemeldet hast; ohne Häkchen stoppt er,
  sobald dort ein Konto angemeldet ist. Abenteuer-, Turm- und Nuzlocke-Fortschritt landen dann in deinem Konto.
- **PvP nur als „Training · gegen 7 Bots · zählt nicht“** – auch mit Konto nie gewertet, nie in Partien mit Menschen
  (die API-Seite erlaubt Bots, die ihre Daten nutzen – nicht, Menschen in Ranked-Partien einen Bot gegenüberzusetzen).
  Vor jedem Start geprüft.
- Klickt nur, was ein Spieler auch klicken würde; liest nur, was auf der Seite sichtbar ist; greift nicht in den
  Netzwerkverkehr ein. Spieldaten über die öffentliche API (höchstens stündlich, wie verlangt).
- Ein Fenster, normales Tempo. Gespielte Partien fließen wie alle anderen in die Statistik des Spiels ein – darum maßvoll
  einsetzen.

## Grenzen

- Aufstellung: Die Brett-Vermessung gilt für die vom Bot eingestellte Fenstergröße; Rollen kommen aus dem Spielcode
  bzw. sind aus Reichweite/Attacke geschätzt.
- Firefox: Läuft ein altes Bot-Firefox noch mit demselben Profil, startet kein zweites – dann das alte Fenster schließen.
- Händler, Schrein und Herausforderung im Turm werden übersprungen.
- Die `.exe` ist nicht signiert – Windows kann beim ersten Start warnen.
