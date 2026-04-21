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
- [ ] Create Google Cloud project + enable Calendar API + OAuth consent screen
- [ ] Guide Tyson through one-time Google Calendar connect (generates refresh token)
- [ ] Wire `/api/slots` + `/api/book` endpoints
- [ ] Wire email confirmations (Resend.com free tier)
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
