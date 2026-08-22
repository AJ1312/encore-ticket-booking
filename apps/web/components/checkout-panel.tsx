'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole } from 'lucide-react';
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
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'confirmed'>('loading');
  const [message, setMessage] = useState('Preparing your hold…');
  useEffect(() => { if (!event.showId || !seatIds.length) { setState('error'); setMessage('Your seat selection is missing. Please return to the seat map.'); return; } void (async () => { try { const inventory = await apiJson<{ seats: Seat[] }>(`/shows/${event.showId}/seats`); const chosen = inventory.seats.filter(seat => seatIds.includes(seat.id)); if (chosen.length !== seatIds.length) throw new Error('One or more selected seats no longer exist.'); const hold = await apiJson<{ holdId: string }>(`/shows/${event.showId}/hold`, { method: 'POST', body: JSON.stringify({ seatIds }) }); setHoldId(hold.holdId); setSeats(chosen); setState('ready'); } catch { setState('error'); setMessage('Your seats could not be held. They may have just been taken.'); } })(); }, [event.showId, seatIds]);
  const totalPaise = seats.reduce((sum, seat) => sum + seat.pricePaise, 0);
  async function confirm() { if (state !== 'ready') return; setState('loading'); setMessage('Confirming your booking…'); try { const result = await apiJson<{ bookingRef: string }>('/bookings/confirm', { method: 'POST', body: JSON.stringify({ seatIds, holdId, idempotencyKey: crypto.randomUUID() }) }); setState('confirmed'); router.push(`/booking/${result.bookingRef}/confirmation`); } catch { setState('error'); setMessage('The hold expired or could not be confirmed. Please choose your seats again.'); } }
  const seatLabels = seats.map(seat => `${seat.row}${seat.number}`).join(', ');
  return <main className="booking-page"><PortalNav /><section className="checkout-wrap"><Link href={`/shows/${eventId}`} className="back-link"><ArrowLeft size={15}/> Back to seats</Link><div className="checkout-grid"><div><span className="eyebrow">Final step · Server-side hold</span><h1>Make it<br/><em>yours.</em></h1><p className="checkout-lede">Your seats are checked and held by PostgreSQL before confirmation.</p><div className="checkout-card"><h2>Contact details</h2><label>Full name<input placeholder="Your name" autoComplete="name"/></label><label>Email address<input type="email" placeholder="you@example.com" autoComplete="email"/></label><p className="secure-note"><LockKeyhole size={14}/> Used only for your receipt and event updates.</p></div></div><aside className="checkout-order"><span className="eyebrow">Order summary</span><h2>{event.title}</h2><p>{event.venue} · {event.date} · {event.time}</p>{state === 'error' ? <p className="form-error">{message}</p> : <><div className="order-line"><span>Seats · {seatLabels || 'Loading…'}</span><b>₹{Math.round(totalPaise / 100).toLocaleString('en-IN')}</b></div><div className="order-line"><span>Encore service fee</span><b>₹99</b></div><div className="order-line total-line"><span>Total</span><b>₹{(Math.round(totalPaise / 100) + 99).toLocaleString('en-IN')}</b></div><button type="button" onClick={confirm} disabled={state !== 'ready'} className="coral-button">{state === 'loading' ? message : 'Confirm booking'} <Check size={16}/></button><small>Booking is confirmed only after the server accepts the held seats.</small></>}</aside></div></section><PortalFooter/></main>;
}
