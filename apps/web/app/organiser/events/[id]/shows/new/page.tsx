'use client';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function NewShowPage() { return <main className="portal-page organiser"><PortalNav portal="organiser"/><section className="portal-content compact"><Link href="/organiser/events" className="back-link"><ArrowLeft size={15}/> Shows</Link><span className="eyebrow">Organiser / Create show</span><h1>Put it<br/><em>on sale.</em></h1><form className="admin-form" onSubmit={event => event.preventDefault()}><label>Venue<select defaultValue="Riverside Grounds"><option>Riverside Grounds</option><option>The Habitat</option></select></label><label>Start date/time<input type="datetime-local" defaultValue="2026-08-28T20:00"/></label><label>Standard price<input type="number" defaultValue="1499" min="0"/></label><button className="coral-button"><Save size={15}/> Save show</button></form></section><PortalFooter/></main>; }
