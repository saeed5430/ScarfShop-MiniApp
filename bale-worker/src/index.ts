import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { baleRoutes } from './bale/bale-routes';
import { baleWebhookRoutes } from './bale/bale-webhook';
import { baleAdminAuthRoutes } from './bale/bale-admin-auth';
import { baleAdminRoutes } from './bale/bale-admin-routes';

type Bindings = {
  BALE_DB: D1Database;
  BALE_BOT_TOKEN: string;
  BALE_ORDER_BOT_TOKEN: string;
  BALE_ADMIN_IDS: string;
  JWT_SECRET: string;
  BASE_URL: string;
  MINI_APP_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors({
  origin: ['https://saeed5430.github.io', 'http://localhost:5173', 'http://localhost:3000', 'https://armana-bale-admin.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/bale', baleRoutes);
app.route('/webhook/bale', baleWebhookRoutes);
app.route('/api/bale-admin-auth', baleAdminAuthRoutes);
app.route('/api/bale-admin', baleAdminRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok', platform: 'bale', timestamp: Date.now() }));

export default app;
