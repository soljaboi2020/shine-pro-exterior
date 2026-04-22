// =====================================================================
// GET /api/booking-info?token=<signed>
// =====================================================================
// Used by the public reschedule page. Given a valid HMAC-signed token,
// return the minimum info we need to show the customer which booking
// they're about to change:
//
// {
//   ok: true,
//   service: "Exterior Windows",
//   date:    "2026-04-24",
//   time:    "13:00",          // HH:MM in NY local time
//   timeLabel: "1:00 PM",
//   address: "469 Red Rose Lane",
//   name:    "Malachi M."      // just first name + last initial for privacy
// }
//
// Returns 400 if the token is missing/invalid/expired.
// =====================================================================

import { google } from 'googleapis';
import { verifyToken } from './_token.js';

const TIMEZONE = 'America/New_York';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.query?.token;
    const payload = verifyToken(token);
    if (!payload || payload.kind !== 'reschedule' || !payload.eventId) {
      return res.status(400).json({ error: 'Invalid or expired link. Text Tyson at (407) 754-5565 to reschedule.' });
    }

    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId   = process.env.GOOGLE_CALENDAR_ID || 'primary';
    if (!(clientId && clientSecret && redirectUri && refreshToken)) {
      return res.status(500).json({ error: 'Calendar not configured yet.' });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    let event;
    try {
      const { data } = await calendar.events.get({ calendarId, eventId: payload.eventId });
      event = data;
    } catch (err) {
      console.warn('[ShinePro] booking-info: event lookup failed', err?.message);
      return res.status(404).json({ error: 'Booking not found. It may have been cancelled.' });
    }

    if (event.status === 'cancelled') {
      return res.status(410).json({ error: 'This booking was cancelled.' });
    }

    const service = parseService(event.summary);
    const name    = maskName(parseName(event.summary));
    const { date, time, timeLabel } = parseStart(event.start);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      ok: true,
      service,
      date,
      time,
      timeLabel,
      address: event.location || '',
      name
    });
  } catch (err) {
    console.error('[ShinePro] /api/booking-info error:', err);
    return res.status(500).json({ error: 'Something went wrong.', detail: err?.message || String(err) });
  }
}

/* ---------- helpers ---------- */

// Event summary looks like: "ShinePro: Exterior Windows — Malachi MERCADO-DAYS"
function parseService(summary) {
  if (!summary) return '';
  const m = /^ShinePro:\s*(.+?)\s*—/.exec(summary);
  return m ? m[1].trim() : summary.replace(/^ShinePro:\s*/, '').trim();
}
function parseName(summary) {
  if (!summary) return '';
  const m = /—\s*(.+)$/.exec(summary);
  return m ? m[1].trim() : '';
}
function maskName(full) {
  if (!full) return '';
  const parts = full.split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// event.start.dateTime is like "2026-04-24T13:00:00-04:00"
function parseStart(start) {
  const dt = start?.dateTime;
  if (!dt) return { date: '', time: '', timeLabel: '' };

  // Extract the wall-clock time using the America/New_York TZ so EST/EDT is handled.
  const d = new Date(dt);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  let hh = parseInt(parts.hour, 10); if (hh === 24) hh = 0;
  const mm = parts.minute;
  const time = `${String(hh).padStart(2, '0')}:${mm}`;
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true
  }).format(d);
  return { date, time, timeLabel };
}
