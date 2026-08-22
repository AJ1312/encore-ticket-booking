'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { encoreEvents } from '@/lib/events';

const filters = ['For you', 'Events', 'Movies', 'Dining', 'Comedy'];

function EventsContent() {
  const params = useSearchParams();
  const rawKind = params.get('kind');
  const selected = rawKind ? rawKind.charAt(0).toUpperCase() + rawKind.slice(1) : 'For you';
  const city = params.get('city') || 'Mumbai';
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('Any date');
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return encoreEvents.filter(event => {
      const kindMatch = selected === 'For you' || event.kind.toLowerCase() === selected.toLowerCase();
      const searchMatch = !term || `${event.title} ${event.venue} ${event.kind}`.toLowerCase().includes(term);
      const dateMatch = dateFilter === 'Any date' || (dateFilter === 'Today' ? event.date === 'Today' : dateFilter === 'This weekend' ? ['28 Aug', '29 Aug', '30 Aug'].includes(event.date) : true);
      return kindMatch && searchMatch && dateMatch;
    });
  }, [dateFilter, search, selected]);
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
  return <main className="customer-site discover-page"><PortalNav /><section className="discover-top"><span className="eyebrow">{city} / Your guide to going out</span><h1>Find your<br/><em>next thing.</em></h1><div className="discover-search"><Search size={18}/><input ref={searchInputRef} aria-label="Search events" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events, movies, restaurants"/><span>⌘ K</span></div></section><div className="discover-tabs"><div>{filters.map(filter => <Link className={selected.toLowerCase() === filter.toLowerCase() ? 'active' : ''} href={filter === 'For you' ? `/events?city=${encodeURIComponent(city)}` : `/events?kind=${filter.toLowerCase()}&city=${encodeURIComponent(city)}`} key={filter}>{filter}</Link>)}</div><button onClick={() => setFiltersOpen(value => !value)} aria-expanded={filtersOpen}><SlidersHorizontal size={15}/> Filters</button></div>{filtersOpen && <div className="filter-panel"><div><span className="eyebrow">Refine your guide</span><strong>When are you going out?</strong></div><div className="filter-options">{['Any date', 'Today', 'This weekend'].map(option => <button className={dateFilter === option ? 'active' : ''} onClick={() => setDateFilter(option)} key={option}>{option}</button>)}</div><button className="filter-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X size={16}/></button></div>}<section className="guide-section"><div className="guide-heading"><div><span className="eyebrow">Handpicked for this week</span><h2>{selected === 'For you' ? 'Everything worth stepping out for.' : `${selected} in ${city}.`}</h2></div><span className="guide-count">{visible.length.toString().padStart(2, '0')} picks</span></div>{visible.length ? <div className="guide-grid">{visible.map(event => <article className={`guide-card ${event.featured && selected === 'For you' ? 'featured' : ''}`} key={event.slug}><Link href={`/events/${event.slug}`}><div className="guide-art" style={{ backgroundImage: `url(${event.image})` }}><span className="guide-kind">{event.kind}</span><span className="guide-date"><CalendarDays size={13}/> {event.date}</span><span className="guide-arrow"><ArrowUpRight size={17}/></span></div><div className="guide-copy"><div><h3>{event.title}</h3><p><MapPin size={13}/> {event.venue} · {city}</p></div><div className="guide-meta"><span>{event.time}</span><b>from {event.price}</b></div></div></Link></article>)}</div> : <div className="empty-state"><span className="eyebrow">No exact matches</span><h3>Try a different mood.</h3><p>Clear the search or choose another category and we’ll find a better fit.</p><button className="ghost-button" onClick={() => { setSearch(''); setDateFilter('Any date'); }}>Reset filters</button></div>}</section><section className="city-callout"><div><span className="eyebrow">Plan the whole day</span><h2>Start with a<br/><em>little curiosity.</em></h2></div><p>From first coffee to last call, Encore brings the city’s best moments into one calm guide. Save a place, share a plan, and show up.</p></section><PortalFooter /></main>;
}

export default function EventsPage() { return <Suspense fallback={<main className="customer-site"><PortalNav/><section className="discover-top"><span className="eyebrow">Loading your guide</span><h1>One moment<br/><em>please.</em></h1></section></main>}><EventsContent/></Suspense>; }
