'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/lib/api'
import { LayoutDashboard, Phone, Upload, Users, Calendar, BarChart2, Settings, LogOut, BrainCircuit, ChevronRight, Zap } from 'lucide-react'

const NAV = [
  { label:'Overview',     href:'/dashboard',              icon:LayoutDashboard },
  { label:'Call Lead',    href:'/dashboard/call-lead',    icon:Phone },
  { label:'Bulk Call',    href:'/dashboard/bulk-call',    icon:Upload },
  { label:'All Leads',    href:'/dashboard/leads',        icon:Users },
  { label:'Meetings',     href:'/dashboard/meetings',     icon:Calendar },
  { label:'Analytics',    href:'/dashboard/analytics',    icon:BarChart2 },
  { label:'Agent Setup',  href:'/dashboard/agent-setup',  icon:Zap },
  { label:'Settings',     href:'/dashboard/settings',     icon:Settings },
]

function Sidebar() {
  const { user, tenant, logout } = useAuth()
  const pathname = usePathname()
  const usagePercent = tenant ? Math.round((tenant.callsUsed / tenant.callsLimit) * 100) : 0

  return (
    <aside style={{ position:'fixed', left:0, top:0, height:'100vh', width:'216px', background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:40 }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'32px', height:'32px', background:'var(--accent)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <BrainCircuit size={16} color="#ffffff"/>
          </div>
          <div style={{ overflow:'hidden' }}>
            <div className="font-display" style={{ fontSize:'15px', fontWeight:700, color:'var(--txt)', lineHeight:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {tenant?.companyName || 'CallMind'}
            </div>
            <div style={{ fontSize:'10px', color:'var(--txt-3)', marginTop:'2px', textTransform:'capitalize' }}>{tenant?.plan} plan</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ padding:'9px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
          <span style={{ position:'relative', display:'inline-flex', width:'7px', height:'7px' }}>
            <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'var(--accent)', opacity:.5, animation:'pulse-ring 2s infinite' }}/>
            <span style={{ position:'relative', borderRadius:'50%', background:'var(--accent)', width:'7px', height:'7px', display:'block' }}/>
          </span>
          <span style={{ fontSize:'11px', color:'var(--txt-2)' }}>Agent online</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
        {NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              style={{ marginBottom:'1px', display:'flex' }}>
              <Icon size={15} style={{ flexShrink:0 }}/>
              <span>{item.label}</span>
              {active && <ChevronRight size={13} style={{ marginLeft:'auto', opacity:.4 }}/>}
            </Link>
          )
        })}
      </nav>

      {/* Usage bar */}
      {tenant && (
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
            <span style={{ fontSize:'10px', color:'var(--txt-3)' }}>Calls used</span>
            <span style={{ fontSize:'10px', color:'var(--txt-2)', fontFamily:'var(--font-mono)' }}>{tenant.callsUsed}/{tenant.callsLimit}</span>
          </div>
          <div style={{ height:'4px', background:'var(--border-hi)', borderRadius:'2px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(usagePercent,100)}%`, background: usagePercent>90?'var(--red)':usagePercent>70?'var(--amber)':'var(--accent-light)', borderRadius:'2px', transition:'width .3s' }}/>
          </div>
          {usagePercent > 80 && (
            <Link href="/dashboard/settings" style={{ display:'block', marginTop:'6px', fontSize:'10px', color:'var(--accent-light)', textDecoration:'none' }}>
              ⚡ Upgrade plan →
            </Link>
          )}
        </div>
      )}

      {/* User */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'7px' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'var(--accent-faint)', border:'1px solid rgba(124,58,237,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'var(--accent-light)', flexShrink:0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'var(--txt)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize:'10px', color:'var(--txt-3)', textTransform:'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost" style={{ width:'100%', justifyContent:'center', padding:'5px', fontSize:'12px' }}>
          <LogOut size={12}/> Sign out
        </button>
      </div>
    </aside>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!loading && !user) router.push('/login') }, [user, loading, router])
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'2px solid var(--accent)', borderTopColor:'transparent', animation:'spin .8s linear infinite' }}/>
    </div>
  )
  if (!user) return null
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar/>
      <main className="animate-fade-in" style={{ flex:1, marginLeft:'216px', padding:'28px 32px', overflow:'hidden' }}>
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><Guard>{children}</Guard></AuthProvider>
}
