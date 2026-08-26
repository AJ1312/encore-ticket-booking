import { Suspense } from 'react';
import { SeatPicker } from '@/components/seat-picker';

export default async function ShowSeatsPage({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  return (
    <Suspense fallback={<main className="customer-site" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--muted)' }}>Loading seat map…</p></main>}>
      <SeatPicker eventId={showId} />
    </Suspense>
  );
}
