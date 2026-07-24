import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/api';
import { adminAuthRoutes } from './routes/admin-auth';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload-image';
import { telegramRoutes } from './routes/telegram';
import { runMigrations } from './db/migrate';
import { requireAdmin } from './middleware/admin-auth';

type Bindings = {
  ASSETS: Fetcher;
  TELEGRAM_BOT_TOKEN: string;
  BASE_URL: string;
  DB: D1Database;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

let migrationsDone = false;

// CORS for all API routes
app.use('/api/*', cors({
  origin: [
    'https://scarf-admin.pages.dev',
    'http://localhost:3000',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Run migrations on first request
app.use('/api/*', async (c, next) => {
  if (!migrationsDone && c.env.DB) {
    await runMigrations(c.env.DB);
    migrationsDone = true;
  }
  await next();
});

// Public auth routes
app.route('/api/admin-auth', adminAuthRoutes);
app.route('/api/auth', authRoutes);

// Admin-protected upload routes
app.use('/api/upload/*', requireAdmin);
app.route('/api/upload', uploadRoutes);

// Main API routes (individual routes have their own auth middleware)
app.route('/api', apiRoutes);

// Telegram webhook (no auth needed)
app.route('/webhook/telegram', telegramRoutes);

// Serve frontend assets
app.get('*', async (c) => {
  if (c.env.ASSETS) {
    const asset = await c.env.ASSETS.fetch(c.req.raw);
    if (asset.ok) {
      return asset;
    }
    const index = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url), c.req.raw));
    return index;
  }
  return c.text('Worker is running. Use /api/* endpoints.');
});

export default app;
