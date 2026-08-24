import Link from 'next/link';
import { ArrowLeft, Clock, Bell, QrCode, Cookie, ShieldCheck, Mail } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';

export default function TermsPage() {
  return (
    <main className="customer-site" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <section className="portal-content compact" style={{ maxWidth: 860, margin: '0 auto', padding: '60px 6vw 100px' }}>
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Encore home
        </Link>
        <span className="eyebrow">Policies & Governance</span>
        <h1 style={{ margin: '16px 0 24px', font: 'clamp(44px,6vw,72px) var(--serif)', fontWeight: 400, color: 'var(--paper)' }}>
          Clear terms.<br />
          <em style={{ color: 'var(--peach)' }}>Good nights.</em>
        </h1>

        <div style={{ display: 'grid', gap: 24 }}>
          {/* Platform Invariant */}
          <div className="portal-panel" style={{ background: '#16191c', border: '1px solid #332d29', padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>
              <ShieldCheck size={14} /> Architectural Principle
            </span>
            <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '10px 0 12px' }}>
              Single Source of Truth
            </h2>
            <p style={{ color: '#c0b6af', fontSize: 14, lineHeight: 1.65 }}>
              Encore is built on the invariant that every seat or dining table has exactly one authoritative owner at any moment in time. All seat allocations and state transitions are cryptographically guarded by PostgreSQL row-level locks to eliminate double-booking incidents.
            </p>
          </div>

          {/* 15-Minute Seat Hold Policy */}
          <div className="portal-panel" style={{ background: '#16191c', border: '1px solid #332d29', padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--coral)' }}>
              <Clock size={14} /> 15-Minute FairHold Policy
            </span>
            <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '10px 0 12px' }}>
              Atomic Seat Reservations
            </h2>
            <p style={{ color: '#c0b6af', fontSize: 14, lineHeight: 1.65 }}>
              When you select your seats and enter checkout, those seats are exclusively locked to your account for <strong>15 minutes</strong>. During this window, no other customer can book or claim them. If checkout is cancelled or times out, background BullMQ workers instantly return the seats to available status for the community.
            </p>
          </div>

          {/* Waitlist Policy */}
          <div className="portal-panel" style={{ background: '#16191c', border: '1px solid #332d29', padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--peach)' }}>
              <Bell size={14} /> Fairness Waitlist Dispatcher
            </span>
            <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '10px 0 12px' }}>
              Real-Time Notifications
            </h2>
            <p style={{ color: '#c0b6af', fontSize: 14, lineHeight: 1.65 }}>
              When a sold-out show receives a seat release, Encore sends notifications <strong>immediately</strong> to waitlisted users. Seats are offered on a first-come, first-served basis, creating a fair environment for securing tickets.
            </p>
          </div>

          {/* QR Verification & Gate Admission */}
          <div className="portal-panel" style={{ background: '#16191c', border: '1px solid #332d29', padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--coral)' }}>
              <QrCode size={14} /> Gate Verification & Tickets
            </span>
            <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '10px 0 12px' }}>
              Cryptographic Entry Passes
            </h2>
            <p style={{ color: '#c0b6af', fontSize: 14, lineHeight: 1.65 }}>
              Every confirmed booking generates a unique digital pass with a SHA-256 hashed QR token. Present this pass at venue gates on mobile or printed receipt. Venue staff and organisers can scan the QR code to verify validity and admit guests seat-by-seat with real-time audit logs.
            </p>
          </div>

          {/* Cookie & Privacy Policy */}
          <div className="portal-panel" style={{ background: '#16191c', border: '1px solid #332d29', padding: '32px' }}>
            <span className="eyebrow" style={{ color: 'var(--green)' }}>
              <Cookie size={14} /> Privacy & Cookie Consent
            </span>
            <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '10px 0 12px' }}>
              Essential Session Persistence
            </h2>
            <p style={{ color: '#c0b6af', fontSize: 14, lineHeight: 1.65 }}>
              Encore uses only essential HTTP-only cookies and local storage tokens to preserve your authenticated login session, maintain active seat holds across tabs, and protect against cross-site request forgery. We do not sell user data or employ third-party cross-site advertising trackers.
            </p>
          </div>

          {/* Support */}
          <div className="portal-panel" style={{ background: '#191816', border: '1px solid #4a362c', padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 16 }}>Questions or Venue Inquiries?</strong>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Our concierge team is available around the clock.</p>
            </div>
            <a
              href="mailto:support@encore.local"
              className="coral-button"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Mail size={14} /> Contact Concierge
            </a>
          </div>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
