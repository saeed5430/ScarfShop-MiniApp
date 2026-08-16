import { Hono } from 'hono';
import { authenticateCustomer, validateSession } from '../auth';
import { Database } from '../db';

type Bindings = {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
};

export const authRoutes = new Hono<{ Bindings: Bindings }>();

// Telegram Login - verifies initData and creates/extends session
authRoutes.post('/login', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.TELEGRAM_BOT_TOKEN;

  if (!db) return c.json({ error: 'Database not configured' }, 500);
  if (!botToken) return c.json({ error: 'Bot token not configured' }, 500);

  const body = await c.req.json<{ initData: string }>();
  if (!body.initData) {
    return c.json({ error: 'initData is required' }, 400);
  }

  const result = await authenticateCustomer(db, body.initData, botToken);

  if (!result.success) {
    return c.json({ error: result.error }, 401);
  }

  return c.json({
    success: true,
    customer_id: result.customer_id,
    session_token: result.session_token,
  });
});

// Get current customer info
authRoutes.get('/me', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ error: 'Token required' }, 401);

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ error: result.error }, 401);

  const database = new Database(db);
  const customer = await database.customers.findById(result.customer_id!);

  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  return c.json({ customer });
});

// Check if customer is admin
authRoutes.get('/is-admin', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ is_admin: false });

  const result = await validateSession(db, token);
  if (!result.valid) return c.json({ is_admin: false });

  const database = new Database(db);
  const admin = await database.admins.findByCustomerId(result.customer_id!);

  return c.json({ is_admin: admin !== null });
});

// Update customer profile
authRoutes.put('/profile', async (c) => {
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

  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  return c.json({ customer });
});

// Logout - delete session
authRoutes.post('/logout', async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: 'Database not configured' }, 500);

  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return c.json({ success: true });

  const database = new Database(db);
  const session = await database.sessions.findByToken(token);

  if (session) {
    await database.sessions.delete(session.session_id);
  }

  return c.json({ success: true });
});
