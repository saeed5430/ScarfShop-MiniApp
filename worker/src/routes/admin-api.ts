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
