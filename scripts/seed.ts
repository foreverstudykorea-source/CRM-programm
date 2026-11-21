/**
 * Creates demo data with a random password for every account and prints the logins once.
 *
 *   npm run seed                      # local PGlite database in ./.data/pglite
 *   DATABASE_URL=postgres://… npm run seed   # e.g. your Neon database
 *
 * It refuses to run on a database that already has users.
 */
import { createDb } from "../src/lib/db-core";
import { migrate } from "../src/lib/migrations";
import { seedDemo } from "../src/lib/seed";

async function main() {
  const db = await createDb();
  try {
    await migrate(db);
    const [{ n }] = await db.query<{ n: number }>(`select count(*)::int as n from users`);
    if (n > 0) {
      console.error(`Bazada allaqachon ${n} ta foydalanuvchi bor. Seed faqat bo'sh bazada ishlaydi.`);
      process.exitCode = 1;
      return;
    }
    const creds = await db.transaction((t) => seedDemo(t, { withAdmin: true }));
    const pad = (s: string, n: number) => s.padEnd(n);
    console.log("\nDemo hisoblar yaratildi. Parollar faqat hozir ko'rsatiladi:\n");
    console.log(pad("Rol", 10) + pad("Login", 12) + pad("Parol", 18) + "Ism");
    for (const c of creds) console.log(pad(c.role, 10) + pad(c.login, 12) + pad(c.password, 18) + c.name);
    console.log("\nHar bir foydalanuvchi birinchi kirgach o'z parolini o'zgartirishi tavsiya etiladi.");
  } finally {
    await db.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
