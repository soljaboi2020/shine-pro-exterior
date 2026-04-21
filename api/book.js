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

// Mapping from the dropdown LABEL the user picks on the booking form
// to the actual start/end hour we'll use on the calendar event.
// Keep these in sync with the booking modal options in script.js.
const TIME_SLOTS = {
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

    return res.status(200).json({
      ok: true,
      stub: false,
      message: 'Booking confirmed! You should see it on Tyson\'s calendar.',
      eventId: data.id,
      eventLink: data.htmlLink
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

// Turn the customer's date ("YYYY-MM-DD") + time-label into ISO
// start/end strings. We leave them "naive" (no offset) and let Google
// interpret them via the `timeZone: "America/New_York"` field.
function buildEventWindow(dateStr, timeLabel) {
  const slot = TIME_SLOTS[timeLabel] || { startH: 13, startM: 0, endH: 15, endM: 0 };
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const startISO = toNaiveISO(y, m, d, slot.startH, slot.startM);
  const endISO   = toNaiveISO(y, m, d, slot.endH,   slot.endM);
  return { startISO, endISO };
}

function toNaiveISO(y, m, d, h, min) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
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
