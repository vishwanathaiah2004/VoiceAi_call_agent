// routes/meetings.js
const meetRouter = require('express').Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');
const { bookMeeting } = require('../services/calendarService');

meetRouter.get('/', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, a.name as agent_name FROM leads l LEFT JOIN agents a ON a.id=l.agent_id
       WHERE l.tenant_id=$1 AND l.meeting_booked=true ORDER BY l.meeting_time ASC`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

meetRouter.post('/', auth, async (req, res) => {
  const { leadId, leadName, leadEmail, meetingTime, businessType, agentId } = req.body;
  if (!leadEmail || !meetingTime || !leadName || !agentId)
    return res.status(400).json({ error: 'leadName, leadEmail, meetingTime, agentId required' });
  try {
    const { rows } = await pool.query('SELECT * FROM agents WHERE id=$1 AND tenant_id=$2', [agentId, req.tenantId]);
    if (!rows[0]) return res.status(404).json({ error: 'Agent not found' });

    const event = await bookMeeting({ agent: rows[0], leadName, leadEmail, meetingTime, businessType, leadId });
    if (leadId) {
      await pool.query(
        'UPDATE leads SET meeting_booked=true, meeting_time=$1, calendar_event_id=$2, calendar_event_link=$3 WHERE id=$4 AND tenant_id=$5',
        [event.startTime, event.eventId, event.eventLink, leadId, req.tenantId]
      );
    }
    res.json({ success: true, event });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = meetRouter;
