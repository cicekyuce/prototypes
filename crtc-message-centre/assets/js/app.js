"use strict";

const ICONS = {
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  chevronRight: '<polyline points="9 18 15 12 9 6"/>',
  chevronLeft: '<polyline points="15 18 9 12 15 6"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
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
    id: "plan-price-change",
    subject: "A change is coming to your plan on November 1, 2026",
    received: "Sep. 14, 2026",
    unread: true,
    time: "9:10 AM",
    type: "Regulatory",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "A change is coming to your plan on November 1, 2026",
        badge: { month: "NOV", day: "01" },
        lead: "As required by the CRTC, we're giving you advance notice that the price of your current mobile plan will change on November 1, 2026.",
        paragraphs: [
          "Starting with your November statement, your monthly plan price will increase by $5. This change applies to the plan itself and does not affect any device balance or add-ons you may have.",
          "The following details summarize what is changing on your account:"
        ],
        bulletsTitle: "Summary of changes effective November 1, 2026",
        bullets: [
          "Monthly plan price increases from $45 to $50",
          "Included data, talk and text remain unchanged",
          "Your existing add-ons and their prices are not affected"
        ],
        paragraphs2: [
          "You are free to change or cancel your plan at any time without an early cancellation fee related to this change. If you decide to move to a different plan before November 1, 2026, the new plan's price will apply instead.",
          "If you have questions about this change or would like to review other plans available to you, you can compare options in My Account or contact us."
        ],
        footnote: "This notice is provided in accordance with the CRTC Wireless Code, which requires advance notice of changes to the terms of your plan. Reference: PLN-2026-1101."
      },
      mkts: [
        {
          chip: "NEW OFFER",
          headline: "Lock in your price for 24 months.",
          body: "Move to a Freedom Ultimate plan before November 1 and we'll hold your monthly price for two full years — no increases, guaranteed.",
          cta: "View offer",
          graphicImg: "assets/img/mkt-offer.png"
        },
        {
          chip: "BUNDLE & SAVE",
          headline: "Save $15/month with Home Internet.",
          body: "Add Freedom Home Internet to your mobile plan and save $15 every month on your combined bill, plus get free installation.",
          cta: "View offer",
          graphicImg: "assets/img/mkt-offer.png"
        },
        {
          chip: "DEVICE UPGRADE",
          headline: "Upgrade and get $200 off.",
          body: "You're eligible for an early upgrade. Choose a new device on a MyTab agreement and receive a $200 credit toward your purchase.",
          cta: "View offer",
          graphicImg: "assets/img/mkt-offer.png"
        }
      ]
    }
  },
  {
    id: "offer-double-up",
    subject: "Two offers picked for you: bonus data and roaming savings",
    received: "Sep. 13, 2026",
    unread: true,
    time: "11:30 AM",
    type: "Offer",
    sentTo: { kind: "sms", value: "(666) 780-1194" },
    kind: "in-app",
    detail: {
      label: "Marketing Offer",
      mkts: [
        {
          chip: "NEW OFFER",
          headline: "10 GB of bonus data, on us.",
          body: "Add 10 GB of bonus data to your plan at no extra cost for the next 3 months. Stream, scroll and share without watching your usage.",
          cta: "View offer",
          graphicImg: "assets/img/mkt-offer.png"
        },
        {
          chip: "TRAVEL READY",
          headline: "Roam the U.S. for $5/day.",
          body: "Heading south? Use your plan's data, talk and text in the United States for just $5 a day — half the regular rate until the end of the year.",
          cta: "View offer",
          graphicImg: "assets/img/mkt-offer.png"
        }
      ]
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
    time: "9:48 AM",
    type: "Promotion expiry",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Your 6 GB bonus data promotion ends on March 31, 2027",
        badge: { month: "MAR", day: "31" },
        lead: "A promotional bonus on your account is scheduled to end on March 31, 2027.",
        paragraphs: [
          "Your plan currently includes a 6 GB bonus data promotion. This promotion was applied on March 31, 2025 for a 24-month period, which ends on March 31, 2027.",
          "After March 31, 2027, the bonus data will no longer be included in your plan and your monthly data allowance will return to the amount included in your base plan. The price of your plan is not affected."
        ],
        bulletsTitle: "Promotion ending",
        bullets: [
          "6 GB bonus data per month — applied since March 31, 2025 — ends March 31, 2027"
        ],
        paragraphs2: [
          "You can see all the promotions currently applied to your account, including their end dates, in My Account at any time."
        ],
        footnote: "Reference: PROMO-DATA-2027-0331."
      },
      mkt: {
        chip: "NEW OFFER",
        headline: "Keep your bonus data",
        body: "Switch to a current plan and keep 6 GB of bonus data for 24 months, plus enjoy more data than your plan includes today.",
        cta: "View offer"
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
    time: "8:30 AM",
    type: "Contract expiry",
    sentTo: { kind: "email", value: "cyucezeytinci@freedommobile.ca" },
    kind: "in-app",
    detail: {
      label: "Regulatory Notification",
      reg: {
        title: "Your service agreement ends on February 20, 2027",
        badge: { month: "FEB", day: "20" },
        lead: "As required by the CRTC, we're reminding you that your service agreement will end on February 20, 2027.",
        paragraphs: [
          "Your current service agreement started on February 20, 2025 for a 24-month period. When your agreement ends, your services will continue on a month-to-month basis at the same rate — no action is required on your part.",
          "If your agreement includes promotional credits or bonuses tied to the 24-month term, the following will be affected:"
        ],
        bulletsTitle: "Agreement details",
        bullets: [
          "Service agreement period: February 20, 2025 – February 20, 2027",
          "Promotions tied to the agreement, if any, end on February 20, 2027"
        ],
        paragraphs2: [
          "Your base plan is not affected: the price of your plan stays the same, and your services continue without interruption.",
          "If you'd like to start a new agreement with current promotions, you can explore our available plans in My Account or contact us."
        ],
        footnote: "This notice is provided in accordance with the Terms of Service applicable to your service agreement. Reference: AGREEMENT-2027-0220."
      },
      mkt: {
        chip: "NEW OFFER",
        headline: "Ready for something new?",
        body: "Upgrade to a new device on a new agreement and get up to $25/month in bill credits for 24 months, plus keep all your current plan features.",
        cta: "View offer"
      }
    }
  }
];

const state = { filter: "all", search: "" };

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
const searchInputEl = document.getElementById("search-input");
const prefSaveEl = document.getElementById("pref-save");
const prefConfirmEl = document.getElementById("pref-confirm");
const prefOptoutEl = document.getElementById("pref-optout");
const viewPref2El = document.getElementById("view-preferences2");
const pref2SaveEl = document.getElementById("pref2-save");
const pref2ConfirmEl = document.getElementById("pref2-confirm");
const prefChannelsEl = document.getElementById("pref-channels");
const viewPref3El = document.getElementById("view-preferences3");
const pref3SaveEl = document.getElementById("pref3-save");
const pref3ConfirmEl = document.getElementById("pref3-confirm");
const pref3OptoutEl = document.getElementById("pref3-optout");
const drawerEl = document.getElementById("info-drawer");
const drawerScrimEl = document.getElementById("drawer-scrim");
const drawerBodyEl = document.getElementById("drawer-body");
const drawerDismissEl = document.getElementById("drawer-dismiss");
let drawerReturnFocusEl = null;

function rowHtml(m) {
  const isPdf = m.kind === "pdf";
  const newTabIcon = isPdf
    ? '<span class="newtab-inline" title="Opens in a new tab (PDF)">' + icon("external", "ic-14") + "</span>"
    : "";
  const attrs = isPdf
    ? 'href="' + m.pdf + '" target="_blank" rel="noopener" title="Opens in a new tab (PDF)" aria-label="' + m.subject + '. Opens in a new tab as a PDF"'
    : 'href="#/message/' + m.id + '" aria-label="' + m.subject + '. Opens in the Message Centre"';
  return (
    '<li class="message-row"><a class="row-link' + (m.unread ? " is-unread" : "") + '" data-id="' + m.id + '" ' + attrs + ">" +
    '<span class="row-received"><span class="unread-dot" aria-hidden="true"></span>' + m.received + "</span>" +
    '<span class="row-subject-cell"><span class="row-subject">' + m.subject + "</span>" + newTabIcon + "</span>" +
    '<span class="row-type">' + m.type + "</span>" +
    "</a></li>"
  );
}

function messageSearchText(m) {
  const d = m.detail || {};
  const parts = [m.subject, m.type, m.received, m.sentTo.value, d.label];
  if (d.reg) {
    parts.push(
      d.reg.title, d.reg.lead, d.reg.footnote, d.reg.bulletsTitle,
      (d.reg.paragraphs || []).join(" "),
      (d.reg.bullets || []).join(" "),
      (d.reg.paragraphs2 || []).join(" ")
    );
  }
  const offers = d.mkts && d.mkts.length ? d.mkts : d.mkt ? [d.mkt] : [];
  offers.forEach(function (o) {
    parts.push(o.chip, o.headline, o.body);
  });
  return parts.join(" ").toLowerCase();
}

const SEARCH_TEXTS = MESSAGES.map(messageSearchText);

function matchesFilter(m, i) {
  if (state.filter === "Read") return !m.unread;
  if (state.filter === "Unread") return !!m.unread;
  if (state.filter !== "all" && m.type !== state.filter) return false;
  if (state.search) {
    const words = state.search.toLowerCase().split(/\s+/).filter(Boolean);
    const text = SEARCH_TEXTS[i] || "";
    if (!words.every(function (w) { return text.indexOf(w) !== -1; })) return false;
  }
  return true;
}

function renderList() {
  const rows = MESSAGES.filter(function (m, i) { return matchesFilter(m, i); });
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

searchInputEl.addEventListener("input", function () {
  state.search = searchInputEl.value;
  renderList();
});

detailCardEl.addEventListener("click", function (e) {
  const carousel = e.target.closest(".mkt-carousel");
  if (!carousel) return;
  const arrow = e.target.closest("[data-step]");
  const dot = e.target.closest("[data-goto]");
  if (arrow) {
    showOffer(carousel, Number(carousel.dataset.index) + Number(arrow.dataset.step));
  } else if (dot) {
    showOffer(carousel, Number(dot.dataset.goto));
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

function mktCarouselHtml(offers) {
  const slides = offers.map(function (mk, i) {
    return '<div class="mkt-slide" data-slide="' + i + '"' + (i === 0 ? "" : " hidden") + ">" + mktCardHtml(mk) + "</div>";
  }).join("");
  const dots = offers.map(function (mk, i) {
    return (
      '<button class="mkt-dot' + (i === 0 ? " is-active" : "") + '" type="button" data-goto="' + i +
      '" aria-label="Show offer ' + (i + 1) + " of " + offers.length + '"></button>'
    );
  }).join("");
  return (
    '<section class="mkt-carousel" id="mkt-carousel" data-index="0" data-count="' + offers.length + '" aria-roledescription="carousel" aria-label="Offers for you">' +
    '<div class="mkt-carousel-head">' +
    '<h3 class="mkt-carousel-title">' + offers.length + " offers for you</h3>" +
    '<div class="mkt-carousel-nav">' +
    '<button class="mkt-arrow" type="button" data-step="-1" aria-label="Previous offer">' + icon("chevronLeft", "ic-20") + "</button>" +
    '<span class="mkt-counter" id="mkt-counter" aria-live="polite">1 of ' + offers.length + "</span>" +
    '<button class="mkt-arrow" type="button" data-step="1" aria-label="Next offer">' + icon("chevronRight", "ic-20") + "</button>" +
    "</div>" +
    "</div>" +
    '<div class="mkt-slides">' + slides + "</div>" +
    '<div class="mkt-dots" role="tablist" aria-label="Choose an offer">' + dots + "</div>" +
    "</section>"
  );
}

function marketingHtml(d) {
  const offers = d.mkts && d.mkts.length ? d.mkts : d.mkt ? [d.mkt] : [];
  if (!offers.length) return "";
  return offers.length > 1 ? mktCarouselHtml(offers) : mktCardHtml(offers[0]);
}

function showOffer(carousel, index) {
  const count = Number(carousel.dataset.count);
  const next = (index + count) % count;
  carousel.dataset.index = String(next);
  carousel.querySelectorAll(".mkt-slide").forEach(function (slide) {
    slide.hidden = Number(slide.dataset.slide) !== next;
  });
  carousel.querySelectorAll(".mkt-dot").forEach(function (dot) {
    const active = Number(dot.dataset.goto) === next;
    dot.classList.toggle("is-active", active);
    dot.setAttribute("aria-selected", active ? "true" : "false");
  });
  const counter = carousel.querySelector(".mkt-counter");
  if (counter) counter.textContent = next + 1 + " of " + count;
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
    marketingHtml(d) +
    (d.simple ? simpleCardHtml(d.simple) : "") +
    '<p class="signoff">Thanks for being a valued customer.<br>The Freedom Mobile Team</p>' +
    '<div class="detail-sent">' +
    icon(m.sentTo.kind === "sms" ? "phone" : "mail", "ic-16") +
    "<p>This message has been sent to: <strong>" + m.sentTo.value + "</strong></p>" +
    "</div>" +
    '<p class="template-note"><strong>Dev annotation:</strong> the regulatory block uses a reusable template — fields: <code>label</code>, <code>date</code>, <code>title</code>, <code>date badge</code>, <code>lead</code>, <code>body</code>, <code>list</code>, <code>footnote</code>. Marketing block fields: <code>chip</code>, <code>headline</code>, <code>body</code>, <code>cta</code>. Not shown to customers.</p>'
  );
}

function showList() {
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = true;
  viewPref2El.hidden = true;
  viewPref3El.hidden = true;
  viewListEl.hidden = false;
  document.title = "Message Centre (For Launch) | Freedom Mobile";
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
  viewPref2El.hidden = true;
  viewPref3El.hidden = true;
  viewDetailEl.hidden = false;
  document.title = m.subject + " | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showProfile() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewPrefEl.hidden = true;
  viewPref2El.hidden = true;
  viewPref3El.hidden = true;
  viewProfileEl.hidden = false;
  document.title = "My Profile | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showPreferences() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPref2El.hidden = true;
  viewPref3El.hidden = true;
  viewPrefEl.hidden = false;
  prefRegChanged = false;
  hidePrefBanners();
  document.title = "Notification Preferences (For Launch) | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showPreferences2() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = true;
  viewPref3El.hidden = true;
  viewPref2El.hidden = false;
  pref2ConfirmEl.hidden = true;
  setPrefActionsSaved(viewPref2El, pref2SaveEl, false);
  syncMarketingChannels();
  document.title = "Notification Preferences (Option 2) | Freedom Mobile";
  window.scrollTo(0, 0);
}

function showPreferences3() {
  viewListEl.hidden = true;
  viewDetailEl.hidden = true;
  viewProfileEl.hidden = true;
  viewPrefEl.hidden = true;
  viewPref2El.hidden = true;
  viewPref3El.hidden = false;
  pref3RegChanged = false;
  hidePref3Banners();
  document.title = "Notification Preferences (Option 3) | Freedom Mobile";
  window.scrollTo(0, 0);
}

backBtnEl.addEventListener("click", function () {
  location.hash = "#/";
});

function setPrefActionsSaved(viewEl, saveBtn, saved) {
  const cancel = viewEl.querySelector(".pref-actions .btn-cancel");
  saveBtn.textContent = saved ? "Back to Overview" : "Save";
  saveBtn.dataset.state = saved ? "saved" : "editing";
  if (cancel) cancel.hidden = saved;
}

let prefRegChanged = false;

function hidePrefBanners() {
  prefConfirmEl.hidden = true;
  prefOptoutEl.hidden = true;
  setPrefActionsSaved(viewPrefEl, prefSaveEl, false);
}

prefSaveEl.addEventListener("click", function () {
  if (prefSaveEl.dataset.state === "saved") {
    location.hash = "#/";
    return;
  }
  const optOut = viewPrefEl.querySelector('input[name="mkt-pref"][value="required"]');
  const optedOut = !!(optOut && optOut.checked);
  prefOptoutEl.hidden = !optedOut;
  prefConfirmEl.hidden = optedOut && !prefRegChanged;
  (prefConfirmEl.hidden ? prefOptoutEl : prefConfirmEl).focus();
  prefRegChanged = false;
  setPrefActionsSaved(viewPrefEl, prefSaveEl, true);
});

viewPrefEl.addEventListener("change", function (e) {
  if (e.target.name === "reg-method") {
    prefRegChanged = true;
  }
  hidePrefBanners();
});

function syncMarketingChannels() {
  const optOut = viewPref2El.querySelector('input[name="mkt-pref-2"][value="no"]');
  prefChannelsEl.hidden = !!(optOut && optOut.checked);
}

pref2SaveEl.addEventListener("click", function () {
  if (pref2SaveEl.dataset.state === "saved") {
    location.hash = "#/";
    return;
  }
  pref2ConfirmEl.hidden = false;
  pref2ConfirmEl.focus();
  setPrefActionsSaved(viewPref2El, pref2SaveEl, true);
});

viewPref2El.addEventListener("change", function (e) {
  if (e.target.name === "mkt-pref-2") {
    syncMarketingChannels();
  }
  pref2ConfirmEl.hidden = true;
  setPrefActionsSaved(viewPref2El, pref2SaveEl, false);
});

let pref3RegChanged = false;

function hidePref3Banners() {
  pref3ConfirmEl.hidden = true;
  pref3OptoutEl.hidden = true;
  setPrefActionsSaved(viewPref3El, pref3SaveEl, false);
}

pref3SaveEl.addEventListener("click", function () {
  if (pref3SaveEl.dataset.state === "saved") {
    location.hash = "#/";
    return;
  }
  const boxes = viewPref3El.querySelectorAll('input[name="mkt-channel-3"]');
  const optedOut = !Array.prototype.some.call(boxes, function (b) { return b.checked; });
  pref3OptoutEl.hidden = !optedOut;
  pref3ConfirmEl.hidden = optedOut && !pref3RegChanged;
  (pref3ConfirmEl.hidden ? pref3OptoutEl : pref3ConfirmEl).focus();
  pref3RegChanged = false;
  setPrefActionsSaved(viewPref3El, pref3SaveEl, true);
});

viewPref3El.addEventListener("change", function (e) {
  if (e.target.name === "reg-method-3") {
    pref3RegChanged = true;
  }
  hidePref3Banners();
});

const DRAWER_CONTENT = {
  marketing: {
    title: "What are marketing communications?",
    paragraphs: [
      "Marketing communications are optional messages about offers, promotions and products we think you'll find useful. They are not required to keep your service running, so you choose whether to receive them.",
      "You can change your choice at any time, and opting out never affects your plan, your billing or the required notices we have to send you."
    ],
    listTitle: "Examples",
    list: [
      "Exclusive discounts and limited-time promotions",
      "Bundle offers, such as adding Home Internet",
      "Device upgrade and trade-in offers",
      "New product and feature announcements"
    ]
  },
  regulatory: {
    title: "What are regulatory alerts?",
    paragraphs: [
      "Regulatory alerts are important notices about your account that we are required to send you under CRTC rules, such as the Wireless Code. Because they are required, you cannot opt out of them — you only choose how you receive them.",
      "These notices help you avoid surprises on your bill by telling you in advance when something about your agreement or pricing is changing."
    ],
    listTitle: "Examples",
    list: [
      "Your contract or Tab agreement is ending",
      "A promotional credit or discount is expiring",
      "A change to your plan price or terms of service",
      "Data or roaming usage that may lead to extra charges"
    ]
  }
};

function drawerBodyHtml(c) {
  return (
    '<h2 class="drawer-title" id="drawer-title">' + c.title + "</h2>" +
    c.paragraphs.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
    '<p class="drawer-subtitle">' + c.listTitle + "</p>" +
    '<ul class="drawer-list">' + c.list.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ul>"
  );
}

function openDrawer(key) {
  const content = DRAWER_CONTENT[key];
  if (!content) return;
  drawerBodyEl.innerHTML = drawerBodyHtml(content);
  drawerScrimEl.hidden = false;
  drawerEl.hidden = false;
  drawerEl.focus();
}

function closeDrawer() {
  if (drawerEl.hidden) return;
  drawerEl.hidden = true;
  drawerScrimEl.hidden = true;
  if (drawerReturnFocusEl && document.contains(drawerReturnFocusEl)) {
    drawerReturnFocusEl.focus();
  }
  drawerReturnFocusEl = null;
}

document.addEventListener("click", function (e) {
  const trigger = e.target.closest("[data-drawer]");
  if (trigger) {
    drawerReturnFocusEl = trigger;
    openDrawer(trigger.dataset.drawer);
    return;
  }
  if (e.target === drawerScrimEl) closeDrawer();
});

drawerDismissEl.addEventListener("click", closeDrawer);

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeDrawer();
});

function route() {
  closeDrawer();
  const hash = location.hash.replace(/^#/, "");
  const match = hash.match(/^\/message\/([\w-]+)/);
  if (match) {
    showDetail(match[1]);
  } else if (hash === "/profile") {
    showProfile();
  } else if (hash === "/preferences") {
    showPreferences();
  } else if (hash === "/preferences2") {
    showPreferences2();
  } else if (hash === "/preferences3") {
    showPreferences3();
  } else {
    showList();
  }
}

window.addEventListener("hashchange", route);
route();
