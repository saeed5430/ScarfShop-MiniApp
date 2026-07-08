# AGENTS.md — Scarf Mini App (Telegram Mini App)

## Project Overview
یک پروژه React + TypeScript برای Telegram Mini App با قابلیت اتصال به کیف پول TON.

## Tech Stack
- React 18 + TypeScript
- Vite (SWC)
- React Router DOM v6 (HashRouter)
- @telegram-apps/telegram-ui (UI Kit رسمی تلگرام)
- @tma.js/sdk-react (SDK رسمی Telegram Mini Apps)
- @tonconnect/ui-react (اتصال به کیف پول TON)
- ESLint (strict mode, zero warnings)

## Conventions
- مسیرها با `@/` alias (مثلاً `@/components/Root.tsx`)
- استایل‌ها: CSS (فایل‌های جدا) + Telegram UI
- مسیریابی: HashRouter در `App.tsx`، مسیرها در `routes.tsx`
- کامپوننت‌ها: each page in its own folder if it has sub-components (e.g., `IndexPage/`), else a flat `.tsx` file (e.g., `InitDataPage.tsx`)
- ESLint: `--max-warnings 0` — هیچ warningای پذیرفته نیست

## Page Structure (current)
| Path | Component | Title |
|------|-----------|-------|
| `/` | IndexPage | — |
| `/chat` | ChatPage | چت با ما |
| `/init-data` | InitDataPage | Init Data |
| `/theme-params` | ThemeParamsPage | Theme Params |
| `/launch-params` | LaunchParamsPage | Launch Params |
| `/ton-connect` | TONConnectPage | TON Connect |

## Database Schema (D1)
### Tables
- `users` — کاربران تلگرام
- `admins` — ادمین‌ها
- `sessions` — نشست‌های کاربران
- `chats` — پیام‌های چت
- `categories` — دسته‌بندی محصولات (شال/روسری/مقنعه)
- `products` — محصولات مادر
- `designs` — طرح‌های محصول (مستقل)
- `colors` — رنگ‌ها (مستقل)
- `sizes` — سایزها (مستقل)
- `variants` — متغیرهای محصول
- `variant_colors` — رابطه چند-به-چند متغیر-رنگ
- `variant_sizes` — رابطه چند-به-چند متغیر-سایز

### Product Schema
```
categories → products
                ↓
             designs (مستقل)
                ↓
             variants → variant_colors → colors
             variants → variant_sizes  → sizes
```

## Project Plan Location
طرح کلی پروژه، توضیحات UI، و مستندات featureها در `plan/` ذخیره می‌شوند.
قبل از هر تغییر بزرگ، فایل‌های داخل `plan/` را بررسی کن.

## Commands
- `npm run dev` — start dev server
- `npm run build` — typecheck + build
- `npm run lint` — ESLint (zero warnings)
- `npm run lint:fix` — auto-fix lint issues
- `npm run dev:https` — dev server with HTTPS

## Development Roadmap (ترتیب اجرا)

این رودمپ کمترین دوباره‌کاری را دارد، APIها را بین Mini App و Admin مشترک نگه می‌دارد و نگهداری پروژه را در آینده بسیار ساده‌تر می‌کند.

### Phase 1 — Database Schema & Migrations
- [x] طراحی کامل Schema دیتابیس D1
- [x] ساخت تمام Migrationها (users, admins, sessions, chats, categories, products, designs, colors, sizes, variants, variant_colors, variant_sizes)
- [x] Seed data برای تست

### Phase 2 — Authentication
- [x] ورود از طریق Telegram Init Data (HMAC-SHA256 verification)
- [x] Session management (ایجاد، اعتبارسنجی، extend، expire)
- [x] Middleware احراز هویت در API routes
- [ ] تست پایداری Session (ورود مجدد، انقضا، refresh)

### Phase 3 — Feature اول: محصولات (Database → API → Frontend → Test)
- [x] Database: CRUD categories, products, designs, colors, sizes, variants
- [x] Database: variant_colors, variant_sizes (Many-to-Many)
- [x] API: تمام endpointهای CRUD + search + filter
- [x] Frontend: صفحه QuickBuyPage با فیلتر، جستجو، انتخاب رنگ/سایز/تعداد
- [ ] تست کامل عملیات خرید سریع

### Phase 4 — Feature دوم: چت هوش مصنوعی (Database → API → Frontend → Test)
- [x] Database: جدول chats + ChatsDB class
- [x] API: endpoint دریافت پیام‌های چت
- [ ] اتصال به API هوش مصنوعی (مثلاً OpenAI / Claude)
- [ ] ذخیره پیام‌ها در DB (user + assistant)
- [ ] Frontend: ChatPage با اتصال واقعی به بک‌اند
- [ ] تست مکالمه

### Phase 5 — ریسپانسیو بودن
- [ ] بررسی Mini App روی اندازه‌های مختلف موبایل
- [ ] بهینه‌سازی لایوت برای صفحه‌های کوچک و بزرگ
- [ ] تست روی iOS و Android (تلگرام)

### Phase 6 — پنل ادمین
- [ ] ساخت پروژه با Refine + Ant Design
- [ ] اتصال به APIهای موجود (مشترک با Mini App)
- [ ] مدیریت محصولات (CRUD)
- [ ] مدیریت کاربران
- [ ] مدیریت دسته‌بندی‌ها، رنگ‌ها، سایزها
- [ ] داشبورد آماری

### Phase 7 — تست نهایی و انتشار
- [ ] تست یکپارچگی Mini App + Admin + API
- [ ] بهینه‌سازی عملکرد (bundle size, caching)
- [ ] انتشار Worker روی Cloudflare
- [ ] تنظیم دامنه و SSL
- [ ] تست نهایی در محیط production

## Rules for AI
1. همیشه قبل از شروع کد زنی این فایل و فایل‌های داخل `plan/` را بخوان.
2. از path alias `@/` استفاده کن.
3. ESLint رو بدون warning نگه دار (`max-warnings 0`).
4. استایل‌ها را در فایل‌های CSS جداگانه بنویس، مگر اینکه Telegram UI استایل inline لازم داشته باشد.
5. کامپوننت‌های صفحه اگر زیرکامپوننت دارند، داخل پوشه مجزا قرار بده.
6.路由 جدید را در `routes.tsx` ثبت کن.
7. از تایپ‌های TypeScript استفاده کن، any ممنوع.
8. کامنت اضافه نکن مگر اینکه کاربر خواسته باشد.
9. برای طراحی فرانت‌اند و UI، فایل `plan/design-system.md` را بخوان و از مقادیر آن (رنگ‌ها، فاصله‌ها، radius، سایه‌ها، انیمیشن‌ها، اندازه فونت‌ها، ارتفاع کامپوننت‌ها و ...) استفاده کن. تمام کامپوننت‌ها باید از ابتدا از Dark Mode پشتیبانی کنند (CSS variables).
