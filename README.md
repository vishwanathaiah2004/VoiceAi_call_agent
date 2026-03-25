# 🤖 VoiceAgent SaaS Platform

**Multi-tenant AI Sales Calling Platform** — Any business can sign up, create their own AI voice agent, and start calling leads automatically.

---

## How It Works

```
You (Platform Owner)
└── VoiceAgent Platform
    ├── Client 1: TechCorp
    │   └── Agent "Alex" — sells SaaS software
    │   └── Their own leads, calls, meetings
    │
    ├── Client 2: Real Estate Co.
    │   └── Agent "Sarah" — books property tours  
    │   └── Completely isolated from other clients
    │
    └── Client 3: Dental Clinic
        └── Agent "Mike" — books appointments
        └── Their own data, analytics, team
```

Each client signs up, customizes their agent (name, voice, script, questions), connects their Vapi phone number, and starts calling.

---

## Quick Start

### 1. Install
```bash
npm run install:all
```

### 2. Set up environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Fill in backend/.env with all API keys
```

### 3. Migrate database
```bash
npm run migrate
# Creates all tables and prints your super admin login
```

### 4. Get Google Calendar token (optional but recommended)
```bash
cd backend
node scripts/get-google-token.js
```

### 5. Start ngrok (so Vapi can reach you)
```bash
ngrok http 4000
# Copy the https URL → set as BACKEND_URL in backend/.env
# Also set in Vapi Dashboard → Settings → Server URL → /api/webhook
```

### 6. Run
```bash
npm run dev
```

- **Platform**: http://localhost:3000
- **Backend**: http://localhost:4000

---

## User Flows

### New Client Signs Up
1. Goes to `/register`
2. Fills in company name, email, password
3. Gets 14-day trial (50 calls free)
4. Redirected to Agent Setup → customizes name, voice, script
5. Connects their Vapi phone number
6. Goes to Call Lead → enters number → Emma calls

### You (Super Admin)
1. Login at `/login` with `SUPERADMIN_EMAIL`
2. Redirected to `/superadmin`
3. See all tenants, usage, growth charts
4. Manage plans, suspend accounts, view details

---

## Project Structure

```
voiceagent-saas/
├── backend/
│   ├── server.js              # Express + security middleware
│   ├── db.js                  # PostgreSQL pool
│   ├── config/logger.js       # Winston logging
│   ├── middleware/
│   │   ├── auth.js            # JWT + role checks (auth/superAdmin/tenantAdmin)
│   │   └── rateLimiter.js     # Per-endpoint rate limits
│   ├── routes/
│   │   ├── auth.js            # signup (creates tenant+user), login, me
│   │   ├── agents.js          # CRUD for AI agent config per tenant
│   │   ├── calls.js           # Single call + bulk CSV upload
│   │   ├── leads.js           # Leads CRUD (tenant-scoped)
│   │   ├── meetings.js        # Meeting booking + list
│   │   ├── analytics.js       # Charts data (tenant-scoped)
│   │   ├── billing.js         # Plans, usage, upgrade
│   │   ├── tenants.js         # Tenant profile + team management
│   │   ├── superadmin.js      # Platform-wide admin (you only)
│   │   └── webhook.js         # Vapi webhook handler
│   └── services/
│       ├── vapiService.js     # Builds dynamic prompt from agent config
│       ├── geminiService.js   # Transcript analysis
│       └── calendarService.js # Per-tenant Google Calendar
│
├── frontend/
│   ├── app/
│   │   ├── login/             # Login page
│   │   ├── register/          # Signup page (creates tenant)
│   │   ├── dashboard/         # Per-tenant dashboard
│   │   │   ├── page.tsx       # Overview with stats
│   │   │   ├── agent-setup/   # ⭐ The core SaaS page — customize your agent
│   │   │   ├── call-lead/     # Trigger a call (shows all agents)
│   │   │   ├── bulk-call/     # CSV upload
│   │   │   ├── leads/         # Lead table + transcript viewer
│   │   │   ├── meetings/      # Booked meetings
│   │   │   ├── analytics/     # Charts
│   │   │   └── settings/      # Account + team + billing
│   │   └── superadmin/        # Platform owner panel
│   │       ├── page.tsx       # Platform stats
│   │       ├── tenants/       # Manage all tenants
│   │       └── analytics/     # Growth charts
│   └── lib/
│       ├── api.ts             # Auth context + typed API client
│       └── pages.tsx          # All dashboard page components
│
├── railway.toml               # One-click Railway deploy
├── vercel.json                # One-click Vercel deploy
└── README.md
```

---

## Database Schema

```
tenants        — one row per business that signs up
  id, company_name, slug, plan, calls_used, calls_limit, trial_ends_at

users          — platform users (linked to tenant, or superadmin)
  id, tenant_id, name, email, password_hash, role (owner/admin/agent/viewer/superadmin)

agents         — AI agent config per tenant (name, voice, script, phone, calendar)
  id, tenant_id, name, company_name, voice_id, greeting, qualifying_questions,
  offer_text, calendar_pitch, vapi_phone_number_id, google_credentials...

leads          — all call records (scoped to tenant + agent)
  id, tenant_id, agent_id, phone, name, email, interest_level,
  meeting_booked, transcript, call_summary, vapi_call_id...
```

---

## Deployment

### Backend → Railway
1. Push to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Add all env vars from `backend/.env.example`
4. Railway gives you a URL → set as `BACKEND_URL`
5. Update Vapi webhook to `https://your-url.railway.app/api/webhook`

### Frontend → Vercel
1. vercel.com → New Project → Import repo
2. Root directory: `frontend`
3. Set `NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app`
4. Deploy

### After deploy:
- Set `FRONTEND_URL` in Railway to your Vercel URL

---

## Pricing Model (Suggested)

| Plan       | Calls/month | Your Price | Your Cost (Vapi) |
|------------|-------------|------------|------------------|
| Trial      | 50          | Free       | ~$5              |
| Starter    | 500         | $49/mo     | ~$25             |
| Pro        | 2,000       | $149/mo    | ~$100            |
| Enterprise | 10,000      | $499/mo    | ~$500            |

Margins are healthy at Pro and Enterprise tiers.
