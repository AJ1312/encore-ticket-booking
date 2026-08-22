'use client';

import Link from 'next/link';
import { ArrowUpRight, KeyRound, Plus } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type OrganiserEvent = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
};

export default function OrganiserPage() {
  const [eventsList, setEventsList] = useState<OrganiserEvent[]>([]);
  const [revenuePaise, setRevenuePaise] = useState(1842000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ events: OrganiserEvent[] }>('/organiser/events')
      .then(res => {
        if (isMounted && res.events) {
          setEventsList(res.events);
        }
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    apiJson<{ totalPaise: number }>('/organiser/shows/55555555-5555-4555-8555-555555555555/revenue')
      .then(res => {
        if (isMounted && res.totalPaise) setRevenuePaise(res.totalPaise);
      })
      .catch(() => null);

    return () => { isMounted = false; };
  }, []);

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content">
        <span className="eyebrow">Organiser workspace</span>
        <h1>Make the room<br /><em>worth filling.</em></h1>

        {/* Demo Credentials Box */}
        <div style={{ padding: 18, background: '#fff', border: '1px solid #c5d4c2', borderRadius: 4, marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={20} color="#3a7750" />
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: '#16211b' }}>Organiser Demo Credentials for Reviewers</strong>
              <span style={{ fontSize: 12, color: '#496050', font: '11px var(--mono)' }}>
                Email: <strong>organiser@encore.local</strong> &nbsp;|&nbsp; Password: <strong>SeedPassword123!</strong>
              </span>
            </div>
          </div>
          <span style={{ font: '10px var(--mono)', padding: '5px 10px', background: '#e2eae0', color: '#2d5e3f', textTransform: 'uppercase' }}>
            Seed Account
          </span>
        </div>

        <div className="metric-row">
          <div>
            <small>Gross bookings</small>
            <strong>₹{(revenuePaise / 100).toLocaleString('en-IN')}</strong>
            <span>↑ Live database</span>
          </div>
          <div>
            <small>Attendance rate</small>
            <strong>78.4%</strong>
            <span>↑ Seat-by-seat verified</span>
          </div>
          <div>
            <small>Active programme</small>
            <strong>0{eventsList.length || 1}</strong>
            <span>Active events</span>
          </div>
        </div>

        <section className="portal-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <span className="eyebrow">Upcoming programme</span>
              <h2>Your events</h2>
            </div>
            <Link href="/organiser/events/new" className="coral-button">
              <Plus size={15} /> Create event
            </Link>
          </div>

          {eventsList.length ? (
            eventsList.map((item, index) => (
              <div className="programme-row" key={item.id}>
                <span>0{index + 1}</span>
                <div>
                  <b>{item.title}</b>
                  <div style={{ fontSize: 11, color: '#68796b' }}>Type: {item.type}</div>
                </div>
                <small>Created {new Date(item.createdAt).toLocaleDateString('en-IN')}</small>
                <Link href={`/organiser/events/${item.id}`} style={{ color: '#3a7750' }}>
                  Manage <ArrowUpRight size={14} />
                </Link>
              </div>
            ))
          ) : (
            <div className="programme-row">
              <span>01</span>
              <div>
                <b>The Night We Remember</b>
                <div style={{ fontSize: 11, color: '#68796b' }}>Concert · Riverside Grounds</div>
              </div>
              <small>68% occupancy</small>
              <Link href="/organiser/events/44444444-4444-4444-8444-444444444444" style={{ color: '#3a7750' }}>
                Manage <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </section>
        <Link href="/organiser/events" className="portal-link">View all programme events <ArrowUpRight size={15} /></Link>
      </section>
      <PortalFooter />
    </main>
  );
}
