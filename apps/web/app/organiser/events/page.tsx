'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ExternalLink, KeyRound, LogIn, Plus, Sparkles, Utensils, Check } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { signIn } from '@/lib/auth';
import { encoreEvents } from '@/lib/events';

type EventItem = {
  id: string;
  title: string;
  type: string;
  posterUrl?: string;
  description?: string;
  createdAt: string;
};

export default function OrganiserEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authMsg, setAuthMsg] = useState('');

  function loadEvents() {
    apiJson<{ events: EventItem[] }>('/organiser/events')
      .then(res => {
        if (res.events && res.events.length) {
          setEvents(res.events);
        } else {
          // Fallback sample events for demo organiser
          setEvents(
            encoreEvents.slice(0, 4).map(e => ({
              id: e.showId,
              title: e.title,
              type: e.kind.toLowerCase(),
              posterUrl: e.image,
              description: e.description,
              createdAt: new Date().toISOString(),
            }))
          );
        }
      })
      .catch(() => {
        setEvents(
          encoreEvents.slice(0, 4).map(e => ({
            id: e.showId,
            title: e.title,
            type: e.kind.toLowerCase(),
            posterUrl: e.image,
            description: e.description,
            createdAt: new Date().toISOString(),
          }))
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function quickSignInOrganiser() {
    setSigningIn(true);
    setAuthMsg('');
    try {
      // signIn() handles storing encore_token, encore_profile, and dispatching profile-updated
      await signIn('organiser@encore.local', 'SeedPassword123!');
      setAuthMsg('Logged in as Organiser! Loaded all owned events.');
      loadEvents();
    } catch (err: any) {
      setAuthMsg(err?.message || 'Login failed');
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Link href="/organiser" className="back-link">
            <ArrowLeft size={15} /> Overview
          </Link>
          <Link href="/organiser/events/new" className="coral-button">
            <Plus size={15} /> Create & List Event
          </Link>
        </div>

        <span className="eyebrow">Organiser workspace / Programme</span>
        <h1>Your<br /><em>programme.</em></h1>

        {/* Demo Organiser Account Banner */}
        <div style={{ padding: 18, background: '#1c1715', border: '1px solid #4a362c', borderRadius: 6, marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <KeyRound size={20} color="var(--peach)" />
            <div>
              <strong style={{ display: 'block', fontSize: 13, color: 'var(--paper)' }}>Sample Organiser Access (ID: 22222222-2222-4222-8222-222222222222)</strong>
              <span style={{ fontSize: 12, color: 'var(--muted)', font: '11px var(--mono)' }}>
                Account: <strong>organiser@encore.local</strong> &nbsp;|&nbsp; Password: <strong>SeedPassword123!</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={quickSignInOrganiser}
            disabled={signingIn}
            style={{ padding: '8px 14px', background: 'var(--coral)', border: 0, color: '#fff', fontSize: 12, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
          >
            <LogIn size={13} /> {signingIn ? 'Signing in…' : '1-Click Sign In as Organiser'}
          </button>
        </div>

        {authMsg && (
          <div style={{ padding: '10px 14px', background: '#16281e', border: '1px solid #2d5e3f', color: 'var(--green)', borderRadius: 4, marginBottom: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> {authMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading events from database…</p>
          ) : events.length ? (
            events.map((event, index) => {
              const matchedStatic = encoreEvents.find(e => e.title.toLowerCase() === event.title.toLowerCase() || e.showId === event.id);
              const publicUrl = matchedStatic ? `/shows/${matchedStatic.slug}` : `/events/${event.id}`;
              const poster = event.posterUrl || matchedStatic?.image || 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=300&q=80';

              return (
                <div
                  key={event.id}
                  style={{
                    background: '#16191b',
                    border: '1px solid #2d2621',
                    borderRadius: 8,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <img
                      src={poster}
                      alt={event.title}
                      style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #3d342f' }}
                      onError={e => { (e.currentTarget as any).src = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=200&q=80'; }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 16, color: 'var(--paper)', fontFamily: 'var(--sans)' }}>{event.title}</strong>
                        <span style={{ fontSize: 10, font: '10px var(--mono)', padding: '2px 8px', borderRadius: 4, background: '#251c18', color: 'var(--peach)', textTransform: 'uppercase' }}>
                          {event.type}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                        {matchedStatic ? `${matchedStatic.venue}, ${matchedStatic.city} · ${matchedStatic.date} · ${matchedStatic.time}` : `Listed ${new Date(event.createdAt).toLocaleDateString('en-IN')}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Link
                      href={publicUrl}
                      target="_blank"
                      style={{
                        padding: '8px 14px',
                        background: '#1c1f22',
                        border: '1px solid #3d342f',
                        color: 'var(--paper)',
                        fontSize: 12,
                        borderRadius: 4,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <ExternalLink size={13} color="var(--peach)" /> View Live Public Page
                    </Link>

                    <Link
                      href={`/organiser/events/${event.id}`}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--coral)',
                        border: 0,
                        color: '#ffffff',
                        fontSize: 12,
                        borderRadius: 4,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      Manage & Inventory <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ padding: 20, color: 'var(--muted)' }}>No events on sale yet.</p>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}

