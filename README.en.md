<p align="center"><img src="docs/icon.svg" width="96" alt=""></p>

<h1 align="center">Kanto Coach</h1>

<p align="center"><b>Unofficial overlay for <a href="https://einoow.com/play/kanto-tactics">Kanto Tactics</a> – so you win more often.</b><br>
<a href="README.md">Deutsch</a> · English · <a href="https://hrvatska157-art.github.io/kanto-coach/?lang=en">Website</a></p>

<p align="center">
<a href="https://github.com/hrvatska157-art/kanto-coach/releases/latest/download/kanto-coach-extension.zip"><b>⬇ Download (version 2.2.0)</b></a>
</p>

---

Kanto Coach is a Chrome extension that shows a small overlay next to the game. It reads what is visible in the game – shop, bench, board, item bag, level, gold and round – and tells you every round **what to do now**: which Pokémon to buy, when to save, reroll or buy XP, which plan fits your team and how to place it. Matching Pokémon and items are **circled right in the game**.

<p align="center"><img src="docs/img/overlay-now.png" width="720" alt="Overlay in the Battle Tower: next boss, detected shop and numbered steps"></p>

## Features

- **“What now?”** – numbered steps with reasons: buys that give a star (★★/★★★), core Pokémon of your plan, second copies, completing a trait tier; plus tips on free board slots, saving gold up to the interest cap, rerolling and buying XP.
- **A plan that fits you** – PvP: meta comps ranked by how buildable they are with your Pokémon and gold. Adventure and Battle Tower: comps with proven type synergy, rated with the real win rates in that mode.
- **Send plan to the game** – copies the plan as a team code. In the game, *Planner → “Paste code”*: the game shows the placement as shadows on the board and marks the shop cards itself.
- **Marks in the game** – BUY, ★★!, +TYPE on shop cards and TARGET on item components.
- **Items** – reads your bag, shows what you can build and who should carry which item.
- **Adventure & Tower** – detects stop/floor and difficulty, shows the next boss with its win rate and warns before hard fights (e.g. Sabrina, Giovanni, tower floor 50).
- **Up to date** – anchored forms (⚓), character Pokémon (Koga, Giovanni, Samurai), adventure difficulties and everything up to game version 40.
- **German and English** – follows the game language automatically; detection works in all 16 game languages.

<p align="center">
<img src="docs/img/overlay-plan.png" width="300" alt="Plan tab">
<img src="docs/img/overlay-items.png" width="300" alt="Items tab">
</p>
<p align="center"><img src="docs/img/shop-marks.png" width="720" alt="BUY marks right on the shop cards in the game"></p>

## Install

1. **[Download the ZIP](https://github.com/hrvatska157-art/kanto-coach/releases/latest/download/kanto-coach-extension.zip)** and unzip it (or clone this repository – the `extension/` folder is the extension).
2. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top right).
3. Click **“Load unpacked”** and choose the unzipped `extension` folder.
4. Open Kanto Tactics at <https://einoow.com/play/kanto-tactics> – the overlay appears on the right; drag its title bar to move it. **Alt+K** shows/hides it, **Alt+R** clears the shop after a reroll.

Also works in other Chromium browsers (Edge, Brave, Opera). **Updating:** unzip the new ZIP, replace the old folder and click “Reload” in `chrome://extensions` – your settings are kept.

## Overlay tabs

| Tab | Content |
|---|---|
| **Now** | mode and round/stop/floor, next boss, detected shop and “What now?” |
| **Plan** | your plan with reasons, “Send plan to the game”, “Field now” for your level, placement and alternatives |
| **Items** | your bag, the items your plan wants and what you can build now |
| **Team** | your Pokémon and copies; paste team codes from the game |

## Privacy and fair play

- Only **what is visible in the game** is read (images and labels of shop, bench, board, bag, level, gold, progress bar). No game variables, no network sniffing.
- The extension **clicks, buys and sends nothing** – you make every decision. All marks let clicks through.
- **No accounts, no analytics, no tracking.** Settings and cached data stay in your browser.
- Stats come from einoow.com’s public API (at most hourly, cached), images from the PokéAPI sprites repository.

Details: [PRIVACY.md](PRIVACY.md)

## Permissions

| Permission | Why |
|---|---|
| `storage` | keep settings, cached data and the exchange between game reader and overlay locally |
| `alarms` | refresh data at most once an hour |
| `activeTab`, `scripting` | open the overlay in the active tab from the toolbar icon or shortcut |
| `https://einoow.com/*` | overlay on the game page and data from the public API |
| `https://raw.githubusercontent.com/*` | Pokémon and item images (PokéAPI sprites) |
| optional: your own server address | only if you enter your own Kanto Coach server in the settings |

## Notes

Unofficial, non-commercial fan project. Not affiliated with einoow.com, Kanto Tactics, Nintendo, Game Freak, Creatures or The Pokémon Company. Pokémon and all related names are trademarks of their respective owners.
Data: **Kanto Tactics · einoow.com** (public API). Images: [PokéAPI/sprites](https://github.com/PokeAPI/sprites).

License: [MIT](LICENSE) · Changes: [CHANGELOG.md](CHANGELOG.md)
