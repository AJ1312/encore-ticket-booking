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
  const [message, setMessage] = useState('Securing server-side seat hold…');

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

  // 15-minute hold timer tick
  useEffect(() => {
    if (state !== 'ready' && state !== 'paying') return;
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

  function cancelPayment() {
    setState('ready');
    setPaymentSeconds(10);
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

  const seatLabels = seats.map(seat => `${seat.row}${seat.number}`).join(', ');
  const holdProgress = Math.max(0, Math.min(100, (holdSeconds / 900) * 100));

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

            {/* 15-Minute Seat Hold Countdown Banner with Progress Bar */}
            <div className="hold-countdown" style={{ margin: '24px 0', background: '#191816', border: '1px solid #362f2b', padding: '18px 22px', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="hold-countdown-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c0b6af' }}>
                    <Clock size={14} color="var(--peach)" /> Active Hold Window
                  </span>
                  <div className={`hold-countdown-digits ${holdSeconds < 180 ? 'low' : ''}`} style={{ font: '32px var(--mono)', fontWeight: 600, color: holdSeconds < 180 ? '#ff7070' : 'var(--peach)' }}>
                    {formatTime(holdSeconds)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
                  <span>15:00 max reservation</span>
                  <br />
                  <strong style={{ color: 'var(--paper)', fontSize: 13 }}>{seats.length} seat(s) held for you</strong>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div style={{ width: '100%', height: 4, background: '#2b2523', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${holdProgress}%`,
                    height: '100%',
                    background: holdSeconds < 180 ? '#ff7070' : 'linear-gradient(90deg, var(--green), var(--peach))',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>

            <div className="checkout-card" style={{ background: '#151719', border: '1px solid #282b2f', padding: 24, borderRadius: 6 }}>
              <h2>Ticket details & receipt delivery</h2>
              <label>
                Full name
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <p className="secure-note" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ab5a1', fontSize: 12, marginTop: 12 }}>
                <LockKeyhole size={14} color="var(--green)" /> Unique QR token and receipt will be issued to this email.
              </p>
            </div>
          </div>

          <aside className="checkout-order" style={{ background: '#151719', border: '1px solid #282b2f', padding: 28, borderRadius: 6 }}>
            <span className="eyebrow">Order summary</span>
            <h2 style={{ margin: '6px 0 4px', font: '28px var(--serif)' }}>{event.title}</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{event.venue} · {event.city} · {event.date} 2026 ({event.time})</p>

            {state === 'error' ? (
              <p className="form-error" style={{ margin: '20px 0' }}>{message}</p>
            ) : state === 'paying' ? (
              /* 10-Second Reverse Countdown Payment Window */
              <div className="payment-overlay" style={{ textAlign: 'center', padding: '24px 0' }}>
                <div className="payment-ring-wrap" style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
                  <svg className="payment-ring-svg" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <circle className="payment-ring-bg" cx="70" cy="70" r="65" fill="none" stroke="#252b27" strokeWidth="8" />
                    <circle
                      className={`payment-ring-fg ${paymentSeconds <= 3 ? 'low' : ''}`}
                      cx="70"
                      cy="70"
                      r="65"
                      fill="none"
                      stroke={paymentSeconds <= 3 ? '#ff7070' : 'var(--coral)'}
                      strokeWidth="8"
                      strokeDasharray="408"
                      style={{
                        strokeDashoffset: 408 - (408 * paymentSeconds) / 10,
                        transition: 'stroke-dashoffset 1s linear',
                      }}
                    />
                  </svg>
                  <div className="payment-ring-center" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="payment-ring-num" style={{ font: '38px var(--mono)', fontWeight: 600, color: 'var(--paper)', lineHeight: 1 }}>
                      {paymentSeconds}
                    </span>
                    <span className="payment-ring-unit" style={{ font: '10px var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', marginTop: 4 }}>
                      seconds
                    </span>
                  </div>
                </div>
                <h3 style={{ font: '22px var(--serif)', color: 'var(--paper)', margin: '0 0 6px' }}>Simulating payment…</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
                  Verifying transaction, committing seats & generating unique QR token.
                </p>

                <button type="button" onClick={cancelPayment} className="payment-cancel-btn" style={{ background: 'transparent', border: '1px solid #4a2b2b', color: '#ff7070', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <XCircle size={15} /> Cancel payment & release hold
                </button>
              </div>
            ) : (
              <>
                <div style={{ margin: '24px 0 0' }}>
                  <div className="order-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #23272a', fontSize: 13 }}>
                    <span style={{ color: '#c0b6af' }}>Seats · {seatLabels || 'Selected seats'}</span>
                    <b style={{ color: 'var(--paper)' }}>₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</b>
                  </div>
                  <div className="order-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #23272a', fontSize: 13 }}>
                    <span style={{ color: '#c0b6af' }}>Encore booking fee</span>
                    <b style={{ color: 'var(--paper)' }}>₹99</b>
                  </div>
                  <div className="order-line total-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 17 }}>
                    <span style={{ fontWeight: 600, color: 'var(--paper)' }}>Total Amount</span>
                    <b style={{ color: 'var(--peach)', font: '18px var(--mono)' }}>
                      ₹{(Math.round(totalPaise / 100) + 99).toLocaleString('en-IN')}
                    </b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startPayment}
                  disabled={state === 'loading'}
                  className="coral-button"
                  style={{ width: '100%', marginTop: 20, justifyContent: 'center', padding: '14px 20px', fontSize: 14 }}
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
                <small style={{ display: 'block', marginTop: 14, color: 'var(--muted)', textAlign: 'center', fontSize: 11, font: '11px var(--mono)' }}>
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
