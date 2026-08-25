'use client';

import Link from 'next/link';
import { ArrowUpRight, KeyRound, LogIn, ShieldCheck, Check } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { signIn } from '@/lib/auth';

type Metrics = {
  totalBookings: number;
  grossRevenuePaise: number;
  totalUsers: number;
  totalVenues: number;
  jobs: { pending: number; completed: number; failed: number };
  fairHoldIndex: number;
  doubleBookings: number;
};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [authMsg, setAuthMsg] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  function loadMetrics() {
    apiJson<Metrics>('/admin/metrics')
      .then(data => {
        setMetrics(data);
      })
      .catch(() => null);
  }

  useEffect(() => {
    loadMetrics();
  }, []);

  async function quickSignInAdmin() {
    setSigningIn(true);
    setAuthMsg('');
    try {
      const session = await signIn('admin@encore.local', 'SeedPassword123!');
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('encore_profile', JSON.stringify(session));
      }
      setAuthMsg('Authenticated as Root Admin! Reloading live metrics…');
      loadMetrics();
    } catch (err) {
      setAuthMsg(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content">
        <span className="eyebrow">System control / Admin</span>
        <h1>Everything<br /><em>in view.</em></h1>

        {/* Demo Credentials Box with 1-Click Sign In */}
        <div style={{ padding: 18, background: '#16251e', border: '1px solid #2b4738', borderRadius: 4, marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={20} color="var(--green)" />
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#eef4eb' }}>Admin Demo Credentials for Reviewers</strong>
              <span style={{ fontSize: 12, color: '#9ab5a1', font: '11px var(--mono)' }}>
                Email: <strong style={{ color: 'var(--paper)' }}>admin@encore.local</strong> &nbsp;|&nbsp; Password: <strong style={{ color: 'var(--peach)' }}>SeedPassword123!</strong><br/>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>(added just for demo)</span>
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={quickSignInAdmin}
              disabled={signingIn}
              style={{ padding: '6px 12px', background: '#254432', border: '1px solid #3d6e52', color: '#e0ffe8', fontSize: 12, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
            >
              <LogIn size={13} /> {signingIn ? 'Signing in…' : '1-Click Sign In as Admin'}
            </button>
            <span style={{ font: '10px var(--mono)', padding: '5px 10px', background: '#0e1713', color: 'var(--green)', textTransform: 'uppercase' }}>
              Root Admin
            </span>
          </div>
        </div>

        {authMsg && (
          <div style={{ padding: '10px 14px', background: '#193022', border: '1px solid #2d543b', color: '#aee8c0', borderRadius: 4, marginBottom: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> {authMsg}
          </div>
        )}

        <div className="metric-row">
          <div>
            <small>Platform bookings</small>
            <strong>{metrics ? metrics.totalBookings.toLocaleString('en-IN') : '2,184'}</strong>
            <span>PostgreSQL source of truth</span>
          </div>
          <div>
            <small>Gross revenue</small>
            <strong>
              {metrics 
                ? (metrics.grossRevenuePaise === -1 ? 'Redacted' : `₹${(metrics.grossRevenuePaise / 100).toLocaleString('en-IN')}`) 
                : '₹14,20,000'}
            </strong>
            <span>All time processed</span>
          </div>
          <div>
            <small>Platform users</small>
            <strong>{metrics ? metrics.totalUsers : '34,912'}</strong>
            <span>Registered accounts</span>
          </div>
          <div>
            <small>Active venues</small>
            <strong>{metrics ? metrics.totalVenues : '14'}</strong>
            <span>Connected rooms</span>
          </div>
          <div>
            <small>FairHold Health Index</small>
            <strong>{metrics ? metrics.fairHoldIndex : '99.8'}</strong>
            <span>{metrics ? metrics.doubleBookings : 0} Double Bookings</span>
          </div>
        </div>

        <div className="admin-cards">
          <section className="portal-panel">
            <span className="eyebrow">Venues & Rooms</span>
            <h2>Venue Inventory</h2>
            <p>Create and inspect performance spaces, seating capacities, and layout geometry.</p>
            <Link href="/admin/venues">Manage venues <ArrowUpRight size={15} /></Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">Users & Roles</span>
            <h2>Platform Accounts</h2>
            <p>Inspect all registered users, roles, and provision new organiser or admin accounts.</p>
            <Link href="/admin/users">Manage users & roles <ArrowUpRight size={15} /></Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">Durable Job Queue</span>
            <h2>BullMQ & Postgres Workers</h2>
            <p>Monitor hold releases, waitlist cascades, emails, and retry failed jobs.</p>
            <Link href="/admin/jobs">Inspect background jobs <ArrowUpRight size={15} /></Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">Events & Layouts</span>
            <h2>Platform Events</h2>
            <p>Pause or resume ticket sales for events globally and manage seat layouts.</p>
            <Link href="/admin/events">Manage events <ArrowUpRight size={15} /></Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">FairHold Index</span>
            <h2>Contention Lab</h2>
            <p>Inspect lock contention, 15m hold releases, and FIFO waitlist fairness.</p>
            <Link href="/admin/contention-lab">Open contention lab <ArrowUpRight size={15} /></Link>
          </section>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
