'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Play, Pause, Loader2 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { apiJson } from '@/lib/api';

type AdminEvent = {
  id: string;
  title: string;
  status: 'active' | 'paused';
  type: string;
  organiserId: string;
  organiserName: string;
  createdAt: string;
  showId?: string; // The first show ID for linking to layout manager
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    apiJson<{ events: AdminEvent[] }>('/admin/events')
      .then(res => setEvents(res.events))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(eventId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    if (newStatus === 'paused' && !confirm('Are you sure you want to pause sales globally for this event? All new holds will be rejected.')) {
      return;
    }
    
    setUpdatingId(eventId);
    try {
      await apiJson(`/admin/events/${eventId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setEvents(current =>
        current.map(e => (e.id === eventId ? { ...e, status: newStatus } : e))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="portal-page admin">
      <PortalNav portal="admin" />
      <section className="portal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <span className="eyebrow">Platform Administration</span>
            <h1>Events & Layouts</h1>
          </div>
        </div>

        <div className="event-table admin-table">
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading events...</p>
          ) : events.length ? (
            events.map(e => (
              <div className="event-table-row" key={e.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 16 }}>
                <span>{e.status === 'active' ? <span style={{ color: 'var(--green)' }}>●</span> : <span style={{ color: 'var(--peach)' }}>⏸</span>}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: 14 }}>{e.title}</strong>
                  <small style={{ color: 'var(--muted)' }}>Organiser: {e.organiserName}</small>
                </div>
                
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button
                    onClick={() => toggleStatus(e.id, e.status)}
                    disabled={updatingId === e.id}
                    style={{
                      padding: '6px 12px',
                      background: e.status === 'active' ? '#2c1e1e' : '#17271e',
                      border: `1px solid ${e.status === 'active' ? '#5a3434' : '#2f573e'}`,
                      color: e.status === 'active' ? '#ff9999' : 'var(--green)',
                      borderRadius: 4,
                      fontSize: 12,
                      fontFamily: 'var(--mono)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {updatingId === e.id ? (
                      <Loader2 size={12} className="spin" />
                    ) : e.status === 'active' ? (
                      <><Pause size={12} /> Pause Sales</>
                    ) : (
                      <><Play size={12} /> Resume Sales</>
                    )}
                  </button>

                  {e.showId ? (
                    <Link
                      href={`/organiser/events/${e.id}/shows/${e.showId}/seats`}
                      style={{
                        padding: '6px 12px',
                        background: '#1b1d20',
                        border: '1px solid #3d444e',
                        color: '#a4b1be',
                        borderRadius: 4,
                        fontSize: 12,
                        fontFamily: 'var(--mono)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      Manage Layout <ArrowUpRight size={12} />
                    </Link>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No shows yet</span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#9ab5a1', font: '11px var(--mono)', textAlign: 'right' }}>
                  {new Date(e.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
              No events found.
            </div>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
