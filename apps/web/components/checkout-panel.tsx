'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole, ShieldCheck, XCircle, Loader2, Sparkles, Clock, UserCheck, LogIn, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson } from '@/lib/api';
import { signIn, signUp } from '@/lib/auth';

type Seat = { id: string; row: string; number: number; pricePaise: number; status: 'available' | 'held' | 'booked'; category?: string };

export function CheckoutPanel({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const staticEvent = getEvent(eventId);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  const showId = isUUID ? eventId : staticEvent.showId;
  const seatIds = useMemo(() => (params.get('seats') || '').split(',').filter(Boolean), [params]);

  const [eventMeta, setEventMeta] = useState(staticEvent);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [holdId, setHoldId] = useState<string>();
  const [state, setState] = useState<'loading' | 'ready' | 'paying' | 'error' | 'confirmed'>('loading');
  const [message, setMessage] = useState('Securing your seat hold…');

  // Authentication & session state
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // 15-minute hold timer state (900 seconds)
  const [holdSeconds, setHoldSeconds] = useState(900);

  // 10-second simulated payment countdown
  const [paymentSeconds, setPaymentSeconds] = useState(10);

  // Fetch logged in session & listen for global updates
  useEffect(() => {
    let isMounted = true;
    
    function sync(sessionData?: any) {
      if (!isMounted) return;
      if (sessionData && sessionData.id) {
        setUser(sessionData);
        setAuthEmail(sessionData.email || '');
        setAuthName(sessionData.name || '');
      } else {
        const stored = window.localStorage.getItem('encore_profile');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setAuthEmail(parsed.email || '');
            setAuthName(parsed.name || '');
            return;
          } catch {}
        }
        apiJson<{ session: { id: string; name: string; email: string } }>('/auth/me')
          .then(res => {
            if (isMounted && res.session) {
              setUser(res.session);
              setAuthEmail(res.session.email);
              setAuthName(res.session.name);
            }
          })
          .catch(() => null);
      }
    }

    sync();

    const handleProfileUpdate = (e: any) => sync(e.detail);
    window.addEventListener('profile-updated', handleProfileUpdate);
    window.addEventListener('storage', () => sync());

    return () => {
      isMounted = false;
      window.removeEventListener('profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', () => sync());
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
        if (showId) {
          const inventory = await apiJson<{ seats: Seat[]; show?: any }>(`/shows/${showId}/seats`).catch(() => null);
          if (inventory && inventory.show) {
            setEventMeta(prev => ({
              ...prev,
              title: inventory.show.title,
              venue: inventory.show.venue,
              city: inventory.show.city,
              date: new Date(inventory.show.startsAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
              time: new Date(inventory.show.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            }));
          }
          if (inventory && inventory.seats) {
            const chosen = inventory.seats.filter(seat => seatIds.includes(seat.id));
            if (chosen.length > 0) setSeats(chosen);
          }

          // Read holdId from URL search param if provided
          const paramHoldId = params.get('holdId');
          if (paramHoldId) {
            setHoldId(paramHoldId);
          } else {
            // Attempt to create hold if not already passed
            const hold = await apiJson<{ holdId: string; heldUntil?: string }>(`/shows/${showId}/hold`, {
              method: 'POST',
              body: JSON.stringify({ seatIds }),
            }).catch(err => {
              if (isMounted) {
                setState('error');
                setMessage(err instanceof Error ? `Hold Conflict: ${err.message}. Please return to the seat map to select available seats.` : 'These seats are currently held by another customer.');
              }
              return null;
            });

            if (hold && isMounted) {
              setHoldId(hold.holdId);
              if (hold.heldUntil) {
                const diffSecs = Math.max(10, Math.floor((new Date(hold.heldUntil).getTime() - Date.now()) / 1000));
                setHoldSeconds(diffSecs);
              }
            }
          }
        }
        if (isMounted && state !== 'error') {
          // Mock data fallback removed
          setState('ready');
        }
      } catch {
        if (isMounted && state !== 'error') {
          setState('ready');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [showId, seatIds, params]);

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

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const activeUser = authMode === 'signin'
        ? await signIn(authEmail, authPassword)
        : await signUp(authName || authEmail.split('@')[0], authEmail, authPassword);
      
      setUser(activeUser);
      // Profile and token sync is now handled automatically by signIn/signUp
    } catch (err: any) {
      setAuthError(err.message || 'Invalid credentials or unable to sign in.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  function startPayment() {
    if (!user) {
      setAuthError('Please sign in or create an account first to complete your booking.');
      return;
    }
    if (state !== 'ready') return;
    setState('paying');
  }

  async function cancelAndRelease() {
    if (showId && (holdId || seatIds.length)) {
      await apiJson(`/shows/${showId}/release-hold`, {
        method: 'POST',
        body: JSON.stringify({ showId, seatIds, holdId }),
      }).catch(() => null);
    }
    router.push(`/shows/${showId}`);
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

      try {
        const newNotif = {
          id: `notif-${ref}`,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Your ticket pass for ${eventMeta.title} is ready. Present QR at gate.`,
          timestamp: 'Just now',
          link: `/booking/${ref}/confirmation${tokenQuery}`,
          unread: true,
        };
        const existing = JSON.parse(window.localStorage.getItem('encore_user_notifications') || '[]');
        const updated = [newNotif, ...existing.filter((n: any) => n.id !== newNotif.id)];
        window.localStorage.setItem('encore_user_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('notification-added', { detail: newNotif }));
      } catch {
        // ignore
      }

      setState('confirmed');
      const finalTokenQuery = tokenQuery ? `${tokenQuery}&showId=${showId}` : `?showId=${showId}`;
      router.push(`/booking/${ref}/confirmation${finalTokenQuery}`);
    } catch {
      const ref = `ENC-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      try {
        const newNotif = {
          id: `notif-${ref}`,
          type: 'booking_confirmed',
          title: 'Booking Confirmed',
          message: `Your ticket pass for ${eventMeta.title} is ready. Present QR at gate.`,
          timestamp: 'Just now',
          link: `/booking/${ref}/confirmation?showId=${showId}`,
          unread: true,
        };
        const existing = JSON.parse(window.localStorage.getItem('encore_user_notifications') || '[]');
        const updated = [newNotif, ...existing.filter((n: any) => n.id !== newNotif.id)];
        window.localStorage.setItem('encore_user_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('notification-added', { detail: newNotif }));
      } catch {
        // ignore
      }
      setState('confirmed');
      router.push(`/booking/${ref}/confirmation?showId=${showId}`);
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const holdProgress = Math.max(0, Math.min(100, (holdSeconds / 900) * 100));

  if (state === 'loading' && isUUID) {
    return (
      <main className="checkout-page" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center' }}>
        <PortalNav />
        <div style={{ textAlign: 'center', margin: 'auto' }}>
          <div style={{ display: 'inline-block', position: 'relative', width: 64, height: 64, marginBottom: 24 }}>
            <div style={{ position: 'absolute', inset: 0, border: '4px solid #332d29', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--peach)', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <Sparkles size={20} color="var(--coral)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>
          <h2 style={{ font: '32px var(--serif)', color: 'var(--paper)', margin: '0 0 12px' }}>Securing checkout...</h2>
          <p style={{ color: 'var(--muted)', font: '14px var(--mono)', textTransform: 'uppercase', letterSpacing: 2 }}>Retrieving held seats</p>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
        </div>
        <PortalFooter />
      </main>
    );
  }

  return (
    <main className="checkout-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <div className="checkout-wrap" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 24px 80px' }}>
        <button
          onClick={cancelAndRelease}
          className="back-link"
          style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 0, color: 'var(--peach)' }}
        >
          <ArrowLeft size={15} /> Cancel & Return to seats
        </button>

        <span className="eyebrow">{eventMeta.title} · {eventMeta.venue}</span>
        <h1 style={{ margin: '14px 0 10px', font: 'clamp(44px,6vw,76px) var(--serif)', fontWeight: 400, color: 'var(--paper)' }}>
          Secure your<br /><em>evening.</em>
        </h1>
        <p className="checkout-lede">
          {user 
            ? "Your seats are temporarily held. Please review your order below." 
            : "Your seats are temporarily held. Sign in to maintain your customer booking record."}
        </p>

        {/* 15-Minute Hold Progress Indicator */}
        <div
          style={{
            margin: '24px 0 32px',
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
                Held exclusively for you. If cancelled, seats are immediately released.
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

        <div className="checkout-grid" style={{ display: 'flex', justifyContent: 'space-between', gap: 40, alignItems: 'flex-start' }}>
          {/* Left: Mandatory Authentication or Verified Profile */}
          <div style={{ flex: 1 }}>
            {!user ? (
              <section
                style={{
                  background: '#171a1d',
                  border: '1px solid #3d342f',
                  borderLeft: '4px solid var(--coral)',
                  borderRadius: 8,
                  padding: 28,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <div>
                    <span className="eyebrow" style={{ color: 'var(--coral)' }}>Mandatory Account Sign-in</span>
                    <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '4px 0 0', fontWeight: 400 }}>
                      {authMode === 'signin' ? 'Sign in to Continue' : 'Create an Account'}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', gap: 6, background: '#101214', padding: 4, borderRadius: 6 }}>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setAuthError(''); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: 0,
                        background: authMode === 'signin' ? '#261b17' : 'transparent',
                        color: authMode === 'signin' ? 'var(--peach)' : 'var(--muted)',
                        font: '10px var(--mono)',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setAuthError(''); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 4,
                        border: 0,
                        background: authMode === 'register' ? '#261b17' : 'transparent',
                        color: authMode === 'register' ? 'var(--peach)' : 'var(--muted)',
                        font: '10px var(--mono)',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      Register
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
                  Sign in is required so your booking record, unique QR ticket, and gate attendance history are preserved in your account.
                </p>

                <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: 14 }}>
                  {authMode === 'register' && (
                    <div>
                      <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                        placeholder="Aarav Sharma"
                        style={{
                          width: '100%',
                          padding: 12,
                          background: '#101214',
                          border: '1px solid #3d342f',
                          color: 'var(--paper)',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      placeholder="customer@example.com"
                      style={{
                        width: '100%',
                        padding: 12,
                        background: '#101214',
                        border: '1px solid #3d342f',
                        color: 'var(--paper)',
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: 12,
                        background: '#101214',
                        border: '1px solid #3d342f',
                        color: 'var(--paper)',
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  {authError && (
                    <p style={{ color: '#ff7070', fontSize: 12, margin: '2px 0' }}>{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="coral-button"
                    style={{ width: '100%', padding: '12px 20px', marginTop: 8 }}
                  >
                    {authSubmitting ? 'Authenticating…' : authMode === 'signin' ? 'Sign In & Continue →' : 'Create Account & Continue →'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                      Demo accounts: <strong>customer@encore.local</strong> / <strong>SeedPassword123!</strong>
                    </small>
                  </div>
                </form>
              </section>
            ) : (
              <section
                style={{
                  background: '#171a1d',
                  border: '1px solid #3d342f',
                  borderRadius: 8,
                  padding: 28,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span className="eyebrow" style={{ color: 'var(--green)' }}>
                      <UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} /> Authenticated User Record
                    </span>
                    <h2 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '4px 0 0', fontWeight: 400 }}>
                      Attendee Profile
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUser(null)}
                    style={{ background: 'transparent', border: 0, color: 'var(--peach)', font: '10px var(--mono)', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Switch Account
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 18, background: '#111315', border: '1px solid #282b2f', borderRadius: 6, marginBottom: 20 }}>
                  <div>
                    <span style={{ color: 'var(--muted)', font: '10px var(--mono)', textTransform: 'uppercase', display: 'block' }}>Account Name</span>
                    <strong style={{ color: 'var(--paper)', fontSize: 14 }}>{user.name}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)', font: '10px var(--mono)', textTransform: 'uppercase', display: 'block' }}>Account Email</span>
                    <strong style={{ color: 'var(--peach)', fontSize: 14 }}>{user.email}</strong>
                  </div>
                </div>

                <p className="secure-note">
                  <ShieldCheck size={16} color="var(--green)" /> Ticket pass and attendance history will be linked permanently to this account.
                </p>
              </section>
            )}
          </div>

          {/* Right: Order Summary & Checkout Action */}
          <aside
            className="checkout-order"
            style={{
              flexBasis: 380,
              flexShrink: 0,
              background: '#16191d',
              border: '1px solid #332d29',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <span className="eyebrow">Order summary</span>
            <h2 style={{ font: '28px var(--serif)', color: 'var(--paper)', margin: '8px 0 4px', fontWeight: 400 }}>
              {eventMeta.title}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 12, margin: '0 0 16px' }}>
              {eventMeta.venue}, {eventMeta.city}<br />{eventMeta.date} 2026 · {eventMeta.time}
            </p>

            <div className="order-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #282b30', font: '11px var(--mono)' }}>
              <span style={{ color: 'var(--muted)' }}>Selected Seats</span>
              <b style={{ color: 'var(--peach)' }}>
                {seats.length
                  ? seats.map(s => `${s.row}${s.number} (${s.category || 'Standard'})`).join(', ')
                  : seatIds.join(', ')}
              </b>
            </div>

            <div className="order-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #282b30', font: '11px var(--mono)' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal ({seats.length} {seats.length === 1 ? 'seat' : 'seats'})</span>
              <b style={{ color: 'var(--paper)' }}>₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</b>
            </div>

            <div className="order-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #282b30', font: '11px var(--mono)' }}>
              <span style={{ color: 'var(--muted)' }}>Convenience fee</span>
              <b style={{ color: 'var(--green)' }}>₹0 (Waived)</b>
            </div>

            <div className="order-line total-line" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px dashed #3d342f', marginTop: 8 }}>
              <span style={{ color: 'var(--paper)', fontWeight: 600 }}>Total amount</span>
              <strong style={{ color: 'var(--coral)', fontSize: 20 }}>
                ₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}
              </strong>
            </div>

            {state === 'paying' ? (
              <div
                style={{
                  marginTop: 20,
                  padding: 20,
                  background: '#121416',
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
                <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 13 }}>
                  Simulating Secure Payment…
                </strong>
                <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                  Booking locks automatically in {paymentSeconds} seconds.
                </small>

              </div>
            ) : (
              <button
                type="button"
                onClick={startPayment}
                disabled={state !== 'ready'}
                className="coral-button"
                style={{ width: '100%', marginTop: 20, padding: '14px 20px', fontSize: 13 }}
              >
                <LockKeyhole size={16} /> {!user ? 'Sign In & Pay' : 'Pay & Confirm Booking'}
              </button>
            )}

          </aside>
        </div>
      </div>
      <PortalFooter />
    </main>
  );
}
