'use client';

import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Clock3, Info, Minus, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson, API_URL } from '@/lib/api';
import { io } from 'socket.io-client';

type SeatStatus = 'available' | 'held' | 'booked' | 'blocked';
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

  const total = useMemo(
    () => selected.reduce((sum, id) => sum + (seats.find(seat => seat.id === id)?.pricePaise || 0), 0),
    [selected, seats]
  );

  useEffect(() => {
    if (!showId) {
      setError('This show is not connected to a live inventory yet.');
      setLoading(false);
      return;
    }
    let isMounted = true;
    apiJson<{ seats: Seat[] }>(`/shows/${showId}/seats`)
      .then(result => {
        if (isMounted) {
          setSeats(result.seats || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Seat inventory is temporarily unavailable. Render API may be spinning up.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [showId]);

  useEffect(() => {
    if (!showId) return;
    try {
      const socket = io(`${API_URL}/realtime`, { withCredentials: true, timeout: 3000 });
      socket.emit('join-show', showId);
      socket.on('seat-updated', () => {
        void apiJson<{ seats: Seat[] }>(`/shows/${showId}/seats`).then(result => {
          setSeats(result.seats || []);
          setSelected(current => current.filter(id => result.seats.some(seat => seat.id === id && seat.status === 'available')));
        });
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
    if (!seat || seat.status !== 'available') return;
    setSelected(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : current.length < 8
        ? [...current, id]
        : current
    );
  }

  function continueToCheckout() {
    if (!selected.length) return;
    const query = selected.join(',');
    router.push(`/shows/${eventId}/checkout?seats=${query}`);
  }

  // Tier counts
  const premiumCount = seats.filter(s => s.category === 'Premium' && s.status === 'available').length;
  const standardCount = seats.filter(s => s.category === 'Standard' && s.status === 'available').length;
  const economyCount = seats.filter(s => s.category === 'Economy' && s.status === 'available').length;

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
          <div className="hold-note" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1c1b18', border: '1px solid #3d342c', color: 'var(--peach)', padding: '10px 16px', borderRadius: 4 }}>
            <Clock3 size={16} />
            <div>
              <span style={{ display: 'block', font: '11px var(--mono)', fontWeight: 600, letterSpacing: '0.04em' }}>15-MIN SERVER HOLD</span>
              <span style={{ fontSize: 11, color: '#c0b6af' }}>PostgreSQL atomic row lock</span>
            </div>
          </div>
        </div>

        {/* Pricing Category Bands */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', background: '#191816', border: '1px solid #362f2b', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' }} />
            <span style={{ font: '12px var(--sans)', color: 'var(--paper)' }}>Premium · ₹1,499</span>
            <span style={{ font: '10px var(--mono)', color: 'var(--muted)' }}>({premiumCount} available)</span>
          </div>
          <div style={{ padding: '8px 16px', background: '#191816', border: '1px solid #362f2b', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ font: '12px var(--sans)', color: 'var(--paper)' }}>Standard · ₹999</span>
            <span style={{ font: '10px var(--mono)', color: 'var(--muted)' }}>({standardCount} available)</span>
          </div>
          <div style={{ padding: '8px 16px', background: '#191816', border: '1px solid #362f2b', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8e968f', display: 'inline-block' }} />
            <span style={{ font: '12px var(--sans)', color: 'var(--paper)' }}>Economy · ₹699</span>
            <span style={{ font: '10px var(--mono)', color: 'var(--muted)' }}>({economyCount} available)</span>
          </div>
        </div>
      </section>

      <section className="booking-area">
        <div className="map-column">
          {loading ? (
            <div className="empty-state">Loading live seat inventory from database…</div>
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
                <div className="seat-canvas">
                  <div className="seat-map-scale" style={{ transform: `scale(${zoom / 100})` }}>
                    <div className="stage">
                      <span style={{ letterSpacing: '0.3em', fontWeight: 600 }}>STAGE</span>
                      <div style={{ width: '60%', height: 2, background: 'linear-gradient(90deg, transparent, var(--peach), transparent)', margin: '6px auto 0' }} />
                    </div>
                    <div className="seat-grid-large">
                      {seats.map(seat => {
                        const isSelected = selected.includes(seat.id);
                        const isAvailable = seat.status === 'available';
                        return (
                          <button
                            key={seat.id}
                            disabled={!isAvailable}
                            aria-label={`Row ${seat.row}, seat ${seat.number}`}
                            onClick={() => toggle(seat.id)}
                            onMouseEnter={() => setHoveredSeat(seat)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            className={`seat-large ${seat.status === 'booked' || seat.status === 'blocked' ? 'sold' : seat.status} ${
                              isSelected ? 'selected' : ''
                            }`}
                            style={{
                              borderColor: isSelected ? 'var(--peach)' : seat.category === 'Premium' ? '#e07a5f66' : seat.category === 'Standard' ? '#3a775066' : undefined,
                            }}
                          >
                            {seat.number}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {hoveredSeat && (
                    <div style={{ marginTop: 16, padding: '8px 16px', background: '#121416', border: '1px solid #2b2523', display: 'inline-block', font: '11px var(--mono)', color: 'var(--peach)' }}>
                      Row {hoveredSeat.row} · Seat {hoveredSeat.number} · {hoveredSeat.category || 'Standard'} (₹{Math.round(hoveredSeat.pricePaise / 100).toLocaleString('en-IN')}) · {hoveredSeat.status.toUpperCase()}
                    </div>
                  )}

                  <div className="seat-legend">
                    <span><i /> Available</span>
                    <span><i className="selected-dot" /> Selected ({selected.length}/8)</span>
                    <span><i className="sold-dot" /> Sold/Blocked</span>
                  </div>
                  <p className="seat-helper">
                    <Info size={14} /> Select up to 8 seats. Prices include all taxes. Server-synchronised state.
                  </p>
                </div>
              ) : (
                <div className="seat-list-view">
                  {seats.map(seat => (
                    <button
                      key={seat.id}
                      disabled={seat.status !== 'available'}
                      onClick={() => toggle(seat.id)}
                      className={`seat-list-item ${selected.includes(seat.id) ? 'selected' : ''}`}
                    >
                      <span>Row {seat.row} · Seat {seat.number} ({seat.category || 'Standard'})</span>
                      <b>{seat.status !== 'available' ? 'Unavailable' : `₹${Math.round(seat.pricePaise / 100).toLocaleString('en-IN')}`}</b>
                    </button>
                  ))}
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
              <b>{selected.length ? selected.map(id => {
                const seat = seats.find(v => v.id === id);
                return seat ? `${seat.row}${seat.number}` : id;
              }).join(', ') : 'None yet'}</b>
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
          <p className="summary-foot">Seats will be locked for 15 minutes once you enter checkout.</p>
        </aside>
      </section>
      <PortalFooter />
    </main>
  );
}
