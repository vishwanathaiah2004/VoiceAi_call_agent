'use client'
import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/lib/api'
import { LayoutDashboard, Users, BarChart2, LogOut, Shield } from 'lucide-react'

const NAV = [
  { label:'Platform Overview', href:'/superadmin',           icon:LayoutDashboard },
  { label:'All Tenants',       href:'/superadmin/tenants',   icon:Users },
  { label:'Growth Analytics',  href:'/superadmin/analytics', icon:BarChart2 },
]

function SuperSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  return (
    <aside style={{ position:'fixed', left:0, top:0, height:'100vh', width:'216px', background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:40 }}>
      <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'32px', height:'32px', background:'var(--purple)', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={16} color="#ffffff" />
          </div>
          <div>
            <div className="font-display" style={{ fontSize:'14px', fontWeight:700, color:'var(--txt)' }}>Super Admin</div>
            <div style={{ fontSize:'10px', color:'var(--txt-3)' }}>Platform Owner</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'8px' }}>
        {NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/superadmin' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={`nav-item ${active ? 'nav-item-active' : ''}`}
              style={{ marginBottom:'2px', display:'flex' }}>
              <Icon size={15} />{item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)' }}>
        <p style={{ fontSize:'11px', color:'var(--txt-3)', marginBottom:'7px', padding:'0 2px' }}>{user?.email}</p>
        <button onClick={logout} className="btn-ghost" style={{ width:'100%', justifyContent:'center', padding:'5px', fontSize:'12px' }}>
          <LogOut size={12} /> Sign out
        </button>
      </div>
    </aside>
  )
}

function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!loading && (!user || user.role !== 'superadmin')) router.push('/login')
  }, [user, loading, router])
  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:'32px', height:'32px', borderRadius:'50%', border:'2px solid var(--purple)', borderTopColor:'transparent', animation:'spin .8s linear infinite' }}/></div>
  if (!user || user.role !== 'superadmin') return null
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <SuperSidebar />
      <main className="animate-fade-in" style={{ flex:1, marginLeft:'216px', padding:'28px 32px' }}>
        {children}
      </main>
    </div>
  )
}

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <AuthProvider><Guard>{children}</Guard></AuthProvider>
}
