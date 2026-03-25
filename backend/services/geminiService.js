// ── services/geminiService.js ────────────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

async function analyzeTranscript(transcript) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(`
Analyze this sales call transcript. Return ONLY valid JSON, no markdown.
Transcript: """${transcript}"""
Return: {
  "name": "lead full name or null",
  "email": "lead email or null",
  "business_type": "their business or null",
  "interest_level": "high|medium|low|none",
  "meeting_booked": true or false,
  "meeting_time_requested": "ISO datetime or null",
  "summary": "2 sentence outcome",
  "next_action": "recommended action",
  "sentiment": "positive|neutral|negative"
}`);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    logger.error('Gemini failed', { error: err.message });
    return { name:null, email:null, business_type:null, interest_level:'low',
      meeting_booked:false, meeting_time_requested:null,
      summary:'Analysis failed.', next_action:'Manual review', sentiment:'neutral' };
  }
}

module.exports = { analyzeTranscript };
