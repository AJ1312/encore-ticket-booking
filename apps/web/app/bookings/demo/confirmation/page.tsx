'use client';

import Link from 'next/link';
import { Check, Download, Printer, ShieldCheck, Calendar, Clock, MapPin, Ticket, Sparkles, ArrowRight } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { QRCodeDisplay } from '@/components/qr-code';
import { AuthForm } from '@/components/auth-form';


function ConfirmationContent() {
  const params = useParams<{ bookingRef: string }>();
  const searchParams = useSearchParams();
  const rawToken = searchParams.get('token');
  const showIdQuery = searchParams.get('showId');
  const ref = params?.bookingRef || 'ENC-55F9CA50';

  const [booking, setBooking] = useState<{
    bookingRef: string;
    totalPaise: number;
    eventTitle?: string;
    venue?: string;
    city?: string;
    startsAt?: string;
    qrToken?: string;
    customerName?: string;
    seats?: Array<{ row: string; number: number; category?: string }>;
  }>({
    bookingRef: ref,
    totalPaise: 0,
    eventTitle: 'Loading event details...',
    venue: 'Loading venue...',
    city: '',
    startsAt: undefined,
    customerName: 'Loading attendee...',
    qrToken: rawToken || undefined,
    seats: [],
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
        customerName?: string;
        seats?: Array<{ row: string; number: number; category?: string }>;
      }>(`/bookings/${ref}${rawToken ? `?token=${rawToken}` : ''}`)
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

  const [user, setUser] = useState<any>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ session?: any }>('/auth/me')
      .then(res => {
        if (isMounted) {
          if (res.session) setUser(res.session);
          setSessionLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setSessionLoaded(true);
      });
    return () => { isMounted = false; };
  }, []);

  const qrPayload = booking.qrToken || ref;
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${qrPayload}`
    : `https://encore-ticket-booking-web.vercel.app/verify/${qrPayload}`;

  if (sessionLoaded && !user) {
    return (
      <main className="confirmation-page" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <PortalNav />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: 400, width: '100%', background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 500 }}>Ticket Awaiting</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Please log in to view your secure event pass.</p>
            </div>
            <AuthForm mode="login" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="confirmation-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="no-print">
        <PortalNav />
      </div>

      <section className="confirmation-wrap" style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px 100px' }}>
        <div
          className="confirmation-mark no-print"
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#1a3022',
            border: '1px solid #336644',
            color: 'var(--green)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Check size={28} />
        </div>

        <span className="eyebrow no-print" style={{ color: 'var(--coral)', letterSpacing: '0.12em', justifyContent: 'center' }}>
          CONFIRMED ENTRY PASS · RESERVED EXCLUSIVELY
        </span>

        <h1 className="no-print" style={{ margin: '14px 0 12px', font: 'clamp(48px, 6vw, 76px) var(--serif)', fontWeight: 400, color: 'var(--paper)', lineHeight: 0.95 }}>
          Your ticket<br />
          <em style={{ color: 'var(--peach)', fontStyle: 'italic' }}>is ready.</em>
        </h1>

        <p className="confirmation-sub no-print" style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.6 }}>
          Your seats are confirmed and your entry pass has been generated. Present this QR code at the venue gate or print your receipt below.
        </p>

        {/* Premium Printable Ticket Voucher Card */}
        <article
          className="ticket-stub print-ticket"
          style={{
            background: 'linear-gradient(135deg, #171a1d 0%, #121416 100%)',
            border: '1px solid #3d342f',
            borderLeft: '5px solid var(--coral)',
            borderRadius: 10,
            padding: '32px 36px',
            margin: '0 auto 36px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 32,
            alignItems: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            textAlign: 'left',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#16281e',
                  border: '1px solid #326442',
                  borderRadius: 999,
                  color: 'var(--green)',
                  font: '10px var(--mono)',
                  textTransform: 'uppercase',
                }}
              >
                <ShieldCheck size={13} /> Confirmed Pass
              </span>
              <span style={{ font: '10px var(--mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Ref: {booking.bookingRef}
              </span>
            </div>

            <h2 style={{ font: '36px var(--serif)', margin: '0 0 10px', color: 'var(--paper)', fontWeight: 400, letterSpacing: '-0.5px' }}>
              {booking.eventTitle || 'Loading event details...'}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, color: '#c0b6af', fontSize: 13, margin: '0 0 24px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--coral)" /> {booking.venue || 'Riverside Grounds'}, {booking.city || 'Mumbai'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} color="var(--coral)" />{' '}
                {booking.startsAt
                  ? new Date(booking.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '28 Aug 2026'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} color="var(--coral)" /> Doors 7:00 PM · Show 8:00 PM
              </span>
            </div>

            <div
              className="stub-meta"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 20,
                borderTop: '1px dashed #342c27',
                paddingTop: 18,
              }}
            >
              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10, font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Assigned Seats
                </small>
                <strong style={{ font: '15px var(--mono)', color: 'var(--peach)', fontWeight: 600 }}>
                  {booking.seats?.length
                    ? booking.seats.map(s => `${s.row}${s.number} (${s.category || 'Standard'})`).join(', ')
                    : 'A1, A2 (Premium)'}
                </strong>
              </div>

              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10, font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Total Paid
                </small>
                <strong style={{ font: '15px var(--mono)', color: 'var(--paper)', fontWeight: 600 }}>
                  ₹{Math.round(booking.totalPaise / 100).toLocaleString('en-IN')}
                </strong>
              </div>

              <div>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: 10, font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Attendee
                </small>
                <strong style={{ font: '14px var(--mono)', color: 'var(--paper)', fontWeight: 500 }}>
                  {booking.customerName}
                </strong>
              </div>
            </div>
          </div>

          {/* Secure Gate Scan Ticket QR */}
          <div
            className="ticket-qr"
            style={{
              textAlign: 'center',
              background: '#0d0f11',
              padding: 22,
              border: '1px solid #332d29',
              borderRadius: 8,
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <QRCodeDisplay value={verifyUrl} size={135} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                color: 'var(--green)',
                font: '10px var(--mono)',
                textTransform: 'uppercase',
                marginTop: 12,
              }}
            >
              <ShieldCheck size={13} /> Scan at Gate
            </span>
            <small style={{ display: 'block', color: 'var(--muted)', font: '9px var(--mono)', marginTop: 4 }}>
              REF // {booking.bookingRef}
            </small>
          </div>
        </article>

        {/* Action Buttons */}
        <div className="confirmation-actions no-print" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link href="/bookings" className="coral-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
            <Ticket size={16} /> View All My Bookings
          </Link>
          <button
            type="button"
            className="ghost-button"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', cursor: 'pointer' }}
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
          <section className="confirmation-wrap" style={{ padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', font: '12px var(--mono)' }}>Loading your ticket pass…</p>
          </section>
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
