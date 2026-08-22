import Link from 'next/link';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default async function WaitlistOfferPage({ params }: { params: Promise<{ entryId: string }> }) { const { entryId } = await params; return <main className="customer-site"><PortalNav/><section className="portal-content compact"><span className="eyebrow">Waitlist offer / {entryId}</span><h1>Your seat<br/><em>opened up.</em></h1><div className="portal-panel offer-panel"><span className="ticket-status">Offer expires in 15:00</span><h2>The Night We Remember</h2><p>Premium · Riverside Grounds · 28 Aug 2026</p><div className="hold-note"><Clock3 size={15}/> Claim now before we offer it to the next person.</div><Link href="/shows/the-night-we-remember/seats" className="coral-button">Claim seat <ArrowUpRight size={16}/></Link></div></section><PortalFooter/></main>; }
