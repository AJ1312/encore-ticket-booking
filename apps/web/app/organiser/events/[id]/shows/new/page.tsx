'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { apiJson } from '@/lib/api';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type VenueOption = { id: string; name: string; city: string };

export default function NewShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [venueId, setVenueId] = useState('33333333-3333-4333-8333-333333333333');
  const [startsAt, setStartsAt] = useState('2026-08-28T20:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    apiJson<{ venues: VenueOption[] }>('/admin/venues')
      .then(res => {
        if (isMounted && res.venues?.length) {
          setVenues(res.venues);
          setVenueId(res.venues[0].id);
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiJson('/organiser/shows', {
        method: 'POST',
        body: JSON.stringify({
          eventId: id,
          venueId,
          startsAt: new Date(startsAt).toISOString(),
        }),
      });
      router.push(`/organiser/events/${id}/shows`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save show. Check permissions and inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <Link href={`/organiser/events/${id}/shows`} className="back-link">
          <ArrowLeft size={15} /> Shows
        </Link>
        <span className="eyebrow">Organiser / Create show</span>
        <h1>Put it<br /><em>on sale.</em></h1>

        {error && <p className="form-error" style={{ margin: '16px 0' }}>{error}</p>}

        <form className="admin-form" onSubmit={submit}>
          <label>
            Venue
            <select value={venueId} onChange={e => setVenueId(e.target.value)}>
              {venues.length ? (
                venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city})
                  </option>
                ))
              ) : (
                <option value="33333333-3333-4333-8333-333333333333">Riverside Grounds (Mumbai)</option>
              )}
            </select>
          </label>
          <label>
            Start date/time
            <input
              name="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              required
            />
          </label>
          <button className="coral-button" disabled={loading} type="submit">
            {loading ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save show
          </button>
        </form>
      </section>
      <PortalFooter />
    </main>
  );
}
