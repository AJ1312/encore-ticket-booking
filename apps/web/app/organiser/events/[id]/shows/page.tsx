'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Plus } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type ShowItem = {
  id: string;
  startsAt: string;
  venue: string;
  city: string;
};

export default function ShowsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [shows, setShows] = useState<ShowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ shows: ShowItem[] }>(`/organiser/events/${id}/shows`)
      .then(res => {
        if (isMounted && res.shows) setShows(res.shows);
      })
      .catch(() => null)
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
        <Link href={`/organiser/events/${id}`} className="back-link">
          <ArrowLeft size={15} /> Event
        </Link>
        <div className="page-toolbar">
          <div>
            <span className="eyebrow">Event / Shows</span>
            <h1>Available<br /><em>times.</em></h1>
          </div>
          <Link href={`/organiser/events/${id}/shows/new`} className="coral-button">
            <Plus size={15} /> New show
          </Link>
        </div>

        <div className="event-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading shows from database…</p>
          ) : shows.length ? (
            shows.map(show => (
              <div className="event-table-row" key={show.id}>
                <span>◌</span>
                <div>
                  <strong>{new Date(show.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(show.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  <small>{show.venue}, {show.city}</small>
                </div>
                <b>On sale</b>
                <Link href={`/shows/${show.id}`}>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            ))
          ) : (
            <div className="event-table-row">
              <span>◌</span>
              <div>
                <strong>28 Aug 2026 · 8:00 PM</strong>
                <small>Riverside Grounds, Mumbai</small>
              </div>
              <b>On sale</b>
              <Link href="/shows/55555555-5555-4555-8555-555555555555">
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
