import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  BALE_BOT_TOKEN: string;
  BALE_ORDER_NOTIFY_BOT_TOKEN: string;
};

export const cronRoutes = new Hono<{ Bindings: Bindings }>();

async function deleteBaleMessage(botToken: string, chatId: string, messageId: number): Promise<boolean> {
  try {
    const url = `https://tapi.bale.ai/bot${botToken}/deleteMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Failed to delete Bale message:', error);
    return false;
  }
}

cronRoutes.get('/cleanup-bale-messages', async (c) => {
  const db = c.env.DB;
  const botToken = c.env.BALE_BOT_TOKEN;
  const orderBotToken = c.env.BALE_ORDER_NOTIFY_BOT_TOKEN;

  if (!db || !botToken || !orderBotToken) {
    return c.json({ error: 'Missing configuration' }, 500);
  }

  const { Database } = await import('../db');
  const database = new Database(db);

  const pendingMessages = await database.telegramDeletionQueue.getPending(50);

  let deleted = 0;
  let failed = 0;

  for (const msg of pendingMessages) {
    const token = msg.message_type === 'order_notification' ? botToken : orderBotToken;
    const success = await deleteBaleMessage(token, msg.telegram_chat_id, msg.telegram_message_id);

    if (success) {
      await database.telegramDeletionQueue.markDeleted(msg.id);
      deleted++;
    } else {
      failed++;
    }
  }

  const cleaned = await database.telegramDeletionQueue.cleanupOld(30);

  return c.json({ deleted, failed, cleaned });
});

export default cronRoutes;