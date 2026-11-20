# Forever Study CRM

Forever Study akademiyasi uchun boshqaruv tizimi (CRM). Next.js 16, Tailwind CSS 4 va Postgres asosida.

## Rollar

| Rol | Login (demo) | Nimani ko'radi |
| --- | --- | --- |
| O'quvchi | `oquvchi1` … `oquvchi25` | Bugungi dars: vaqt, xona, daraja, mavzu, ustoz. Haftalik jadval, kelgusi va o'tilgan mavzular, davomat foizi, shu oygi to'lov holati |
| Ustoz | `ustoz1`, `ustoz2`, `ustoz3` | O'z guruhlari. Har dars uchun "Keldi / Kechikdi / Kelmadi" belgilash va bugungi mavzuni yozish |
| Administrator | `admin` | Kelmagan o'quvchilar ro'yxati, ota-ona telefoni, bir bosishda qo'ng'iroq / SMS / tayyor xabar matni, qo'ng'iroq holati va izoh. O'quvchi va guruh qo'shish |
| Moliya admini | `moliya` | Oylik kutilgan tushum, tushgan pul, qarzdorlar, 6 oylik grafik, to'lov usullari, to'lov qabul qilish |

Barcha demo hisoblarning paroli: **`demo123`**.

Har bir rol faqat o'z sahifalarini ochadi. Boshqa rol sahifasiga kirishga urinsa, o'z bosh sahifasiga qaytariladi (server tomonida tekshiriladi).

## Kompyuterda ishga tushirish

```bash
npm install
npm run dev
```

So'ng http://localhost:3000 ni oching. Ma'lumotlar bazasi sozlash shart emas: `DATABASE_URL` bo'lmasa, ilova o'rnatilgan PGlite (WASM'dagi Postgres) dan foydalanadi va ma'lumotlarni `./.data/pglite` papkasiga saqlaydi. Birinchi ishga tushishda demo ma'lumotlar avtomatik yaratiladi.

Demo ma'lumotlarni qaytadan yaratish uchun serverni to'xtatib, `.data` papkasini o'chiring.

## Vercel'ga joylash (deploy)

1. **GitHub'ga yuklang.** GitHub'da yangi bo'sh repo oching (masalan `forever-study-crm`), keyin:
   ```bash
   git remote add origin https://github.com/<USERNAME>/forever-study-crm.git
   git push -u origin main
   ```
2. **Vercel'da loyiha yarating.** [vercel.com/new](https://vercel.com/new) → repo'ni tanlang → Framework: Next.js (avtomatik) → **Root Directory: `./`** (o'zgartirmang, `package.json` repo ildizida) → **Deploy**.
3. **Ma'lumotlar bazasini ulang (muhim).** Vercel loyihasida **Storage → Create Database → Neon (Postgres)** ni tanlang va loyihaga ulang. Vercel `DATABASE_URL` o'zgaruvchisini o'zi qo'shadi. Jadvallar va demo ma'lumotlar birinchi so'rovda avtomatik yaratiladi.
   > Bazasiz ham ishlaydi, lekin u holda ma'lumotlar xotirada turadi va server qayta ishga tushganda yo'qoladi. Bu faqat ko'rish uchun.
4. **Environment Variables** (Settings → Environment Variables):
   | Nomi | Qiymati |
   | --- | --- |
   | `SESSION_SECRET` | Uzun tasodifiy matn. Yaratish: `openssl rand -base64 32` |
   | `SHOW_DEMO_ACCOUNTS` | Haqiqiy foydalanishda `false` (kirish sahifasidagi demo tugmalarni yashiradi) |
   | `APP_TIMEZONE` | Ixtiyoriy, standart `Asia/Tashkent` |
5. O'zgaruvchilarni qo'shgandan so'ng **Deployments → Redeploy** bosing.

### Haqiqiy ishga tushirishdan oldin

- `SESSION_SECRET` ni albatta o'rnating.
- Demo hisoblar (`admin`, `moliya`, `ustoz1`…) paroli `demo123`. Haqiqiy ma'lumot kiritishdan oldin bazani tozalab, o'z xodimlaringizni qo'shing yoki parollarni almashtiring (`src/lib/seed.ts`).

## Tuzilishi

```
src/
  app/
    login/            Kirish sahifasi
    student/          O'quvchi: bugun, jadval
    teacher/          Ustoz: guruhlar, davomat
    admin/            Admin: qo'ng'iroqlar, o'quvchilar, guruhlar
    finance/          Moliya: umumiy ko'rinish, to'lovlar
    actions.ts        Barcha server actions (har biri rolni tekshiradi)
  lib/
    db.ts             Baza adapteri: Postgres (DATABASE_URL) yoki PGlite
    schema.ts         Jadvallar (SQL)
    seed.ts           Demo ma'lumotlar
    data.ts           Barcha so'rovlar
    auth.ts           Sessiya (imzolangan cookie) va rollar
```

Baza qatlami almashtiriladigan: hamma so'rovlar oddiy SQL va `db.ts` dagi kichik `Db` interfeysi orqali o'tadi. Boshqa bazaga o'tish uchun faqat shu faylni o'zgartirish kifoya.
