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
  // No sticker variant exists in Figma for regulatory notices yet; the lock
  // glyph below is a placeholder.
  regulatory: { label: "Service notice", icon: null },
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
    // Regulatory notices must stay in the inbox, so this one cannot be deleted.
    id: "n0",
    group: "this-week",
    title:
      "Changes to your plan terms take effect on Dec. 15, 2026. Review what is changing and what it means for your monthly bill.",
    category: "regulatory",
    timestamp: "1 hour ago",
    unread: true,
    locked: true,
  },
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

// Length of the undo window after a deletion. Duration to be confirmed.
const UNDO_WINDOW_MS = 5000;

// Swipe geometry — keep in sync with --swipe-action-width in styles.css.
const ACTION_WIDTH = 88;
const OPEN_THRESHOLD = 40;
// Locked rows give way, then bounce back; they never travel far enough to
// suggest an action is waiting behind them.
const LOCKED_MAX_OFFSET = 60;
const LOCKED_HINT_THRESHOLD = 28;
const LOCKED_MESSAGE_MS = 5000;
const DRAG_TOLERANCE = 6;

let notifications = SEED_NOTIFICATIONS.map((notification) => ({ ...notification }));
let activeFilter = "all";
let searchTerm = "";
let openRow = null;
let pendingUndo = null;
let failedDeleteId = null;
let lockedMessageTimer = null;

const screens = {
  home: document.getElementById("screen-home"),
  inbox: document.getElementById("screen-inbox"),
};
const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("notification-list");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const undoBar = document.getElementById("undo-bar");
const undoButton = document.getElementById("undo-button");
const errorBar = document.getElementById("error-bar");
const retryButton = document.getElementById("retry-button");
const infoBar = document.getElementById("info-bar");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
    if (key === name) el.scrollTop = 0;
  });
}

// Hash routing so the prototype hub can deep-link individual screens:
// #/ = overview, #/inbox = inbox, #/inbox/<category> = inbox with a filter.
function applyRoute() {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const isInbox = parts[0] === "inbox";
  const category = parts[1];

  activeFilter = FILTERS.some((filter) => filter.id === category) ? category : "all";
  dismissDeleteError();
  dismissLockedMessage();
  if (!isInbox) dismissUndo();
  showScreen(isInbox ? "inbox" : "home");
  renderFilters();
  renderList();
}

function navigate(hash) {
  if (window.location.hash === hash) {
    applyRoute();
    return;
  }
  window.location.hash = hash;
}

function closeOpenRow() {
  if (!openRow) return;
  setRowOffset(openRow, 0, true);
  openRow = null;
}

function setRowOffset(row, offset, animate) {
  // A leftover bounce transition would make the next drag lag behind the finger.
  if (!animate) row.classList.remove("bouncing");
  row.classList.toggle("settling", Boolean(animate));
  row.style.transform = `translateX(${offset}px)`;
}

// Spring-style return used by rows that cannot be swiped open.
function bounceRowBack(row) {
  row.classList.remove("settling");
  row.classList.add("bouncing");
  row.style.transform = "translateX(0px)";
  const clear = () => row.classList.remove("bouncing");
  row.addEventListener("transitionend", clear, { once: true });
  // Fallback in case the transition is interrupted and never reports its end.
  window.setTimeout(clear, 500);
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
        navigate(filter.id === "all" ? "#/inbox" : `#/inbox/${filter.id}`);
      });
      return chip;
    })
  );
}

// Placeholder lock glyph, in the same stroke style as the Figma icons.
function lockIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "10");
  svg.setAttribute("height", "11");
  svg.setAttribute("viewBox", "0 0 10 11");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<rect x="1.4" y="4.6" width="7.2" height="5.6" rx="1.2" stroke="currentColor" stroke-width="1.2"/>' +
    '<path d="M3.2 4.6V3.2a1.8 1.8 0 0 1 3.6 0v1.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>';
  return svg;
}

function createSticker(categoryId) {
  const category = CATEGORIES[categoryId];
  const sticker = document.createElement("span");
  sticker.className = "sticker";
  sticker.dataset.category = categoryId;

  const label = document.createElement("span");
  label.textContent = category.label;

  if (category.icon) {
    const icon = document.createElement("img");
    icon.src = category.icon;
    icon.alt = "";
    sticker.append(icon, label);
  } else {
    sticker.append(lockIcon(), label);
  }
  return sticker;
}

// Bin glyph extracted from the supplied Delete CTA mockup.
function trashIcon() {
  const icon = document.createElement("img");
  icon.src = "assets/icon-delete.png";
  icon.width = 22;
  icon.height = 25;
  icon.alt = "";
  return icon;
}

// Dismissing the bar makes the previous deletion final; the notification is
// only restored while its undo window is still open.
function dismissUndo() {
  if (!pendingUndo) return;
  window.clearTimeout(pendingUndo.timer);
  pendingUndo = null;
  undoBar.hidden = true;
}

function undoDelete() {
  if (!pendingUndo) return;
  const { notification, index } = pendingUndo;
  window.clearTimeout(pendingUndo.timer);
  pendingUndo = null;
  undoBar.hidden = true;
  notifications.splice(index, 0, notification);
  renderList();
}

function dismissLockedMessage() {
  window.clearTimeout(lockedMessageTimer);
  lockedMessageTimer = null;
  infoBar.hidden = true;
}

// Only one bottom bar is ever on screen; they share the same position.
function showLockedMessage(wrapper) {
  dismissUndo();
  dismissDeleteError();
  window.clearTimeout(lockedMessageTimer);
  infoBar.hidden = false;
  lockedMessageTimer = window.setTimeout(dismissLockedMessage, LOCKED_MESSAGE_MS);

  if (wrapper) {
    const lock = wrapper.querySelector(".sticker");
    if (lock) {
      lock.classList.remove("pulse");
      // Restart the animation on repeated attempts.
      void lock.offsetWidth;
      lock.classList.add("pulse");
    }
  }
}

function dismissDeleteError() {
  failedDeleteId = null;
  errorBar.hidden = true;
}

// The notification is left in the list and the customer can try again.
function showDeleteError(id) {
  dismissUndo();
  dismissLockedMessage();
  failedDeleteId = id;
  errorBar.hidden = false;
  renderList();
}

function retryDelete() {
  if (!failedDeleteId) return;
  const id = failedDeleteId;
  const wrapper = listEl.querySelector(`.swipe[data-id="${id}"]`);
  dismissDeleteError();
  if (wrapper) deleteNotification(id, wrapper);
}

function deleteNotification(id, wrapper) {
  if (openRow) openRow = null;
  const index = notifications.findIndex((notification) => notification.id === id);
  if (index === -1) return;
  if (notifications[index].locked) {
    showLockedMessage();
    return;
  }
  // Deleting the last deletable notification fails, so the error state can be
  // seen in the prototype; a real client fails when the backend call fails.
  if (notifications.filter((notification) => !notification.locked).length === 1) {
    showDeleteError(id);
    return;
  }
  dismissDeleteError();
  dismissLockedMessage();
  dismissUndo();
  const [removed] = notifications.splice(index, 1);
  pendingUndo = {
    notification: removed,
    index,
    timer: window.setTimeout(dismissUndo, UNDO_WINDOW_MS),
  };
  undoBar.hidden = false;

  wrapper.style.height = `${wrapper.offsetHeight}px`;
  wrapper.classList.add("removing");
  requestAnimationFrame(() => {
    wrapper.style.height = "0px";
  });
  window.setTimeout(renderList, 180);
}

// Regulatory notices have no Delete action. The row gives way slightly, snaps
// back and explains why, instead of offering an action that would be refused.
function attachLockedSwipe(row, wrapper) {
  let startX = 0;
  let dragging = false;
  let moved = false;
  let resisted = false;

  row.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (openRow) closeOpenRow();
    dragging = true;
    moved = false;
    resisted = false;
    startX = event.clientX;
    // Capture the pointer so the row still snaps back when the finger is
    // lifted outside it.
    row.setPointerCapture(event.pointerId);
    row.classList.remove("settling", "bouncing");
  });

  row.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > DRAG_TOLERANCE) moved = true;
    if (delta >= 0) return;
    // Rubber band: the row follows the finger, easing off as it approaches the
    // limit so the resistance is felt rather than hit as a hard stop.
    const travel = -delta;
    const resistedOffset = -LOCKED_MAX_OFFSET * (1 - Math.exp(-travel / 110));
    if (travel >= LOCKED_HINT_THRESHOLD) resisted = true;
    setRowOffset(row, resistedOffset, false);
  });

  const finish = (event) => {
    if (!dragging) return;
    dragging = false;
    if (row.hasPointerCapture(event.pointerId)) row.releasePointerCapture(event.pointerId);
    bounceRowBack(row);
    if (resisted) showLockedMessage(wrapper);
  };

  row.addEventListener("pointerup", finish);
  row.addEventListener("pointercancel", finish);
  // Safety net: if the capture is lost mid-drag the row must not stay offset.
  row.addEventListener("lostpointercapture", () => {
    if (!dragging) return;
    dragging = false;
    bounceRowBack(row);
    if (resisted) showLockedMessage(wrapper);
  });

  row.addEventListener("click", (event) => {
    if (moved) {
      event.preventDefault();
      return;
    }
    row.dataset.unread = "false";
  });

  row.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      showLockedMessage(wrapper);
    }
  });
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

    // Swiping only reveals the Delete action; deleting always requires a tap
    // on the Delete CTA.
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
  // Safety net: if the capture is lost mid-drag, settle the row either way.
  row.addEventListener("lostpointercapture", () => {
    if (!dragging) return;
    dragging = false;
    if (-offset >= OPEN_THRESHOLD) {
      setRowOffset(row, -ACTION_WIDTH, true);
      openRow = row;
      return;
    }
    setRowOffset(row, 0, true);
    if (openRow === row) openRow = null;
  });

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

  // Keyboard equivalent of the swipe: reveal the Delete CTA, which must still
  // be activated to delete.
  row.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      if (openRow && openRow !== row) closeOpenRow();
      setRowOffset(row, -ACTION_WIDTH, true);
      openRow = row;
      wrapper.querySelector(".delete-button").focus();
    }
  });
}

function createRow(notification) {
  const wrapper = document.createElement("div");
  wrapper.className = "swipe";
  wrapper.dataset.id = notification.id;

  let action = null;
  if (!notification.locked) {
    action = document.createElement("div");
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
  }

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

  if (notification.locked) {
    wrapper.classList.add("swipe-locked");
    attachLockedSwipe(row, wrapper);
    wrapper.append(row);
  } else {
    attachSwipe(row, notification, wrapper);
    wrapper.append(action, row);
  }
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
  copy.textContent =
    "Sorry, we couldn\u2019t find this notification. It may have expired or is no longer available.";

  const hint = document.createElement("p");
  hint.className = "empty-copy";
  hint.textContent = "Try a different search term or category.";

  const reset = document.createElement("button");
  reset.className = "text-link";
  reset.type = "button";
  reset.append(document.createTextNode("Clear search and filters"));
  const resetChevron = document.createElement("img");
  resetChevron.src = "assets/icon-chevron-right.svg";
  resetChevron.alt = "";
  reset.append(resetChevron);
  reset.addEventListener("click", () => {
    searchTerm = "";
    searchInput.value = "";
    searchClear.hidden = true;
    navigate("#/inbox");
  });

  wrapper.append(title, copy, hint, reset);
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

undoButton.addEventListener("click", undoDelete);
retryButton.addEventListener("click", retryDelete);

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  searchClear.hidden = true;
  searchInput.focus();
  renderList();
});

listEl.addEventListener("scroll", closeOpenRow);
screens.inbox.addEventListener("scroll", closeOpenRow);

document.getElementById("bell-button").addEventListener("click", () => navigate("#/inbox"));
document.getElementById("back-button").addEventListener("click", () => navigate("#/"));

window.addEventListener("hashchange", applyRoute);
applyRoute();
