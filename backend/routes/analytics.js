const router = require('express').Router();
const pool   = require('../db');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  try {
    const [daily, byInterest, byBusiness, byAgent] = await Promise.all([
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as calls,
          COUNT(*) FILTER(WHERE meeting_booked=true) as meetings,
          COUNT(*) FILTER(WHERE interest_level='high') as high_interest
        FROM leads WHERE tenant_id=$1 AND created_at>=NOW()-INTERVAL '${days} days'
        GROUP BY DATE(created_at) ORDER BY date ASC`, [req.tenantId]),
      pool.query('SELECT interest_level, COUNT(*) as count FROM leads WHERE tenant_id=$1 GROUP BY interest_level', [req.tenantId]),
      pool.query(`SELECT business_type, COUNT(*) as count FROM leads WHERE tenant_id=$1 AND business_type IS NOT NULL
        GROUP BY business_type ORDER BY count DESC LIMIT 8`, [req.tenantId]),
      pool.query(`SELECT a.name as agent_name, COUNT(l.*) as calls, COUNT(l.*) FILTER(WHERE l.meeting_booked=true) as meetings
        FROM agents a LEFT JOIN leads l ON l.agent_id=a.id AND l.tenant_id=$1
        WHERE a.tenant_id=$1 GROUP BY a.id, a.name`, [req.tenantId]),
    ]);
    res.json({ daily: daily.rows, byInterest: byInterest.rows, byBusiness: byBusiness.rows, byAgent: byAgent.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
