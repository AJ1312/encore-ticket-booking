'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Clock, Sparkles, CheckCircle2, Ticket, X, ChevronRight } from 'lucide-react';
import { apiJson } from '@/lib/api';

type AppNotification = {
  id: string;
  type: 'hold_warning' | 'waitlist_offer' | 'booking_confirmed' | 'seat_opened';
  title: string;
  message: string;
  timestamp: string;
  link: string;
  unread: boolean;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      type: 'waitlist_offer',
      title: 'Waitlist Priority Batch Active',
      message: 'Seats opened up for The Night We Remember. You have a 15-minute priority claim window.',
      timestamp: 'Just now',
      link: '/waitlist/wl-demo-batch-1',
      unread: true,
    },
    {
      id: 'notif-2',
      type: 'booking_confirmed',
      title: 'Booking Confirmed',
      message: 'Your ticket pass for The Night We Remember is ready. Present QR at gate.',
      timestamp: '2 hours ago',
      link: '/booking/ENC-55F9CA50/confirmation',
      unread: false,
    },
  ]);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  }

  function dismiss(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={`Notifications (${unreadCount} unread)`}
        style={{
          position: 'relative',
          background: open ? '#2a201c' : 'transparent',
          border: '1px solid #4a362c',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--peach)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: 'var(--coral)',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              width: 17,
              height: 17,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 0 8px var(--coral)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 340,
            background: '#16191c',
            border: '1px solid #3d342f',
            borderRadius: 8,
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid #282b30',
              background: '#131517',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ font: '13px var(--mono)', color: 'var(--paper)', textTransform: 'uppercase' }}>
                Notifications
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#3d241c',
                    color: 'var(--coral)',
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--muted)',
                  fontSize: 11,
                  font: '10px var(--mono)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: 'var(--green)' }} />
                You’re all caught up.
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    setNotifications(prev => prev.map(item => (item.id === n.id ? { ...item, unread: false } : item)));
                    setOpen(false);
                  }}
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    borderBottom: '1px solid #202327',
                    background: n.unread ? 'rgba(224, 122, 95, 0.08)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {n.type === 'waitlist_offer' ? (
                        <Sparkles size={13} color="var(--coral)" />
                      ) : n.type === 'hold_warning' ? (
                        <Clock size={13} color="var(--peach)" />
                      ) : (
                        <Ticket size={13} color="var(--green)" />
                      )}
                      <strong style={{ color: 'var(--paper)', fontSize: 12, fontWeight: 600 }}>{n.title}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={e => dismiss(n.id, e)}
                      style={{ background: 'transparent', border: 0, color: 'var(--muted)', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p style={{ margin: '2px 0 6px', color: '#c0b6af', fontSize: 11, lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ color: 'var(--muted)', font: '9px var(--mono)', textTransform: 'uppercase' }}>
                    {n.timestamp} · Tap to act →
                  </span>
                </Link>
              ))
            )}
          </div>

          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #282b30',
              background: '#131517',
              textAlign: 'center',
            }}
          >
            <Link
              href="/waitlist"
              onClick={() => setOpen(false)}
              style={{
                color: 'var(--peach)',
                font: '10px var(--mono)',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              My Waitlists & Preferences <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
