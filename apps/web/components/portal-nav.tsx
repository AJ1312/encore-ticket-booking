import Link from 'next/link';
import { ProfileMenu } from './profile-menu';
import { CitySelector } from './city-selector';
import { SearchNavButton } from './search-nav-button';
import { NotificationBell } from './notification-bell';

export function PortalNav({ portal = 'customer' }: { portal?: 'customer' | 'organiser' | 'admin' }) {
  if (portal !== 'customer') {
    return (
      <header className={`portal-nav ${portal}`}>
        <Link href="/" className="brand">
          ENCORE<span>.</span>
        </Link>
        <nav>
          {portal === 'organiser' ? (
            <>
              <Link href="/organiser">Overview</Link>
              <Link href="/organiser/events">Events</Link>
            </>
          ) : (
            <>
              <Link href="/admin">Overview</Link>
              <Link href="/admin/venues">Venues</Link>
              <Link href="/admin/users">Users & Roles</Link>
              <Link href="/admin/jobs">Jobs</Link>
              <Link href="/admin/contention-lab">FairHold lab</Link>
            </>
          )}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NotificationBell />
          <ProfileMenu />
        </div>
      </header>
    );
  }

  return (
    <header className="portal-nav customer-nav">
      <Link href="/" className="brand">
        ENCORE<span>.</span>
      </Link>
      <CitySelector />
      <nav className="customer-links">
        <Link href="/events">Explore</Link>
        <Link href="/events?kind=events">Live events</Link>
        <Link href="/events?kind=movies">Movies</Link>
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        <SearchNavButton />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
