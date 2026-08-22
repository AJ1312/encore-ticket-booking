'use client';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function NewVenuePage() { return <main className="portal-page admin"><PortalNav portal="admin"/><section className="portal-content compact"><Link href="/admin/venues" className="back-link"><ArrowLeft size={15}/> Venues</Link><span className="eyebrow">Admin / Create venue</span><h1>Add a<br/><em>new room.</em></h1><form className="admin-form" onSubmit={event => event.preventDefault()}><label>Venue name<input required placeholder="Riverside Grounds"/></label><label>City<input required placeholder="Mumbai"/></label><label>Address<input required placeholder="Street and locality"/></label><label>Timezone<select defaultValue="Asia/Kolkata"><option>Asia/Kolkata</option><option>Asia/Singapore</option></select></label><button className="coral-button"><Save size={15}/> Save venue</button></form></section><PortalFooter/></main>; }
