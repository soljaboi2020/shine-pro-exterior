// =====================================================================
// GET /api/admin-jobs
// =====================================================================
// Lists upcoming bookings parsed from Tyson's Google Calendar.
// Requires `Authorization: Bearer <admin-session-token>` header
// (obtained from POST /api/admin-auth).
//
// Response shape:
// {
//   ok: true,
//   generatedAt: "...",
//   totalUpcoming: 7,
//   totalRevenueEstimate: 1450,     // dollars, rough
//   groups: {
//     today:    [ Booking, ... ],
//     tomorrow: [ Booking, ... ],
//     thisWeek: [ Booking, ... ],   // everything from 2+ days out through Sunday
//     later:    [ Booking, ... ]    // after this week up to the horizon
//   }
// }
//
// Each Booking:
// {
//   eventId, summary, startISO, endISO, dateLabel, timeLabel,
//   service, name, phone, email, address, windowCount,
//   gateCode, pets, coupon, notes, link, revenueEstimate
// }
// =====================================================================

import { google } from 'googleapis';
import { verifyAdminSession } from './_token.js';

const TIMEZONE = 'America/New_York';
const HORIZON_DAYS = 60;

// Keep these in sync with index.html's Instant Quote card + script.js.
const PRICE_ANCHORS = [
  { count: 10, min: 125, max: 125 },
  { count: 20, min: 175, max: 175 },
  { count: 30, min: 250, max: 275 },
  { count: 40, min: 350, max: 400 },
  { count: 50, min: 450, max: 500 }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // -------- Auth --------
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyAdminSession(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
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

    const now = new Date();
    const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

    const { data } = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: horizon.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250
    });

    const items = (data.items || [])
      .filter(ev => ev.status !== 'cancelled')
      .filter(ev => ev.start?.dateTime) // skip all-day + malformed
      .map(ev => parseEvent(ev));

    // Only show ShinePro-created bookings in the "jobs" counters. Other
    // calendar events still show up, but flagged so Tyson knows they're
    // personal/manual entries.
    const bookings = items.filter(i => i.isShinePro);
    const totalRevenueEstimate = bookings.reduce((s, b) => s + (b.revenueEstimate || 0), 0);

    // Group
    const todayKey    = dateKey(now);
    const tomorrowKey = dateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000));
    const weekEnd     = endOfWeek(now);

    const groups = { today: [], tomorrow: [], thisWeek: [], later: [] };
    for (const it of items) {
      const k = it.dateKey;
      if (k === todayKey) groups.today.push(it);
      else if (k === tomorrowKey) groups.tomorrow.push(it);
      else if (new Date(it.startISO) <= weekEnd) groups.thisWeek.push(it);
      else groups.later.push(it);
    }

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      totalUpcoming: bookings.length,
      totalRevenueEstimate,
      groups
    });
  } catch (err) {
    console.error('[ShinePro] /api/admin-jobs error:', err);
    return res.status(500).json({ error: 'Something went wrong.', detail: err?.message || String(err) });
  }
}

/* ---------- parsing ---------- */

function parseEvent(ev) {
  const isShinePro = /^ShinePro:\s*/.test(ev.summary || '');
  const isBlock    = /^BLOCKED:/i.test(ev.summary || '');
  const service = isShinePro ? grab(ev.summary, /^ShinePro:\s*(.+?)\s*—/) : '';
  const name    = isShinePro ? grab(ev.summary, /—\s*(.+)$/)              : '';
  const desc    = ev.description || '';
  const phone   = pickEmoji(desc, '📞');
  const email   = pickEmoji(desc, '✉️');
  const windowCount = pickLabel(desc, 'Windows:');
  const gateCode    = pickLabel(desc, 'Gate code:');
  const pets        = pickLabel(desc, 'Pets:');
  const coupon      = pickLabel(desc, 'Coupon:');
  const notes       = pickLabel(desc, 'Notes:');
  const revenueEstimate = isShinePro ? estimatePrice(windowCount) : 0;

  const startISO = ev.start.dateTime;
  const endISO   = ev.end?.dateTime || startISO;
  const startD   = new Date(startISO);
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, weekday: 'short', month: 'short', day: 'numeric'
  }).format(startD);
  const timeLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true
  }).format(startD);

  return {
    eventId: ev.id,
    summary: ev.summary || '(no title)',
    isShinePro, isBlock,
    startISO, endISO,
    dateKey: dateKey(startD),
    dateLabel, timeLabel,
    service, name,
    phone, email,
    address: ev.location || '',
    windowCount, gateCode, pets, coupon, notes,
    link: ev.htmlLink,
    revenueEstimate
  };
}

function grab(str, re) {
  if (!str) return '';
  const m = re.exec(str);
  return m ? m[1].trim() : '';
}
function pickEmoji(desc, emoji) {
  const re = new RegExp(`${emoji}\\s*([^\\n]+)`);
  const m = re.exec(desc);
  return m ? m[1].trim() : '';
}
function pickLabel(desc, label) {
  const re = new RegExp(`${label.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*([^\\n]+)`);
  const m = re.exec(desc);
  return m ? m[1].trim() : '';
}

// Rough price estimator — linear interpolation between the public anchors.
function estimatePrice(windowCountStr) {
  const n = parseInt(windowCountStr, 10);
  if (!n || isNaN(n)) return 0;
  if (n < 10) return 125;
  if (n > 50) return 500;
  let lo = PRICE_ANCHORS[0], hi = PRICE_ANCHORS[PRICE_ANCHORS.length - 1];
  for (let i = 0; i < PRICE_ANCHORS.length - 1; i++) {
    if (n >= PRICE_ANCHORS[i].count && n <= PRICE_ANCHORS[i + 1].count) {
      lo = PRICE_ANCHORS[i]; hi = PRICE_ANCHORS[i + 1]; break;
    }
  }
  const t = hi.count === lo.count ? 0 : (n - lo.count) / (hi.count - lo.count);
  const mid = (min, max) => Math.round(min + (max - min) / 2);
  const loMid = mid(lo.min, lo.max);
  const hiMid = mid(hi.min, hi.max);
  return Math.round(loMid + t * (hiMid - loMid));
}

// Date key in NY time so "today" means Tyson's today, not UTC today.
function dateKey(d) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

// Sunday 23:59:59 of "this week" in NY time, returned as a JS Date.
function endOfWeek(d) {
  // getDay in local/UTC is fine for a 7-day horizon calc
  const nyNow = new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
  const dow = nyNow.getDay(); // 0 Sun ... 6 Sat
  const daysUntilSunday = (7 - dow) % 7; // 0 on Sun
  const end = new Date(nyNow);
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  return end;
}
