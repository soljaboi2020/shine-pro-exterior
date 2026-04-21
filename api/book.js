// =====================================================================
// POST /api/book  — STUB
// =====================================================================
// This is a placeholder. It accepts a booking payload from the website,
// logs it, and replies with success. In the next build phase we'll replace
// the body of this function with real Google Calendar + email wiring.
//
// What the final version will do (next session):
//   1. Validate the payload.
//   2. Call the Google Calendar API to insert an event in Tyson's
//      "Shine Pro Jobs" calendar with address, phone, notes, gate code.
//   3. Send a confirmation email to the customer via Resend.
//   4. (Optional) Schedule a 24-hour SMS reminder via Twilio.
//   5. Return { ok: true, eventId }.
//
// For now: accept + log + echo success, so the booking modal on the
// frontend can run end-to-end in preview.
// =====================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Minimal validation
    const required = ['service', 'preferredDate', 'preferredTime', 'name', 'phone', 'email', 'address'];
    for (const field of required) {
      if (!body?.[field]) return res.status(400).json({ error: `Missing field: ${field}` });
    }

    // TODO: replace this with Google Calendar + email integration
    console.log('[ShinePro] New booking request:', {
      ...body,
      receivedAt: new Date().toISOString()
    });

    return res.status(200).json({
      ok: true,
      message: 'Booking request received. Tyson will text to confirm.',
      stub: true
    });
  } catch (err) {
    console.error('[ShinePro] /api/book error:', err);
    return res.status(500).json({ error: 'Something went wrong on our end. Please text Tyson at (407) 754-5565.' });
  }
}
