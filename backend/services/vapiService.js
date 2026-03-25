/**
 * services/vapiService.js
 * Builds dynamic Vapi calls from each tenant's agent config.
 * Every client gets their own agent name, company, script, and phone number.
 */
const axios  = require('axios');
const logger = require('../config/logger');

const BASE = 'https://api.vapi.ai';
const H    = () => ({ Authorization: `Bearer ${process.env.VAPI_API_KEY}`, 'Content-Type': 'application/json' });

/**
 * Builds the system prompt from agent config stored in DB.
 * This is the key function — each client gets a fully custom agent.
 */
function buildPrompt(agent) {
  const questions = agent.qualifying_questions
    .split('\n').filter(Boolean)
    .map((q, i) => `${i + 1}. ${q.trim()}`).join('\n');

  return `You are ${agent.name}, an AI sales representative from ${agent.company_name}.

YOUR MISSION:
${agent.objective}

CONVERSATION FLOW — follow this order exactly:
1. GREETING: "${agent.greeting}"
2. If they respond positively, ask your qualifying questions ONE AT A TIME:
${questions}
3. Based on their answers, determine interest level.
4. If they seem interested: "${agent.offer_text}"
5. If they agree to a meeting: "${agent.calendar_pitch}"
   - Collect their FULL NAME (repeat back to confirm)
   - Collect their EMAIL (spell it back letter by letter to confirm)
   - Offer two specific time slots and confirm their choice
6. If not interested: "${agent.fallback_message}"

RULES:
- Speak naturally and warmly — sound like a real human, not a robot
- Keep every response SHORT — maximum 2 sentences
- Ask only ONE question at a time
- If they seem busy: "Of course! When would be a better time to reach you?"
- Never be pushy — one gentle follow-up maximum
- If asked if you're AI: be honest — "Yes, I'm an AI assistant, but there's a real team behind me who'd love to connect with you!"
- If they ask to be removed from the list: "Absolutely! I'll make a note of that. Sorry to interrupt your day. Goodbye!"`;
}

async function initiateCall(phoneNumber, leadId, agent) {
  try {
    const response = await axios.post(`${BASE}/call/phone`, {
      customer: { number: phoneNumber },

      // 🔥 force safe value for now
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,

      assistant: {
        name: agent.name || "AI Assistant",

        model: {
          provider: 'google',
          model: 'gemini-2.0-flash', // ✅ FIXED
          systemPrompt: buildPrompt(agent),
          temperature: 0.7,
        },

        voice: {
          provider: 'vapi',
          voiceId: 'Elliot',
        },

        serverUrl: `${process.env.BACKEND_URL}/api/webhook`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,

        metadata: {
          leadId,
          tenantId: agent.tenant_id,
          agentId: agent.id
        },

        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: 'office',

        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US'
        },
      }

    }, { headers: H() });

    const data = response.data;

    logger.info('Call initiated', {
      leadId,
      callId: data.id,
      phone: phoneNumber,
      agent: agent.name
    });

    return data;

  } catch (err) {
    console.log("❌ VAPI FULL ERROR:");
    console.log(err.response?.data || err.message); // 👈 THIS IS WHAT WE NEED
    throw err;
  }
}

async function getCall(callId) {
  const { data } = await axios.get(`${BASE}/call/${callId}`, { headers: H() });
  return data;
}

module.exports = { initiateCall, getCall, buildPrompt };
