'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

export default function SuperAnalyticsPage() {
  const [growth, setGrowth] = useState<any[]>([])
  const [stats,  setStats]  = useState<any>(null)
  const [loading,setLoading]= useState(true)

  useEffect(() => {
    Promise.all([
      api<any>('/api/superadmin/stats'),
      api<any[]>('/api/superadmin/growth'),
    ]).then(([s, g]) => {
      setStats(s)
      setGrowth(g.map(d => ({ ...d, date: format(new Date(d.date), 'MMM d'), signups: +d.signups })))
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-slide-up" style={{ maxWidth:'900px' }}>
      <div style={{ marginBottom:'26px' }}>
        <h1 className="font-display" style={{ fontSize:'24px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>Growth Analytics</h1>
        <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'3px' }}>Platform-wide performance overview</p>
      </div>

      {/* Platform stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'22px' }}>
        {[
          { label:'Total Tenants',  value: stats?.totalTenants,   color:'var(--purple)' },
          { label:'Total Users',    value: stats?.totalUsers,     color:'var(--blue)' },
          { label:'Total Calls',    value: stats?.totalCallsMade, color:'var(--accent)' },
          { label:'Total Meetings', value: stats?.totalMeetings,  color:'var(--amber)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'16px 18px' }}>
            <div className="font-display" style={{ fontSize:'26px', fontWeight:700, color:c.color, letterSpacing:'-.02em' }}>
              {loading ? '—' : (c.value?.toLocaleString() ?? '—')}
            </div>
            <div style={{ fontSize:'11px', color:'var(--txt-3)', marginTop:'2px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Signup growth chart */}
      <div className="card" style={{ padding:'20px 24px' }}>
        <p className="font-display" style={{ fontSize:'14px', fontWeight:600, color:'var(--txt)', marginBottom:'20px' }}>
          New Signups — Last 30 Days
        </p>
        {loading ? (
          <div style={{ height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:'12px' }}>Loading…</div>
        ) : growth.length === 0 ? (
          <div style={{ height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--txt-3)', fontSize:'12px' }}>No signup data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--purple)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill:'var(--txt-3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--txt-3)', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px', fontSize:'12px' }} />
              <Area type="monotone" dataKey="signups" stroke="var(--purple)" fill="url(#gs)" name="Signups" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
