'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('va_token') : null
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  })
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('va_token'); localStorage.removeItem('va_user'); localStorage.removeItem('va_tenant')
      window.location.href = '/login'
    }
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface User   { id: string; name: string; email: string; role: string }
export interface Tenant {
  id: string; companyName: string; slug: string
  plan: string; planStatus: string
  callsUsed: number; callsLimit: number; trialEndsAt: string
}
export interface Agent {
  id: string; tenant_id: string; name: string; company_name: string
  voice_id: string; voice_provider: string; language: string
  greeting: string; objective: string; qualifying_questions: string
  offer_text: string; calendar_pitch: string; fallback_message: string
  vapi_phone_number_id: string | null; sales_email: string | null
  google_calendar_enabled: boolean; is_active: boolean
  google_client_id: string | null; google_client_secret: string | null
  google_refresh_token: string | null
  created_at: string
}
export interface Lead {
  id: string; tenant_id: string; agent_id: string | null; agent_name?: string
  phone: string; name: string | null; email: string | null; business_type: string | null
  interest_level: 'high'|'medium'|'low'|'none'|'unknown'
  meeting_booked: boolean; meeting_time: string | null
  call_status: 'initiated'|'calling'|'in-progress'|'completed'|'failed'
  transcript: string | null; call_summary: string | null
  call_duration_seconds: number | null; recording_url: string | null
  calendar_event_link: string | null; vapi_call_id: string | null
  created_at: string
}
export interface Stats {
  totalLeads: number; meetingsBooked: number; highInterest: number
  callsToday: number; callsThisWeek: number; completedCalls: number; conversionRate: number
}

interface AuthCtx {
  user: User | null; tenant: Tenant | null
  login: (email: string, password: string) => Promise<{ role: string }>
  signup: (data: SignupData) => Promise<void>
  logout: () => void; loading: boolean
  setTenant: (t: Tenant) => void
}
export interface SignupData { companyName: string; name: string; email: string; password: string; industry?: string }

const Ctx = createContext<AuthCtx>({ user:null, tenant:null, login:async()=>({role:''}), signup:async()=>{}, logout:()=>{}, loading:true, setTenant:()=>{} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,   setUser]   = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading,setLoading]= useState(true)
  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem('va_user')
    const t = localStorage.getItem('va_tenant')
    const tk= localStorage.getItem('va_token')
    if (u && tk) setUser(JSON.parse(u))
    if (t)       setTenant(JSON.parse(t))
    setLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const d = await api<{ token: string; user: User; tenant: Tenant | null }>('/api/auth/login', {
      method:'POST', body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('va_token',  d.token)
    localStorage.setItem('va_user',   JSON.stringify(d.user))
    if (d.tenant) localStorage.setItem('va_tenant', JSON.stringify(d.tenant))
    setUser(d.user); if (d.tenant) setTenant(d.tenant)
    return { role: d.user.role }
  }

  async function signup(data: SignupData) {
    const d = await api<{ token: string; user: User; tenant: Tenant }>('/api/auth/signup', {
      method:'POST', body: JSON.stringify(data),
    })
    localStorage.setItem('va_token',  d.token)
    localStorage.setItem('va_user',   JSON.stringify(d.user))
    localStorage.setItem('va_tenant', JSON.stringify(d.tenant))
    setUser(d.user); setTenant(d.tenant)
    router.push('/dashboard/agent-setup')
  }

  function logout() {
    localStorage.removeItem('va_token'); localStorage.removeItem('va_user'); localStorage.removeItem('va_tenant')
    setUser(null); setTenant(null); router.push('/login')
  }

  return <Ctx.Provider value={{ user, tenant, login, signup, logout, loading, setTenant }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

// Helpers
export const fmt = (n: number | null) => { if (!n) return '—'; return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}` }
export const interestCls = (l: string) => l==='high'?'badge-green':l==='medium'?'badge-amber':l==='low'?'badge-red':'badge-gray'
