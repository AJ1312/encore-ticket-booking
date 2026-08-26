'use client';

import Link from 'next/link';
import { ArrowUpRight, Clock3, Check, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/api';

type WaitlistEntry = {
  id: string;
  showId: string;
  status: string;
  category: string;
  offeredSeatIds: string[] | null;
  offerExpiresAt: string | null;
  eventTitle?: string;
  venue?: string;
  startsAt?: string;
};

export default function WaitlistOfferPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId } = use(params);
  const router = useRouter();

  const [seconds, setSeconds] = useState<number | null>(null); // null until we know real expiry
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);
  const [fetchError, setFetchError] = useState('');

  // Fetch the waitlist entry — requires auth
  useEffect(() => {
    apiJson<WaitlistEntry>(`/waitlist/${entryId}`)
      .then(res => {
        if (res && res.showId) {
          setEntry(res);
          // Calculate real remaining seconds from server's offerExpiresAt
          if (res.offerExpiresAt) {
            const remaining = Math.max(0, Math.floor((new Date(res.offerExpiresAt).getTime() - Date.now()) / 1000));
            setSeconds(remaining);
          } else {
            setSeconds(900); // fallback if no expiry
          }
        }
      })
      .catch(err => {
        const status = (err as any)?.status;
        if (status === 401 || status === 403) {
          setFetchError('auth');
        } else {
          setFetchError('not_found');
        }
      })
      .finally(() => setFetchLoading(false));
  }, [entryId]);

  // Countdown timer — only starts once we have the real remaining time
  useEffect(() => {
    if (seconds === null) return;
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds !== null]); // only re-run when seconds transitions from null → number

  async function claim() {
    if (!entry) return;
    setLoading(true);
    try {
      await apiJson(`/waitlist/${entryId}/claim`, { method: 'POST' });
    } catch {
      // Even if claim call fails (e.g. already claimed), send to seat picker
      // The seat picker will show current availability
    } finally {
      setLoading(false);
    }

    setClaimed(true);

    // Build preselect param from offered seat IDs (showSeat UUIDs)
    const seatIds = entry.offeredSeatIds?.length ? entry.offeredSeatIds : [];
    const preselectParam = seatIds.length > 0 ? `?preselect=${seatIds.join(',')}` : '';

    // Navigate to seat picker with pre-selected held seats
    setTimeout(() => {
      router.push(`/shows/${entry.showId}/seats${preselectParam}`);
    }, 800);
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isExpired = seconds !== null && seconds <= 0;

  // ── Auth required ──────────────────────────────────────────────────────────
  if (fetchError === 'auth') {
    return (
      <main className="customer-site">
        <PortalNav />
        <section className="portal-content compact">
          <span className="eyebrow">Waitlist offer / Sign in required</span>
          <h1>Sign in to<br /><em>claim your seat.</em></h1>
          <div className="portal-panel" style={{ border: '1px solid var(--coral)', background: '#181412', textAlign: 'center', padding: 32 }}>
            <LogIn size={32} color="var(--coral)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
              You need to be signed in to view and claim your waitlist offer.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/waitlist/${entryId}`)}`}
              className="coral-button"
              style={{ justifyContent: 'center' }}
            >
              <LogIn size={15} /> Sign in to claim offer
            </Link>
          </div>
        </section>
        <PortalFooter />
      </main>
    );
  }

  // ── Not found / expired ────────────────────────────────────────────────────
  if (fetchError === 'not_found') {
    return (
      <main className="customer-site">
        <PortalNav />
        <section className="portal-content compact">
          <span className="eyebrow">Waitlist offer / Not found</span>
          <h1>This offer<br /><em>has expired.</em></h1>
          <div className="portal-panel" style={{ textAlign: 'center', padding: 32 }}>
            <AlertCircle size={32} color="var(--peach)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
              This waitlist offer was not found, has already been claimed, or has expired.
            </p>
            <Link href="/events" className="coral-button" style={{ justifyContent: 'center' }}>
              Explore events <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <PortalFooter />
      </main>
    );
  }

  return (
    <main className="customer-site">
      <PortalNav />
      <section className="portal-content compact">
        <span className="eyebrow">Waitlist offer / Your turn</span>
        <h1>Your seat<br /><em>opened up.</em></h1>

        {fetchLoading ? (
          <p style={{ color: 'var(--muted)', padding: 20 }}>Loading offer details…</p>
        ) : (
          <div className="portal-panel offer-panel" style={{ border: '1px solid var(--coral)', background: '#181412' }}>
            {/* Header row: status badge + countdown timer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span className="ticket-status" style={{ color: 'var(--coral)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> FairHold Waitlist Offer
              </span>
              {seconds !== null && (
                <div
                  style={{
                    color: isExpired ? '#ef4444' : seconds < 120 ? '#ef4444' : 'var(--coral)',
                    font: '22px var(--mono)',
                    fontWeight: 500,
                    animation: !isExpired && seconds < 60 ? 'pulse 1s infinite' : 'none',
                  }}
                >
                  {isExpired ? 'Expired' : formatTime(seconds)}
                </div>
              )}
            </div>

            <h2>{entry?.eventTitle || 'Your Event Pass'}</h2>
            <p style={{ color: 'var(--muted)', margin: '4px 0 16px' }}>
              {entry?.category || 'Reserved'} · {entry?.venue || 'Venue'}
              {entry?.startsAt && (
                <> · {new Date(entry.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>
              )}
            </p>

            {/* Number of seats offered */}
            {entry?.offeredSeatIds && entry.offeredSeatIds.length > 0 && (
              <div style={{ background: '#21181480', border: '1px solid #4a362c', borderRadius: 4, padding: '10px 14px', marginBottom: 16, font: '12px var(--mono)', color: 'var(--peach)' }}>
                🎟 {entry.offeredSeatIds.length} seat{entry.offeredSeatIds.length !== 1 ? 's' : ''} held for you in <strong>{entry.category}</strong>
              </div>
            )}

            <div className="hold-note" style={{ margin: '0 0 20px' }}>
              <Clock3 size={15} /> Claim now — seats are pre-held for you. You&apos;ll go directly to the seat selector to complete your booking.
            </div>

            {isExpired ? (
              <div style={{ padding: 14, background: '#1c1212', border: '1px solid #4a2020', color: '#ef4444', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
                <AlertCircle size={18} />
                <span style={{ font: '12px var(--mono)' }}>This offer has expired. Your held seats were released back to the queue.</span>
                <Link href="/events" className="coral-button" style={{ marginTop: 4 }}>
                  Browse events <ArrowUpRight size={14} />
                </Link>
              </div>
            ) : claimed ? (
              <div style={{ padding: 14, background: '#16251e', border: '1px solid #2b4738', color: 'var(--green)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, font: '11px var(--mono)' }}>
                <Check size={16} /> Seats claimed! Opening seat selector…
              </div>
            ) : (
              <button
                onClick={claim}
                disabled={loading || entry?.status === 'claimed'}
                className="coral-button"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Securing seats…' : entry?.status === 'claimed' ? 'Already claimed' : 'Claim seats & continue booking'}
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        )}
      </section>
      <PortalFooter />
    </main>
  );
}
