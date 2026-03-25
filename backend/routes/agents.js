/**
 * routes/agents.js
 * Each tenant has an AI agent they can fully customize:
 * name, voice, greeting, script, qualifying questions, Vapi phone number
 */
const router = require('express').Router();
const pool   = require('../db');
const { auth, tenantAdmin } = require('../middleware/auth');

// GET /api/agents — get this tenant's agents
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM agents WHERE tenant_id=$1 ORDER BY created_at',
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/agents/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM agents WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/agents/:id — update agent config (tenant admin only)
router.put('/:id', auth, tenantAdmin, async (req, res) => {
  const {
    name, company_name, voice_id, voice_provider, language,
    greeting, objective, qualifying_questions, offer_text,
    calendar_pitch, fallback_message,
    vapi_phone_number_id, sales_email,
    google_calendar_enabled, google_refresh_token,
    google_client_id, google_client_secret,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE agents SET
        name=$1, company_name=$2, voice_id=$3, voice_provider=$4, language=$5,
        greeting=$6, objective=$7, qualifying_questions=$8, offer_text=$9,
        calendar_pitch=$10, fallback_message=$11,
        vapi_phone_number_id=$12, sales_email=$13,
        google_calendar_enabled=$14, google_refresh_token=$15,
        google_client_id=$16, google_client_secret=$17,
        vapi_assistant_id=NULL, updated_at=NOW()
       WHERE id=$18 AND tenant_id=$19
       RETURNING *`,
      [
        name, company_name, voice_id || 'jennifer', voice_provider || 'playht',
        language || 'en-US', greeting, objective, qualifying_questions,
        offer_text, calendar_pitch, fallback_message,
        vapi_phone_number_id || null, sales_email || null,
        google_calendar_enabled || false,
        google_refresh_token || null, google_client_id || null, google_client_secret || null,
        req.params.id, req.tenantId,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/agents — create additional agent
router.post('/', auth, tenantAdmin, async (req, res) => {
  const { name, company_name, greeting, objective, qualifying_questions,
    offer_text, calendar_pitch, fallback_message } = req.body;

  if (!name || !company_name || !greeting || !objective)
    return res.status(400).json({ error: 'name, company_name, greeting, objective required' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO agents (tenant_id, name, company_name, greeting, objective,
        qualifying_questions, offer_text, calendar_pitch, fallback_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.tenantId, name, company_name, greeting, objective,
       qualifying_questions || '', offer_text || '', calendar_pitch || '', fallback_message || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
