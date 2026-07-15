# چک‌لیست دپلوی

## ۱. ساختار پروژه
```
ScarfMiniApp/          → مینی‌اپ (Cloudflare Pages)
worker/                → بک‌اند (Cloudflare Workers)
scarf-admin/           → پنل ادمین (Cloudflare Pages)
```

## ۲. پورت‌ها و آدرس‌ها

| سرویس | لوکال | Production |
|-------|-------|------------|
| مینی‌اپ | localhost:5173 | scarf-mini-app.pages.dev |
| Worker | localhost:8787 | scarf-mini-app.abdollahi003.workers.dev |
| پنل ادمین | localhost:3000 | scarf-admin.pages.dev |

## ۳. متغیرهای محیطی Worker
```
TELEGRAM_BOT_TOKEN=<توکن ربات>
BASE_URL=https://scarf-mini-app.abdollahi003.workers.dev
```

## ۴. تغییرات قبل از دپلوی

### Worker
- [ ] `worker/wrangler.toml` — بررسی نام D1 database
- [ ] متغیرهای محیطی در Cloudflare Dashboard تنظیم بشن

### مینی‌اپ
- [ ] `src/api/client.ts` — `BASE_URL` خالی باشه (Worker همه چیز رو سرو میکنه)
- [ ] `vite.config.ts` — proxy حذف بشه

### پنل ادمین
- [ ] `src/providers/authProvider.ts` — `API_URL` به آدرس Worker production تغییر کنه
- [ ] `src/dataProvider.ts` — `API_URL` به آدرس Worker production تغییر کنه
- [ ] `vite.config.ts` — proxy حذف بشه

## ۵. دستورات دپلوی

### Worker
```bash
cd worker
npx wrangler deploy
```

### مینی‌اپ
```bash
cd ScarfMiniApp
npm run build
# آپلود dist/ به Cloudflare Pages
```

### پنل ادمین
```bash
cd scarf-admin
npm run build
# آپلود dist/ به Cloudflare Pages
```

## ۶. تنظیمات Telegram Bot
- Webhook: `https://scarf-mini-app.abdollahi003.workers.dev/webhook/telegram`
- Mini App URL: `https://scarf-mini-app.abdollahi003.workers.dev`

## ۷. ادمین اولیه
```
ایمیل: admin@armana.ir
رمز: adminadmin
```

## ۸. تست نهایی
- [ ] ورود کاربر از تلگرام
- [ ] نمایش اطلاعات پروفایل
- [ ] دسترسی به خرید سریع
- [ ] لاگین ادمین
- [ ] دسترسی به پنل ادمین
- [ ] CRUD محصولات
- [ ] CRUD ادمین‌ها
