import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { BaleAdminDB } from './bale-admin-db';
import { hashBalePassword, needsBaleRehash, verifyBalePassword } from './bale-password';

type Bindings = {
  BALE_DB: D1Database;
  JWT_SECRET: string;
};

const TOKEN_EXPIRY = 60 * 30;

export const baleAdminAuthRoutes = new Hono<{ Bindings: Bindings }>();

baleAdminAuthRoutes.post('/login', async (c) => {
  const db = c.env.BALE_DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);
  if (!c.env.JWT_SECRET) return c.json({ error: 'JWT secret not configured' }, 500);

  const body = await c.req.json<{ email: string; password: string }>().catch(() => null);
  const email = body?.email?.toLowerCase().trim() ?? '';
  const password = body?.password ?? '';
  if (!email || !password) return c.json({ error: 'ایمیل و رمز عبور الزامی هستند' }, 400);

  const adminDb = new BaleAdminDB(db);
  let admin = await adminDb.findAdminByEmail(email);
  if (!admin) admin = await adminDb.findAdminByUsername(email);
  if (!admin) return c.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, 401);
  if (!admin.password_hash) return c.json({ error: 'رمز عبور تنظیم نشده است' }, 401);

  const valid = await verifyBalePassword(password, admin.password_hash);
  if (!valid) return c.json({ error: 'ایمیل یا رمز عبور اشتباه است' }, 401);

  if (needsBaleRehash(admin.password_hash)) {
    await adminDb.updateAdmin(admin.id, { password_hash: await hashBalePassword(password) });
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: admin.id, adminId: admin.id, username: admin.username, email: admin.email, role: 'admin', type: 'admin', iat: now, exp: now + TOKEN_EXPIRY },
    c.env.JWT_SECRET,
    'HS256'
  );

  return c.json({
    success: true,
    token,
    admin: { id: admin.id, username: admin.username, email: admin.email, first_name: admin.first_name, last_name: admin.last_name },
    expires_in: TOKEN_EXPIRY,
  });
});

baleAdminAuthRoutes.post('/verify', async (c) => {
  if (!c.env.JWT_SECRET) return c.json({ valid: false, error: 'JWT secret not configured' }, 500);
  const body = await c.req.json<{ token: string }>().catch(() => null);
  if (!body?.token) return c.json({ valid: false, error: 'توکن ارائه نشده' }, 401);
  try {
    const payload = await verify(body.token, c.env.JWT_SECRET, 'HS256') as { type?: string; role?: string };
    if (payload.type !== 'admin' || payload.role !== 'admin') return c.json({ valid: false, error: 'توکن نامعتبر' }, 401);
    return c.json({ valid: true, admin: payload });
  } catch {
    return c.json({ valid: false, error: 'توکن منقضی یا نامعتبر' }, 401);
  }
});

baleAdminAuthRoutes.post('/logout', async (c) => c.json({ success: true, message: 'توکن حذف شد' }));

export async function requireBaleAdmin(
  c: { env: Bindings; req: { header: (n: string) => string | undefined }; json: (o: object, s?: number) => Response; set: (k: string, v: unknown) => void },
  next: () => Promise<void>
) {
  if (!c.env.JWT_SECRET) return c.json({ error: 'JWT secret not configured' }, 500);
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'توکن ارائه نشده' }, 401);
  try {
    const payload = await verify(header.slice(7), c.env.JWT_SECRET, 'HS256') as { type?: string; role?: string };
    if (payload.type !== 'admin' || payload.role !== 'admin') return c.json({ error: 'دسترسی غیرمجاز' }, 403);
    c.set('admin', payload);
    await next();
  } catch {
    return c.json({ error: 'توکن منقضی یا نامعتبر' }, 401);
  }
}
