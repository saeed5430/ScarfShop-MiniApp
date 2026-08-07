import { Hono } from 'hono';
import { Database } from '../db';
import { requireAdmin } from '../middleware/admin-auth';
import { notifyCustomerPaymentConfirmed, updateAdminMessages } from './telegram';

type Bindings = {
  DB: D1Database;
  ORDER_NOTIFY_BOT_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
  BASE_URL: string;
};

export const adminApiRoutes = new Hono<{ Bindings: Bindings }>();

// All admin routes require JWT
adminApiRoutes.use('*', requireAdmin);

// Admin Products
adminApiRoutes.get('/products', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.products.list();

  return c.json({ items, total: items.length });
});

adminApiRoutes.get('/products/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const product = await database.products.getById(Number(c.req.param('id')));
  if (!product) return c.json({ error: 'Not found' }, 404);

  return c.json({ product });
});

// Admin Categories
adminApiRoutes.get('/categories', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const categories = await database.categories.list();

  return c.json({ categories, total: categories.length });
});

// Admin Colors
adminApiRoutes.get('/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.colors.list();

  return c.json({ items, total: items.length });
});

// Admin Sizes
adminApiRoutes.get('/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.sizes.list();

  return c.json({ items, total: items.length });
});

// Admin Designs
adminApiRoutes.get('/designs', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.designs.list();

  return c.json({ items, total: items.length });
});

// Admin Orders
adminApiRoutes.get('/orders', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const orders = await database.orders.list();

  return c.json({ orders, total: orders.length });
});

adminApiRoutes.get('/orders/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const order = await database.orders.getById(Number(c.req.param('id')));
  if (!order) return c.json({ error: 'Not found' }, 404);

  const rawItems = await database.orderItems.listByOrder(order.id);
  const items = await Promise.all(rawItems.map(async (item) => {
    const product = await db.prepare('SELECT name, material, category_id FROM products WHERE id = ?').bind(item.product_id).first();
    const category = product?.category_id
      ? await db.prepare('SELECT name FROM categories WHERE id = ?').bind(product.category_id).first()
      : null;
    const color = item.color_id
      ? await db.prepare('SELECT name, hex FROM colors WHERE id = ?').bind(item.color_id).first()
      : null;
    const size = item.size_id
      ? await db.prepare('SELECT dimensions FROM sizes WHERE id = ?').bind(item.size_id).first()
      : null;
    return {
      ...item,
      product_name: product?.name ?? null,
      product_material: product?.material ?? null,
      category_name: category?.name ?? null,
      color_name: color?.name ?? null,
      color_hex: color?.hex ?? null,
      size_dimensions: size?.dimensions ?? null,
    };
  }));
  return c.json({ order, items });
});

adminApiRoutes.put('/orders/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ payment_status?: 'pending' | 'paid'; notes?: string }>();
  if (body.payment_status && !['pending', 'paid'].includes(body.payment_status)) {
    return c.json({ error: 'Invalid payment status' }, 400);
  }
  const database = new Database(db);
  const previousOrder = await database.orders.getById(id);
  const order = await database.orders.update(id, body);
  if (!order) return c.json({ error: 'Not found' }, 404);
  if (c.env.ORDER_NOTIFY_BOT_TOKEN) {
    await updateAdminMessages(db, c.env.ORDER_NOTIFY_BOT_TOKEN, order);
  }
  if (previousOrder?.payment_status !== 'paid' && order.payment_status === 'paid' && c.env.TELEGRAM_BOT_TOKEN) {
    await notifyCustomerPaymentConfirmed(c.env.TELEGRAM_BOT_TOKEN, c.env.BASE_URL, order);
  }
  return c.json({ order });
});

adminApiRoutes.get('/orders/:id/receipt', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.ORDER_NOTIFY_BOT_TOKEN;
  if (!db || !botToken) return c.json({ error: 'Receipt service not configured' }, 500);
  const order = await new Database(db).orders.getById(Number(c.req.param('id')));
  if (!order) return c.json({ error: 'Not found' }, 404);
  const type = c.req.query('type') === 'voice' ? 'voice' : 'invoice';
  const fileId = type === 'voice' ? order.voice_file_id : order.invoice_file_id;
  if (!fileId) return c.json({ error: 'File not uploaded' }, 404);
  const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileData = await fileResponse.json<{ ok?: boolean; result?: { file_path?: string } }>();
  if (!fileData.ok || !fileData.result?.file_path) return c.json({ error: 'File unavailable' }, 404);
  const mediaResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
  if (!mediaResponse.ok || !mediaResponse.body) return c.json({ error: 'File unavailable' }, 404);
  return new Response(mediaResponse.body, {
    headers: {
      'Content-Type': mediaResponse.headers.get('Content-Type') || (type === 'voice' ? 'audio/ogg' : 'image/jpeg'),
      'Cache-Control': 'private, max-age=300',
    },
  });
});

adminApiRoutes.delete('/orders/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  if (!id) return c.json({ error: 'Invalid order ID' }, 400);

  try {
    const database = new Database(db);
    const order = await database.orders.getById(id);
    if (!order) return c.json({ error: 'سفارش یافت نشد' }, 404);

    await database.orderItems.deleteByOrder(id);
    const deleted = await database.orders.delete(id);
    if (!deleted) return c.json({ error: 'حذف سفارش انجام نشد' }, 500);

    return c.json({ deleted: true, message: 'سفارش با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting order:', error);
    const message = error instanceof Error ? error.message : 'خطا در حذف سفارش';
    return c.json({ error: message }, 500);
  }
});

// Admin Customers
adminApiRoutes.get('/customers', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const customers = await database.customers.list();

  return c.json({ customers, total: customers.length });
});

// Admin Chats
adminApiRoutes.get('/chats/:customerId', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const messages = await database.chats.findByCustomerId(c.req.param('customerId'));

  return c.json({ messages });
});

// Admin Admins
adminApiRoutes.get('/admins', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const admins = await database.admins.list();

  return c.json({ admins, total: admins.length });
});

adminApiRoutes.post('/admins/from-customer', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ customer_ids: string[]; email?: string; password_hash?: string }>();
  if (!body.customer_ids || !Array.isArray(body.customer_ids) || body.customer_ids.length === 0) {
    return c.json({ error: 'customer_ids array is required' }, 400);
  }

  const database = new Database(db);
  const results: Array<{ customer_id: string; success: boolean; error?: string }> = [];

  for (const customerId of body.customer_ids) {
    const existing = await database.admins.findByUsername(customerId);
    if (existing) {
      results.push({ customer_id: customerId, success: false, error: 'ادمین تکراری' });
      continue;
    }

    const customer = await database.customers.findById(customerId);
    if (!customer) {
      results.push({ customer_id: customerId, success: false, error: 'مشتری یافت نشد' });
      continue;
    }

    const admin = await database.admins.create({
      id: `admin_${customerId}`,
      customer_id: customerId,
      username: customer.username || customerId,
      email: body.email || undefined,
      first_name: customer.first_name,
      last_name: customer.last_name || undefined,
      avatar_url: customer.avatar_url || undefined,
      password_hash: body.password_hash || undefined,
    });

    results.push({ customer_id: customerId, success: true });
  }

  return c.json({ results });
});

// Admin Coupons
adminApiRoutes.get('/coupons', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const coupons = await database.coupons.list();

  return c.json({ coupons, total: coupons.length });
});

// Admin Settings
adminApiRoutes.get('/settings', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const settings = await database.settings.list();

  return c.json({ settings });
});
