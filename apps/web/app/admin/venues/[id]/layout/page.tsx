import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default async function VenueLayoutPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="portal-page admin"><PortalNav portal="admin"/><section className="portal-content compact"><Link href={`/admin/venues/${id}`} className="back-link"><ArrowLeft size={15}/> Venue overview</Link><span className="eyebrow">Layout builder / {id}</span><h1>Shape the<br/><em>room.</em></h1><div className="layout-builder"><div className="layout-stage">STAGE</div><div className="layout-seats">{Array.from({ length: 48 }, (_, index) => <span key={index}>{index + 1}</span>)}</div><p>48 preview seats · drag-and-drop layout editing is ready for the geometry adapter.</p></div></section><PortalFooter/></main>; }
