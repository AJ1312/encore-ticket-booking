import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from './db/client';
import { users, events, venues, shows, showSeats, seats, holds, bookings } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { AppController } from './main';
import { RealtimeGateway } from './realtime.gateway';

// This is a custom e2e test suite simulating the full application lifecycle.
describe('Full Application Suite (E2E)', () => {
  let appController: AppController;
  
  // Mock the RealtimeGateway so emitSeatUpdate is a safe no-op.
  // In tests, NestJS never boots so this.server is undefined — mocking avoids the crash.
  const mockGateway = {
    emitSeatUpdate: () => {},
  } as unknown as RealtimeGateway;
  let adminUserId: string;
  let customerUserId: string;
  let venueId: string;
  let eventId: string;
  let showId: string;
  let seatIds: string[] = [];

  beforeAll(async () => {
    // Use mock gateway so WebSocket calls don't crash when server is not initialised
    appController = new AppController(mockGateway);

    // 1. Seed base data required for testing
    const [admin] = await db.insert(users).values({
      name: 'E2E Admin',
      email: 'admin.e2e@encore.local',
      passwordHash: 'hashed_password_mock',
      role: 'admin',
    }).returning({ id: users.id });
    adminUserId = admin.id;

    const [customer] = await db.insert(users).values({
      name: 'E2E Customer',
      email: 'customer.e2e@encore.local',
      passwordHash: 'hashed_password_mock',
      role: 'customer',
    }).returning({ id: users.id });
    customerUserId = customer.id;

    const [venue] = await db.insert(venues).values({
      name: 'E2E Arena',
      city: 'Test City',
      address: '123 Test St',
    }).returning({ id: venues.id });
    venueId = venue.id;

    const [event] = await db.insert(events).values({
      organiserId: adminUserId,
      title: 'E2E Spectacular',
      description: 'A full flow test event',
      type: 'concert',
      posterUrl: 'http://example.com/poster.jpg',
      status: 'active',
    }).returning({ id: events.id });
    eventId = event.id;

    const [show] = await db.insert(shows).values({
      eventId: eventId,
      venueId: venueId,
      startsAt: new Date(Date.now() + 86400000), // tomorrow
    }).returning({ id: shows.id });
    showId = show.id;

    // Create a few seats
    const createdSeats = await db.insert(seats).values([
      { venueId, section: 'A', rowLabel: '1', seatNumber: 1, category: 'VIP', pricePaise: 500000, x: 0, y: 0 },
      { venueId, section: 'A', rowLabel: '1', seatNumber: 2, category: 'VIP', pricePaise: 500000, x: 1, y: 0 },
    ]).returning({ id: seats.id });

    for (const seat of createdSeats) {
      const [showSeat] = await db.insert(showSeats).values({
        showId: showId,
        seatId: seat.id,
        status: 'available',
      }).returning({ id: showSeats.id });
      seatIds.push(showSeat.id);
    }
  });

  afterAll(async () => {
    // Cleanup generated e2e test data to keep the DB clean
    await db.delete(bookings).where(eq(bookings.userId, customerUserId));
    await db.delete(holds).where(eq(holds.userId, customerUserId));
    await db.delete(shows).where(eq(shows.id, showId));
    await db.delete(events).where(eq(events.id, eventId));
    await db.delete(seats).where(eq(seats.venueId, venueId));
    await db.delete(venues).where(eq(venues.id, venueId));
    await db.delete(users).where(eq(users.id, customerUserId));
    await db.delete(users).where(eq(users.id, adminUserId));
  });

  it('should successfully hold a seat using pessimistic locking', async () => {
    // We mock the Request object that the controller expects
    const mockRequest = { user: { sub: customerUserId, role: 'customer' }, headers: {}, cookies: {} } as any;
    
    const result = await appController.hold(showId, { seatIds: [seatIds[0]] }, mockRequest);
    
    expect(result).toHaveProperty('holdId');
    expect(result).toHaveProperty('seatIds');
    expect(result.seatIds).toContain(seatIds[0]);

    // Verify DB state
    const lockedSeat = await db.select().from(showSeats).where(eq(showSeats.id, seatIds[0])).limit(1);
    expect(lockedSeat[0].status).toBe('held');
    expect(lockedSeat[0].heldByUserId).toBe(customerUserId);
  });

  it('should fail to double-book a held seat', async () => {
    const mockRequest = { user: { sub: adminUserId, role: 'admin' }, headers: {}, cookies: {} } as any; // different user
    
    await expect(
      appController.hold(showId, { seatIds: [seatIds[0]] }, mockRequest)
    ).rejects.toThrow(/One or more seats were just taken/);
  });

  it('should successfully release a hold', async () => {
    const mockRequest = { user: { sub: customerUserId, role: 'customer' }, headers: {}, cookies: {} } as any;
    
    await appController.releaseHold(showId, { seatIds: [seatIds[0]] }, mockRequest);

    // Verify DB state reverted
    const releasedSeat = await db.select().from(showSeats).where(eq(showSeats.id, seatIds[0])).limit(1);
    expect(releasedSeat[0].status).toBe('available');
    expect(releasedSeat[0].heldByUserId).toBeNull();
  });
});
