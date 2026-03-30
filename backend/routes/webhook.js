/**
 * routes/webhook.js
 * Vapi sends call events here. We use metadata.tenantId + metadata.leadId
 * to scope all operations correctly per tenant.
 */
const router = require('express').Router();
const pool   = require('../db');
const { analyzeTranscript } = require('../services/geminiService');
const { bookMeeting }       = require('../services/calendarService');
const logger = require('../config/logger');

router.post('/', async (req, res) => {
   console.log("🔥 WEBHOOK HIT");
  console.log("🔥 BODY:", JSON.stringify(req.body, null, 2));
  // Verify webhook secret
  if (process.env.VAPI_WEBHOOK_SECRET &&
      req.headers['x-vapi-secret'] !== process.env.VAPI_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({ received: true }); // Always respond immediately

  const event = req.body;
  // const type  = event.message?.type || event.type;
  const type =event.message?.type || event.type || event.event ||'';

  try {
    // ── call-started ────────────────────────────────────────────
    if (type === 'call-started') {
      const callId = event.message?.call?.id || event.call?.id;
      if (callId) {
        await pool.query("UPDATE leads SET call_status='in-progress' WHERE vapi_call_id=$1", [callId]);
        logger.info('Call started', { callId });
      }
    }

    // ── end-of-call-report ──────────────────────────────────────
    if (type === 'end-of-call-report' || type === 'call-ended') {
      const call       = event.message?.call || event.call || {};
      const callId     = call.id;
      // const transcript = event.message?.transcript || event.transcript || '';
      // const transcript =event.message?.analysis?.transcript ||event.message?.transcript?.text ||event.transcript ||'';
      const transcript = event.message?.transcript || event.transcript ||event.message?.analysis?.transcript ||'';
      const recUrl     = call.recordingUrl || null;
      const duration   = call.endedAt && call.startedAt
        ? Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) : null;

      if (!callId) return;

      // Find lead + agent (scoped lookup - no tenant_id needed since callId is unique)
     const { rows } = await pool.query(
  `SELECT 
      l.id as lead_id,
      l.*,
      a.id as agent_id,
      a.name as agent_name,
      a.google_refresh_token,
      a.google_client_id,
      a.google_client_secret,
      a.sales_email,
      a.company_name as agent_company,
      a.google_calendar_enabled
   FROM leads l
   JOIN agents a ON a.id = l.agent_id
   WHERE l.vapi_call_id=$1`,
  [callId]
);

      if (!rows[0]) { logger.warn('No lead for callId', { callId }); return; }

      const lead  = rows[0];
      const agent = {
        id: lead.agent_id, tenant_id: lead.tenant_id,
        name: lead.agent_name, company_name: lead.agent_company,
        google_refresh_token: lead.google_refresh_token,
        google_client_id: lead.google_client_id,
        google_client_secret: lead.google_client_secret,
        sales_email: lead.sales_email,
        google_calendar_enabled: lead.google_calendar_enabled,
      };

    const safeTranscript = transcript || 'No conversation captured';

let a = {
  name: null,
  email: null,
  business_type: null,
  interest_level: 'none',
  meeting_booked: false,
  meeting_time_requested: null,
  summary: null
};

if (transcript) {
  try {
    a = await analyzeTranscript(transcript);
    console.log("🧠 AI OUTPUT:", a);
  } catch (err) {
    console.error("AI ERROR:", err.message);
  }
}
console.log("📞 TRANSCRIPT:", transcript);
// ✅ ALWAYS update
const result = await pool.query(`
  UPDATE leads SET
    transcript = $1,
    recording_url = $2,
    call_duration_seconds = $3,
    call_status = 'completed',
    name = COALESCE($4::text, name),
    email = COALESCE($5::text, email),
    business_type = COALESCE($6::text, business_type),
    interest_level = COALESCE($7::text, interest_level),
    meeting_booked = COALESCE($8::boolean, meeting_booked),
    meeting_time = COALESCE($9::timestamp, meeting_time),
    call_summary = $10::text
  WHERE id = $11
`, [
  safeTranscript,
  recUrl,
  duration,
  a.name || null,
  a.email || null,
  a.business_type || null,
  a.interest_level || 'none',
  a.meeting_booked ?? false,
  a.meeting_time_requested || null,
  a.summary || null,
  lead.lead_id   
]);
console.log("✅ ROWS UPDATED:", result.rowCount);

// ✅ KEEP calendar booking
if (
  agent.google_calendar_enabled &&
  a.meeting_booked &&
  a.email &&
  a.name &&
  a.meeting_time_requested
) {
  try {
    const evt = await bookMeeting({
      agent,
      leadName: a.name,
      leadEmail: a.email,
      meetingTime: a.meeting_time_requested,
      businessType: a.business_type,
      leadId: lead.id,
    });

    await pool.query(
      'UPDATE leads SET calendar_event_id=$1, calendar_event_link=$2 WHERE id=$3',
      [evt.eventId, evt.eventLink, lead.lead_id ]
    );

    logger.info('Meeting auto-booked', { leadId: lead.id });
  } catch (err) {
    logger.error('Auto-book failed', { error: err.message });
  }

      } else {
        await pool.query(
          "UPDATE leads SET call_status='completed', recording_url=$1, call_duration_seconds=$2 WHERE id=$3",
          [recUrl, duration, lead.lead_id ]
        );
      }

      logger.info('Call processed', { callId, leadId: lead.id, tenantId: lead.tenant_id });
    }
  } catch (err) {
    logger.error('Webhook error', { error: err.message, stack: err.stack });
  }
});

module.exports = router;
