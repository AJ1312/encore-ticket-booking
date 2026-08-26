'use client';

import Link from 'next/link';
import { LogIn, Ticket, X, ShieldCheck, UserCheck, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Session } from '@encore/shared';
import { apiJson } from '@/lib/api';
import { signOut as authSignOut } from '@/lib/auth';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const loginHref = pathname ? `/login?next=${encodeURIComponent(pathname)}` : '/login';
  const registerHref = pathname ? `/register?next=${encodeURIComponent(pathname)}` : '/register';

  function syncProfile(sessionData?: any) {
    // Handle explicit null (sign-out broadcast) without touching localStorage
    if (sessionData === null) {
      setSession(null);
      return;
    }

    // If we received a direct session payload, use it
    if (sessionData && sessionData.id) {
      setSession(sessionData);
      try {
        window.localStorage.setItem('encore_profile', JSON.stringify(sessionData));
      } catch {}
      return;
    }

    // Otherwise, try localStorage then API
    try {
      const stored = window.localStorage.getItem('encore_profile');
      if (stored) {
        setSession(JSON.parse(stored) as Session);
      }
    } catch {
      // ignore
    }

    // Check with server authority
    apiJson<{ session?: Session | null; user?: Session }>('/auth/me')
      .then(res => {
        const active = res.session || res.user;
        if (active) {
          setSession(active);
          try {
            window.localStorage.setItem('encore_profile', JSON.stringify(active));
          } catch {
            // ignore
          }
        } else {
          // Server confirmed no session (returned null) — clear local state
          setSession(null);
        }
      })
      .catch(() => {
        // Network error — keep the cached local session; don't wipe on every
        // connectivity blip. The server will reject API calls if the token is stale.
      });
  }

  useEffect(() => {
    syncProfile();

    const handleProfileUpdate = (e: Event) => {
      syncProfile((e as CustomEvent).detail);
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
      document.removeEventListener('mousedown', close);
    };
  }, []);

  async function signOut() {
    setSession(null);
    setOpen(false);
    await authSignOut();
  }

  return (
    <div className="profile-menu" ref={ref} style={{ position: 'relative' }}>
      <button
        className="profile-trigger"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid var(--line)',
          padding: '8px',
          borderRadius: '50%',
          color: 'var(--peach)',
          cursor: 'pointer',
        }}
      >
        <User size={18} strokeWidth={1.5} />
      </button>

      {open && (
        <aside className="profile-popover" aria-label="Account menu">
          <div className="profile-popover-head">
            <div>
              <span className="eyebrow">{session ? 'Signed in as' : 'Encore account'}</span>
              <strong>{session?.name || 'Your nights, together.'}</strong>
            </div>
            <button className="icon-button" onClick={() => setOpen(false)} aria-label="Close account menu">
              <X size={16} />
            </button>
          </div>

          {session ? (
            <>
              <p className="profile-email" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--peach)' }}>
                <UserCheck size={13} color="var(--green)" /> {session.email}
              </p>
              <Link href="/bookings" className="profile-action" onClick={() => setOpen(false)}>
                <Ticket size={16} /> My tickets <span>↗</span>
              </Link>
              <Link href="/events" className="profile-action" onClick={() => setOpen(false)}>
                Discover more <span>↗</span>
              </Link>
              <button className="profile-action profile-logout" onClick={signOut}>
                Sign out <span>↗</span>
              </button>
            </>
          ) : (
            <>
              <p className="profile-email">Sign in to keep tickets, holds, and your saved nights in one place.</p>
              <Link href={loginHref} className="profile-action profile-primary" onClick={() => setOpen(false)}>
                <LogIn size={16} /> Sign in <span>↗</span>
              </Link>
              <Link href={registerHref} className="profile-action" onClick={() => setOpen(false)}>
                Create an account <span>↗</span>
              </Link>
            </>
          )}

          <div className="profile-portal-links">
            <span>Switch portal</span>
            <Link href="/organiser">Organiser</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </aside>
      )}
    </div>
  );
}
