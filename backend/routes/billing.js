// ── routes/billing.js ────────────────────────────────────────────────────────
const billingRouter = require('express').Router();
const pool = require('../db');
const { auth, tenantAdmin } = require('../middleware/auth');

const PLANS = {
  trial:      { name: 'Trial',      calls: 50,    price: 0 },
  starter:    { name: 'Starter',    calls: 500,   price: 49 },
  pro:        { name: 'Pro',        calls: 2000,  price: 149 },
  enterprise: { name: 'Enterprise', calls: 10000, price: 499 },
};

billingRouter.get('/plans', (req, res) => res.json(PLANS));

billingRouter.get('/usage', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT plan, plan_status, calls_used, calls_limit, trial_ends_at FROM tenants WHERE id=$1',
      [req.tenantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Tenant not found' });
    const t = rows[0];
    res.json({
      plan: t.plan, planStatus: t.plan_status,
      callsUsed: t.calls_used, callsLimit: t.calls_limit,
      usagePercent: Math.round((t.calls_used / t.calls_limit) * 100),
      trialEndsAt: t.trial_ends_at,
      planDetails: PLANS[t.plan],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upgrade plan (in production, integrate Stripe here)
billingRouter.post('/upgrade', auth, tenantAdmin, async (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  try {
    await pool.query(
      'UPDATE tenants SET plan=$1, calls_limit=$2, plan_status=$3 WHERE id=$4',
      [plan, PLANS[plan].calls, 'active', req.tenantId]
    );
    res.json({ success: true, plan, callsLimit: PLANS[plan].calls });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = billingRouter;


// ── routes/tenants.js ─────────────────────────────────────────────────────────
const tenantsRouter = require('express').Router();
const bcrypt = require('bcryptjs');

tenantsRouter.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tenants WHERE id=$1', [req.tenantId]);
    if (!rows[0]) return res.status(404).json({ error: 'Tenant not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

tenantsRouter.put('/me', auth, tenantAdmin, async (req, res) => {
  const { company_name, industry, website, logo_url } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE tenants SET company_name=$1, industry=$2, website=$3, logo_url=$4 WHERE id=$5 RETURNING *',
      [company_name, industry||null, website||null, logo_url||null, req.tenantId]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get team members
tenantsRouter.get('/team', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,email,role,is_active,last_login,created_at FROM users WHERE tenant_id=$1 ORDER BY created_at',
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Invite team member
tenantsRouter.post('/team', auth, tenantAdmin, async (req, res) => {
  const { name, email, password, role='agent' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
  try {
    const { rows: exists } = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.length) return res.status(400).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (tenant_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role',
      [req.tenantId, name, email.toLowerCase(), hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

tenantsRouter.patch('/team/:id', auth, tenantAdmin, async (req, res) => {
  const { is_active, role } = req.body;
  try {
    const fields = []; const vals = [req.params.id, req.tenantId];
    if (is_active !== undefined) { vals.push(is_active); fields.push(`is_active=$${vals.length}`); }
    if (role) { vals.push(role); fields.push(`role=$${vals.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    await pool.query(`UPDATE users SET ${fields.join(',')} WHERE id=$1 AND tenant_id=$2`, vals);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Need to export with auth reference
const { auth: authFn, tenantAdmin: tadminFn } = require('../middleware/auth');

module.exports = tenantsRouter;
