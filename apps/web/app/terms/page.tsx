import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function TermsPage() { return <main className="customer-site"><PortalNav/><section className="portal-content compact"><Link href="/" className="back-link"><ArrowLeft size={15}/> Encore home</Link><span className="eyebrow">Policies</span><h1>Clear terms.<br/><em>Good nights.</em></h1><div className="portal-panel policy-copy"><h2>Encore in brief</h2><p>Encore helps people discover and reserve events. Prices, availability, and hold windows are shown before confirmation.</p><h2>Fair booking</h2><p>Seat holds expire automatically. We never promise a seat until a booking is confirmed.</p><h2>Need help?</h2><p>Write to support@encore.local during this pilot.</p></div></section><PortalFooter/></main>; }
