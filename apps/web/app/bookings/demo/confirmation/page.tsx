'use client';

import Link from 'next/link';
import { Check, Download, Printer, ShieldCheck } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

export default function ConfirmationPage() {
  const params = useParams<{ bookingRef: string }>();
  const [booking, setBooking] = useState<{
    bookingRef: string;
    totalPaise: number;
    eventTitle?: string;
    venue?: string;
    city?: string;
    startsAt?: string;
    qrToken?: string;
    seats?: Array<{ row: string; number: number }>;
  } | null>(null);
  const [error, setError] = useState('');

  const ref = params?.bookingRef;

  useEffect(() => {
    if (ref) {
      void apiJson<{
        bookingRef: string;
        totalPaise: number;
        eventTitle?: string;
        venue?: string;
        city?: string;
        startsAt?: string;
        qrToken?: string;
        seats?: Array<{ row: string; number: number }>;
      }>(`/bookings/${ref}`)
        .then(data => setBooking(data))
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Booking details could not be loaded.');
        });
    }
  }, [ref]);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${booking?.qrToken || ref || 'demo'}`
    : `https://encore-ticket-booking-web.vercel.app/verify/${ref || 'demo'}`;

  return (
    <main className="confirmation-page">
      <PortalNav />
      <section className="confirmation-wrap">
        <div className="confirmation-mark">
          <Check size={26} />
        </div>
        <span className="eyebrow">{error ? 'Booking unavailable' : 'Booking confirmed'}</span>
        <h1>Your ticket<br /><em>is waiting.</em></h1>
        <p className="confirmation-sub">
          {error || 'Your seat booking is confirmed and stored in PostgreSQL. Scan the unique QR ticket at the venue.'}
        </p>

        {booking && (
          <article className="ticket-stub">
            <div>
              <span className="ticket-status" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} color="var(--green)" /> Confirmed & Unique QR Verified
              </span>
              <h2>{booking.eventTitle || 'The Night We Remember'}</h2>
              <p>{booking.venue || 'Riverside Grounds'}, {booking.city || 'Mumbai'} · {booking.startsAt ? new Date(booking.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '28 Aug 2026'}</p>

              <div className="stub-meta">
                <span>
                  <small>Reference</small>
                  {booking.bookingRef}
                </span>
                <span>
                  <small>Total</small>
                  ₹{Math.round(booking.totalPaise / 100).toLocaleString('en-IN')}
                </span>
                <span>
                  <small>Seats</small>
                  {booking.seats ? booking.seats.map(s => `${s.row}${s.number}`).join(', ') : 'Confirmed Seats'}
                </span>
              </div>
            </div>

            <div className="ticket-qr">
              {/* Dynamic QR code image pointing to verify route */}
              <div
                className="qr-grid"
                style={{
                  background: `url("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}") center/cover`,
                  border: '8px solid #1b1917',
                  width: 140,
                  height: 140,
                }}
              />
              <Link
                href={`/verify/${booking.qrToken || ref || 'demo'}`}
                style={{ color: 'var(--peach)', font: '10px var(--mono)', textDecoration: 'underline' }}
              >
                Verify QR Ticket ↗
              </Link>
              <small>REF // {booking.bookingRef}</small>
            </div>
          </article>
        )}

        <div className="confirmation-actions">
          <Link href="/bookings" className="coral-button">
            <Download size={16} /> My bookings history
          </Link>
          <button className="ghost-button" onClick={() => window.print()}>
            <Printer size={16} /> Print ticket receipt
          </button>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
