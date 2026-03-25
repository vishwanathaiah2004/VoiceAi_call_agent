// ── routes/leads.js ──────────────────────────────────────────────────────────
const leadsRouter = require('express').Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

leadsRouter.get('/stats', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                             AS "totalLeads",
        COUNT(*) FILTER (WHERE meeting_booked=true)          AS "meetingsBooked",
        COUNT(*) FILTER (WHERE interest_level='high')        AS "highInterest",
        COUNT(*) FILTER (WHERE created_at>=CURRENT_DATE)     AS "callsToday",
        COUNT(*) FILTER (WHERE created_at>=NOW()-INTERVAL '7 days') AS "callsThisWeek",
        COUNT(*) FILTER (WHERE call_status='completed')      AS "completedCalls",
        ROUND(100.0*COUNT(*) FILTER(WHERE meeting_booked=true)/NULLIF(COUNT(*) FILTER(WHERE call_status='completed'),0),1) AS "conversionRate"
      FROM leads WHERE tenant_id=$1`, [req.tenantId]);
    const r = rows[0];
    res.json({
      totalLeads: +r.totalLeads, meetingsBooked: +r.meetingsBooked,
      highInterest: +r.highInterest, callsToday: +r.callsToday,
      callsThisWeek: +r.callsThisWeek, completedCalls: +r.completedCalls,
      conversionRate: parseFloat(r.conversionRate)||0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

leadsRouter.get('/', auth, async (req, res) => {
  try {
    const { search, interest_level, meeting_booked, agent_id, limit=50, offset=0 } = req.query;
    const conds = ['l.tenant_id=$1']; const vals = [req.tenantId];
    if (search) { vals.push(`%${search}%`); const n=vals.length; conds.push(`(l.name ILIKE $${n} OR l.email ILIKE $${n} OR l.phone ILIKE $${n})`); }
    if (interest_level) { vals.push(interest_level); conds.push(`l.interest_level=$${vals.length}`); }
    if (meeting_booked !== undefined) { vals.push(meeting_booked==='true'); conds.push(`l.meeting_booked=$${vals.length}`); }
    if (agent_id) { vals.push(agent_id); conds.push(`l.agent_id=$${vals.length}`); }
    const where = conds.join(' AND ');
    const count = await pool.query(`SELECT COUNT(*) FROM leads l WHERE ${where}`, vals);
    const { rows } = await pool.query(
      `SELECT l.*, a.name as agent_name FROM leads l LEFT JOIN agents a ON a.id=l.agent_id
       WHERE ${where} ORDER BY l.created_at DESC LIMIT $${vals.length+1} OFFSET $${vals.length+2}`,
      [...vals, +limit, +offset]
    );
    res.json({ leads: rows, total: +count.rows[0].count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

leadsRouter.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leads WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

leadsRouter.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM leads WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = leadsRouter;
