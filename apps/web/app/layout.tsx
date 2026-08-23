import './globals.css';
import type { Metadata } from 'next';
import { WelcomeModal } from '@/components/welcome-modal';
import { CookieBanner } from '@/components/cookie-banner';

export const metadata: Metadata = {
  title: 'Encore — Ticketing, beautifully considered',
  description: 'A calm, fair way to find and book the nights worth remembering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <WelcomeModal />
        <CookieBanner />
        {children}
      </body>
    </html>
  );
}
