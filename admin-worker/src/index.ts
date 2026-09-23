import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { baleAdminAuthRoutes } from './bale/bale-admin-auth';
import { baleAdminRoutes } from './bale/bale-admin-routes';
import { baleUploadRoutes } from './bale/bale-upload-routes';

type Bindings = {
  BALE_DB: D1Database;
  BALE_ORDER_BOT_TOKEN: string;
  IMAGEKIT_PRIVATE_KEY: string;
  IMAGEKIT_PUBLIC_KEY: string;
  IMAGEKIT_URL_ENDPOINT: string;
  JWT_SECRET: string;
  BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors({
  origin: [
    'https://scarfminiappbale-admin.pages.dev',
    'https://master.scarfminiappbale-admin.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/bale-admin-auth', baleAdminAuthRoutes);
app.route('/api/bale-admin', baleAdminRoutes);
app.route('/api/bale-admin/upload', baleUploadRoutes);

app.get('/api/health', (c) => c.json({ status: 'ok', service: 'scarf-bale-admin-api', timestamp: Date.now() }));

export default app;
