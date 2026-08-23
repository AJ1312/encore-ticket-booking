'use client';

import { useEffect, useState } from 'react';
import { X, KeyRound, Sparkles, Bell, Clock, QrCode, Utensils, ShieldCheck, Check } from 'lucide-react';

const STORAGE_KEY = 'encore_author_note_v3';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!window.sessionStorage.getItem(STORAGE_KEY) && !window.localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      setOpen(true);
    }

    const handleOpen = () => setOpen(true);
    window.addEventListener('open-welcome-modal', handleOpen);
    return () => window.removeEventListener('open-welcome-modal', handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function dismiss() {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function copyText(text: string, label: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  if (!open) return null;

  return (
    <div
      className="wm-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      {/* Backdrop */}
      <div
        className="wm-backdrop"
        onClick={dismiss}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(8, 10, 12, 0.82)',
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal Dialog */}
      <div
        className="wm-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to Encore"
        style={{
          position: 'relative',
          zIndex: 10000,
          background: '#141618',
          border: '1px solid #3d342f',
          borderRadius: 8,
          maxWidth: 680,
          width: '100%',
          maxHeight: 'min(90vh, 90dvh)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Close Button */}
        <button
          className="wm-close"
          onClick={dismiss}
          aria-label="Close author note"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            background: '#231c18',
            border: '1px solid #4a362c',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--peach)',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <X size={15} />
        </button>

        <div className="wm-scroll" style={{ padding: '32px 32px 20px', overflowY: 'auto' }}>
          {/* Header */}
          <div className="wm-header" style={{ marginBottom: 20 }}>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--peach)', fontSize: 11 }}>
              <Sparkles size={13} color="var(--coral)" /> Author note & platform architecture
            </span>
            <h1 className="wm-title" style={{ font: 'clamp(36px, 6vw, 56px) var(--serif)', color: 'var(--paper)', margin: '10px 0 8px', lineHeight: 1.05 }}>
              Welcome to <em>Encore</em>
            </h1>
            <p className="wm-lede" style={{ color: '#c8bdb6', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              High-concurrency ticket booking with zero&nbsp;
              <span className="wm-highlight" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                "someone else took your seat"
              </span>
              &nbsp;heartbreaks.
            </p>
          </div>

          {/* 1-Click Credentials Box */}
          <section style={{ background: '#1c1715', padding: '16px 18px', border: '1px solid #4a362c', borderRadius: 6, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--coral)', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <KeyRound size={14} /> 1-Click Credentials for Reviewers
              </h3>
              {copiedKey && (
                <span style={{ font: '10px var(--mono)', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={12} /> Copied {copiedKey}!
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div
                onClick={() => copyText('organiser@encore.local', 'Organiser email')}
                style={{ background: '#251e1a', padding: 10, borderRadius: 4, border: '1px solid #3c2f27', cursor: 'pointer' }}
              >
                <span style={{ display: 'block', font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase' }}>Organiser</span>
                <span style={{ fontSize: 12, color: 'var(--paper)', display: 'block', marginTop: 2 }}>organiser@encore.local</span>
                <span style={{ fontSize: 11, color: '#9a8f88' }}>Pass: SeedPassword123!</span>
              </div>
              <div
                onClick={() => copyText('admin@encore.local', 'Admin email')}
                style={{ background: '#251e1a', padding: 10, borderRadius: 4, border: '1px solid #3c2f27', cursor: 'pointer' }}
              >
                <span style={{ display: 'block', font: '10px var(--mono)', color: 'var(--green)', textTransform: 'uppercase' }}>Admin</span>
                <span style={{ fontSize: 12, color: 'var(--paper)', display: 'block', marginTop: 2 }}>admin@encore.local</span>
                <span style={{ fontSize: 11, color: '#9a8f88' }}>Pass: SeedPassword123!</span>
              </div>
            </div>
          </section>

          {/* Key Systems */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 4px' }}>
              Engineered Product Architecture
            </h2>

            <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--peach)', fontSize: 13, marginBottom: 4 }}>
                <Clock size={15} color="var(--coral)" /> 15-Minute Real-Time Seat Holds
              </strong>
              <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Upon entering checkout, seats are reserved exclusively for 15 minutes with server-side row locks in PostgreSQL. If the transaction is cancelled or times out, background BullMQ workers release the seats instantly back to the floor.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--peach)', fontSize: 13, marginBottom: 4 }}>
                <Bell size={15} color="var(--coral)" /> Batched 5-User Waitlist Fairness
              </strong>
              <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                When sold-out seats become available due to cancellations, Encore dispatches offers in <strong>priority batches of 5 users</strong> with a <strong>15-minute exclusive booking window</strong> before cascading to the next 5 users in queue.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--peach)', fontSize: 13, marginBottom: 4 }}>
                <Utensils size={15} color="var(--coral)" /> Event-Adapted Dining Floorplans
              </strong>
              <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Dining events replace concert stages with restaurant table reservations (Table for 2, 4, and 6) with multi-table party selection and guest capacity tracking.
              </p>
            </div>

            <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--peach)', fontSize: 13, marginBottom: 4 }}>
                <QrCode size={15} color="var(--coral)" /> Gate QR Verification & Check-In
              </strong>
              <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                Clean admission passes generate standalone QR codes. Venue staff and organisers can scan tickets and mark attendees present seat-by-seat with real-time audit logs.
              </p>
            </div>
          </section>

          {/* Signoff */}
          <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #2c2522', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span style={{ color: 'var(--muted)', font: '11px var(--mono)' }}>Designed & built by</span>
              <strong style={{ display: 'block', color: 'var(--paper)', font: '18px var(--serif)' }}>Ajitesh Sharma</strong>
            </div>
            <span style={{ font: '11px var(--mono)', color: 'var(--peach)' }}>VIT Vellore · Full-Stack Ticketing</span>
          </footer>
        </div>

        {/* Action Button */}
        <div style={{ padding: '14px 32px 20px', background: '#121416', borderTop: '1px solid #282b30' }}>
          <button
            type="button"
            onClick={dismiss}
            className="coral-button"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 12 }}
          >
            Enter Encore & Explore Events →
          </button>
        </div>
      </div>
    </div>
  );
}
