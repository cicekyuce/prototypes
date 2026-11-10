(() => {
  const $ = (id) => document.getElementById(id);
  const ORDER = ["welcome", "drawer", "signin", "verify", "code", "done"];
  const LIGHT = ["welcome", "drawer", "done"];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MAX_ATTEMPTS = 3;

  const state = {
    route: null,
    platform: new URLSearchParams(location.search).get("platform") || localStorage.getItem("fm-otp-platform") || "ios",
    email: "",
    channel: "sms",
    code: "",
    delivered: false,
    attempts: 0,
    source: "manual",
  };
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  /* ---------- Messages ---------- */
  const smsText = (code) =>
    `Your Freedom Mobile verification code is ${code}. Freedom will NEVER ask for this code. Do not share it with anyone.\n\n@myaccount.freedommobile.ca #${code}`;
  const emailText = (code) => `Your verification code is ${code}. Use it to sign in to My Account. It expires in 10 minutes.`;
  $("sms-format").textContent = smsText("482913");

  /* ---------- Clock ---------- */
  const tick = () => {
    const d = new Date();
    $("sb-time").textContent = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  tick();
  setInterval(tick, 15000);

  /* ---------- Platform ---------- */
  function setPlatform(p) {
    state.platform = p === "android" ? "android" : "ios";
    localStorage.setItem("fm-otp-platform", state.platform);
    $("device").classList.toggle("android", state.platform === "android");
    document.querySelectorAll("[data-platform]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.platform === state.platform)));
    $("platform-hint").textContent = state.platform === "ios"
      ? "iOS Security Code AutoFill: the code shows above the keypad as “From Messages”. Tap it to fill."
      : "Android SMS User Consent: Android asks once to share the text with Freedom. Tap Allow to fill.";
    document.querySelector('[data-step="code"]').innerHTML = state.platform === "ios"
      ? "Tap <b>From Messages</b> above the keypad"
      : "Tap <b>Allow</b> to share the text with Freedom";
    if (state.route === "code") startCode();
  }
  document.querySelectorAll("[data-platform]").forEach((b) => b.addEventListener("click", () => setPlatform(b.dataset.platform)));

  /* ---------- Routing ---------- */
  function parse() {
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const route = ORDER.includes(parts[0]) ? parts[0] : "welcome";
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
    $("home-indicator").classList.toggle("light", route === "welcome");
    if (route === "drawer") openDrawer(); else if (!$("drawer").hidden) closeDrawer();

    const idx = ORDER.indexOf(route);
    document.querySelectorAll("#side-steps li").forEach((li, i) => {
      li.classList.toggle("active", i === idx);
      li.classList.toggle("past", i < idx);
    });

    if (route === "signin") prepSignin();
    if (route === "verify") prepVerify();
    if (route === "code") { state.channel = via; startCode(); }
    if (route === "done") prepDone();
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
    b.addEventListener("click", () => toast("Not part of this prototype")));

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
  $("close-drawer").addEventListener("click", () => go(""));
  $("drawer").addEventListener("click", (e) => { if (e.target === $("drawer")) go(""); });
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
    $("email").value = state.email || "email@address.com";
    $("password").value = "";
    $("password").type = "password";
    $("signin-error").hidden = true;
    ["email-field", "password-field"].forEach((f) => $(f).classList.remove("invalid"));
    syncFilled($("email"), $("email-field"));
    syncFilled($("password"), $("password-field"));
    $("toggle-password").hidden = true;
    setTimeout(() => $("password").focus(), 260);
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
    const [user, domain] = (email || "email@address.com").split("@");
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
  const sourceLabel = () => (state.channel === "email" ? "Mail" : "Messages");

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
      text: isEmail ? `Your verification code — ${emailText(state.code)}` : smsText(state.code),
    });
    if (state.platform === "ios") {
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
    if (v.length !== 6) return showCodeError("Enter the 6-digit code.");
    if (v !== state.code) {
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
    later(() => { btn.classList.remove("loading"); go("done"); }, 900);
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
  function prepDone() {
    const texts = {
      quicktype: `Your code was filled from ${sourceLabel()} with one tap. No typing needed.`,
      consent: "You allowed Freedom to read that one text, and the code was filled for you.",
      manual: "Your code was entered and verified.",
    };
    $("done-text").textContent = texts[state.source] || texts.manual;
  }

  /* ---------- Restart / notes ---------- */
  function restart() {
    state.email = "";
    state.route = null;
    if (location.hash === "#/" || location.hash === "") render(); else go("");
    splash();
  }
  $("reset-demo").addEventListener("click", restart);
  $("restart").addEventListener("click", restart);
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

  setPlatform(state.platform);
  render();
  if (state.route === "welcome") splash();
})();
