import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { encoreEvents, getEvent } from '@/lib/events';
import { ShareButton } from '@/components/share-button';

export function generateStaticParams() { return encoreEvents.map(event => ({ eventId: event.slug })); }

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  if (!event || event.slug !== eventId) notFound();
  return <main className="customer-site event-detail-page"><PortalNav/><section className="event-detail-hero"><div className="event-detail-art" style={{ backgroundImage: `url(${event.image})` }}/><div className="event-detail-overlay"/><div className="event-detail-copy"><Link href="/events" className="back-link"><ArrowLeft size={15}/> Back to guide</Link><span className="eyebrow">{event.kind} · {event.city}</span><h1>{event.title}</h1><p>{event.description}</p></div></section><section className="event-detail-body"><div className="event-detail-info"><span className="eyebrow">The details</span><h2>Make a night<br/><em>of it.</em></h2><p>Every Encore event is presented with clear timings, calm checkout, and a ticket you can find again when the night arrives.</p><div className="detail-facts"><span><CalendarDays size={16}/><b>Date</b>{event.date} 2026</span><span><Clock3 size={16}/><b>Time</b>{event.time}</span><span><MapPin size={16}/><b>Venue</b>{event.venue}, {event.city}</span></div></div><aside className="show-choices"><span className="eyebrow">Choose a show</span><h2>Available times</h2><div className="show-choice"><div><strong>{event.date}</strong><span>{event.time} · Doors 7:00 PM</span><small>{event.venue}</small></div><b>from {event.price}</b><Link href={`/shows/${event.slug}`} className="coral-button">Choose seats <ArrowUpRight size={16}/></Link></div><ShareButton/></aside></section><PortalFooter/></main>;
}
