# telegram-user-service

سرویس Telegram Message Sending برای ارسال پیام از حساب شخصی ادمین‌ها (MTProto / gramJS).

- **اجرا**: Serverless Container (Cloudflare Containers / هر runtime Node.js).
- **نشست‌ها (Session)** فقط در این سرویس و به صورت رمزنگاری‌شده (AES-256-GCM) ذخیره می‌شوند؛ Worker فقط ارجاع و وضعیت را در D1 نگه می‌دارد.
- ارتباط Worker → سرویس فقط با `SERVICE_TOKEN` (Bearer) و هدر `X-Admin-Id`.

## Environment

```bash
cp .env.example .env
```

- `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` — از my.telegram.org
- `SESSION_ENCRYPTION_KEY` — 64 کاراکتر hex (32 byte):
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `SERVICE_TOKEN` — توکن اشتراک سرویس
- `ADMIN_IDS` — اختیاری؛ فهرست ادمین‌های مجاز با کاما (اگر خالی باشد همه پذیرفته می‌شوند)

```bash
npm install
npm run dev     # development (tsx watch)
npm run build   # compile to dist
npm start       # production
```

## API

همه مسیرها نیازمند `Authorization: Bearer $SERVICE_TOKEN` و هدر `X-Admin-Id` هستند.

| Method | Path | Body | توضیح |
|--------|------|------|-------|
| GET | `/api/health` | — | سلامت سرویس (بدون احراز هویت) |
| POST | `/api/connect/start` | `{"phone":"+98912..."}` | ارسال کد ورود |
| POST | `/api/connect/code` | `{"code":"123456"}` | تأیید کد؛ اگر 2FA فعال باشد پاسخ `{"needPassword":true}` |
| POST | `/api/connect/password` | `{"password":"..."}` | ارسال رمز دومرحله‌ای |
| POST | `/api/connect/cancel` | — | لغو ورود در انتظار |
| GET | `/api/status` | — | وضعیت اتصال و اطلاعات حساب |
| POST | `/api/disconnect` | — | قطع اتصال و حذف نشست |
| GET | `/api/me` | — | اطلاعات اکانت متصل |
| POST | `/api/send` | multipart یا JSON | ارسال پیام/عکس/ویس |

### POST /api/send

- `kind`: `text` | `photo` | `voice`
- `target`: `@username`، شماره تلفن (`+98...`) یا شناسه عددی کاربر
- `text` (برای text چندخطی) یا `caption` (برای پیوست)
- برای `photo`/`voice`: multipart با فیلد `file`

```bash
curl -X POST http://localhost:8787/api/send \
  -H "Authorization: Bearer $TOKEN" -H "X-Admin-Id: 6451725218" \
  -F "kind=text" -F "target=@customer" -F "text=سلام، سفارش شما آماده است."
```

## فلوی ورود حساب (Connect Flow)

1. `POST /api/connect/start` با شماره تلفن → Telegram کد می‌فرستد.
2. `POST /api/connect/code` با کد دریافتی.
   - اگر خود پاسخ شامل `needPassword: true` باشد (2FA فعال)، مرحله 3 را برو.
3. `POST /api/connect/password` با رمز دومرحله‌ای → نشست ذخیره و اتصال برقرار می‌شود.

نشست در `sessions/sessions.json` ذخیره می‌شود؛ خطای 2FA/کد/رمز هرگز به لاگ نمی‌رود.

## Deploy

```bash
docker build -t telegram-user-service .
docker run -p 8787:8787 \
  -e TELEGRAM_API_ID=... -e TELEGRAM_API_HASH=... \
  -e SESSION_ENCRYPTION_KEY=... -e SERVICE_TOKEN=... \
  -v telegram-sessions:/app/sessions \
  telegram-user-service
```

دایرکتوری `sessions/` باید persistent volume باشد تا نشست‌ها در restarts حفظ بمانند.