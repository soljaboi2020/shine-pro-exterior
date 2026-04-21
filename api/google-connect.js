// =====================================================================
// GET /api/google-connect
// =====================================================================
// ONE-TIME setup endpoint. Tyson visits this URL once, in a browser
// where he's signed into his ShinePro Gmail (Tysont5076@gmail.com), to
// authorize ShinePro Booking to create events on his calendar.
//
// Flow:
//   1. Tyson opens https://shine-pro-exterior.vercel.app/api/google-connect
//   2. We redirect him to Google's OAuth consent screen for our app
//   3. Tyson clicks "Allow"
//   4. Google redirects him back to /api/google-callback?code=...
//   5. /api/google-callback exchanges the code for a refresh token and
//      shows it on-screen so we can paste it into Vercel env vars.
//
// After that — we never need to hit this endpoint again. The refresh
// token is permanent (unless Tyson revokes access in his Google account).
// =====================================================================

import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send(
        'Missing Google OAuth env vars. Expected GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI in Vercel.'
      );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const url = oauth2Client.generateAuthUrl({
      // 'offline' is what gives us a refresh_token (persistent, reusable).
      access_type: 'offline',
      // 'consent' forces the approval screen so we reliably get a refresh token
      // even if Tyson previously authorized something under this account.
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events']
    });

    // Simple branded intro page so Tyson knows he's in the right place
    // before he clicks through to Google's consent screen.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect Google Calendar — ShinePro Booking</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a1738; color: #fff; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #fff; color: #0f172a; max-width: 520px; width: 100%; padding: 2rem 2rem 2.25rem; border-radius: 1.25rem; box-shadow: 0 30px 80px -20px rgba(0,0,0,.5); }
    h1 { font-size: 1.75rem; margin: 0 0 0.75rem; color: #0a1738; }
    p  { color: #475569; line-height: 1.55; }
    ol { color: #475569; padding-left: 1.25rem; line-height: 1.7; }
    ol strong { color: #0f172a; }
    .btn { display: inline-block; margin-top: 1.25rem; background: #eab308; color: #0f172a; padding: 0.9rem 1.5rem; border-radius: 0.75rem; font-weight: 700; text-decoration: none; font-size: 1.05rem; }
    .btn:hover { background: #ca8a04; }
    .badge { display: inline-block; background: #eff6ff; color: #1e40af; padding: 0.3rem 0.65rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ShinePro Booking • Setup</div>
    <h1>Connect your Google Calendar</h1>
    <p>This is a one-time setup step. Click the button below and Google will ask your permission to let <strong>ShinePro Booking</strong> add new customer bookings directly onto your calendar.</p>
    <ol>
      <li>Make sure you're signed in as <strong>Tysont5076@gmail.com</strong> in this browser.</li>
      <li>Click <strong>Connect Google Calendar</strong> below.</li>
      <li>On Google's screen, click <strong>Allow</strong>.</li>
      <li>You'll land on a confirmation page. Leave it open and message the developer — we're done.</li>
    </ol>
    <a class="btn" href="${url}">→ Connect Google Calendar</a>
  </div>
</body>
</html>`);
  } catch (err) {
    console.error('[google-connect] error:', err);
    return res.status(500).send('Something went wrong starting the Google Calendar connect flow.');
  }
}
