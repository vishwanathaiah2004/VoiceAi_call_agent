'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/api'
import { Mic2, Eye, EyeOff, Loader2 } from 'lucide-react'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [show,  setShow]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handle(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { role } = await login(email, pass)
      router.push(role === 'superadmin' ? '/superadmin' : '/dashboard')
    } catch (err: any) { setError(err.message); setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', background:'var(--bg)' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', left:'-5%', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(48,209,88,.07) 0%, transparent 70%)', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:'-15%', right:'-5%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle, rgba(48,209,88,.04) 0%, transparent 70%)', filter:'blur(40px)' }} />
      </div>

      <div className="animate-slide-up" style={{ width:'100%', maxWidth:'400px', position:'relative' }}>
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'50px', height:'50px', background:'var(--accent)', borderRadius:'14px', marginBottom:'14px' }}>
            <Mic2 size={24} color="#070b09" />
          </div>
          <h1 className="font-display" style={{ fontSize:'26px', fontWeight:700, color:'var(--txt)', letterSpacing:'-.02em' }}>VoiceAgent</h1>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginTop:'4px' }}>AI Sales Calling Platform</p>
        </div>

        <div className="card" style={{ padding:'28px' }}>
          <h2 className="font-display" style={{ fontSize:'18px', fontWeight:600, marginBottom:'20px', color:'var(--txt)' }}>Sign in</h2>

          {error && <div style={{ background:'rgba(248,81,73,.1)', border:'1px solid rgba(248,81,73,.3)', borderRadius:'8px', padding:'10px 13px', marginBottom:'16px', fontSize:'13px', color:'var(--red)' }}>{error}</div>}

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'6px' }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="input" placeholder="you@company.com" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'6px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} required className="input" placeholder="••••••••" style={{ paddingRight:'40px' }} />
                <button type="button" onClick={()=>setShow(!show)} style={{ position:'absolute', right:'11px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--txt-2)', display:'flex' }}>
                  {show ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading||!email||!pass} className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'11px', fontSize:'14px', marginTop:'4px' }}>
              {loading ? <><Loader2 size={15} className="animate-spin"/>Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', marginTop:'18px', fontSize:'13px', color:'var(--txt-2)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Start free trial</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <AuthProvider><LoginForm /></AuthProvider>
}
