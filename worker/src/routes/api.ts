import { Hono } from 'hono';
import { Database } from '../db';
import { authenticateUser, validateSession } from '../auth';

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
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

  const result = await authenticateUser(db, body.initData, botToken);
  if (!result.success) return c.json({ error: result.error }, 401);

  return c.json({
    success: true,
    user_id: result.user_id,
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
  const user = await database.users.findById(result.user_id!);
  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({ user });
});

// Users routes

apiRoutes.get('/users', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const users = await database.users.list(limit, offset);
  const total = await database.users.count();

  return c.json({ users, total, limit, offset });
});

apiRoutes.get('/users/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const user = await database.users.findById(c.req.param('id'));
  if (!user) return c.json({ error: 'User not found' }, 404);

  return c.json({ user });
});

// Chats routes

apiRoutes.get('/chats/:userId', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const limit = parseInt(c.req.query('limit') || '50', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);

  const messages = await database.chats.findByUserId(c.req.param('userId'), limit, offset);
  return c.json({ messages });
});

// Categories routes

apiRoutes.get('/categories', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const categories = await database.categories.list();

  return c.json({ categories });
});

apiRoutes.post('/categories', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const category = await database.categories.create(body);

  return c.json({ category }, 201);
});

apiRoutes.put('/categories/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const category = await database.categories.update(id, body);
  if (!category) return c.json({ error: 'Not found' }, 404);

  return c.json({ category });
});

apiRoutes.delete('/categories/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
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

  let items;
  if (search) {
    items = await database.products.search(search);
  } else if (categoryId) {
    items = await database.products.listByCategory(Number(categoryId));
  } else {
    items = await database.products.listActive();
  }

  return c.json({ items, total: items.length });
});

apiRoutes.get('/products/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const product = await database.products.getById(Number(c.req.param('id')));
  if (!product) return c.json({ error: 'Not found' }, 404);

  return c.json({ product });
});

apiRoutes.post('/products', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const product = await database.products.create(body);

  return c.json({ product }, 201);
});

apiRoutes.put('/products/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const product = await database.products.update(id, body);
  if (!product) return c.json({ error: 'Not found' }, 404);

  return c.json({ product });
});

apiRoutes.delete('/products/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.products.delete(id);

  return c.json({ deleted });
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

apiRoutes.post('/designs', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const design = await database.designs.create(body);

  return c.json({ design }, 201);
});

apiRoutes.put('/designs/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const design = await database.designs.update(id, body);
  if (!design) return c.json({ error: 'Not found' }, 404);

  return c.json({ design });
});

apiRoutes.delete('/designs/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.designs.delete(id);

  return c.json({ deleted });
});

// Variants routes

apiRoutes.get('/variants', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const productId = c.req.query('product_id');
  const inStock = c.req.query('in_stock');

  let items;
  if (productId) {
    items = await database.variants.listByProduct(Number(productId));
  } else if (inStock === 'true') {
    items = await database.variants.listInStock();
  } else {
    items = await database.variants.list();
  }

  return c.json({ items, total: items.length });
});

apiRoutes.get('/variants/:slug', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const variant = await database.variants.getBySlug(c.req.param('slug'));
  if (!variant) return c.json({ error: 'Not found' }, 404);

  return c.json({ variant });
});

apiRoutes.post('/variants', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);

  // Fetch product and category for slug generation
  const product = await database.products.getById(body.product_id);
  if (!product) return c.json({ error: 'Product not found' }, 404);

  const category = await database.categories.getById(product.category_id);
  const categoryName = category?.name || '';
  const productName = product.name;

  const variant = await database.variants.create(body, categoryName, productName);

  return c.json({ variant }, 201);
});

apiRoutes.put('/variants/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);

  const variant = await database.variants.getById(id);
  if (!variant) return c.json({ error: 'Not found' }, 404);

  // Get product and category names for slug regeneration
  const product = await database.products.getById(variant.product_id);
  const category = product ? await database.categories.getById(product.category_id) : null;

  const updated = await database.variants.update(id, body, category?.name, product?.name);

  return c.json({ variant: updated });
});

apiRoutes.delete('/variants/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.variants.delete(id);

  return c.json({ deleted });
});

// Colors routes

apiRoutes.get('/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.colors.list();

  return c.json({ items, total: items.length });
});

apiRoutes.get('/colors/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const item = await database.colors.getById(Number(c.req.param('id')));
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.post('/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.colors.create(body);

  return c.json({ item }, 201);
});

apiRoutes.put('/colors/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.colors.update(id, body);
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.delete('/colors/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.colors.delete(id);

  return c.json({ deleted });
});

// Sizes routes

apiRoutes.get('/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const items = await database.sizes.list();

  return c.json({ items, total: items.length });
});

apiRoutes.get('/sizes/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const item = await database.sizes.getById(Number(c.req.param('id')));
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.post('/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.sizes.create(body);

  return c.json({ item }, 201);
});

apiRoutes.put('/sizes/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const database = new Database(db);
  const item = await database.sizes.update(id, body);
  if (!item) return c.json({ error: 'Not found' }, 404);

  return c.json({ item });
});

apiRoutes.delete('/sizes/:id', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const id = Number(c.req.param('id'));
  const database = new Database(db);
  const deleted = await database.sizes.delete(id);

  return c.json({ deleted });
});

// Variant Relations routes

apiRoutes.get('/variants/:id/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const colorIds = await database.variantRelations.getColorsByVariant(Number(c.req.param('id')));
  const colors = await Promise.all(colorIds.map((id) => database.colors.getById(id)));

  return c.json({ colors: colors.filter(Boolean) });
});

apiRoutes.put('/variants/:id/colors', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const variantId = Number(c.req.param('id'));
  const body = await c.req.json<{ color_ids: number[] }>();
  const database = new Database(db);

  await database.variantRelations.setColors(variantId, body.color_ids || []);

  return c.json({ success: true });
});

apiRoutes.get('/variants/:id/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const sizeIds = await database.variantRelations.getSizesByVariant(Number(c.req.param('id')));
  const sizes = await Promise.all(sizeIds.map((id) => database.sizes.getById(id)));

  return c.json({ sizes: sizes.filter(Boolean) });
});

apiRoutes.put('/variants/:id/sizes', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const variantId = Number(c.req.param('id'));
  const body = await c.req.json<{ size_ids: number[] }>();
  const database = new Database(db);

  await database.variantRelations.setSizes(variantId, body.size_ids || []);

  return c.json({ success: true });
});
