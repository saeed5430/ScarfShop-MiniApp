import { Hono } from 'hono';
import { BaleDB } from './bale-db';
import { authenticateBaleUser, validateBaleSession } from './bale-auth';

type Bindings = {
  BALE_DB: D1Database;
  BALE_BOT_TOKEN: string;
  BALE_ORDER_BOT_TOKEN: string;
  BALE_ADMIN_IDS: string;
  JWT_SECRET: string;
  BASE_URL: string;
  MINI_APP_URL: string;
};

export const baleRoutes = new Hono<{ Bindings: Bindings }>();

baleRoutes.get('/health', (c) => c.json({ status: 'ok', platform: 'bale', timestamp: Date.now() }));

baleRoutes.post('/auth/login', async (c) => {
  const db = c.env.BALE_DB;
  const botToken = c.env.BALE_BOT_TOKEN;
  const jwtSecret = c.env.JWT_SECRET;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  if (!botToken) return c.json({ error: 'Bale bot token not configured' }, 500);
  if (!jwtSecret) return c.json({ error: 'JWT secret not configured' }, 500);
  const body = await c.req.json<{ initData: string }>().catch(() => null);
  if (!body?.initData) return c.json({ error: 'initData is required' }, 400);
  const result = await authenticateBaleUser(db, body.initData, botToken, jwtSecret);
  if (!result.success) return c.json({ error: result.error }, 401);
  return c.json({ success: true, user_id: result.user_id, session_token: result.session_token });
});

async function requireBaleUser(c: { env: Bindings; req: { header: (n: string) => string | undefined }; json: (o: object, s?: number) => Response }, jwtSecret: string) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const result = await validateBaleSession(token, jwtSecret);
  return result.valid ? result.user_id ?? null : null;
}

baleRoutes.get('/auth/me', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const userId = await requireBaleUser(c, c.env.JWT_SECRET ?? '');
  if (!userId) return c.json({ error: 'Token required' }, 401);
  const bale = new BaleDB(db);
  const user = await bale.getUser(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user });
});

baleRoutes.put('/auth/profile', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const userId = await requireBaleUser(c, c.env.JWT_SECRET ?? '');
  if (!userId) return c.json({ error: 'Token required' }, 401);
  const body = await c.req.json<{ first_name?: string; last_name?: string; phone?: string; address?: string; postal_code?: string }>().catch(() => ({}));
  const bale = new BaleDB(db);
  const user = await bale.updateUserProfile(userId, body);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ user });
});

baleRoutes.get('/categories', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const categories = await bale.listCategories();
  return c.json({ categories, total: categories.length });
});

baleRoutes.get('/products', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const categoryId = c.req.query('category_id');
  const search = c.req.query('search');
  const bale = new BaleDB(db);
  const items = await bale.listProducts(categoryId ? Number(categoryId) : undefined, search);
  return c.json({ items, total: items.length });
});

baleRoutes.get('/products/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const product = await bale.getProduct(Number(c.req.param('id')));
  if (!product) return c.json({ error: 'Not found' }, 404);
  const variants = await bale.listProductVariants(product.id);
  const enriched = await Promise.all(
    variants.map(async (v) => ({
      ...v,
      colors: await bale.listVariantColors(v.id),
      sizes: await bale.listVariantSizes(v.id),
    }))
  );
  return c.json({ product, variants: enriched });
});

baleRoutes.get('/sizes', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const items = await bale.listSizes();
  return c.json({ items, total: items.length });
});

baleRoutes.get('/products/:id/colors', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const colors = await bale.listProductColors(Number(c.req.param('id')));
  return c.json({ colors });
});

baleRoutes.get('/products/:id/sizes', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const sizes = await bale.listProductSizes(Number(c.req.param('id')));
  return c.json({ sizes });
});

baleRoutes.get('/variants/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const variant = await bale.getVariantDetails(Number(c.req.param('id')));
  if (!variant) return c.json({ error: 'Not found' }, 404);
  const colors = await bale.listVariantColors(variant.id);
  const sizes = await bale.listVariantSizes(variant.id);
  return c.json({ variant, colors, sizes });
});

baleRoutes.post('/orders', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const userId = await requireBaleUser(c, c.env.JWT_SECRET ?? '');
  if (!userId) return c.json({ error: 'Token required' }, 401);
  const body = await c.req.json<{ delivery_method?: string; notes?: string; items: { variant_id?: number; product_id?: number; color_id?: number | null; size_id?: number | null; quantity: number }[] }>().catch(() => null);
  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ error: 'items is required' }, 400);
  }
  if (body.delivery_method !== undefined && body.delivery_method !== null && !['in_person', 'tipax', 'carrier'].includes(body.delivery_method)) {
    return c.json({ error: 'روش تحویل نامعتبر است' }, 400);
  }
  try {
    const bale = new BaleDB(db);
    const resolvedItems: { variant_id: number; quantity: number }[] = [];
    for (const item of body.items) {
      let variantId = item.variant_id;
      if (!variantId && item.product_id) {
        const resolved = await bale.resolveVariantId(item.product_id, item.color_id ?? null, item.size_id ?? null);
        if (!resolved) return c.json({ error: `Variant not found for product ${item.product_id}` }, 400);
        variantId = resolved;
      }
      if (!variantId) return c.json({ error: 'variant_id or product_id is required' }, 400);
      resolvedItems.push({ variant_id: variantId, quantity: item.quantity });
    }
    const order = await bale.createOrder(userId, { delivery_method: body.delivery_method, notes: body.notes, items: resolvedItems });
    const items = await bale.listOrderItems(order.id);
    const user = await bale.getUser(userId);
    const notifyToken = c.env.BALE_ORDER_BOT_TOKEN;
    if (notifyToken) {
      const deliveryLabels: Record<string, string> = { in_person: '🏪 تحویل حضوری', tipax: '🚚 ارسال با تیپاکس', carrier: '🚛 ارسال با باربری' };
      const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || '—';
      const lines = items.map((it, i) => `${i + 1}. ${it.product_name ?? 'محصول'}${it.color_name ? ` 🎨 ${it.color_name}` : ''}${it.size_dimensions ? ` 📏 ${it.size_dimensions}` : ''}\n   تعداد: ${it.quantity}`);
      const text = [
        `🛍️ سفارش جدید #${order.id}`, '',
        '👤 اطلاعات مشتری:',
        `├ نام: ${name}`,
        `├ یوزرنیم: ${user?.username ? `@${user.username}` : 'ندارد'}`,
        `├ شناسه: ${userId}`,
        user?.phone ? `├ تلفن: ${user.phone}` : null,
        user?.address ? `├ آدرس: ${user.address}` : null,
        '', '',
        body.delivery_method ? `📦 نحوه تحویل: ${deliveryLabels[body.delivery_method] ?? body.delivery_method}\n` : null,
        '📦 اقلام سفارش:',
        ...lines, '',
        '💳 پرداخت: ❌ پرداخت نشده',
        '🧾 فاکتور: ❌ ثبت نشده',
        '🎤 صدا: ❌ ثبت نشده',
      ].filter((x) => x !== null).join('\n');
      const keyboard = {
        inline_keyboard: [[
          { text: '📷 ارسال فاکتور', callback_data: `order:invoice:${order.id}` },
          { text: '🎤 ارسال صدا', callback_data: `order:voice:${order.id}` },
        ]],
      };
      const adminIds = (c.env.BALE_ADMIN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      await Promise.all(adminIds.map((chatId) =>
        fetch(`https://tapi.bale.ai/bot${notifyToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, reply_markup: keyboard }),
        }).catch(() => null)
      ));
    }
    return c.json({ order }, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Order failed' }, 400);
  }
});

baleRoutes.get('/my-orders', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const userId = await requireBaleUser(c, c.env.JWT_SECRET ?? '');
  if (!userId) return c.json({ error: 'Token required' }, 401);
  const bale = new BaleDB(db);
  const orders = await bale.listOrdersByCustomer(userId);
  const enriched = await Promise.all(
    orders.map(async (order) => ({ ...order, items: await bale.listOrderItems(order.id) }))
  );
  return c.json({ orders: enriched });
});

baleRoutes.get('/settings', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const settings = await bale.listSettings();
  return c.json({ settings });
});

baleRoutes.get('/settings/:key', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const bale = new BaleDB(db);
  const setting = await bale.getSetting(c.req.param('key'));
  return c.json({ setting });
});
