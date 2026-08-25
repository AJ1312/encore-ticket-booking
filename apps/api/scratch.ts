import { db } from './src/db/client';
import { seats } from './src/db/schema';
async function run() {
  const allSeats = await db.select().from(seats);
  console.log('Total seats:', allSeats.length);
  const v = allSeats.filter(s => s.venueId === '33333333-3333-4333-8333-555555555555');
  console.log('Venue 555 seats:', v.length);
}
run().then(() => process.exit(0)).catch(console.error);
