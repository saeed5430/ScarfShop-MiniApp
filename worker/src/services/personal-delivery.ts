import type { D1Database } from '@cloudflare/workers-types';
import { Database } from '../db';
import type { Order } from '../db';
import { serviceRequest } from './telegram-user';

export interface PersonalDeliveryEnv {
  DB: D1Database;
  TELEGRAM_USER_SERVICE_URL?: string;
  TELEGRAM_USER_SERVICE_TOKEN?: string;
}

export async function isPersonalReady(db: D1Database, adminTelegramId: string): Promise<boolean> {
  try {
    const account = await new Database(db).telegramAccounts.get(adminTelegramId);
    return Boolean(account && account.personal_sending_enabled && account.status === 'connected');
  } catch {
    return false;
  }
}

function targetForCustomer(username: string | null | undefined, userId: string): string {
  if (username && /^[a-zA-Z0-9_]{5,32}$/.test(username)) {
    return `@${username}`;
  }
  return userId;
}

async function fetchTelegramFileBytes(botToken: string, fileId: string): Promise<{ bytes: ArrayBuffer; fileName: string } | null> {
  try {
    const fileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const fileData = (await fileResponse.json()) as { ok?: boolean; result?: { file_path?: string } };
    if (!fileData.ok || !fileData.result?.file_path) return null;
    const mediaResponse = await fetch(`https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`);
    if (!mediaResponse.ok) return null;
    const bytes = await mediaResponse.arrayBuffer();
    const fileName = fileData.result.file_path.split('/').at(-1) || 'order-file';
    return { bytes, fileName };
  } catch {
    return null;
  }
}

export async function sendReceiptViaPersonal(
  env: PersonalDeliveryEnv,
  adminTelegramId: string,
  order: Order,
  kind: 'photo' | 'voice',
  fileId: string,
  orderBotToken: string,
): Promise<boolean> {
  try {
    if (!env.TELEGRAM_USER_SERVICE_URL || !env.TELEGRAM_USER_SERVICE_TOKEN) return false;
    const database = new Database(env.DB);
    const account = await database.telegramAccounts.get(adminTelegramId);
    if (!account || !account.personal_sending_enabled || account.status !== 'connected') return false;

    const customer = await database.customers.findById(order.customer_id);
    const target = customer ? targetForCustomer(customer.username, order.customer_id) : order.customer_id;
    const caption = kind === 'photo'
      ? `🧾 فاکتور سفارش #${order.id}`
      : `🎙️ توضیحات سفارش #${order.id}`;

    const fetched = await fetchTelegramFileBytes(orderBotToken, fileId);
    if (!fetched) return false;

    const form = new FormData();
    form.set('kind', kind);
    form.set('target', target);
    form.set('caption', caption);
    const mediaType = kind === 'photo' ? 'image/jpeg' : 'audio/ogg';
    form.set('file', new File([fetched.bytes], `${fetched.fileName || `order-${order.id}`}.${kind === 'photo' ? 'jpg' : 'ogg'}`, { type: mediaType }));

    await serviceRequest(env, adminTelegramId, '/api/send', { method: 'POST', body: form });
    return true;
  } catch {
    return false;
  }
}

export async function sendTextViaPersonal(
  env: PersonalDeliveryEnv,
  adminTelegramId: string,
  order: Order,
  text: string,
): Promise<boolean> {
  try {
    if (!env.TELEGRAM_USER_SERVICE_URL || !env.TELEGRAM_USER_SERVICE_TOKEN) return false;
    const database = new Database(env.DB);
    const account = await database.telegramAccounts.get(adminTelegramId);
    if (!account || !account.personal_sending_enabled || account.status !== 'connected') return false;

    const customer = await database.customers.findById(order.customer_id);
    const target = customer ? targetForCustomer(customer.username, order.customer_id) : order.customer_id;
    await serviceRequest(env, adminTelegramId, '/api/send', {
      method: 'POST',
      body: JSON.stringify({ kind: 'text', target, text }),
    });
    return true;
  } catch {
    return false;
  }
}