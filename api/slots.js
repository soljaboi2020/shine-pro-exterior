// =====================================================================
// GET /api/slots?date=YYYY-MM-DD
// =====================================================================
// Returns the list of 2-hour job slots that are ACTUALLY available for
// booking on a given date, accounting for:
//
//   1. Business hours
//        Mon–Fri: 11:30 AM – 8:00 PM  (hourly starts from 11:30)
//        Sat–Sun: 8:00 AM – 8:00 PM   (hourly starts from 8:00)
//   2. Tyson's existing Google Calendar events on that date.
//   3. A BUFFER_MIN (90-minute) gap required between jobs — so a 1 PM
//      job blocks the next slot from starting earlier than ~4:30 PM.
//   4. Minimum lead time — can't book a slot that starts less than
//      MIN_LEAD_TIME_MIN from "now" (default 2 hrs).
//
// Response shape:
// {
//   "date": "2026-04-25",
//   "jobDurationMin": 120,
//   "bufferMin": 90,
//   "calendarReady": true,
//   "available": [
//     { "value": "13:00", "label": "1:00 PM" },
//     { "value": "17:00", "label": "5:00 PM" }
//   ]
// }
//
// If calendar env vars aren't set (pre-OAuth setup), busy = [] so all
// future candidates come back as available — the booking form still
// works and the operator can fix any conflicts manually.
// =====================================================================

import { google } from 'googleapis';

const JOB_DURATION_MIN = 120;     // 2 hours per job
const BUFFER_MIN       = 90;      // 1.5 hr between jobs
const MIN_LEAD_TIME_MIN = 120;    // must book at least 2 hrs in advance
const TIMEZONE = 'America/New_York';

// Business hours (minutes from midnight in NY local time)
const WEEKDAY_OPEN_MIN = 11 * 60 + 30;   // 690  = 11:30 AM
const WEEKEND_OPEN_MIN =  8 * 60;        // 480  =  8:00 AM
const CLOSE_MIN        = 20 * 60;        // 1200 =  8:00 PM

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Missing or invalid ?date=YYYY-MM-DD' });
    }

    // Day of week (0=Sun ... 6=Sat) — anchor at noon UTC to avoid DST edge cases
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const isWeekend = (dow === 0 || dow === 6);

    const candidates = generateCandidates(isWeekend).map(localMin => ({
      localMin,
      startMs:  nyTimeToUtcMs(date, localMin),
      endMs:    nyTimeToUtcMs(date, localMin + JOB_DURATION_MIN),
      value:    fmt24(localMin),            // "13:30"  — form value
      label:    fmt12(localMin)             // "1:30 PM" — human
    }));

    // Enforce min lead time (no "book 10 min from now" nonsense)
    const leadCutoffMs = Date.now() + MIN_LEAD_TIME_MIN * 60000;
    const futureCandidates = candidates.filter(c => c.startMs > leadCutoffMs);

    // ---- Read Tyson's calendar for busy ranges ----
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId   = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const calendarReady = Boolean(clientId && clientSecret && redirectUri && refreshToken);

    let busy = [];
    if (calendarReady) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const timeMin = nyTimeToIso(date, 0);            // midnight NY
      const timeMax = nyTimeToIso(date, 24 * 60);      // next midnight NY

      // We use events.list (not freebusy.query) because our OAuth scope is
      // `calendar.events` — which does NOT grant freebusy access. events.list
      // returns the same information for our purposes and works with the
      // narrower scope we requested during the one-time Build #3 OAuth grant.
      const { data } = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,        // expand recurring events
        orderBy: 'startTime',
        maxResults: 250
      });
      busy = (data.items || [])
        .filter(ev => ev.status !== 'cancelled')
        .filter(ev => ev.start?.dateTime && ev.end?.dateTime)   // ignore all-day
        .map(ev => ({
          start: new Date(ev.start.dateTime).getTime(),
          end:   new Date(ev.end.dateTime).getTime()
        }));
    }

    // Filter by free/busy, expanding existing events by BUFFER_MIN in both directions.
    const available = futureCandidates
      .filter(c => isSlotFree(c.startMs, c.endMs, BUFFER_MIN, busy))
      .map(c => ({ value: c.value, label: c.label }));

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json({
      date,
      jobDurationMin: JOB_DURATION_MIN,
      bufferMin: BUFFER_MIN,
      calendarReady,
      available
    });
  } catch (err) {
    console.error('[ShinePro] /api/slots error:', err);
    return res.status(500).json({
      error: 'Failed to fetch slots',
      detail: err?.message || String(err)
    });
  }
}

/* ---------- helpers ---------- */

// Build an array of candidate slot-start minutes for a day.
// Step = 60 min; last candidate must leave room for the job before close.
function generateCandidates(isWeekend) {
  const open      = isWeekend ? WEEKEND_OPEN_MIN : WEEKDAY_OPEN_MIN;
  const lastStart = CLOSE_MIN - JOB_DURATION_MIN;
  const slots = [];
  for (let t = open; t <= lastStart; t += 60) slots.push(t);
  return slots;
}

// Is a candidate [startMs, endMs] free of any busy event, accounting for buffer?
// We expand the candidate by `bufferMin` on both sides and check overlap.
function isSlotFree(startMs, endMs, bufferMin, busyRanges) {
  const blockStart = startMs - bufferMin * 60000;
  const blockEnd   = endMs   + bufferMin * 60000;
  for (const b of busyRanges) {
    if (b.end > blockStart && b.start < blockEnd) return false;
  }
  return true;
}

// Convert a (dateStr + minutes-since-midnight-in-NY) pair into a UTC timestamp (ms).
function nyTimeToUtcMs(dateStr, localMin) {
  return new Date(nyTimeToIso(dateStr, localMin)).getTime();
}

// Build an ISO-8601 string in NY local time with the correct offset for the date
// (handles EST vs EDT via Intl.DateTimeFormat).
function nyTimeToIso(dateStr, localMin) {
  const hh = String(Math.floor(localMin / 60) % 24).padStart(2, '0');
  const mm = String(localMin % 60).padStart(2, '0');
  const offset = getNyOffset(dateStr);
  // If localMin >= 24*60, we've rolled into the next day for timeMax purposes.
  // nyTimeToIso(date, 1440) should mean "midnight the next day NY time".
  let effectiveDate = dateStr;
  if (localMin >= 24 * 60) {
    const d = new Date(`${dateStr}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    effectiveDate = d.toISOString().slice(0, 10);
  }
  return `${effectiveDate}T${hh}:${mm}:00${offset}`;
}

// Get the America/New_York GMT offset for the noon of a given date, e.g. "-04:00" or "-05:00".
function getNyOffset(dateStr) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    timeZoneName: 'longOffset'
  }).formatToParts(d);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  return tzPart ? tzPart.value.replace('GMT', '') : '-05:00';
}

function fmt24(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function fmt12(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
}
