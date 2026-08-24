'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Plus } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type EventItem = {
  id: string;
  title: string;
  type: string;
  posterUrl?: string;
  createdAt: string;
};

export default function OrganiserEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ events: EventItem[] }>('/organiser/events')
      .then(res => {
        if (isMounted && res.events) setEvents(res.events);
      })
      .catch(() => null)
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/organiser" className="back-link">
            <ArrowLeft size={15} /> Overview
          </Link>
          <Link href="/organiser/events/new" className="coral-button">
            <Plus size={15} /> Create event
          </Link>
        </div>
        <span className="eyebrow">Organiser workspace / Events</span>
        <h1>Your<br /><em>programme.</em></h1>

        <div className="event-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading events from database…</p>
          ) : events.length ? (
            events.map((event, index) => (
              <div className="event-table-row" key={event.id}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{event.title}</strong>
                  <small>Type: {event.type} · Created {new Date(event.createdAt).toLocaleDateString('en-IN')}</small>
                </div>
                <b>On sale</b>
                <Link href={`/organiser/events/${event.id}`}>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            ))
          ) : (
            <p style={{ padding: 20, color: 'var(--muted)' }}>No events on sale yet.</p>
          )}
        </div>
        <Link href="/organiser" className="portal-link">
          Back to overview <ArrowUpRight size={15} />
        </Link>
      </section>
      <PortalFooter />
    </main>
  );
}
