'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, X, Check } from 'lucide-react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = window.localStorage.getItem('encore_cookie_consent');
      if (!consent) {
        // Show after a brief delay for smooth entry
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  function accept(type: 'all' | 'essential') {
    try {
      window.localStorage.setItem('encore_cookie_consent', type);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie preferences"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        left: 24,
        maxWidth: 520,
        marginLeft: 'auto',
        zIndex: 990,
        background: 'rgba(20, 23, 26, 0.96)',
        backdropFilter: 'blur(16px)',
        border: '1px solid #453730',
        borderRadius: 8,
        padding: '20px 24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#2d1b15',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--coral)',
              flexShrink: 0,
            }}
          >
            <Cookie size={16} />
          </div>
          <div>
            <span style={{ font: '10px var(--mono)', color: 'var(--peach)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Privacy & Preferences
            </span>
            <strong style={{ display: 'block', color: 'var(--paper)', fontSize: 14, fontWeight: 600, marginTop: 2 }}>
              Cookie Consent & Session Persistence
            </strong>
          </div>
        </div>
        <button
          type="button"
          onClick={() => accept('essential')}
          aria-label="Dismiss cookie notice"
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ color: '#c0b6af', fontSize: 12, lineHeight: 1.55, margin: '12px 0 16px' }}>
        Encore uses essential cookies to preserve your authenticated login session, safeguard your active 15-minute seat holds, and ensure rapid ticket verification at venue gates.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => accept('all')}
          className="coral-button"
          style={{ padding: '9px 16px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Check size={14} /> Accept & Remember Me
        </button>
        <button
          type="button"
          onClick={() => accept('essential')}
          className="ghost-button"
          style={{ padding: '9px 14px', fontSize: 11, cursor: 'pointer' }}
        >
          Essential Only
        </button>
        <Link
          href="/terms"
          style={{
            marginLeft: 'auto',
            color: 'var(--muted)',
            font: '10px var(--mono)',
            textTransform: 'uppercase',
            textDecoration: 'underline',
          }}
        >
          Learn More
        </Link>
      </div>
    </aside>
  );
}
