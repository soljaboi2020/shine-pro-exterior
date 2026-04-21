// =====================================================================
// GET /api/debug-env
// =====================================================================
// TEMPORARY diagnostic endpoint. Reports whether each expected env var
// is visible from the server's perspective. NEVER prints the actual
// values — only true/false + the first 6 chars of each one so we can
// confirm they aren't blank/garbled without leaking secrets.
//
// Delete this file once the Google Calendar integration is confirmed
// working end-to-end.
// =====================================================================

export default async function handler(req, res) {
  const keys = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_CALENDAR_ID'
  ];

  const status = {};
  for (const k of keys) {
    const v = process.env[k];
    status[k] = {
      present: Boolean(v),
      length: v ? v.length : 0,
      preview: v ? `${v.slice(0, 6)}…` : '(missing)'
    };
  }

  const meta = {
    nodeVersion: process.version,
    vercelEnv: process.env.VERCEL_ENV || '(not set)',
    vercelRegion: process.env.VERCEL_REGION || '(not set)',
    deploymentUrl: process.env.VERCEL_URL || '(not set)',
    timestamp: new Date().toISOString()
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({ envVars: status, meta });
}
