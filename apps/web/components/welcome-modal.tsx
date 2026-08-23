'use client';

import { useEffect, useState } from 'react';
import { X, KeyRound, Sparkles, Bell, Clock, QrCode, Utensils, ShieldCheck, Check, Server, Layers, Cpu, Database } from 'lucide-react';

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
          maxWidth: 720,
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
            <h1 className="wm-title" style={{ font: 'clamp(34px, 5.5vw, 52px) var(--serif)', color: 'var(--paper)', margin: '10px 0 8px', lineHeight: 1.05 }}>
              Welcome to <em>Encore</em>
            </h1>
            <p className="wm-lede" style={{ color: '#c8bdb6', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              High-concurrency ticket booking with zero&nbsp;
              <span className="wm-highlight" style={{ color: 'var(--coral)', fontWeight: 600 }}>
                "someone else took your seat"
              </span>
              &nbsp;heartbreaks. Built on atomic row locks and real-time event streaming.
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

          {/* System Design In Short */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={18} color="var(--peach)" /> System Design In Short
            </h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
                <strong style={{ color: 'var(--peach)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Database size={13} color="var(--green)" /> Concurrency & Single Source of Truth
                </strong>
                <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  Guarded by PostgreSQL transactional row locks (<code>FOR UPDATE SKIP LOCKED</code>) and compound unique keys <code>(show_id, seat_id)</code> to eliminate race conditions and double-booking incidents.
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
                <strong style={{ color: 'var(--peach)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Clock size={13} color="var(--coral)" /> 15-Minute Dynamic Holds & Async BullMQ
                </strong>
                <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  Upon entering checkout, seats lock exclusively for 15 minutes. If a user cancels or times out, background BullMQ workers instantly free the seats back to available.
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
                <strong style={{ color: 'var(--peach)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Bell size={13} color="var(--coral)" /> Batched 5-User Fair Waitlist Dispatcher
                </strong>
                <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  When seats open up, notifications trigger in <strong>batches of 5 users</strong> with a <strong>15-minute priority claim countdown</strong> before cascading to subsequent users in FIFO queue.
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 6 }}>
                <strong style={{ color: 'var(--peach)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <QrCode size={13} color="var(--green)" /> SHA-256 Gate QR Passes & Check-In
                </strong>
                <p style={{ color: '#b0a69f', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  Confirmed bookings generate standalone QR passes. Venue staff can scan passes on mobile/desktop and check in attendees seat-by-seat with real-time audit logging.
                </p>
              </div>
            </div>
          </section>

          {/* Full Tech Stack In Short */}
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color="var(--peach)" /> Tech Stack In Short
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <div style={{ padding: '10px 12px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 4 }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase' }}>Frontend</span>
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 12, marginTop: 2 }}>Next.js 16 + Turbopack</strong>
                <small style={{ color: '#8d827c', fontSize: 11 }}>App Router, SSR/SSG, React 19, Lucide</small>
              </div>
              <div style={{ padding: '10px 12px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 4 }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--green)', textTransform: 'uppercase' }}>Backend API</span>
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 12, marginTop: 2 }}>NestJS + TypeScript</strong>
                <small style={{ color: '#8d827c', fontSize: 11 }}>Drizzle ORM, Zod, Throttling Guard</small>
              </div>
              <div style={{ padding: '10px 12px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 4 }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--coral)', textTransform: 'uppercase' }}>Database & Queue</span>
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 12, marginTop: 2 }}>PostgreSQL + BullMQ</strong>
                <small style={{ color: '#8d827c', fontSize: 11 }}>Redis, ACID Locks, Async Workers</small>
              </div>
              <div style={{ padding: '10px 12px', background: '#181b1e', border: '1px solid #282c32', borderRadius: 4 }}>
                <span style={{ font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase' }}>Real-time & Security</span>
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 12, marginTop: 2 }}>Socket.IO + Argon2id</strong>
                <small style={{ color: '#8d827c', fontSize: 11 }}>JWT, SHA-256 Tokens, RBAC</small>
              </div>
            </div>
          </section>

          {/* Signoff */}
          <footer style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #2c2522', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
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
