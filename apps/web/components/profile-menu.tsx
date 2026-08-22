'use client';

import Link from 'next/link';
import { CircleUserRound, LogIn, Ticket, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Session } from '@encore/shared';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('encore_profile');
      if (stored) setSession(JSON.parse(stored) as Session);
    } catch { /* local profile is only a convenience; server auth remains authoritative */ }
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function signOut() {
    window.localStorage.removeItem('encore_profile');
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setSession(null);
    setOpen(false);
  }

  return <div className="profile-menu" ref={ref}>
    <button className="profile-trigger" aria-label="Open account menu" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <CircleUserRound size={20} strokeWidth={1.5} />
    </button>
    {open && <aside className="profile-popover" aria-label="Account menu">
      <div className="profile-popover-head">
        <div><span className="eyebrow">Encore account</span><strong>{session?.name || 'Your nights, together.'}</strong></div>
        <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close account menu"><X size={16}/></button>
      </div>
      {session ? <>
        <p className="profile-email">{session.email}</p>
        <Link href="/bookings" className="profile-action" onClick={() => setOpen(false)}><Ticket size={16}/> My tickets <span>↗</span></Link>
        <Link href="/events" className="profile-action" onClick={() => setOpen(false)}>Discover more <span>↗</span></Link>
        <button className="profile-action profile-logout" onClick={signOut}>Sign out <span>↗</span></button>
      </> : <>
        <p className="profile-email">Sign in to keep tickets, holds, and your saved nights in one place.</p>
        <Link href="/login" className="profile-action profile-primary" onClick={() => setOpen(false)}><LogIn size={16}/> Sign in <span>↗</span></Link>
        <Link href="/register" className="profile-action" onClick={() => setOpen(false)}>Create an account <span>↗</span></Link>
      </>}
      <div className="profile-portal-links"><span>Switch portal</span><Link href="/organiser">Organiser</Link><Link href="/admin">Admin</Link></div>
    </aside>}
  </div>;
}
