# CLAUDE.md — `shine-pro-exterior` Project Context

> Per **Rule #3** from `/src/CLAUDE.md`: every project has its own `CLAUDE.md` so future Claude sessions can regain full context.

---

## 📛 Project Name & Description
- **Name:** `shine-pro-exterior`
- **Business:** ShinePro Exterior Care — exterior cleaning services (windows, pressure washing, gutters)
- **Purpose:** Professional marketing + online-booking website for Tyson Toma's window cleaning business. Built to make booking dead-simple for older customers and integrate with Tyson's existing Google Calendar so bookings automatically appear on his phone.

## 📅 Created
- **2026-04-21** — Project scaffolded; planning phase. No code written yet.

## 👤 Owner / Client
- **Name:** Tyson Toma
- **Title:** Owner
- **Phone (cell):** (407) 754-5565 — click-to-call on the website
- **Email (confirmed 2026-04-21):** **Tysont5076@gmail.com** — this is the Gmail he'll use for the Google Calendar OAuth connect.
- **Base city:** Sanford, Florida
- **Service radius:** up to 1 hour drive from Sanford, FL
- **Time zone:** America/New_York (EST/EDT)

### 🕒 Business Hours (confirmed 2026-04-21)
| Day | Hours |
|---|---|
| Monday | 11:30 AM – 8:00 PM |
| Tuesday | 11:30 AM – 8:00 PM |
| Wednesday | 11:30 AM – 8:00 PM |
| Thursday | 11:30 AM – 8:00 PM |
| Friday | 11:30 AM – 8:00 PM |
| Saturday | **All day** (interpreted as 8:00 AM – 8:00 PM for booking slots — confirm with Tyson if different) |
| Sunday | **All day** (interpreted as 8:00 AM – 8:00 PM for booking slots — confirm with Tyson if different) |
> **Booking logic:** Calendar only offers slots within these windows. Slots are 1.5-hour blocks by default (adjustable). Anything outside = unavailable.

## 📣 Social Media & External Links
- **Facebook:** facebook.com/share/18Jfh3pYmf/
- **Instagram:** @shinepro_exterior
- **TikTok:** @shinepro.exterior
- **Google Reviews (embed source):** share.google/aC2P6IYsU4DQouvmh
- **Blinq business card (contact source):** https://blinq.me/cmfq6kgx90h6ds60mngy2bz3g

## 🧽 Services Offered
1. **Pure Water Exterior Window Cleaning** — Professional Xero DI (deionization) system removes all minerals for 100% pure, spot-free rinsing. Water-fed pole. Cleans frames, sills, tracks, and screens (prevents dirt from washing back onto glass so windows stay clean longer, even after rain).
2. **Interior Window Cleaning** — Very soft mop + professional degreasing soap + squeegee finish. Safely removes fingerprints, smudges, buildup. Leaves glass perfectly clear + streak-free.
3. **Pressure Washing** (small-scale) — driveways, patios, exterior surfaces.
4. **Gutter Cleaning**.

## 💵 Pricing Estimates (customer-facing; label as "estimates — call for exact quote")
| Window count | Estimated price |
|---|---|
| 10 windows | $125 |
| 20 windows | $175 |
| 30 windows | $250–$275 |
| 40 windows | $350–$400 |
| 50 windows | $450–$500 |
> Disclaimer to display: *"These are estimates. For an exact quote, text or call Tyson at (407) 754-5565."*

### Instant Quote math (how the UI interpolates in-between numbers)
User confirmed 2026-04-21: for counts that fall BETWEEN the anchor values above, give a good interpolated estimate and STILL tell them to call.
- **Algorithm:** linear interpolation between the two nearest anchors. For anchored ranges (30, 40, 50), interpolate both ends and show as a range.
- **< 10 windows:** show "$125 minimum".
- **> 50 windows:** show "$500+ — call for exact" (too many variables to interpolate).
- **Examples:**
  - 15 windows → ~$150 • *"call for exact"*
  - 25 windows → ~$210–$225
  - 35 windows → ~$300–$340
  - 45 windows → ~$400–$450
- **Disclaimer shown under every estimate:** *"Estimate only. Text or call Tyson at (407) 754-5565 for an exact quote."*

## 🎨 Brand Direction — LOCKED (2026-04-21)
- **Vibe:** Modern, clean, trustworthy. Friendly.
- **Audience bias:** Built with **older customers in mind** — big fonts, huge tappable buttons, high contrast, one-question-per-screen booking flow, phone number always visible.
- **Logo:** **RECEIVED 2026-04-21** → `/src/source/shine-pro-exterior/assets/logo/logo-square-navy.jpg`. Square 1:1 logo — deep-navy background, circular wordmark "SHINEPRO EXTERIOR" arched around top, "CARE" at bottom, illustrated house with twin pressure-washer wands + water splashes + a diamond "S" badge center. Predominantly dark-navy / bright-blue / white.
- **Color palette — revised 2026-04-21 to match the logo** (Option B's *feel* stayed — "premium/medical-clean" — but shifted from teal-family to blue-family so the logo and site look like one brand):
  - **Primary (deep navy):** `#0a1738` — matches the logo background. Used for headlines, the footer, and the hero backdrop.
  - **Secondary (bright blue / accent):** `#3b82f6` (Tailwind `blue-500`) to `#60a5fa` (`blue-400`) — matches the water splashes + roof tiles in the logo. Used for buttons, links, active states, section accents.
  - **Background:** Crisp white (`#ffffff`) + off-white section bands (`#f8fafc`) for content.
  - **Text:** Charcoal (`#1f2937` body, `#0f172a` headlines) for maximum readability.
  - **CTA accent (yellow-gold):** `#eab308` / Tailwind `yellow-500` reserved for the **"Book Now"** button specifically. High-energy pop against the navy — impossible to miss, senior-friendly contrast.
  - **Success/green:** `#10b981` (emerald) for confirmations.
  - **Error/warning:** `#ef4444` (red) + `#f59e0b` (amber).
  - **Note:** User originally picked "Option B: teal + white + charcoal" (2026-04-21). Shifted to blue-family the same day once the logo arrived so it doesn't clash. Same calm/trustworthy vibe, just blue instead of teal.

## 🏗️ Tech Stack (planned)
- **Frontend:** HTML5 + Tailwind CSS via CDN + vanilla JavaScript (no build step, no framework). Matches the team's existing stack from the `ebay-listing-optimizer` project.
- **Backend:** Vercel serverless Node functions under `/api/*`.
- **Calendar integration:** Google Calendar API v3.
  - Tyson connects his Google account ONCE via OAuth consent (separate "Shine Pro Jobs" calendar, not personal).
  - Refresh token stored as Vercel env var (or Vercel KV if we outgrow env var storage).
  - Public site calls `GET /api/slots?date=YYYY-MM-DD` → reads free/busy, returns open slots.
  - Booking form posts to `POST /api/book` → inserts event in Tyson's calendar → sends confirmation email to customer (via Resend.com free tier) + triggers Google Calendar email invite back to Tyson.
- **Hosting:** Vercel (same account as `ebay-listing-optimizer`).
- **Domain:** TBD — suggest registering `shineproexterior.com` (or `.co` / `.cleaning`). For initial deploy we'll use the free `shine-pro-exterior.vercel.app` alias.

## 🧭 Site Structure (planned — pending user sign-off)
1. **Hero** — logo, tagline ("Sparkling clean windows, inside & out — Sanford, FL"), huge "Book a Cleaning" CTA, click-to-call phone button.
2. **Services** — three big cards (Windows / Pressure Washing / Gutters).
3. **Instant Quote tool** — number input: "How many windows?" → live estimate displayed with disclaimer.
4. **Why ShinePro** — trust section: Pure Water Xero DI system explained in plain English.
5. **Before / After gallery** — needs Tyson to upload photos.
6. **Reviews** — embed Google Business reviews.
7. **Service Area** — simple map showing Sanford + 1-hour radius.
8. **Book Now** — step-by-step: pick service → pick date → pick time → enter info → confirm.
9. **FAQ** — "How long does a cleaning take?", "Do I need to be home?", "Do you work in the rain?", etc.
10. **Contact** — phone, email, social icons, service area statement.
11. **Footer** — copyright, hours, small text links.

## 🔜 Planned Feature List (main)
- Live Google-Calendar-backed booking form with real free/busy slots
- Instant price estimator (windows = #, see range immediately)
- Click-to-call + click-to-text phone buttons
- Embedded Google Reviews
- Email + SMS confirmations to customer
- Automatic address + phone + service details saved into the Google Calendar event so Tyson sees everything on his phone
- Senior-friendly UX (big fonts, high contrast, one question per screen, clear CTAs)
- Mobile-first responsive design
- SEO-optimized meta tags + structured data (local business schema)
- Social icons linking to FB / IG / TikTok
- Before/After gallery (lazy-loaded)
- Service-area map

## 💡 Bonus Features — user decisions (2026-04-21)
**IN (user said yes — build these):**
- [x] **Referral program** — "Refer a friend, get $20 off" (friend also gets $20 off first job).
- [x] **Recurring service discount** — **15% off** when booking a recurring plan (quarterly / biannual). User overrode original 10% suggestion → 15%.
- [x] **First-time customer coupon** — `WELCOME10` → 10% off first booking. Shown as a pop-in after ~6 sec on landing page, one-time per browser.
- [x] **SMS reminder 24h before the job** (via Twilio) — confirms appointment, weather note if rainy.
- [x] **Post-job text** with invoice + Google Review link — sent after job is marked complete.
- [x] **Seasonal CTA banner** — "Book before pollen season!" / "Holiday shine — book your pre-party clean" etc. Easy-to-edit text.
- [x] **Blog** — for local SEO (Sanford window cleaning tips, FAQs, pollen guide, etc.). Markdown-driven, simple `/blog/[slug]` pages.
- [x] **Gate code + pet-in-yard field** in booking form — optional text input.
- [x] **Admin dashboard** — protected `/admin` page (password or magic-link), shows today's jobs + tomorrow's jobs + customer list + revenue stats. Tyson can block off time on his calendar from here.
- [x] **Customer login / portal** — repeat customers log in (email magic-link, no password), see past bookings, rebook in one click.

**OUT (user did not say yes — not building):**
- ❌ Photo upload in booking form (skipped)
- ❌ Gift certificates (skipped)

### New booking-flow requirements confirmed 2026-04-21
- **Address field is REQUIRED** and is auto-inserted into the Google Calendar event location + notes, so Tyson sees the full address on his phone.
- **No need for customer to be home** (for EXTERIOR jobs) — FAQ will state this clearly. INTERIOR jobs obviously require someone home.
- **Weather note:** exterior work is best when NOT raining. Booking form auto-adds a line: *"If it's raining on the scheduled day, Tyson will text you to reschedule — no charge, no hassle."*

## 🎯 Active Tasks / TODO
- [x] Get user sign-off on site structure + feature list ✅ (2026-04-21)
- [x] Get user sign-off on color palette ✅ Option B — teal/white/charcoal + yellow CTA (2026-04-21)
- [x] Receive logo file from user ✅ (2026-04-21) → `assets/logo/logo-square-navy.jpg`
- [ ] Receive additional before/after photo pairs from user (1 already uploaded to `assets/before-after/window-track-01.jpg`; user will send more separately)
- [x] Confirm Tyson's email for Google Calendar OAuth ✅ Tysont5076@gmail.com (2026-04-21)
- [x] Confirm business hours ✅ Mon–Fri 11:30am–8pm, Sat–Sun all day (2026-04-21)
- [x] Build public marketing site ✅ (2026-04-21 — first build)
- [x] Build booking flow UI (service → date → time → address + gate code + pet + contact → confirm) ✅ (2026-04-21 — frontend complete, backend stubbed)
- [x] Create Google Cloud project + enable Calendar API + OAuth consent screen ✅ (2026-04-21 — BUILD #3)
- [x] Wire `/api/book` endpoint to Google Calendar ✅ (2026-04-21 — BUILD #3, live when `GOOGLE_REFRESH_TOKEN` is set)
- [x] Build `/api/google-connect` + `/api/google-callback` OAuth flow ✅ (2026-04-21 — BUILD #3)
- [ ] Guide Tyson through one-time Google Calendar connect (generates refresh token) — **in progress; awaiting Allow-dance + refresh-token paste into Vercel + redeploy**
- [x] Wire `/api/slots` endpoint for live free/busy with 90-min buffer ✅ (2026-04-22 — BUILD #4 Push A)
- [x] Wire email confirmations (Resend.com free tier) ✅ (2026-04-22 — BUILD #4 Push B, `onboarding@resend.dev`, Tyson CC'd)
- [x] Build admin dashboard (`/admin` — password `Toma21394`, today/tomorrow/week jobs, block-off time) ✅ (2026-04-22 — BUILD #4 Push B)
- [x] Reschedule flow that modifies the ORIGINAL event (no duplicates) ✅ (2026-04-22 — BUILD #4 Push B, HMAC-signed token links in email)
- [x] Delete `/api/debug-env` for security hygiene ✅ (2026-04-22 — BUILD #4 Push B)
- [ ] Wire SMS 24h-before reminder + post-job text (Twilio)
- [ ] Embed Google Reviews
- [ ] Build blog scaffolding (`/blog` index + `/blog/[slug]` pages, Markdown-driven)
- [ ] Build admin dashboard (`/admin` — magic-link auth, today/tomorrow jobs, block-off time)
- [ ] Build customer portal (email magic-link, past bookings, rebook button)
- [ ] Seasonal banner (editable config file)
- [ ] First-time `WELCOME10` coupon popup
- [ ] Referral program plumbing ($20 referrer + $20 friend codes)
- [ ] Recurring discount flow (15% for quarterly/biannual)
- [ ] Deploy to Vercel
- [ ] Optional: register `shineproexterior.com` and point DNS to Vercel

## ✏️ Decisions & Notes
- **Google Calendar over a custom database** — chosen because Tyson already lives in his Google Calendar, zero new apps for him to learn. Bookings appear as events on his phone automatically.
- **No framework** — sticking with HTML + Tailwind CDN + vanilla JS like the `ebay-listing-optimizer` project. Zero build, instantly editable, loads fast, easy for a future developer (or future Claude) to maintain.
- **Older-customer bias** — every UX decision leans toward "grandma can use this on her iPad." This includes 18–20px body text, high-contrast color palette, no fancy animations, 60px+ tap targets.
- **Pricing estimates only** — customer sees ranges, not firm totals. Firm quote happens via phone/text. Protects Tyson from edge-case jobs that take way longer than estimated.
- **Business name spelling nuance** — user provided `Shine Pro Exterior` (with space). Blinq card says `ShinePro Exterior Care`. Website will use **"ShinePro Exterior"** as the wordmark (matches Instagram `@shinepro_exterior` + TikTok `@shinepro.exterior`). Decide final form with user once logo arrives.

## 🗂️ Folder Structure (as of 2026-04-21 BUILD #2)
```
shine-pro-exterior/
├── index.html                    ← entire marketing site (all sections, modals, lightbox, exit-intent, ZIP checker)
├── style.css                     ← Tailwind overrides + component styles (step cards, lightbox, ZIP states, tap hints)
├── script.js                     ← quote calculator, hero rotator, lightbox, ZIP checker, exit-intent, welcome popup, booking flow
├── README.md                     ← quick dev intro
├── CLAUDE.md                     ← this file
├── package.json                  ← Vercel scripts (`npm run dev` / `npm run deploy`)
├── vercel.json                   ← cleanUrls + security headers
├── .gitignore
├── api/
│   └── book.js                   ← POST /api/book — STUB (validates + logs; real Google Calendar wiring next phase)
├── cities/                       ← SEO-targeted landing pages, one per city
│   ├── lake-mary/index.html
│   ├── winter-park/index.html
│   ├── heathrow/index.html
│   ├── longwood/index.html
│   └── altamonte-springs/index.html
└── assets/
    ├── logo/logo-square-navy.jpg
    ├── before-after/             ← 3 split-comparison shots (window-track, arched-window, tall-window)
    ├── portfolio/                ← 1 finished-job shot (entryway)
    └── equipment/                ← Xero DI setup
```

## ▶️ How to Run / Preview (Windows PowerShell)

### Easiest — just open the file (no backend — booking form falls back to mailto)
```powershell
cd 'C:\Users\malac\Projects\source\shine-pro-exterior'
start index.html
```
The site will render fully — quote calculator, gallery, FAQ, everything except the `/api/book` endpoint (that needs a server). The booking form will still work: it'll fall back to opening an email draft to Tyson with the booking details.

### Full dev mode — with the `/api/book` backend (recommended)
```powershell
# One-time setup (if Vercel CLI not installed yet)
cd 'C:\Users\malac\Projects\source\shine-pro-exterior'
npm install -g vercel
vercel login
vercel link                       # pick "Create new project" first time — name it "shine-pro-exterior"

# Daily dev
npm run dev                        # = vercel dev
```
Then open `http://localhost:3000` in a browser. Stop with **Ctrl + C**.

### VS Code Live Server (auto-refresh on save, no backend)
```powershell
cd 'C:\Users\malac\Projects\source\shine-pro-exterior'
code .
```
Then in VS Code: Extensions → install **Live Server** → right-click `index.html` → **Open with Live Server**.

### Deploy to Vercel
```powershell
cd 'C:\Users\malac\Projects\source\shine-pro-exterior'
vercel --prod
```
First deploy will give you a URL like `shine-pro-exterior.vercel.app`. Share it with Tyson.

### 🛠️ Troubleshooting
| Problem | Fix |
|---------|-----|
| Page looks unstyled | Tailwind is loaded from a CDN — check internet connection. |
| Booking form opens an email instead of confirming | That's the fallback — it means `/api/book` isn't reachable. Use `npm run dev` instead of `start index.html`, or deploy to Vercel. |
| Map doesn't load | Same — needs internet (OpenStreetMap iframe). |
| Images missing | Double-check the `assets/` folder wasn't accidentally moved. |
| Logo looks pixelated | We're using the 800×800 JPG. We can swap in a higher-res PNG later. |

## 📅 Change Log
- **2026-04-22 (BUILD #5 ✅ SHIPPED — Custom domain + branded email + reschedule verified live)** — The last big piece: ShinePro now runs on its own domain with fully branded transactional email and a verified reschedule flow.
  - **Domain live:** `shineproexterior.com` pointed at Vercel (A `@` → Vercel IP, CNAME `www` → `cname.vercel-dns.com`). The `.vercel.app` URL still works as a backup alias.
  - **Resend domain verification ✅** — after a DNS debugging session (phantom Namecheap URL-Redirect A record masking the Vercel one; `send` subdomain MX living in Namecheap's Host Records dropdown rather than the Mail Settings section; a briefly-deleted DKIM TXT that Malachi re-added and that propagated back): **DKIM + SPF + MX all verified on `shineproexterior.com`**. Status: "Domain verified — your domain is ready to send emails."
  - **Email FROM address switched** — `api/_emails.js` now sends `FROM: ShinePro Exterior <bookings@shineproexterior.com>` instead of the old `onboarding@resend.dev`. No more "via resend.dev" in Gmail. Footer line also updated to *"ShinePro Exterior Care · Central Florida · (407) 754-5565 · shineproexterior.com"*.
  - **Vercel env vars added (2 new):**
    - `RESEND_DOMAIN_VERIFIED=true` — re-enables CC-to-Tyson on every booking email (running paper trail for him).
    - `SITE_URL=https://shineproexterior.com` — pins reschedule links + email footer to the real domain instead of the `.vercel.app` fallback.
  - **Reschedule flow VERIFIED LIVE on customer domain.** Malachi tested a full booking → got confirmation email from `bookings@shineproexterior.com` → clicked the gold "🔄 Reschedule my booking" button → landed on `shineproexterior.com/reschedule?token=...` → picked a new slot → submission succeeded → the ORIGINAL Google Calendar event got PATCHed (no duplicate on Tyson's phone) → reschedule confirmation email sent. **The whole loop works.** This was the final feature needed before public launch.
  - **Copy pass shipped in the same commit:**
    - Tyson-specific language → team voice ("we", "us", "our team") across `index.html`, `script.js`, and all 5 city pages.
    - "Sanford, Florida" → "Central Florida" everywhere (site-wide replace).
    - Robert Potts's number `+1 (407) 307-7233` added to the footer alongside Tyson's `(407) 754-5565`.
    - **Removed all insurance mentions** per Tyson's request — hero trust row `✓ Fully insured` → `✓ Locally owned`, deleted the "Are you insured?" FAQ Q&A entirely, stripped *"Fully insured."* from the footer tagline. Affected `index.html` + all 5 city pages (6 files). Grep confirmed zero `insured`/`insurance` matches site-wide.
  - **Files touched (BUILD #5):** `api/_emails.js` (FROM address + footer copy), `index.html` + `cities/{altamonte-springs,longwood,heathrow,winter-park,lake-mary}/index.html` (insurance + team + central FL + Robert number), `script.js` (team voice). All CRLF-applied.
  - **Status:** ShinePro Exterior is now a fully production-ready business booking system — custom domain, branded email, live Google Calendar integration, reschedule flow, admin dashboard, instant quote, before/after gallery, 5 city SEO pages, ZIP checker, exit-intent, welcome coupon. Everything Tyson needs to take real customer bookings today.

- **2026-04-22 (BUILD #4 Push B — HOTFIX: slots permission + Resend CC)** — After Push B deployed, Vercel logs surfaced two bugs on the first live test:
  1. **`/api/slots` → 500 Insufficient Permission:** `calendar.freebusy.query` requires `calendar.readonly` scope, but our OAuth grant was `calendar.events` only. Rather than re-authorize Google, switched `/api/slots.js` to use `calendar.events.list` (same scope we already have, same info for our purposes, also what `/api/admin-jobs` already uses successfully).
  2. **`/api/book` → emailSent:false, Resend 403 validation:** Resend's free tier with `onboarding@resend.dev` only allows sending to the email on your Resend account. My code was CC'ing Tysont5076@gmail.com on every booking confirmation — that CC alone triggered the 403 even when the TO was Malachi's Resend email. Fix: made the CC conditional on a new `RESEND_DOMAIN_VERIFIED=true` env var. For now (domain not verified yet), customer-only email. Tyson still sees every booking via Google Calendar push notification (verified working Build #3). Once a custom domain is verified on Resend (e.g. `shineproexterior.com`), Malachi flips that env var → CC is re-enabled.
  - **Files touched:** `api/slots.js` (events.list instead of freebusy.query), `api/_emails.js` (env-gated CC).
  - **Both CRLF-applied.** No new env vars required for the fix itself; `RESEND_DOMAIN_VERIFIED=true` is optional future toggle.

- **2026-04-22 (BUILD #4 — Push B: Email confirmations + Reschedule flow + Admin dashboard)** — Everything the booking system needs to run itself. A customer books → gets a beautiful confirmation email with a "🔄 Reschedule" button → if they click it, they land on a secure token-protected page that modifies their ORIGINAL calendar event (no duplicates on Tyson's phone). Meanwhile, Tyson has a `/admin` dashboard behind a password where he sees every upcoming job with one-tap call/text/directions buttons + revenue estimates + a "block off time" button.
  - **New helper `api/_token.js`** — HMAC-SHA256 signed tokens used for both (a) customer reschedule links and (b) admin session cookies. Files starting with `_` are private utility modules in Vercel (not exposed as HTTP routes). Secret source: prefers `BOOKING_HMAC_SECRET` env var if set, otherwise derives a deterministic secret from `GOOGLE_CLIENT_SECRET + GOOGLE_CLIENT_ID` so Push B works with zero new env vars needed. `signToken(payload)` / `verifyToken(token)` — base64url(body) + base64url(sig), `timingSafeEqual` check to prevent timing attacks. `signAdminSession()` / `verifyAdminSession(token)` — 24h expiration baked into the payload.
  - **New helper `api/_emails.js`** — Resend REST API caller (no SDK dependency added, just `fetch`). Sends from `ShinePro Exterior <onboarding@resend.dev>` (Resend's no-verification sender). CC's `Tysont5076@gmail.com` on every email so Tyson has a running paper trail. `reply_to` is set to Tyson's email so customer replies go straight to him. Two public functions: `sendBookingConfirmation` (new booking) + `sendRescheduleConfirmation` (rescheduled booking, different subject + header). HTML template is a styled table matching the site's navy/blue/gold palette — includes the job summary, the address, a gold "🔄 Reschedule my booking" CTA button, and Tyson's phone as click-to-call. Plain-text fallback built from the same fields for email clients that don't render HTML.
  - **`api/book.js` updated** — after a successful `calendar.events.insert`, fires `sendBookingConfirmation` with the new HMAC-signed reschedule token. `resolveSiteUrl(req)` helper prefers `SITE_URL` env var > `VERCEL_URL` auto-injected var > request host so the email link always points at the right domain whether local/preview/prod. Email failure never voids the booking (calendar event is the source of truth); response includes `emailSent: true/false` for debugging.
  - **New endpoint `GET /api/booking-info?token=X`** — read-only info for the reschedule page. Verifies the token, fetches the event via `calendar.events.get`, returns `{ service, date, time, timeLabel, address, name }`. Name is masked to first-name + last-initial for privacy (e.g. "Malachi M."). Service and name are parsed out of the event summary (`"ShinePro: {service} — {name}"` format). Returns 400 for bad/expired token, 404 if event gone, 410 if cancelled.
  - **New endpoint `POST /api/reschedule`** — body `{ token, newDate, newTime }`. Verifies token → fetches current event → PATCHes start/end via `calendar.events.patch` (does NOT create a new event, which was the hard requirement Malachi asked for) → appends a `🔄 Rescheduled by customer on <ts>` note to the description so Tyson can see the history → reconstructs a booking-shaped object from the event description + location (`reconstructBooking()` parses the emoji-labeled description `book.js` originally wrote) → sends `sendRescheduleConfirmation` email. Response: `{ ok, eventId, eventLink, newStart, newEnd, emailSent }`.
  - **New page `/reschedule.html`** — public page that reads `?token=X`. Calls `/api/booking-info` to show the customer what they're rescheduling ("Exterior Windows — Friday, April 24 at 1:00 PM"). Reuses the live `/api/slots` engine for the new time dropdown. Same graceful fallback to static slots if slots API fails. Submit → `/api/reschedule` → success card. Error states handled (bad token, expired, cancelled event) with clear messaging + "text Tyson" fallback.
  - **New endpoint `POST /api/admin-auth`** — `{ password }` → `{ ok, token, expiresAt }`. `timingSafeEqual` password compare. In-memory rate limit: max 10 attempts per IP per 5 min. Uses `ADMIN_PASSWORD` env var if set, else default `"Toma21394"` (Malachi picked this). Rec: eventually add `ADMIN_PASSWORD` env var in Vercel so the password isn't in source control — but the HMAC session token already means the password only travels on login.
  - **New endpoint `GET /api/admin-jobs`** — auth header `Bearer <session-token>` required. Lists upcoming calendar events (60-day horizon). Parses each into a job record: `{ eventId, startISO, endISO, dateLabel, timeLabel, service, name, phone, email, address, windowCount, gateCode, pets, coupon, notes, link, revenueEstimate, isShinePro, isBlock }`. Revenue estimate uses the same linear-interpolation anchor table as the public quote calculator. Groups events by `today` / `tomorrow` / `thisWeek` / `later` using NY-timezone date keys so "today" means Tyson's today, not UTC today. Events Tyson created manually on his phone (no `ShinePro:` prefix) still show up but counters only include ShinePro-originated bookings.
  - **New endpoint `POST /api/admin-block`** — auth required. Body `{ date, startTime, endTime, reason }` → creates a `BLOCKED: {reason}` event on the calendar. Free/busy check in `/api/slots` already treats these as busy (with 90min buffer), so blocked windows disappear from the public booking form automatically.
  - **New page `/admin.html`** — password login → localStorage session → dashboard with: 4-stat strip (today / tomorrow / this-week job counts + estimated revenue); 4 grouped sections (Today / Tomorrow / Rest-of-week / Later); each job card shows date+time header, service, customer name (full), clickable address → Google Maps, clickable phone → tel:, click-to-text button, click-to-directions button, "View event" link to the Google Calendar event; expandable "More details" panel for windows/gate/pets/coupon/notes/email; price tag (e.g. `≈ $250`). Big "⛔ Block off time" button opens a modal for blocking arbitrary windows. "🔄 Refresh" button re-pulls the calendar. Session shows remaining hours and auto-logs-out on 401.
  - **Deleted `api/debug-env.js`** — no longer needed after Build #3 verified the env setup. Fewer public endpoints = smaller attack surface.
  - **Zero new env vars required.** Reuses `GOOGLE_*` vars (Build #3) + `RESEND_API_KEY` (Malachi already added). Optional additions: `ADMIN_PASSWORD` (override the default), `BOOKING_HMAC_SECRET` (use a dedicated secret instead of derived), `SITE_URL` (pin the base URL for email links if we move off `shine-pro-exterior.vercel.app`).
  - **Files touched (BUILD #4 Push B):** `api/_token.js` (new), `api/_emails.js` (new), `api/booking-info.js` (new), `api/reschedule.js` (new), `api/admin-auth.js` (new), `api/admin-jobs.js` (new), `api/admin-block.js` (new), `reschedule.html` (new), `admin.html` (new), `api/book.js` (email send hook added), `api/debug-env.js` (**deleted**). All 9 new/modified files CRLF-applied (Rule #2).
  - **What Push B does NOT do yet:** SMS reminders via Twilio (24h before + post-job review ask) — deferred. Customer portal (email magic-link login to see past bookings) — deferred. Blog scaffolding — deferred. Referral codes + recurring-discount flow — deferred. These are all nice-to-haves on top of what's now a fully-functional booking business.

- **2026-04-22 (BUILD #4 — Push A: Smart booking engine with free/busy + 90min buffer)** — The booking form no longer lets customers pick generic time "windows" and hope for the best. It now reads **Tyson's actual Google Calendar** in real time and shows only the 2-hour slots he's genuinely free for, separated by a 90-minute travel/setup buffer between jobs.
  - **New endpoint `GET /api/slots?date=YYYY-MM-DD`** → returns `{ date, jobDurationMin, bufferMin, calendarReady, available: [{value:"13:30", label:"1:30 PM"}, …] }`.
    - Constants: `JOB_DURATION_MIN = 120` (2 hrs), `BUFFER_MIN = 90` (1.5 hr between jobs), `MIN_LEAD_TIME_MIN = 120` (no "book 10 min from now" nonsense), `TIMEZONE = 'America/New_York'`.
    - Business hours encoded: **weekday open = 11:30 AM (690 min)**, **weekend open = 8:00 AM (480 min)**, **close = 8:00 PM (1200 min)**. Candidate slots step hourly from open until `close − JOB_DURATION_MIN` (so the last 2-hr slot ends exactly at 8 PM).
    - Calls `calendar.freebusy.query` on Tyson's calendar for that day. Each busy range is **expanded by `BUFFER_MIN` on both sides** before overlap check — so a 1 PM job blocks the next slot from starting before ~4:30 PM. That's the "he can't do the next job till 4 or 5" requirement Malachi asked for verbatim.
    - Uses `Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' })` to get the correct NY GMT offset for any date (handles EST/EDT automatically).
    - If Google env vars aren't configured yet → returns `calendarReady: false` and treats `busy = []`, so all future candidates are marked available and the form still works (operator can fix any conflict manually).
    - Sends `Cache-Control: no-store` so the browser never caches stale slot data.
  - **`api/book.js` upgraded** — `buildEventWindow()` now accepts two formats:
    - **New:** `"HH:MM"` (e.g. `"13:30"`). End = start + `JOB_DURATION_MIN` (2 hrs). This is what the new frontend sends.
    - **Legacy fallback:** the old 5 human labels (`"Afternoon (1 PM – 4 PM)"` etc.) still work via a `LEGACY_TIME_SLOTS` table, in case a customer has a stale cached copy of the old frontend open.
    - Renamed the old `TIME_SLOTS` → `LEGACY_TIME_SLOTS` to make it obvious it's the compat path.
  - **`script.js` upgraded** — new `refreshTimeSlots()` function:
    - Triggered on date-picker `change` and `input` events inside `initBookingModal()`.
    - Fetches `/api/slots?date=X` with `cache: 'no-store'`, populates `#book-time` with `{value, label}` pairs from the response.
    - States handled: empty date ("Pick a date first…" + disabled), loading ("Loading available times…"), no openings ("No openings that day — try another date"), success ("Pick a time…" + actual slots), **network failure fallback** → static `FALLBACK_TIME_SLOTS_WEEKDAY` (7 slots 11:30 AM–5:30 PM) or `FALLBACK_TIME_SLOTS_WEEKEND` (11 slots 8 AM–6 PM) so the form never dead-ends on a preview or an API hiccup.
    - `buildBookingPayload()` now returns both `preferredTime` (`"HH:MM"` — what `/api/book` consumes) **and** `preferredTimeLabel` (`"1:30 PM"` — what humans read in the confirmation summary + email).
    - Confirmation summary (`renderBookingSummary()`) prefers the human label for display.
  - **Dropdown markup change (6 HTML files)** — the hardcoded 5-option `<select id="book-time">` list has been replaced with a disabled placeholder `<option>Pick a date first…</option>` across:
    - `index.html`
    - `cities/lake-mary/index.html`
    - `cities/winter-park/index.html`
    - `cities/heathrow/index.html`
    - `cities/longwood/index.html`
    - `cities/altamonte-springs/index.html`
    A new hint line was added under each: *"⏱️ Each job is a 2-hour window. We only show slots Tyson is actually free for."*
  - **Why this matters (Malachi's original ask):** "…preferred time be maybe a little more specific also make it so if there are let's say a certain time taken one day there's time in between so he can go to next job for ex let's say Tuesday there's a job at 1:00 he can't do the next job till like 4 or 5." — All three requirements delivered: specific 2-hour slot starts instead of vague labels, double-booking impossible, buffer enforced.
  - **Files touched (BUILD #4 Push A):** `api/slots.js` (new), `api/book.js` (buildEventWindow rewrite + LEGACY_TIME_SLOTS rename), `script.js` (refreshTimeSlots + wired to date picker + buildBookingPayload returns both time formats + summary uses label), `index.html` + 5 city pages (dropdown → placeholder). All 9 files CRLF-applied (Rule #2).
  - **No new env vars needed** — reuses the existing `GOOGLE_*` vars that BUILD #3 already wired in Vercel. Push to GitHub → Vercel auto-deploys → everything works.
  - **Push B (next session):** email confirmations via Resend (`onboarding@resend.dev`, Tyson CC'd), `/reschedule/<token>` flow that modifies the original calendar event via `calendar.events.patch` (NOT a new event), `/admin` dashboard at password `Toma21394`, and deletion of `/api/debug-env`.

- **2026-04-21 (BUILD #3 ✅ SHIPPED — end-to-end Calendar integration VERIFIED LIVE)** — After a full debugging marathon through every OAuth gotcha (Public Suffix List blocking `vercel.app`, missing `GOOGLE_REDIRECT_URI` env var, a `URL` vs `URI` typo, a single trailing-space character in an env var that made the length 58 instead of 57, an apostrophe accidentally pasted into the OAuth Client redirect URI field, and the Testing-mode test-user gate) — **the pipeline works end-to-end**. A booking submitted through `shine-pro-exterior.vercel.app` created a real event on **Tyson's personal Google Calendar** visible on his iPhone in real time: *"ShinePro: Exterior Windows — Malachi MERCADO-DAYS"* at 469 red rose lane, 1–4 PM Fri April 24. OAuth was authorized by Tyson's account (`Tysont5076@gmail.com`), so events land on his primary calendar until/unless we add a dedicated `GOOGLE_CALENDAR_ID` pointing at a separate "ShinePro Jobs" calendar. Debug endpoint `/api/debug-env` is still deployed — safe to delete now that everything works.
- **User's preferred name (learned 2026-04-21):** Malachi. (Inferred from the test booking he ran through the live form.)

- **2026-04-21 (BUILD #3 — Google Calendar OAuth + real booking integration)** — The booking form is no longer a stub. A real customer submission now lands directly on Tyson's Google Calendar.
  - **Dependency added:** `googleapis@^144.0.0` in `package.json` (official Google Node client; used for OAuth2 + Calendar v3).
  - **New endpoint `GET /api/google-connect`** — one-time authorization kickoff. Tyson visits `https://shine-pro-exterior.vercel.app/api/google-connect` while signed into `Tysont5076@gmail.com`. Shows a navy-themed intro card ("Connect your Google Calendar"), then a gold "→ Connect Google Calendar" button that forwards him to Google's OAuth consent screen. Requests `access_type: 'offline'` + `prompt: 'consent'` so Google reliably returns a refresh_token. Scope is narrow: `https://www.googleapis.com/auth/calendar.events` (not full-calendar access).
  - **New endpoint `GET /api/google-callback`** — Google redirects here after Tyson clicks Allow. Exchanges the `code` query param for tokens via `oauth2Client.getToken(code)`. Three failure cases handled with friendly branded pages: (a) Tyson clicked Cancel (`error` query param), (b) malformed redirect (no `code`), (c) no refresh_token returned (happens if the app was previously authorized — page links straight to `myaccount.google.com/permissions` with recovery instructions). On success: shows the refresh token in a navy `<div class="token-box">` with a "📋 Copy token" button (uses `navigator.clipboard.writeText`) and a numbered checklist for pasting it into Vercel as `GOOGLE_REFRESH_TOKEN` + redeploying. Token is only shown ONCE by design.
  - **Upgraded `POST /api/book`** — now has two branches:
    - **Stub branch (fallback):** if any of `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN` is missing, logs the payload and returns `{ ok: true, stub: true }` — same behavior as BUILD #1. Lets the site keep working during the setup window before the refresh token is pasted in.
    - **Live branch:** when all 4 env vars are present, constructs an OAuth2 client, calls `calendar.events.insert` on `GOOGLE_CALENDAR_ID` (defaults to `primary`). Event `summary` = `"ShinePro: {service} — {name}"`, `location` = customer address (so Tyson's phone shows "Directions" in the event). `description` is an emoji-labeled dump — 👤 name / 📞 phone / ✉️ email / 📍 address / 🪟 windows / 🔑 gate code / 🐕 pets / 🎟️ coupon / 📝 notes — empty fields are filtered out so the description stays clean. Returns `{ ok: true, stub: false, eventId, eventLink }` on success.
  - **Time slot → event window mapping:** `TIME_SLOTS` table translates each booking-form time label (e.g. `"Late morning (11:30 AM – 1 PM)"`) to start/end hours. Event is created with `timeZone: "America/New_York"` so EDT/EST is handled automatically. Unknown labels fall back to 1–3 PM.
  - **Security nuance:** the OAuth consent screen is in Testing mode (fine permanently for <100 users per Google's policy). `calendar.events` scope — we can only add/edit events we create, not read Tyson's whole calendar.
  - **One-time OAuth flow (done by Tyson, not the dev):** After deploy → visit `/api/google-connect` in a browser signed into `Tysont5076@gmail.com` → click Allow on Google's screen → the callback page shows the refresh token → developer pastes it into Vercel as `GOOGLE_REFRESH_TOKEN` → redeploy. After that, every booking auto-creates a calendar event with zero further human interaction.
  - **Security incident resolved (2026-04-21):** During setup, the original OAuth Client Secret was briefly visible in a screenshot. User rotated the secret in Google Cloud Console → Clients → Reset Client Secret. New secret was pasted directly into Vercel (never screenshotted). No OAuth flow had yet completed, so no damage.
  - **Public Suffix List gotcha resolved:** Google rejected `vercel.app` as an Authorized Domain ("must be a top private domain") because `vercel.app` is on the Public Suffix List. Fix: used the full subdomain `shine-pro-exterior.vercel.app` instead. Documented here so a future Claude doesn't hit the same wall.
  - **Files touched (BUILD #3):** `package.json` (added googleapis dep), `api/book.js` (full rewrite: stub → OAuth/Calendar insert with stub fallback), `api/google-connect.js` (new), `api/google-callback.js` (new). All four CRLF-applied (Rule #2).
  - **Vercel env vars now required on the project:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (= `https://shine-pro-exterior.vercel.app/api/google-callback`), and after the one-time Allow dance: `GOOGLE_REFRESH_TOKEN`. Optional: `GOOGLE_CALENDAR_ID` (defaults to `primary`).
  - **Folder structure update:** `api/` now contains `book.js`, `google-connect.js`, `google-callback.js`.
  - **NOT yet built (still to come in later builds):** Resend email confirmations to the customer, Twilio SMS (24h-before reminder + post-job Review-ask text), admin dashboard, customer portal, blog scaffolding, referral codes, recurring-discount flow, seasonal banner editor. Calendar integration was the highest-leverage piece and is the foundation everything else hooks into.

- **2026-04-21 (BUILD #2 — Quick wins: lightbox, How-It-Works, ZIP checker, exit-intent, city pages)** — User approved 5 of 7 suggested enhancements (1, 2, 5, 6, 7 — not #3 Meet Tyson or #4 TikTok embed). All five shipped in one pass:
  - **(1) Gallery lightbox** — every `.gallery-item` is now click-to-enlarge. Full-screen navy-tinted overlay with `max-height: 78vh` contained image, prev/next arrows, keyboard support (← → Esc), backdrop-click to close, counter in the bottom-center ("1 / 4"). Catalog is built from the DOM at init time so adding new gallery items doesn't require a JS update. Each gallery figcaption got a gold "🔍 Tap to enlarge" tap-hint badge.
  - **(2) "How It Works" 3-step section** — added between Hero and Services. Three cards: (1) Book online, (2) Tyson confirms, (3) Sparkling windows. Each card has a floating navy numbered badge, an emoji icon, a bold heading, and a plain-English paragraph. Hover lift + shadow styling matches the existing service cards.
  - **(5) ZIP code checker** — bottom of the Service Area section. `SERVICE_ZIPS.primary` covers Sanford/Lake Mary/Heathrow/Longwood/Altamonte/Winter Park/Oviedo/Orlando core/Deltona/DeBary/DeLand plus Geneva/Chuluota/Mims edge. `SERVICE_ZIPS.close` covers Clermont/Kissimmee/Daytona/Leesburg as "give us a call." 4 result states: green (in area + book link), amber (on the edge + call link), red (out of area), gray (invalid input).
  - **(6) Exit-intent popup** — `#exit-overlay`. Fires on desktop-only (skipped on touch devices via `matchMedia('(hover: none)')`), once per browser session (`sessionStorage`), after a 20-second arm delay, when mouse moves out of the top of the viewport (`mouseout` + `clientY ≤ 10`). Offers the WELCOME10 coupon and prefills it when the user clicks "Book & save 10%." Suppressed while any other modal is open.
  - **(7) Per-city landing pages** — generated 5 static SEO-targeted pages:
    - `/cities/lake-mary/index.html`
    - `/cities/winter-park/index.html`
    - `/cities/heathrow/index.html`
    - `/cities/longwood/index.html`
    - `/cities/altamonte-springs/index.html`
    Each page is a full clone of the root site with: (a) updated `<title>` + meta description mentioning the city, (b) hero pill replaced with "Now serving [City], FL", (c) hero H1 replaced with "Sparkling clean windows in [City] — inside & out", (d) nav wordmark shows the city name instead of "Exterior", (e) all asset/style/script paths rewritten to `../../assets/…` / `../../style.css` / `../../script.js`. Used a sed-driven generator script (saved to `/tmp/generate-cities.sh` for future re-runs).
  - **Cross-cutting infrastructure change:** `initHeroRotator()` now computes `assetBase` from the initial `<img>` src and prepends it to every photo it rotates through — so the per-city pages (which use `../../assets/…`) correctly load all three rotator photos instead of 404ing after the first cycle.
  - **Files touched:** `index.html` (added lightbox overlay, exit-intent overlay, "How It Works" section, ZIP checker block, `data-gallery-idx` + tap-hint on every gallery item, gallery subtitle already updated in BUILD #1.1), `style.css` (added `.step-card`, `.step-num`, `.step-icon`, `.tap-hint`, `.lightbox-*`, `#zip-result` state classes), `script.js` (added `initLightbox()`, `SERVICE_ZIPS` + `initZipChecker()`, `initExitIntent()`, hero rotator asset-base patch). Five new city HTML files under `cities/<slug>/index.html`. All CRLF-applied.
  - **NOT yet built (still to come):** (#3) Meet Tyson section — user said "Not yet." (#4) TikTok feed embed — user said no. All backend features from BUILD #1's TODO list (Google Calendar API, Resend email, Twilio SMS, admin dashboard, customer portal, blog, referral codes, recurring discount) — moving into Build #3 once the user completes external signups.

- **2026-04-21** — Project folder created at `/src/source/shine-pro-exterior/`. Initial CLAUDE.md captured: business info, owner contact, services, pricing, brand direction, tech stack, proposed site structure, feature list. Pulled contact details from the Blinq business card (https://blinq.me/cmfq6kgx90h6ds60mngy2bz3g) via WebFetch. Awaiting user sign-off on feature list before building.
- **2026-04-21 (BUILD #1.1 — Hero rotator + copy fix)** — User feedback-driven tweaks:
  - Hero image is now an **interactive before/after rotator** cycling through all 3 split-comparison shots (`arched-window-02`, `tall-window-reflection-03`, `window-track-01`). Auto-rotates every 5 sec, pauses on hover/focus. Click anywhere on the image, the "See another →" gold button (renamed from "Real result →"), or a dot to advance. Counter shows "1 / 3" etc. Dots are gold when active. Container uses `aspect-ratio: 1/1` + `object-fit: cover` to prevent CLS between images of different sizes. Keyboard support: Space/Enter/→ advances, ← goes back.
  - Changed gallery subtitle from the corny *"No stock photos. No filters. Just real windows Tyson cleaned."* to *"No filters. No stock photos. Every window you see below, we actually cleaned."* — owned as "we" (the business), not third-person.
  - Files touched: `index.html` (hero block restructured, gallery subtitle), `script.js` (added `initHeroRotator()` + `HERO_PHOTOS` array + wired into DOMContentLoaded), `style.css` (added `#hero-rotator` aspect ratio + `.hero-dot` styles). All CRLF-applied.
- **2026-04-21 (BUILD #1 — Marketing site shipped)** — First full build of the public marketing site.
  - **New files:** `index.html`, `style.css`, `script.js`, `README.md`, `package.json`, `vercel.json`, `.gitignore`, `api/book.js` (stub).
  - **Sections live on the page:** Seasonal banner (toggleable in `script.js`), sticky nav with logo + phone + Book button, hero with featured before/after, 4 service cards, Instant Quote calculator with range slider + interpolated pricing + full pricing-table accordion, "Why ShinePro" with Xero DI explanation + equipment photo, before/after gallery (3 pairs + 1 portfolio shot), Google Reviews CTA panel, service-area list + OpenStreetMap iframe centered on Sanford, FAQ accordion (9 Q&A), final CTA (Book + Call + Text), and footer with hours + socials.
  - **Modals built:** first-time `WELCOME10` coupon popup (fires 6 sec into first visit, once per browser); multi-step booking modal (Service → When → You → Confirm → Success). Booking form captures: service, window count, date, time, name, phone, email, REQUIRED address, gate code, pets, coupon, notes.
  - **Booking backend:** `api/book.js` currently validates the payload, logs it, returns success. Frontend gracefully falls back to a `mailto:Tysont5076@gmail.com` draft with the full payload if the API is unreachable (so `start index.html` locally still works end-to-end).
  - **Instant Quote math:** linear interpolation between anchors (10=$125, 20=$175, 30=$250-275, 40=$350-400, 50=$450-500). Under 10 shows "$125 minimum"; over 50 shows "$500+ — call". Slider + ± buttons + live price card.
  - **Accessibility / senior-friendly:** 60px+ tap targets, high-contrast navy+white, 18-20px body text, reduced-motion media query, ESC closes modals, backdrop click closes, sticky mobile "Call" button.
  - **Photos used:** `arched-window-02.jpg` is the hero image (strongest before/after). All 3 before/after pairs + the portfolio shot populate the gallery section. `xero-di-setup.jpg` is the Why ShinePro photo.
  - **All files CRLF-applied** (Rule #2).
  - **NOT yet built (next build phases):** Real Google Calendar wiring for `/api/book`, email confirmations (Resend), SMS (Twilio) for 24h-before + post-job, blog, admin dashboard, customer portal, referral-code system, recurring-discount checkout flow.
- **2026-04-21 (logo + hours + email received)** — User sent the final logo asset (saved to `assets/logo/logo-square-navy.jpg`), confirmed business hours (Mon–Fri 11:30am–8pm, Sat–Sun all day), and confirmed Tyson's Google email for the Calendar OAuth connect: `Tysont5076@gmail.com`. **Color palette revised** from teal-family to blue-family to match the logo (deep navy + bright blue + white + yellow-gold CTA button). User will send remaining before/after photo pairs separately.
- **2026-04-21 (sign-off complete)** — User confirmed Tyson's contact info, approved the 11-section sitemap, picked **Option B (teal/white/charcoal) + yellow-gold CTA button**, and locked in the bonus-feature list:
  - IN: referral program, recurring 15% off (user bumped from 10%), first-time 10% coupon, SMS 24h reminder, post-job text w/ invoice + Google Review ask, seasonal banner, blog, gate code + pet field, admin dashboard, customer portal.
  - OUT: photo upload in booking, gift certificates.
  - Clarified instant-quote math: linear interpolation between anchors; <10 → "$125 minimum"; >50 → "$500+ — call".
  - Booking form REQUIRES address; auto-dumps address into Google Calendar event location + notes so Tyson sees it on his phone.
  - "No need to be home for exterior work" note added to FAQ.
  - Weather clause: rain-day auto-reschedules via text, no charge.
  - User uploaded first before/after photo: `/src/source/shine-pro-exterior/assets/before-after/window-track-01.jpg` (window track clean vs. dirty comparison — perfect for gallery).
  - Logo + remaining before/after pairs pending upload by user.
  - Ready to start building the marketing site.
