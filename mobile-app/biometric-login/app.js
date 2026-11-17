(() => {
  const $ = (id) => document.getElementById(id);
  const ORDER = ["lock", "home", "welcome", "drawer", "signin", "verify", "code", "enroll", "done", "account", "settings", "learn", "os"];
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
    emit(route);
    if (route === "settings") prepSettings();
    if (route === "enroll") { $("enroll-on").focus({ preventScroll: true }); }

    if (route === "signin") prepSignin();
    if (route === "verify") prepVerify();
    if (route === "code") { state.channel = via; startCode(); }
    if (route === "done") $("scr-done").scrollTop = 0;
    if (route !== "done") closeShop(true);
    if (route === "learn") $("scr-learn").scrollTop = 0;
    if (route === "os") { if (!state.osMode) state.osMode = state.device; renderOS(); }
    if (route === "settings") state.osMode = null;
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
    go(state.session ? "done" : "welcome");
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
  $("open-drawer").addEventListener("click", () => {
    if (!state.remembered) return go("drawer");
    if (state.bio && state.device === "changed") return bioChanged();
    if (state.bio && state.device !== "none" && !state.locked) return startBio("login");
    if (state.locked) return showLocked();
    showNotSet();
  });
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
  const MAX_TRIES = 3;
  const RET = { route: "lock", bio: true, remembered: CICEK };
  const SIGNED_IN = { route: "lock", bio: true, remembered: CICEK, session: true };
  const FIRST = { route: "lock", bio: false, remembered: null };
  const SCENARIOS = [
    { id: "enroll", group: "Turn on", title: "First sign-in, turn on biometrics", start: FIRST, offer: true,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Sign in with email + password", ["welcome", "drawer", "signin"]], ["Pick text or email for the code", ["verify"]], ["@code", ["code"]], ["Tap <b>Turn on @Bio</b>", ["enroll"]], ["Tap <b>OK</b> on the iOS alert to allow Face ID", ["permission"], "ios"], ["Tap <b>Recognized</b> (or the prompt) to confirm", ["prompt"]], ["Overview opens with @Bio on", ["done"]]],
      expect: "Offer shows once after the first password + code sign-in. On iOS, the first Face ID use shows the system permission alert (once per install). Turning on asks for one scan, then opens the Overview with a confirmation." },
    { id: "notnow", group: "Turn on", title: "First sign-in, choose Not now", start: FIRST, offer: true,
      steps: [["Sign in with email, password and code", ["lock", "home", "welcome", "drawer", "signin", "verify", "code"]], ["Tap <b>Not now</b> on the offer", ["enroll"]], ["Overview opens. Tap the <b>profile settings</b> icon", ["done"]], ["Tap <b>Manage biometric login</b>", ["account"]], ["Biometric login is OFF", ["settings"]]],
      expect: "No biometric key is created. The offer doesn't show again; it's only in Manage biometric login." },
    { id: "denied", group: "Turn on", title: "iOS: Face ID permission denied", start: FIRST, offer: true, ios: true,
      steps: [["Sign in with email, password and code", ["lock", "home", "welcome", "drawer", "signin", "verify", "code"]], ["Tap <b>Turn on Face ID</b>", ["enroll"]], ["Tap <b>Don't Allow</b> on the iOS alert", ["permission"]], ["Read the message, then tap <b>Continue</b>", ["denied"]], ["Tap the <b>profile settings</b> icon → <b>Manage biometric login</b>", ["done", "account"]], ["Biometric login is OFF. Tap the toggle", ["settings"]], ["Message: allow Face ID for Freedom. Tap <b>Go to Settings</b>", ["os-modal"]], ["Phone Settings: turn on <b>Face ID</b> for Freedom, then go back to Freedom", ["os"]], ["Tap the toggle again and confirm with one scan", ["settings"]], ["Biometric login is ON", ["bio-on"]]],
      expect: "iOS only (Android has no permission prompt). App explains how to allow Face ID. Later, tapping the OFF toggle opens a message with a button to Settings › Freedom; once allowed, the toggle turns on with one scan." },
    { id: "nodevice", group: "Turn on", title: "Phone has no biometrics set up", start: FIRST, offer: true, device: "none",
      steps: [["Sign in with email, password and code", ["lock", "home", "welcome", "drawer", "signin", "verify", "code"]], ["No offer shows; the Overview opens. Tap the <b>profile settings</b> icon", ["done"]], ["Tap <b>Manage biometric login</b>", ["account"]], ["Biometric login is OFF. Tap the toggle", ["settings"]], ["Message: set up @Bio on the phone. Tap <b>Go to Settings</b>", ["os-modal"]], ["Phone Settings: set up @Bio, then go back to Freedom", ["os"]], ["Tap the toggle again and confirm with one scan", ["settings"]], ["Biometric login is ON", ["bio-on"]]],
      expect: "Don't offer biometrics if none are enrolled on the phone. Turning the toggle on opens a message asking to set up biometrics, with a button to the phone Settings. After setup, the toggle turns on with one scan." },
    { id: "success", group: "Sign in", title: "Biometric sign-in works", start: RET,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["@Prompt opens over the pre-login screen: tap <b>Recognized</b>", ["prompt"]], ["Signing in…", ["match"]], ["Overview opens. No password or code", ["done"]]],
      expect: "The app opens on the pre-login screen. Tapping Sign in to My Account opens the prompt over that screen, also after sign out. Cancel returns to the pre-login screen. There is no Welcome back page. Success skips password and code." },
    { id: "retry", group: "Sign in", title: "Not recognized, then works", start: RET,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Not recognized</b>", ["prompt"]], ["@Retry", ["nomatch"]], ["Tap <b>Recognized</b>", ["prompt"]], ["Overview opens", ["done"]]],
      expect: "iOS: system alert with Try Face ID Again / Use password / Cancel. Android: the prompt stays open with “Not recognized. Try again.”" },
    { id: "fallback", group: "Sign in", title: "Not recognized, use password", start: RET,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Not recognized</b>, then <b>Use password</b>", ["prompt"]], ["Enter your password (email is filled in)", ["signin"]], ["Pick text or email for the code", ["verify"]], ["@code", ["code"]], ["Overview opens. Biometrics stay on", ["done"]]],
      expect: "Password sign-in always needs the security code. Biometric settings don't change." },
    { id: "cancel", group: "Sign in", title: "Cancel the prompt", start: RET,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["@Cancel", ["prompt"]], ["Back on the pre-login screen. Tap <b>Sign in to My Account</b> to try again", ["cancel"]]],
      expect: "Cancel closes the prompt and returns to the pre-login screen. It doesn't count as a failure and doesn't reopen the prompt by itself." },
    { id: "lockout", group: "Sign in", title: "Too many tries, biometrics paused", start: RET,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Not recognized</b> 3 times, tapping <b>Try Face ID Again</b> after each", ["prompt"], "ios"], ["Tap <b>Not recognized</b> 3 times (the prompt stays open)", ["prompt"], "android"], ["Back on the pre-login screen, a message says @Bio is paused. Tap <b>Sign in with password</b>", ["locked"]], ["Sign in with password and code", ["signin", "verify", "code"]], ["Overview opens", ["done"]]],
      expect: "After 3 failed scans the app stops the prompt, returns to the pre-login screen and shows the paused message, with Sign in with password. Tapping Sign in to My Account again shows the same message. A password sign-in clears it. The Freedom account is not locked." },
    { id: "changed", group: "Sign in", title: "Biometrics changed on the phone", start: RET, device: "changed", offer: true,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Message: @Bio changed on this phone", ["dialog"]], ["Sign in with password and code", ["signin", "verify", "code"]], ["Offer to turn on @Bio again", ["enroll"]], ["Overview opens", ["done"]]],
      expect: "Adding a face or fingerprint invalidates the key (biometryCurrentSet / setInvalidatedByBiometricEnrollment). Ask for the password, then offer biometrics again." },
    { id: "removed", group: "Sign in", title: "Biometrics removed from the phone", start: RET, device: "none",
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["No prompt: a message says @Bio isn't set up. Tap <b>Sign in with password</b>", ["dialog"]], ["Sign in with password and code", ["signin", "verify", "code"]], ["Overview opens", ["done"]]],
      expect: "biometryNotEnrolled / BIOMETRIC_ERROR_NONE_ENROLLED: no prompt; a message over the pre-login screen explains and offers password sign-in. Turn biometrics back on in Manage biometric login after setup." },
    { id: "expired", group: "Sign in", title: "Biometric credential expired", start: RET, device: "expired", offer: true,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Recognized</b>", ["prompt"]], ["Message: please sign in again", ["dialog"]], ["Sign in with password and code", ["signin", "verify", "code"]], ["Offer to turn on @Bio again", ["enroll"]], ["Overview opens", ["done"]]],
      expect: "The server revokes the credential after a password change or reset, an account lock or 90 days without use. The scan works, but the server refuses it." },
    { id: "offline", group: "Sign in", title: "No connection after the scan", start: RET, device: "offline",
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Recognized</b>", ["prompt"]], ["Message: no internet connection. Tap <b>Try again</b>", ["dialog"]], ["Overview opens. No new scan needed", ["done"]]],
      expect: "A network error is not an authentication failure: keep biometrics on and let them try again without scanning again." },
    { id: "switch", group: "Accounts", title: "Sign in with a different account", start: RET, offer: true,
      steps: [["Unlock the phone and open Freedom", ["lock", "home"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["Tap <b>Not recognized</b>, then <b>Use password</b>", ["prompt"]], ["Tap <b>Sign in with a different account</b>, then <b>Continue</b>", ["signin"]], ["Sign in with a new email, password and code", ["welcome", "drawer", "signin", "verify", "code"]], ["Offer @Bio for the new account", ["enroll"]], ["Overview opens", ["done"]]],
      expect: "Only one account per phone. Switching deletes the key on the phone and the server and forgets the saved email." },
    { id: "signout", group: "Accounts", title: "Sign out, then sign back in", start: SIGNED_IN,
      steps: [["Unlock the phone and open Freedom (still signed in)", ["lock", "home"]], ["On the Overview, tap the <b>profile settings</b> icon", ["done"]], ["Tap <b>Logout</b>", ["account"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["@Prompt opens over the pre-login screen: tap <b>Recognized</b>", ["prompt"]], ["Overview opens", ["done"]]],
      expect: "Sign out ends the session but keeps biometrics on. Logout returns to the pre-login screen; Sign in to My Account opens the prompt. (Assumption to confirm with security.)" },
    { id: "off", group: "Accounts", title: "Turn off in Manage biometric login", start: SIGNED_IN,
      steps: [["Unlock the phone and open Freedom (still signed in)", ["lock", "home"]], ["Tap the <b>profile settings</b> icon → <b>Manage biometric login</b>", ["done", "account"]], ["Turn <b>Biometric login</b> OFF, confirm", ["settings"]], ["Turn it ON again: one scan to confirm", ["bio-off"]], ["Tap back, then <b>Logout</b>", ["bio-on", "account"]], ["Pre-login screen: tap <b>Sign in to My Account</b>", ["welcome"]], ["@Prompt opens: tap <b>Recognized</b>", ["prompt"]], ["Overview opens", ["done"]]],
      expect: "Turning off deletes the key on the phone and the server. Turning on needs a scan. Password + code apply while it's off." },
  ];
  const params = new URLSearchParams(location.search);
  let scn = SCENARIOS.find((x) => x.id === params.get("s")) || SCENARIOS[0];

  const bioName = () => (state.platform === "ios" ? "Face ID" : "fingerprint");
  const BioName = () => (state.platform === "ios" ? "Face ID" : "Fingerprint");
  const steps = () => scn.steps.filter((x) => !x[2] || x[2] === state.platform);
  const fill = (t) => t
    .replace("@code", state.platform === "ios" ? "Tap <b>From Messages</b> / <b>From Mail</b> above the keypad" : "Tap <b>Allow</b> (text) or the <b>From Gmail</b> code")
    .replace("@Prompt", state.platform === "ios" ? "Face ID" : "The fingerprint prompt")
    .replace("@Cancel", state.platform === "ios" ? "Tap <b>Not recognized</b>, then <b>Cancel</b>" : "Tap outside the fingerprint prompt to cancel")
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
    $("side-steps").innerHTML = steps().map(([t]) => `<li>${fill(t)}</li>`).join("");
    paintSteps();
    $("scn-table").innerHTML = SCENARIOS.map((x, i) => `<tr><td>${i + 1}</td><td><a href="?s=${x.id}&platform=${state.platform}">${(x.ios ? x.title : x.title.replace("Face ID", bioName()))}</a></td><td>${fill(x.expect)}</td></tr>`).join("");
  }

  const ROUTES = new Set(ORDER);
  function paintSteps() {
    document.querySelectorAll("#side-steps li").forEach((li, i) => {
      li.classList.toggle("active", i === state.step);
      li.classList.toggle("past", i < state.step);
    });
  }
  function emit(key) {
    const list = steps();
    let i = list.findIndex(([, k], j) => j >= Math.max(state.step, 0) && k.includes(key));
    if (i < 0 && ROUTES.has(key)) {
      for (let j = state.step - 1; j >= 0; j--) if (list[j][1].includes(key)) { i = j; break; }
    }
    if (i < 0 || i === state.step) return;
    state.step = i;
    paintSteps();
  }

  function applyScenario() {
    clearTimers();
    closeAllPrompts();
    Object.assign(state, { session: !!scn.start.session, bio: scn.start.bio, remembered: scn.start.remembered, email: scn.start.remembered || "",
      device: scn.device || "ok", offer: !!scn.offer, fails: 0, promptFails: 0, locked: false, autoPrompt: false,
      mode: "new", iosAsked: !!scn.start.bio, offlineOnce: true, step: -1 });
    renderScenario();
    applyCopy();
    state.route = null;
    if (parse().route === scn.start.route) render(); else go(scn.start.route === "lock" ? "" : scn.start.route);
  }

  function applyCopy() {
    const ios = state.platform === "ios";
    $("enroll-title").textContent = ios ? "Sign in faster with Face ID." : "Sign in faster with your fingerprint.";
    $("enroll-on").textContent = `Turn on ${bioName()}`;
    $("enroll-li1").textContent = ios ? "Look at your phone to sign in to the Freedom app." : "Touch the sensor to sign in to the Freedom app.";
    $("set-h").textContent = ios ? "Sign in faster with Face ID or Touch ID." : "Sign in faster with biometric ID.";
    $("set-lede").textContent = ios ? "Use your Face ID or Touch ID to log in faster." : "Use face or fingerprint recognition to log in faster.";
    $("learn-how").textContent = ios ? "Face ID or Touch ID" : "Face or Fingerprint";
  }

  /* ---------- Biometrics can't be used: message over the pre-login screen ---------- */
  function showLocked() {
    dialog({ title: "Too many tries", msg: `${BioName()} is paused after too many tries. Sign in with your password to use ${bioName()} again.`,
      ok: "Sign in with password", cancel: "Close", onOk: toPassword });
  }
  function showNotSet() {
    dialog({ title: `${BioName()} isn't set up`, msg: `${BioName()} isn't set up on this phone anymore. Sign in with your password. You can turn it back on in Manage biometric login.`,
      ok: "Sign in with password", cancel: "Close", onOk: toPassword });
  }
  function bioChanged() {
    dialog({ title: `${BioName()} changed on this phone`, msg: `A ${state.platform === "ios" ? "face" : "fingerprint"} was added or changed in your phone settings. For your security, sign in with your password. You can then turn ${bioName()} back on.`,
      ok: "Sign in with password", cancel: false, onOk: () => { state.bio = false; state.device = "ok"; toPassword(); } });
  }
  function toPassword() { state.mode = "returning"; state.email = state.remembered || CICEK; go("signin"); }
  $("signin-back").addEventListener("click", () => go("welcome"));
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
    emit("prompt");
  }
  function closeAllPrompts() {
    ["fid", "bp", "ios-alert", "fm", "busy", "shop"].forEach((id) => ($(id).hidden = true));
    setSim(false);
  }
  function bioMatch() {
    if ($("sim-match").disabled) return;
    setSim(false, "Recognized.");
    emit("match");
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
    if (state.fails >= MAX_TRIES) return lockout();
    emit("nomatch");
    if (state.platform === "ios") {
      setSim(false, "Not recognized.");
      $("fid-hud").classList.add("shake");
      later(() => {
        $("fid").hidden = true;
        alertIOS({ face: true, title: "Face Not Recognized", msg: "Try Again",
          btns: [["Try Face ID Again", () => startBio(purpose, true), "bold"], ["Use password", usePassword], ["Cancel", cancelBio]] });
      }, 650);
    } else {
      $("bp").classList.remove("shake"); void $("bp").offsetWidth; $("bp").classList.add("shake", "err");
      $("bp-status").textContent = "Not recognized. Try again.";
    }
  }
  function lockout() {
    state.locked = true;
    emit("locked");
    setSim(false, `${BioName()} is paused in Freedom.`);
    if (state.platform === "ios") {
      $("fid-hud").classList.add("shake");
      later(() => { $("fid").hidden = true; afterLock(); }, 650);
    } else {
      $("bp").classList.add("err");
      $("bp-status").textContent = "Too many attempts. Try again later.";
      later(() => { $("bp").hidden = true; afterLock(); }, 1400);
    }
  }
  function afterLock() {
    if (purpose !== "login") return bioCancelled();
    if (state.route !== "welcome") go("welcome");
    later(showLocked, 250);
  }
  function usePassword() { closeAllPrompts(); if (purpose === "login") toPassword(); else bioCancelled(); }
  function cancelBio() { closeAllPrompts(); if (purpose === "login") { toast("Sign in cancelled"); emit("cancel"); if (state.route !== "welcome") go("welcome"); } else bioCancelled(); }
  function bioCancelled() { toast(`${BioName()} not turned on`); if (state.route === "settings") prepSettings(); }

  function bioOk() {
    if (purpose !== "login") {
      state.bio = true; state.remembered = state.email; state.fails = 0; state.locked = false; state.device = "ok";
      if (state.route === "settings") { prepSettings(); toast(`${BioName()} sign-in is on`); emit("bio-on"); }
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
  $("fid").addEventListener("click", (e) => { if (e.target === $("fid")) cancelBio(); });
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
    $("fm-cancel").textContent = typeof cancel === "string" ? cancel : "Cancel";
    fmOk = onOk;
    $("fm").hidden = false;
    emit("dialog");
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
    enrollBio();
  });
  function enrollBio() {
    if (state.platform === "ios" && !state.iosAsked) {
      state.iosAsked = true;
      emit("permission");
      return alertIOS({ face: true, title: "Do you want to allow “Freedom” to use Face ID?", msg: "Use Face ID to sign in to your Freedom account quickly and securely.",
        btns: [["Don't Allow", denied], ["OK", () => startBio("enroll"), "bold"]] });
    }
    startBio("enroll");
  }
  function denied() {
    state.device = "denied";
    emit("denied");
    dialog({ title: "Face ID is off for Freedom", msg: "To use it, go to your iPhone Settings › Freedom and turn on Face ID. You can then turn it on in Manage biometric login.",
      ok: "Continue", cancel: false, onOk: () => (state.route === "settings" ? prepSettings() : go("done")) });
  }
  $("enroll-skip").addEventListener("click", () => { state.offer = false; go("done"); later(() => toast("You can turn it on in Manage biometric login"), 400); });

  /* ---------- Overview header, tab bar, Shop drawer, My Account ---------- */
  const ICO = {
    home: '<path d="M4 10.2 12 4l8 6.2V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 16h6"/>',
    services: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11.5 17.5h1"/>',
    usage: '<path d="M11 4.1A8 8 0 1 0 19.9 13H11z"/><path d="M14 2.6a8 8 0 0 1 7.4 7.4H14z"/>',
    billing: '<path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H17v4"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M16 14h1.5"/>'
  };
  const tabIco = (k) => `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg>`;
  const SHOP_BAG = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M11 11V9a5 5 0 0 1 10 0v2" fill="none" stroke="#f26f21" stroke-width="2.2" stroke-linecap="round"/><path d="M6.5 11h19l-1.3 14.2a2 2 0 0 1-2 1.8H9.8a2 2 0 0 1-2-1.8z" fill="#f26f21"/><path d="M12 15.5a4 4 0 0 0 8 0" fill="none" stroke="#06223f" stroke-width="2" stroke-linecap="round"/></svg>';
  const SHOP_X = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#f26f21" stroke-width="2.2" stroke-linecap="round"/></svg>';
  function tabbar(open) {
    const tab = (k, label) => `<button type="button" class="tb-tab${k === "home" ? " on" : ""}" data-tab="${k}"${k === "home" ? ' aria-current="page"' : ""}>${tabIco(k)}<span>${label}</span></button>`;
    return tab("home", "Home") + tab("services", "Services")
      + `<span class="tb-mid"><button type="button" class="tb-shop" data-tab="shop" aria-label="${open ? "Close shop" : "Shop"}" aria-expanded="${open}">${open ? SHOP_X : SHOP_BAG}</button></span>`
      + tab("usage", "Usage") + tab("billing", "Billing");
  }
  $("ov-tabs").innerHTML = tabbar(false);
  $("shop-tabs").innerHTML = tabbar(true);
  function openShop() { $("shop").hidden = false; $("shop").classList.remove("leaving"); emit("shop"); }
  function closeShop(now) {
    const el = $("shop");
    if (el.hidden) return;
    if (now) { el.hidden = true; return; }
    el.classList.add("leaving");
    later(() => { el.hidden = true; el.classList.remove("leaving"); }, 220);
  }
  document.querySelectorAll(".tabbar").forEach((bar) => bar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    const k = b.dataset.tab;
    if (k === "shop") return $("shop").hidden ? openShop() : closeShop();
    if (k === "home") { closeShop(); $("scr-done").scrollTo({ top: 0, behavior: "smooth" }); return; }
    toast(`${b.textContent.trim()} isn't part of this prototype`);
  }));
  $("shop").addEventListener("click", (e) => { if (e.target === $("shop") || e.target.classList.contains("shop-scrim")) closeShop(); });
  $("ov-banner-close").addEventListener("click", () => { $("ov-banner").hidden = true; });
  $("open-account").addEventListener("click", () => go("account"));
  $("acc-bio").addEventListener("click", () => go("settings"));
  $("set-learn").addEventListener("click", () => go("learn"));
  $("acc-logout").addEventListener("click", () => {
    busy("Signing out…");
    later(() => { $("busy").hidden = true; state.autoPrompt = false; state.session = false; go("welcome"); }, 700);
  });
  function prepSettings() {
    const sw = $("set-bio");
    const blocked = state.device === "none" || state.device === "denied";
    const on = state.bio && !blocked;
    sw.setAttribute("aria-checked", String(on));
    sw.querySelector(".tog-txt").textContent = on ? "ON" : "OFF";
    const sub = $("set-bio-sub");
    sub.textContent = state.device === "none" ? `Set up ${bioName()} in your phone settings first.`
      : state.device === "denied" ? "Allow Face ID for Freedom in your iPhone Settings." : "";
    sub.hidden = !blocked;
  }
  $("set-bio").addEventListener("click", () => {
    if (state.device === "none" || state.device === "denied") return askPhoneSetup();
    if (state.bio) {
      dialog({ title: `Turn off ${bioName()}?`, msg: "You'll sign in with your password and a security code on this phone.", ok: "Turn off",
        onOk: () => { state.bio = false; prepSettings(); toast(`${BioName()} sign-in is off`); emit("bio-off"); } });
    } else enrollBio();
  });
  function askPhoneSetup() {
    const ios = state.platform === "ios";
    dialog(state.device === "denied"
      ? { title: "Allow Face ID for Freedom", msg: "Face ID is turned off for the Freedom app. Go to your iPhone Settings › Freedom and turn on Face ID. Then come back to turn on biometric login.", ok: "Go to Settings", onOk: () => go("os") }
      : { title: ios ? "Set up Face ID on your iPhone" : "Set up your fingerprint", msg: ios
          ? "To use biometric login, first set up Face ID in your iPhone Settings › Face ID & Passcode. Then come back to turn on biometric login."
          : "To use biometric login, first add a fingerprint in your phone Settings › Security › Fingerprint Unlock. Then come back to turn on biometric login.", ok: "Go to Settings", onOk: () => go("os") });
    emit("os-modal");
  }

  /* ---------- Simulated phone Settings ---------- */
  const IOS_SW = (on) => `<span class="ios-sw${on ? " on" : ""}"><span></span></span>`;
  function renderOS() {
    const ios = state.platform === "ios";
    const ok = state.device === "ok";
    const el = $("scr-os");
    el.className = `screen os-set ${ios ? "ios" : "and"}`;
    if (ios && state.osMode === "denied") {
      el.innerHTML = `<div class="os-nav"><button type="button" class="os-ret" data-os="back">◀ Freedom</button><h1>Freedom</h1></div>
        <p class="os-cap">ALLOW FREEDOM TO ACCESS</p>
        <div class="os-group"><button type="button" class="os-row" data-os="toggle"><span>Face ID</span>${IOS_SW(ok)}</button>
          <div class="os-row"><span>Notifications</span><span class="os-val">Banners ›</span></div>
          <div class="os-row"><span>Cellular Data</span>${IOS_SW(true)}</div></div>`;
    } else if (ios) {
      el.innerHTML = `<div class="os-nav"><button type="button" class="os-ret" data-os="back">◀ Freedom</button><h1>Face ID &amp; Passcode</h1></div>
        <p class="os-cap">USE FACE ID FOR:</p>
        <div class="os-group${ok ? "" : " dim"}"><div class="os-row"><span>iPhone Unlock</span>${IOS_SW(ok)}</div><div class="os-row"><span>Other Apps</span><span class="os-val">${ok ? "1 App " : ""}›</span></div></div>
        <div class="os-group">${ok ? '<div class="os-row"><span>Face ID is set up</span><span class="os-check">✓</span></div>' : '<button type="button" class="os-row blue" data-os="setup">Set Up Face ID</button>'}</div>
        <p class="os-foot">Face ID lets you securely unlock iPhone, authorize purchases and sign in to apps.</p>`;
    } else {
      el.innerHTML = `<div class="os-nav"><button type="button" class="os-arrow" data-os="back" aria-label="Back to Freedom">←</button><h1>Fingerprint Unlock</h1></div>
        <div class="os-group">${ok ? '<div class="os-row"><span class="os-fp">◉</span><span>Fingerprint 1</span></div>' : ""}
          <button type="button" class="os-row" data-os="setup"><span class="os-plus">+</span><span>Add fingerprint</span></button></div>
        <p class="os-foot">Use your fingerprint to unlock your phone and verify it's you, like when you sign in to apps.</p>`;
    }
  }
  $("scr-os").addEventListener("click", (e) => {
    const b = e.target.closest("[data-os]");
    if (!b) return;
    const ios = state.platform === "ios";
    if (b.dataset.os === "back") {
      if (state.device === "ok") later(() => toast("You can now turn on biometric login"), 400);
      return go("settings");
    }
    if (b.dataset.os === "toggle") { state.device = state.device === "ok" ? "denied" : "ok"; state.iosAsked = true; return renderOS(); }
    busy(ios ? "Setting up Face ID…" : "Adding fingerprint…");
    later(() => { $("busy").hidden = true; state.device = "ok"; renderOS(); toast(ios ? "Face ID is set up" : "Fingerprint added"); }, 1200);
  });

  setPlatform(state.platform);
  applyScenario();
})();
