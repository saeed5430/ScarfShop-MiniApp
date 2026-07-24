import { Hono } from 'hono';
import { Database } from '../db';
import { authenticateCustomer, validateSession } from '../auth';
import { requireAdmin } from '../middleware/admin-auth';
import { requireCustomer } from '../middleware/customer-auth';

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  ORDER_NOTIFY_BOT_TOKEN: string;
};

export const apiRoutes = new Hono<{ Bindings: Bindings }>();

apiRoutes.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() });
});

// Auth routes

apiRoutes.post('/auth/login', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.TELEGRAM_BOT_TOKEN;

  if (!db) return c.json({ error: 'Database not configured' }, 500);
  if (!botToken) return c.json({ error: 'Bot token not configured' }, 500);

  const body = await c.req.json<{ initData: string }>();
  if (!body.initData) return c.json({ error: 'initData is required', received: body }, 400);

  const result = await authenticateCustomer(db, body.initData, botToken);
  if (!result.success) return c.json({ error: result.error }, 401);

  return c.json({
    success: true,
    customer_id: result.customer_id,
    session_token: result.session_token,
  });
});

apiRoutes.get('/auth/me', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Token required' }, 401);

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ error: result.error }, 401);

  const database = new Database(db);
  const customer = await database.customers.findById(result.customer_id!);
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  return c.json({ customer });
});

// Check if customer is admin
apiRoutes.get('/auth/is-admin', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ is_admin: false }, 200);

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ is_admin: false }, 200);

  const database = new Database(db);
  const customer = await database.customers.findById(result.customer_id!);
  if (!customer) return c.json({ is_admin: false }, 200);

  const admin = await database.admins.findByUsername(customer.username || '');
  return c.json({ is_admin: admin !== null });
});

// Update customer profile
apiRoutes.put('/auth/profile', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Token required' }, 401);

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ error: result.error }, 401);

  const body = await c.req.json<{
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    postal_code?: string;
  }>();

  const database = new Database(db);
  const customer = await database.customers.update(result.customer_id!, body);
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  return c.json({ customer });
});

// Customers routes

apiRoutes.get('/customers', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const customers = await database.customers.list(limit, offset);
  const total = await database.customers.count();

  return c.json({ customers, total, limit, offset });
});

apiRoutes.get('/customers/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const customer = await database.customers.findById(c.req.param('id'));
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  return c.json({ customer });
});

// Chats routes

apiRoutes.get('/chats/:customerId', requireCustomer, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7) || '';
  const sessionResult = await validateSession(db, token);
  const customerId = sessionResult.customer_id || '';
  const requestedCustomerId = c.req.param('customerId');

  // Users can only access their own chats
  if (customerId !== requestedCustomerId) {
    return c.json({ error: 'دسترسی غیرمجاز' }, 403);
  }

  const database = new Database(db);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const messages = await database.chats.findByCustomerId(customerId, limit, offset);
  return c.json({ messages });
});

// Categories routes

apiRoutes.get('/categories', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const categories = await database.categories.list();

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => ({
      ...cat,
      product_count: await database.categories.getProductCount(cat.id),
    }))
  );

  return c.json({ categories: categoriesWithCount, total: categoriesWithCount.length });
});

apiRoutes.post('/categories', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const category = await database.categories.create(body);

  return c.json({ category }, 201);
});

apiRoutes.put('/categories/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const category = await database.categories.update(id, body);
  if (!category) return c.json({ error: 'Not found' }, 404);

  return c.json({ category });
});

apiRoutes.delete('/categories/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);

  const isUsed = await database.categories.isUsedInProducts(id);
  if (isUsed) {
    return c.json({ error: 'این دسته‌بندی دارای محصول است و قابل حذف نیست' }, 400);
  }

  const deleted = await database.categories.delete(id);

  return c.json({ deleted });
});

// Products routes

apiRoutes.get('/products', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const categoryId = c.req.query('category_id');
  const search = c.req.query('search');
  const is_active = c.req.query('is_active');

  let items;
  if (search) {
    items = await database.products.search(search);
  } else if (categoryId) {
    items = await database.products.listByCategory(Number(categoryId));
  } else {
    items = await database.products.list();
  }

  // Filter by is_active
  if (is_active !== undefined && is_active !== null) {
    const active = is_active === 'true';
    items = items.filter((p) => p.is_active === active);
  }

  // Enrich with color_count, size_count and category_name
  const enriched = await Promise.all(
    items.map(async (product) => ({
      ...product,
      color_count: await database.products.getColorCount(product.id),
      size_count: await database.products.getSizeCount(product.id),
      category_name: await database.products.getCategoryName(product.category_id),
    }))
  );

  return c.json({ items: enriched, total: enriched.length });
});

apiRoutes.get('/products/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const product = await database.products.getById(Number(c.req.param('id')));
  if (!product) return c.json({ error: 'Not found' }, 404);

  const colorIds = await database.products.getColors(product.id);
  const sizeIds = await database.products.getSizes(product.id);

  const colors = await Promise.all(
    colorIds.map(async (id) => {
      const color = await database.colors.getById(id);
      return color ? { id: color.id, name: color.name, name_en: color.name_en, hex: color.hex } : null;
    })
  );

  const sizes = await Promise.all(
    sizeIds.map(async (id) => {
      const size = await database.sizes.getById(id);
      return size ? { id: size.id, dimensions: size.dimensions } : null;
    })
  );

  return c.json({
    product: {
      ...product,
      colors: colors.filter(Boolean),
      sizes: sizes.filter(Boolean),
      color_ids: colorIds,
      size_ids: sizeIds,
      category_name: await database.products.getCategoryName(product.category_id),
    }
  });
});

apiRoutes.post('/products', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);

  const { color_ids, size_ids, ...productData } = body;
  const product = await database.products.create(productData);

  if (color_ids && Array.isArray(color_ids)) {
    await database.products.setColors(product.id, color_ids);
  }
  if (size_ids && Array.isArray(size_ids)) {
    await database.products.setSizes(product.id, size_ids);
  }

  return c.json({ product }, 201);
});

apiRoutes.put('/products/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);

  const { color_ids, size_ids, ...productData } = body;
  const product = await database.products.update(id, productData);
  if (!product) return c.json({ error: 'Not found' }, 404);

  if (color_ids && Array.isArray(color_ids)) {
    await database.products.setColors(id, color_ids);
  }
  if (size_ids && Array.isArray(size_ids)) {
    await database.products.setSizes(id, size_ids);
  }

  return c.json({ product });
});

apiRoutes.delete('/products/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.products.delete(id);

  return c.json({ deleted });
});

// Product Colors routes

apiRoutes.get('/products/:id/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const colorIds = await database.products.getColors(Number(c.req.param('id')));
  const colors = await Promise.all(colorIds.map((id) => database.colors.getById(id)));

  return c.json({ colors: colors.filter(Boolean) });
});

apiRoutes.put('/products/:id/colors', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const productId = Number(c.req.param('id'));
  const body = await c.req.json<{ color_ids: number[] }>();
  const database = new Database(db);

  await database.products.setColors(productId, body.color_ids || []);

  return c.json({ success: true });
});

// Product Sizes routes

apiRoutes.get('/products/:id/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const sizeIds = await database.products.getSizes(Number(c.req.param('id')));
  const sizes = await Promise.all(sizeIds.map((id) => database.sizes.getById(id)));

  return c.json({ sizes: sizes.filter(Boolean) });
});

apiRoutes.put('/products/:id/sizes', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const productId = Number(c.req.param('id'));
  const body = await c.req.json<{ size_ids: number[] }>();
  const database = new Database(db);

  await database.products.setSizes(productId, body.size_ids || []);

  return c.json({ success: true });
});

// Designs routes

apiRoutes.get('/designs', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.designs.list();

  return c.json({ items, total: items.length });
});

apiRoutes.get('/designs/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const design = await database.designs.getById(Number(c.req.param('id')));
  if (!design) return c.json({ error: 'Not found' }, 404);

  return c.json({ design });
});

apiRoutes.post('/designs', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const design = await database.designs.create(body);

  return c.json({ design }, 201);
});

apiRoutes.put('/designs/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const design = await database.designs.update(id, body);
  if (!design) return c.json({ error: 'Not found' }, 404);

  return c.json({ design });
});

apiRoutes.delete('/designs/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);

  const deleted = await database.designs.delete(id);

  return c.json({ deleted });
});

// Settings routes

apiRoutes.get('/settings', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const settings = await database.settings.list();

  return c.json({ settings });
});

apiRoutes.put('/settings', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ key: string; value: string }>();
  const database = new Database(db);

  if (!body.key || body.value === undefined) {
    return c.json({ error: 'key and value are required' }, 400);
  }

  const setting = await database.settings.upsert(body.key, body.value);

  return c.json({ setting });
});

apiRoutes.put('/settings/bulk', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ items: Array<{ key: string; value: string }> }>();
  const database = new Database(db);

  if (!body.items || !Array.isArray(body.items)) {
    return c.json({ error: 'items array is required' }, 400);
  }

  for (const item of body.items) {
    await database.settings.upsert(item.key, item.value);
  }

  const settings = await database.settings.list();
  return c.json({ settings });
});

// Admins routes

apiRoutes.get('/admins', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const admins = await database.admins.list();

  return c.json({ admins, total: admins.length });
});

apiRoutes.get('/admins/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const admin = await database.admins.getById(c.req.param('id'));
  if (!admin) return c.json({ error: 'Not found' }, 404);

  return c.json({ admin });
});

apiRoutes.post('/admins', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const admin = await database.admins.create(body);

  return c.json({ admin }, 201);
});

apiRoutes.put('/admins/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = c.req.param('id') ?? '';
  const body = await c.req.json();
  const database = new Database(db);
  const admin = await database.admins.update(id, body);
  if (!admin) return c.json({ error: 'Not found' }, 404);

  return c.json({ admin });
});

apiRoutes.delete('/admins/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = c.req.param('id') ?? '';
  const database = new Database(db);
  const deleted = await database.admins.delete(id);

  return c.json({ deleted });
});

// Colors routes

apiRoutes.get('/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.colors.list();

  const itemsWithCount = await Promise.all(
    items.map(async (color) => ({
      ...color,
      product_count: await database.colors.getProductCount(color.id),
    }))
  );

  return c.json({ items: itemsWithCount, total: itemsWithCount.length });
});

apiRoutes.get('/colors/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const item = await database.colors.getById(Number(c.req.param('id')));
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.post('/colors', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.colors.create(body);

  return c.json({ item }, 201);
});

apiRoutes.put('/colors/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.colors.update(id, body);
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.delete('/colors/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);

  const isUsed = await database.colors.isUsedInProducts(id);
  if (isUsed) {
    return c.json({ error: 'این رنگ در محصولات استفاده شده و قابل حذف نیست' }, 400);
  }

  const deleted = await database.colors.delete(id);

  return c.json({ deleted });
});

// Sizes routes

apiRoutes.get('/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.sizes.list();

  const itemsWithCount = await Promise.all(
    items.map(async (size) => ({
      ...size,
      product_count: await database.sizes.getProductCount(size.id),
    }))
  );

  return c.json({ items: itemsWithCount, total: itemsWithCount.length });
});

apiRoutes.get('/sizes/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const item = await database.sizes.getById(Number(c.req.param('id')));
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.post('/sizes', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.sizes.create(body);

  return c.json({ item }, 201);
});

apiRoutes.put('/sizes/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.sizes.update(id, body);
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.delete('/sizes/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);

  const isUsed = await database.sizes.isUsedInProducts(id);
  if (isUsed) {
    return c.json({ error: 'این سایز در محصولات استفاده شده و قابل حذف نیست' }, 400);
  }

  const deleted = await database.sizes.delete(id);

  return c.json({ deleted });
});

// Orders routes

apiRoutes.get('/orders', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const orders = await database.orders.list(limit, offset);
  const total = await database.orders.count();

  const enriched = await Promise.all(orders.map(async (order) => {
    const { results } = await db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?').bind(order.id).all();
    const itemCount = (results[0] as Record<string, unknown>)?.count ?? 0;
    return { ...order, item_count: Number(itemCount) };
  }));

  return c.json({ orders: enriched, total });
});

apiRoutes.get('/orders/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const order = await database.orders.getById(Number(c.req.param('id')));
  if (!order) return c.json({ error: 'Not found' }, 404);

  const rawItems = await database.orderItems.listByOrder(order.id);

  const items = await Promise.all(rawItems.map(async (item) => {
    const product = item.product_id ? await db.prepare('SELECT id, name, material, category_id FROM products WHERE id = ?').bind(item.product_id).first() : null;
    const color = item.color_id ? await db.prepare('SELECT id, name, hex FROM colors WHERE id = ?').bind(item.color_id).first() : null;
    const size = item.size_id ? await db.prepare('SELECT id, dimensions FROM sizes WHERE id = ?').bind(item.size_id).first() : null;
    const category = product?.category_id ? await db.prepare('SELECT id, name FROM categories WHERE id = ?').bind(product.category_id).first() : null;

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

apiRoutes.post('/orders', requireCustomer, async (c) => {
  const db = c.env.DB;
  const orderNotifyBotToken = c.env.ORDER_NOTIFY_BOT_TOKEN;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const authHeader = c.req.header('Authorization');
  const token = authHeader?.slice(7) || '';
  const sessionResult = await validateSession(db, token);
  const customerId = sessionResult.customer_id || '';

  const body = await c.req.json();
  const database = new Database(db);

  // Ensure user can only create orders for themselves
  const orderData = {
    ...body,
    user_id: customerId,
  };

  const order = await database.orders.create(orderData);

  // Track items for notification
  const orderItems: Array<{
    product_name: string | null;
    category_name: string | null;
    color_name: string | null;
    color_hex: string | null;
    size_dimensions: string | null;
    quantity: number;
  }> = [];

  if (body.items && Array.isArray(body.items)) {
    for (const item of body.items) {
      await database.orderItems.create({
        order_id: order.id,
        product_id: item.product_id,
        color_id: item.color_id,
        size_id: item.size_id,
        quantity: item.quantity,
      });

      // Get product info for notification
      const product = item.product_id ? await db.prepare('SELECT id, name, material, category_id FROM products WHERE id = ?').bind(item.product_id).first<Record<string, unknown>>() : null;
      const color = item.color_id ? await db.prepare('SELECT id, name, hex FROM colors WHERE id = ?').bind(item.color_id).first<Record<string, unknown>>() : null;
      const size = item.size_id ? await db.prepare('SELECT id, dimensions FROM sizes WHERE id = ?').bind(item.size_id).first<Record<string, unknown>>() : null;
      const category = product?.category_id ? await db.prepare('SELECT id, name FROM categories WHERE id = ?').bind(Number(product.category_id)).first<Record<string, unknown>>() : null;

      orderItems.push({
        product_name: product?.name ? String(product.name) : null,
        category_name: category?.name ? String(category.name) : null,
        color_name: color?.name ? String(color.name) : null,
        color_hex: color?.hex ? String(color.hex) : null,
        size_dimensions: size?.dimensions ? String(size.dimensions) : null,
        quantity: item.quantity,
      });
    }
  }

  // Send notification to admins
  if (orderNotifyBotToken) {
    try {
      const { sendOrderNotification } = await import('../services/notify');
      const result = await sendOrderNotification(db, orderNotifyBotToken, order.id, customerId, orderItems);
      console.log(`Order ${order.id} notification: sent=${result.sent}, failed=${result.failed}`);
    } catch (error) {
      console.error('Failed to send order notification:', error);
    }
  }

  return c.json({ order }, 201);
});

apiRoutes.put('/orders/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const order = await database.orders.update(id, body);
  if (!order) return c.json({ error: 'Not found' }, 404);

  return c.json({ order });
});

apiRoutes.delete('/orders/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  await database.orderItems.deleteByOrder(id);
  const deleted = await database.orders.delete(id);

  return c.json({ deleted });
});

// Order Items routes

apiRoutes.get('/orders/:orderId/items', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.orderItems.listByOrder(Number(c.req.param('orderId')));

  return c.json({ items });
});

apiRoutes.post('/orders/:orderId/items', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.orderItems.create({
    order_id: Number(c.req.param('orderId')),
    product_id: body.product_id,
    color_id: body.color_id,
    size_id: body.size_id,
    quantity: body.quantity,
  });

  return c.json({ item }, 201);
});

apiRoutes.delete('/order-items/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.orderItems.delete(id);

  return c.json({ deleted });
});

// Coupons routes

apiRoutes.get('/coupons', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const coupons = await database.coupons.list();

  return c.json({ coupons, total: coupons.length });
});

apiRoutes.get('/coupons/active', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const coupons = await database.coupons.listActive();

  return c.json({ coupons });
});

apiRoutes.get('/coupons/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const coupon = await database.coupons.getById(Number(c.req.param('id')));
  if (!coupon) return c.json({ error: 'Not found' }, 404);

  return c.json({ coupon });
});

apiRoutes.post('/coupons', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const coupon = await database.coupons.create(body);

  return c.json({ coupon }, 201);
});

apiRoutes.put('/coupons/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const coupon = await database.coupons.update(id, body);
  if (!coupon) return c.json({ error: 'Not found' }, 404);

  return c.json({ coupon });
});

apiRoutes.delete('/coupons/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.coupons.delete(id);

  return c.json({ deleted });
});
