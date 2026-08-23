import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/organiser', '/admin', '/bookings', '/checkout', '/waitlist', '/booking'];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasAccessCookie = request.cookies.has('encore_access');

  const isProtected = protectedPrefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`));

  // If visiting login/register while already authenticated via cookie, send to events
  if ((path === '/login' || path === '/register') && hasAccessCookie) {
    return NextResponse.redirect(new URL('/events', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/organiser/:path*', '/admin/:path*', '/bookings/:path*', '/checkout/:path*', '/waitlist/:path*', '/booking/:path*', '/shows/:path*', '/login', '/register'],
};
