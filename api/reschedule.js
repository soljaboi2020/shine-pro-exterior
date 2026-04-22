// =====================================================================
// POST /api/reschedule
// =====================================================================
// Body: { token, newDate: "YYYY-MM-DD", newTime: "HH:MM" }
//
// Flow:
//   1. Verify HMAC token → get eventId + customer email.
//   2. Fetch the existing event (so we can pull customer name / address /
//      description, and reuse them when we send the updated email).
//   3. PATCH the event's start/end to the new window (calendar.events.patch).
//      We MODIFY the existing event — we do NOT create a new one — so the
//      event link in the customer's original email keeps working.
//   4. Send a "Booking rescheduled" email (same template, different header)
//      to the customer (Tyson CC'd).
//
// Response:
//   { ok: true, eventId, newStart, newEnd, emailSent }
// =====================================================================

import { google } from 'googleapis';
import { verifyToken } from './_token.js';
import { sendRescheduleConfirmation, sendOwnerBookingAlert } from './_emails.js';

const JOB_DURATION_MIN = 120;
const TIMEZONE = 'America/New_York';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { token, newDate, newTime } = body;

    const payload = verifyToken(token);
    if (!payload || payload.kind !== 'reschedule' || !payload.eventId) {
      return res.status(400).json({ error: 'Invalid or expired reschedule link.' });
    }

    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      return res.status(400).json({ error: 'Invalid newDate.' });
    }
    if (!newTime || !/^\d{2}:\d{2}$/.test(newTime)) {
      return res.status(400).json({ error: 'Invalid newTime.' });
    }

    // -------- Google client --------
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId   = process.env.GOOGLE_CALENDAR_ID || 'primary';
    if (!(clientId && clientSecret && redirectUri && refreshToken)) {
      return res.status(500).json({ error: 'Calendar not configured.' });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // -------- Fetch current event --------
    let currentEvent;
    try {
      const { data } = await calendar.events.get({ calendarId, eventId: payload.eventId });
      currentEvent = data;
    } catch (err) {
      console.warn('[ShinePro] reschedule: event lookup failed', err?.message);
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (currentEvent.status === 'cancelled') {
      return res.status(410).json({ error: 'This booking was cancelled.' });
    }

    // -------- Build new start/end --------
    const [y, m, d]   = newDate.split('-').map(Number);
    const [hh, mm]    = newTime.split(':').map(Number);
    const startMin    = hh * 60 + mm;
    const endMin      = startMin + JOB_DURATION_MIN;
    const startISO    = toNaiveISO(y, m, d, Math.floor(startMin / 60), startMin % 60);
    const endISO      = toNaiveISO(y, m, d, Math.floor(endMin   / 60), endMin   % 60);

    // -------- Patch the event --------
    const { data: patched } = await calendar.events.patch({
      calendarId,
      eventId: payload.eventId,
      requestBody: {
        start: { dateTime: startISO, timeZone: TIMEZONE },
        end:   { dateTime: endISO,   timeZone: TIMEZONE },
        description: appendRescheduleNote(currentEvent.description, newDate, newTime)
      }
    });

    console.log('[ShinePro] Event rescheduled:', patched.id, '→', startISO);

    // -------- Rebuild booking-shaped object for the email --------
    const bookingShape = reconstructBooking(currentEvent, payload.email, newDate, newTime);

    const siteUrl = resolveSiteUrl(req);
    const [emailResult, ownerAlertResult] = await Promise.all([
      sendRescheduleConfirmation({
        booking: bookingShape,
        eventId: patched.id,
        eventLink: patched.htmlLink,
        siteUrl
      }).catch(err => {
        console.error('[ShinePro] reschedule email threw:', err);
        return { sent: false };
      }),
      sendOwnerBookingAlert({
        booking: bookingShape,
        eventId: patched.id,
        eventLink: patched.htmlLink,
        siteUrl,
        kind: 'reschedule'
      }).catch(err => {
        console.error('[ShinePro] reschedule owner alert threw:', err);
        return { sent: false };
      })
    ]);

    return res.status(200).json({
      ok: true,
      eventId: patched.id,
      eventLink: patched.htmlLink,
      newStart: startISO,
      newEnd:   endISO,
      emailSent: emailResult.sent === true,
      ownerAlertSent: ownerAlertResult.sent === true
    });
  } catch (err) {
    console.error('[ShinePro] /api/reschedule error:', err);
    return res.status(500).json({
      error: 'Reschedule failed. Text Tyson at (407) 754-5565.',
      detail: err?.message || String(err)
    });
  }
}

/* ---------- helpers ---------- */

function toNaiveISO(y, m, d, h, min) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
}

function appendRescheduleNote(oldDesc, newDate, newTime) {
  const stamp = new Date().toISOString();
  const note  = `🔄 Rescheduled by customer on ${stamp} → ${newDate} ${newTime}`;
  if (!oldDesc) return note;
  return `${oldDesc}\n\n${note}`;
}

// The email helper expects a booking-shaped object (same shape as the form).
// Reconstruct one from the Google event's description — which was written
// by book.js in a predictable "emoji label: value" format.
function reconstructBooking(event, fallbackEmail, newDate, newTime) {
  const desc = event.description || '';
  const name = grabNameFromSummary(event.summary);
  const svc  = grabServiceFromSummary(event.summary);
  return {
    service:  svc,
    name,
    phone:    pick(desc, '📞'),
    email:    pick(desc, '✉️') || fallbackEmail || '',
    address:  event.location || pick(desc, '📍') || '',
    windowCount:  pickAfter(desc, 'Windows:'),
    gateCode:     pickAfter(desc, 'Gate code:'),
    pets:         pickAfter(desc, 'Pets:'),
    coupon:       pickAfter(desc, 'Coupon:'),
    notes:        pickAfter(desc, 'Notes:'),
    preferredDate: newDate,
    preferredTime: newTime,
    preferredTimeLabel: to12h(newTime)
  };
}

function grabServiceFromSummary(s) {
  if (!s) return '';
  const m = /^ShinePro:\s*(.+?)\s*—/.exec(s);
  return m ? m[1].trim() : '';
}
function grabNameFromSummary(s) {
  if (!s) return '';
  const m = /—\s*(.+)$/.exec(s);
  return m ? m[1].trim() : '';
}
function pick(desc, emoji) {
  const re = new RegExp(`${emoji}\\s*([^\\n]+)`);
  const m = re.exec(desc);
  return m ? m[1].trim() : '';
}
function pickAfter(desc, label) {
  const re = new RegExp(`${label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*([^\\n]+)`);
  const m = re.exec(desc);
  return m ? m[1].trim() : '';
}
function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}
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
