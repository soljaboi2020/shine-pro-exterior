// =====================================================================
// Resend email helper
// =====================================================================
// Uses Resend's REST API directly (no SDK dependency added) to send
// booking + reschedule confirmations.
//
// As of 2026-04-22, the `shineproexterior.com` domain is VERIFIED on
// Resend (DKIM + SPF + MX all green), so we send FROM our real business
// address (`bookings@shineproexterior.com`) instead of the old
// `onboarding@resend.dev` test sender. Customers see a clean, branded
// email with no "via resend.dev" disclaimer in Gmail.
//
// Requires env vars:
//   - RESEND_API_KEY            (already in Vercel)
//   - RESEND_DOMAIN_VERIFIED    (set to 'true' to re-enable CC Tyson)
// =====================================================================

import { signToken } from './_token.js';

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM = 'ShinePro Exterior <bookings@shineproexterior.com>';
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
// Owner (Tyson) notifications
// -------------------------------------------------
// Fires every time a new booking is created (or rescheduled).
// Goes straight to Tyson — dedicated, admin-focused layout with
// Call / Text / Directions / Admin dashboard quick-action buttons
// and the estimated revenue up top.

export async function sendOwnerBookingAlert({ booking, eventId, eventLink, siteUrl, kind = 'new' }) {
  const subject = kind === 'reschedule'
    ? `🔄 RESCHEDULED: ${booking.service} — ${booking.name} · ${formatHumanDate(booking.preferredDate)}`
    : `🔔 NEW BOOKING: ${booking.service} — ${booking.name} · ${formatHumanDate(booking.preferredDate)}`;
  const { html, text } = buildOwnerAlertContent(booking, eventLink, siteUrl, kind);
  return sendOwnerMail({ subject, html, text });
}

async function sendOwnerMail({ subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[ShinePro] RESEND_API_KEY not set — skipping owner alert');
    return { sent: false, reason: 'no-api-key' };
  }
  try {
    const mail = {
      from: FROM,
      to: [OWNER_EMAIL],
      subject, html, text,
      reply_to: OWNER_EMAIL
    };
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
      console.error('[ShinePro] Resend owner-alert error:', resp.status, errText);
      return { sent: false, reason: `resend-${resp.status}`, detail: errText };
    }
    const data = await resp.json().catch(() => ({}));
    console.log('[ShinePro] Owner alert sent:', data.id);
    return { sent: true, id: data.id };
  } catch (err) {
    console.error('[ShinePro] Owner alert exception:', err);
    return { sent: false, reason: 'exception', detail: String(err?.message || err) };
  }
}

function buildOwnerAlertContent(b, eventLink, siteUrl, kind) {
  const prettyDate = formatHumanDate(b.preferredDate);
  const prettyTime = b.preferredTimeLabel || b.preferredTime || '(time TBD)';
  const revenue    = estimateRevenue(b.service, b.windowCount);
  const isReschedule = kind === 'reschedule';
  const headerLabel  = isReschedule ? '🔄 BOOKING RESCHEDULED' : '🔔 NEW BOOKING!';
  const headerSub    = isReschedule
    ? 'A customer just moved their appointment.'
    : 'Another job just dropped on your calendar.';

  // Tel / SMS / Maps / Admin links
  const telLink  = b.phone ? `tel:${stripPhone(b.phone)}`      : '';
  const smsLink  = b.phone ? `sms:${stripPhone(b.phone)}`      : '';
  const mapsLink = b.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`
    : '';
  const adminLink = `${siteUrl}/admin`;

  const row = (label, value) => value
    ? `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:130px;vertical-align:top;">${label}</td><td style="padding:8px 0;color:#0f172a;font-size:15px;font-weight:600;">${esc(value)}</td></tr>`
    : '';

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,0.06);">
        <tr><td style="background:${isReschedule ? '#b45309' : '#10b981'};padding:24px 32px;color:#fff;text-align:center;">
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">${headerLabel}</div>
          <div style="font-size:14px;opacity:0.9;margin-top:6px;">${headerSub}</div>
        </td></tr>
        ${revenue ? `<tr><td style="background:#eab308;padding:14px 32px;color:#0a1738;text-align:center;font-size:18px;font-weight:800;">💰 Estimated revenue: ${esc(revenue)}</td></tr>` : ''}
        <tr><td style="padding:24px 32px;color:#0f172a;">
          <p style="font-size:15px;line-height:1.5;margin:0 0 16px;color:#475569;">Here are the details — tap any button below for one-tap actions:</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin-bottom:20px;">
            ${row('Service',       b.service)}
            ${row('Date',          prettyDate)}
            ${row('Time',          prettyTime + ' (approx. 2 hr)')}
            ${row('Customer',      b.name)}
            ${row('Phone',         b.phone)}
            ${row('Email',         b.email)}
            ${row('Address',       b.address)}
            ${row('Windows',       b.windowCount)}
            ${row('Gate code',     b.gateCode)}
            ${row('Pets on site',  b.pets)}
            ${row('Coupon',        b.coupon)}
            ${row('Notes',         b.notes)}
          </table>

          <!-- Quick-action buttons (2x2 grid) -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;">
            <tr>
              ${telLink ? `<td width="50%" style="padding:4px;" align="center">
                <a href="${telLink}" style="display:block;background:#10b981;color:#fff;padding:14px 12px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;text-align:center;">📞 Call ${esc(b.name.split(' ')[0] || 'customer')}</a>
              </td>` : ''}
              ${smsLink ? `<td width="50%" style="padding:4px;" align="center">
                <a href="${smsLink}" style="display:block;background:#3b82f6;color:#fff;padding:14px 12px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;text-align:center;">💬 Text them</a>
              </td>` : ''}
            </tr>
            <tr>
              ${mapsLink ? `<td width="50%" style="padding:4px;" align="center">
                <a href="${mapsLink}" style="display:block;background:#0a1738;color:#fff;padding:14px 12px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;text-align:center;">📍 Directions</a>
              </td>` : ''}
              <td width="50%" style="padding:4px;" align="center">
                <a href="${adminLink}" style="display:block;background:#eab308;color:#0a1738;padding:14px 12px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;text-align:center;">🗂️ Admin dashboard</a>
              </td>
            </tr>
          </table>

          ${eventLink ? `<p style="font-size:13px;color:#64748b;text-align:center;margin:14px 0 0;"><a href="${eventLink}" style="color:#3b82f6;text-decoration:none;">View this event on Google Calendar →</a></p>` : ''}
        </td></tr>
        <tr><td style="background:#f8fafc;padding:16px 32px;text-align:center;color:#64748b;font-size:12px;">
          ShinePro Exterior Care · Owner notification · shineproexterior.com
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const textLines = [
    headerLabel,
    headerSub,
    '',
    revenue ? `Estimated revenue: ${revenue}` : '',
    '',
    `Service:   ${b.service}`,
    `Date:      ${prettyDate}`,
    `Time:      ${prettyTime} (approx. 2 hr)`,
    `Customer:  ${b.name}`,
    b.phone       ? `Phone:     ${b.phone}` : '',
    b.email       ? `Email:     ${b.email}` : '',
    b.address     ? `Address:   ${b.address}` : '',
    b.windowCount ? `Windows:   ${b.windowCount}` : '',
    b.gateCode    ? `Gate:      ${b.gateCode}` : '',
    b.pets        ? `Pets:      ${b.pets}` : '',
    b.coupon      ? `Coupon:    ${b.coupon}` : '',
    b.notes       ? `Notes:     ${b.notes}` : '',
    '',
    telLink  ? `Call:       ${telLink}`  : '',
    smsLink  ? `Text:       ${smsLink}`  : '',
    mapsLink ? `Directions: ${mapsLink}` : '',
    `Admin:      ${adminLink}`,
    eventLink ? `Calendar:   ${eventLink}` : ''
  ].filter(Boolean);

  return { html, text: textLines.join('\n') };
}

// Keep revenue guess in sync with the public instant-quote anchors.
// We only show it for window-cleaning services where # of windows is known.
function estimateRevenue(service, windowCount) {
  if (!service) return '';
  const svc = String(service).toLowerCase();
  const isWindowJob = svc.includes('window');
  const n = parseInt(windowCount, 10);
  if (!isWindowJob || !n || isNaN(n)) return '';
  if (n < 10) return '$125 min';
  if (n >= 50) return '$500+';
  const anchors = [
    [10, 125, 125],
    [20, 175, 175],
    [30, 250, 275],
    [40, 350, 400],
    [50, 450, 500]
  ];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [a, aLo, aHi] = anchors[i];
    const [b, bLo, bHi] = anchors[i + 1];
    if (n >= a && n <= b) {
      const t = (n - a) / (b - a);
      const lo = Math.round(aLo + (bLo - aLo) * t);
      const hi = Math.round(aHi + (bHi - aHi) * t);
      return lo === hi ? `$${lo}` : `$${lo}–$${hi}`;
    }
  }
  return '';
}

function stripPhone(p) {
  return String(p || '').replace(/[^\d+]/g, '');
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
    // Resend test-mode gotcha (historical): when sending via
    // onboarding@resend.dev (no domain verified), you could only send
    // to the email on your Resend account. Any OTHER recipient — TO
    // *or* CC — triggered a 403. We gated the CC-to-Tyson on a
    // `RESEND_DOMAIN_VERIFIED` env var so the gate flips to on the
    // moment the custom domain is verified.
    //
    // As of 2026-04-22 `shineproexterior.com` IS verified on Resend,
    // so once Malachi sets RESEND_DOMAIN_VERIFIED=true in Vercel and
    // redeploys, Tyson will be CC'd on every booking confirmation
    // automatically (running email paper trail).
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
          ShinePro Exterior Care · Central Florida · ${OWNER_PHONE}<br>
          Sent because you booked a cleaning at shineproexterior.com.
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
