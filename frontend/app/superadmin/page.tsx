'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Users, Phone, Calendar, TrendingUp, ChevronRight, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PlatformStats {
  totalTenants: number; activeTenants: number; trialTenants: number
  totalUsers: number; totalLeads: number; totalMeetings: number
  callsToday: number; totalCallsMade: number
}

function Sk({ w=60, h=20 }: { w?: number; h?: number }) {
  return <span className="skeleton" style={{ display:'inline-block', width:`${w}px`, height:`${h}px` }} />
}

export default function SuperAdminPage() {
  const [stats,   setStats]   = useState<PlatformStats | null>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api<PlatformStats>('/api/superadmin/stats'),
      api<any[]>('/api/superadmin/tenants'),
    ]).then(([s, t]) => { setStats(s); setTenants(t.slice(0, 8)) })
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label:'Total Tenants',   value: stats?.totalTenants,   sub: `${stats?.trialTenants} on trial`,  color:'var(--purple)', bg:'rgba(177,151,252,.1)' },
    { label:'Active Tenants',  value: stats?.activeTenants,  sub: 'paid accounts',                    color:'var(--accent)', bg:'var(--accent-faint)' },
    { label:'Total Calls Made',value: stats?.totalCallsMade, sub: `${stats?.callsToday} today`,       color:'var(--blue)',   bg:'rgba(77,171,247,.1)' },
    { label:'Meetings Booked', value: stats?.totalMeetings,  sub: 'across all tenants',               color:'var(--amber)',  bg:'rgba(240,160,48,.1)' },
  ]

  return (
    <div className="animate-slide-up" style={{ maxWidth:'1080px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Platform Overview</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>All tenants across your VoiceAgent platform</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
              <TrendingUp size={17} style={{ color:c.color }} />
            </div>
            <div className="font-display" style={{ fontSize:'26px', fontWeight:700, color:'var(--txt)', lineHeight:1, letterSpacing:'-.02em' }}>
              {loading ? <Sk h={26} /> : (c.value?.toLocaleString() ?? '—')}
            </div>
            <div style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'3px' }}>{c.label}</div>
            {c.sub && <div style={{ fontSize:'10px', color:'var(--txt-3)', marginTop:'2px' }}>{loading ? '' : c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent tenants */}
      <div className="card" style={{ overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="font-display" style={{ fontSize:'14px', fontWeight:600, color:'var(--txt)' }}>Recent Tenants</h2>
          <Link href="/superadmin/tenants" className="btn-ghost" style={{ fontSize:'12px', padding:'3px 9px', gap:'4px' }}>
            View all <ChevronRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--txt-2)', fontSize:'13px' }}>Loading…</div>
        ) : tenants.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center' }}>
            <Users size={28} style={{ color:'var(--txt-3)', margin:'0 auto 10px' }} />
            <p style={{ color:'var(--txt-2)', fontSize:'13px' }}>No tenants yet</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr>
              <th>Company</th><th>Plan</th><th>Calls Used</th>
              <th>Leads</th><th>Status</th><th>Joined</th><th></th>
            </tr></thead>
            <tbody>
              {tenants.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight:500 }}>{t.company_name}</div>
                    <div style={{ fontSize:'11px', color:'var(--txt-3)' }}>{t.slug}</div>
                  </td>
                  <td>
                    <span className={`badge ${t.plan==='pro'||t.plan==='enterprise'?'badge-purple':t.plan==='starter'?'badge-blue':'badge-gray'}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'12px' }}>
                    <span style={{ color: t.calls_used >= t.calls_limit * 0.9 ? 'var(--red)' : 'var(--txt-2)' }}>
                      {t.calls_used}/{t.calls_limit}
                    </span>
                  </td>
                  <td style={{ fontSize:'12px', color:'var(--txt-2)' }}>{t.lead_count}</td>
                  <td>
                    <span className={`badge ${t.plan_status==='active'?'badge-green':'badge-red'}`}>{t.plan_status}</span>
                  </td>
                  <td style={{ fontSize:'11px', color:'var(--txt-3)' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                      <Clock size={10} />{formatDistanceToNow(new Date(t.created_at), { addSuffix:true })}
                    </span>
                  </td>
                  <td>
                    <Link href={`/superadmin/tenants`} className="btn-ghost" style={{ fontSize:'11px', padding:'3px 8px' }}>
                      View
                    </Link>
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
