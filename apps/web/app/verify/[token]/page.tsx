'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type SeatItem = {
  seatId: string;
  row: string;
  number: number;
  section: string;
  category: string;
  pricePaise: number;
  checkedInAt?: string | null;
};

type VerificationResult = {
  bookingRef: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  startsAt: string;
  eventTitle: string;
  venue: string;
  address: string;
  city: string;
  customerName: string;
  customerEmail: string;
  seats: SeatItem[];
};

export default function VerificationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [checkinMsg, setCheckinMsg] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiJson<VerificationResult>(`/verify/${token}`)
      .then(res => {
        if (isMounted) setData(res);
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Invalid or unverified QR token.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [token]);

  function toggleSeat(seatId: string) {
    setSelectedSeats(current =>
      current.includes(seatId) ? current.filter(id => id !== seatId) : [...current, seatId]
    );
  }

  async function markPresent() {
    if (!selectedSeats.length) return;
    setCheckingIn(true);
    setCheckinMsg('');
    try {
      await apiJson(`/verify/${token}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ seatIds: selectedSeats }),
      });

      // Update local state reflectively after API confirmation
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          seats: prev.seats.map(s =>
            selectedSeats.includes(s.seatId) ? { ...s, checkedInAt: new Date().toISOString() } : s
          ),
        };
      });
      setCheckinMsg('Selected seats marked present successfully.');
      setSelectedSeats([]);
    } catch (err) {
      setCheckinMsg(err instanceof Error ? err.message : 'Failed to update attendance check-in.');
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <main className="verify-page">
      <PortalNav />
      <div className="verify-wrap">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} /> Return home
        </Link>

        {loading ? (
          <div className="empty-state">Verifying QR token authenticity with database…</div>
        ) : error ? (
          <div className="empty-state" style={{ background: '#1c1616', border: '1px solid #4a2b2b' }}>
            <AlertCircle size={36} color="#ff7070" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ color: '#ff7070' }}>QR Verification Failed</h3>
            <p style={{ color: '#c0b6af' }}>{error}</p>
          </div>
        ) : data ? (
          <>
            <div className={`verify-status-badge ${data.status === 'confirmed' ? 'confirmed' : 'cancelled'}`}>
              <ShieldCheck size={16} /> QR Ticket Verified · {data.status.toUpperCase()}
            </div>

            <h1 style={{ margin: '0 0 10px', font: 'clamp(48px,6vw,72px) var(--serif)', fontWeight: 400, color: 'var(--paper)' }}>
              {data.eventTitle}
            </h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--coral)' }} />
              {data.venue}, {data.address}, {data.city} · {new Date(data.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>

            <div className="verify-grid">
              <div>
                <div style={{ padding: 24, border: '1px solid #2b2523', background: '#141618', marginBottom: 24 }}>
                  <h3 style={{ margin: '0 0 14px', font: '24px var(--serif)', color: 'var(--paper)', fontWeight: 400 }}>
                    Booking Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, font: '11px var(--mono)', color: '#c0b6af' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Reference</span>
                      <strong style={{ color: 'var(--paper)' }}>{data.bookingRef}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Customer</span>
                      <strong style={{ color: 'var(--paper)' }}>{data.customerName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Email</span>
                      <strong style={{ color: 'var(--peach)' }}>{data.customerEmail}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block' }}>Total Paid</span>
                      <strong style={{ color: 'var(--paper)' }}>₹{Math.round(data.totalPaise / 100).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Seat-by-Seat Attendance Check-in */}
                <div style={{ padding: 24, border: '1px solid #2b2523', background: '#141618' }}>
                  <h3 style={{ margin: '0 0 8px', font: '24px var(--serif)', color: 'var(--paper)', fontWeight: 400 }}>
                    Seat-by-Seat Attendance
                  </h3>
                  <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: 12 }}>
                    Organisers can select specific seats below to mark present. Re-scanning will show checked-in status.
                  </p>

                  <div className="verify-seats">
                    {data.seats.map(seat => {
                      const isCheckedIn = Boolean(seat.checkedInAt);
                      const isSelected = selectedSeats.includes(seat.seatId);

                      return (
                        <div key={seat.seatId} className="verify-seat-row">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: isCheckedIn ? 'default' : 'pointer' }}>
                            <input
                              type="checkbox"
                              disabled={isCheckedIn}
                              checked={isCheckedIn || isSelected}
                              onChange={() => toggleSeat(seat.seatId)}
                              style={{ accentColor: 'var(--coral)' }}
                            />
                            <span>Row {seat.row} · Seat {seat.number} ({seat.category})</span>
                          </label>
                          <div>
                            {isCheckedIn ? (
                              <span className="verify-seat-checked" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle2 size={14} /> Checked-in at {new Date(seat.checkedInAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="verify-seat-unchecked">Not checked in</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {checkinMsg && <p style={{ margin: '14px 0 0', color: 'var(--green)', fontSize: 12, font: '11px var(--mono)' }}>{checkinMsg}</p>}

                  <button
                    onClick={markPresent}
                    disabled={!selectedSeats.length || checkingIn}
                    className="checkin-btn"
                  >
                    <UserCheck size={15} /> Mark {selectedSeats.length ? `${selectedSeats.length} seat(s)` : 'selected seats'} present
                  </button>
                </div>
              </div>

              {/* QR Token Visual */}
              <div className="verify-qr-block">
                <div
                  className="verify-qr-img"
                  style={{
                    background: `url("https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : token)}") center/cover`,
                  }}
                />
                <span className="verify-qr-ref">TOKEN // {token.slice(0, 16)}…</span>
                <span style={{ font: '10px var(--mono)', color: 'var(--green)' }}>Cryptographically Verified</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <PortalFooter />
    </main>
  );
}
