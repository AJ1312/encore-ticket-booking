'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, KeyRound, ShieldAlert, Sparkles, Bell, Clock, QrCode } from 'lucide-react';

const STORAGE_KEY = 'encore_welcome_dismissed';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }

    const handleOpen = () => setOpen(true);
    window.addEventListener('open-welcome-modal', handleOpen);
    return () => window.removeEventListener('open-welcome-modal', handleOpen);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="wm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismiss}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className="wm-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Encore"
            initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close */}
            <button className="wm-close" onClick={dismiss} aria-label="Close author note">
              <X size={16} />
            </button>

            <div className="wm-scroll">
              {/* Header */}
              <div className="wm-header">
                <span className="eyebrow"><Sparkles size={13} /> Author note & platform architecture</span>
                <h1 className="wm-title">
                  Welcome to <em>Encore</em>
                </h1>
                <p className="wm-lede">
                  Ticket booking, but with fewer&nbsp;
                  <span className="wm-highlight">"someone else took your seat"</span>
                  &nbsp;heartbreaks.
                </p>
                <p className="wm-lede" style={{ marginTop: 8 }}>
                  Encore is an industry-grade real-time ticketing platform built around one foundational principle:{' '}
                  <strong className="wm-strong">
                    Every seat should have a single, verifiable source of truth.
                  </strong>
                </p>
              </div>

              <div className="wm-divider" />

              {/* Demo Credentials Box */}
              <section className="wm-section" style={{ background: '#1c1715', padding: 18, border: '1px solid #4a362c', borderRadius: 4, marginBottom: 20 }}>
                <h3 className="wm-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--coral)' }}>
                  <KeyRound size={15} /> 1-Click Credentials for Reviewers
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 12 }}>
                  <div className="wm-creds" style={{ margin: 0 }}>
                    <span className="wm-cred-label">Organizer demo</span>
                    <span>Email: <strong style={{ color: 'var(--paper)' }}>organiser@encore.local</strong></span>
                    <span>Password: <strong style={{ color: 'var(--peach)' }}>SeedPassword123!</strong></span>
                  </div>
                  <div className="wm-creds" style={{ margin: 0 }}>
                    <span className="wm-cred-label">Admin demo</span>
                    <span>Email: <strong style={{ color: 'var(--paper)' }}>admin@encore.local</strong></span>
                    <span>Password: <strong style={{ color: 'var(--peach)' }}>SeedPassword123!</strong></span>
                  </div>
                </div>
              </section>

              {/* Key Features & Architecture */}
              <section className="wm-section">
                <h2 className="wm-h2">Key Systems & Architecture</h2>

                <h3 className="wm-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="var(--peach)" /> 15-Minute Dynamic Seat Holds
                </h3>
                <p className="wm-p">
                  When a customer enters checkout, seats are reserved exclusively for <strong>15 minutes</strong> with server-side row locks. If payment is not completed or the user cancels, background workers immediately release the seats back to available for everyone.
                </p>

                <h3 className="wm-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={14} color="var(--peach)" /> Batched Waitlist Fairness Dispatcher
                </h3>
                <p className="wm-p">
                  For sold-out shows or popular tiers, users can join the waitlist with one click. When someone cancels a booking or a hold expires, Encore sends notifications in <strong>priority batches of 5 users</strong>. Each batch receives an exclusive <strong>15-minute claim window</strong> before automatically cascading to the next 5 users.
                </p>

                <h3 className="wm-h3" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <QrCode size={14} color="var(--peach)" /> Cryptographic QR Tickets & Gate Check-in
                </h3>
                <p className="wm-p">
                  Every confirmed booking generates a unique, standalone QR ticket voucher with print-ready receipt formatting. Organizers and venue staff can scan the QR code to verify validity and mark attendees present seat-by-seat with real-time audit logs.
                </p>

                <h3 className="wm-h3">Organizer & Admin Governance</h3>
                <ul className="wm-ul">
                  <li><strong>Admin Portal:</strong> Provision new organizers, dynamically modify user roles, inspect jobs, and simulate high-concurrency seat contention.</li>
                  <li><strong>Organizer Portal:</strong> Publish multi-city events, manage interactive seat layouts, monitor real-time sales, and scan attendee tickets.</li>
                </ul>
              </section>

              <div className="wm-divider" />

              {/* Stack */}
              <section className="wm-section">
                <h2 className="wm-h2">Built with</h2>
                <div className="wm-stack">
                  {[
                    'Next.js 16','NestJS','PostgreSQL','Redis','BullMQ',
                    'Socket.IO','Argon2 Password Hashing','Bearer & Cookie Auth',
                    'RBAC Roles','Batched 5-User Waitlist','QR Verification','Seat-by-Seat Check-in',
                  ].map((t) => (
                    <span key={t} className="wm-tag">{t}</span>
                  ))}
                </div>
              </section>

              <div className="wm-divider" />

              {/* Sign off */}
              <footer className="wm-footer">
                <p className="wm-p"><strong>Signing off,</strong></p>
                <p className="wm-signoff">Ajitesh Sharma</p>
                <p className="wm-from">Coding from VIT Vellore</p>
              </footer>
            </div>

            {/* Sticky dismiss */}
            <div className="wm-actions">
              <button className="coral-button wm-dismiss" onClick={dismiss}>
                Got it — let me in&nbsp;→
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
