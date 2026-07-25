import { Hono } from 'hono';
import { Database } from '../db';
import { requireAdmin } from '../middleware/admin-auth';

type Bindings = {
  DB: D1Database;
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

  const items = await database.orderItems.listByOrder(order.id);
  return c.json({ order, items });
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
