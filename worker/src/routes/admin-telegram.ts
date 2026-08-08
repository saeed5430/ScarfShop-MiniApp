import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { Database } from '../db';
import type { AdminTelegramAccount, TelegramAccountStatus } from '../db';
import {
  isConfigured,
  reasonForStatus,
  serviceRequest,
  syncAccountFromService,
  TelegramUserServiceError,
} from '../services/telegram-user';

type Bindings = {
  DB: D1Database;
  TELEGRAM_USER_SERVICE_URL?: string;
  TELEGRAM_USER_SERVICE_TOKEN?: string;
};

interface AdminSession {
  adminId?: string;
  username?: string;
  role?: string;
  type?: string;
}

function telegramIdForUsername(username: string): string | null {
  const map: Record<string, string> = {
    saeed54300: '6451725218',
    abdollahisz: '6586804580',
  };
  return map[username] ?? null;
}

function adminTelegramId(admin: AdminSession): string {
  return telegramIdForUsername(admin.username ?? '') ?? admin.adminId ?? admin.username ?? 'unknown';
}

export const adminTelegramRoutes = new Hono<{ Bindings: Bindings }>();

function getAdmin(c: { get: (key: string) => unknown }): AdminSession | null {
  const admin = c.get('admin');
  if (admin !== null && admin !== undefined && typeof admin === 'object') {
    return admin as AdminSession;
  }
  return null;
}

function requireConfigured(c: { env: Bindings }): void {
  if (!isConfigured(c.env)) {
    throw new TelegramUserServiceError(503, 'SERVICE_NOT_CONFIGURED', 'سرویس ارسال شخصی (telegram-user-service) پیکربندی نشده است');
  }
}

async function localAccount(db: D1Database, adminId: string): Promise<AdminTelegramAccount | null> {
  return new Database(db).telegramAccounts.get(adminId);
}

type StatusDetail = {
  status: TelegramAccountStatus;
  account: AdminTelegramAccount | null;
  clearError: boolean;
};

async function refreshStatus(db: D1Database, env: Bindings, adminId: string): Promise<StatusDetail> {
  if (isConfigured(env)) {
    try {
      const account = await syncAccountFromService(db, env, adminId);
      return { status: account?.status ?? 'not_connected', account, clearError: true };
    } catch {
      // If the service is unreachable, fall back to the locally stored row.
    }
  }
  const account = await localAccount(db, adminId);
  return { status: account?.status ?? 'not_connected', account, clearError: false };
}

// GET /telegram/status
adminTelegramRoutes.get('/telegram/status', async (c) => {
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const telegramId = adminTelegramId(admin);
  const { status, account } = await refreshStatus(c.env.DB, c.env, telegramId);
  return c.json({
    admin: { id: telegramId, username: admin.username ?? '' },
    account,
    status,
    statusLabel: reasonForStatus(status),
  });
});

// GET /telegram/accounts - list all admin accounts (read-only)
adminTelegramRoutes.get('/telegram/accounts', async (c) => {
  const items = await new Database(c.env.DB).telegramAccounts.list();
  return c.json({ items });
});

// POST /telegram/connect/start
adminTelegramRoutes.post('/telegram/connect/start', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { phone?: string };
  const phone = String(body.phone ?? '').trim();
  if (!phone) return c.json({ error: 'phone لازم است' }, 400);
  const result = await serviceRequest(c.env, adminTelegramId(admin), '/api/connect/start', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return c.json(result);
});

// POST /telegram/connect/code
adminTelegramRoutes.post('/telegram/connect/code', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { code?: string };
  const code = String(body.code ?? '').trim();
  if (!code) return c.json({ error: 'code لازم است' }, 400);
  const telegramId = adminTelegramId(admin);
  const result = await serviceRequest<{ needPassword?: boolean } | { user?: unknown }>(c.env, telegramId, '/api/connect/code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  if (!('needPassword' in result)) {
    await refreshStatus(c.env.DB, c.env, telegramId);
  }
  return c.json(result);
});

// POST /telegram/connect/password
adminTelegramRoutes.post('/telegram/connect/password', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { password?: string };
  const password = String(body.password ?? '');
  if (!password) return c.json({ error: 'رمز لازم است' }, 400);
  const telegramId = adminTelegramId(admin);
  await serviceRequest(c.env, telegramId, '/api/connect/password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  await refreshStatus(c.env.DB, c.env, telegramId);
  return c.json({ ok: true });
});

// POST /telegram/connect/cancel
adminTelegramRoutes.post('/telegram/connect/cancel', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  await serviceRequest(c.env, adminTelegramId(admin), '/api/connect/cancel', { method: 'POST' });
  return c.json({ ok: true });
});

// POST /telegram/disconnect
adminTelegramRoutes.post('/telegram/disconnect', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const telegramId = adminTelegramId(admin);
  await serviceRequest(c.env, telegramId, '/api/disconnect', { method: 'POST' });
  await new Database(c.env.DB).telegramAccounts.upsert(telegramId, {
    status: 'not_connected',
    session_ref: null,
    last_error: null,
  });
  return c.json({ ok: true });
});

// PATCH /telegram/settings
adminTelegramRoutes.patch('/telegram/settings', async (c) => {
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { personal_sending_enabled?: unknown };
  if (typeof body.personal_sending_enabled !== 'boolean') {
    return c.json({ error: 'personal_sending_enabled باید بولین باشد' }, 400);
  }
  if (body.personal_sending_enabled) {
    requireConfigured(c);
  }
  const database = new Database(c.env.DB);
  const telegramId = adminTelegramId(admin);
  const row = await database.telegramAccounts.setEnabled(telegramId, body.personal_sending_enabled);
  return c.json({ ok: true, account: row });
});

// POST /telegram/test
adminTelegramRoutes.post('/telegram/test', async (c) => {
  requireConfigured(c);
  const admin = getAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 403);
  const body = (await c.req.json().catch(() => ({}))) as { target?: string; text?: string };
  const target = String(body.target ?? '').trim();
  const text = String(body.text ?? '').trim() || 'تست ارسال پیام شخصی ✅';
  if (!target) return c.json({ error: 'target لازم است' }, 400);
  const result = await serviceRequest(c.env, adminTelegramId(admin), '/api/send', {
    method: 'POST',
    body: JSON.stringify({ kind: 'text', target, text }),
  });
  return c.json(result);
});

adminTelegramRoutes.onError((err: Error, c) => {
  if (err instanceof TelegramUserServiceError) {
    const status = err.status as 400 | 401 | 403 | 404 | 409 | 503;
    return c.json({ error: err.code, message: err.message }, status);
  }
  return c.json({ error: 'INTERNAL_ERROR', message: err.message || 'خطای ناشناخته' }, 500);
});