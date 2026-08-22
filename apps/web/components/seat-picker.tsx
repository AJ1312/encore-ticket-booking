'use client';

import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Clock3, Info, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';
import { apiJson, API_URL } from '@/lib/api';
import { io } from 'socket.io-client';

type SeatStatus = 'available' | 'held' | 'booked' | 'blocked';
type Seat = { id: string; row: string; number: number; pricePaise: number; status: SeatStatus; category?: string };

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
          <div className="hold-note">
            <Clock3 size={15} /> 15 minute server hold
          </div>
        </div>
      </section>

      <section className="booking-area">
        <div className="map-column">
          {loading ? (
            <div className="empty-state">Loading live seat inventory from API…</div>
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
                    <div className="stage">STAGE</div>
                    <div className="seat-grid-large">
                      {seats.map(seat => (
                        <button
                          key={seat.id}
                          disabled={seat.status !== 'available'}
                          aria-label={`Row ${seat.row}, seat ${seat.number}`}
                          onClick={() => toggle(seat.id)}
                          className={`seat-large ${seat.status === 'booked' || seat.status === 'blocked' ? 'sold' : seat.status} ${
                            selected.includes(seat.id) ? 'selected' : ''
                          }`}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  </div>
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
              <span>Selected seats</span>
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
