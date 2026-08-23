'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/api';

export default function NewVenuePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiJson('/admin/venues', {
        method: 'POST',
        body: JSON.stringify({ name, city, address, timezone }),
      });
      router.push('/admin/venues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create venue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content compact">
        <Link href="/admin/venues" className="back-link">
          <ArrowLeft size={15} /> Venues
        </Link>
        <span className="eyebrow">Admin / Create venue</span>
        <h1>Add a<br /><em>new room.</em></h1>

        {error && <p className="form-error" style={{ margin: '16px 0' }}>{error}</p>}

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Venue name
            <input
              required
              placeholder="e.g. Bandra Amphitheatre"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            City
            <input
              required
              placeholder="Mumbai"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </label>
          <label>
            Address
            <input
              required
              placeholder="Street and locality"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </label>
          <label>
            Timezone
            <select value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <button className="coral-button" disabled={loading} type="submit">
            {loading ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Save venue
          </button>
        </form>
      </section>
      <PortalFooter />
    </main>
  );
}
