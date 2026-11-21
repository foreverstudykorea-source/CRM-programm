# Forever Study CRM

Forever Study akademiyasi uchun boshqaruv tizimi. Next.js 16, Tailwind CSS 4, Postgres (Neon).

## Rollar

| Rol | Nimani ko'radi va qiladi |
| --- | --- |
| **O'quvchi** | Bugungi dars: vaqt, xona, daraja, mavzu, ustoz va "dars qachon boshlanadi" taymeri. Haftalik jadval, kelgusi va o'tilgan mavzular, o'z davomati, shu oygi to'lov holati |
| **Ustoz** | Bugungi darslari. Bir bosishda davomat: hamma "Keldi" turadi, faqat kelmaganlarni bosadi. Mavzuni yozadi, keyingi dars mavzusini oldindan kiritadi |
| **Administrator** | Qo'ng'iroqlar markazi: kelmaganlar, ota-ona telefoni, bir bosishda qo'ng'iroq / SMS / tayyor matn, natijani bir bosishda yozish ("Gaplashildi", "Javob bermadi", "Xabar yuborildi") va urinishlar tarixi. Ko'p qoldiruvchilar ro'yxati. O'quvchi, guruh va xodim qo'shish, parol tiklash, bloklash. Harakatlar jurnali |
| **Moliya admini** | Kutilgan tushum, tushgan pul, qarzdorlar, yig'ilish foizi, 6 oylik grafik, to'lov usullari. To'lov qabul qilish va sababi bilan bekor qilish |

## Xavfsizlik

- **Parollar** Argon2id bilan xeshlanadi (OWASP tavsiyasi). Ochiq parol hech qayerda saqlanmaydi. Kamida 10 belgi, harf va raqam, keng tarqalgan parollar rad etiladi.
- **Umumiy demo parol yo'q.** Har bir hisobga tasodifiy parol beriladi va faqat bir marta ko'rsatiladi. Yangi xodim birinchi kirishda o'z parolini o'rnatadi. Eski versiyadagi `demo123` parolli hisoblar yangilanishda avtomatik o'chiriladi.
- **Sessiyalar serverda** (Postgres) saqlanadi. Cookie: `__Host-` prefiksli, `HttpOnly`, `Secure`, `SameSite=Lax`, ichida faqat tasodifiy token; bazada uning HMAC xeshi turadi. 12 soat harakatsizlikdan yoki 7 kundan so'ng tugaydi. Parol almashtirilsa yoki hisob bloklansa, barcha qurilmalardan darhol chiqariladi.
- **Brute-force himoyasi:** bitta loginga 15 daqiqada 5 ta, bitta IP'dan 20 ta noto'g'ri urinishdan so'ng kirish vaqtincha yopiladi. Noma'lum login va noto'g'ri parol bir xil javob va bir xil vaqt oladi.
- **Rol tekshiruvi serverda:** har bir sahifa va har bir server action rolni qayta tekshiradi. Ustoz faqat o'z guruhini va faqat oxirgi 3 kunni belgilaydi. Boshqa guruhga urinish jurnalga yoziladi.
- **Kiritilgan ma'lumotlar** `zod` bilan tekshiriladi (format, uzunlik, ruxsat etilgan qiymatlar). Barcha SQL so'rovlar parametrli, matn so'rovga hech qachon qo'shilmaydi.
- **CSRF:** boshqa saytdan kelgan POST so'rovlar `proxy.ts` da rad etiladi (Origin va Sec-Fetch-Site tekshiruvi), Next.js'ning o'z tekshiruviga qo'shimcha.
- **Sarlavhalar:** har so'rovda yangi nonce bilan qat'iy Content-Security-Policy, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer va Permissions Policy.
- **Harakatlar jurnali:** kirish, davomat, qo'ng'iroq, to'lov, hisob o'zgarishlari. Jadvalni bazaning o'zi ham o'zgartirish va o'chirishdan himoya qiladi. To'lovlar o'chirilmaydi, sababi bilan bekor qilinadi.
- **Maxfiy kalitlar kodda yo'q.** `SESSION_SECRET` o'rnatilmasa, production'da tizim ishlamaydi (xavfsiz tomonga yopiladi).

## Vercel'ga joylash

1. Vercel loyihasida **Root Directory: `./`** (o'zgartirmang).
2. **Storage → Create Database → Neon** ni ulang. `DATABASE_URL` avtomatik qo'shiladi.
3. **Settings → Environment Variables:**

   | Nomi | Qiymati |
   | --- | --- |
   | `SESSION_SECRET` | Kamida 32 belgili tasodifiy matn: `openssl rand -base64 32` |
   | `SETUP_TOKEN` | Kamida 16 belgili maxfiy kalit (faqat birinchi sozlash uchun) |
   | `APP_TIMEZONE` | Ixtiyoriy, standart `Asia/Tashkent` |

4. **Deployments → Redeploy.**
5. Saytni oching. Kirish sahifasida "Birinchi administratorni yarating" havolasi chiqadi (`/setup`). `SETUP_TOKEN`, o'z ismingiz, login va parolingizni kiriting. Xohlasangiz "Demo ma'lumotlar" belgisini qo'ying: barcha demo hisoblar va ularning parollari bir marta ko'rsatiladi, ularni saqlab oling.
6. Administrator yaratilgach `/setup` sahifasi yopiladi. Xodimlarni **Xodimlar** bo'limidan qo'shing.

> Eski versiya allaqachon Neon'da ishlagan bo'lsa: yangilanishda `demo123` parolli hisoblar o'chadi va `/setup` yana ochiladi. U yerda administrator yarating, so'ng **Xodimlar** va **O'quvchilar** bo'limida kerakli hisoblarga yangi parol bering. Toza boshlash uchun Neon bazasini tozalab qo'yish ham mumkin.

## Kompyuterda ishga tushirish

```bash
npm install
npm run seed      # demo ma'lumotlar va har bir hisob uchun tasodifiy parol (terminalda bir marta chiqadi)
npm run dev       # http://localhost:3000
```

`DATABASE_URL` bo'lmasa, o'rnatilgan PGlite (WASM'dagi Postgres) ishlatiladi va ma'lumotlar `./.data/pglite` da saqlanadi. Qaytadan boshlash uchun `.data` papkasini o'chiring. Neon bazasiga seed qilish: `DATABASE_URL=postgres://… npm run seed` (faqat bo'sh bazada ishlaydi).

## Tekshiruvlar

```bash
npm run typecheck
npm run lint
npm test          # validatsiya, parollar, sessiyalar, rate limit, rollar, CSRF, audit
npm run build
```

## Tuzilishi

```
src/
  proxy.ts               CSRF tekshiruvi va CSP nonce
  app/
    actions/auth.ts      Kirish, chiqish, parol, birinchi sozlash
    actions/staff.ts     Ustoz, admin va moliya amallari (har biri rolni tekshiradi)
    login/ setup/ hisob/ Kirish, birinchi sozlash, hisob va xavfsizlik
    student/ teacher/ admin/ finance/   Rollar bo'yicha sahifalar
  components/            Dizayn tizimi: kartalar, statistikalar, modal, toast, navigatsiya
  lib/
    auth.ts              Cookie va requireRole
    security.ts          Sessiyalar, rate limit, audit (Next.js'siz, testlanadi)
    password.ts          Argon2id, parol siyosati, parol generatori
    validation.ts        zod sxemalari
    migrations.ts        Versiyalangan baza sxemasi
    data.ts              Barcha so'rovlar (parametrli SQL)
    seed.ts              Demo ma'lumotlar
scripts/seed.ts          npm run seed
tests/                   Vitest testlari
```
