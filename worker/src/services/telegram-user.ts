import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../db';
import type { AdminTelegramAccount, TelegramAccountStatus } from '../db';

export interface TelegramUserEnv {
  TELEGRAM_USER_SERVICE_URL?: string;
  TELEGRAM_USER_SERVICE_TOKEN?: string;
}

export class TelegramUserServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TelegramUserServiceError';
    this.status = status;
    this.code = code;
  }
}

export function isConfigured(env: TelegramUserEnv): boolean {
  return Boolean(env.TELEGRAM_USER_SERVICE_URL && env.TELEGRAM_USER_SERVICE_TOKEN);
}

export async function serviceRequest<T>(
  env: TelegramUserEnv,
  adminId: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!env.TELEGRAM_USER_SERVICE_URL || !env.TELEGRAM_USER_SERVICE_TOKEN) {
    throw new TelegramUserServiceError(503, 'SERVICE_NOT_CONFIGURED', 'سرویس ارسال شخصی پیکربندی نشده است');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${env.TELEGRAM_USER_SERVICE_TOKEN}`);
  headers.set('X-Admin-Id', adminId);
  const response = await fetch(`${env.TELEGRAM_USER_SERVICE_URL}${path}`, {
    ...init,
    method: init.method ?? 'GET',
    headers,
  });
  const data = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || data === null) {
    const body = data as { error?: string; message?: string } | null;
    throw new TelegramUserServiceError(response.status, body?.error ?? 'SERVICE_ERROR', body?.message ?? response.statusText);
  }
  return data;
}

export async function syncAccountFromService(db: D1Database, env: TelegramUserEnv, adminId: string): Promise<AdminTelegramAccount | null> {
  const database = new Database(db);
  const status = await serviceRequest<{
    status: string;
    connected: boolean;
    lastError: string;
    hasSession: boolean;
    account: { telegramUserId?: string; username?: string; phone?: string; lastConnectedAt?: string } | null;
  }>(env, adminId, '/api/status');

  let accountStatus: TelegramAccountStatus;
  if (status.status === 'error') accountStatus = 'error';
  else if (status.status === 'revoked') accountStatus = 'revoked';
  else if (status.connected && status.hasSession) accountStatus = 'connected';
  else accountStatus = 'not_connected';

  const lastConnectedAt = status.account?.lastConnectedAt
    ? Math.floor(new Date(status.account.lastConnectedAt).getTime() / 1000)
    : null;

  const updated = await database.telegramAccounts.upsert(adminId, {
    status: accountStatus,
    telegram_user_id: status.account?.telegramUserId ?? null,
    username: status.account?.username ?? null,
    telegram_phone_masked: maskPhone(status.account?.phone),
    last_connected_at: accountStatus === 'connected' && lastConnectedAt !== null ? String(lastConnectedAt) : undefined,
    last_error: accountStatus === 'error' ? status.lastError || 'خطا در اتصال' : null,
  });
  return updated;
}

export function maskPhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  if (phone.length < 8) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-2)}`;
}

export function reasonForStatus(status: TelegramAccountStatus): string {
  switch (status) {
    case 'connected':
      return 'متصل';
    case 'disabled':
      return 'غیرفعال';
    case 'revoked':
      return 'نشست منقضی/باطل شده';
    case 'error':
      return 'خطا در اتصال';
    default:
      return 'متصل نیست';
  }
}