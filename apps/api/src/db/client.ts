import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const isNeonOrCloud =
  process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.DATABASE_URL?.includes('sslmode=require') ||
  process.env.DATABASE_URL?.includes('render.com') ||
  process.env.NODE_ENV === 'production' ||
  !process.env.DATABASE_URL?.includes('localhost');

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/encore',
  max: 10,
  ssl: isNeonOrCloud ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

