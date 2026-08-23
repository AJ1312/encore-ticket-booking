'use client';

import Link from 'next/link';
import { ArrowLeft, KeyRound, ShieldCheck, Sparkles, User, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signIn, signUp } from '@/lib/auth';
import type { Session } from '@encore/shared';

function destination(role: string) {
  return role === 'admin' ? '/admin' : role === 'organiser' ? '/organiser' : '/events';
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [next, setNext] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get('next'));
  }, []);

  function fillDemo(email: string, pass = 'SeedPassword123!') {
    setForm(prev => ({ ...prev, email, password: pass }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = (mode === 'login'
        ? await signIn(form.email, form.password)
        : await signUp(form.name, form.email, form.password)) as Session;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('encore_profile', JSON.stringify(session));
      }
      window.location.href = next || destination(session.role);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-back">
        <ArrowLeft size={15} /> Back to Encore
      </Link>
      <div className="auth-brand">
        ENCORE<span>.</span>
      </div>

      <section className="auth-card">
        <span className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the room'}</span>
        <h1>
          {mode === 'login' ? (
            <>
              Enter the<br />
              <em>room.</em>
            </>
          ) : (
            <>
              Make room<br />
              <em>for more.</em>
            </>
          )}
        </h1>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Sign in to keep your tickets, holds, and saved nights together.'
            : 'Create a customer account. Organiser and admin access is provisioned by root admin.'}
        </p>

        {/* 1-Click Demo Accounts for Reviewers */}
        {mode === 'login' && (
          <div style={{ marginBottom: 20, padding: 14, background: '#17191b', border: '1px solid #282b2f', borderRadius: 4 }}>
            <span style={{ display: 'block', fontSize: 11, font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              1-Click Demo Credentials
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillDemo('admin@encore.local')}
                style={{ padding: '5px 10px', background: '#25292e', border: '1px solid #3c424a', color: 'var(--paper)', fontSize: 11, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ShieldCheck size={12} color="var(--green)" /> Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('organiser@encore.local')}
                style={{ padding: '5px 10px', background: '#25292e', border: '1px solid #3c424a', color: 'var(--paper)', fontSize: 11, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Briefcase size={12} color="var(--peach)" /> Organiser
              </button>
              <button
                type="button"
                onClick={() => fillDemo('customer@encore.local')}
                style={{ padding: '5px 10px', background: '#25292e', border: '1px solid #3c424a', color: 'var(--paper)', fontSize: 11, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <User size={12} color="#a0b0a8" /> Customer
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Name
              <input
                required
                placeholder="Aarav Sharma"
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
              />
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={event => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={8}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={event => setForm({ ...form, password: event.target.value })}
            />
          </label>

          {mode === 'login' && (
            <Link className="forgot-link" href="/forgot-password">
              Forgot password?
            </Link>
          )}

          {error && <p className="form-error">{error}</p>}

          <button className="coral-button" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Opening…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>↗</span>
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              New here? <Link href="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already have an account? <Link href="/login">Sign in</Link>
            </>
          )}
        </p>
      </section>

      <p className="auth-note">
        Tickets and holds are assigned after a successful sign in. All sessions are cryptographically verified by PostgreSQL.
      </p>
    </main>
  );
}
