'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Ticket, LogIn } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { apiJson } from '@/lib/api';
import { useEffect, useState } from 'react';

type Booking = {
  bookingRef: string;
  totalPaise: number;
  status: string;
  eventTitle?: string;
  venue?: string;
  city?: string;
  startsAt?: string;
  showId?: string;
  seatsCount?: number;
};

export default function TicketsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function cancelBooking(bookingRef: string) {
    if (!window.confirm('Are you sure you want to cancel this booking? This will immediately release your seats/tables.')) return;
    setCancelling(bookingRef);
    try {
      await apiJson(`/bookings/${bookingRef}/cancel`, { method: 'POST' });
      setBookings(prev => prev.map(b => b.bookingRef === bookingRef ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  }

  useEffect(() => {
    let isMounted = true;
    apiJson<{ bookings: Booking[] }>('/bookings')
      .then(result => {
        if (isMounted) {
          setBookings(result.bookings || []);
          setAuthError(false);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        const msg = String(err?.message || '');
        // 401 means not logged in — show sign-in prompt instead of fake data
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          setAuthError(true);
        }
        setBookings([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="customer-site tickets-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <section className="tickets-header" style={{ padding: '60px 6vw 40px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <span className="eyebrow">YOUR ACCOUNT / MY TICKETS</span>
        <h1 style={{ margin: '16px 0 12px', font: 'clamp(44px,6vw,72px) var(--serif)', fontWeight: 400, color: 'var(--paper)' }}>
          Plans worth<br />
          <em style={{ color: 'var(--peach)' }}>keeping.</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          All your confirmed passes and tickets, cryptographically verified and ready at the gate.
        </p>
      </section>

      <section className="ticket-list" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 6vw 60px' }}>
        {loading ? (
          <div className="empty-state">Loading your ticket passes…</div>
        ) : authError ? (
          <div className="empty-state">
            <LogIn size={32} style={{ margin: '0 auto 12px', color: 'var(--muted)' }} />
            <h3>Sign in to view your tickets</h3>
            <p>Your bookings are tied to your account. Sign in to see all your confirmed passes.</p>
            <Link href="/login?next=/bookings" className="coral-button" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Sign In <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : bookings.length ? (
          <div style={{ display: 'grid', gap: 20 }}>
            {bookings.map(booking => (
              <article
                key={booking.bookingRef}
                style={{
                  background: '#16191c',
                  border: '1px solid #332d29',
                  borderLeft: '4px solid var(--coral)',
                  borderRadius: 8,
                  padding: '24px 28px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 20,
                  alignItems: 'center',
                }}
                className="ticket-list-card"
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: booking.status === 'confirmed' ? '#16281e' : '#281c16',
                        color: booking.status === 'confirmed' ? 'var(--green)' : 'var(--coral)',
                        font: '10px var(--mono)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {booking.status.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--muted)', font: '11px var(--mono)' }}>REF: {booking.bookingRef}</span>
                  </div>

                  <h3 style={{ font: 'clamp(20px,3vw,26px) var(--serif)', color: 'var(--paper)', margin: '0 0 6px', fontWeight: 400 }}>
                    {booking.eventTitle || 'Encore Event'}
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, color: '#c0b6af', fontSize: 12, margin: '8px 0 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} color="var(--coral)" /> {booking.venue || 'Venue'}, {booking.city || 'City'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <CalendarDays size={13} color="var(--coral)" />{' '}
                      {booking.startsAt ? new Date(booking.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
                    </span>
                    <span>{Number(booking.seatsCount) || 1} Seat(s)</span>
                  </div>

                  <strong style={{ font: '13px var(--mono)', color: 'var(--paper)' }}>
                    Total: &#8377;{Math.round(booking.totalPaise / 100).toLocaleString('en-IN')}
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => cancelBooking(booking.bookingRef)}
                      disabled={cancelling === booking.bookingRef}
                      className="ghost-button"
                      style={{ padding: '8px 12px', fontSize: 10, borderColor: '#4a2b2b', color: '#ff7070' }}
                    >
                      {cancelling === booking.bookingRef ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <Link
                      href={`/booking/${booking.bookingRef}/confirmation?showId=${booking.showId || ''}`}
                      className="coral-button"
                      style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, whiteSpace: 'nowrap' }}
                    >
                      Open QR Pass <ArrowUpRight size={14} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Ticket size={32} style={{ margin: '0 auto 12px', color: 'var(--muted)' }} />
            <h3>No bookings yet</h3>
            <p>Explore upcoming concerts, comedy nights, and films across your city.</p>
            <Link href="/events" className="coral-button" style={{ marginTop: 14 }}>
              Browse Events →
            </Link>
          </div>
        )}
      </section>

      <section className="tickets-empty" style={{ borderTop: '1px dashed var(--line)', padding: '50px 6vw 70px', textAlign: 'center' }}>
        <p className="eyebrow">Looking for your next one?</p>
        <h2 style={{ margin: '14px 0 20px', font: 'clamp(36px,5vw,56px) var(--serif)', color: 'var(--paper)' }}>
          The calendar is<br />
          <em style={{ color: 'var(--peach)' }}>wide open.</em>
        </h2>
        <Link href="/events" className="coral-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Explore the guide <ArrowUpRight size={15} />
        </Link>
      </section>
      <PortalFooter />
    </main>
  );
}
