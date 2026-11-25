import pg from 'pg';
import { attachDatabasePool } from '@neon/functions';
import keys from '../item-keys.json' with { type: 'json' };

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);
const allowed = new Set(keys);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' };
const json = (data, status = 200) => Response.json(data, { status, headers: cors });

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== '/') return json({ error: 'Not found' }, 404);
    try {
      if (request.method === 'GET') {
        const result = await pool.query('SELECT item_key FROM gift_purchases');
        return json({ purchased: result.rows.map(row => row.item_key) });
      }
      if (request.method !== 'PUT' && request.method !== 'DELETE') return json({ error: 'Method not allowed' }, 405);
      const key = url.searchParams.get('item');
      if (!allowed.has(key)) return json({ error: 'Unknown item' }, 400);
      if (request.method === 'PUT') {
        const result = await pool.query('INSERT INTO gift_purchases (item_key) VALUES ($1) ON CONFLICT DO NOTHING RETURNING item_key', [key]);
        return result.rowCount ? json({ purchased: true }) : json({ error: 'Already purchased', purchased: true }, 409);
      }
      await pool.query('DELETE FROM gift_purchases WHERE item_key = $1', [key]);
      return json({ purchased: false });
    } catch (error) {
      console.error('Purchase state request failed', error);
      return json({ error: 'Purchase state unavailable' }, 503);
    }
  },
};
