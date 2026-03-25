// ── routes/calls.js ──────────────────────────────────────────────────────────
const router  = require('express').Router();
const pool    = require('../db');
const { auth } = require('../middleware/auth');
const { calls: callLimiter } = require('../middleware/rateLimiter');
const { initiateCall } = require('../services/vapiService');
const { parse }  = require('csv-parse/sync');
const multer     = require('multer');
const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024 } });
const logger     = require('../config/logger');

async function getActiveAgent(tenantId, agentId) {
  const { rows } = await pool.query(
    'SELECT * FROM agents WHERE tenant_id=$1 AND id=$2 AND is_active=true',
    [tenantId, agentId]
  );
  return rows[0];
}

async function checkCallLimit(tenantId) {
  const { rows } = await pool.query('SELECT calls_used, calls_limit, plan_status FROM tenants WHERE id=$1', [tenantId]);
  const t = rows[0];
  if (!t) throw new Error('Tenant not found');
  if (t.plan_status === 'suspended') throw new Error('Account suspended. Please contact support.');
  if (t.calls_used >= t.calls_limit) throw new Error(`Call limit reached (${t.calls_limit} calls). Please upgrade your plan.`);
  return t;
}

async function createAndCall(phone, name, email, agentId, tenantId, userId) {
  const agent = await getActiveAgent(tenantId, agentId);
  if (!agent) throw new Error('Agent not found or inactive');

  await checkCallLimit(tenantId);

  // Create lead record
  const { rows: [lead] } = await pool.query(
    `INSERT INTO leads (tenant_id, agent_id, phone, name, email, call_status, created_by)
     VALUES ($1,$2,$3,$4,$5,'initiated',$6) RETURNING *`,
    [tenantId, agentId, phone, name||null, email||null, userId]
  );

  // Initiate Vapi call
  const call = await initiateCall(phone, lead.id, agent);
  await pool.query('UPDATE leads SET vapi_call_id=$1, call_status=$2 WHERE id=$3', [call.id, 'calling', lead.id]);
  await pool.query('UPDATE tenants SET calls_used=calls_used+1 WHERE id=$1', [tenantId]);

  return { leadId: lead.id, callId: call.id };
}

// POST /api/calls/single
router.post('/single', auth, callLimiter, async (req, res) => {
  const { phone, name, email, agentId } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) return res.status(400).json({ error: 'Use E.164 format: +12025551234' });
  if (!agentId) return res.status(400).json({ error: 'agentId required' });

  try {
    const result = await createAndCall(phone, name, email, agentId, req.tenantId, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Single call error', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

// POST /api/calls/bulk/csv
router.post('/bulk/csv', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });
  if (!req.body.agentId) return res.status(400).json({ error: 'agentId required' });

  try {
    const records = parse(req.file.buffer.toString(), { columns:true, skip_empty_lines:true, trim:true });
    if (records.length > 200) return res.status(400).json({ error: 'Max 200 leads per upload' });

    res.json({ success:true, message:`Processing ${records.length} leads...`, total: records.length });

    // Process async with 3s delay between calls
    for (const [i, row] of records.entries()) {
      const phone = (row.phone || row.Phone || '').trim();
      if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) continue;
      setTimeout(async () => {
        try {
          await createAndCall(phone, row.name||row.Name||null, row.email||row.Email||null,
            req.body.agentId, req.tenantId, req.user.id);
        } catch (err) { logger.error('Bulk call item failed', { phone, error: err.message }); }
      }, i * 3000);
    }
  } catch (err) { res.status(400).json({ error: 'Invalid CSV: ' + err.message }); }
});

module.exports = router;
