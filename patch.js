const fs = require('fs');
const path = './apps/api/src/main.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `  @Get('shows/:showId/seats')
  async showSeats(@Param('showId') showId: string, @Req() req: Request) {
    const u = await resolveUserOrGuest(req);
    
    const showMeta = await db
      .select({
        title: events.title,
        description: events.description,
        type: events.type,
        posterUrl: events.posterUrl,
        startsAt: shows.startsAt,
        venue: venues.name,
        city: venues.city,
      })
      .from(shows)
      .innerJoin(events, eq(events.id, shows.eventId))
      .innerJoin(venues, eq(venues.id, shows.venueId))
      .where(eq(shows.id, showId))
      .limit(1);

    let meta = showMeta[0] || null;

    let result = await db
      .select({
        id: showSeats.id,
        row: seats.rowLabel,
        number: seats.seatNumber,
        category: seats.category,
        section: seats.section,
        pricePaise: sql<number>\`coalesce(\${showSeats.heldPricePaise},\${seats.pricePaise})\`,
        status: sql<string>\`case 
          when \${showSeats.status}='held' and \${showSeats.heldUntil}<=now() then 'available' 
          when \${showSeats.status}='held' and \${showSeats.heldByUserId}=\${u.sub} then 'available'
          else \${showSeats.status} end\`,
      })
      .from(showSeats)
      .innerJoin(shows, eq(showSeats.showId, shows.id))
      .innerJoin(seats, and(eq(showSeats.seatId, seats.id), eq(seats.venueId, shows.venueId)))
      .where(eq(showSeats.showId, showId));

    // Temporary patch: unconditionally run ensureShowSeats so that any previously seeded events get their type updated to 'dining' correctly in existing databases.
    await ensureShowSeats(showId);
    
    if (!result.length) {
      result = await db
        .select({
          id: showSeats.id,
          row: seats.rowLabel,
          number: seats.seatNumber,
          category: seats.category,
          section: seats.section,
          pricePaise: sql<number>\`coalesce(\${showSeats.heldPricePaise},\${seats.pricePaise})\`,
          status: sql<string>\`case 
            when \${showSeats.status}='held' and \${showSeats.heldUntil}<=now() then 'available' 
            when \${showSeats.status}='held' and \${showSeats.heldByUserId}=\${u.sub} then 'available'
            else \${showSeats.status} end\`,
        })
        .from(showSeats)
        .innerJoin(shows, eq(showSeats.showId, shows.id))
        .innerJoin(seats, and(eq(showSeats.seatId, seats.id), eq(seats.venueId, shows.venueId)))
        .where(eq(showSeats.showId, showId));

      if (!meta) {
        const refetchedMeta = await db
          .select({
            title: events.title,
            description: events.description,
            type: events.type,
            posterUrl: events.posterUrl,
            startsAt: shows.startsAt,
            venue: venues.name,
            city: venues.city,
          })
          .from(shows)
          .innerJoin(events, eq(events.id, shows.eventId))
          .innerJoin(venues, eq(venues.id, shows.venueId))
          .where(eq(shows.id, showId))
          .limit(1);
        meta = refetchedMeta[0] || null;
      }
    }

    return { seats: result, meta };
  }`;

const replacement = `  @Get('shows/:showId/seats')
  async showSeats(@Param('showId') showId: string, @Req() req: Request) {
    const u = await resolveUserOrGuest(req);
    
    // 1. Ensure seats are seeded for the current show config
    await ensureShowSeats(showId);

    // 2. Fetch the definitively assigned venueId for this show
    const show = (await db.select().from(shows).where(eq(shows.id, showId)).limit(1))[0];
    if (!show) throw new NotFoundException('Show not found');

    // 3. Fetch the meta info
    const showMeta = await db
      .select({
        title: events.title,
        description: events.description,
        type: events.type,
        posterUrl: events.posterUrl,
        startsAt: shows.startsAt,
        venue: venues.name,
        city: venues.city,
      })
      .from(shows)
      .innerJoin(events, eq(events.id, shows.eventId))
      .innerJoin(venues, eq(venues.id, shows.venueId))
      .where(eq(shows.id, showId))
      .limit(1);

    const meta = showMeta[0] || null;

    // 4. Fetch seats ensuring they belong strictly to the assigned venue
    const result = await db
      .select({
        id: showSeats.id,
        row: seats.rowLabel,
        number: seats.seatNumber,
        category: seats.category,
        section: seats.section,
        pricePaise: sql<number>\`coalesce(\${showSeats.heldPricePaise},\${seats.pricePaise})\`,
        status: sql<string>\`case 
          when \${showSeats.status}='held' and \${showSeats.heldUntil}<=now() then 'available' 
          when \${showSeats.status}='held' and \${showSeats.heldByUserId}=\${u.sub} then 'available'
          else \${showSeats.status} end\`,
      })
      .from(showSeats)
      .innerJoin(seats, eq(showSeats.seatId, seats.id))
      .where(
        and(
          eq(showSeats.showId, showId),
          eq(seats.venueId, show.venueId)
        )
      );

    return { seats: result, meta };
  }`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log('done');
