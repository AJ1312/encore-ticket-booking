import Link from 'next/link';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function WaitlistPage() { return <main className="customer-site"><PortalNav/><section className="portal-content compact"><span className="eyebrow">Your account / Waitlist</span><h1>Stay close<br/><em>to the door.</em></h1><div className="portal-panel"><span className="ticket-status">Watching · Premium</span><h2>The Night We Remember</h2><p>Riverside Grounds · 28 Aug · Premium seats</p><div className="hold-note"><Clock3 size={15}/> We’ll hold an offer for 15 minutes if a seat opens.</div><Link href="/events/the-night-we-remember" className="portal-link">View event <ArrowUpRight size={15}/></Link></div></section><PortalFooter/></main>; }
