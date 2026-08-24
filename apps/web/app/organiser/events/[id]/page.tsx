'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ExternalLink, Sparkles, Layers, CheckCircle2, Users, Calendar } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { encoreEvents } from '@/lib/events';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  type: string;
  posterUrl: string;
};

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<EventDetail>(`/organiser/events/${id}`)
      .then(data => {
        if (isMounted) setEvent(data);
      })
      .catch(() => {
        const fallback = encoreEvents.find(e => e.showId === id || e.slug === id);
        if (fallback && isMounted) {
          setEvent({
            id: fallback.showId,
            title: fallback.title,
            description: fallback.description,
            type: fallback.kind.toLowerCase(),
            posterUrl: fallback.image,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const matchedStatic = encoreEvents.find(e => e.title.toLowerCase() === event?.title?.toLowerCase() || e.showId === id);
  const publicUrl = matchedStatic ? `/shows/${matchedStatic.slug}` : `/events/${id}`;

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/organiser/events" className="back-link">
            <ArrowLeft size={15} /> Back to Events
          </Link>
          <Link
            href={publicUrl}
            target="_blank"
            style={{
              padding: '8px 14px',
              background: '#231c18',
              border: '1px solid var(--coral)',
              color: 'var(--peach)',
              fontSize: 12,
              borderRadius: 4,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ExternalLink size={13} /> View Live Public Page
          </Link>
        </div>

        <span className="eyebrow">Organiser / Event Management</span>
        <h1>
          {event?.title || 'Event'}<br />
          <em>Overview & Control.</em>
        </h1>

        <div className="admin-cards" style={{ marginTop: 24 }}>
          {/* Main Event Overview Card */}
          <section className="portal-panel" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {event?.posterUrl && (
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #3d342f' }}
                  onError={e => { (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80'; }}
                />
              )}
              <div style={{ flex: 1, minWidth: 240 }}>
                <span className="eyebrow">Active Listing</span>
                <h2 style={{ fontSize: 24, margin: '4px 0 8px' }}>{event?.title || 'Loading…'}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#496050', margin: '0 0 16px' }}>
                  {event?.description || 'Curated event experience with FairHold atomic reservation engine.'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, font: '10px var(--mono)', padding: '4px 10px', background: '#e2eae0', color: '#2d5e3f', textTransform: 'uppercase', borderRadius: 4 }}>
                    Type: {event?.type || 'Concert'}
                  </span>
                  <span style={{ fontSize: 11, font: '10px var(--mono)', padding: '4px 10px', background: '#e2eae0', color: '#2d5e3f', textTransform: 'uppercase', borderRadius: 4 }}>
                    Status: On Sale
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #d8e3d6', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link href={`/organiser/events/${id}/shows`} className="coral-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} /> Manage Shows & Live Seat Inventory <ArrowUpRight size={14} />
              </Link>
            </div>
          </section>

          {/* Performance & Contention Safeguards */}
          <section className="portal-panel">
            <span className="eyebrow">Realtime Engine</span>
            <h2>FairHold™ Protection</h2>
            <p>100% scalper prevention with row-level transactional isolation and zero overselling.</p>
            <Link href="/admin/contention-lab" style={{ marginTop: 14 }}>
              Open Contention Lab <ArrowUpRight size={15} />
            </Link>
          </section>
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
