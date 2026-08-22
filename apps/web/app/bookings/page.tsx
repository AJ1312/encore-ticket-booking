'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { DownloadTicketButton } from '@/components/download-ticket-button';
import { apiJson } from '@/lib/api';
import { useEffect, useState } from 'react';

type Booking = { bookingRef: string; totalPaise: number; status: string };
export default function TicketsPage() { const [bookings, setBookings] = useState<Booking[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { void apiJson<{ bookings: Booking[] }>('/bookings').then(result => setBookings(result.bookings)).finally(() => setLoading(false)); }, []); return <main className="customer-site tickets-page"><PortalNav /><section className="tickets-header"><span className="eyebrow">Your account / My tickets</span><h1>Plans worth<br/><em>keeping.</em></h1><p>Everything you’ve booked, ready when you are.</p></section><section className="ticket-list">{loading ? <p className="confirmation-sub">Loading your bookings…</p> : bookings.length ? bookings.map(booking => <article className="ticket-card" key={booking.bookingRef}><div className="ticket-card-art"/><div className="ticket-card-copy"><span className="ticket-status">{booking.status} · {booking.bookingRef}</span><h2>Encore booking</h2><p>Booking reference {booking.bookingRef}</p><p>Total · ₹{Math.round(booking.totalPaise / 100).toLocaleString('en-IN')}</p><div className="ticket-actions"><Link href={`/booking/${booking.bookingRef}/confirmation`} className="coral-button">Open ticket <ArrowUpRight size={16}/></Link><DownloadTicketButton/></div></div></article>) : <p className="confirmation-sub">You have no bookings yet.</p>}</section><div className="tickets-empty"><p className="eyebrow">Looking for your next one?</p><h2>The calendar is<br/><em>wide open.</em></h2><Link href="/events" className="text-link">Explore the guide <ArrowUpRight size={15}/></Link></div><PortalFooter /></main>; }
