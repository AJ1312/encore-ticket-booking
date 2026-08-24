import { db } from './db/client';
import { events, shows, venues } from './db/schema';
import { eq } from 'drizzle-orm';

const cityShows = {
  '55555555-5555-4555-8555-555555555555': {
    venueId: '33333333-3333-4333-8333-333333333333',
    venueName: 'Riverside Grounds',
    city: 'Mumbai',
    eventId: '44444444-4444-4444-8444-555555555555',
    eventTitle: 'The Night We Remember',
    posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
    startsAt: new Date('2026-08-28T14:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000001': {
    venueId: '33333333-3333-4333-8333-000000000001',
    venueName: 'The Habitat',
    city: 'Mumbai',
    eventId: '44444444-4444-4444-8444-000000000001',
    eventTitle: 'Actually, I’m Fine',
    posterUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-29T14:00:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000002': {
    venueId: '33333333-3333-4333-8333-000000000002',
    venueName: 'AntiSocial',
    city: 'Mumbai',
    eventId: '44444444-4444-4444-8444-000000000002',
    eventTitle: 'Signals / After Dark',
    posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-30T16:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000003': {
    venueId: '33333333-3333-4333-8333-000000000003',
    venueName: 'PVR Lower Parel',
    city: 'Mumbai',
    eventId: '44444444-4444-4444-8444-000000000003',
    eventTitle: 'Midnight in Marigold',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-28T16:15:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000004': {
    venueId: '33333333-3333-4333-8333-000000000004',
    venueName: 'The Bombay Canteen',
    city: 'Mumbai',
    eventId: '44444444-4444-4444-8444-000000000004',
    eventTitle: 'Sunday Social: Vinyl & Small Plates',
    posterUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-09-01T07:00:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000010': {
    venueId: '33333333-3333-4333-8333-000000000010',
    venueName: 'Sunder Nursery Amphitheatre',
    city: 'Delhi NCR',
    eventId: '44444444-4444-4444-8444-000000000010',
    eventTitle: 'Echoes in the Ruins: Sunder Acoustic',
    posterUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85',
    startsAt: new Date('2026-08-31T13:00:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000011': {
    venueId: '33333333-3333-4333-8333-000000000011',
    venueName: 'Canvas Laugh Club CyberHub',
    city: 'Delhi NCR',
    eventId: '44444444-4444-4444-8444-000000000011',
    eventTitle: 'Capital Comedy Showcase',
    posterUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-09-01T14:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000012': {
    venueId: '33333333-3333-4333-8333-000000000012',
    venueName: 'Imperfecto Patio',
    city: 'Delhi NCR',
    eventId: '44444444-4444-4444-8444-000000000012',
    eventTitle: 'Neon Horizon / Rooftop Beats',
    posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-09-02T15:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000020': {
    venueId: '33333333-3333-4333-8333-000000000020',
    venueName: 'Jayamahal Palace Lawns',
    city: 'Bengaluru',
    eventId: '44444444-4444-4444-8444-000000000020',
    eventTitle: 'Garden City Live: Synth & Brass',
    posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85',
    startsAt: new Date('2026-08-29T13:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000021': {
    venueId: '33333333-3333-4333-8333-000000000021',
    venueName: 'The Underground Club',
    city: 'Bengaluru',
    eventId: '44444444-4444-4444-8444-000000000021',
    eventTitle: 'Underground Comedy: Indiranagar',
    posterUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-30T15:00:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000022': {
    venueId: '33333333-3333-4333-8333-000000000022',
    venueName: 'Toit Brewpub',
    city: 'Bengaluru',
    eventId: '44444444-4444-4444-8444-000000000022',
    eventTitle: 'Hops & Needle: Craft Vinyl Brunch',
    posterUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-31T07:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000030': {
    venueId: '33333333-3333-4333-8333-000000000030',
    venueName: 'The Mills Amphitheatre',
    city: 'Pune',
    eventId: '44444444-4444-4444-8444-000000000030',
    eventTitle: 'Sunset Sessions at The Mills',
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=85',
    startsAt: new Date('2026-08-30T13:15:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000031': {
    venueId: '33333333-3333-4333-8333-000000000031',
    venueName: 'Classic Rock Coffee Co',
    city: 'Pune',
    eventId: '44444444-4444-4444-8444-000000000031',
    eventTitle: 'Koregaon Park Comedy Special',
    posterUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-08-31T14:30:00.000Z'),
  },
  '55555555-5555-4555-8555-000000000032': {
    venueId: '33333333-3333-4333-8333-000000000032',
    venueName: 'Santé Spa & Bistro',
    city: 'Pune',
    eventId: '44444444-4444-4444-8444-000000000032',
    eventTitle: 'Candlelight Jazz & Dine',
    posterUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85',
    startsAt: new Date('2026-09-01T14:00:00.000Z'),
  }
};

export async function fixDb() {
  console.log('Fixing DB...');
  for (const [showId, cfg] of Object.entries(cityShows)) {
    try {
      await db.update(events).set({ title: cfg.eventTitle, posterUrl: cfg.posterUrl }).where(eq(events.id, cfg.eventId));
      await db.update(venues).set({ name: cfg.venueName, city: cfg.city }).where(eq(venues.id, cfg.venueId));
      await db.update(shows).set({ startsAt: cfg.startsAt }).where(eq(shows.id, showId));
    } catch (e) {
      console.error(e);
    }
  }
  console.log('DB fixed!');
}

