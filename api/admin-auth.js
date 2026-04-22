// =====================================================================
// POST /api/admin-auth — exchange the admin password for a session token
// =====================================================================
// Body: { password: "Toma21394" }
// Success: { ok: true, token: "<signed>", expiresAt: <ms> }
// Fail:    401 { error: "Wrong password" }
//
// The session token is an HMAC-signed JWT-ish blob (see _token.js).
// admin.html stores it in localStorage and sends it as
// `Authorization: Bearer <token>` on subsequent requests.
//
// Env var:
//   ADMIN_PASSWORD — if set, we use this. Otherwise falls back to the
//   default "Toma21394" that Malachi picked. (Recommended: add the env
//   var in Vercel so the password isn't in source control.)
// =====================================================================

import crypto from 'crypto';
import { signAdminSession } from './_token.js';

const DEFAULT_PASSWORD = 'Toma21394';
const ADMIN_SESSION_MS = 24 * 60 * 60 * 1000;

// Tiny in-memory rate limiter: max 10 attempts per IP per 5 min.
// Not bulletproof (serverless instances are ephemeral) but raises the bar
// against casual brute-forcing.
const attempts = new Map(); // ip -> [{ts}]

function rateLimit(ip) {
  const now = Date.now();
  const cutoff = now - 5 * 60 * 1000;
  const list = (attempts.get(ip) || []).filter(t => t > cutoff);
  list.push(now);
  attempts.set(ip, list);
  return list.length <= 10;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || 'unknown';
  if (!rateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Wait a few minutes.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const provided = String(body.password || '');
    const expected = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    const ok = (a.length === b.length) && crypto.timingSafeEqual(a, b);
    if (!ok) {
      console.warn('[ShinePro admin-auth] bad password from', ip);
      return res.status(401).json({ error: 'Wrong password' });
    }

    const token = signAdminSession();
    return res.status(200).json({
      ok: true,
      token,
      expiresAt: Date.now() + ADMIN_SESSION_MS
    });
  } catch (err) {
    console.error('[ShinePro] /api/admin-auth error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
