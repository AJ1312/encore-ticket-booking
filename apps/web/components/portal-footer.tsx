'use client';

import Link from 'next/link';

export function PortalFooter() {
  function openAuthorNote(e: React.MouseEvent) {
    e.preventDefault();
    window.dispatchEvent(new Event('open-welcome-modal'));
  }

  return (
    <footer className="portal-footer">
      <div className="footer-top">
        <div className="footer-brand">ENCORE<span>.</span></div>
        <p>Make going out the best part of your week.</p>
        <Link href="/events" className="footer-cta">Find something to do <span>↗</span></Link>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Encore Concierge</span>
        <div>
          <a href="#" onClick={openAuthorNote} style={{ color: 'var(--peach)' }}>Author note</a>
          <Link href="/organiser">Organiser portal</Link>
          <Link href="/admin">Admin portal</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span>Mumbai · India</span>
      </div>
    </footer>
  );
}
