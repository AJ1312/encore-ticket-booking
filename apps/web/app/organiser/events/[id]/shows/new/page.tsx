'use client';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
import { apiJson } from '@/lib/api';
import { use } from 'react';
export default function NewShowPage({ params }: { params: Promise<{ id: string }> }) { const { id } = use(params); async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); await apiJson('/organiser/shows', { method: 'POST', body: JSON.stringify({ eventId: id, venueId: '33333333-3333-4333-8333-333333333333', startsAt: form.get('startsAt') }) }); window.location.href = `/organiser/events/${id}/shows`; } return <main className="portal-page organiser"><PortalNav portal="organiser"/><section className="portal-content compact"><Link href={`/organiser/events/${id}/shows`} className="back-link"><ArrowLeft size={15}/> Shows</Link><span className="eyebrow">Organiser / Create show</span><h1>Put it<br/><em>on sale.</em></h1><form className="admin-form" onSubmit={submit}><label>Venue<select name="venue"><option value="33333333-3333-4333-8333-333333333333">Riverside Grounds</option></select></label><label>Start date/time<input name="startsAt" type="datetime-local" defaultValue="2026-08-28T20:00" required/></label><button className="coral-button"><Save size={15}/> Save show</button></form></section><PortalFooter/></main>; }
