import { SeatPicker } from '@/components/seat-picker';
export default async function ShowPage({ params }: { params: Promise<{ showId: string }> }) { const { showId } = await params; return <SeatPicker eventId={showId} />; }
