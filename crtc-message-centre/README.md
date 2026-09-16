# CRTC Notifications — Freedom Mobile Message Centre Prototype

Interactive prototype with two screens, matching the Freedom Mobile account design
(`message centre.png`, `Header.png`, `regulatory and marketing message.png`):

1. **Message Centre** — `index.html` → route `#/`
2. **Message preview** — opens inside the Message Centre (Gmail-style) → route `#/message/<id>`
   (example: `#/message/tab-ending`)

## Run locally

Double-click `index.html` (open the hub first, then click into the prototype), or serve the
whole hub:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File crtc-message-centre\tools\serve.ps1 -Root .
```

Then open <http://localhost:8123> (hub) or
<http://localhost:8123/crtc-message-centre/> (prototype).

## Prototype behaviour

- The Message Centre opens first: Freedom account header (black utility strip + white main bar),
  account strip ("Hi, Jennifer" + line number), account tabs, centered page title.
- The message list uses the existing UI columns: **Received On: | Subject: | Type: | Sent To:**.
- Clicking a message opens it based on its type: **Promotion expiry** and **Roaming** messages
  open **inside the Message Centre** (header stays on top, "< Message Centre" back link); all
  other messages open a **PDF in a new browser tab** (`assets/docs/*.pdf`).
- **Filter** (per `Filter.png`): "Filter by: [All types ▾]" — Activation, Plan Change,
  Promotion expiry, Roaming, Regulatory.
- The **Sent To** column shows delivery channels: email address or **SMS phone number**.
- New types **Promotion expiry** and **Roaming** appear on messages in the list.
- The **Tab is ending** message (`#/message/tab-ending`) shows the extended regulatory section
  (longer copy, larger than the marketing section, no image) with the DEC 28 date badge, followed
  by the NEW OFFER marketing card and "The Freedom Mobile Team" sign-off.

## Figma editable mockups

The prototype pages can be imported into Figma as fully editable layers using the free
**html.to.design** plugin:

1. Publish the prototype to a public URL (see below) or keep it on `http://localhost:8123`.
2. In Figma (desktop app): **Plugins → html.to.design → Import from URL**.
3. Import `https://cicek.netlify.app/crtc-message-centre/` — this gives you the editable
   **Message Centre** mockup.
4. Import `https://cicek.netlify.app/crtc-message-centre/#/message/tab-ending` — this gives you
   the editable **message preview** mockup.
5. In Figma, connect the two frames (Prototype tab → interactions) to reproduce the
   click-through flow, then share the Figma prototype link with stakeholders.

## Publish to https://cicek.netlify.app (free)

1. Create a free account at <https://app.netlify.com> (sites deployed from the browser without
   an account are temporary — the account makes it permanent).
2. Go to <https://app.netlify.com/drop> and drag the whole `cicek-prototypes` folder onto the
   page.
3. Open the site → **Site settings → Change site name** → set it to `cicek`.
4. Your prototypes are live:
   - Hub: `https://cicek.netlify.app/`
   - This prototype: `https://cicek.netlify.app/crtc-message-centre/`
   (If `cicek` is taken, try `cicek-prototypes`, `cicek-dev`, etc.)
5. To add future prototypes: drop a new folder into `cicek-prototypes`, add a card to the hub
   `index.html`, and drag the folder onto the Netlify deploy page again to redeploy.

Alternatives: GitHub Pages, or internal hosting.

## For the development team

- **Message detail template** (per `regulatory and marketing message.png`) — the dashed
  *Dev annotation* in the preview marks it.
  - Regulatory card fields: `label` (e.g. "Regulatory Notification"), `date + time`,
    `title`, `date badge` (optional, e.g. DEC 28), `lead`, `body` paragraphs, `list`
    (title + items), `footnote`.
  - Marketing card fields: `chip` (NEW OFFER), `headline`, `body`, `cta` link.
  - Sign-off: "Thanks for being a valued customer. / The Freedom Mobile Team".
- **Data model**: all messages live in the `MESSAGES` array in `assets/js/app.js`.
  - `kind: "in-app"` → opens inside the Message Centre (used for Promotion expiry and Roaming
    messages; `detail.reg` / `detail.mkt`).
  - `kind: "pdf"` → opens `pdf` path in a new tab (`target="_blank"`) — all other types.
  - `sentTo: { kind: "email" | "sms", value }` → shown in the Sent To column.
  - `type` → the Type column value (Activation, Plan Change, Promotion expiry, Roaming,
    Regulatory).
- **Font**: Ambra Sans (Zetafonts) — trial TTFs in `assets/fonts/`, loaded via `@font-face`
  (Book 400, Bold 700, Extrabold 800; weights 500/600 fall back to the nearest). The trial files
  are CC BY-NC licensed — fine for this internal prototype, but a Zetafonts licence is required
  before production use. **Known trial limitation:** the trial's digit glyphs rasterize corrupted
  in browsers (verified via headless-browser screenshot), so digits are excluded from the
  `@font-face` via `unicode-range` and render in the system font. The licensed full font should
  render digits correctly — remove the `unicode-range` lines when swapping it in.
- **Routing**: hash-based (`#/` and `#/message/:id`) so both screens live in one page and can be
  deep-linked or imported into Figma separately.
- **Read/unread**: unread rows render bold; opening a message does **not** mark it read — this is
  intentional for demos. The mark-as-read feature is deferred; to enable it later, set
  `m.unread = false` at the top of `showDetail()` in `assets/js/app.js`.
- **PDFs**: `tools/generate-pdfs.ps1` regenerates `assets/docs/*.pdf` (PowerShell, no
  dependencies).
- The new-tab icon is an inline SVG (feather-style external link), matching `New tab icon.png`.
- `tools/ocr.ps1` extracts text, positions and colour bands from the mockup PNGs (used to
  rebuild the design).

## File structure

```
cicek-prototypes/                ← drag this folder onto Netlify Drop
├── index.html                    Hub landing page (add a card per prototype)
└── crtc-message-centre/
    ├── index.html              Message Centre + message preview (hash-routed views)
    ├── assets/
    │   ├── css/styles.css      All styling (Freedom Mobile theme, Ambra Sans)
    │   ├── fonts/               Ambra Sans trial TTFs (Zetafonts, CC BY-NC)
    │   ├── img/mkt-offer.png    Marketing graphic (cropped from mockup)
    │   ├── js/app.js           Message data, list/detail rendering, filter, routing
    │   └── docs/               PDFs opened in a new tab
    │       ├── crtc-tos-update.pdf
    │       ├── welcome-postpaid.pdf / welcome-postpaid-feb.pdf
    │       ├── welcome-prepaid.pdf
    │       ├── device-shipment.pdf
    │       └── agreement-amendment.pdf
    └── tools/
        ├── generate-pdfs.ps1   Regenerates the PDFs
        ├── serve.ps1           Local static server (accepts -Root for the hub)
        └── ocr.ps1             Mockup PNG text/colour extraction
```
