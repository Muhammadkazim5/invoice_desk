import { config } from 'dotenv';
import { resolve } from 'path';

let loaded = false;

/**
 * Loads the repo-root .env (or .env.test when NODE_ENV=test) regardless of
 * the process cwd. All our npm scripts run with cwd set to server/ (via
 * `npm run ... -w server`), but the env files live at the repo root so
 * docker-compose, the API, and the web app can share one source of truth.
 */
export function loadEnv(): void {
  if (loaded) return;
  loaded = true;
  const file = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
  config({ path: resolve(__dirname, '../../../', file) });
}
