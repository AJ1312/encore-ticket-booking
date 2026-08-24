'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, ChevronRight } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type WaitlistItem = {
  id: string;
  showId: string;
  status: string;
  category: string;
  eventTitle?: string;
  venue?: string;
  offerExpiresAt?: string;
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiJson<{ waitlist: WaitlistItem[] }>('/waitlist')
      .then(res => {
        if (isMounted) {
          setEntries(res.waitlist || []);
        }
      })
      .catch(() => {
        if (isMounted) setEntries([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <main className="customer-site">
      <PortalNav />
      <section className="portal-content compact">
        <span className="eyebrow">Your account / Waitlist</span>
        <h1>Stay close<br /><em>to the door.</em></h1>

        {loading ? (
          <p className="confirmation-sub">Checking active waitlist offers from backend database…</p>
        ) : entries.length ? (
          entries.map(item => (
            <div className="portal-panel" key={item.id} style={{ marginBottom: 20 }}>
              <span className="ticket-status">
                {item.status === 'offered' ? '🔥 Active 15-Min Offer Ready' : `Watching · ${item.category}`}
              </span>
              <h2>{item.eventTitle || 'The Night We Remember'}</h2>
              <p>{item.venue || 'Riverside Grounds'} · {item.category} seats</p>

              <div className="hold-note">
                <Clock3 size={15} />
                {item.status === 'offered'
                  ? 'An exact seat opened for you! Click below to view and claim within 15 minutes.'
                  : 'We will automatically hold a seat for 15 minutes if someone cancels.'}
              </div>

              {item.status === 'offered' ? (
                <Link href={`/waitlist/${item.id}`} className="coral-button" style={{ marginTop: 16 }}>
                  Claim offer now <ArrowUpRight size={16} />
                </Link>
              ) : (
                item.showId ? (
                  <Link href={`/events/${item.showId}`} className="portal-link">
                    View event details <ChevronRight size={14} />
                  </Link>
                ) : null
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '40px 24px', border: '1px dashed var(--line)', textAlign: 'center' }}>
            <p className="confirmation-sub" style={{ margin: 0 }}>You are not currently on any active event waitlists.</p>
            <Link href="/events" className="coral-button" style={{ marginTop: 20 }}>
              Explore upcoming events <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
      <PortalFooter />
    </main>
  );
}
