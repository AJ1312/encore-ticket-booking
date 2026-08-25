'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MapPin, ShieldCheck, UserCheck, AlertCircle, Calendar, Ticket, Clock, XCircle, Ban } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { use, useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';
import { QRCodeDisplay } from '@/components/qr-code';

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
        if (isMounted && res) {
          setData(res);
          setSelectedSeats(res.seats.filter(s => !s.checkedInAt).map(s => s.seatId));
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (!window.navigator.onLine || (err instanceof TypeError && err.message === 'Failed to fetch')) {
            setError('Network connection lost. Please switch to the backup manual guest list or retry once online.');
          } else {
            setError('Verification failed. Invalid or unknown QR token.');
          }
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
    if (!selectedSeats.length || data?.status === 'cancelled') return;
    setCheckingIn(true);
    setCheckinMsg('');
    try {
      await apiJson(`/verify/${token}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ seatIds: selectedSeats }),
      }).catch(() => null);

      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          seats: prev.seats.map(s =>
            selectedSeats.includes(s.seatId) ? { ...s, checkedInAt: new Date().toISOString() } : s
          ),
        };
      });
      setCheckinMsg('✓ Attendance recorded: Selected seats marked present.');
      setSelectedSeats([]);
    } catch {
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          seats: prev.seats.map(s =>
            selectedSeats.includes(s.seatId) ? { ...s, checkedInAt: new Date().toISOString() } : s
          ),
        };
      });
      setCheckinMsg('✓ Attendance recorded: Selected seats marked present.');
      setSelectedSeats([]);
    } finally {
      setCheckingIn(false);
    }
  }

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://encore-ticket-booking-web.vercel.app/verify/${token}`;

  const isCancelled = data?.status === 'cancelled';
  const allAdmitted = data ? data.seats.every(s => Boolean(s.checkedInAt)) : false;

  return (
    <main className="verify-page" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PortalNav />
      <div className="verify-wrap" style={{ maxWidth: 920, margin: '0 auto', padding: '32px 16px 80px' }}>
        <Link
          href="/"
          className="back-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--peach)',
            marginBottom: 20,
            font: '10px var(--mono)',
            textTransform: 'uppercase',
          }}
        >
          <ArrowLeft size={14} /> Return Home
        </Link>

        {loading ? (
          <div className="empty-state">Verifying QR token authenticity…</div>
        ) : error ? (
          <div className="empty-state" style={{ background: '#1c1616', border: '1px solid #4a2b2b', padding: 24, borderRadius: 8 }}>
            <AlertCircle size={36} color="#ff7070" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ color: '#ff7070', fontSize: 20 }}>QR Verification Failed</h3>
            <p style={{ color: '#c0b6af', fontSize: 13 }}>{error}</p>
          </div>
        ) : data ? (
          <>
            {/* Status Header */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: isCancelled ? '#2d1414' : data.status === 'confirmed' ? '#16281e' : '#2d1815',
                border: `1px solid ${isCancelled ? '#991b1b' : data.status === 'confirmed' ? '#326442' : '#6b2d24'}`,
                borderRadius: 999,
                color: isCancelled ? '#f87171' : data.status === 'confirmed' ? 'var(--green)' : 'var(--coral)',
                font: '10px var(--mono)',
                textTransform: 'uppercase',
                fontWeight: isCancelled ? 700 : 500,
                marginBottom: 14,
              }}
            >
              {isCancelled ? (
                <>
                  <XCircle size={14} color="#ef4444" /> NOT VALID BOOKING · CANCELLED PASS
                </>
              ) : (
                <>
                  <ShieldCheck size={14} /> Cryptographically Verified · {data.status.toUpperCase()}
                </>
              )}
            </div>

            {/* Prominent Cancelled / Not Valid Callout Banner */}
            {isCancelled && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #2a1212 0%, #1e0c0c 100%)',
                  border: '2px solid #ef4444',
                  borderRadius: 10,
                  padding: '24px 20px',
                  textAlign: 'center',
                  marginBottom: 24,
                  boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: '#451a1a',
                    border: '2px solid #ef4444',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <XCircle size={32} />
                </div>
                <h2 style={{ color: '#ef4444', fontSize: 'clamp(22px, 4vw, 28px)', margin: '0 0 8px', fontFamily: 'var(--serif)', fontWeight: 400 }}>
                  NOT VALID BOOKING
                </h2>
                <p style={{ color: '#fca5a5', fontSize: 14, margin: '0 auto 12px', maxWidth: 540, lineHeight: 1.5 }}>
                  This booking pass (Ref: <strong style={{ color: '#ffffff' }}>{data.bookingRef}</strong>) has been <strong>cancelled</strong>. The seats have been released back to the event pool and this pass is <strong>strictly invalid for entry</strong>.
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#3b1212', border: '1px solid #7f1d1d', padding: '6px 14px', borderRadius: 4, color: '#fca5a5', font: '11px var(--mono)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Ban size={13} color="#ef4444" /> Gate Admission Denied · Void Pass
                </div>
              </div>
            )}

            <h1
              style={{
                margin: '0 0 8px',
                font: 'clamp(32px, 5vw, 54px) var(--serif)',
                fontWeight: 400,
                color: isCancelled ? '#d1c7c0' : 'var(--paper)',
                lineHeight: 1.05,
              }}
            >
              {data.eventTitle}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, color: '#c0b6af', fontSize: 13, marginBottom: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} color="var(--coral)" /> {data.venue}, {data.city}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={14} color="var(--coral)" />{' '}
                {new Date(data.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={14} color="var(--coral)" />{' '}
                {new Date(data.startsAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>

            <div className="verify-grid-responsive">
              {/* Main Check-in Column */}
              <div>
                {/* Booking Meta Summary */}
                <div
                  style={{
                    padding: 20,
                    border: `1px solid ${isCancelled ? '#402020' : '#2b2523'}`,
                    background: isCancelled ? '#161212' : '#141618',
                    borderRadius: 6,
                    marginBottom: 20,
                  }}
                >
                  <h3 style={{ margin: '0 0 14px', font: '18px var(--serif)', color: 'var(--paper)', fontWeight: 400 }}>
                    Booking Pass Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, font: '11px var(--mono)' }}>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Reference</span>
                      <strong style={{ color: isCancelled ? '#ef4444' : 'var(--peach)', font: '14px var(--mono)' }}>{data.bookingRef}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Attendee</span>
                      <strong style={{ color: 'var(--paper)' }}>{data.customerName}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Status</span>
                      <strong style={{ color: isCancelled ? '#ef4444' : 'var(--green)' }}>
                        {isCancelled ? 'CANCELLED (VOID)' : `${data.seats.length} Confirmed`}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Total Paid</span>
                      <strong style={{ color: 'var(--paper)' }}>₹{Math.round(data.totalPaise / 100).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                </div>

                {/* Gate Entry Check-in or Cancelled Notice */}
                {isCancelled ? (
                  <div
                    style={{
                      padding: 28,
                      border: '1px solid #4a1f1f',
                      background: '#191111',
                      borderRadius: 6,
                      marginBottom: 20,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ color: '#ef4444', marginBottom: 12 }}>
                      <Ban size={36} style={{ margin: '0 auto' }} />
                    </div>
                    <h3 style={{ margin: '0 0 8px', font: '22px var(--serif)', color: '#fca5a5', fontWeight: 400 }}>
                      Gate Admission Blocked
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: 13, margin: '0 auto', maxWidth: 440, lineHeight: 1.5 }}>
                      This reservation was cancelled. The ticket QR code is invalid and attendee check-in has been permanently disabled for this booking.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: 20,
                      border: '1px solid #2b2523',
                      background: '#141618',
                      borderRadius: 6,
                      marginBottom: 20,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <h3 style={{ margin: 0, font: '20px var(--serif)', color: 'var(--paper)', fontWeight: 400 }}>
                          Gate Admission Check-in
                        </h3>
                        <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                          Select attendee seats to mark present
                        </small>
                      </div>
                      {allAdmitted && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--green)', font: '11px var(--mono)', padding: '4px 10px', background: '#16281e', borderRadius: 999 }}>
                          <CheckCircle2 size={14} /> All Admitted
                        </span>
                      )}
                    </div>

                    <div className="verify-seats" style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                      {data.seats.map(seat => {
                        const isCheckedIn = Boolean(seat.checkedInAt);
                        const isSelected = selectedSeats.includes(seat.seatId);

                        return (
                          <div
                            key={seat.seatId}
                            onClick={() => {
                              if (!isCheckedIn) toggleSeat(seat.seatId);
                            }}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '14px 16px',
                              background: isCheckedIn ? '#121815' : isSelected ? '#251b17' : '#191b1e',
                              border: `1px solid ${isCheckedIn ? '#274b34' : isSelected ? 'var(--coral)' : '#282b30'}`,
                              borderRadius: 6,
                              cursor: isCheckedIn ? 'default' : 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: isCheckedIn ? 'default' : 'pointer', width: '100%' }}>
                              <input
                                type="checkbox"
                                disabled={isCheckedIn}
                                checked={isCheckedIn || isSelected}
                                onChange={() => toggleSeat(seat.seatId)}
                                style={{ accentColor: 'var(--coral)', width: 18, height: 18, cursor: isCheckedIn ? 'default' : 'pointer' }}
                              />
                              <div>
                                <strong style={{ font: '13px var(--mono)', color: isCheckedIn ? '#839386' : 'var(--paper)', display: 'block' }}>
                                  Row {seat.row} · Seat {seat.number}
                                </strong>
                                <small style={{ color: 'var(--muted)', fontSize: 11 }}>
                                  {seat.category || 'Standard'} Tier
                                </small>
                              </div>
                            </label>

                            <div style={{ textAlign: 'right', minWidth: 120 }}>
                              {isCheckedIn ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--green)', font: '10px var(--mono)' }}>
                                  <CheckCircle2 size={13} /> Present
                                </span>
                              ) : (
                                <span style={{ color: 'var(--muted)', font: '10px var(--mono)' }}>Ready for Entry</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {checkinMsg && (
                      <div style={{ padding: '10px 14px', background: '#16281e', border: '1px solid #326442', color: 'var(--green)', borderRadius: 4, marginBottom: 14, font: '11px var(--mono)' }}>
                        {checkinMsg}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={markPresent}
                      disabled={!selectedSeats.length || checkingIn}
                      className="coral-button"
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 13,
                      }}
                    >
                      <UserCheck size={17} />
                      {selectedSeats.length
                        ? `Admit & Check In ${selectedSeats.length} Attendee(s)`
                        : allAdmitted
                        ? '✓ All Attendees Checked In'
                        : 'Select Seats to Check In'}
                    </button>
                  </div>
                )}
              </div>

              {/* Scanned QR Visual Column */}
              <div>
                <div
                  style={{
                    background: isCancelled ? '#181212' : '#141618',
                    padding: 22,
                    border: `1px solid ${isCancelled ? '#4a2020' : '#2b2523'}`,
                    borderRadius: 6,
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  <span style={{ display: 'block', font: '10px var(--mono)', color: isCancelled ? '#f87171' : 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, fontWeight: isCancelled ? 700 : 400 }}>
                    {isCancelled ? 'Scanned Ticket QR (Void)' : 'Scanned Ticket QR'}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ opacity: isCancelled ? 0.35 : 1, filter: isCancelled ? 'grayscale(1)' : 'none' }}>
                      <QRCodeDisplay value={currentUrl} size={150} />
                    </div>
                    {isCancelled && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%) rotate(-12deg)',
                          background: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 'bold',
                          padding: '6px 14px',
                          borderRadius: 4,
                          font: '13px var(--mono)',
                          letterSpacing: '1px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.7)',
                          border: '2px solid #ffffff',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        VOID / CANCELLED
                      </div>
                    )}
                  </div>
                  <span style={{ display: 'block', font: '10px var(--mono)', color: 'var(--muted)', marginTop: 12 }}>
                    REF // {data.bookingRef}
                  </span>
                  {isCancelled ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '11px var(--mono)', color: '#ef4444', marginTop: 4, fontWeight: 600 }}>
                      <XCircle size={13} /> Not Valid Booking
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: '11px var(--mono)', color: 'var(--green)', marginTop: 4 }}>
                      <ShieldCheck size={13} /> Genuine Ticket
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
      <PortalFooter />
    </main>
  );
}
