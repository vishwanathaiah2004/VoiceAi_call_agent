/**
 * routes/superadmin.js
 * Only YOU (platform owner) can access these routes.
 * See all tenants, manage plans, view platform-wide stats.
 */
const router = require('express').Router();
const pool   = require('../db');
const { superAdmin } = require('../middleware/auth');

// All routes require superadmin role
router.use(superAdmin);

// GET /api/superadmin/stats — platform-wide numbers
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM tenants)                                AS "totalTenants",
        (SELECT COUNT(*) FROM tenants WHERE plan_status='active')     AS "activeTenants",
        (SELECT COUNT(*) FROM tenants WHERE plan='trial')             AS "trialTenants",
        (SELECT COUNT(*) FROM users WHERE role != 'superadmin')       AS "totalUsers",
        (SELECT COUNT(*) FROM leads)                                  AS "totalLeads",
        (SELECT COUNT(*) FROM leads WHERE meeting_booked=true)        AS "totalMeetings",
        (SELECT COUNT(*) FROM leads WHERE created_at>=CURRENT_DATE)   AS "callsToday",
        (SELECT SUM(calls_used) FROM tenants)                         AS "totalCallsMade"
    `);
    const r = rows[0];
    res.json({
      totalTenants:  +r.totalTenants,
      activeTenants: +r.activeTenants,
      trialTenants:  +r.trialTenants,
      totalUsers:    +r.totalUsers,
      totalLeads:    +r.totalLeads,
      totalMeetings: +r.totalMeetings,
      callsToday:    +r.callsToday,
      totalCallsMade:+r.totalCallsMade || 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/superadmin/tenants — list all tenants
router.get('/tenants', async (req, res) => {
  try {
    const { search, plan, status } = req.query;
    const conds = ['1=1']; const vals = [];
    if (search){ vals.push(`%${search}%`); conds.push(`(t.company_name ILIKE $${vals.length} OR t.slug ILIKE $${vals.length})`); }
    if (plan)  { vals.push(plan);   conds.push(`t.plan=$${vals.length}`); }
    if (status){ vals.push(status); conds.push(`t.plan_status=$${vals.length}`); }

    const { rows } = await pool.query(`
      SELECT t.*,
        COUNT(DISTINCT u.id)  AS user_count,
        COUNT(DISTINCT l.id)  AS lead_count,
        COUNT(DISTINCT a.id)  AS agent_count
      FROM tenants t
      LEFT JOIN users  u ON u.tenant_id=t.id AND u.role!='superadmin'
      LEFT JOIN leads  l ON l.tenant_id=t.id
      LEFT JOIN agents a ON a.tenant_id=t.id
      WHERE ${conds.join(' AND ')}
      GROUP BY t.id ORDER BY t.created_at DESC`, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/superadmin/tenants/:id — single tenant detail
router.get('/tenants/:id', async (req, res) => {
  try {
    const [tenant, agents, users, recentLeads] = await Promise.all([
      pool.query('SELECT * FROM tenants WHERE id=$1', [req.params.id]),
      pool.query('SELECT * FROM agents WHERE tenant_id=$1', [req.params.id]),
      pool.query('SELECT id,name,email,role,is_active,last_login FROM users WHERE tenant_id=$1', [req.params.id]),
      pool.query('SELECT * FROM leads WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 10', [req.params.id]),
    ]);
    if (!tenant.rows[0]) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ tenant: tenant.rows[0], agents: agents.rows, users: users.rows, recentLeads: recentLeads.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/superadmin/tenants/:id — update plan/status
router.patch('/tenants/:id', async (req, res) => {
  const { plan, plan_status, calls_limit } = req.body;
  try {
    const fields=[]; const vals=[req.params.id];
    const LIMITS = { trial:50, starter:500, pro:2000, enterprise:10000 };
    if (plan){ vals.push(plan); fields.push(`plan=$${vals.length}`);
      if (!calls_limit){ vals.push(LIMITS[plan]||50); fields.push(`calls_limit=$${vals.length}`); } }
    if (plan_status){ vals.push(plan_status); fields.push(`plan_status=$${vals.length}`); }
    if (calls_limit){ vals.push(+calls_limit); fields.push(`calls_limit=$${vals.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    const { rows } = await pool.query(`UPDATE tenants SET ${fields.join(',')} WHERE id=$1 RETURNING *`, vals);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/superadmin/tenants/:id — suspend tenant
router.delete('/tenants/:id', async (req, res) => {
  try {
    await pool.query("UPDATE tenants SET plan_status='suspended' WHERE id=$1", [req.params.id]);
    res.json({ success:true, message:'Tenant suspended' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/superadmin/growth — signups over time
router.get('/growth', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as signups
      FROM tenants WHERE created_at>=NOW()-INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date ASC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
