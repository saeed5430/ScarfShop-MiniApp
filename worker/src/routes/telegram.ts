import { Hono } from 'hono';
import type { TelegramUpdate } from '../types';
import { handleStart, handleHelp, handleUnknown } from '../bot';

type Bindings = {
  TELEGRAM_BOT_TOKEN: string;
  BASE_URL: string;
};

export const telegramRoutes = new Hono<{ Bindings: Bindings }>();

telegramRoutes.post('/webhook', async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = c.env.BASE_URL;

  if (!token) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, 500);
  }

  const update: TelegramUpdate = await c.req.json();

  if (update.message?.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text;
    const firstName = update.message.from.first_name;

    if (text === '/start') {
      await handleStart(token, chatId, firstName, baseUrl);
    } else if (text === '/help') {
      await handleHelp(token, chatId, baseUrl);
    } else {
      await handleUnknown(token, chatId);
    }
  }

  return c.json({ ok: true });
});

telegramRoutes.get('/setup', async (c) => {
  const token = c.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = c.env.BASE_URL;

  if (!token) {
    return c.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, 500);
  }

  const webhookUrl = `${baseUrl}/webhook/telegram/webhook`;
  const response = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    }
  );

  const result = await response.json();
  return c.json({ webhookUrl, result });
});
