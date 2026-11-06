// Shared state between the desktop tab and the mobile tab.
// Both tabs live on the same origin, so localStorage + the "storage" event
// keeps them in step without a backend.
(function () {
  const KEY = "fm-push-mfa-state-v1";
  const REQUEST_TTL_MS = 120 * 1000;

  const DEFAULT_STATE = {
    request: null,
    sms: null,
    emailCode: null,
    phoneSeenAt: 0,
    settings: {
      pushApprovals: true,
      faceId: true,
      securityAlerts: true,
      billingAlerts: true,
      usageAlerts: true,
      offerAlerts: false,
      rememberBrowser: false,
    },
    devices: [
      { id: "d-phone", name: "Cicek's iPhone 15", detail: "Freedom app · This device", kind: "phone", approval: true },
    ],
    activity: [
      { id: "a-seed-1", result: "approved", browser: "Chrome on macOS", city: "Toronto, ON", at: Date.now() - 1000 * 60 * 60 * 26 },
      { id: "a-seed-2", result: "approved", browser: "Safari on iPhone", city: "Toronto, ON", at: Date.now() - 1000 * 60 * 60 * 24 * 6 },
    ],
  };

  const listeners = new Set();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return { ...clone(DEFAULT_STATE), ...parsed, settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}), pushApprovals: true } };
    } catch (err) {
      return clone(DEFAULT_STATE);
    }
  }

  function write(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((fn) => fn(next, { local: true }));
    return next;
  }

  function update(mutator) {
    const state = read();
    mutator(state);
    return write(state);
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== KEY && event.key !== null) return;
    const state = read();
    listeners.forEach((fn) => fn(state, { local: false }));
  });

  function detectBrowser() {
    const ua = navigator.userAgent;
    let browser = "Chrome";
    if (/Edg\//.test(ua)) browser = "Microsoft Edge";
    else if (/Firefox\//.test(ua)) browser = "Firefox";
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
    let os = "Windows";
    if (/Mac OS X/.test(ua)) os = "macOS";
    else if (/Linux/.test(ua)) os = "Linux";
    else if (/Windows/.test(ua)) os = "Windows";
    return `${browser} on ${os}`;
  }

  window.FMSync = {
    REQUEST_TTL_MS,
    read,
    update,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset() {
      localStorage.removeItem(KEY);
      const state = read();
      listeners.forEach((fn) => fn(state, { local: true }));
    },
    createRequest(email) {
      const now = Date.now();
      return update((s) => {
        s.request = {
          id: "r-" + now.toString(36),
          status: "pending",
          email,
          browser: detectBrowser(),
          city: "Toronto, ON",
          ip: "142.116.24.87",
          createdAt: now,
          expiresAt: now + REQUEST_TTL_MS,
        };
      }).request;
    },
    resolveRequest(id, status) {
      return update((s) => {
        if (!s.request || s.request.id !== id || s.request.status !== "pending") return;
        s.request.status = status;
        s.request.resolvedAt = Date.now();
        if (status === "approved" || status === "denied") {
          s.activity.unshift({
            id: "a-" + id,
            result: status,
            browser: s.request.browser,
            city: s.request.city,
            at: s.request.resolvedAt,
          });
          s.activity = s.activity.slice(0, 8);
        }
      });
    },
    sendSms() {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      return update((s) => {
        s.sms = { id: "s-" + Date.now().toString(36), code, sentAt: Date.now() };
      }).sms;
    },
    sendEmailCode() {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      return update((s) => {
        s.emailCode = { id: "e-" + Date.now().toString(36), code, sentAt: Date.now() };
      }).emailCode;
    },
    heartbeat() {
      update((s) => {
        s.phoneSeenAt = Date.now();
      });
    },
    phoneOnline(state) {
      return Date.now() - (state || read()).phoneSeenAt < 6000;
    },
    maskEmail(email) {
      const [user, domain] = String(email || "").split("@");
      if (!domain) return email;
      return user.charAt(0) + "•••" + user.slice(-1) + "@" + domain;
    },
    formatTime(ts) {
      const d = new Date(ts);
      const today = new Date();
      const time = d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
      if (d.toDateString() === today.toDateString()) return "Today, " + time;
      return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }) + ", " + time;
    },
  };
})();
