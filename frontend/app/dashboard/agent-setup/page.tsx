'use client'
import { useEffect, useState, FormEvent } from 'react'
import { api, type Agent } from '@/lib/api'
import { Save, Loader2, CheckCircle2, Mic2, Phone, Calendar, MessageSquare, AlertCircle } from 'lucide-react'

const VOICES = [
  { id:'jennifer',     label:'Jennifer — Warm Female (US)',  provider:'playht' },
  { id:'ryan',         label:'Ryan — Professional Male (US)',provider:'playht' },
  { id:'emma',         label:'Emma — British Female',        provider:'playht' },
  { id:'michael',      label:'Michael — Casual Male (US)',   provider:'playht' },
  { id:'nova',         label:'Nova — Energetic Female',      provider:'openai' },
  { id:'shimmer',      label:'Shimmer — Soft Female',        provider:'openai' },
]

const LANGS = [
  { code:'en-US', label:'English (US)' },
  { code:'en-GB', label:'English (UK)' },
  { code:'es-ES', label:'Spanish' },
  { code:'fr-FR', label:'French' },
  { code:'de-DE', label:'German' },
  { code:'hi-IN', label:'Hindi' },
  { code:'pt-BR', label:'Portuguese (BR)' },
]

type Tab = 'identity' | 'script' | 'phone' | 'calendar'

export default function AgentSetupPage() {
  const [agents,  setAgents]  = useState<Agent[]>([])
  const [agent,   setAgent]   = useState<Agent | null>(null)
  const [tab,     setTab]     = useState<Tab>('identity')
  const [form,    setForm]    = useState<Partial<Agent>>({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api<Agent[]>('/api/agents').then(data => {
      setAgents(data)
      if (data.length > 0) { setAgent(data[0]); setForm(data[0]) }
      setLoading(false)
    })
  }, [])

  function set(k: keyof Agent, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!agent) return
    setSaving(true); setError(''); setSaved(false)
    try {
      const updated = await api<Agent>(`/api/agents/${agent.id}`, { method:'PUT', body: JSON.stringify(form) })
      setAgent(updated); setForm(updated); setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  const tabs: { key: Tab; label: string; icon: any; desc: string }[] = [
    { key:'identity', label:'Identity',  icon:Mic2,          desc:"Agent's name, voice, language" },
    { key:'script',   label:'Script',    icon:MessageSquare, desc:'Conversation flow & questions' },
    { key:'phone',    label:'Phone',     icon:Phone,         desc:'Vapi phone number connection' },
    { key:'calendar', label:'Calendar',  icon:Calendar,      desc:'Google Calendar integration' },
  ]

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin .8s linear infinite' }}/>
    </div>
  )

  return (
    <div className="animate-slide-up" style={{ maxWidth:'800px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Agent Setup</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Customize your AI sales agent — name, voice, script, and integrations</p>
      </div>

      {/* Agent selector if multiple */}
      {agents.length > 1 && (
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
          {agents.map(a => (
            <button key={a.id} onClick={() => { setAgent(a); setForm(a) }}
              className={agent?.id === a.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize:'12px', padding:'6px 14px' }}>
              {a.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Tabs */}
        <div style={{ display:'flex', gap:'4px', background:'var(--bg-hover)', padding:'4px', borderRadius:'10px', marginBottom:'22px', width:'fit-content' }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{ padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, transition:'all .15s',
                background: tab===t.key ? 'var(--bg-card)' : 'transparent',
                color: tab===t.key ? 'var(--txt)' : 'var(--txt-2)',
                boxShadow: tab===t.key ? '0 1px 4px rgba(0,0,0,.3)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── IDENTITY TAB ── */}
        {tab === 'identity' && (
          <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <p style={{ fontSize:'13px', color:'var(--txt-2)', marginBottom:'2px' }}>
              This is how your agent introduces itself to leads — their first impression of your business.
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div>
                <Label>Agent Name <span style={{ color:'var(--red)' }}>*</span></Label>
                <input value={form.name||''} onChange={e=>set('name',e.target.value)} required className="input" placeholder="Emma" />
                <Hint>The name your agent says out loud</Hint>
              </div>
              <div>
                <Label>Company Name <span style={{ color:'var(--red)' }}>*</span></Label>
                <input value={form.company_name||''} onChange={e=>set('company_name',e.target.value)} required className="input" placeholder="Acme Corp" />
                <Hint>"Calling from [Company Name]"</Hint>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <div>
                <Label>Voice</Label>
                <select value={`${form.voice_id||'jennifer'}|${form.voice_provider||'playht'}`}
                  onChange={e => {
                    const [vid, vprov] = e.target.value.split('|')
                    set('voice_id', vid); set('voice_provider', vprov)
                  }}
                  className="input" style={{ cursor:'pointer' }}>
                  {VOICES.map(v => <option key={v.id} value={`${v.id}|${v.provider}`}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Language</Label>
                <select value={form.language||'en-US'} onChange={e=>set('language',e.target.value)} className="input" style={{ cursor:'pointer' }}>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label>Greeting Message <span style={{ color:'var(--red)' }}>*</span></Label>
              <input value={form.greeting||''} onChange={e=>set('greeting',e.target.value)} required className="input"
                placeholder={`Hi! This is Emma calling from Acme Corp. Hope I'm not catching you at a bad time?`} />
              <Hint>First thing the agent says when the call connects</Hint>
            </div>

            <div>
              <Label>Agent Objective <span style={{ color:'var(--red)' }}>*</span></Label>
              <input value={form.objective||''} onChange={e=>set('objective',e.target.value)} required className="input"
                placeholder="Book 20-minute demo calls for our SaaS product" />
              <Hint>Internal context for the AI — what are you trying to achieve?</Hint>
            </div>
          </div>
        )}

        {/* ── SCRIPT TAB ── */}
        {tab === 'script' && (
          <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <p style={{ fontSize:'13px', color:'var(--txt-2)', marginBottom:'2px' }}>
              Define the exact conversation flow. The AI follows this script naturally, asking one question at a time.
            </p>

            <div>
              <Label>Qualifying Questions <span style={{ color:'var(--red)' }}>*</span></Label>
              <textarea value={form.qualifying_questions||''} onChange={e=>set('qualifying_questions',e.target.value)} required className="input"
                style={{ minHeight:'100px' }}
                placeholder={`What kind of business do you run?\nAre you currently using any automation tools?\nAre you open to improving sales with AI?`} />
              <Hint>One question per line — agent asks them in order, one at a time</Hint>
            </div>

            <div>
              <Label>Offer Text (when interested) <span style={{ color:'var(--red)' }}>*</span></Label>
              <textarea value={form.offer_text||''} onChange={e=>set('offer_text',e.target.value)} required className="input"
                placeholder="We help businesses like yours automate sales with AI. Would you be open to a quick 20-minute demo this week?" />
              <Hint>What the agent says when the lead seems interested</Hint>
            </div>

            <div>
              <Label>Meeting Pitch (when they agree) <span style={{ color:'var(--red)' }}>*</span></Label>
              <textarea value={form.calendar_pitch||''} onChange={e=>set('calendar_pitch',e.target.value)} required className="input"
                placeholder="Fantastic! I just need your name and best email to send a calendar invite. Would tomorrow at 2 PM or Thursday at 4 PM work better?" />
              <Hint>How the agent collects name, email, and books the slot</Hint>
            </div>

            <div>
              <Label>Fallback Message (when not interested)</Label>
              <input value={form.fallback_message||''} onChange={e=>set('fallback_message',e.target.value)} className="input"
                placeholder="No problem at all! Thanks for your time. Have a wonderful day!" />
              <Hint>Polite close when the lead is not interested</Hint>
            </div>

            {/* Preview */}
            <div style={{ background:'var(--bg)', borderRadius:'8px', padding:'14px', border:'1px solid var(--border)' }}>
              <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'10px' }}>Script Preview</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { speaker:'Emma', text: form.greeting || '(greeting)' },
                  { speaker:'Emma', text: (form.qualifying_questions||'').split('\n').filter(Boolean)[0] || '(first question)' },
                  { speaker:'Lead', text: 'Yes, we run an e-commerce business…' },
                  { speaker:'Emma', text: form.offer_text || '(offer text)' },
                ].map((line, i) => (
                  <div key={i} style={{ display:'flex', gap:'8px' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, color: line.speaker==='Emma' ? 'var(--accent)' : 'var(--blue)', flexShrink:0, minWidth:'42px' }}>{line.speaker}:</span>
                    <span style={{ fontSize:'12px', color:'var(--txt-2)', lineHeight:'1.5' }}>{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PHONE TAB ── */}
        {tab === 'phone' && (
          <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <div style={{ display:'flex', gap:'12px', background:'rgba(77,171,247,.08)', border:'1px solid rgba(77,171,247,.2)', borderRadius:'8px', padding:'12px 14px' }}>
              <Phone size={16} style={{ color:'var(--blue)', flexShrink:0, marginTop:'1px' }}/>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--blue)' }}>Connect Your Own Phone Number</p>
                <p style={{ fontSize:'12px', color:'var(--txt-2)', marginTop:'3px', lineHeight:'1.5' }}>
                  By default, calls use the platform's shared number. Add your own Twilio number via Vapi for a custom caller ID that shows your business name.
                </p>
              </div>
            </div>

            <div>
              <Label>Vapi Phone Number ID</Label>
              <input value={form.vapi_phone_number_id||''} onChange={e=>set('vapi_phone_number_id',e.target.value)} className="input"
                placeholder="phone_xxxxxxxxxxxxxxxxxx" style={{ fontFamily:'var(--font-mono)', fontSize:'13px' }} />
              <Hint>From Vapi Dashboard → Phone Numbers → click your number → copy ID</Hint>
            </div>

            <div>
              <Label>Sales Team Email</Label>
              <input type="email" value={form.sales_email||''} onChange={e=>set('sales_email',e.target.value)} className="input"
                placeholder="sales@yourcompany.com" />
              <Hint>Receives calendar meeting invites when Emma books a demo</Hint>
            </div>

            <div style={{ background:'var(--bg)', borderRadius:'8px', padding:'14px' }}>
              <p style={{ fontSize:'12px', fontWeight:600, color:'var(--txt-2)', marginBottom:'10px' }}>How to get your Vapi Phone Number ID:</p>
              {['1. Go to dashboard.vapi.ai', '2. Click Phone Numbers in the left sidebar', '3. Click Import → Twilio and add your Twilio credentials', '4. Click on the imported number → copy the Phone Number ID', '5. Paste it above'].map(s => (
                <p key={s} style={{ fontSize:'12px', color:'var(--txt-3)', marginBottom:'4px', paddingLeft:'4px' }}>{s}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── CALENDAR TAB ── */}
        {tab === 'calendar' && (
          <div className="card" style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
              <Label style={{ margin:0 }}>Enable Google Calendar Integration</Label>
              <button type="button"
                onClick={() => set('google_calendar_enabled', !form.google_calendar_enabled)}
                style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', transition:'all .2s', position:'relative', flexShrink:0,
                  background: form.google_calendar_enabled ? 'var(--accent)' : 'var(--border-hi)' }}>
                <span style={{ position:'absolute', top:'3px', left: form.google_calendar_enabled ? '23px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'white', transition:'left .2s' }}/>
              </button>
            </div>
            <Hint style={{ marginTop:'-10px' }}>When enabled, Emma auto-books meetings in your Google Calendar after a successful call</Hint>

            {form.google_calendar_enabled && (
              <>
                <div style={{ display:'flex', gap:'12px', background:'rgba(48,209,88,.06)', border:'1px solid rgba(48,209,88,.2)', borderRadius:'8px', padding:'12px 14px' }}>
                  <CheckCircle2 size={15} style={{ color:'var(--accent)', flexShrink:0, marginTop:'1px' }}/>
                  <p style={{ fontSize:'12px', color:'var(--txt-2)', lineHeight:'1.5' }}>
                    You can use the platform's Google Calendar (managed by the platform owner), OR connect your own Google account below for full control.
                  </p>
                </div>

                <div>
                  <Label>Your Google Client ID <span style={{ color:'var(--txt-3)', fontWeight:400 }}>(optional — uses platform default if blank)</span></Label>
                  <input value={form.google_client_id||''} onChange={e=>set('google_client_id',e.target.value)} className="input"
                    placeholder="xxxx.apps.googleusercontent.com" style={{ fontFamily:'var(--font-mono)', fontSize:'12px' }}/>
                </div>
                <div>
                  <Label>Your Google Client Secret</Label>
                  <input type="password" value={form.google_client_secret||''} onChange={e=>set('google_client_secret',e.target.value)} className="input"
                    placeholder="GOCSPX-xxxxxxxxxxxxxxx"/>
                </div>
                <div>
                  <Label>Your Google Refresh Token</Label>
                  <input type="password" value={form.google_refresh_token||''} onChange={e=>set('google_refresh_token',e.target.value)} className="input"
                    placeholder="1//xxxxxxxxxxxxxxxxxx"/>
                  <Hint>Run: node scripts/get-google-token.js in the backend to get this</Hint>
                </div>
              </>
            )}
          </div>
        )}

        {/* Save bar */}
        <div style={{ marginTop:'18px', display:'flex', alignItems:'center', gap:'12px' }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding:'10px 22px', fontSize:'14px' }}>
            {saving ? <><Loader2 size={15} className="animate-spin"/>Saving…</> : <><Save size={14}/>Save Changes</>}
          </button>
          {saved && (
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'var(--accent)' }}>
              <CheckCircle2 size={15}/> Saved!
            </span>
          )}
          {error && (
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'var(--red)' }}>
              <AlertCircle size={15}/> {error}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'6px', ...style }}>{children}</label>
}
function Hint({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'4px', ...style }}>{children}</p>
}
