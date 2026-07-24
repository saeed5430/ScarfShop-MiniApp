import { Hono } from 'hono';
import { Database } from '../db';
import { hashPassword } from '../utils/password';

type Bindings = {
  DB: D1Database;
};

export const setupRoutes = new Hono<{ Bindings: Bindings }>();

// Setup admin password (one-time use)
setupRoutes.post('/setup-admin', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const body = await c.req.json<{ email: string; password: string }>();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400);
  }

  const database = new Database(db);
  let admin = await database.admins.findByEmail(email.toLowerCase());
  if (!admin) {
    admin = await database.admins.findByUsername(email.toLowerCase());
  }

  if (!admin) {
    return c.json({ error: 'Admin not found' }, 404);
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Update the admin password
  await database.admins.update(admin.id, { password_hash: passwordHash });

  return c.json({
    success: true,
    message: 'Admin password updated successfully',
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  });
});

// List all admins (for debugging)
setupRoutes.get('/admins', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const database = new Database(db);
  const admins = await database.admins.list();

  // Don't expose password hashes
  const safeAdmins = admins.map(({ password_hash, ...rest }) => rest);

  return c.json({ admins: safeAdmins });
});
