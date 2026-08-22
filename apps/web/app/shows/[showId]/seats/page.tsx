import { SeatPicker } from '@/components/seat-picker';
export default async function ShowSeatsPage({ params }: { params: Promise<{ showId: string }> }) { const { showId } = await params; return <SeatPicker eventId={showId} />; }
