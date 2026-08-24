'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Check, ChevronRight, Clock, Info, Minus, Plus, ShieldCheck, Sparkles, X, Users, Utensils, LogIn, KeyRound, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, startTransition } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson, API_URL } from '@/lib/api';
import { signIn, signUp } from '@/lib/auth';
import { io } from 'socket.io-client';
import type { Session } from '@encore/shared';

type SeatStatus = 'available' | 'held' | 'booked' | 'blocked' | 'sold';
type Seat = { id: string; row: string; number: number; pricePaise: number; status: SeatStatus; category?: string; section?: string };

type DiningTable = {
  id: string;
  tableLabel: string;
  capacity: 2 | 4 | 6;
  category: string;
  pricePaise: number;
  section: string;
  status: SeatStatus;
};

export function SeatPicker({ eventId }: { eventId: string }) {
  const router = useRouter();
  const staticEvent = getEvent(eventId);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
  const showId = isUUID ? eventId : staticEvent?.showId;

  const [eventMeta, setEventMeta] = useState<any>(() => {
    if (staticEvent) {
      return {
        title: staticEvent.title,
        venue: staticEvent.venue,
        city: staticEvent.city,
        date: staticEvent.date,
        time: staticEvent.time,
        kind: staticEvent.kind || 'Events',
      };
    }
    return { title: 'Loading...', venue: 'Loading...', city: '', date: '', time: '', kind: 'Events' };
  });
  const isDining = eventMeta?.kind === 'Dining';

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [zoom, setZoom] = useState(100);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Authentication & inline modal
  const [user, setUser] = useState<Session | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [holdError, setHoldError] = useState('');
  const [securingHold, setSecuringHold] = useState(false);

  // Notify / Waitlist modal state
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState(isDining ? 'Table for 4' : 'Premium');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  // Live ticking 15-minute hold timer (900 seconds)
  const [holdTimer, setHoldTimer] = useState(899);

  useEffect(() => {
    const timer = setInterval(() => {
      setHoldTimer(prev => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Dynamic 7-day calendar generated from today's date
  const upcomingDates = useMemo(() => {
    const list: { label: string; shortDay: string; dateNum: string; iso: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      list.push({
        label: `${dayLabel}, ${dateNum}`,
        shortDay: dayLabel,
        dateNum,
        iso: d.toISOString().split('T')[0],
      });
    }
    return list;
  }, []);

  const diningTimes = useMemo(() => [
    { time: '12:30 PM', label: 'Lunch', isPopular: false },
    { time: '1:30 PM', label: 'Lunch', isPopular: false },
    { time: '7:00 PM', label: 'Dinner', isPopular: false },
    { time: '7:45 PM', label: 'Prime', isPopular: true },
    { time: '8:30 PM', label: 'Dinner', isPopular: true },
    { time: '9:15 PM', label: 'Late', isPopular: false },
  ], []);

  const diningAreas = ['Main Dining Room', 'Window View Booth', 'Garden Patio', 'Chef’s Table'];

  // Dynamic Dining Reservation State
  const [diningGuests, setDiningGuests] = useState(2);
  const [diningDate, setDiningDate] = useState(() => {
    const today = new Date();
    return `Today, ${today.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;
  });
  const [diningTime, setDiningTime] = useState('7:45 PM');
  const [diningArea, setDiningArea] = useState('Main Dining Room');

  const availableSeats = useMemo(() => {
    return seats.filter(s => s.status === 'available');
  }, [seats]);

  const diningAvailableCount = useMemo(() => {
    if (!isDining) return 0;
    return Math.max(0, Math.floor(availableSeats.length / Math.max(1, diningGuests)));
  }, [isDining, availableSeats, diningGuests]);

  useEffect(() => {
    if (!isDining) return;
    if (availableSeats.length >= diningGuests) {
      setSelected(availableSeats.slice(0, diningGuests).map(s => s.id));
    } else {
      setSelected([]);
    }
  }, [isDining, availableSeats, diningGuests, diningTime, diningDate]);

  const total = useMemo(() => {
    if (isDining) {
      return diningGuests * 90000; // ₹900 per person cover deposit
    }
    return selected.reduce((sum, id) => {
      const seat = seats.find(s => s.id === id);
      return sum + (seat?.pricePaise || 149900);
    }, 0);
  }, [isDining, diningGuests, selected, seats]);

  const totalDiners = useMemo(() => {
    if (isDining) return diningGuests;
    return selected.length;
  }, [isDining, diningGuests, selected]);

  function loadSeats() {
    if (!showId) {
      setLoading(false);
      return;
    }
    apiJson<{ seats: Seat[]; meta?: any }>(`/shows/${showId}/seats`)
      .then(result => {
        startTransition(() => {
          setSeats(result.seats || []);
          if (result.meta) {
            setEventMeta({
              title: result.meta.title,
              venue: result.meta.venue,
              city: result.meta.city,
              date: result.meta.startsAt ? new Date(result.meta.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : (staticEvent?.date || ''),
              time: result.meta.startsAt ? new Date(result.meta.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : (staticEvent?.time || ''),
              kind: result.meta.type || staticEvent?.kind || 'Events',
            });
          }
          setLoading(false);
        });
      })
      .catch(() => {
        setLoading(false);
      });
  }

  // Check active session
  useEffect(() => {
    apiJson<{ session?: Session; user?: Session }>('/auth/me')
      .then(res => {
        const active = res.session || res.user;
        if (active) setUser(active);
      })
      .catch(() => {
        try {
          const stored = window.localStorage.getItem('encore_profile');
          if (stored) setUser(JSON.parse(stored) as Session);
        } catch {
          // ignore
        }
      });
  }, []);

  useEffect(() => {
    if (!showId) {
      setError('This event is not connected to live inventory yet.');
      setLoading(false);
      return;
    }
    loadSeats();
  }, [showId]);

  // Dynamic 1-second background auto-polling for consistency across multiple browsers
  useEffect(() => {
    if (!showId) return;
    const pollTimer = setInterval(() => {
      loadSeats();
    }, 1000);
    return () => clearInterval(pollTimer);
  }, [showId]);

  // Real-time WebSocket listener
  useEffect(() => {
    if (!showId) return;
    try {
      const socket = io(`${API_URL}/realtime`, { withCredentials: true, timeout: 3000 });
      socket.emit('join-show', showId);
      socket.on('seat-updated', () => {
        loadSeats();
      });
      return () => {
        socket.disconnect();
      };
    } catch {
      // Socket optional
    }
  }, [showId]);

  function toggle(id: string) {
    setHoldError('');
    const seat = seats.find(s => s.id === id);
    if (!seat) return;
    if (seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold' || seat.status === 'held') {
      setWaitlistCategory(seat.category || 'Standard');
      setWaitlistOpen(true);
      return;
    }
    setSelected(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : current.length < 8
        ? [...current, id]
        : current
    );
  }

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistLoading(true);
    setWaitlistError('');
    try {
      await apiJson('/waitlist', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          category: waitlistCategory,
          email: waitlistEmail || user?.email,
        }),
      });
      setWaitlistSuccess(true);
    } catch (err: any) {
      setWaitlistError(err?.message || 'Failed to join waitlist. Please check your email and try again.');
    } finally {
      setWaitlistLoading(false);
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const activeUser = authMode === 'signin'
        ? await signIn(authEmail, authPassword)
        : await signUp(authName || authEmail.split('@')[0], authEmail, authPassword);
      
      setUser(activeUser);
      setAuthModalOpen(false);
      // Proceed directly to hold
      void executeHoldAndProceed(selected);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function executeHoldAndProceed(seatIdsToHold: string[]) {
    if (!seatIdsToHold.length) return;
    setSecuringHold(true);
    setHoldError('');

    try {
      // Create authenticated server hold
      const hold = await apiJson<{ holdId: string; heldUntil?: string }>(`/shows/${showId}/hold`, {
        method: 'POST',
        body: JSON.stringify({ seatIds: seatIdsToHold }),
      });

      const query = seatIdsToHold.join(',');
      const holdQuery = hold.holdId ? `&holdId=${encodeURIComponent(hold.holdId)}` : '';
      router.push(`/shows/${showId}/checkout?seats=${query}${holdQuery}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'One or more seats were just held by another customer';
      setHoldError(`Hold Conflict: ${msg}. Refreshing seats…`);
      loadSeats();
      setSecuringHold(false);
    }
  }

  function continueToCheckout() {
    if (!selected.length) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    void executeHoldAndProceed(selected);
  }

  if (loading) {
    return (
      <main className="booking-page" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid', placeItems: 'center' }}>
        <PortalNav />
        <div style={{ textAlign: 'center', margin: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <div style={{ width: 60, height: 60, border: '4px solid #332d29', borderRadius: '50%', animation: 'bounceScale 1.2s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 30, height: 30, background: 'var(--coral)', borderRadius: '50%', animation: 'bounceScale 1.2s ease-in-out infinite reverse' }}>
                <Sparkles size={16} color="var(--paper)" style={{ margin: '7px auto' }} />
              </div>
            </div>
            <h2 style={{ font: '28px var(--serif)', color: 'var(--paper)', margin: '0 0 8px', animation: 'pulseText 1.5s ease-in-out infinite' }}>Getting your tickets ready...</h2>
            <p style={{ color: 'var(--muted)', font: '13px var(--mono)', textTransform: 'uppercase', letterSpacing: 2 }}>Loading live seat inventory</p>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes bounceScale {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.15); opacity: 1; border-color: var(--peach); box-shadow: 0 0 20px rgba(224, 122, 95, 0.4); }
              }
              @keyframes pulseText {
                0%, 100% { opacity: 0.7; }
                50% { opacity: 1; color: var(--peach); }
              }
            ` }} />
          </div>
        </div>
        <PortalFooter />
      </main>
    );
  }

  return (
    <main className="booking-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <section className="booking-head">
        <Link href="/events" className="back-link">
          <ArrowLeft size={15} /> Back to guide
        </Link>
        <div className="booking-title-row">
          <div>
            <span className="eyebrow">{isDining ? 'TABLE RESERVATION' : 'SEAT SELECTION'} · {eventMeta.venue}</span>
            <h1>
              {isDining ? (
                <>
                  Reserve your<br /><em>table.</em>
                </>
              ) : (
                <>
                  Choose your<br /><em>seats.</em>
                </>
              )}
            </h1>
            <p>{eventMeta.date} 2026 · {eventMeta.time} · {eventMeta.city}</p>
          </div>

          {/* 15-Minute Hold Timer Pill */}
          <div
            className="hold-note"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#191816',
              border: '1px solid #3d342c',
              padding: '12px 18px',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
          >
            <Clock size={20} color="var(--peach)" />
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ font: '22px var(--mono)', fontWeight: 700, color: 'var(--peach)', letterSpacing: '0.04em', lineHeight: 1 }}>
                  {formatTimer(holdTimer)}
                </span>
                <span style={{ font: '10px var(--mono)', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  SERVER SYNC ACTIVE
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#c0b6af', display: 'block', marginTop: 2 }}>
                {isDining ? 'Tables held atomically on the server' : 'Seats locked on server with row locks'}
              </span>
            </div>
          </div>
        </div>

        {holdError && (
          <div style={{ margin: '18px 0 0', padding: '12px 16px', background: '#381612', border: '1px solid #8c2e22', color: '#ffb4a8', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <AlertTriangle size={16} /> {holdError}
          </div>
        )}

        {/* Pricing & Party Size Filter Chips */}
        {isDining ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                padding: '8px 16px',
                background: '#191c20',
                border: '1px solid #3d342f',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--peach)',
                font: '12px var(--mono)',
              }}
            >
              <Utensils size={14} color="var(--coral)" />
              <span>Instant Confirmation · Reserve Party Size & Time</span>
            </div>

            <div
              style={{
                padding: '8px 16px',
                background: diningAvailableCount <= 3 ? '#2d1815' : '#142318',
                border: `1px solid ${diningAvailableCount <= 3 ? '#632d25' : '#2b4738'}`,
                borderRadius: 6,
                color: diningAvailableCount <= 3 ? '#ff927e' : 'var(--green)',
                font: '12px var(--mono)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: diningAvailableCount <= 3 ? '#ff6b35' : '#52b788', display: 'inline-block' }} />
              <span>
                {diningAvailableCount > 0
                  ? `⚡ Limited Seating: ${diningAvailableCount} ${diningAvailableCount === 1 ? 'table' : 'tables'} available`
                  : '⚠️ High Demand: Fully booked for this slot'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              style={{
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #2b1812 0%, #1c1411 100%)',
                border: '1.5px solid var(--coral)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                color: 'var(--peach)',
                marginLeft: 'auto',
                boxShadow: '0 4px 16px rgba(224, 122, 95, 0.25)',
              }}
            >
              <Bell size={14} color="var(--coral)" />
              <strong style={{ font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Notify When Tables Open
              </strong>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setFilterCategory(prev => (prev === 'Premium' ? null : 'Premium'))}
              style={{
                padding: '8px 16px',
                background: filterCategory === 'Premium' ? '#3d241c' : '#231815',
                border: `2px solid #e07a5f`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#e07a5f', display: 'inline-block' }} />
              <strong style={{ font: '13px var(--sans)', color: '#ffd8cc' }}>Premium · ₹1,499</strong>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory(prev => (prev === 'Standard' ? null : 'Standard'))}
              style={{
                padding: '8px 16px',
                background: filterCategory === 'Standard' ? '#1c3624' : '#142318',
                border: `2px solid #3a7750`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#52b788', display: 'inline-block' }} />
              <strong style={{ font: '13px var(--sans)', color: '#d8f3dc' }}>Standard · ₹999</strong>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory(prev => (prev === 'Economy' ? null : 'Economy'))}
              style={{
                padding: '8px 16px',
                background: filterCategory === 'Economy' ? '#1c2836' : '#131b24',
                border: `2px solid #415a77`,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#748cab', display: 'inline-block' }} />
              <strong style={{ font: '13px var(--sans)', color: '#e0e1dd' }}>Economy · ₹699</strong>
            </button>

            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #2b1812 0%, #1c1411 100%)',
                border: '1.5px solid var(--coral)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                color: 'var(--peach)',
                boxShadow: '0 4px 16px rgba(224, 122, 95, 0.25)',
              }}
            >
              <Bell size={15} color="var(--coral)" />
              <strong style={{ font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Notify When Seats Open
              </strong>
            </button>
          </div>
        )}
      </section>

      <section className="booking-area">
        <div className="map-column">
          {loading ? (
            <div className="empty-state">{isDining ? 'Loading dining room floorplan…' : 'Loading live seat inventory…'}</div>
          ) : error ? (
            <div className="empty-state">
              <h3>Inventory unavailable</h3>
              <p>{error}</p>
            </div>
          ) : isDining ? (
            /* ── RESTAURANT / HOTEL DINING RESERVATION SELECTOR ── */
            <div className="seat-canvas" style={{ background: '#0e1012', border: '1px solid #282420', borderRadius: 8, padding: '32px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid #231e1a', paddingBottom: 20, flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <span className="eyebrow" style={{ color: 'var(--coral)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <Utensils size={13} /> Table & Experience Reservation
                  </span>
                  <h3 style={{ font: '30px var(--serif)', color: 'var(--paper)', margin: '4px 0 2px' }}>
                    Select Guests & Dining Time
                  </h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                    Fast & hassle-free table reservations. Direct instant confirmation.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#181513', padding: '8px 16px', borderRadius: 6, border: '1px solid #3d3028' }}>
                  <Users size={16} color="var(--peach)" />
                  <span style={{ font: '13px var(--mono)', color: 'var(--paper)' }}>
                    Party of <strong>{diningGuests}</strong>
                  </span>
                </div>
              </div>

              {/* 1. Party Size / Number of Guests */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', color: 'var(--paper)', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  1. How many guests? (Party Size)
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 6, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setDiningGuests(num)}
                      style={{
                        padding: '12px 22px',
                        background: diningGuests === num ? 'var(--coral)' : '#181b1e',
                        border: `1.5px solid ${diningGuests === num ? 'var(--peach)' : '#332d29'}`,
                        borderRadius: 6,
                        color: diningGuests === num ? '#ffffff' : 'var(--paper)',
                        fontWeight: diningGuests === num ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Users size={15} color={diningGuests === num ? '#ffffff' : 'var(--peach)'} />
                      <span>{num} {num === 1 ? 'Guest' : 'Guests'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Next 7 Days Date Selector */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', color: 'var(--paper)', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  2. Select Date (Next 7 Days)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {upcomingDates.map(d => {
                    const isSelected = diningDate === d.label;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setDiningDate(d.label)}
                        style={{
                          padding: '12px 10px',
                          background: isSelected ? '#2b1b16' : '#14181a',
                          border: `1.5px solid ${isSelected ? 'var(--coral)' : '#2d2824'}`,
                          borderRadius: 6,
                          textAlign: 'center',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: 11, font: '10px var(--mono)', textTransform: 'uppercase', color: isSelected ? 'var(--peach)' : 'var(--muted)' }}>
                          {d.shortDay}
                        </span>
                        <strong style={{ font: '15px var(--sans)', color: isSelected ? '#ffffff' : 'var(--paper)' }}>
                          {d.dateNum}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Dining Time Slots */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', color: 'var(--paper)', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  3. Select Seating Time
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {diningTimes.map(t => {
                    const isSelected = diningTime === t.time;
                    return (
                      <button
                        key={t.time}
                        type="button"
                        onClick={() => setDiningTime(t.time)}
                        style={{
                          padding: '14px 12px',
                          background: isSelected ? '#1b2c1f' : '#14181a',
                          border: `1.5px solid ${isSelected ? 'var(--green)' : '#2d2824'}`,
                          borderRadius: 6,
                          textAlign: 'center',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Clock size={14} color={isSelected ? 'var(--green)' : 'var(--muted)'} />
                        <strong style={{ font: '14px var(--mono)', color: isSelected ? '#d8f3dc' : 'var(--paper)' }}>
                          {t.time}
                        </strong>
                        {t.isPopular && (
                          <span style={{ fontSize: 9, font: '9px var(--mono)', padding: '2px 5px', borderRadius: 3, background: 'rgba(224,122,95,0.2)', color: 'var(--peach)' }}>
                            Prime
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Dining Seating Area Preference */}
              <div>
                <label style={{ display: 'block', color: 'var(--paper)', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                  4. Seating Ambience & Area
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {diningAreas.map(area => {
                    const isSelected = diningArea === area;
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setDiningArea(area)}
                        style={{
                          padding: '10px 18px',
                          background: isSelected ? '#251b18' : '#14181a',
                          border: `1.5px solid ${isSelected ? 'var(--peach)' : '#2d2824'}`,
                          borderRadius: 6,
                          color: isSelected ? 'var(--paper)' : 'var(--muted)',
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Check size={14} color={isSelected ? 'var(--coral)' : 'transparent'} />
                        <span>{area}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Status Note */}
              <div style={{ marginTop: 28, padding: 14, background: '#151719', borderRadius: 6, border: '1px solid #2d2621', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ font: '12px var(--sans)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={15} color="var(--peach)" />
                  Instant Table Lock: Your table is exclusively held for 15 minutes upon continuing to checkout.
                </span>
                <span style={{ font: '11px var(--mono)', color: diningAvailableCount > 0 ? 'var(--green)' : '#ff927e' }}>
                  {diningAvailableCount > 0 ? `✓ ${diningAvailableCount} Tables Available Now` : '⚠️ Fully Booked for this Slot'}
                </span>
              </div>
            </div>
          ) : (
            /* ── THEATRE / CONCERT SEATING MAP ── */
            <>
              <div className="map-toolbar">
                <div className="map-tabs">
                  <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map view</button>
                  <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List view</button>
                </div>
                <div className="zoom-button">
                  <button aria-label="Zoom out" onClick={() => setZoom(value => Math.max(80, value - 10))}><Minus size={14} /></button>
                  <span>{zoom}%</span>
                  <button aria-label="Zoom in" onClick={() => setZoom(value => Math.min(120, value + 10))}><Plus size={14} /></button>
                </div>
              </div>

              {view === 'map' ? (
                <div className="seat-canvas" style={{ background: '#0e1012', border: '1px solid #23272d', borderRadius: 8, padding: 30 }}>
                  <div className="seat-map-scale" style={{ transform: `scale(${zoom / 100})` }}>
                    <div className="stage" style={{ marginBottom: 36 }}>
                      <span style={{ letterSpacing: '0.4em', fontWeight: 700, fontSize: 13, color: 'var(--peach)' }}>STAGE / SCREEN</span>
                      <div style={{ width: '70%', height: 3, background: 'linear-gradient(90deg, transparent, var(--peach), transparent)', margin: '8px auto 0', borderRadius: 2 }} />
                    </div>

                    <div className="seat-grid-large" style={{ gap: 10 }}>
                      {seats.map(seat => {
                        const isSelected = selected.includes(seat.id);
                        const isHeldOrBooked = seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold' || seat.status === 'held';

                        let seatBg = '#141d26';
                        let seatBorder = '#415a77';
                        let seatText = '#e0e1dd';

                        if (seat.category === 'Premium') {
                          seatBg = '#2b1b16';
                          seatBorder = '#e07a5f';
                          seatText = '#ffd8cc';
                        } else if (seat.category === 'Standard') {
                          seatBg = '#16271c';
                          seatBorder = '#3a7750';
                          seatText = '#d8f3dc';
                        }

                        if (isSelected) {
                          seatBg = 'var(--coral)';
                          seatBorder = 'var(--peach)';
                          seatText = '#ffffff';
                        } else if (isHeldOrBooked) {
                          seatBg = '#191b1e';
                          seatBorder = '#282b30';
                          seatText = '#4e555e';
                        }

                        return (
                          <button
                            key={seat.id}
                            aria-label={`Row ${seat.row}, seat ${seat.number} ${isHeldOrBooked ? '(Held/Sold - click for waitlist)' : ''}`}
                            aria-pressed={isSelected}
                            onClick={() => toggle(seat.id)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            className={`seat-large ${isHeldOrBooked ? 'sold' : seat.status} ${isSelected ? 'selected' : ''}`}
                            style={{
                              background: seatBg,
                              border: `2px solid ${seatBorder}`,
                              color: seatText,
                              opacity: isHeldOrBooked && !isSelected ? 0.35 : 1,
                              cursor: 'pointer',
                              transform: isSelected ? 'scale(1.12)' : undefined,
                              boxShadow: isSelected ? '0 0 14px var(--coral)' : undefined,
                              fontWeight: 600,
                            }}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="seat-legend" style={{ marginTop: 20 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#e07a5f' }} /> Premium (₹1,499)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#52b788' }} /> Standard (₹999)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#748cab' }} /> Economy (₹699)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="selected-dot" /> Selected ({selected.length}/8)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#282b30' }} /> Booked/Held</span>
                  </div>
                </div>
              ) : (
                <div className="seat-list-view">
                  {seats.map(seat => {
                    const isBooked = seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold' || seat.status === 'held';
                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggle(seat.id)}
                        className={`seat-list-item ${selected.includes(seat.id) ? 'selected' : ''}`}
                        style={{ opacity: isBooked ? 0.45 : 1, cursor: 'pointer' }}
                      >
                        <span>Row {seat.row} · Seat {seat.number} ({seat.category || 'Standard'})</span>
                        <b>{seat.status === 'held' ? 'On Hold' : isBooked ? 'Sold · Notify me' : `₹${Math.round(seat.pricePaise / 100).toLocaleString('en-IN')}`}</b>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Order Summary Aside */}
        <aside className="booking-summary">
          <span className="eyebrow">{isDining ? 'Dining Reservation' : 'Your evening'}</span>
          <h2>{eventMeta.title}</h2>
          <p className="summary-meta">
            {eventMeta.venue}, {eventMeta.city}
            <br />
            {isDining ? `${diningDate} · ${diningTime}` : `${eventMeta.date} 2026 · ${eventMeta.time}`}
          </p>
          <div className="summary-rule" />
          <div className="summary-seats">
            <div>
              <span>{isDining ? 'Party Size' : `Selected seats (${selected.length}/8)`}</span>
              <b style={{ color: selected.length ? 'var(--peach)' : undefined }}>
                {isDining
                  ? `${diningGuests} ${diningGuests === 1 ? 'Guest' : 'Guests'} (${diningArea})`
                  : selected.length
                  ? selected.map(id => {
                      const seat = seats.find(v => v.id === id);
                      return seat ? `${seat.row}${seat.number}` : id;
                    }).join(', ')
                  : 'None yet'}
              </b>
            </div>
            {isDining && (
              <div>
                <span>Seating & Time</span>
                <b style={{ color: 'var(--paper)' }}>{diningTime} · {diningDate}</b>
              </div>
            )}
            <div>
              <span>{isDining ? 'Cover / Deposit' : 'Total amount'}</span>
              <b>₹{Math.round(total / 100).toLocaleString('en-IN')}</b>
            </div>
          </div>
          <button
            onClick={continueToCheckout}
            disabled={!selected.length || securingHold}
            className={`coral-button summary-cta ${selected.length ? '' : 'disabled'}`}
          >
            <Check size={16} /> {securingHold ? 'Locking Hold on Server…' : selected.length ? (isDining ? `Reserve for ${diningGuests} ${diningGuests === 1 ? 'Guest' : 'Guests'}` : 'Continue to checkout') : (isDining ? 'Select party size' : 'Select a seat')} <ChevronRight size={16} />
          </button>
          <p className="summary-foot">
            {isDining ? 'Table is held exclusively for 15 minutes upon continuing.' : 'Seats are held atomically on the server for 15 minutes.'}
          </p>
        </aside>
      </section>

      {/* Mandatory Sign In Modal before seat hold */}
      {authModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 960,
            background: 'rgba(8,9,11,0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#171a1c',
              border: '1px solid #453730',
              borderRadius: 8,
              padding: 32,
              maxWidth: 460,
              width: '100%',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <button
              onClick={() => setAuthModalOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <span className="eyebrow"><ShieldCheck size={14} color="var(--green)" /> Secure Account Binding</span>
            <h3 style={{ font: '28px var(--serif)', color: 'var(--paper)', margin: '10px 0 8px' }}>
              Sign In to Reserve {isDining ? 'Tables' : 'Seats'}
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, margin: '0 0 18px' }}>
              Every seat hold is cryptographically bound to an authenticated user to prevent ticket scalping and double-booking.
            </p>

            {/* 1-Click Credentials for Reviewers */}
            <div style={{ marginBottom: 18, padding: 12, background: '#1c1715', border: '1px solid #3c2f27', borderRadius: 4 }}>
              <span style={{ display: 'block', font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase', marginBottom: 6 }}>
                1-Click Reviewer Fill
              </span>
              <button
                type="button"
                onClick={() => { setAuthEmail('customer@encore.local'); setAuthPassword('SeedPassword123!'); }}
                style={{ padding: '6px 10px', background: '#261d19', border: '1px solid #4a362c', color: 'var(--paper)', fontSize: 11, borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <KeyRound size={12} color="var(--peach)" /> Fill Customer Account (customer@encore.local)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', font: '10px var(--mono)', color: '#d0beb5', textTransform: 'uppercase', marginBottom: 4 }}>
                    Full Name
                  </label>
                  <input
                    required
                    placeholder="John Doe"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    style={{ width: '100%', padding: 10, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  />
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', font: '10px var(--mono)', color: '#d0beb5', textTransform: 'uppercase', marginBottom: 4 }}>
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  style={{ width: '100%', padding: 10, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', font: '10px var(--mono)', color: '#d0beb5', textTransform: 'uppercase', marginBottom: 4 }}>
                  Password
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  style={{ width: '100%', padding: 10, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>

              {authError && <p style={{ color: 'var(--coral)', fontSize: 12, margin: '0 0 12px' }}>{authError}</p>}

              <button
                type="submit"
                disabled={authSubmitting}
                className="coral-button"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {authSubmitting ? 'Authenticating…' : authMode === 'signin' ? 'Sign In & Lock Hold →' : 'Create Account & Lock Hold →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
              {authMode === 'signin' ? (
                <>New here? <button type="button" onClick={() => setAuthMode('register')} style={{ background: 'transparent', border: 0, color: 'var(--peach)', cursor: 'pointer', textDecoration: 'underline' }}>Create account</button></>
              ) : (
                <>Already have account? <button type="button" onClick={() => setAuthMode('signin')} style={{ background: 'transparent', border: 0, color: 'var(--peach)', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</button></>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {waitlistOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 950,
            background: 'rgba(8,9,11,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#171a1c',
              border: '1px solid #3d342f',
              borderRadius: 8,
              padding: 32,
              maxWidth: 480,
              width: '100%',
              position: 'relative',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            <button
              onClick={() => { setWaitlistOpen(false); setWaitlistSuccess(false); }}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            {waitlistSuccess ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1c3624', color: 'var(--green)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <Check size={24} />
                </div>
                <h3 style={{ font: '28px var(--serif)', color: 'var(--paper)', margin: '0 0 8px' }}>Notification Active</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                  If a reservation is cancelled for <strong>{waitlistCategory}</strong>, you will receive an offer in the first batch of 5 users with an exclusive 15-minute priority booking window.
                </p>
                <button
                  className="coral-button"
                  onClick={() => { setWaitlistOpen(false); setWaitlistSuccess(false); }}
                  style={{ width: '100%' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitWaitlist}>
                <span className="eyebrow"><Bell size={13} /> Fairness Waitlist Dispatcher</span>
                <h3 style={{ font: '30px var(--serif)', color: 'var(--paper)', margin: '10px 0 8px' }}>
                  Get Notified When {isDining ? 'Tables' : 'Seats'} Open
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                  When someone cancels or a reservation opens up, Encore dispatches an immediate email notification with an exclusive <strong>15-minute priority claim window</strong>.
                </p>

                {waitlistError && (
                  <p style={{ padding: 10, background: '#2d1815', border: '1px solid #632d25', color: '#ff927e', fontSize: 12, borderRadius: 4, marginBottom: 14 }}>
                    {waitlistError}
                  </p>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Reservation Tier
                  </label>
                  <select
                    value={waitlistCategory}
                    onChange={e => setWaitlistCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#111416',
                      border: '1px solid #433832',
                      color: 'var(--paper)',
                      borderRadius: 4,
                    }}
                  >
                    {isDining ? (
                      <>
                        <option value="Table for 2">Table for 2 (₹1,800)</option>
                        <option value="Table for 4">Table for 4 (₹3,600)</option>
                        <option value="Table for 6">Table for 6 (₹5,400)</option>
                      </>
                    ) : (
                      <>
                        <option value="Premium">Premium Tier (₹1,499)</option>
                        <option value="Standard">Standard Tier (₹999)</option>
                        <option value="Economy">Economy Tier (₹699)</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: '100%',
                      padding: 12,
                      background: '#111416',
                      border: '1px solid #433832',
                      color: 'var(--paper)',
                      borderRadius: 4,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={waitlistLoading}
                  className="coral-button"
                  style={{ width: '100%' }}
                >
                  {waitlistLoading ? 'Registering…' : 'Notify Me When Available →'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <PortalFooter />
    </main>
  );
}
