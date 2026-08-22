'use client';

import Link from 'next/link';
import { ArrowUpRight, KeyRound, ShieldCheck, Server, Users, Activity } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';

export default function AdminPage() {
  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content">
        <span className="eyebrow">System control / Admin</span>
        <h1>Everything<br /><em>in view.</em></h1>

        {/* Demo Credentials Box */}
        <div style={{ padding: 18, background: '#16251e', border: '1px solid #2b4738', borderRadius: 4, marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={20} color="var(--green)" />
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#eef4eb' }}>Admin Demo Credentials for Reviewers</strong>
              <span style={{ fontSize: 12, color: '#9ab5a1', font: '11px var(--mono)' }}>
                Email: <strong style={{ color: 'var(--paper)' }}>admin@encore.local</strong> &nbsp;|&nbsp; Password: <strong style={{ color: 'var(--peach)' }}>SeedPassword123!</strong>
              </span>
            </div>
          </div>
          <span style={{ font: '10px var(--mono)', padding: '5px 10px', background: '#0e1713', color: 'var(--green)', textTransform: 'uppercase' }}>
            Root Admin
          </span>
        </div>

        <div className="metric-row">
          <div>
            <small>Platform bookings</small>
            <strong>2,184</strong>
            <span>Last 30 days</span>
          </div>
          <div>
            <small>Active venues</small>
            <strong>14</strong>
            <span>3 pending review</span>
          </div>
          <div>
            <small>FairHold Health Index</small>
            <strong>99.8</strong>
            <span>0 Double Bookings</span>
          </div>
        </div>

        <div className="admin-cards">
          <section className="portal-panel">
            <span className="eyebrow">Users & Roles</span>
            <h2>Platform Accounts</h2>
            <p>Inspect all registered users, roles, and session refreshes across the platform.</p>
            <Link href="/admin/users">Manage users & roles <ArrowUpRight size={15} /></Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">Durable Job Queue</span>
            <h2>BullMQ & Postgres Workers</h2>
            <p>Monitor hold releases, waitlist cascades, emails, and retry failed jobs.</p>
            <Link href="/admin/jobs">Inspect background jobs <ArrowUpRight size={15} /></Link>
          </section>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
