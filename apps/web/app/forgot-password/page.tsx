'use client';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { apiJson } from '@/lib/api';
import { useTurnstile } from '@/hooks/use-turnstile';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const { containerRef, getToken } = useTurnstile('forgot-password');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const turnstileToken = getToken();
    if (!turnstileToken) {
      setError('Please complete the security check before continuing.');
      return;
    }
    try {
      const result = await apiJson<{ ok: boolean; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, 'cf-turnstile-response': turnstileToken }),
      });
      setDevToken(result.resetToken || '');
      setSent(true);
    } catch {
      setError('Unable to start password recovery.');
    }
  }

  return (
    <main className="auth-page">
      <Link href="/login" className="auth-back"><ArrowLeft size={15} /> Back to sign in</Link>
      <div className="auth-brand">ENCORE<span>.</span></div>
      <section className="auth-card">
        {sent ? (
          <>
            <span className="eyebrow">Check your inbox</span>
            <h1>Link<br /><em>sent.</em></h1>
            <p className="auth-sub">If an account exists for that email, a reset link has been created.</p>
            {devToken && (
              <p className="auth-sub">
                <Link href={`/reset-password/${devToken}`}>Open local development reset link</Link>
              </p>
            )}
          </>
        ) : (
          <>
            <span className="eyebrow">Account recovery</span>
            <h1>Find your<br /><em>way back.</em></h1>
            <p className="auth-sub">Enter your email and we&apos;ll send a secure reset link.</p>
            <form onSubmit={submit}>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              {/* Cloudflare Turnstile challenge — required before submit */}
              <div ref={containerRef} style={{ margin: '12px 0' }} />
              <button className="coral-button"><Mail size={15} /> Send reset link</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
