import { db } from './apps/api/src/db/client';
import { seats } from './apps/api/src/db/schema';
async function run() {
  const allSeats = await db.select().from(seats);
  console.log(allSeats.length);
  const v = allSeats.filter(s => s.venueId === '33333333-3333-4333-8333-555555555555');
  console.log('Venue 555 seats:', v.length);
  if (v.length > 0) {
    console.log(v.slice(0, 5));
  }
}
run().then(() => process.exit(0));
