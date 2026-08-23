'use client';

import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type VenueItem = {
  id: string;
  name: string;
  city: string;
  address: string;
  timezone: string;
};

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ venues: VenueItem[] }>('/admin/venues')
      .then(res => {
        if (isMounted && res.venues) setVenues(res.venues);
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
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <div className="page-toolbar">
          <div>
            <span className="eyebrow">System control / Venues</span>
            <h1>Places that<br /><em>hold a night.</em></h1>
          </div>
          <Link href="/admin/venues/new" className="coral-button">
            <Plus size={15} /> Add venue
          </Link>
        </div>

        <div className="event-table admin-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading venues from database…</p>
          ) : venues.length ? (
            venues.map(venue => (
              <div className="event-table-row" key={venue.id}>
                <span>◌</span>
                <div>
                  <strong>{venue.name}</strong>
                  <small>{venue.city} · {venue.address} · {venue.timezone}</small>
                </div>
                <b>Published</b>
                <Link href={`/admin/venues/${venue.id}`}>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            ))
          ) : (
            <div className="event-table-row">
              <span>◌</span>
              <div>
                <strong>Riverside Grounds</strong>
                <small>Mumbai · Bandra West, Mumbai · Asia/Kolkata</small>
              </div>
              <b>Published</b>
              <Link href="/admin/venues/33333333-3333-4333-8333-333333333333">
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
