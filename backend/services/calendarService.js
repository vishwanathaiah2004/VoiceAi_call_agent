/**
 * services/calendarService.js
 * Each tenant can use their OWN Google Calendar credentials.
 * Falls back to platform-level credentials if tenant hasn't set theirs up.
 */
const { google } = require('googleapis');
const logger = require('../config/logger');

function getClient(agent) {
  // Use tenant's own credentials if available, else platform defaults
  const clientId     = agent.google_client_id     || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = agent.google_client_secret || process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = agent.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

  if (!refreshToken) throw new Error('Google Calendar not configured. Please set up calendar integration in Agent Settings.');

  const auth = new google.auth.OAuth2(clientId, clientSecret, process.env.GOOGLE_REDIRECT_URI);
  auth.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: 'v3', auth });
}

async function bookMeeting({ agent, leadName, leadEmail, meetingTime, businessType, leadId }) {
  const calendar = getClient(agent);
  const start    = new Date(meetingTime);
  const end      = new Date(start.getTime() + 30 * 60000);

  const event = {
    summary: `Demo — ${leadName} (${businessType || 'Lead'})`,
    description: `Meeting booked by ${agent.name} AI from ${agent.company_name}.\n\nLead: ${leadName}\nEmail: ${leadEmail}\nBusiness: ${businessType || 'N/A'}`,
    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
    end:   { dateTime: end.toISOString(),   timeZone: 'UTC' },
    attendees: [
      { email: leadEmail, displayName: leadName },
      ...(agent.sales_email ? [{ email: agent.sales_email, displayName: agent.company_name }] : []),
    ],
    reminders: { useDefault: false, overrides: [{ method:'email', minutes:24*60 }, { method:'popup', minutes:15 }] },
    conferenceData: { createRequest: { requestId: `demo-${Date.now()}`, conferenceSolutionKey: { type:'hangoutsMeet' } } },
  };

  const resp = await calendar.events.insert({
    calendarId: 'primary', resource: event, sendUpdates: 'all', conferenceDataVersion: 1,
  });

  logger.info('Meeting booked', { tenantId: agent.tenant_id, leadEmail });
  return {
    eventId: resp.data.id, eventLink: resp.data.htmlLink,
    meetLink: resp.data.conferenceData?.entryPoints?.[0]?.uri || null,
    startTime: resp.data.start.dateTime,
  };
}

module.exports = { bookMeeting };
