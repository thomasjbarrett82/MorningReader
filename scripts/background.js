/**************************************************** do something on Chrome start */
chrome.runtime.onInstalled.addListener(() => { });

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
  const d = new Date();
  let currentDay = d.getDay();

  chrome.storage.sync.get(async (data) => {
    LoadReaderLinks(data, currentDay);
  });
});

function LoadReaderLinks(data, currentDay) {
  const { optionsSelectLocation } = data;
  if (optionsSelectLocation == undefined)
    optionsSelectLocation = "existing";

  const { optionsSelectOrder } = data;
  if (optionsSelectOrder == undefined)
    optionsSelectOrder = "list";

  let readerLinks = data["readerLinks"];
  if (readerLinks == undefined) {
    console.log("No reader links are defined."); // DEBUG
    return;
  }
  readerLinks = readerLinks.filter(x => x["days"].charAt(currentDay) === "1");
  if (readerLinks.length === 0) {
    console.log("Nothing to read today."); // DEBUG
    return;
  }

  if (optionsSelectOrder === "random") {
    readerLinks = readerLinks
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  if (optionsSelectLocation === "existing") {
    chrome.windows.getCurrent(async (window) => {
      doAction(window, false, readerLinks);
    });
  }
  else {
    chrome.windows.create({ focused: true }, async (window) => {
      doAction(window, true, readerLinks);
    });
  }
}

function doAction(window, removeHomeTab, readerLinks) {
  readerLinks.forEach(function (o) {
    chrome.tabs.create({
      url: o["url"],
      windowId: window.id,
      selected: false,
    });
  });

  if (removeHomeTab) {
    chrome.tabs.query({ windowId: window.id }, function (tabs) {
      chrome.tabs.remove(tabs[0].id);
    });
  }
}