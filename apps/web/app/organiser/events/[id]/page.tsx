'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  type: string;
  posterUrl: string;
};

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<EventDetail>(`/organiser/events/${id}`)
      .then(data => {
        if (isMounted) setEvent(data);
      })
      .catch(() => {
        // Ignore or handle
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <Link href="/organiser/events" className="back-link">
          <ArrowLeft size={15} /> Events
        </Link>
        <span className="eyebrow">Organiser / Event {id.slice(0, 8)}…</span>
        <h1>
          {event?.title || 'Event'}<br />
          <em>Management.</em>
        </h1>

        <div className="admin-cards">
          <section className="portal-panel">
            <span className="eyebrow">Event details</span>
            <h2>{event?.title || 'Event Details'}</h2>
            <p>{event?.description || 'Open-air live set.'}</p>
            <div style={{ marginTop: 12, fontSize: 12, color: '#68796b' }}>
              Type: {event?.type}
            </div>
            <Link href={`/organiser/events/${id}/shows`} style={{ marginTop: 16 }}>
              Manage shows & seat inventory <ArrowUpRight size={15} />
            </Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">FairHold Index</span>
            <h2>Contention & Capacity</h2>
            <p>0 double bookings, PostgreSQL transactional row locking, and real-time waitlist cascades.</p>
            <Link href="/admin/contention-lab">
              Open contention lab <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
