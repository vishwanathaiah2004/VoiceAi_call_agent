'use client'
import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/lib/api'
import { Mic2, Loader2, CheckCircle2 } from 'lucide-react'

const INDUSTRIES = ['SaaS','E-commerce','Real Estate','Healthcare','Finance','Education','Retail','Consulting','Agency','Other']

function RegisterForm() {
  const { signup } = useAuth()
  const [form, setForm] = useState({ companyName:'', name:'', email:'', password:'', industry:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handle(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    try { await signup(form) }
    catch (err: any) { setError(err.message); setLoading(false) }
  }

  const perks = ['14-day free trial — no credit card needed','Your own AI agent with custom name & script','Automatic lead qualification & meeting booking','Full dashboard with analytics']

  return (
    <div style={{ minHeight:'100vh', display:'grid', gridTemplateColumns:'1fr 1fr', background:'var(--bg)' }}>
      {/* Left — branding */}
      <div style={{ padding:'48px', display:'flex', flexDirection:'column', justifyContent:'center', background:'linear-gradient(135deg, var(--bg-card), var(--bg-active))', borderRight:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'48px' }}>
          <div style={{ width:'40px', height:'40px', background:'var(--accent)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Mic2 size={20} color="#070b09"/>
          </div>
          <span className="font-display" style={{ fontSize:'20px', fontWeight:700, color:'var(--txt)' }}>VoiceAgent</span>
        </div>
        <h2 className="font-display" style={{ fontSize:'32px', fontWeight:700, color:'var(--txt)', lineHeight:1.2, marginBottom:'16px', letterSpacing:'-.02em' }}>
          Your AI sales team,<br/>fully automated.
        </h2>
        <p style={{ color:'var(--txt-2)', fontSize:'15px', marginBottom:'36px', lineHeight:1.7 }}>
          Create your AI calling agent in minutes. It qualifies leads, handles objections, and books meetings — while you sleep.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {perks.map(p => (
            <div key={p} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <CheckCircle2 size={16} style={{ color:'var(--accent)', flexShrink:0 }}/>
              <span style={{ fontSize:'13px', color:'var(--txt-2)' }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div style={{ padding:'48px', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="animate-slide-up" style={{ width:'100%', maxWidth:'420px' }}>
          <h2 className="font-display" style={{ fontSize:'22px', fontWeight:700, color:'var(--txt)', marginBottom:'6px' }}>Create your account</h2>
          <p style={{ color:'var(--txt-2)', fontSize:'13px', marginBottom:'28px' }}>Start your 14-day free trial. No credit card required.</p>

          {error && <div style={{ background:'rgba(248,81,73,.1)', border:'1px solid rgba(248,81,73,.3)', borderRadius:'8px', padding:'10px 13px', marginBottom:'16px', fontSize:'13px', color:'var(--red)' }}>{error}</div>}

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
            {[
              { key:'companyName', label:'Company Name', type:'text', placeholder:'Acme Corp' },
              { key:'name',        label:'Your Name',    type:'text', placeholder:'John Smith' },
              { key:'email',       label:'Work Email',   type:'email',placeholder:'john@acme.com' },
              { key:'password',    label:'Password',     type:'password', placeholder:'Min 8 characters' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'5px' }}>{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e=>set(f.key, e.target.value)}
                  required={f.key!=='industry'} minLength={f.key==='password'?8:undefined}
                  placeholder={f.placeholder} className="input" />
              </div>
            ))}

            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', color:'var(--txt-2)', marginBottom:'5px' }}>Industry</label>
              <select value={form.industry} onChange={e=>set('industry',e.target.value)} className="input" style={{ cursor:'pointer' }}>
                <option value="">Select industry (optional)</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading||!form.companyName||!form.name||!form.email||!form.password}
              className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:'14px', marginTop:'4px' }}>
              {loading ? <><Loader2 size={15} className="animate-spin"/>Creating account…</> : 'Create Free Account →'}
            </button>

            <p style={{ fontSize:'11px', color:'var(--txt-3)', textAlign:'center' }}>
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p style={{ textAlign:'center', marginTop:'20px', fontSize:'13px', color:'var(--txt-2)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <AuthProvider><RegisterForm /></AuthProvider>
}
