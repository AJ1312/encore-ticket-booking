import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const dbUrl = process.env.DATABASE_URL || '';
const isNeonOrCloud =
  dbUrl.includes('neon.tech') ||
  dbUrl.includes('sslmode=require') ||
  (dbUrl.includes('render.com') && !dbUrl.includes('dpg-')) ||
  (process.env.NODE_ENV === 'production' && !dbUrl.includes('dpg-') && !dbUrl.includes('localhost'));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/encore',
  max: 10,
  ssl: isNeonOrCloud ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

