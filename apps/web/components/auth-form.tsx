'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import type { Session } from '@encore/shared';

function destination(role: string) { return role === 'admin' ? '/admin' : role === 'organiser' ? '/organiser' : '/events'; }
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [next, setNext] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setNext(new URLSearchParams(window.location.search).get('next')), []);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { const session = (mode === 'login' ? await signIn(form.email, form.password) : await signUp(form.name, form.email, form.password)) as Session; window.localStorage.setItem('encore_profile', JSON.stringify(session)); window.location.href = next || destination(session.role); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to continue'); } finally { setBusy(false); } }
  return <main className="auth-page"><Link href="/" className="auth-back"><ArrowLeft size={15}/> Back to Encore</Link><div className="auth-brand">ENCORE<span>.</span></div><section className="auth-card"><span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the room'}</span><h1>{mode === 'login' ? <>Enter the<br/><em>room.</em></> : <>Make room<br/><em>for more.</em></>}</h1><p className="auth-sub">{mode === 'login' ? 'Sign in to keep your tickets, holds, and saved nights together.' : 'Create a customer account. Organiser and admin access is provisioned separately.'}</p><form onSubmit={submit}>{mode === 'register' && <label>Name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>}<label>Email<input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })}/></label><label>Password<input required minLength={8} type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })}/></label>{mode === 'login' && <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>}{error && <p className="form-error">{error}</p>}<button className="coral-button" disabled={busy}>{busy ? 'Opening…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>↗</span></button></form><p className="auth-switch">{mode === 'login' ? <>New here? <Link href="/register">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</p></section><p className="auth-note">Tickets are only assigned after a successful sign in. Your payment provider can be connected without changing this flow.</p></main>;
}
