'use client';

import Link from 'next/link';
import { ArrowLeft, Check, ChevronRight, Clock3, Info, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';

const seats = Array.from({ length: 72 }, (_, index) => ({ id: index, row: String.fromCharCode(65 + Math.floor(index / 12)), number: index % 12 + 1, price: index < 24 ? 1499 : index < 48 ? 999 : 699, status: [7, 8, 20, 21, 50, 51].includes(index) ? 'sold' : 'available' }));

export function SeatPicker({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const router = useRouter();
  const event = getEvent(eventId);
  const [selected, setSelected] = useState<number[]>([]);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [zoom, setZoom] = useState(100);
  const total = useMemo(() => selected.reduce((sum, index) => sum + seats[index].price, 0), [selected]);
  function toggle(index: number) { if (seats[index].status !== 'sold') setSelected(current => current.includes(index) ? current.filter(value => value !== index) : current.length < 8 ? [...current, index] : current); }
  function continueToCheckout() {
    if (!selected.length) return;
    const query = selected.join(',');
    try {
      const signedIn = Boolean(window.localStorage.getItem('encore_profile'));
      router.push(signedIn ? `/shows/${eventId}/checkout?seats=${query}` : `/login?next=/shows/${eventId}/checkout?seats=${query}`);
    } catch { router.push(`/login?next=/shows/${eventId}/checkout?seats=${query}`); }
  }
  return <main className="booking-page"><PortalNav /><section className="booking-head"><Link href="/events" className="back-link"><ArrowLeft size={15}/> Back to guide</Link><div className="booking-title-row"><div><span className="eyebrow">{event.title} · {event.venue}</span><h1>Choose your<br/><em>seats.</em></h1><p>{event.date} 2026 · {event.time} · {event.city}</p></div><div className="hold-note"><Clock3 size={15}/> 10 minute hold</div></div></section><section className="booking-area"><div className="map-column"><div className="map-toolbar"><div className="map-tabs"><button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>Map view</button><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>List view</button></div><div className="zoom-button"><button aria-label="Zoom out" onClick={() => setZoom(value => Math.max(80, value - 10))}><Minus size={14}/></button><span>{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom(value => Math.min(120, value + 10))}><Plus size={14}/></button></div></div>{view === 'map' ? <div className="seat-canvas"><div className="seat-map-scale" style={{ transform: `scale(${zoom / 100})` }}><div className="stage">STAGE</div><div className="seat-grid-large">{seats.map((seat, index) => <button key={seat.id} disabled={seat.status === 'sold'} aria-label={`Row ${seat.row}, seat ${seat.number}`} onClick={() => toggle(index)} className={`seat-large ${seat.status} ${selected.includes(index) ? 'selected' : ''}`}>{seat.number}</button>)}</div></div><div className="seat-legend"><span><i/> Available</span><span><i className="selected-dot"/> Selected</span><span><i className="sold-dot"/> Sold</span></div><p className="seat-helper"><Info size={14}/> Select up to 8 seats. Prices include all taxes.</p></div> : <div className="seat-list-view">{seats.map((seat, index) => <button key={seat.id} disabled={seat.status === 'sold'} onClick={() => toggle(index)} className={`seat-list-item ${selected.includes(index) ? 'selected' : ''}`}><span>Row {seat.row} · Seat {seat.number}</span><b>{seat.status === 'sold' ? 'Sold' : `₹${seat.price.toLocaleString('en-IN')}`}</b></button>)}</div>}</div><aside className="booking-summary"><span className="eyebrow">Your evening</span><h2>{event.title}</h2><p className="summary-meta">{event.venue}, {event.city}<br/>{event.date} 2026 · {event.time}</p><div className="summary-rule"/><div className="summary-seats"><div><span>Selected seats</span><b>{selected.length ? selected.map(index => `${seats[index].row}${seats[index].number}`).join(', ') : 'None yet'}</b></div><div><span>Ticket total</span><b>₹{total.toLocaleString('en-IN')}</b></div></div><button onClick={continueToCheckout} className={`coral-button summary-cta ${selected.length ? '' : 'disabled'}`}><Check size={16}/> {selected.length ? 'Continue to checkout' : 'Select a seat'} <ChevronRight size={16}/></button><p className="summary-foot">You’ll sign in before checkout so your ticket stays with you.</p></aside></section><PortalFooter/></main>;
}
