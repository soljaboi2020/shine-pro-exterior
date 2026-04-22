// =====================================================================
// POST /api/admin-block
// =====================================================================
// Blocks a time window on Tyson's calendar so the public booking form
// won't offer it (the /api/slots free/busy check will see it as busy).
//
// Body:
//   { date: "YYYY-MM-DD", startTime: "HH:MM", endTime: "HH:MM", reason?: "..." }
//
// Requires `Authorization: Bearer <admin-session-token>`.
//
// Creates an event titled `BLOCKED: {reason}` on the configured calendar.
// =====================================================================

import { google } from 'googleapis';
import { verifyAdminSession } from './_token.js';

const TIMEZONE = 'America/New_York';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { date, startTime, endTime, reason } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date.' });
    }
    if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) {
      return res.status(400).json({ error: 'Invalid startTime.' });
    }
    if (!endTime || !/^\d{2}:\d{2}$/.test(endTime)) {
      return res.status(400).json({ error: 'Invalid endTime.' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time.' });
    }

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

    const startISO = `${date}T${startTime}:00`;
    const endISO   = `${date}T${endTime}:00`;
    const cleanReason = String(reason || '').slice(0, 120).trim() || 'Unavailable';
    const summary = `BLOCKED: ${cleanReason}`;

    const { data } = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description: '⛔ Time blocked via ShinePro admin dashboard. Slots in this window won\'t be offered to customers.',
        start: { dateTime: startISO, timeZone: TIMEZONE },
        end:   { dateTime: endISO,   timeZone: TIMEZONE }
      }
    });

    console.log('[ShinePro] Admin blocked time:', data.id, date, startTime, '→', endTime);

    return res.status(200).json({
      ok: true,
      eventId: data.id,
      eventLink: data.htmlLink,
      summary
    });
  } catch (err) {
    console.error('[ShinePro] /api/admin-block error:', err);
    return res.status(500).json({ error: 'Something went wrong.', detail: err?.message || String(err) });
  }
}
