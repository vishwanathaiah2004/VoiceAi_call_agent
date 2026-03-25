/**
 * migrate.js — Full multi-tenant schema
 * Run: npm run migrate
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db');
const bcrypt = require('bcryptjs');

const SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── TENANTS ─────────────────────────────────────────────────────
-- Each row = one business/client that signed up on your platform
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,        -- used in URLs
  plan            TEXT DEFAULT 'trial'
                  CHECK (plan IN ('trial','starter','pro','enterprise')),
  plan_status     TEXT DEFAULT 'active'
                  CHECK (plan_status IN ('active','suspended','cancelled')),
  trial_ends_at   TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  calls_used      INTEGER DEFAULT 0,
  calls_limit     INTEGER DEFAULT 50,          -- trial limit
  logo_url        TEXT,
  website         TEXT,
  industry        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- ── USERS ───────────────────────────────────────────────────────
-- Platform users — each belongs to a tenant (or is superadmin)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            TEXT DEFAULT 'agent'
                  CHECK (role IN ('superadmin','owner','admin','agent','viewer')),
  is_active       BOOLEAN DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── AGENTS ──────────────────────────────────────────────────────
-- Each tenant can have one or more AI agent configs
CREATE TABLE IF NOT EXISTS agents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                TEXT NOT NULL DEFAULT 'Emma',  -- agent's spoken name
  company_name        TEXT NOT NULL,                  -- "from [company]"
  voice_id            TEXT DEFAULT 'jennifer',        -- PlayHT voice
  voice_provider      TEXT DEFAULT 'playht',
  language            TEXT DEFAULT 'en-US',
  greeting            TEXT NOT NULL,
  objective           TEXT NOT NULL,                  -- what the agent sells/offers
  qualifying_questions TEXT NOT NULL,                 -- newline separated questions
  offer_text          TEXT NOT NULL,                  -- what to offer interested leads
  calendar_pitch      TEXT NOT NULL,                  -- how to pitch the meeting
  fallback_message    TEXT NOT NULL,                  -- if not interested
  vapi_phone_number_id TEXT,                          -- client's own Twilio/Vapi number
  vapi_assistant_id   TEXT,                           -- cached Vapi assistant ID
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_refresh_token TEXT,
  google_client_id    TEXT,
  google_client_secret TEXT,
  sales_email         TEXT,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);

-- ── LEADS ───────────────────────────────────────────────────────
-- All leads — scoped to tenant
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id              UUID REFERENCES agents(id) ON DELETE SET NULL,
  phone                 TEXT NOT NULL,
  name                  TEXT,
  email                 TEXT,
  business_type         TEXT,
  interest_level        TEXT DEFAULT 'unknown'
                        CHECK (interest_level IN ('high','medium','low','none','unknown')),
  meeting_booked        BOOLEAN DEFAULT false,
  meeting_time          TIMESTAMPTZ,
  calendar_event_id     TEXT,
  calendar_event_link   TEXT,
  transcript            TEXT,
  recording_url         TEXT,
  call_summary          TEXT,
  call_status           TEXT DEFAULT 'initiated'
                        CHECK (call_status IN ('initiated','calling','in-progress','completed','failed')),
  call_duration_seconds INTEGER,
  vapi_call_id          TEXT UNIQUE,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ
);

-- ── INDEXES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_tenant     ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent      ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_created    ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_interest   ON leads(interest_level);
CREATE INDEX IF NOT EXISTS idx_leads_meeting    ON leads(meeting_booked);
CREATE INDEX IF NOT EXISTS idx_leads_status     ON leads(call_status);
CREATE INDEX IF NOT EXISTS idx_leads_vapi       ON leads(vapi_call_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant     ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_agents_tenant    ON agents(tenant_id);

-- ── TRIGGERS ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated   ON leads;
DROP TRIGGER IF EXISTS trg_tenants_updated ON tenants;
DROP TRIGGER IF EXISTS trg_agents_updated  ON agents;

CREATE TRIGGER trg_leads_updated   BEFORE UPDATE ON leads   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agents_updated  BEFORE UPDATE ON agents  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function migrate() {
  console.log('🔄 Running migration...');
  try {
    await pool.query(SQL);
    console.log('✅ All tables created');

    // Create super admin (platform owner)
    const { rows } = await pool.query("SELECT id FROM users WHERE role='superadmin' LIMIT 1");
    if (!rows.length) {
      const hash = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123', 12);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, tenant_id)  
         VALUES ($1, $2, $3, 'superadmin', NULL)`,
        [process.env.SUPERADMIN_NAME || 'Platform Admin', process.env.SUPERADMIN_EMAIL || 'admin@voiceagent.app', hash]
      );
      console.log('\n🎉 Super Admin created!');
      console.log(`   Email:    ${process.env.SUPERADMIN_EMAIL || 'admin@voiceagent.app'}`);
      console.log(`   Password: ${process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123'}`);
      console.log('   ⚠️  Change this password immediately after first login!\n');
    }

    console.log('✅ Migration complete. Run: npm run dev\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
