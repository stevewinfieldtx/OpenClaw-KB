import { Pool } from 'pg';
import pgvector from 'pgvector/pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    pool.on('connect', async (client) => {
      await pgvector.registerType(client);
    });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getPool();
  const result = await p.query(text, params);
  return result.rows as T[];
}

export async function close(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
