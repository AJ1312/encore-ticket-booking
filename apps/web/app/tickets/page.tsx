'use client';

import Link from 'next/link';
import { ArrowLeft, Ticket, Calendar, MapPin, Clock } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { useEffect, useState } from 'react';
import { apiJson } from '@/lib/api';

type Booking = {
  bookingRef: string;
  showId: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  startsAt: string;
  eventTitle: string;
  venue: string;
  city: string;
  seatsCount: number;
};

export default function MyTicketsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<{ bookings: Booking[] }>('/bookings')
      .then((data) => {
        setBookings(data.bookings);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load tickets');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1012] text-white flex flex-col">
      <PortalNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-24">
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-[#748cab] hover:text-white transition-colors mb-6 font-mono text-sm">
            <ArrowLeft size={16} /> Back to Events
          </Link>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-[#f8f9fa] flex items-center gap-3">
            <Ticket className="text-[var(--coral)]" /> My Tickets
          </h1>
        </div>

        {loading ? (
          <div className="flex gap-6 flex-wrap">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 min-w-[300px] h-[220px] bg-[#14171a] rounded-xl border border-[#23272d] animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-[#3d241c] border border-[#e07a5f] text-[#ffd8cc] rounded-xl font-mono text-center">
            {error} (Please ensure you are logged in)
          </div>
        ) : bookings && bookings.length === 0 ? (
          <div className="text-center py-20 bg-[#14171a] rounded-xl border border-[#23272d]">
            <Ticket size={48} className="mx-auto text-[#415a77] mb-4" />
            <h2 className="text-xl font-bold text-[#f8f9fa] mb-2 font-mono">No tickets found</h2>
            <p className="text-[#748cab] mb-6">Looks like you haven't booked any events yet.</p>
            <Link href="/" className="px-6 py-3 bg-[var(--coral)] hover:bg-[var(--peach)] text-[#14171a] rounded-lg font-bold font-mono transition-colors">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings?.map((booking) => {
              const date = new Date(booking.startsAt);
              return (
                <Link
                  key={booking.bookingRef}
                  href={`/bookings/${booking.bookingRef}/confirmation`}
                  className="group relative bg-[#14171a] hover:bg-[#1a1d21] p-6 rounded-xl border border-[#23272d] hover:border-[#415a77] transition-all overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--coral)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 text-xs font-bold font-mono rounded ${
                      booking.status === 'confirmed' ? 'bg-[#1c3624] text-[#52b788]' :
                      booking.status === 'cancelled' ? 'bg-[#3d241c] text-[#e07a5f]' :
                      'bg-[#23272d] text-[#748cab]'
                    } uppercase`}>
                      {booking.status}
                    </span>
                    <span className="text-[#748cab] font-mono text-xs text-right">
                      {booking.seatsCount} {booking.seatsCount === 1 ? 'Seat' : 'Seats'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#f8f9fa] mb-4">{booking.eventTitle}</h3>
                  
                  <div className="flex flex-col gap-2 text-sm text-[#748cab] font-mono mt-auto">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {booking.venue}, {booking.city}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <PortalFooter />
    </div>
  );
}
