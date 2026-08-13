import type { D1Database } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { buildMiniAppButton, handleHelp, handleStart, handleUnknown } from '../bot';
import { Database } from '../db';
import type { Order } from '../db';
import { formatOrderMessage, orderActionKeyboard } from '../services/notify';
import {
  answerCallbackQuery,
  BALE_API,
  editMessageText,
  getFile,
  getFileDownloadUrl,
  sendMessage,
  setChatMenuButton,
  setWebhook,
  type BaleUpdate,
} from '../types';

type Bindings = {
  BALE_BOT_TOKEN: string;
  BALE_ORDER_NOTIFY_BOT_TOKEN: string;
  BASE_URL: string;
  MINI_APP_URL?: string;
  DB: D1Database;
  BALE_ADMIN_IDS?: string;
};

type EnrichedOrderItem = {
  product_name: string | null;
  category_name: string | null;
  color_name: string | null;
  color_hex: string | null;
  size_dimensions: string | null;
  quantity: number;
};

function parseAdminIds(env: Bindings): Set<string> {
  if (env.BALE_ADMIN_IDS) {
    return new Set(env.BALE_ADMIN_IDS.split(',').map(s => s.trim()).filter(Boolean));
  }
  return new Set<string>();
}

export const baleRoutes = new Hono<{ Bindings: Bindings }>();

async function getOrderItems(db: D1Database, orderId: number): Promise<EnrichedOrderItem[]> {
  const { results } = await db.prepare(`
    SELECT p.name AS product_name, c.name AS category_name,
           co.name AS color_name, co.hex AS color_hex,
           s.dimensions AS size_dimensions, oi.quantity
    FROM order_items oi
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN colors co ON co.id = oi.color_id
    LEFT JOIN sizes s ON s.id = oi.size_id
    WHERE oi.order_id = ?
  `).bind(orderId).all();
  return results.map((row) => ({
    product_name: row.product_name != null ? String(row.product_name) : null,
    category_name: row.category_name != null ? String(row.category_name) : null,
    color_name: row.color_name != null ? String(row.color_name) : null,
    color_hex: row.color_hex != null ? String(row.color_hex) : null,
    size_dimensions: row.size_dimensions != null ? String(row.size_dimensions) : null,
    quantity: Number(row.quantity),
  }));
}

export async function updateAdminMessages(db: D1Database, token: string, order: Order): Promise<void> {
  const database = new Database(db);
  const customer = await database.customers.findById(order.user_id);
  if (!customer) return;
  const items = await getOrderItems(db, order.id);
  const text = formatOrderMessage(order.id, customer, items, {
    payment: order.payment_status,
    invoiceUploaded: Boolean(order.invoice_file_id),
    voiceUploaded: Boolean(order.voice_file_id),
  }, order.delivery_method);
  const keyboard = orderActionKeyboard(
    order.id,
    order.payment_status,
    Boolean(order.invoice_file_id),
    Boolean(order.voice_file_id)
  );
  const messages = await database.orderTelegram.listMessages(order.id);
  await Promise.all(messages.map(({ telegram_chat_id, telegram_message_id }) =>
    editMessageText(token, Number(telegram_chat_id), telegram_message_id, text, keyboard)
  ));
}

async function deliverReceiptToCustomer(
  orderBotToken: string,
  miniAppBotToken: string,
  order: Order,
  type: 'photo' | 'voice',
  fileId: string
): Promise<boolean> {
  const caption = type === 'photo'
    ? `🧾 فاکتور سفارش #${order.id}`
    : `🎙️ توضیحات سفارش #${order.id}`;

  const fileResponse = await getFile(orderBotToken, fileId);
  const fileData = await fileResponse.json<{ ok?: boolean; result?: { file_path?: string } }>();
  if (!fileData.ok || !fileData.result?.file_path) return false;

  const mediaResponse = await fetch(getFileDownloadUrl(orderBotToken, fileData.result.file_path));
  if (!mediaResponse.ok) return false;
  const file = await mediaResponse.blob();
  const form = new FormData();
  form.set('chat_id', order.user_id);
  form.set('caption', caption);
  form.set(type === 'photo' ? 'photo' : 'voice', file, fileData.result.file_path.split('/').at(-1) || `order-${order.id}`);
  const sendResponse = await fetch(`${BALE_API}/bot${miniAppBotToken}/${type === 'photo' ? 'sendPhoto' : 'sendVoice'}`, {
    method: 'POST',
    body: form,
  });
  const sendResult = await sendResponse.json<{ ok?: boolean }>();
  if (!sendResult.ok) return false;

  if (type === 'photo') {
    await sendMessage(
      miniAppBotToken,
      Number(order.user_id),
      'لطفاً تصویر فیش واریزی را برای @abdollahisz ارسال کنید.'
    );
  }
  return true;
}

async function handleAdminUpload(
  db: D1Database,
  orderBotToken: string,
  miniAppBotToken: string,
  update: BaleUpdate,
  adminIds: Set<string>
): Promise<boolean> {
  const message = update.message;
  if (!message || !adminIds.has(String(message.from.id))) return false;
  const database = new Database(db);
  const waiting = await database.orderTelegram.getWaiting(String(message.from.id));
  if (!waiting) return false;

  const fileId = waiting.waiting_action === 'invoice_photo'
    ? message.photo?.at(-1)?.file_id
    : message.voice?.file_id;
  if (!fileId) {
    await sendMessage(orderBotToken, message.chat.id, waiting.waiting_action === 'invoice_photo'
      ? 'لطفاً فقط تصویر فاکتور را ارسال کنید.'
      : 'لطفاً فقط پیام صوتی را ارسال کنید.');
    return true;
  }

  const type = waiting.waiting_action === 'invoice_photo' ? 'photo' : 'voice';
  const order = await database.orders.saveReceipt(waiting.order_id, type, fileId);
  await database.orderTelegram.clear(String(message.from.id));
  if (!order) {
    await sendMessage(orderBotToken, message.chat.id, 'سفارش یافت نشد.');
    return true;
  }

  const delivered = await deliverReceiptToCustomer(orderBotToken, miniAppBotToken, order, type, fileId);
  await updateAdminMessages(db, orderBotToken, order);
  const response = await sendMessage(
    orderBotToken,
    message.chat.id,
    delivered
      ? '✅ فایل دریافت شد و با ربات مینی‌اپ برای خریدار ارسال شد.'
      : '⚠️ فایل ذخیره شد، اما ارسال ناموفق بود. خریدار باید ابتدا ربات مینی‌اپ را Start کند.'
  );
  const result = await response.json<{ ok?: boolean; result?: { message_id?: number } }>();
  if (result.ok && result.result?.message_id !== undefined) {
    const database = new Database(db);
    await database.telegramDeletionQueue.add(
      String(message.chat.id),
      result.result.message_id,
      order.id,
      type === 'photo' ? 'invoice' : 'voice'
    );
  }
  return true;
}

async function handleOrderCallback(
  db: D1Database,
  token: string,
  miniAppBotToken: string,
  baseUrl: string,
  callbackQuery: NonNullable<BaleUpdate['callback_query']>,
  adminIds: Set<string>
): Promise<void> {
  if (!adminIds.has(String(callbackQuery.from.id))) {
    await answerCallbackQuery(token, callbackQuery.id, 'دسترسی غیرمجاز است.');
    return;
  }
  const [namespace, action, rawOrderId] = (callbackQuery.data ?? '').split(':');
  const orderId = Number(rawOrderId);
  if (namespace !== 'order' || !Number.isInteger(orderId) || orderId <= 0) {
    await answerCallbackQuery(token, callbackQuery.id, 'اطلاعات سفارش نامعتبر است.');
    return;
  }

  const database = new Database(db);
  const order = await database.orders.getById(orderId);
  if (!order) {
    await answerCallbackQuery(token, callbackQuery.id, 'سفارش یافت نشد.');
    return;
  }

  if (action === 'invoice' || action === 'voice') {
    await database.orderTelegram.setWaiting(
      String(callbackQuery.from.id),
      orderId,
      action === 'invoice' ? 'invoice_photo' : 'voice'
    );
    const chatId = callbackQuery.message?.chat.id;
    if (chatId) {
      await sendMessage(token, chatId, action === 'invoice'
        ? `لطفاً تصویر فاکتور سفارش #${orderId} را ارسال کنید.`
        : `لطفاً توضیح صوتی سفارش #${orderId} را ارسال کنید.`);
    }
    await answerCallbackQuery(token, callbackQuery.id, 'منتظر دریافت فایل هستم.');
    return;
  }

  await answerCallbackQuery(token, callbackQuery.id, 'عملیات نامعتبر است.');
}

async function handleBaleUpdate(
  db: D1Database,
  token: string,
  baseUrl: string,
  update: BaleUpdate,
  allowOrderActions: boolean,
  miniAppBotToken: string,
  adminIds: Set<string>
): Promise<void> {
  if (update.callback_query) {
    if (allowOrderActions) await handleOrderCallback(db, token, miniAppBotToken, baseUrl, update.callback_query, adminIds);
    else await answerCallbackQuery(token, update.callback_query.id, 'این دکمه برای ربات سفارش است.');
    return;
  }
  if (allowOrderActions && await handleAdminUpload(db, token, miniAppBotToken, update, adminIds)) return;
  if (!update.message?.text) return;
  const { id: chatId } = update.message.chat;
  const { text } = update.message;
  const { first_name: firstName } = update.message.from;
  if (text === '/start') await handleStart(token, chatId, firstName, baseUrl);
  else if (text === '/help') await handleHelp(token, chatId, baseUrl);
  else await handleUnknown(token, chatId);
}

baleRoutes.post('/webhook', async (c) => {
  if (!c.env.BALE_BOT_TOKEN) return c.json({ error: 'BALE_BOT_TOKEN not set' }, 500);
  const buttonUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  const adminIds = parseAdminIds(c.env);
  await handleBaleUpdate(c.env.DB, c.env.BALE_BOT_TOKEN, buttonUrl, await c.req.json(), false, c.env.BALE_BOT_TOKEN, adminIds);
  return c.json({ ok: true });
});

baleRoutes.post('/order-webhook', async (c) => {
  if (!c.env.BALE_ORDER_NOTIFY_BOT_TOKEN) return c.json({ error: 'BALE_ORDER_NOTIFY_BOT_TOKEN not set' }, 500);
  if (!c.env.BALE_BOT_TOKEN) return c.json({ error: 'BALE_BOT_TOKEN not set' }, 500);
  const buttonUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  const adminIds = parseAdminIds(c.env);
  await handleBaleUpdate(c.env.DB, c.env.BALE_ORDER_NOTIFY_BOT_TOKEN, buttonUrl, await c.req.json(), true, c.env.BALE_BOT_TOKEN, adminIds);
  return c.json({ ok: true });
});

baleRoutes.get('/setup', async (c) => {
  const configs = [
    { token: c.env.BALE_BOT_TOKEN, url: `${c.env.BASE_URL}/webhook/bale/webhook` },
    { token: c.env.BALE_ORDER_NOTIFY_BOT_TOKEN, url: `${c.env.BASE_URL}/webhook/bale/order-webhook` },
  ].filter((config): config is { token: string; url: string } => Boolean(config.token));
  const results = await Promise.all(configs.map(async ({ token, url }) => {
    const response = await setWebhook(token, url);
    return { url, result: await response.json() };
  }));
  let menuButtonResult: unknown = null;
  if (c.env.BALE_BOT_TOKEN) {
    const response = await setChatMenuButton(
      c.env.BALE_BOT_TOKEN,
      c.env.MINI_APP_URL || c.env.BASE_URL
    );
    menuButtonResult = await response.json();
  }
  return c.json({ results, menuButtonResult });
});
