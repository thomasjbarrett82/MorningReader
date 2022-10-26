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

  // debugging
  document
    .getElementById("clearStorage")
    .addEventListener("click", () => ClearStorage());
}

// debug function
function ClearStorage() {
  result = confirm("Delete Chrome storage sync?");
  if (result) {
    chrome.storage.sync.clear();
  }
}

async function SaveLinkModal() {
  // TODO throw failure if object size will exceed storage
  let tmpReaderLinks = structuredClone(readerLinks);
  tmpReaderLinks.push({
    url: document.getElementById("linkUrl").value,
    mon: document.getElementById("linkMonday").checked,
    tue: document.getElementById("linkTuesday").checked,
    wed: document.getElementById("linkWednesday").checked,
    thu: document.getElementById("linkThursday").checked,
    fri: document.getElementById("linkFriday").checked,
    sat: document.getElementById("linkSaturday").checked,
    sun: document.getElementById("linkSunday").checked,
  });
  let tmpBytes = byteSize(JSON.stringify(tmpReaderLinks));
  if (tmpBytes >= 8192) {
    alert(
      "Too many links to read, exceeds 8 KB storage size, please delete some first."
    );
    return;
  } else {
    alert("Reader links are " + tmpBytes + " KB in size.");
  }

  // TODO save value to chrome storage sync

  linkModal.hide();
}

async function ShowLinkModal(id) {
  await ClearLinkModal();

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

  // TODO focus on URL input

  linkModal.show();
}

async function ClearLinkModal() {
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
  readerLinks.forEach((item, index) =>
    AddItemToLinksList(linksList, index, item["url"])
  );
}

function AddItemToLinksList(linksListElement, index, url) {
  var entry = document.createElement("li");

  var link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("target", "_blank");
  link.innerHTML = url;

  var span = document.createElement("span");
  span.id = index;
  span.classList.add("d-inline-block");
  span.classList.add("align-middle");
  span.classList.add("float-start");
  span.appendChild(link);

  var editIcon = document.createElement("i");
  editIcon.classList.add("bi-pencil-square");

  var editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.classList.add("btn");
  editBtn.classList.add("btn-xs");
  editBtn.classList.add("btn-outline-primary");
  editBtn.id = "editLink" + index;
  editBtn.appendChild(editIcon);

  var delIcon = document.createElement("i");
  delIcon.classList.add("bi-trash");

  var delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.classList.add("btn");
  delBtn.classList.add("btn-xs");
  delBtn.classList.add("btn-outline-danger");
  delBtn.appendChild(delIcon);

  var div = document.createElement("div");
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

  document
    .getElementById("editLink" + index)
    .addEventListener("click", async () => ShowLinkModal(index));
}

/**************************************************** on load */
window.onload = function () {
  AddOptionsListeners();

  // dummy load for initial testing (DELETE LATER)
  chrome.storage.sync.set({
    readerLinks: [
      {
        url: "https://www.bbc.com",
        days: "1010100",
      },
      {
        url: "https://www.usbank.com/index.html",
        days: "1111100",
      },
      {
        url: "https://trello.com/u/tombarrett2/boards",
        days: "0000011",
      },
    ],
  });

  chrome.storage.sync.get(async (items) => LoadDataFromStorage(items));

  linkModal = new bootstrap.Modal(document.getElementById("linkModal"));
};
