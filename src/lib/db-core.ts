// Database adapter shared by the app, the seed script and the tests.
// No "server-only" import here so that scripts and tests can use it.

export type Db = {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
  exec(text: string): Promise<void>;
  transaction<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};

type Runner = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unsafe(text: string, params?: any[]): Promise<any>;
};

async function createPostgres(url: string): Promise<Db> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, {
    max: 5,
    idle_timeout: 20,
    prepare: false,
    // Neon and most hosted Postgres require TLS; postgres.js reads sslmode from the URL.
    onnotice: () => {},
  });

  const wrap = (runner: Runner, inTx: boolean): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      const rows = await runner.unsafe(text, params);
      return rows as T[];
    },
    async exec(text: string) {
      await runner.unsafe(text);
    },
    async transaction<T>(fn: (db: Db) => Promise<T>) {
      if (inTx) return fn(wrap(runner, true));
      return sql.begin(async (t) => fn(wrap(t as unknown as Runner, true))) as Promise<T>;
    },
    async close() {
      if (!inTx) await sql.end({ timeout: 5 });
    },
  });
  return wrap(sql as unknown as Runner, false);
}

async function createPglite(dir: string | undefined): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (dir) {
    const fs = await import("node:fs");
    fs.mkdirSync(dir, { recursive: true });
  }
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;

  type Q = { query: typeof pg.query; exec: typeof pg.exec };
  const wrap = (runner: Q, inTx: boolean): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      const res = await runner.query<T>(text, params);
      return res.rows;
    },
    async exec(text: string) {
      await runner.exec(text);
    },
    async transaction<T>(fn: (db: Db) => Promise<T>) {
      if (inTx) return fn(wrap(runner, true));
      return pg.transaction(async (t) => fn(wrap(t as unknown as Q, true)));
    },
    async close() {
      if (!inTx) await pg.close();
    },
  });
  return wrap(pg, false);
}

export type DbOptions = { url?: string; pgliteDir?: string | null };

export async function createDb(opts: DbOptions = {}): Promise<Db> {
  const url = opts.url ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) return createPostgres(url);

  if (process.env.VERCEL || (process.env.NODE_ENV === "production" && !process.env.ALLOW_PGLITE)) {
    throw new Error(
      "DATABASE_URL is not set. Connect a Postgres database (Vercel → Storage → Neon) before running in production.",
    );
  }
  const dir = opts.pgliteDir === null ? undefined : (opts.pgliteDir ?? process.env.PGLITE_DIR ?? "./.data/pglite");
  return createPglite(dir);
}
