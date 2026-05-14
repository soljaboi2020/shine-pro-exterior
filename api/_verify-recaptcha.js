// api/_verify-recaptcha.js — shared Google reCAPTCHA v3 verification helper.
//
// Files in /api/ that start with "_" are treated by Vercel as private utility
// modules (not exposed as HTTP routes). Import this helper into any endpoint
// that accepts a form submission to gate it behind a real-human score.
//
// Usage (inside any /api/<route>.js handler):
//
//   import { verifyRecaptcha, RECAPTCHA_REJECT_STATUS } from './_verify-recaptcha.js';
//
//   const check = await verifyRecaptcha(body.recaptchaToken, 'mockup_form', req);
//   if (!check.ok) {
//     return res.status(RECAPTCHA_REJECT_STATUS).json({ error: check.reason });
//   }
//
// What it does:
//   1. POSTs the token + secret to https://www.google.com/recaptcha/api/siteverify
//   2. Logs the score + action + hostname so we can tune the threshold from real traffic
//   3. Rejects if: no token, token invalid, action mismatched, score < threshold
//   4. Returns { ok: true, score, action } on success
//
// Threshold tuning:
//   - Default is 0.5 (Google's recommended starting point).
//   - Override per-route with the second argument's options object, or globally
//     with RECAPTCHA_MIN_SCORE env var.
//   - After ~10 real submissions, check the Vercel logs and tune up/down.
//
// Failure modes (and why we picked each):
//   - Missing RECAPTCHA_SECRET_KEY env var → ALLOW the request through (with a
//     warning log). Reason: we never want a misconfiguration to take down the
//     whole site. Bot protection is a layer, not a hard gate.
//   - Token verify HTTP call fails (network / Google down) → ALLOW with warning.
//     Same reason — graceful degradation beats a 503.
//   - Token present but invalid/expired/wrong-action/low-score → REJECT.

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_MIN_SCORE = 0.5;

export const RECAPTCHA_REJECT_STATUS = 400;

/**
 * Verify a reCAPTCHA v3 token submitted from the frontend.
 *
 * @param {string} token - The token from grecaptcha.execute()
 * @param {string} expectedAction - The action label used on the frontend
 * @param {object} req - The Vercel request object (used to log IP/hostname)
 * @param {object} [options]
 * @param {number} [options.minScore] - Override the rejection threshold
 * @returns {Promise<{ok: boolean, score?: number, action?: string, reason?: string}>}
 */
export async function verifyRecaptcha(token, expectedAction, req, options = {}) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const minScore =
    typeof options.minScore === 'number'
      ? options.minScore
      : Number(process.env.RECAPTCHA_MIN_SCORE) || DEFAULT_MIN_SCORE;

  // 1. No secret configured → allow + warn. Never block the form just because
  // an env var didn't get pasted in. We'll see the warning in Vercel logs.
  if (!secret) {
    console.warn(
      '[recaptcha] RECAPTCHA_SECRET_KEY is not set — allowing request through without verification'
    );
    return { ok: true, score: null, action: expectedAction, reason: 'unconfigured' };
  }

  // 2. No token from the frontend → reject with clear 400.
  if (!token || typeof token !== 'string') {
    console.warn(
      `[recaptcha] missing token for action="${expectedAction}" ip=${ipOf(req)}`
    );
    return {
      ok: false,
      reason: 'reCAPTCHA verification failed (no token). Please refresh and try again.',
    };
  }

  // 3. Call Google's siteverify endpoint.
  let data;
  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      // Optional but recommended — Google uses it for stricter scoring.
      remoteip: ipOf(req) || '',
    });

    const verifyRes = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    data = await verifyRes.json();
  } catch (err) {
    // Network failure → allow + warn. Same rationale as the missing-secret case.
    console.warn(
      `[recaptcha] siteverify HTTP call failed for action="${expectedAction}":`,
      err
    );
    return { ok: true, score: null, action: expectedAction, reason: 'network_error' };
  }

  // 4. Inspect the response. Log every outcome so we can tune from real data.
  const { success, score, action, hostname, 'error-codes': errorCodes } = data || {};

  console.log(
    `[recaptcha] action="${action || expectedAction}" success=${success} score=${score} hostname="${hostname}" ip=${ipOf(req)} expected="${expectedAction}"`
  );

  if (!success) {
    console.warn('[recaptcha] verification failed — Google returned errors:', errorCodes);
    return {
      ok: false,
      reason: 'reCAPTCHA verification failed. Please refresh and try again.',
    };
  }

  // 5. Action mismatch → reject. This catches token reuse across forms.
  if (action && expectedAction && action !== expectedAction) {
    console.warn(
      `[recaptcha] action mismatch: expected="${expectedAction}" got="${action}"`
    );
    return {
      ok: false,
      reason: 'reCAPTCHA action mismatch. Please refresh and try again.',
    };
  }

  // 6. Score below threshold → reject (likely bot).
  if (typeof score === 'number' && score < minScore) {
    console.warn(
      `[recaptcha] score ${score} < threshold ${minScore} for action="${expectedAction}" — rejecting`
    );
    return {
      ok: false,
      score,
      action,
      reason:
        "Your submission looks like automated traffic. If that's wrong, please try again or text Tyson at (407) 754-5565.",
    };
  }

  return { ok: true, score, action };
}

// Best-effort client IP extraction. Vercel sets x-forwarded-for; fall back to
// req.socket if running locally with vercel dev.
function ipOf(req) {
  try {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
      return xff.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || '';
  } catch {
    return '';
  }
}
