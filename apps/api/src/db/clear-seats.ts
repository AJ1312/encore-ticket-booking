import { db } from './client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Clearing seat and booking records via TRUNCATE CASCADE...');
  
  try {
    await db.execute(sql`TRUNCATE TABLE seats, show_seats, bookings, booking_seats, payments, holds, waitlist_entries CASCADE;`);
    console.log('✨ All seat records successfully cleared!');
    console.log('The app will automatically regenerate fresh seats next time you view an event.');
  } catch (error) {
    console.error('Failed to clear records:', error);
  } finally {
    process.exit(0);
  }
}

main();
