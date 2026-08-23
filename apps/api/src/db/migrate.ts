import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './client';
import * as path from 'node:path';
import * as fs from 'node:fs';

export async function runMigrations() {
  const candidates = [
    path.resolve(process.cwd(), 'apps/api/drizzle'),
    path.resolve(process.cwd(), 'drizzle'),
    path.resolve(__dirname, '../../drizzle'),
    path.resolve(__dirname, '../drizzle'),
    path.resolve(__dirname, '../../../drizzle'),
  ];
  const migrationsFolder = candidates.find(c => fs.existsSync(c) && fs.existsSync(path.join(c, 'meta')));
  if (migrationsFolder) {
    console.log(`[Migrations] Applying Drizzle migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('[Migrations] All migrations applied successfully.');
  } else {
    console.warn('[Migrations] Warning: Could not locate drizzle folder. Skipping migration step.');
  }
}

async function run() {
  try {
    await runMigrations();
    process.exit(0);
  } catch (err) {
    console.error('[Migrations] Failed to run migrations:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

