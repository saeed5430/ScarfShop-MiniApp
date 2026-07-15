import { Hono } from 'hono';
import { Database } from '../db';

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

  // Demo mode: accept admin@armana.ir / saeed54300 with password adminadmin
  const emailLower = email.toLowerCase().trim();
  if (password === 'adminadmin' && (emailLower === 'admin@armana.ir' || emailLower === 'saeed54300')) {
    return c.json({
      success: true,
      token: crypto.randomUUID(),
      admin: {
        id: 'admin_saeed54300',
        username: 'saeed54300',
        email: 'admin@armana.ir',
        first_name: 'سعید',
        last_name: null,
      },
    });
  }

  // Try database lookup
  try {
    const database = new Database(db);
    let admin = await database.admins.findByEmail(emailLower);
    if (!admin) {
      admin = await database.admins.findByUsername(emailLower);
    }

    if (admin && password === 'adminadmin') {
      return c.json({
        success: true,
        token: crypto.randomUUID(),
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          first_name: admin.first_name,
          last_name: admin.last_name,
        },
      });
    }
  } catch {
    // Database might not be ready yet
  }

  return c.json({ error: 'ایمیل/یوزرنیم یا رمز عبور اشتباه است' }, 401);
});
