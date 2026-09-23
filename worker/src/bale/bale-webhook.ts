import { Hono } from 'hono';
import { sendBaleMessage, buildBaleMiniAppButton, type BaleUpdate } from './bale-api';

type Bindings = {
  BALE_DB: D1Database;
  BALE_BOT_TOKEN: string;
  BALE_ORDER_BOT_TOKEN: string;
  BASE_URL: string;
  MINI_APP_URL?: string;
};

function startText(firstName: string): string {
  return [`سلام ${firstName}!`, '', 'به فروشگاه آرمانا خوش آمدید.', '', 'از دکمه زیر برای باز کردن اپ استفاده کن:'].join('\n');
}

async function handleUpdate(token: string, miniAppUrl: string, update: BaleUpdate): Promise<void> {
  if (update.callback_query) return;
  const message = update.message;
  if (!message?.text) return;
  const chatId = message.chat.id;
  const firstName = message.from?.first_name ?? 'دوست عزیز';
  const text = message.text.trim();
  if (text === '/start' || text === '/help') {
    await sendBaleMessage(token, chatId, startText(firstName), buildBaleMiniAppButton(miniAppUrl));
  } else {
    await sendBaleMessage(token, chatId, 'دستور نامعتبر. از /start یا /help استفاده کن.');
  }
}

export const baleWebhookRoutes = new Hono<{ Bindings: Bindings }>();

baleWebhookRoutes.post('/webhook', async (c) => {
  if (!c.env.BALE_BOT_TOKEN) return c.json({ error: 'BALE_BOT_TOKEN not set' }, 500);
  const miniAppUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  await handleUpdate(c.env.BALE_BOT_TOKEN, miniAppUrl, await c.req.json<BaleUpdate>());
  return c.json({ ok: true });
});

baleWebhookRoutes.post('/order-webhook', async (c) => {
  if (!c.env.BALE_ORDER_BOT_TOKEN) return c.json({ error: 'BALE_ORDER_BOT_TOKEN not set' }, 500);
  const miniAppUrl = c.env.MINI_APP_URL || c.env.BASE_URL;
  await handleUpdate(c.env.BALE_ORDER_BOT_TOKEN, miniAppUrl, await c.req.json<BaleUpdate>());
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
