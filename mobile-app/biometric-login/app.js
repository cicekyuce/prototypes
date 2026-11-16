(() => {
  const $ = (id) => document.getElementById(id);
  const ORDER = ["lock", "home", "welcome", "drawer", "returning", "signin", "verify", "code", "enroll", "done", "settings"];
  const LIGHT = ["lock", "home", "welcome", "drawer"];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_ATTEMPTS = 3;

  const state = {
    route: null,
    platform: new URLSearchParams(location.search).get("platform") || localStorage.getItem("fm-bio-platform") || "ios",
    email: "",
    channel: "sms",
    code: "",
    delivered: false,
    attempts: 0,
    source: "manual",
    bio: false, remembered: null, device: "ok", offer: false, fails: 0, promptFails: 0, locked: false,
    autoPrompt: false, mode: "new", iosAsked: false, offlineOnce: true,
  };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  /* ---------- Messages ---------- */
  const smsText = (code) =>
    `Your Freedom Mobile verification code is ${code}. Freedom will NEVER ask for this code. Do not share it with anyone.\n\n@myaccount.freedommobile.ca #${code}`;
  const emailText = (code) => `Your verification code is ${code}. Use it to sign in to My Account. It expires in 10 minutes.`;
  

  /* ---------- Clock ---------- */
  const tick = () => {
    const d = new Date();
    const t = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
    const day = d.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
    ["sb-time", "lock-time", "os-clock"].forEach((id) => ($(id).textContent = t));
    ["lock-date", "os-date"].forEach((id) => ($(id).textContent = day));
    $("cal-day").textContent = d.getDate();
  };
  tick();
  setInterval(tick, 15000);

  /* ---------- Platform ---------- */
  function setPlatform(p) {
    state.platform = p === "android" ? "android" : "ios";
    localStorage.setItem("fm-bio-platform", state.platform);
    $("device").classList.toggle("android", state.platform === "android");
    document.querySelectorAll("[data-platform]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.platform === state.platform)));
    if ($("scn-select").options.length) { renderScenario(); applyCopy(); }
    setCodeStep();
    if (state.route === "code") startCode();
  }
  document.querySelectorAll("[data-platform]").forEach((b) => b.addEventListener("click", () => setPlatform(b.dataset.platform)));

  function setCodeStep() {
    const email = state.channel === "email";
    const step = document.querySelector('[data-step="code"]');
    if (!step) return;
    step.innerHTML = state.platform === "ios"
      ? `Tap <b>From ${email ? "Mail" : "Messages"}</b> above the keypad`
      : email ? "Tap the <b>From Gmail</b> code above the keypad" : "Tap <b>Allow</b> to share the text with Freedom";
  }

  /* ---------- Routing ---------- */
  function parse() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const route = ORDER.includes(parts[0]) ? parts[0] : "lock";
    return { route, via: parts[1] === "email" ? "email" : "sms" };
  }

  function render() {
    const { route, via } = parse();
    const prev = state.route;
    if (prev === route && !(route === "code" && via !== state.channel)) return;
    clearTimers();
    hideBanner(true);
    closeKeypad(true);
    $("consent").hidden = true;

    const screen = route === "drawer" ? "welcome" : route;
    const back = prev && ORDER.indexOf(route) < ORDER.indexOf(prev);
    document.querySelectorAll(".screen").forEach((s) => {
      const show = s.id === `scr-${screen}`;
      if (show && s.hidden && prev) {
        s.classList.remove("slide", "slide-back");
        void s.offsetWidth;
        s.classList.add(back ? "slide-back" : "slide");
      }
      s.hidden = !show;
    });
    state.route = route;

    $("status-bar").classList.toggle("light", LIGHT.includes(route));
    $("home-indicator").classList.toggle("light", ["lock", "home", "welcome"].includes(route));
    if (route === "drawer") openDrawer(); else if (!$("drawer").hidden) closeDrawer();

    if (!["fid", "bp", "ios-alert"].every((id) => $(id).hidden)) closeAllPrompts();
    if (route === "returning") prepReturning();
    if (route === "settings") prepSettings();
    if (route === "enroll") { $("enroll-on").focus({ preventScroll: true }); }

    if (route === "signin") prepSignin();
    if (route === "verify") prepVerify();
    if (route === "code") { state.channel = via; startCode(); }
    if (route === "done") { $("scr-done").scrollTop = 0; const n = (state.email || CICEK).split("@")[0].split(/[._-]/)[0]; $("ov-hi").textContent = `Hi, ${n.charAt(0).toUpperCase()}${n.slice(1)}`; }
  }
  const go = (hash) => { location.hash = `#/${hash}`; };
  window.addEventListener("hashchange", render);
  document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => go(b.dataset.back)));

  /* ---------- Toast ---------- */
  function toast(text) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    $("device").appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
  document.querySelectorAll("[data-not-in-prototype]").forEach((b) =>
    b.addEventListener("click", (e) => { e.preventDefault(); toast("Not part of this prototype"); }));

  /* ---------- Lock + home screens ---------- */
  $("scr-lock").addEventListener("click", () => go("home"));
  $("open-freedom").addEventListener("click", () => {
    const n = $("signin-notice");
    n.hidden = true;
    void n.offsetWidth;
    n.hidden = false;
    splash();
    state.autoPrompt = true;
    go(state.remembered ? "returning" : "welcome");
  });
  $("signin-notice-close").addEventListener("click", () => { $("signin-notice").hidden = true; });

  /* ---------- 2. Drawer ---------- */
  function openDrawer() {
    $("drawer").classList.remove("leaving");
    $("drawer").hidden = false;
    $("drawer-error").hidden = true;
    $("drawer-email").value = state.email;
    setTimeout(() => $("drawer-email").focus(), 350);
  }
  function closeDrawer() {
    const d = $("drawer");
    if (d.hidden) return;
    d.classList.add("leaving");
    setTimeout(() => { d.hidden = true; d.classList.remove("leaving"); }, 240);
  }
  $("open-drawer").addEventListener("click", () => go("drawer"));
  $("close-drawer").addEventListener("click", () => go("welcome"));
  $("drawer").addEventListener("click", (e) => { if (e.target === $("drawer")) go("welcome"); });
  $("drawer-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("drawer-email").value.trim();
    if (!EMAIL_RE.test(email)) { $("drawer-error").hidden = false; return; }
    state.email = email;
    go("signin");
  });

  /* ---------- 3. Sign in ---------- */
  const syncFilled = (input, field) => field.classList.toggle("filled", input.value.length > 0);
  function prepSignin() {
    const ret = state.mode === "returning";
    $("signin-title").textContent = ret ? "Welcome back." : "Sign in.";
    $("signin-lede").innerHTML = ret ? "Enter your password to continue." : "Please enter your email &amp; password below.";
    $("email").readOnly = ret;
    $("email-field").classList.toggle("locked", ret);
    $("signin-switch-row").hidden = !ret;
    $("email").value = state.email;
    $("password").value = "";
    $("password").type = "password";
    $("signin-error").hidden = true;
    ["email-field", "password-field"].forEach((f) => $(f).classList.remove("invalid"));
    syncFilled($("email"), $("email-field"));
    syncFilled($("password"), $("password-field"));
    $("toggle-password").hidden = true;
    $("clear-email").hidden = ret || !$("email").value;
    setTimeout(() => $(state.email ? "password" : "email").focus(), 260);
  }
  $("email").addEventListener("input", () => { syncFilled($("email"), $("email-field")); $("clear-email").hidden = !$("email").value; });
  $("password").addEventListener("input", () => { syncFilled($("password"), $("password-field")); $("toggle-password").hidden = !$("password").value; });
  $("clear-email").addEventListener("click", () => { $("email").value = ""; syncFilled($("email"), $("email-field")); $("email").focus(); });
  $("toggle-password").addEventListener("click", () => {
    const show = $("password").type === "password";
    $("password").type = show ? "text" : "password";
    $("toggle-password").setAttribute("aria-label", show ? "Hide password" : "Show password");
  });
  $("signin-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const pw = $("password").value;
    $("email-field").classList.toggle("invalid", !EMAIL_RE.test(email));
    $("password-field").classList.toggle("invalid", !pw);
    if (!EMAIL_RE.test(email) || !pw) {
      $("signin-error").textContent = !EMAIL_RE.test(email) ? "Enter a valid email address." : "Enter your password.";
      $("signin-error").hidden = false;
      return;
    }
    state.email = email;
    const btn = e.submitter || $("signin-form").querySelector("[type=submit]");
    btn.classList.add("loading");
    setTimeout(() => { btn.classList.remove("loading"); go("verify"); }, 700);
  });

  /* ---------- 4. Verification channel ---------- */
  const maskEmail = (email) => {
    const [user, domain] = (email || "cicek@address.com").split("@");
    return `${user[0]}***${user.length > 1 ? user[user.length - 1] : ""}@${domain}`;
  };
  function prepVerify() {
    $("masked-email").textContent = maskEmail(state.email);
    $("verify-error").hidden = true;
    document.querySelectorAll('input[name="channel"]').forEach((r) => (r.checked = false));
  }
  $("verify-form").addEventListener("change", () => ($("verify-error").hidden = true));
  $("verify-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const picked = document.querySelector('input[name="channel"]:checked');
    if (!picked) { $("verify-error").hidden = false; return; }
    const btn = e.submitter || $("verify-form").querySelector("[type=submit]");
    btn.classList.add("loading");
    setTimeout(() => { btn.classList.remove("loading"); go(picked.value === "email" ? "code/email" : "code"); }, 600);
  });

  /* ---------- 5. Code entry + autofill ---------- */
  const codeInput = $("code");
  const newCode = () => String(Math.floor(100000 + Math.random() * 900000));
  const sourceLabel = () => (state.channel !== "email" ? "Messages" : state.platform === "android" ? "Gmail" : "Mail");

  function setCodeValue(v) {
    codeInput.value = v;
    syncFilled(codeInput, $("code-field"));
    placeCaret();
  }
  function placeCaret() {
    const cs = getComputedStyle(codeInput);
    const ctx = (placeCaret.c ||= document.createElement("canvas").getContext("2d"));
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const ls = parseFloat(cs.letterSpacing) || 0;
    const w = codeInput.value ? ctx.measureText(codeInput.value).width + ls * codeInput.value.length : 0;
    $("code-field").style.setProperty("--caret", `${w}px`);
  }

  function startCode() {
    clearTimers();
    hideBanner(true);
    $("consent").hidden = true;
    state.code = newCode();
    state.delivered = false;
    state.attempts = 0;
    state.source = "manual";
    setCodeValue("");
    $("code-field").classList.remove("autofilled", "invalid");
    $("code-ok").hidden = true;
    $("code-error").hidden = true;
    $("code-submit").disabled = false;
    $("code-dest").textContent = state.channel === "email" ? maskEmail(state.email) : "********94";
    $("device").classList.toggle("email-code", state.channel === "email");
    setCodeStep();
    resetSuggestion();
    later(openKeypad, 350);
    later(deliver, 1900);
  }

  function deliver() {
    state.delivered = true;
    const isEmail = state.channel === "email";
    showBanner({
      icon: isEmail ? "mail" : "sms",
      title: "Freedom Mobile",
      text: isEmail ? `Mail · ${emailText(state.code)}` : smsText(state.code),
    });
    if (state.platform === "ios" || isEmail) {
      $("qt-from").textContent = `From ${sourceLabel()}`;
      $("qt-code").textContent = state.code;
      $("qt-suggest").disabled = false;
      $("qt-suggest").classList.remove("new");
      void $("qt-suggest").offsetWidth;
      $("qt-suggest").classList.add("new");
    } else if (!isEmail) {
      later(() => {
        $("consent-msg").textContent = smsText(state.code);
        closeKeypad();
        $("consent").hidden = false;
      }, 1100);
    }
  }

  function resetSuggestion() {
    $("qt-from").textContent = "";
    $("qt-code").textContent = "";
    $("qt-suggest").disabled = true;
  }

  function autofill(source) {
    state.source = source;
    closeKeypad();
    hideBanner();
    setCodeValue(state.code);
    $("code-field").classList.add("autofilled");
    $("code-ok-text").textContent = source === "consent" ? "Code filled from your text message" : `Code filled from ${sourceLabel()}`;
    $("code-ok").hidden = false;
    $("code-error").hidden = true;
    later(() => submitCode(), 650);
  }

  function submitCode() {
    const v = codeInput.value;
    $("code-field").classList.remove("invalid");
    if (state.attempts >= MAX_ATTEMPTS) return;
    if (v && v.length !== 6) return showCodeError("Enter the 6-digit code.");
    if (v && v !== state.code) {
      state.attempts++;
      const left = MAX_ATTEMPTS - state.attempts;
      $("code-field").classList.add("invalid");
      if (!left) {
        $("code-submit").disabled = true;
        closeKeypad();
        resetSuggestion();
        return showCodeError("Too many attempts. This code no longer works. Tap Resend to get a new one.");
      }
      return showCodeError(`That code doesn't match. ${left} attempt${left > 1 ? "s" : ""} left.`);
    }
    closeKeypad();
    const btn = $("code-submit");
    btn.classList.add("loading");
    later(() => { btn.classList.remove("loading"); go(afterCode()); }, 900);
  }
  function showCodeError(text) {
    $("code-ok").hidden = true;
    $("code-error").textContent = text;
    $("code-error").hidden = false;
  }

  function typeKey(k) {
    if (state.route !== "code" || state.attempts >= MAX_ATTEMPTS) return;
    $("code-field").classList.remove("autofilled", "invalid");
    $("code-ok").hidden = true;
    $("code-error").hidden = true;
    state.source = "manual";
    let v = codeInput.value;
    v = k === "del" ? v.slice(0, -1) : (v + k).slice(0, 6);
    setCodeValue(v);
    if (v.length === 6) later(submitCode, 250);
  }

  $("code-form").addEventListener("submit", (e) => { e.preventDefault(); submitCode(); });
  $("code-field").addEventListener("click", openKeypad);
  $("scr-code").addEventListener("click", (e) => {
    if (!e.target.closest("#code-field, button, a")) closeKeypad();
  });
  $("resend").addEventListener("click", () => {
    toast(state.channel === "email" ? "New code sent by email" : "New code sent by text");
    startCode();
  });
  $("qt-suggest").addEventListener("click", () => { if (!$("qt-suggest").disabled) autofill("quicktype"); });
  $("consent-allow").addEventListener("click", () => { $("consent").hidden = true; autofill("consent"); });
  $("consent-deny").addEventListener("click", () => { $("consent").hidden = true; openKeypad(); });

  document.addEventListener("keydown", (e) => {
    if (state.route !== "code" || $("keypad").hidden) return;
    if (/^\d$/.test(e.key)) { e.preventDefault(); typeKey(e.key); }
    else if (e.key === "Backspace") { e.preventDefault(); typeKey("del"); }
    else if (e.key === "Enter") { e.preventDefault(); submitCode(); }
  });
  document.querySelectorAll("#keypad [data-key]").forEach((b) => b.addEventListener("click", () => typeKey(b.dataset.key)));

  function openKeypad() {
    if (state.route !== "code" || !$("consent").hidden || state.attempts >= MAX_ATTEMPTS) return;
    $("code-field").classList.add("focus");
    placeCaret();
    const k = $("keypad");
    k.classList.remove("leaving");
    k.hidden = false;
  }
  function closeKeypad(instant) {
    $("code-field").classList.remove("focus");
    const k = $("keypad");
    if (k.hidden) return;
    if (instant) { k.hidden = true; return; }
    k.classList.add("leaving");
    setTimeout(() => { k.hidden = true; k.classList.remove("leaving"); }, 210);
  }

  /* ---------- Banner ---------- */
  let bannerTimer;
  function showBanner({ icon, title, text }) {
    const b = $("banner");
    clearTimeout(bannerTimer);
    $("pb-icon").className = `pb-icon ${icon}`;
    $("pb-title").textContent = title;
    $("pb-text").textContent = text.replace(/\n+/g, " ");
    b.classList.remove("leaving");
    b.hidden = true;
    void b.offsetWidth;
    b.hidden = false;
    bannerTimer = setTimeout(hideBanner, 6000);
  }
  function hideBanner(instant) {
    const b = $("banner");
    clearTimeout(bannerTimer);
    if (b.hidden) return;
    if (instant === true) { b.hidden = true; return; }
    b.classList.add("leaving");
    setTimeout(() => { b.hidden = true; b.classList.remove("leaving"); }, 300);
  }
  $("banner").addEventListener("click", () => hideBanner());

  /* ---------- 6. Done ---------- */

  /* ---------- Restart / notes ---------- */
  function restart() { applyScenario(); }
  $("reset-demo").addEventListener("click", restart);
  $("toggle-notes").addEventListener("click", () => {
    const n = $("notes");
    n.classList.toggle("open");
    if (getComputedStyle(n).display !== "none") n.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  function splash() {
    const s = $("splash");
    s.classList.remove("leaving");
    s.hidden = false;
    setTimeout(() => s.classList.add("leaving"), 1300);
    setTimeout(() => { s.hidden = true; s.classList.remove("leaving"); }, 1560);
  }

  /* ---------- Scenarios ---------- */
  const CICEK = "cicek@address.com";
  const RET = { route: "home", bio: true, remembered: CICEK };
  const FIRST = { route: "lock", bio: false, remembered: null };
  const SCENARIOS = [
    { id: "enroll", group: "Turn on", title: "First sign-in, turn on biometrics", start: FIRST, offer: true,
      steps: ["Unlock the phone and open Freedom", "Sign in with email + password", "Pick text or email for the code", "@code", "Tap <b>Turn on @Bio</b>", "Tap <b>Recognized</b> (or the prompt) to confirm"],
      expect: "Offer shows once after the first password + code sign-in. Turning on asks for one scan, then opens the Overview with a confirmation." },
    { id: "notnow", group: "Turn on", title: "First sign-in, choose Not now", start: FIRST, offer: true,
      steps: ["Sign in with email, password and code", "Tap <b>Not now</b> on the offer", "Overview opens. Menu → Login settings shows it off"],
      expect: "No biometric key is created. The offer doesn't show again; it's only in Login settings." },
    { id: "denied", group: "Turn on", title: "iOS: Face ID permission denied", start: FIRST, offer: true, ios: true,
      steps: ["Sign in with email, password and code", "Tap <b>Turn on Face ID</b>", "Tap <b>Don't Allow</b> on the iOS alert", "Read the message, then see Login settings"],
      expect: "iOS only (Android has no permission prompt). App explains how to allow Face ID in Settings › Freedom; toggle stays off and disabled until allowed." },
    { id: "nodevice", group: "Turn on", title: "Phone has no biometrics set up", start: FIRST, offer: true, device: "none",
      steps: ["Sign in with email, password and code", "No offer shows; the Overview opens", "Menu → Login settings: toggle is disabled"],
      expect: "Don't offer biometrics if none are enrolled on the phone. Settings explains how to set them up and links to phone Settings." },
    { id: "success", group: "Sign in", title: "Biometric sign-in works", start: RET,
      steps: ["Open Freedom from the home screen", "@Prompt opens on its own", "Tap <b>Recognized</b>", "Overview opens. No password or code"],
      expect: "Prompt opens on its own when the app opens (not after sign out). Success skips password and code." },
    { id: "retry", group: "Sign in", title: "Not recognized, then works", start: RET,
      steps: ["Open Freedom", "Tap <b>Not recognized</b>", "@Retry", "Tap <b>Recognized</b>"],
      expect: "iOS: system alert with Try Face ID Again / Use password / Cancel. Android: the prompt stays open with “Not recognized. Try again.”" },
    { id: "fallback", group: "Sign in", title: "Not recognized, use password", start: RET,
      steps: ["Open Freedom", "Tap <b>Not recognized</b>, then <b>Use password</b>", "Enter your password (email is filled in)", "Get the code and enter it (OTP AutoFill)", "Overview opens. Biometrics stay on"],
      expect: "Password sign-in always needs the security code. Biometric settings don't change." },
    { id: "cancel", group: "Sign in", title: "Cancel the prompt", start: RET,
      steps: ["Open Freedom", "Tap <b>Cancel</b> on the prompt (or tap outside it)", "Back on Welcome back: retry with @Bio, use password, or switch account"],
      expect: "Cancel doesn't count as a failure and doesn't reopen the prompt by itself." },
    { id: "lockout", group: "Sign in", title: "Too many tries, biometrics locked", start: RET,
      steps: ["Open Freedom", "Tap <b>Not recognized</b> 5 times (retry each time)", "@Bio is locked: sign in with password and code"],
      expect: "The phone locks biometrics after 5 fails (iOS: unlock with passcode; Android: 30 s, then permanent). The app hides the button and shows a banner. The Freedom account is not locked." },
    { id: "changed", group: "Sign in", title: "Biometrics changed on the phone", start: RET, device: "changed", offer: true,
      steps: ["Open Freedom", "Message: @Bio changed on this phone", "Sign in with password and code", "Offer to turn on @Bio again"],
      expect: "Adding a face or fingerprint invalidates the key (biometryCurrentSet / setInvalidatedByBiometricEnrollment). Ask for the password, then offer biometrics again." },
    { id: "removed", group: "Sign in", title: "Biometrics removed from the phone", start: RET, device: "none",
      steps: ["Open Freedom", "No prompt: banner explains @Bio isn't set up", "Sign in with password and code"],
      expect: "biometryNotEnrolled / BIOMETRIC_ERROR_NONE_ENROLLED: hide the button, explain, use password. Turn biometrics back on in Login settings after setup." },
    { id: "expired", group: "Sign in", title: "Biometric credential expired", start: RET, device: "expired", offer: true,
      steps: ["Open Freedom, tap <b>Recognized</b>", "Message: please sign in again", "Sign in with password and code", "Offer to turn on @Bio again"],
      expect: "The server revokes the credential after a password change or reset, an account lock or 90 days without use. The scan works, but the server refuses it." },
    { id: "offline", group: "Sign in", title: "No connection after the scan", start: RET, device: "offline",
      steps: ["Open Freedom, tap <b>Recognized</b>", "Message: no internet connection", "Tap <b>Try again</b>; Overview opens"],
      expect: "A network error is not an authentication failure: keep biometrics on and let them try again without scanning again." },
    { id: "switch", group: "Accounts", title: "Sign in with a different account", start: RET, offer: true,
      steps: ["Open Freedom, tap <b>Cancel</b> on the prompt", "Tap <b>Sign in with a different account</b>, then <b>Continue</b>", "Sign in with a new email, password and code", "Offer @Bio for the new account"],
      expect: "Only one account per phone. Switching deletes the key on the phone and the server and forgets the saved email." },
    { id: "signout", group: "Accounts", title: "Sign out, then sign back in", start: { route: "done", bio: true, remembered: CICEK },
      steps: ["On the Overview, open the <b>Menu</b>", "Tap <b>Sign out</b>", "Welcome back: tap <b>Sign in with @Bio</b>", "Tap <b>Recognized</b>"],
      expect: "Sign out ends the session but keeps biometrics on. No prompt opens by itself after sign out. (Assumption to confirm with security.)" },
    { id: "off", group: "Accounts", title: "Turn off in Login settings", start: { route: "done", bio: true, remembered: CICEK },
      steps: ["Menu → <b>Login settings</b>", "Turn off <b>Sign in with @Bio</b>, confirm", "Turn it on again: one scan to confirm", "Sign out to see the Welcome back screen"],
      expect: "Turning off deletes the key on the phone and the server. Turning on needs a scan. Password + code apply while it's off." },
  ];
  const params = new URLSearchParams(location.search);
  let scn = SCENARIOS.find((x) => x.id === params.get("s")) || SCENARIOS[0];

  const bioName = () => (state.platform === "ios" ? "Face ID" : "fingerprint");
  const BioName = () => (state.platform === "ios" ? "Face ID" : "Fingerprint");
  const fill = (t) => t
    .replace("@code", state.platform === "ios" ? "Tap <b>From Messages</b> / <b>From Mail</b> above the keypad" : "Tap <b>Allow</b> (text) or the <b>From Gmail</b> code")
    .replace("@Prompt", state.platform === "ios" ? "Face ID" : "The fingerprint prompt")
    .replace("@Retry", state.platform === "ios" ? "Tap <b>Try Face ID Again</b>" : "The prompt stays open")
    .replace(/@Bio/g, bioName());

  function renderScenario() {
    const sel = $("scn-select");
    if (!sel.options.length) {
      let og;
      SCENARIOS.forEach((x, i) => {
        if (!og || og.label !== x.group) { og = document.createElement("optgroup"); og.label = x.group; sel.appendChild(og); }
        const o = document.createElement("option");
        o.value = x.id; o.textContent = `${i + 1}. ${x.title}`; og.appendChild(o);
      });
      sel.addEventListener("change", () => {
        scn = SCENARIOS.find((x) => x.id === sel.value);
        const q = new URLSearchParams(location.search); q.set("s", scn.id);
        history.replaceState(null, "", `?${q}${location.hash}`);
        restart();
      });
    }
    sel.value = scn.id;
    $("scn-desc").textContent = scn.ios && state.platform === "android" ? "iOS only. Switch to iOS to see this one." : fill(scn.expect);
    $("side-steps").innerHTML = scn.steps.map((t) => `<li>${fill(t)}</li>`).join("");
    $("scn-table").innerHTML = SCENARIOS.map((x, i) => `<tr><td>${i + 1}</td><td><a href="?s=${x.id}&platform=${state.platform}">${(x.ios ? x.title : x.title.replace("Face ID", bioName()))}</a></td><td>${fill(x.expect)}</td></tr>`).join("");
  }

  function applyScenario() {
    clearTimers();
    closeAllPrompts();
    Object.assign(state, { bio: scn.start.bio, remembered: scn.start.remembered, email: scn.start.remembered || "",
      device: scn.device || "ok", offer: !!scn.offer, fails: 0, promptFails: 0, locked: false, autoPrompt: false,
      mode: "new", iosAsked: false, offlineOnce: true });
    renderScenario();
    applyCopy();
    state.route = null;
    if (parse().route === scn.start.route) render(); else go(scn.start.route === "lock" ? "" : scn.start.route);
  }

  function applyCopy() {
    const ios = state.platform === "ios";
    $("ret-bio-label").textContent = `Sign in with ${bioName()}`;
    $("enroll-title").textContent = ios ? "Sign in faster with Face ID." : "Sign in faster with your fingerprint.";
    $("enroll-on").textContent = `Turn on ${bioName()}`;
    $("enroll-li1").textContent = ios ? "Look at your phone to sign in to the Freedom app." : "Touch the sensor to sign in to the Freedom app.";
    $("set-bio-title").textContent = `Sign in with ${bioName()}`;
  }

  /* ---------- Welcome back ---------- */
  function prepReturning() {
    const usable = state.bio && state.device !== "none" && !state.locked;
    $("ret-email").textContent = state.remembered || CICEK;
    $("ret-title").textContent = state.remembered === CICEK ? "Welcome back, Cicek." : "Welcome back.";
    $("ret-bio").hidden = !usable;
    $("ret-password").className = `btn btn-block ${usable ? "btn-outline" : "btn-primary"}`;
    let msg = "";
    if (state.locked) msg = `${BioName()} is locked after too many tries. Sign in with your password, or unlock your phone with its passcode to use ${bioName()} again.`;
    else if (state.bio && state.device === "none") msg = `${BioName()} isn't set up on this phone anymore. Sign in with your password. You can turn it back on in Login settings.`;
    $("ret-banner-text").textContent = msg;
    $("ret-banner").hidden = !msg;
    if (state.autoPrompt) {
      state.autoPrompt = false;
      if (state.bio && state.device === "changed") later(bioChanged, 1700);
      else if (usable) later(() => startBio("login"), 1700);
    }
  }
  function bioChanged() {
    dialog({ title: `${BioName()} changed on this phone`, msg: `A ${state.platform === "ios" ? "face" : "fingerprint"} was added or changed in your phone settings. For your security, sign in with your password. You can then turn ${bioName()} back on.`,
      ok: "Sign in with password", cancel: false, onOk: () => { state.bio = false; state.device = "ok"; toPassword(); } });
  }
  function toPassword() { state.mode = "returning"; state.email = state.remembered || CICEK; go("signin"); }
  $("ret-bio").addEventListener("click", () => startBio("login"));
  $("ret-password").addEventListener("click", toPassword);
  $("signin-back").addEventListener("click", () => go(state.mode === "returning" ? "returning" : "welcome"));
  document.querySelectorAll("[data-switch]").forEach((b) => b.addEventListener("click", () => {
    dialog({ title: "Sign in with a different account?",
      msg: state.bio ? `${BioName()} sign-in will be turned off for ${state.remembered} on this phone.` : `${state.remembered || "This account"} will be forgotten on this phone.`,
      ok: "Continue", onOk: () => { state.bio = false; state.remembered = null; state.email = ""; state.mode = "new"; state.offer = true; state.locked = false; go("welcome"); } });
  }));

  /* ---------- Biometric prompt (simulated) ---------- */
  let purpose = null;
  function setSim(on, hint) {
    $("sim-match").disabled = $("sim-nomatch").disabled = !on;
    $("sim").classList.toggle("live", on);
    $("sim-hint").textContent = hint || `Waiting for a ${state.platform === "ios" ? "Face ID" : "fingerprint"} prompt.`;
  }
  function startBio(p, retry) {
    purpose = p;
    closeKeypad(true);
    if (!retry) state.promptFails = 0;
    if (state.platform === "ios") {
      $("fid-hud").className = "fid-hud";
      $("fid").hidden = false;
      void $("fid-hud").offsetWidth;
      $("fid-hud").classList.add("scanning");
    } else {
      $("bp-title").textContent = p === "login" ? "Sign in to Freedom" : "Turn on fingerprint sign-in";
      $("bp-sub").textContent = p === "login" ? state.remembered : "Confirm it's you";
      $("bp-status").textContent = "Touch the fingerprint sensor";
      $("bp").className = "bp-layer";
      $("bp").hidden = false;
    }
    setSim(true, "The phone is asking for a scan. Pick a result:");
  }
  function closeAllPrompts() {
    ["fid", "bp", "ios-alert", "fm", "busy", "menu"].forEach((id) => ($(id).hidden = true));
    setSim(false);
  }
  function bioMatch() {
    if ($("sim-match").disabled) return;
    setSim(false, "Recognized.");
    if (state.platform === "ios") {
      $("fid-hud").classList.add("ok");
      later(() => { $("fid").hidden = true; bioOk(); }, 700);
    } else {
      $("bp").classList.add("ok");
      $("bp-status").textContent = "Fingerprint recognized";
      later(() => { $("bp").hidden = true; bioOk(); }, 600);
    }
  }
  function bioNoMatch() {
    if ($("sim-match").disabled) return;
    state.fails++;
    state.promptFails++;
    if (state.fails >= 5) return lockout();
    if (state.platform === "ios") {
      setSim(false, "Not recognized.");
      $("fid-hud").classList.add("shake");
      later(() => {
        $("fid").hidden = true;
        const first = state.promptFails === 1;
        alertIOS({ face: true, title: "Face Not Recognized", msg: first ? "Try Again" : "",
          btns: [first && ["Try Face ID Again", () => startBio(purpose, true), "bold"], ["Use password", usePassword], ["Cancel", cancelBio]].filter(Boolean) });
      }, 650);
    } else {
      $("bp").classList.remove("shake"); void $("bp").offsetWidth; $("bp").classList.add("shake", "err");
      $("bp-status").textContent = "Not recognized. Try again.";
    }
  }
  function lockout() {
    state.locked = true;
    setSim(false, `${BioName()} is now locked on this phone.`);
    if (state.platform === "ios") {
      $("fid").hidden = true;
      alertIOS({ face: true, title: "Face ID is locked", msg: "Too many attempts. Enter your iPhone passcode to use Face ID again.", btns: [["OK", afterLock, "bold"]] });
    } else {
      $("bp").classList.add("err");
      $("bp-status").textContent = "Too many attempts. Try again later.";
      later(() => { $("bp").hidden = true; afterLock(); }, 1400);
    }
  }
  function afterLock() {
    if (purpose === "login") { state.route = null; render(); } else bioCancelled();
  }
  function usePassword() { closeAllPrompts(); if (purpose === "login") toPassword(); else bioCancelled(); }
  function cancelBio() { closeAllPrompts(); if (purpose === "login") toast("Sign in cancelled"); else bioCancelled(); }
  function bioCancelled() { toast(`${BioName()} not turned on`); if (state.route === "settings") prepSettings(); }

  function bioOk() {
    if (purpose !== "login") {
      state.bio = true; state.remembered = state.email; state.fails = 0; state.locked = false; state.device = "ok";
      if (state.route === "settings") { prepSettings(); toast(`${BioName()} sign-in is on`); }
      else { go("done"); later(() => toast(`${BioName()} sign-in is on`), 400); }
      return;
    }
    busy("Signing in…");
    later(() => {
      $("busy").hidden = true;
      if (state.device === "expired") {
        return dialog({ title: "Please sign in again", msg: `For your security, sign in with your password and a security code. You can then turn ${bioName()} back on.`,
          ok: "Sign in with password", cancel: false, onOk: () => { state.bio = false; state.device = "ok"; toPassword(); } });
      }
      if (state.device === "offline" && state.offlineOnce) {
        return dialog({ title: "No internet connection", msg: "Check your Wi-Fi or mobile data and try again.", ok: "Try again", cancel: false,
          onOk: () => { state.offlineOnce = false; purpose = "login"; bioOk(); } });
      }
      state.fails = 0;
      state.email = state.remembered;
      go("done");
    }, 900);
  }
  $("sim-match").addEventListener("click", bioMatch);
  $("sim-nomatch").addEventListener("click", bioNoMatch);
  $("fid-hud").addEventListener("click", bioMatch);
  $("bp-fp").addEventListener("click", bioMatch);
  $("bp-neg").addEventListener("click", usePassword);
  $("bp").addEventListener("click", (e) => { if (e.target === $("bp")) cancelBio(); });
  document.addEventListener("keydown", (e) => {
    if ($("sim-match").disabled || e.target.matches("input")) return;
    if (e.key === "y") bioMatch();
    if (e.key === "n") bioNoMatch();
  });

  /* ---------- Dialogs ---------- */
  function alertIOS({ face, title, msg, btns }) {
    $("ia-face").hidden = !face;
    $("ia-title").textContent = title;
    $("ia-msg").textContent = msg;
    $("ia-msg").hidden = !msg;
    $("ia-btns").innerHTML = "";
    btns.forEach(([label, fn, cls]) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label; if (cls) b.className = cls;
      b.addEventListener("click", () => { $("ios-alert").hidden = true; fn(); });
      $("ia-btns").appendChild(b);
    });
    $("ios-alert").hidden = false;
  }
  let fmOk = null;
  function dialog({ title, msg, ok, cancel = true, onOk }) {
    $("fm-title").textContent = title;
    $("fm-msg").textContent = msg;
    $("fm-ok").textContent = ok;
    $("fm-cancel").hidden = !cancel;
    fmOk = onOk;
    $("fm").hidden = false;
  }
  $("fm-ok").addEventListener("click", () => { $("fm").hidden = true; fmOk && fmOk(); });
  $("fm-cancel").addEventListener("click", () => { $("fm").hidden = true; });
  function busy(t) { $("busy-text").textContent = t; $("busy").hidden = false; }

  /* ---------- After code / enrollment offer ---------- */
  function afterCode() {
    state.remembered = state.email;
    state.locked = false;
    state.fails = 0;
    return state.offer && !state.bio && state.device !== "none" ? "enroll" : "done";
  }
  $("enroll-on").addEventListener("click", () => {
    state.offer = false;
    if (state.platform === "ios" && !state.iosAsked) {
      state.iosAsked = true;
      if (scn.id === "denied") {
        return alertIOS({ face: true, title: "Do you want to allow “Freedom” to use Face ID?", msg: "Use Face ID to sign in to your Freedom account quickly and securely.",
          btns: [["Don't Allow", denied], ["OK", () => startBio("enroll"), "bold"]] });
      }
    }
    startBio("enroll");
  });
  function denied() {
    state.device = "denied";
    dialog({ title: "Face ID is off for Freedom", msg: "To use it, go to your iPhone Settings › Freedom and turn on Face ID. You can then turn it on in Login settings.",
      ok: "Continue", cancel: false, onOk: () => go("done") });
  }
  $("enroll-skip").addEventListener("click", () => { state.offer = false; go("done"); later(() => toast("You can turn it on in Login settings"), 400); });

  /* ---------- Menu + settings ---------- */
  $("open-menu").addEventListener("click", () => { $("menu").hidden = false; });
  $("close-menu").addEventListener("click", () => { $("menu").hidden = true; });
  $("menu").addEventListener("click", (e) => { if (e.target === $("menu")) $("menu").hidden = true; });
  $("menu-settings").addEventListener("click", () => { $("menu").hidden = true; go("settings"); });
  $("menu-signout").addEventListener("click", () => {
    $("menu").hidden = true;
    busy("Signing out…");
    later(() => { $("busy").hidden = true; state.autoPrompt = false; go("returning"); }, 700);
  });
  function prepSettings() {
    const sw = $("set-bio");
    const blocked = state.device === "none" || state.device === "denied";
    sw.setAttribute("aria-checked", String(state.bio && !blocked));
    sw.disabled = blocked;
    $("set-bio-sub").textContent = state.device === "none" ? `Set up ${bioName()} in your phone settings first.`
      : state.device === "denied" ? "Allow Face ID for Freedom in your iPhone Settings."
      : state.bio ? "On. No password or code needed on this phone." : "Off. You sign in with your password and a code.";
    $("set-open-os").hidden = !blocked;
    $("set-email").textContent = state.email || CICEK;
  }
  $("set-bio").addEventListener("click", () => {
    if (state.bio) {
      dialog({ title: `Turn off ${bioName()}?`, msg: "You'll sign in with your password and a security code on this phone.", ok: "Turn off",
        onOk: () => { state.bio = false; prepSettings(); toast(`${BioName()} sign-in is off`); } });
    } else startBio("enroll");
  });
  $("set-open-os").addEventListener("click", () => toast("Opens the phone Settings app"));

  setPlatform(state.platform);
  applyScenario();
})();
