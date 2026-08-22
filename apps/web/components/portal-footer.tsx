import Link from 'next/link';

export function PortalFooter() {
  return <footer className="portal-footer">
    <div className="footer-top"><div className="footer-brand">ENCORE<span>.</span></div><p>Make going out the best part of your week.</p><Link href="/events" className="footer-cta">Find something to do <span>↗</span></Link></div>
    <div className="footer-bottom"><span>© 2026 Encore Concierge</span><div><Link href="/organiser">List an event</Link><Link href="/admin">Admin portal</Link><Link href="/terms">Privacy & terms</Link></div><span>Mumbai · India</span></div>
  </footer>;
}
