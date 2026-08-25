import { db } from './apps/api/src/db/client';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`ALTER TABLE bookings ADD COLUMN metadata JSONB;`);
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
}
run();
