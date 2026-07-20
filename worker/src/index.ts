import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/api';
import { adminAuthRoutes } from './routes/admin-auth';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload-image';
import { telegramRoutes } from './routes/telegram';
import { runMigrations } from './db/migrate';

type Bindings = {
  ASSETS: Fetcher;
  TELEGRAM_BOT_TOKEN: string;
  BASE_URL: string;
  DB: D1Database;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

let migrationsDone = false;

app.use('/api/*', cors(), async (c, next) => {
  if (!migrationsDone && c.env.DB) {
    await runMigrations(c.env.DB);
    migrationsDone = true;
  }
  await next();
});

app.route('/api', apiRoutes);
app.route('/api/admin-auth', adminAuthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/webhook/telegram', telegramRoutes);

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
