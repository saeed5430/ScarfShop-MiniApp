import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/api';
import { telegramRoutes } from './routes/telegram';

type Bindings = {
  ASSETS: Fetcher;
  TELEGRAM_BOT_TOKEN: string;
  BASE_URL: string;
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

app.route('/api', apiRoutes);
app.route('/webhook/telegram', telegramRoutes);

app.get('*', async (c) => {
  const asset = await c.env.ASSETS.fetch(c.req.raw);
  if (asset.ok) {
    return asset;
  }
  const index = await c.env.ASSETS.fetch(new Request(new URL('/', c.req.url), c.req.raw));
  return index;
});

export default app;
