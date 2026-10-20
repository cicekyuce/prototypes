// Notifications inbox prototype — content mirrors Figma frame 1282:2824
// ("Noification inbox", page "✨ Navigation 2 (final) ✨" of App Architecture).
// Search and swipe-to-delete are not designed in Figma yet; see README notes
// in the chat handoff. State is in memory only, so a page refresh restores
// every notification.

// Icons keep their intrinsic SVG dimensions as exported from Figma.
const CATEGORIES = {
  offer: { label: "Offer", icon: "assets/tag-offer.svg" },
  usage: { label: "Usage", icon: "assets/tag-usage.svg" },
  rewards: { label: "Rewards", icon: "assets/tag-rewards.svg" },
  network: { label: "Network", icon: "assets/tag-network.svg" },
  billing: { label: "Billing", icon: "assets/tag-billing.svg" },
};

const FILTERS = [
  { id: "all", label: "View all" },
  { id: "offer", label: "Offers" },
  { id: "rewards", label: "Rewards" },
  { id: "billing", label: "Billing" },
  { id: "network", label: "Network" },
];

const GROUPS = [
  { id: "this-week", label: "THIS WEEK" },
  { id: "last-30-days", label: "LAST 30 DAYS" },
];

const SEED_NOTIFICATIONS = [
  {
    id: "n1",
    group: "this-week",
    title: "Stay connected on and off the grid. Get iPhone 17 with built-in eSIM for Absolute Zero.",
    category: "offer",
    timestamp: "3 hours ago",
    unread: true,
  },
  {
    id: "n2",
    group: "this-week",
    title: "Limited-Time Data Bonus",
    category: "usage",
    timestamp: "14 hours ago",
    unread: true,
  },
  {
    id: "n3",
    group: "last-30-days",
    title: "Exclusive App-Only Offer",
    category: "rewards",
    timestamp: "2026-12-03",
    unread: false,
  },
  {
    id: "n4",
    group: "last-30-days",
    title: "Roam More for Less",
    category: "network",
    timestamp: "2026-12-02",
    unread: false,
  },
  {
    id: "n5",
    group: "last-30-days",
    title: "Upgrade your Plan, Keep Your Price",
    category: "billing",
    timestamp: "2026-12-01",
    unread: true,
  },
];

// Swipe geometry — keep in sync with --swipe-action-width in styles.css.
const ACTION_WIDTH = 88;
const OPEN_THRESHOLD = 40;
const DELETE_THRESHOLD = 180;
const DRAG_TOLERANCE = 6;

let notifications = SEED_NOTIFICATIONS.map((notification) => ({ ...notification }));
let activeFilter = "all";
let searchTerm = "";
let openRow = null;

const screens = {
  home: document.getElementById("screen-home"),
  inbox: document.getElementById("screen-inbox"),
};
const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("notification-list");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
    if (key === name) el.scrollTop = 0;
  });
}

function closeOpenRow() {
  if (!openRow) return;
  setRowOffset(openRow, 0, true);
  openRow = null;
}

function setRowOffset(row, offset, animate) {
  row.classList.toggle("settling", Boolean(animate));
  row.style.transform = `translateX(${offset}px)`;
}

function matchesSearch(notification) {
  if (!searchTerm) return true;
  const haystack = `${notification.title} ${CATEGORIES[notification.category].label}`.toLowerCase();
  return haystack.includes(searchTerm);
}

function visibleNotifications() {
  return notifications.filter(
    (notification) =>
      (activeFilter === "all" || notification.category === activeFilter) && matchesSearch(notification)
  );
}

function renderFilters() {
  filtersEl.replaceChildren(
    ...FILTERS.map((filter) => {
      const chip = document.createElement("button");
      chip.className = "chip";
      chip.type = "button";
      chip.textContent = filter.label;
      chip.setAttribute("role", "tab");
      chip.setAttribute("aria-selected", String(filter.id === activeFilter));
      chip.addEventListener("click", () => {
        activeFilter = filter.id;
        renderFilters();
        renderList();
      });
      return chip;
    })
  );
}

function createSticker(categoryId) {
  const category = CATEGORIES[categoryId];
  const sticker = document.createElement("span");
  sticker.className = "sticker";
  sticker.dataset.category = categoryId;

  const icon = document.createElement("img");
  icon.src = category.icon;
  icon.alt = "";

  const label = document.createElement("span");
  label.textContent = category.label;

  sticker.append(icon, label);
  return sticker;
}

function trashIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5l.7 10a1.5 1.5 0 0 0 1.5 1.4h4.6a1.5 1.5 0 0 0 1.5-1.4l.7-10" ' +
    'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
  return svg;
}

function deleteNotification(id, wrapper) {
  if (openRow) openRow = null;
  const index = notifications.findIndex((notification) => notification.id === id);
  if (index === -1) return;
  notifications.splice(index, 1);

  wrapper.style.height = `${wrapper.offsetHeight}px`;
  wrapper.classList.add("removing");
  requestAnimationFrame(() => {
    wrapper.style.height = "0px";
  });
  window.setTimeout(renderList, 180);
}

function attachSwipe(row, notification, wrapper) {
  let startX = 0;
  let startOffset = 0;
  let offset = 0;
  let dragging = false;
  let moved = false;

  row.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (openRow && openRow !== row) closeOpenRow();
    dragging = true;
    moved = false;
    startX = event.clientX;
    startOffset = openRow === row ? -ACTION_WIDTH : 0;
    offset = startOffset;
    row.setPointerCapture(event.pointerId);
    row.classList.remove("settling");
  });

  row.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > DRAG_TOLERANCE) moved = true;
    offset = Math.min(0, startOffset + delta);
    setRowOffset(row, offset, false);
  });

  const finish = (event) => {
    if (!dragging) return;
    dragging = false;
    if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId);

    if (-offset >= DELETE_THRESHOLD) {
      setRowOffset(row, -wrapper.offsetWidth, true);
      deleteNotification(notification.id, wrapper);
      return;
    }
    if (-offset >= OPEN_THRESHOLD) {
      setRowOffset(row, -ACTION_WIDTH, true);
      openRow = row;
      return;
    }
    setRowOffset(row, 0, true);
    if (openRow === row) openRow = null;
  };

  row.addEventListener("pointerup", finish);
  row.addEventListener("pointercancel", finish);

  row.addEventListener("click", (event) => {
    if (moved) {
      event.preventDefault();
      return;
    }
    if (openRow === row) {
      closeOpenRow();
      return;
    }
    notification.unread = false;
    row.dataset.unread = "false";
  });

  row.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      deleteNotification(notification.id, wrapper);
    }
  });
}

function createRow(notification) {
  const wrapper = document.createElement("div");
  wrapper.className = "swipe";

  const action = document.createElement("div");
  action.className = "swipe-action";
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete notification: ${notification.title}`);
  const deleteLabel = document.createElement("span");
  deleteLabel.textContent = "Delete";
  deleteButton.append(trashIcon(), deleteLabel);
  deleteButton.addEventListener("click", () => deleteNotification(notification.id, wrapper));
  action.append(deleteButton);

  const row = document.createElement("button");
  row.className = "row";
  row.type = "button";
  row.dataset.unread = String(notification.unread);

  const message = document.createElement("div");
  message.className = "row-message";

  const status = document.createElement("div");
  status.className = "row-status";
  const dot = document.createElement("span");
  dot.className = "row-dot";
  status.append(dot);

  const body = document.createElement("div");
  body.className = "row-body";

  const title = document.createElement("p");
  title.className = "row-title";
  title.textContent = notification.title;

  const meta = document.createElement("div");
  meta.className = "row-meta";
  const timestamp = document.createElement("span");
  timestamp.className = "timestamp";
  timestamp.textContent = notification.timestamp;
  meta.append(createSticker(notification.category), timestamp);

  body.append(title, meta);
  message.append(status, body);
  row.append(message);

  attachSwipe(row, notification, wrapper);
  wrapper.append(action, row);
  return wrapper;
}

function createEmptyState() {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  const title = document.createElement("p");
  title.className = "empty-title";
  title.textContent = "No notifications available";

  const copy = document.createElement("p");
  copy.className = "empty-copy";
  copy.textContent =
    "Here is where you will find notifications about special offers, rewards, and information about your services.";

  const link = document.createElement("button");
  link.className = "text-link";
  link.type = "button";
  link.append(document.createTextNode("Turn on push notifications"));
  const chevron = document.createElement("img");
  chevron.src = "assets/icon-chevron-right.svg";
  chevron.alt = "";
  link.append(chevron);

  wrapper.append(title, copy, link);
  return wrapper;
}

function createNoResultsState() {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  const title = document.createElement("p");
  title.className = "empty-title";
  title.textContent = "No matching notifications";

  const copy = document.createElement("p");
  copy.className = "empty-copy";
  copy.textContent = "Try a different search term or category.";

  const reset = document.createElement("button");
  reset.className = "text-link";
  reset.type = "button";
  reset.textContent = "Clear search and filters";
  reset.addEventListener("click", () => {
    searchTerm = "";
    activeFilter = "all";
    searchInput.value = "";
    searchClear.hidden = true;
    renderFilters();
    renderList();
  });

  wrapper.append(title, copy, reset);
  return wrapper;
}

function renderList() {
  openRow = null;
  const visible = visibleNotifications();

  if (visible.length === 0) {
    const isFiltered = Boolean(searchTerm) || activeFilter !== "all";
    listEl.replaceChildren(isFiltered ? createNoResultsState() : createEmptyState());
    return;
  }

  const children = [];
  GROUPS.forEach((group) => {
    const rows = visible.filter((notification) => notification.group === group.id);
    if (rows.length === 0) return;

    const groupTitle = document.createElement("p");
    groupTitle.className = "group-title";
    groupTitle.textContent = group.label;
    children.push(groupTitle, ...rows.map(createRow));
  });

  const hint = document.createElement("p");
  hint.className = "swipe-hint";
  hint.textContent = "Swipe a notification left to delete it.";
  children.push(hint);

  listEl.replaceChildren(...children);
}

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  searchClear.hidden = searchInput.value.length === 0;
  renderList();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  searchClear.hidden = true;
  searchInput.focus();
  renderList();
});

listEl.addEventListener("scroll", closeOpenRow);
screens.inbox.addEventListener("scroll", closeOpenRow);

document.getElementById("bell-button").addEventListener("click", () => showScreen("inbox"));
document.getElementById("back-button").addEventListener("click", () => showScreen("home"));

renderFilters();
renderList();
