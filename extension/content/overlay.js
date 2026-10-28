/* Kanto Coach – Overlay im Spiel
 * Shop, Level und Gold kommen automatisch vom Leser im Spiel-Frame (content/reader.js), der nur die
 * sichtbaren Beschriftungen liest. Ohne Erkennung trägst du den Shop von Hand ein.
 * Das Overlay berechnet Ziel-Comp, Kaufempfehlung, Markierungen und Vorhersage.
 */
(() => {
'use strict';
if (window.__kkCoachOverlay) return;
window.__kkCoachOverlay = true;

const L = {
de: {
  title: 'Kanto Coach', lvl: 'Lv', gold: 'Gold', tabs: { now: 'Jetzt', plan: 'Plan', items: 'Items', team: 'Team' },
  whatNow: 'Was jetzt?', nothingNow: 'Gerade nichts zu tun. Kämpfen!', doBuy: (n) => `${n} kaufen`, noGold: 'zu wenig Gold', inPlan: 'im Plan',
  wStar: (n) => `macht ein Pokémon ${'★'.repeat(n)} – das stärkt dein Team am meisten`, wCore: 'Kern-Pokémon deines Plans', wPlan: 'gehört zu deinem Plan', wPair: '2. Kopie: auf dem Weg zu ★★',
  wTrait: (ty, n) => `bringt ${ty} auf ${n} (Typ-Bonus aktiv)`,
  tFree: (n) => `${n} ${n === 1 ? 'Platz' : 'Plätze'} auf dem Feld frei – stell Pokémon von der Bank auf`, tNear: (ty, n) => `Noch 1 ${ty} für ${ty} ${n}: halte im Shop danach Ausschau`,
  tLevel: (s, l) => `Spieler mit diesem Plan sind in Stage ${s} meist Level ${l}: EP kaufen`, tSave: (c, m) => `Nichts kaufen, Gold sparen: ab ${c} Gold bekommst du +${m} Zinsen pro Runde`,
  tRoll: (c) => `Du hast über ${c} Gold: neu würfeln, bis du die fehlenden Plan-Pokémon findest (Gold nicht unter ${c} fallen lassen)`,
  roundN: (s, r) => `Runde ${s}-${r}`, fightWin: (n, w) => `Nächster Kampf: ${n} – Spieler gewinnen ${w} %`,
  yourPlan: 'Dein Plan', openPlan: 'Plan ansehen →', noPlanYet: 'Sobald Pokémon im Shop oder auf deiner Bank sind, schlägt der Coach einen Plan vor.',
  whyPvp: (a, p, o) => `Ø Platz ${a} · mit deinen Pokémon zu ${p} baubar · ${o} hast du schon`,
  whyCamp: (m, d, o, n) => `Diese Pokémon sind in „${m}“ überdurchschnittlich (${d} % Siege) · ${o} von ${n} hast du schon · Typen passen zusammen`,
  back: 'Zurück', bestPlans: 'Passt am besten zu dir', allComps: 'Alle Comps', planAuto: 'Vom Coach gewählt', planManual: 'Von dir gewählt',
  stageNorm: (s, l) => `In Stage ${s} sind Spieler mit diesem Plan meist Level ${l}.`, otherPlan: 'Anderen Plan wählen',
  fieldNow: (l) => `Jetzt aufstellen (Level ${l})`, fromPlan: 'aus deinem Plan', filler: 'Platzhalter, bis du Plan-Pokémon hast', fieldNowHint: 'Durchgezogen = aus dem Plan, gestrichelt = Platzhalter mit passenden Typen. Stärkere Sterne zuerst.',
  alsoGood: 'Passen auch gut', isPlan: 'Dein Plan', takePlan: 'Diesen Plan nehmen',
  diag: (a, b) => `Erkannt: ${a}/${b} Shop-Karten`, diagBench: (n) => `Bank ${n}`, diagBoard: (n) => `Brett ${n}`, diagItems: (n) => `Items ${n}`, diagUnknown: (x) => `Nicht zugeordnet: ${x} (unbekanntes Pokémon – evtl. neuer als die API-Daten)`,
  diagNone: 'Im Spiel wurde noch kein Shop gefunden. Ist die Shop-Erkennung in den Einstellungen an?',
  field: 'Platzierung', enemy: 'Gegner', front: 'vorne', back: 'hinten', showField: 'Auf dem Spielfeld zeigen', hideField: 'Vom Spielfeld ausblenden', align: 'Schablone ausrichten',
  fieldHint: 'So stellst du die Ziel-Comp auf. Grün = steht schon richtig, blau = hast du, gelb = im Shop, grau = fehlt.',
  fieldAlignHint: 'Einfacher: „Plan ins Spiel übernehmen“ – dann zeigt das Spiel die Aufstellung selbst als Schatten. Oder einmal ausrichten: Zieh im Spiel die vier roten Punkte auf die Eck-Felder deiner Hälfte. Danach liegt die Platzierung genau auf dem Brett und das Overlay erkennt, wer wo steht.',
  fieldNotAligned: 'Noch nicht ausgerichtet – die Lage ist nur geschätzt.',
  stOk: 'steht richtig', stOwn: 'hast du', stShop: 'im Shop', stMiss: 'fehlt', onBoard: 'auf dem Brett',
  itemsHint: 'Dein Item-Beutel wird automatisch aus dem Spiel gelesen. Hier siehst du, was du daraus bauen kannst und was deine Ziel-Comp braucht.',
  itemsHidden: 'Der Beutel ist im Spiel zugeklappt – öffne ihn einmal, damit die Items gelesen werden.',
  itemsManual: 'Items nicht erkannt? Tippe unten auf eine Komponente, um sie von Hand einzutragen.',
  bag: 'Im Beutel', bagEmpty: 'Der Beutel ist leer.', craftNow: 'Jetzt baubar', craftNone: 'Mit deinen Komponenten lässt sich gerade nichts bauen.',
  forTarget: 'Für deine Ziel-Comp', noTargetItems: 'Wähle eine Ziel-Comp, dann siehst du hier ihre Items.',
  ready: 'fertig im Beutel', craftable: 'baubar', needOne: (x) => `fehlt: ${x}`, needTwo: (a, b) => `fehlt: ${a} + ${b}`,
  addPart: 'Komponente eintragen', partsLeft: 'Übrige Komponenten', bestWith: 'Beste Kombis', markItem: 'ZIEL',
  for: 'für', live2: 'live', newTag: 'NEU', newHint: 'ohne Daten', newTitle: 'Neu im Shop seit Version 35 (bzw. aus der Kampagne). Die API-Statistiken kennen es noch nicht, darum keine Comp-Empfehlung.',
  modeL: 'Modus', modes: { auto: 'Auto', pvp: 'PvP', camp: 'Abenteuer', tower: 'Turm' }, detected: (m) => `erkannt: ${m}`,
  campTitle: 'Kampagnen-Coach', towerTitle: 'Turm-Coach', campSub: 'Ein Team für alle Stationen – passend zu den zuverlässigsten Teams der Spieler an den schweren Kämpfen.',
  anchorHint: (f) => `im Spiel auf der Karte „${f}“ verankern (bleibt in dieser Form)`,
  gamePlan: 'Plan ins Spiel übernehmen', gamePlanOk: 'Code kopiert – im Spiel: Planer → „Code einfügen“',
  gamePlanHint: 'Kopiert den Plan als Team-Code. Im Spiel oben links „Planer“ → „Code einfügen“: Das Spiel zeigt die Aufstellung dann als Schatten auf dem Brett und markiert die Shop-Karten selbst.',
  statsDown: (t) => (t ? `Statistik (meta.json) gerade nicht erreichbar – letzter Stand von ${t}.` : 'Statistik (meta.json) gerade nicht erreichbar – Empfehlungen nur aus Spielregeln, ohne Meta-Comps.'),
  inGamePlan: 'im Spiel-Plan',
  fightNext: (n, at, w, m) => `Nächster Boss: ${n} (${m === 'tower' ? 'Etage' : 'Station'} ${at}) – Spieler gewinnen ${w} %`,
  whySyn: (ty, o, n, camp) => `Ersatz-Plan ohne Meta-Statistik: ${ty} aktiv · ${camp ? 'Pokémon nach ihren Ergebnissen in diesem Modus gewählt' : 'teurere Pokémon bevorzugt'} · ${o} von ${n} hast du schon`,
  hardFight: (n, now, w) => `⚠ ${now ? 'Jetzt' : 'Bald'} schwerer Kampf: ${n} (Spieler gewinnen nur ${w} %) – Team vorher verstärken: Sterne, Level, fertige Items.`,
  dif: 'Schwierigkeit', difs: ['Alle', 'Normal', 'Veteran'], size: 'Teamgröße', campLoading: 'Kampagnen-Daten werden geladen und das Team berechnet …', campErr: 'Kampagnen-Daten nicht verfügbar',
  hardAvg: (a, b) => `Ø Siegchance an schweren Stationen: ${a} (Spieler Ø ${b})`, stationN: (n, t) => (t ? `Station ${n} von ${t}` : `Station ${n}`), floorN: (n) => `Etage ${n}`,
  nowStop: 'Jetzt', nextStops: 'Als Nächstes', players: 'Spieler', yourTeam: 'dein Team', weak: 'schwer für dein Team', fromStop: (n, m) => (m === 'tower' ? `ab Etage ${n}` : `ab Station ${n}`),
  phases: { early: 'Früh', mid: 'Mitte', late: 'Spät', end: 'Endziel' }, phaseAuto: 'Automatisch', stopsR: (a, b) => `Station ${a}–${b}`, floorsR: (a, b) => `Etage ${a}–${b}`,
  campSub2: 'Das Ziel wechselt mit deinem Fortschritt: Für jeden Abschnitt das Team, das an den schweren Kämpfen am besten abschneidet – mit dem, was du schon hast. „Endziel“ ist ein festes Team für alles.',
  phaseHint: 'Für die Kämpfe in diesem Abschnitt, mit deinen Pokémon als Bonus. Kauf diese Pokémon, wenn sie im Shop liegen.', endHint: 'Ein festes Team für die ganze Kampagne bzw. den Turm. Viele dieser Pokémon kommen erst spät.',
  nextFight: 'Nächster Kampf', coreHint: 'Kombis aus 3 Pokémon, mit denen Spieler diesen Kampf am häufigsten gewinnen (untere Grenze der Siegquote).', noCores: 'Für diesen Kampf gibt es zu wenige Daten zu Kombis.',
  thenPhase: (p) => `Danach (${p}) kommen dazu`, markBuy: 'KAUFEN',
  whyTeam: (p) => `gehört zu deinem Team für „${p}“`, whyNext: (p) => `wichtig für den nächsten Abschnitt („${p}“)`,
  whyCore2: (o, w, s, b) => `mit deinem ${o}: ${w} % Siege bei ${s} (Spieler ${b} %)`, whyCore1: (o, w, s) => `Kombi mit ${o}: ${w} % Siege bei ${s}`,
  whyStrong: (d) => `stark in der Kampagne (+${d} %)`, whyWeak: (d) => `eher schwach in der Kampagne (${d} %)`,
  campOnly: 'nur Kampagne', campShopCard: 'Dein Kampagnen-Ziel', campPredict: 'In der Kampagne und im Turm zählt dein festes Team (Reiter „Ziel“). Die Chancen hier beziehen sich auf PvP-Meta-Comps.',
  openCamp: 'Team ansehen →', stopUnknown: 'Station wird erkannt, sobald die Fortschrittsleiste im Spiel sichtbar ist.',
  recTitle: 'Beste Chance gerade', isTarget: '✓ Ist dein Ziel', setTargetBig: 'Als Ziel setzen', targetSet: (n) => `Plan: ${n}`, more: 'Weitere Chancen',

  langTitle: 'Sprache: Deutsch (klicken für Englisch)', loading: 'Lade Daten …', loadErr: 'Daten nicht verfügbar', retry: 'Erneut versuchen',
  shopHint: 'Kein Shop erkannt. Tippe einen Platz an und wähle das Pokémon, das im Spiel-Shop liegt. Nach dem Neu-Würfeln: Alt+R oder „Shop leeren“.',
  liveHint: 'Shop, Level und Gold werden automatisch aus dem Spiel übernommen. Passende Pokémon sind im Spiel eingekreist, Käufe werden mitgezählt.',
  live: 'LIVE', manual: 'manuell', newGame2: 'Neues Spiel erkannt: Team geleert', markTarget: 'ZIEL', markUpgrade: (n) => `${'★'.repeat(n)}!`, markComp: 'COMP',
  clearShop: 'Shop leeren', bought: 'Gekauft', change: 'Ändern', clear: 'Leeren', empty: 'leer',
  target: 'ZIEL', fits: (n) => `${n} Comp${n === 1 ? '' : 's'}`, buy: 'Kaufempfehlung', nothing: 'Nichts Wichtiges im Shop.',
  reasonTarget: 'für deine Ziel-Comp', reasonUpgrade: (n) => `${n}. Kopie → ★★`, reasonOwn: (n) => `du hast ${n}`, reasonComps: (n) => `passt in ${n} der Top-Comps`,
  search: 'Pokémon suchen …', pickTitle: 'Was liegt im Shop?', pickOwn: 'Pokémon hinzufügen', showAll: 'alle Kosten', onlyLevel: 'nur dein Level',
  noTarget: 'Noch keine Ziel-Comp gewählt. Wähle eine aus der Liste oder aus der Vorhersage.', chooseTarget: 'Ziel-Comp wählen', compSearch: 'Comp oder Pokémon suchen …',
  removeTarget: 'Ziel entfernen', changeTarget: 'Ändern', openSite: 'Großansicht', units: 'Einheiten', have: 'hast', inShop: 'im Shop', perShop: '/Shop', goldEst: (g) => `≈ ${g} Gold`,
  notYet: (l) => `ab Lv ${l}`, progress: (a, b) => `${a}/${b} Einheiten`, items: 'Items',
  predictHint: 'Welche Meta-Comps du mit deiner Bank, dem Shop und deinem Gold am wahrscheinlichsten bis zum Endspiel fertig bekommst (gerechnet mit Level 7–8 und den Shops der nächsten Runden).',
  buildable: 'Chance', setTarget: 'Als Ziel', missing: 'fehlt', avg: 'Ø', noPred: 'Trag zuerst Pokémon in Team oder Shop ein.',
  teamHint: 'Pokémon, die du besitzt (Brett und Bank). In der Planungsphase liest der Coach dein Team direkt aus dem Spiel, auch nach Tausch-Segen oder Verkauf. Kopien zählen für die Sterne: 3 = ★★, 9 = ★★★.',
  addUnit: '+ Pokémon', codePh: 'Team-Code aus dem Spiel (KT1;…)', loadCode: 'Code laden', codeBad: 'Kein gültiger Team-Code', codeOk: (n) => `${n} Pokémon geladen`,
  newGame: 'Neues Spiel', newGameHint: 'Leert Team und Shop (Ziel bleibt).', noUnits: 'Noch keine Pokémon eingetragen.',
  data: (d, s) => `Daten ${d} · ${s}`, credit: 'Daten: Kanto Tactics · einoow.com', minimize: 'Minimieren', close: 'Schließen (Alt+K)',
},
en: {
  title: 'Kanto Coach', lvl: 'Lv', gold: 'Gold', tabs: { now: 'Now', plan: 'Plan', items: 'Items', team: 'Team' },
  whatNow: 'What now?', nothingNow: 'Nothing to do right now. Fight!', doBuy: (n) => `Buy ${n}`, noGold: 'not enough gold', inPlan: 'in plan',
  wStar: (n) => `makes a Pokémon ${'★'.repeat(n)} – the biggest boost for your team`, wCore: 'core Pokémon of your plan', wPlan: 'part of your plan', wPair: '2nd copy: on the way to ★★',
  wTrait: (ty, n) => `brings ${ty} to ${n} (type bonus active)`,
  tFree: (n) => `${n} free ${n === 1 ? 'slot' : 'slots'} on the board – field Pokémon from the bench`, tNear: (ty, n) => `1 more ${ty} for ${ty} ${n}: look out for one in the shop`,
  tLevel: (s, l) => `Players with this plan are usually level ${l} in stage ${s}: buy XP`, tSave: (c, m) => `Buy nothing, save gold: from ${c} gold you get +${m} interest per round`,
  tRoll: (c) => `You have more than ${c} gold: reroll until you find the missing plan Pokémon (do not drop below ${c})`,
  roundN: (s, r) => `round ${s}-${r}`, fightWin: (n, w) => `Next fight: ${n} – players win ${w}%`,
  yourPlan: 'Your plan', openPlan: 'View plan →', noPlanYet: 'As soon as Pokémon are in the shop or on your bench, the coach suggests a plan.',
  whyPvp: (a, p, o) => `avg place ${a} · ${p} buildable with your Pokémon · you own ${o}`,
  whyCamp: (m, d, o, n) => `These Pokémon do better than average in “${m}” (${d}% wins) · you own ${o} of ${n} · types fit together`,
  back: 'Back', bestPlans: 'Best fit for you', allComps: 'All comps', planAuto: 'Picked by the coach', planManual: 'Picked by you',
  stageNorm: (s, l) => `In stage ${s} players with this plan are usually level ${l}.`, otherPlan: 'Choose another plan',
  fieldNow: (l) => `Field now (level ${l})`, fromPlan: 'from your plan', filler: 'placeholder until you have plan Pokémon', fieldNowHint: 'Solid = from the plan, dashed = placeholder with matching types. Higher stars first.',
  alsoGood: 'Also a good fit', isPlan: 'Your plan', takePlan: 'Take this plan',
  diag: (a, b) => `Detected: ${a}/${b} shop cards`, diagBench: (n) => `bench ${n}`, diagBoard: (n) => `board ${n}`, diagItems: (n) => `items ${n}`, diagUnknown: (x) => `Not matched: ${x} (unknown Pokémon – maybe newer than the API data)`,
  diagNone: 'No shop found in the game yet. Is shop detection switched on in the settings?',
  field: 'Placement', enemy: 'Enemy', front: 'front', back: 'back', showField: 'Show on the board', hideField: 'Hide from the board', align: 'Align template',
  fieldHint: 'How to place the target comp. Green = already placed correctly, blue = you own it, yellow = in the shop, grey = missing.',
  fieldAlignHint: 'Easier: “Send plan to the game” – the game then shows the placement itself as shadows. Or align once: in the game, drag the four red dots onto the corner hexes of your half. The placement then sits exactly on the board and the overlay sees who stands where.',
  fieldNotAligned: 'Not aligned yet – the position is only estimated.',
  stOk: 'placed', stOwn: 'owned', stShop: 'in shop', stMiss: 'missing', onBoard: 'on the board',
  itemsHint: 'Your item bag is read from the game automatically. Here you see what you can build from it and what your target comp needs.',
  itemsHidden: 'The bag is collapsed in the game – open it once so the items can be read.',
  itemsManual: 'Items not detected? Tap a component below to add it by hand.',
  bag: 'In your bag', bagEmpty: 'Your bag is empty.', craftNow: 'Buildable now', craftNone: 'Nothing can be built from your components right now.',
  forTarget: 'For your target comp', noTargetItems: 'Pick a target comp to see its items here.',
  ready: 'ready in bag', craftable: 'buildable', needOne: (x) => `missing: ${x}`, needTwo: (a, b) => `missing: ${a} + ${b}`,
  addPart: 'Add component', partsLeft: 'Spare components', bestWith: 'Best combos', markItem: 'TARGET',
  for: 'for', live2: 'live', newTag: 'NEW', newHint: 'no data', newTitle: 'New in the shop since version 35 (or from the campaign). The API stats do not know it yet, so there is no comp suggestion.',
  modeL: 'Mode', modes: { auto: 'Auto', pvp: 'PvP', camp: 'Adventure', tower: 'Tower' }, detected: (m) => `detected: ${m}`,
  campTitle: 'Campaign coach', towerTitle: 'Tower coach', campSub: 'One team for every stop – matched to the players’ most reliable teams at the hard fights.',
  anchorHint: (f) => `anchor it as “${f}” on its card in the game (it keeps this form)`,
  gamePlan: 'Send plan to the game', gamePlanOk: 'Code copied – in the game: Planner → “Paste code”',
  gamePlanHint: 'Copies the plan as a team code. In the game, top left “Planner” → “Paste code”: the game then shows the placement as shadows on the board and marks the shop cards itself.',
  statsDown: (t) => (t ? `Stats (meta.json) unreachable right now – using the last copy from ${t}.` : 'Stats (meta.json) unreachable right now – advice from the game rules only, no meta comps.'),
  inGamePlan: 'in game plan',
  fightNext: (n, at, w, m) => `Next boss: ${n} (${m === 'tower' ? 'floor' : 'stop'} ${at}) – players win ${w}%`,
  whySyn: (ty, o, n, camp) => `Fallback plan without meta stats: ${ty} active · ${camp ? 'Pokémon picked by their results in this mode' : 'pricier Pokémon preferred'} · you own ${o} of ${n}`,
  hardFight: (n, now, w) => `⚠ Hard fight ${now ? 'now' : 'soon'}: ${n} (players win only ${w}%) – strengthen your team first: stars, level, finished items.`,
  dif: 'Difficulty', difs: ['All', 'Normal', 'Veteran'], size: 'Team size', campLoading: 'Loading campaign data and computing the team …', campErr: 'Campaign data not available',
  hardAvg: (a, b) => `Avg win chance at hard stops: ${a} (players avg ${b})`, stationN: (n, t) => (t ? `Stop ${n} of ${t}` : `Stop ${n}`), floorN: (n) => `Floor ${n}`,
  nowStop: 'Now', nextStops: 'Next', players: 'players', yourTeam: 'your team', weak: 'hard for your team', fromStop: (n, m) => (m === 'tower' ? `from floor ${n}` : `from stop ${n}`),
  phases: { early: 'Early', mid: 'Mid', late: 'Late', end: 'End goal' }, phaseAuto: 'Automatic', stopsR: (a, b) => `stops ${a}–${b}`, floorsR: (a, b) => `floors ${a}–${b}`,
  campSub2: 'The target follows your progress: for each stage the team that does best at the hard fights – using what you already own. “End goal” is one fixed team for everything.',
  phaseHint: 'For the fights in this stage, with your Pokémon as a bonus. Buy these Pokémon when they show up in the shop.', endHint: 'One fixed team for the whole campaign or tower. Many of these Pokémon only arrive late.',
  nextFight: 'Next fight', coreHint: 'Combos of 3 Pokémon that players most often win this fight with (lower bound of the win rate).', noCores: 'Too little combo data for this fight.',
  thenPhase: (p) => `Then (${p}) add`, markBuy: 'BUY',
  whyTeam: (p) => `part of your team for “${p}”`, whyNext: (p) => `important for the next stage (“${p}”)`,
  whyCore2: (o, w, s, b) => `with your ${o}: ${w}% wins at ${s} (players ${b}%)`, whyCore1: (o, w, s) => `combo with ${o}: ${w}% wins at ${s}`,
  whyStrong: (d) => `strong in the campaign (+${d}%)`, whyWeak: (d) => `rather weak in the campaign (${d}%)`,
  campOnly: 'campaign only', campShopCard: 'Your campaign target', campPredict: 'In the campaign and the tower your fixed team counts (tab “Target”). The odds here refer to PvP meta comps.',
  openCamp: 'View team →', stopUnknown: 'The stop is detected as soon as the progress bar is visible in the game.',
  recTitle: 'Best chance right now', isTarget: '✓ Your target', setTargetBig: 'Set as target', targetSet: (n) => `Plan: ${n}`, more: 'More options',

  langTitle: 'Language: English (click for German)', loading: 'Loading data …', loadErr: 'Data not available', retry: 'Try again',
  shopHint: 'No shop detected. Tap a slot and pick the Pokémon shown in the game shop. After a reroll: Alt+R or “Clear shop”.',
  liveHint: 'Shop, level and gold are taken from the game automatically. Matching Pokémon are circled in the game, purchases are counted.',
  live: 'LIVE', manual: 'manual', newGame2: 'New game detected: team cleared', markTarget: 'TARGET', markUpgrade: (n) => `${'★'.repeat(n)}!`, markComp: 'COMP',
  clearShop: 'Clear shop', bought: 'Bought', change: 'Change', clear: 'Clear', empty: 'empty',
  target: 'TARGET', fits: (n) => `${n} comp${n === 1 ? '' : 's'}`, buy: 'Buy suggestions', nothing: 'Nothing important in the shop.',
  reasonTarget: 'for your target comp', reasonUpgrade: (n) => `copy ${n} → ★★`, reasonOwn: (n) => `you own ${n}`, reasonComps: (n) => `fits ${n} of the top comps`,
  search: 'Search Pokémon …', pickTitle: 'What is in the shop?', pickOwn: 'Add Pokémon', showAll: 'all costs', onlyLevel: 'your level only',
  noTarget: 'No target comp yet. Pick one from the list or from the prediction.', chooseTarget: 'Choose target comp', compSearch: 'Search comp or Pokémon …',
  removeTarget: 'Remove target', changeTarget: 'Change', openSite: 'Full view', units: 'Units', have: 'own', inShop: 'in shop', perShop: '/shop', goldEst: (g) => `≈ ${g} gold`,
  notYet: (l) => `from Lv ${l}`, progress: (a, b) => `${a}/${b} units`, items: 'Items',
  predictHint: 'Which meta comps you are most likely to finish by the late game with your bench, the shop and your gold (calculated at level 7–8 with the shops of the next rounds).',
  buildable: 'Buildable', setTarget: 'Set target', missing: 'missing', avg: 'Avg', noPred: 'Add Pokémon to your team or the shop first.',
  teamHint: 'Pokémon you own (board and bench). During planning the coach reads your team straight from the game, even after swap boons or selling. Copies count towards stars: 3 = ★★, 9 = ★★★.',
  addUnit: '+ Pokémon', codePh: 'Team code from the game (KT1;…)', loadCode: 'Load code', codeBad: 'Not a valid team code', codeOk: (n) => `${n} Pokémon loaded`,
  newGame: 'New game', newGameHint: 'Clears team and shop (target stays).', noUnits: 'No Pokémon added yet.',
  data: (d, s) => `Data ${d} · ${s}`, credit: 'Data: Kanto Tactics · einoow.com', minimize: 'Minimize', close: 'Close (Alt+K)',
}};

const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.kk{position:fixed;z-index:2147483646;width:372px;max-width:calc(100vw - 16px);max-height:min(82vh,760px);display:flex;flex-direction:column;background:rgba(17,20,29,.97);color:#edf0f6;border:1px solid #333d52;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.55);font:13.5px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:hidden}
.kk.min{max-height:none;width:auto}
.kk.min .bd,.kk.min .tabs,.kk.min .ft,.kk.min .ctl{display:none}
button,input,select{font:inherit;color:inherit}
.hd{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#1b2030;border-bottom:1px solid #2c3446;cursor:move;user-select:none}
.logo{width:18px;height:18px;flex:none}
.ttl{font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:13px;white-space:nowrap}.ttl b{color:#ff5c4e}
.live{margin:0 0 6px auto;align-self:center;font:800 10px/1 system-ui;color:#4fcb88;letter-spacing:.08em;border:1px solid #2f6b4a;border-radius:6px;padding:3px 6px;white-space:nowrap}.live.off{color:#7f889d;border-color:#3e485e;font-weight:700;letter-spacing:0}
.ctl{display:flex;gap:6px;align-items:center;margin-left:auto}
.ctl label{display:flex;align-items:center;gap:4px;font-size:11px;color:#a3abbe;font-weight:700;text-transform:uppercase}
.ctl select,.ctl input{background:#11141d;border:1px solid #3e485e;border-radius:7px;padding:3px 5px;width:48px}
.ctl input{width:46px}
.ib{border:0;background:transparent;color:#a3abbe;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px;border-radius:6px}
.ib:hover{color:#fff;background:#2c3446}
.kk.min .ib.mn{margin-left:auto}
.ib.lng{font:800 11px/1 system-ui;border:1px solid #3e485e;padding:4px 5px;letter-spacing:.04em}
.tabs{display:flex;gap:2px;padding:6px 8px 0;background:#1b2030;border-bottom:1px solid #2c3446}
.tabs button{border:0;background:transparent;padding:6px 8px 8px;cursor:pointer;font-weight:700;color:#a3abbe;border-bottom:2px solid transparent;font-size:13px}
.tabs button[aria-selected=true]{color:#fff;border-color:#ff5c4e}
.bd{overflow:auto;padding:10px;display:flex;flex-direction:column;gap:10px}
.hint{color:#a3abbe;font-size:12px}
.slots{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.slot{position:relative;border:1px solid #333d52;background:#1c2130;border-radius:10px;padding:5px 2px 4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;min-height:84px;min-width:0}
.slot:hover{border-color:#6b7690}
.slot.sel{border-color:#ff5c4e;box-shadow:0 0 0 1px #ff5c4e}
.slot.need{border-color:#f2bf45;background:#2a2615;box-shadow:0 0 0 1px #f2bf45 inset}
.slot.emp{border-style:dashed;color:#7f889d;justify-content:center;font-size:20px}
.slot .nm{font-weight:700;font-size:11px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.slot .tag{position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:#f2bf45;color:#1d1700;font-size:9px;font-weight:800;border-radius:5px;padding:0 5px;letter-spacing:.05em}
.slot .tag.nw{background:#8ab4ff;color:#0b1530;font-size:8.5px;letter-spacing:.02em}
.slot.new{border-color:#3e4f78}
.slot .own{position:absolute;top:3px;right:4px;font-size:10px;font-weight:700;color:#4fcb88}
.slot .fit{font-size:9.5px;color:#a3abbe}
.av{position:relative;width:40px;height:40px;border-radius:50%;background:color-mix(in srgb,var(--cc) 18%,#1c2130);box-shadow:inset 0 0 0 2px var(--cc);flex:none;display:inline-block}
.av img{position:absolute;left:-32%;top:-38%;width:164%;height:164%;image-rendering:pixelated;pointer-events:none}
.av i{position:absolute;right:-4px;bottom:-4px;min-width:15px;height:15px;border-radius:8px;background:var(--cc);color:#fff;font:600 9.5px/15px ui-monospace,monospace;text-align:center;padding:0 3px;font-style:normal;box-shadow:0 0 0 2px #1c2130}
.av.sm{width:26px;height:26px}.av.sm i{display:none}
.av.xs{width:22px;height:22px}.av.xs i{display:none}
.av.miss{opacity:.4;filter:grayscale(1)}.av.shop{box-shadow:inset 0 0 0 2px #f2bf45}
.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.btn{border:1px solid #3e485e;background:#1c2130;border-radius:8px;padding:5px 10px;cursor:pointer;font-weight:700;font-size:12.5px}
.btn:hover{border-color:#a3abbe}.btn.pri{background:#ff5c4e;border-color:#ff5c4e;color:#1a0806}.btn.sm{padding:3px 8px;font-size:12px}
.card{background:#1c2130;border:1px solid #2c3446;border-radius:11px;padding:9px 10px;display:flex;flex-direction:column;gap:6px}
.card h4{margin:0;font-size:13.5px;display:flex;gap:6px;align-items:center;min-width:0}
.card h4 span.t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tier{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:5px;font-weight:800;font-size:13px;flex:none;color:#fff}
.tier.S{background:#e3a623;color:#17130a}.tier.A{background:#8b5fd6}.tier.B{background:#3478d0}.tier.C{background:#8a93a7}
.bar{height:6px;border-radius:3px;background:#2c3446;overflow:hidden;flex:1 1 auto}.bar i{display:block;height:100%;background:#4fcb88;border-radius:3px}
.pct{font:600 14px ui-monospace,monospace;white-space:nowrap}
.sub{font-size:11.5px;color:#a3abbe}
.recc{border-color:#4a3a2a;box-shadow:0 0 0 1px rgba(242,191,69,.25) inset}
.rec{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:9px;background:#1c2130}
.rec b{font-size:13px}.rec .sub{display:block}
.list{display:flex;flex-direction:column;gap:5px}
.u{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:5px 7px;border-radius:9px;background:#1c2130}
.u .n{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.u .r{text-align:right;font:600 12px ui-monospace,monospace;white-space:nowrap}
.u.ok{box-shadow:inset 3px 0 0 #4fcb88}.u.shop{box-shadow:inset 3px 0 0 #f2bf45}
.stars{color:#f2bf45;letter-spacing:-1px;font-size:11px}
.good{color:#4fcb88}.warn{color:#f0b54a}.bad{color:#ff7a6e}
.ii{width:18px;height:18px;image-rendering:pixelated;vertical-align:middle}
input[type=search],input[type=text]{width:100%;background:#11141d;border:1px solid #3e485e;border-radius:8px;padding:6px 9px}
.pick{position:absolute;inset:0;background:rgba(17,20,29,.98);display:flex;flex-direction:column;gap:8px;padding:10px;z-index:2}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:4px;overflow:auto}
.pc{border:1px solid #333d52;background:#1c2130;border-radius:9px;padding:4px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;min-width:0}
.pc:hover,.pc.first{border-color:#ff5c4e}
.pc span{font-size:10.5px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ft{padding:6px 10px;border-top:1px solid #2c3446;font-size:10.5px;color:#7f889d;display:flex;justify-content:space-between;gap:8px;background:#151925}
.wrap{position:relative;display:flex;flex-direction:column;min-height:0;flex:1 1 auto}
.cnt{display:inline-flex;align-items:center;gap:3px}
.cnt button{width:22px;height:22px;border-radius:6px;border:1px solid #3e485e;background:#11141d;cursor:pointer;line-height:1;padding:0}
.hb{position:relative;width:100%;aspect-ratio:2/1;margin:2px 0 4px}
.hx{position:absolute;width:13.333%;height:30.77%;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:#262c3c;display:grid;place-items:center}
.hx::before{content:"";position:absolute;inset:2px;clip-path:inherit;background:#1a1f2c}
.hx.u::before{background:color-mix(in srgb,var(--st) 22%,#1a1f2c)}.hx.u{background:var(--st)}
.hx .av{position:absolute;left:18%;top:14%;width:64%;height:auto;aspect-ratio:1;box-shadow:none;background:transparent;border-radius:0}
.hx .av i{display:none}
.hx .s{position:absolute;bottom:13%;left:50%;transform:translateX(-50%);font-size:8.5px;color:#f2bf45;letter-spacing:-1px;line-height:1}
.hx.ok .av{opacity:.55}
.hblab{display:flex;justify-content:space-between;font-size:10.5px;color:#7f889d;text-transform:uppercase;letter-spacing:.06em}
.lg{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:#a3abbe}.lg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px;vertical-align:-1px;background:var(--st)}
.diag{font-size:11px;color:#7f889d}.diag.bad{color:#ff7a6e}
.inv{display:flex;flex-wrap:wrap;gap:5px}
.it{position:relative;display:inline-flex;align-items:center;gap:5px;border:1px solid #333d52;background:#1c2130;border-radius:8px;padding:3px 7px 3px 4px;font-size:12px;font-weight:700;cursor:pointer}
.it .ii{width:22px;height:22px}.ii.lg{width:28px;height:28px}.it b{font:600 11px ui-monospace,monospace;color:#a3abbe}
.it.part{border-color:#4a5570}.it.want{border-color:#f2bf45;box-shadow:0 0 0 1px #f2bf45 inset}
.cr{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:5px 7px;border-radius:9px;background:#1c2130}
.cr .rcp{display:flex;align-items:center;gap:2px;font-size:11px;color:#7f889d}
.cr .n{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cr.want{box-shadow:inset 3px 0 0 #f2bf45}.cr.ok{box-shadow:inset 3px 0 0 #4fcb88}
.chip{border:1px solid #3e485e;background:#11141d;border-radius:999px;padding:2px 9px;font-size:11.5px;font-weight:700;cursor:pointer;color:#a3abbe}
.status{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline;font-size:12.5px}.status .sub{flex-basis:100%}
.step{display:grid;grid-template-columns:20px auto minmax(0,1fr);gap:8px;align-items:center;padding:6px 8px;border-radius:9px;background:#1c2130}
.step .sn{width:20px;height:20px;border-radius:50%;background:#ff5c4e;color:#1a0806;font:800 11px/20px system-ui;text-align:center}
.step.tip .sn{background:#3e485e;color:#edf0f6}.step .ti{font-size:16px;width:26px;text-align:center}
.step b{font-size:13px}.step .sub{display:block}.step.dim{opacity:.55}
.slot.k-star{border-color:#4fcb88;background:#16281f;box-shadow:0 0 0 1px #4fcb88 inset}.slot.k-trait{border-color:#8ab4ff;background:#172034;box-shadow:0 0 0 1px #8ab4ff inset}
.slot .tag.t-star{background:#4fcb88;color:#0b1f14}.slot .tag.t-trait{background:#8ab4ff;color:#0b1530;font-size:8px}
.sub.up{text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.fn{display:inline-flex;align-items:center;gap:4px;background:#11141d;border:1px solid #2f6b4a;border-radius:8px;padding:2px 7px 2px 3px;font-size:11.5px;font-weight:700}
.fn.fill{border-color:#3e485e;border-style:dashed;color:#a3abbe}
.ty{background:#262c3c;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:700}
.card.pickc{cursor:pointer;text-align:left}
.sec{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#a3abbe;font-weight:700}
.chip.past{opacity:.4;cursor:default}
.core{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;padding:4px 0;border-top:1px solid #2c3446}.core .cn{font-weight:700;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rec.buy{box-shadow:inset 3px 0 0 #f2bf45;background:#262413}.buytag{background:#f2bf45;color:#1d1700;font:800 9.5px/1 system-ui;border-radius:5px;padding:2px 5px;letter-spacing:.05em;vertical-align:2px}
.chip.on{background:#ff5c4e;border-color:#ff5c4e;color:#1a0806}
.modes{gap:5px}
.stp{display:flex;flex-direction:column;padding:4px 0;border-top:1px solid #2c3446}.stp .n{font-weight:700;font-size:12.5px}.stp b{font-family:ui-monospace,monospace}
.sec{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#a3abbe;font-weight:700;margin-top:2px}
.toast{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);background:#edf0f6;color:#11141d;border-radius:8px;padding:5px 10px;font-weight:700;font-size:12px;z-index:5;white-space:nowrap}
`;

/* ---------- Zustand ---------- */
const DEF = { open: true, min: false, x: null, y: 90, tab: 'now', level: 4, gold: 10, shop: [null, null, null, null, null], owned: {}, target: null, allCosts: false, items: {}, fieldShow: false, modeSel: 'auto', campDif: 0, campSize: 8 };
let S = { ...DEF };
let K = null, D = null, lang = 'de', langSel = 'auto', server = '', loadError = '', pick = null, sel = null, compQ = '', toastT = null, liveTs = 0, lastMarks = '', lastField = '';
let calibrated = false;
let CAMP = { key: '', mode: null, loading: false, err: '', planKey: '', plan: null, endKey: '', end: null };
const campData = {};
const extraCost = {}; // Kosten von Pokémon, die in den API-Daten fehlen (aus der Shop-Karte)
let live = null; // letzter Stand vom Leser: bench, board, items, diag …
const spr = {};
const t = () => L[lang];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const pct = (x, d = 0) => (x * 100).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { maximumFractionDigits: d, minimumFractionDigits: d }) + ' %';
const num = (x, d = 2) => Number(x).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { maximumFractionDigits: d, minimumFractionDigits: d });
const persist = () => { try { chrome.storage.local.set({ ov: S }); } catch (e) {} };
const COST = { 0: '#7a8296', 1: '#7d8699', 2: '#2f9a5d', 3: '#2f74cc', 4: '#9a52da', 5: '#d99a17' };
const starsOf = (copies) => (copies >= 9 ? 3 : copies >= 3 ? 2 : 1);

/* ---------- Grundgerüst ---------- */
const host = document.createElement('div');
host.id = 'kk-coach-overlay';
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>${CSS}</style><div class="kk" id="kk" role="dialog" aria-label="Kanto Coach"></div>`;
(document.body || document.documentElement).appendChild(host);
const box = root.getElementById('kk');
// Tastatur und Mausrad nicht ans Spiel durchreichen, solange man im Overlay arbeitet
['keydown', 'keyup', 'keypress', 'wheel'].forEach((ev) => box.addEventListener(ev, (e) => e.stopPropagation()));

function av(line, star, cls = '') {
  if (!K) return '';
  const c = K.lineCost(line) || extraCost[line] || 0; const dex = K.dexOf(line, star || 9);
  return `<span class="av ${cls}" style="--cc:${COST[c] || COST[0]}" title="${esc(K.lineFullName(line))}">${dex ? `<img data-spr="pokemon:${dex}" alt="">` : ''}<i>${c || '–'}</i></span>`;
}
function itemImg(id, cls = 'ii') { return K ? `<img class="${cls}" data-spr="gameitem:${esc(id)}" data-alt="items:${esc(K.itemArt(id))}" alt="" title="${esc(K.itemName(id))}">` : ''; }
async function hydrate() {
  const imgs = [...root.querySelectorAll('img[data-spr]')]; const want = [];
  const keyOf = (im) => (spr[im.dataset.spr] === '' && im.dataset.alt ? im.dataset.alt : im.dataset.spr);
  for (const im of imgs) { for (const k of [im.dataset.spr, im.dataset.alt]) { if (!k) continue; if (spr[k] == null && !want.includes(k)) want.push(k); if (spr[k] !== '' ) break; } }
  if (want.length) {
    try {
      const r = await chrome.runtime.sendMessage({ type: 'sprites', list: want.map((k) => { const [kind, name] = k.split(':'); return { kind, name }; }) });
      if (r && r.ok) Object.assign(spr, r.sprites);
    } catch (e) { want.forEach((k) => { spr[k] = ''; }); }
    // Rückfall-Bilder nachladen, falls das Spielbild fehlt
    const alt = [...root.querySelectorAll('img[data-alt]')].filter((im) => spr[im.dataset.spr] === '' && spr[im.dataset.alt] == null).map((im) => im.dataset.alt);
    if (alt.length) { try { const r = await chrome.runtime.sendMessage({ type: 'sprites', list: [...new Set(alt)].map((k) => { const [kind, name] = k.split(':'); return { kind, name }; }) }); if (r && r.ok) Object.assign(spr, r.sprites); } catch (e) {} }
  }
  for (const im of root.querySelectorAll('img[data-spr]')) { const v = spr[keyOf(im)] || spr[im.dataset.spr]; if (v) im.src = v; }
}
function toast(msg) {
  let el = root.querySelector('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; box.appendChild(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 1800);
}
function place() {
  const w = Math.min(372, window.innerWidth - 16);
  const x = S.x == null ? window.innerWidth - w - 16 : Math.max(0, Math.min(window.innerWidth - 60, S.x));
  const y = Math.max(0, Math.min(window.innerHeight - 40, S.y));
  box.style.left = x + 'px'; box.style.top = y + 'px';
}

/* ---------- Berechnungen ---------- */
// Sprache: fest Deutsch/Englisch oder „auto“ = wie das Spiel (Rückfall: Browser-Sprache)
function resolveLang() {
  if (langSel === 'de' || langSel === 'en') return langSel;
  const g = (live && live.lang) || navigator.language || 'de';
  return /^de\b/i.test(g) ? 'de' : 'en';
}
function syncLang() { const l = resolveLang(); if (l !== lang) { lang = l; if (K) K.setLang(lang); render(); } }
function detectedMode() {
  const g = live && isLive() && live.game; if (g && g.mode) return g.mode;
  return null;
}
function gm() { return S.modeSel && S.modeSel !== 'auto' ? S.modeSel : (detectedMode() || 'pvp'); }
// Die Kampagnen-Statistik (campana.json „camp“) gehört zum Kanto-Abenteuer (Fortschrittsleiste „ph-gyms“, 38 Stationen).
// In anderen Abenteuern passen die Stationsnummern nicht dazu.
function curStop() { const g = live && isLive() && live.game; return g && g.mode === gm() && !(g.mode === 'camp' && g.adv && g.adv !== 'gyms') ? g : null; }
function campMode() { return gm() !== 'pvp'; }
// Der Turm hat keine Schwierigkeitsstufen (campana ?dif=2 enthält keine Turm-Daten)
function campDif() { return gm() === 'tower' ? 0 : (S.campDif || 0); }
function campDataKey() { return gm() + '|' + campDif(); }
async function ensureCamp() {
  if (!campMode() || !K) return;
  const key = campDataKey(); if (CAMP.key === key && (CAMP.mode || CAMP.loading || CAMP.err)) return;
  CAMP = { key, mode: null, loading: true, err: '', planKey: '', plan: null, endKey: '', end: null };
  try {
    const dif = campDif();
    if (!campData[dif]) { const r = await chrome.runtime.sendMessage({ type: 'getCamp', dif }); if (!r || !r.ok) throw new Error((r && r.error) || '—'); campData[dif] = r.camp; }
    const mode = campData[dif].modes[gm() === 'tower' ? 'torre' : 'camp'];
    if (!mode || mode.empty) throw new Error('—');
    if (CAMP.key === key) CAMP = { ...CAMP, mode, loading: false };
  } catch (e) { if (CAMP.key === key) CAMP = { ...CAMP, loading: false, err: String(e.message || e) }; }
  render();
}
function ownedCanon() { const o = {}; for (const [l, n] of Object.entries(S.owned)) if (n > 0) o[l] = n; return o; }
// Plan-Pokémon können verankerte Formen sein („weedle-a1“); gekauft und gezählt wird immer die Linie
function ownOf(line) { return (K ? S.owned[K.base(line)] : S.owned[line]) || 0; }
function inShop(line) { return S.shop.includes(K ? K.base(line) : line); }
function predictions() {
  if (!K || gm() !== 'pvp') return [];
  return K.predict({ owned: S.owned, shop: S.shop, level: S.level, gold: S.gold, tiers: ['S', 'A', 'B'], minN: 30, limit: 6 });
}
/* ---------- Plan: eine Team-Comp, an der du dich orientierst ---------- */
const PL = { key: '', list: [] };
// Kandidaten passend zum Modus: PvP = Vorhersage (wie gut baubar), Kampagne/Turm = PvP-Comps bewertet mit den Modus-Daten
function planList() {
  if (!K) return [];
  // Ohne Statistik (meta.json fehlt): Pläne mit Typ-Synergie aus den Spielregeln, im Abenteuer/Turm bewertet mit campana
  if (!K.statsOk) {
    const camp = campMode(); if (camp && (!CAMP.mode || CAMP.key !== campDataKey())) return [];
    const owned = ownedCanon(); const key = ['syn', gm(), CAMP.key, JSON.stringify(owned)].join('|');
    if (PL.key !== key) {
      PL.key = key;
      PL.list = K.synergyComps(camp ? { owned, stat: K.campStat(CAMP.mode), lines: K.campPool(CAMP.mode), limit: 6 } : { owned, limit: 6 })
        .map((c) => ({ comp: c, kind: 'syn', owned: c.units.filter((u) => ownOf(u.line)).length, n: c.units.length }));
    }
    return PL.list;
  }
  if (campMode()) {
    if (!CAMP.mode || CAMP.key !== campDataKey()) return [];
    const stop = curStop(); const owned = ownedCanon();
    const key = [CAMP.key, stop && stop.stop, JSON.stringify(owned)].join('|');
    if (PL.key !== key) { PL.key = key; PL.list = K.campComps(CAMP.mode, { owned, stop: stop && stop.stop, limit: 6 }).map((x) => ({ comp: x.comp, fit: x.fit, strength: x.strength, owned: x.owned, n: x.units.length, kind: 'camp' })); }
    return PL.list;
  }
  const key = ['pvp', S.level, S.gold, JSON.stringify(S.owned), S.shop.join()].join('|');
  if (PL.key !== key) { PL.key = key; PL.list = predictions().map((p) => ({ comp: p.comp, pBuild: p.pBuild, owned: p.have.length, n: p.need.length, kind: 'pvp' })); }
  return PL.list;
}
function planKey() { return campMode() ? 'camp:' + gm() : 'pvp'; }
function setPlan(id, auto) {
  const k = planKey(); if (k === 'pvp') S.target = id; else S.plans = { ...(S.plans || {}), [k]: id };
  S.planAuto = { ...(S.planAuto || {}), [k]: !!auto }; persist();
}
// Der aktuelle Plan. Ohne Wahl nimmt der Coach den besten Kandidaten und bleibt dabei,
// solange er unter den besten drei bleibt (kein Hin- und Herspringen bei jedem Shop).
function planComp() {
  if (!K) return null;
  const k = planKey(); const id = k === 'pvp' ? S.target : (S.plans || {})[k];
  let c = id ? K.compById[id] : null;
  const auto = !c || ((S.planAuto || {})[k] && !planList().slice(0, 3).some((x) => x.comp.id === id));
  if (auto && (Object.keys(S.owned).length || S.shop.some(Boolean))) { const best = planList()[0]; if (best && (!c || best.comp.id !== c.id)) { c = best.comp; setPlan(c.id, true); } }
  return c || null;
}
function targetComp() { return planComp(); }
function hasTarget() { return !!planComp(); }
function planUnits() { const c = planComp(); return c ? K.boardUnits(c) : []; }
function targetNeed() { return planUnits(); }
function targetBoard() { const c = planComp(); return c ? K.buildBoard(c) : []; }
// Was jetzt aufs Feld gehört: Plan-Pokémon, die du hast, dann eigene Pokémon mit passenden Typen
function fieldNow() {
  const lvl = Math.max(1, S.level || 1); const plan = planUnits(); const owned = S.owned;
  const picks = plan.filter((u) => ownOf(u.line)).map((u) => ({ line: u.line, star: starsOf(ownOf(u.line)), plan: true })).slice(0, lvl);
  const types = new Set(plan.flatMap((u) => K.lineTypes(u.line)));
  const rest = Object.keys(owned).filter((l) => owned[l] > 0 && !plan.some((u) => K.base(u.line) === l))
    .map((l) => ({ line: l, star: starsOf(owned[l]), shared: K.lineTypes(l).filter((x) => types.has(x)).length }))
    .sort((a, b) => b.shared - a.shared || b.star - a.star || K.lineCost(b.line) - K.lineCost(a.line));
  for (const r of rest) { if (picks.length >= lvl) break; picks.push({ ...r, plan: false }); }
  return picks;
}
function pvpStage() { const g = live && isLive() && live.game; return g && g.mode === 'pvp' && g.stage ? g.stage : null; }
function advice() {
  if (!K) return { buys: [], tips: [] };
  const c = planComp(); const board = live && isLive() && Array.isArray(live.board) && live.planning ? live.board : fieldNow();
  return K.advise({ plan: c ? planUnits() : [], owned: S.owned, board, shop: S.shop, level: S.level, gold: S.gold, teamN: live && isLive() && live.planning ? live.teamN : null, stage: pvpStage(), comp: c, interest: (live && isLive() && live.interest) || null });
}
const ST_COL = { ok: '#4fcb88', own: '#8ab4ff', shop: '#f2bf45', miss: '#5b6478' };
const isLive = () => Date.now() - liveTs < 20000;
function liveCopies() {
  const out = {}; if (!live || !isLive()) return out;
  for (const u of [...(live.bench || []), ...(live.board || [])]) out[u.line] = (out[u.line] || 0) + (u.star >= 3 ? 9 : u.star === 2 ? 3 : 1);
  return out;
}
function unitStatus(u) {
  if (live && isLive() && live.board && live.board.some((b) => b.cell === u.cell && b.line === K.base(u.line))) return 'ok';
  if ((ownOf(u.line) || 0) > 0) return 'own';
  if (inShop(u.line)) return 'shop';
  return 'miss';
}
/* ---------- Items ---------- */
let RM = null;
function recipeOf(id) { const it = D.data.items[id]; return it && it.recipe && it.recipe.length === 2 ? it.recipe : null; }
function itemKind(id) { const it = D.data.items[id]; return it ? it.k : ''; }
function craftable(pool) {
  const out = []; const seen = new Set();
  for (const [a, b, r] of D.data.recipes) {
    if (seen.has(r)) continue;
    const ok = a === b ? (pool[a] || 0) >= 2 : (pool[a] || 0) > 0 && (pool[b] || 0) > 0;
    if (ok) { seen.add(r); out.push({ a, b, r }); }
  }
  const tv = (id) => { const x = K.itemTier[id]; return x ? ({ S: 0, A: 1, B: 2, C: 3 }[x.tier] ?? 4) * 10 + (x.avg || 5) : 99; };
  return out.sort((x, y) => tv(x.r) - tv(y.r));
}
// Verteilt deinen Beutel auf die Wunsch-Items der Ziel-Comp (Carrys zuerst)
function itemPlan() {
  const pool = { ...(S.items || {}) }; const wishes = [];
  const c = targetComp(); const prio = {};
  // Wer die Items in dieser Comp wirklich trägt: Summe der Item-Anteile je Einheit
  if (c) for (const u of c.units) prio[u.line] = Math.max(prio[u.line] || 0, (u.items || []).slice(0, 3).reduce((a, x) => a + (x.share || 0), 0));
  const units = targetBoard().filter((u) => (u.items || []).length && (prio[u.line] || 0) > 0).sort((a, b) => (prio[b.line] || 0) - (prio[a.line] || 0)).slice(0, 3);
  for (const u of units) for (const id of u.items.slice(0, 3)) {
    if (itemKind(id) === 'part' || itemKind(id) === 'tool') continue;
    const w = { id, unit: u, status: 'none', missing: [], use: [] };
    const rc = recipeOf(id);
    if ((pool[id] || 0) > 0) { pool[id]--; w.status = 'ready'; w.use = [id]; }
    else if (rc) {
      const [a, b] = rc; const ha = (pool[a] || 0) > 0; if (ha) pool[a]--; const hb = (pool[b] || 0) > 0; if (hb) pool[b]--;
      if (ha && hb) { w.status = 'craft'; w.use = [a, b]; }
      else if (ha || hb) { w.status = 'half'; w.use = [ha ? a : b]; w.missing = [ha ? b : a]; }
      else { w.missing = [a, b]; }
    }
    wishes.push(w);
  }
  return { wishes, pool };
}
function boardHtml(units) {
  const by = {}; for (const u of units) by[u.cell] = u;
  let h = '';
  for (let c = 0; c < 28; c++) {
    const row = Math.floor(c / 7), col = c % 7; const u = by[c];
    const st = u ? unitStatus(u) : '';
    h += `<div class="hx ${u ? 'u ' + st : ''}" style="left:${((col + (row % 2 ? 0.5 : 0)) * 13.3333).toFixed(3)}%;top:${(row * 23.077).toFixed(3)}%${u ? `;--st:${ST_COL[st]}` : ''}"${u ? ` title="${esc(K.unitName(u.line, u.star) + ' · ' + ({ ok: t().stOk, own: t().stOwn, shop: t().stShop, miss: t().stMiss })[st])}"` : ''}>${u ? (() => { const ds = Math.max(u.star || 1, ownOf(u.line) ? starsOf(ownOf(u.line)) : 0); return av(u.line, ds) + (ds > 1 ? `<span class="s">${'★'.repeat(ds)}</span>` : ''); })() : ''}</div>`;
  }
  return `<div class="hb">${h}</div>`;
}

/* ---------- Darstellung ---------- */
function render() {
  if (!S.open) { host.style.display = 'none'; return; }
  host.style.display = '';
  box.classList.toggle('min', !!S.min);
  const tt = t();
  const head = `<div class="hd" id="drag"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><polygon points="16.00,3.80 26.57,9.90 26.57,22.10 16.00,28.20 5.43,22.10 5.43,9.90" fill="none" stroke="#edf0f6" stroke-width="2.8" stroke-linejoin="round"/><polygon points="16.00,9.30 17.88,14.11 23.04,14.41 19.04,17.69 20.35,22.69 16.00,19.90 11.65,22.69 12.96,17.69 8.96,14.41 14.12,14.11" fill="#ff5c4e"/></svg><span class="ttl">Kanto <b>Coach</b></span>
    <div class="ctl"><label>${tt.lvl}<select data-act="level">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => `<option ${S.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label>${tt.gold}<input type="number" min="0" max="200" value="${S.gold}" data-act="gold"></label></div>
    <button class="ib lng" data-act="lang" title="${esc(tt.langTitle)}">${lang === 'de' ? 'DE' : 'EN'}</button><button class="ib mn" data-act="min" title="${esc(tt.minimize)}">${S.min ? '▢' : '–'}</button><button class="ib" data-act="close" title="${esc(tt.close)}">✕</button></div>`;
  const liveBadge = Date.now() - liveTs < 20000 ? `<span class="live" title="${esc(tt.liveHint)}">● ${tt.live}</span>` : `<span class="live off">${esc(tt.manual)}</span>`;
  const tabs = `<div class="tabs" role="tablist">${Object.entries(tt.tabs).map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${S.tab === k}">${esc(l)}</button>`).join('')}${liveBadge}</div>`;
  let body = '';
  if (!K) body = loadError ? `<div class="card"><b>${esc(tt.loadErr)}</b><span class="sub">${esc(loadError)}</span><div class="row"><button class="btn" data-act="reload">${esc(tt.retry)}</button></div></div>` : `<p class="hint">${esc(tt.loading)}</p>`;
  else { if (!['now', 'plan', 'items', 'team'].includes(S.tab)) S.tab = S.tab === 'target' || S.tab === 'predict' ? 'plan' : 'now'; body = ({ now: viewNow, plan: viewPlan, items: viewItems, team: viewTeam })[S.tab](); }
  const ft = K ? `<div class="ft"><span>${esc(tt.credit)}</span><span>${esc(D && D.fetchedAt ? tt.data(new Date(D.fetchedAt).toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' }), D.source || '') : '')}</span></div>` : '';
  const oldBd = root.querySelector('.bd'); const keep = oldBd && lastTab === S.tab ? oldBd.scrollTop : 0;
  const pk = root.querySelector('.pgrid'); const keepPk = pk ? pk.scrollTop : 0;
  box.innerHTML = head + tabs + `<div class="wrap"><div class="bd">${body}</div>${pick != null ? viewPicker() : ''}</div>` + ft;
  const nb = root.querySelector('.bd'); if (nb && keep) nb.scrollTop = keep;
  const np = root.querySelector('.pgrid'); if (np && keepPk) np.scrollTop = keepPk;
  lastTab = S.tab;
  place(); hydrate(); pushMarks(); pushField();
  if (K && campMode() && CAMP.key !== campDataKey()) ensureCamp();
  const ps = root.getElementById('pickq'); if (ps) { ps.focus(); ps.setSelectionRange(ps.value.length, ps.value.length); }
}
function diagLine() {
  const tt = t(); if (!live || !live.diag || Date.now() - liveTs > 20000) return '';
  const d = live.diag; const parts = [tt.diag(d.matched, d.cards), tt.diagBench(d.bench)];
  if (d.board != null) parts.push(tt.diagBoard(d.board));
  if (live.itemsSeen) parts.push(tt.diagItems(Object.values(live.items || {}).reduce((a, b) => a + b, 0)));
  let out = `<div class="diag">${esc(parts.join(' · '))}</div>`;
  if (d.cards && d.matched < d.cards) out += `<div class="diag bad">${esc(tt.diagUnknown((d.unknown || []).map((x) => (typeof x === 'number' ? '#' + x : x)).join(', ')))}</div>`;
  return out;
}
function tierBadge(tier) { return `<span class="tier ${tier}">${tier}</span>`; }
function modeBar() {
  const tt = t(); const det = detectedMode();
  return `<div class="row modes"><span class="sub">${esc(tt.modeL)}</span>${['auto', 'pvp', 'camp', 'tower'].map((m) => `<button class="chip ${(S.modeSel || 'auto') === m ? 'on' : ''}" data-mode="${m}">${esc(tt.modes[m])}</button>`).join('')}${(S.modeSel || 'auto') === 'auto' && det ? `<span class="sub">${esc(tt.detected(tt.modes[det]))}</span>` : ''}</div>`;
}
function unitRows(need) {
  const tt = t();
  return need.map((u) => {
    const own = ownOf(u.line) || 0; const st = u.cell != null ? unitStatus(u) : (own ? 'own' : inShop(u.line) ? 'shop' : 'miss'); const l = D.data.lines[K.base(u.line)];
    const stop = curStop(); const later = u.from != null && stop && stop.stop != null && stop.stop < u.from;
    let right = '';
    if (st === 'ok') right = `<span class="good">✓ ${esc(tt.onBoard)}</span>`;
    else if (own) right = `<span class="good">${'★'.repeat(starsOf(own))} ${own}/${starsOf(own) >= 2 ? 9 : 3}</span>`;
    else if (st === 'shop') right = `<span class="warn">${esc(tt.inShop)}</span>`;
    else if (later) right = `<span class="sub">${esc(tt.fromStop(u.from, gm()))}</span>`;
    else if (l && l.shop) { const p = K.shopCalc(S.level, { unit: u.line, own: 0, others: 0, gone: 0, slots: 5 }); right = p.tierP === 0 ? `<span class="bad">${esc(tt.notYet(K.minLevelFor(l.c)))}</span>` : `${pct(p.pShop, 1)}${esc(tt.perShop)}<div class="sub">${esc(tt.goldEst(Math.round(2 / p.pShop)))}</div>`; }
    else if (!l) right = `<span class="sub">${esc(tt.campOnly)}</span>`;
    const from = (u.from != null && gm() !== 'pvp' && !later ? `<span class="sub"> · ${esc(tt.fromStop(u.from, gm()))}</span>` : '')
      + (K.anchorOf(u.line) != null ? `<div class="sub">⚓ ${esc(tt.anchorHint(K.pname(K.lineNames(u.line)[0])))}</div>` : '');
    const ds = Math.max(u.star || 1, own ? starsOf(own) : 0); // hast du schon die Entwicklung, zeig sie
    return `<div class="u ${st === 'ok' || own ? 'ok' : st === 'shop' ? 'shop' : ''}">${av(u.line, ds, 'sm')}<span><span class="n">${esc(K.unitName(u.line, ds))}</span> <span class="stars">${'★'.repeat(ds)}</span>${from}<div>${(u.items || []).slice(0, 3).map((id) => itemImg(id)).join('')}</div></span><span class="r">${right}</span></div>`;
  }).join('');
}
function fieldCard(board) {
  const tt = t();
  const lg = ['ok', 'own', 'shop', 'miss'].map((k) => `<span><i style="--st:${ST_COL[k]}"></i>${esc(tt['st' + k[0].toUpperCase() + k.slice(1)])}</span>`).join('');
  return `<div class="card"><h4>${esc(tt.field)}</h4>
      <div class="hblab"><span>↑ ${esc(tt.enemy)}</span><span>${esc(tt.front)}</span></div>
      ${boardHtml(board)}
      <div class="lg">${lg}</div>
      <div class="row"><button class="btn sm ${S.fieldShow ? '' : 'pri'}" data-act="fieldshow">${esc(S.fieldShow ? tt.hideField : tt.showField)}</button><button class="btn sm" data-act="align">${esc(tt.align)}</button></div>
      <span class="sub">${esc(calibrated ? tt.fieldHint : tt.fieldAlignHint)}</span></div>`;
}

const TAGS = { star: 'upgrade', buy: 'target', trait: 'comp' };
function buyLabel(b) { const tt = t(); return b.kind === 'star' ? tt.markUpgrade(b.why === 'star3' ? 3 : 2) : b.kind === 'trait' ? '+' + K.typeName(b.trait).toUpperCase() : tt.markBuy; }
function buyWhy(b) {
  const tt = t();
  if (b.why === 'star2') return tt.wStar(2); if (b.why === 'star3') return tt.wStar(3);
  if (b.why === 'core') return tt.wCore; if (b.why === 'plan') return tt.wPlan; if (b.why === 'pair') return tt.wPair;
  if (b.why === 'trait') return tt.wTrait(K.typeName(b.trait), b.next);
  return '';
}
function tipText(x) {
  const tt = t();
  if (x.k === 'free') return tt.tFree(x.n);
  if (x.k === 'near') return tt.tNear(K.typeName(x.type), x.next);
  if (x.k === 'level') return tt.tLevel(x.stage, x.level);
  if (x.k === 'save') return tt.tSave(x.cap, x.max);
  if (x.k === 'roll') return tt.tRoll(x.cap);
  return '';
}
function statusLine() {
  const tt = t(); const g = live && isLive() && live.game; const m = gm();
  let where = '';
  if (g && g.mode === 'pvp' && g.stage) where = tt.roundN(g.stage, g.round);
  else if (g && g.mode === 'camp' && g.stop) where = tt.stationN(g.stop, g.total);
  else if (g && g.mode === 'tower' && g.stop) where = tt.floorN(g.stop);
  let diff = '', hard = '';
  if (campMode() && CAMP.mode && g && g.stop && curStop()) {
    const st = CAMP.mode.stops.filter((x) => parseInt(x.stop, 10) === g.stop).sort((a, b) => a.win - b.win)[0];
    if (st) diff = tt.fightWin(K.stopName(st.stop).name, num(st.win, 0));
    else {
      // Keine Daten für genau diese Station/Etage (im Turm gibt es nur Boss-Etagen): den nächsten Kampf mit Daten zeigen
      const nx = CAMP.mode.stops.map((x) => ({ x, n: parseInt(x.stop, 10) })).filter((y) => y.n > g.stop).sort((a, b) => a.n - b.n || a.x.win - b.x.win)[0];
      if (nx) diff = tt.fightNext(K.stopName(nx.x.stop).name, nx.n, num(nx.x.win, 0), gm());
    }
    // Schwere Kämpfe der nächsten Stationen (Spieler gewinnen unter 50 %): früh warnen, damit Level/Würfeln rechtzeitig passiert
    const ahead = gm() === 'tower' ? 5 : 2;
    const next = CAMP.mode.stops.filter((x) => { const n = parseInt(x.stop, 10); return n >= g.stop && n <= g.stop + ahead && x.win < 50 && x.n >= 100; }).sort((a, b) => a.win - b.win)[0];
    if (next) hard = tt.hardFight(K.stopName(next.stop).name, parseInt(next.stop, 10) === g.stop, num(next.win, 0));
  }
  return `<div class="status"><b>${esc(tt.modes[m])}</b>${where ? ` · ${esc(where)}` : ''}${diff ? `<span class="sub">${esc(diff)}</span>` : ''}</div>${hard ? `<div class="diag bad">${esc(hard)}</div>` : ''}${statsNote()}`;
}
// Hinweis, wenn die Statistik der API ausfällt (meta.json antwortet z. B. mit 503)
function statsNote() {
  if (!D || !D.metaErr) return '';
  const at = K && K.statsOk && D.metaAt ? new Date(D.metaAt).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return `<div class="diag bad">${esc(t().statsDown(at))}</div>`;
}
// Plan als Team-Code im Format des Spiels kopieren (Spiel: Planer → „Code einfügen“)
async function copyGamePlan() {
  const c = planComp(); if (!c) return;
  const code = K.teamCode(targetBoard(), D.data.rules, { mode: { pvp: 'pvp', camp: 'adv', tower: 'tower' }[gm()], name: K.compTitle(c) });
  let ok = false;
  try { await navigator.clipboard.writeText(code); ok = true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = code; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { /* nicht möglich */ } ta.remove();
  }
  toast(ok ? t().gamePlanOk : code);
}
function viewNow() {
  const tt = t(); const adv = advice(); const by = {}; adv.buys.forEach((b) => { if (by[b.slot] == null) by[b.slot] = b; });
  const plan = planUnits(); const inPlan = (l) => plan.some((u) => K.base(u.line) === l);
  const slots = S.shop.map((line, i) => {
    if (!line) return `<button class="slot emp ${sel === i ? 'sel' : ''}" data-slot="${i}" title="${esc(tt.empty)}">+</button>`;
    const b = by[i]; const own = S.owned[line] || 0; const isNew = !campMode() && !D.data.lines[line] && !K.unitTier[line];
    const gp = live && isLive() && live.shopInfo && live.shopInfo[i] && live.shopInfo[i].plan; // vom Planer des Spiels markiert
    return `<button class="slot ${b ? 'need k-' + b.kind : ''} ${sel === i ? 'sel' : ''}" data-slot="${i}" title="${esc(K.lineFullName(line))}">${b ? `<span class="tag t-${b.kind}">${esc(buyLabel(b))}</span>` : isNew ? `<span class="tag nw">${tt.newTag}</span>` : ''}${own ? `<span class="own">×${own}</span>` : ''}${av(line, 1)}<span class="nm">${esc(K.baseName(line))}</span>${inPlan(line) && !b ? `<span class="fit">${esc(tt.inPlan)}</span>` : gp && !b ? `<span class="fit">${esc(tt.inGamePlan)}</span>` : ''}</button>`;
  }).join('');
  const actions = sel != null && S.shop[sel] ? `<div class="row"><button class="btn pri sm" data-act="bought">${esc(tt.bought)}</button><button class="btn sm" data-act="change">${esc(tt.change)}</button><button class="btn sm" data-act="clearslot">${esc(tt.clear)}</button></div>` : '';
  const steps = [];
  for (const b of adv.buys) steps.push(`<div class="step ${b.affordable ? '' : 'dim'}"><span class="sn">${steps.length + 1}</span>${av(b.line, 1, 'sm')}<span><b>${esc(tt.doBuy(K.baseName(b.line)))}</b><span class="sub">${esc(buyWhy(b))}${b.affordable ? '' : ' · ' + esc(tt.noGold)}</span></span></div>`);
  for (const x of adv.tips) steps.push(`<div class="step tip"><span class="sn">${steps.length + 1}</span><span class="ti">${{ free: '⬆', near: '◆', level: '⇧', save: '💰', roll: '🎲' }[x.k] || '•'}</span><span>${esc(tipText(x))}</span></div>`);
  const c = planComp(); const have = plan.filter((u) => ownOf(u.line)).length;
  const live2 = Date.now() - liveTs < 20000;
  return `${statusLine()}${live2 ? diagLine() : `<p class="hint">${esc(tt.shopHint)}</p>`}<div class="slots">${slots}</div>${actions}
    <div class="sec">${esc(tt.whatNow)}</div>
    ${steps.length ? `<div class="list">${steps.join('')}</div>` : `<p class="hint">${esc(tt.nothingNow)}</p>`}
    ${c ? `<div class="card"><span class="sub up">${esc(tt.yourPlan)}</span><h4>${tierBadge(c.tier)}<span class="t">${esc(K.compTitle(c))}</span></h4>
      <div class="row">${plan.map((u) => av(u.line, Math.max(u.star, ownOf(u.line) ? starsOf(ownOf(u.line)) : 1), 'xs' + (ownOf(u.line) ? '' : inShop(u.line) ? ' shop' : ' miss'))).join('')}</div>
      <div class="row" style="justify-content:space-between"><span class="sub">${esc(tt.progress(have, plan.length))}</span><button class="btn sm" data-tab="plan">${esc(tt.openPlan)}</button></div></div>`
      : `<div class="card"><span class="sub">${esc(campMode() && !CAMP.mode ? (CAMP.err ? tt.campErr : tt.campLoading) : tt.noPlanYet)}</span></div>`}
    <div class="row"><button class="btn sm" data-act="clearshop">${esc(tt.clearShop)} <span class="sub">Alt+R</span></button></div>`;
}
function planWhy(x) {
  const tt = t();
  if (!x) return '';
  if (x.kind === 'pvp') return tt.whyPvp(num(x.comp.avg), pct(x.pBuild), x.owned);
  if (x.kind === 'syn') return tt.whySyn((x.comp.traits || []).map((y) => K.typeName(y.type) + ' ' + (D.data.traits[y.type].th[y.level - 1] || '')).join(' + '), x.owned, x.n, campMode());
  return tt.whyCamp(tt.modes[gm()], (x.strength >= 0 ? '+' : '') + num(x.strength, 1), x.owned, x.n);
}
function viewPlan() {
  const tt = t(); const c = planComp(); const list = planList(); const k = planKey();
  const difRow = gm() === 'camp' ? `<div class="row"><span class="sub">${esc(tt.dif)}</span>${tt.difs.map((l, i) => `<button class="chip ${(S.campDif || 0) === i ? 'on' : ''}" data-dif="${i}">${esc(l)}</button>`).join('')}</div>` : '';
  if (S.chooseTarget || !c) {
    const q = compQ.trim().toLowerCase();
    const all = K.comps.filter((x) => x.n >= 30 && !x.coreOnly && ['S', 'A', 'B'].includes(x.tier)).filter((x) => !q || K.compTitle(x).toLowerCase().includes(q) || x.units.some((u) => K.lineNames(u.line).some((n) => K.pname(n).toLowerCase().includes(q) || n.toLowerCase().includes(q)))).sort((a, b) => a.avg - b.avg).slice(0, 25);
    return modeBar() + difRow + `${c ? `<div class="row"><button class="btn sm" data-act="closechoose">← ${esc(tt.back)}</button></div>` : `<p class="hint">${esc(campMode() && !CAMP.mode ? tt.campLoading : tt.noPlanYet)}</p>`}
      ${list.length ? `<div class="sec">${esc(tt.bestPlans)}</div><div class="list">${list.slice(0, 5).map((x) => planRow(x, c)).join('')}</div>` : ''}
      <div class="sec">${esc(tt.allComps)}</div><input type="search" id="compq" placeholder="${esc(tt.compSearch)}" value="${esc(compQ)}">
      <div class="list">${all.map((x) => `<button class="card pickc" data-plan="${esc(x.id)}"><h4>${tierBadge(x.tier)}<span class="t">${esc(K.compTitle(x))}</span><span class="sub" style="margin-left:auto">${tt.avg} ${num(x.avg)}</span></h4><div class="row">${K.boardUnits(x).slice(0, 9).map((u) => av(u.line, u.star, 'xs' + (ownOf(u.line) ? '' : ' miss'))).join('')}</div></button>`).join('')}</div>`;
  }
  const units = planUnits(); const board = targetBoard(); const have = units.filter((u) => ownOf(u.line)).length;
  const me = list.find((x) => x.comp.id === c.id);
  const now = fieldNow(); const tr = K.traitsFor(now.map((u) => ({ line: u.line, items: [] }))).filter((x) => x.lv > 0);
  const norm = pvpStage() ? K.stageNorm(c, pvpStage()) : null;
  const others = list.filter((x) => x.comp.id !== c.id).slice(0, 3);
  return modeBar() + difRow + `<div class="card"><span class="sub up">${esc((S.planAuto || {})[k] ? tt.planAuto : tt.planManual)}</span>
      <h4>${tierBadge(c.tier)}<span class="t">${esc(K.compTitle(c))}</span></h4>
      ${me ? `<span class="sub">${esc(planWhy(me))}</span>` : ''}
      <div class="row"><span class="sub">${esc(tt.progress(have, units.length))}</span><span class="bar"><i style="width:${(have / Math.max(1, units.length) * 100).toFixed(0)}%"></i></span></div>
      ${norm ? `<span class="sub">${esc(tt.stageNorm(pvpStage(), norm.level))}</span>` : ''}
      <div class="row"><button class="btn pri sm" data-act="gameplan" title="${esc(tt.gamePlanHint)}">${esc(tt.gamePlan)}</button><button class="btn sm" data-act="choose">${esc(tt.otherPlan)}</button>${server ? `<a class="btn sm" href="${esc(server)}/#comp/${encodeURIComponent(c.id)}" target="_blank" rel="noopener" style="text-decoration:none">${esc(tt.openSite)} ↗</a>` : ''}</div></div>
    <div class="card"><h4>${esc(tt.fieldNow(S.level))}</h4>
      <div class="row">${now.map((u) => `<span class="fn ${u.plan ? '' : 'fill'}" title="${esc(u.plan ? tt.fromPlan : tt.filler)}">${av(u.line, u.star, 'sm')}<span>${esc(K.unitName(u.line, u.star))}</span></span>`).join('') || `<span class="sub">${esc(tt.noUnits)}</span>`}</div>
      ${tr.length ? `<div class="row">${tr.map((x) => `<span class="ty">${esc(K.typeName(x.type))} ${x.n}</span>`).join('')}</div>` : ''}
      <span class="sub">${esc(tt.fieldNowHint)}</span></div>
    ${fieldCard(board)}<div class="list">${unitRows(units.map((u) => ({ ...u, cell: (board.find((b) => b.line === u.line) || {}).cell })))}</div>
    ${others.length ? `<div class="sec">${esc(tt.alsoGood)}</div><div class="list">${others.map((x) => planRow(x, c)).join('')}</div>` : ''}`;
}
function planRow(x, cur) {
  const tt = t(); const isCur = cur && cur.id === x.comp.id; const units = K.boardUnits(x.comp);
  return `<div class="card"><h4>${tierBadge(x.comp.tier)}<span class="t">${esc(K.compTitle(x.comp))}</span></h4><span class="sub">${esc(planWhy(x))}</span>
    <div class="row">${units.slice(0, 9).map((u) => av(u.line, u.star, 'xs' + (ownOf(u.line) ? '' : inShop(u.line) ? ' shop' : ' miss'))).join('')}</div>
    <div class="row">${isCur ? `<span class="good" style="font-weight:700">✓ ${esc(tt.isPlan)}</span>` : `<button class="btn pri sm" data-plan="${esc(x.comp.id)}">${esc(tt.takePlan)}</button>`}</div></div>`;
}
function viewItems() {
  const tt = t(); const bagObj = S.items || {}; const ids = Object.keys(bagObj).filter((id) => bagObj[id] > 0);
  const plan = itemPlan(); const wantIds = new Set(plan.wishes.filter((w) => w.status !== 'none').flatMap((w) => w.use));
  const sortKey = (id) => ({ part: 0, full: 1, emblem: 2, tool: 3 }[itemKind(id)] ?? 4);
  const inv = ids.sort((a, b) => sortKey(a) - sortKey(b) || K.itemName(a).localeCompare(K.itemName(b)))
    .map((id) => `<button class="it ${itemKind(id) === 'part' ? 'part' : ''} ${wantIds.has(id) ? 'want' : ''}" data-itdec="${esc(id)}" title="${esc(K.itemName(id))}">${itemImg(id)}<span>${esc(K.itemName(id))}</span>${bagObj[id] > 1 ? `<b>×${bagObj[id]}</b>` : ''}</button>`).join('');
  const liveNote = live && isLive() ? (live.itemsHidden ? `<p class="hint warn">${esc(tt.itemsHidden)}</p>` : '') : `<p class="hint">${esc(tt.itemsManual)}</p>`;
  const stTxt = (w) => (w.status === 'ready' ? `<span class="good">${esc(tt.ready)}</span>` : w.status === 'craft' ? `<span class="good">${esc(tt.craftable)}</span>` : w.missing.length === 1 ? `<span class="warn">${esc(tt.needOne(K.itemName(w.missing[0])))}</span>` : w.missing.length === 2 ? `<span class="sub">${esc(tt.needTwo(K.itemName(w.missing[0]), K.itemName(w.missing[1])))}</span>` : '');
  const rcp = (id) => { const r = recipeOf(id); return r ? `<span class="rcp">${itemImg(r[0])}+${itemImg(r[1])}</span>` : ''; };
  const wishes = hasTarget() ? (plan.wishes.length ? plan.wishes.map((w) => `<div class="cr ${w.status === 'ready' || w.status === 'craft' ? 'ok' : w.status === 'half' ? 'want' : ''}">${itemImg(w.id, 'ii lg')}<span><span class="n">${esc(K.itemName(w.id))}</span><div class="row" style="gap:4px">${av(w.unit.line, w.unit.star, 'xs')}<span class="sub">${esc(tt.for)} ${esc(K.unitName(w.unit.line, w.unit.star))}</span>${rcp(w.id)}</div></span><span class="r" style="text-align:right;font-size:11.5px">${stTxt(w)}</span></div>`).join('') : '') : `<p class="hint">${esc(tt.noTargetItems)}</p>`;
  const wishSet = new Set(plan.wishes.map((w) => w.id));
  const cr = craftable(bagObj).slice(0, 8);
  const crHtml = cr.length ? cr.map((x) => { const tr = K.itemTier[x.r]; const w = plan.wishes.find((y) => y.id === x.r); return `<div class="cr ${wishSet.has(x.r) ? 'want' : ''}">${itemImg(x.r, 'ii lg')}<span><span class="n">${esc(K.itemName(x.r))}</span><div class="row" style="gap:4px"><span class="rcp">${itemImg(x.a)}+${itemImg(x.b)}</span>${w ? `<span class="sub">${esc(tt.for)} ${esc(K.unitName(w.unit.line, w.unit.star))}</span>` : `<span class="sub">${esc(K.itemShort(x.r) || '')}</span>`}</div></span>${tr ? tierBadge(tr.tier) : '<span></span>'}</div>`; }).join('') : `<p class="hint">${esc(tt.craftNone)}</p>`;
  const parts = Object.keys(D.data.items).filter((id) => itemKind(id) === 'part');
  return `<p class="hint">${esc(tt.itemsHint)}</p>${liveNote}
    <div class="sec">${esc(tt.bag)}</div>${ids.length ? `<div class="inv">${inv}</div>` : `<p class="hint">${esc(tt.bagEmpty)}</p>`}
    <div class="sec">${esc(tt.forTarget)}</div><div class="list">${wishes}</div>
    <div class="sec">${esc(tt.craftNow)}</div><div class="list">${crHtml}</div>
    <div class="sec">${esc(tt.addPart)}</div><div class="inv">${parts.map((id) => `<button class="it part" data-itinc="${esc(id)}" title="${esc(K.itemName(id))}">${itemImg(id)}<span>+</span></button>`).join('')}</div>`;
}
function viewTeam() {
  const tt = t(); const lines = Object.keys(S.owned).filter((l) => S.owned[l] > 0).sort((a, b) => K.lineCost(b) - K.lineCost(a));
  const lc = liveCopies(); const lcN = Object.keys(lc).length;
  return `<p class="hint">${esc(tt.teamHint)}</p>${lcN ? `<div class="diag">${esc(tt.live2)}: ${Object.entries(lc).map(([l, n]) => K.baseName(l) + ' ' + '★'.repeat(starsOf(n))).join(', ')}</div>` : ''}
    <div class="list">${lines.length ? lines.map((l) => `<div class="u">${av(l, starsOf(S.owned[l]), 'sm')}<span class="n">${esc(K.unitName(l, starsOf(S.owned[l])))} <span class="stars">${'★'.repeat(starsOf(S.owned[l]))}</span></span><span class="cnt"><button data-dec="${l}">−</button><b style="min-width:18px;text-align:center">${S.owned[l]}</b><button data-inc="${l}">+</button></span></div>`).join('') : `<p class="hint">${esc(tt.noUnits)}</p>`}</div>
    <div class="row"><button class="btn sm" data-act="addown">${esc(tt.addUnit)}</button></div>
    <div class="row" style="flex-wrap:nowrap"><input type="text" id="code" placeholder="${esc(tt.codePh)}"><button class="btn sm" data-act="code">${esc(tt.loadCode)}</button></div>
    <div class="row"><button class="btn sm" data-act="newgame">${esc(tt.newGame)}</button><span class="sub">${esc(tt.newGameHint)}</span></div>`;
}
function viewPicker() {
  const tt = t(); const q = pickQ;
  const odds = D.data.pvp.odds[S.level] || [];
  const list = K.shopLines.filter((l) => (S.allCosts || pick === 'own' || (odds[K.lineCost(l) - 1] || 0) > 0)).filter((l) => !q || K.lineNames(l).some((n) => K.pname(n).toLowerCase().includes(q.toLowerCase()) || n.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => K.lineCost(a) - K.lineCost(b) || K.baseName(a).localeCompare(K.baseName(b)));
  pickList = list;
  return `<div class="pick"><div class="row" style="justify-content:space-between"><b>${esc(pick === 'own' ? tt.pickOwn : tt.pickTitle)}</b><button class="ib" data-act="closepick">✕</button></div>
    <input type="search" id="pickq" placeholder="${esc(tt.search)}" value="${esc(q)}" autocomplete="off">
    ${pick !== 'own' ? `<label class="sub"><input type="checkbox" data-act="allcosts" ${S.allCosts ? 'checked' : ''}> ${esc(tt.showAll)}</label>` : ''}
    <div class="pgrid">${list.map((l, i) => `<button class="pc ${i === 0 && q ? 'first' : ''}" data-pick="${l}">${av(l, 1)}<span>${esc(K.baseName(l))}</span></button>`).join('')}</div></div>`;
}
let pickQ = '', pickList = [];

/* ---------- Aktionen ---------- */
function setPick(line) {
  if (pick === 'own') S.owned[line] = (S.owned[line] || 0) + 1;
  else if (typeof pick === 'number') { S.shop[pick] = line; sel = null; const next = S.shop.indexOf(null); pick = next >= 0 && pick !== next ? next : null; pickQ = ''; persist(); render(); return; }
  pick = null; pickQ = ''; persist(); render();
}
box.addEventListener('click', (e) => {
  const el = e.target.closest('button,[data-act],[data-plan],a'); if (!el || el.tagName === 'A') return;
  const a = el.dataset.act;
  if (el.dataset.tab) { S.tab = el.dataset.tab; S.chooseTarget = false; persist(); render(); return; }
  if (el.dataset.slot != null) { const i = +el.dataset.slot; if (!S.shop[i]) { pick = i; pickQ = ''; sel = null; } else sel = sel === i ? null : i; render(); return; }
  if (el.dataset.pick) { setPick(el.dataset.pick); return; }
  if (el.dataset.plan) { setPlan(el.dataset.plan, false); S.chooseTarget = false; S.tab = 'plan'; const c = K.compById[el.dataset.plan]; persist(); render(); if (c) toast(t().targetSet(K.compTitle(c))); return; }
  if (el.dataset.inc) { S.owned[el.dataset.inc] = (S.owned[el.dataset.inc] || 0) + 1; persist(); render(); return; }
  if (el.dataset.cpick) { S.campPick = el.dataset.cpick; persist(); render(); return; }
  if (el.dataset.mode) { S.modeSel = el.dataset.mode; persist(); render(); return; }
  if (el.dataset.dif != null) { S.campDif = +el.dataset.dif; persist(); render(); return; }
  if (el.dataset.size) { S.campSize = +el.dataset.size; persist(); render(); return; }
  if (el.dataset.itinc) { S.items = { ...(S.items || {}) }; S.items[el.dataset.itinc] = (S.items[el.dataset.itinc] || 0) + 1; persist(); render(); return; }
  if (el.dataset.itdec) { const id = el.dataset.itdec; S.items = { ...(S.items || {}) }; S.items[id] = (S.items[id] || 0) - 1; if (S.items[id] <= 0) delete S.items[id]; persist(); render(); return; }
  if (el.dataset.dec) { const l = el.dataset.dec; S.owned[l] = (S.owned[l] || 0) - 1; if (S.owned[l] <= 0) delete S.owned[l]; persist(); render(); return; }
  switch (a) {
    case 'lang': { const next = lang === 'de' ? 'en' : 'de'; try { chrome.storage.sync.set({ lang: next }); } catch (err) {} break; }
    case 'min': S.min = !S.min; persist(); render(); break;
    case 'close': S.open = false; persist(); render(); break;
    case 'reload': loadData(true); break;
    case 'gameplan': copyGamePlan(); break;
    case 'bought': { const l = S.shop[sel]; if (l) { S.owned[l] = (S.owned[l] || 0) + 1; S.shop[sel] = null; } sel = null; persist(); render(); break; }
    case 'change': pick = sel; sel = null; render(); break;
    case 'clearslot': S.shop[sel] = null; sel = null; persist(); render(); break;
    case 'clearshop': S.shop = [null, null, null, null, null]; sel = null; persist(); render(); break;
    case 'closepick': pick = null; render(); break;
    case 'choose': S.chooseTarget = true; compQ = ''; render(); break;
    case 'closechoose': S.chooseTarget = false; render(); break;
    case 'addown': pick = 'own'; pickQ = ''; render(); break;
    case 'camprety': CAMP = { key: '', mode: null, loading: false, err: '', planKey: '', plan: null, endKey: '', end: null }; render(); break;
    case 'fieldshow': S.fieldShow = !S.fieldShow; persist(); setField({ show: S.fieldShow, edit: false }); render(); break;
    case 'align': S.fieldShow = true; persist(); setField({ show: true, edit: true }); toast(t().fieldAlignHint.split('. ')[1] + '.'); render(); break;
    case 'newgame': S.owned = {}; S.items = {}; S.target = null; S.plans = {}; S.planAuto = {}; S.shop = [null, null, null, null, null]; S.level = 3; S.gold = 0; persist(); render(); break;
    case 'code': {
      const r = K.parseTeamCode((root.getElementById('code') || {}).value);
      if (!r) { toast(t().codeBad); break; }
      // Codes aus Abenteuer/Turm tragen Kampagnen-IDs (bellsprout …); der Coach rechnet mit den PvP-IDs
      const toPvp = Object.fromEntries(Object.entries(K.CAMP_ALIAS).map(([p, c]) => [c, p]));
      for (const x of r.units) { const b = toPvp[K.base(x.line)] || K.base(x.line); S.owned[b] =Math.max(S.owned[b] || 0, x.star === 3 ? 9 : x.star === 2 ? 3 : 1); }
      persist(); render(); toast(t().codeOk(r.units.length)); break;
    }
    default: break;
  }
});
box.addEventListener('change', (e) => {
  const a = e.target.dataset.act;
  if (a === 'level') { S.level = +e.target.value; persist(); render(); }
  if (a === 'gold') { S.gold = Math.max(0, +e.target.value || 0); persist(); render(); }
  if (a === 'allcosts') { S.allCosts = e.target.checked; persist(); pickQ = (root.getElementById('pickq') || {}).value || ''; render(); }
});
box.addEventListener('input', (e) => {
  if (e.target.id === 'pickq') { pickQ = e.target.value; render(); }
  if (e.target.id === 'compq') { compQ = e.target.value; const pos = e.target.selectionStart; render(); const el = root.getElementById('compq'); if (el) { el.focus(); el.setSelectionRange(pos, pos); } }
});
box.addEventListener('keydown', (e) => {
  if (e.target.id === 'pickq') {
    if (e.key === 'Enter' && pickList[0]) { e.preventDefault(); setPick(pickList[0]); }
    if (e.key === 'Escape') { pick = null; render(); }
  }
});
/* Verschieben */
box.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#drag') || e.target.closest('button,select,input,label')) return;
  const r = box.getBoundingClientRect(); const ox = e.clientX - r.left, oy = e.clientY - r.top;
  const move = (ev) => { S.x = ev.clientX - ox; S.y = ev.clientY - oy; place(); };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); persist(); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
});
window.addEventListener('resize', place);

/* ---------- Markierungen im Spiel ---------- */
function pushMarks() {
  if (!K) return;
  const shop = {}; const items = {};
  for (const b of advice().buys) if (!shop[b.line] && b.affordable) shop[b.line] = { kind: TAGS[b.kind] || 'comp', label: buyLabel(b) };
  if (hasTarget()) for (const w of itemPlan().wishes) {
    if (w.status === 'ready') items[w.id] = items[w.id] || { kind: 'use', label: '→ ' + K.unitName(w.unit.line, w.unit.star) };
    else if (w.status === 'craft' || w.status === 'half') for (const id of w.use) items[id] = items[id] || { kind: 'craft', label: t().markItem };
  }
  const out = { shop, items };
  const key = JSON.stringify(out);
  if (key !== lastMarks) { lastMarks = key; try { chrome.storage.local.set({ kkMarks: out }); } catch (e) {} }
}
function pushField() {
  if (!K) return;
  const units = S.fieldShow ? targetBoard().map((u) => { const ds = Math.max(u.star || 1, ownOf(u.line) ? starsOf(ownOf(u.line)) : 0); return { cell: u.cell, line: u.line, star: ds, name: K.unitName(u.line, ds), dex: K.dexOf(u.line, ds) || 0, st: unitStatus(u), items: (u.items || []).slice(0, 3) }; }) : [];
  const key = JSON.stringify(units);
  if (key !== lastField) { lastField = key; try { chrome.storage.local.set({ kkFieldUnits: units }); } catch (e) {} }
}
function setField(v) { try { chrome.storage.local.set({ kkField: { show: false, edit: false, ...v } }); } catch (e) {} }
/* ---------- Live-Daten vom Leser ---------- */
// Gleiches Pokémon, andere ID: im PvP heißen die Neuen aus v35 anders als in der Kampagne
function canon(line, owner) {
  if (!line || !K) return line;
  if (gm() === 'pvp') { const a = K.PVP_ALIAS[line]; return a && K.compById && (K.unitTier[a] || K.comps.some((c) => c.units.some((u) => u.line === a))) ? a : line; }
  if (owner && line === 'koffing') return 'koga';
  return line;
}
function canonLive(l) {
  const shopInfo = (l.shopInfo || []).map((x) => ({ ...x, line: canon(x.line, x.owner) }));
  const own = {}; (l.shopInfo || []).forEach((x, i) => { if (x.line && l.own && l.own[x.line] != null) own[shopInfo[i].line] = l.own[x.line]; });
  return { ...l, shopInfo, shop: shopInfo.map((x) => x.line), own,
    bench: (l.bench || []).map((u) => ({ ...u, line: canon(u.line) })), board: l.board ? l.board.map((u) => ({ ...u, line: canon(u.line) })) : l.board };
}
let lastLiveSig = '', lastTab = null;
function applyLive(raw) {
  if (!raw || !raw.ts) return;
  // Hauptmenü: kein Spielstand – Overlay bleibt bei den letzten Werten, aber nicht mehr „live“
  if (raw.lobby) { live = null; liveTs = 0; lastLiveSig = ''; render(); return; }
  const l = canonLive(raw);
  // Nur der Herzschlag ohne Änderung: nichts neu zeichnen (sonst springt die Liste nach oben)
  const sig = JSON.stringify({ ...l, ts: 0 }); const wasLive = isLive();
  live = l; liveTs = l.ts;
  if (sig === lastLiveSig && wasLive) return;
  lastLiveSig = sig;
  if (langSel === 'auto') { const nl = resolveLang(); if (nl !== lang) { lang = nl; if (K) K.setLang(lang); } }
  if (l.level != null && S.level >= 5 && l.level <= 2 && Object.keys(S.owned).length) { S.owned = {}; S.items = {}; toast(t().newGame2); }
  S.shop = [...(l.shop || []), null, null, null, null, null].slice(0, 5);
  for (const x of l.shopInfo || []) if (x.line && x.cost && D && !D.data.lines[x.line]) extraCost[x.line] = x.cost;
  if (l.level != null) S.level = l.level;
  if (l.gold != null) S.gold = l.gold;
  // Abenteuer-Stufe aus dem Spiel: Normal = 1, Veteran = 2 (für Legende liefert die API keine eigene Auswertung -> alle)
  if (l.game && l.game.mode === 'camp' && l.game.dif) S.campDif = l.game.dif <= 2 ? l.game.dif : 0;
  const copies = liveCopies();
  if (l.planning && Array.isArray(l.board) && (l.teamN == null || l.board.length >= l.teamN)) {
    // In der Planungsphase sind Bank und Brett vollständig sichtbar: Das ist dein Team, genau so (auch nach Tausch-Segen, Verkauf oder Verschmelzen)
    S.owned = { ...copies };
  } else {
    // Sonst ergänzen: Die Shop-Karte sagt, wie viele Kopien du hast (0 = keine)
    for (const [line, n] of Object.entries(l.own || {})) { if (n > 0) S.owned[line] = Math.max(n, copies[line] || 0); else if (!copies[line]) delete S.owned[line]; }
    for (const [line, n] of Object.entries(copies)) if ((S.owned[line] || 0) < n) S.owned[line] = n;
  }
  if (l.itemsSeen && l.items) S.items = { ...l.items };
  sel = null; persist(); render();
}

/* ---------- Nachrichten vom Hintergrund ---------- */
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'ping') { reply({ ok: true }); return; }
  if (msg.type === 'toggle') { S.open = !S.open; persist(); render(); }
  if (msg.type === 'show') { S.open = true; S.min = false; persist(); render(); }
  if (msg.type === 'clearShop') { S.shop = [null, null, null, null, null]; sel = null; S.open = true; persist(); render(); }
  reply({ ok: true });
});
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'sync' && ch.server) { init(); }
  else if (area === 'sync' && ch.lang) { langSel = ch.lang.newValue || 'auto'; const l = resolveLang(); if (l !== lang) { lang = l; if (K) K.setLang(lang); } render(); }
  if (area === 'local' && ch.kkLive && ch.kkLive.newValue) applyLive(ch.kkLive.newValue);
  if (area === 'local' && ch.kkCalib) { calibrated = Object.keys(ch.kkCalib.newValue || {}).length > 0; render(); }
  if (area === 'local' && ch.kkField && ch.kkField.newValue && !!ch.kkField.newValue.show !== !!S.fieldShow) { S.fieldShow = !!ch.kkField.newValue.show; persist(); render(); }
  if (area === 'local' && ch.kkBought && ch.kkBought.newValue) { const l = canon(ch.kkBought.newValue.line); S.owned[l] = (S.owned[l] || 0) + 1; persist(); render(); }
});
setInterval(() => { if (liveTs && Date.now() - liveTs > 20000 && Date.now() - liveTs < 26000) render(); }, 5000);

/* ---------- Start ---------- */
async function loadData(force) {
  loadError = ''; K = null; render();
  try {
    const r = await chrome.runtime.sendMessage({ type: 'getData', force: !!force });
    if (!r || !r.ok) throw new Error((r && r.error) || 'keine Antwort');
    D = r; K = window.KKCore.create({ data: r.data, meta: r.meta, de: window.KK_DE, lang });
    S.shop = (S.shop || []).map((l) => (l && (r.data.lines[l] || K.dexOf(l)) ? l : null)).concat([null, null, null, null, null]).slice(0, 5);
    if (S.target && !K.compById[S.target]) S.target = null;
  } catch (e) { loadError = String(e.message || e); }
  render();
}
async function init() {
  const st = await chrome.storage.local.get('ov'); S = { ...DEF, ...(st.ov || {}) };
  const s = await chrome.storage.sync.get({ lang: 'auto', server: '' }); langSel = s.lang || 'auto'; lang = resolveLang(); server = (s.server || '').replace(/\/+$/, '');
  loadData(false);
  const lv = await chrome.storage.local.get(['kkLive', 'kkCalib']); calibrated = Object.keys(lv.kkCalib || {}).length > 0;
  if (lv.kkLive && !lv.kkLive.lobby && Date.now() - lv.kkLive.ts < 20000) { liveTs = lv.kkLive.ts; live = lv.kkLive; }
}
init();
})();
