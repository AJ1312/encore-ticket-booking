'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type SeatItem = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  category: string;
  pricePaise: number;
};

export default function VenueLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [venueName, setVenueName] = useState('Venue');

  useEffect(() => {
    let isMounted = true;
    apiJson<{ name: string; seats: SeatItem[] }>(`/admin/venues/${id}`)
      .then(data => {
        if (isMounted) {
          if (data.name) setVenueName(data.name);
          if (data.seats?.length) setSeats(data.seats);
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
    };
  }, [id]);

  const seatCount = seats.length || 48;

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <Link href={`/admin/venues/${id}`} className="back-link">
          <ArrowLeft size={15} /> Venue overview
        </Link>
        <span className="eyebrow">Layout builder / {venueName}</span>
        <h1>Shape the<br /><em>room.</em></h1>

        <div className="layout-builder">
          <div className="layout-stage">STAGE</div>
          <div className="layout-seats">
            {seats.length
              ? seats.map(s => (
                  <span key={s.id} title={`Row ${s.rowLabel}, Seat ${s.seatNumber} (${s.category})`}>
                    {s.rowLabel}{s.seatNumber}
                  </span>
                ))
              : Array.from({ length: 48 }, (_, index) => <span key={index}>{index + 1}</span>)}
          </div>
          <p>{seatCount} total seats · Multi-category seating geometry stored in PostgreSQL.</p>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
