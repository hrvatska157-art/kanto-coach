# Privacy · Datenschutz – Kanto Coach

*Last updated / Stand: 2026-11-01 · Version 0.8.4 Beta*

## English

**In short:** Kanto Coach collects no personal data, has no accounts, no analytics and no tracking, and sends nothing about you to third parties.

**What it reads:** The extension is loaded on einoow.com but only becomes active on Kanto Tactics pages (`einoow.com/kanto-tactics`, `/pvp`, `/duo`, `/tower`, `/nuzlocke`). There it only reads content visible in the game: image addresses and labels of the shop cards, bench, Pokémon on the board, item bag, plus level, gold, HP and the progress bar. It does not read game variables, network traffic, input, chat or account/profile data.

**What it stores:** settings (language, optional server address, detection on/off), overlay state (position, chosen plan, team), cached game data and images, the last game state it read, and a **match log** (per round: shop, bench, board, items, gold, level, enemies, the coach’s advice and the fight result – at most 40 games; can be paused or deleted in the overlay’s Team tab). Everything stays local in your browser (`chrome.storage`). Settings may be synced between your devices via Chrome sync if you have enabled it.

**Requests it makes:**
- `https://einoow.com/api/meta/kanto/` – public stats and game rules (at most once an hour, cached).
- `https://raw.githubusercontent.com/PokeAPI/sprites/` – Pokémon and item images.
- `https://einoow.com/playables/kanto-tactics/pk/items/` – the game’s item images.
- Optionally the address of your own Kanto Coach server, if you enter it in the settings.

No data about you is sent with these requests; they are plain downloads of public files. As with any web request, the providers can see technical data such as your IP address.

**Clipboard:** only when you click “Send plan to the game” does the extension write a team code to the clipboard. It never reads the clipboard.

**Deletion:** remove the extension in `chrome://extensions` – this deletes all locally stored data.

## Deutsch

**Kurz:** Kanto Coach sammelt keine personenbezogenen Daten, hat keine Konten, keine Analyse und kein Tracking und schickt nichts über dich an Dritte.

**Was die Erweiterung liest:** Sie wird auf einoow.com geladen, wird aber nur auf den Seiten von Kanto Tactics aktiv (`einoow.com/kanto-tactics`, `/pvp`, `/duo`, `/tower`, `/nuzlocke`). Dort liest sie nur Inhalte, die im Spiel sichtbar sind: Bildadressen und Beschriftungen der Shop-Karten, der Bank, der Pokémon auf dem Brett, des Item-Beutels sowie Level, Gold, KP und die Fortschrittsleiste. Sie liest keine Spielvariablen, keinen Netzwerkverkehr, keine Eingaben, keine Chat-Inhalte und keine Konto- oder Profildaten.

**Was gespeichert wird:** Einstellungen (Sprache, optionale Server-Adresse, Erkennung an/aus), der Zustand des Overlays (Position, gewählter Plan, Team), zwischengespeicherte Spieldaten und Bilder, der zuletzt gelesene Spielstand und ein **Partie-Protokoll** (je Runde: Shop, Bank, Brett, Items, Gold, Level, Gegner, der Rat des Coaches und das Kampfergebnis – höchstens 40 Partien; im Overlay unter „Team“ pausier- und löschbar). Alles liegt nur lokal in deinem Browser (`chrome.storage`). Einstellungen können über die Chrome-Synchronisierung deines Google-Kontos zwischen deinen Geräten abgeglichen werden, wenn du diese aktiviert hast.

**Welche Anfragen sie stellt:**
- `https://einoow.com/api/meta/kanto/` – öffentliche Statistik und Spielregeln (höchstens einmal pro Stunde, zwischengespeichert).
- `https://raw.githubusercontent.com/PokeAPI/sprites/` – Pokémon- und Item-Bilder.
- `https://einoow.com/playables/kanto-tactics/pk/items/` – Item-Bilder des Spiels.
- Optional die Adresse eines eigenen Kanto-Coach-Servers, wenn du sie in den Einstellungen einträgst.

Dabei werden keine Daten über dich mitgeschickt; es sind normale Abrufe öffentlicher Dateien. Die jeweiligen Anbieter können dabei wie bei jedem Seitenaufruf technische Daten (z. B. IP-Adresse) sehen.

**Zwischenablage:** Nur wenn du „Plan ins Spiel übernehmen“ anklickst, schreibt die Erweiterung einen Team-Code in die Zwischenablage. Sie liest die Zwischenablage nie.

**Löschen:** Erweiterung in `chrome://extensions` entfernen – damit werden alle lokal gespeicherten Daten gelöscht.

Contact: <https://github.com/hrvatska157-art/kanto-coach/issues>
