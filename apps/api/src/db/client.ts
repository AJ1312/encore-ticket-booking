import { drizzle } from 'drizzle-orm/node-postgres'; import { Pool } from 'pg'; import * as schema from './schema';
export const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
export const db=drizzle(pool,{schema});
