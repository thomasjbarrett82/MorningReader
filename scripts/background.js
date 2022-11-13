/**************************************************** do something on Chrome start */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => { });

  let addPageParent = chrome.contextMenus.create({
    "title": "Add current page to Morning Reader",
    "id": "addPageToMorningReader",
    "contexts": ["all"]
  });

  let all = chrome.contextMenus.create({
    "title": "All Days",
    "id": "addPageAllDays",
    "parentId": addPageParent,
    "contexts": ["all"]
  });
  let mwf = chrome.contextMenus.create({
    "title": "M-W-F",
    "id": "addPageMWF",
    "parentId": addPageParent,
    "contexts": ["all"]
  });
  let weekdays = chrome.contextMenus.create({
    "title": "Weekdays",
    "id": "addPageWeekdays",
    "parentId": addPageParent,
    "contexts": ["all"]
  });
  let weekends = chrome.contextMenus.create({
    "title": "Weekends",
    "id": "addPageWeekends",
    "parentId": addPageParent,
    "contexts": ["all"]
  });
});

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

/**************************************************** add current page to context menu */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (tab) {
    onClickContextHandler(info, tab);
  }
});

function onClickContextHandler(info, tab) {
  let days = "0000000";

  switch (info.menuItemId) {
    case "addPageToMorningReader":
      console.log("Context menu for Morning Reader was clicked.");
      return;
    case "addPageAllDays":
      days = "1111111"
      break;
    case "addPageMWF":
      days = "0101010"
      break;
    case "addPageWeekdays":
      days = "0111110"
      break;
    case "addPageWeekends":
      days = "1000001"
      break;
    default:
      return;
  }

  chrome.storage.sync.get(async (items) => {
    readerLinks = items["readerLinks"];
    if (readerLinks == undefined) {
      readerLinks = [];
    }
    readerLinks.push({
      days: days,
      url: tab.url
    });

    let tmpBytes = new Blob([JSON.stringify(readerLinks)]).size;
    if (tmpBytes >= 8192) {
      const notificationId = "" + Math.floor(Math.random() * 100000) + 1;
      const options = {
        type: "basic",
        iconUrl: "images/icon128.png",
        title: "Morning Reader",
        message: "Too many links to read, exceeds 8 KB sync storage size, please delete some first."
      };
      const callback = notificationId => console.log('notificationId: ', notificationId)
      chrome.notifications.create(notificationId, options, callback)
      return;
    }

    chrome.storage.sync.set({
      readerLinks: readerLinks
    });
  });
}
