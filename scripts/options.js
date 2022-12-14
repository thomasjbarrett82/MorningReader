/**************************************************** variables */
var currentOptionsSelectLocation = "existing";
var currentOptionsSelectOrder = "list";
var currentOptionsOpenOnStartup = false;
var readerLinks = [];

var linkModal;
var deleteModal;
var bookmarksModal;

/**************************************************** functions */
const byteSize = (str) => new Blob([str]).size;

async function AddOptionsListeners() {
  // dropdowns
  let location = document.getElementById("optionsSelectLocation");
  location.addEventListener("change", async () => {
    currentOptionsSelectLocation = location.value;
    chrome.storage.sync.set({ optionsSelectLocation: location.value });
  });

  let order = document.getElementById("optionsSelectOrder");
  order.addEventListener("change", async () => {
    currentOptionsSelectOrder = order.value;
    chrome.storage.sync.set({ optionsSelectOrder: order.value });
  });

  let startUp = document.getElementById("optionsOpenOnStartup");
  startUp.addEventListener("change", async () => {
    currentOptionsOpenOnStartup = startUp.checked;
    chrome.storage.sync.set({ optionsOpenOnStartup: startUp.checked });
  });

  // buttons
  document
    .getElementById("addLink")
    .addEventListener("click", async () => ShowLinkModal(-1));

  document
    .getElementById("linkModalSaveChanges")
    .addEventListener("click", async () => SaveLinkModal());

  document
    .getElementById("linkModalSaveChanges")
    .addEventListener("keypress", async (e) => {
      if (e.key == "Enter")
        SaveLinkModal();
    });

  document
    .getElementById("modalDelete")
    .addEventListener("click", async () => DeleteLinkConfirmed());

  document
    .getElementById("modalDelete")
    .addEventListener("keypress", async (e) => {
      if (e.key == "Enter")
        DeleteLinkConfirmed();
    });

  document
    .getElementById("presetAll")
    .addEventListener("click", async function () {
      document.getElementById("linkSunday").checked = true;
      document.getElementById("linkMonday").checked = true;
      document.getElementById("linkTuesday").checked = true;
      document.getElementById("linkWednesday").checked = true;
      document.getElementById("linkThursday").checked = true;
      document.getElementById("linkFriday").checked = true;
      document.getElementById("linkSaturday").checked = true;
    });

  document
    .getElementById("presetNone")
    .addEventListener("click", async function () {
      document.getElementById("linkSunday").checked = false;
      document.getElementById("linkMonday").checked = false;
      document.getElementById("linkTuesday").checked = false;
      document.getElementById("linkWednesday").checked = false;
      document.getElementById("linkThursday").checked = false;
      document.getElementById("linkFriday").checked = false;
      document.getElementById("linkSaturday").checked = false;
    });

  document
    .getElementById("presetMWF")
    .addEventListener("click", async function () {
      document.getElementById("linkSunday").checked = false;
      document.getElementById("linkMonday").checked = true;
      document.getElementById("linkTuesday").checked = false;
      document.getElementById("linkWednesday").checked = true;
      document.getElementById("linkThursday").checked = false;
      document.getElementById("linkFriday").checked = true;
      document.getElementById("linkSaturday").checked = false;
    });

  document
    .getElementById("presetWeekdays")
    .addEventListener("click", async function () {
      document.getElementById("linkSunday").checked = false;
      document.getElementById("linkMonday").checked = true;
      document.getElementById("linkTuesday").checked = true;
      document.getElementById("linkWednesday").checked = true;
      document.getElementById("linkThursday").checked = true;
      document.getElementById("linkFriday").checked = true;
      document.getElementById("linkSaturday").checked = false;
    });

  document
    .getElementById("presetWeekends")
    .addEventListener("click", async function () {
      document.getElementById("linkSunday").checked = true;
      document.getElementById("linkMonday").checked = false;
      document.getElementById("linkTuesday").checked = false;
      document.getElementById("linkWednesday").checked = false;
      document.getElementById("linkThursday").checked = false;
      document.getElementById("linkFriday").checked = false;
      document.getElementById("linkSaturday").checked = true;
    });

  document
    .getElementById("importBookmarks")
    .addEventListener("click", async () => ShowBookmarksModal());

  document
    .getElementById("bookmarksImportConfirm")
    .addEventListener("click", async () => ImportSelectedBookmarks());

  document
    .getElementById("saveToFile")
    .addEventListener("click", async () => SaveReaderLinksToFile());

  document
    .getElementById("loadFromFile")
    .addEventListener("click", async () => LoadReaderLinksFromFile());

  // inputs
  document
    .getElementById("linkUrl")
    .addEventListener("keypress", async (e) => {
      if (e.key == "Enter")
        SaveLinkModal();
    });

  // modal
  document
    .getElementById("linkModal")
    .addEventListener("shown.bs.modal", () => {
      document.getElementById("linkUrl").focus();
    });
}

async function LoadReaderLinksFromFile() {
  const options = {
    startIn: "documents",
    types: [
      {
        accept: {
          "application/json": [".json"]
        }
      }
    ],
    excludeAcceptAllOption: true,
    multiple: false
  };

  const [fileHandle] = await window.showOpenFilePicker(options);
  const file = await fileHandle.getFile();
  const fileText = await file.text();
  const newReaderLinks = JSON.parse(fileText);

  newReaderLinks.forEach(async (item) => {
    readerLinks.push({
      days: item.days,
      url: item.url
    });
  });

  chrome.storage.sync.set({
    readerLinks: readerLinks
  });

  ReloadReaderLinks();
}

async function SaveReaderLinksToFile() {
  let blob = new Blob([JSON.stringify(readerLinks)], { type: "application/json" });
  let blobUrl = window.URL.createObjectURL(blob);

  chrome.downloads.download({
    url: blobUrl,
    filename: "readerLinks_" + new Date().toJSON().slice(0, 10) + ".json"
  });

  const notificationId = "" + Math.floor(Math.random() * 100000) + 1;
  const options = {
    type: "basic",
    iconUrl: "images/icon128.png",
    title: "Morning Reader",
    message: "Reader links downloaded as JSON file."
  };
  const callback = notificationId => console.log('notificationId: ', notificationId)
  chrome.notifications.create(notificationId, options, callback)
}

async function ImportSelectedBookmarks() {
  let bookmarksListItems = document
    .getElementById("bookmarksModalList")
    .getElementsByTagName("li");

  for (var i = 0; i < bookmarksListItems.length; i++) {
    let item = bookmarksListItems[i].firstChild;
    if (item.checked) {
      readerLinks.push({
        days: "0000000",
        url: item.id
      });
    }
  }

  chrome.storage.sync.set({
    readerLinks: readerLinks
  });

  ReloadReaderLinks();

  bookmarksModal.hide();
}

async function ShowBookmarksModal() {
  let bookmarksList = document.getElementById("bookmarksModalList");
  bookmarksList.innerHTML = "";

  chrome.bookmarks.getTree(function (tree) {
    tree.forEach(function (item) {
      ProcessBookmarkNode(item, 0, bookmarksList);
    })
  });

  bookmarksModal.show();
}

function ProcessBookmarkNode(node, level, bookmarksList) {
  if (node.children) {
    AddBookmarkNodeItem(bookmarksList, node.title, level, false);
    node.children.forEach(function (child) {
      ProcessBookmarkNode(child, level + 2, bookmarksList);
    })
  }

  if (node.url) {
    AddBookmarkNodeItem(bookmarksList, node.url, level, true);
  }
}

function AddBookmarkNodeItem(bookmarksList, nodeText, level, isUrl) {
  let spacing = "\xa0".repeat(level);

  let entry = document.createElement("li");
  entry.classList.add("list-group-item");

  if (isUrl) {
    let nodeInput = document.createElement("input");
    nodeInput.type = "checkbox";
    nodeInput.value = "";
    nodeInput.classList.add("form-check-input");
    nodeInput.classList.add("me-1");
    nodeInput.id = nodeText;
    entry.appendChild(nodeInput);

    let nodeLabel = document.createElement("label");
    nodeLabel.classList.add("form-check-label");
    nodeLabel.classList.add("stretched-link");
    nodeLabel.htmlFor = nodeText;
    nodeLabel.innerHTML = spacing + nodeText;
    entry.appendChild(nodeLabel);
  }
  else {
    let nodeLabel = document.createElement("label");
    nodeLabel.classList.add("form-check-label");
    nodeLabel.classList.add("fw-bold");
    nodeLabel.innerHTML = spacing + nodeText;
    entry.appendChild(nodeLabel);
  }

  bookmarksList.appendChild(entry);
}

async function SaveLinkModal() {
  // stop if object size will exceed storage
  let tmpReaderLinks = structuredClone(readerLinks);
  let newDays = ""
    + (+document.getElementById("linkSunday").checked)
    + (+document.getElementById("linkMonday").checked)
    + (+document.getElementById("linkTuesday").checked)
    + (+document.getElementById("linkWednesday").checked)
    + (+document.getElementById("linkThursday").checked)
    + (+document.getElementById("linkFriday").checked)
    + (+document.getElementById("linkSaturday").checked);
  let newUrl = document.getElementById("linkUrl").value;
  let linkIndex = document.getElementById("modalId").innerHTML;

  if (linkIndex == -1) {
    tmpReaderLinks.push({
      days: newDays,
      url: newUrl
    });
  }
  else {
    tmpReaderLinks[linkIndex].days = newDays;
    tmpReaderLinks[linkIndex].url = newUrl;
  }
  let tmpBytes = byteSize(JSON.stringify(tmpReaderLinks));
  if (tmpBytes >= 8192) {
    alert(
      "Too many links to read, exceeds 8 KB sync storage size, please delete some first."
    );
    return;
  } else {
    // save value to chrome storage sync and reload links
    readerLinks = tmpReaderLinks;
    chrome.storage.sync.set({
      readerLinks: tmpReaderLinks
    });

    ReloadReaderLinks();
  }

  linkModal.hide();
}

async function ShowLinkModal(id) {
  ClearLinkModal();

  if (id != undefined && id >= 0) {
    let obj = readerLinks[id];

    document.getElementById("linkUrl").value = obj["url"];

    document.getElementById("linkSunday").checked = parseInt(
      obj["days"].charAt(0)
    );
    document.getElementById("linkMonday").checked = parseInt(
      obj["days"].charAt(1)
    );
    document.getElementById("linkTuesday").checked = parseInt(
      obj["days"].charAt(2)
    );
    document.getElementById("linkWednesday").checked = parseInt(
      obj["days"].charAt(3)
    );
    document.getElementById("linkThursday").checked = parseInt(
      obj["days"].charAt(4)
    );
    document.getElementById("linkFriday").checked = parseInt(
      obj["days"].charAt(5)
    );
    document.getElementById("linkSaturday").checked = parseInt(
      obj["days"].charAt(6)
    );
    document.getElementById("modalId").innerHTML = id;
  }

  linkModal.show();
}

function DeleteLinkModal(id, title, body) {
  document.getElementById("deleteId").innerHTML = id;
  document.getElementById("deleteModalTitle").innerHTML = title;
  document.getElementById("deleteModalBody").innerHTML = body;

  deleteModal.show();
}

async function DeleteLinkConfirmed() {
  let linkIndex = document.getElementById("deleteId").innerHTML;
  readerLinks.splice(linkIndex, 1);

  chrome.storage.sync.set({
    readerLinks: readerLinks
  });

  ReloadReaderLinks();

  deleteModal.hide();
}

function ReloadReaderLinks() {
  document.getElementById("linksList").innerHTML = "";
  readerLinks.forEach((item, index) =>
    AddItemToLinksList(linksList, index, item["url"])
  );
}

// moving down in list means index goes up
function MoveLinkDown(index) {
  if (index === readerLinks.length - 1) {
    return;
  }
  [readerLinks[index], readerLinks[index + 1]] = [readerLinks[index + 1], readerLinks[index]];

  chrome.storage.sync.set({
    readerLinks: readerLinks
  });

  ReloadReaderLinks();
}

// moving up in list means index goes down
function MoveLinkUp(index) {
  if (index === 0) {
    return;
  }
  [readerLinks[index], readerLinks[index - 1]] = [readerLinks[index - 1], readerLinks[index]];

  chrome.storage.sync.set({
    readerLinks: readerLinks
  });

  ReloadReaderLinks();
}

function ClearLinkModal() {
  document.getElementById("linkUrl").value = "";
  document.getElementById("modalId").innerHTML = -1;

  document.getElementById("linkSunday").checked = false;
  document.getElementById("linkMonday").checked = false;
  document.getElementById("linkTuesday").checked = false;
  document.getElementById("linkWednesday").checked = false;
  document.getElementById("linkThursday").checked = false;
  document.getElementById("linkFriday").checked = false;
  document.getElementById("linkSaturday").checked = false;
}

async function LoadDataFromStorage(items) {
  // dropdowns
  const { optionsSelectLocation } = items;
  if (optionsSelectLocation != undefined) {
    let e = document.getElementById("optionsSelectLocation");
    e.value = optionsSelectLocation;
    currentOptionsSelectLocation = optionsSelectLocation;
  }

  const { optionsSelectOrder } = items;
  if (optionsSelectOrder != undefined) {
    let e = document.getElementById("optionsSelectOrder");
    e.value = optionsSelectOrder;
    currentOptionsSelectOrder = optionsSelectOrder;
  }

  const { optionsOpenOnStartup } = items;
  if (optionsOpenOnStartup != undefined) {
    let e = document.getElementById("optionsOpenOnStartup");
    e.checked = optionsOpenOnStartup;
    currentOptionsOpenOnStartup = optionsOpenOnStartup;
  }

  // links
  let linksList = document.getElementById("linksList");
  readerLinks = items["readerLinks"];
  if (readerLinks == undefined) {
    readerLinks = [];
  }
  readerLinks.forEach((item, index) =>
    AddItemToLinksList(linksList, index, item["url"])
  );
}

function AddItemToLinksList(linksListElement, index, url) {
  let entry = document.createElement("li");
  entry.classList.add("list-group-item");

  let link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("target", "_blank");
  link.innerHTML = url;

  let span = document.createElement("span");
  span.id = index;
  span.classList.add("d-inline-block");
  span.classList.add("align-middle");
  span.classList.add("float-start");
  span.appendChild(link);

  let upIcon = document.createElement("i");
  upIcon.classList.add("bi-arrow-up");

  let upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.classList.add("btn");
  upBtn.classList.add("btn-xs");
  upBtn.classList.add("btn-outline-primary");
  upBtn.id = "up" + index;
  upBtn.appendChild(upIcon);
  upBtn.addEventListener("click", async () => MoveLinkUp(index), true);

  let downIcon = document.createElement("i");
  downIcon.classList.add("bi-arrow-down");

  let downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.classList.add("btn");
  downBtn.classList.add("btn-xs");
  downBtn.classList.add("btn-outline-primary");
  downBtn.id = "down" + index;
  downBtn.appendChild(downIcon);
  downBtn.addEventListener("click", async () => MoveLinkDown(index), true);

  let editIcon = document.createElement("i");
  editIcon.classList.add("bi-pencil-square");

  let editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.classList.add("btn");
  editBtn.classList.add("btn-xs");
  editBtn.classList.add("btn-outline-primary");
  editBtn.id = "editLink" + index;
  editBtn.appendChild(editIcon);
  editBtn.addEventListener("click", () => ShowLinkModal(index), true);

  let delIcon = document.createElement("i");
  delIcon.classList.add("bi-trash");

  let delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.classList.add("btn");
  delBtn.classList.add("btn-xs");
  delBtn.classList.add("btn-outline-danger");
  delBtn.id = "deleteLink" + index;
  delBtn.appendChild(delIcon);
  delBtn.addEventListener("click", () => DeleteLinkModal(index, "Confirm delete", "Delete link " + url + "?"), true);

  let div = document.createElement("div");
  div.classList.add("align-middle");
  div.classList.add("btn-group");
  div.classList.add("float-end");
  div.setAttribute("role", "group");
  div.appendChild(upBtn);
  div.appendChild(downBtn);
  div.appendChild(editBtn);
  div.appendChild(delBtn);

  entry.appendChild(span);
  entry.appendChild(div);

  linksListElement.appendChild(entry);
}

/**************************************************** on load */
window.onload = function () {
  AddOptionsListeners();

  chrome.storage.sync.get(async (items) => LoadDataFromStorage(items));

  linkModal = new bootstrap.Modal(document.getElementById("linkModal"));
  deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  bookmarksModal = new bootstrap.Modal(document.getElementById("bookmarksModal"));
};
