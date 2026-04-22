// =====================================================================
// Resend email helper
// =====================================================================
// Uses Resend's REST API directly (no SDK dependency added) to send
// booking + reschedule confirmations. Uses onboarding@resend.dev as
// the sender so no domain verification is required.
//
// Requires env var: RESEND_API_KEY  (already in Vercel per Malachi)
// =====================================================================

import { signToken } from './_token.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM = 'ShinePro Exterior <onboarding@resend.dev>';
const OWNER_EMAIL = 'Tysont5076@gmail.com';
const OWNER_PHONE = '(407) 754-5565';
const PHONE_TEL   = '+14077545565';

// -------------------------------------------------
// Public send helpers
// -------------------------------------------------

export async function sendBookingConfirmation({ booking, eventId, eventLink, siteUrl }) {
  const token = signToken({ eventId, email: booking.email, kind: 'reschedule' });
  const rescheduleUrl = `${siteUrl}/reschedule?token=${encodeURIComponent(token)}`;
  const subject = `Booking confirmed — ${booking.service} on ${formatHumanDate(booking.preferredDate)}`;
  const { html, text } = buildConfirmationContent(booking, rescheduleUrl, eventLink, /* isReschedule */ false);
  return sendMail({ to: booking.email, subject, html, text });
}

export async function sendRescheduleConfirmation({ booking, eventId, eventLink, siteUrl }) {
  const token = signToken({ eventId, email: booking.email, kind: 'reschedule' });
  const rescheduleUrl = `${siteUrl}/reschedule?token=${encodeURIComponent(token)}`;
  const subject = `Booking rescheduled — ${booking.service} now on ${formatHumanDate(booking.preferredDate)}`;
  const { html, text } = buildConfirmationContent(booking, rescheduleUrl, eventLink, /* isReschedule */ true);
  return sendMail({ to: booking.email, subject, html, text });
}

// -------------------------------------------------
// Internals
// -------------------------------------------------

async function sendMail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[ShinePro] RESEND_API_KEY not set — skipping email');
    return { sent: false, reason: 'no-api-key' };
  }

  try {
    // Resend test-mode gotcha: when sending via onboarding@resend.dev
    // (no custom domain verified), you can ONLY send to the email on
    // your Resend account. Any OTHER recipient — TO *or* CC — triggers
    // a 403 validation error that blocks the ENTIRE send. So we only
    // CC Tyson when `RESEND_DOMAIN_VERIFIED=true` is set in Vercel,
    // which Malachi should flip after verifying a custom domain. Until
    // then: customer gets the email, Tyson sees the booking via his
    // Google Calendar notification (which fires instantly on his phone
    // the moment /api/book inserts the event — verified Build #3).
    const domainReady = process.env.RESEND_DOMAIN_VERIFIED === 'true';
    const mail = {
      from: FROM,
      to: [to],
      subject, html, text,
      reply_to: OWNER_EMAIL    // customer replies always go to Tyson
    };
    if (domainReady) {
      mail.cc = [OWNER_EMAIL];
    }

    const resp = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mail)
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error('[ShinePro] Resend error:', resp.status, errText);
      return { sent: false, reason: `resend-${resp.status}`, detail: errText };
    }
    const data = await resp.json().catch(() => ({}));
    console.log('[ShinePro] Email sent:', data.id, '→', to);
    return { sent: true, id: data.id };
  } catch (err) {
    console.error('[ShinePro] Resend exception:', err);
    return { sent: false, reason: 'exception', detail: String(err?.message || err) };
  }
}

function buildConfirmationContent(b, rescheduleUrl, eventLink, isReschedule) {
  const prettyDate = formatHumanDate(b.preferredDate);
  const prettyTime = b.preferredTimeLabel || b.preferredTime || '(time TBD)';
  const headerLabel = isReschedule ? 'Your booking was rescheduled' : 'Your booking is confirmed';
  const intro = isReschedule
    ? `Hi ${esc(b.name)}, your ShinePro appointment has been updated. Here are the new details:`
    : `Hi ${esc(b.name)}, thanks for booking with ShinePro Exterior Care! Here's a summary:`;

  const detailRow = (label, value) => value
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:140px;">${label}</td><td style="padding:8px 0;color:#0f172a;font-size:15px;font-weight:600;">${esc(value)}</td></tr>`
    : '';

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,0.06);">
        <tr><td style="background:#0a1738;padding:28px 32px;color:#fff;text-align:center;">
          <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;">ShinePro Exterior</div>
          <div style="font-size:14px;opacity:0.8;margin-top:4px;">${headerLabel}</div>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#0f172a;">
          <p style="font-size:16px;line-height:1.55;margin:0 0 20px;">${intro}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:22px;">
            ${detailRow('Service',      b.service)}
            ${detailRow('Date',         prettyDate)}
            ${detailRow('Time',         prettyTime + ' (approx. 2 hr)')}
            ${detailRow('Address',      b.address)}
            ${detailRow('Windows',      b.windowCount)}
            ${detailRow('Gate code',    b.gateCode)}
            ${detailRow('Pets on site', b.pets)}
            ${detailRow('Coupon',       b.coupon)}
            ${detailRow('Notes',        b.notes)}
          </table>
          <p style="font-size:15px;line-height:1.55;margin:0 0 12px;">
            🌧️ <strong>Rain policy:</strong> If it's raining on your scheduled day, Tyson will text you to reschedule — no charge, no hassle.
          </p>
          <p style="font-size:15px;line-height:1.55;margin:0 0 24px;">
            📞 Questions? Text or call Tyson at <a href="tel:${PHONE_TEL}" style="color:#3b82f6;font-weight:600;text-decoration:none;">${OWNER_PHONE}</a>.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
            <tr><td align="center">
              <a href="${rescheduleUrl}" style="display:inline-block;background:#eab308;color:#0a1738;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:800;font-size:16px;">🔄 Reschedule my booking</a>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#64748b;text-align:center;margin:14px 0 0;">
            Need to cancel? Just text Tyson directly.
          </p>
          ${eventLink ? `<p style="font-size:13px;color:#64748b;text-align:center;margin:8px 0 0;"><a href="${eventLink}" style="color:#3b82f6;text-decoration:none;">View on Tyson's calendar →</a></p>` : ''}
        </td></tr>
        <tr><td style="background:#f8fafc;padding:18px 32px;text-align:center;color:#64748b;font-size:12px;">
          ShinePro Exterior Care · Sanford, FL · ${OWNER_PHONE}<br>
          Sent because you booked a cleaning at shine-pro-exterior.vercel.app.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const textLines = [
    `${headerLabel}`,
    '',
    `Hi ${b.name},`,
    isReschedule
      ? 'Your ShinePro appointment has been updated. New details:'
      : 'Thanks for booking with ShinePro Exterior Care! Here are your details:',
    '',
    `Service:  ${b.service}`,
    `Date:     ${prettyDate}`,
    `Time:     ${prettyTime} (approx. 2 hr)`,
    `Address:  ${b.address}`,
    b.windowCount ? `Windows:  ${b.windowCount}` : '',
    b.gateCode    ? `Gate:     ${b.gateCode}` : '',
    b.pets        ? `Pets:     ${b.pets}` : '',
    b.coupon      ? `Coupon:   ${b.coupon}` : '',
    b.notes       ? `Notes:    ${b.notes}` : '',
    '',
    'Rain policy: if it\'s raining that day, Tyson will text you to reschedule — no charge.',
    '',
    `Reschedule: ${rescheduleUrl}`,
    `Questions?  Text or call Tyson at ${OWNER_PHONE}.`,
    '',
    '— ShinePro Exterior Care, Sanford FL'
  ].filter(Boolean);

  return { html, text: textLines.join('\n') };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatHumanDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '';
  const [y, m, d] = dateStr.split('-').map(Number);
  // Use UTC noon to avoid timezone off-by-one when formatting date-only
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'UTC'
  });
}
