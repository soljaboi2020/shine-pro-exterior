# ShinePro Exterior Care — Website

Marketing + online-booking website for Tyson Toma's window cleaning business in Sanford, FL.

**Live preview (Windows):** open `index.html` directly, or run `npm run dev` from PowerShell to get a full Vercel-like dev server with the `/api/book` endpoint working.

## Quick facts

- **Tech:** HTML5 + Tailwind (CDN) + vanilla JS. Zero build step.
- **Backend:** Vercel serverless functions (`/api/*`). Currently `api/book.js` is a stub that will be replaced with Google Calendar + Resend (email) + Twilio (SMS) in the next build phase.
- **Hosting:** Vercel.
- **Analytics:** none yet — add Vercel Analytics or Plausible when we launch.

## Folder structure

```
shine-pro-exterior/
├── index.html                    ← the whole site (one page, all sections)
├── style.css                     ← custom styles on top of Tailwind CDN
├── script.js                     ← quote calculator, welcome popup, booking flow
├── README.md                     ← this file
├── CLAUDE.md                     ← Claude's project context (do not delete)
├── package.json
├── vercel.json
├── .gitignore
├── api/
│   └── book.js                   ← POST endpoint for booking form (STUBBED)
└── assets/
    ├── logo/
    │   └── logo-square-navy.jpg  ← main logo
    ├── before-after/             ← split-comparison photos for gallery
    ├── portfolio/                ← finished-work photos
    └── equipment/                ← pro-kit photos
```

## Editing

| What you want to change        | File      |
|--------------------------------|-----------|
| Any heading / section text     | `index.html` |
| Colors / fonts                 | `index.html` (Tailwind config block at top) + `style.css` |
| Instant Quote price anchors    | `script.js` → `PRICE_ANCHORS` |
| Seasonal banner on/off + text  | `script.js` → `SEASONAL_BANNER` |
| FAQ Q&A                        | `index.html` → search for `id="faq-list"` |
| Booking flow steps             | `index.html` → booking modal, `script.js` → booking logic |

## Run locally

See the **How to run** section in `CLAUDE.md` for copy-paste PowerShell commands.
