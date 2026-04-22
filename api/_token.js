// =====================================================================
// HMAC token helpers — used by reschedule + admin auth
// =====================================================================
// Reschedule tokens:
//   signToken({ eventId, email, kind: 'reschedule' })
//   verifyToken(token) → payload or null
//
// Admin session tokens:
//   signAdminSession()           → stored in localStorage by admin.html
//   verifyAdminSession(token)    → true/false, checks exp too
//
// Why filename starts with underscore:
//   Vercel treats /api/_*.js as private utility modules (not routes).
//
// Secret source:
//   Prefers BOOKING_HMAC_SECRET env var if set. Otherwise derives a
//   stable secret by SHA-256 hashing GOOGLE_CLIENT_SECRET + GOOGLE_CLIENT_ID.
//   This way Push B "just works" with the env vars already in Vercel —
//   no new secret to configure.
// =====================================================================

import crypto from 'crypto';

const ADMIN_SESSION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret() {
  const dedicated = process.env.BOOKING_HMAC_SECRET;
  if (dedicated && dedicated.length >= 16) return dedicated;

  const cs = process.env.GOOGLE_CLIENT_SECRET || '';
  const ci = process.env.GOOGLE_CLIENT_ID || '';
  if (!cs || !ci) {
    throw new Error('No HMAC secret available (need BOOKING_HMAC_SECRET or GOOGLE_CLIENT_SECRET+GOOGLE_CLIENT_ID)');
  }
  return crypto.createHash('sha256').update(cs + '|' + ci).digest('hex');
}

export function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;

  let expected;
  try {
    expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function signAdminSession() {
  return signToken({ role: 'admin', exp: Date.now() + ADMIN_SESSION_MS });
}

export function verifyAdminSession(token) {
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return false;
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
  return true;
}
