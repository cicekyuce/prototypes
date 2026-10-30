// Phone tab: OS home screen + Freedom app. Receives the desktop sign-in
// request as a push notification and answers it through FMSync.
(function () {
  const $ = (id) => document.getElementById(id);
  const APP_SCREENS = ["overview", "approve", "approved", "denied", "expired", "settings", "security", "devices", "activity", "notifications"];
  const LIGHT_STATUS = ["home"];

  let notifiedRequestId = null;
  let notifiedSmsId = (FMSync.read().sms || {}).id || null;
  let handledLocally = null;
  let bannerTimer = null;
  let bannerTarget = null;
  let approveTimer = null;
  let sheetConfirm = null;

  // ---------- Routing ----------
  function route() {
    const name = (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];
    return name === "app" ? "overview" : name;
  }

  function go(name) {
    const target = name === "home" ? "#/" : name === "overview" ? "#/app" : "#/" + name;
    if (location.hash !== target) location.hash = target;
    else render();
  }

  function render() {
    const name = route();
    const inApp = APP_SCREENS.includes(name);
    $("os-home").hidden = name !== "home";
    $("app").hidden = !inApp;
    $("messages").hidden = name !== "messages";
    APP_SCREENS.forEach((s) => {
      const el = $("scr-" + s);
      const show = s === name;
      if (show && el.hidden) {
        el.classList.remove("slide");
        void el.offsetWidth;
        el.classList.add("slide");
      }
      el.hidden = !show;
      if (show) el.scrollTop = 0;
    });
    const light = LIGHT_STATUS.includes(name);
    $("status-bar").classList.toggle("light", light);
    $("home-indicator").classList.toggle("light", light);

    const state = FMSync.read();
    renderBadges(state);
    renderSide(state);
    if (name === "approve") renderApprove(state);
    if (name === "settings") renderSettings(state);
    if (name === "security") renderSecurity(state);
    if (name === "devices") renderDevices(state);
    if (name === "activity") renderActivity(state);
    if (name === "notifications") renderNotifications(state);
    if (name === "messages") renderMessages(state);
    if (name === "approve" || name === "messages") hideBanner();
  }

  window.addEventListener("hashchange", render);

  // ---------- Helpers ----------
  function isPending(state) {
    const r = state.request;
    return !!(r && r.status === "pending" && r.expiresAt > Date.now());
  }

  function toast(text) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.querySelector(".device").appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  function openSheet({ title, text, confirm, danger, onConfirm }) {
    $("sheet-title").textContent = title;
    $("sheet-text").textContent = text;
    $("sheet-confirm").textContent = confirm;
    $("sheet-confirm").classList.toggle("danger", !!danger);
    sheetConfirm = onConfirm;
    $("sheet").hidden = false;
  }
  function closeSheet() {
    $("sheet").hidden = true;
    sheetConfirm = null;
  }

  // ---------- Banner ----------
  function showBanner({ kind, title, text, target }) {
    const b = $("push-banner");
    clearTimeout(bannerTimer);
    b.classList.remove("leaving");
    b.querySelector(".pb-icon").classList.toggle("sms", kind === "sms");
    b.querySelector(".pb-top strong").textContent = kind === "sms" ? "MESSAGES" : "TIME SENSITIVE";
    $("pb-title").textContent = title;
    $("pb-text").textContent = text;
    bannerTarget = target;
    b.hidden = true;
    void b.offsetWidth;
    b.hidden = false;
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    bannerTimer = setTimeout(hideBanner, 9000);
  }
  function hideBanner() {
    const b = $("push-banner");
    if (b.hidden) return;
    clearTimeout(bannerTimer);
    b.classList.add("leaving");
    setTimeout(() => {
      b.hidden = true;
      b.classList.remove("leaving");
    }, 280);
  }

  // ---------- Renderers ----------
  function renderBadges(state) {
    $("freedom-badge").hidden = !isPending(state);
    $("messages-badge").hidden = !(state.sms && state.sms.id !== readSmsSeen());
  }

  function renderSide(state) {
    const pending = isPending(state);
    $("side-status").classList.toggle("pending", pending);
    $("side-status").lastElementChild.textContent = pending
      ? "Sign-in request waiting — open the Freedom app"
      : state.settings.pushApprovals
        ? "Waiting for a sign-in request"
        : "Desktop sign-in approvals are off (text codes instead)";
  }

  function renderApprove(state) {
    clearInterval(approveTimer);
    const r = state.request;
    if (!isPending(state)) {
      showExpired(r);
      return;
    }
    $("req-email").textContent = FMSync.maskEmail(r.email);
    $("req-browser").textContent = r.browser;
    $("req-city").textContent = r.city;
    $("req-ip").textContent = r.ip;
    $("req-time").textContent = FMSync.formatTime(r.createdAt);
    const tick = () => {
      const left = Math.max(0, r.expiresAt - Date.now());
      const secs = Math.ceil(left / 1000);
      $("req-expires").textContent = "This request expires in " + Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
      $("req-expires").classList.toggle("urgent", secs <= 20);
      if (left <= 0) {
        clearInterval(approveTimer);
        showExpired({ status: "expired" });
      }
    };
    tick();
    approveTimer = setInterval(tick, 250);
  }

  function showExpired(r) {
    const status = r && r.status;
    const copy = {
      cancelled: ["Sign-in was cancelled", "The sign-in was cancelled on the computer. No action is needed."],
      approved: ["Already approved", "This sign-in request was already approved."],
      denied: ["Already denied", "This sign-in request was already denied."],
    }[status] || [
      r ? "Time's up" : "No sign-in requests",
      r ? "Your notification has expired. If you're still trying to sign in, request a new notification from your computer." : "There are no sign-in requests waiting for your approval.",
    ];
    $("expired-title").textContent = copy[0];
    $("expired-text").textContent = copy[1];
    go("expired");
  }

  function renderSettings(state) {
    const s = state.settings;
    const parts = [s.faceId ? "Face ID on" : "Face ID off", s.pushApprovals ? "sign-in approvals on" : "sign-in approvals off"];
    $("security-summary").textContent = parts.join(" · ");
    $("devices-summary").textContent = state.devices.length + (state.devices.length === 1 ? " device" : " devices");
  }

  function renderSecurity(state) {
    const s = state.settings;
    $("tg-push").checked = s.pushApprovals;
    $("tg-faceid").checked = s.faceId;
    $("approval-device-row").hidden = !s.pushApprovals;
    $("push-off-hint").hidden = s.pushApprovals;
    $("devices-summary-2").textContent = state.devices.length + (state.devices.length === 1 ? " device" : " devices");
    const last = state.activity[0];
    $("activity-summary").textContent = last ? "Last request " + FMSync.formatTime(last.at).toLowerCase() : "No recent activity";
  }

  function renderDevices(state) {
    const list = $("device-list");
    list.innerHTML = "";
    state.devices.forEach((d) => {
      const li = document.createElement("li");
      li.className = "row";
      li.innerHTML =
        '<span class="row-ico ic-device"></span><span class="row-main"><strong></strong><span></span></span>';
      li.querySelector("strong").textContent = d.name;
      li.querySelector(".row-main span").textContent = d.detail;
      if (d.id === "d-phone") {
        const pill = document.createElement("span");
        pill.className = "pill ok";
        pill.textContent = state.settings.pushApprovals ? "Approval device" : "This device";
        li.appendChild(pill);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "remove-btn";
        btn.textContent = "Remove";
        btn.addEventListener("click", () =>
          openSheet({
            title: "Remove this device?",
            text: d.name + " will be signed out and will need a new approval the next time it signs in.",
            confirm: "Remove device",
            danger: true,
            onConfirm: () => {
              FMSync.update((st) => {
                st.devices = st.devices.filter((x) => x.id !== d.id);
              });
              toast("Device removed");
            },
          })
        );
        li.appendChild(btn);
      }
      list.appendChild(li);
    });
  }

  function renderActivity(state) {
    const list = $("activity-list");
    list.innerHTML = "";
    if (!state.activity.length) {
      list.innerHTML = '<li class="row"><span class="row-main"><span>No sign-in activity yet.</span></span></li>';
      return;
    }
    state.activity.forEach((a) => {
      const li = document.createElement("li");
      li.className = "row";
      li.innerHTML = '<span class="row-main"><strong></strong><span></span></span><span class="pill"></span>';
      li.querySelector("strong").textContent = a.browser;
      li.querySelector(".row-main span").textContent = a.city + " · " + FMSync.formatTime(a.at);
      const pill = li.querySelector(".pill");
      pill.textContent = a.result === "approved" ? "Approved" : "Denied";
      pill.classList.add(a.result === "approved" ? "ok" : "bad");
      list.appendChild(li);
    });
  }

  function renderNotifications(state) {
    const s = state.settings;
    $("tg-security").checked = s.securityAlerts || s.pushApprovals;
    $("tg-security").disabled = s.pushApprovals;
    $("security-alert-text").textContent = s.pushApprovals
      ? "Required while desktop sign-in approvals are on."
      : "Sign-in requests and security alerts.";
    $("tg-billing").checked = s.billingAlerts;
    $("tg-usage").checked = s.usageAlerts;
    $("tg-offers").checked = s.offerAlerts;
  }

  function readSmsSeen() {
    return sessionStorage.getItem("fm-sms-seen");
  }

  function renderMessages(state) {
    const thread = $("msg-thread");
    thread.innerHTML = "";
    if (!state.sms) {
      thread.innerHTML = '<p class="msg-empty">No messages from Freedom yet.</p>';
      return;
    }
    sessionStorage.setItem("fm-sms-seen", state.sms.id);
    const time = document.createElement("p");
    time.className = "msg-time";
    time.textContent = "Text Message · " + FMSync.formatTime(state.sms.sentAt);
    const bubble = document.createElement("p");
    bubble.className = "msg-bubble";
    bubble.innerHTML = "Freedom: <b></b> is your My Account verification code. It expires in 10 minutes. Never share this code.";
    bubble.querySelector("b").textContent = state.sms.code;
    thread.append(time, bubble);
    renderBadges(state);
  }

  // ---------- Sync with the desktop tab ----------
  function onState(state) {
    const r = state.request;
    if (isPending(state) && r.id !== notifiedRequestId) {
      notifiedRequestId = r.id;
      const name = route();
      if (name === "approve") {
        renderApprove(state);
      } else if (APP_SCREENS.includes(name)) {
        go("approve");
      } else {
        showBanner({
          kind: "push",
          title: "Freedom",
          text: "It looks like you're trying to sign in on another device. Tap to verify sign in attempt.",
          target: "approve",
        });
      }
    }
    if (!isPending(state) && bannerTarget === "approve") hideBanner();
    if (route() === "approve" && r && r.status !== "pending" && r.id !== handledLocally) {
      clearInterval(approveTimer);
      showExpired(r);
    }
    if (state.sms && state.sms.id !== notifiedSmsId) {
      notifiedSmsId = state.sms.id;
      showBanner({
        kind: "sms",
        title: "Freedom",
        text: "Freedom: " + state.sms.code + " is your My Account verification code. Never share this code.",
        target: "messages",
      });
    }
    renderBadges(state);
    renderSide(state);
    const name = route();
    if (name === "settings") renderSettings(state);
    if (name === "security") renderSecurity(state);
    if (name === "devices") renderDevices(state);
    if (name === "activity") renderActivity(state);
    if (name === "notifications") renderNotifications(state);
  }
  FMSync.subscribe(onState);

  // ---------- Approve / deny ----------
  function approve() {
    const state = FMSync.read();
    if (!isPending(state)) return showExpired(state.request);
    const id = state.request.id;
    const finish = () => {
      const latest = FMSync.read().request;
      if (!latest || latest.id !== id || latest.status !== "pending") return showExpired(latest);
      handledLocally = id;
      clearInterval(approveTimer);
      FMSync.resolveRequest(id, "approved");
      $("ok-browser").textContent = latest.browser;
      go("approved");
    };
    if (!state.settings.faceId) return finish();
    const fx = $("faceid");
    fx.classList.remove("done");
    $("faceid-label").textContent = "Face ID";
    fx.hidden = false;
    setTimeout(() => {
      fx.classList.add("done");
      $("faceid-label").textContent = "Confirmed";
    }, 1100);
    setTimeout(() => {
      fx.hidden = true;
      finish();
    }, 1700);
  }

  function deny() {
    openSheet({
      title: "Report unusual activity",
      text: "For your security, after you report unusual activity, please reset your password.",
      confirm: "Report",
      danger: true,
      onConfirm: () => {
        const r = FMSync.read().request;
        if (!r || r.status !== "pending") return showExpired(r);
        handledLocally = r.id;
        clearInterval(approveTimer);
        FMSync.resolveRequest(r.id, "denied");
        go("denied");
      },
    });
  }

  // ---------- Settings toggles ----------
  function setSetting(key, value) {
    FMSync.update((s) => {
      s.settings[key] = value;
    });
  }

  $("tg-push").addEventListener("change", (e) => {
    if (e.target.checked) {
      setSetting("pushApprovals", true);
      toast("Desktop sign-in approvals on");
      return;
    }
    e.target.checked = true;
    openSheet({
      title: "Turn off sign-in approvals?",
      text: "When you sign in to My Account on a computer, we'll text a verification code to •••-•••-4821 instead of sending a notification to this device.",
      confirm: "Turn off",
      danger: true,
      onConfirm: () => {
        setSetting("pushApprovals", false);
        toast("Desktop sign-in approvals off");
      },
    });
  });
  $("tg-faceid").addEventListener("change", (e) => setSetting("faceId", e.target.checked));
  $("tg-security").addEventListener("change", (e) => setSetting("securityAlerts", e.target.checked));
  $("tg-billing").addEventListener("change", (e) => setSetting("billingAlerts", e.target.checked));
  $("tg-usage").addEventListener("change", (e) => setSetting("usageAlerts", e.target.checked));
  $("tg-offers").addEventListener("change", (e) => setSetting("offerAlerts", e.target.checked));

  // ---------- Wiring ----------
  document.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]");
    if (goEl) return go(goEl.dataset.go);
    if (e.target.closest("[data-back]")) {
      return history.length > 1 ? history.back() : go("settings");
    }
    if (e.target.closest("[data-fake]")) toast("Not part of this prototype");
  });
  document.querySelectorAll("[data-back]").forEach((b) => {
    b.innerHTML = '<img src="../assets/icon-chevron-left.svg" alt="" />';
  });

  $("open-freedom").addEventListener("click", () => {
    hideBanner();
    go(isPending(FMSync.read()) ? "approve" : "overview");
  });
  $("open-messages").addEventListener("click", () => go("messages"));
  $("close-messages").addEventListener("click", () => go("home"));
  $("home-indicator").addEventListener("click", () => go("home"));
  $("push-banner").addEventListener("click", () => {
    const target = bannerTarget;
    hideBanner();
    if (target) go(target);
  });
  $("approve-btn").addEventListener("click", approve);
  $("deny-btn").addEventListener("click", deny);
  $("sheet-cancel").addEventListener("click", closeSheet);
  $("sheet").addEventListener("click", (e) => {
    if (e.target === $("sheet")) closeSheet();
  });
  $("sheet-confirm").addEventListener("click", () => {
    const fn = sheetConfirm;
    closeSheet();
    if (fn) fn();
  });
  $("reset-demo").addEventListener("click", () => {
    FMSync.reset();
    sessionStorage.removeItem("fm-sms-seen");
    location.hash = "#/";
    location.reload();
  });

  // ---------- Clock + heartbeat ----------
  function clock() {
    const now = new Date();
    const t = now.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[ap]\.?m\.?/i, "");
    $("sb-time").textContent = t;
    $("os-clock").textContent = t;
    $("os-date").textContent = now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
    $("cal-day").textContent = now.getDate();
  }
  clock();
  setInterval(clock, 10000);
  FMSync.heartbeat();
  setInterval(FMSync.heartbeat, 2000);

  render();
  onState(FMSync.read());
})();
