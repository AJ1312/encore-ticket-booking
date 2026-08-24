'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Check, Image as ImageIcon, Layout, MapPin, Plus, Sparkles, Utensils, Calendar, Clock, DollarSign, Save } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { apiJson } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Venue = {
  id: string;
  name: string;
  city: string;
  address: string;
};

const SAMPLE_POSTERS = [
  { label: 'Concert Stage', url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Standup Comedy', url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85' },
  { label: 'Synth & Electronic', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85' },
  { label: 'Dining & Vinyl', url: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85' },
  { label: 'Outdoor Garden', url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85' },
];

export default function NewEventPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'concert' | 'comedy' | 'movie' | 'dining' | 'other'>('concert');
  const [posterUrl, setPosterUrl] = useState(SAMPLE_POSTERS[0].url);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [layoutType, setLayoutType] = useState<'tiered' | 'dining' | 'general'>('tiered');
  const [startsAtDate, setStartsAtDate] = useState('2026-09-24');
  const [startsAtTime, setStartsAtTime] = useState('19:30');
  const [standardPrice, setStandardPrice] = useState('999');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiJson<{ venues: Venue[] }>('/venues')
      .then(res => {
        if (res.venues && res.venues.length) {
          setVenues(res.venues);
          setSelectedVenueId(res.venues[0].id);
        }
      })
      .catch(() => null);
  }, []);

  const filteredVenues = venues.filter(v => v.city.toLowerCase() === selectedCity.toLowerCase());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // 1. Create event record
      const createdEvent = await apiJson<{ id: string; title: string }>('/organiser/events', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          type,
          posterUrl,
        }),
      });

      // 2. Create initial show linked to venue and startsAt datetime
      if (selectedVenueId && createdEvent?.id) {
        const startsAt = new Date(`${startsAtDate}T${startsAtTime}:00.000Z`);
        await apiJson('/organiser/shows', {
          method: 'POST',
          body: JSON.stringify({
            eventId: createdEvent.id,
            venueId: selectedVenueId,
            startsAt: startsAt.toISOString(),
          }),
        }).catch(() => null);
      }

      router.push('/organiser/events');
    } catch (err: any) {
      setError(err?.message || 'Unable to publish event. Please verify your organiser login credentials.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/organiser/events" className="back-link">
            <ArrowLeft size={15} /> Back to Events
          </Link>
          <span style={{ font: '11px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Event Studio & Inventory Designer
          </span>
        </div>

        <span className="eyebrow">Organiser Portal / Listing Studio</span>
        <h1 style={{ marginBottom: 36 }}>
          Publish a new<br />
          <em>experience.</em>
        </h1>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {error && (
            <div style={{ padding: 14, background: '#2d1815', border: '1px solid #632d25', color: '#ff927e', fontSize: 13, borderRadius: 6 }}>
              {error}
            </div>
          )}

          {/* Section 1: Event Identity & Content */}
          <div style={{ background: '#171a1c', border: '1px solid #3d342f', borderRadius: 8, padding: 28 }}>
            <h3 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--peach)" /> 1. Event Details & About
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Event Title
                </label>
                <input
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Midnight Waves: An Electronic Odyssey"
                  style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4, fontSize: 15 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={type}
                    onChange={e => {
                      const val = e.target.value as any;
                      setType(val);
                      if (val === 'dining') setLayoutType('dining');
                    }}
                    style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  >
                    <option value="concert">Live Music / Concert</option>
                    <option value="comedy">Standup Comedy</option>
                    <option value="movie">Cinema Screening</option>
                    <option value="dining">Dining & Table Hospitality</option>
                    <option value="other">Special Experience</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={e => setSelectedCity(e.target.value)}
                    style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  About & Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell your attendees about the performers, ambiance, food & drinks, and entry guidelines."
                  style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4, lineHeight: 1.5 }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Event Poster & Media URL */}
          <div style={{ background: '#171a1c', border: '1px solid #3d342f', borderRadius: 8, padding: 28 }}>
            <h3 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ImageIcon size={18} color="var(--peach)" /> 2. Poster Image & Visuals
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Image / Poster URL
                </label>
                <input
                  required
                  type="url"
                  value={posterUrl}
                  onChange={e => setPosterUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                />
              </div>

              <div>
                <span style={{ display: 'block', color: '#a09088', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Quick Presets:
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SAMPLE_POSTERS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPosterUrl(preset.url)}
                      style={{
                        padding: '6px 12px',
                        background: posterUrl === preset.url ? '#2e201b' : '#14181a',
                        border: `1px solid ${posterUrl === preset.url ? 'var(--coral)' : '#3d342f'}`,
                        color: posterUrl === preset.url ? 'var(--peach)' : '#c0b4ac',
                        borderRadius: 4,
                        fontSize: 11,
                        fontFamily: 'var(--mono)',
                        cursor: 'pointer',
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {posterUrl && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: '#111416', borderRadius: 6, border: '1px solid #2d2621' }}>
                  <img
                    src={posterUrl}
                    alt="Event Poster Preview"
                    style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 4, border: '1px solid #453730' }}
                    onError={e => { (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80'; }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: 13, color: 'var(--paper)' }}>Live Poster Preview</strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>This artwork will appear across discovery feeds, ticket stubs, and Apple Wallet passes.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Venue, Layout Architecture & Date/Time */}
          <div style={{ background: '#171a1c', border: '1px solid #3d342f', borderRadius: 8, padding: 28 }}>
            <h3 style={{ font: '20px var(--serif)', color: 'var(--paper)', margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layout size={18} color="var(--peach)" /> 3. Venue & Layout Configuration
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Select Venue ({selectedCity})
                </label>
                <select
                  value={selectedVenueId}
                  onChange={e => setSelectedVenueId(e.target.value)}
                  style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                >
                  {filteredVenues.length ? (
                    filteredVenues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} — {v.address}
                      </option>
                    ))
                  ) : venues.length ? (
                    venues.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.city})
                      </option>
                    ))
                  ) : (
                    <option value="">Riverside Grounds (Default Venue)</option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Seating & Capacity Layout
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setLayoutType('tiered')}
                    style={{
                      padding: 16,
                      background: layoutType === 'tiered' ? '#2b1b16' : '#14181a',
                      border: `1.5px solid ${layoutType === 'tiered' ? 'var(--coral)' : '#332d29'}`,
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ display: 'block', color: layoutType === 'tiered' ? 'var(--peach)' : 'var(--paper)', fontSize: 14 }}>
                      🎭 Tiered Auditorium
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                      Interactive seat picker with Premium, Standard & Economy tiers.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutType('dining')}
                    style={{
                      padding: 16,
                      background: layoutType === 'dining' ? '#2b1b16' : '#14181a',
                      border: `1.5px solid ${layoutType === 'dining' ? 'var(--coral)' : '#332d29'}`,
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ display: 'block', color: layoutType === 'dining' ? 'var(--peach)' : 'var(--paper)', fontSize: 14 }}>
                      🍽️ Dining & Table Reservation
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                      Party size (1-8 guests), 7-day schedule & multiple dining time slots.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayoutType('general')}
                    style={{
                      padding: 16,
                      background: layoutType === 'general' ? '#2b1b16' : '#14181a',
                      border: `1.5px solid ${layoutType === 'general' ? 'var(--coral)' : '#332d29'}`,
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ display: 'block', color: layoutType === 'general' ? 'var(--peach)' : 'var(--paper)', fontSize: 14 }}>
                      🎟️ Open General Admission
                    </strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                      Unified entry pass with atomic capacity hold tracking.
                    </span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} /> Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startsAtDate}
                    onChange={e => setStartsAtDate(e.target.value)}
                    style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> Show Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startsAtTime}
                    onChange={e => setStartsAtTime(e.target.value)}
                    style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#d0beb5', font: '10px var(--mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <DollarSign size={12} style={{ display: 'inline', marginRight: 4 }} /> Base Ticket Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={standardPrice}
                    onChange={e => setStandardPrice(e.target.value)}
                    placeholder="999"
                    style={{ width: '100%', padding: 12, background: '#111416', border: '1px solid #433832', color: 'var(--paper)', borderRadius: 4 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
            <Link
              href="/organiser/events"
              style={{
                padding: '14px 24px',
                background: 'transparent',
                border: '1px solid #433832',
                color: 'var(--paper)',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="coral-button"
              style={{ padding: '14px 32px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Save size={16} /> {saving ? 'Publishing Event…' : 'Publish & Launch On-Sale →'}
            </button>
          </div>
        </form>
      </section>
      <PortalFooter />
    </main>
  );
}
