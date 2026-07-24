import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { Database } from '../db';
import { TOKEN_EXPIRY, getJwtSecret } from '../config';
import { verifyPassword, needsRehash, hashPassword } from '../utils/password';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

export const adminAuthRoutes = new Hono<{ Bindings: Bindings }>();

// Admin login - accepts email/username + password
adminAuthRoutes.post('/login', async (c) => {
  const db = c.env.DB;
  const JWT_SECRET = getJwtSecret(c.env);

  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'ایمیل/یوزرنیم و رمز عبور الزامی هستند' }, 400);
  }

  const emailLower = email.toLowerCase().trim();
  const database = new Database(db);

  // Find admin by email or username
  let admin = await database.admins.findByEmail(emailLower);
  if (!admin) {
    admin = await database.admins.findByUsername(emailLower);
  }

  if (!admin) {
    return c.json({ error: 'ایمیل/یوزرنیم یا رمز عبور اشتباه است' }, 401);
  }

  // Verify password
  if (!admin.password_hash) {
    // Admin has no password set - this shouldn't happen in production
    return c.json({ error: 'رمز عبور تنظیم نشده است' }, 401);
  }

  const isValidPassword = await verifyPassword(password, admin.password_hash);

  if (!isValidPassword) {
    return c.json({ error: 'ایمیل/یوزرنیم یا رمز عبور اشتباه است' }, 401);
  }

  // If password hash needs updating (e.g., was plain text), rehash it
  if (needsRehash(admin.password_hash)) {
    const newHash = await hashPassword(password);
    await database.admins.update(admin.id, { password_hash: newHash });
  }

  // Generate JWT token with 30 min expiry
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: admin.id,
    adminId: admin.id,
    username: admin.username,
    email: admin.email,
    role: 'admin',
    type: 'admin',
    iat: now,
    exp: now + TOKEN_EXPIRY,
  };

  const token = await sign(payload, JWT_SECRET, 'HS256');

  return c.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      first_name: admin.first_name,
      last_name: admin.last_name,
    },
    expires_in: TOKEN_EXPIRY,
  });
});

// Verify admin token endpoint
adminAuthRoutes.post('/verify', async (c) => {
  const JWT_SECRET = getJwtSecret(c.env);
  const body = await c.req.json<{ token: string }>();
  const { token } = body;

  if (!token) {
    return c.json({ valid: false, error: 'توکن ارائه نشده' }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');

    if (payload.type !== 'admin' || payload.role !== 'admin') {
      return c.json({ valid: false, error: 'توکن نامعتبر' }, 401);
    }

    return c.json({ valid: true, admin: payload });
  } catch {
    return c.json({ valid: false, error: 'توکن منقضی یا نامعتبر' }, 401);
  }
});

// Logout endpoint (client-side token removal)
adminAuthRoutes.post('/logout', async (c) => {
  return c.json({ success: true, message: 'توکن حذف شد' });
});

// Change password endpoint (requires current JWT)
adminAuthRoutes.post('/change-password', async (c) => {
  const db = c.env.DB;
  const JWT_SECRET = getJwtSecret(c.env);

  if (!db) return c.json({ error: 'Database not configured' }, 500);

  // Verify JWT
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'توکن ارائه نشده' }, 401);
  }

  const token = authHeader.slice(7);
  let payload;
  try {
    payload = await verify(token, JWT_SECRET, 'HS256');
    if (payload.type !== 'admin' || payload.role !== 'admin') {
      return c.json({ error: 'دسترسی غیرمجاز' }, 403);
    }
  } catch {
    return c.json({ error: 'توکن منقضی یا نامعتبر' }, 401);
  }

  const body = await c.req.json<{ currentPassword: string; newPassword: string }>();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'رمز عبور فعلی و جدید الزامی هستند' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' }, 400);
  }

  const database = new Database(db);
  const admin = await database.admins.getById(payload.adminId as string);

  if (!admin || !admin.password_hash) {
    return c.json({ error: 'ادمین یافت نشد' }, 404);
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, admin.password_hash);
  if (!isValid) {
    return c.json({ error: 'رمز عبور فعلی اشتباه است' }, 401);
  }

  // Hash new password
  const newHash = await hashPassword(newPassword);
  await database.admins.update(admin.id, { password_hash: newHash });

  return c.json({ success: true, message: 'رمز عبور با موفقیت تغییر کرد' });
});
