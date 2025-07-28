document.getElementById('start').onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "START_RECORDING" });
  });
};
document.getElementById('stop').onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "STOP_RECORDING" });
  });
};

// Auto-record toggle
const autoRecordCheckbox = document.getElementById('autoRecord');
chrome.storage.local.get(['aispace_auto_record'], (result) => {
  autoRecordCheckbox.checked = result.aispace_auto_record !== false;
});
autoRecordCheckbox.addEventListener('change', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "TOGGLE_AUTO_RECORD",
      value: autoRecordCheckbox.checked
    });
  });
  chrome.storage.local.set({ aispace_auto_record: autoRecordCheckbox.checked });
});
