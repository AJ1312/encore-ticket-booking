import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { PortalFooter } from '@/components/portal-footer';
import { PortalNav } from '@/components/portal-nav';
export default function ContentionLabPage() { return <main className="portal-page admin"><PortalNav portal="admin"/><section className="portal-content compact"><Link href="/admin" className="back-link"><ArrowLeft size={15}/> Admin overview</Link><span className="eyebrow">FairHold / Contention lab</span><h1>Explain every<br/><em>seat outcome.</em></h1><div className="lab-callout"><strong>94.6</strong><span>Contention fairness index. Lock windows, retry policy, and audit events are visible to the operator.</span><Link href="/admin">Back to control <ArrowUpRight size={15}/></Link></div></section><PortalFooter/></main>; }
