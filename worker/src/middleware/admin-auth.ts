import type { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { JWT_SECRET } from '../config';

export async function requireAdmin(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'توکن ارائه نشده' }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    if ((payload as Record<string, unknown>).type !== 'admin') {
      return c.json({ error: 'دسترسی غیرمجاز' }, 403);
    }
    c.set('admin', payload);
    await next();
  } catch {
    return c.json({ error: 'توکن منقضی یا نامعتبر' }, 401);
  }
}
