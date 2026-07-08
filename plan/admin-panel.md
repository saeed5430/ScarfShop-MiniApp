# Admin Panel — Standalone React Router v7 App

## 1. Overview

پنل ادمین به صورت یک پروژه جداگانه با React Router v7 ساخته می‌شود.
از قالب `lukexlau/react-router-v7-better-auth` استفاده می‌شود (بدون تغییر ساختار پوشه‌ها).
اتصال به D1 دیتابیس مشترک با پروژه اصلی.

### مسیر پروژه
```
D:\Codes\MiniApp\ScarfMiniApp-admin\
```

## 2. Tech Stack

| فناوری | نسخه | کاربرد |
|--------|------|--------|
| React Router v7 | latest | فریمورک SSR + routing |
| Better Auth | latest | احراز هویت (email/password) |
| Drizzle ORM | latest | ORM برای D1 |
| Cloudflare D1 | — | دیتابیس مشترک |
| TailwindCSS | latest | استایل‌دهی |
| Shadcn/UI | latest | کامپوننت‌های UI |

## 3. اتصال به D1 مشترک

### دیتابیس مشترک
- **D1 Name**: `scarf-mini-app-db`
- **D1 ID**: `d6b5b835-02ae-4b67-a507-5eae84aae0c3`
- ادمین به همان D1 وصل می‌شود

### جداول Better Auth (جدید - خودکار توسط Better Auth ایجاد می‌شود)
- `user` — کاربران احراز هویت شده
- `session` — نشست‌ها
- `account` — اکانت‌های متصل
- `verification` — توکن‌های تایید

### جدول `admins` (اصلاح شده از طریق Drizzle Migration)
ستون‌های جدید از طریق Drizzle migration اضافه می‌شوند:
- `auth_user_id` — اتصال به Better Auth user.id
- `email` — ایمیل Better Auth

**نکته**: هیچ ALTER TABLE خامی نوشته نمی‌شود. تمام تغییرات دیتابیس از طریق Drizzle migration انجام می‌شود.

### مکانیزم اتصال Better Auth ↔ admins

```
Better Auth user.id  →  admins.auth_user_id
```

**روش کار:**
1. کاربر با email/password در Better Auth لاگین می‌کند
2. Better Auth یک `user` و `session` ایجاد می‌کند
3. در loader صفحه، بررسی می‌شود:
   ```typescript
   const admin = await db.query.admins.findFirst({
     where: eq(admins.authUserId, session.user.id),
   });
   ```
4. اگر پیدا شد → کاربر ادمین است
5. اگر نه → redirect به صفحه "دسترسی غیرمجاز"

## 4. احراز هویت

### Better Auth Configuration
```typescript
// app/services/auth/auth.server.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

### ایجاد اولین ادمین

**روش: Seed اولیه**

اولین ادمین از طریق seed script ایجاد می‌شود:
```typescript
// drizzle/seed/seed.ts
import { db } from "../app/services/db";
import { auth } from "../app/services/auth/auth.server";

async function seed() {
  // 1. ایجاد کاربر Better Auth
  const user = await auth.api.signUpEmail({
    body: {
      email: "admin@aramana.ir",
      password: "admin@8899",
      name: "Saeed Admin",
    },
  });

  // 2. اضافه کردن به جدول admins
  await db.insert(admins).values({
    id: "telegram_user_id_of_saeed54300",
    username: "saeed54300",
    firstName: "Saeed",
    authUserId: user.id,
    email: "admin@aramana.ir",
  });
}

seed();
```

**دستور اجرا:**
```bash
pnpm db:seed:local
```

**نکته امنیتی**: در محیط production، رمز عبور seed باید از environment variable خوانده شود.

### middleware بررسی ادمین
```typescript
// app/middleware/auth.server.ts
import { redirect } from "react-router";
import { auth } from "~/services/auth/auth.server";
import { db } from "~/services/db";
import { admins } from "~/services/db/schema";
import { eq } from "drizzle-orm";

export async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const admin = await db.query.admins.findFirst({
    where: eq(admins.authUserId, session.user.id),
  });

  if (!admin) {
    throw redirect("/unauthorized");
  }

  return { session, admin };
}
```

## 5. صفحات پنل ادمین (با Loader و Action)

### 5.1 صفحه ورود (`/login`)
- فرم email + password
- **Action**: `auth.api.signInEmail()`
- هدایت به `/admin` پس از موفقیت

### 5.2 داشبورد (`/admin`)
- **Loader**: آمار کلی (تعداد کاربران، محصولات، دسته‌بندی‌ها)
- نمایش لینک‌های سریع به بخش‌ها

### 5.3 مدیریت دسته‌بندی‌ها (`/admin/categories`)
- **Loader**: لیست دسته‌بندی‌ها
- **Action**: ایجاد/ویرایش/حذف

### 5.4 مدیریت محصولات (`/admin/products`)
- **Loader**: لیست محصولات با فیلتر دسته‌بندی + جستجو
- **Action**: ایجاد/ویرایش/حذف

### 5.5 مدیریت طرح‌ها (`/admin/designs`)
- **Loader**: لیست طرح‌ها
- **Action**: ایجاد/ویرایش/حذف

### 5.6 مدیریت رنگ‌ها (`/admin/colors`)
- **Loader**: لیست رنگ‌ها با پیش‌نمایش HEX
- **Action**: ایجاد/ویرایش/حذف

### 5.7 مدیریت سایزها (`/admin/sizes`)
- **Loader**: لیست سایزها
- **Action**: ایجاد/ویرایش/حذف

### 5.8 مدیریت متغیرها (`/admin/variants`)
- **Loader**: لیست متغیرها با فیلتر محصول
- **Action**: ایجاد/ویرایش/حذف

### 5.9 مدیریت کاربران (`/admin/users`)
- **Loader**: لیست کاربران تلگرام + جستجو

### 5.10 مدیریت ادمین‌ها (`/admin/admins`)
- **Loader**: لیست ادمین‌ها
- **Action**: اضافه کردن ادمین جدید (بر اساس email Better Auth)
- **Action**: حذف ادمین

## 6. ساختار پروژه (مطابق Template)

```
ScarfMiniApp-admin/
├── app/
│   ├── routes/
│   │   ├── _layout.tsx              # Layout اصلی
│   │   ├── login.tsx                # صفحه ورود
│   │   ├── unauthorized.tsx         # صفحه دسترسی غیرمجاز
│   │   ├── admin.tsx                # Layout پنل ادمین (Sidebar + Auth check)
│   │   ├── admin._index.tsx         # داشبورد
│   │   ├── admin.categories.tsx     # مدیریت دسته‌بندی‌ها
│   │   ├── admin.products.tsx       # مدیریت محصولات
│   │   ├── admin.designs.tsx        # مدیریت طرح‌ها
│   │   ├── admin.colors.tsx         # مدیریت رنگ‌ها
│   │   ├── admin.sizes.tsx          # مدیریت سایزها
│   │   ├── admin.variants.tsx       # مدیریت متغیرها
│   │   ├── admin.users.tsx          # مدیریت کاربران
│   │   └── admin.admins.tsx         # مدیریت ادمین‌ها
│   ├── services/
│   │   ├── auth/
│   │   │   └── auth.server.ts       # Better Auth config
│   │   └── db/
│   │       ├── index.ts             # Database connection
│   │       ├── schema.ts            # Drizzle schema
│   │       ├── migrations/          # Drizzle migrations
│   │       └── queries.ts           # Database queries
│   ├── middleware/
│   │   └── auth.server.ts           # Middleware بررسی ادمین
│   ├── components/
│   │   ├── ui/                      # Shadcn components
│   │   ├── Sidebar.tsx              # سایدبار (دسکتاپ)
│   │   ├── MobileNav.tsx            # ناوبار موبایل
│   │   └── AdminLayout.tsx          # Layout پنل ادمین
│   └── lib/
│       └── utils.ts                 # Utility functions
├── drizzle/
│   ├── config.ts
│   ├── migrations/
│   └── seed/
│       └── seed.ts                  # Seed اولین ادمین
├── workers/
│   └── index.ts                     # Worker entry
├── public/
├── wrangler.jsonc
├── package.json
└── tsconfig.json
```

## 7. Loader و Action (React Router v7)

### نمونه: دسته‌بندی‌ها
```typescript
// app/routes/admin.categories.tsx

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAdmin(request);
  const categories = await db.query.categories.findMany();
  return { categories };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireAdmin(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "create") {
    await db.insert(categories).values({ name: form.get("name") as string });
  } else if (intent === "update") {
    await db.update(categories)
      .set({ name: form.get("name") as string })
      .where(eq(categories.id, Number(form.get("id"))));
  } else if (intent === "delete") {
    await db.delete(categories)
      .where(eq(categories.id, Number(form.get("id"))));
  }

  return redirect("/admin/categories");
}
```

## 8. Responsive Design

### دسکتاپ (≥768px)
- Sidebar ثابت در سمت راست (RTL)
- محتوای اصلی در مرکز

### موبایل (<768px)
- ناوبار پایین با آیکون‌ها
- جداول به صورت کارت نمایش داده می‌شوند

## 9. اتصال از اپ اصلی

### Environment Variable
```env
# فایل .env در پروژه اصلی
VITE_ADMIN_URL=https://scarf-admin.abdollahi003.workers.dev
```

### استفاده در کد
```typescript
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL;
```

### API جدید در پروژه اصلی
```
GET /api/auth/is-admin → { is_admin: boolean }
```

### Loader در IndexPage
```typescript
// src/pages/IndexPage/IndexPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const IndexPage: FC = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetch('/api/auth/is-admin')
        .then(res => res.json())
        .then(data => setIsAdmin(data.is_admin));
    }
  }, [user]);

  return (
    <Page back={false}>
      {/* ... */}
      <div className="home-actions">
        {/* Action Card: Chat */}
        {/* Action Card: Quick Buy */}

        {/* Action Card: Admin - فقط برای ادمین‌ها */}
        {isAdmin && (
          <div
            className="action-card"
            onClick={() => window.open(ADMIN_URL, '_blank')}
          >
            <div className="action-icon action-icon-admin">
              <svg>/* Shield/Lock icon */</svg>
            </div>
            <div className="action-content">
              <h3 className="action-title">پنل ادمین</h3>
              <p className="action-desc">مدیریت فروشگاه</p>
            </div>
            <svg className="action-arrow">/* Chevron */</svg>
          </div>
        )}
      </div>
    </Page>
  );
};
```

### API در Worker
```typescript
// worker/src/routes/api.ts
apiRoutes.get('/auth/is-admin', async (c) => {
  const db = c.env.DB;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ is_admin: false });

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ is_admin: false });

  const database = new Database(db);
  const isAdmin = await database.admins.isAdmin(result.user_id!);

  return c.json({ is_admin: isAdmin });
});
```

## 10. محیط توسعه

### فایل `.env` (پروژه ادمین)
```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:5174
DATABASE_URL=scarf-mini-app-db
ADMIN_EMAIL=admin@aramana.ir
ADMIN_PASSWORD=admin@8899
```

### فایل `.env` (پروژه اصلی)
```env
VITE_ADMIN_URL=http://localhost:5174
VITE_ADMIN_URL_PROD=https://scarf-admin.abdollahi003.workers.dev
```

### دستورات
```bash
# نصب وابستگی‌ها
pnpm install

# مایگریشن دیتابیس
pnpm db:migrate:local

# seed اولین ادمین
pnpm db:seed:local

# اجرا
pnpm dev    # port 5174
```

## 11. Deployment

### D1 مشترک
- از همان D1 دیتابیس پروژه اصلی استفاده می‌شود
- Better Auth جداول خودش را به D1 اضافه می‌کند

### Deploy
```bash
pnpm db:migrate:remote
pnpm deploy
```

### URL نهایی
```
https://scarf-admin.abdollahi003.workers.dev
```

## 12. قدم‌های اجرا

1. **Clone قالب** — `git clone https://github.com/lukexlau/react-router-v7-better-auth.git ScarfMiniApp-admin`
2. **نصب وابستگی‌ها** — `pnpm install`
3. **تنظیم D1** — اتصال به D1 مشترک در wrangler.jsonc
4. **ایجاد Drizzle migration** — اضافه کردن `auth_user_id` و `email` به جدول `admins`
5. **پیکربندی Better Auth** — تنظیم احراز هویت
6. **ایجاد جداول Better Auth** — مایگریشن
7. **ساخت schema Drizzle** — تعریف جداول مشترک
8. **ساخت middleware** — بررسی ادمین
9. **ساخت seed** — ایجاد اولین ادمین
10. **ساخت صفحه Login** — فرم ورود
11. **ساخت Layout ادمین** — سایدبار + محتوا + Responsive
12. **ساخت صفحه داشبورد** — آمار و لینک‌ها
13. **ساخت CRUD دسته‌بندی‌ها** — loader + action
14. **ساخت CRUD محصولات** — loader + action
15. **ساخت CRUD طرح‌ها** — loader + action
16. **ساخت CRUD رنگ‌ها** — loader + action
17. **ساخت CRUD سایزها** — loader + action
18. **ساخت CRUD متغیرها** — loader + action
19. **ساخت صفحه مدیریت کاربران** — loader
20. **ساخت صفحه مدیریت ادمین‌ها** — loader + action
21. **اضافه کردن API is-admin** — در پروژه اصلی
22. **اضافه کردن VITE_ADMIN_URL** — در .env پروژه اصلی
23. **اضافه کردن کارت ادمین** — در IndexPage پروژه اصلی
24. **تست و deploy** — تست محلی و استقرار
