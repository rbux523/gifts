import { readFile } from 'node:fs/promises';
import pg from 'pg';
if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED is required');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
try {
  await client.connect();
  await client.query(await readFile(new URL('./migrations/001-purchases.sql', import.meta.url), 'utf8'));
  console.log('Purchase state migration complete');
} finally { await client.end(); }
