const router = require('express').Router();
const pool   = require('../db');
const bcrypt = require('bcryptjs');
const { auth, tenantAdmin } = require('../middleware/auth');

// GET /api/tenants/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tenants WHERE id=$1', [req.tenantId]);
    if (!rows[0]) return res.status(404).json({ error: 'Tenant not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/tenants/me
router.put('/me', auth, tenantAdmin, async (req, res) => {
  const { company_name, industry, website, logo_url } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE tenants SET company_name=$1,industry=$2,website=$3,logo_url=$4 WHERE id=$5 RETURNING *',
      [company_name, industry||null, website||null, logo_url||null, req.tenantId]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/tenants/team
router.get('/team', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,name,email,role,is_active,last_login,created_at FROM users WHERE tenant_id=$1 ORDER BY created_at',
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tenants/team
router.post('/team', auth, tenantAdmin, async (req, res) => {
  const { name, email, password, role='agent' } = req.body;
  if (!name||!email||!password) return res.status(400).json({ error: 'name, email, password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password min 8 chars' });
  try {
    const { rows: ex } = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (ex.length) return res.status(400).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (tenant_id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role',
      [req.tenantId, name.trim(), email.toLowerCase().trim(), hash, role]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tenants/team/:id
router.patch('/team/:id', auth, tenantAdmin, async (req, res) => {
  const { is_active, role } = req.body;
  try {
    const fields=[]; const vals=[req.params.id, req.tenantId];
    if (is_active!==undefined){ vals.push(is_active); fields.push(`is_active=$${vals.length}`); }
    if (role){ vals.push(role); fields.push(`role=$${vals.length}`); }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    await pool.query(`UPDATE users SET ${fields.join(',')} WHERE id=$1 AND tenant_id=$2`, vals);
    res.json({ success:true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
