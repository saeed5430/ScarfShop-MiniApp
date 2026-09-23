import { Hono } from 'hono';
import { BaleDB } from './bale-db';
import { BaleAdminDB } from './bale-admin-db';
import { requireBaleAdmin } from './bale-admin-auth';
import { hashBalePassword } from './bale-password';

type Bindings = {
  BALE_DB: D1Database;
  BALE_ORDER_BOT_TOKEN: string;
  JWT_SECRET: string;
};

export const baleAdminRoutes = new Hono<{ Bindings: Bindings }>();

baleAdminRoutes.use('*', requireBaleAdmin);

baleAdminRoutes.get('/stats', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  return c.json(await new BaleAdminDB(db).getStats());
});

baleAdminRoutes.get('/categories', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const categories = await new BaleDB(db).listCategories();
  return c.json({ categories, total: categories.length });
});

baleAdminRoutes.post('/categories', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name: string; slug?: string | null }>().catch(() => null);
  if (!body?.name?.trim()) return c.json({ error: 'name is required' }, 400);
  const category = await new BaleAdminDB(db).createCategory({ name: body.name.trim(), slug: body.slug ?? null });
  return c.json({ category }, 201);
});

baleAdminRoutes.put('/categories/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name?: string; slug?: string | null }>().catch(() => ({}));
  const category = await new BaleAdminDB(db).updateCategory(Number(c.req.param('id')), body);
  if (!category) return c.json({ error: 'Not found' }, 404);
  return c.json({ category });
});

baleAdminRoutes.delete('/categories/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  try {
    const deleted = await new BaleAdminDB(db).deleteCategory(Number(c.req.param('id')));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ deleted: true });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Delete failed' }, 400);
  }
});

baleAdminRoutes.get('/products', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const items = await new BaleAdminDB(db).listProductsAdmin();
  return c.json({ items, total: items.length });
});

baleAdminRoutes.get('/products/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const product = await new BaleAdminDB(db).getProductAdmin(Number(c.req.param('id')));
  if (!product) return c.json({ error: 'Not found' }, 404);
  return c.json({ product });
});

baleAdminRoutes.post('/products', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<Parameters<BaleAdminDB['createProduct']>[0]>().catch(() => null);
  if (!body?.name?.trim()) return c.json({ error: 'name is required' }, 400);
  const product = await new BaleAdminDB(db).createProduct({ ...body, name: body.name.trim() });
  return c.json({ product }, 201);
});

baleAdminRoutes.put('/products/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<Parameters<BaleAdminDB['updateProduct']>[1]>().catch(() => ({}));
  const product = await new BaleAdminDB(db).updateProduct(Number(c.req.param('id')), body);
  if (!product) return c.json({ error: 'Not found' }, 404);
  return c.json({ product });
});

baleAdminRoutes.delete('/products/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const ok = await new BaleAdminDB(db).setProductActive(Number(c.req.param('id')), false);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true });
});

baleAdminRoutes.put('/products/:id/restore', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const ok = await new BaleAdminDB(db).setProductActive(Number(c.req.param('id')), true);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ restored: true });
});

baleAdminRoutes.get('/colors', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const { results } = await db.prepare('SELECT * FROM colors ORDER BY name ASC').all<Record<string, unknown>>();
  return c.json({ items: results, total: results.length });
});

baleAdminRoutes.post('/colors', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name: string; name_en?: string; hex?: string }>().catch(() => null);
  if (!body?.name?.trim()) return c.json({ error: 'name is required' }, 400);
  const item = await new BaleAdminDB(db).createColor({ name: body.name.trim(), name_en: body.name_en, hex: body.hex });
  return c.json({ item }, 201);
});

baleAdminRoutes.put('/colors/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name?: string; name_en?: string; hex?: string }>().catch(() => ({}));
  const item = await new BaleAdminDB(db).updateColor(Number(c.req.param('id')), body);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json({ item });
});

baleAdminRoutes.delete('/colors/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  try {
    const deleted = await new BaleAdminDB(db).deleteColor(Number(c.req.param('id')));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ deleted: true });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Delete failed' }, 400);
  }
});

baleAdminRoutes.get('/sizes', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const { results } = await db.prepare('SELECT * FROM sizes ORDER BY dimensions ASC').all<Record<string, unknown>>();
  return c.json({ items: results, total: results.length });
});

baleAdminRoutes.post('/sizes', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ dimensions: string }>().catch(() => null);
  if (!body?.dimensions?.trim()) return c.json({ error: 'dimensions is required' }, 400);
  const item = await new BaleAdminDB(db).createSize({ dimensions: body.dimensions.trim() });
  return c.json({ item }, 201);
});

baleAdminRoutes.put('/sizes/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ dimensions?: string }>().catch(() => ({}));
  const item = await new BaleAdminDB(db).updateSize(Number(c.req.param('id')), body);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json({ item });
});

baleAdminRoutes.delete('/sizes/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  try {
    const deleted = await new BaleAdminDB(db).deleteSize(Number(c.req.param('id')));
    if (!deleted) return c.json({ error: 'Not found' }, 404);
    return c.json({ deleted: true });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Delete failed' }, 400);
  }
});

baleAdminRoutes.get('/designs', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const { results } = await db.prepare('SELECT * FROM designs ORDER BY name ASC').all<Record<string, unknown>>();
  return c.json({ items: results, total: results.length });
});

baleAdminRoutes.post('/designs', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name: string; name_en?: string }>().catch(() => null);
  if (!body?.name?.trim()) return c.json({ error: 'name is required' }, 400);
  const item = await new BaleAdminDB(db).createDesign({ name: body.name.trim(), name_en: body.name_en });
  return c.json({ item }, 201);
});

baleAdminRoutes.put('/designs/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ name?: string; name_en?: string }>().catch(() => ({}));
  const item = await new BaleAdminDB(db).updateDesign(Number(c.req.param('id')), body);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json({ item });
});

baleAdminRoutes.delete('/designs/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const deleted = await new BaleAdminDB(db).deleteDesign(Number(c.req.param('id')));
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true });
});

baleAdminRoutes.get('/variants', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const productId = c.req.query('product_id');
  const items = await new BaleAdminDB(db).listVariantsAdmin(productId ? Number(productId) : undefined);
  return c.json({ items, total: items.length });
});

baleAdminRoutes.get('/variants/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const variant = await new BaleAdminDB(db).getVariantAdmin(Number(c.req.param('id')));
  if (!variant) return c.json({ error: 'Not found' }, 404);
  return c.json({ variant });
});

baleAdminRoutes.post('/variants', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<Parameters<BaleAdminDB['createVariant']>[0]>().catch(() => null);
  if (!body?.product_id) return c.json({ error: 'product_id is required' }, 400);
  const variant = await new BaleAdminDB(db).createVariant(body);
  return c.json({ variant }, 201);
});

baleAdminRoutes.put('/variants/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<Parameters<BaleAdminDB['updateVariant']>[1]>().catch(() => ({}));
  const variant = await new BaleAdminDB(db).updateVariant(Number(c.req.param('id')), body);
  if (!variant) return c.json({ error: 'Not found' }, 404);
  return c.json({ variant });
});

baleAdminRoutes.delete('/variants/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const deleted = await new BaleAdminDB(db).deleteVariant(Number(c.req.param('id')));
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true });
});

baleAdminRoutes.get('/users', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
  const offset = Number(c.req.query('offset') ?? 0);
  const { users, total } = await new BaleAdminDB(db).listUsersAdmin(limit, offset, c.req.query('search'));
  return c.json({ users, total });
});

baleAdminRoutes.get('/orders', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
  const offset = Number(c.req.query('offset') ?? 0);
  const { orders, total } = await new BaleAdminDB(db).listOrdersAdmin(limit, offset);
  return c.json({ orders, total });
});

baleAdminRoutes.get('/orders/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const { order, items } = await new BaleAdminDB(db).getOrderAdmin(Number(c.req.param('id')));
  if (!order) return c.json({ error: 'Not found' }, 404);
  return c.json({ order, items });
});

baleAdminRoutes.put('/orders/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ payment_status?: string; delivery_method?: string | null; notes?: string | null }>().catch(() => ({}));
  try {
    const order = await new BaleAdminDB(db).updateOrderAdmin(Number(c.req.param('id')), body);
    if (!order) return c.json({ error: 'Not found' }, 404);
    return c.json({ order });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : 'Update failed' }, 400);
  }
});

baleAdminRoutes.delete('/orders/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const deleted = await new BaleAdminDB(db).deleteOrderAdmin(Number(c.req.param('id')));
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true, message: 'سفارش با موفقیت حذف شد' });
});

baleAdminRoutes.get('/orders/:id/receipt', async (c) => {
  const db = c.env.BALE_DB;
  const botToken = c.env.BALE_ORDER_BOT_TOKEN;
  if (!db || !botToken) return c.json({ error: 'Receipt service not configured' }, 500);
  const type = c.req.query('type') === 'voice' ? 'voice' : 'invoice';
  const fileId = await new BaleAdminDB(db).getOrderReceiptFileId(Number(c.req.param('id')), type);
  if (!fileId) return c.json({ error: 'File not uploaded' }, 404);
  const fileResponse = await fetch(`https://tapi.bale.ai/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const fileData = await fileResponse.json<{ ok?: boolean; result?: { file_path?: string } }>().catch(() => null);
  if (!fileData?.ok || !fileData.result?.file_path) return c.json({ error: 'File unavailable' }, 404);
  const mediaResponse = await fetch(`https://tapi.bale.ai/file/bot${botToken}/${fileData.result.file_path}`);
  if (!mediaResponse.ok || !mediaResponse.body) return c.json({ error: 'File unavailable' }, 404);
  return new Response(mediaResponse.body, {
    headers: {
      'Content-Type': mediaResponse.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'private, max-age=300',
    },
  });
});

baleAdminRoutes.get('/admins', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const admins = await new BaleAdminDB(db).listAdmins();
  return c.json({ admins, total: admins.length });
});

baleAdminRoutes.post('/admins', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ username: string; email: string; first_name: string; last_name?: string | null; password: string }>().catch(() => null);
  if (!body?.username?.trim() || !body?.email?.trim() || !body?.first_name?.trim() || !body?.password) {
    return c.json({ error: 'username, email, first_name, password are required' }, 400);
  }
  if (body.password.length < 6) return c.json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, 400);
  const existing = await new BaleAdminDB(db).findAdminByEmail(body.email.toLowerCase().trim());
  if (existing) return c.json({ error: 'ایمیل تکراری است' }, 400);
  const admin = await new BaleAdminDB(db).createAdmin({
    username: body.username.trim(),
    email: body.email.toLowerCase().trim(),
    first_name: body.first_name.trim(),
    last_name: body.last_name ?? null,
    password_hash: await hashBalePassword(body.password),
  });
  if (!admin) return c.json({ error: 'Create failed' }, 500);
  const { password_hash: _ph, ...safe } = admin;
  return c.json({ admin: safe }, 201);
});

baleAdminRoutes.put('/admins/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ username?: string; email?: string; first_name?: string; last_name?: string | null; password?: string }>().catch((): { username?: string; email?: string; first_name?: string; last_name?: string | null; password?: string } => ({}));
  const input: Parameters<BaleAdminDB['updateAdmin']>[1] = {};
  if (body.username !== undefined) input.username = body.username;
  if (body.email !== undefined) input.email = body.email.toLowerCase().trim();
  if (body.first_name !== undefined) input.first_name = body.first_name;
  if (body.last_name !== undefined) input.last_name = body.last_name;
  if (body.password) {
    if (body.password.length < 6) return c.json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, 400);
    input.password_hash = await hashBalePassword(body.password);
  }
  const admin = await new BaleAdminDB(db).updateAdmin(c.req.param('id'), input);
  if (!admin) return c.json({ error: 'Not found' }, 404);
  const { password_hash: _ph, ...safe } = admin;
  return c.json({ admin: safe });
});

baleAdminRoutes.delete('/admins/:id', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const deleted = await new BaleAdminDB(db).deleteAdmin(c.req.param('id'));
  if (!deleted) return c.json({ error: 'Not found' }, 404);
  return c.json({ deleted: true });
});

baleAdminRoutes.get('/settings', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const settings = await new BaleDB(db).listSettings();
  return c.json({ settings });
});

baleAdminRoutes.put('/settings/bulk', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  const body = await c.req.json<{ items: { key: string; value: string }[] }>().catch(() => null);
  if (!body?.items || !Array.isArray(body.items)) return c.json({ error: 'items is required' }, 400);
  const settings = await new BaleAdminDB(db).bulkUpdateSettings(body.items);
  return c.json({ settings });
});
