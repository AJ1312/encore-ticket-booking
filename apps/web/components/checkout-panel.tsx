'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, XCircle, Loader2, Sparkles, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson } from '@/lib/api';

type Seat = { id: string; row: string; number: number; pricePaise: number; status: 'available' | 'held' | 'booked'; category?: string };

export function CheckoutPanel({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const event = getEvent(eventId);
  const seatIds = useMemo(() => (params.get('seats') || '').split(',').filter(Boolean), [params]);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [holdId, setHoldId] = useState<string>();
  const [state, setState] = useState<'loading' | 'ready' | 'paying' | 'error' | 'confirmed'>('loading');
  const [message, setMessage] = useState('Securing your seat hold…');

  // Contact form state
  const [name, setName] = useState('Aarav Sharma');
  const [email, setEmail] = useState('customer@encore.local');

  // 15-minute hold timer state (900 seconds)
  const [holdSeconds, setHoldSeconds] = useState(900);

  // 10-second simulated payment countdown
  const [paymentSeconds, setPaymentSeconds] = useState(10);

  // Fetch logged in session if available
  useEffect(() => {
    let isMounted = true;
    apiJson<{ session: { name: string; email: string } }>('/auth/me')
      .then(res => {
        if (isMounted && res.session) {
          if (res.session.name) setName(res.session.name);
          if (res.session.email) setEmail(res.session.email);
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialise seat hold
  useEffect(() => {
    if (!seatIds.length) {
      setState('error');
      setMessage('Your seat selection is missing. Please return to the seat map.');
      return;
    }

    let isMounted = true;
    void (async () => {
      try {
        if (event.showId) {
          const inventory = await apiJson<{ seats: Seat[] }>(`/shows/${event.showId}/seats`).catch(() => null);
          if (inventory && inventory.seats) {
            const chosen = inventory.seats.filter(seat => seatIds.includes(seat.id));
            if (chosen.length > 0) setSeats(chosen);
          }
          const hold = await apiJson<{ holdId: string; heldUntil?: string }>(`/shows/${event.showId}/hold`, {
            method: 'POST',
            body: JSON.stringify({ seatIds }),
          }).catch(() => null);
          if (hold && isMounted) {
            setHoldId(hold.holdId);
            if (hold.heldUntil) {
              const diffSecs = Math.max(10, Math.floor((new Date(hold.heldUntil).getTime() - Date.now()) / 1000));
              setHoldSeconds(diffSecs);
            }
          }
        }
        if (isMounted) {
          if (!seats.length) {
            setSeats(
              seatIds.map((id, index) => ({
                id,
                row: String.fromCharCode(65 + Math.floor(index / 12)),
                number: (index % 12) + 1,
                pricePaise: index < 2 ? 149900 : 99900,
                status: 'held',
                category: index < 2 ? 'Premium' : 'Standard',
              }))
            );
          }
          setState('ready');
        }
      } catch {
        if (isMounted) {
          setState('ready');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [event.showId, seatIds]);

  // 15-minute hold timer countdown
  useEffect(() => {
    if (state === 'loading' || state === 'error' || state === 'confirmed') return;
    const timer = setInterval(() => {
      setHoldSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setState('error');
          setMessage('Your 15-minute seat hold expired. Please return to the map and select your seats again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  // 10-second payment countdown timer
  useEffect(() => {
    if (state !== 'paying') return;
    setPaymentSeconds(10);
    const timer = setInterval(() => {
      setPaymentSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          void executeConfirmation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const totalPaise = seats.reduce((sum, seat) => sum + seat.pricePaise, 0);

  function startPayment() {
    if (state !== 'ready') return;
    setState('paying');
  }

  async function cancelAndRelease() {
    if (event.showId && (holdId || seatIds.length)) {
      await apiJson(`/shows/${event.showId}/release-hold`, {
        method: 'POST',
        body: JSON.stringify({ seatIds, holdId }),
      }).catch(() => null);
    }
    router.push(`/shows/${eventId}`);
  }

  async function executeConfirmation() {
    setMessage('Confirming booking & generating unique QR ticket…');
    try {
      const result = await apiJson<{ bookingRef: string; qrToken?: string }>('/bookings/confirm', {
        method: 'POST',
        body: JSON.stringify({
          seatIds,
          holdId,
          idempotencyKey: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idem-${Date.now()}`,
        }),
      }).catch(() => null);

      const ref = result?.bookingRef || `ENC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const tokenQuery = result?.qrToken ? `?token=${encodeURIComponent(result.qrToken)}` : '';
      setState('confirmed');
      router.push(`/booking/${ref}/confirmation${tokenQuery}`);
    } catch {
      const ref = `ENC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      setState('confirmed');
      router.push(`/booking/${ref}/confirmation`);
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const holdProgress = Math.max(0, Math.min(100, (holdSeconds / 900) * 100));

  return (
    <main className="checkout-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <div className="checkout-wrap">
        <button
          onClick={cancelAndRelease}
          className="back-link"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}
        >
          <ArrowLeft size={15} /> Cancel & Return to seats
        </button>

        <span className="eyebrow">{event.title} · {event.venue}</span>
        <h1>Secure your<br /><em>evening.</em></h1>
        <p className="checkout-lede">Your seats are temporarily held. Complete payment to receive your unique QR ticket.</p>

        {/* 15-Minute Hold Progress Indicator */}
        <div
          style={{
            margin: '28px 0 35px',
            padding: '16px 20px',
            background: '#16191d',
            border: '1px solid #333a42',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Clock size={20} color="var(--peach)" />
            <div>
              <strong style={{ font: '14px var(--mono)', color: 'var(--paper)' }}>
                Seat Hold Window: <span style={{ color: 'var(--peach)' }}>{formatTime(holdSeconds)}</span>
              </strong>
              <small style={{ display: 'block', color: 'var(--muted)', fontSize: 11 }}>
                Held exclusively for you. If you cancel, seats are immediately released.
              </small>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 160, maxWidth: 280, height: 6, background: '#252b33', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${holdProgress}%`,
                height: '100%',
                background: holdSeconds < 120 ? '#ff7070' : 'var(--coral)',
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        <div className="checkout-grid">
          <section className="checkout-card">
            <h2>Attendee information</h2>
            <form onSubmit={e => { e.preventDefault(); startPayment(); }}>
              <label>
                Your name
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={state === 'paying'}
                  placeholder="Full Name"
                />
              </label>

              <label>
                Email address
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={state === 'paying'}
                  placeholder="your.email@example.com"
                />
              </label>

              <p className="secure-note" style={{ marginTop: 20 }}>
                <ShieldCheck size={16} color="var(--green)" /> Encrypted ticket generation & admission auditing.
              </p>
            </form>
          </section>

          <aside className="checkout-order">
            <span className="eyebrow">Order summary</span>
            <h2>{event.title}</h2>
            <p>{event.venue}, {event.city}<br />{event.date} 2026 · {event.time}</p>

            <div className="order-line">
              <span>Selected Seats</span>
              <b>
                {seats.length
                  ? seats.map(s => `${s.row}${s.number} (${s.category || 'Standard'})`).join(', ')
                  : seatIds.join(', ')}
              </b>
            </div>

            <div className="order-line">
              <span>Subtotal ({seats.length} seats)</span>
              <b>₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</b>
            </div>

            <div className="order-line">
              <span>Convenience fee</span>
              <b>₹0 (Waived)</b>
            </div>

            <div className="order-line total-line">
              <span>Total amount</span>
              <strong style={{ color: 'var(--coral)', fontSize: 18 }}>
                ₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}
              </strong>
            </div>

            {state === 'paying' ? (
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  background: '#141618',
                  border: '1px solid #3d342f',
                  borderRadius: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 12px' }}>
                  <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#2a2522" strokeWidth="4" />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="var(--coral)"
                      strokeWidth="4"
                      strokeDasharray="175.9"
                      strokeDashoffset={175.9 * (1 - paymentSeconds / 10)}
                      strokeLinecap="round"
                      transform="rotate(-90 32 32)"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                    />
                  </svg>
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      font: '16px var(--mono)',
                      fontWeight: 700,
                      color: 'var(--paper)',
                    }}
                  >
                    {paymentSeconds}s
                  </span>
                </div>
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 14 }}>
                  Simulating Secure Payment…
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                  Booking locks automatically in {paymentSeconds} seconds.
                </small>

                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => void executeConfirmation()}
                    className="coral-button"
                    style={{ flex: 1, padding: '10px 14px' }}
                  >
                    Pay Now ↗
                  </button>
                  <button
                    type="button"
                    onClick={cancelAndRelease}
                    className="ghost-button"
                    style={{ flex: 1, padding: '10px 14px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={startPayment}
                disabled={state !== 'ready'}
                className="coral-button"
                style={{ width: '100%', marginTop: 24 }}
              >
                <LockKeyhole size={16} /> Pay & Confirm Booking
              </button>
            )}

            <button
              type="button"
              onClick={cancelAndRelease}
              style={{
                width: '100%',
                marginTop: 12,
                background: 'transparent',
                border: 0,
                color: 'var(--muted)',
                font: '11px var(--mono)',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Cancel & Release Seats
            </button>
          </aside>
        </div>
      </div>
      <PortalFooter />
    </main>
  );
}
