# Changelog

All versions below 1.0 are **beta** – the extension stays in beta until everything runs cleanly in every mode. (Earlier releases were numbered 2.x; they are the same builds as 0.1–0.7.)

Alle Versionen unter 1.0 sind **Beta** – die Erweiterung bleibt Beta, bis alles in jedem Modus sauber läuft. (Frühere Releases hießen 2.x; es sind dieselben Stände wie 0.1–0.7.)

## 0.8.4 Beta – 2026-11-01
Lessons from the first automated games (a bot followed every coach mark in Adventure, Tower, Nuzlocke and PvP training):
**EN**
- **Copies for your board:** even without a plan the coach now suggests copies of Pokémon on your board towards ★★/★★★. Before, a whole Adventure could stay at ★ (46% losses up to stop 21 → with the fix: stop 26 with 12% losses).
- **Items without a plan:** finished items are handed out and components combined even when no plan is chosen.
- **Adventure:** before Koga (stop 11–16) without a ★★★, reroll down to 10 gold if a ★★ is waiting for copies. XP + buy at most one level above the schedule (no more level 8 at stop 12 with 1 gold left).
- **PvP:** after a loss, level up even below the interest threshold (the bot sat at level 4 until 2-6 with 47 gold and lost 52 HP). New reroll plan: from stage 3 at 60 HP or less, reroll down to 20 gold when Pokémon on your board or in your plan wait for copies (“stabilize”); from stage 4 at level 7+, roll down to 30 gold (10 at 50 HP or less) until the plan Pokémon are ★★. Level targets at least 5 in stage 2, 7 in stage 3, 8 in stage 4; from stage 3 level up as long as 20 gold remain. In PvP training against bots the bot went from an early exit to 4th, 5th, 2nd and 2nd place.
- **Nuzlocke:** no rerolls there – gold above the interest threshold goes into XP. Lost lives now count as losses in the match log.
- **Tower:** after losing a floor, reroll for counters (the bot lost floor 55, all Electric, three times with the same board and 30 gold left).

**DE**
- **Kopien fürs Feld:** Auch ohne Plan schlägt der Coach jetzt Kopien von Pokémon auf deinem Feld vor (Richtung ★★/★★★). Vorher konnte ein ganzes Abenteuer auf ★ bleiben (46 % Niederlagen bis Station 21 → mit der Korrektur: Station 26 mit 12 %).
- **Items ohne Plan:** Fertige Items werden verteilt und Komponenten kombiniert, auch wenn kein Plan gewählt ist.
- **Abenteuer:** Vor Koga (Station 11–16) ohne ★★★ bis 10 Gold würfeln, wenn ein ★★ auf Kopien wartet. EP + Kauf höchstens ein Level über dem Fahrplan (kein Level 8 an Station 12 mit 1 Gold mehr).
- **PvP:** Nach einer Niederlage auch unter der Zinsgrenze aufsteigen (der Bot blieb bis 2-6 auf Level 4 mit 47 Gold und verlor 52 KP). Neuer Würfel-Fahrplan: ab Stage 3 mit höchstens 60 KP bis 20 Gold würfeln, wenn Pokémon auf dem Feld oder im Plan auf Kopien warten („stabilisieren“); ab Stage 4 auf Level 7+ bis 30 Gold (bei höchstens 50 KP bis 10), bis die Plan-Pokémon ★★ sind. Ziel-Level mindestens 5 in Stage 2, 7 in Stage 3, 8 in Stage 4; ab Stage 3 aufsteigen, solange 20 Gold bleiben. Im PvP-Training gegen Bots kam der Bot so vom frühen Aus auf Platz 4, 5, 2 und 2.
- **Nuzlocke:** Dort gibt es kein Neu-Würfeln – Gold über der Zinsgrenze geht in EP. Verlorene Leben zählen im Protokoll als Niederlage.
- **Turm:** Nach einer verlorenen Etage nach Kontern würfeln (der Bot verlor Etage 55, alles Elektro, dreimal mit demselben Brett und 30 Gold im Beutel).

## 0.8.3 Beta – 2026-11-01
**EN**
- **Match log:** the coach records every round locally – shop, bench, board, items, gold, level, the next enemy, what it advised and the fight result. In the overlay (Team tab) you can save it as a file, pause or delete it. Nothing is sent anywhere. Sharing a few of these files lets the advice be tuned on real wins and losses.
- Tips about the next enemy (healers, assassins) and the Legend checkpoints now show up no matter which tab is open.

**DE**
- **Partie-Protokoll:** Der Coach zeichnet jede Runde lokal auf – Shop, Bank, Brett, Items, Gold, Level, den nächsten Gegner, seinen Rat und das Kampfergebnis. Im Overlay (Reiter „Team“) kannst du es als Datei speichern, pausieren oder löschen. Es wird nichts gesendet. Wenn du ein paar dieser Dateien weitergibst, lassen sich die Empfehlungen an echten Siegen und Niederlagen ausrichten.
- Tipps zum nächsten Gegner (Heiler, Assassinen) und die Legende-Kontrollpunkte erscheinen jetzt unabhängig vom offenen Reiter.

## 0.8.2 Beta – 2026-11-01
**EN**
- **Relic pick (Tower, after each guardian):** the coach now recognizes the “Relic!” window and marks the best card – a Plate goes where it adds the most to your board (calculated, e.g. “gives Golbat the Rock type – board 2% stronger”), a signature item only counts if its Pokémon is yours. Even a useless relic beats “None” (you can sell it).
- **New Tower blessings** (HP Up, Leftovers, Team Training, Legendary Trail, Token Pouch) are recognized. The Leftovers blessing (+HP per floor won) is no longer mistaken for the Leftovers item. **Rare Candy from floor 41 is a full level** and now ranks first; before floor 41 it’s only a little XP. HP Up, Sacred Ash and Leftovers rank high (losses cost HP in the Tower).
- **Enemy abilities count against your types:** e.g. Ground is immune to Electric abilities, Ice hits Ground twice as hard – the line-up calculation now includes both directions.
- **Next enemy:** healers (Chansey, Snorlax, Tangela, …) → build Heal Block (Poison Barb/Flame Orb) first; two or more assassins → keep your carry out of the back corners, cheap Pokémon there as bait. Roles now come from the game itself (tank, assassin, mage, …).
- **Adventure XP schedule** (from 130+ Legend runs by another player): level 4 at stop 5, 5 at 7, 6 at 10, 7 at 16, 8 at 22 – only the XP you need, the rest into rerolls.
- **Legend checkpoints:** warnings before Brock (two ★★ that hit Rock/Ground), Koga at stop 16 (a ★★★ and 60+ HP) and Blaine (Snorlax ★★ + Bulbasaur ★★ as taunt tanks).

**DE**
- **Relikt-Wahl (Turm, nach jedem Wächter):** Der Coach erkennt das Fenster „Relikt!“ und markiert die beste Karte – eine Tafel dorthin, wo sie dein Feld am meisten stärkt (gerechnet, z. B. „gibt Golbat den Typ Gestein – Feld 2 % stärker“), ein Signatur-Item nur, wenn du sein Pokémon hast. Auch ein unnützes Relikt ist besser als „Keins“ (lässt sich verkaufen).
- **Neue Turm-Segen** (KP-Plus, Überreste, Teamtraining, Legendäre Spur, Markenbeutel) werden erkannt. Der Segen Überreste (+KP je gewonnener Etage) wird nicht mehr mit dem Item Überreste verwechselt. **Sonderbonbon ab Etage 41 = ein ganzes Level** und steht dann ganz oben; vorher bringt es nur ein paar EP. KP-Plus, Zauberasche und Überreste stehen weit oben (Niederlagen kosten im Turm KP).
- **Gegner-Attacken gegen deine Typen:** z. B. ist Boden immun gegen Elektro-Attacken, Eis trifft Boden doppelt – die Aufstellung rechnet jetzt in beide Richtungen.
- **Nächster Gegner:** Heiler (Chaneira, Relaxo, Tangela …) → zuerst Anticura (Giftstich/Heiß-Orb) bauen; zwei oder mehr Assassinen → Carry nicht in die hinteren Ecken, billige Pokémon dort als Köder. Rollen kommen jetzt aus dem Spiel selbst (Tank, Assassine, Magier …).
- **EP-Fahrplan im Abenteuer** (aus 130+ Legende-Läufen eines anderen Spielers): Level 4 an Station 5, 5 an 7, 6 an 10, 7 an 16, 8 an 22 – nur die nötigen EP, der Rest ins Würfeln.
- **Legende-Kontrollpunkte:** Warnungen vor Rocko (zwei ★★, die Gestein/Boden treffen), Koga an Station 16 (ein ★★★ und mindestens 60 KP) und Pyro (Relaxo ★★ + Bisasam ★★ als Spott-Tanks).

## 0.8.1 Beta – 2026-11-01
**EN**
- **Tower Plates count:** a Plate (e.g. Toxic Plate, Spooky Plate) gives its holder its type – the coach now counts it for the type tiers, like the game does. Before, it suggested swaps that broke a tier you already had through a Plate.
- **No more swaps that make the board worse:** a swap is only suggested when it makes the board at least 4% stronger and keeps every active type tier (otherwise at least +15%). The suggestion shows how much stronger.
- **No duplicates on the board:** a second copy of a Pokémon already on the board never pushes another Pokémon out (it adds no type and merges at the next planning phase anyway).
- **Relics:** Plates in the bag go to the Pokémon on the board where they add the most (usually a new type tier). Signature relics (Light Ball, Thick Club, …) go to their own Pokémon.
- **Heal Block from floor 50:** enemies heal a lot up there – if nobody on your board has Poison Barb or Flame Orb yet, the coach suggests building one first.
- Tower costs and types of the Adventure/Tower-only families (Mankey 1, Tangela 3, Horsea, Krabby, …) are known from the start, not only once the card shows up in the shop.

**DE**
- **Tafeln im Turm zählen:** Eine Tafel (z. B. Gifttafel, Spuktafel) gibt ihrem Träger ihren Typ – der Coach zählt sie jetzt für die Typ-Stufen mit, wie das Spiel. Vorher schlug er Tausche vor, die eine schon per Tafel erreichte Stufe kaputt machten.
- **Keine Tausche mehr, die das Feld schwächen:** Getauscht wird nur, wenn das Feld mindestens 4 % stärker wird und keine aktive Typ-Stufe verloren geht (sonst mindestens +15 %). Der Vorschlag zeigt, wie viel stärker.
- **Keine Doppelten aufs Feld:** Eine zweite Kopie eines Pokémon, das schon steht, verdrängt nie ein anderes Pokémon (sie bringt keinen Typ und verschmilzt beim nächsten Planen ohnehin).
- **Reliquien:** Tafeln im Beutel gehen an das Pokémon auf dem Feld, bei dem sie am meisten bringen (meist eine neue Typ-Stufe). Signatur-Reliquien (Kugelblitz, Kampfknochen, …) an ihr eigenes Pokémon.
- **Anticura ab Etage 50:** Dort heilen die Gegner stark – trägt noch niemand auf dem Feld Giftstich oder Heiß-Orb, schlägt der Coach zuerst eins davon vor.
- Turm-Kosten und Typen der Familien, die es nur im Abenteuer/Turm gibt (Menki 1, Tangela 3, Seeper, Krabby, …), sind von Anfang an bekannt – nicht erst, wenn die Karte im Shop auftaucht.

## 0.8.0 Beta – 2026-11-01
**EN**
- **New Tower (game version 41):** the Tower shop has every family in its first form – many of them aren’t in the public data yet. The coach now recognizes all 151 Pokémon (no more “not matched: #118”) and takes **cost and types straight from the shop card** (e.g. Tangela costs 3 in the Tower, not 4 like in PvP).
- **Board advice calculated from the game’s numbers:** “Field now” compares every possible line-up – each Pokémon’s stats (HP, Defense, Attack, speed, crit, ability power and mana), its stars and items, plus the type tiers the line-up forms together (value of each tier from ranked placements). Same calculation for buys: a Pokémon that makes the board measurably stronger gets **“STRONGER”** or **“+TYPE”**, with “instead of X” when the board is full.
- **Plan copies up to the planned star:** if the plan wants a Pokémon at ★★★ (e.g. Kakuna, Nidorino), every further copy is suggested – before, only core Pokémon got that.
- **XP + buy together:** in Adventure/Tower the coach checks whether one more slot plus a shop Pokémon is worth more than interest (e.g. level 8 and Venonat for Bug 3) and says so.
- **Opponents:** the coach reads enemy Pokémon on the board. Tower/Adventure: the next opponent (visible while planning) – your abilities’ type advantage (the game’s type chart, abilities only) counts for the line-up. PvP: boards seen in fights – opponents’ copies of your plan Pokémon lower the odds to find them, the plan choice accounts for that.
- No more “1 more Bug for Bug 3: look out for one” while one is right there in the shop.

**DE**
- **Neuer Turm (Spielversion 41):** Der Turm-Shop hat jede Familie in ihrer ersten Form – viele davon stehen noch nicht in den öffentlichen Daten. Der Coach erkennt jetzt alle 151 Pokémon (kein „Nicht zugeordnet: #118“ mehr) und nimmt **Kosten und Typen direkt von der Shop-Karte** (z. B. kostet Tangela im Turm 3, nicht 4 wie im PvP).
- **Aufstellung aus den Zahlen des Spiels gerechnet:** „Jetzt aufstellen“ vergleicht alle möglichen Aufstellungen – Werte jedes Pokémon (KP, Verteidigung, Angriff, Tempo, Krit, Stärke und Energie der Attacke), Sterne und Items und die Typ-Stufen, die zusammen entstehen (Wert jeder Stufe aus den Ranked-Platzierungen). Gleiche Rechnung für Käufe: Ein Pokémon, das dein Feld messbar stärker macht, bekommt **„STÄRKER“** oder **„+TYP“**, bei vollem Feld mit „statt X“.
- **Plan-Kopien bis zum geplanten Stern:** Will der Plan ein Pokémon auf ★★★ (z. B. Kokuna, Nidorino), wird jede weitere Kopie vorgeschlagen – vorher nur bei Kern-Pokémon.
- **EP und Kauf zusammen:** Im Abenteuer/Turm rechnet der Coach, ob ein Platz mehr plus ein Shop-Pokémon mehr bringt als die Zinsen (z. B. Level 8 und Bluzuk für Käfer 3), und sagt es.
- **Gegner:** Der Coach liest gegnerische Pokémon auf dem Brett. Turm/Abenteuer: der nächste Gegner (in der Planungsphase sichtbar) – der Typ-Vorteil deiner Attacken (Typ-Tabelle des Spiels, nur Attacken) fließt in die Aufstellung ein. PvP: in Kämpfen gesehene Felder – Kopien deiner Plan-Pokémon bei Gegnern senken die Chance, sie zu finden; die Plan-Wahl rechnet das ein.
- Kein „Noch 1 Käfer für Käfer 3: halte Ausschau“ mehr, während einer im Shop liegt.

## 0.7.0 Beta – 2026-11-01
**EN**
- Logic fixes after many automated test games in every mode (a test Chrome follows every coach mark in the real game):
  - **Items already held** are now actually read from the board (the game shows them as small icons without an image tag – the reader never saw them) and never suggested again (e.g. Scope Lens for a Golbat that already has one, Shell Bell on the item pick for a Parasect that already holds it). At most 3 items per Pokémon.
  - **★★! only when the game itself says the card merges** (the card’s own “merge” mark). A bought copy was sometimes counted twice, which showed ★★! on cards that only had 1 of 3.
  - **The coach no longer stopped reading** after a while: the game can clear shared page timers, which froze the reader in quiet moments (e.g. while a pick window was open). The reader now has several independent clocks and heals itself.
  - Items are only planned for Pokémon you actually have and field; holders aren’t swapped out right after getting an item. Finished items no plan needs are given to the best fitting Pokémon instead of lying in the bag.
  - PvP level targets without stats: level 5 in stage 2, 7 in stage 3, 8 in stage 4 – also slightly below the interest cap when you’re behind.
  - Board: stable placement advice (no more back-and-forth between equal Pokémon), item holders and ★★ count more; **“FIELD IT”, “1 IN / 1 OUT” and “SELL” marks** right on the bench and board.
  - Full bench: only buys that merge; trait buys only with a free board slot (no more buy-then-sell).
  - XP only when the level-up is reachable this turn; in PvP only up to the usual level of the stage, then reroll for ★★. With low HP in PvP: spend gold instead of saving.
  - PvP training games: the planning phase is detected without a ready button (affected swaps, team counts and loss detection).
  - Adventure events (e.g. “Prof. Oak”: Rare Candy, Carbos, Protein) get a TAKE mark too.
  - Lobby shows the mode the hub is currently showing; core Pokémon at ★★ get “copy toward ★★★”.
- Fixed hidden control characters in some reader patterns from 0.5/0.6 (Safari “taken”, “already picked”).
- Storage: at most two adventure/tower data sets are kept, so the 10 MB extension storage can’t fill up and block the coach.
- **Self-update for folder installs:** if a newer version lands in the extension folder (e.g. after unzipping a new release over it), the extension reloads itself within a minute and refreshes open game tabs – no click in chrome://extensions needed anymore (from 0.7 on).

**DE**
- Logik-Korrekturen nach vielen automatischen Testpartien in allen Modi (ein Test-Chrome folgt im echten Spiel jeder Markierung des Coaches):
  - **Getragene Items** werden jetzt wirklich vom Brett gelesen (das Spiel zeigt sie als kleine Symbole ohne Bild-Element – der Leser hat sie nie gesehen) und nicht noch einmal vorgeschlagen (z. B. Scope-Linse für ein Golbat, das schon eine hat, Muschelglocke bei der Item-Wahl für ein Parasek, das sie schon trägt). Höchstens 3 Items pro Pokémon.
  - **★★! nur, wenn das Spiel selbst sagt, dass die Karte verschmilzt** (eigene „merge“-Markierung der Karte). Eine gekaufte Kopie wurde teils doppelt gezählt – daher ★★! auf Karten mit „1 von 3“.
  - **Der Coach hörte nicht mehr auf mitzulesen:** Das Spiel kann geteilte Timer der Seite abräumen, dann stand der Leser in ruhigen Momenten still (z. B. bei offenem Auswahlfenster). Jetzt mehrere unabhängige Taktgeber mit Selbstheilung.
  - Items nur noch für Pokémon, die du hast und aufstellst; Träger werden nicht direkt danach ausgetauscht. Fertige Items, die kein Plan braucht, gehen an das passendste Pokémon, statt im Beutel zu liegen.
  - PvP-Level ohne Statistik: Level 5 in Stage 2, 7 in Stage 3, 8 in Stage 4 – auch knapp unter der Zinsgrenze, wenn du hinterherhinkst.
  - Brett: stabile Aufstell-Empfehlung (kein Hin und Her zwischen gleich starken Pokémon), Item-Träger und ★★ zählen mehr; **„AUFS FELD“, „1 REIN / 1 RAUS“ und „VERKAUFEN“** direkt an Bank und Brett.
  - Volle Bank: nur noch Käufe, die verschmelzen; Typ-Käufe nur mit freiem Platz auf dem Brett (kein Kaufen-dann-Verkaufen mehr).
  - EP nur, wenn der Aufstieg in dieser Runde erreichbar ist; im PvP nur bis zum üblichen Level der Stage, danach für ★★ würfeln. Mit wenig KP im PvP: Gold einsetzen statt sparen.
  - PvP-Training: Planungsphase wird auch ohne Bereit-Knopf erkannt (betraf Tauschen, Teamzählung, Niederlagen).
  - Abenteuer-Ereignisse (z. B. „Prof. Eich“: Sonderbonbon, Carbon, Protein) bekommen ebenfalls „NIMM“.
  - Lobby zeigt den Modus, den die Startseite gerade zeigt; Kern-Pokémon auf ★★ bekommen „Kopie Richtung ★★★“.
- Versteckte Steuerzeichen in einigen Suchmustern des Lesers aus 0.5/0.6 behoben (Safari „schon genommen“, „schon gewählt“).
- Speicher: Höchstens zwei Datensätze für Abenteuer/Turm bleiben gespeichert, damit der 10-MB-Speicher der Erweiterung nicht vollläuft und den Coach blockiert.
- **Selbst-Aktualisierung bei Ordner-Installation:** Liegt eine neuere Version im Ordner der Erweiterung (z. B. neue Release-ZIP darüber entpackt), lädt sie sich innerhalb einer Minute selbst neu und frischt offene Spiel-Tabs auf – kein Klick in chrome://extensions mehr nötig (ab 0.7).

## 0.6.0 Beta – 2026-10-31
**EN**
- Played through every mode and fixed what got in the way:
  - Lobby: no more stale shop and tips from the last game – the overlay shows the mode (also Duos and Nuzlocke) and waits for the next game. A new game lets the coach pick a fresh plan.
  - Gold: in Adventure and the Battle Tower the coach now says when to buy XP (with the number of clicks to the next level) or reroll for ★★ instead of sitting on gold above the interest cap – and marks the “Buy XP” / “Reroll” button in the game. After a lost fight it prefers strength over interest.
  - Board: “Put X on the board” and “Field X instead of Y” name the Pokémon instead of “1 slot free”.
  - Items: complete recipes are found before half ones (two components no longer block each other), and if no planned item can be built, the best item from your bag is suggested instead of hoarding components.
  - Adventure: before hard fights and after a loss a “counter” card shows the three Pokémon players most often win that exact fight with (with win rate); missing ones are marked COUNTER in the shop and fielded first.
  - Nuzlocke: one buy per shop – exactly one TAKE mark, no saving or reroll tips.
  - New pick windows: tower boons (“Tower boon”) and the partner pick at the start of Adventure/Nuzlocke get a TAKE mark too.
  - Battle Tower: “elite” floors are called Elite trainer (not Elite Four); a single item reward is shown without a pick mark.
- The website (Kanto Coach Hub) has its own page for the extension.

**DE**
- Alle Modi durchgespielt und behoben, was im Weg war:
  - Lobby: kein alter Shop und keine alten Tipps aus der letzten Partie mehr – das Overlay zeigt den Modus (auch Partner-PvP und Nuzlocke) und wartet auf das nächste Spiel. Ein neues Spiel lässt den Coach einen frischen Plan wählen.
  - Gold: Im Abenteuer und im Duellturm sagt der Coach jetzt, wann du EP kaufen (mit Anzahl Klicks bis zum nächsten Level) oder für ★★ neu würfeln sollst, statt Gold über der Zinsgrenze liegen zu lassen – und markiert im Spiel den Knopf „Kaufe XP“ bzw. „Neu würfeln“. Nach einer Niederlage geht Stärke vor Zinsen.
  - Brett: „X aufs Feld stellen“ und „X statt Y aufstellen“ nennen die Pokémon statt „1 Platz frei“.
  - Items: Komplette Rezepte werden vor halben gefunden (zwei Komponenten blockieren sich nicht mehr), und wenn kein geplantes Item baubar ist, schlägt der Coach das beste Item aus deinem Beutel vor, statt Komponenten zu horten.
  - Abenteuer: Vor schweren Kämpfen und nach einer Niederlage zeigt eine „Konter“-Karte die drei Pokémon, mit denen Spieler genau diesen Kampf am häufigsten gewinnen (mit Winrate); fehlende werden im Shop als KONTER markiert und zuerst aufgestellt.
  - Nuzlocke: ein Kauf pro Shop – genau eine NIMM-Markierung, keine Spar- oder Würfel-Tipps.
  - Neue Auswahlfenster: Segen des Turms und die Partnerwahl am Start von Abenteuer/Nuzlocke bekommen ebenfalls „NIMM“.
  - Duellturm: „elite“-Etagen heißen Elite-Trainer (nicht Top Vier); ein einzelnes Item als Belohnung erscheint ohne Wahl-Markierung.
- Die Website (Kanto Coach Hub) hat eine eigene Seite für die Erweiterung.

## 0.5.0 Beta – 2026-10-31
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

## 0.4.0 Beta – 2026-10-31
**EN**
- Works with game version 41: Kanto Tactics now runs directly on einoow.com (hub `einoow.com/kanto-tactics` and the mode pages `/pvp`, `/duo`, `/tower`, `/nuzlocke`) instead of inside an iframe, so the game reader did not start any more. The extension now loads on einoow.com and only becomes active on Kanto Tactics pages, also when you switch modes without reloading.
- Links point to the new hub address.
- Tested live: PvP against bots (new “Play vs bots”), adventure and tower.

**DE**
- Funktioniert mit Spielversion 41: Kanto Tactics läuft jetzt direkt auf einoow.com (Hub `einoow.com/kanto-tactics` und die Modus-Seiten `/pvp`, `/duo`, `/tower`, `/nuzlocke`) statt in einem iframe, deshalb startete der Spiel-Leser nicht mehr. Die Erweiterung lädt jetzt auf einoow.com und wird nur auf den Kanto-Tactics-Seiten aktiv – auch wenn du die Modi ohne Neuladen wechselst.
- Links zeigen auf die neue Hub-Adresse.
- Live geprüft: PvP gegen Bots (neu „Gegen Bots“), Abenteuer und Turm.

## 0.3.1 Beta – 2026-10-29
**EN**
- English is now the fallback language of the extension (German stays for German browsers).
- Project page and README are English-first; German is still available.

**DE**
- Englisch ist jetzt die Rückfall-Sprache der Erweiterung (Deutsch bleibt für deutsche Browser).
- Projektseite und README sind jetzt zuerst auf Englisch; Deutsch gibt es weiterhin.

## 0.3.0 Beta – 2026-10-28
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

## 0.2.0 Beta – 2026-10-28
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

## 0.1.0 Beta – 2026-10-24
- First published version: overlay with Now/Plan/Items/Team, automatic detection of shop, bench, board and items, marks in the game. · Erste veröffentlichte Version.
