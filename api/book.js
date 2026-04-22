// =====================================================================
// POST /api/book — real Google Calendar integration
// =====================================================================
// Flow:
//   1. Validate the payload.
//   2. If Google OAuth env vars are all present (GOOGLE_CLIENT_ID,
//      GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN):
//        → create a real event on Tyson's Google Calendar.
//        → the event has the customer address as LOCATION so it
//          shows up correctly on his phone's calendar + "Directions"
//          button works straight from the event.
//        → description is a clean, emoji-labeled dump of every field
//          the customer filled in (phone, email, windows, gate code,
//          pets, coupon, notes).
//   3. If the refresh token isn't wired yet (pre-OAuth setup): fall
//      back to the stub response so the frontend still confirms.
//      Tyson / dev will just not see a calendar event yet.
//   4. Return { ok, stub, eventId?, eventLink?, message }.
// =====================================================================

import { google } from 'googleapis';
import { sendBookingConfirmation, sendOwnerBookingAlert } from './_emails.js';

// Job duration — kept in sync with /api/slots.js.
// Booking form posts preferredTime in "HH:MM" 24h format (e.g. "13:30").
// The legacy label-based dropdown still works via the fallback table below.
const JOB_DURATION_MIN = 120; // 2 hours

// Legacy fallback: older versions of the booking form sent a human label.
// Keep this table so a cached copy of the old frontend still creates a
// sensible calendar event. New frontend sends "HH:MM" and skips this entirely.
const LEGACY_TIME_SLOTS = {
  'Morning (8 AM – 11 AM) — weekends only': { startH: 8,  startM: 0,  endH: 11, endM: 0  },
  'Late morning (11:30 AM – 1 PM)':           { startH: 11, startM: 30, endH: 13, endM: 0  },
  'Afternoon (1 PM – 4 PM)':                  { startH: 13, startM: 0,  endH: 16, endM: 0  },
  'Late afternoon (4 PM – 6 PM)':             { startH: 16, startM: 0,  endH: 18, endM: 0  },
  'Evening (6 PM – 8 PM)':                    { startH: 18, startM: 0,  endH: 20, endM: 0  }
};

const REQUIRED_FIELDS = ['service', 'preferredDate', 'preferredTime', 'name', 'phone', 'email', 'address'];
const TIMEZONE = 'America/New_York';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // -------- Validation --------
    for (const field of REQUIRED_FIELDS) {
      if (!body[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }

    // -------- Read env + detect readiness --------
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId   = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const calendarReady = Boolean(clientId && clientSecret && redirectUri && refreshToken);

    // -------- Stub mode (pre-OAuth setup) --------
    if (!calendarReady) {
      console.log('[ShinePro] Booking received (Calendar not yet wired):', {
        ...body,
        receivedAt: new Date().toISOString()
      });
      return res.status(200).json({
        ok: true,
        stub: true,
        message: 'Booking request received. Tyson will text to confirm.'
      });
    }

    // -------- Real Calendar insert --------
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { startISO, endISO } = buildEventWindow(body.preferredDate, body.preferredTime);
    const summary = `ShinePro: ${body.service} — ${body.name}`;
    const description = buildDescription(body);

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        location: body.address,
        description,
        start: { dateTime: startISO, timeZone: TIMEZONE },
        end:   { dateTime: endISO,   timeZone: TIMEZONE },
        reminders: { useDefault: true }
      }
    });

    console.log('[ShinePro] Calendar event created:', {
      eventId: data.id,
      link: data.htmlLink,
      summary
    });

    // -------- Fire confirmation email (non-blocking for the response) --------
    // We await so we can report email status in the response, but a failed
    // email never voids the booking — the calendar event is the source of truth.
    const siteUrl = resolveSiteUrl(req);

    // Customer confirmation + owner alert fire in parallel.
    // Either email failing never voids the booking — the calendar event is
    // the source of truth. We report both statuses in the response for debug.
    const [emailResult, ownerAlertResult] = await Promise.all([
      sendBookingConfirmation({
        booking: body,
        eventId: data.id,
        eventLink: data.htmlLink,
        siteUrl
      }).catch(err => {
        console.error('[ShinePro] sendBookingConfirmation threw:', err);
        return { sent: false, reason: 'exception' };
      }),
      sendOwnerBookingAlert({
        booking: body,
        eventId: data.id,
        eventLink: data.htmlLink,
        siteUrl,
        kind: 'new'
      }).catch(err => {
        console.error('[ShinePro] sendOwnerBookingAlert threw:', err);
        return { sent: false, reason: 'exception' };
      })
    ]);

    return res.status(200).json({
      ok: true,
      stub: false,
      message: 'Booking confirmed! You should see it on Tyson\'s calendar.',
      eventId: data.id,
      eventLink: data.htmlLink,
      emailSent: emailResult.sent === true,
      ownerAlertSent: ownerAlertResult.sent === true
    });
  } catch (err) {
    console.error('[ShinePro] /api/book error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Something went wrong on our end. Please text Tyson at (407) 754-5565.',
      detail: err?.message || String(err)
    });
  }
}

/* ---------- helpers ---------- */

// Turn the customer's date ("YYYY-MM-DD") + time into ISO start/end strings.
// Two accepted time formats:
//   1. "HH:MM"  — new format from /api/slots (e.g. "13:30"). End = start + JOB_DURATION_MIN.
//   2. Legacy label — "Afternoon (1 PM – 4 PM)" etc.  Looked up in LEGACY_TIME_SLOTS.
// We leave ISO strings "naive" (no offset) and let Google Calendar interpret
// them via the `timeZone: "America/New_York"` field on the event.
function buildEventWindow(dateStr, timeStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);

  // Modern format: "HH:MM"
  if (typeof timeStr === 'string' && /^\d{2}:\d{2}$/.test(timeStr)) {
    const [hh, mm] = timeStr.split(':').map(Number);
    const startMin = hh * 60 + mm;
    const endMin   = startMin + JOB_DURATION_MIN;
    const startISO = toNaiveISO(y, m, d, Math.floor(startMin / 60), startMin % 60);
    const endISO   = toNaiveISO(y, m, d, Math.floor(endMin   / 60), endMin   % 60);
    return { startISO, endISO };
  }

  // Legacy label fallback (backwards compat with older cached frontends)
  const slot = LEGACY_TIME_SLOTS[timeStr] || { startH: 13, startM: 0, endH: 15, endM: 0 };
  const startISO = toNaiveISO(y, m, d, slot.startH, slot.startM);
  const endISO   = toNaiveISO(y, m, d, slot.endH,   slot.endM);
  return { startISO, endISO };
}

function toNaiveISO(y, m, d, h, min) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
}

// Figure out the public site URL (used to build the reschedule link in emails).
// Order: explicit SITE_URL env > Vercel's auto-injected VERCEL_URL > request host.
function resolveSiteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = req?.headers?.host;
  if (host) {
    const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    return `${proto}://${host}`;
  }
  return 'https://shine-pro-exterior.vercel.app';
}

// Build the event description body. Skips empty fields so the
// calendar event doesn't read like an awkward form dump.
function buildDescription(b) {
  const lines = [
    `👤 ${b.name}`,
    `📞 ${b.phone}`,
    `✉️  ${b.email}`,
    `📍 ${b.address}`,
    b.windowCount ? `🪟 Windows: ${b.windowCount}` : '',
    b.gateCode    ? `🔑 Gate code: ${b.gateCode}` : '',
    b.pets        ? `🐕 Pets: ${b.pets}` : '',
    b.coupon      ? `🎟️  Coupon: ${b.coupon}` : '',
    b.notes       ? `📝 Notes: ${b.notes}` : '',
    '',
    `— Booked via shine-pro-exterior.vercel.app`
  ];
  return lines.filter(Boolean).join('\n');
}
