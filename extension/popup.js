'use strict';
const $ = (s) => document.querySelector(s);
const TXT = {
  de: { open: 'Overlay öffnen', refresh: 'Daten aktualisieren', options: 'Einstellungen', site: 'Coach-Website öffnen ↗', play: 'Kanto Tactics spielen ↗',
    onGame: 'Du bist im Spiel. Das Overlay öffnet sich hier.', other: 'Öffnet das Overlay im aktuellen Tab. Am besten im Spiel unter einoow.com/kanto-tactics.',
    cannot: 'Auf dieser Seite kann das Overlay nicht geöffnet werden (z. B. Chrome-Einstellungen).', loaded: (d, s) => `Datenstand: ${d} (${s})`, none: 'Noch keine Daten geladen.', refreshing: 'Aktualisiere …', refreshed: 'Daten aktualisiert.', keys: 'Tastenkürzel: Alt+K Overlay, Alt+R Shop leeren.', credit: 'Daten: Kanto Tactics · einoow.com. Inoffizielles Fan-Tool.', failed: (e) => `Fehler: ${e}` },
  en: { open: 'Open overlay', refresh: 'Refresh data', options: 'Settings', site: 'Open Coach website ↗', play: 'Play Kanto Tactics ↗',
    onGame: 'You are in the game. The overlay opens here.', other: 'Opens the overlay in the current tab. Best inside the game at einoow.com/kanto-tactics.',
    cannot: 'The overlay cannot open on this page (e.g. Chrome settings).', loaded: (d, s) => `Data from: ${d} (${s})`, none: 'No data loaded yet.', refreshing: 'Refreshing …', refreshed: 'Data refreshed.', keys: 'Shortcuts: Alt+K overlay, Alt+R clear shop.', credit: 'Data: Kanto Tactics · einoow.com. Unofficial fan tool.', failed: (e) => `Error: ${e}` },
};
(async () => {
  const s = await chrome.storage.sync.get({ lang: 'auto', server: '' });
  const L = s.lang === 'de' || s.lang === 'en' ? s.lang : (/^de\b/i.test(navigator.language) ? 'de' : 'en'); const T = TXT[L];
  document.documentElement.lang = L;
  $('#play').textContent = T.play; $('#keys').textContent = T.keys; $('#credit').textContent = T.credit;
  $('#open').textContent = T.open; $('#refresh').textContent = T.refresh; $('#options').textContent = T.options;
  if (s.server) { const a = $('#site'); a.hidden = false; a.href = s.server.replace(/\/+$/, '') + '/'; a.textContent = T.site; }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = (tab && tab.url) || '';
  $('#where').textContent = /^https:\/\/einoow\.com\/(kanto-tactics|pvp|duo|tower|nuzlocke|play\/kanto-tactics|playables\/kanto-tactics)([/?#]|$)/.test(url) ? T.onGame : T.other;
  const status = async () => {
    const r = await chrome.runtime.sendMessage({ type: 'status' });
    $('#status').textContent = r && r.fetchedAt ? T.loaded(new Date(r.fetchedAt).toLocaleString(s.lang === 'en' ? 'en-GB' : 'de-DE'), r.source || '') : T.none;
  };
  status();
  $('#open').onclick = async () => {
    const r = await chrome.runtime.sendMessage({ type: 'openOverlay', tabId: tab.id });
    if (r && r.ok) window.close(); else $('#where').textContent = T.cannot;
  };
  $('#refresh').onclick = async () => {
    $('#status').textContent = T.refreshing;
    const r = await chrome.runtime.sendMessage({ type: 'getData', force: true });
    if (r && r.ok) { await status(); $('#status').textContent += ' · ' + T.refreshed; } else $('#status').textContent = T.failed((r && r.error) || '?');
  };
  $('#options').onclick = () => chrome.runtime.openOptionsPage();
})();
