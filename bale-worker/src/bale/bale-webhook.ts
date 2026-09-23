import { Hono } from 'hono';
import { sendBaleMessage, answerBaleCallbackQuery, buildBaleMiniAppButton, type BaleUpdate } from './bale-api';

type Bindings = {
  BALE_DB: D1Database;
  BALE_BOT_TOKEN: string;
  BALE_ORDER_BOT_TOKEN: string;
  BALE_ADMIN_IDS: string;
  BASE_URL: string;
  MINI_APP_URL: string;
};

function startText(firstName: string): string {
  return [`سلام ${firstName}!`, '', 'به فروشگاه آرمانا خوش آمدید.', '', 'از دکمه زیر برای باز کردن اپ استفاده کن:'].join('\n');
}

function parseOrderCallback(data: string): { action: 'invoice' | 'voice'; orderId: number } | null {
  const match = /^order:(invoice|voice):(\d+)$/.exec(data);
  if (!match) return null;
  return { action: match[1] as 'invoice' | 'voice', orderId: Number(match[2]) };
}

async function handleCallback(token: string, adminIds: string[], db: D1Database, update: BaleUpdate): Promise<void> {
  const callback = update.callback_query;
  if (!callback) return;
  const parsed = parseOrderCallback(callback.data ?? '');
  if (!parsed) {
    await answerBaleCallbackQuery(token, callback.id, 'دستور نامعتبر');
    return;
  }
  if (!adminIds.includes(String(callback.from.id))) {
    await answerBaleCallbackQuery(token, callback.id, 'دسترسی ندارید');
    return;
  }
  await db.prepare(
    'INSERT INTO bale_order_waiting (admin_id, order_id, waiting_action, created_at) VALUES (?, ?, ?, unixepoch()) ON CONFLICT(admin_id) DO UPDATE SET order_id = excluded.order_id, waiting_action = excluded.waiting_action, created_at = unixepoch()'
  ).bind(String(callback.from.id), parsed.orderId, parsed.action === 'invoice' ? 'invoice_photo' : 'voice').run();
  await answerBaleCallbackQuery(token, callback.id, 'در انتظار فایل');
  const prompt = parsed.action === 'invoice'
    ? `📷 لطفاً تصویر فاکتور برای سفارش #${parsed.orderId} را ارسال کنید`
    : `🎤 لطفاً فایل صوتی برای سفارش #${parsed.orderId} را ارسال کنید`;
  await sendBaleMessage(token, callback.from.id, prompt);
}

async function handleMedia(token: string, db: D1Database, update: BaleUpdate): Promise<boolean> {
  const message = update.message;
  if (!message || message.text) return false;
  const photos = message.photo;
  const voice = message.voice;
  if ((!photos || photos.length === 0) && !voice) return false;
  const adminId = String(message.from?.id ?? message.chat.id);
  const waiting = await db.prepare('SELECT order_id, waiting_action FROM bale_order_waiting WHERE admin_id = ?').bind(adminId).first<{ order_id: number; waiting_action: string }>();
  if (!waiting) {
    await sendBaleMessage(token, message.chat.id, 'ابتدا روی دکمه «ارسال فاکتور» یا «ارسال صدا» در پیام سفارش بزنید.');
    return true;
  }
  if (waiting.waiting_action === 'invoice_photo' && photos && photos.length > 0) {
    const fileId = photos[photos.length - 1].file_id;
    await db.prepare('UPDATE orders SET invoice_file_id = ?, invoice_uploaded_at = unixepoch(), updated_at = unixepoch() WHERE id = ?').bind(fileId, waiting.order_id).run();
    await db.prepare('DELETE FROM bale_order_waiting WHERE admin_id = ?').bind(adminId).run();
    await sendBaleMessage(token, message.chat.id, `✅ فاکتور سفارش #${waiting.order_id} ثبت شد.`);
    return true;
  }
  if (waiting.waiting_action === 'voice' && voice) {
    await db.prepare('UPDATE orders SET voice_file_id = ?, voice_uploaded_at = unixepoch(), updated_at = unixepoch() WHERE id = ?').bind(voice.file_id, waiting.order_id).run();
    await db.prepare('DELETE FROM bale_order_waiting WHERE admin_id = ?').bind(adminId).run();
    await sendBaleMessage(token, message.chat.id, `✅ فایل صوتی سفارش #${waiting.order_id} ثبت شد.`);
    return true;
  }
  await sendBaleMessage(token, message.chat.id, 'نوع فایل با درخواست مطابقت ندارد. لطفاً دوباره تلاش کنید.');
  return true;
}

async function handleUpdate(token: string, adminIds: string[], miniAppUrl: string, db: D1Database | undefined, update: BaleUpdate): Promise<void> {
  if (update.callback_query) {
    if (!db) return;
    await handleCallback(token, adminIds, db, update);
    return;
  }
  const message = update.message;
  if (!message) return;
  if (db && await handleMedia(token, db, update)) return;
  if (!message.text) return;
  const chatId = message.chat.id;
  const firstName = message.from?.first_name ?? 'دوست عزیز';
  const text = message.text.trim();
  if (text === '/start' || text === '/help') {
    await sendBaleMessage(token, chatId, startText(firstName), buildBaleMiniAppButton(miniAppUrl));
  } else {
    await sendBaleMessage(token, chatId, 'دستور نامعتبر. از /start یا /help استفاده کن.');
  }
}

function adminIds(env: Bindings): string[] {
  return (env.BALE_ADMIN_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
}

export const baleWebhookRoutes = new Hono<{ Bindings: Bindings }>();

baleWebhookRoutes.post('/webhook', async (c) => {
  if (!c.env.BALE_BOT_TOKEN) return c.json({ error: 'BALE_BOT_TOKEN not set' }, 500);
  const miniAppUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  await handleUpdate(c.env.BALE_BOT_TOKEN, adminIds(c.env), miniAppUrl, c.env.BALE_DB, await c.req.json<BaleUpdate>());
  return c.json({ ok: true });
});

baleWebhookRoutes.post('/order-webhook', async (c) => {
  if (!c.env.BALE_ORDER_BOT_TOKEN) return c.json({ error: 'BALE_ORDER_BOT_TOKEN not set' }, 500);
  const miniAppUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  await handleUpdate(c.env.BALE_ORDER_BOT_TOKEN, adminIds(c.env), miniAppUrl, c.env.BALE_DB, await c.req.json<BaleUpdate>());
  return c.json({ ok: true });
});

baleWebhookRoutes.get('/setup', async (c) => {
  const configs = [
    { token: c.env.BALE_BOT_TOKEN, url: `${c.env.BASE_URL}/webhook/bale/webhook` },
    { token: c.env.BALE_ORDER_BOT_TOKEN, url: `${c.env.BASE_URL}/webhook/bale/order-webhook` },
  ].filter((x): x is { token: string; url: string } => Boolean(x.token));
  const results = await Promise.all(
    configs.map(async ({ token, url }) => {
      const res = await fetch(`https://tapi.bale.ai/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      return { url, result: await res.json() };
    })
  );
  return c.json({ results });
});
