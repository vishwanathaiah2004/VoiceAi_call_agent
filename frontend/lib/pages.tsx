'use client'
// ── Call Lead Page ────────────────────────────────────────────────────────────
import { useEffect, useState, FormEvent } from 'react'
import { api, API_URL, type Agent, type Lead, type Stats, interestCls, fmt } from '@/lib/api'
import { Phone, Loader2, CheckCircle2, AlertCircle, Info, Upload, Download, X, Search, ChevronDown, RefreshCw, Clock, Calendar, ExternalLink, Mic, FileText, Save, Shield } from 'lucide-react'
import { formatDistanceToNow, format, isFuture, isPast, isToday } from 'date-fns'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useAuth } from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// CALL LEAD
// ─────────────────────────────────────────────────────────────────────────────
export function CallLeadPage() {
  const [agents,  setAgents]  = useState<Agent[]>([])
  const [agentId, setAgentId] = useState('')
  const [phone,   setPhone]   = useState('')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [state,   setState]   = useState<'idle'|'calling'|'success'|'error'>('idle')
  const [result,  setResult]  = useState<{ callId: string; leadId: string }|null>(null)
  const [error,   setError]   = useState('')

  useEffect(() => {
    api<Agent[]>('/api/agents').then(d => { setAgents(d); if (d.length) setAgentId(d[0].id) })
  }, [])

  async function handle(e: FormEvent) {
    e.preventDefault(); setState('calling'); setError('')
    try {
      const d = await api<{ callId: string; leadId: string }>('/api/calls/single', {
        method:'POST', body: JSON.stringify({ phone, name:name||undefined, email:email||undefined, agentId }),
      })
      setResult(d); setState('success')
    } catch (err: any) { setError(err.message); setState('error') }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth:'540px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Call a Lead</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Your AI agent will call, qualify, and book a meeting automatically</p>
      </div>

      {/* Agent selector */}
      {agents.length > 0 && (
        <div style={{ marginBottom:'18px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-2)', marginBottom:'8px' }}>Select Agent</p>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {agents.map(a => (
              <button key={a.id} type="button" onClick={() => setAgentId(a.id)}
                className={agentId === a.id ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize:'13px', padding:'7px 14px' }}>
                {a.name} — {a.company_name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding:'24px' }}>
        {state === 'success' && result && (
          <div className="animate-slide-up" style={{ marginBottom:'20px', background:'rgba(48,209,88,.08)', border:'1px solid rgba(48,209,88,.25)', borderRadius:'10px', padding:'14px' }}>
            <div style={{ display:'flex', gap:'10px' }}>
              <CheckCircle2 size={17} style={{ color:'var(--accent)', flexShrink:0 }}/>
              <div>
                <p style={{ fontWeight:600, color:'var(--accent)', fontSize:'14px' }}>Call started!</p>
                <p style={{ color:'var(--txt-2)', fontSize:'12px', marginTop:'3px' }}>Agent is calling {phone}</p>
                <p style={{ fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--txt-3)', marginTop:'8px' }}>Lead: {result.leadId}</p>
                <button onClick={() => { setState('idle'); setPhone(''); setName(''); setEmail('') }} className="btn-secondary" style={{ marginTop:'10px', fontSize:'12px', padding:'5px 12px' }}>
                  Make another call
                </button>
              </div>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div style={{ display:'flex', gap:'10px', background:'rgba(248,81,73,.08)', border:'1px solid rgba(248,81,73,.25)', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px' }}>
            <AlertCircle size={15} style={{ color:'var(--red)', flexShrink:0 }}/>
            <div>
              <p style={{ fontSize:'13px', fontWeight:600, color:'var(--red)' }}>Call failed</p>
              <p style={{ fontSize:'12px', color:'var(--txt-2)', marginTop:'2px' }}>{error}</p>
            </div>
          </div>
        )}

        {state === 'calling' && (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <div className="pulse-ring" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'60px', height:'60px', background:'var(--accent)', borderRadius:'50%', marginBottom:'18px' }}>
              <Phone size={26} color="#070b09"/>
            </div>
            <p className="font-display" style={{ fontSize:'19px', fontWeight:600, color:'var(--txt)' }}>Calling {phone}…</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', marginTop:'10px' }}>
              <Loader2 size={14} style={{ color:'var(--accent)' }} className="animate-spin"/>
              <span style={{ fontSize:'12px', color:'var(--accent)' }}>Connecting via Vapi</span>
            </div>
          </div>
        )}

        {(state === 'idle' || state === 'error') && (
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'15px' }}>
            <FLabel>Phone Number *</FLabel>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="+12025551234" className="input" style={{ marginTop:'-8px' }}/>
            <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'-8px', display:'flex', alignItems:'center', gap:'4px' }}><Info size={10}/> E.164 format: +[country code][number]</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div><FLabel>Name (optional)</FLabel><input value={name} onChange={e=>setName(e.target.value)} placeholder="John Smith" className="input"/></div>
              <div><FLabel>Email (optional)</FLabel><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="john@co.com" className="input"/></div>
            </div>
            <button type="submit" disabled={!phone.trim() || !agentId} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:'14px' }}>
              <Phone size={15}/> Start AI Call
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK CALL
// ─────────────────────────────────────────────────────────────────────────────
export function BulkCallPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentId,setAgentId]= useState('')
  const [file,   setFile]   = useState<File|null>(null)
  const [loading,setLoading]= useState(false)
  const [result, setResult] = useState<{ total: number }|null>(null)
  const [error,  setError]  = useState('')
  const inputRef = { current: null as HTMLInputElement|null }

  useEffect(() => { api<Agent[]>('/api/agents').then(d => { setAgents(d); if (d.length) setAgentId(d[0].id) }) }, [])

  async function handleUpload() {
    if (!file || !agentId) return
    setLoading(true); setError('')
    try {
      const form = new FormData(); form.append('file', file); form.append('agentId', agentId)
      const token = localStorage.getItem('va_token')
      const res = await fetch(`${API_URL}/api/calls/bulk/csv`, { method:'POST', headers:{ Authorization:`Bearer ${token}` }, body:form })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const d = await res.json(); setResult(d); setFile(null)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  function downloadTemplate() {
    const csv = 'phone,name,email,business_type\n+12025551001,John Smith,john@acme.com,SaaS\n+12025551002,Sarah Lee,sarah@co.com,Retail'
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='leads-template.csv'; a.click()
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth:'580px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Bulk Call</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Upload a CSV and your agent calls every lead automatically</p>
      </div>

      {agents.length > 0 && (
        <div style={{ marginBottom:'16px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-2)', marginBottom:'7px' }}>Select Agent</p>
          <div style={{ display:'flex', gap:'8px' }}>
            {agents.map(a => (
              <button key={a.id} onClick={()=>setAgentId(a.id)} className={agentId===a.id?'btn-primary':'btn-secondary'} style={{ fontSize:'12px', padding:'6px 12px' }}>
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <p style={{ fontSize:'13px', color:'var(--txt-2)' }}>CSV must have a <code style={{ fontFamily:'var(--font-mono)', fontSize:'11px', background:'var(--bg-hover)', padding:'1px 6px', borderRadius:'4px', color:'var(--accent)' }}>phone</code> column in E.164 format</p>
        <button onClick={downloadTemplate} className="btn-secondary" style={{ fontSize:'12px', padding:'5px 12px' }}><Download size={12}/> Template</button>
      </div>

      <div onClick={()=>{ const i = document.createElement('input'); i.type='file'; i.accept='.csv'; i.onchange=(e:any)=>setFile(e.target.files[0]); i.click() }}
        style={{ border:`2px dashed ${file?'var(--accent-dim)':'var(--border-hi)'}`, borderRadius:'10px', padding:'36px 20px', textAlign:'center', cursor:'pointer', background: file?'rgba(48,209,88,.04)':'var(--bg-hover)', transition:'all .2s', marginBottom:'16px' }}>
        {file ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
            <FileText size={18} style={{ color:'var(--accent)' }}/>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontWeight:600, color:'var(--txt)', fontSize:'13px' }}>{file.name}</p>
              <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'1px' }}>{(file.size/1024).toFixed(1)} KB</p>
            </div>
            <button onClick={e=>{e.stopPropagation();setFile(null)}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)', marginLeft:'8px' }}><X size={15}/></button>
          </div>
        ) : (
          <>
            <Upload size={24} style={{ color:'var(--txt-3)', margin:'0 auto 10px' }}/>
            <p style={{ fontSize:'13px', color:'var(--txt-2)', fontWeight:500 }}>Drop CSV here or click to browse</p>
            <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'4px' }}>Max 200 leads</p>
          </>
        )}
      </div>

      {error && <div style={{ display:'flex', gap:'8px', background:'rgba(248,81,73,.08)', border:'1px solid rgba(248,81,73,.25)', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px' }}><AlertCircle size={14} style={{ color:'var(--red)', flexShrink:0 }}/><p style={{ fontSize:'12px', color:'var(--red)' }}>{error}</p></div>}
      {result && <div style={{ display:'flex', gap:'8px', background:'rgba(48,209,88,.08)', border:'1px solid rgba(48,209,88,.25)', borderRadius:'8px', padding:'12px 14px', marginBottom:'12px' }}><CheckCircle2 size={14} style={{ color:'var(--accent)', flexShrink:0 }}/><p style={{ fontSize:'12px', color:'var(--accent)' }}>Processing {result.total} leads — check All Leads to track progress</p></div>}

      <button onClick={handleUpload} disabled={!file||loading||!agentId} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:'14px' }}>
        {loading ? <><Loader2 size={15} className="animate-spin"/>Uploading…</> : <><Upload size={14}/> Start Bulk Calling</>}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL LEADS
// ─────────────────────────────────────────────────────────────────────────────
export function LeadsPage() {
  const [leads, setLeads]   = useState<Lead[]>([])
  const [total, setTotal]   = useState(0)
  const [loading,setLoading]= useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [selected,setSelected]=useState<Lead|null>(null)
  const [page,   setPage]   = useState(0)
  const PER = 25

  async function load() {
    setLoading(true)
    try {
      const p = new URLSearchParams({ limit:String(PER), offset:String(page*PER) })
      if (search) p.set('search',search); if (filter) p.set('interest_level',filter)
      const d = await api<{ leads:Lead[]; total:number }>(`/api/leads?${p}`)
      setLeads(d.leads); setTotal(d.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, filter, page])

  return (
    <div className="animate-slide-up" style={{ maxWidth:'1100px' }}>
      <div style={{ marginBottom:'22px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>All Leads</h1>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>{total} total leads</p>
        </div>
        <button onClick={load} className="btn-secondary" style={{ fontSize:'12px' }}><RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh</button>
      </div>

      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        <div style={{ position:'relative', flex:1, maxWidth:'300px' }}>
          <Search size={13} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }}/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}} placeholder="Search leads…" className="input" style={{ paddingLeft:'32px' }}/>
        </div>
        <div style={{ position:'relative' }}>
          <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}} className="input" style={{ width:'170px', appearance:'none', paddingRight:'28px', cursor:'pointer' }}>
            <option value="">All levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">None</option>
          </select>
          <ChevronDown size={12} style={{ position:'absolute', right:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }}/>
        </div>
        {filter && <button onClick={()=>setFilter('')} className="btn-ghost" style={{ padding:'6px 8px' }}><X size={13}/></button>}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {loading ? <div style={{ padding:'50px', textAlign:'center', color:'var(--txt-2)', fontSize:'13px' }}>Loading…</div>
        : leads.length===0 ? <div style={{ padding:'50px', textAlign:'center' }}><p style={{ color:'var(--txt-2)', fontSize:'13px' }}>No leads found</p></div>
        : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr><th>Lead</th><th>Agent</th><th>Business</th><th>Interest</th><th>Duration</th><th>Meeting</th><th>Called</th><th></th></tr></thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} onClick={()=>setSelected(l)}>
                    <td><div style={{ fontWeight:500, fontSize:'13px' }}>{l.name||<span style={{ color:'var(--txt-3)', fontStyle:'italic' }}>Unknown</span>}</div><div style={{ fontSize:'11px', color:'var(--txt-3)' }}>{l.phone}</div></td>
                    <td style={{ fontSize:'12px', color:'var(--txt-2)' }}>{l.agent_name||'—'}</td>
                    <td style={{ fontSize:'12px', color:'var(--txt-2)', maxWidth:'130px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.business_type||'—'}</td>
                    <td><span className={`badge ${interestCls(l.interest_level)}`}>{l.interest_level}</span></td>
                    <td style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--txt-3)' }}>{fmt(l.call_duration_seconds)}</td>
                    <td>{l.meeting_booked?<span className="badge badge-green">✓ Booked</span>:<span style={{ color:'var(--txt-3)', fontSize:'12px' }}>—</span>}</td>
                    <td style={{ fontSize:'11px', color:'var(--txt-3)' }}><span style={{ display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10}/>{formatDistanceToNow(new Date(l.created_at),{addSuffix:true})}</span></td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                        {l.calendar_event_link && <a href={l.calendar_event_link} target="_blank" rel="noopener noreferrer" style={{ color:'var(--accent)', display:'flex' }}><Calendar size={13}/></a>}
                        <button onClick={async()=>{ if(!confirm('Delete?'))return; await api(`/api/leads/${l.id}`,{method:'DELETE'}); setLeads(p=>p.filter(x=>x.id!==l.id)); setTotal(t=>t-1) }}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--txt-3)', display:'flex', padding:'2px' }}><X size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > PER && (
          <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <p style={{ fontSize:'12px', color:'var(--txt-3)' }}>{page*PER+1}–{Math.min((page+1)*PER,total)} of {total}</p>
            <div style={{ display:'flex', gap:'6px' }}>
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="btn-secondary" style={{ fontSize:'12px', padding:'4px 10px' }}>Prev</button>
              <button disabled={(page+1)*PER>=total} onClick={()=>setPage(p=>p+1)} className="btn-secondary" style={{ fontSize:'12px', padding:'4px 10px' }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {selected && <TranscriptModal lead={selected} onClose={()=>setSelected(null)}/>}
    </div>
  )
}

function TranscriptModal({ lead, onClose }: { lead: Lead; onClose: ()=>void }) {
  useEffect(() => { const h=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}; document.addEventListener('keydown',h); return()=>document.removeEventListener('keydown',h) }, [onClose])
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} className="animate-fade-in">
      <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'600px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'var(--bg-hover)', display:'flex', alignItems:'center', justifyContent:'center' }}><Mic size={15} style={{ color:'var(--txt-2)' }}/></div>
            <div>
              <p style={{ fontWeight:600, fontSize:'13px', color:'var(--txt)' }}>{lead.name||'Unknown Lead'}</p>
              <p style={{ fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--txt-3)' }}>{lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding:'5px' }}><X size={15}/></button>
        </div>
        <div style={{ overflowY:'auto', padding:'18px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {[
              { label:'Interest', value:<span className={`badge ${interestCls(lead.interest_level)}`}>{lead.interest_level}</span> },
              { label:'Meeting',  value: lead.meeting_booked ? <span className="badge badge-green">✓ Booked</span> : <span style={{ color:'var(--txt-3)', fontSize:'12px' }}>No</span> },
              { label:'Email',    value:<span style={{ fontSize:'12px', color:'var(--txt-2)' }}>{lead.email||'—'}</span> },
              { label:'Business', value:<span style={{ fontSize:'12px', color:'var(--txt-2)' }}>{lead.business_type||'—'}</span> },
              { label:'Duration', value:<span style={{ fontSize:'12px', fontFamily:'var(--font-mono)', color:'var(--txt-2)' }}>{fmt(lead.call_duration_seconds)}</span> },
              { label:'Agent',    value:<span style={{ fontSize:'12px', color:'var(--txt-2)' }}>{lead.agent_name||'—'}</span> },
            ].map(({ label, value }) => (
              <div key={label} style={{ background:'var(--bg-hover)', borderRadius:'7px', padding:'9px 11px' }}>
                <p style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', fontWeight:600, marginBottom:'4px' }}>{label}</p>
                {value}
              </div>
            ))}
          </div>
          {lead.meeting_booked && lead.calendar_event_link && (
            <div style={{ display:'flex', gap:'10px', background:'var(--accent-faint)', border:'1px solid rgba(48,209,88,.2)', borderRadius:'8px', padding:'11px 13px', alignItems:'center' }}>
              <Calendar size={14} style={{ color:'var(--accent)', flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'var(--accent)' }}>Meeting scheduled</p>
                {lead.meeting_time && <p style={{ fontSize:'11px', color:'var(--txt-2)', marginTop:'2px' }}>{format(new Date(lead.meeting_time),'EEEE, MMM d — h:mm a')}</p>}
              </div>
              <a href={lead.calendar_event_link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize:'11px', padding:'4px 10px' }}><ExternalLink size={11}/> Open</a>
            </div>
          )}
          {lead.call_summary && (
            <div>
              <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'7px', display:'flex', alignItems:'center', gap:'5px' }}><FileText size={11}/>AI Summary</p>
              <p style={{ fontSize:'12px', color:'var(--txt-2)', lineHeight:'1.6', background:'var(--bg-hover)', borderRadius:'7px', padding:'11px' }}>{lead.call_summary}</p>
            </div>
          )}
          <div>
            <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'7px', display:'flex', alignItems:'center', gap:'5px' }}><Mic size={11}/>Transcript</p>
            {lead.transcript
              ? <pre style={{ fontSize:'11px', fontFamily:'var(--font-mono)', color:'var(--txt-2)', background:'var(--bg)', borderRadius:'7px', padding:'12px', overflow:'auto', maxHeight:'220px', lineHeight:'1.7', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{lead.transcript}</pre>
              : <p style={{ fontSize:'12px', color:'var(--txt-3)', fontStyle:'italic' }}>No transcript available</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MEETINGS
// ─────────────────────────────────────────────────────────────────────────────
export function MeetingsPage() {
  const [leads, setLeads]   = useState<Lead[]>([])
  const [loading,setLoading]= useState(true)
  useEffect(() => { api<Lead[]>('/api/meetings').then(setLeads).finally(()=>setLoading(false)) }, [])
  const upcoming = leads.filter(l=>l.meeting_time&&(isToday(new Date(l.meeting_time))||isFuture(new Date(l.meeting_time))))
  const past     = leads.filter(l=>l.meeting_time&&isPast(new Date(l.meeting_time))&&!isToday(new Date(l.meeting_time)))

  return (
    <div className="animate-slide-up" style={{ maxWidth:'760px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Meetings</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>{leads.length} demo meetings booked</p>
      </div>
      {loading ? <div className="card" style={{ padding:'50px', textAlign:'center', color:'var(--txt-2)', fontSize:'13px' }}>Loading…</div>
      : leads.length===0 ? <div className="card" style={{ padding:'50px', textAlign:'center' }}><Calendar size={32} style={{ color:'var(--txt-3)', margin:'0 auto 12px' }}/><p style={{ color:'var(--txt-2)', fontSize:'13px' }}>No meetings yet</p></div>
      : (
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
          {upcoming.length>0 && <section>
            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--accent)', marginBottom:'10px' }}>Upcoming · {upcoming.length}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>{upcoming.map(l=><MeetCard key={l.id} lead={l}/>)}</div>
          </section>}
          {past.length>0 && <section>
            <p style={{ fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--txt-3)', marginBottom:'10px' }}>Past · {past.length}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', opacity:.7 }}>{past.map(l=><MeetCard key={l.id} lead={l}/>)}</div>
          </section>}
        </div>
      )}
    </div>
  )
}

function MeetCard({ lead }: { lead: Lead }) {
  const d = lead.meeting_time ? new Date(lead.meeting_time) : null
  return (
    <div className="card" style={{ padding:'16px 18px', display:'flex', gap:'16px', alignItems:'center' }}>
      <div style={{ textAlign:'center', width:'48px', flexShrink:0 }}>
        {d ? <><p style={{ fontSize:'9px', textTransform:'uppercase', color:'var(--txt-3)', fontWeight:600, letterSpacing:'.08em' }}>{format(d,'MMM')}</p><p className="font-display" style={{ fontSize:'28px', fontWeight:800, color:'var(--accent)', lineHeight:1 }}>{format(d,'d')}</p><p style={{ fontSize:'9px', color:'var(--txt-3)' }}>{format(d,'yyyy')}</p></> : <span style={{ color:'var(--txt-3)', fontSize:'11px' }}>TBD</span>}
      </div>
      <div style={{ width:'1px', height:'40px', background:'var(--border)', flexShrink:0 }}/>
      <div style={{ flex:1, overflow:'hidden' }}>
        <p style={{ fontWeight:600, fontSize:'13px', color:'var(--txt)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lead.name||'Unknown Lead'}</p>
        <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', marginTop:'3px' }}>
          {d && <span style={{ fontSize:'11px', color:'var(--txt-2)', display:'flex', alignItems:'center', gap:'3px' }}><Clock size={10}/>{format(d,'h:mm a')}</span>}
          {lead.email && <span style={{ fontSize:'11px', color:'var(--txt-3)' }}>{lead.email}</span>}
          {lead.agent_name && <span className="badge badge-blue" style={{ fontSize:'10px', padding:'1px 7px' }}>{lead.agent_name}</span>}
        </div>
      </div>
      {lead.calendar_event_link && <a href={lead.calendar_event_link} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ fontSize:'11px', padding:'5px 10px', flexShrink:0 }}><ExternalLink size={11}/> View</a>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
const TT = ({ active, payload, label }: any) => !active||!payload?.length ? null : (
  <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'7px', padding:'9px 12px', fontSize:'11px' }}>
    <p style={{ color:'var(--txt-3)', marginBottom:'5px', fontWeight:600 }}>{label}</p>
    {payload.map((p:any) => <p key={p.name} style={{ color:p.color, marginBottom:'1px' }}>{p.name}: <strong>{p.value}</strong></p>)}
  </div>
)
const COLORS: Record<string,string> = { high:'#30d158', medium:'#f0a030', low:'#f85149', none:'#3f5442', unknown:'#2a3c2e' }

export function AnalyticsPage() {
  const [data, setData]   = useState<any>(null)
  const [days, setDays]   = useState(30)
  const [loading,setLoading]= useState(true)
  useEffect(() => { setLoading(true); api<any>(`/api/analytics?days=${days}`).then(setData).finally(()=>setLoading(false)) }, [days])

  const daily = data?.daily.map((d:any) => ({ ...d, date:format(new Date(d.date),'MMM d'), calls:+d.calls, meetings:+d.meetings })) || []
  const pie   = data?.byInterest.map((d:any) => ({ name:d.interest_level, value:+d.count, color:COLORS[d.interest_level]||'#3f5442' })) || []
  const biz   = data?.byBusiness.map((d:any) => ({ name:d.business_type, value:+d.count })) || []

  return (
    <div className="animate-slide-up" style={{ maxWidth:'1080px' }}>
      <div style={{ marginBottom:'26px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Analytics</h1>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Call performance and lead insights</p>
        </div>
        <div style={{ display:'flex', gap:'5px' }}>
          {[7,30,90].map(d=><button key={d} onClick={()=>setDays(d)} className={days===d?'btn-primary':'btn-secondary'} style={{ fontSize:'12px', padding:'5px 12px' }}>{d}d</button>)}
        </div>
      </div>
      {loading ? <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>{[1,2,3,4].map(i=><div key={i} className="card skeleton" style={{ height:'220px' }}/>)}</div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="card" style={{ padding:'18px 22px' }}>
            <p className="font-display" style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'18px' }}>Call Volume — Last {days} Days</p>
            {daily.length===0 ? <div style={{ height:'180px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:'12px' }}>No data yet</div> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={daily}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4dabf7" stopOpacity={.3}/><stop offset="95%" stopColor="#4dabf7" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#30d158" stopOpacity={.3}/><stop offset="95%" stopColor="#30d158" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="date" tick={{ fill:'var(--txt-3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--txt-3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<TT/>}/>
                  <Area type="monotone" dataKey="calls"    stroke="#4dabf7" fill="url(#gc)" name="Calls"    strokeWidth={2} dot={false}/>
                  <Area type="monotone" dataKey="meetings" stroke="#30d158" fill="url(#gm)" name="Meetings" strokeWidth={2} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div className="card" style={{ padding:'18px 22px' }}>
              <p className="font-display" style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'16px' }}>Interest Breakdown</p>
              {pie.length===0 ? <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:'12px' }}>No data</div> : (
                <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart><Pie data={pie} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                      {pie.map((e:any,i:number)=><Cell key={i} fill={e.color}/>)}
                    </Pie><Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'7px', fontSize:'11px' }}/></PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {pie.map((p:any)=>(
                      <div key={p.name} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        <span style={{ width:'9px', height:'9px', borderRadius:'2px', background:p.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'11px', color:'var(--txt-2)', textTransform:'capitalize' }}>{p.name}</span>
                        <span style={{ fontSize:'11px', fontWeight:700, color:'var(--txt)', marginLeft:'auto' }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="card" style={{ padding:'18px 22px' }}>
              <p className="font-display" style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'16px' }}>Top Business Types</p>
              {biz.length===0 ? <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:'12px' }}>No data</div> : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={biz} layout="vertical" margin={{ left:0, right:8 }}>
                    <XAxis type="number" tick={{ fill:'var(--txt-3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{ fill:'var(--txt-2)', fontSize:10 }} axisLine={false} tickLine={false} width={80}/>
                    <Tooltip content={<TT/>}/>
                    <Bar dataKey="value" fill="var(--accent)" radius={[0,3,3,0]} name="Leads"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, tenant } = useAuth()
  const [tab, setTab] = useState<'account'|'team'|'billing'>('account')
  const [curPwd, setCurPwd]   = useState(''); const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg]   = useState(''); const [pwdErr, setPwdErr] = useState('')
  const [pwdLoading,setPwdLoading] = useState(false)
  const [team, setTeam]       = useState<any[]>([])
  const [newName,setNewName]  = useState(''); const [newEmail,setNewEmail] = useState('')
  const [newPass,setNewPass]  = useState(''); const [newRole,setNewRole]  = useState('agent')
  const [teamMsg,setTeamMsg]  = useState(''); const [teamErr,setTeamErr]  = useState('')
  const [teamLoading,setTeamLoading] = useState(false)
  const [usage, setUsage]     = useState<any>(null)

  const PLANS = { trial:{name:'Trial',calls:50,price:'Free'}, starter:{name:'Starter',calls:500,price:'$49/mo'}, pro:{name:'Pro',calls:2000,price:'$149/mo'}, enterprise:{name:'Enterprise',calls:10000,price:'$499/mo'} }

  useEffect(() => {
    api<any[]>('/api/tenants/team').then(setTeam).catch(()=>{})
    api<any>('/api/billing/usage').then(setUsage).catch(()=>{})
  }, [])

  async function changePwd(e: FormEvent) {
    e.preventDefault(); setPwdLoading(true); setPwdMsg(''); setPwdErr('')
    try { await api('/api/auth/password',{method:'PUT',body:JSON.stringify({currentPassword:curPwd,newPassword:newPwd})}); setPwdMsg('Password changed!'); setCurPwd(''); setNewPwd('') }
    catch(err:any){ setPwdErr(err.message) } finally{ setPwdLoading(false) }
  }

  async function addMember(e: FormEvent) {
    e.preventDefault(); setTeamLoading(true); setTeamMsg(''); setTeamErr('')
    try {
      await api('/api/tenants/team',{method:'POST',body:JSON.stringify({name:newName,email:newEmail,password:newPass,role:newRole})})
      setTeamMsg(`${newEmail} added!`); setNewName(''); setNewEmail(''); setNewPass(''); setNewRole('agent')
      const list = await api<any[]>('/api/tenants/team'); setTeam(list)
    } catch(err:any){ setTeamErr(err.message) } finally{ setTeamLoading(false) }
  }

  return (
    <div className="animate-slide-up" style={{ maxWidth:'660px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Settings</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Manage your account, team, and billing</p>
      </div>

      <div style={{ display:'flex', gap:'4px', background:'var(--bg-hover)', padding:'4px', borderRadius:'10px', width:'fit-content', marginBottom:'22px' }}>
        {[['account','Account'],['team','Team'],['billing','Billing']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k as any)} style={{ padding:'7px 16px', borderRadius:'7px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight:500, transition:'all .15s',
            background:tab===k?'var(--bg-card)':'transparent', color:tab===k?'var(--txt)':'var(--txt-2)', boxShadow:tab===k?'0 1px 4px rgba(0,0,0,.3)':'none' }}>{l}</button>
        ))}
      </div>

      {tab==='account' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="card" style={{ padding:'20px 22px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'14px' }}>Profile</p>
            <div style={{ display:'flex', gap:'10px', alignItems:'center', background:'var(--bg-hover)', borderRadius:'9px', padding:'12px 14px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'var(--accent-faint)', border:'1px solid var(--border-hi)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight:600, color:'var(--txt)', fontSize:'14px' }}>{user?.name}</p>
                <p style={{ fontSize:'12px', color:'var(--txt-3)' }}>{user?.email}</p>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', marginTop:'3px' }}><Shield size={10} style={{ color:'var(--accent)' }}/><span style={{ fontSize:'10px', color:'var(--accent)', textTransform:'capitalize', fontWeight:600 }}>{user?.role}</span></div>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding:'20px 22px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'14px' }}>Change Password</p>
            {pwdMsg && <div style={{ display:'flex', gap:'7px', background:'rgba(48,209,88,.1)', border:'1px solid rgba(48,209,88,.2)', borderRadius:'7px', padding:'9px 12px', marginBottom:'12px' }}><CheckCircle2 size={13} style={{ color:'var(--accent)' }}/><p style={{ fontSize:'12px', color:'var(--accent)' }}>{pwdMsg}</p></div>}
            {pwdErr && <div style={{ background:'rgba(248,81,73,.08)', border:'1px solid rgba(248,81,73,.2)', borderRadius:'7px', padding:'9px 12px', marginBottom:'12px' }}><p style={{ fontSize:'12px', color:'var(--red)' }}>{pwdErr}</p></div>}
            <form onSubmit={changePwd} style={{ display:'flex', flexDirection:'column', gap:'11px' }}>
              <div><FLabel>Current Password</FLabel><input type="password" value={curPwd} onChange={e=>setCurPwd(e.target.value)} required className="input"/></div>
              <div><FLabel>New Password</FLabel><input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} required minLength={8} className="input" placeholder="Min 8 characters"/></div>
              <button type="submit" disabled={pwdLoading} className="btn-primary" style={{ width:'fit-content' }}>
                {pwdLoading?<><Loader2 size={13} className="animate-spin"/>Saving…</>:<><Save size={13}/>Update Password</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {tab==='team' && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="card" style={{ padding:'20px 22px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'14px' }}>Team Members ({team.length})</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
              {team.map(u=>(
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'var(--bg-hover)', borderRadius:'7px' }}>
                  <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:'var(--accent-faint)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>{u.name[0]?.toUpperCase()}</div>
                  <div style={{ flex:1, overflow:'hidden' }}>
                    <p style={{ fontSize:'12px', fontWeight:600, color:u.is_active?'var(--txt)':'var(--txt-3)' }}>{u.name}</p>
                    <p style={{ fontSize:'10px', color:'var(--txt-3)' }}>{u.email} · {u.role}</p>
                  </div>
                  {u.id!==user?.id && (
                    <button onClick={async()=>{ await api(`/api/tenants/team/${u.id}`,{method:'PATCH',body:JSON.stringify({is_active:!u.is_active})}); setTeam(p=>p.map(x=>x.id===u.id?{...x,is_active:!u.is_active}:x)) }}
                      className={u.is_active?'btn-secondary':'btn-primary'} style={{ fontSize:'11px', padding:'4px 10px' }}>
                      {u.is_active?'Deactivate':'Activate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {['owner','admin'].includes(user?.role||'') && (
            <div className="card" style={{ padding:'20px 22px' }}>
              <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'14px' }}>Add Member</p>
              {teamMsg && <div style={{ display:'flex', gap:'7px', background:'rgba(48,209,88,.1)', border:'1px solid rgba(48,209,88,.2)', borderRadius:'7px', padding:'9px 12px', marginBottom:'12px' }}><CheckCircle2 size={13} style={{ color:'var(--accent)' }}/><p style={{ fontSize:'12px', color:'var(--accent)' }}>{teamMsg}</p></div>}
              {teamErr && <div style={{ background:'rgba(248,81,73,.08)', border:'1px solid rgba(248,81,73,.2)', borderRadius:'7px', padding:'9px 12px', marginBottom:'12px' }}><p style={{ fontSize:'12px', color:'var(--red)' }}>{teamErr}</p></div>}
              <form onSubmit={addMember} style={{ display:'flex', flexDirection:'column', gap:'11px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div><FLabel>Name</FLabel><input value={newName} onChange={e=>setNewName(e.target.value)} required className="input" placeholder="Jane Smith"/></div>
                  <div><FLabel>Email</FLabel><input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required className="input" placeholder="jane@co.com"/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                  <div><FLabel>Password</FLabel><input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required minLength={8} className="input" placeholder="Min 8 chars"/></div>
                  <div><FLabel>Role</FLabel><select value={newRole} onChange={e=>setNewRole(e.target.value)} className="input" style={{ cursor:'pointer' }}><option value="agent">Agent</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select></div>
                </div>
                <button type="submit" disabled={teamLoading} className="btn-primary" style={{ width:'fit-content' }}>
                  {teamLoading?<><Loader2 size={13} className="animate-spin"/>Adding…</>:'+ Add Member'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab==='billing' && usage && (
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div className="card" style={{ padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
              <div>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)' }}>Current Plan</p>
                <p style={{ fontSize:'24px', fontWeight:700, color:'var(--accent)', fontFamily:'var(--font-display)', marginTop:'4px' }}>{PLANS[usage.plan as keyof typeof PLANS]?.name || usage.plan}</p>
              </div>
              <span className={`badge ${usage.planStatus==='active'?'badge-green':'badge-red'}`}>{usage.planStatus}</span>
            </div>
            <div style={{ marginBottom:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                <span style={{ fontSize:'12px', color:'var(--txt-2)' }}>Calls used</span>
                <span style={{ fontSize:'12px', fontFamily:'var(--font-mono)', color:'var(--txt-2)' }}>{usage.callsUsed} / {usage.callsLimit}</span>
              </div>
              <div style={{ height:'6px', background:'var(--border-hi)', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(usage.usagePercent,100)}%`, background:usage.usagePercent>90?'var(--red)':usage.usagePercent>70?'var(--amber)':'var(--accent)', borderRadius:'3px' }}/>
              </div>
            </div>
            {usage.plan==='trial' && <p style={{ fontSize:'11px', color:'var(--amber)' }}>Trial ends: {new Date(usage.trialEndsAt).toLocaleDateString()}</p>}
          </div>
          <div className="card" style={{ padding:'20px 22px' }}>
            <p style={{ fontSize:'13px', fontWeight:600, color:'var(--txt)', marginBottom:'16px' }}>Upgrade Plan</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {Object.entries(PLANS).filter(([k])=>k!=='trial').map(([key, plan])=>(
                <div key={key} style={{ border:`1px solid ${usage.plan===key?'var(--accent)':'var(--border)'}`, borderRadius:'9px', padding:'14px', cursor:'pointer', transition:'all .15s',
                  background:usage.plan===key?'var(--accent-faint)':'var(--bg-hover)' }}
                  onClick={async()=>{ if(usage.plan===key)return; await api('/api/billing/upgrade',{method:'POST',body:JSON.stringify({plan:key})}); setUsage({...usage,plan:key,callsLimit:plan.calls}) }}>
                  <p style={{ fontWeight:700, color:'var(--txt)', fontSize:'14px' }}>{plan.name}</p>
                  <p style={{ fontSize:'20px', fontWeight:700, color:'var(--accent)', fontFamily:'var(--font-display)', marginTop:'4px' }}>{plan.price}</p>
                  <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'4px' }}>{plan.calls.toLocaleString()} calls/mo</p>
                  {usage.plan===key && <span className="badge badge-green" style={{ marginTop:'8px', fontSize:'10px' }}>Current</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'5px' }}>{children}</label>
}
