'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, QrCode, Scan, ShieldCheck, UserCheck, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganiserScannerPage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');

  const SAMPLE_PASSES = [
    { label: 'Sample Pass #1 (Riverside Grounds)', token: '55555555-5555-4555-8555-555555555555' },
    { label: 'Sample Pass #2 (Actually, I’m Fine)', token: '55555555-5555-4555-8555-000000000001' },
    { label: 'Sample Pass #3 (Sunday Social Dining)', token: '55555555-5555-4555-8555-000000000004' },
  ];

  function handleVerify(tokenToVerify?: string) {
    const raw = tokenToVerify || tokenInput.trim();
    if (!raw) {
      setError('Please enter a ticket token or booking reference.');
      return;
    }
    setError('');
    const parts = raw.split('/verify/');
    const token = parts.length > 1 ? parts[1].split('?')[0] : raw;
    router.push(`/verify/${token}`);
  }

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/organiser" className="back-link">
            <ArrowLeft size={15} /> Back to Organiser Workspace
          </Link>
          <span style={{ font: '11px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase' }}>
            Gate Entry & Access Scanner
          </span>
        </div>

        <span className="eyebrow">Venue Gate Operations / Verification</span>
        <h1 style={{ marginBottom: 28 }}>
          Scan attendee<br />
          <em>passes.</em>
        </h1>

        {/* Scanner Viewfinder Box */}
        <div
          style={{
            background: '#131618',
            border: '2px dashed #433832',
            borderRadius: 12,
            padding: '36px 24px',
            textAlign: 'center',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#231c18',
              border: '1px solid var(--coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--peach)',
            }}
          >
            <Scan size={36} />
          </div>

          <div>
            <strong style={{ display: 'block', fontSize: 18, color: 'var(--paper)', fontFamily: 'var(--sans)' }}>
              Optical QR Code Scanner Ready
            </strong>
            <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 440, margin: '6px auto 0' }}>
              Position the customer’s secure QR code within camera range or enter the pass token below to grant admission.
            </p>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleVerify();
            }}
            style={{ width: '100%', maxWidth: 460, display: 'flex', gap: 10, marginTop: 8 }}
          >
            <input
              type="text"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Paste QR token, URL or Booking Ref…"
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#0d1012',
                border: '1px solid #433832',
                color: 'var(--paper)',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'var(--mono)',
              }}
            />
            <button
              type="submit"
              className="coral-button"
              style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Verify Pass →
            </button>
          </form>

          {error && (
            <p style={{ color: '#ff927e', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        {/* Quick Demo Passes */}
        <div style={{ background: '#171a1c', border: '1px solid #332b26', borderRadius: 8, padding: 24 }}>
          <span className="eyebrow" style={{ color: 'var(--peach)' }}>Reviewer & Staff Quick Simulation</span>
          <h3 style={{ font: '18px var(--serif)', color: 'var(--paper)', margin: '4px 0 12px' }}>
            Instant Test Passes
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 16px' }}>
            Click any test token below to simulate scanning a live attendee ticket pass:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SAMPLE_PASSES.map(pass => (
              <button
                key={pass.token}
                type="button"
                onClick={() => handleVerify(pass.token)}
                style={{
                  padding: '12px 16px',
                  background: '#111416',
                  border: '1px solid #3d342f',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 13 }}>{pass.label}</strong>
                  <span style={{ fontSize: 11, font: '11px var(--mono)', color: '#8d7f77' }}>Token: {pass.token}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--peach)', fontWeight: 500 }}>Scan & Verify →</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
