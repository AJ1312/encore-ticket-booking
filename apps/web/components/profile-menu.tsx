'use client';

import Link from 'next/link';
import { CircleUserRound, LogIn, Ticket, X, ShieldCheck, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Session } from '@encore/shared';
import { apiJson } from '@/lib/api';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function syncProfile() {
    try {
      const stored = window.localStorage.getItem('encore_profile');
      if (stored) {
        setSession(JSON.parse(stored) as Session);
      }
    } catch {
      // ignore
    }

    // Check with server authority
    apiJson<{ session?: Session; user?: Session }>('/auth/me')
      .then(res => {
        const active = res.session || res.user;
        if (active) {
          setSession(active);
          try {
            window.localStorage.setItem('encore_profile', JSON.stringify(active));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        setSession(null);
        try {
          window.localStorage.removeItem('encore_profile');
          window.localStorage.removeItem('encore_token');
        } catch {}
      });
  }

  useEffect(() => {
    syncProfile();

    const handleProfileUpdate = () => {
      syncProfile();
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

  function signOut() {
    try {
      window.localStorage.removeItem('encore_profile');
      window.localStorage.removeItem('encore_token');
    } catch {
      // ignore
    }
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null);
    setSession(null);
    setOpen(false);
    window.dispatchEvent(new CustomEvent('profile-updated'));
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
          gap: 6,
          background: session ? '#231d1a' : 'transparent',
          border: `1px solid ${session ? 'var(--coral)' : 'var(--line)'}`,
          padding: session ? '6px 12px' : '8px',
          borderRadius: 999,
          color: session ? 'var(--paper)' : 'var(--peach)',
          cursor: 'pointer',
        }}
      >
        <CircleUserRound size={18} strokeWidth={1.5} />
        {session && (
          <>
            <span style={{ fontSize: 11, font: '11px var(--mono)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.name.split(' ')[0]}
            </span>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
                boxShadow: '0 0 6px var(--green)',
              }}
            />
          </>
        )}
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
              <Link href="/login" className="profile-action profile-primary" onClick={() => setOpen(false)}>
                <LogIn size={16} /> Sign in <span>↗</span>
              </Link>
              <Link href="/register" className="profile-action" onClick={() => setOpen(false)}>
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
