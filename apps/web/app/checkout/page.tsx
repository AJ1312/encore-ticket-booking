import { Suspense } from 'react';
import { CheckoutPanel } from '@/components/checkout-panel';
export default function CheckoutPage() { return <Suspense fallback={<main className="booking-page"><section className="checkout-wrap"><span className="eyebrow">Preparing your order</span><h1>One moment<br/><em>please.</em></h1></section></main>}><CheckoutPanel /></Suspense>; }
