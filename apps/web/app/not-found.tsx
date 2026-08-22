import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
export default function NotFound() { return <main className="auth-page"><div className="auth-brand">ENCORE<span>.</span></div><section className="auth-card"><span className="eyebrow">404 / Not found</span><h1>That room<br/><em>isn’t here.</em></h1><p className="auth-sub">The link may have moved, or the night may have sold out before it began.</p><Link href="/events" className="coral-button"><ArrowLeft size={15}/> Back to the guide</Link></section></main>; }
