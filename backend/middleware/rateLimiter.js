const rateLimit = require('express-rate-limit');

const api   = rateLimit({ windowMs: 60000,       max: 100, message: { error: 'Too many requests' } });
const login = rateLimit({ windowMs: 15*60000,    max: 10,  message: { error: 'Too many login attempts' } });
const calls = rateLimit({ windowMs: 60*60000,    max: 50,  message: { error: 'Call rate limit reached' } });
const signup= rateLimit({ windowMs: 60*60000,    max: 5,   message: { error: 'Too many signups from this IP' } });

module.exports = { api, login, calls, signup };
