import { CheckoutPanel } from '@/components/checkout-panel';
import { Suspense } from 'react';
export default async function CheckoutPage({ params }: { params: Promise<{ showId: string }> }) { const { showId } = await params; return <Suspense fallback={<main className="booking-page"><section className="checkout-wrap"><span className="eyebrow">Preparing your order</span><h1>One moment<br/><em>please.</em></h1></section></main>}><CheckoutPanel eventId={showId} /></Suspense>; }
