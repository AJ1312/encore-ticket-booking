import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { DownloadTicketButton } from '@/components/download-ticket-button';

export default function TicketsPage() { return <main className="customer-site tickets-page"><PortalNav /><section className="tickets-header"><span className="eyebrow">Your account / My tickets</span><h1>Plans worth<br/><em>keeping.</em></h1><p>Everything you’ve booked, ready when you are.</p></section><section className="ticket-list"><article className="ticket-card"><div className="ticket-card-art"/><div className="ticket-card-copy"><span className="ticket-status">Confirmed · 88A-94B</span><h2>The Night We Remember</h2><p><CalendarDays size={14}/> Fri, 28 Aug 2026 · 8:00 PM</p><p><MapPin size={14}/> Riverside Grounds · Mumbai</p><div className="ticket-actions"><Link href="/bookings/demo/confirmation" className="coral-button">Open ticket <ArrowUpRight size={16}/></Link><DownloadTicketButton/></div></div></article></section><div className="tickets-empty"><p className="eyebrow">Looking for your next one?</p><h2>The calendar is<br/><em>wide open.</em></h2><Link href="/events" className="text-link">Explore the guide <ArrowUpRight size={15}/></Link></div><PortalFooter /></main>; }
