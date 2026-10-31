# Changelog

## 2.4.0 – 2026-10-31
**EN**
- Faster decisions under the PvP timer: every pick window in the game now gets a clear “TAKE” mark with a short reason in the overlay.
  - Safari Zone: best card “1 TAKE”, second choice “2” (both Safari layouts).
  - Item reward (“Pick one!”): the item your plan needs, or the one that completes an item with your bag.
  - Seal pick: rule of thumb by round, your plan’s types and roles (the API has no seal statistics).
- Item bag: components that belong together get the same number and colour; the Pokémon that should hold the finished item shows it above its health bar. Components to keep for later get a dashed ring.
- Shop: buy recommendations are numbered (“1”, “2” …) in the game and in “What now?”, the first step is highlighted.
- “What now?” lists item steps (“Drag A onto B → item for Pokémon”).

**DE**
- Schneller entscheiden unter dem PvP-Zeitlimit: Jede Auswahl im Spiel bekommt eine klare „NIMM“-Markierung, das Overlay sagt kurz warum.
  - Safari-Zone: beste Karte „1 NIMM“, zweite Wahl „2“ (beide Safari-Varianten).
  - Item-Belohnung („Wähle eins!“): das Item, das dein Plan braucht, oder das, das mit deinem Beutel sofort ein fertiges Item ergibt.
  - Siegel-Wahl: Faustregel nach Runde, Typen und Rollen deines Plans (die API hat keine Siegel-Statistik).
- Item-Beutel: Zusammengehörige Komponenten bekommen dieselbe Nummer und Farbe, das Pokémon, das das fertige Item tragen soll, zeigt es über seiner Lebensleiste. Komponenten zum Aufheben bekommen einen gestrichelten Rahmen.
- Shop: Kaufempfehlungen sind im Spiel und in „Was jetzt?“ durchnummeriert („1“, „2“ …), der erste Schritt ist hervorgehoben.
- „Was jetzt?“ zeigt Item-Schritte („A auf B ziehen → Item für Pokémon“).

## 2.3.0 – 2026-10-31
**EN**
- Works with game version 41: Kanto Tactics now runs directly on einoow.com (hub `einoow.com/kanto-tactics` and the mode pages `/pvp`, `/duo`, `/tower`, `/nuzlocke`) instead of inside an iframe, so the game reader did not start any more. The extension now loads on einoow.com and only becomes active on Kanto Tactics pages, also when you switch modes without reloading.
- Links point to the new hub address.
- Tested live: PvP against bots (new “Play vs bots”), adventure and tower.

**DE**
- Funktioniert mit Spielversion 41: Kanto Tactics läuft jetzt direkt auf einoow.com (Hub `einoow.com/kanto-tactics` und die Modus-Seiten `/pvp`, `/duo`, `/tower`, `/nuzlocke`) statt in einem iframe, deshalb startete der Spiel-Leser nicht mehr. Die Erweiterung lädt jetzt auf einoow.com und wird nur auf den Kanto-Tactics-Seiten aktiv – auch wenn du die Modi ohne Neuladen wechselst.
- Links zeigen auf die neue Hub-Adresse.
- Live geprüft: PvP gegen Bots (neu „Gegen Bots“), Abenteuer und Turm.

## 2.2.1 – 2026-10-29
**EN**
- English is now the fallback language of the extension (German stays for German browsers).
- Project page and README are English-first; German is still available.

**DE**
- Englisch ist jetzt die Rückfall-Sprache der Erweiterung (Deutsch bleibt für deutsche Browser).
- Projektseite und README sind jetzt zuerst auf Englisch; Deutsch gibt es weiterhin.

## 2.2.0 – 2026-10-28
**EN**
- Battle Tower and adventure: next boss with win rate, warnings up to 5 floors ahead; the tower always uses its own data.
- In-game marks hide behind the game’s menus and dialogs.
- Shop slots keep their position after purchases.
- New logo (board hex with a star).
- Tested live in PvP (friends room), adventure and tower.

**DE**
- Duellturm und Abenteuer: nächster Boss mit Siegquote, Warnung vor schweren Kämpfen bis 5 Etagen im Voraus; der Turm nutzt immer seine eigenen Daten.
- Markierungen im Spiel verschwinden hinter Menüs und Fenstern des Spiels.
- Shop-Plätze bleiben nach Käufen an ihrer Position.
- Neues Logo (Spielfeld-Hex mit Stern).
- Live geprüft in PvP (Freundesraum), Abenteuer und Turm.

## 2.1.0 – 2026-10-28
**EN**
- Game version 40: anchored forms (⚓), character Pokémon, adventure difficulties (Normal/Veteran), interest cap read from the game (+4 in adventure).
- “Send plan to the game”: team code for the game’s planner.
- Fallback plans with type synergy when the API stats are down.
- More robust start: request timeouts, lobby detection.

**DE**
- Spielversion 40: verankerte Formen (⚓), Figuren-Pokémon, Abenteuer-Stufen (Normal/Veteran), Zinsgrenze aus dem Spiel (+4 im Abenteuer).
- „Plan ins Spiel übernehmen“: Team-Code für den Planer des Spiels.
- Ersatz-Pläne mit Typ-Synergie, wenn die Statistik der API ausfällt.
- Robuster Start: Zeitlimit für Abrufe, Lobby wird erkannt.

## 2.0.0 – 2026-10-24
- First published version: overlay with Now/Plan/Items/Team, automatic detection of shop, bench, board and items, marks in the game. · Erste veröffentlichte Version.
