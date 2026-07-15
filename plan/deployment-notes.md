# نکات قبل از دپلوی

## ۱. پورت‌ها و آدرس‌ها

### حالت توسعه (لوکال)
| سرویس | پورت | آدرس |
|-------|------|------|
| مینی‌اپ (Vite) | 5173 | http://localhost:5173 |
| پنل ادمین (Refine) | 3000 | http://localhost:3000 |
| Worker (Wrangler) | 8787 | http://localhost:8787 |

### حالت دپلوی (Production)
| سرویس | آدرس |
|-------|------|
| مینی‌اپ | https://scarf-mini-app.abdollahi003.workers.dev |
| پنل ادمین | https://scarf-mini-app-admin.pages.dev |
| Worker API | https://scarf-mini-app.abdollahi003.workers.dev/api |

## ۲. تغییرات قبل از دپلوی

### در فایل `vite.config.ts`
```typescript
// فعلی:
proxy: {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true,
  },
},

// دپلوی شده:
// proxy حذف میشه چون Worker همه چیز رو سرو میکنه
```

### در فایل `src/api/client.ts`
```typescript
// فعلی:
const BASE_URL = import.meta.env.VITE_API_URL || '';

// دپلوی شده:
const BASE_URL = '';  // Worker همه چیز رو سرو میکنه
```

### در فایل `scarf-admin/src/dataProvider.ts`
```typescript
// فعلی:
const API_URL = "http://localhost:8787";

// دپلوی شده:
const API_URL = "";  // یا آدرس Worker production
```

### در فایل `scarf-admin/vite.config.ts`
```typescript
// فعلی:
proxy: {
  '/api': {
    target: 'http://localhost:8787',
    changeOrigin: true,
  },
},

// دپلوی شده:
// proxy حذف میشه
```

## ۳. دستورات دپلوی

### Worker
```bash
cd worker
npx wrangler deploy
```

### مینی‌اپ (Cloudflare Pages)
```bash
cd ScarfMiniApp
npm run build
# آپلود پوشه dist به Cloudflare Pages
```

### پنل ادمین (Cloudflare Pages)
```bash
cd scarf-admin
npm run build
# آپلود پوشه dist به Cloudflare Pages
```

## ۴. متغیرهای محیطی Worker
```
TELEGRAM_BOT_TOKEN=<bot_token>
BASE_URL=https://scarf-mini-app.abdollahi003.workers.dev
```

## ۵. تنظیمات Telegram Bot
- Webhook URL: `https://scarf-mini-app.abdollahi003.workers.dev/webhook/telegram`
- Mini App URL: `https://scarf-mini-app.abdollahi003.workers.dev`

## ۶. پنل ادمین (مینی‌اپ)
- لاگین ادمین در صفحه `/admin-panel` ادغام شده (صفحه جداگانه حذف شده)
- دکمه "ورود به پنل ادمین" برای همه کاربران نمایش داده میشه
- ایمیل: `admin@armana.ir`
- رمز عبور: `adminadmin`
- لینک پنل ادمین Refine: `http://localhost:3000` (لوکال) — باید به آدرس production تغییر کنه

### تغییرات قبل از دپلوی
```typescript
// در src/pages/AdminPanelPage/AdminPanelPage.tsx
// فعلی:
href="http://localhost:3000"

// دپلوی شده:
href="https://scarf-mini-app-admin.pages.dev"
```

## ۷. حالت Demo برای تست
- وقتی در تلگرام نباشی، حالت demo فعال میشه
- کاربر demo: `@saeed54300` با شماره، آدرس و کد پستی
- اطلاعات در `localStorage` ذخیره میشه
- دکمه ادمین برای کاربر demo نمایش داده میشه

## ۸. تست نهایی
1. ورود کاربر از تلگرام
2. نمایش اطلاعات پروفایل
3. دسترسی به خرید سریع
4. لاگین ادمین با admin@armana.ir / adminadmin
5. دسترسی به پنل ادمین
