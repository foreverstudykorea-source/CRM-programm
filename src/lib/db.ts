import "server-only";
import { createDb, type Db } from "./db-core";
import { migrate } from "./migrations";

export type { Db } from "./db-core";

/**
 * One database connection per server instance.
 *
 * - DATABASE_URL (Neon on Vercel, or any Postgres) is required in production.
 * - Without it, local development uses PGlite (Postgres compiled to WASM) in ./.data/pglite.
 *
 * Every query goes through `q(text, params)` with $1, $2 … placeholders. Values are
 * always sent as bound parameters, never concatenated into SQL text.
 */
async function init(): Promise<Db> {
  const db = await createDb();
  await migrate(db);
  return db;
}

const g = globalThis as unknown as { __fsDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__fsDb) {
    g.__fsDb = init().catch((err) => {
      g.__fsDb = undefined;
      throw err;
    });
  }
  return g.__fsDb;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(text, params);
}

/** Run several statements atomically. */
export async function tx<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(fn);
}
