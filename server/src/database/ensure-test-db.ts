import { Client } from 'pg';
import { loadEnv } from '../config/load-env';

loadEnv();

/**
 * docker-compose only provisions the dev database (via POSTGRES_DB). The
 * e2e test database lives in the same Postgres instance but needs to be
 * created on demand since there is no init script for it.
 */
async function ensureTestDatabase(): Promise<void> {
  const database = process.env.DB_NAME ?? 'invoice_desk_test';
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  });
  await client.connect();
  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      // eslint-disable-next-line no-console
      console.log(`Created test database "${database}"`);
    }
  } finally {
    await client.end();
  }
}

ensureTestDatabase().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
