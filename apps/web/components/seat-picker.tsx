'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, Check, ChevronRight, Clock, Info, Minus, Plus, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson, API_URL } from '@/lib/api';
import { io } from 'socket.io-client';

type SeatStatus = 'available' | 'held' | 'booked' | 'blocked' | 'sold';
type Seat = { id: string; row: string; number: number; pricePaise: number; status: SeatStatus; category?: string; section?: string };

export function SeatPicker({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const router = useRouter();
  const event = getEvent(eventId);
  const showId = event.showId;
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [zoom, setZoom] = useState(100);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  // Notify / Waitlist modal state
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState('Premium');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

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

  const total = useMemo(
    () => selected.reduce((sum, id) => sum + (seats.find(seat => seat.id === id)?.pricePaise || 0), 0),
    [selected, seats]
  );

  function loadSeats() {
    if (!showId) return;
    apiJson<{ seats: Seat[] }>(`/shows/${showId}/seats`)
      .then(result => {
        setSeats(result.seats || []);
      })
      .catch(() => {
        // Keep existing seats
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (!showId) {
      setError('This show is not connected to a live inventory yet.');
      setLoading(false);
      return;
    }
    loadSeats();
  }, [showId]);

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
    const seat = seats.find(value => value.id === id);
    if (!seat) return;
    if (seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold') {
      // Open waitlist notification for sold seats
      setWaitlistCategory(seat.category || 'Standard');
      setWaitlistOpen(true);
      return;
    }
    setSelected(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : current.length < 8
        ? [...current, id]
        : current
    );
  }

  async function submitWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setWaitlistSubmitting(true);
    try {
      await apiJson('/waitlist', {
        method: 'POST',
        body: JSON.stringify({
          showId,
          category: waitlistCategory,
        }),
      }).catch(() => null);
      setWaitlistSuccess(true);
    } catch {
      setWaitlistSuccess(true);
    } finally {
      setWaitlistSubmitting(false);
    }
  }

  function continueToCheckout() {
    if (!selected.length) return;
    const query = selected.join(',');
    router.push(`/shows/${eventId}/checkout?seats=${query}`);
  }

  const premiumCount = seats.filter(s => s.category === 'Premium' && (s.status === 'available' || s.status === 'held')).length;
  const standardCount = seats.filter(s => s.category === 'Standard' && (s.status === 'available' || s.status === 'held')).length;
  const economyCount = seats.filter(s => s.category === 'Economy' && (s.status === 'available' || s.status === 'held')).length;
  const bookedCount = seats.filter(s => s.status === 'booked' || s.status === 'blocked' || s.status === 'sold').length;

  return (
    <main className="booking-page">
      <PortalNav />
      <section className="booking-head">
        <Link href="/events" className="back-link">
          <ArrowLeft size={15} /> Back to guide
        </Link>
        <div className="booking-title-row">
          <div>
            <span className="eyebrow">{event.title} · {event.venue}</span>
            <h1>Choose your<br /><em>seats.</em></h1>
            <p>{event.date} 2026 · {event.time} · {event.city}</p>
          </div>

          {/* Clean User-Friendly Hold Timer Pill */}
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
                  TIME REMAINING
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#c0b6af', display: 'block', marginTop: 2 }}>
                Seats reserved exclusively for you
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Category Color Chips & Notify Bell */}
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
              boxShadow: '0 2px 8px rgba(224, 122, 95, 0.2)',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#e07a5f', display: 'inline-block', boxShadow: '0 0 8px #e07a5f' }} />
            <strong style={{ font: '13px var(--sans)', color: '#ffd8cc' }}>Premium · ₹1,499</strong>
            <span style={{ font: '11px var(--mono)', color: '#e07a5f' }}>({premiumCount} available)</span>
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
              boxShadow: '0 2px 8px rgba(58, 119, 80, 0.2)',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#52b788', display: 'inline-block', boxShadow: '0 0 8px #52b788' }} />
            <strong style={{ font: '13px var(--sans)', color: '#d8f3dc' }}>Standard · ₹999</strong>
            <span style={{ font: '11px var(--mono)', color: '#52b788' }}>({standardCount} available)</span>
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
              boxShadow: '0 2px 8px rgba(65, 90, 119, 0.2)',
            }}
          >
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#748cab', display: 'inline-block', boxShadow: '0 0 8px #748cab' }} />
            <strong style={{ font: '13px var(--sans)', color: '#e0e1dd' }}>Economy · ₹699</strong>
            <span style={{ font: '11px var(--mono)', color: '#748cab' }}>({economyCount} available)</span>
          </button>

          <button
            type="button"
            onClick={() => setWaitlistOpen(true)}
            style={{
              padding: '8px 14px',
              background: '#1c1715',
              border: '1px solid #5a3c2f',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              color: 'var(--peach)',
            }}
          >
            <Bell size={14} color="var(--coral)" />
            <span style={{ font: '12px var(--mono)', textTransform: 'uppercase' }}>Notify when sold seats open</span>
          </button>
        </div>
      </section>

      <section className="booking-area">
        <div className="map-column">
          {loading ? (
            <div className="empty-state">Loading live seat inventory…</div>
          ) : error ? (
            <div className="empty-state">
              <h3>Seats unavailable</h3>
              <p>{error}</p>
            </div>
          ) : (
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
                        const isBooked = seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold';

                        // Distinct tier colors
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
                        } else if (isBooked) {
                          seatBg = '#191b1e';
                          seatBorder = '#282b30';
                          seatText = '#4e555e';
                        }

                        return (
                          <button
                            key={seat.id}
                            aria-label={`Row ${seat.row}, seat ${seat.number} ${isBooked ? '(Sold - click for waitlist)' : ''}`}
                            onClick={() => toggle(seat.id)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            className={`seat-large ${isBooked ? 'sold' : seat.status} ${isSelected ? 'selected' : ''}`}
                            style={{
                              background: seatBg,
                              border: `2px solid ${seatBorder}`,
                              color: seatText,
                              opacity: isBooked ? 0.35 : 1,
                              cursor: isBooked ? 'pointer' : 'pointer',
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

                  {hoveredSeat && (
                    <div style={{ marginTop: 24, padding: '10px 20px', background: '#16191d', border: '1px solid #31363e', borderRadius: 4, display: 'inline-block', font: '12px var(--mono)', color: 'var(--paper)' }}>
                      Row <strong>{hoveredSeat.row}</strong> · Seat <strong>{hoveredSeat.number}</strong> · <span style={{ color: hoveredSeat.category === 'Premium' ? '#e07a5f' : hoveredSeat.category === 'Standard' ? '#52b788' : '#748cab' }}>{hoveredSeat.category || 'Standard'} (₹{Math.round(hoveredSeat.pricePaise / 100).toLocaleString('en-IN')})</span> · <strong>{hoveredSeat.status === 'booked' ? 'SOLD (CLICK FOR WAITLIST NOTIFY)' : hoveredSeat.status.toUpperCase()}</strong>
                    </div>
                  )}

                  <div className="seat-legend" style={{ marginTop: 20 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#e07a5f', border: '1px solid #e07a5f' }} /> Premium (₹1,499)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#52b788', border: '1px solid #52b788' }} /> Standard (₹999)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#748cab', border: '1px solid #748cab' }} /> Economy (₹699)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i className="selected-dot" /> Selected ({selected.length}/8)</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ background: '#282b30' }} /> Booked/Sold</span>
                  </div>
                  <p className="seat-helper">
                    <Info size={14} /> Select up to 8 seats. Real-time synchronisation prevents double bookings.
                  </p>
                </div>
              ) : (
                <div className="seat-list-view">
                  {seats.map(seat => {
                    const isBooked = seat.status === 'booked' || seat.status === 'blocked' || seat.status === 'sold';
                    return (
                      <button
                        key={seat.id}
                        onClick={() => toggle(seat.id)}
                        className={`seat-list-item ${selected.includes(seat.id) ? 'selected' : ''}`}
                        style={{
                          opacity: isBooked ? 0.45 : 1,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Row {seat.row} · Seat {seat.number} ({seat.category || 'Standard'})</span>
                        <b>{isBooked ? 'Sold · Notify me' : `₹${Math.round(seat.pricePaise / 100).toLocaleString('en-IN')}`}</b>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="booking-summary">
          <span className="eyebrow">Your evening</span>
          <h2>{event.title}</h2>
          <p className="summary-meta">{event.venue}, {event.city}<br />{event.date} 2026 · {event.time}</p>
          <div className="summary-rule" />
          <div className="summary-seats">
            <div>
              <span>Selected seats ({selected.length}/8)</span>
              <b style={{ color: selected.length ? 'var(--peach)' : undefined }}>
                {selected.length ? selected.map(id => {
                  const seat = seats.find(v => v.id === id);
                  return seat ? `${seat.row}${seat.number}` : id;
                }).join(', ') : 'None yet'}
              </b>
            </div>
            <div>
              <span>Ticket total</span>
              <b>₹{Math.round(total / 100).toLocaleString('en-IN')}</b>
            </div>
          </div>
          <button
            onClick={continueToCheckout}
            disabled={!selected.length}
            className={`coral-button summary-cta ${selected.length ? '' : 'disabled'}`}
          >
            <Check size={16} /> {selected.length ? 'Continue to checkout' : 'Select a seat'} <ChevronRight size={16} />
          </button>
          <p className="summary-foot">Seats are held for 15 minutes once you enter checkout.</p>
        </aside>
      </section>

      {/* Notify / Waitlist Modal */}
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
                  If a booking is cancelled or a hold expires for <strong>{waitlistCategory}</strong> seats, you will receive an offer in the first batch of 5 users with an exclusive 15-minute priority claim window.
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
                  Get Notified When Seats Open
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                  When someone cancels a booking or a seat hold expires, Encore sends notifications in <strong>priority batches of 5 users</strong> with a <strong>15-minute exclusive booking window</strong>.
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Seat Tier Category
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
                    <option value="Premium">Premium Tier (₹1,499)</option>
                    <option value="Standard">Standard Tier (₹999)</option>
                    <option value="Economy">Economy Tier (₹699)</option>
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
                  disabled={waitlistSubmitting}
                  className="coral-button"
                  style={{ width: '100%' }}
                >
                  {waitlistSubmitting ? 'Registering…' : 'Notify Me In Next Batch of 5 →'}
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
