// Trust-a-device prototype: binds this phone as the single trusted device
// for push sign-in approvals, after step-up verification and telco checks.
(function () {
  const $ = (id) => document.getElementById(id);
  const EMAIL = "c•••••@freedommobile.ca";
  const PHONE = "(***) ***-**21";
  let s;
  let timers = [];

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    s = { existing: $("sc-existing").checked, sim: $("sc-sim").checked, method: "email", code: null, trusted: false, mode: "trust" };
    $("log").innerHTML = '<li class="log-empty">Security checks appear here as you go.</li>';
    $("side-tip").hidden = true;
    $("faceid").hidden = true;
    $("ios-alert").hidden = true;
    $("notif-drawer").hidden = true;
    $("notify-off").hidden = true;
    $("ask-notify").textContent = "Turn on notifications";
    $("sheet").hidden = true;
    document.querySelector('input[name=method][value=email]').checked = true;
    go("start");
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function go(name) {
    document.querySelectorAll(".app-screen").forEach((el) => {
      const on = el.id === "scr-" + name;
      el.hidden = !on;
      el.classList.toggle("slide", on);
    });
    if (name === "intro") setMode("trust");
    if (name === "twostep" || name === "devices") renderTrust();
    if (name === "confirm" || name === "done") syncCopy();
    if (name === "code") $("code-input").focus();
    if (name === "checks") runChecks();
  }

  const CHECK = '<span class="trusted-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  const PHONE_ICO = '<span class="device-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><rect x="6" y="2.5" width="12" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="19" r=".8" fill="currentColor"/></svg></span>';

  const BIN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13M10 10.5v6M14 10.5v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function deviceName() { return s.trusted ? "Cicek's iPhone 15" : "Cicek's iPhone 12"; }

  function setMode(mode) {
    s.mode = mode;
    $("verify-back").dataset.go = mode === "remove" ? "devices" : "intro";
    $("verify-why").textContent = mode === "remove"
      ? "Before we remove a trusted device, we need to confirm it's you."
      : "Before we trust a new phone, we need to confirm it's you.";
    if (mode === "trust") {
      $("intro-replace").hidden = !s.existing;
      $("replace-card").hidden = !s.existing;
    }
  }

  function syncCopy() {
    $("replace-card").hidden = !s.existing;
    $("done-sub").textContent = (s.replaced ? "Cicek's iPhone 12 is no longer trusted. " : "") +
      "We emailed " + EMAIL + " to let you know. If this wasn't you, contact us right away.";
  }

  function trustCard() {
    if (s.trusted) return '<div class="trusted-card">' + CHECK + "<span><strong>This device is trusted</strong><span>Cicek's iPhone 15 · Added today</span></span></div>";
    if (s.existing) return '<div class="device-card">' + PHONE_ICO + "<span><strong>Cicek's iPhone 12</strong><span>Trusted device · Not this phone</span></span></div>";
    return '<div class="device-card">' + PHONE_ICO + "<span><strong>No trusted device</strong><span>Sign-in notifications are off</span></span></div>";
  }

  function renderTrust() {
    $("ts-text").textContent = s.trusted
      ? "We'll send sign-in notifications to this phone when you sign in to My Account on a computer."
      : s.existing
        ? "Sign-in notifications go to Cicek's iPhone 12. Trust this phone to get them here instead."
        : "This phone isn't trusted yet. Trust it to approve sign-ins on a computer with a notification.";
    $("ts-card").innerHTML = trustCard();
    $("ts-trust").hidden = s.trusted;
    const any = s.trusted || s.existing;
    $("dev-empty").hidden = any;
    $("dev-list").hidden = !any;
    $("dev-foot-rm").hidden = !any;
    $("dev-replace").hidden = $("dev-replace-text").hidden = s.trusted || !s.existing;
    if (any) {
      $("dev-card").innerHTML = '<div class="dev-row">' + trustCard() +
        '<button class="dev-remove" type="button" id="dev-remove" aria-label="Remove ' + deviceName() + '">' + BIN + "</button></div>";
    }
  }

  function log(text, bad) {
    const empty = $("log").querySelector(".log-empty");
    if (empty) empty.remove();
    const li = document.createElement("li");
    li.textContent = text;
    if (bad) li.className = "bad";
    $("log").appendChild(li);
    $("log").scrollTop = $("log").scrollHeight;
  }

  function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 2200);
  }

  function sendCode() {
    s.method = document.querySelector("input[name=method]:checked").value;
    s.code = String(Math.floor(100000 + Math.random() * 900000));
    const dest = s.method === "email" ? EMAIL : PHONE;
    $("code-dest").textContent = dest;
    $("code-input").value = "";
    $("code-error").hidden = true;
    $("side-tip").textContent = "Prototype tip: no code needed. Tap Verify to continue.";
    $("side-tip").hidden = false;
    log("One-time code sent by " + (s.method === "email" ? "email" : "text message") + ". It expires in 10 minutes and works once.");
  }

  function runChecks() {
    const items = [...$("checks").children];
    items.forEach((li) => (li.className = ""));
    items.forEach((li, i) => {
      later(() => (li.className = "running"), i * 650);
      later(() => {
        const fail = s.sim && li.dataset.check === "sim";
        li.className = fail ? "fail" : "ok";
        if (fail) {
          log("Blocked: SIM card changed in the last 72 hours (possible SIM swap). Device not trusted.", true);
          later(() => go("blocked"), 900);
          timers.slice(0, -1).forEach(clearTimeout);
          return;
        }
        log({
          identity: "Identity confirmed with the one-time code.",
          sim: "Carrier records: no SIM change in the last 72 hours.",
          port: "Carrier records: no pending port-out request.",
          device: "Device integrity passed: passcode and Face ID set, not jailbroken, genuine Freedom app.",
        }[li.dataset.check]);
        if (i === items.length - 1) later(() => go("notify"), 800);
      }, i * 650 + 550);
    });
  }

  function runFaceId(then) {
    const fx = $("faceid");
    fx.classList.remove("done");
    $("faceid-label").textContent = "Face ID";
    fx.hidden = false;
    later(() => {
      fx.classList.add("done");
      $("faceid-label").textContent = "Confirmed";
    }, 1100);
    later(() => {
      fx.hidden = true;
      then();
    }, 1700);
  }

  document.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]");
    if (goEl) go(goEl.dataset.go);
    if (e.target.closest("[data-not-in-prototype]")) toast("This option isn't part of the prototype.");
  });

  $("open-notif-drawer").addEventListener("click", () => ($("notif-drawer").hidden = false));
  $("close-notif-drawer").addEventListener("click", () => ($("notif-drawer").hidden = true));
  $("notif-drawer").addEventListener("click", (e) => {
    if (e.target.id === "notif-drawer") $("notif-drawer").hidden = true;
  });
  $("send-code").addEventListener("click", () => {
    sendCode();
    go("code");
  });
  $("resend").addEventListener("click", () => {
    sendCode();
    toast("New code sent");
  });
  $("code-input").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
  });
  // Prototype shortcut: Verify accepts any entry, including an empty field.
  $("scr-code").addEventListener("submit", (e) => {
    e.preventDefault();
    s.code = null;
    $("side-tip").hidden = true;
    if (s.mode === "remove") return removeDevice();
    go("checks");
  });

  function removeDevice() {
    const name = deviceName();
    log("Identity confirmed with the one-time code.");
    if (s.sim) {
      log("Blocked: SIM card changed in the last 72 hours (possible SIM swap). " + name + " stays trusted.", true);
      return go("rm-blocked");
    }
    if (s.trusted) s.trusted = false;
    else s.existing = false;
    log(name + " removed as trusted device and its key revoked. Sign-ins on a computer now use a one-time code.");
    log("Security alert emailed to " + EMAIL + ": \"A trusted device was removed from your account.\"");
    $("rm-text").textContent = name + " can no longer approve sign-ins. Until you trust a phone, we'll send a one-time code by text or email when you sign in to My Account on a computer.";
    go("removed");
  }

  $("dev-card").addEventListener("click", (e) => {
    if (!e.target.closest("#dev-remove")) return;
    $("sheet-title").textContent = "Remove " + deviceName() + "?";
    $("sheet-text").textContent = "It will stop getting sign-in notifications. Until you trust a phone, we'll send a one-time code by text or email when you sign in to My Account on a computer.";
    $("sheet").hidden = false;
  });
  $("sheet-cancel").addEventListener("click", () => ($("sheet").hidden = true));
  $("sheet").addEventListener("click", (e) => {
    if (e.target.id === "sheet") $("sheet").hidden = true;
  });
  $("sheet-confirm").addEventListener("click", () => {
    $("sheet").hidden = true;
    log("Removal of " + deviceName() + " requested. Confirming it's you first.");
    setMode("remove");
    go("verify");
  });

  $("ask-notify").addEventListener("click", () => {
    if (!$("notify-off").hidden) {
      log("Notifications turned on in iOS Settings.");
      toast("Notifications turned on in Settings");
      return go("confirm");
    }
    $("ios-alert").hidden = false;
  });
  $("notify-allow").addEventListener("click", () => {
    $("ios-alert").hidden = true;
    log("Time-sensitive notifications allowed.");
    go("confirm");
  });
  $("notify-deny").addEventListener("click", () => {
    $("ios-alert").hidden = true;
    $("notify-off").hidden = false;
    $("ask-notify").textContent = "Open Settings";
    log("Notifications not allowed. The phone can't be trusted without them.", true);
  });

  $("confirm-trust").addEventListener("click", () => {
    if (!$("faceid").hidden) return;
    runFaceId(() => {
      log("Face ID confirmed. A device key was created in the iPhone's Secure Enclave; only its public key is sent to Freedom.");
      s.replaced = s.existing;
      if (s.existing) log("Cicek's iPhone 12 removed as trusted device and its key revoked.");
      s.existing = false;
      log("Security alert emailed to " + EMAIL + ": \"A new device was trusted on your account.\"");
      s.trusted = true;
      go("done");
    });
  });

  $("restart").addEventListener("click", reset);
  $("sc-existing").addEventListener("change", reset);
  $("sc-none").addEventListener("change", reset);
  $("sc-sim").addEventListener("change", reset);
  reset();
})();
