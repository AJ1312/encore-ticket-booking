'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, Check, Sparkles } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/api';

export default function WaitlistOfferPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = use(params);
  const router = useRouter();
  const [seconds, setSeconds] = useState(900); // 15-minute countdown
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<{ showId: string; offeredSeatIds: string[]; eventTitle?: string; venue?: string; category?: string } | null>(null);

  useEffect(() => {
    apiJson<{ waitlist: any[] }>(`/waitlist/${entryId}`)
      .then(res => {
        if (res.waitlist && res.waitlist[0]) {
          setEntry(res.waitlist[0]);
        }
      })
      .catch(() => null);
  }, [entryId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function claim() {
    setLoading(true);
    try {
      await apiJson(`/waitlist/${entryId}/claim`, { method: 'POST' }).catch(() => null);
      setClaimed(true);
      setTimeout(() => {
        if (!entry?.showId) {
          router.push('/events');
          return;
        }
        const routeSeats = entry.offeredSeatIds?.length ? entry.offeredSeatIds.join(',') : 's-a1';
        router.push(`/shows/${entry.showId}/checkout?seats=${routeSeats}`);
      }, 1200);
    } catch {
      setClaimed(true);
      setTimeout(() => {
        if (!entry?.showId) {
          router.push('/events');
          return;
        }
        const routeSeats = entry.offeredSeatIds?.length ? entry.offeredSeatIds.join(',') : 's-a1';
        router.push(`/shows/${entry.showId}/checkout?seats=${routeSeats}`);
      }, 1200);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="customer-site">
      <PortalNav />
      <section className="portal-content compact">
        <span className="eyebrow">Waitlist offer / {entryId}</span>
        <h1>Your seat<br /><em>opened up.</em></h1>

        <div className="portal-panel offer-panel" style={{ border: '1px solid var(--coral)', background: '#181412' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span className="ticket-status" style={{ color: 'var(--coral)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} /> FairHold Waitlist Offer
            </span>
            <div style={{ color: 'var(--coral)', font: '22px var(--mono)', fontWeight: 500 }}>
              {formatTime(seconds)}
            </div>
          </div>

          <h2>{entry?.eventTitle || 'Your Event Pass'}</h2>
          <p>{entry?.category || 'Reserved'} · {entry?.venue || 'Venue'}</p>

          <div className="hold-note" style={{ margin: '20px 0' }}>
            <Clock3 size={15} /> Claim now before your 15-minute offer expires and moves to the next user.
          </div>

          {claimed ? (
            <div style={{ padding: 14, background: '#16251e', border: '1px solid #2b4738', color: 'var(--green)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, font: '11px var(--mono)' }}>
              <Check size={16} /> Seat claimed! Transferring to checkout…
            </div>
          ) : (
            <button onClick={claim} disabled={loading || seconds <= 0} className="coral-button" style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Securing seat…' : 'Claim offered seat now'} <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
