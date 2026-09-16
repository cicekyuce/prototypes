"use strict";

const ICONS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 10.7l-5 3.8 1.6 6L12 17l-4.6 3.5 1.6-6-5-3.8 6.1-1.9z"/>'
};

function icon(name, cls) {
  return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
}

const MESSAGES = [
  {
    id: "tab-ending",
    subject: "Your Tab is ending on December 28, 2026",
    received: "Sep. 15, 2026",
    unread: true,
    time: "10:24 AM",
    type: "Promotion expiry",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Your Tab is ending on December 28, 2026",
        badge: { month: "DEC", day: "28" },
        lead: "As required by the CRTC, we're reminding you that your Tab agreement will end on December 28, 2026.",
        paragraphs: [
          "When your Tab ends, any remaining balance on your device, if applicable, will appear on your final statement. If your Tab is fully paid, your monthly payment will decrease by your Tab amount starting with your next bill.",
          "Because some of the promotions on your account were offered as part of your Tab agreement, they cannot continue once the agreement ends. The following promotions will be affected:"
        ],
        bulletsTitle: "Promotions that will end on December 28, 2026",
        bullets: [
          "$10/month promotional credit on your mobile plan",
          "2 GB bonus data at no charge",
          "Free Canada-wide long-distance add-on"
        ],
        paragraphs2: [
          "Your base plan is not affected: the price of your plan stays the same, and you keep every promotion that isn't tied to your Tab.",
          "To keep your promotional credits going, you can upgrade to a new device on a new Tab agreement before December 28, 2026. If you'd rather not start a new Tab, you can switch to one of our current plans — several include equivalent promotional offers.",
          "If you have questions about your Tab balance or the promotions on your account, you can review them in My Account or contact us."
        ],
        footnote: "This notice is provided in accordance with the Terms of Service applicable to your Tab agreement. Reference: TAB-2026-1228."
      },
      mkt: {
        chip: "NEW OFFER",
        headline: "Better value. More data.",
        body: "We have a new offer just for you! Get 20% more data on select plans for the next 12 months. Stay connected to what matters, for less.",
        cta: "View offer",
        graphicImg: "assets/img/mkt-offer.png"
      }
    }
  },
  {
    id: "offer-bonus-data",
    subject: "An exclusive offer: 5 GB of bonus data at no extra cost",
    received: "Sep. 12, 2026",
    unread: true,
    time: "1:45 PM",
    type: "Offer",
    sentTo: { kind: "sms", value: "(666) 780-1194" },
    kind: "in-app",
    detail: {
      label: "Marketing Offer",
      mkt: {
        chip: "NEW OFFER",
        headline: "More data. Same price.",
        body: "For a limited time, get 5 GB of bonus data added to your plan at no extra cost for the next 6 months. Stay connected to what matters, for less.",
        cta: "View offer",
        graphicImg: "assets/img/mkt-offer.png"
      }
    }
  },
  {
    id: "welcome-postpaid",
    subject: "Welcome to Freedom Mobile - Postpaid service has been activated",
    received: "Sep. 10, 2026",
    time: "8:02 AM",
    type: "Activation",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "pdf",
    pdf: "assets/docs/welcome-postpaid.pdf"
  },
  {
    id: "device-shipment",
    subject: "Freedom Mobile - Device shipment confirmation",
    received: "Sep. 10, 2026",
    time: "8:05 AM",
    type: "Activation",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "pdf",
    pdf: "assets/docs/device-shipment.pdf"
  },
  {
    id: "welcome-prepaid",
    subject: "Welcome to Freedom Mobile - Prepaid service has been activated",
    received: "Sep. 4, 2026",
    unread: true,
    time: "6:00 AM",
    type: "Activation",
    sentTo: { kind: "sms", value: "(666) 780-1194" },
    kind: "pdf",
    pdf: "assets/docs/welcome-prepaid.pdf"
  },
  {
    id: "tos-update",
    subject: "Important update to your Terms of Service",
    received: "Aug. 30, 2026",
    time: "9:12 AM",
    type: "Regulatory",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "pdf",
    pdf: "assets/docs/crtc-tos-update.pdf"
  },
  {
    id: "promo-data-expiry",
    subject: "Your 6 GB bonus data promotion ends on March 31, 2027",
    received: "Jul. 21, 2026",
    time: "3:26 PM",
    type: "Promotion expiry",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Your 6 GB bonus data promotion ends on March 31, 2027",
        badge: { month: "MAR", day: "31" },
        lead: "Your bonus data was offered for a 12-month period.",
        paragraphs: [
          "Your plan includes 6 GB of bonus data per month. This bonus was applied starting April 1, 2026 for a 12-month period, which ends on March 31, 2027.",
          "After March 31, 2027, the bonus data will no longer be included in your plan and your monthly data allowance will return to your plan's regular amount. No action is required on your part — your services will continue without interruption."
        ],
        bulletsTitle: "Promotion ending",
        bullets: [
          "6 GB bonus data per month — applied since April 1, 2026 — ends March 31, 2027"
        ],
        paragraphs2: [
          "You can see all the promotions currently applied to your account, including their end dates, in My Account at any time."
        ],
        footnote: "Reference: PROMO-2027-0331."
      }
    }
  },
  {
    id: "roaming-us",
    subject: "Roaming in the U.S.? Here's what you need to know",
    received: "Jun. 12, 2026",
    unread: true,
    time: "9:15 AM",
    type: "Roaming",
    sentTo: { kind: "sms", value: "(666) 780-1194" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Roaming terms for your trip to the United States",
        lead: "Standard pay-per-use rates apply when you travel outside Canada.",
        paragraphs: [
          "Roaming is currently enabled on your line. While you're outside Canada, the following pay-per-use rates apply to your services in the United States:"
        ],
        bulletsTitle: "U.S. pay-per-use rates",
        bullets: [
          "Voice: $1.50 per minute",
          "Sent texts: $0.75 per text",
          "Data: $8.00 per 100 MB, billed in 100 MB increments"
        ],
        paragraphs2: [
          "Pay-per-use roaming charges are capped at $100 per billing cycle. Once you reach the cap, data speeds are reduced for the rest of the cycle, as described in your Terms of Service.",
          "You can turn off roaming at any time from My Account, or by contacting us before you travel."
        ],
        footnote: "Reference: ROAM-US-2026."
      },
      mkt: {
        chip: "NEW OFFER",
        headline: "Roam worry-free with the U.S. add-on",
        body: "Get unlimited talk and text plus 1 GB of high-speed data every day you roam for $12/day — charged only on the days you use your phone in the U.S.",
        cta: "View offer"
      }
    }
  },
  {
    id: "promo-credit",
    subject: "Your $10/month promotional credit ends soon",
    received: "May 12, 2026",
    time: "2:40 PM",
    type: "Promotion expiry",
    sentTo: { kind: "sms", value: "(666) 780-1194" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Your promotional credit ends on January 31, 2027",
        badge: { month: "JAN", day: "31" },
        lead: "Your promotional pricing was offered for a 24-month period.",
        paragraphs: [
          "Your plan includes a $10/month promotional credit on your mobile plan. This credit was applied starting February 1, 2025 for a 24-month period, which ends on January 31, 2027.",
          "After January 31, 2027, the credit will no longer be applied and your monthly plan price will return to its regular rate. No action is required on your part — your services will continue without interruption."
        ],
        bulletsTitle: "Promotion ending",
        bullets: [
          "$10/month promotional credit — applied since February 1, 2025 — ends January 31, 2027"
        ],
        paragraphs2: [
          "You can see all the promotions currently applied to your account, including their end dates, in My Account at any time."
        ],
        footnote: "Reference: PROMO-2027-0131."
      },
      mkt: {
        chip: "NEW OFFER",
        headline: "Keep your savings going",
        body: "Switch to a current plan and get a $10/month credit for 24 months, plus 20 GB more data than your plan includes today.",
        cta: "View offer"
      }
    }
  },
  {
    id: "agreement-amendment",
    subject: "Services Agreement Amendment",
    received: "Mar. 24, 2026",
    time: "11:30 AM",
    type: "Plan Change",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "pdf",
    pdf: "assets/docs/agreement-amendment.pdf"
  },
  {
    id: "contract-expiry",
    subject: "Your service agreement ends on February 20, 2027",
    received: "Feb. 20, 2026",
    time: "10:00 AM",
    type: "Contract expiry",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Service Agreement Notice",
      reg: {
        title: "Your service agreement ends on February 20, 2027",
        badge: { month: "FEB", day: "20" },
        lead: "We're reminding you that your 2-year service agreement will end on February 20, 2027.",
        paragraphs: [
          "When your agreement ends, your services continue on a month-to-month basis at your current plan price. Any remaining balance on your device, if applicable, will appear on your final statement.",
          "Because some of the promotions on your account were offered as part of your service agreement, they cannot continue once the agreement ends. The following promotions will be affected:"
        ],
        bulletsTitle: "Promotions that will end on February 20, 2027",
        bullets: [
          "$5/month loyalty credit on your mobile plan",
          "Unlimited Canada-wide talk add-on included at no charge"
        ],
        paragraphs2: [
          "Your base plan is not affected: the price of your plan stays the same, and you keep every promotion that isn't tied to your agreement.",
          "To keep your promotional pricing going, you can sign a new 2-year service agreement before February 20, 2027, or switch to one of our current plans — several include equivalent promotional offers.",
          "If you have questions about your agreement or the promotions on your account, you can review them in My Account or contact us."
        ],
        footnote: "This notice is provided in accordance with the Terms of Service applicable to your service agreement. Reference: SA-2027-0220."
      }
    }
  }
];

const state = { filter: "all" };

const listEl = document.getElementById("message-list");
const emptyEl = document.getElementById("list-empty");
const viewListEl = document.getElementById("view-list");
const viewDetailEl = document.getElementById("view-detail");
const viewProfileEl = document.getElementById("view-profile");
const viewPrefEl = document.getElementById("view-preferences");
const detailCardEl = document.getElementById("detail-card");
const filterEl = document.getElementById("filter");
const filterToggleEl = document.getElementById("filter-toggle");
const filterMenuEl = document.getElementById("filter-menu");
const filterLabelEl = document.getElementById("filter-label");
const backBtnEl = document.getElementById("back-btn");

function rowHtml(m) {
  const isPdf = m.kind === "pdf";
  const newTabIcon = isPdf
    ? '<span class="newtab-inline" title="Opens in a new tab (PDF)">' + icon("external", "ic-14") + "</span>"
    : "";
  const attrs = isPdf
    ? 'href="' + m.pdf + '" target="_blank" rel="noopener" title="Opens in a new tab (PDF)" aria-label="' + m.subject + '. Opens in a new tab as a PDF"'
    : 'href="#/message/' + m.id + '" aria-label="' + m.subject + '. Opens in the Message Centre"';
  const sentIcon = m.sentTo.kind === "sms" ? icon("phone", "ic-14") : icon("mail", "ic-14");
  return (
    '<li class="message-row"><a class="row-link' + (m.unread ? " is-unread" : "") + '" data-id="' + m.id + '" ' + attrs + ">" +
    '<span class="row-received"><span class="unread-dot" aria-hidden="true"></span>' + m.received + "</span>" +
    '<span class="row-subject-cell"><span class="row-subject">' + m.subject + "</span>" + newTabIcon + "</span>" +
    '<span class="row-type">' + m.type + "</span>" +
    '<span class="row-sentto" title="Sent by ' + (m.sentTo.kind === "sms" ? "SMS" : "email") + '">' + sentIcon + "<span>" + m.sentTo.value + "</span></span>" +
    "</a></li>"
  );
}

function matchesFilter(m) {
  if (state.filter === "all") return true;
  return m.type === state.filter;
}

function renderList() {
  const rows = MESSAGES.filter(matchesFilter);
  listEl.innerHTML = rows.map(rowHtml).join("");
  emptyEl.hidden = rows.length > 0;
}

function setFilter(value) {
  state.filter = value;
  const options = filterMenuEl.querySelectorAll("[data-filter]");
  options.forEach(function (opt) {
    const selected = opt.dataset.filter === value;
    opt.classList.toggle("is-selected", selected);
    opt.setAttribute("aria-checked", selected ? "true" : "false");
  });
  filterLabelEl.textContent = value === "all" ? "All types" : value;
  renderList();
}

function closeMenu() {
  filterMenuEl.hidden = true;
  filterEl.classList.remove("is-open");
  filterToggleEl.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  const willOpen = filterMenuEl.hidden;
  filterMenuEl.hidden = !willOpen;
  filterEl.classList.toggle("is-open", willOpen);
  filterToggleEl.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

filterToggleEl.addEventListener("click", function (e) {
  e.stopPropagation();
  toggleMenu();
});

filterMenuEl.addEventListener("click", function (e) {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;
  setFilter(btn.dataset.filter);
  closeMenu();
});

document.addEventListener("click", function (e) {
  if (!filterEl.contains(e.target)) closeMenu();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeMenu();
});

listEl.addEventListener("click", function (e) {
  const row = e.target.closest(".row-link");
  if (!row) return;
  const m = MESSAGES.find(function (msg) { return msg.id === row.dataset.id; });
  if (m && m.unread) {
    m.unread = false;
    row.classList.remove("is-unread");
  }
});

function regBadgeHtml(badge) {
  if (!badge) return "";
  return (
    '<div class="reg-badge" role="img" aria-label="' + badge.month + " " + badge.day + '">' +
    '<span class="reg-badge-month">' + badge.month + "</span>" +
    '<span class="reg-badge-day">' + badge.day + "</span>" +
    "</div>"
  );
}

function regCardHtml(r) {
  return (
    '<section class="reg-card">' +
    '<div class="reg-card-head">' +
    '<h2 class="reg-title">' + r.title + "</h2>" +
    regBadgeHtml(r.badge) +
    "</div>" +
    '<p class="reg-lead">' + r.lead + "</p>" +
    '<div class="reg-body">' +
    r.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
    '<h3 class="reg-list-title">' + r.bulletsTitle + "</h3>" +
    '<ul class="reg-list">' + r.bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>" +
    r.paragraphs2.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
    "</div>" +
    '<p class="reg-footnote">' + r.footnote + "</p>" +
    "</section>"
  );
}

function mktCardHtml(mk) {
  return (
    '<section class="mkt-card">' +
    '<div class="mkt-content">' +
    '<span class="mkt-chip">' + icon("sparkle", "ic-12") + "<span>" + mk.chip + "</span></span>" +
    '<h3 class="mkt-headline">' + mk.headline + "</h3>" +
    '<p class="mkt-body">' + mk.body + "</p>" +
    '<a class="mkt-cta" href="#/">' + mk.cta + icon("chevronRight", "ic-14") + "</a>" +
    "</div>" +
    (mk.graphicImg ? '<img class="mkt-graphic-img" src="' + mk.graphicImg + '" alt="New offer graphic">' : "") +
    "</section>"
  );
}

function simpleCardHtml(s) {
  return (
    '<section class="simple-card">' +
    '<h2 class="simple-title">' + s.title + "</h2>" +
    s.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
    "</section>"
  );
}

function detailHtml(m) {
  const d = m.detail;
  return (
    '<header class="detail-meta">' +
    '<span class="detail-icon">' + icon("bell", "ic-20") + "</span>" +
    '<div class="detail-meta-text">' +
    '<p class="detail-label">' + d.label + "</p>" +
    '<p class="detail-date">' + m.received + " • " + m.time + "</p>" +
    "</div>" +
    "</header>" +
    (d.reg ? regCardHtml(d.reg) : "") +
    (d.mkt ? mktCardHtml(d.mkt) : "") +
    (d.simple ? simpleCardHtml(d.simple) : "") +
    '<p class="signoff">Thanks for being a valued customer.<br>The Freedom Mobile Team</p>' +
    '<p class="template-note"><strong>Dev annotation:</strong> the regulatory block uses a reusable template — fields: <code>label</code>, <code>date</code>, <code>title</code>, <code>date badge</code>, <code>lead</code>, <code>body</code>, <code>list</code>, <code>footnote</code>. Marketing block fields: <code>chip</code>, <code>headline</code>, <code>body</code>, <code>cta</code>. Not shown to customers.</p>'
  );
}

function showList() {
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = true;
  viewListEl.hidden = false;
  document.title = "Message Centre | Freedom Mobile";
  renderList();
}

function showDetail(id) {
  const m = MESSAGES.find(function (msg) { return msg.id === id; });
  if (!m || m.kind === "pdf") {
    location.hash = "#/";
    return;
  }
  detailCardEl.innerHTML = detailHtml(m);
  viewListEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = true;
  viewDetailEl.hidden = false;
  document.title = m.subject + " | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showProfile() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewPrefEl.hidden = true;
  viewProfileEl.hidden = false;
  document.title = "My Profile | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showPreferences() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = false;
  document.title = "Notification Preferences | Freedom Mobile";
  window.scrollTo(0, 0);
}

backBtnEl.addEventListener("click", function () {
  location.hash = "#/";
});

function route() {
  const hash = location.hash.replace(/^#/, "");
  const match = hash.match(/^\/message\/([\w-]+)/);
  if (match) {
    showDetail(match[1]);
  } else if (hash === "/profile") {
    showProfile();
  } else if (hash === "/preferences") {
    showPreferences();
  } else {
    showList();
  }
}

window.addEventListener("hashchange", route);
route();
