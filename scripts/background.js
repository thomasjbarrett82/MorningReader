/**************************************************** do something on Chrome start */
chrome.runtime.onInstalled.addListener(() => {});

/**************************************************** listen for storage changes (debugging) */
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key "${key}" in namespace "${namespace}" changed.`,
      `Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});

/**************************************************** execute action on click */
chrome.action.onClicked.addListener(async () => {
  chrome.storage.sync.get("optionsSelectLocation", function (opt) {
    if (opt == undefined || opt.value == "existing") {
      // why double name to get?
      chrome.windows.getCurrent(async (window) => {
        doAction(window, false);
      });
    } else {
      chrome.windows.create({ focused: true }, async (window) => {
        doAction(window, true);
      });
    }
  });
});

function doAction(window, removeHomeTab) {
  // TODO check current date
  // TODO get list of tabs to open
  // TODO get tab open order
  // TODO open tabs

  chrome.tabs.create({
    url: "https://www.bbc.com",
    windowId: window.id,
    selected: false,
  });

  if (removeHomeTab) {
    chrome.tabs.query({ windowId: window.id }, function (tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  }
}

/*

*/
