import { migrate } from 'drizzle-orm/node-postgres/migrator'; import { db } from './client';
async function run(){await migrate(db,{migrationsFolder:'./drizzle'});process.exit(0)}
run();
