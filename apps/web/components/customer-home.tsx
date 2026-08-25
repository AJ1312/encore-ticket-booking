'use client';

import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Clock3, MapPin, Play, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { PortalFooter } from './portal-footer';
import { PortalNav } from './portal-nav';

const cards = [
  { slug: 'sunday-social', title: 'Sunday Social: Vinyl & Small Plates', type: 'Dining', meta: 'The Bombay Canteen · Table Reservation', price: '₹1,800', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85' },
  { slug: 'actually-im-fine', title: 'Actually, I’m Fine', type: 'Comedy', meta: 'The Habitat · 19 Sep', price: '₹899', image: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=900&q=85' },
  { slug: 'signals-after-dark', title: 'Signals / After Dark', type: 'Live music', meta: 'AntiSocial · 25 Sep', price: '₹1,200', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85' },
  { slug: 'midnight-in-marigold', title: 'Midnight in Marigold', type: 'Cinema', meta: 'PVR Lower Parel · 18 Sep', price: '₹280', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=85' },
];

function RailCard({ card }: { card: typeof cards[number] }) {
  return <Link href={`/events/${card.slug}`} className="rail-card">
    <div className="rail-image" style={{ backgroundImage: `url(${card.image})` }}><span>{card.type}</span><span className="rail-preview" aria-hidden="true"><Play size={13} fill="currentColor"/></span></div>
    <div className="rail-copy"><h3>{card.title}</h3><p>{card.meta}</p><strong>from {card.price}</strong></div>
  </Link>;
}

export function CustomerHome() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  
  const [dynamicCards, setDynamicCards] = useState<typeof cards>([]);
  useEffect(() => {
    import('@/lib/api').then(({ apiJson }) => {
      apiJson<{
        events: Array<{
          title: string;
          type: string;
          posterUrl: string;
          showId: string;
          startsAt: string;
          venue: string;
          city: string;
        }>;
      }>('/events').then(res => {
        if (res && res.events) {
          const formatted = res.events.map(ev => ({
            slug: ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            title: ev.title,
            type: ev.type.charAt(0).toUpperCase() + ev.type.slice(1),
            meta: `${ev.venue} · ${new Date(ev.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
            price: '₹999',
            image: ev.posterUrl || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
          }));
          setDynamicCards(formatted.slice(0, 4));
        }
      }).catch(() => null);
    });
  }, []);

  const displayCards = dynamicCards.length > 0 ? dynamicCards : cards;

  return <main className="customer-site">
    <PortalNav />
    <section className="home-hero" ref={heroRef}>
      <motion.div className="home-hero-art" style={{ scale: imageScale }} />
      <div className="home-hero-shade" />
      <div className="home-hero-copy"><p className="eyebrow">Encore presents · Mumbai</p><h1>Go out.<br/><em>Feel more.</em></h1><p className="hero-lede">Find the rooms, screenings, stages, and tables that make an ordinary week feel like a story.</p><div className="hero-actions"><Link href="/events" className="coral-button">Explore what’s on <ArrowUpRight size={17}/></Link><Link href="/events?kind=events" className="ghost-button">See live events</Link></div></div>
      <div className="hero-scroll-note"><span>Scroll to explore</span><ChevronRight size={15}/></div>
    </section>
    <section className="home-discovery">
      <div className="section-kicker"><div><span className="eyebrow">Your city, curated</span><h2>What are you<br/><em>in the mood for?</em></h2></div><Link href="/events" className="text-link">View all <ArrowUpRight size={15}/></Link></div>
      <div className="mood-grid"><Link href="/events?kind=events" className="mood-card mood-orange"><span>01 / Live events</span><strong>Big nights.<br/>Bright lights.</strong><span className="mood-arrow">↗</span></Link><Link href="/events?kind=movies" className="mood-card mood-cream"><span>02 / Cinema</span><strong>Stories worth<br/>leaving home for.</strong><span className="mood-arrow">↗</span></Link><Link href="/events?kind=dining" className="mood-card mood-green"><span>03 / Dining</span><strong>Pull up<br/>a chair.</strong><span className="mood-arrow">↗</span></Link></div>
    </section>
    <section className="feature-section"><div className="feature-image"/><div className="feature-content"><span className="eyebrow"><Sparkles size={13}/> Tonight’s pick</span><h2>The Night<br/><em>We Remember.</em></h2><p>An intimate indoor stage. A handpicked line-up. The kind of night that turns into a group chat name.</p><div className="feature-meta"><span><MapPin size={14}/> Riverside Grounds, Mumbai</span><span><Clock3 size={14}/> Fri, 28 Aug · 8:00 PM</span></div><Link href="/events/the-night-we-remember" className="coral-button">Choose your seats <ArrowUpRight size={17}/></Link></div></section>
    <section className="rail-section"><div className="section-kicker"><div><span className="eyebrow">Because staying in can wait</span><h2>More to do<br/><em>this week.</em></h2></div><Link href="/events" className="text-link">See the full guide <ArrowUpRight size={15}/></Link></div><div className="card-rail">{displayCards.map((card: typeof cards[number]) => <RailCard key={card.title} card={card}/>)}</div></section>
    <section className="promise-strip"><div><span className="eyebrow">The Encore promise</span><h2>Less searching.<br/><em>More showing up.</em></h2></div><div className="promise-points"><div><b>01</b><p>Human-curated picks, not an endless feed.</p></div><div><b>02</b><p>Clear prices and calm checkout, every time.</p></div><div><b>03</b><p>Your tickets live behind one simple profile.</p></div></div></section>
    <PortalFooter />
  </main>;
}
