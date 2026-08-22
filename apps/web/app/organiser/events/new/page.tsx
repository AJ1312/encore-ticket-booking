'use client';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function NewEventPage() { return <main className="portal-page organiser"><PortalNav portal="organiser"/><section className="portal-content compact"><Link href="/organiser/events" className="back-link"><ArrowLeft size={15}/> Events</Link><span className="eyebrow">Organiser / Create event</span><h1>Give it a<br/><em>name.</em></h1><form className="admin-form" onSubmit={event => event.preventDefault()}><label>Title<input required placeholder="The Night We Remember"/></label><label>Description<textarea required placeholder="Tell people why this night matters."/></label><label>Type<select defaultValue="Events"><option>Events</option><option>Comedy</option><option>Movies</option><option>Dining</option></select></label><label>Poster URL<input placeholder="https://..."/></label><button className="coral-button"><Save size={15}/> Save draft</button></form></section><PortalFooter/></main>; }
