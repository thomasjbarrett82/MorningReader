/**************************************************** variables */
var optionsSelectLocation = "existing";
var optionsSelectOrder = "list";
var readerLinks = []; /* data object */

var linkModal;

/**************************************************** functions */
const byteSize = (str) => new Blob([str]).size;

async function AddOptionsListeners() {
  // dropdowns
  let location = document.getElementById("optionsSelectLocation");
  location.addEventListener("change", async () => {
    optionsSelectLocation = location.value;
    chrome.storage.sync.set({ optionsSelectLocation: location.value });
  });

  let order = document.getElementById("optionsSelectOrder");
  order.addEventListener("change", async () => {
    optionsSelectOrder = order.value;
    chrome.storage.sync.set({ optionsSelectOrder: order.value });
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

  // inputs
  document
    .getElementById("linkUrl")
    .addEventListener("keypress", async (e) => {
      if (e.key == "Enter")
        SaveLinkModal();
    });

  // debugging
  document
    .getElementById("clearStorage")
    .addEventListener("click", () => ClearStorage());

  // modal
  document
    .getElementById("linkModal")
    .addEventListener("shown.bs.modal", () => {
      document.getElementById("linkUrl").focus();
    });
}

// debug function
function ClearStorage() {
  result = confirm("Delete Chrome storage sync?");
  if (result) {
    chrome.storage.sync.clear();
  }
}

async function SaveLinkModal() {
  // stop if object size will exceed storage
  let tmpReaderLinks = structuredClone(readerLinks);
  let newDays = "" + (+document.getElementById("linkMonday").checked)
    + (+document.getElementById("linkTuesday").checked)
    + (+document.getElementById("linkWednesday").checked)
    + (+document.getElementById("linkThursday").checked)
    + (+document.getElementById("linkFriday").checked)
    + (+document.getElementById("linkSaturday").checked)
    + (+document.getElementById("linkSunday").checked);
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

    document.getElementById("linksList").innerHTML = "";
    readerLinks.forEach((item, index) =>
      AddItemToLinksList(linksList, index, item["url"])
    );
  }

  linkModal.hide();
}

async function ShowLinkModal(id) {
  ClearLinkModal();

  if (id != undefined && id >= 0) {
    let obj = readerLinks[id];

    document.getElementById("linkUrl").value = obj["url"];

    document.getElementById("linkMonday").checked = parseInt(
      obj["days"].charAt(0)
    );
    document.getElementById("linkTuesday").checked = parseInt(
      obj["days"].charAt(1)
    );
    document.getElementById("linkWednesday").checked = parseInt(
      obj["days"].charAt(2)
    );
    document.getElementById("linkThursday").checked = parseInt(
      obj["days"].charAt(3)
    );
    document.getElementById("linkFriday").checked = parseInt(
      obj["days"].charAt(4)
    );
    document.getElementById("linkSaturday").checked = parseInt(
      obj["days"].charAt(5)
    );
    document.getElementById("linkSunday").checked = parseInt(
      obj["days"].charAt(6)
    );
    document.getElementById("modalId").innerHTML = id;
  }

  linkModal.show();
}

function ClearLinkModal() {
  document.getElementById("linkUrl").value = "";
  document.getElementById("modalId").innerHTML = -1;

  document.getElementById("linkMonday").checked = false;
  document.getElementById("linkTuesday").checked = false;
  document.getElementById("linkWednesday").checked = false;
  document.getElementById("linkThursday").checked = false;
  document.getElementById("linkFriday").checked = false;
  document.getElementById("linkSaturday").checked = false;
  document.getElementById("linkSunday").checked = false;
}

async function LoadDataFromStorage(items) {
  // dropdowns
  const { tmpOptionsSelectLocation } = items;
  if (tmpOptionsSelectLocation != undefined) {
    let e = document.getElementById("optionsSelectLocation");
    e.value = tmpOptionsSelectLocation;
    optionsSelectLocation = tmpOptionsSelectLocation;
  }

  const { tmpOptionsSelectOrder } = items;
  if (tmpOptionsSelectOrder != undefined) {
    let e = document.getElementById("optionsSelectOrder");
    e.value = tmpOptionsSelectOrder;
    optionsSelectOrder = tmpOptionsSelectOrder;
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
  delBtn.appendChild(delIcon);

  let div = document.createElement("div");
  div.classList.add("align-middle");
  div.classList.add("btn-group");
  div.classList.add("float-end");
  div.setAttribute("role", "group");
  div.appendChild(editBtn);
  div.appendChild(delBtn);

  entry.appendChild(span);
  entry.appendChild(div);
  entry.classList.add("list-group-item");

  linksListElement.appendChild(entry);
}

/**************************************************** on load */
window.onload = function () {
  AddOptionsListeners();

  chrome.storage.sync.get(async (items) => LoadDataFromStorage(items));

  linkModal = new bootstrap.Modal(document.getElementById("linkModal"));
};
