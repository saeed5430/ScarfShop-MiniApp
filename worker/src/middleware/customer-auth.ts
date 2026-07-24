import type { Context, Next } from 'hono';
import { validateSession } from '../auth';

type Bindings = {
  DB: D1Database;
};

export async function requireCustomer(c: Context, next: Next) {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'توکن ارائه نشده' }, 401);
  }

  const token = authHeader.slice(7);
  const result = await validateSession(db, token);

  if (!result.valid) {
    return c.json({ error: 'نشست نامعتبر یا منقضی شده' }, 401);
  }

  // Attach customer_id to context
  c.set('customer_id', result.customer_id);
  await next();
}
