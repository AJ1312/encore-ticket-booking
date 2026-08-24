import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Bell, CalendarDays, Clock3, MapPin, Utensils } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { encoreEvents, getEvent } from '@/lib/events';
import { ShareButton } from '@/components/share-button';
import { API_URL } from '@/lib/api';

export function generateStaticParams() {
  return encoreEvents.map(event => ({ eventId: event.slug }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  
  let event: any = getEvent(eventId);
  let showId = event?.showId;

  if (!event || event.slug !== eventId) {
    try {
      const res = await fetch(`${API_URL}/events`, { next: { revalidate: 60 } });
      const data = await res.json();
      const match = (data.events || []).find((e: any) => {
        const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === eventId || e.showId === eventId || e.id === eventId;
      });

      if (!match) notFound();

      event = {
        slug: eventId,
        title: match.title,
        venue: match.venue,
        city: match.city,
        date: new Date(match.startsAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
        time: new Date(match.startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        description: match.description || 'An intimate live set under the city lights.',
        image: match.posterUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
        kind: match.type === 'movie' ? 'Movies' : match.type === 'comedy' ? 'Comedy' : 'Events',
        price: '₹999',
        showId: match.showId,
      } as any;
      showId = match.showId;
    } catch {
      notFound();
    }
  }

  const isDining = event.kind === 'Dining';

  return (
    <main className="customer-site event-detail-page">
      <PortalNav />
      <section className="event-detail-hero">
        <div className="event-detail-art" style={{ backgroundImage: `url(${event.image})` }} />
        <div className="event-detail-overlay" />
        <div className="event-detail-copy">
          <Link href="/events" className="back-link">
            <ArrowLeft size={15} /> Back to guide
          </Link>
          <span className="eyebrow">
            {event.kind} · {event.city}
          </span>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
        </div>
      </section>

      <section className="event-detail-body">
        <div className="event-detail-info">
          <span className="eyebrow">The details</span>
          <h2>
            Make a night<br />
            <em>of it.</em>
          </h2>
          <p>
            Every Encore experience is curated with clear timings, calm reservations, and a verified entry pass ready when you arrive.
          </p>
          <div className="detail-facts">
            <span>
              <CalendarDays size={16} />
              <b>Date</b>
              {event.date} 2026
            </span>
            <span>
              <Clock3 size={16} />
              <b>Time</b>
              {event.time}
            </span>
            <span>
              <MapPin size={16} />
              <b>Venue</b>
              {event.venue}, {event.city}
            </span>
          </div>
        </div>

        <aside className="show-choices">
          <span className="eyebrow">{isDining ? 'Table Reservations' : 'Choose a show'}</span>
          <h2>Available times</h2>
          <div className="show-choice">
            <div>
              <strong>{event.date}</strong>
              <span>{event.time} · {isDining ? 'Seating begins 15 mins prior' : 'Doors 7:00 PM'}</span>
              <small>{event.venue}</small>
            </div>
            <b>from {event.price}</b>
            <Link href={`/shows/${encoreEvents.some(e => e.slug === event.slug) ? event.slug : showId}`} className="coral-button">
              {isDining ? (
                <>
                  Reserve Table <ArrowUpRight size={16} />
                </>
              ) : (
                <>
                  Choose Seats <ArrowUpRight size={16} />
                </>
              )}
            </Link>
          </div>

          <div style={{ marginTop: 14 }}>
            <Link
              href={`/shows/${encoreEvents.some(e => e.slug === event.slug) ? event.slug : showId}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                background: '#1d1715',
                border: '1.5px solid var(--coral)',
                borderRadius: 6,
                color: 'var(--peach)',
                fontSize: 12,
                font: '11px var(--mono)',
                textTransform: 'uppercase',
                boxShadow: '0 4px 14px rgba(224, 122, 95, 0.15)',
              }}
            >
              <Bell size={14} color="var(--coral)" /> Get Waitlist Notifications & Alerts
            </Link>
          </div>

          <ShareButton />
        </aside>
      </section>
      <PortalFooter />
    </main>
  );
}
