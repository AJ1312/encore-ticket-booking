'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SearchNavButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="nav-search"
      aria-label="Search events"
      onClick={() => router.push('/events?focus=search')}
    >
      <Search size={18} />
    </button>
  );
}
