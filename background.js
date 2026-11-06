/* GitGraph Live — клик по иконке расширения открывает панель */
chrome.action.onClicked.addListener((tab) => {
  if (tab && tab.id != null && tab.url && /^https:\/\/github\.com\//.test(tab.url)) {
    const p = chrome.tabs.sendMessage(tab.id, { type: 'ggl_open' });
    if (p && p.catch) p.catch(() => {}); // контент-скрипт ещё не вставлен — просто молчим
  }
});
