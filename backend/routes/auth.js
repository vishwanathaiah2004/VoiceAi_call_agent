/**
 * routes/auth.js
 * Public signup (creates tenant + owner user in one step)
 * Login, me, change-password
 */
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { auth } = require('../middleware/auth');
const { login: loginLimiter, signup: signupLimiter } = require('../middleware/rateLimiter');
const logger  = require('../config/logger');

function token(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g,'-').replace(/^-|-$/g,'')
    + '-' + Math.random().toString(36).slice(2, 6);
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
// Creates: tenant + owner user in one transaction
router.post('/signup', signupLimiter, async (req, res) => {
  const { companyName, name, email, password, industry, website } = req.body;

  if (!companyName || !name || !email || !password)
    return res.status(400).json({ error: 'companyName, name, email, password required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check email taken
    const { rows: exists } = await client.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Email already registered' }); }

    // Create tenant
    const { rows: [tenant] } = await client.query(
      `INSERT INTO tenants (company_name, slug, plan, industry, website)
       VALUES ($1, $2, 'trial', $3, $4) RETURNING *`,
      [companyName.trim(), slug(companyName), industry || null, website || null]
    );

    // Create owner user
    const hash = await bcrypt.hash(password, 12);
    const { rows: [user] } = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'owner') RETURNING id, name, email, role, tenant_id`,
      [tenant.id, name.trim(), email.toLowerCase().trim(), hash]
    );

    // Create default agent for this tenant
    await client.query(
      `INSERT INTO agents (tenant_id, name, company_name, greeting, objective,
        qualifying_questions, offer_text, calendar_pitch, fallback_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenant.id,
        'Emma',
        companyName.trim(),
        `Hi! I'm Emma calling from ${companyName}. Hope I'm not catching you at a bad time?`,
        `Book demo calls for ${companyName}`,
        'What kind of business do you run?\nAre you currently using any automation tools?\nAre you open to improving your business with AI?',
        `We help businesses like yours with AI automation. Would you be open to a quick 20-minute demo?`,
        `I just need your name and email to send you a calendar invite. Which works better — tomorrow at 2 PM or Thursday at 4 PM?`,
        `No problem at all! Thanks so much for your time. Have a wonderful day!`,
      ]
    );

    await client.query('COMMIT');

    const tk = token({ id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id });
    logger.info('New tenant signed up', { tenantId: tenant.id, email });

    res.status(201).json({
      token: tk,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: tenant.id, companyName: tenant.company_name, slug: tenant.slug, plan: tenant.plan, trialEndsAt: tenant.trial_ends_at },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ error: 'Signup failed: ' + err.message });
  } finally { client.release(); }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { rows } = await pool.query(
      `SELECT u.*, t.company_name, t.slug, t.plan, t.plan_status, t.calls_used, t.calls_limit, t.trial_ends_at
       FROM users u
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND u.is_active = true LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' });

    await pool.query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    const tk = token({
      id: user.id, email: user.email, name: user.name,
      role: user.role, tenantId: user.tenant_id,
    });

    logger.info('Login', { userId: user.id, role: user.role });

    res.json({
      token: tk,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: user.tenant_id ? {
        id: user.tenant_id, companyName: user.company_name, slug: user.slug,
        plan: user.plan, planStatus: user.plan_status,
        callsUsed: user.calls_used, callsLimit: user.calls_limit,
        trialEndsAt: user.trial_ends_at,
      } : null,
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              t.id as tenant_id, t.company_name, t.slug, t.plan, t.plan_status,
              t.calls_used, t.calls_limit, t.trial_ends_at
       FROM users u LEFT JOIN tenants t ON t.id=u.tenant_id WHERE u.id=$1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/auth/password ────────────────────────────────────────────────────
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Valid passwords required (min 8 chars)' });
  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!(await bcrypt.compare(currentPassword, rows[0].password_hash)))
      return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
