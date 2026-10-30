// Desktop sign-in tab. Mirrors the Freedom Okta sign-in (identify → password)
// and adds the push-approval step that the mobile tab answers.
(function () {
  const steps = ["identify", "password", "push", "options", "sms", "denied", "expired", "approved"];
  const $ = (id) => document.getElementById(id);
  let currentRequestId = null;
  let countdownTimer = null;
  let usedMethod = "push";

  function show(step) {
    $("auth-main").hidden = step === "account";
    $("account").hidden = step !== "account";
    steps.forEach((s) => {
      $("step-" + s).hidden = s !== step;
    });
    document.body.classList.toggle("on-landing", step === "identify");
    const focusable = step !== "account" && $("step-" + step).querySelector("input, button.btn-primary");
    if (focusable) focusable.focus({ preventScroll: true });
  }

  function cancelPending() {
    if (currentRequestId) FMSync.resolveRequest(currentRequestId, "cancelled");
    currentRequestId = null;
    clearInterval(countdownTimer);
  }

  function email() {
    return $("email").value.trim() || "bartholomew.r@example.com";
  }

  function startPush() {
    cancelPending();
    usedMethod = "push";
    const req = FMSync.createRequest(email());
    currentRequestId = req.id;
    const device = FMSync.read().devices.find((d) => d.approval);
    $("push-device").textContent = device ? "your primary mobile device, " + device.name : "your primary mobile device";
    $("push-tip").hidden = FMSync.phoneOnline();
    show("push");
    tick(req.expiresAt);
    countdownTimer = setInterval(() => tick(req.expiresAt), 250);
  }

  function tick(expiresAt) {
    const left = Math.max(0, expiresAt - Date.now());
    const secs = Math.ceil(left / 1000);
    $("push-countdown").textContent = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
    $("push-status").classList.toggle("urgent", secs <= 20);
    if (left <= 0) {
      clearInterval(countdownTimer);
      FMSync.resolveRequest(currentRequestId, "expired");
      currentRequestId = null;
      show("expired");
    }
  }

  function startSms() {
    cancelPending();
    usedMethod = "sms";
    FMSync.sendSms();
    $("sms-code").value = "";
    $("sms-error").hidden = true;
    $("back-to-push").hidden = !FMSync.read().settings.pushApprovals;
    show("sms");
  }

  function signedIn() {
    $("signin-banner-text").textContent =
      usedMethod === "push"
        ? "Signed in with approval from your Freedom app."
        : "Signed in with a text message verification code.";
    show("account");
  }

  FMSync.subscribe((state) => {
    renderPhoneStatus(state);
    const req = state.request;
    if (!req || req.id !== currentRequestId) return;
    if (req.status === "approved") {
      clearInterval(countdownTimer);
      currentRequestId = null;
      show("approved");
      setTimeout(signedIn, 1400);
    } else if (req.status === "denied") {
      clearInterval(countdownTimer);
      currentRequestId = null;
      show("denied");
    }
  });

  function renderPhoneStatus(state) {
    const online = FMSync.phoneOnline(state);
    $("phone-status").classList.toggle("online", online);
    $("phone-status-text").textContent = online ? "Phone tab connected" : "Phone tab not open";
    $("open-phone").hidden = online;
    if (!$("step-push").hidden) $("push-tip").hidden = online;
  }
  setInterval(() => renderPhoneStatus(FMSync.read()), 2000);
  renderPhoneStatus(FMSync.read());

  $("identify-form").addEventListener("submit", (e) => {
    e.preventDefault();
    $("identity-chip").textContent = email();
    show("password");
  });

  $("password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (FMSync.read().settings.pushApprovals) startPush();
    else startSms();
  });

  $("show-password").addEventListener("click", () => {
    const input = $("password");
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    $("show-password").setAttribute("aria-label", showing ? "Show password" : "Hide password");
  });

  $("resend-push").addEventListener("click", () => {
    startPush();
    $("push-status").classList.remove("push-resent");
    void $("push-status").offsetWidth;
    $("push-status").classList.add("push-resent");
  });
  function showOptions() {
    cancelPending();
    $("opt-push-row").hidden = !FMSync.read().settings.pushApprovals;
    $("option-note").hidden = true;
    show("options");
  }
  $("try-sms").addEventListener("click", showOptions);
  $("opt-push").addEventListener("click", startPush);
  $("opt-sms").addEventListener("click", startSms);
  document.querySelectorAll("[data-unavailable]").forEach((el) =>
    el.addEventListener("click", () => ($("option-note").hidden = false))
  );
  $("expired-resend").addEventListener("click", startPush);
  $("expired-sms").addEventListener("click", startSms);
  $("back-to-push").addEventListener("click", startPush);
  $("resend-sms").addEventListener("click", startSms);

  $("sms-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const sms = FMSync.read().sms;
    const ok = sms && $("sms-code").value.trim() === sms.code;
    $("sms-error").hidden = ok;
    if (ok) signedIn();
  });

  document.querySelectorAll('[data-action="back-to-start"]').forEach((el) =>
    el.addEventListener("click", () => {
      cancelPending();
      show("identify");
    })
  );

  $("sign-out").addEventListener("click", () => show("identify"));
  $("reset-demo").addEventListener("click", () => {
    FMSync.reset();
    location.reload();
  });

  window.addEventListener("beforeunload", cancelPending);

  // A reload must not leave a stale request on the phone.
  const stale = FMSync.read().request;
  if (stale && stale.status === "pending") FMSync.resolveRequest(stale.id, "cancelled");
  show("identify");
})();
