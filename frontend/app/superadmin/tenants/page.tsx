'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Search, ChevronDown, X, Users, Phone, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [plan,    setPlan]    = useState('')
  const [selected,setSelected]= useState<any>(null)
  const [detail,  setDetail]  = useState<any>(null)

  async function load() {
    setLoading(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (plan)   p.set('plan', plan)
    const data = await api<any[]>(`/api/superadmin/tenants?${p}`)
    setTenants(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [search, plan])

  async function openDetail(t: any) {
    setSelected(t)
    const d = await api<any>(`/api/superadmin/tenants/${t.id}`)
    setDetail(d)
  }

  async function updateTenant(id: string, data: any) {
    await api(`/api/superadmin/tenants/${id}`, { method:'PATCH', body: JSON.stringify(data) })
    load()
    setSelected(null); setDetail(null)
  }

  const PLANS = ['trial','starter','pro','enterprise']

  return (
    <div className="animate-slide-up" style={{ maxWidth:'1100px' }}>
      <div style={{ marginBottom:'22px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>All Tenants</h1>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>{tenants.length} businesses on your platform</p>
        </div>
        <button onClick={load} className="btn-secondary" style={{ fontSize:'12px' }}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
        <div style={{ position:'relative', flex:1, maxWidth:'280px' }}>
          <Search size={13} style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…" className="input" style={{ paddingLeft:'32px' }} />
        </div>
        <div style={{ position:'relative' }}>
          <select value={plan} onChange={e => setPlan(e.target.value)} className="input" style={{ width:'150px', appearance:'none', paddingRight:'28px', cursor:'pointer' }}>
            <option value="">All plans</option>
            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} style={{ position:'absolute', right:'9px', top:'50%', transform:'translateY(-50%)', color:'var(--txt-3)', pointerEvents:'none' }} />
        </div>
        {plan && <button onClick={() => setPlan('')} className="btn-ghost" style={{ padding:'6px 8px' }}><X size={13} /></button>}
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'50px', textAlign:'center', color:'var(--txt-2)', fontSize:'13px' }}>Loading…</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead><tr>
                <th>Company</th><th>Plan</th><th>Calls</th>
                <th>Leads</th><th>Users</th><th>Status</th><th>Joined</th><th></th>
              </tr></thead>
              <tbody>
                {tenants.map((t: any) => (
                  <tr key={t.id} onClick={() => openDetail(t)}>
                    <td>
                      <div style={{ fontWeight:500 }}>{t.company_name}</div>
                      <div style={{ fontSize:'11px', color:'var(--txt-3)' }}>{t.industry || t.slug}</div>
                    </td>
                    <td>
                      <span className={`badge ${t.plan==='pro'||t.plan==='enterprise'?'badge-purple':t.plan==='starter'?'badge-blue':'badge-gray'}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color: (+t.calls_used) >= (+t.calls_limit)*0.9 ? 'var(--red)' : 'var(--txt-2)' }}>
                        {t.calls_used}/{t.calls_limit}
                      </div>
                      <div style={{ height:'3px', background:'var(--border)', borderRadius:'2px', marginTop:'3px', width:'60px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100, Math.round((+t.calls_used/+t.calls_limit)*100))}%`, background:'var(--accent)', borderRadius:'2px' }} />
                      </div>
                    </td>
                    <td style={{ fontSize:'12px', color:'var(--txt-2)' }}>{t.lead_count}</td>
                    <td style={{ fontSize:'12px', color:'var(--txt-2)' }}>{t.user_count}</td>
                    <td>
                      <span className={`badge ${t.plan_status==='active'?'badge-green':'badge-red'}`}>{t.plan_status}</span>
                    </td>
                    <td style={{ fontSize:'11px', color:'var(--txt-3)' }}>
                      {formatDistanceToNow(new Date(t.created_at), { addSuffix:true })}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button onClick={() => openDetail(t)} className="btn-ghost" style={{ fontSize:'11px', padding:'3px 8px' }}>Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tenant detail modal */}
      {selected && (
        <div onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setDetail(null) } }}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
          className="animate-fade-in">
          <div className="card animate-slide-up" style={{ width:'100%', maxWidth:'560px', maxHeight:'88vh', overflowY:'auto' }}>
            <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 className="font-display" style={{ fontSize:'16px', fontWeight:600, color:'var(--txt)' }}>{selected.company_name}</h3>
                <p style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'2px' }}>{selected.slug}</p>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null) }} className="btn-ghost" style={{ padding:'5px' }}><X size={15} /></button>
            </div>

            <div style={{ padding:'18px', display:'flex', flexDirection:'column', gap:'16px' }}>
              {/* Plan management */}
              <div>
                <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'10px' }}>Plan Management</p>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                  {PLANS.map(p => (
                    <button key={p} onClick={() => updateTenant(selected.id, { plan: p })}
                      className={selected.plan === p ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize:'12px', padding:'5px 12px', textTransform:'capitalize' }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={() => updateTenant(selected.id, { plan_status: 'active' })}
                    className="btn-primary" style={{ fontSize:'12px', padding:'5px 12px' }}>
                    Activate
                  </button>
                  <button onClick={() => { if (confirm('Suspend this tenant?')) updateTenant(selected.id, { plan_status: 'suspended' }) }}
                    className="btn-danger" style={{ fontSize:'12px', padding:'5px 12px' }}>
                    Suspend
                  </button>
                </div>
              </div>

              {/* Tenant info */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {[
                  { label:'Industry',    value: selected.industry || '—' },
                  { label:'Website',     value: selected.website  || '—' },
                  { label:'Calls Used',  value: `${selected.calls_used}/${selected.calls_limit}` },
                  { label:'Leads',       value: selected.lead_count },
                  { label:'Agents',      value: selected.agent_count },
                  { label:'Team Size',   value: selected.user_count },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'var(--bg-hover)', borderRadius:'7px', padding:'9px 11px' }}>
                    <p style={{ fontSize:'10px', color:'var(--txt-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'3px' }}>{label}</p>
                    <p style={{ fontSize:'13px', color:'var(--txt-2)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Team members */}
              {detail?.users && (
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'8px' }}>Team</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    {detail.users.map((u: any) => (
                      <div key={u.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 11px', background:'var(--bg-hover)', borderRadius:'6px' }}>
                        <div>
                          <span style={{ fontSize:'12px', color:'var(--txt)', fontWeight:500 }}>{u.name}</span>
                          <span style={{ fontSize:'11px', color:'var(--txt-3)', marginLeft:'8px' }}>{u.email}</span>
                        </div>
                        <span className={`badge ${u.role==='owner'?'badge-purple':'badge-gray'}`} style={{ fontSize:'10px' }}>{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agents */}
              {detail?.agents && (
                <div>
                  <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'8px' }}>Agents</p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    {detail.agents.map((a: any) => (
                      <div key={a.id} style={{ display:'flex', justifyContent:'space-between', padding:'8px 11px', background:'var(--bg-hover)', borderRadius:'6px' }}>
                        <span style={{ fontSize:'12px', color:'var(--txt)', fontWeight:500 }}>{a.name} — {a.company_name}</span>
                        <span className={`badge ${a.is_active?'badge-green':'badge-gray'}`} style={{ fontSize:'10px' }}>{a.is_active?'Active':'Inactive'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
