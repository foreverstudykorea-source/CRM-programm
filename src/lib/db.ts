import "server-only";
import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";

/**
 * Minimal database adapter.
 *
 * - If DATABASE_URL is set (Neon / Vercel Postgres / Supabase / any Postgres),
 *   the app talks to that server via the `postgres` driver.
 * - Otherwise it uses PGlite: a real Postgres compiled to WASM that runs inside
 *   the Node process. Locally it persists to ./.data/pglite; on Vercel without
 *   DATABASE_URL it runs in memory (demo mode, resets on cold start).
 *
 * All queries are plain SQL with $1, $2 … parameters, so both adapters share
 * one code path. To move to another database, implement `Db` again.
 */
export type Db = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
};

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false });
  return {
    async query<T>(text: string, params: unknown[] = []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await sql.unsafe(text, params as any[]);
      return rows as unknown as T[];
    },
    async exec(text: string) {
      await sql.unsafe(text);
    },
  };
}

async function createPglite(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const onVercel = !!process.env.VERCEL;
  const dir = onVercel ? undefined : process.env.PGLITE_DIR || "./.data/pglite";
  if (dir) {
    const fs = await import("node:fs");
    fs.mkdirSync(dir, { recursive: true });
  }
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;
  return {
    async query<T>(text: string, params: unknown[] = []) {
      const res = await pg.query<T>(text, params);
      return res.rows;
    },
    async exec(text: string) {
      await pg.exec(text);
    },
  };
}

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const db = url ? await createPostgres(url) : await createPglite();
  await db.exec(SCHEMA_SQL);
  const [{ n }] = await db.query<{ n: number }>("select count(*)::int as n from users");
  if (n === 0) await seed(db);
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

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const db = await getDb();
  return db.query<T>(text, params);
}
