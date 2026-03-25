require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const logger  = require('./config/logger');
const { api } = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', api);

// ── Request log ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', version: '1.0.0', ts: new Date() }));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/tenants',     require('./routes/tenants'));
app.use('/api/agents',      require('./routes/agents'));
app.use('/api/calls',       require('./routes/calls'));
app.use('/api/leads',       require('./routes/leads'));
app.use('/api/meetings',    require('./routes/meetings'));
app.use('/api/analytics',   require('./routes/analytics'));
app.use('/api/billing',     require('./routes/billing'));
app.use('/api/superadmin',  require('./routes/superadmin'));
app.use('/api/webhook',     require('./routes/webhook'));   // Vapi webhook (no auth)

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error', ...(process.env.NODE_ENV === 'development' && { message: err.message }) });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () =>
  logger.info(`🚀 VoiceAgent SaaS running on port ${PORT} [${process.env.NODE_ENV}]`)
);

['SIGTERM','SIGINT'].forEach(sig =>
  process.on(sig, () => server.close(() => { logger.info('Shutdown'); process.exit(0); }))
);

module.exports = app;
