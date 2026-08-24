'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Search, SlidersHorizontal, X, Sparkles, Globe } from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { encoreEvents } from '@/lib/events';
import type { EncoreEvent } from '@/lib/events';
import { apiJson } from '@/lib/api';

const filters = ['For you', 'Events', 'Movies', 'Dining', 'Comedy'];

function EventsContent() {
  const params = useSearchParams();
  const rawKind = params.get('kind');
  const selected = rawKind ? rawKind.charAt(0).toUpperCase() + rawKind.slice(1) : 'For you';
  const queryCity = params.get('city');
  const querySearch = params.get('q') || params.get('search') || '';

  const [city, setCity] = useState(queryCity || 'Mumbai');
  const [search, setSearch] = useState(querySearch);
  const [catalog, setCatalog] = useState<EncoreEvent[]>(encoreEvents);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('Any date');

  useEffect(() => {
    if (queryCity) {
      setCity(queryCity);
    } else if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('encore_city');
      if (saved) setCity(saved);
    }
  }, [queryCity]);

  useEffect(() => {
    if (querySearch) {
      setSearch(querySearch);
    }
  }, [querySearch]);

  const { visible, otherCityMatches } = useMemo(() => {
    const term = search.trim().toLowerCase();

    const inCity = catalog.filter(event => {
      const cityMatch = !city || event.city.toLowerCase() === city.toLowerCase();
      const kindMatch = selected === 'For you' || event.kind.toLowerCase() === selected.toLowerCase();
      const searchMatch =
        !term ||
        `${event.title} ${event.venue} ${event.kind} ${event.city} ${event.description}`.toLowerCase().includes(term);
      const dateMatch =
        dateFilter === 'Any date' ||
        (dateFilter === 'Today'
          ? event.date === 'Today'
          : dateFilter === 'This weekend'
          ? ['28 Aug', '29 Aug', '30 Aug', '31 Aug', '01 Sep', '02 Sep'].includes(event.date)
          : true);

      return cityMatch && kindMatch && searchMatch && dateMatch;
    });

    const otherCities = term
      ? catalog.filter(event => {
          const notCurrentCity = city && event.city.toLowerCase() !== city.toLowerCase();
          const searchMatch =
            `${event.title} ${event.venue} ${event.kind} ${event.city} ${event.description}`.toLowerCase().includes(term);
          return notCurrentCity && searchMatch;
        })
      : [];

    return { visible: inCity, otherCityMatches: otherCities };
  }, [catalog, city, dateFilter, search, selected]);

  useEffect(() => {
    void apiJson<{
      events: Array<{
        title: string;
        description: string;
        type: string;
        posterUrl: string;
        showId: string;
        startsAt: string;
        venue: string;
        city: string;
      }>;
    }>('/events')
      .then(result => {
        if (!result.events || !result.events.length) return;
        const apiList = result.events.map(item => {
          const known = encoreEvents.find(event => event.title === item.title || event.showId === item.showId);
          const date = new Date(item.startsAt);
          const isDining = item.type === 'dining' || known?.kind === 'Dining' || item.title.toLowerCase().includes('brunch') || item.title.toLowerCase().includes('dining') || item.title.toLowerCase().includes('plates') || item.title.toLowerCase().includes('dine') || item.title.toLowerCase().includes('canteen') || item.title.toLowerCase().includes('bistro');
          const kind = isDining ? 'Dining' : item.type === 'movie' ? 'Movies' : item.type === 'comedy' ? 'Comedy' : 'Events';
          return {
            ...(known || {
              slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
              price: '₹999',
              image: item.posterUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
              featured: false,
            }),
            title: item.title,
            description: item.description,
            kind,
            venue: item.venue,
            city: (item.city as any) || 'Mumbai',
            showId: item.showId,
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }),
            time: date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }),
          } as EncoreEvent;
        });

        const combined = [...encoreEvents];
        for (const apiEvent of apiList) {
          const idx = combined.findIndex(e => e.slug === apiEvent.slug || e.showId === apiEvent.showId);
          if (idx >= 0) {
            combined[idx] = apiEvent;
          } else {
            combined.push(apiEvent);
          }
        }
        setCatalog(combined);
      })
      .catch(() => {
        /* Keep pre-configured prototype events */
      });
  }, []);

  useEffect(() => {
    const focusRequested = params.get('focus') === 'search';
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    if (focusRequested) searchInputRef.current?.focus();
    return () => window.removeEventListener('keydown', onShortcut);
  }, [params]);

  return (
    <main className="customer-site discover-page">
      <PortalNav />
      <section className="discover-top">
        <span className="eyebrow">{city} / Your guide to going out</span>
        <h1>
          Find your<br />
          <em>next thing in {city}.</em>
        </h1>
        <div className="discover-search">
          <Search size={18} />
          <input
            ref={searchInputRef}
            aria-label="Search events"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`Search events, comedy, cinema in ${city}…`}
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'transparent', border: 0, color: 'var(--peach)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          ) : (
            <span>⌘ K</span>
          )}
        </div>
      </section>

      <div className="discover-tabs">
        <div>
          {filters.map(filter => (
            <Link
              className={selected.toLowerCase() === filter.toLowerCase() ? 'active' : ''}
              href={
                filter === 'For you'
                  ? `/events?city=${encodeURIComponent(city)}`
                  : `/events?kind=${filter.toLowerCase()}&city=${encodeURIComponent(city)}`
              }
              key={filter}
            >
              {filter}
            </Link>
          ))}
        </div>
        <button onClick={() => setFiltersOpen(value => !value)} aria-expanded={filtersOpen}>
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {filtersOpen && (
        <div className="filter-panel">
          <div>
            <span className="eyebrow">Refine your guide</span>
            <strong>When are you going out?</strong>
          </div>
          <div className="filter-options">
            {['Any date', 'Today', 'This weekend'].map(option => (
              <button
                className={dateFilter === option ? 'active' : ''}
                onClick={() => setDateFilter(option)}
                key={option}
              >
                {option}
              </button>
            ))}
          </div>
          <button className="filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="guide-section">
        <div className="guide-heading">
          <div>
            <span className="eyebrow">Handpicked for this week · {city}</span>
            <h2>{selected === 'For you' ? `Everything worth stepping out for in ${city}.` : `${selected} in ${city}.`}</h2>
          </div>
          <span className="guide-count">{visible.length.toString().padStart(2, '0')} picks</span>
        </div>

        {visible.length ? (
          <div className="guide-grid">
            {visible.map(event => (
              <article
                className={`guide-card ${event.featured && selected === 'For you' ? 'featured' : ''}`}
                key={event.slug}
              >
                <Link href={`/events/${event.slug}`}>
                  <div className="guide-art" style={{ backgroundImage: `url(${event.image})` }}>
                    <span className="guide-kind">{event.kind}</span>
                    <span className="guide-date">
                      <CalendarDays size={13} /> {event.date}
                    </span>
                    <span className="guide-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                  <div className="guide-copy">
                    <div>
                      <h3>{event.title}</h3>
                      <p>
                        <MapPin size={13} /> {event.venue} · {event.city}
                      </p>
                    </div>
                    <div className="guide-meta">
                      <span>{event.time}</span>
                      <b>from {event.price}</b>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="eyebrow">No exact matches in {city}</span>
            <h3>Try a different mood.</h3>
            <p>Clear your search or explore other dates and categories in {city}.</p>
            <button
              className="ghost-button"
              onClick={() => {
                setSearch('');
                setDateFilter('Any date');
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Smart Cross-City Search Suggestions */}
        {otherCityMatches.length > 0 && (
          <div style={{ marginTop: 60, padding: 28, background: '#171a1c', border: '1px solid #3d342f', borderRadius: 6 }}>
            <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--coral)' }}>
              <Globe size={14} /> Matching Events in Other Cities
            </span>
            <h3 style={{ font: '26px var(--serif)', color: 'var(--paper)', margin: '8px 0 16px' }}>
              Also happening for "{search}":
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {otherCityMatches.map(ev => (
                <div key={ev.slug} style={{ padding: 16, background: '#121416', border: '1px solid #282b30', borderRadius: 4 }}>
                  <span style={{ font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase' }}>{ev.city} · {ev.kind}</span>
                  <h4 style={{ margin: '6px 0', font: '18px var(--serif)', color: 'var(--paper)' }}>{ev.title}</h4>
                  <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 12 }}>{ev.venue} · {ev.date}</p>
                  <Link href={`/events/${ev.slug}`} className="coral-button" style={{ padding: '8px 14px', fontSize: 10 }}>
                    View event in {ev.city} <ArrowUpRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="city-callout">
        <div>
          <span className="eyebrow">Plan the whole day</span>
          <h2>
            Start with a<br />
            <em>little curiosity in {city}.</em>
          </h2>
        </div>
        <p>
          From first coffee to last call, Encore brings {city}’s best moments into one calm guide. Save a place, share a
          plan, and show up.
        </p>
      </section>
      <PortalFooter />
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="customer-site">
          <PortalNav />
          <section className="discover-top">
            <span className="eyebrow">Loading your guide</span>
            <h1>
              One moment<br />
              <em>please.</em>
            </h1>
          </section>
        </main>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
