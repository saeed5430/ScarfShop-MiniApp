import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/api';
import { adminAuthRoutes } from './routes/admin-auth';
import { adminApiRoutes } from './routes/admin-api';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload-image';
import { baleRoutes } from './routes/bale';
import { cronRoutes } from './routes/cron';
import { setupRoutes } from './routes/setup';
import { runMigrations } from './db/migrate';
import { requireAdmin } from './middleware/admin-auth';

type Bindings = {
  ASSETS: Fetcher;
  BALE_BOT_TOKEN: string;
  BASE_URL: string;
  DB: D1Database;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  JWT_SECRET: string;
  BALE_ORDER_NOTIFY_BOT_TOKEN: string;
  MINI_APP_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

let migrationsDone = false;

app.use('/api/*', cors({
  origin: [
    'https://scarf-admin.pages.dev',
    'https://saeed5430.github.io',
    'http://localhost:3000',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('/api/*', async (c, next) => {
  if (!migrationsDone && c.env.DB) {
    await runMigrations(c.env.DB);
    migrationsDone = true;
  }
  await next();
});

app.route('/api/admin-auth', adminAuthRoutes);
app.route('/api/auth', authRoutes);

app.route('/api/setup', setupRoutes);

app.use('/api/admin/*', requireAdmin);
app.route('/api/admin', adminApiRoutes);

app.use('/api/upload/*', requireAdmin);
app.route('/api/upload', uploadRoutes);

app.route('/api', apiRoutes);

app.route('/webhook/bale', baleRoutes);

app.route('/cron', cronRoutes);

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