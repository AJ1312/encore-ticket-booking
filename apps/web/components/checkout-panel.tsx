'use client';

import Link from 'next/link';
import { ArrowLeft, Check, LockKeyhole } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';
import { getEvent } from '@/lib/events';

export function CheckoutPanel({ eventId = 'the-night-we-remember' }: { eventId?: string }) {
  const params = useSearchParams();
  const event = getEvent(eventId);
  const seatQuery = params.get('seats') || '0';
  const seatLabels = seatQuery.split(',').map(value => `A${Number(value) + 1}`).join(', ');
  return <main className="booking-page"><PortalNav /><section className="checkout-wrap"><Link href={`/shows/${eventId}`} className="back-link"><ArrowLeft size={15}/> Back to seats</Link><div className="checkout-grid"><div><span className="eyebrow">Final step · Your seats are held</span><h1>Make it<br/><em>yours.</em></h1><p className="checkout-lede">A quick detail check and your ticket is ready for the night.</p><div className="checkout-card"><h2>Contact details</h2><label>Full name<input placeholder="Your name" autoComplete="name"/></label><label>Email address<input type="email" placeholder="you@example.com" autoComplete="email"/></label><p className="secure-note"><LockKeyhole size={14}/> Used only for your receipt and event updates.</p></div></div><aside className="checkout-order"><span className="eyebrow">Order summary</span><h2>{event.title}</h2><p>{event.venue} · {event.date} · {event.time}</p><div className="order-line"><span>Seats · {seatLabels}</span><b>{event.price}</b></div><div className="order-line"><span>Encore service fee</span><b>₹99</b></div><div className="order-line total-line"><span>Total</span><b>₹{(Number(event.price.replace(/[^0-9]/g, '')) + 99).toLocaleString('en-IN')}</b></div><Link href="/bookings/demo/confirmation" className="coral-button">Confirm booking <Check size={16}/></Link><small>No payment gateway is connected in this pilot. The flow is ready for a provider key.</small></aside></div></section><PortalFooter/></main>;
}
