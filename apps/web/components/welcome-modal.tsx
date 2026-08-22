'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, KeyRound, ShieldAlert, Sparkles } from 'lucide-react';

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
                <span className="eyebrow"><Sparkles size={13} /> Author note & platform guide</span>
                <h1 className="wm-title">
                  Welcome to <em>Encore</em>
                </h1>
                <p className="wm-lede">
                  Ticket booking, but with fewer&nbsp;
                  <span className="wm-highlight">"someone else took your seat"</span>
                  &nbsp;heartbreaks.
                </p>
                <p className="wm-lede" style={{ marginTop: 8 }}>
                  Encore is a real-time ticketing platform built around one idea:{' '}
                  <strong className="wm-strong">
                    Every seat should have a visible, secure, and auditable truth.
                  </strong>
                </p>
              </div>

              <div className="wm-divider" />

              {/* Demo Credentials Box */}
              <section className="wm-section" style={{ background: '#1c1715', padding: 18, border: '1px solid #4a362c', borderRadius: 4, marginBottom: 20 }}>
                <h3 className="wm-h3" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--coral)' }}>
                  <KeyRound size={15} /> Demo Credentials for Reviewers
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

              {/* How to use */}
              <section className="wm-section">
                <h2 className="wm-h2">How to use Encore</h2>

                <h3 className="wm-h3">Customer</h3>
                <ol className="wm-ol">
                  <li>Browse events.</li>
                  <li>Open a show.</li>
                  <li>Select available seats.</li>
                  <li>Seats are held for&nbsp;<strong>15 minutes</strong>.</li>
                  <li>Complete the simulated payment within&nbsp;<strong>10 minutes</strong> (with 10s countdown & cancel option).</li>
                  <li>Receive your booking confirmation and unique QR ticket.</li>
                  <li>Show the QR at the venue.</li>
                  <li>Select the seats being used when checking in.</li>
                </ol>

                <h3 className="wm-h3">Organizer</h3>
                <p className="wm-p">Use the organizer dashboard to:</p>
                <ul className="wm-ul">
                  <li>Create events and shows.</li>
                  <li>Manage venues and seat layouts.</li>
                  <li>Block or reopen seats.</li>
                  <li>View bookings and cancellations.</li>
                  <li>Monitor waitlists.</li>
                  <li>Scan QR tickets.</li>
                  <li>Mark attendees present seat by seat.</li>
                  <li>View occupancy and revenue metrics.</li>
                </ul>

                <h3 className="wm-h3">Admin</h3>
                <p className="wm-p">Use the admin dashboard to control:</p>
                <ul className="wm-ul">
                  <li>All users and roles.</li>
                  <li>All organizers.</li>
                  <li>Events, shows, venues, and seats.</li>
                  <li>Bookings, cancellations, waitlists, and payments.</li>
                  <li>QR attendance.</li>
                  <li>Background jobs and failed emails.</li>
                  <li>Audit logs and platform health.</li>
                </ul>
              </section>

              <div className="wm-divider" />

              {/* Why different */}
              <section className="wm-section">
                <h2 className="wm-h2">Why Encore is different</h2>
                <p className="wm-p">Most ticketing systems stop at "booking confirmed." Encore continues:</p>
                <ul className="wm-ul">
                  <li>A held seat has a real server-side expiry.</li>
                  <li>A cancelled seat is automatically offered to the fairest waitlisted user.</li>
                  <li>Every offer expires and moves to the next user.</li>
                  <li>Every QR ticket is unique and verifiable.</li>
                  <li>Attendance is recorded seat by seat.</li>
                  <li>Double booking is prevented through database transactions.</li>
                  <li>Background work is retryable through Redis and BullMQ.</li>
                  <li>Organizers and admins can see the entire booking journey.</li>
                </ul>
              </section>

              <div className="wm-divider" />

              {/* USP */}
              <section className="wm-section wm-usp">
                <h2 className="wm-h2">Encore Seat Truth</h2>
                <p className="wm-usp-line">
                  <strong>The exact seat, the exact user, the exact time, and the exact status.</strong>
                </p>
                <p className="wm-p wm-italic">
                  "If your seat disappears, don't panic. Someone probably clicked faster. If someone cancels, Encore gives the seat a fair second chance."
                </p>
              </section>

              <div className="wm-divider" />

              {/* Stack */}
              <section className="wm-section">
                <h2 className="wm-h2">Built with</h2>
                <div className="wm-stack">
                  {[
                    'Next.js','NestJS','PostgreSQL','Redis','BullMQ',
                    'Socket.IO','Argon2','Refresh-token rotation',
                    'Role-based access control','Transactional seat locking',
                    'Retryable jobs','QR verification','Attendance auditing',
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
