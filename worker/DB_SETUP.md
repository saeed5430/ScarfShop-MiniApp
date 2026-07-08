# Database Setup Guide

## 1. Create D1 Database

```bash
wrangler d1 create scarf-mini-app-db
```

This will output a `database_id`. Copy it to `wrangler.toml`.

## 2. Run Migrations

```bash
wrangler d1 execute scarf-mini-app-db --file=./migrations/0001_init.sql
```

## 3. Add Admin User

```bash
wrangler d1 execute scarf-mini-app-db --command="INSERT INTO admins (id, username, first_name) VALUES ('YOUR_TELEGRAM_ID', 'YOUR_USERNAME', 'YOUR_NAME')"
```

## 4. Environment Variables

Set these in Cloudflare Dashboard or via CLI:

```
TELEGRAM_BOT_TOKEN=your_bot_token
BASE_URL=https://scarf-mini-app.abdollahi003.workers.dev
```

## 5. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with Telegram initData |
| GET | `/api/auth/me` | Get current user (requires Bearer token) |
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| GET | `/api/chats/:userId` | Get chat messages for user |

## 6. Frontend Integration

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData: window.Telegram.WebApp.initData }),
});
const { session_token } = await response.json();

// Authenticated requests
const userResponse = await fetch('/api/auth/me', {
  headers: { Authorization: `Bearer ${session_token}` },
});
```
