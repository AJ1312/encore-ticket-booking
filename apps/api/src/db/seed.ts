import 'dotenv/config';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { events, seats, showSeats, shows, users, venues } from './schema';

const defaultAdminId = '11111111-1111-4111-8111-111111111111';
const defaultOrganiserId = '22222222-2222-4222-8222-222222222222';

const defaultVenues = [
  { id: '33333333-3333-4333-8333-333333333333', name: 'Riverside Grounds', city: 'Mumbai', address: 'Bandra West, Mumbai', timezone: 'Asia/Kolkata' },
  { id: '33333333-3333-4333-8333-000000000001', name: 'The Habitat', city: 'Mumbai', address: 'Khar West, Mumbai', timezone: 'Asia/Kolkata' },
  { id: '33333333-3333-4333-8333-000000000010', name: 'Sunder Nursery Amphitheatre', city: 'Delhi NCR', address: 'Nizamuddin, New Delhi', timezone: 'Asia/Kolkata' },
  { id: '33333333-3333-4333-8333-000000000020', name: 'Jayamahal Palace Lawns', city: 'Bengaluru', address: 'Near Cantonment, Bengaluru', timezone: 'Asia/Kolkata' },
  { id: '33333333-3333-4333-8333-000000000030', name: 'The Mills Amphitheatre', city: 'Pune', address: 'Raja Bahadur Mills, Pune', timezone: 'Asia/Kolkata' },
];

const defaultEvents = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    organiserId: defaultOrganiserId,
    title: 'The Night We Remember',
    description: 'An intimate indoor stage, a handpicked line-up, and the kind of night that turns into a group chat name.',
    type: 'concert' as const,
    posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85',
    showId: '55555555-5555-4555-8555-555555555555',
    venueId: '33333333-3333-4333-8333-333333333333',
    startsAt: new Date('2026-08-28T14:30:00.000Z'),
  },
  {
    id: '44444444-4444-4444-8444-000000000010',
    organiserId: defaultOrganiserId,
    title: 'Echoes in the Ruins: Sunder Acoustic',
    description: 'A sunset acoustic concert set amongst heritage monuments and green gardens in Delhi.',
    type: 'concert' as const,
    posterUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1400&q=85',
    showId: '55555555-5555-4555-8555-000000000010',
    venueId: '33333333-3333-4333-8333-000000000010',
    startsAt: new Date('2026-08-31T13:00:00.000Z'),
  },
  {
    id: '44444444-4444-4444-8444-000000000020',
    organiserId: defaultOrganiserId,
    title: 'Garden City Live: Synth & Brass',
    description: 'A seamless fusion of live brass instruments and modular synthesizers under the Bengaluru canopy.',
    type: 'concert' as const,
    posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85',
    showId: '55555555-5555-4555-8555-000000000020',
    venueId: '33333333-3333-4333-8333-000000000020',
    startsAt: new Date('2026-08-29T13:30:00.000Z'),
  },
  {
    id: '44444444-4444-4444-8444-000000000030',
    organiserId: defaultOrganiserId,
    title: 'Sunset Sessions at The Mills',
    description: 'Indie singer-songwriters playing warm stripped-down arrangements as the sun sets over Pune.',
    type: 'concert' as const,
    posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1400&q=85',
    showId: '55555555-5555-4555-8555-000000000030',
    venueId: '33333333-3333-4333-8333-000000000030',
    startsAt: new Date('2026-08-30T13:15:00.000Z'),
  },
];

async function run() {
  const seedPassword = process.env.SEED_PASSWORD || 'SeedPassword123!';
  const password = await argon2.hash(seedPassword);

  // 1. Seed users
  await db.insert(users).values([
    { id: defaultAdminId, name: 'Encore Admin', email: 'admin@encore.local', passwordHash: password, role: 'admin' },
    { id: defaultOrganiserId, name: 'Encore Organiser', email: 'organiser@encore.local', passwordHash: password, role: 'organiser' },
  ]).onConflictDoNothing();

  // 2. Seed venues & seat inventories
  for (const v of defaultVenues) {
    await db.insert(venues).values(v).onConflictDoNothing();
    const existingSeats = await db.select({ id: seats.id }).from(seats).where(eq(seats.venueId, v.id));
    if (!existingSeats.length) {
      const inventory = Array.from({ length: 72 }, (_, i) => ({
        venueId: v.id,
        section: i < 24 ? 'Premium' : i < 48 ? 'Standard' : 'Economy',
        rowLabel: String.fromCharCode(65 + Math.floor(i / 12)),
        seatNumber: (i % 12) + 1,
        category: i < 24 ? 'Premium' : i < 48 ? 'Standard' : 'Economy',
        pricePaise: i < 24 ? 149900 : i < 48 ? 99900 : 69900,
        x: i % 12,
        y: Math.floor(i / 12),
      }));
      await db.insert(seats).values(inventory).onConflictDoNothing();
    }
  }

  // 3. Seed events, shows, and link show_seats
  for (const ev of defaultEvents) {
    await db.insert(events).values({
      id: ev.id,
      organiserId: ev.organiserId,
      title: ev.title,
      description: ev.description,
      type: ev.type,
      posterUrl: ev.posterUrl,
    }).onConflictDoNothing();

    await db.insert(shows).values({
      id: ev.showId,
      eventId: ev.id,
      venueId: ev.venueId,
      startsAt: ev.startsAt,
    }).onConflictDoNothing();

    const venueSeats = await db.select({ id: seats.id }).from(seats).where(eq(seats.venueId, ev.venueId));
    if (venueSeats.length) {
      await db.insert(showSeats).values(venueSeats.map(s => ({ showId: ev.showId, seatId: s.id }))).onConflictDoNothing();
    }
  }

  console.log('Seeded multi-city venues, events, and seat inventory successfully.');
  process.exit(0);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
