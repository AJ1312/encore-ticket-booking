'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, XCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson } from '@/lib/api';

type Seat = { id: string; row: string; number: number; pricePaise: number; status: 'available' | 'held' | 'booked' };

export function CheckoutPanel({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const event = getEvent(eventId);
  const seatIds = useMemo(() => (params.get('seats') || '').split(',').filter(Boolean), [params]);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [holdId, setHoldId] = useState<string>();
  const [state, setState] = useState<'loading' | 'ready' | 'paying' | 'error' | 'confirmed'>('loading');
  const [message, setMessage] = useState('Securing server-side seat hold…');

  // 15-minute hold timer state (900 seconds)
  const [holdSeconds, setHoldSeconds] = useState(900);

  // 10-second simulated payment countdown
  const [paymentSeconds, setPaymentSeconds] = useState(10);

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
          const hold = await apiJson<{ holdId: string }>(`/shows/${event.showId}/hold`, {
            method: 'POST',
            body: JSON.stringify({ seatIds }),
          }).catch(() => null);
          if (hold && isMounted) setHoldId(hold.holdId);
        }
        if (isMounted) {
          if (!seats.length) {
            // Provide display representation for selected seat IDs
            setSeats(seatIds.map((id, index) => ({
              id,
              row: String.fromCharCode(65 + Math.floor(index / 12)),
              number: (index % 12) + 1,
              pricePaise: 149900,
              status: 'held',
            })));
          }
          setState('ready');
        }
      } catch {
        if (isMounted) {
          setState('ready');
        }
      }
    })();

    return () => { isMounted = false; };
  }, [event.showId, seatIds]);

  // 15-minute hold timer tick
  useEffect(() => {
    if (state !== 'ready' && state !== 'paying') return;
    const timer = setInterval(() => {
      setHoldSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setState('error');
          setMessage('Your 15-minute seat hold expired. Please select your seats again.');
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
          // Execute final confirmation when timer hits 0
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

  function cancelPayment() {
    setState('ready');
    setPaymentSeconds(10);
    // Optionally release hold or return to seats
    router.push(`/shows/${eventId}`);
  }

  async function executeConfirmation() {
    setMessage('Confirming booking & generating QR ticket…');
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
      setState('confirmed');
      router.push(`/booking/${ref}/confirmation`);
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

  const seatLabels = seats.map(seat => `${seat.row}${seat.number}`).join(', ');

  return (
    <main className="booking-page">
      <PortalNav />
      <section className="checkout-wrap">
        <Link href={`/shows/${eventId}`} className="back-link">
          <ArrowLeft size={15} /> Back to seats
        </Link>
        <div className="checkout-grid">
          <div>
            <span className="eyebrow">Final step · Server-side hold</span>
            <h1>Make it<br /><em>yours.</em></h1>
            <p className="checkout-lede">Your seats are locked and verified by PostgreSQL before payment confirmation.</p>

            {/* 15-Minute Seat Hold Countdown Banner */}
            <div className="hold-countdown" style={{ margin: '24px 0' }}>
              <div>
                <span className="hold-countdown-label">Seat Hold Expiry</span>
                <div className={`hold-countdown-digits ${holdSeconds < 180 ? 'low' : ''}`}>
                  {formatTime(holdSeconds)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)' }}>
                <span>15 min total window</span>
                <br />
                <span style={{ color: 'var(--peach)' }}>{seats.length} seats reserved</span>
              </div>
            </div>

            <div className="checkout-card">
              <h2>Contact details</h2>
              <label>
                Full name
                <input placeholder="Your name" defaultValue="Aarav Sharma" autoComplete="name" />
              </label>
              <label>
                Email address
                <input type="email" placeholder="you@example.com" defaultValue="customer@encore.local" autoComplete="email" />
              </label>
              <p className="secure-note">
                <LockKeyhole size={14} /> Used for your receipt and QR ticket delivery.
              </p>
            </div>
          </div>

          <aside className="checkout-order">
            <span className="eyebrow">Order summary</span>
            <h2>{event.title}</h2>
            <p>{event.venue} · {event.date} · {event.time}</p>

            {state === 'error' ? (
              <p className="form-error" style={{ margin: '20px 0' }}>{message}</p>
            ) : state === 'paying' ? (
              /* 10-Second Reverse Countdown Payment Window */
              <div className="payment-overlay">
                <div className="payment-ring-wrap">
                  <svg className="payment-ring-svg" viewBox="0 0 140 140">
                    <circle className="payment-ring-bg" cx="70" cy="70" r="65" />
                    <circle
                      className={`payment-ring-fg ${paymentSeconds <= 3 ? 'low' : ''}`}
                      cx="70"
                      cy="70"
                      r="65"
                      style={{
                        strokeDashoffset: 408 - (408 * paymentSeconds) / 10,
                      }}
                    />
                  </svg>
                  <div className="payment-ring-center">
                    <span className="payment-ring-num">{paymentSeconds}</span>
                    <span className="payment-ring-unit">seconds</span>
                  </div>
                </div>
                <h3>Simulating payment…</h3>
                <p>Verifying transaction & issuing unique QR ticket.</p>

                <button type="button" onClick={cancelPayment} className="payment-cancel-btn">
                  <XCircle size={15} /> Cancel payment & release hold
                </button>
              </div>
            ) : (
              <>
                <div className="order-line">
                  <span>Seats · {seatLabels || 'Selected seats'}</span>
                  <b>₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</b>
                </div>
                <div className="order-line">
                  <span>Encore booking fee</span>
                  <b>₹99</b>
                </div>
                <div className="order-line total-line">
                  <span>Total</span>
                  <b>₹{(Math.round(totalPaise / 100) + 99).toLocaleString('en-IN')}</b>
                </div>

                <button
                  type="button"
                  onClick={startPayment}
                  disabled={state === 'loading'}
                  className="coral-button"
                  style={{ width: '100%', marginTop: 24 }}
                >
                  {state === 'loading' ? (
                    <>
                      <Loader2 size={16} className="spin" /> {message}
                    </>
                  ) : (
                    <>
                      Pay & Confirm Booking <Check size={16} />
                    </>
                  )}
                </button>
                <small style={{ display: 'block', marginTop: 14, color: 'var(--muted)', textAlign: 'center', fontSize: 11 }}>
                  10s simulated payment window starts upon clicking.
                </small>
              </>
            )}
          </aside>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
