// When a tab is updated (e.g., URL changes), check if it's no longer a Meet/Zoom meeting
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.url && // URL changed
    !changeInfo.url.match(/(meet\.google\.com|zoom\.us)/) // Not a meeting anymore
  ) {
    chrome.tabs.sendMessage(tabId, { action: "STOP_RECORDING" });
  }
});

// When a tab is closed, send a stop recording message (for cleanup)
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  // Note: This only works if the content script is still running (not always possible on tab close)
  // It's mainly for completeness; content.js should also handle 'beforeunload'
  chrome.tabs.sendMessage(tabId, { action: "STOP_RECORDING" });
});