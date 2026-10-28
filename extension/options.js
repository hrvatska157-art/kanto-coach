'use strict';
const $ = (s) => document.querySelector(s);
const TXT = {
  de: { title: 'Einstellungen', lang: 'Sprache', src: 'Datenquelle', server: 'Adresse deines Coach-Servers (optional)',
    serverhint: 'Läuft der Coach auf deinem Unraid-Server oder PC, trag hier seine Adresse ein. Dann kommen Daten und Bilder von dort (zwischengespeichert). Leer lassen = direkt von einoow.com.',
    save: 'Speichern', test: 'Verbindung testen', keys: 'Tastenkürzel', resetpos: 'Overlay-Position zurücksetzen', about: 'Über',
    saved: 'Gespeichert.', bad: 'Bitte eine Adresse mit http:// oder https:// eingeben.', denied: 'Zugriff auf diese Adresse wurde nicht erlaubt.',
    auto: 'Spiel-Erkennung', autolabel: 'Shop, Bank, Item-Beutel, Level und Gold automatisch erkennen, passende Pokémon und Items im Spiel einkreisen', autohint: 'Gelesen wird nur, was im Spiel sichtbar ist: die Bilder der Shop-Karten, der Bank und des Beutels (Pokédex-Nummer bzw. Item-Name stehen im Bildpfad) sowie die Level- und Gold-Anzeige. Das klappt in jeder Spielsprache. Es wird nichts geklickt, gekauft oder verschickt. Ausgeschaltet trägst du alles im Overlay von Hand ein.',
    keyshint: 'Alt+K blendet das Overlay ein und aus, Alt+R leert den Shop nach dem Neu-Würfeln. Ändern kannst du sie unter chrome://extensions/shortcuts.',
    abouttext: 'Inoffizielles Fan-Tool, nicht mit dem Spiel verbunden. Das Overlay liest nur, was im Spiel sichtbar ist (Shop, Bank, Item-Beutel, Level, Gold), automatisiert nichts und sendet keine Daten über dich. Comps, Werte und Ranglisten kommen ausschließlich über die öffentliche API. Daten: Kanto Tactics · einoow.com. Bilder: PokéAPI-Sprites.',
    calib: 'Feld-Schablone', calibhint: 'Die Platzierung auf dem Spielfeld richtest du im Overlay unter „Plan“ → „Schablone ausrichten“ ein – einfacher ist meist „Plan ins Spiel übernehmen“. Gespeichert wird je Fenstergröße.', resetcalib: 'Ausrichtung löschen', calibReset: 'Ausrichtung gelöscht.',
    ok: (n) => `Verbindung klappt: ${n} Comps gefunden.`, fail: (e) => `Keine Verbindung: ${e}`, testing: 'Teste …', posReset: 'Position zurückgesetzt.' },
  en: { title: 'Settings', lang: 'Language', src: 'Data source', server: 'Address of your Coach server (optional)',
    serverhint: 'If the Coach runs on your Unraid server or PC, enter its address here. Data and images then come from there (cached). Leave empty to load directly from einoow.com.',
    save: 'Save', test: 'Test connection', keys: 'Keyboard shortcuts', resetpos: 'Reset overlay position', about: 'About',
    saved: 'Saved.', bad: 'Please enter an address starting with http:// or https://.', denied: 'Access to this address was not allowed.',
    auto: 'Game detection', autolabel: 'Detect shop, bench, item bag, level and gold automatically and circle matching Pokémon and items in the game', autohint: 'Only what is visible in the game is read: the pictures of the shop cards, bench and bag (the Pokédex number or item name is part of the image path) plus the level and gold display. Works in every game language. Nothing is clicked, bought or sent. When off, you enter everything in the overlay by hand.',
    keyshint: 'Alt+K shows and hides the overlay, Alt+R clears the shop after a reroll. You can change them at chrome://extensions/shortcuts.',
    abouttext: 'Unofficial fan tool, not affiliated with the game. The overlay only reads what is visible in the game (shop, bench, item bag, level, gold), automates nothing and sends no data about you. Comps, stats and rankings come only from the public API. Data: Kanto Tactics · einoow.com. Images: PokéAPI sprites.',
    calib: 'Board template', calibhint: 'You align the placement on the board in the overlay under “Plan” → “Align template” – usually “Send plan to the game” is easier. It is saved per window size.', resetcalib: 'Delete alignment', calibReset: 'Alignment deleted.',
    ok: (n) => `Connection works: ${n} comps found.`, fail: (e) => `No connection: ${e}`, testing: 'Testing …', posReset: 'Position reset.' },
};
let T = TXT.de;
function apply(sel) {
  const lang = sel === 'de' || sel === 'en' ? sel : (/^de\b/i.test(navigator.language) ? 'de' : 'en');
  T = TXT[lang]; document.documentElement.lang = lang;
  $('#t-title').textContent = T.title; $('#t-lang').textContent = T.lang; $('#t-src').textContent = T.src; $('#t-server').textContent = T.server;
  $('#t-serverhint').textContent = T.serverhint; $('#save').textContent = T.save; $('#test').textContent = T.test; $('#t-keys').textContent = T.keys;
  $('#resetpos').textContent = T.resetpos; $('#t-about').textContent = T.about;
  $('#t-keyshint').textContent = T.keyshint; $('#t-abouttext').textContent = T.abouttext;
  $('#t-calib').textContent = T.calib; $('#t-calibhint').textContent = T.calibhint; $('#resetcalib').textContent = T.resetcalib;
  $('#t-auto').textContent = T.auto; $('#t-autolabel').textContent = T.autolabel; $('#t-autohint').textContent = T.autohint;
}
function origin(u) { try { const x = new URL(u); if (!/^https?:$/.test(x.protocol)) return null; return x.origin; } catch (e) { return null; } }
async function askPermission(url) {
  const o = origin(url); if (!o) return false;
  if (o === 'https://einoow.com') return true;
  return chrome.permissions.request({ origins: [o + '/*'] });
}
(async () => {
  const s = await chrome.storage.sync.get({ lang: 'auto', server: '', autoShop: true });
  $('#lang').value = s.lang; $('#server').value = s.server; $('#autoShop').checked = s.autoShop !== false; apply(s.lang);
  $('#autoShop').onchange = async () => { await chrome.storage.sync.set({ autoShop: $('#autoShop').checked }); $('#msg').textContent = T.saved; };
  $('#lang').onchange = async () => { await chrome.storage.sync.set({ lang: $('#lang').value }); apply($('#lang').value); $('#msg').textContent = T.saved; };
  $('#save').onclick = async () => {
    const v = $('#server').value.trim().replace(/\/+$/, '');
    if (v && !origin(v)) { $('#msg').textContent = T.bad; return; }
    if (v && !(await askPermission(v))) { $('#msg').textContent = T.denied; return; }
    await chrome.storage.sync.set({ server: v }); await chrome.storage.local.remove(['fetchedAt']);
    $('#msg').textContent = T.saved;
  };
  $('#test').onclick = async () => {
    const v = $('#server').value.trim().replace(/\/+$/, '');
    if (!v || !origin(v)) { $('#msg').textContent = T.bad; return; }
    if (!(await askPermission(v))) { $('#msg').textContent = T.denied; return; }
    $('#msg').textContent = T.testing;
    try { const r = await fetch(v + '/api/meta.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status); const j = await r.json(); $('#msg').textContent = T.ok((j.comps || []).length); }
    catch (e) { $('#msg').textContent = T.fail(e.message); }
  };
  $('#resetcalib').onclick = async () => { await chrome.storage.local.set({ kkCalib: {} }); $('#msg').textContent = T.calibReset; };
  $('#resetpos').onclick = async () => { const st = await chrome.storage.local.get('ov'); const ov = st.ov || {}; ov.x = null; ov.y = 90; ov.open = true; ov.min = false; await chrome.storage.local.set({ ov }); $('#msg').textContent = T.posReset; };
})();
