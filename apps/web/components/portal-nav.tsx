import Link from 'next/link';
import { ProfileMenu } from './profile-menu';
import { CitySelector } from './city-selector';
import { SearchNavButton } from './search-nav-button';
import { NotificationBell } from './notification-bell';

export function PortalNav({ portal = 'customer' }: { portal?: 'customer' | 'organiser' | 'admin' }) {
  if (portal !== 'customer') {
    return (
      <header className={`portal-nav ${portal}`}>
        <div className="nav-left">
          <Link href="/" className="brand">
            ENCORE<span>.</span>
          </Link>
          <span className="portal-tag" style={{ font: '10px var(--mono)', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: portal === 'admin' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(224, 122, 95, 0.15)', color: portal === 'admin' ? 'var(--green)' : 'var(--peach)', letterSpacing: '0.05em' }}>
            {portal}
          </span>
        </div>

        <nav className="portal-nav-center">
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

        <div className="nav-right">
          <NotificationBell />
          <ProfileMenu />
        </div>
      </header>
    );
  }

  return (
    <header className="portal-nav customer-nav">
      <div className="nav-left">
        <Link href="/" className="brand">
          ENCORE<span>.</span>
        </Link>
        <CitySelector />
      </div>

      <nav className="customer-links portal-nav-center">
        <Link href="/events">Explore</Link>
        <Link href="/events?kind=events">Live Events</Link>
        <Link href="/events?kind=movies">Movies</Link>
        <Link href="/events?kind=dining">Dining</Link>
      </nav>

      <div className="nav-right">
        <SearchNavButton />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
}
