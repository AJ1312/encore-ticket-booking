'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type VenueDetail = {
  id: string;
  name: string;
  city: string;
  address: string;
  timezone: string;
  seats?: Array<{ id: string }>;
  shows?: Array<{ id: string }>;
};

export default function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<VenueDetail>(`/admin/venues/${id}`)
      .then(data => {
        if (isMounted) setVenue(data);
      })
      .catch(() => {
        if (isMounted) {
          setVenue({
            id,
            name: 'Riverside Grounds',
            city: 'Mumbai',
            address: 'Bandra West, Mumbai',
            timezone: 'Asia/Kolkata',
            seats: Array.from({ length: 72 }),
            shows: Array.from({ length: 1 }),
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <Link href="/admin/venues" className="back-link">
          <ArrowLeft size={15} /> Venues
        </Link>
        <span className="eyebrow">Venue / {id.slice(0, 8)}…</span>
        <h1>
          {venue?.name || 'Venue'}<br />
          <em>Overview.</em>
        </h1>

        <div className="admin-cards">
          <section className="portal-panel">
            <span className="eyebrow">Venue details</span>
            <h2>{venue?.name || 'Riverside Grounds'}</h2>
            <p>
              {venue?.city || 'Mumbai'} · {venue?.address || 'Bandra West'} · {venue?.timezone || 'Asia/Kolkata'} · {venue?.seats?.length || 72} seat inventory
            </p>
            <Link href={`/admin/venues/${id}/layout`}>
              Open layout builder <ArrowUpRight size={15} />
            </Link>
          </section>

          <section className="portal-panel">
            <span className="eyebrow">Upcoming shows</span>
            <h2>{venue?.shows?.length ? `0${venue.shows.length} shows scheduled` : '01 on sale'}</h2>
            <p>The Night We Remember · 28 Aug 2026</p>
            <Link href="/organiser/events">
              View programme <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
