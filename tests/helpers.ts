import { createDb, type Db } from "@/lib/db-core";
import { migrate } from "@/lib/migrations";

/** A fresh in-memory Postgres (PGlite) with the full schema. */
export async function testDb(): Promise<Db> {
  const db = await createDb({ url: "", pgliteDir: null });
  await migrate(db);
  return db;
}
