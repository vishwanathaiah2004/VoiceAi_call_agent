'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, useAuth, type Lead, type Stats, interestCls, fmt } from '@/lib/api'
import { Phone, Calendar, TrendingUp, Activity, ChevronRight, Clock, Zap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function Sk({ w=80, h=18 }: { w?: number; h?: number }) {
  return <span className="skeleton" style={{ display:'inline-block', width:`${w}px`, height:`${h}px` }}/>
}

function StatusBadge({ s }: { s: string }) {
  const m: Record<string,string> = { initiated:'badge-blue', calling:'badge-amber', 'in-progress':'badge-green', completed:'badge-gray', failed:'badge-red' }
  return <span className={`badge ${m[s]||'badge-gray'}`}>{s}</span>
}

export default function DashboardPage() {
  const { tenant } = useAuth()
  const [stats,  setStats]  = useState<Stats | null>(null)
  const [leads,  setLeads]  = useState<Lead[]>([])
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    Promise.all([
      api<Stats>('/api/leads/stats'),
      api<{ leads: Lead[] }>('/api/leads?limit=8'),
    ]).then(([s, l]) => { setStats(s); setLeads(l.leads) })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label:'Total Calls',      value:stats?.totalLeads,      icon:Phone,       color:'var(--cyan)',    bg:'rgba(6,182,212,.1)' },
    { label:'Meetings Booked',  value:stats?.meetingsBooked,  icon:Calendar,    color:'var(--accent-light)', bg:'var(--accent-faint)' },
    { label:'High Interest',    value:stats?.highInterest,    icon:TrendingUp,  color:'var(--green)',   bg:'rgba(16,185,129,.1)' },
    { label:'Conversion Rate',  value:stats ? `${stats.conversionRate}%` : null, icon:Activity, color:'var(--amber)', bg:'rgba(245,158,11,.1)' },
  ]

  return (
    <div className="animate-slide-up" style={{ maxWidth:'1080px' }}>
      <div style={{ marginBottom:'26px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>
            Dashboard
          </h1>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/call-lead" className="btn-primary"><Phone size={14}/> New Call</Link>
      </div>

      {/* Trial banner */}
      {tenant?.plan === 'trial' && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(124,58,237,.08)', border:'1px solid rgba(124,58,237,.2)', borderRadius:'12px', padding:'12px 16px', marginBottom:'22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <Zap size={16} style={{ color:'var(--accent-light)' }}/>
            <p style={{ fontSize:'13px', color:'var(--accent-light)' }}>
              You're on a free trial · {tenant.callsLimit - tenant.callsUsed} calls remaining
            </p>
          </div>
          <Link href="/dashboard/settings" className="btn-secondary" style={{ fontSize:'12px', padding:'5px 12px', color:'var(--accent-light)', borderColor:'rgba(124,58,237,.3)' }}>
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'22px' }}>
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="stat-card">
              <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon size={17} style={{ color:c.color }}/>
              </div>
              <div style={{ marginTop:'12px' }}>
                <div className="font-display" style={{ fontSize:'26px', fontWeight:700, color:'var(--txt)', lineHeight:1, letterSpacing:'-.02em' }}>
                  {loading ? <Sk w={50} h={26}/> : (c.value ?? '—')}
                </div>
                <div style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'3px', fontWeight:500 }}>{c.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Today + Quick action */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'22px' }}>
        <div className="card" style={{ padding:'18px 22px' }}>
          <p style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--txt-3)', marginBottom:'12px' }}>Activity</p>
          <div style={{ display:'flex', gap:'28px' }}>
            {[['Calls Today', stats?.callsToday], ['This Week', stats?.callsThisWeek]].map(([l, v]) => (
              <div key={l as string}>
                <div className="font-display" style={{ fontSize:'30px', fontWeight:700, color:'var(--accent-light)', letterSpacing:'-.02em' }}>
                  {loading ? <Sk w={36} h={30}/> : (v ?? 0)}
                </div>
                <div style={{ fontSize:'11px', color:'var(--txt-3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding:'18px 22px', background:'linear-gradient(135deg,var(--bg-card),var(--bg-active))', borderColor:'var(--border-hi)' }}>
          <p style={{ fontSize:'13px', color:'var(--txt-2)', marginBottom:'8px' }}>Scale your outreach instantly</p>
          <p style={{ fontSize:'12px', color:'var(--txt-3)', marginBottom:'14px', lineHeight:'1.6' }}>Upload a CSV and your AI agent calls everyone automatically.</p>
          <div style={{ display:'flex', gap:'8px' }}>
            <Link href="/dashboard/call-lead" className="btn-primary" style={{ fontSize:'12px', padding:'6px 12px' }}><Phone size={12}/> Single Call</Link>
            <Link href="/dashboard/bulk-call" className="btn-secondary" style={{ fontSize:'12px', padding:'6px 12px' }}><Upload size={12}/> Bulk CSV</Link>
          </div>
        </div>
      </div>

      {/* Recent leads */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="font-display" style={{ fontSize:'14px', fontWeight:600, color:'var(--txt)' }}>Recent Leads</h2>
          <Link href="/dashboard/leads" className="btn-ghost" style={{ fontSize:'12px', padding:'3px 9px', gap:'4px' }}>View all <ChevronRight size={12}/></Link>
        </div>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--txt-2)', fontSize:'13px' }}>Loading…</div>
        ) : leads.length === 0 ? (
          <div style={{ padding:'48px', textAlign:'center' }}>
            <Phone size={28} style={{ color:'var(--txt-3)', margin:'0 auto 10px' }}/>
            <p style={{ color:'var(--txt-2)', fontSize:'13px' }}>No calls yet — start by calling your first lead</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Lead</th><th>Agent</th><th>Interest</th><th>Status</th><th>Called</th></tr></thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{l.name || <span style={{ color:'var(--txt-3)', fontStyle:'italic' }}>Unknown</span>}</div>
                    <div style={{ fontSize:'11px', color:'var(--txt-3)' }}>{l.phone}</div>
                  </td>
                  <td style={{ fontSize:'12px', color:'var(--txt-2)' }}>{l.agent_name || '—'}</td>
                  <td><span className={`badge ${interestCls(l.interest_level)}`}>{l.interest_level}</span></td>
                  <td><StatusBadge s={l.call_status}/></td>
                  <td style={{ fontSize:'11px', color:'var(--txt-3)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                      <Clock size={10}/>{formatDistanceToNow(new Date(l.created_at), { addSuffix:true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// need Upload icon
function Upload({ size=16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
