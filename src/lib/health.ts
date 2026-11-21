import "server-only";
import { getDb } from "./db";

export type ConfigProblem = { code: "database_url" | "session_secret" | "database_connect"; detail?: string };

let logged = false;

/**
 * Checks the settings the app cannot run without. Only variable names are reported,
 * never their values. The exact cause is written to the server log (Vercel → Logs).
 */
export async function configProblems(): Promise<ConfigProblem[]> {
  const problems: ConfigProblem[] = [];
  const prod = process.env.NODE_ENV === "production";
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);

  if (!hasDbUrl && (process.env.VERCEL || (prod && !process.env.ALLOW_PGLITE))) problems.push({ code: "database_url" });
  const secret = process.env.SESSION_SECRET ?? "";
  if (prod && secret.length < 32) problems.push({ code: "session_secret", detail: secret ? "too_short" : "missing" });

  if (!problems.some((p) => p.code === "database_url")) {
    try {
      await getDb();
    } catch (err) {
      const e = err as { message?: string; code?: string };
      problems.push({ code: "database_connect", detail: e.code ?? "" });
      console.error("[config] Database connection or migration failed:", e.code ?? "", e.message ?? err);
    }
  }

  if (problems.length && !logged) {
    logged = true;
    for (const p of problems) {
      if (p.code === "database_url") console.error("[config] DATABASE_URL is not set. Vercel → Storage → connect a Neon database, then redeploy.");
      if (p.code === "session_secret")
        console.error(`[config] SESSION_SECRET is ${p.detail === "missing" ? "not set" : "shorter than 32 characters"}. Generate one with: openssl rand -base64 32`);
    }
  }
  if (!problems.length) logged = false;
  return problems;
}
