// =====================================================================
// GET /api/google-callback?code=...
// =====================================================================
// Google redirects Tyson here after he clicks "Allow" on the consent
// screen. We exchange the short-lived `code` for a long-lived
// `refresh_token` and show it on-screen ONCE so we can paste it into
// Vercel env vars (GOOGLE_REFRESH_TOKEN).
//
// After that, every booking request will use the refresh token to create
// Calendar events without any further human interaction.
// =====================================================================

import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const clientId     = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri  = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send('Missing Google OAuth env vars on the server.');
    }

    const { code, error } = req.query;

    if (error) {
      return renderHtml(res, 400, '❌ Google denied the connection',
        `Google returned an error: <code>${escape(error)}</code>. This usually means you clicked "Cancel" instead of "Allow" on the consent screen. You can try again by re-opening <a href="/api/google-connect">/api/google-connect</a>.`);
    }

    if (!code) {
      return renderHtml(res, 400, 'Missing authorization code',
        'Google didn\'t send back an authorization code. Start over at <a href="/api/google-connect">/api/google-connect</a>.');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return renderHtml(res, 400, '⚠️ No refresh token returned',
        `Google granted access but did NOT include a refresh token. This usually happens if you've connected ShinePro Booking before — Google only sends a refresh token on the FIRST authorization. To fix it: go to <a href="https://myaccount.google.com/permissions" target="_blank">myaccount.google.com/permissions</a>, find "ShinePro Booking", click "Remove access", then retry at <a href="/api/google-connect">/api/google-connect</a>.`);
    }

    // Success! Display the refresh token ONCE so it can be copied into Vercel.
    // After pasting it into GOOGLE_REFRESH_TOKEN env var + redeploying,
    // this URL should never need to be visited again.
    const tokenValue = tokens.refresh_token;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connected — ShinePro Booking</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #0a1738; color: #fff; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .card { background: #fff; color: #0f172a; max-width: 640px; width: 100%; padding: 2rem 2rem 2.25rem; border-radius: 1.25rem; box-shadow: 0 30px 80px -20px rgba(0,0,0,.5); }
    h1 { font-size: 1.75rem; margin: 0 0 0.75rem; color: #0a1738; }
    p  { color: #475569; line-height: 1.55; }
    .ok { color: #059669; font-weight: 700; }
    code, pre { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.9rem; }
    .token-box { background: #0a1738; color: #fff; padding: 1rem; border-radius: 0.75rem; margin: 1rem 0; overflow-wrap: anywhere; word-break: break-all; font-size: 0.85rem; line-height: 1.45; }
    .warn { background: #fff8e1; border-left: 4px solid #eab308; padding: 0.85rem 1rem; margin: 1rem 0; border-radius: 0 .5rem .5rem 0; color: #713f12; font-size: .95rem; }
    ol { color: #475569; padding-left: 1.25rem; line-height: 1.7; }
    ol strong { color: #0f172a; }
    button.copy { background: #3b82f6; color: #fff; border: 0; padding: 0.5rem 0.85rem; border-radius: 0.5rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
    button.copy:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h1><span class="ok">✓ Connected!</span></h1>
    <p>Google says ShinePro Booking is allowed to add events to this account's calendar. One more step — the developer needs to save the token below into Vercel so the server can actually use it.</p>

    <div class="warn">
      <strong>⚠️ Copy this token RIGHT NOW.</strong> For security, Google only shows it this once. If you close this tab before saving it, you'll have to disconnect and redo the Allow step.
    </div>

    <p><strong>Refresh token:</strong></p>
    <div class="token-box" id="token">${escape(tokenValue)}</div>
    <button class="copy" onclick="copyToken()">📋 Copy token</button>

    <h3 style="margin-top:2rem; color:#0a1738;">Next steps (developer):</h3>
    <ol>
      <li>Click <strong>Copy token</strong> above.</li>
      <li>Open <a href="https://vercel.com/dashboard" target="_blank">Vercel dashboard</a> → <strong>shine-pro-exterior</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
      <li>Click <strong>Add New</strong>. Key: <code>GOOGLE_REFRESH_TOKEN</code>. Value: paste the token. Check all 3 environments. <strong>Save</strong>.</li>
      <li>Go to the <strong>Deployments</strong> tab → click the 3-dot menu on the latest deployment → <strong>Redeploy</strong>. (Env vars only load on deploy.)</li>
      <li>Close this tab. You're done.</li>
    </ol>
  </div>

  <script>
    function copyToken() {
      const t = document.getElementById('token').innerText;
      navigator.clipboard.writeText(t).then(() => {
        const b = document.querySelector('button.copy');
        b.textContent = '✅ Copied!';
        setTimeout(() => { b.textContent = '📋 Copy token'; }, 2000);
      });
    }
  </script>
</body>
</html>`);
  } catch (err) {
    console.error('[google-callback] error:', err);
    return renderHtml(res, 500, 'Server error exchanging token',
      `Something went wrong: <code>${escape(err.message || String(err))}</code>. Try <a href="/api/google-connect">starting over</a>.`);
  }
}

/* ---------- helpers ---------- */
function escape(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderHtml(res, status, heading, bodyHtml) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(status).send(`<!doctype html>
<html><head><meta charset="utf-8"/><title>${escape(heading)}</title>
<style>body{font-family:system-ui,sans-serif;background:#0a1738;color:#fff;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;}
.card{background:#fff;color:#0f172a;max-width:560px;width:100%;padding:2rem;border-radius:1.25rem;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);}
h1{color:#0a1738;margin:0 0 .75rem;}p{color:#475569;line-height:1.55;}a{color:#3b82f6;}code{background:#f1f5f9;padding:0 .3rem;border-radius:.25rem;}
</style></head>
<body><div class="card"><h1>${escape(heading)}</h1><p>${bodyHtml}</p></div></body></html>`);
}
