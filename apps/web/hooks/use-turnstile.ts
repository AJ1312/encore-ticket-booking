'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '0x4AAAAAAEb2pV-sOTXXLdIU';

/**
 * Renders a Cloudflare Turnstile challenge widget into a container ref.
 * Loads the Turnstile script once on mount (idempotent).
 * Returns a `getToken()` function that resolves the current cf-turnstile-response token.
 * Automatically resets the widget after a successful token read (tokens are single-use).
 */
export function useTurnstile(action: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    // Clean up any previously rendered widget
    if (widgetIdRef.current) {
      try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
    }
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      action,
      callback: (token: string) => { tokenRef.current = token; },
      'expired-callback': () => { tokenRef.current = ''; },
      'error-callback': () => { tokenRef.current = ''; },
      theme: 'dark',
      size: 'normal',
    });
  }, [action]);

  useEffect(() => {
    // If the script is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load the script once; use a global callback to know when it's ready
    if (!document.getElementById('cf-turnstile-script')) {
      window.onTurnstileLoad = renderWidget;
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
      // Script tag exists but turnstile isn't ready yet — wait for the callback
      window.onTurnstileLoad = renderWidget;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  /** Returns the current token and resets the widget (tokens are single-use per CF docs). */
  const getToken = useCallback((): string => {
    const token = tokenRef.current;
    tokenRef.current = '';
    // Reset so user can retry on the same page without a full remount
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch { /* ignore */ }
    }
    return token;
  }, []);

  return { containerRef, getToken };
}
