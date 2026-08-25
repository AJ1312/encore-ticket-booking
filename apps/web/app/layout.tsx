import './globals.css';
import type { Metadata } from 'next';
import { WelcomeModal } from '@/components/welcome-modal';
import { CookieBanner } from '@/components/cookie-banner';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'Encore — Ticketing, beautifully considered',
  description: 'A calm, fair way to find and book the nights worth remembering.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <WelcomeModal />
        <CookieBanner />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
