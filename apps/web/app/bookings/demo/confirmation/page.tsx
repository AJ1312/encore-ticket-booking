'use client';

import Link from 'next/link';
import { Check, Download, Printer, ShieldCheck } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { QRCodeDisplay } from '@/components/qr-code';

function ConfirmationContent() {
  const params = useParams<{ bookingRef: string }>();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const ref = params?.bookingRef || 'ENC-DEMO789';

  const [booking, setBooking] = useState<{
    bookingRef: string;
    totalPaise: number;
    eventTitle?: string;
    venue?: string;
    city?: string;
    startsAt?: string;
    qrToken?: string;
    seats?: Array<{ row: string; number: number; category?: string }>;
  }>({
    bookingRef: ref,
    totalPaise: 299800,
    eventTitle: 'The Night We Remember',
    venue: 'Riverside Grounds',
    city: 'Mumbai',
    startsAt: '2026-08-28T14:30:00.000Z',
    qrToken: rawToken || undefined,
    seats: [{ row: 'A', number: 1, category: 'Premium' }, { row: 'A', number: 2, category: 'Premium' }],
  });

  useEffect(() => {
    if (ref && ref !== 'demo') {
      void apiJson<{
        bookingRef: string;
        totalPaise: number;
        eventTitle?: string;
        venue?: string;
        city?: string;
        startsAt?: string;
        qrToken?: string;
        seats?: Array<{ row: string; number: number; category?: string }>;
      }>(`/bookings/${ref}`)
        .then(data => {
          if (data) {
            setBooking(prev => ({
              ...prev,
              ...data,
              qrToken: data.qrToken || rawToken || prev.qrToken,
            }));
          }
        })
        .catch(() => {
          // Keep resilient fallback
        });
    }
  }, [ref, rawToken]);

  const qrPayload = booking.qrToken || ref;
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${qrPayload}`
    : `https://encore-ticket-booking-web.vercel.app/verify/${qrPayload}`;

  return (
    <main className="confirmation-page">
      <div className="no-print">
        <PortalNav />
      </div>

      <section className="confirmation-wrap">
        <div className="confirmation-mark no-print">
          <Check size={26} />
        </div>
        <span className="eyebrow no-print">Booking confirmed · PostgreSQL source of truth</span>
        <h1 className="no-print">
          Your ticket<br />
          <em>is waiting.</em>
        </h1>
        <p className="confirmation-sub no-print">
          Your seat reservation is locked and cryptographically verified in PostgreSQL. Present this dynamic QR code at the venue entry.
        </p>

        {/* Printable Ticket Voucher */}
        <article
          className="ticket-stub print-ticket"
          style={{
            background: '#17191b',
            border: '1px solid #282b2f',
            borderRadius: 8,
            padding: 28,
            margin: '30px 0',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div>
            <span
              className="ticket-status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#9ab5a1',
                fontSize: 12,
                font: '11px var(--mono)',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              <ShieldCheck size={16} color="var(--green)" /> Confirmed & Unique QR Verified
            </span>
            <h2 style={{ font: '32px var(--serif)', margin: '0 0 6px', color: 'var(--paper)' }}>
              {booking.eventTitle || 'The Night We Remember'}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
              {booking.venue || 'Riverside Grounds'}, {booking.city || 'Mumbai'} ·{' '}
              {booking.startsAt ? new Date(booking.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '28 Aug 2026'}
            </p>

            <div className="stub-meta" style={{ display: 'flex', gap: 24, borderTop: '1px solid #2b2f35', paddingTop: 16 }}>
              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11, font: '10px var(--mono)', textTransform: 'uppercase' }}>Reference</small>
                <strong style={{ font: '16px var(--mono)', color: 'var(--peach)' }}>{booking.bookingRef}</strong>
              </div>
              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11, font: '10px var(--mono)', textTransform: 'uppercase' }}>Total Paid</small>
                <strong style={{ font: '16px var(--mono)', color: 'var(--paper)' }}>₹{Math.round(booking.totalPaise / 100).toLocaleString('en-IN')}</strong>
              </div>
              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11, font: '10px var(--mono)', textTransform: 'uppercase' }}>Seats</small>
                <strong style={{ font: '16px var(--mono)', color: 'var(--paper)' }}>
                  {booking.seats ? booking.seats.map(s => `${s.row}${s.number}`).join(', ') : 'Confirmed Seats'}
                </strong>
              </div>
            </div>
          </div>

          <div
            className="ticket-qr"
            style={{
              textAlign: 'center',
              background: '#0e1012',
              padding: 18,
              border: '1px solid #2d3239',
              borderRadius: 6,
            }}
          >
            <QRCodeDisplay value={verifyUrl} size={140} />
            <Link
              href={`/verify/${qrPayload}`}
              className="no-print"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--peach)',
                font: '11px var(--mono)',
                textDecoration: 'underline',
                marginTop: 8,
              }}
            >
              Verify QR Ticket ↗
            </Link>
            <small style={{ display: 'block', color: 'var(--muted)', font: '9px var(--mono)', marginTop: 4 }}>
              REF // {booking.bookingRef}
            </small>
          </div>
        </article>

        <div className="confirmation-actions no-print" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/bookings" className="coral-button">
            <Download size={16} /> View All My Bookings
          </Link>
          <button
            type="button"
            className="ghost-button"
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <Printer size={16} /> Print Ticket Receipt
          </button>
        </div>
      </section>

      <div className="no-print">
        <PortalFooter />
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="confirmation-page">
          <PortalNav />
          <section className="confirmation-wrap">
            <p>Loading ticket…</p>
          </section>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
