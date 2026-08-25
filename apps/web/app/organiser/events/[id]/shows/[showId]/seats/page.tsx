'use client';

import Link from 'next/link';
import { ArrowLeft, Trash2, Plus, Loader2 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type SeatItem = {
  id: string;
  section: string;
  rowLabel: string;
  seatNumber: number;
  category: string;
  pricePaise: number;
  status: string;
};

export default function ManageSeatsPage({ params }: { params: Promise<{ id: string; showId: string }> }) {
  const { id, showId } = use(params);
  const [seats, setSeats] = useState<SeatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // New seat form state
  const [section, setSection] = useState('Standard');
  const [rowLabel, setRowLabel] = useState('A');
  const [seatNumber, setSeatNumber] = useState(1);
  const [category, setCategory] = useState('Standard');
  const [price, setPrice] = useState('999');

  function loadSeats() {
    setLoading(true);
    apiJson<{ seats: SeatItem[] }>(`/shows/${showId}/seats`)
      .then(res => {
        if (res.seats) setSeats(res.seats);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSeats();
  }, [showId]);

  async function addSeat(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await apiJson(`/organiser/shows/${showId}/seats`, {
        method: 'POST',
        body: JSON.stringify({
          section,
          rowLabel,
          seatNumber: Number(seatNumber),
          category,
          pricePaise: Number(price) * 100,
        }),
      });
      setSeatNumber(s => s + 1); // Auto-increment for convenience
      loadSeats();
    } catch (err: any) {
      alert(err.message || 'Failed to add seat');
    } finally {
      setAdding(false);
    }
  }

  async function deleteSeat(seatId: string) {
    if (!confirm('Are you sure you want to delete this seat?')) return;
    try {
      await apiJson(`/organiser/shows/${showId}/seats/${seatId}`, { method: 'DELETE' });
      loadSeats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete seat');
    }
  }

  return (
    <main className="portal-page organiser">
      <PortalNav portal="organiser" />
      <section className="portal-content compact">
        <Link href={`/organiser/events/${id}/shows`} className="back-link">
          <ArrowLeft size={15} /> Back to Shows
        </Link>
        <div className="page-toolbar">
          <div>
            <span className="eyebrow">Organiser / Micro-Management</span>
            <h1>Seat<br /><em>inventory.</em></h1>
          </div>
        </div>

        <div className="admin-cards">
          <section className="portal-panel" style={{ flex: 1 }}>
            <span className="eyebrow">Add New Seat</span>
            <form onSubmit={addSeat} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
              <input type="text" placeholder="Section (e.g. Balcony)" value={section} onChange={e => setSection(e.target.value)} required style={{ flex: 1, minWidth: 120, padding: 8, border: '1px solid #c5d4c2', borderRadius: 4 }} />
              <input type="text" placeholder="Row (e.g. A)" value={rowLabel} onChange={e => setRowLabel(e.target.value)} required style={{ width: 80, padding: 8, border: '1px solid #c5d4c2', borderRadius: 4 }} />
              <input type="number" placeholder="No." value={seatNumber} onChange={e => setSeatNumber(Number(e.target.value))} required style={{ width: 80, padding: 8, border: '1px solid #c5d4c2', borderRadius: 4 }} />
              <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} required style={{ flex: 1, minWidth: 120, padding: 8, border: '1px solid #c5d4c2', borderRadius: 4 }} />
              <input type="number" placeholder="Price (₹)" value={price} onChange={e => setPrice(e.target.value)} required style={{ width: 100, padding: 8, border: '1px solid #c5d4c2', borderRadius: 4 }} />
              <button type="submit" disabled={adding} className="coral-button" style={{ padding: '8px 16px', height: 'auto' }}>
                {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Add
              </button>
            </form>
          </section>
        </div>

        <div className="event-table" style={{ marginTop: 30 }}>
          <div className="event-table-row" style={{ background: '#f5f8f5', borderBottom: '2px solid #d8e3d6', fontWeight: 600 }}>
            <span style={{ width: 40 }}>Status</span>
            <div style={{ flex: 2 }}>Location</div>
            <div style={{ flex: 1 }}>Category</div>
            <div style={{ flex: 1 }}>Price</div>
            <div style={{ width: 50, textAlign: 'right' }}>Action</div>
          </div>
          {loading ? (
            <p style={{ padding: 20, color: 'var(--muted)' }}>Loading seats…</p>
          ) : seats.length ? (
            seats.map(seat => (
              <div className="event-table-row" key={seat.id}>
                <span style={{ width: 40 }}>{seat.status === 'available' ? '🟢' : seat.status === 'held' ? '🟡' : '🔴'}</span>
                <div style={{ flex: 2 }}>
                  <strong>{seat.section}</strong>
                  <small>Row {seat.rowLabel}, Seat {seat.seatNumber}</small>
                </div>
                <div style={{ flex: 1 }}>{seat.category}</div>
                <div style={{ flex: 1 }}>₹{(seat.pricePaise / 100).toLocaleString('en-IN')}</div>
                <div style={{ width: 50, textAlign: 'right' }}>
                  {seat.status === 'available' && (
                    <button onClick={() => deleteSeat(seat.id)} style={{ background: 'none', border: 'none', color: '#c45', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: 20, color: 'var(--muted)' }}>No seats found. Create one above.</p>
          )}
        </div>
      </section>
      <PortalFooter />
    </main>
  );
}
