// Trust-a-device prototype: binds this phone as the single trusted device
// for push sign-in approvals (Wealthsimple trusted-device flow, one device
// for Freedom), after step-up verification and telco checks.
(function () {
  const $ = (id) => document.getElementById(id);
  const EMAIL = "c•••••@freedommobile.ca";
  const PHONE = "(***) ***-**21";
  const TODAY = new Date().toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" });
  const OLD_LOGIN = "September 14, 2026";
  let s;
  let timers = [];

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    s = { existing: $("sc-existing").checked, sim: $("sc-sim").checked, method: "email", trusted: false, mode: "trust", notif: "unknown", from: "twostep", screen: "start", digits: "", busy: false };
    $("log").innerHTML = '<li class="log-empty">Security checks appear here as you go.</li>';
    ["side-tip", "faceid", "ios-alert", "notif-drawer", "sheet", "code-sheet", "ok-toast", "err-banner"].forEach((id) => ($(id).hidden = true));
    go("start");
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function go(name) {
    if (name === "intro" && s.screen !== "intro") s.from = s.screen === "devices" ? "devices" : "twostep";
    s.screen = name;
    document.querySelectorAll(".app-screen").forEach((el) => {
      const on = el.id === "scr-" + name;
      el.hidden = !on;
      el.classList.toggle("slide", on);
    });
    $("err-banner").hidden = true;
    if (name === "intro") $("intro-replace").hidden = !s.existing;
    if (name === "twostep" || name === "devices") renderTrust();
    if (name === "ios-notif") $("ios-allow").checked = s.notif === "on";
  }

  const CHECK = '<span class="trusted-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  const PHONE_ICO = '<span class="device-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><rect x="6" y="2.5" width="12" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="19" r=".8" fill="currentColor"/></svg></span>';
  const BIN = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l1 13h9l1-13M10 10.5v6M14 10.5v6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function deviceName() { return s.trusted ? "Cicek's iPhone 15" : "Cicek's iPhone 12"; }

  function trustCard() {
    if (s.trusted) return '<div class="trusted-card">' + CHECK + "<span><strong>This device is trusted</strong><span>Cicek's iPhone 15 · Added today</span></span></div>";
    if (s.existing) return '<div class="device-card">' + PHONE_ICO + "<span><strong>Cicek's iPhone 12</strong><span>Trusted device · Not this phone</span></span></div>";
    return '<div class="device-card">' + PHONE_ICO + "<span><strong>No trusted device</strong><span>Sign-in notifications are off</span></span></div>";
  }

  function deviceRow() {
    return '<div class="device-card dev-row">' + PHONE_ICO +
      '<span class="dev-main"><strong>' + deviceName() + (s.trusted ? ' <em class="badge">This phone</em>' : "") + "</strong>" +
      "<span>Last login: " + (s.trusted ? TODAY : OLD_LOGIN) + "</span></span>" +
      '<button class="dev-remove" type="button" id="dev-remove" aria-label="Remove ' + deviceName() + '">' + BIN + "</button></div>";
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
    $("dev-card").innerHTML = any ? deviceRow() : "";
    $("dev-empty").hidden = any;
    $("dev-foot-rm").hidden = !any;
    $("dev-replace").hidden = $("dev-replace-text").hidden = s.trusted || !s.existing;
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

  function okToast(text) {
    $("ok-toast-text").textContent = text;
    $("ok-toast").hidden = false;
    clearTimeout(okToast.timer);
    okToast.timer = setTimeout(() => ($("ok-toast").hidden = true), 3000);
  }

  // Verification code sheet
  function drawBoxes() {
    [...$("code-boxes").children].forEach((b, i) => {
      b.textContent = s.digits[i] || "";
      b.classList.toggle("active", i === Math.min(s.digits.length, 5));
    });
  }

  function sendCode(how) {
    s.digits = "";
    drawBoxes();
    $("code-dest").textContent = s.method === "email" ? EMAIL : PHONE;
    $("switch-method").textContent = s.method === "email" ? "Text me instead" : "Email me instead";
    log("One-time code " + how + " by " + (s.method === "email" ? "email" : "text message") + ". It expires in 10 minutes and works once.");
  }

  function openCode(mode) {
    s.mode = mode;
    s.method = "email";
    s.busy = false;
    $("code-title").textContent = "Enter verification code";
    $("code-step").hidden = false;
    $("checks-step").hidden = true;
    sendCode("sent");
    $("code-sheet").hidden = false;
    $("side-tip").textContent = "Prototype tip: no code needed. Tap Verify to continue.";
    $("side-tip").hidden = false;
  }

  function closeCode() {
    $("code-sheet").hidden = true;
    $("side-tip").hidden = true;
  }

  function typeKey(k) {
    if (s.busy || $("code-step").hidden) return;
    if (k === "del") s.digits = s.digits.slice(0, -1);
    else if (s.digits.length < 6) s.digits += k;
    drawBoxes();
    if (s.digits.length === 6) later(submitCode, 350);
  }

  // Prototype shortcut: Verify accepts any entry, including an empty field.
  function submitCode() {
    if (s.busy) return;
    s.busy = true;
    $("side-tip").hidden = true;
    if (s.mode === "remove") return removeDevice();
    runChecks();
  }

  function runChecks() {
    $("code-title").textContent = "Checking this phone";
    $("code-step").hidden = true;
    $("checks-step").hidden = false;
    const items = [...$("checks").children];
    items.forEach((li) => (li.className = ""));
    items.forEach((li, i) => {
      later(() => (li.className = "running"), i * 650);
      later(() => {
        const fail = s.sim && li.dataset.check === "sim";
        li.className = fail ? "fail" : "ok";
        if (fail) {
          log("Blocked: SIM card changed in the last 72 hours (possible SIM swap). Device not trusted.", true);
          timers.forEach(clearTimeout);
          timers = [];
          later(() => {
            closeCode();
            go("blocked");
          }, 900);
          return;
        }
        log({
          identity: "Identity confirmed with the one-time code.",
          sim: "Carrier records: no SIM change in the last 72 hours.",
          port: "Carrier records: no pending port-out request.",
          device: "Device integrity passed: passcode and Face ID set, not jailbroken, genuine Freedom app.",
        }[li.dataset.check]);
        if (i === items.length - 1) later(() => {
          closeCode();
          runFaceId(finishTrust);
        }, 700);
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

  function finishTrust() {
    log("Face ID confirmed. A device key was created in the iPhone's Secure Enclave; only its public key is sent to Freedom.");
    if (s.existing) log("Cicek's iPhone 12 removed as trusted device and its key revoked (one trusted device per account).");
    s.existing = false;
    s.trusted = true;
    log("Security alert emailed to " + EMAIL + ": \"A new device was trusted on your account.\"");
    go("devices");
    okToast("Trusted device added");
  }

  function removeDevice() {
    const name = deviceName();
    log("Identity confirmed with the one-time code.");
    closeCode();
    if (s.sim) {
      log("Blocked: SIM card changed in the last 72 hours (possible SIM swap). " + name + " stays trusted.", true);
      return go("rm-blocked");
    }
    if (s.trusted) s.trusted = false;
    else s.existing = false;
    log(name + " removed as trusted device and its key revoked. Sign-ins on a computer now use a one-time code.");
    log("Security alert emailed to " + EMAIL + ": \"A trusted device was removed from your account.\"");
    go("twostep");
    okToast("Trusted device removed");
  }

  function notifBlocked() {
    go(s.from);
    $("err-banner").hidden = false;
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

  $("intro-back").addEventListener("click", () => go(s.from));
  $("blocked-done").addEventListener("click", () => go(s.from));

  $("trust-device").addEventListener("click", () => {
    if (s.notif === "unknown") return ($("ios-alert").hidden = false);
    if (s.notif === "off") {
      log("Notifications are off for Freedom. The phone can't be trusted without them.", true);
      return notifBlocked();
    }
    openCode("trust");
  });
  $("notify-allow").addEventListener("click", () => {
    $("ios-alert").hidden = true;
    s.notif = "on";
    log("Time-sensitive notifications allowed.");
    openCode("trust");
  });
  $("notify-deny").addEventListener("click", () => {
    $("ios-alert").hidden = true;
    s.notif = "off";
    log("Notifications not allowed. The phone can't be trusted without them.", true);
    notifBlocked();
  });
  $("err-banner").addEventListener("click", () => go("ios-notif"));
  $("ios-allow").addEventListener("change", (e) => {
    s.notif = e.target.checked ? "on" : "off";
    log("iOS Settings: notifications for Freedom turned " + s.notif + ".");
  });
  $("ios-back").addEventListener("click", () => go(s.from));
  $("ios-back-app").addEventListener("click", () => go(s.from));

  $("keypad").addEventListener("click", (e) => {
    const k = e.target.closest("[data-key]");
    if (k) typeKey(k.dataset.key);
  });
  document.addEventListener("keydown", (e) => {
    if ($("code-sheet").hidden) return;
    if (/^\d$/.test(e.key)) typeKey(e.key);
    else if (e.key === "Backspace") typeKey("del");
  });
  $("code-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitCode();
  });
  $("resend").addEventListener("click", () => {
    sendCode("re-sent");
    toast("New code sent");
  });
  $("switch-method").addEventListener("click", () => {
    s.method = s.method === "email" ? "text" : "email";
    sendCode("sent");
    toast(s.method === "email" ? "Code sent by email" : "Code sent by text");
  });
  $("code-close").addEventListener("click", () => {
    if (!$("checks-step").hidden) return;
    closeCode();
    log("Verification cancelled.");
  });

  $("dev-card").addEventListener("click", (e) => {
    if (!e.target.closest("#dev-remove")) return;
    $("sheet-text").textContent = "We'll remove " + deviceName() + " as your trusted device. Until you trust a phone again, we'll send a one-time code by text or email when you sign in to My Account on a computer.";
    $("sheet").hidden = false;
  });
  $("sheet-cancel").addEventListener("click", () => ($("sheet").hidden = true));
  $("sheet").addEventListener("click", (e) => {
    if (e.target.id === "sheet") $("sheet").hidden = true;
  });
  $("sheet-confirm").addEventListener("click", () => {
    $("sheet").hidden = true;
    log("Removal of " + deviceName() + " requested. Confirming it's you first.");
    openCode("remove");
  });

  $("restart").addEventListener("click", reset);
  $("sc-existing").addEventListener("change", reset);
  $("sc-none").addEventListener("change", reset);
  $("sc-sim").addEventListener("change", reset);
  reset();
})();
