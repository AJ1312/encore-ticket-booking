'use client';

import { ChevronDown, MapPin } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const cities = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Pune'];

export function CitySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [city, setCity] = useState('Mumbai');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('encore_city');
    if (saved && cities.includes(saved)) setCity(saved);
  }, []);

  function select(nextCity: string) {
    setCity(nextCity);
    setOpen(false);
    window.localStorage.setItem('encore_city', nextCity);
    if (pathname === '/' || pathname.startsWith('/events') || pathname.startsWith('/browse')) {
      router.push(`/events?city=${encodeURIComponent(nextCity)}`);
    } else {
      const params = new URLSearchParams(window.location.search);
      params.set('city', nextCity);
      router.push(`${pathname}?${params.toString()}`);
    }
  }

  return (
    <div className="city-selector">
      <button className="location-pill" aria-expanded={open} aria-label="Choose city" onClick={() => setOpen(value => !value)}>
        <MapPin size={14} />
        <span>{city}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="city-menu" role="menu">
          {cities.map(option => (
            <button
              key={option}
              role="menuitem"
              className={option === city ? 'selected' : ''}
              onClick={() => select(option)}
            >
              {option}
              {option === city && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
