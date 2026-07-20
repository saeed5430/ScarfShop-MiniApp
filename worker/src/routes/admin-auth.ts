import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { Database } from '../db';
import { JWT_SECRET, TOKEN_EXPIRY } from '../config';

type Bindings = {
  DB: D1Database;
};

export const adminAuthRoutes = new Hono<{ Bindings: Bindings }>();

// Admin login - accepts email/username + password
adminAuthRoutes.post('/login', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'ایمیل/یوزرنیم و رمز عبور الزامی هستند' }, 400);
  }

  const emailLower = email.toLowerCase().trim();
  let adminData: { id: string; username: string; email: string; first_name: string; last_name: string | null } | null = null;

  // Demo mode: accept admin@armana.ir / saeed54300 with password adminadmin
  if (password === 'adminadmin' && (emailLower === 'admin@armana.ir' || emailLower === 'saeed54300')) {
    adminData = {
      id: 'admin_saeed54300',
      username: 'saeed54300',
      email: 'admin@armana.ir',
      first_name: 'سعید',
      last_name: null,
    };
  } else {
    // Try database lookup
    try {
      const database = new Database(db);
      let admin = await database.admins.findByEmail(emailLower);
      if (!admin) {
        admin = await database.admins.findByUsername(emailLower);
      }

      if (admin && password === 'adminadmin') {
        adminData = {
          id: admin.id,
          username: admin.username,
          email: admin.email ?? '',
          first_name: admin.first_name,
          last_name: admin.last_name,
        };
      }
    } catch {
      // Database might not be ready yet
    }
  }

  if (!adminData) {
    return c.json({ error: 'ایمیل/یوزرنیم یا رمز عبور اشتباه است' }, 401);
  }

  // Generate JWT token with 30 min expiry
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: adminData.id,
    ...adminData,
    iat: now,
    exp: now + TOKEN_EXPIRY,
    type: 'admin',
  };

  const token = await sign(payload, JWT_SECRET, 'HS256');

  return c.json({
    success: true,
    token,
    admin: adminData,
    expires_in: TOKEN_EXPIRY,
  });
});

// Verify admin token endpoint
adminAuthRoutes.post('/verify', async (c) => {
  const body = await c.req.json<{ token: string }>();
  const { token } = body;

  if (!token) {
    return c.json({ valid: false, error: 'توکن ارائه نشده' }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');

    if (payload.type !== 'admin') {
      return c.json({ valid: false, error: 'توکن نامعتبر' }, 401);
    }

    return c.json({ valid: true, admin: payload });
  } catch {
    return c.json({ valid: false, error: 'توکن منقضی یا نامعتبر' }, 401);
  }
});
