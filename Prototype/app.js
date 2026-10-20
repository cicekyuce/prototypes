// Notifications inbox prototype — content mirrors Figma frame 1282:2824
// ("Noification inbox", page "✨ Navigation 2 (final) ✨" of App Architecture).

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

const notifications = [
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

let activeFilter = "all";

const screens = {
  home: document.getElementById("screen-home"),
  inbox: document.getElementById("screen-inbox"),
};
const filtersEl = document.getElementById("filters");
const listEl = document.getElementById("notification-list");

function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.hidden = key !== name;
    if (key === name) el.scrollTop = 0;
  });
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

function createRow(notification) {
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

  // Not wired in the Figma file: tapping a row marks it as read in this prototype.
  row.addEventListener("click", () => {
    notification.unread = false;
    row.dataset.unread = "false";
  });

  return row;
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

function renderList() {
  const visible = notifications.filter(
    (notification) => activeFilter === "all" || notification.category === activeFilter
  );

  if (visible.length === 0) {
    listEl.replaceChildren(createEmptyState());
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

  listEl.replaceChildren(...children);
}

document.getElementById("bell-button").addEventListener("click", () => showScreen("inbox"));
document.getElementById("back-button").addEventListener("click", () => showScreen("home"));

renderFilters();
renderList();
